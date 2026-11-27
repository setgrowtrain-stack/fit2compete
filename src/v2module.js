/* ===== Fit 2 Compete v2: coach queue, progression, InBody scans, meal totals ===== */
(function(){
const $=id=>document.getElementById(id),e_=s=>esc(s==null?"":String(s));
const T=()=>window.F2C_T;
const X={for:null,requests:[],prog:{},notes:[],body:null,targets:null,meals:[],loaded:false};
window.F2C_X=X;
window.F2C_call=(fn,...a)=>gs(fn,TOKEN,cur,...a);
window.F2C_markApplied=async id=>{try{await gs("markApplied",TOKEN,id);const q=X.requests.find(x=>x.id===id);if(q)q.status="applied"}catch(e){}};
const RUN_NOTE="Your coach answers on the next run, usually within 3 hours. This page updates on its own.";
const LABEL={food:"Meal estimate",plan:"New plan",revise:"Plan change",meals:"Meal plan",coach:"Coach question",checkin:"Weekly check-in",inbody:"InBody scan reading",read:"File reading",suppList:"Supplement list reading",question:"Question"};
const fmt=t=>new Date(t).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
const isoLocal=d=>{const x=new Date(d);return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0")};
const mine=()=>{const r=athletes[cur];return !!(r&&!r.readOnly&&(!r.owner||ME&&(ME.role==="admin"||String(r.owner).toLowerCase()===ME.email)))};
const open=()=>X.requests.filter(q=>q.status==="new"||q.status==="working");

/* ---------- queue ---------- */
async function upload(blob,name){const s=await shrink(blob);const r=await gs("uploadFile",TOKEN,cur,name||("request-"+Date.now()+".jpg"),s.type||blob.type||"application/octet-stream",await blobToB64(s));return r.id}
window.F2C_submit=async function(type,prompt,o){o=o||{};
 if(!TOKEN)throw{code:"signed_out"};if(!mine())throw{code:"read_only"};
 const ids=[...(o.fileIds||[])].filter(Boolean);
 for(const b of (o.images||[]).slice(0,10)){try{if(b&&b.b64){const r=await gs("uploadFile",TOKEN,cur,"request-image.jpg",b.mime||"image/jpeg",b.b64);ids.push(r.id)}else if(b)ids.push(await upload(b,b.name))}catch(e){}}
 const key=type+"|"+((o.meta&&o.meta.field)||"");
 const dup=open().find(q=>q.type===type&&(q.meta&&q.meta.field||"")===((o.meta&&o.meta.field)||"")&&["read","suppList"].includes(type));
 if(dup)return dup.id;
 const r=await gs("submitRequest",TOKEN,cur,type,prompt,ids,Object.assign({athlete:cur},o.meta||{}));
 X.requests.unshift({id:r.id,type,status:"new",created:r.at,meta:o.meta||null});bar();schedulePoll();return r.id};
window.F2C_queue=async function(type,prompt,o){await F2C_submit(type,prompt,o);throw{code:"queued",type}};

/* Drive files the coach should look at for a full plan, with labels. */
window.F2C_planFiles=function(rec){const out=[],lines=[];rec=rec||athletes[cur];const a=rec.a||{};
 Object.entries(rec.photoIds||{}).forEach(([slot,id])=>{if(id){out.push(id);lines.push(id+" = physique photo, "+slot)}});
 Object.entries(a.files||{}).forEach(([field,list])=>(list||[]).slice(-4).forEach(m=>{if(m&&m.id){out.push(m.id);lines.push(m.id+" = "+field+" upload: "+(m.name||""))}}));
 return {ids:out.slice(0,30),text:lines.length?"ATTACHED DRIVE FILES (read each one with the Google Drive connector; ids are in the File link column)\n"+lines.slice(0,30).join("\n"):"No files attached."}};

/* ---------- extras: requests, progression, notes, scans, targets ---------- */
let pollT=null,loading=false;
function schedulePoll(){clearTimeout(pollT);pollT=setTimeout(()=>{if(document.visibilityState==="visible")load(true);else schedulePoll()},open().length?4*60e3:15*60e3)}
async function load(quiet){if(!TOKEN||!cur||loading)return;const id=cur;loading=true;
 if(!X.loaded){try{const c=JSON.parse(localStorage.getItem("f2c-x-"+id)||"null");if(c&&c.for===id){Object.assign(X,c,{requests:[],loaded:true,cached:true});rerender(true)}}catch(e){}}
 try{const r=await gs("getExtras",TOKEN,id);if(cur!==id)return;
  Object.assign(X,{for:id,requests:r.requests||[],prog:r.prog||{},notes:r.notes||[],body:r.body||null,targets:r.targets||null,meals:r.meals||[],wear:r.wear||[],whoop:r.whoop||{},loaded:true,cached:false});
  try{localStorage.setItem("f2c-x-"+id,JSON.stringify({for:id,prog:X.prog,notes:X.notes,body:X.body,targets:X.targets,meals:X.meals,wear:X.wear,whoop:X.whoop}))}catch(e){}
  let fresh=false;
  if(r.rec){const old=athletes[id]||{};const hadPlan=!!old.plan;r.rec.owner=old.owner||r.rec.owner;r.rec.saved=true;if(old.familyChild)r.rec.familyChild=true;athletes[id]=r.rec;saveLocal();fresh=true;
   if(!hadPlan&&r.rec.plan){renderAll(true);toast("Your plan is here.")}else{rerender();const ch=r.rec.plan&&r.rec.plan.changes;if(ch&&ch.length&&JSON.stringify(ch)!==JSON.stringify(old.plan&&old.plan.changes))toast("Plan updated: "+String(ch[0]).slice(0,140)+(ch.length>1?" (see Plan for all changes)":""))}}
  await applyClient();
  if(!fresh)rerender(true);
 }catch(e){if(!quiet)console.warn("[F2C v2] extras",e)}finally{loading=false;bar();schedulePoll()}}
window.F2C_loadExtras=load;
function busyTyping(){const a=document.activeElement;return a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName)}
function rerender(soft){if(soft&&busyTyping())return;try{const pp=$("planPanel");if(pp&&!pp.hidden&&$("ptabs")&&T())T().show(T().ui.tab);}catch(e){}}
function toast(t){let o=$("v2toast");if(!o){o=document.createElement("div");o.id="v2toast";o.className="v2toast";document.body.appendChild(o)}o.textContent=t;o.hidden=false;clearTimeout(o._t);o._t=setTimeout(()=>o.hidden=true,6000)}

/* answers the screens apply themselves (they need the intake form's logic) */
async function applyClient(){const rec=athletes[cur];if(!rec||!mine())return;
 for(const q of X.requests.filter(q=>q.status==="answered"&&(q.type==="read"||q.type==="suppList"))){
  const r=q.answer,m=q.meta||{};let ok=false;
  try{const a=rec.a;
   if(q.type==="suppList"){if(r&&Array.isArray(r.items)){a.suppsNote="Your coach read your list."+F2C_takeSuppItems(a,r.items,"your list");ok=true}}
   else if(m.kind==="doc"&&r&&r.summary){const id=m.field,name=m.name||"file";const prevSum=a[id],prevDate=a[id+"Date"];a[id]=String(r.summary).trim();
    if(id==="labs"&&prevSum&&r.date&&prevDate&&String(r.date)!==String(prevDate)){const older=prevSum.split("\n\nEARLIER RESULTS\n")[0];const hist=(prevSum.split("\n\nEARLIER RESULTS\n")[1]||"");a[id]+="\n\nEARLIER RESULTS\n"+older+(hist?"\n\n"+hist:"")}
    a[id+"FileName"]=name;if(r.date)a[id+"Date"]=String(r.date);
    if(id==="supps")a.suppsNote=`Your coach read ${name}.`+F2C_takeSuppItems(a,r.items,name);
    else{if(id==="labs"&&Array.isArray(r.values))a.labValues=r.values.slice(0,150);const af=autoFill(a,r,id==="labs"?"lab report":"scan");
     a[id+"Note"]=`Your coach read ${name}${r.date?" ("+r.date+")":""}.${af} Check the ${id==="labs"?"values against your report":"numbers against your scan"}.`}
    ok=true}
   else if(m.kind==="gallery"&&r){if(m.field==="equipPhotos"&&Array.isArray(r.items)){const got=r.items.map(x=>x&&x.match).filter(x=>EQUIP.includes(x));
     a.equip=[...new Set([...(a.equip||[]).filter(x=>x!==EQUIP[0]),...got])];a._equipPrev=a.equip;a.equipFound=r.items.map(x=>`${x.name}${x.details?": "+x.details:""}`).join("\n")+(r.notes?"\n"+r.notes:"");ok=true}
    else if(Array.isArray(r.meals)){a.mealsFound=r.meals.map((x,i)=>`Meal ${i+1}: ${x.description} (about ${x.calories} kcal, ${x.protein_g} g protein, ${x.carbs_g} g carbs, ${x.fat_g} g fat)`).join("\n")+(r.note?"\n"+r.note:"");ok=true}}
   else if(m.kind==="import"&&r&&r.summary){const stamp=`[Imported ${new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}]`;a[m.field]=[a[m.field],stamp+"\n"+String(r.summary).trim()].filter(Boolean).join("\n\n");ok=true}
  }catch(e){console.warn("[F2C v2] apply",e)}
  if(ok){rec.updated=Date.now();persist(cur);try{if(!$("intake").hidden)renderStep()}catch(e){}}
  try{await gs("markApplied",TOKEN,q.id);q.status="applied"}catch(e){}
 }}

/* ---------- status bar: what the coach is working on ---------- */
function bar(){let b=$("v2bar");const app=$("app");if(!app)return;
 if(!b){b=document.createElement("div");b.id="v2bar";b.className="v2bar";app.insertBefore(b,app.firstChild)}
 const o=open().filter(q=>!X.for||X.for===cur);const err=X.requests.filter(q=>q.status==="error");
 if(!o.length&&!err.length){b.hidden=true;return}
 b.hidden=false;b.innerHTML=(o.length?`<b>Waiting for your coach:</b> ${o.map(q=>`${e_(LABEL[q.type]||q.type)} (sent ${fmt(q.created)})`).join(" · ")}. <span>${RUN_NOTE}</span>`:"")+
  (err.length?`<div class="v2err">${err.map(q=>e_(LABEL[q.type]||q.type)).join(", ")} didn't go through. Send it again.</div>`:"")}
window.F2C_pending=type=>open().find(q=>q.type===type);

/* ---------- set logging and progression ---------- */
window.F2C_KI={};
const dirty=new Set();let syncT=null;
window.F2C_setChanged=function(k){if(!mine())return;dirty.add(k);clearTimeout(syncT);syncT=setTimeout(flushSets,1800)};
async function flushSets(){if(!dirty.size||!TOKEN)return;const t=T(),L=t.LOG(),keys=[...dirty];dirty.clear();
 const sets=[],removed=[];let phase="";
 keys.forEach(k=>{const info=F2C_KI[k],v=L[k];if(!info){return}
  if(!v||!(v.wt||v.reps||v.done)){removed.push({key:k,ex:info.ex,range:info.range});return}
  const [w,day,,n]=k.split("|");const wk=+String(w).slice(1);const d=new Date(t.weekDate(wk));d.setDate(d.getDate()+t.DAYS7.indexOf(day));phase=phase||t.phaseOf(wk)||"";
  sets.push({key:k,date:isoLocal(d),day,ex:info.ex,range:info.range,plannedSets:info.sets,n:+n,wt:v.wt||"",reps:v.reps||"",rir:v.rir||"",t:v.t||"",done:!!v.done})});
 if(!sets.length&&!removed.length)return;
 try{const r=await gs("syncSets",TOKEN,cur,{phase,sets,removed});Object.entries(r.prog||{}).forEach(([s,p])=>{if(p)X.prog[s]=p;else delete X.prog[s];paintChip(s)})}
 catch(e){keys.forEach(k=>dirty.add(k));clearTimeout(syncT);syncT=setTimeout(flushSets,30e3)}}
window.addEventListener("pagehide",()=>{if(dirty.size)flushSets()});
const PL={increase:p=>`⬆ Next time: ${p.next} lb`,build:()=>"Build reps",hold:()=>"Hold the weight",drop:p=>`⬇ Drop to ${p.next} lb`,deload:()=>"Deload: same load",keep:()=>"Keep the load",track:()=>""};
window.F2C_chip=function(s){const p=X.prog[s];if(!p||!PL[p.status]||!PL[p.status](p))return `<div class="prog" data-prog="${e_(s)}" hidden></div>`;
 return `<div class="prog prog-${e_(p.status)}" data-prog="${e_(s)}"><b>${e_(PL[p.status](p))}</b><span>${e_(p.reason||"")}</span></div>`};
function paintChip(s){document.querySelectorAll(`[data-prog="${CSS.escape(s)}"]`).forEach(el=>{const t=document.createElement("div");t.innerHTML=F2C_chip(s);el.replaceWith(t.firstChild)})}

/* ---------- meals eaten vs targets ---------- */
function targetNums(){const t=X.targets;if(t&&(t.cal||t.p))return {cal:+t.cal||0,p:+t.p||0,c:+t.c||0,f:+t.f||0,by:t.by,why:t.why,from:t.from};
 const n=(athletes[cur]&&athletes[cur].plan&&athletes[cur].plan.nutrition)||{};const f=s=>{const m=String(s||"").replace(/,/g,"").match(/(\d+(?:\.\d+)?)/);return m?+m[1]:0};
 return {cal:f(n.calories),p:f(n.protein),c:f(n.carbs),f:f(n.fat),by:"plan"}}
function eatenToday(){const t=T();if(!t)return null;const day=t.DAYS7[(new Date().getDay()+6)%7];const md=t.mealDayFor(day);const D=t.DAILY();const out={cal:0,p:0,c:0,f:0,rows:[],pending:0};
 const food=D.food||[];
 if(md)(md.meals||[]).forEach((x,i)=>{if(!D.meal[i]||food.some(f=>f.slot===i))return;out.cal+=+x.calories||0;out.p+=+x.protein_g||0;out.c+=+x.carbs_g||0;out.f+=+x.fat_g||0;
  out.rows.push({meal:x.name||("Meal "+(i+1)),food:(x.items||[]).join(", "),cal:x.calories,p:x.protein_g,c:x.carbs_g,f:x.fat_g})});
 food.forEach(it=>{if(it.est&&it.est.calories!==""&&it.est.calories!=null){out.cal+=+it.est.calories||0;out.p+=+it.est.protein_g||0;out.c+=+it.est.carbs_g||0;out.f+=+it.est.fat_g||0}else out.pending++});
 return out}
window.F2C_mealTotals=function(){const tg=targetNums(),e=eatenToday();if(!e||!tg.cal)return "";
 const pct=(a,b)=>b?Math.min(100,Math.round(100*a/b)):0;const row=(l,a,b,u)=>`<div class="v2tot"><span>${l}</span><div class="v2meter"><i style="width:${pct(a,b)}%"></i></div><b>${Math.round(a)}${u} / ${Math.round(b)}${u}</b></div>`;
 return `<div class="sheet v2meals"><span class="label">Eaten today vs target</span>${row("Calories",e.cal,tg.cal,"")}${tg.p?row("Protein",e.p,tg.p," g"):""}${tg.c?row("Carbs",e.c,tg.c," g"):""}${tg.f?row("Fat",e.f,tg.f," g"):""}
  ${e.pending?`<p class="muted small">${e.pending} food entr${e.pending>1?"ies":"y"} waiting for an estimate (next coach run).</p>`:""}
  ${tg.by&&tg.by!=="plan"?`<p class="muted small">Targets updated by your coach${tg.from?" on "+e_(tg.from):""}: ${e_(tg.why||"")}</p>`:""}</div>`};
let mealT=null;
window.F2C_mealsChanged=function(){if(!mine())return;clearTimeout(mealT);mealT=setTimeout(async()=>{const e=eatenToday();if(!e)return;
 try{const r=await gs("syncMeals",TOKEN,cur,isoLocal(new Date()),e.rows);X.meals=r.meals||X.meals;if(r.targets)X.targets=r.targets}catch(err){}},1500)};

/* ---------- Today extras ---------- */
window.F2C_todayExtras=function(){let h="";const b=X.body;
 const unseen=X.notes.filter(n=>!n.seen);
 if(unseen.length)h+=`<button type="button" class="banner v2note" data-go="coach"><b>New from your coach:</b> ${e_(unseen[0].type==="monthly"?"Monthly review":unseen[0].type==="weekly"?"Weekly check-in":"Note")} (${e_(unseen[0].date)}). Tap to read.</button>`;
 if(b&&scanDue())h+=`<button type="button" class="banner v2scan" data-go="body"><b>InBody scan due.</b> ${e_(scanDue())} Tap for how to scan and upload.</button>`;
 h+=F2C_mealTotals();return h};
function scanDue(){const b=X.body;if(!b)return "";if(!b.lastDate)return "No scan on file yet.";if(b.due)return `Last scan was ${b.daysSince} days ago.`;
 try{const t=T();const rec=t.rec();if(rec&&rec.plan){const now=t.phaseOf(t.currentWeek());const w=Math.floor((new Date(b.lastDate+"T12:00:00")-new Date(t.weekDate(1)))/6048e5)+1;const then=w>=1?t.phaseOf(w):"";
  if(then&&now&&then!==now)return `You moved from ${then} to ${now} since your last scan.`}}catch(e){}
 return ""}
document.addEventListener("click",e=>{const g=e.target.closest&&e.target.closest("[data-go]");if(!g||!T())return;T().show(g.dataset.go)});

/* ---------- Coach notes ---------- */
window.F2C_coachNotes=function(){if(!X.notes.length&&!open().some(q=>q.type==="coach"||q.type==="checkin"))return "";
 let h="";const wait=open().filter(q=>q.type==="coach"||q.type==="checkin");
 if(wait.length)h+=`<div class="note gold">${wait.length} message${wait.length>1?"s":""} waiting for your coach. ${RUN_NOTE}</div>`;
 if(X.notes.length)h+=`<details class="sheet" ${X.notes.some(n=>!n.seen)?"open":""}><summary>Coach notes (${X.notes.length})${X.notes.some(n=>!n.seen)?' <span class="pill">New</span>':""}</summary>${X.notes.map(n=>`<div class="v2cnote${n.seen?"":" new"}"><span class="label">${e_(n.date)} · ${e_(n.type==="weekly"?"Weekly check-in":n.type==="monthly"?"Monthly review":n.type)}</span><p>${e_(n.note).replace(/\n/g,"<br>")}</p></div>`).join("")}</details>`;
 if(X.notes.some(n=>!n.seen)&&mine())setTimeout(()=>gs("markNotesSeen",TOKEN,cur).then(()=>X.notes.forEach(n=>n.seen=true)).catch(()=>{}),4000);
 return h};

/* ---------- Scans (InBody) ---------- */
const INBODY_PROMPT=`Read this body composition result sheet. It may be any InBody model, a DEXA report, or another scanner (Styku, Evolt, BodPod and so on). Reply with ONLY one JSON object:
{"type":"inbody" or "dexa" or "other","device":"model as printed, e.g. InBody 270","date":"YYYY-MM-DD test date printed on the sheet",
"weight":lb,"bf":percent body fat,"smm":skeletal muscle mass in lb (null if not printed, e.g. DEXA),"lean":lean body mass or fat-free mass in lb,"bmr":basal metabolic rate in kcal,
"sections":[{"title":"section name as printed","items":[{"key":"standard key from the list below, if one fits","label":"label as printed","value":number (or short text if not a number),"unit":"unit as printed","range":"normal range if printed"}]}],
"segments":{"lean":{"ra":{"lb":n,"pct":n},"la":{...},"tr":{...},"rl":{...},"ll":{...}},"fat":{same shape, if printed},"ecw_tbw":{"ra":n,...} if printed},
"history":[{"date":"YYYY-MM-DD","weight":lb,"smm":lb,"bf":percent}],
"notes":"one short line: anything unreadable or unclear"}
Rules:
1. Copy EVERY value printed on the sheet into sections, grouped the way the sheet groups them. Nothing printed is skipped: body water, dry lean mass, protein, minerals, fat mass, lean and muscle, BMI, percent body fat, waist-hip ratio, visceral fat level or area, ECW/TBW, InBody score, phase angle, body cell mass, segmental lean and fat (lb and percent), body fat and lean control targets, target weight, research parameters with their ranges, SMI, and impedance at every frequency for every segment. For DEXA: total and regional fat percent, fat, lean and bone mass by region (arms, legs, trunk, android, gynoid), A/G ratio, visceral fat (VAT) mass, volume and area, bone density (BMD), T-score and Z-score for every site, ALMI, FFMI, FMI, RSMI.
2. Standard keys: weight, tbw, icw, ecw, dry_lean, protein, minerals, bmc, fat_mass, lean, ffm, smm, bmi, pbf, whr, vfl, vfa, vat_mass, vat_volume, ecw_tbw, inbody_score, phase_angle, bcm, bmr, smi, almi, ffmi, fmi, target_weight, weight_control, fat_control, lean_control, android_pct, gynoid_pct, ag_ratio, bmd_total, t_score, z_score. Segment items use lean_ra, lean_la, lean_tr, lean_rl, lean_ll (and _pct), fat_ra and so on, imp20_ra, imp100_la and so on.
3. In sections keep the units printed. Top-level numbers and segments are in lb: convert kg to lb (1 kg = 2.2046 lb), one decimal.
4. history: earlier results printed on this sheet (e.g. "Body Composition History"), each with its own date, not including this test. Dates like "05. 01. 26" are month, day, year.
5. Use null for any number that isn't printed. Never guess a number.`;
const PROTOCOL=`<ul class="clean"><li>Scan fasted, or 2 to 3 hours after eating.</li><li>Same time of day as your last scan.</li><li>No workout before the scan.</li><li>Use the bathroom first; normal water intake the day before.</li></ul>`;
function scanCard(last,c){const fem=/^f/i.test(((athletes[cur]||{}).a||{}).sex||""),bf=+last.bf;
 const z=bf?(fem?(bf<25?"green":bf<32?"yellow":"red"):(bf<18?"green":bf<25?"yellow":"red")):"",ZC={green:"var(--wd-green)",yellow:"var(--wd-yellow)",red:"var(--wd-red)"},rc=ZC[z]||"#9aa4af";
 const r=42,C=2*Math.PI*r,pct=Math.min(1,(bf||0)/(fem?45:40));
 const ch=(k,good)=>{const v=c&&c.change&&c.change[k];if(v==null||!isFinite(v))return "";const n=Math.round(v*10)/10;if(!n)return `<i class="wch">no change</i>`;const ok=(n>0)===good;return `<i class="wch" style="color:${ok?"var(--wd-green)":"var(--wd-red)"}">${n>0?"▲ +":"▼ "}${n}</i>`};
 const tc=(k,good)=>{const v=c&&c.change&&c.change[k];if(good==null||v==null||!isFinite(v))return "var(--ink)";const n=Math.round(v*10)/10;return !n?"var(--ink)":((n>0)===good?"var(--wd-green)":"var(--wd-red)")};
 const t=(lab,val,u,k,good,col)=>val===""||val==null?"":`<div class="wt wsm"><b style="color:${col}">${e_(val)}<small>${u}</small></b><span>${lab}</span>${ch(k,good)}</div>`;
 return `<div class="sheet wearcard scancard"><div class="whead"><span>LAST SCAN${last.type==="dexa"?" · DEXA":" · INBODY"}</span><span>${e_(last.date||"")}</span></div>
  <div class="wtop"><div class="wt wrec"><svg viewBox="0 0 100 100" class="wring"><circle cx="50" cy="50" r="${r}" fill="none" class="wtrack" stroke-width="9"/><circle cx="50" cy="50" r="${r}" fill="none" style="stroke:${rc}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${C*pct} ${C}" transform="rotate(-90 50 50)"/></svg>
    <div class="wrecv"><b style="color:${rc}">${bf?e_(bf)+"%":"–"}</b><span style="color:${rc}">${F2C_term("bf","BODY FAT")}</span>${ch("bf",false)}</div></div>
   <div class="wcol">${t("WEIGHT",last.weight," lb","weight",null,"var(--ink)").replace(/style="color:var\(--wd-(green|red)\)"/,'style="color:var(--muted)"')}${t("MUSCLE (SMM)",last.smm," lb","smm",true,tc("smm",true))}</div></div>
  <div class="wsmall">${t("LEAN MASS",last.lean," lb","lean",true,tc("lean",true))}${t("BMR",last.bmr," kcal","bmr",true,tc("bmr",true))}</div>
  <p class="wadv small">Ring color: green ${fem?"under 25%":"under 18%"}, yellow ${fem?"25 to 32%":"18 to 25%"}, red above. Numbers and arrows compare with your scan before this one: green is the direction you want, red the opposite.</p></div>`}
const scansOf=()=>((X.body&&X.body.scans)||[]);
const SCIC='<svg viewBox="0 0 24 24" class="wic"><rect x="5" y="2.5" width="14" height="19" rx="3"/><path d="M9 7h6M9 11h6M9 15h3"/></svg>';
window.F2C_rBody=function(){const v=$("v-body");if(!v)return;const b=X.body,ro=!mine();
 if(!X.loaded){v.innerHTML=`<div class="sheet"><p class="muted">Loading scans…</p></div>`;load(true);return}
 const scans=scansOf(),pend=open().filter(q=>q.type==="inbody"),unconf=scans.filter(s=>!s.confirmed);const last=scans.filter(s=>s.confirmed).slice(-1)[0];
 const due=scanDue(),days=b&&b.lastDate?(b.daysSince!=null?b.daysSince:Math.round((Date.now()-new Date(b.lastDate+"T12:00:00"))/864e5)):null;
 const when=b&&b.lastDate?new Date(b.lastDate+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"";
 let h=`<div class="sheet scanstrip"><div class="ssico">${SCIC}</div><div class="sstext"><b>Body scans</b><span>${when?`Last ${e_(when)} · ${days} day${days===1?"":"s"} ago`:"No scan on file yet"}</span></div>
  ${due?`<button type="button" class="sspill" data-wd="scan:add">Scan due</button>`:""}${!ro&&scans.length?`<button type="button" class="btn small" data-wd="scan:add">+ Add</button>`:""}</div>`;
 if(last){const card=scanCard(last,b&&b.cmp),k=card.lastIndexOf("</div>");
  h+=`<div class="scantap" data-wd="scan:parts" role="button" tabindex="0" aria-label="Scan details">${card.slice(0,k)}<p class="wtap">Tap for body parts, changes and every value</p>${card.slice(k)}</div>`}
 if(unconf.length&&!ro)h+=unconf.map(s=>`<div class="sheet v2conf"><span class="label">Your coach read this ${s.type==="dexa"?"DEXA scan":"scan"}${s.details&&s.details.device?" ("+e_(s.details.device)+")":""}. Check the main numbers, then confirm</span><div class="v2form" data-scan="${e_(s.id)}">${formFields(s)}</div>${s.notes?`<p class="muted small">${e_(s.notes)}</p>`:""}${s.details?scanDetailsHtml(s,null).replace('<div class="sheet">','<div class="inner">'):""}<div class="nav"><button class="btn small" type="button" data-scanrm="${e_(s.id)}">Delete</button><button class="btn small primary" type="button" data-scanok="${e_(s.id)}">These are right</button></div></div>`).join("");
 if(pend.length)h+=`<div class="note gold">Your coach is reading ${pend.length>1?pend.length+" scans":"your scan"} (sent ${fmt(pend[0].created)}). ${RUN_NOTE}</div>`;
 if(!scans.length&&!ro)h+=scanAddHtml();
 v.innerHTML=h;scanWire(v)};
function scanAddHtml(){const ro=!mine(),b=X.body;let h="";
 if(!ro)h+=`<div class="sheet"><h4 class="sect">Add a scan</h4><div class="row"><label class="btn" for="scanFile">Upload a photo or PDF</label><input id="scanFile" type="file" accept="image/*,application/pdf" hidden><span class="status" id="scanSt"></span></div>
  <p class="muted small">Your coach reads it on the next run. Or type the 5 numbers now:</p><div class="v2form" id="scanNew">${formFields({date:isoLocal(new Date())})}</div><div class="nav"><span></span><button class="btn primary" type="button" id="scanSave">Save scan</button></div></div>`;
 const due=scanDue();
 h+=`<div class="sheet"><span class="label">When and how to scan</span>${due?`<div class="note gold"><b>Scan due.</b> ${e_(due)}</div>`:`<p class="small">Next scan around ${e_(b&&b.lastDate?isoLocal(new Date(new Date(b.lastDate+"T12:00:00").getTime()+28*864e5)):"now")}.</p>`}<p class="small">Scan every 4 weeks and at each phase change.</p>${PROTOCOL}</div>`;
 return h}
function scanChangesHtml(){const b=X.body,scans=scansOf();let h="";
 const c=b&&b.cmp;
 if(c){const sg=(x,u,good)=>{if(x==null)return `<b class="muted">—</b>`;const n=Math.round(x*10)/10;const cls=n===0?"":((n>0)===good?"up":"down");return `<b class="${cls}">${n>0?"+":""}${n}${u}</b>`};
  h+=(window.F2C_sinceCard?F2C_sinceCard(c,scans.filter(x=>x.confirmed)):"")+`<div class="sheet"><span class="label">Food and training in those ${c.weeks} week${c.weeks>1?"s":""}</span>
   <h4 class="sect">Food</h4>${c.food?`<p>Average <b>${c.food.cal} kcal</b> and <b>${c.food.protein} g protein</b> a day, from ${c.food.days} day${c.food.days>1?"s":""} of meals checked off.</p>`:`<p class="muted small">No meals were checked off in this window, so food can't be compared. Tap "Ate it" on Today to track it.</p>`}
   <h4 class="sect">Training</h4>${(c.setsPerWeek||[]).length?`<div class="scroll"><table><thead><tr><th>Muscle (approx.)</th><th>Hard sets a week</th></tr></thead><tbody>${c.setsPerWeek.map(x=>`<tr><td>${e_(x.muscle)}</td><td class="num">${x.sets}</td></tr>`).join("")}</tbody></table></div>`:`<p class="muted small">No sets logged in this window.</p>`}
   ${(c.strength||[]).length?`<div class="scroll"><table><thead><tr><th>Key lift</th><th>Est. max then</th><th>Now</th><th>Change</th></tr></thead><tbody>${c.strength.map(x=>`<tr><td>${e_(x.lift)}</td><td class="num">${x.from} lb</td><td class="num">${x.to} lb</td><td class="num">${x.pct>0?"+":""}${x.pct}%</td></tr>`).join("")}</tbody></table></div>`:""}</div>`}
 return h||`<p class="muted small">After your next scan you'll see the change next to your food and training for the same weeks.</p>`}
function scanHistHtml(){const scans=scansOf();let h="";
 if(scans.length)h+=`<details class="sheet" open><summary>All scans (${scans.length})</summary><div class="scroll"><table><thead><tr><th>Date</th><th>Weight</th><th>Body fat</th><th>SMM</th><th>Lean</th><th>BMR</th></tr></thead><tbody>${scans.slice().reverse().map(s=>`<tr><td>${e_(s.date)}${s.confirmed?"":" (to check)"}${s.source==="history"?' <span class="muted small">from sheet</span>':""}${s.type==="dexa"?' <span class="muted small">DEXA</span>':""}</td><td class="num">${e_(s.weight)}</td><td class="num">${e_(s.bf)}</td><td class="num">${e_(s.smm)}</td><td class="num">${e_(s.lean)}</td><td class="num">${e_(s.bmr)}</td></tr>`).join("")}</tbody></table></div></details>`;
 return h}
function scanPair(){const sc=scansOf().filter(s=>s.confirmed),last=sc.slice(-1)[0];return [last,last?sc.filter(s=>s!==last&&s.details).slice(-1)[0]:null]}
window.F2C_scanTab=function(tab){const [last,prev]=scanPair();
 if(tab==="add")return scanAddHtml();
 if(tab==="changes")return scanChangesHtml();
 if(tab==="hist")return scanHistHtml();
 if(!last)return `<p class="muted">No confirmed scan yet.</p>`;
 if(tab==="all")return (last.details?scanDetailsHtml(last,prev,"rest").replace("<details>","<details open>"):"")||`<p class="muted">This scan only has the main numbers.</p>`;
 return (last.details?scanDetailsHtml(last,prev,"segs"):"")||`<p class="muted">This scan has no body part numbers.</p>`};
window.F2C_scanDate=()=>{const l=scanPair()[0];return l?l.date:""};
function scanWire(v){
 const f=$("scanFile");if(f)f.onchange=async()=>{const file=f.files[0];if(!file)return;const st=$("scanSt");st.textContent="Uploading…";
  try{const id=await upload(file,"inbody__"+(file.name||"scan"));await F2C_submit("inbody",INBODY_PROMPT,{fileIds:[id],meta:{kind:"inbody"}});st.textContent="Sent to your coach.";F2C_rBody();window.F2C_wdRedraw&&F2C_wdRedraw()}catch(e){st.textContent=errCopy(e)}};
 const sv=$("scanSave");if(sv)sv.onclick=()=>save(readForm($("scanNew")),sv);
 v.querySelectorAll("[data-scanok]").forEach(btn=>btn.onclick=()=>{const x=readForm(v.querySelector(`[data-scan="${btn.dataset.scanok}"]`));x.id=btn.dataset.scanok;save(x,btn)});
 v.querySelectorAll("[data-scanrm]").forEach(btn=>btn.onclick=()=>save({id:btn.dataset.scanrm,remove:true},btn))}
window.F2C_scanWire=scanWire;
const SEG=[["la","Left arm"],["ra","Right arm"],["tr","Trunk"],["ll","Left leg"],["rl","Right leg"]];
function scanDetailsHtml(s,prev,mode){const d=s.details||{},pd=(prev&&prev.details)||{},sg=d.segments||{},psg=pd.segments||{};
 const chg=(a,b,u)=>{if(typeof a!=="number"||typeof b!=="number")return "";const n=Math.round((a-b)*100)/100;return `<span class="muted small">${n>0?"+":""}${n}${u||""}</span>`};
 let h="";
 const seg=(k,title,note)=>{const m=sg[k];if(!m||!SEG.some(([x])=>m[x]))return "";const pm=psg[k]||{};
  if(window.F2C_segCard)return F2C_segCard(k,title,m,prev?pm:null,SEG);
  return `<h4 class="sect">${title}</h4>${note?`<p class="muted small">${note}</p>`:""}<div class="scroll"><table><thead><tr><th>Body part</th><th>lb</th><th>% of ideal</th>${prev?"<th>Change</th>":""}</tr></thead><tbody>${SEG.filter(([x])=>m[x]).map(([x,l])=>{const v=m[x]||{},p=pm[x]||{};return `<tr><td>${l}</td><td class="num">${e_(v.lb==null?"":v.lb)}</td><td class="num">${e_(v.pct==null?"":v.pct+"%")}</td>${prev?`<td class="num">${chg(v.lb,p.lb," lb")}</td>`:""}</tr>`}).join("")}</tbody></table></div>`};
 h+=seg("lean",F2C_term("segment","Muscle by body part"),"100% means average for your height. Left and right within about 3% of each other is balanced.");
 h+=seg("fat","Fat by body part","");
 const pk={};(pd.sections||[]).forEach(x=>(x.items||[]).forEach(it=>{if(it.key)pk[it.key]=it.value}));
 const secs=(d.sections||[]).filter(x=>(x.items||[]).length);
 if(secs.length)h+=`<details><summary class="small">Everything on this scan (${secs.reduce((n,x)=>n+x.items.length,0)} values)${d.device?" · "+e_(d.device):""}</summary>${secs.map(x=>`<h4 class="sect">${e_(x.title||"")}</h4><div class="scroll"><table><tbody>${x.items.map(it=>`<tr><td>${e_(it.label)}${it.range?` <span class="muted small">(${e_(it.range)})</span>`:""}</td><td class="num">${e_(it.value)}${it.unit?" "+e_(it.unit):""}</td>${prev?`<td class="num">${it.key&&it.key in pk?chg(it.value,pk[it.key]):""}</td>`:""}</tr>`).join("")}</tbody></table></div>`).join("")}</details>`;
 if(!h)return "";const parts=h.split("<!--segend-->"),segs=parts.slice(0,-1).join(""),rest=parts[parts.length-1];
 if(mode==="segs")return segs;if(mode==="rest")return rest?`<div class="sheet">${rest}</div>`:"";
 return segs+(rest?`<div class="sheet"><span class="label">${s.type==="dexa"?"DEXA scan":"Scan"} details · ${e_(s.date)}</span>${rest}</div>`:"")}
function formFields(s){return [["date","Date","date"],["weight","Weight (lb)"],["bf","Body fat %"],["smm","Muscle SMM (lb)"],["lean","Lean mass (lb)"],["bmr","BMR (kcal)"]].map(([k,l,t])=>`<label class="field"><span class="flabel">${l}</span><input type="${t||"text"}" ${t?"":'inputmode="decimal"'} data-f="${k}" value="${e_(s[k]==null?"":s[k])}"></label>`).join("")}
function readForm(el){const o={};el.querySelectorAll("[data-f]").forEach(i=>o[i.dataset.f]=i.value.trim());return o}
async function save(x,btn){btn.disabled=true;try{const r=await gs("saveInBody",TOKEN,cur,x);X.body=r.body;F2C_rBody();window.F2C_wdRedraw&&F2C_wdRedraw();toast(x.remove?"Scan deleted.":"Scan saved.")}catch(e){btn.disabled=false;toast(errCopy(e))}}

/* ---------- hooks ---------- */
const _renderAll=renderAll;renderAll=function(){const out=_renderAll.apply(this,arguments);if(X.for!==cur){X.for=cur;X.loaded=false;X.prog={};X.requests=[];X.notes=[];X.body=null;X.targets=null;load(true)}bar();return out};
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&X.loaded&&TOKEN)load(true)});
const css=document.createElement("style");css.textContent=`
.v2bar{background:var(--gold-soft);border:1px solid var(--gold);border-radius:12px;padding:10px 14px;margin-bottom:12px;font-size:.88rem}.v2bar span{color:var(--muted)}.v2err{color:var(--warn);font-weight:700;margin-top:4px}
.prog{display:grid;gap:2px;border-radius:10px;padding:8px 10px;margin:6px 0;background:var(--bg);border:1px solid var(--line);font-size:.82rem}.prog b{font-size:.9rem}.prog span{color:var(--muted)}
.prog-increase{background:var(--ok-soft);border-color:var(--ok)}.prog-increase b{color:var(--ok)}.prog-drop,.prog-hold{background:var(--warn-soft);border-color:var(--warn)}.prog-deload,.prog-keep{background:var(--gold-soft);border-color:var(--gold)}
.v2tot{display:grid;grid-template-columns:70px 1fr auto;gap:8px;align-items:center;font-size:.85rem}.v2meter{height:8px;border-radius:99px;background:var(--line);overflow:hidden}.v2meter i{display:block;height:100%;background:var(--accent)}
.v2meals{display:grid;gap:6px;margin:10px 0}.v2cnote{border-top:1px solid var(--line);padding:8px 0}.v2cnote.new{border-left:3px solid var(--accent);padding-left:8px}
.v2form{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px}.v2form input{font:inherit;width:100%;padding:8px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink)}
b.up{color:var(--ok)}b.down{color:var(--warn)}.v2toast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:#141414;color:#fff;padding:10px 16px;border-radius:10px;z-index:200;font-size:.9rem;max-width:90vw}
.banner.v2scan,.banner.v2note{display:block;width:100%;text-align:left;margin:8px 0}`;
document.head.appendChild(css);
})();

