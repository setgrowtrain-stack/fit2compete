/* ===== Workout timer, rest countdown with beeps, extra sets, added exercises, coach suggestions ===== */
(function(){
const T=()=>window.F2C_T,$=id=>document.getElementById(id);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const R=()=>T().rec();
const mmss=s=>{s=Math.max(0,Math.round(s));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return (h?h+":"+String(m).padStart(2,"0"):m)+":"+String(x).padStart(2,"0")};
function redraw(){const y=scrollY;try{T().show("workouts")}catch(e){}requestAnimationFrame(()=>scrollTo(0,y))}

/* ---------- rest time: the plan's rest if written, else by exercise type ---------- */
window.F2C_restSec=function(name,rest){const r=String(rest||"").toLowerCase();let m;
 if((m=r.match(/(\d+(?:\.\d+)?)\s*(?:-|to|–)\s*(\d+(?:\.\d+)?)\s*(min|m\b|minutes?)/)))return Math.round((+m[1]+ +m[2])/2*60);
 if((m=r.match(/(\d+(?:\.\d+)?)\s*(?:-|to|–)\s*(\d+)\s*(s|sec|seconds?)?/))&&!/min/.test(r))return Math.round((+m[1]+ +m[2])/2);
 if((m=r.match(/(\d+(?:\.\d+)?)\s*(min|m\b|minutes?)/)))return Math.round(+m[1]*60);
 if((m=r.match(/(\d+)\s*(s|sec|seconds?)\b/)))return +m[1];
 if((m=r.match(/^\s*(\d+(?:\.\d+)?)\s*$/)))return +m[1]<=10?Math.round(+m[1]*60):+m[1];
 const n=String(name||"").toLowerCase(),k=window.F2C_exKind?F2C_exKind({name}):"load";
 if(k==="stretch"||k==="timed")return 30;
 if(/squat|deadlift|\brdl\b|bench|overhead press|military|leg press|hip thrust|clean|barbell row|pendlay|t.?bar|pull.?up|chin.?up|\bdip/.test(n))return 150;
 if(k==="bw")return 75;
 return 90};

/* ---------- extra sets and added exercises ---------- */
window.F2C_extra=(w,day,s)=>((R().extraSets||{})[`w${w}|${day}|${s}`])||0;
window.F2C_added=function(w,day){const a=R().addEx||{};
 return [...((a.all||{})[day]||[]).map(x=>Object.assign({},x,{added:"all"})),...((a.wk||{})[`w${w}|${day}`]||[]).map(x=>Object.assign({},x,{added:"wk"}))]};
window.F2C_setBtns=function(w,day,s,ex){const n=F2C_extra(w,day,s);
 return `<div class="setbtns"><button type="button" class="linkbtn small" data-addset="${esc(s)}">+ Add a set</button>${n>0?`<button type="button" class="linkbtn small" data-rmset="${esc(s)}">− Remove the added set</button>`:""}${ex.added?`<button type="button" class="linkbtn small danger" data-rmex="${esc(ex.addId)}" data-scope="${ex.added}">Remove this exercise</button><span class="muted small">${ex.added==="all"?"Added every week":"Added this week"}${ex.why?" · "+esc(ex.why):""}</span>`:""}</div>`};

/* ---------- the workout session for a day ---------- */
const key=(w,day)=>`w${w}|${day}`;
function S(){const r=R();r.wk=r.wk||{};return r.wk}
let ACTIVE=null; // {k, start} mirrored in rec.wk[k]
function load(){try{const a=JSON.parse(localStorage.getItem("f2c_active")||"null");if(a&&R()&&S()[a.k]&&!S()[a.k].end)ACTIVE=a;else ACTIVE=null}catch(e){ACTIVE=null}}
function saveActive(){try{ACTIVE?localStorage.setItem("f2c_active",JSON.stringify(ACTIVE)):localStorage.removeItem("f2c_active")}catch(e){}}
window.F2C_wkStart=function(w,day){if(!R())return "";load();const k=key(w,day),s=S()[k];
 if(s&&s.end)return `<div class="wkdone"><b>Workout time ${mmss(s.sec)}</b><span class="muted small">${s.sets||0} sets${s.lb?" · "+Math.round(s.lb).toLocaleString("en-US")+" lb lifted":""}${s.avgRest?" · average rest "+mmss(s.avgRest):""}</span><button type="button" class="linkbtn small" data-wkreset="${k}">Start over</button></div>`;
 if(ACTIVE&&ACTIVE.k===k)return `<div class="wkdone run"><b>Workout running</b><span class="muted small">The timer is at the bottom of the screen. Check off each set when you finish it and your rest starts on its own.</span></div>`;
 if(ACTIVE)return `<p class="muted small">Another workout is running (${esc(ACTIVE.k.replace("|"," · ").replace(/^w/,"Week "))}). Finish it first.</p>`;
 return `<button type="button" class="btn primary wkgo" data-wkstart="${k}">▶ Start workout</button><p class="muted small">Times the whole workout and each set, and counts down your rest after every set you check off.</p>`};

/* ---------- sound ---------- */
let AC=null;function audio(){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==="suspended")AC.resume()}catch(e){}return AC}
function beep(freq,dur,vol){const a=audio();if(!a)return;const o=a.createOscillator(),g=a.createGain();o.type="square";o.frequency.value=freq;o.connect(g);g.connect(a.destination);
 const t=a.currentTime;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+0.01);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.start(t);o.stop(t+dur+0.02)}
