const toggle=document.querySelector('.menu-toggle');const nav=document.querySelector('.nav');if(toggle&&nav){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});}const year=document.getElementById('year');if(year)year.textContent=new Date().getFullYear();
/* Lightweight, deterministic website chat. No external AI service or paid API. */
(()=>{
 if(document.getElementById("sr-chat-launcher"))return;
 const bn=document.documentElement.lang.toLowerCase().startsWith("bn");
 const words=bn?{open:"চ্যাট",title:"সোহেল রহমান সহায়তা",welcome:"স্বাগতম। প্রশিক্ষণ, পরামর্শ সেবা বা কোর্স সম্পর্কে প্রশ্ন করুন।",placeholder:"আপনার প্রশ্ন লিখুন…",send:"পাঠান",human:"মানব সহায়তা",error:"বার্তা পাঠানো যায়নি। আবার চেষ্টা করুন।",humanDone:"আপনার অনুরোধ প্রশাসকের কাছে পাঠানো হয়েছে।"}:{open:"Chat",title:"Sohel Rahman support",welcome:"Hello. Ask about training, consulting services or courses.",placeholder:"Type your question…",send:"Send",human:"Human support",error:"Message could not be sent. Please try again.",humanDone:"Your request has been sent to the administrator."};
 const style=document.createElement("style");
 style.textContent=`
 #sr-chat-launcher{position:fixed;right:22px;bottom:22px;z-index:9998;border:0;border-radius:999px;padding:13px 19px;background:#1769a6;color:#fff;font:600 14px system-ui;box-shadow:0 8px 28px #0004;cursor:pointer}
 #sr-chat-panel{position:fixed;right:22px;bottom:82px;z-index:9999;width:min(360px,calc(100vw - 28px));height:min(500px,calc(100vh - 115px));display:none;flex-direction:column;background:#0c2037;color:#eef4fb;border:1px solid #35516e;border-radius:12px;box-shadow:0 12px 40px #0006;overflow:hidden;font:14px system-ui}
 #sr-chat-panel.sr-open{display:flex}#sr-chat-head{padding:14px 16px;background:#102944;display:flex;justify-content:space-between;align-items:center;font-weight:700}
 #sr-chat-close{border:0;background:transparent;color:#fff;font-size:22px;cursor:pointer}#sr-chat-log{flex:1;overflow:auto;padding:13px;display:flex;flex-direction:column;gap:9px}
 .sr-chat-msg{max-width:88%;padding:9px 11px;border-radius:9px;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.45}
 .sr-chat-msg.bot{align-self:flex-start;background:#173653}.sr-chat-msg.visitor{align-self:flex-end;background:#1769a6;color:#fff}.sr-chat-msg.admin{align-self:flex-start;background:#24513f}
 #sr-chat-form{display:flex;gap:7px;padding:10px;border-top:1px solid #29435d}#sr-chat-input{min-width:0;flex:1;background:#07182a;color:#fff;border:1px solid #35516e;border-radius:6px;padding:10px;font:inherit}
 #sr-chat-send,#sr-chat-human{border:0;border-radius:6px;padding:9px 11px;background:#1769a6;color:#fff;font-weight:600;cursor:pointer}#sr-chat-human{margin:0 10px 10px;background:#29435d}#sr-chat-note{padding:0 12px 8px;color:#9fb2c6;font-size:11px}
 @media(max-width:520px){#sr-chat-launcher{right:14px;bottom:14px}#sr-chat-panel{right:10px;bottom:70px;width:calc(100vw - 20px);height:min(520px,calc(100vh - 90px))}}
 `;
 document.head.append(style);
 const launcher=document.createElement("button");launcher.id="sr-chat-launcher";launcher.type="button";launcher.textContent=words.open;launcher.setAttribute("aria-expanded","false");
 const panel=document.createElement("section");panel.id="sr-chat-panel";panel.setAttribute("aria-label",words.title);
 const head=document.createElement("div");head.id="sr-chat-head";const title=document.createElement("span");title.textContent=words.title;const close=document.createElement("button");close.id="sr-chat-close";close.type="button";close.textContent="×";close.setAttribute("aria-label",bn?"বন্ধ করুন":"Close");head.append(title,close);
 const log=document.createElement("div");log.id="sr-chat-log";log.setAttribute("aria-live","polite");
 const note=document.createElement("div");note.id="sr-chat-note";note.textContent=bn?"স্বয়ংক্রিয় উত্তর প্রকাশিত ওয়েবসাইট তথ্যের ভিত্তিতে দেওয়া হয়। কথোপকথন সংরক্ষণ করা হয়।":"Automated replies use published website information. Chat messages are stored for support.";
 const human=document.createElement("button");human.id="sr-chat-human";human.type="button";human.textContent=words.human;
 const form=document.createElement("form");form.id="sr-chat-form";const input=document.createElement("input");input.id="sr-chat-input";input.maxLength=1000;input.required=true;input.placeholder=words.placeholder;input.autocomplete="off";input.setAttribute("aria-label",words.placeholder);
 const send=document.createElement("button");send.id="sr-chat-send";send.type="submit";send.textContent=words.send;form.append(input,send);panel.append(head,log,note,human,form);document.body.append(launcher,panel);
 let conversationId=null,loading=false,memoryToken="";
 const addMessage=(sender,message)=>{const bubble=document.createElement("div");bubble.className="sr-chat-msg "+sender;bubble.textContent=message;log.append(bubble);log.scrollTop=log.scrollHeight;};
 const getToken=()=>{if(memoryToken)return memoryToken;let token="";try{token=localStorage.getItem("sr_chat_token")||"";}catch{}if(!/^[a-f0-9]{64}$/i.test(token)){const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);token=Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");try{localStorage.setItem("sr_chat_token",token);}catch{}}memoryToken=token;return memoryToken;}
 async function ensureSession(){if(conversationId)return;const token=getToken();if(!token)throw new Error(words.error);const r=await fetch("/api/chat/session",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token,language:bn?"bn":"en"})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||words.error);conversationId=d.conversationId;if(d.messages?.length){d.messages.forEach(m=>addMessage(m.sender,m.message));}else addMessage("bot",words.welcome);}
 async function sendMessage(message){if(loading)return;loading=true;send.disabled=true;try{await ensureSession();addMessage("visitor",message);const r=await fetch("/api/chat/messages",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({conversationId,token:getToken(),message})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||words.error);addMessage("bot",d.reply);}catch(e){addMessage("bot",e.message||words.error);}finally{loading=false;send.disabled=false;}}
 const toggle=open=>{panel.classList.toggle("sr-open",open);launcher.setAttribute("aria-expanded",String(open));if(open){ensureSession().catch(e=>addMessage("bot",e.message));input.focus();}};
 launcher.addEventListener("click",()=>toggle(!panel.classList.contains("sr-open")));close.addEventListener("click",()=>toggle(false));
 form.addEventListener("submit",e=>{e.preventDefault();const value=input.value.trim();if(!value)return;input.value="";sendMessage(value);});
 human.addEventListener("click",()=>sendMessage(bn?"মানব সহায়তা":"human support"));
})();