/* ===== "Save to App": install button in the top bar ===== */
(function(){
const standalone=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
let deferred=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferred=e});
window.addEventListener("appinstalled",()=>{const b=document.getElementById("saveApp");if(b)b.hidden=true});
function steps(){const ua=navigator.userAgent;
 const ios=/iPhone|iPad|iPod/.test(ua)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
 if(ios&&/CriOS|FxiOS|EdgiOS|GSA/.test(ua))return ["Copy this page's link, then open it in <b>Safari</b> (iPhone only lets Safari add apps to the home screen).","In Safari, tap the <b>Share</b> button (square with an arrow).","Scroll down and tap <b>Add to Home Screen</b>, then <b>Add</b>."];
 if(ios)return ["Tap the <b>Share</b> button at the bottom (square with an arrow).","Scroll down and tap <b>Add to Home Screen</b>.","Tap <b>Add</b>. The F2C icon appears on your home screen."];
 if(/SamsungBrowser/.test(ua))return ["Tap the menu (☰ or ⋮) at the bottom right.","Tap <b>Add page to</b>.","Tap <b>Home screen</b>, then <b>Add</b>."];
 if(/Firefox/.test(ua))return ["Tap the ⋮ menu.","Tap <b>Add app to Home screen</b> (or <b>Install</b>).","Tap <b>Add</b>."];
 return ["Tap the ⋮ menu at the top right.","Tap <b>Add to Home screen</b> or <b>Install app</b>.","Tap <b>Install</b> or <b>Add</b>."]}