let wake=null;async function keepAwake(on){try{if(on&&!wake&&navigator.wakeLock)wake=await navigator.wakeLock.request("screen");if(!on&&wake){wake.release();wake=null}}catch(e){}}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&ACTIVE){wake=null;keepAwake(true)}});

/* ---------- rest countdown ---------- */
let WORK=null; // {end,total,key,beeped}
window.F2C_startWork=function(s,sec,btn){audio();if(!ACTIVE){const k=key(T().ui.week,T().ui.day);start(k)}
 const card=btn.closest(".excard"),rows=[...card.querySelectorAll('[data-f="done"]')],next=rows.find(x=>!x.checked);
 REST=null;WORK={end:Date.now()+sec*1000,total:sec,beeped:{},el:next?next.dataset.k:null};beep(660,0.15,0.4);tick()};
let REST=null; // {end, total, beeped:Set}
function startRest(sec){REST={end:Date.now()+sec*1000,total:sec,beeped:{}};tick()}
function endRest(){REST=null;if(ACTIVE){ACTIVE.setStart=Date.now();saveActive()}tick()}
window.F2C_setDone=function(k,checked){if(!ACTIVE||!checked)return;const L=T().LOG(),v=L[k];if(!v)return;const now=Date.now(),info=(window.F2C_KI||{})[k]||{};
 v.sec=Math.round((now-(ACTIVE.setStart||ACTIVE.start))/1000);v.at=now;
 const s=S()[ACTIVE.k];if(s){s.done=(s.done||0)+1;if(ACTIVE.lastRest)s.rests=(s.rests||[]).concat([ACTIVE.lastRest]).slice(-60)}
 T().touch();const sec=F2C_restSec(info.ex,info.rest);ACTIVE.restFor=k;saveActive();startRest(sec);
 const row=document.querySelector(`[data-k="${CSS.escape(k)}"][data-f="done"]`);const sr=row&&row.closest(".setrow");if(sr){let t=sr.querySelector(".settime");if(!t){t=document.createElement("span");t.className="settime";sr.appendChild(t)}t.textContent=mmss(v.sec)}};
function bar(){let b=$("wkbar");if(!ACTIVE){if(b)b.remove();return null}
 if(!b){b=document.createElement("div");b.id="wkbar";b.className="wkbar2";document.body.appendChild(b);
  b.addEventListener("click",e=>{const t=e.target.closest("button");if(!t)return;audio();
   if(t.dataset.r==="skip"){if(REST&&ACTIVE)ACTIVE.lastRest=Math.round((REST.total*1000-(REST.end-Date.now()))/1000);endRest()}
   else if(t.dataset.r==="minus"&&REST){REST.end-=15000;REST.total-=15;tick()}
   else if(t.dataset.r==="plus"&&REST){REST.end+=15000;REST.total+=15;tick()}
   else if(t.dataset.r==="wstop"){WORK=null;tick()}
   else if(t.dataset.r==="finish")finish()})}
 return b}
