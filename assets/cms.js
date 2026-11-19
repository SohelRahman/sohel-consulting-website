/* Bilingual CMS bindings for static pages and shared header/footer content.
 * Updates text nodes with textContent/nodeValue only; HTML is never injected.
 */
(()=> {
 const path=location.pathname.replace(/^\/+|\/+$/g,""),parts=path.split("/").filter(Boolean);
 const language=parts[0]==="bn"?"bn":"en";
 const slug=(parts[0]==="bn"?parts[1]:parts[0])||"index.html";
 const page=slug.replace(/\.html$/i,"")==="index"?"home":slug.replace(/\.html$/i,"");
 const tags=["h1","h2","h3","h4","h5","h6","p","a","li","small","span","button","strong","em","b","i","img"];
 function collect(root,prefix,excludeShared){
  const nodes={};
  for(const tag of tags){
   let index=0;
   root.querySelectorAll(tag).forEach(el=>{
    if(excludeShared&&(el.closest("header.site-header")||el.closest("footer.footer")))return;
    if(el.closest("form")||el.closest("#sr-chat-panel")||el.closest("#sr-chat-launcher")||el.closest("#sr-consent-banner")||el.closest("#sr-consent-manage"))return;
    if(["brand-mark","status-dot","nav-symbol"].some(c=>el.classList?.contains(c)))return;
    if(tag!=="img"&&!el.textContent.trim()||el.hasAttribute("data-cms-ignore"))return;
    index++;const base=(prefix?prefix+".":"")+tag+"."+index;el.dataset.cmsKey=base;el.title=base;
    if(tag==="img"){nodes[base]=el;return;}
    const children=[...el.childNodes].filter(n=>n.nodeType===3&&n.nodeValue.trim());
    if(el.children.length&&children.length){children.forEach((node,n)=>{const key=base+".text."+(n+1);nodes[key]=node;el.dataset.cmsKey=key;el.title=key;});}
    else if(!el.children.length)nodes[base]=el;
   });
  }
  return nodes;
 }
 async function apply(pageKey,nodes){
  if(!Object.keys(nodes).length)return;
  try{
   const preview=new URLSearchParams(location.search).get("cmsPreview")==="1";const endpoint=preview?"/api/admin/cms/preview":"/api/cms-content";const r=await fetch(endpoint+"?page="+encodeURIComponent(pageKey)+"&lang="+language,{credentials:"same-origin"});
   if(!r.ok)return;const d=await r.json();
   for(const [key,item] of Object.entries(d.content||{})){
    if(key==="meta.title"){document.title=item.value;continue;}
    if(key==="meta.description"){let meta=document.querySelector('meta[name="description"]');if(!meta){meta=document.createElement("meta");meta.name="description";document.head.append(meta);}meta.content=item.value;continue;}
    const aliases=pageKey==="home"?{"home.hero.eyebrow":document.querySelector(".hero .eyebrow"),"home.hero.title":document.querySelector(".hero h1"),"home.hero.lead":document.querySelector(".hero .lead"),"home.hero.note":document.querySelector(".hero .micro-note")}:{};
    const el=nodes[key]||aliases[key];if(!el||typeof item?.value!=="string")continue;
    if(item.type==="image"&&el.tagName==="IMG")el.src=item.value;
    else if(item.type==="url"&&el.tagName==="A")el.href=item.value;
    else if(el.nodeType===3)el.nodeValue=item.value;
    else if(el.tagName!=="IMG")el.textContent=item.value;
   }
  }catch{}
 }
 const pageNodes=collect(document,"",true);
 const globalNodes={...collect(document.querySelector("header.site-header")||document.createElement("header"),"header",false),...collect(document.querySelector("footer.footer")||document.createElement("footer"),"footer",false)};
 if(new URLSearchParams(location.search).get("cmsKeys")==="1"){
  const style=document.createElement("style");style.textContent="[data-cms-key]{outline:1px dashed #e0a43a!important;outline-offset:2px;cursor:help!important}";document.head.append(style);
 }
 apply(page,pageNodes);apply("global",globalNodes);
})();