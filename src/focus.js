/* ===== v2.8 workout flow: one exercise at a time once a workout starts, and supersets =====
   Supersets: r.ss = {"Mon": [["slug-a","slug-b"], ...]} (per weekday, every week). 2 = superset, 3 = tri-set, 4 = giant set.
   During a running workout (F2C_wkActive().k is this week and day) only the current step shows; a step is one exercise or one superset.
   Step index lives in the active-workout record (A.step); "See all" sets A.showAll. Inside a superset the rest after a set is 10 s
   until the last exercise of the group, then the normal rest. */
(function(){
const e_=s=>esc(s==null?"":String(s));
const R=()=>window.F2C_T&&F2C_T.rec&&F2C_T.rec();
const SL=s=>(window.F2C_T&&F2C_T.slug?F2C_T.slug(s):String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40));
const SW=x=>x;
const NAMES={2:"Superset",3:"Tri-set",4:"Giant set"};
function groups(day){const r=R();return (r&&r.ss&&r.ss[day])||[]}
function setGroups(day,g){const r=R();if(!r)return;r.ss=r.ss||{};g=g.filter(x=>x.length>1);if(g.length)r.ss[day]=g;else delete r.ss[day];F2C_T.touch()}
function units(slugs,day){const G=groups(day),U=[];let i=0;
 while(i<slugs.length){const g=G.find(g=>g[0]===slugs[i]&&g.every((s,j)=>slugs[i+j]===s));if(g){U.push(g.map((_,j)=>i+j));i+=g.length}else{U.push([i]);i++}}
 return U}
function act(){try{return window.F2C_wkActive?F2C_wkActive():null}catch(e){return null}}
function redraw(){const y=window.scrollY;try{F2C_T.show("workouts")}catch(e){}window.scrollTo(0,y)}
window.F2C_wkDecorate=function(v,XS,w,day){const cards=[...v.querySelectorAll(":scope .excard")];if(!cards.length||cards.length!==XS.length)return;
 const slugs=cards.map((c,i)=>{const k=c.querySelector("[data-k]");const p=k&&k.dataset.k.split("|");return p&&p.length>=3?p[2]:SL(SW(XS[i]).name)}),U=units(slugs,day),r=R(),ro=!!(r&&r.readOnly);let gi=0;
 U.forEach(u=>{if(u.length<2)return;const L="ABCDEFGH"[gi++]||"",nm=NAMES[u.length];
  u.forEach((ix,j)=>{const c=cards[ix];c.classList.add("ssg");if(j>0)c.classList.add("ssnext");if(j<u.length-1)c.classList.add("ssprev");
   c.insertAdjacentHTML("afterbegin",`<div class="sstag"><span class="sschip">${L}${j+1}</span><div><b>${nm} ${L} · ${j+1} of ${u.length}</b><small>${j<u.length-1?`Do a set, then go straight to ${L}${j+2}`:`Then rest and start the next round at ${L}1`}</small></div>${j===0&&!ro?`<button type="button" class="linkbtn small" data-ssun="${ix}">Unlink</button>`:""}</div>`)})});
 if(!ro)cards.forEach((c,ix)=>{if(ix===cards.length-1)return;const a=U.find(u=>u.includes(ix)),b=U.find(u=>u.includes(ix+1));if(a===b||a[a.length-1]!==ix||a.length+b.length>4)return;
  c.insertAdjacentHTML("beforeend",`<button type="button" class="sslink" data-sslink="${ix}"><svg viewBox="0 0 24 24" class="wic"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>${a.length===1?"Superset":"Add to "+NAMES[a.length].toLowerCase()} with ${e_(SW(XS[ix+1]).name)}</button>`)});
 v._ws={XS,slugs,U,w,day,cards};focus(v)};
function focus(v){const S=v._ws;if(!S)return;const A=act(),mine=A&&A.k===`w${S.w}|${S.day}`,on=!!(mine&&!A.showAll);
 v.classList.toggle("wkfocus",on);v.querySelectorAll(".wkstep,.wknav").forEach(x=>x.remove());S.cards.forEach(c=>c.classList.remove("wkhide","wkcur"));
 if(!mine)return;const n=S.U.length,i=Math.max(0,Math.min(n-1,A.step||0)),u=S.U[i];
 const names=u.map(ix=>SW(S.XS[ix]).name),label=u.length>1?`${NAMES[u.length]}: ${names.join(" + ")}`:names[0];
 const top=`<div class="wkstep"><div class="wkstepTop"><b>${on?`Exercise ${i+1} of ${n}`:"All exercises"}</b><button type="button" class="linkbtn small" data-wkall>${on?"See all":"One at a time"}</button></div>${on?`<div class="wkprog"><i style="width:${Math.round(i/n*100)}%"></i></div><span class="wksteplabel">${e_(label)}</span>`:""}</div>`;
 if(!on){S.cards[0].insertAdjacentHTML("beforebegin",top);return}
 S.cards.forEach((c,ix)=>c.classList.add(u.includes(ix)?"wkcur":"wkhide"));
 S.cards[u[0]].insertAdjacentHTML("beforebegin",top);
 const nx=i<n-1?SW(S.XS[S.U[i+1][0]]).name:"";
 S.cards[u[u.length-1]].insertAdjacentHTML("afterend",`<div class="wknav"><button type="button" class="btn" data-wkprev ${i===0?"disabled":""}>‹ Back</button><button type="button" class="btn primary" data-wknext>${i===n-1?"Finish workout":"Next ›"}</button>${nx?`<small>Up next: ${e_(nx)}</small>`:""}</div>`);
 ready(v)}
function ready(v){const S=v._ws;if(!S||!v.classList.contains("wkfocus"))return;const boxes=[...v.querySelectorAll(".excard.wkcur [data-f='done']")],b=v.querySelector("[data-wknext]");
 if(!b)return;const done=boxes.length&&boxes.every(x=>x.checked);b.classList.toggle("ready",!!done);
 const last=b.textContent.indexOf("Finish")>=0;b.textContent=done?(last?"All sets done · Finish workout":"All sets done · Next ›"):(last?"Finish workout":"Next ›")}
function go(v,d){const A=act();if(!A)return;const n=v._ws.U.length;A.step=Math.max(0,Math.min(n-1,(A.step||0)+d));window.F2C_wkSaveActive&&F2C_wkSaveActive();focus(v);
 const t=v.querySelector(".wkstep");if(t)window.scrollTo({top:t.getBoundingClientRect().top+window.scrollY-70,behavior:"smooth"})}
document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-wknext],[data-wkprev],[data-wkall],[data-sslink],[data-ssun]");if(!t)return;const v=document.getElementById("v-workouts");if(!v||!v._ws)return;const S=v._ws;
 if(t.dataset.wknext!=null){const A=act();if(A&&(A.step||0)>=S.U.length-1){window.F2C_wkFinish&&F2C_wkFinish();return}go(v,1);return}
 if(t.dataset.wkprev!=null){go(v,-1);return}
 if(t.dataset.wkall!=null){const A=act();if(!A)return;A.showAll=!A.showAll;window.F2C_wkSaveActive&&F2C_wkSaveActive();focus(v);return}
 if(t.dataset.sslink!=null){const ix=+t.dataset.sslink,a=S.U.find(u=>u.includes(ix)),b=S.U.find(u=>u.includes(ix+1));if(!a||!b)return;
  const mine=new Set(a.concat(b).map(k=>S.slugs[k]));const G=groups(S.day).filter(g=>!g.some(s=>mine.has(s)));G.push(a.concat(b).map(k=>S.slugs[k]));setGroups(S.day,G);redraw();return}
 if(t.dataset.ssun!=null){const s=S.slugs[+t.dataset.ssun];setGroups(S.day,groups(S.day).filter(g=>!g.includes(s)));redraw();return}});