let iv=null;
function tick(){const b=bar();if(!b){clearInterval(iv);iv=null;return}if(!iv)iv=setInterval(tick,200);
 const el=Math.round((Date.now()-ACTIVE.start)/1000);let rest="";
 if(WORK){const left=(WORK.end-Date.now())/1000,whole=Math.ceil(left);
  for(const n of [3,2,1])if(whole===n&&!WORK.beeped[n]){WORK.beeped[n]=1;beep(880,0.12,0.35);navigator.vibrate&&navigator.vibrate(80)}
  if(left<=0){WORK.beeped[0]=1;beep(1320,0.6,0.9);navigator.vibrate&&navigator.vibrate([200,80,200]);const k=WORK.el;WORK=null;
   const box=k&&document.querySelector(`[data-k="${CSS.escape(k)}"][data-f="done"]`);if(box&&!box.checked){box.checked=true;box.dispatchEvent(new Event("change",{bubbles:true}))}else tick();return}
  const pct=Math.max(0,Math.min(100,100*left/WORK.total));
  const html=`<div class="wktime"><span class="label">Workout</span><b>${mmss(el)}</b></div><div class="rest work"><span class="label">Hard interval</span><b class="${whole<=3?"last":""}">${mmss(left)}</b><div class="restbar"><i style="width:${pct}%"></i></div><button type="button" data-r="wstop">Stop</button></div><button type="button" class="btn small fin" data-r="finish">Finish</button>`;
  if(b._h!==html){b.innerHTML=html;b._h=html}return}
 if(REST){const left=(REST.end-Date.now())/1000,whole=Math.ceil(left);
  for(const n of [3,2,1])if(whole===n&&!REST.beeped[n]){REST.beeped[n]=1;beep(880,0.12,0.35);navigator.vibrate&&navigator.vibrate(80)}
  if(left<=0){if(!REST.beeped[0]){REST.beeped[0]=1;beep(1320,0.6,0.9);navigator.vibrate&&navigator.vibrate([200,80,200])}ACTIVE.lastRest=REST.total;endRest();b.classList.add("go");setTimeout(()=>b.classList.remove("go"),1500);return}
  const pct=Math.max(0,Math.min(100,100*left/REST.total));
  rest=`<div class="rest"><span class="label">Rest</span><b class="${whole<=3?"last":""}">${mmss(left)}</b><div class="restbar"><i style="width:${pct}%"></i></div><button type="button" data-r="minus" aria-label="15 seconds less">−15</button><button type="button" data-r="plus" aria-label="15 seconds more">+15</button><button type="button" data-r="skip">Skip</button></div>`}
 else{const setT=Math.round((Date.now()-(ACTIVE.setStart||ACTIVE.start))/1000);rest=`<div class="rest idle"><span class="label">This set</span><b>${mmss(setT)}</b><span class="muted small">Check off the set when you finish it.</span></div>`}
 const html=`<div class="wktime"><span class="label">Workout</span><b>${mmss(el)}</b></div>${rest}<button type="button" class="btn small fin" data-r="finish">Finish</button>`;
 if(b._h!==html){b.innerHTML=html;b._h=html}}
function start(k){audio();beep(660,0.08,0.2);const now=Date.now();S()[k]={start:now};ACTIVE={k,start:now,setStart:now};saveActive();T().touch();keepAwake(true);tick();redraw()}
function finish(){if(!ACTIVE)return;if(!confirm("Finish this workout?"))return;const s=S()[ACTIVE.k]||{},now=Date.now(),L=T().LOG();
 const keys=Object.keys(L).filter(k=>k.startsWith(ACTIVE.k+"|")&&L[k].done);let lb=0;
 keys.forEach(k=>{const info=(window.F2C_KI||{})[k]||{};lb+=window.F2C_setLoad?F2C_setLoad(info.ex||k.split("|")[2],L[k],info.range):0});
 const rests=s.rests||[];Object.assign(s,{start:ACTIVE.start,end:now,sec:Math.round((now-ACTIVE.start)/1000),sets:keys.length,lb:Math.round(lb),avgRest:rests.length?Math.round(rests.reduce((a,b)=>a+b,0)/rests.length):0});
 S()[ACTIVE.k]=s;ACTIVE=null;REST=null;saveActive();keepAwake(false);T().touch();tick();redraw()}
