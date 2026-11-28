/* ===== v2.13 Coach tab = chat + "My plan" (the written plan, nested into tappable rows that open a sheet). Plan tab is now Settings. ===== */
(function(){
const $=id=>document.getElementById(id),esc_=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
const G=k=>{try{return localStorage.getItem(k)}catch(e){return null}},P=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
let sub=G("f2c-coachsub")||"plan";
const I=d=>`<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const ICONS=[[/recommend/i,'<path d="M12 3l2.6 5.6 6 .6-4.5 4 1.3 6L12 16l-5.4 3.2 1.3-6-4.5-4 6-.6z"/>'],[/priorit/i,'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'],
 [/week\b|the week/i,'<path d="M3 10h18M7 3v4M17 3v4M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/>'],[/sets/i,'<path d="M5 20V10M10 20V4M15 20v-7M20 20v-4"/>'],
 [/workout/i,'<path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12"/>'],[/cardio|conditioning/i,'<path d="M3 12h4l2-5 4 10 2-5h6"/>'],[/recover|sleep/i,'<path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z"/>'],
 [/phase/i,'<path d="M4 20h4v-5h4v-5h4V5h4"/>'],[/foods?\b|grocer/i,'<path d="M12 7c-4-3-8 0-7 5s4 9 7 8c3 1 6-3 7-8s-3-8-7-5zM12 7c0-2 1-4 3-4"/>'],[/nutrition|meal|calor/i,'<path d="M5 3v8a3 3 0 0 0 6 0V3M8 3v18M16 3c-2 2-2 6 0 8v10"/>'],
 [/track/i,'<path d="M4 12l5 5L20 6"/>'],[/supplement/i,'<rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-45 12 12)"/><path d="M9 9l6 6"/>'],[/lab/i,'<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/>'],
 [/safety|injur|pain/i,'<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/>']];
const iconFor=t=>{for(const [re,d] of ICONS)if(re.test(t))return d;return '<path d="M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6"/>'};
const CHEV=I('<path d="M9 6l6 6-6 6"/>');

/* ---- structure inside the Coach view ---- */
function ensure(){const v=$("v-coach");if(!v)return false;
 if(!$("coachChat")){const chat=document.createElement("div");chat.id="coachChat";while(v.firstChild)chat.appendChild(v.firstChild);
  v.innerHTML=`<div class="seg coachseg" id="coachSeg" role="tablist"><button type="button" data-cs="plan">My plan</button><button type="button" data-cs="chat">Ask your coach</button></div>`;
  v.appendChild(chat);const cp=document.createElement("div");cp.id="coachPlan";cp.innerHTML=`<div id="planIndex"></div><div id="planStore" hidden></div>`;v.appendChild(cp)}
 const store=$("planStore");
 [$("checksBox"),$("plan"),document.querySelector("#v-plan .revise, #planPanel > .revise, .revise")].forEach(n=>{if(n&&n.parentNode!==store&&!(n.closest&&n.closest("#pdBody")))store.appendChild(n);if(n)n.hidden=false});
 $("coachSeg").querySelectorAll("[data-cs]").forEach(b=>b.setAttribute("aria-selected",b.dataset.cs===sub));
 $("coachChat").hidden=sub!=="plan"?false:true;$("coachPlan").hidden=sub!=="plan";
 return true}

/* ---- the index of the written plan ---- */
function parts(){const pl=$("plan");if(!pl)return {secs:[],notes:[],kpis:null,bottom:null};
 const out={secs:[],notes:[],kpis:null,bottom:null};
 [...pl.children].forEach(n=>{
  if(n.matches(".kpis")){out.kpis=n;return}
  if(n.matches(".note")){out.notes.push(n);return}
  if(n.tagName==="SECTION"){const h=n.querySelector("h2,h3");const t=h?h.textContent.trim():"Details";if(/^bottom line$/i.test(t)){out.bottom=n;return}out.secs.push({n,t})}});
 return out}
const clip=t=>{t=t.replace(/\s+/g," ").trim();return t.length>90?t.slice(0,88).replace(/\s\S*$/,"")+"…":t};
const preview=n=>{const first=[...n.children].find(c=>!c.matches("h2,h3,.hint"));
 if(first&&(first.matches("table")||first.querySelector&&first.querySelector("table"))){const tb=first.matches("table")?first:first.querySelector("table");
  const vals=[...tb.querySelectorAll("tbody tr, tr")].map(tr=>tr.querySelector("td"))
   .filter(Boolean).map(td=>td.textContent.trim()).filter((v,i,a)=>v&&a.indexOf(v)===i);
  if(vals.length)return clip(vals.join(", "))}
 const p=n.querySelector("p:not(.hint), li");if(p)return clip(p.textContent);
 const c=n.cloneNode(true);c.querySelectorAll("h2,h3,.hint,button").forEach(x=>x.remove());return clip(c.textContent)};
let sig="";
function render(force){if(!ensure())return;const ix=$("planIndex"),R=window.F2C_T&&F2C_T.rec?F2C_T.rec():null;
 const pl=$("plan"),ck0=R&&R.checks,ns=[R&&R.id,R&&(R.planDate||R.planned),pl?pl.childElementCount:0,pl?pl.innerHTML.length:0,ck0?ck0.at:0,!!document.querySelector("#planStore .revise"),!!(R&&R.plan)].join("|");
 if(!force&&ns===sig&&ix.childElementCount)return;sig=ns;
 if(!R||!R.plan){ix.innerHTML=`<div class="sheet"><span class="label">Your plan</span><h3>No plan yet</h3><p class="muted small">Answer the questions and tap Build my plan. It shows up here, sorted into short sections.</p></div>`;return}
 const p=parts(),ck=R.checks;let h="";
 // headline: bottom line + key numbers
 if(p.bottom){const sum=p.bottom.querySelector("p");h+=`<div class="sheet pihead"><span class="label">Bottom line</span><p class="piclamp">${esc_(sum?sum.textContent:"")}</p>${p.bottom.querySelectorAll("p").length>1||((sum&&sum.textContent.length)||0)>220||(p.kpis&&p.kpis.querySelectorAll(".kpi").length>4)?`<button type="button" class="linkbtn" data-pi="bottom">Read all</button>`:""}`;
  if(p.kpis)h+=`<div class="pikpis">${[...p.kpis.querySelectorAll(".kpi")].slice(0,4).map(k=>`<div><span>${esc_((k.querySelector(".label")||{}).textContent||"")}</span><b>${esc_((k.querySelector("b")||{}).textContent||"")}</b></div>`).join("")}</div>`;
  h+=`</div>`}
 // rows
 const rows=[];
 if(p.notes.length){const warn=p.notes.some(n=>n.matches(".warn,.stop")),gold=p.notes.some(n=>n.matches(".gold"));
  rows.push({k:"notes",t:"Notes for you",s:`${p.notes.length} note${p.notes.length>1?"s":""}: safety, labs and what to watch`,ic:'<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/>',dot:warn?"var(--wd-yellow)":gold?"var(--accent)":"var(--wd-green)"})}
 p.secs.forEach((x,i)=>rows.push({k:"s"+i,t:x.t,s:/workout/i.test(x.t)?"Every session, set and rep. Also on the Workouts tab.":preview(x.n),ic:iconFor(x.t)}));
 const cb=$("checksBox");if(cb){const n=ck&&ck.issues?ck.issues.length:null;rows.push({k:"check",t:"Plan check",s:ck?(n?`${n} thing${n>1?"s":""} to look at`:"No problems found"):"Not checked yet",ic:'<path d="M4 12l5 5L20 6"/>',dot:ck?(n?(ck.issues.some(x=>x.sev==="high")?"var(--wd-red)":"var(--wd-yellow)"):"var(--wd-green)"):"var(--muted)"})}
 if(document.querySelector("#planStore .revise"))rows.push({k:"revise",t:"Ask for a change",s:"Tell the coach what to change; the plan updates.",ic:'<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>'});
 h+=`<div class="pilist">${rows.map(r=>`<button type="button" class="pirow" data-pi="${r.k}"><span class="piic">${I(r.ic)}</span><span class="pitx"><b>${esc_(r.t)}</b><small>${r.dot?`<i style="background:${r.dot}"></i>`:""}${esc_(r.s)}</small></span><span class="pich">${CHEV}</span></button>`).join("")}</div>`;
 const built=R.planDate||R.planned||R.planAt;h+=`<p class="muted small pifoot">${built?`Plan built ${new Date(built).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}. `:""}To change your answers or devices, go to Settings.</p>`;
 ix.innerHTML=h}

/* ---- detail sheet: moves the real section in (so its buttons keep working) and puts it back on close ---- */
let open=null;
function sheet(){let s=$("pdSheet");if(s)return s;s=document.createElement("div");s.id="pdSheet";s.hidden=true;
 s.innerHTML=`<div class="pdback" data-pdx></div><div class="pdpanel" role="dialog" aria-modal="true" aria-labelledby="pdTitle"><div class="pdhead"><h3 id="pdTitle"></h3><span id="pdExtra"></span><button type="button" class="pdx" data-pdx aria-label="Close">${I('<path d="M6 6l12 12M18 6L6 18"/>')}</button></div><div class="pdbody" id="pdBody"></div></div>`;
 document.body.appendChild(s);s.addEventListener("click",e=>{if(e.target.closest("[data-pdx]"))close()});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!s.hidden)close()});return s}
let onClose=null;
function close(){const s=$("pdSheet");if(!s||s.hidden)return;if(open)open.forEach(([n,ph])=>{if(ph.parentNode)ph.parentNode.replaceChild(n,ph)});open=null;
 $("pdBody").innerHTML="";s.hidden=true;document.body.classList.remove("pdlock");const f=onClose;onClose=null;if(f)f()}
function showSheet(title,nodes,extra,after){nodes=nodes.filter(Boolean);if(!nodes.length)return;if(open)close();const s=sheet();
 open=nodes.map(n=>{const ph=document.createComment("pd");n.parentNode.insertBefore(ph,n);return [n,ph]});
 $("pdTitle").textContent=title;const body=$("pdBody");body.innerHTML="";nodes.forEach(n=>{n.hidden=false;body.appendChild(n)});
 $("pdExtra").innerHTML=extra||"";onClose=after||null;s.hidden=false;document.body.classList.add("pdlock");body.scrollTop=0}
window.F2C_pdOpen=showSheet;window.F2C_pdClose=close;
function openPart(k){render(true);const p=parts();let nodes=[],title="";
 if(k==="bottom"&&p.bottom){nodes=[p.bottom,p.kpis].filter(Boolean);title="Bottom line"}
 else if(k==="notes"){nodes=p.notes;title="Notes for you"}
 else if(k==="check"){const cb=$("checksBox");if(cb)nodes=[cb];title="Plan check"}
 else if(k==="revise"){const r=document.querySelector("#planStore .revise");if(r)nodes=[r];title="Ask for a change"}
 else if(/^s\d+$/.test(k)){const x=p.secs[+k.slice(1)];if(x){nodes=[x.n];title=x.t}}
 if(!nodes.length)return;
 showSheet(title,nodes,/workout/i.test(title)?`<button type="button" class="btn small" id="pdGoWk">Open Workouts</button>`:"",()=>render(true));
 const gw=$("pdGoWk");if(gw)gw.onclick=()=>{close();F2C_T.show("workouts")};
 if(k==="revise")setTimeout(()=>{const t=$("reviseText");t&&t.focus()},200)}
window.F2C_openPlanPart=k=>{sub="plan";P("f2c-coachsub",sub);if(window.F2C_T&&F2C_T.ui.tab!=="coach")F2C_T.show("coach");else{ensure();render()}openPart(k)};
window.F2C_coachPlanRender=()=>{ensure();render(true)};

document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-cs],[data-pi]");if(!b)return;
 if(b.dataset.cs){sub=b.dataset.cs;P("f2c-coachsub",sub);ensure();if(sub==="plan")render(true);else if(window.F2C_rCoach)F2C_rCoach();window.scrollTo({top:0});return}
 if(b.dataset.pi)openPart(b.dataset.pi)});
// keep the index in step with the plan and the coach view
let t=null;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(()=>{if($("v-coach")&&!$("v-coach").hidden&&!open){ensure();if(sub==="plan")render()}else if($("v-coach")&&!$("coachChat"))ensure()},80)}).observe(document.documentElement,{childList:true,subtree:true});

/* ---- Settings: the same rows, each opening the sheet ---- */
const SET=[["plan","Your plan and answers",'<path d="M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6"/>',["setupHead"]],
 ["devices","Connected devices",'<rect x="7" y="2" width="10" height="20" rx="3"/><path d="M11 18h2"/>',["setupDevices"]],
 ["family","Family",'<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20c0-3.5 2.7-6 6-6s6 2.5 6 6M14 20c0-2.6 1.4-4.6 3-4.6s4 1.6 4 4.6"/>',["famBox"]],
 ["looks","Appearance",'<circle cx="12" cy="12" r="9"/><path d="M12 3v18M12 3a9 9 0 0 1 0 18"/>',["looksSheet"]]];
function setSub(k){const R=window.F2C_T&&F2C_T.rec?F2C_T.rec():null,f=(typeof ME!=="undefined"&&ME&&ME.fam)||{kids:[],parents:[],invites:[],sent:[]};
 if(k==="plan"){const d=R&&(R.planDate||R.planned);return (d?"Built "+new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"})+". ":"")+"Add new info, edit answers or rebuild"}
 if(k==="devices"){const w=R&&R.wear,last=w&&w.days&&w.days.length?w.days[w.days.length-1]:null;const t=($("setupDevices")||{}).textContent||"";
  return /disconnect|connected to whoop|whoop connected/i.test(t)?"WHOOP connected":last?"Data imported up to "+last.date:"Sleep, recovery and steps from a watch or ring"}
 if(k==="family"){const a=[];if(f.kids.length)a.push(f.kids.length+" linked");if(f.sent.length)a.push(f.sent.length+" waiting");if(f.parents.length)a.push(f.parents.length+" can see your plan");return a.length?a.join(" · "):"Link your kids' accounts"}
 if(k==="looks"){const b=document.querySelector('#looksBox button[aria-pressed="true"], #looksBox button.on, #looksBox button[aria-checked="true"]');const nm=b&&b.querySelector(".lkname");return nm?nm.textContent.trim():"Colors and dark mode"}
 return ""}
let ssig="";
function settingsRender(force){const sv=$("setupView");if(!sv)return;{const cb=$("checksBox");if(cb&&cb.closest("#v-plan")){ensure()}}
 if(!$("setIndex")){const ix=document.createElement("div");ix.id="setIndex";const store=document.createElement("div");store.id="setStore";store.hidden=true;const t=$("setTitle");(t?t:sv.firstChild)&&(t?t.after(ix):sv.prepend(ix));ix.after(store)}
 const store=$("setStore");SET.forEach(([,, ,ids])=>ids.forEach(id=>{const n=$(id);if(n&&n.parentNode!==store&&!(n.closest&&n.closest("#pdBody")))store.appendChild(n)}));
 [...sv.children].forEach(c=>{if(!["setTitle","setIndex","setStore"].includes(c.id)&&!(c.closest&&c.closest("#pdBody")))store.appendChild(c)});
 const subs=SET.map(([k])=>setSub(k)),sg=subs.join("|");if(!force&&sg===ssig&&$("setIndex").childElementCount)return;ssig=sg;
 $("setIndex").innerHTML=`<div class="pilist">${SET.map(([k,t,ic],i)=>`<button type="button" class="pirow" data-set="${k}"><span class="piic">${I(ic)}</span><span class="pitx"><b>${esc_(t)}</b><small>${esc_(subs[i])}</small></span><span class="pich">${CHEV}</span></button>`).join("")}</div>`}
function openSetting(k){settingsRender(true);const row=SET.find(x=>x[0]===k);if(!row)return;
 if(k==="family"&&!$("famBox")&&window.F2C_famRender)F2C_famRender();
 showSheet(row[1],row[3].map(id=>$(id)),"",()=>settingsRender(true));
 if(k==="plan"){const ap=$("addPanel");if(ap)ap.hidden=true}}
window.F2C_settingsRender=()=>settingsRender();window.F2C_openSetting=openSetting;
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-set]");if(b){openSetting(b.dataset.set);return}
 const go=e.target.closest&&e.target.closest("#editIntake,#regen");if(go&&$("pdSheet")&&!$("pdSheet").hidden)setTimeout(close,0)},true);
let st2=null;new MutationObserver(()=>{clearTimeout(st2);st2=setTimeout(()=>{if($("setupView")&&!$("v-plan").hidden&&!open)settingsRender()},120)}).observe(document.documentElement,{childList:true,subtree:true});

const st=document.createElement("style");st.textContent=`
.coachseg{display:flex;margin:0 0 14px}.coachseg button{flex:1}
.coachseg button[aria-selected="true"]{background:var(--accent);color:var(--accent-ink,#fff);border-color:var(--accent)}
.pihead p.piclamp{display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;margin:6px 0 4px;line-height:1.45}
.linkbtn{background:none;border:0;padding:4px 0;color:var(--link,var(--accent));font-weight:700;cursor:pointer;font:inherit;font-size:14px}
.pikpis{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:12px}
.pikpis div{background:var(--wd-tile,rgba(0,0,0,.04));border-radius:12px;padding:10px 12px;display:grid;gap:2px}
.pikpis span{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}.pikpis b{font-size:17px}
.pilist{background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:var(--shadow,0 1px 2px rgba(0,0,0,.06))}
.pirow{display:grid;grid-template-columns:40px 1fr 18px;align-items:center;gap:12px;width:100%;text-align:left;background:none;border:0;border-top:1px solid var(--line);padding:13px 14px;color:var(--ink);cursor:pointer;font:inherit}
.pirow:first-child{border-top:0}.pirow:active{background:var(--accent-soft)}
.piic{width:40px;height:40px;border-radius:12px;background:var(--accent-soft);display:grid;place-items:center}.piic svg{width:22px;height:22px;fill:none;stroke:var(--accent);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.pitx{display:grid;gap:2px;min-width:0}.pitx b{font-size:15.5px}.pitx small{color:var(--muted);font-size:13px;line-height:1.35;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.pitx small i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;vertical-align:1px}
.pich svg{width:18px;height:18px;fill:none;stroke:var(--muted);stroke-width:2}
.pifoot{margin:12px 2px}
#pdSheet{position:fixed;inset:0;z-index:60}#pdSheet[hidden]{display:none}
.pdback{position:absolute;inset:0;background:rgba(0,0,0,.45)}
.pdpanel{position:absolute;left:0;right:0;bottom:0;max-height:90vh;background:var(--bg);border-radius:20px 20px 0 0;display:flex;flex-direction:column;box-shadow:0 -8px 30px rgba(0,0,0,.25);animation:pdup .22s ease-out;max-width:760px;margin:0 auto}
@keyframes pdup{from{transform:translateY(40px);opacity:.4}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.pdpanel{animation:none}}
.pdhead{display:flex;align-items:center;gap:10px;padding:16px 16px 10px;border-bottom:1px solid var(--line)}.pdhead h3{flex:1;margin:0;font-size:20px}
.pdx{background:var(--wd-tile2,rgba(0,0,0,.08));border:0;border-radius:50%;width:36px;height:36px;display:grid;place-items:center;cursor:pointer;color:var(--ink)}.pdx svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2.4}
.pdbody{overflow:auto;padding:6px 16px 28px;-webkit-overflow-scrolling:touch}
.pdbody>section>h2:first-child,.pdbody>section>h3:first-child,.pdbody .revise>h3:first-child{display:none}
.pdbody .note{margin:12px 0}.pdbody .revise{border:0;padding:0;background:none;box-shadow:none}
body.pdlock{overflow:hidden}
.pdbody>.sheet{border:0;box-shadow:none;background:none;padding-left:0;padding-right:0}.pdbody>.sheet>.label:first-child{display:none}
.settitle{margin:2px 2px 12px;font-size:26px}
`;document.head.appendChild(st);
})();
