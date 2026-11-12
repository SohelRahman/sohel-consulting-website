const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});
const id = () => crypto.randomUUID();
const clean = (v, max = 500) => String(v ?? "").trim().slice(0, max);
const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const fromB64url = value => Uint8Array.from(atob(value.replace(/-/g,"+").replace(/_/g,"/")), c => c.charCodeAt(0));
async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), {name:"HMAC",hash:"SHA-256"}, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}
async function makeSession(email, secret) {
  const payload = b64url(new TextEncoder().encode(JSON.stringify({email, exp:Date.now()+8*60*60*1000})));
  return payload + "." + await sign(payload, secret);
}
async function readSession(request, secret) {
  const cookie = request.headers.get("cookie") || "";
  const token = cookie.split(";").map(x=>x.trim()).find(x=>x.startsWith("sr_admin="))?.slice(9);
  if (!token || !secret) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || await sign(payload,secret) !== signature) return null;
  try {
    const data = JSON.parse(new TextDecoder().decode(fromB64url(payload)));
    return data.exp > Date.now() ? data : null;
  } catch { return null; }
}
function sameOrigin(request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}
async function audit(env, email, action, entityType, entityId, details = "") {
  await env.DB.prepare("INSERT INTO audit_logs (id,admin_email,action,entity_type,entity_id,details) VALUES (?,?,?,?,?,?)")
    .bind(id(),email,action,entityType,entityId,details).run();
}
async function handleApi(request, env) {
  const url = new URL(request.url), path = url.pathname, method = request.method;
  if (!env.DB) return json({error:"Database is not configured."},503);

  if (path === "/api/health" && method === "GET") return json({ok:true, database:"connected", payments:"not_configured"});
  if (path === "/api/courses" && method === "GET") {
    const {results=[]} = await env.DB.prepare("SELECT id,slug,title_en,title_bn,summary_en,summary_bn,level,delivery_modes,languages,pricing_type,fixed_fee_minor,currency FROM courses WHERE active=1 ORDER BY title_en").all();
    return json({courses:results});
  }

  if (path === "/api/registrations" && method === "POST") {
    if (!sameOrigin(request)) return json({error:"Invalid request origin."},403);
    const data = await request.json().catch(()=>null);
    if (!data || data.website) return json({error:"Invalid submission."},400);
    const fullName=clean(data.fullName,120), email=clean(data.email,180).toLowerCase();
    const phone=clean(data.phone,40), organisation=clean(data.organisation,160);
    const courseId=clean(data.courseId,80), pricingType=data.pricingType==="custom"?"custom":"fixed";
    const language=["en","bn"].includes(data.language) ? data.language : "en";
    const delivery=["online","classroom","either"].includes(data.delivery) ? data.delivery : "online";
    const message=clean(data.message,2000);
    if (!fullName || !emailOk(email) || !courseId) return json({error:"Please provide your name, valid email and course."},400);
    const course=await env.DB.prepare("SELECT id,pricing_type,fixed_fee_minor,currency FROM courses WHERE id=? AND active=1").bind(courseId).first();
    if (!course) return json({error:"Please select an available course."},400);
    if (pricingType==="fixed" && course.pricing_type==="custom") return json({error:"This course requires a quotation."},400);
    const learnerId=id(), registrationId=id();
    const reference="SR-"+crypto.randomUUID().replace(/-/g,"").slice(0,10).toUpperCase();
    await env.DB.batch([
      env.DB.prepare("INSERT INTO learners (id,full_name,email,phone,organisation) VALUES (?,?,?,?,?)").bind(learnerId,fullName,email,phone,organisation),
      env.DB.prepare("INSERT INTO registrations (id,reference_code,learner_id,course_id,batch_preference,language_preference,delivery_preference,pricing_type,quoted_fee_minor,currency,learner_message) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
        .bind(registrationId,reference,learnerId,courseId,clean(data.batch,120),language,delivery,pricingType,pricingType==="fixed"?course.fixed_fee_minor:null,course.currency,message)
    ]);
    return json({ok:true,reference,status:"pending_review",message:"Your request has been received. The administrator will review it and contact you."},201);
  }

  if (path === "/api/inquiries" && method === "POST") {
    if (!sameOrigin(request)) return json({error:"Invalid request origin."},403);
    const data=await request.json().catch(()=>null);
    if (!data || data.website) return json({error:"Invalid submission."},400);
    const name=clean(data.fullName,120), email=clean(data.email,180).toLowerCase(), message=clean(data.message,2000);
    if (!name || !emailOk(email) || !message) return json({error:"Name, valid email and message are required."},400);
    const inquiryId=id();
    await env.DB.prepare("INSERT INTO inquiries (id,full_name,email,phone,organisation,inquiry_type,topic,learner_level,preferred_language,delivery_preference,message) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
      .bind(inquiryId,name,email,clean(data.phone,40),clean(data.organisation,160),clean(data.inquiryType,60),clean(data.topic,120),clean(data.level,40),["en","bn"].includes(data.language)?data.language:"en",clean(data.delivery,40),message).run();
    return json({ok:true,reference:inquiryId.slice(0,8).toUpperCase(),message:"Your inquiry has been received."},201);
  }

  if (path === "/api/admin/login" && method === "POST") {
    if (!sameOrigin(request)) return json({error:"Invalid request origin."},403);
    if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD || !env.SESSION_SECRET) return json({error:"Administrator credentials are not configured."},503);
    const data=await request.json().catch(()=>null);
    const email=clean(data?.email,180).toLowerCase(), password=String(data?.password||"");
    if (email !== env.ADMIN_EMAIL.toLowerCase() || password !== env.ADMIN_PASSWORD) return json({error:"Invalid email or password."},401);
    const token=await makeSession(email,env.SESSION_SECRET);
    return new Response(JSON.stringify({ok:true}),{headers:{
      "content-type":"application/json",
      "cache-control":"no-store",
      "set-cookie":`sr_admin=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`
    }});
  }
  if (path === "/api/admin/logout" && method === "POST") return new Response(JSON.stringify({ok:true}),{headers:{"content-type":"application/json","set-cookie":"sr_admin=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0"}});
  if (path.startsWith("/api/admin/")) {
    const session=await readSession(request,env.SESSION_SECRET);
    if (!session) return json({error:"Authentication required."},401);
    if (path === "/api/admin/courses" && method === "GET") {
      const {results=[]}=await env.DB.prepare("SELECT * FROM courses ORDER BY title_en").all();
      return json({courses:results});
    }
    if (path === "/api/admin/courses" && method === "POST") {
      if (!sameOrigin(request)) return json({error:"Invalid request origin."},403);
      const data=await request.json().catch(()=>null);
      const title=clean(data?.title,140), slug=clean(data?.slug,100).toLowerCase().replace(/[^a-z0-9-]/g,"-");
      if (!title || !slug) return json({error:"Course title and URL slug are required."},400);
      const courseId=id();
      try {
        await env.DB.prepare("INSERT INTO courses (id,slug,title_en,title_bn,summary_en,summary_bn,pricing_type,currency,active) VALUES (?,?,?,?,?,?,?,?,1)")
          .bind(courseId,slug,title,clean(data.titleBn,140),clean(data.summary,1000),clean(data.summaryBn,1000),["fixed","custom","both"].includes(data.pricingType)?data.pricingType:"both","BDT").run();
      } catch { return json({error:"Could not create course. Check whether the URL slug is already in use."},409); }
      await audit(env,session.email,"course_created","course",courseId,slug);
      return json({ok:true,id:courseId},201);
    }
    const courseMatch=path.match(/^\\/api\\/admin\\/courses\\/([a-f0-9-]+)\\/status$/);
    if (courseMatch && method === "PATCH") {
      if (!sameOrigin(request)) return json({error:"Invalid request origin."},403);
      const data=await request.json().catch(()=>null);
      if (![0,1].includes(data?.active)) return json({error:"Invalid course status."},400);
      const result=await env.DB.prepare("UPDATE courses SET active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(data.active,courseMatch[1]).run();
      if (!result.meta.changes) return json({error:"Course not found."},404);
      await audit(env,session.email,"course_status_changed","course",courseMatch[1],String(data.active));
      return json({ok:true});
    }
    if (path === "/api/admin/summary" && method === "GET") {
      const queries=await Promise.all([
        env.DB.prepare("SELECT COUNT(*) AS n FROM registrations").first(),
        env.DB.prepare("SELECT COUNT(*) AS n FROM registrations WHERE registration_status='pending_review'").first(),
        env.DB.prepare("SELECT COUNT(*) AS n FROM registrations WHERE enrollment_status='confirmed'").first(),
        env.DB.prepare("SELECT COUNT(*) AS n FROM inquiries WHERE status IN ('new','in_progress')").first()
      ]);
      return json({registrations:queries[0].n,pending:queries[1].n,confirmed:queries[2].n,openInquiries:queries[3].n});
    }
    if (path === "/api/admin/registrations" && method === "GET") {
      const {results=[]}=await env.DB.prepare(`SELECT r.id,r.reference_code,r.registration_status,r.payment_status,r.enrollment_status,r.pricing_type,r.quoted_fee_minor,r.currency,r.created_at,l.full_name,l.email,l.phone,l.organisation,c.title_en AS course_title FROM registrations r JOIN learners l ON l.id=r.learner_id JOIN courses c ON c.id=r.course_id ORDER BY r.created_at DESC LIMIT 200`).all();
      return json({registrations:results});
    }
    if (path === "/api/admin/inquiries" && method === "GET") {
      const {results=[]}=await env.DB.prepare("SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 200").all();
      return json({inquiries:results});
    }
    const enrollmentMatch=path.match(/^\\/api\\/admin\\/registrations\\/([a-f0-9-]+)\\/enrollment$/);
    if (enrollmentMatch && method === "PATCH") {
      if (!sameOrigin(request)) return json({error:"Invalid request origin."},403);
      const data=await request.json().catch(()=>null);
      if (!["awaiting_confirmation","confirmed","cancelled"].includes(data?.enrollmentStatus)) return json({error:"Invalid enrollment status."},400);
      const result=await env.DB.prepare("UPDATE registrations SET enrollment_status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?")
        .bind(data.enrollmentStatus,enrollmentMatch[1]).run();
      if (!result.meta.changes) return json({error:"Registration not found."},404);
      await audit(env,session.email,"enrollment_status_changed","registration",enrollmentMatch[1],data.enrollmentStatus);
      return json({ok:true});
    }
    const match=path.match(/^\/api\/admin\/registrations\/([a-f0-9-]+)$/);
    if (match && method === "PATCH") {
      if (!sameOrigin(request)) return json({error:"Invalid request origin."},403);
      const data=await request.json().catch(()=>null);
      const allowed=["pending_review","approved","rejected","cancelled"];
      if (!allowed.includes(data?.registrationStatus)) return json({error:"Invalid registration status."},400);
      const result=await env.DB.prepare("UPDATE registrations SET registration_status=?,admin_note=?,updated_at=CURRENT_TIMESTAMP WHERE id=?")
        .bind(data.registrationStatus,clean(data.note,1000),match[1]).run();
      if (!result.meta.changes) return json({error:"Registration not found."},404);
      await audit(env,session.email,"registration_status_changed","registration",match[1],data.registrationStatus);
      return json({ok:true});
    }
  }
  return json({error:"Not found."},404);
}
export default {
  async fetch(request, env) {
    const url=new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      try { return await handleApi(request,env); }
      catch (error) { console.error("API error",error); return json({error:"The request could not be completed."},500); }
    }
    if (url.pathname.startsWith("/src/") || url.pathname.startsWith("/migrations/") || url.pathname === "/wrangler.toml") return new Response("Not found",{status:404});
    if (url.pathname === "/admin") return Response.redirect(new URL("/admin.html",url),302);
    return env.ASSETS.fetch(request);
  }
};