document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-wkstart],[data-wkreset],[data-addset],[data-rmset],[data-rmex],[data-addex],[data-addsug],[data-sugdone],[data-asksug]");if(!t)return;
 const r=R(),w=T().ui.week,day=T().ui.day;
 if(t.dataset.wkstart){start(t.dataset.wkstart);return}
 if(t.dataset.wkreset){if(confirm("Clear the time for this workout and start over?")){delete S()[t.dataset.wkreset];T().touch();redraw()}return}
 if(t.dataset.addset){r.extraSets=r.extraSets||{};const k=`w${w}|${day}|${t.dataset.addset}`;r.extraSets[k]=(r.extraSets[k]||0)+1;T().touch();redraw();return}
 if(t.dataset.rmset){const k=`w${w}|${day}|${t.dataset.rmset}`;r.extraSets[k]=Math.max(0,(r.extraSets[k]||0)-1);if(!r.extraSets[k])delete r.extraSets[k];T().touch();redraw();return}
 if(t.dataset.rmex){if(!confirm("Remove this exercise?"))return;const a=r.addEx||{},id=t.dataset.rmex;
  if(t.dataset.scope==="all")a.all[day]=(a.all[day]||[]).filter(x=>x.addId!==id);else a.wk[`w${w}|${day}`]=(a.wk[`w${w}|${day}`]||[]).filter(x=>x.addId!==id);T().touch();redraw();return}
 if(t.dataset.addex!=null){const f=t.closest(".addex"),g=n=>(f.querySelector(`[name="${n}"]`)||{}).value||"";const name=g("name").trim();if(!name){f.querySelector('[name="name"]').focus();return}
  addEx({name,sets:+g("sets")||3,reps:g("reps").trim()||"10",rest:g("rest").trim(),notes:""},f.querySelector('[name="scope"]:checked').value);return}
 if(t.dataset.addsug!=null){const q=(window.F2C_X||{}).requests||[];const req=q.find(x=>x.id===t.dataset.req);const ex=req&&req.answer&&(req.answer.exercises||[])[+t.dataset.addsug];if(ex){addEx({name:ex.name,sets:+ex.sets||3,reps:String(ex.reps||"10"),rest:String(ex.rest||""),notes:ex.how||"",why:ex.why||""},t.dataset.scope||"all");t.disabled=true;t.textContent="Added"}return}
 if(t.dataset.sugdone){window.F2C_markApplied&&F2C_markApplied(t.dataset.sugdone);r.sugSeen=(r.sugSeen||[]).concat([t.dataset.sugdone]).slice(-30);T().touch();redraw();return}
 if(t.dataset.asksug!=null){const f=t.closest(".asksug"),txt=f.querySelector("textarea").value.trim(),st=f.querySelector(".status");if(!txt){f.querySelector("textarea").focus();return}
  st.textContent="Sending…";askSug(txt,w,day).then(()=>{st.textContent="Sent to your coach.";redraw()}).catch(e=>{st.textContent=e&&e.code==="read_only"?"Only the athlete or parent can ask.":"Couldn't send. Try again."})}},true);
window.F2C_addEx=(ex,scope)=>addEx(ex,scope);
function addEx(ex,scope){const r=R(),w=T().ui.week,day=T().ui.day;r.addEx=r.addEx||{all:{},wk:{}};r.addEx.all=r.addEx.all||{};r.addEx.wk=r.addEx.wk||{};
 ex.addId="x"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);if(scope==="all")(r.addEx.all[day]=r.addEx.all[day]||[]).push(ex);else (r.addEx.wk[`w${w}|${day}`]=r.addEx.wk[`w${w}|${day}`]||[]).push(ex);T().touch();redraw()}

/* ---------- ask the coach what to add ---------- */
async function askSug(goal,w,day){const r=R(),a=r.a||{},d=T().dayPlan(day),p=r.plan||{};
 const today=((d&&d.exercises)||[]).map(x=>`${x.name} ${x.sets}x${x.reps}`).join("; ")||"rest day";
 const week=(p.days||[]).map(x=>`${x.day||x.title}: ${(x.exercises||[]).map(e=>e.name).join(", ")}`).join("\n").slice(0,2500);
 const prompt=`An athlete wants to add something to their training. Suggest 1 to 3 exercises they can add.
WHAT THEY WANT TO WORK ON: ${goal}
DAY: ${day}, week ${w}. TODAY'S PLAN: ${today}
THEIR WEEK:\n${week}
ATHLETE: age ${a.age||"?"}, sex ${a.sex||"?"}, goals ${a.goals||a.goal||"?"}, equipment ${a.equipment||"?"}, injuries ${a.injuries||"none listed"}, phase ${T().phaseOf(w)||"?"}.
Pick moves that fit their equipment and injuries, don't wreck recovery for the rest of the week, and match the goal (for VO2 max: intervals such as 4 x 4 min hard / 3 min easy, or Zone 2). Say how hard to go in plain words.
Reply with ONLY JSON: {"exercises":[{"name":"short exercise name (put the machine in the name, e.g. Rowing machine intervals)","sets":n,"reps":"reps, or time like 4 min","rest":"rest between sets, e.g. 90 s or 3 min","how":"one line: how to do it and how hard","why":"one short line tied to their goal","when":"which day or days to do it"}],"note":"one or two sentences of advice"}`;
 return F2C_submit("question",prompt,{meta:{kind:"suggest",goal:goal.slice(0,200),day,w}})}