function sheet(){let o=document.getElementById("saveSheet");if(o){o.hidden=false;return}
 o=document.createElement("div");o.id="saveSheet";o.className="savesheet";o.setAttribute("role","dialog");o.setAttribute("aria-modal","true");
 o.innerHTML=`<div class="savecard"><div class="savehead"><img src="icons/icon-192.png" alt="" width="44" height="44"><div><b>Save Fit 2 Compete as an app</b><span>Puts the F2C icon on your home screen.</span></div></div><ol>${steps().map(s=>`<li>${s}</li>`).join("")}</ol><p class="muted small">Have the old Fit 2 Compete icon? Delete it so you don't open the old version.</p><button type="button" class="btn primary" id="saveClose">Got it</button></div>`;
 document.body.appendChild(o);o.addEventListener("click",e=>{if(e.target===o||e.target.id==="saveClose")o.hidden=true})}
function add(){if(standalone()||document.getElementById("saveApp"))return;const bar=document.querySelector(".appbar .in");if(!bar)return;
 const b=document.createElement("button");b.type="button";b.id="saveApp";b.className="saveapp";b.innerHTML=`<img src="icons/icon-192.png" alt="" width="22" height="22"><span>Save to App</span>`;
 b.onclick=async()=>{if(deferred){deferred.prompt();try{const r=await deferred.userChoice;if(r&&r.outcome==="accepted")b.hidden=true}catch(e){}deferred=null;return}sheet()};
 const who=document.getElementById("who");bar.insertBefore(b,who||null)}
