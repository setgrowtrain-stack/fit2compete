/* ===== v2.7 exercise library: 876 exercises from Free Exercise DB (public domain, github.com/yuhonas/free-exercise-db) =====
   Search, filter by muscle / equipment / type, pick several, add them to the day. Photos and steps per exercise;
   the "how to" video uses the same video links as the exercise cards (F2C_videos). Data loads only when the library opens. */
(function(){
const e_=s=>esc(s==null?"":String(s));
let LIB=null,loading=null;
const L={q:"",mus:"",eq:"",cat:"",sel:[],detail:null,shown:60,scope:"all"};
const IMG=(id,k)=>`lib/img/${encodeURIComponent(id)}/${k}.jpg`;
const MUS=[["chest","Chest"],["shoulders","Shoulders"],["triceps","Triceps"],["biceps","Biceps"],["forearms","Forearms"],["lats","Lats"],["middle back","Middle back"],["lower back","Lower back"],["traps","Traps"],["neck","Neck"],["abdominals","Abs"],["quadriceps","Quads"],["hamstrings","Hamstrings"],["glutes","Glutes"],["calves","Calves"],["adductors","Adductors"],["abductors","Abductors"]];
const EQ=[["barbell","Barbell"],["dumbbell","Dumbbell"],["cable","Cable"],["machine","Machine"],["body only","Bodyweight"],["kettlebells","Kettlebell"],["bands","Bands"],["e-z curl bar","EZ bar"],["medicine ball","Medicine ball"],["exercise ball","Exercise ball"],["foam roll","Foam roller"],["other","Other"]];
const CAT=[["strength","Strength"],["stretching","Stretching"],["plyometrics","Plyometrics"],["cardio","Cardio"],["powerlifting","Powerlifting"],["olympic weightlifting","Olympic lifting"],["strongman","Strongman"]];
const lbl=(arr,v)=>(arr.find(x=>x[0]===v)||[,v])[1];
const cap=s=>s?s[0].toUpperCase()+s.slice(1):"";
function load(){if(LIB)return Promise.resolve(LIB);if(!loading)loading=fetch("lib/exercises.json").then(r=>{if(!r.ok)throw new Error("lib "+r.status);return r.json()}).then(d=>{LIB=d;return d}).catch(e=>{loading=null;throw e});return loading}
const norm=s=>String(s||"").toLowerCase().replace(/[^a-z0-9 ]+/g," ").replace(/\s+/g," ").trim();
function results(){const words=norm(L.q).split(" ").filter(Boolean);
 let r=LIB.filter(x=>(!L.mus||x.p.includes(L.mus)||(L.mus&&x.s.includes(L.mus)&&false))&&(!L.eq||x.e===L.eq)&&(!L.cat||x.c===L.cat));
 if(words.length){r=r.map(x=>{const n=norm(x.n),hay=n+" "+x.e+" "+x.p.join(" ")+" "+x.s.join(" ");if(!words.every(w=>hay.includes(w)))return null;
   let sc=0;words.forEach(w=>{if(n.split(" ").includes(w))sc+=3;else if(n.includes(w))sc+=2;else sc+=0.5});
   if(/\b(chains?|bands?|powerlifting|board|reverse band|guillotine|speed|isometric)\b/.test(n))sc-=2;if(/medium grip|^barbell |^dumbbell /.test(n))sc+=1;return [sc,x]}).filter(Boolean).sort((a,b)=>b[0]-a[0]||a[1].n.length-b[1].n.length).map(a=>a[1])}
 return r}
function defaults(x){if(x.c==="stretching")return {sets:2,reps:"30 s",rest:"15 s"};if(x.c==="cardio")return {sets:1,reps:"10 min",rest:""};if(x.c==="plyometrics")return {sets:3,reps:"8",rest:"60 s"};
 if(x.c==="powerlifting"||x.c==="olympic weightlifting"||x.c==="strongman")return {sets:4,reps:"5",rest:"2 min"};return {sets:3,reps:"10",rest:x.m==="compound"?"2 min":"90 s"}}
function vid(x){try{return window.F2C_videos?F2C_videos.videoFor(x.n):null}catch(e){return null}}
function day(){try{return (window.F2C_T&&F2C_T.ui&&F2C_T.ui.day)||"today"}catch(e){return "today"}}
function sel(){return document.getElementById("libSheet")}
function rowHtml(x){const on=L.sel.includes(x.i);
 return `<div class="librow${on?" on":""}" data-libdetail="${e_(x.i)}" role="button" tabindex="0"><img src="${IMG(x.i,0)}" alt="" loading="lazy" width="64" height="64">
  <div class="libtxt"><b>${e_(x.n)}</b><span>${e_(x.p.map(cap).join(", "))}${x.e&&x.e!=="other"?" · "+e_(lbl(EQ,x.e)):""}</span></div>
  <button type="button" class="libchk" data-libpick="${e_(x.i)}" aria-pressed="${on}" aria-label="${on?"Remove":"Pick"} ${e_(x.n)}">${on?"✓":""}</button></div>`}
function listHtml(){const r=results(),show=r.slice(0,L.shown);
 const opt=(arr,v,all)=>`<option value="">${all}</option>`+arr.map(([k,l])=>`<option value="${e_(k)}"${k===v?" selected":""}>${e_(l)}</option>`).join("");
 return `<div class="libtop"><button type="button" class="wdback" data-libclose aria-label="Close">‹</button><b>ADD EXERCISES</b><span></span></div>
  <div class="libsearch"><svg viewBox="0 0 24 24" class="wic"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg><input id="libQ" type="search" placeholder="Search exercise name" value="${e_(L.q)}" autocomplete="off" enterkeyhint="search"></div>
  <div class="libfilters"><label><span class="sr">Muscle</span><select data-libf="mus" class="${L.mus?"on":""}">${opt(MUS,L.mus,"All muscles")}</select></label>
   <label><span class="sr">Equipment</span><select data-libf="eq" class="${L.eq?"on":""}">${opt(EQ,L.eq,"All equipment")}</select></label>
   <label><span class="sr">Type</span><select data-libf="cat" class="${L.cat?"on":""}">${opt(CAT,L.cat,"All types")}</select></label></div>
  <div class="libcount"><b>${L.q||L.mus||L.eq||L.cat?"Matches":"All exercises"}</b><span>${r.length} found</span>${L.q||L.mus||L.eq||L.cat?`<button type="button" class="linkbtn small" data-libclear>Clear</button>`:""}</div>
  <div class="liblist">${show.map(rowHtml).join("")||`<p class="dnote">Nothing matches. Try fewer words, or clear a filter.</p>`}${r.length>show.length?`<button type="button" class="btn small libmore" data-libmore>Show more (${r.length-show.length} left)</button>`:""}</div>
  <p class="dnote">Exercises, photos and steps from Free Exercise DB (public domain). Videos open on YouTube.</p>
  ${barHtml()}`}
function barHtml(){const n=L.sel.length;return `<div class="libbar${n?" on":""}"><div class="libscope"><label><input type="radio" name="libscope" value="all" ${L.scope==="all"?"checked":""}> Every ${e_(day())}</label><label><input type="radio" name="libscope" value="wk" ${L.scope==="wk"?"checked":""}> Just this week</label></div>
  <button type="button" class="btn primary libadd" data-libadd ${n?"":"disabled"}>Add ${n} exercise${n===1?"":"s"}</button></div>`}
function detailHtml(x){const v=vid(x),d=defaults(x),on=L.sel.includes(x.i);
 return `<div class="libtop"><button type="button" class="wdback" data-libback aria-label="Back">‹</button><b>${e_(x.n.toUpperCase())}</b><span></span></div>
  <div class="libanim${x.g>1?" two":""}"><img src="${IMG(x.i,0)}" alt="${e_(x.n)}, start position">${x.g>1?`<img src="${IMG(x.i,1)}" alt="${e_(x.n)}, end position">`:""}</div>
  ${x.g>1?`<p class="dnote center">Start and end position, shown back and forth.</p>`:""}
  <div class="libact">${v?`<a class="btn libvid" href="${e_(v.url)}" target="_blank" rel="noopener">▶ ${v.exact?"Watch how":"Find a video"}</a>`:""}<button type="button" class="btn ${on?"":"primary"}" data-libpick="${e_(x.i)}">${on?"✓ Picked":"Pick this one"}</button></div>
  <div class="libtags">${x.p.map(m=>`<span class="pm">${e_(cap(m))}</span>`).join("")}${x.s.map(m=>`<span>${e_(cap(m))}</span>`).join("")}</div>
  <div class="dstats">${[["Equipment",lbl(EQ,x.e)],["Type",lbl(CAT,x.c)],["Level",cap(x.l)],["Movement",[cap(x.m),x.f?cap(x.f):""].filter(Boolean).join(" · ")],["Starting point",`${d.sets} × ${d.reps}${d.rest?" · rest "+d.rest:""}`]].filter(r=>r[1]).map(([a,b])=>`<div class="dstat"><div><b>${e_(b)}</b><span>${e_(a)}</span></div></div>`).join("")}</div>
  <h4 class="dsect">How to do it</h4><ol class="libsteps">${x.t.map(s=>`<li>${e_(s)}</li>`).join("")}</ol>
  <p class="dnote">Main muscles are highlighted; the others help. You can change sets, reps and rest on the exercise card after adding it.</p>
  ${barHtml()}`}
function draw(keepScroll){let o=sel();if(!o){o=document.createElement("div");o.id="libSheet";o.setAttribute("role","dialog");o.setAttribute("aria-modal","true");document.body.appendChild(o);history.pushState({lib:1},"")}
 document.body.classList.add("wdopen");
 if(!LIB){o.innerHTML=`<div class="libtop"><button type="button" class="wdback" data-libclose aria-label="Close">‹</button><b>ADD EXERCISES</b><span></span></div><p class="dnote center">Loading 876 exercises…</p>`;
  load().then(()=>draw()).catch(()=>{o.innerHTML=`<div class="libtop"><button type="button" class="wdback" data-libclose>‹</button><b>ADD EXERCISES</b><span></span></div><p class="dnote center">Couldn't load the library. Check your connection and try again.</p>`});return}
 const y=o.scrollTop;const x=L.detail&&LIB.find(z=>z.i===L.detail);
 const caret=document.activeElement&&document.activeElement.id==="libQ"?document.activeElement.selectionStart:null;
 o.innerHTML=x?detailHtml(x):listHtml();o.scrollTop=keepScroll?y:0;
 if(caret!=null){const q=document.getElementById("libQ");if(q){q.focus();try{q.setSelectionRange(caret,caret)}catch(e){}}}
 if(x&&x.g>1){const box=o.querySelector(".libanim");clearInterval(draw._t);draw._t=setInterval(()=>{if(!document.body.contains(box)){clearInterval(draw._t);return}box.classList.toggle("flip")},900)}}
function close(fromPop){clearInterval(draw._t);const o=sel();if(o)o.remove();if(!document.getElementById("wdSheet"))document.body.classList.remove("wdopen");if(!fromPop&&history.state&&history.state.lib)history.back()}
function addPicked(){const add=window.F2C_addEx;if(!add||!LIB)return;const n=L.sel.length;
 L.sel.map(i=>LIB.find(x=>x.i===i)).filter(Boolean).forEach(x=>{const d=defaults(x);add({name:x.n,sets:d.sets,reps:d.reps,rest:d.rest,notes:"",lib:x.i},L.scope)});
 L.sel=[];L.detail=null;close();
 const t=document.createElement("div");t.className="libtoast";t.textContent=`Added ${n} exercise${n===1?"":"s"}${L.scope==="all"?" to every "+day():" for this week"}.`;document.body.appendChild(t);setTimeout(()=>t.remove(),2600)}
window.F2C_libOpen=()=>{L.detail=null;L.shown=60;draw()};
window.F2C_libThumb=function(ex){if(!ex||!ex.lib)return "";return `<button type="button" class="libthumb" data-libshow="${e_(ex.lib)}" aria-label="Photos and steps for ${e_(ex.name)}"><img src="${IMG(ex.lib,0)}" alt="" loading="lazy" width="56" height="56"></button>`};
document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-libopen],[data-libshow],[data-libclose],[data-libback],[data-libpick],[data-libdetail],[data-libmore],[data-libadd],[data-libclear]");if(!t)return;
 if(t.dataset.libopen!=null){e.preventDefault();window.F2C_libOpen();return}
 if(t.dataset.libshow){e.preventDefault();L.detail=t.dataset.libshow;L.fromCard=true;draw();return}
 if(t.dataset.libclose!=null){close();return}
 if(t.dataset.libback!=null){if(L.fromCard){L.fromCard=false;close();return}L.detail=null;draw();const o=sel();if(o&&L.listY)o.scrollTop=L.listY;return}
 if(t.dataset.libpick){e.stopPropagation();const i=t.dataset.libpick;L.sel=L.sel.includes(i)?L.sel.filter(z=>z!==i):L.sel.concat(i);draw(true);return}
 if(t.dataset.libdetail){const o=sel();L.listY=o?o.scrollTop:0;L.detail=t.dataset.libdetail;L.fromCard=false;draw();return}
 if(t.dataset.libmore!=null){L.shown+=80;draw(true);return}
 if(t.dataset.libclear!=null){L.q="";L.mus="";L.eq="";L.cat="";L.shown=60;draw();return}
 if(t.dataset.libadd!=null){addPicked();return}});