/* ---------- add-exercise tools under the day ---------- */
const COMMON=["Rowing machine intervals","Rowing machine steady (Zone 2)","Assault bike intervals","Incline treadmill walk","Stair climber","Jump rope","Sled push","Farmer's carry","Dumbbell bench press","Incline dumbbell press","Cable row","Lat pulldown","Pull-up","Push-up","Dumbbell curl","Cable triceps pushdown","Lateral raise","Face pull","Leg press","Romanian deadlift","Bulgarian split squat","Hip thrust","Leg curl","Calf raise","Hanging leg raise","Plank","Pallof press"];
window.F2C_wkTools=function(w,day){const X=window.F2C_X||{},r=R(),seen=r.sugSeen||[];
 const sug=(X.requests||[]).filter(q=>q.type==="question"&&q.meta&&q.meta.kind==="suggest"&&!seen.includes(q.id));
 const pend=sug.filter(q=>q.status==="new"||q.status==="working"),ans=sug.filter(q=>q.status==="answered"&&q.answer&&Array.isArray(q.answer.exercises));
 let h=ans.map(q=>`<div class="sheet sugbox"><span class="label">Coach suggestions · ${esc(q.meta.goal||"")}</span>${q.answer.note?`<p>${esc(q.answer.note)}</p>`:""}
  ${q.answer.exercises.map((x,i)=>`<div class="sugex"><div><b>${esc(x.name)}</b> <span class="muted">${esc(x.sets||"")} × ${esc(x.reps||"")}${x.rest?" · rest "+esc(x.rest):""}${x.when?" · "+esc(x.when):""}</span>${x.how?`<p class="small">${esc(x.how)}</p>`:""}${x.why?`<p class="muted small">${esc(x.why)}</p>`:""}</div>
   <div class="row"><button type="button" class="btn small primary" data-addsug="${i}" data-req="${esc(q.id)}" data-scope="all">Add every ${esc(day)}</button><button type="button" class="btn small" data-addsug="${i}" data-req="${esc(q.id)}" data-scope="wk">Just this week</button></div></div>`).join("")}
  <div class="nav"><span></span><button type="button" class="linkbtn small" data-sugdone="${esc(q.id)}">Done with these</button></div></div>`).join("");
 if(pend.length)h+=`<div class="note gold">Your coach is picking exercises for "${esc(pend[0].meta.goal||"")}". Usually within 3 hours; they'll show up here.</div>`;
 h+=`<details class="sheet addbox"><summary><b>+ Add an exercise</b> <span class="muted small">browse 876, type one, or ask your coach</span></summary>
  <button type="button" class="libopenbtn" data-libopen><svg viewBox="0 0 24 24" class="wic"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg><div><b>Browse the exercise library</b><span>876 exercises with photos and steps · search by muscle or equipment</span></div></button>
  <div class="addex"><h4 class="sect">Or type one in</h4><datalist id="exlist">${COMMON.map(n=>`<option value="${esc(n)}">`).join("")}</datalist>
   <label class="field"><span class="flabel">Exercise</span><input name="name" list="exlist" placeholder="e.g. Rowing machine intervals"></label>
   <div class="row3"><label class="field"><span class="flabel">Sets</span><input name="sets" inputmode="numeric" value="3"></label><label class="field"><span class="flabel">Reps or time</span><input name="reps" placeholder="10 or 4 min"></label><label class="field"><span class="flabel">Rest</span><input name="rest" placeholder="90 s"></label></div>
   <div class="row"><label class="small"><input type="radio" name="scope" value="all" checked> Every ${esc(day)}</label><label class="small"><input type="radio" name="scope" value="wk"> Just this week</label></div>
   <div class="nav"><span></span><button type="button" class="btn primary small" data-addex>Add</button></div></div>
  <div class="asksug"><h4 class="sect">Not sure what to add?</h4><label class="field"><span class="flabel">What do you want to work on?</span><textarea rows="2" placeholder="e.g. More cardio to raise my VO2 max"></textarea></label><div class="nav"><span class="status small"></span><button type="button" class="btn small" data-asksug>Ask my coach</button></div></div></details>`;
 return h};

