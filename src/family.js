/* ===== v2.12 Family links: a parent invites a kid by email, the kid accepts in the app; either side can unlink ===== */
(function(){
const $=id=>document.getElementById(id),e_=s=>esc(s==null?"":String(s));
const F=()=>(typeof ME!=="undefined"&&ME&&ME.fam)||{kids:[],parents:[],invites:[],sent:[]};
const nameOf=email=>{const r=Object.values(athletes||{}).find(x=>String(x.owner||"").toLowerCase()===email);return r&&r.a&&r.a.name?r.a.name:""};
const call=(fn,...a)=>gs(fn,TOKEN,...a);
const msg=t=>{const s=$("famSt");if(s)s.textContent=t};
function setFam(st){if(typeof ME!=="undefined"&&ME&&st){ME.fam=st;ME.family=st.kids.slice()}}
function dropKid(email){Object.keys(athletes||{}).forEach(id=>{const r=athletes[id];if(r&&r.familyChild&&String(r.owner||"").toLowerCase()===email)delete athletes[id]});
 try{renderRoster()}catch(e){}try{const hb=$("famBtn");if(hb&&!F().kids.length)hb.remove()}catch(e){}}

function boxHtml(){const f=F(),row=(label,sub,btn)=>`<div class="famrow"><div><b>${e_(label)}</b>${sub?`<span class="muted small">${e_(sub)}</span>`:""}</div>${btn}</div>`;
 let h=`<div class="sheet" id="famBox"><span class="label">Family</span>
  <p class="muted small" style="margin:0 0 8px">Link your kids' accounts to see their plans and how they're following them. You can look but not change anything. Each kid signs up with their own email first, then accepts your invite in the app.</p>`;
 if(f.kids.length)h+=`<div class="famlist"><span class="flabel">Linked to you</span>${f.kids.map(k=>row(nameOf(k)||k,nameOf(k)?k:"",`<button class="btn small" type="button" data-famrm="${e_(k)}">Unlink</button>`)).join("")}</div>`;
 if(f.sent.length)h+=`<div class="famlist"><span class="flabel">Waiting for them to accept</span>${f.sent.map(k=>row(k,"Invite sent",`<button class="btn small" type="button" data-famrm="${e_(k)}">Cancel</button>`)).join("")}</div>`;
 if(f.parents.length)h+=`<div class="famlist"><span class="flabel">Can see your plan</span>${f.parents.map(p=>row(p,"Linked as your parent",`<button class="btn small" type="button" data-famrm="${e_(p)}">Unlink</button>`)).join("")}</div>`;
 h+=`<label class="field"><span class="flabel">Your kid's email</span><input type="email" id="famEmail" autocomplete="off" inputmode="email" placeholder="kid@example.com"></label>
  <div class="nav"><span class="status" id="famSt"></span><button class="btn primary" type="button" id="famAdd">Add family member</button></div></div>`;
 return h}

function render(){const sv=$("setupView");if(!sv)return;const old=$("famBox");const html=boxHtml();
 if(old)old.outerHTML=html;else{const anchor=$("setupDevices");if(anchor)anchor.insertAdjacentHTML("afterend",html);else sv.insertAdjacentHTML("beforeend",html)}wire()}
function wire(){const add=$("famAdd");if(!add)return;
 add.onclick=async()=>{const em=String($("famEmail").value||"").trim().toLowerCase();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)){msg("Type their email address.");return}
  add.disabled=true;msg("Sending…");
  try{const r=await call("familyInvite",em);const f=F();
   if(r.state==="linked")msg("Already linked.");
   else{if(f.sent.indexOf(em)<0)f.sent.push(em);setFam(f);render();msg(`Invite sent to ${em}. They'll see it next time they open the app, and get an email.`)}}
  catch(e){msg(String(e&&e.message||e).replace(/^F2C:[a-z_]+:/,""))}finally{const b=$("famAdd");if(b)b.disabled=false}};
 document.querySelectorAll("#famBox [data-famrm]").forEach(b=>b.onclick=async()=>{const em=b.dataset.famrm;
  if(!confirm(`Remove the family link with ${em}?`))return;b.disabled=true;
  try{const st=await call("familyRemove",em);setFam(st);dropKid(em);render();msg("Removed.")}catch(e){b.disabled=false;msg("Couldn't remove it. Try again.")}})}

/* Kid side: invites waiting for an answer */
function banner(){const inv=F().invites||[];let b=$("famInvite");
 if(!inv.length){if(b)b.remove();return}
 const app=$("app");if(!app||app.hidden)return;
 if(!b){b=document.createElement("div");b.id="famInvite";b.className="sheet faminv";app.insertBefore(b,app.firstChild)}
 const i=inv[0];if(b.dataset.p===i.parent)return;b.dataset.p=i.parent;b.innerHTML=`<span class="label">Family request</span><p style="margin:4px 0 10px"><b>${e_(i.name||i.parent)}</b>${i.name?` (${e_(i.parent)})`:""} wants to link to you as a parent. If you accept, they can see your plan and how you're following it. They can't change anything. You can unlink any time in Plan › Setup.</p>
  <div class="nav"><span class="status" id="famInvSt"></span><span><button class="btn" type="button" id="famNo">Decline</button> <button class="btn primary" type="button" id="famYes">Accept</button></span></div>`;
 const go=async ok=>{$("famYes").disabled=$("famNo").disabled=true;$("famInvSt").textContent=ok?"Linking…":"Declining…";
  try{const st=await call("familyRespond",i.parent,ok);setFam(st);banner();render()}catch(e){$("famInvSt").textContent="That didn't go through. Try again.";$("famYes").disabled=$("famNo").disabled=false}};
 $("famYes").onclick=()=>go(true);$("famNo").onclick=()=>go(false)}

let t=null;const tick=()=>{clearTimeout(t);t=setTimeout(()=>{try{if($("setupView")&&!$("famBox"))render();banner()}catch(e){}},120)};
new MutationObserver(tick).observe(document.documentElement,{childList:true,subtree:true});
window.F2C_famRender=()=>{render();banner()};
const st=document.createElement("style");st.textContent=`.famrow{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--line)}.famrow>div{display:grid;min-width:0}.famrow b{overflow:hidden;text-overflow:ellipsis}.famlist{margin:6px 0 10px}.faminv{border:2px solid var(--accent)!important}`;document.head.appendChild(st);
})();