document.addEventListener("input",e=>{if(e.target&&e.target.id==="libQ"){L.q=e.target.value;L.shown=60;clearTimeout(draw._q);draw._q=setTimeout(()=>draw(),120)}});
document.addEventListener("change",e=>{const t=e.target;if(!t||!sel()||!sel().contains(t))return;
 if(t.dataset&&t.dataset.libf){L[t.dataset.libf]=t.value;L.shown=60;draw();return}
 if(t.name==="libscope"){L.scope=t.value}});
document.addEventListener("keydown",e=>{if(!sel())return;if(e.key==="Escape"){if(L.detail&&!L.fromCard){L.detail=null;draw()}else close()}
 if((e.key==="Enter"||e.key===" ")&&e.target&&e.target.dataset&&e.target.dataset.libdetail){e.preventDefault();e.target.click()}});
window.addEventListener("popstate",()=>{if(sel())close(true)});
const css=document.createElement("style");css.textContent=`
#libSheet{position:fixed;inset:0;z-index:9999;background:var(--bg);color:var(--ink);overflow-y:auto;-webkit-overflow-scrolling:touch;padding:max(10px,env(safe-area-inset-top)) 16px calc(110px + env(safe-area-inset-bottom));animation:wdin .18s ease-out}
#libSheet>*{max-width:640px;margin-left:auto;margin-right:auto}
.libtop{display:grid;grid-template-columns:44px 1fr 44px;align-items:center;text-align:center}.libtop b{letter-spacing:.12em;font-size:.88rem;line-height:1.3}
.libsearch{display:flex;align-items:center;gap:8px;background:var(--card);border-radius:16px;padding:0 14px;margin-top:12px}.libsearch .wic{width:20px;height:20px;color:var(--muted);flex:none}
.libsearch input{flex:1;min-width:0;border:0;background:none;color:var(--ink);font-size:1rem;padding:14px 0;outline:none}
.libfilters{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px}.libfilters select{width:100%;appearance:none;-webkit-appearance:none;background:var(--bg);color:var(--ink);border:1px solid var(--wd-tile2);border-radius:12px;padding:10px 8px;font-weight:700;font-size:.8rem}
.libfilters select.on{border-color:var(--accent);color:var(--ink);background:var(--accent-soft)}
.libcount{display:flex;align-items:baseline;gap:8px;margin:14px 0 6px}.libcount b{font-size:1rem}.libcount span{color:var(--muted);font-size:.85rem;flex:1}
.liblist{display:grid;gap:2px}.librow{display:grid;grid-template-columns:64px minmax(0,1fr) 40px;gap:12px;align-items:center;padding:8px 4px;border-radius:14px;cursor:pointer}.librow:active{background:var(--wd-tile)}.librow.on{background:var(--accent-soft)}
.librow img{width:64px;height:64px;object-fit:cover;border-radius:12px;background:#e9ecef}.libtxt{display:flex;flex-direction:column;min-width:0}.libtxt b{font-size:.98rem;line-height:1.25}.libtxt span{font-size:.8rem;color:var(--muted);margin-top:2px}
.libchk{width:32px;height:32px;border-radius:9px;border:2px solid var(--wd-line2);background:none;color:var(--ink);font-weight:900;font-size:1rem;cursor:pointer;justify-self:center}.libchk[aria-pressed="true"]{background:var(--accent);border-color:var(--accent)}
.libmore{margin:10px auto;display:block}
.libbar{position:fixed;left:0;right:0;bottom:0;padding:10px 16px calc(12px + env(safe-area-inset-bottom));background:linear-gradient(transparent,var(--bg) 22%);display:grid;gap:8px;max-width:672px!important;transform:translateY(110%);transition:transform .18s}.libbar.on{transform:none}
.libscope{display:flex;gap:16px;justify-content:center;font-size:.82rem;color:var(--ink)}.libadd{width:100%;padding:14px;font-size:1rem;border-radius:16px}
.libanim{position:relative;background:#fff;border-radius:18px;overflow:hidden;margin-top:12px;aspect-ratio:4/3}.libanim img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;transition:opacity .35s}
.libanim.two img:nth-child(2){opacity:0}.libanim.two.flip img:nth-child(2){opacity:1}.libanim.two.flip img:nth-child(1){opacity:0}
.center{text-align:center}.libact{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.libact .btn{text-align:center;justify-content:center;padding:12px;border-radius:14px}.libvid{background:#ff0033!important;color:#fff!important;border-color:#ff0033!important;text-decoration:none}
.libtags{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}.libtags span{font-size:.75rem;font-weight:700;padding:5px 10px;border-radius:999px;background:var(--wd-tile);color:var(--muted)}.libtags .pm{background:var(--accent);color:var(--ink)}
.libsteps{margin:0;padding-left:20px;display:grid;gap:8px;line-height:1.5;color:var(--ink)}
.libthumb{border:0;padding:0;background:#e9ecef;border-radius:12px;overflow:hidden;width:56px;height:56px;flex:none;cursor:pointer;margin-right:10px}.libthumb img{width:100%;height:100%;object-fit:cover;display:block}
.exhead:has(.libthumb){align-items:flex-start}
.libtoast{position:fixed;left:50%;bottom:calc(84px + env(safe-area-inset-bottom));transform:translateX(-50%);background:var(--bg);color:var(--ink);padding:10px 16px;border-radius:999px;font-weight:700;font-size:.85rem;z-index:10000;box-shadow:0 8px 24px rgba(0,0,0,.3)}
.libopenbtn{display:flex;align-items:center;gap:10px;width:100%;text-align:left;border:1px solid var(--line,#d6dde5);background:var(--card,var(--ink));border-radius:14px;padding:12px 14px;cursor:pointer;color:inherit;font:inherit}
.libopenbtn b{display:block}.libopenbtn span{font-size:.8rem;color:var(--muted,#64748b)}.libopenbtn .wic{width:22px;height:22px;flex:none}`;
document.head.appendChild(css);
})();
