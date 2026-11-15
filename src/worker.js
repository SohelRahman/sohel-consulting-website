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
async function verifySignature(value, signature, secret) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), {name:"HMAC",hash:"SHA-256"}, false, ["verify"]);
  try { return await crypto.subtle.verify("HMAC", key, fromB64url(signature), new TextEncoder().encode(value)); }
  catch { return false; }
}
async function rateLimit(env, request, scope, maxRequests, windowMs) {
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const identity = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(scope + ":" + ip));
  const key = scope + ":" + Array.from(new Uint8Array(identity), b => b.toString(16).padStart(2,"0")).join("");
  const now = Date.now();
  await env.DB.prepare("DELETE FROM rate_limits WHERE expires_at < ?").bind(now).run();
  const row = await env.DB.prepare(`INSERT INTO rate_limits (rate_key,window_started_at,request_count,expires_at) VALUES (?,?,1,?)
    ON CONFLICT(rate_key) DO UPDATE SET
      request_count=CASE WHEN rate_limits.window_started_at + ? <= ? THEN 1 ELSE rate_limits.request_count + 1 END,
      window_started_at=CASE WHEN rate_limits.window_started_at + ? <= ? THEN ? ELSE rate_limits.window_started_at END,
      expires_at=?
    RETURNING request_count`)
    .bind(key,now,now+windowMs,windowMs,now,windowMs,now,now,now+windowMs).first();
  return (row?.request_count || 0) <= maxRequests;
}
async function makeSession(email, secret) {
  const payload = b64url(new TextEncoder().encode(JSON.stringify({email, exp:Date.now()+8*60*60*1000})));
  return payload + "." + await sign(payload, secret);
}
async function readSession(request, secret) {
  const cookie = request.headers.get("cookie") || "";
  const token = cookie.split(";").map(x=>x.trim()).find(x=>x.startsWith("sr_admin="))?.slice(9);
  if (!token || !secret || token.length > 2048) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra || !(await verifySignature(payload,signature,secret))) return null;
  try {
    const data = JSON.parse(new TextDecoder().decode(fromB64url(payload)));
    return data.exp > Date.now() ? data : null;
  } catch { return null; }
}
function sameOrigin(request) {
  const origin = request.headers.get("origin");
  return Boolean(origin) && origin === new URL(request.url).origin;
}
async function audit(env, email, action, entityType, entityId, details = "") {
  await env.DB.prepare("INSERT INTO audit_logs (id,admin_email,action,entity_type,entity_id,details) VALUES (?,?,?,?,?,?)")
    .bind(id(),email,action,entityType,entityId,details).run();
}
async function handleApi(request, env) {
  const url = new URL(request.url), path = url.pathname, method = request.method;
  if (!env.DB) return json({error:"Database is not configured."},503);


  const pagePublicMatch=path.match(/^\\/api\\/pages\\/([a-z0-9-]+)$/);
  if (pagePublicMatch && method === "GET") {
    const page=await env.DB.prepare("SELECT slug,title,language,published_json,seo_title,seo_description FROM pages WHERE slug=? AND status='published' AND published_json IS NOT NULL").bind(pagePublicMatch[1]).first();
    if (!page) return json({error:"Page not found."},404);
    return json({page:{slug:page.slug,title:page.title,language:page.language,seo_title:page.seo_title,seo_description:page.seo_description,...JSON.parse(page.published_json)}});
  }
  if (path === "/api/health" && method === "GET") return json({ok:true, database:"connected", payments:"not_configured"});
  if (path === "/api/page-styles" && method === "GET") {
    try { const {results=[]}=await env.DB.prepare("SELECT element_key,published_json FROM page_styles WHERE published_json IS NOT NULL").all(); return json({styles:Object.fromEntries(results.map(row=>[row.element_key,JSON.parse(row.published_json)]))}); }
    catch { return json({error:"Page styles are not initialized."},503); }
  }

  if (path === "/api/site-content" && method === "GET") {
    try {
      const {results=[]}=await env.DB.prepare("SELECT content_key,content_value FROM site_content WHERE published=1").all();
      return json({content:Object.fromEntries(results.map(row=>[row.content_key,row.content_value]))});
    } catch { return json({error:"Website content is not initialized."},503); }
  }

  if (path === "/api/courses" && method === "GET") {
    const {results=[]} = await env.DB.prepare("SELECT id,slug,title_en,title_bn,summary_en,summary_bn,level,delivery_modes,languages,pricing_type,fixed_fee_minor,currency FROM courses WHERE active=1 ORDER BY title_en").all();
    return json({courses:results});
  }

  if (path === "/api/registrations" && method === "POST") {
    if (!sameOrigin(request)) return json({error:"Invalid request origin."},403);
    if (!(await rateLimit(env,request,"registration",5,15*60*1000))) return json({error:"Too many registration attempts. Please try again later."},429);
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
    if (pricingType==="fixed" && (course.pricing_type==="custom" || !course.fixed_fee_minor)) return json({error:"A fixed fee is not configured for this course. Please request a customized quotation."},400);
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
    if (!(await rateLimit(env,request,"inquiry",5,15*60*1000))) return json({error:"Too many inquiry attempts. Please try again later."},429);
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
    if (!(await rateLimit(env,request,"admin-login",5,15*60*1000))) return json({error:"Too many login attempts. Please try again in 15 minutes."},429);
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
  if (path === "/api/admin/logout" && method === "POST") {
    if (!sameOrigin(request)) return json({error:"Invalid request origin."},403);
    return new Response(JSON.stringify({ok:true}),{headers:{"content-type":"application/json","set-cookie":"sr_admin=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0"}});
  }
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
      const fixedFee=data?.fixedFee===""||data?.fixedFee==null?null:Math.round(Number(data.fixedFee)*100);
      if (fixedFee!==null && (!Number.isFinite(fixedFee) || fixedFee<1)) return json({error:"Enter a valid positive fixed fee."},400);
      if (data?.pricingType==="fixed" && fixedFee===null) return json({error:"A fixed-fee course needs a fee amount."},400);
      if (!title || !slug) return json({error:"Course title and URL slug are required."},400);
      const courseId=id();
      try {
        await env.DB.prepare("INSERT INTO courses (id,slug,title_en,title_bn,summary_en,summary_bn,pricing_type,fixed_fee_minor,currency,active) VALUES (?,?,?,?,?,?,?,?,?,1)")
          .bind(courseId,slug,title,clean(data.titleBn,140),clean(data.summary,1000),clean(data.summaryBn,1000),["fixed","custom","both"].includes(data.pricingType)?data.pricingType:"both",fixedFee,"BDT").run();
      } catch { return json({error:"Could not create course. Check whether the URL slug is already in use."},409); }
      await audit(env,session.email,"course_created","course",courseId,slug);
      return json({ok:true,id:courseId},201);
    }
    const courseEditMatch=path.match(/^\/api\/admin\/courses\/([a-f0-9-]+)$/);
    if (courseEditMatch && method === "PATCH") {
      if (!sameOrigin(request)) return json({error:"Invalid request origin."},403);
      const data=await request.json().catch(()=>null);
      const title=clean(data?.title,140);
      const slug=clean(data?.slug,100).toLowerCase().replace(/[^a-z0-9-]+/g,"-").replace(/^-+|-+$/g,"");
      const fixedFee=data?.fixedFee===""||data?.fixedFee==null?null:Math.round(Number(data.fixedFee)*100);
      const pricingType=["fixed","custom","both"].includes(data?.pricingType)?data.pricingType:null;
      if (!title || !slug || !pricingType) return json({error:"Course title, valid URL slug and pricing model are required."},400);
      if (fixedFee!==null && (!Number.isFinite(fixedFee)||fixedFee<1)) return json({error:"Enter a valid positive fixed fee."},400);
      if (pricingType==="fixed" && fixedFee===null) return json({error:"A fixed-fee course needs a fee amount."},400);
      try {
        const result=await env.DB.prepare("UPDATE courses SET slug=?,title_en=?,title_bn=?,summary_en=?,summary_bn=?,pricing_type=?,fixed_fee_minor=?,updated_at=CURRENT_TIMESTAMP WHERE id=?")
          .bind(slug,title,clean(data.titleBn,140),clean(data.summary,1000),clean(data.summaryBn,1000),pricingType,fixedFee,courseEditMatch[1]).run();
        if (!result.meta.changes) return json({error:"Course not found."},404);
      } catch { return json({error:"Could not update course. Check whether the URL slug is already in use."},409); }
      await audit(env,session.email,"course_updated","course",courseEditMatch[1],slug);
      return json({ok:true});
    }
    if (courseEditMatch && method === "DELETE") {
      if (!sameOrigin(request)) return json({error:"Invalid request origin."},403);
      const course=await env.DB.prepare("SELECT id FROM courses WHERE id=?").bind(courseEditMatch[1]).first();
      if (!course) return json({error:"Course not found."},404);
      const linked=await env.DB.prepare("SELECT COUNT(*) AS total FROM registrations WHERE course_id=?").bind(courseEditMatch[1]).first();
      if (linked.total>0) return json({error:"This course has registrations and cannot be permanently deleted. Deactivate it instead to preserve registration history."},409);
      await env.DB.prepare("DELETE FROM courses WHERE id=?").bind(courseEditMatch[1]).run();
      await audit(env,session.email,"course_deleted","course",courseEditMatch[1],"");
      return json({ok:true});
    }
    const courseMatch=path.match(/^\/api\/admin\/courses\/([a-f0-9-]+)\/status$/);
    if (courseMatch && method === "PATCH") {
      if (!sameOrigin(request)) return json({error:"Invalid request origin."},403);
      const data=await request.json().catch(()=>null);
      if (![0,1].includes(data?.active)) return json({error:"Invalid course status."},400);
      const result=await env.DB.prepare("UPDATE courses SET active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(data.active,courseMatch[1]).run();
      if (!result.meta.changes) return json({error:"Course not found."},404);
      await audit(env,session.email,"course_status_changed","course",courseMatch[1],String(data.active));
      return json({ok:true});
    }

    if (path === "/api/admin/pages" && method === "GET") {
      const {results=[]}=await env.DB.prepare("SELECT id,slug,title,language,status,seo_title,seo_description,updated_at,published_at,draft_json FROM pages ORDER BY updated_at DESC").all();
      return json({pages:results.map(p=>({...p,draft:JSON.parse(p.draft_json)}))});
    }
    if (path === "/api/admin/pages" && method === "POST") {
      if (!sameOrigin(request)) return json({error:"Invalid request origin."},403);
      const data=await request.json().catch(()=>null);
      const slug=clean(data?.slug,80).toLowerCase().replace(/[^a-z0-9-]/g,"-").replace(/^-+|-+$/g,"");
      const title=clean(data?.title,140), language=["en","bn"].includes(data?.language)?data.language:"en";
      if (!slug || !title || ["admin","api","assets","bn","src","migrations"].includes(slug)) return json({error:"Enter a valid page title and URL slug."},400);
      const pageId=id();
      try { await env.DB.prepare("INSERT INTO pages (id,slug,title,language,draft_json,seo_title,seo_description) VALUES (?,?,?,?,?,?,?)").bind(pageId,slug,title,language,JSON.stringify({sections:[]}),clean(data?.seoTitle,160),clean(data?.seoDescription,300)).run(); }
      catch { return json({error:"That page URL already exists."},409); }
      await audit(env,session.email,"page_created","page",pageId,slug);
      return json({ok:true,id:pageId,slug},201);
    }
    const pageMatch=path.match(/^\\/api\\/admin\\/pages\\/([a-z0-9-]+)$/);
    if (pageMatch && method === "PUT") {
      if (!sameOrigin(request)) return json({error:"Invalid request origin."},403);
      const data=await request.json().catch(()=>null);
      const title=clean(data?.title,140), language=["en","bn"].includes(data?.language)?data.language:"en";
      const sections=Array.isArray(data?.sections)?data.sections.slice(0,30):null;
      if (!title || !sections) return json({error:"Page title and a valid section list are required."},400);
      const allowedTypes=["hero","text","split","cards","cta"];
      const safeText=(v,max=3000)=>clean(v,max);
      const safeSections=[];
      for (const section of sections) {
        if (!section || !allowedTypes.includes(section.type)) return json({error:"Unsupported page section type."},400);
        const layout=section.layout||{};
        const color=v=>typeof v==="string" && /^#[0-9a-fA-F]{6}$/.test(v)?v:"";
        const size=v=>Number.isInteger(Number(v))?Math.max(0,Math.min(160,Number(v))):64;
        const item={id:clean(section.id,60),type:section.type,heading:safeText(section.heading,180),body:safeText(section.body,5000),buttonText:safeText(section.buttonText,80),buttonUrl:safeText(section.buttonUrl,300),layout:{backgroundColor:color(layout.backgroundColor),textColor:color(layout.textColor),textAlign:["left","center","right"].includes(layout.textAlign)?layout.textAlign:"left",maxWidth:["720","900","1100","1280"].includes(String(layout.maxWidth))?String(layout.maxWidth):"1100",paddingTop:size(layout.paddingTop),paddingBottom:size(layout.paddingBottom)}};
        if(section.type==="split"){item.left={heading:safeText(section.left?.heading,180),body:safeText(section.left?.body,3000)};item.right={heading:safeText(section.right?.heading,180),body:safeText(section.right?.body,3000)};}
        if(section.type==="cards")item.items=Array.isArray(section.items)?section.items.slice(0,6).map(x=>({heading:safeText(x?.heading,180),body:safeText(x?.body,1200),buttonText:safeText(x?.buttonText,80),buttonUrl:safeText(x?.buttonUrl,300)})):[];
        safeSections.push(item);
      }
      const draft={sections:safeSections};
      const publish=data?.publish===true;
      const result=await env.DB.prepare("UPDATE pages SET title=?,language=?,seo_title=?,seo_description=?,draft_json=?,published_json=CASE WHEN ?=1 THEN ? ELSE published_json END,status=CASE WHEN ?=1 THEN 'published' ELSE status END,published_at=CASE WHEN ?=1 THEN CURRENT_TIMESTAMP ELSE published_at END,updated_at=CURRENT_TIMESTAMP WHERE slug=?")
        .bind(title,language,clean(data?.seoTitle,160),clean(data?.seoDescription,300),JSON.stringify(draft),publish?1:0,JSON.stringify(draft),publish?1:0,publish?1:0,pageMatch[1]).run();
      if(!result.meta.changes)return json({error:"Page not found."},404);
      await audit(env,session.email,publish?"page_published":"page_draft_saved","page",pageMatch[1],String(safeSections.length)+" sections");
      return json({ok:true,published:publish});
    }
    if (pageMatch && method === "DELETE") {
      if (!sameOrigin(request)) return json({error:"Invalid request origin."},403);
      const result=await env.DB.prepare("DELETE FROM pages WHERE slug=?").bind(pageMatch[1]).run();
      if(!result.meta.changes)return json({error:"Page not found."},404);
      await audit(env,session.email,"page_deleted","page",pageMatch[1],"");
      return json({ok:true});
    }
    if (path === "/api/admin/site-content" && method === "GET") {
      const {results=[]}=await env.DB.prepare("SELECT content_key,content_value,content_type,published,updated_at FROM site_content ORDER BY content_key").all();
      return json({content:results});
    }
    if (path === "/api/admin/site-content" && method === "POST") {
      if (!sameOrigin(request)) return json({error:"Invalid request origin."},403);
      const data=await request.json().catch(()=>null);
      const key=clean(data?.key,100).toLowerCase().replace(/[^a-z0-9._-]/g,"");
      const value=clean(data?.value,5000);
      const type=["text","textarea","url"].includes(data?.type)?data.type:"text";
      if (!key || !value) return json({error:"Content key and value are required."},400);
      await env.DB.prepare("INSERT INTO site_content (content_key,content_value,content_type,published,updated_at) VALUES (?,?,?,1,CURRENT_TIMESTAMP) ON CONFLICT(content_key) DO UPDATE SET content_value=excluded.content_value,content_type=excluded.content_type,updated_at=CURRENT_TIMESTAMP").bind(key,value,type).run();
      await audit(env,session.email,"site_content_saved","site_content",key,type);
      return json({ok:true,key});
    }
    if (path.startsWith("/api/admin/site-content/") && method === "DELETE") {
      if (!sameOrigin(request)) return json({error:"Invalid request origin."},403);
      const key=decodeURIComponent(path.slice("/api/admin/site-content/".length));
      const result=await env.DB.prepare("DELETE FROM site_content WHERE content_key=?").bind(key).run();
      if (!result.meta.changes) return json({error:"Content item not found."},404);
      await audit(env,session.email,"site_content_deleted","site_content",key,"");
      return json({ok:true});
    }
    if (path === "/api/admin/page-styles" && method === "GET") {
      const {results=[]}=await env.DB.prepare("SELECT element_key,draft_json,published_json,updated_at FROM page_styles ORDER BY element_key").all();
      return json({styles:results.map(row=>({...row,draft:row.draft_json?JSON.parse(row.draft_json):null,published:row.published_json?JSON.parse(row.published_json):null}))});
    }
    if (path === "/api/admin/page-styles" && method === "POST") {
      if (!sameOrigin(request)) return json({error:"Invalid request origin."},403);
      const data=await request.json().catch(()=>null), key=clean(data?.key,100);
      if (!["home.hero.eyebrow","home.hero.title","home.hero.lead","home.hero.note"].includes(key)) return json({error:"Select a supported homepage element."},400);
      const input=data?.style||{}, validColor=v=>typeof v==="string" && /^#[0-9a-fA-F]{6}$/.test(v), validSize=v=>typeof v==="string" && /^(1[0-9]|[2-9][0-9]|1[0-2][0-9])px$/.test(v);
      const style={color:validColor(input.color)?input.color:"#eef4fb",backgroundColor:validColor(input.backgroundColor)?input.backgroundColor:"transparent",fontSize:validSize(input.fontSize)?input.fontSize:"16px",mobileFontSize:validSize(input.mobileFontSize)?input.mobileFontSize:"16px",fontWeight:["400","500","600","700","800"].includes(String(input.fontWeight))?String(input.fontWeight):"400",textAlign:["left","center","right"].includes(input.textAlign)?input.textAlign:"left",maxWidth:["100%","90%","80%","70%","60%"].includes(input.maxWidth)?input.maxWidth:"100%"};
      await env.DB.prepare("INSERT INTO page_styles (element_key,draft_json,updated_at) VALUES (?,?,CURRENT_TIMESTAMP) ON CONFLICT(element_key) DO UPDATE SET draft_json=excluded.draft_json,updated_at=CURRENT_TIMESTAMP").bind(key,JSON.stringify(style)).run();
      await audit(env,session.email,"page_style_draft_saved","page_style",key,"draft");
      if(data?.publish===true){await env.DB.prepare("UPDATE page_styles SET published_json=draft_json,published_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE element_key=?").bind(key).run();await audit(env,session.email,"page_style_published","page_style",key,"published");}
      return json({ok:true,key,published:data?.publish===true});
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
    const inquiryMatch=path.match(new RegExp("^/api/admin/inquiries/([a-f0-9-]+)$"));
    if (inquiryMatch && method === "PATCH") {
      if (!sameOrigin(request)) return json({error:"Invalid request origin."},403);
      const data=await request.json().catch(()=>null);
      if (!["new","in_progress","responded","closed"].includes(data?.status)) return json({error:"Invalid inquiry status."},400);
      const result=await env.DB.prepare("UPDATE inquiries SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(data.status,inquiryMatch[1]).run();
      if (!result.meta.changes) return json({error:"Inquiry not found."},404);
      await audit(env,session.email,"inquiry_status_changed","inquiry",inquiryMatch[1],data.status);
      return json({ok:true});
    }
    const quoteMatch=path.match(/^\/api\/admin\/registrations\/([a-f0-9-]+)\/quote$/);
    if (quoteMatch && method === "PATCH") {
      if (!sameOrigin(request)) return json({error:"Invalid request origin."},403);
      const data=await request.json().catch(()=>null);
      const amount=Number(data?.amount);
      const amountMinor=Math.round(amount*100);
      if (!Number.isFinite(amountMinor) || amountMinor<1 || amountMinor>100000000000) return json({error:"Enter a valid quotation amount in BDT."},400);
      const result=await env.DB.prepare("UPDATE registrations SET pricing_type='custom',quoted_fee_minor=?,currency='BDT',updated_at=CURRENT_TIMESTAMP WHERE id=?")
        .bind(amountMinor,quoteMatch[1]).run();
      if (!result.meta.changes) return json({error:"Registration not found."},404);
      await audit(env,session.email,"custom_quote_set","registration",quoteMatch[1],String(amount));
      return json({ok:true});
    }
    const enrollmentMatch=path.match(/^\/api\/admin\/registrations\/([a-f0-9-]+)\/enrollment$/);
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

    const pagePath=url.pathname.match(/^\\/([a-z0-9-]+)\\.html$/);
    if (pagePath && !["index","admin","404"].includes(pagePath[1])) {
      try {
        const page=await env.DB.prepare("SELECT id FROM pages WHERE slug=? AND status='published'").bind(pagePath[1]).first();
        if(page)return env.ASSETS.fetch(new Request(new URL("/page.html?slug="+encodeURIComponent(pagePath[1]),url),request));
      } catch(error) { console.error("Page lookup failed",error); }
    }
    if (url.pathname === "/admin") return Response.redirect(new URL("/admin.html",url),302);
    return env.ASSETS.fetch(request);
  }
};