const st=document.createElement("style");st.textContent=`.saveapp{display:inline-flex;align-items:center;gap:6px;font:700 .82rem var(--body);background:#fff;color:#141414;border:0;border-radius:99px;padding:5px 12px 5px 5px;cursor:pointer}.saveapp img{border-radius:6px}
.savesheet{position:fixed;inset:0;z-index:150;background:rgba(0,0,0,.55);display:grid;place-items:end center;padding:12px}.savecard{background:var(--card);color:var(--ink);border-radius:16px;padding:18px;max-width:440px;width:100%;display:grid;gap:12px}
.savehead{display:flex;gap:12px;align-items:center}.savehead img{border-radius:10px}.savehead span{display:block;color:var(--muted);font-size:.85rem}.savecard ol{margin:0;padding-left:20px;display:grid;gap:8px}`;
document.head.appendChild(st);
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",add);else add();
})();

/* ===== Exercise kinds and food log ===== */
(function(){
const $=id=>document.getElementById(id),e_=s=>esc(s==null?"":String(s));
const T=()=>window.F2C_T;
const mine=()=>{const r=athletes[cur];return !!(r&&!r.readOnly&&(!r.owner||ME&&(ME.role==="admin"||String(r.owner).toLowerCase()===ME.email)))};
const isoLocal=d=>{const x=new Date(d);return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0")};

/* stretch: check off only; bw: weight is optional added load; timed: seconds instead of reps */
/* Two dumbbells or kettlebells: the weight box is per hand. One arm or one leg at a time: reps are per side. Totals count both. */
window.F2C_per=function(ex){const n=String(ex.name||"").toLowerCase(),r=String(ex.reps||"").toLowerCase();
 const one=/single.?arm|one.?arm|single.?leg|one.?leg|unilateral|suitcase|goblet|\b1.?arm|\b1.?leg/.test(n);
 const hand=/dumbbell|\bdbs?\b|kettlebell|\bkbs?\b/.test(n)&&!one&&!/goblet|single (db|dumbbell)|swing|pullover|turkish|windmill|halo/.test(n);
 const side=/each|per (side|leg|arm)|\/\s*(side|leg|arm)|\bea\b|\bper\b/.test(r)||/single.?arm|one.?arm|single.?leg|one.?leg|unilateral|\b1.?arm|\b1.?leg|bulgarian|split squat|lunge|step.?up|pistol|copenhagen/.test(n);
 const tag=hand&&side?"per hand · reps per side":hand?"per hand":side?"per side":"";
 const tip=hand&&side?"Enter the weight of one dumbbell and the reps for one side. Totals count both hands and both sides.":hand?"Enter the weight of one dumbbell. Totals count both hands.":side?"Enter the reps for one side. Totals count both sides.":"";
 return {hand,side,mult:(hand?2:1)*(side?2:1),tag,tip}};
window.F2C_exKind=function(ex){const n=String(ex.name||"").toLowerCase(),r=String(ex.reps||"").toLowerCase();
 const loaded=/dumbbell|barbell|\bdb\b|kettlebell|cable|machine|weighted|plate|sled|carry|vest|med(icine)? ball/.test(n);
 if(/warm.?up|cool.?down|mobility|foam roll/.test(n))return "stretch";
 if(/stretch|foam|mobility|warm.?up|cool.?down|ankle rock|hip switch|90\/90|breath|cat.?cow|child'?s pose|yoga|massage|lacrosse ball|walkover|drill|activation/.test(n)&&!loaded)return "stretch";
 if(/sprint|stride|ladder|\brun\b|jog|\d+\s*m\b|meters?\b|\bzone\s*2|interval|rower|rowing|bike|cycling|treadmill|elliptical|swim/.test(n)&&!/sled|sandbag/.test(n))return "stretch";
 const timed=/\bsec|\d\s*s\b|min|hold|yd|yard|meter|\d\s*m\b/.test(r);
 if(timed&&!loaded)return "timed";
 if(/push.?up|pull.?up|chin.?up|\bdip|inverted row|sit.?up|crunch|plank|dead bug|bird dog|glute bridge|nordic|burpee|mountain climber|air squat|bodyweight|leg raise|hollow|superman|jump|bound|hop|skip|sprint|lunge|step.?up|split squat|calf raise|pistol|back extension|band/.test(n)&&!loaded)return "bw";
 return "load"};

/* ---------- food ---------- */
const FOOD_PROMPT=`Estimate what this person ate from their description and/or the attached photo. Use typical US portions when amounts aren't given, and the amounts they give when they do. Round to sensible numbers; it is an estimate, so don't pretend to precision. Reply with ONLY one JSON object:
{"desc":"short description of the foods and portions you assumed","calories":number,"protein_g":number,"carbs_g":number,"fat_g":number,"confidence":"low|medium|high"}`;
function dayKey(){return new Date().toISOString().slice(0,10)} // same key the app uses for daily check-offs
function FOOD(){const D=T().DAILY();D.food=D.food||[];return D.food}
function todayMeals(){const t=T();const md=t.mealDayFor(t.DAYS7[(new Date().getDay()+6)%7]);return md&&md.meals||[]}
const est=it=>it.est&&it.est.calories!==""&&it.est.calories!=null?`about ${it.est.calories} kcal · ${it.est.protein_g} g protein · ${it.est.carbs_g} g carbs · ${it.est.fat_g} g fat`:`estimate comes on the next coach run (within about 3 hours)`;
window.F2C_foodBtn=i=>mine()&&!FOOD().some(f=>f.slot===i)?`<button class="btn small" type="button" data-other="${i}">Ate something else</button>`:"";
window.F2C_foodNote=i=>{const it=FOOD().find(f=>f.slot===i);return it?`<div class="alt"><b>You ate:</b> ${e_(it.text||"(photo)")}<br><span class="small">${e_(est(it))}</span></div>`:""};
window.F2C_mealActions=function(pick,mi){const t=T();if(!mine()||pick!==t.mealDayFor(t.DAYS7[(new Date().getDay()+6)%7]))return "";
 const D=t.DAILY(),done=!!D.meal[mi],alt=FOOD().some(f=>f.slot===mi);
 return `<div class="tact">${alt?"":`<button class="btn small ${done?"":"primary"}" type="button" data-ate="${mi}">${done?"Ate it ✓":"Ate it"}</button>`}${F2C_foodBtn(mi)}</div>${F2C_foodNote(mi)}`};
window.F2C_foodLog=function(){if(!athletes[cur])return "";const extra=FOOD().filter(f=>f.slot==null);const ro=!mine();
 if(ro&&!extra.length)return "";
 return `<div class="sheet v2food"><div class="sheethead"><div><span class="label">Food log</span><h4>Anything not on your plan today</h4></div>${ro?"":`<button class="btn small primary" type="button" data-food-add="1">+ Log food</button>`}</div>
  ${extra.length?`<ul class="v2foodlist">${extra.map(it=>`<li><div><b>${e_(it.meal)}</b> ${e_(it.text||"(photo)")}<br><span class="muted small">${e_(est(it))}</span></div>${ro?"":`<button class="linkbtn" type="button" data-food-rm="${e_(it.id)}">Remove</button>`}</li>`).join("")}</ul>`:`<p class="muted small">Missed a meal or ate something different? Type it or snap a photo and your coach estimates the calories and macros.</p>`}</div>`};
function rerender(){try{T().show(T().ui.tab)}catch(e){}}
function sheet(slot){const meals=todayMeals();const name=slot!=null&&meals[slot]?meals[slot].name:"";
 let o=$("foodSheet");if(o)o.remove();o=document.createElement("div");o.id="foodSheet";o.className="savesheet";o.setAttribute("role","dialog");o.setAttribute("aria-modal","true");
 const h=new Date().getHours(),guess=h<11?"Breakfast":h<15?"Lunch":h<17?"Snack":"Dinner";
 o.innerHTML=`<div class="savecard"><b>${slot!=null?"What did you eat instead of "+e_(name)+"?":"Log food"}</b>
  ${slot!=null?"":`<label class="field"><span class="flabel">Meal</span><select id="foodMeal">${["Breakfast","Lunch","Dinner","Snack","Pre-workout","Post-workout"].map(m=>`<option${m===guess?" selected":""}>${m}</option>`).join("")}</select></label>`}
  <label class="field"><span class="flabel">What you ate</span><textarea id="foodText" rows="3" placeholder="For example: chicken burrito bowl with rice, black beans, salsa, no cheese. About 1.5 cups rice."></textarea><span class="hint">Amounts help (cups, ounces, pieces). A photo alone works too.</span></label>
  <label class="field"><span class="flabel">Photo (optional)</span><input id="foodPhoto" type="file" accept="image/*" capture="environment" class="filepick"></label>
  <p class="status" id="foodSt"></p><div class="nav"><button class="btn" type="button" id="foodCancel">Cancel</button><button class="btn primary" type="button" id="foodSave">Save</button></div></div>`;
 document.body.appendChild(o);o.addEventListener("click",e=>{if(e.target===o)o.remove()});$("foodCancel").onclick=()=>o.remove();
 $("foodSave").onclick=async()=>{const text=$("foodText").value.trim(),file=$("foodPhoto").files[0],st=$("foodSt");
  if(!text&&!file){st.textContent="Type what you ate or add a photo.";return}
  $("foodSave").disabled=true;st.textContent="Saving…";
  const it={id:"f"+Date.now().toString(36),slot:slot!=null?slot:null,meal:slot!=null?name:($("foodMeal")||{}).value||"Food",text,at:Date.now(),est:null};
  const D=T().DAILY();if(slot!=null){D.meal[slot]=false;delete D.skip["meal"+slot]}FOOD().push(it);T().touch();
  try{let ids=[];if(file){const s=await shrink(file);const r=await gs("uploadFile",TOKEN,cur,"food__"+(file.name||"meal.jpg"),s.type||"image/jpeg",await blobToB64(s));it.photo=r.id;ids=[r.id]}
   const planned=slot!=null&&todayMeals()[slot];
   it.req=await F2C_submit("food",FOOD_PROMPT+"\n\nMEAL: "+it.meal+"\nWHAT THEY ATE: "+(text||"(see photo)")+(file?"\nA photo is attached (File link).":"")+(planned?"\nFor scale, their planned meal was: "+(planned.items||[]).join(", ")+" ("+planned.calories+" kcal).":""),{fileIds:ids,meta:{kind:"food",itemId:it.id,dayKey:dayKey(),date:isoLocal(new Date()),meal:it.meal}});
   T().touch();window.F2C_mealsChanged&&F2C_mealsChanged();o.remove();rerender();
  }catch(e){st.textContent=errCopy(e);$("foodSave").disabled=false}}}
document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-other],[data-food-add],[data-food-rm],[data-ate]");if(!t||!T())return;
 if(t.dataset.other!=null)return sheet(+t.dataset.other);
 if(t.dataset.foodAdd!=null)return sheet(null);
 if(t.dataset.ate!=null){const D=T().DAILY(),i=t.dataset.ate;D.meal[i]=!D.meal[i];delete D.skip["meal"+i];T().touch();F2C_mealsChanged&&F2C_mealsChanged();return rerender()}
 if(t.dataset.foodRm!=null){const L=FOOD(),k=L.findIndex(f=>f.id===t.dataset.foodRm);if(k<0)return;const it=L.splice(k,1)[0];T().touch();
  if(it.req)gs("cancelRequest",TOKEN,it.req).catch(()=>{});gs("syncMeals",TOKEN,cur,isoLocal(new Date()),null,[it.id]).catch(()=>{});F2C_mealsChanged&&F2C_mealsChanged();rerender()}});
const st=document.createElement("style");st.textContent=`.setrow.simple{grid-template-columns:20px 1fr 40px}.simplelbl{color:var(--muted);font-size:.85rem}.v2food{margin:10px 0}.v2foodlist{list-style:none;margin:0;padding:0;display:grid;gap:8px}.v2foodlist li{display:flex;justify-content:space-between;gap:10px;border-top:1px solid var(--line);padding-top:8px}`;
document.head.appendChild(st);
})();

