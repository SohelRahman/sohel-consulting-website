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
 const inspectorMode=new URLSearchParams(location.search).get("cmsKeys")==="1";
 if(inspectorMode){
  const style=document.createElement("style");
  style.textContent="[data-cms-key]{outline:1px dashed #e0a43a!important;outline-offset:2px;cursor:pointer!important}[data-cms-key]:hover{outline:2px solid #f2b84b!important}";
  document.head.append(style);
  const panel=document.createElement("section");
  panel.id="cms-inline-editor";
  panel.setAttribute("role","dialog");
  panel.setAttribute("aria-label","Edit website content");
  panel.style.cssText="position:fixed;z-index:2147483000;right:18px;bottom:18px;width:min(390px,calc(100vw - 36px));max-height:75vh;overflow:auto;background:#fff;color:#142033;border:1px solid #cbd5e1;border-radius:12px;box-shadow:0 12px 40px #0005;padding:16px;font:14px/1.45 system-ui,sans-serif;display:none";
  panel.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><strong style="font-size:16px">Edit page content</strong><button type="button" id="cms-inline-close" aria-label="Close editor" style="border:0;background:#e8edf4;border-radius:6px;padding:5px 9px;cursor:pointer">Close</button></div><p id="cms-inline-key" style="margin:10px 0;color:#475569;overflow-wrap:anywhere"></p><label style="display:block;margin:8px 0 4px">Content type</label><select id="cms-inline-type" style="width:100%;padding:9px;border:1px solid #cbd5e1;border-radius:6px"><option value="text">Short text</option><option value="textarea">Long text</option><option value="url">URL</option><option value="image">Image URL</option><option value="richtext">Plain text</option></select><label style="display:block;margin:10px 0 4px" for="cms-inline-value">Draft value</label><textarea id="cms-inline-value" rows="5" style="box-sizing:border-box;width:100%;padding:9px;border:1px solid #cbd5e1;border-radius:6px;resize:vertical"></textarea><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button type="button" id="cms-inline-save" style="background:#145da0;color:#fff;border:0;border-radius:6px;padding:9px 12px;cursor:pointer">Save draft</button><button type="button" id="cms-inline-preview" style="background:#e8edf4;color:#142033;border:0;border-radius:6px;padding:9px 12px;cursor:pointer">Preview draft</button></div><p id="cms-inline-status" role="status" style="margin:10px 0 0;color:#475569"></p>';
  document.body.append(panel);
  const byId=id=>document.getElementById(id);
  let selectedKey="",selectedPage=page;
  function openInlineEditor(el){
   const raw=el.dataset.cmsKey||"";
   const key=raw;
   if(!key)return;
   selectedKey=key;
   selectedPage=(key.startsWith("header.")||key.startsWith("footer."))?"global":page;
   byId("cms-inline-key").textContent="Key: "+selectedPage+" / "+language+" / "+key;
   byId("cms-inline-type").value=el.tagName==="IMG"?"image":el.tagName==="A"?"url":"text";
   byId("cms-inline-value").value=el.tagName==="IMG"?(el.getAttribute("src")||""):el.tagName==="A"?(el.getAttribute("href")||""):el.textContent.trim();
   byId("cms-inline-status").textContent="Changes are saved as drafts only.";
   panel.style.display="block";
   byId("cms-inline-value").focus();
  }
  document.addEventListener("click",event=>{
   if(panel.contains(event.target))return;
   const el=event.target.closest?.("[data-cms-key]");
   if(!el)return;
   event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
   openInlineEditor(el);
  },true);
  byId("cms-inline-close").addEventListener("click",()=>{panel.style.display="none";});
  byId("cms-inline-save").addEventListener("click",async()=>{
   const value=byId("cms-inline-value").value,type=byId("cms-inline-type").value;
   if(!selectedKey){byId("cms-inline-status").textContent="Select a highlighted element first.";return;}
   if(!value.trim()){byId("cms-inline-status").textContent="Draft value cannot be empty.";return;}
   const button=byId("cms-inline-save");button.disabled=true;byId("cms-inline-status").textContent="Saving draft…";
   try{
    const response=await fetch("/api/admin/cms/save",{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify({page:selectedPage,language,key:selectedKey,type,value})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||"Could not save draft. Check your admin session and content permissions.");
    byId("cms-inline-status").textContent="Draft saved. Public content is unchanged. Use Preview draft to review it.";
   }catch(error){byId("cms-inline-status").textContent=error.message;}
   finally{button.disabled=false;}
  });
  byId("cms-inline-preview").addEventListener("click",()=>{
   const previewUrl=new URL(location.href);previewUrl.searchParams.delete("cmsKeys");previewUrl.searchParams.set("cmsPreview","1");window.open(previewUrl.toString(),"_blank","noopener");
  });
 }
 apply(page,pageNodes);apply("global",globalNodes);
})();