document.addEventListener("change",e=>{if(e.target&&e.target.dataset&&e.target.dataset.f==="done"){const v=document.getElementById("v-workouts");if(v)setTimeout(()=>ready(v),0)}});
window.F2C_wkFocusCard=function(s){const v=document.getElementById("v-workouts"),A=act();if(!v||!v._ws||!A||!s)return;const ix=v._ws.slugs.indexOf(s);if(ix<0)return;
 A.step=Math.max(0,v._ws.U.findIndex(u=>u.includes(ix)));window.F2C_wkSaveActive&&F2C_wkSaveActive();focus(v)};
window.F2C_ssRest=function(k){const p=String(k||"").split("|");if(p.length<3)return null;const g=groups(p[1]).find(g=>g.includes(p[2]));if(!g)return null;return g.indexOf(p[2])<g.length-1?10:null};
const css=document.createElement("style");css.textContent=`
#v-workouts .excard{background:var(--card);border:1px solid var(--line);border-radius:18px;box-shadow:0 1px 2px rgba(0,0,0,.06),0 8px 22px rgba(0,0,0,.10);margin:14px 0;position:relative}
html.dark #v-workouts .excard{box-shadow:0 1px 0 rgba(255,255,255,.05) inset,0 10px 26px rgba(0,0,0,.38)}
#v-workouts .excard:not(.ssg)::before{content:"";position:absolute;left:0;top:16px;bottom:16px;width:4px;border-radius:0 4px 4px 0;background:var(--accent);opacity:.85}
#v-workouts .excard.ssg{border-left:5px solid var(--accent)}#v-workouts .excard.ssprev{margin-bottom:4px;border-bottom-left-radius:6px;border-bottom-right-radius:6px}#v-workouts .excard.ssnext{margin-top:4px;border-top-left-radius:6px;border-top-right-radius:6px}
.sstag{display:flex;align-items:center;gap:10px;background:var(--accent-soft);border-radius:12px;padding:8px 10px}.sstag>div{flex:1;display:flex;flex-direction:column;min-width:0}.sstag b{font-size:.85rem}.sstag small{font-size:.75rem;color:var(--muted)}
.sschip{background:var(--accent);color:var(--accent-ink,#fff);font-weight:900;border-radius:8px;padding:4px 8px;font-size:.8rem}
.sslink{display:flex;align-items:center;gap:8px;justify-content:center;width:100%;border:1px dashed var(--line);background:none;color:var(--accent);font:inherit;font-weight:700;font-size:.85rem;border-radius:12px;padding:9px;cursor:pointer}.sslink .wic{width:18px;height:18px;margin:0;stroke:currentColor}
.wkfocus .excard.wkhide,.wkfocus .addbox,.wkfocus .sugbox,.wkfocus .wherebox,.wkfocus .daychips,.wkfocus .sslink{display:none!important}
.wkstep{position:sticky;top:56px;z-index:5;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:10px 12px;margin:12px 0 4px;box-shadow:0 6px 16px rgba(0,0,0,.12);display:grid;gap:6px}
.wkstepTop{display:flex;justify-content:space-between;align-items:center}.wkstepTop b{font-size:.95rem}.wksteplabel{font-size:.8rem;color:var(--muted)}
.wkprog{height:6px;border-radius:6px;background:var(--wd-tile2,rgba(127,127,127,.2));overflow:hidden}.wkprog i{display:block;height:100%;background:var(--accent);border-radius:6px;transition:width .3s}
.wknav{display:grid;grid-template-columns:1fr 2fr;gap:10px;margin:12px 0 90px}.wknav .btn{padding:14px;font-size:1rem;border-radius:14px;justify-content:center}.wknav small{grid-column:1/-1;text-align:center;color:var(--muted)}
.wknav .ready{animation:wkpulse 1.4s ease-in-out infinite}@keyframes wkpulse{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--accent) 45%,transparent)}50%{box-shadow:0 0 0 8px transparent}}`;
document.head.appendChild(css);
})();