/* Anonymous first-party traffic metrics. No names, emails, message text or full referrer URLs are sent. */
(()=>{
 if(location.pathname==="/admin"||location.pathname.startsWith("/admin.")||location.pathname.startsWith("/api/"))return;
 let visitorId="";
 try{visitorId=localStorage.getItem("sr_analytics_visitor")||"";}catch{}
 if(!/^[a-f0-9-]{32,36}$/i.test(visitorId)){
  visitorId=crypto.randomUUID();
  try{localStorage.setItem("sr_analytics_visitor",visitorId);}catch{}
 }
 const device=matchMedia("(max-width: 640px)").matches?"mobile":matchMedia("(max-width: 1024px)").matches?"tablet":"desktop";
 const send=(event)=>{
  fetch("/api/analytics/event",{method:"POST",headers:{"content-type":"application/json"},keepalive:true,
   body:JSON.stringify({visitorId,event,page:location.pathname.slice(0,160),referrer:document.referrer,device})}).catch(()=>{});
 };
 send("page_view");
 document.addEventListener("click",e=>{
  const launcher=e.target.closest("#sr-chat-launcher");
  if(launcher)send("chat_open");
  const human=e.target.closest("#sr-chat-human");
  if(human)send("human_support_request");
 });
 document.addEventListener("submit",e=>{if(e.target?.id==="sr-chat-form")send("chat_message");},true);
})();