/* ---------- glossary: tap a term to see what it means, or open the full list ---------- */
(function(){
const G=[
 ["Training",[
  ["rir","RIR","Reps in reserve: how many more clean reps you could have done when you stopped. 0 = couldn't do another (failure). 1 = one left. 2 = two left. Most working sets aim for 1 to 2. The app uses it to decide when to add weight."],
  ["tempo","Tempo","How fast you move the weight. \"3s down\" means take 3 seconds to lower it. Pause = stop for 1 to 2 seconds at the bottom. Hold top = squeeze at the top. Iso hold = hold still in one spot. Slower lowering makes a lighter weight work harder."],
  ["setsreps","Sets × reps","\"3 × 8-10\" means 3 sets of 8 to 10 reps. Pick a weight you can do at least 8 times. When every set reaches 10 at your target RIR two sessions in a row, the app suggests more weight."],
  ["perhand","Per hand","For moves with two dumbbells or kettlebells. Enter the weight of one dumbbell (a pair of 50s = 50). Totals count both hands."],
  ["perside","Per side","For moves done one arm or one leg at a time. Enter the reps for one side. Totals count both sides."],
  ["bw","+ lb (bodyweight)","For moves like push-ups and pull-ups. Leave it blank if you used just your body. If you wore a vest or belt, enter the added pounds."],
  ["progression","Weight suggestions","The app watches your logged sets. Top of the rep range on every set for 2 sessions in a row: add weight. Below the range 2 sessions: stay put. 3 sessions: drop the weight 5 to 10%."],
  ["deload","Deload","A planned easier week (same weights, fewer sets or less effort) so your body can recover and come back stronger."],
  ["warmup","Warm-up sets","Light sets before your working weight. They don't count toward your sets and get no weight suggestions."],
  ["lifted","Weight lifted","Weight × reps for every set, added up. Dumbbells count both hands, one-side moves count both sides, bodyweight moves count the part of your body weight they lift."],
  ["hardsets","Sets per muscle","Working sets that train a muscle. Most people grow well on about 10 to 20 a week per muscle."],
  ["estmax","Est. max (1RM)","The heaviest single rep you could probably do, estimated from your logged sets. Used to track strength without testing a true max."],
  ["zone2","Zone 2","Easy steady cardio where you can still talk in full sentences. Builds endurance without wearing you out."]]],
 ["Body scans",[
  ["inbody","InBody","A scale that sends a tiny safe current through your body to estimate muscle, fat and water. Scan at the same time of day each time for a fair comparison."],
  ["dexa","DEXA","A low-dose X-ray scan that measures fat, lean mass and bone. More precise than InBody. Compare DEXA with DEXA, not with InBody."],
  ["smm","SMM","Skeletal muscle mass: the muscle you can train (arms, legs, trunk), in pounds. The number to watch go up."],
  ["bf","Body fat %","The share of your weight that is fat. Also shown as PBF (percent body fat)."],
  ["lean","Lean mass","Everything that isn't fat: muscle, water, bone and organs."],
  ["bmr","BMR","Basal metabolic rate: calories your body burns at rest in a day, before any activity."],
  ["bmi","BMI","Body mass index: weight compared to height. It can't tell muscle from fat, so muscular people often read high."],
  ["tbw","Total body water","All the water in your body. Most of it lives in muscle."],
  ["ecw","ECW/TBW","Water outside your cells compared to all your water. About 0.36 to 0.39 is typical. Higher can mean swelling or inflammation."],
  ["drylean","Dry lean mass","Protein and minerals: your lean mass with the water taken out."],
  ["vfl","Visceral fat","Fat stored around your organs. Lower is healthier. InBody shows it as a level (under 10 is the target)."],
  ["segment","Muscle by body part","Lean mass in each arm, each leg and the trunk. 100% means average for your height. Left and right within about 3% is balanced."],
  ["smi","SMI","Skeletal muscle index: muscle in your arms and legs divided by your height squared."],
  ["phase","Phase angle","How healthy your cells are, from the scan's current. Higher is better; it tends to rise with training."],
  ["control","Fat and lean control","What the scan suggests gaining (+) or losing (-) for a balanced body. A rough guide, not a goal."]]],
 ["Food",[
  ["kcal","Calories (kcal)","Energy from food. Your target depends on your goal: more to build, less to lean out."],
  ["macros","Macros","Protein, carbs and fat, in grams. Protein builds muscle, carbs fuel training, fat supports hormones."],
  ["estimate","Meal estimate","When you type or photograph what you ate, your coach estimates calories and macros from typical portions. Close, not exact."]]]];
const e_=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const D={};G.forEach(([,list])=>list.forEach(([k,l,t])=>D[k]={l,t}));
window.F2C_term=(k,label)=>D[k]?`<button type="button" class="term" data-term="${k}">${label||D[k].l}<i class="ti" aria-hidden="true">?</i></button>`:(label||"");
function close(){const p=document.getElementById("termPop");if(p)p.remove()}
function pop(btn){close();openedAt=Date.now();const d=D[btn.dataset.term];if(!d)return;const p=document.createElement("div");p.id="termPop";p.className="termpop";p.setAttribute("role","dialog");
 p.innerHTML=`<b>${e_(d.l)}</b><p>${e_(d.t)}</p><button type="button" class="linkbtn small" data-allterms>All terms</button>`;document.body.appendChild(p);
 const r=btn.getBoundingClientRect(),w=Math.min(300,innerWidth-24);p.style.width=w+"px";p.style.left=Math.max(12,Math.min(innerWidth-w-12,r.left+r.width/2-w/2))+"px";
 const h=p.offsetHeight;p.style.top=(r.bottom+8+h<innerHeight?r.bottom+8:Math.max(12,r.top-h-8))+"px"}
function all(){close();const o=document.createElement("div");o.className="tgate";o.setAttribute("role","dialog");o.setAttribute("aria-modal","true");
 o.innerHTML=`<div class="tbox"><h2>What the terms mean</h2><div class="tscroll" tabindex="0">${G.map(([g,list])=>`<h4>${e_(g)}</h4><dl class="gloss">${list.map(([,l,t])=>`<dt>${e_(l)}</dt><dd>${e_(t)}</dd>`).join("")}</dl>`).join("")}</div><div class="nav"><button class="btn primary" type="button">Close</button></div></div>`;
 document.body.appendChild(o);o.querySelector(".nav button").onclick=()=>o.remove()}
window.F2C_glossary=all;
document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-term]");if(t){e.preventDefault();e.stopPropagation();const open=document.getElementById("termPop");if(open&&open.dataset.k===t.dataset.term){close();return}pop(t);document.getElementById("termPop").dataset.k=t.dataset.term;return}
 if(e.target.closest&&e.target.closest("[data-allterms]")){all();return}if(!(e.target.closest&&e.target.closest("#termPop")))close()},true);
let openedAt=0;addEventListener("scroll",()=>{if(Date.now()-openedAt>400)close()},{passive:true});
const foot=document.getElementById("foot");if(foot){const a=document.createElement("button");a.type="button";a.className="linkbtn";a.textContent="What the terms mean";a.onclick=all;foot.appendChild(document.createTextNode(" "));foot.appendChild(a)}
const st=document.createElement("style");st.textContent=`.term{all:unset;cursor:pointer;border-bottom:1.5px dotted currentColor;line-height:1.2}.term .ti{display:inline-grid;place-items:center;width:15px;height:15px;margin-left:4px;border-radius:50%;font:700 10px/1 system-ui,sans-serif;font-style:normal;background:#64748b;color:#fff;vertical-align:1px;text-transform:none;letter-spacing:0}
.termpop{position:fixed;z-index:9999;background:#0f172a;color:#f8fafc;border-radius:12px;padding:12px 14px;box-shadow:0 10px 30px rgba(0,0,0,.3);font-size:14px;line-height:1.4}.termpop p{margin:6px 0 8px}.termpop .linkbtn{color:#93c5fd}
.gloss dt{font-weight:700;margin-top:10px}.gloss dd{margin:2px 0 0}`;document.head.appendChild(st)})();