const st=document.createElement("style");st.textContent=`.setbtns{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center}.linkbtn.danger{color:#b91c1c}
.wkgo{width:100%;font-size:17px;padding:14px}.wkdone{display:grid;gap:2px;padding:10px 12px;border-radius:12px;background:#ecfdf5}.wkdone.run{background:#eff6ff}.wkdone b{font-size:18px}
.settime{grid-column:1/-1;justify-self:end;font-size:12px;color:#64748b;margin-top:-4px}
.wkbar2{position:fixed;left:8px;right:8px;bottom:calc(76px + env(safe-area-inset-bottom));z-index:900;display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;background:#0f172a;color:#f8fafc;border-radius:16px;padding:10px 12px;box-shadow:0 10px 30px rgba(0,0,0,.35);max-width:720px;margin:0 auto}
.wkbar2 .label{color:#94a3b8;font-size:11px;display:block}.wkbar2 b{font-size:22px;font-variant-numeric:tabular-nums;line-height:1.1}
.wkbar2 .rest{display:grid;grid-template-columns:auto auto auto auto;grid-template-areas:"l t t t" "b b b b" "m p s s";gap:4px 6px;align-items:center}.wkbar2 .rest .label{grid-area:l}.wkbar2 .rest b{grid-area:t;font-size:28px}.wkbar2 .rest b.last{color:#fbbf24}
.wkbar2 .rest.idle{display:grid;grid-template-columns:1fr;grid-template-areas:none}.wkbar2 .rest.idle b{font-size:22px}.wkbar2 .rest.idle .muted{color:#94a3b8}
.restbar{grid-area:b;height:6px;border-radius:3px;background:#334155;overflow:hidden}.restbar i{display:block;height:100%;background:#22d3ee;transition:width .2s linear}.rest.work .restbar i{background:#f97316}.rest.work [data-r=wstop]{grid-area:s;background:#1e293b;color:#fff;border:0;border-radius:8px;padding:6px 8px;font-weight:600}
.wkbar2 .rest button{background:#1e293b;color:#f8fafc;border:0;border-radius:8px;padding:6px 8px;font-weight:600}.wkbar2 .rest [data-r=skip]{grid-area:s}
.wkbar2 .fin{background:#22c55e;color:#04210f;border:0}.wkbar2.go{animation:wkgo 1.5s}@keyframes wkgo{0%,40%{background:#16a34a}100%{background:#0f172a}}
body:has(#wkbar) main,body:has(#wkbar) #planPanel{padding-bottom:150px}
.addbox summary{cursor:pointer;list-style:none}.addex,.asksug{display:grid;gap:8px;margin-top:10px}.row3{display:grid;grid-template-columns:1fr 1.3fr 1fr;gap:8px}
.sugex{display:grid;gap:6px;padding:10px 0;border-top:1px solid var(--line,#e2e8f0)}.sugex p{margin:2px 0}`;document.head.appendChild(st);

addEventListener("load",()=>{setTimeout(()=>{try{load();if(ACTIVE){keepAwake(true);tick()}}catch(e){}},1500)});
})();

