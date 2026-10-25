const API="https://api.206-119-171-49.sslip.io/api/v1";
const app=document.querySelector("#app"),nav=document.querySelector("#nav"),toast=document.querySelector("#toast");
let state={token:sessionStorage.getItem("token")||"",user:null,catalog:null};
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const notify=m=>{toast.textContent=m;toast.style.display="block";setTimeout(()=>toast.style.display="none",2500)};
async function api(path,opt={}){
  const headers={"Content-Type":"application/json",...(opt.headers||{})};
  if(state.token)headers.Authorization="Bearer "+state.token;
  const r=await fetch(API+path,{...opt,headers});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(data.error||"请求失败");
  return data;
}
function setToken(value,user){state.token=value||"";state.user=user||null;value?sessionStorage.setItem("token",value):sessionStorage.removeItem("token");renderNav()}
async function loadUser(){if(!state.token)return;try{const d=await api("/me");state.user=d.user}catch{setToken("",null)}}
function renderNav(){nav.innerHTML=`
<a href="#/">首页</a>${state.user?'<a href="#/favorites">我的收藏</a><a href="#/account">账户</a>':'<a href="#/login">登录</a><a href="#/register">注册</a>'}${state.user?.role==="ADMIN"?'<a href="#/admin">管理后台</a>':""}${state.user?'<button id="logout">退出</button>':""}`;document.querySelector("#logout")?.addEventListener("click",()=>{setToken("",null);location.hash="#/"})}
const card=t=>`<article class="card">${t.coverUrl?`<img src="${esc(t.coverUrl)}" alt="" loading="lazy">`:""}<div class="card-body"><div class="badges"><span class="badge">${esc(t.category.name)}</span>${t.isPromoted?'<span class="badge promo">推广链接</span>':""}</div><h3><a href="#/tutorial/${encodeURIComponent(t.slug)}">${esc(t.title)}</a></h3><p class="muted">${esc(t.summary)}</p><div class="actions"><a class="button" href="#/tutorial/${encodeURIComponent(t.slug)}">查看详情</a><small class="muted">${t._count?.clicks||0} 次点击</small></div></div></article>`;
async function home(){
  app.innerHTML='<div class="loading">正在加载教程…</div>';
  const d=await api("/catalog");state.catalog=d;
  app.innerHTML=`<section class="hero"><h1>找到值得信赖的教程入口</h1><p>持续整理 ChatGPT、AI 工具、账号注册与支付等实用教程。外部链接均先展示安全提示，推广内容清楚标识。</p><form class="search" id="search"><input name="q" placeholder="搜索教程标题或简介"><button>搜索</button></form></section><div class="filters" id="categories"><button class="chip active" data-category="">全部</button>${d.categories.map(c=>`<button class="chip" data-category="${esc(c.slug)}">${esc(c.name)}</button>`).join("")}</div><section><h2>推荐与最新教程</h2><div class="grid" id="tutorial-grid">${d.tutorials.map(card).join("")||'<div class="empty">暂无教程</div>'}</div></section>`;
  async function refresh(q="",category=""){const x=await api("/catalog?q="+encodeURIComponent(q)+"&category="+encodeURIComponent(category));document.querySelector("#tutorial-grid").innerHTML=x.tutorials.map(card).join("")||'<div class="empty">没有匹配的教程</div>'}
  document.querySelector("#search").onsubmit=e=>{e.preventDefault();refresh(new FormData(e.target).get("q")||"")};
  document.querySelectorAll("[data-category]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-category]").forEach(x=>x.classList.remove("active"));b.classList.add("active");refresh("",b.dataset.category)});
}
async function tutorial(slug){
  const t=await api("/tutorials/"+encodeURIComponent(slug));
  const tags=t.tags.map(x=>x.tag);
  app.innerHTML=`<article class="panel stack">${t.coverUrl?`<img src="${esc(t.coverUrl)}" alt="" style="width:100%;border-radius:12px">`:""}<div class="badges"><span class="badge">${esc(t.category.name)}</span>${tags.map(x=>`<span class="badge">${esc(x.name)}</span>`).join("")}${t.isPromoted?'<span class="badge promo">推广链接</span>':""}</div><h1>${esc(t.title)}</h1><p>${esc(t.summary)}</p>${t.notice?`<div class="alert"><strong>注意事项</strong><p>${esc(t.notice)}</p></div>`:""}${t.isPromoted?`<div class="alert"><strong>推广声明</strong><p>${esc(t.promotionDisclosure)}</p></div>`:""}${t.type==="ARTICLE"?`<div style="white-space:pre-wrap">${esc(t.articleContent)}</div>`:`<button id="go">查看外部教程</button>`}<button class="secondary" id="fav">收藏/取消收藏</button></article>`;
  document.querySelector("#fav").onclick=async()=>{if(!state.user){location.hash="#/login";return}try{const d=await api("/favorites/"+t.id,{method:"POST"});notify(d.favorite?"已收藏":"已取消收藏")}catch(e){notify(e.message)}};
  document.querySelector("#go")?.addEventListener("click",async()=>{await api("/clicks/"+t.id,{method:"POST"}).catch(()=>{});if(confirm("即将前往第三方网站。请勿向陌生网站提供账号密码，价格和政策以第三方页面为准。是否继续？"))window.open(t.externalUrl,"_blank","noopener,noreferrer")});
}
function authPage(mode){
  const register=mode==="register";
  app.innerHTML=`<section class="panel"><h1>${register?"注册账户":"登录"}</h1><form id="auth" class="stack">${register?'<label>昵称<input name="name" maxlength="50"></label>':""}<label>邮箱<input name="email" type="email" required></label><label>密码<input name="password" type="password" minlength="10" required></label><button>${register?"注册":"登录"}</button><p id="msg" class="error" hidden></p></form></section>`;
  document.querySelector("#auth").onsubmit=async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));try{const d=await api("/auth/"+mode,{method:"POST",body:JSON.stringify(f)});setToken(d.token,d.user);location.hash="#/"}catch(x){const m=document.querySelector("#msg");m.hidden=false;m.textContent=x.message}};
}
async function favorites(){
  const d=await api("/favorites");
  app.innerHTML=`<h1>我的收藏</h1><div class="grid">${d.favorites.map(x=>card(x.tutorial)).join("")||'<div class="empty">暂无收藏</div>'}</div>`;
}
async function account(){
  const d=await api("/me");
  app.innerHTML=`<section class="panel"><h1>账户资料</h1><form id="profile" class="stack"><label>邮箱<input value="${esc(d.user.email)}" disabled></label><label>昵称<input name="name" value="${esc(d.user.name||"")}" maxlength="50"></label><button>保存</button></form></section>`;
  document.querySelector("#profile").onsubmit=async e=>{e.preventDefault();try{const d=await api("/me",{method:"PATCH",body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});state.user=d.user;renderNav();notify("已保存")}catch(x){notify(x.message)}};
}
const bool=v=>v===true;
function tutorialPayload(form){const o=Object.fromEntries(new FormData(form));return{title:o.title,slug:o.slug,summary:o.summary,coverUrl:o.coverUrl||"",externalUrl:o.externalUrl||"",articleContent:o.articleContent||"",type:o.type,categoryId:o.categoryId,tagIds:new FormData(form).getAll("tagIds"),isPromoted:!!o.isPromoted,promotionDisclosure:o.promotionDisclosure||"",notice:o.notice||"",status:o.status,featured:!!o.featured,sortOrder:Number(o.sortOrder||0)}}
function tutorialForm(meta,t={}){
 const selected=new Set((t.tags||[]).map(x=>x.tag.id));
 return `<form id="tutorial-form" class="panel stack"><input type="hidden" name="id" value="${esc(t.id||"")}"><h2>${t.id?"编辑":"新增"}教程</h2><div class="split"><label>标题<input name="title" value="${esc(t.title||"")}" required></label><label>Slug<input name="slug" value="${esc(t.slug||"")}" pattern="[a-z0-9-]+" required></label></div><label>简介<textarea name="summary" required>${esc(t.summary||"")}</textarea></label><div class="split"><label>封面 URL<input name="coverUrl" type="url" value="${esc(t.coverUrl||"")}"></label><label>分类<select name="categoryId" required><option value="">选择</option>${meta.categories.map(c=>`<option value="${c.id}" ${c.id===t.categoryId?"selected":""}>${esc(c.name)}</option>`).join("")}</select></label></div><div class="split"><label>类型<select name="type"><option value="EXTERNAL" ${t.type!=="ARTICLE"?"selected":""}>外链</option><option value="ARTICLE" ${t.type==="ARTICLE"?"selected":""}>站内图文</option></select></label><label>外部链接<input name="externalUrl" type="url" value="${esc(t.externalUrl||"")}"></label></div><label>站内正文<textarea name="articleContent">${esc(t.articleContent||"")}</textarea></label><label>注意事项<textarea name="notice">${esc(t.notice||"")}</textarea></label><div class="badges">${meta.tags.map(x=>`<label class="chip"><input type="checkbox" name="tagIds" value="${x.id}" ${selected.has(x.id)?"checked":""}> ${esc(x.name)}</label>`).join("")}</div><div class="actions"><label><input type="checkbox" name="isPromoted" ${bool(t.isPromoted)?"checked":""}> 推广链接</label><label><input type="checkbox" name="featured" ${bool(t.featured)?"checked":""}> 推荐置顶</label></div><label>推广声明<textarea name="promotionDisclosure">${esc(t.promotionDisclosure||"")}</textarea></label><div class="split"><label>状态<select name="status"><option value="DRAFT">草稿</option><option value="PUBLISHED" ${t.status==="PUBLISHED"?"selected":""}>上架</option><option value="ARCHIVED" ${t.status==="ARCHIVED"?"selected":""}>下架</option></select></label><label>排序<input type="number" name="sortOrder" value="${t.sortOrder||0}"></label></div><button>保存</button></form>`;
}
async function admin(){
  const [dash,meta]=await Promise.all([api("/admin/dashboard"),api("/admin/tutorials")]);
  app.innerHTML=`<h1>管理后台</h1><div class="badges"><span class="badge">用户 ${dash.users}</span><span class="badge">教程 ${dash.tutorials}</span><span class="badge">点击 ${dash.clicks}</span><span class="badge">收藏 ${dash.favorites}</span></div><div class="actions" style="margin:20px 0"><button id="new">新增教程</button><a class="button secondary" href="#/admin/taxonomies">分类与标签</a></div><div id="editor"></div><table class="admin-table"><thead><tr><th>标题</th><th>状态</th><th>点击/收藏</th><th>操作</th></tr></thead><tbody>${meta.tutorials.map(t=>`<tr><td>${esc(t.title)}</td><td>${esc(t.status)}</td><td>${t._count.clicks}/${t._count.favorites}</td><td><button class="edit secondary" data-id="${t.id}">编辑</button> <button class="del danger" data-id="${t.id}">删除</button></td></tr>`).join("")}</tbody></table>`;
  const mount=t=>{document.querySelector("#editor").innerHTML=tutorialForm(meta,t);document.querySelector("#tutorial-form").onsubmit=async e=>{e.preventDefault();const id=e.target.id.value;try{await api("/admin/tutorials"+(id?"/"+id:""),{method:id?"PATCH":"POST",body:JSON.stringify(tutorialPayload(e.target))});notify("保存成功");admin()}catch(x){notify(x.message)}}};
  document.querySelector("#new").onclick=()=>mount();
  document.querySelectorAll(".edit").forEach(b=>b.onclick=()=>mount(meta.tutorials.find(t=>t.id===b.dataset.id)));
  document.querySelectorAll(".del").forEach(b=>b.onclick=async()=>{if(confirm("确定删除？")){await api("/admin/tutorials/"+b.dataset.id,{method:"DELETE"});admin()}});
}
async function taxonomies(){
 const d=await api("/admin/taxonomies");
 app.innerHTML=`<h1>分类与标签</h1><div class="split"><section class="panel"><h2>分类</h2><form id="cat" class="stack"><input name="name" placeholder="名称" required><input name="slug" placeholder="slug" required><input name="description" placeholder="说明"><input name="sortOrder" type="number" value="0"><button>新增分类</button></form>${d.categories.map(x=>`<p>${esc(x.name)} <button class="danger dc" data-id="${x.id}">删除</button></p>`).join("")}</section><section class="panel"><h2>标签</h2><form id="tag" class="stack"><input name="name" placeholder="名称" required><input name="slug" placeholder="slug" required><button>新增标签</button></form>${d.tags.map(x=>`<p>${esc(x.name)} <button class="danger dt" data-id="${x.id}">删除</button></p>`).join("")}</section></div>`;
 const submit=(id,path)=>document.querySelector(id).onsubmit=async e=>{e.preventDefault();await api(path,{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});taxonomies()};
 submit("#cat","/admin/categories");submit("#tag","/admin/tags");
 document.querySelectorAll(".dc").forEach(b=>b.onclick=async()=>{await api("/admin/categories/"+b.dataset.id,{method:"DELETE"});taxonomies()});
 document.querySelectorAll(".dt").forEach(b=>b.onclick=async()=>{await api("/admin/tags/"+b.dataset.id,{method:"DELETE"});taxonomies()});
}
async function router(){
 const p=(location.hash.slice(2)||"").split("/");app.innerHTML='<div class="loading">正在加载…</div>';
 try{
  if(!p[0])await home();else if(p[0]==="tutorial")await tutorial(p[1]);else if(p[0]==="login")authPage("login");else if(p[0]==="register")authPage("register");else if(p[0]==="favorites")await favorites();else if(p[0]==="account")await account();else if(p[0]==="admin"&&p[1]==="taxonomies")await taxonomies();else if(p[0]==="admin")await admin();else app.innerHTML='<div class="empty">页面不存在</div>';
 }catch(e){if(/登录|权限/.test(e.message)){setToken("",null);location.hash="#/login"}else app.innerHTML=`<div class="alert error">${esc(e.message)}</div>`}
}
(async()=>{await loadUser();renderNav();addEventListener("hashchange",router);router()})();
