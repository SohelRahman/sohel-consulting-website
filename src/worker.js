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
const ADMIN_PERMISSIONS = [
  "dashboard.view","courses.view","courses.manage","content.view","content.manage",
  "styles.view","styles.manage","pages.view","pages.manage","media.view","media.manage",
  "registrations.view","registrations.manage","inquiries.view","inquiries.manage",
  "analytics.view","chat.view","chat.reply"
];
const ALL_ADMIN_PERMISSIONS = new Set(ADMIN_PERMISSIONS);
async function passwordHash(password, saltValue) {
  const salt=saltValue||b64url(crypto.getRandomValues(new Uint8Array(16)));
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);
  const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt:fromB64url(salt),iterations:210000,hash:"SHA-256"},key,256);
  return "pbkdf2$210000$"+salt+"$"+b64url(bits);
}
async function passwordVerify(password, stored) {
  try {
    const [scheme,rounds,salt,expected]=String(stored||"").split("$");
    if(scheme!=="pbkdf2" || Number(rounds)!==210000 || !salt || !expected)return false;
    const actual=await passwordHash(password,salt);
    return actual===stored;
  } catch { return false; }
}
function permissionsFor(user) {
  if(user?.role==="admin")return ADMIN_PERMISSIONS;
  try {
    const value=JSON.parse(user?.permissions_json||"[]");
    return Array.isArray(value)?value.filter(x=>ALL_ADMIN_PERMISSIONS.has(x)):[];
  } catch { return []; }
}
function requiredPermission(path, method) {
  if(path==="/api/admin/me" || path==="/api/admin/users" || path.startsWith("/api/admin/users/"))return null;
  if(path==="/api/admin/summary")return "dashboard.view";
  if(path==="/api/admin/courses")return method==="GET"?"courses.view":"courses.manage";
  if(path.startsWith("/api/admin/courses/"))return method==="GET"?"courses.view":"courses.manage";
  if(path==="/api/admin/registrations")return "registrations.view";
  if(path.startsWith("/api/admin/registrations/"))return method==="GET"?"registrations.view":"registrations.manage";
  if(path==="/api/admin/inquiries")return "inquiries.view";
  if(path.startsWith("/api/admin/inquiries/"))return method==="GET"?"inquiries.view":"inquiries.manage";
  if(path==="/api/admin/site-content")return method==="GET"?"content.view":"content.manage";
  if(path.startsWith("/api/admin/site-content/"))return "content.manage";
  if(path==="/api/admin/page-styles")return method==="GET"?"styles.view":"styles.manage";
  if(path==="/api/admin/pages" || path.startsWith("/api/admin/pages/"))return method==="GET"?"pages.view":"pages.manage";
  if(path==="/api/admin/media")return method==="GET"?"media.view":"media.manage";
  if(path.startsWith("/api/admin/media/"))return "media.manage";
  if(path==="/api/admin/analytics")return "analytics.view";
  if(path==="/api/admin/chat/conversations")return "chat.view";
  if(path.startsWith("/api/admin/chat/conversations/"))return method==="GET"?"chat.view":"chat.reply";
  return null;
}
async function makeSession(userId,email,secret) {
  const payload=b64url(new TextEncoder().encode(JSON.stringify({userId,email,exp:Date.now()+8*60*60*1000})));
  return payload+"."+await sign(payload,secret);
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
async function cloudinarySignature(params, secret) {
  const canonical=Object.keys(params).sort().map(key=>key+"="+params[key]).join("&")+secret;
  const digest=await crypto.subtle.digest("SHA-1",new TextEncoder().encode(canonical));
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
}

async function analyticsVisitorHash(visitorId) {
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(visitorId));
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
}
async function chatTokenHash(token) {
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
}
async function chatAnswer(env,message,language) {
  const q=message.toLowerCase();
  const bn=language==="bn";
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|হ্যালো|আসসালামু আলাইকুম|সালাম)/i.test(q.trim()))
    return bn?"স্বাগতম। প্রজেক্ট ম্যানেজমেন্ট, SAP S/4HANA, বিজনেস অ্যানালাইসিস বা পরামর্শ সেবা সম্পর্কে জানতে চাইতে পারেন।":"Welcome. Ask me about Project Management, SAP S/4HANA, Business Analysis, training or consulting services.";
  if (/(course|training|প্রশিক্ষণ|কোর্স|ট্রেনিং)/i.test(q)) {
    const {results=[]}=await env.DB.prepare("SELECT title_en,title_bn,summary_en,summary_bn,pricing_type,fixed_fee_minor,currency FROM courses WHERE active=1 ORDER BY title_en").all();
    if (!results.length) return bn?"বর্তমানে প্রকাশিত কোনো প্রশিক্ষণ কোর্সের তথ্য পাওয়া যায়নি।":"I couldn't find any currently active courses.";
    const list=results.map(x=>bn?(x.title_bn||x.title_en)+" — "+(x.summary_bn||x.summary_en||""):(x.title_en+" — "+(x.summary_en||""))).join("\n");
    return (bn?"বর্তমানে চালু কোর্সসমূহ:\n":"Currently available courses:\n")+list+(bn?"\nফি ও ব্যাচের তথ্য নিশ্চিত করতে যোগাযোগ করুন।":"\nContact us to confirm fees and batch availability.");
  }
  if (/(fee|price|cost|charge|ফি|মূল্য|খরচ)/i.test(q)) {
    const {results=[]}=await env.DB.prepare("SELECT title_en,title_bn,pricing_type,fixed_fee_minor,currency FROM courses WHERE active=1 ORDER BY title_en").all();
    if (!results.length) return bn?"কোর্স ফি সম্পর্কে নিশ্চিত তথ্য নেই। অনুগ্রহ করে যোগাযোগ করুন।":"I don't have confirmed fee information. Please contact the administrator.";
    const lines=results.map(x=>{const title=bn?(x.title_bn||x.title_en):x.title_en;return x.fixed_fee_minor?title+": "+(x.fixed_fee_minor/100).toLocaleString("en-US")+" "+x.currency:(title+": "+(bn?"কাস্টম কোটেশন":"custom quotation"));});
    return (bn?"প্রকাশিত কোর্স ফি:\n":"Published course pricing:\n")+lines.join("\n")+(bn?"\nচূড়ান্ত ফি নিশ্চিত করতে সরাসরি যোগাযোগ করুন।":"\nPlease contact us to confirm the final fee.");
  }
  if (/(sap|এসএপি)/i.test(q)) return bn?"SAP S/4HANA, SAP MM এবং procurement process বিষয়ে প্রশিক্ষণ ও সহায়তা দেওয়া হয়। নির্দিষ্ট প্রয়োজন জানাতে যোগাযোগ করুন।":"The website lists training in SAP S/4HANA, SAP MM and procurement processes. Contact us with your specific requirements.";
  if (/(project management|pmp|প্রজেক্ট ম্যানেজমেন্ট)/i.test(q)) return bn?"প্রজেক্ট ম্যানেজমেন্ট প্রশিক্ষণে পরিকল্পনা, সময়সূচি, পর্যবেক্ষণ ও প্রকল্প বাস্তবায়নের মৌলিক বিষয় অন্তর্ভুক্ত।":"Project Management training covers practical planning, scheduling, monitoring and delivery fundamentals.";
  if (/(business analysis|বিজনেস অ্যানালাইসিস)/i.test(q)) return bn?"বিজনেস অ্যানালাইসিসে requirements, stakeholder analysis, process mapping এবং UAT-এর মৌলিক বিষয় অন্তর্ভুক্ত।":"Business Analysis training covers requirements, stakeholder analysis, process mapping and UAT fundamentals.";
  if (/(contact|email|phone|যোগাযোগ|ইমেইল)/i.test(q)) return bn?"ইমেইল: sohelrahman118@gmail.com। বিস্তারিত আলোচনার জন্য যোগাযোগ পাতার inquiry form ব্যবহার করতে পারেন।":"Email: sohelrahman118@gmail.com. You can also use the inquiry form on the Contact page.";
  if (/(service|consult|পরামর্শ|সেবা)/i.test(q)) return bn?"ওয়েবসাইটে Project Management, SAP-সম্পর্কিত business process এবং Business Analysis বিষয়ে পরামর্শ সেবার তথ্য রয়েছে। আপনার প্রয়োজন জানাতে যোগাযোগ করুন।":"The website describes consulting support in Project Management, SAP-related business processes and Business Analysis. Contact us with your requirements.";
  return bn?"এই বিষয়ে আমার কাছে নিশ্চিত প্রকাশিত তথ্য নেই। অনুগ্রহ করে অন্যভাবে প্রশ্ন করুন অথবা মানব সহায়তার জন্য 'মানব সহায়তা' লিখুন।":"I don't have confirmed published information about that. Please rephrase your question or type 'human support' to request a response from the administrator.";
}
async function handleApi(request, env) {
  const url = new URL(request.url), path = url.pathname, method = request.method;
  if (!env.DB) return json({error:"Database is not configured."},503);


  const pagePublicSlug=path.startsWith("/api/pages/")?path.slice("/api/pages/".length):"";
  if (/^[a-z0-9-]+$/.test(pagePublicSlug) && method === "GET") {
    const page=await env.DB.prepare("SELECT slug,title,language,published_json,seo_title,seo_description FROM pages WHERE slug=? AND status='published' AND published_json IS NOT NULL").bind(pagePublicSlug).first();
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


  if (path === "/api/chat/session" && method === "POST") {
    if (!sameOrigin(request)) return json({error:"Invalid request origin."},403);
    if (!(await rateLimit(env,request,"chat-session",12,60*60*1000))) return json({error:"Chat limit reached. Please try again later."},429);
    const data=await request.json().catch(()=>null), token=clean(data?.token,80);
    if (!/^[a-f0-9]{64}$/i.test(token)) return json({error:"Invalid chat session."},400);
    const tokenHash=await chatTokenHash(token), language=data?.language==="bn"?"bn":"en";
    let conversation=await env.DB.prepare("SELECT id,status FROM chat_conversations WHERE visitor_token_hash=?").bind(tokenHash).first();
    if (!conversation) {
      const conversationId=id();
      await env.DB.prepare("INSERT INTO chat_conversations (id,visitor_token_hash,language) VALUES (?,?,?)").bind(conversationId,tokenHash,language).run();
      conversation={id:conversationId,status:"open"};
    } else if (conversation.status==="closed") {
      await env.DB.prepare("UPDATE chat_conversations SET status='open',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(conversation.id).run();
    }
    const {results=[]}=await env.DB.prepare("SELECT sender,message,created_at FROM chat_messages WHERE conversation_id=? ORDER BY created_at ASC LIMIT 60").bind(conversation.id).all();
    return json({conversationId:conversation.id,messages:results});
  }
  if (path === "/api/chat/messages" && method === "POST") {
    if (!sameOrigin(request)) return json({error:"Invalid request origin."},403);
    if (!(await rateLimit(env,request,"chat-message",30,15*60*1000))) return json({error:"Too many chat messages. Please wait and try again."},429);
    const data=await request.json().catch(()=>null), conversationId=clean(data?.conversationId,80), token=clean(data?.token,80), message=clean(data?.message,1000);
    if (!/^[a-f0-9-]{36}$/i.test(conversationId) || !/^[a-f0-9]{64}$/i.test(token) || !message) return json({error:"Enter a valid message."},400);
    const tokenHash=await chatTokenHash(token);
    const conversation=await env.DB.prepare("SELECT id,language,status FROM chat_conversations WHERE id=? AND visitor_token_hash=?").bind(conversationId,tokenHash).first();
    if (!conversation) return json({error:"Chat session not found. Refresh the chat and try again."},404);
    if (conversation.status==="closed") return json({error:"This conversation is closed. Refresh to start a new conversation."},409);
    await env.DB.prepare("INSERT INTO chat_messages (id,conversation_id,sender,message) VALUES (?,?,?,?)").bind(id(),conversationId,"visitor",message).run();
    const wantsHuman=/(human support|talk to human|administrator|admin|মানব সহায়তা|মানুষের সাথে কথা|অ্যাডমিন)/i.test(message);
    let reply;
    if (wantsHuman) {
      await env.DB.prepare("UPDATE chat_conversations SET status='needs_human',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(conversationId).run();
      reply=conversation.language==="bn"?"আপনার অনুরোধটি প্রশাসকের কাছে পাঠানো হয়েছে। প্রশাসক অনলাইনে থাকলে উত্তর দেবেন।":"Your request has been flagged for administrator follow-up. An administrator can review this conversation and reply.";
    } else {
      reply=await chatAnswer(env,message,conversation.language);
      await env.DB.prepare("UPDATE chat_conversations SET updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(conversationId).run();
    }
    await env.DB.prepare("INSERT INTO chat_messages (id,conversation_id,sender,message) VALUES (?,?,?,?)").bind(id(),conversationId,"bot",reply).run();
    return json({reply,status:wantsHuman?"needs_human":"open"});
  }

  if (path === "/api/analytics/event" && method === "POST") {
    if (!sameOrigin(request)) return json({error:"Invalid request origin."},403);
    if (!(await rateLimit(env,request,"analytics-event",180,15*60*1000))) return json({error:"Analytics event limit reached."},429);
    const data=await request.json().catch(()=>null);
    const visitorId=clean(data?.visitorId,80), event=clean(data?.event,40);
    const allowedEvents=["page_view","chat_open","chat_message","human_support_request"];
    if (!/^[a-f0-9-]{32,36}$/i.test(visitorId) || !allowedEvents.includes(event)) return json({error:"Invalid analytics event."},400);
    const page=clean(data?.page,160);
    if (!page.startsWith("/") || page.startsWith("/api/") || page.startsWith("/admin")) return json({ok:true,ignored:true});
    const device=["mobile","tablet","desktop"].includes(data?.device)?data.device:"unknown";
    let referrer="";
    try { const host=new URL(clean(data?.referrer,500)).hostname.toLowerCase(); if(host && host!==url.hostname)referrer=host.slice(0,120); } catch {}
    const visitorHash=await analyticsVisitorHash(visitorId);
    await env.DB.prepare("INSERT INTO analytics_events (id,visitor_hash,event_name,page_path,referrer_host,device_type) VALUES (?,?,?,?,?,?)")
      .bind(id(),visitorHash,event,page,referrer,device).run();
    await env.DB.prepare("DELETE FROM analytics_events WHERE created_at < datetime('now','-90 days')").run();
    return json({ok:true},202);
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
    if (!env.SESSION_SECRET) return json({error:"Administrator session security is not configured."},503);
    const data=await request.json().catch(()=>null);
    const email=clean(data?.email,180).toLowerCase(), password=String(data?.password||"");
    if(!emailOk(email)||password.length<1||password.length>256)return json({error:"Enter a valid email and password."},400);
    let user=await env.DB.prepare("SELECT id,email,full_name,role,password_hash,permissions_json,is_active FROM admin_users WHERE email=?").bind(email).first();
    if(!user && env.ADMIN_EMAIL && env.ADMIN_PASSWORD && email===env.ADMIN_EMAIL.toLowerCase() && password===env.ADMIN_PASSWORD){
      const userId=id(), hash=await passwordHash(password);
      await env.DB.prepare("INSERT INTO admin_users (id,email,full_name,role,password_hash,permissions_json,is_active) VALUES (?,?,?,'admin',?,'[]',1)")
        .bind(userId,email,"Primary Administrator",hash).run();
      user=await env.DB.prepare("SELECT id,email,full_name,role,password_hash,permissions_json,is_active FROM admin_users WHERE id=?").bind(userId).first();
      await audit(env,email,"bootstrap_admin_created","admin_user",userId,"Initial administrator account provisioned");
    }
    if(!user || !user.is_active || !(await passwordVerify(password,user.password_hash)))return json({error:"Invalid email or password, or account is disabled."},401);
    const token=await makeSession(user.id,user.email,env.SESSION_SECRET);
    return new Response(JSON.stringify({ok:true}),{headers:{
      "content-type":"application/json","cache-control":"no-store",
      "set-cookie":`sr_admin=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`
    }});
  }
  if (path === "/api/admin/logout" && method === "POST") {
    if (!sameOrigin(request)) return json({error:"Invalid request origin."},403);
    return new Response(JSON.stringify({ok:true}),{headers:{"content-type":"application/json","set-cookie":"sr_admin=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0"}});
  }
  if (path.startsWith("/api/admin/")) {
    const session=await readSession(request,env.SESSION_SECRET);
    if (!session?.userId) return json({error:"Authentication required. Please sign in again."},401);
    const user=await env.DB.prepare("SELECT id,email,full_name,role,permissions_json,is_active FROM admin_users WHERE id=?").bind(session.userId).first();
    if(!user || !user.is_active || user.email!==session.email)return json({error:"Account is disabled or no longer available."},401);
    const permissions=permissionsFor(user);
    const isAdmin=user.role==="admin";
    if(path==="/api/admin/me" && method==="GET")return json({user:{id:user.id,email:user.email,name:user.full_name,role:user.role,permissions}});
    if(path==="/api/admin/users" || path.startsWith("/api/admin/users/")){
      if(!isAdmin)return json({error:"Only administrators can manage dashboard accounts."},403);
      if(path==="/api/admin/users" && method==="GET"){
        const {results=[]}=await env.DB.prepare("SELECT id,email,full_name,role,permissions_json,is_active,created_at,updated_at,last_login_at FROM admin_users ORDER BY role,email").all();
        return json({users:results.map(x=>({...x,permissions:permissionsFor(x),password_hash:undefined}))});
      }
      if(path==="/api/admin/users" && method==="POST"){
        if(!sameOrigin(request))return json({error:"Invalid request origin."},403);
        const data=await request.json().catch(()=>null);
        const email=clean(data?.email,180).toLowerCase(),name=clean(data?.name,120),password=String(data?.password||"");
        const role=data?.role==="admin"?"admin":"user";
        const selected=Array.isArray(data?.permissions)?[...new Set(data.permissions.filter(x=>ALL_ADMIN_PERMISSIONS.has(x)))]:[];
        if(!emailOk(email)||!name||password.length<12||password.length>256)return json({error:"Provide a valid email, name and password of at least 12 characters."},400);
        if(role==="admin" && !isAdmin)return json({error:"Only an administrator can create an administrator account."},403);
        try{
          const newId=id(),hash=await passwordHash(password);
          await env.DB.prepare("INSERT INTO admin_users (id,email,full_name,role,password_hash,permissions_json,is_active) VALUES (?,?,?,?,?,?,1)")
            .bind(newId,email,name,role,hash,JSON.stringify(role==="admin"?[]:selected)).run();
          await audit(env,session.email,"admin_user_created","admin_user",newId,role);
          return json({ok:true,id:newId},201);
        }catch{return json({error:"An account with this email may already exist."},409);}
      }
      const userMatch=path.match(/^\/api\/admin\/users\/([a-f0-9-]+)$/);
      if(userMatch && method==="PATCH"){
        if(!sameOrigin(request))return json({error:"Invalid request origin."},403);
        const target=await env.DB.prepare("SELECT id,email,role,is_active FROM admin_users WHERE id=?").bind(userMatch[1]).first();
        if(!target)return json({error:"User account not found."},404);
        const data=await request.json().catch(()=>null);
        if(target.id===user.id && data?.is_active===false)return json({error:"You cannot disable your own account."},400);
        const role=data?.role==="admin"?"admin":data?.role==="user"?"user":target.role;
        const active=typeof data?.is_active==="boolean"?Number(data.is_active):Number(target.is_active);
        if(target.role==="admin" && (role!=="admin"||!active)){
          const count=await env.DB.prepare("SELECT COUNT(*) AS n FROM admin_users WHERE role='admin' AND is_active=1").first();
          if(Number(count?.n||0)<=1)return json({error:"At least one active administrator must remain."},409);
        }
        const selected=Array.isArray(data?.permissions)?[...new Set(data.permissions.filter(x=>ALL_ADMIN_PERMISSIONS.has(x)))]:null;
        const name=typeof data?.name==="string"?clean(data.name,120):null;
        const password=typeof data?.password==="string"?data.password:null;
        if(password!==null&&(password.length<12||password.length>256))return json({error:"A new password must contain at least 12 characters."},400);
        const hash=password?await passwordHash(password):null;
        await env.DB.prepare("UPDATE admin_users SET full_name=COALESCE(?,full_name),role=?,is_active=?,permissions_json=?,password_hash=COALESCE(?,password_hash),updated_at=CURRENT_TIMESTAMP WHERE id=?")
          .bind(name,role,active,JSON.stringify(role==="admin"?[]:(selected||permissionsFor(target))),hash,userMatch[1]).run();
        await audit(env,session.email,"admin_user_updated","admin_user",userMatch[1],JSON.stringify({role,is_active:!!active,password_reset:!!password}));
        return json({ok:true});
      }
      if(userMatch && method==="DELETE"){
        if(!sameOrigin(request))return json({error:"Invalid request origin."},403);
        if(userMatch[1]===user.id)return json({error:"You cannot remove your own account."},400);
        const target=await env.DB.prepare("SELECT id,role,is_active FROM admin_users WHERE id=?").bind(userMatch[1]).first();
        if(!target)return json({error:"User account not found."},404);
        if(target.role==="admin"&&target.is_active){
          const count=await env.DB.prepare("SELECT COUNT(*) AS n FROM admin_users WHERE role='admin' AND is_active=1").first();
          if(Number(count?.n||0)<=1)return json({error:"At least one active administrator must remain."},409);
        }
        await env.DB.prepare("UPDATE admin_users SET is_active=0,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(userMatch[1]).run();
        await audit(env,session.email,"admin_user_disabled","admin_user",userMatch[1],"Account disabled");
        return json({ok:true});
      }
      return json({error:"Not found."},404);
    }
    const required=requiredPermission(path,method);
    if(required && !isAdmin && !permissions.includes(required))return json({error:"You do not have permission to perform this action."},403);
    if (path === "/api/admin/media" && method === "GET") {
      try {
        const {results=[]}=await env.DB.prepare("SELECT public_id AS key,secure_url AS url,bytes AS size,format,created_at AS uploaded FROM media_assets ORDER BY created_at DESC LIMIT 200").all();
        return json({items:results,cursor:null});
      } catch { return json({error:"Media library is not initialized. Apply migration 0006_cloudinary_media.sql to the Preview database."},503); }
    }
    if (path === "/api/admin/media" && method === "POST") {
      if (!sameOrigin(request)) return json({error:"Invalid request origin."},403);
      const data=await request.json().catch(()=>null);
      if (!data || typeof data !== "object") return json({error:"Invalid media metadata."},400);
      const publicId=clean(data.public_id,255);
      const secureUrl=clean(data.secure_url,2048);
      const bytes=Number(data.bytes);
      const format=clean(data.format,10).toLowerCase();
      const width=Number(data.width), height=Number(data.height);
      const allowedFormats=["jpg","jpeg","png","webp","gif"];
      let parsedUrl;
      try { parsedUrl=new URL(secureUrl); } catch { return json({error:"Invalid Cloudinary image URL."},400); }
      const expectedPathPrefix=env.CLOUDINARY_CLOUD_NAME
        ? "/"+env.CLOUDINARY_CLOUD_NAME+"/image/upload/"
        : "";
      if (!env.CLOUDINARY_CLOUD_NAME || parsedUrl.protocol!=="https:" ||
          parsedUrl.hostname!=="res.cloudinary.com" ||
          !parsedUrl.pathname.includes(expectedPathPrefix) ||
          !publicId.startsWith("sohel-consulting/") ||
          !/^[a-zA-Z0-9_./-]+$/.test(publicId) ||
          !Number.isInteger(bytes) || bytes<1 || bytes>3*1024*1024 ||
          !allowedFormats.includes(format) ||
          !Number.isInteger(width) || width<1 || width>10000 ||
          !Number.isInteger(height) || height<1 || height>10000) {
        return json({error:"Cloudinary returned invalid or unsupported image metadata."},400);
      }
      try {
        await env.DB.prepare("INSERT INTO media_assets (public_id,secure_url,bytes,format,width,height) VALUES (?,?,?,?,?,?)")
          .bind(publicId,secureUrl,bytes,format,width,height).run();
      } catch {
        return json({error:"Could not save the image to the media library. Confirm that migration 0006 is applied to the Preview database."},503);
      }
      await audit(env,session.email,"media_uploaded","media_asset",publicId,format+" "+bytes+" bytes");
      return json({ok:true,public_id:publicId},201);
    }
    if (path === "/api/admin/media/signature" && method === "POST") {
      if (!sameOrigin(request)) return json({error:"Invalid request origin."},403);
      if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) return json({error:"Cloudinary is not configured. Add the three Cloudinary secrets to the Preview Worker."},503);
      if (!(await rateLimit(env,request,"media-upload-hour",10,60*60*1000))) return json({error:"Upload limit reached: maximum 10 images per hour."},429);
      if (!(await rateLimit(env,request,"media-upload-day",40,24*60*60*1000))) return json({error:"Daily upload limit reached: maximum 40 images per day."},429);
      const timestamp=Math.floor(Date.now()/1000), folder="sohel-consulting";
      const signature=await cloudinarySignature({folder,timestamp},env.CLOUDINARY_API_SECRET);
      return json({cloudName:env.CLOUDINARY_CLOUD_NAME,apiKey:env.CLOUDINARY_API_KEY,timestamp,folder,signature});
    }
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

    const pagePreviewMatch=path.match(/^\/api\/admin\/pages\/([a-z0-9-]+)\/preview$/);
    if (pagePreviewMatch && method === "GET") {
      const page=await env.DB.prepare("SELECT slug,title,language,seo_title,seo_description,draft_json FROM pages WHERE slug=?").bind(pagePreviewMatch[1]).first();
      if (!page) return json({error:"Page not found."},404);
      return json({page:{slug:page.slug,title:page.title,language:page.language,seo_title:page.seo_title,seo_description:page.seo_description,...JSON.parse(page.draft_json)}});
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
      if (!slug || !title || ["admin","api","assets","bn","src","migrations","index","services","training","register","case-studies","about","faq","contact","privacy","terms","refund","404","page"].includes(slug)) return json({error:"Enter a valid page title and URL slug."},400);
      const pageId=id();
      try { await env.DB.prepare("INSERT INTO pages (id,slug,title,language,draft_json,seo_title,seo_description) VALUES (?,?,?,?,?,?,?)").bind(pageId,slug,title,language,JSON.stringify({sections:[]}),clean(data?.seoTitle,160),clean(data?.seoDescription,300)).run(); }
      catch { return json({error:"That page URL already exists."},409); }
      await audit(env,session.email,"page_created","page",pageId,slug);
      return json({ok:true,id:pageId,slug},201);
    }
    const pageAdminSlug=path.startsWith("/api/admin/pages/")?path.slice("/api/admin/pages/".length):"";
    if (/^[a-z0-9-]+$/.test(pageAdminSlug) && method === "PUT") {
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
      const fontSize=v=>v!==undefined&&v!==null&&v!==""&&Number.isFinite(Number(v))?Math.max(10,Math.min(100,Math.round(Number(v)))):0;
      const mobileSpace=v=>v!==undefined&&v!==null&&v!==""&&Number.isFinite(Number(v))?Math.max(0,Math.min(160,Math.round(Number(v)))):36;
        const item={id:clean(section.id,60),type:section.type,heading:safeText(section.heading,180),body:safeText(section.body,5000),buttonText:safeText(section.buttonText,80),buttonUrl:safeText(section.buttonUrl,300),layout:{backgroundColor:color(layout.backgroundColor),textColor:color(layout.textColor),textAlign:["left","center","right"].includes(layout.textAlign)?layout.textAlign:"left",maxWidth:["720","900","1100","1280"].includes(String(layout.maxWidth))?String(layout.maxWidth):"1100",paddingTop:size(layout.paddingTop),paddingBottom:size(layout.paddingBottom),fontFamily:["inherit","Manrope","Arial","Georgia","Verdana","Tahoma","Trebuchet MS","Noto Sans Bengali"].includes(layout.fontFamily)?layout.fontFamily:"inherit",headingFontSize:fontSize(layout.headingFontSize),bodyFontSize:fontSize(layout.bodyFontSize),mobileHeadingFontSize:fontSize(layout.mobileHeadingFontSize),mobileBodyFontSize:fontSize(layout.mobileBodyFontSize),backgroundImage:(()=>{const v=clean(layout.backgroundImage,1000);try{const u=new URL(v);return ["https:","http:"].includes(u.protocol)?u.href:"";}catch{return "";}})(),backgroundSize:["cover","contain"].includes(layout.backgroundSize)?layout.backgroundSize:"cover",backgroundPosition:["center","top","bottom","left","right"].includes(layout.backgroundPosition)?layout.backgroundPosition:"center",mobilePaddingTop:mobileSpace(layout.mobilePaddingTop),mobilePaddingBottom:mobileSpace(layout.mobilePaddingBottom)}};
        if(section.type==="split"){item.left={heading:safeText(section.left?.heading,180),body:safeText(section.left?.body,3000)};item.right={heading:safeText(section.right?.heading,180),body:safeText(section.right?.body,3000)};}
        if(section.type==="cards")item.items=Array.isArray(section.items)?section.items.slice(0,6).map(x=>({heading:safeText(x?.heading,180),body:safeText(x?.body,1200),buttonText:safeText(x?.buttonText,80),buttonUrl:safeText(x?.buttonUrl,300)})):[];
        safeSections.push(item);
      }
      const draft={sections:safeSections};
      const publish=data?.publish===true;
      const result=await env.DB.prepare("UPDATE pages SET title=?,language=?,seo_title=?,seo_description=?,draft_json=?,published_json=CASE WHEN ?=1 THEN ? ELSE published_json END,status=CASE WHEN ?=1 THEN 'published' ELSE status END,published_at=CASE WHEN ?=1 THEN CURRENT_TIMESTAMP ELSE published_at END,updated_at=CURRENT_TIMESTAMP WHERE slug=?")
        .bind(title,language,clean(data?.seoTitle,160),clean(data?.seoDescription,300),JSON.stringify(draft),publish?1:0,JSON.stringify(draft),publish?1:0,publish?1:0,pageAdminSlug).run();
      if(!result.meta.changes)return json({error:"Page not found."},404);
      await audit(env,session.email,publish?"page_published":"page_draft_saved","page",pageAdminSlug,String(safeSections.length)+" sections");
      return json({ok:true,published:publish});
    }
    if (/^[a-z0-9-]+$/.test(pageAdminSlug) && method === "DELETE") {
      if (!sameOrigin(request)) return json({error:"Invalid request origin."},403);
      const result=await env.DB.prepare("DELETE FROM pages WHERE slug=?").bind(pageAdminSlug).run();
      if(!result.meta.changes)return json({error:"Page not found."},404);
      await audit(env,session.email,"page_deleted","page",pageAdminSlug,"");
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

    if (path === "/api/admin/chat/conversations" && method === "GET") {
      const {results=[]}=await env.DB.prepare(`SELECT c.id,c.status,c.language,c.created_at,c.updated_at,
        (SELECT message FROM chat_messages m WHERE m.conversation_id=c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
        (SELECT COUNT(*) FROM chat_messages m WHERE m.conversation_id=c.id) AS message_count
        FROM chat_conversations c ORDER BY CASE c.status WHEN 'needs_human' THEN 0 WHEN 'open' THEN 1 ELSE 2 END,c.updated_at DESC LIMIT 200`).all();
      return json({conversations:results});
    }
    const chatAdminMatch=path.match(/^\/api\/admin\/chat\/conversations\/([a-f0-9-]+)$/);
    if (chatAdminMatch && method === "GET") {
      const conversation=await env.DB.prepare("SELECT id,status,language,created_at,updated_at FROM chat_conversations WHERE id=?").bind(chatAdminMatch[1]).first();
      if (!conversation) return json({error:"Conversation not found."},404);
      const {results=[]}=await env.DB.prepare("SELECT sender,message,created_at FROM chat_messages WHERE conversation_id=? ORDER BY created_at ASC LIMIT 200").bind(chatAdminMatch[1]).all();
      return json({conversation,messages:results});
    }
    if (chatAdminMatch && method === "POST") {
      if (!sameOrigin(request)) return json({error:"Invalid request origin."},403);
      const data=await request.json().catch(()=>null), message=clean(data?.message,2000);
      if (!message) return json({error:"Enter a reply."},400);
      const exists=await env.DB.prepare("SELECT id FROM chat_conversations WHERE id=?").bind(chatAdminMatch[1]).first();
      if (!exists) return json({error:"Conversation not found."},404);
      await env.DB.prepare("INSERT INTO chat_messages (id,conversation_id,sender,message) VALUES (?,?,?,?)").bind(id(),chatAdminMatch[1],"admin",message).run();
      const status=data?.status==="closed"?"closed":"open";
      await env.DB.prepare("UPDATE chat_conversations SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(status,chatAdminMatch[1]).run();
      await audit(env,session.email,"chat_admin_reply","chat_conversation",chatAdminMatch[1],status);
      return json({ok:true,status});
    }
    if (path === "/api/admin/analytics" && method === "GET") {
      const [summary,pages,devices,events,daily]=await Promise.all([
        env.DB.prepare(`SELECT
          COUNT(*) AS pageViews,
          COUNT(DISTINCT visitor_hash) AS uniqueBrowsers,
          SUM(CASE WHEN created_at >= datetime('now','-7 days') THEN 1 ELSE 0 END) AS pageViews7d,
          COUNT(DISTINCT CASE WHEN created_at >= datetime('now','-7 days') THEN visitor_hash END) AS uniqueBrowsers7d
          FROM analytics_events WHERE event_name='page_view' AND created_at >= datetime('now','-30 days')`).first(),
        env.DB.prepare(`SELECT page_path,COUNT(*) AS views,COUNT(DISTINCT visitor_hash) AS visitors FROM analytics_events
          WHERE event_name='page_view' AND created_at >= datetime('now','-30 days') GROUP BY page_path ORDER BY views DESC LIMIT 10`).all(),
        env.DB.prepare(`SELECT device_type,COUNT(*) AS views FROM analytics_events
          WHERE event_name='page_view' AND created_at >= datetime('now','-30 days') GROUP BY device_type ORDER BY views DESC`).all(),
        env.DB.prepare(`SELECT event_name,COUNT(*) AS total FROM analytics_events
          WHERE created_at >= datetime('now','-30 days') GROUP BY event_name ORDER BY total DESC`).all(),
        env.DB.prepare(`SELECT date(created_at) AS day,COUNT(*) AS views FROM analytics_events
          WHERE event_name='page_view' AND created_at >= datetime('now','-6 days') GROUP BY date(created_at) ORDER BY day`).all()
      ]);
      return json({summary:summary||{},pages:pages.results||[],devices:devices.results||[],events:events.results||[],daily:daily.results||[]});
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

    const pageSlug=url.pathname.endsWith(".html")?url.pathname.slice(1,-5):"";
    if (/^[a-z0-9-]+$/.test(pageSlug) && !["index","admin","404"].includes(pageSlug)) {
      try {
        const page=await env.DB.prepare("SELECT id FROM pages WHERE slug=? AND status='published'").bind(pageSlug).first();
        if(page)return env.ASSETS.fetch(new Request(new URL("/page.html?slug="+encodeURIComponent(pageSlug),url),request));
      } catch(error) { console.error("Page lookup failed",error); }
    }
    if (url.pathname === "/admin") return Response.redirect(new URL("/admin.html",url),302);
    return env.ASSETS.fetch(request);
  }
};