/* ===== KOT warm-ups as separate moves, where you train today, equipment, interval timer ===== */
(function(){
const T=()=>window.F2C_T,R=()=>T().rec();
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const yt=q=>"https://www.youtube.com/results?search_query="+encodeURIComponent(q+" shorts");
/* Knees Over Toes (ATG) routines. Shoulder trio from ATG shoulder ability; knee flow from the ATG group class. */
const KOT={
 shoulder:[["External rotation (band or light dumbbell)","Elbow at your side or propped on your knee. Rotate out, take 4 seconds back in.","ATG external rotation"],
  ["Powell raise","Lie on your side on an incline bench, raise a light dumbbell out and up. Rear shoulder.","Powell raise"],
  ["Trap-3 raise","Chest on an incline bench, thumbs up, raise both arms at a 45° angle in a Y. Lower traps.","trap 3 raise"]],
 knee:[["Backward walk (or backward sled)","3 to 5 min, or about 100 m. A hallway, driveway or treadmill at a slow walk works.","backward sled drag"],
  ["Tibialis raise","Back against a wall, heels 1 to 2 ft out, lift your toes. 15 to 25 reps.","tibialis raise"],
  ["Calf raise on a step or slant","Full stretch at the bottom, 2-second pause. 15 to 20 reps.","slant calf raise"],
  ["ATG split squat (bodyweight)","Front foot up on a step, knee travels past the toes, back knee to the floor. 8 each leg.","ATG split squat"],
  ["Back extension, 2-sec hold","Squeeze glutes at the top. 8 reps. No rounding with weight.","back extension 2 second hold"]]};
function items(ex){const n=String(ex.name||""),l=n.toLowerCase();
 if(/kot|knees over toes|atg/.test(l)&&/shoulder/.test(l))return KOT.shoulder.map(x=>({name:x[0],how:x[1],q:x[2]}));
 if(/kot|knees over toes|atg/.test(l)&&/knee|leg|lower/.test(l))return KOT.knee.map(x=>({name:x[0],how:x[1],q:x[2]}));
 if(!/warm.?up|cool.?down|mobility/.test(l)||n.indexOf(":")<0)return null;
 const parts=n.slice(n.indexOf(":")+1).split(/,|;|\band then\b|\bthen\b/i).map(s=>s.trim()).filter(Boolean);
 return parts.length>1?parts.map(p=>({name:p.charAt(0).toUpperCase()+p.slice(1),how:"",q:p})):null}
window.F2C_warmRows=function(ex,w,day,s,n,L){const it=items(ex);if(!it)return null;
 const rounds=Math.max(1,Math.min(6,n));let h=`<p class="muted small warmhint">${rounds>1?rounds+" rounds. Check off each move as you do it.":"Check off each move as you do it."}${ex.reps?" "+esc(ex.reps):""}${ex.tempo?" · "+esc(ex.tempo):""}</p>`;
 it.forEach((m,i)=>{let boxes="";for(let r=1;r<=rounds;r++){const k=i*rounds+r,key=`w${w}|${day}|${s}|${k}`,v=L[key]||{};(window.F2C_KI=window.F2C_KI||{})[key]={ex:m.name,range:ex.reps||"",sets:rounds,rest:"20 s"};
   boxes+=`<label class="chk"><input type="checkbox" data-k="${key}" data-f="done" ${v.done?"checked":""}><span class="sr">${esc(m.name)}, round ${r} done</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg></label>`}
  h+=`<div class="warmrow"><div><b>${esc(m.name)}</b> <a class="small" href="${esc(yt(m.q))}" target="_blank" rel="noopener">▶ How</a>${m.how?`<p class="muted small">${esc(m.how)}</p>`:""}</div><div class="warmchk">${boxes}</div></div>`});
 return h};

/* ---------- where you're training today ---------- */
const WHERE=[["usual","My usual spot"],["gym","Full gym"],["limited","Hotel or limited"],["notrack","No track today"]];
const kd=()=>`w${T().ui.week}|${T().ui.day}`;
window.F2C_where=()=>{const r=R();return (r&&r.where&&r.where[kd()])||"usual"};
window.F2C_whereA=function(a){const m=F2C_where();a=a||{};
 if(m==="gym")return Object.assign({},a,{location:"commercial gym"});
 if(m==="limited")return Object.assign({},a,{location:"home",equip:["Bodyweight only / no equipment","Adjustable dumbbells","Resistance bands"],equipNotes:""});
 if(m==="notrack")return Object.assign({},a,{equip:(a.equip||[]).filter(x=>!/track/i.test(x))});
 return a};
const EQUIP=["Bodyweight only / no equipment","Barbell + plates","Power rack / squat rack","Adjustable dumbbells","Fixed dumbbells","Adjustable bench","Cable machine / functional trainer","Pull-up bar","Dip station","Leg press","Hack squat","Leg curl machine","Leg extension machine","Smith machine","Kettlebells","Resistance bands","Suspension trainer (TRX)","Weighted sled","Rower","Bike / air bike","Treadmill","Track or field access","Back extension / GHD","Plate-loaded machines (general)"];
window.F2C_whereBox=function(w,day){const r=R();if(!r)return "";const m=F2C_where(),a=r.a||{},d=T().dayPlan(day),track=((d&&d.exercises)||[]).some(x=>/sprint|\b\d{3}\s*m\b|track|ladder|strides/i.test(x.name));
 const opts=WHERE.filter(([k])=>k!=="notrack"||track);
 return `<div class="wherebox"><span class="label">Where are you training today?</span><div class="seg">${opts.map(([k,l])=>`<button type="button" data-where="${k}" aria-pressed="${m===k}">${l}</button>`).join("")}</div>
  ${m!=="usual"?`<p class="small">${m==="gym"?"Every exercise below now shows gym options. Tap one to use it today only; your plan stays the same.":m==="limited"?"Options below use only body weight, dumbbells and bands. Today only.":"Track work below shows options for a field, street, hill, bike or rower. Today only."}</p>`:""}
  <details class="eqbox"><summary class="small">My equipment (${(a.equip||[]).length} items) · update it</summary><div class="eqgrid">${EQUIP.map(x=>`<label class="small"><input type="checkbox" value="${esc(x)}" ${(a.equip||[]).includes(x)?"checked":""}> ${esc(x)}</label>`).join("")}</div>
   <label class="field"><span class="flabel">Anything else</span><input name="eqnotes" value="${esc(a.equipNotes||"")}" placeholder="e.g. 50 lb kettlebell, landmine"></label>
   <div class="nav"><span class="status small"></span><button type="button" class="btn small primary" data-eqsave>Save equipment</button></div>
   <p class="muted small">Saving updates your swap options right away and asks your coach to adjust (not rewrite) your plan for the change.</p></details></div>`};

/* ---------- interval (work) timer for timed moves like 4 x 4 min ---------- */
function workSec(reps){const r=String(reps||"").toLowerCase();let m;if((m=r.match(/(\d+(?:\.\d+)?)\s*min/)))return Math.round(+m[1]*60);if((m=r.match(/(\d+)\s*(s|sec)/)))return +m[1];return 0}
window.F2C_workBtn=(ex,s)=>{const sec=workSec(ex.reps);if(!sec||sec<20)return "";return `<button type="button" class="btn small workgo" data-work="${esc(s)}" data-sec="${sec}">▶ Start ${Math.floor(sec/60)}:${String(sec%60).padStart(2,"0")} interval</button>`};

document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-where],[data-eqsave],[data-work]");if(!t)return;const r=R();
 if(t.dataset.where){r.where=r.where||{};if(t.dataset.where==="usual")delete r.where[kd()];else r.where[kd()]=t.dataset.where;T().touch();const y=scrollY;T().show("workouts");requestAnimationFrame(()=>scrollTo(0,y));return}
 if(t.dataset.eqsave!=null){const box=t.closest(".eqbox"),st=box.querySelector(".status");const eq=[...box.querySelectorAll('input[type=checkbox]:checked')].map(x=>x.value),notes=box.querySelector('[name=eqnotes]').value.trim();
  r.a=r.a||{};const changed=JSON.stringify(eq)!==JSON.stringify(r.a.equip||[])||notes!==(r.a.equipNotes||"");if(!changed){st.textContent="No change.";return}
  r.a.equip=eq;r.a.equipNotes=notes;T().touch();st.textContent="Saved. Asking your coach to adjust your plan…";
  Promise.resolve(T().build&&T().build(false)).then(()=>{st.textContent="Saved. Your coach will adjust your plan within about 3 hours."}).catch(()=>{st.textContent="Saved. Swap options are updated."});return}
 if(t.dataset.work){window.F2C_startWork&&F2C_startWork(t.dataset.work,+t.dataset.sec,t)}},true);

const st=document.createElement("style");st.textContent=`.warmrow{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:8px 0;border-top:1px solid var(--line,#e2e8f0)}.warmrow p{margin:2px 0 0}.warmchk{display:flex;gap:6px}.warmhint{margin:4px 0}
.wherebox{display:grid;gap:8px;margin:8px 0 12px}.wherebox .seg{display:flex;flex-wrap:wrap;gap:6px}.wherebox .seg button{border:1px solid var(--line,#cbd5e1);background:#fff;border-radius:999px;padding:6px 12px;font-weight:600}.wherebox .seg button[aria-pressed=true]{background:#0f172a;color:#fff;border-color:#0f172a}
.eqgrid{display:grid;grid-template-columns:1fr 1fr;gap:4px 10px;margin:8px 0}.workgo{margin-top:6px}`;document.head.appendChild(st);
})();
