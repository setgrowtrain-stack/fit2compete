# ---------- exercise kinds: stretches are check-only, bodyweight moves take optional added weight, timed holds take seconds ----------
rep('window.F2C_KI[`w${w}|${ui.day}|${s}|${k}`]={ex:ex.name,range:ex.reps||"",sets:n};',
    'window.F2C_KI[`w${w}|${ui.day}|${s}|${k}`]={ex:ex.name,range:ex.reps||"",sets:n};const K=window.F2C_exKind?F2C_exKind(ex):"load";')
rep('  rows+=`<div class="setrow${v.done?" isdone":""}"><span class="sn">${k}</span>\n   <label><span class="sr">Weight',
    '  rows+=K==="stretch"?`<div class="setrow simple${v.done?" isdone":""}"><span class="sn">${k}</span><span class="simplelbl">${e_(ex.reps||"")}${ex.tempo?" · "+e_(ex.tempo):""}</span><label class="chk"><input type="checkbox" data-k="${key}" data-f="done" ${v.done?"checked":""}><span class="sr">Set ${k} done</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg></label></div>`:`<div class="setrow${v.done?" isdone":""}"><span class="sn">${k}</span>\n   <label><span class="sr">Weight')
rep('placeholder="${prev&&prev.wt?e_(prev.wt):"lb"}"', 'placeholder="${prev&&prev.wt?e_(prev.wt):(K==="bw"?"BW":"lb")}"')
rep('placeholder="${prev&&prev.reps?e_(prev.reps):"reps"}"', 'placeholder="${prev&&prev.reps?e_(prev.reps):(K==="timed"?"sec":"reps")}"')
rep('<div class="sets"><div class="sethdr"><span></span><span>Weight</span><span>Reps</span><span>RIR</span><span>Tempo used</span><span></span></div>${rows}</div>',
    '<div class="sets">${K==="stretch"?"":`<div class="sethdr"><span></span><span>${K==="bw"?"+ lb":"Weight"}</span><span>${K==="timed"?"Seconds":"Reps"}</span><span>RIR</span><span>Tempo used</span><span></span></div>`}${rows}</div>')

# ---------- meals: check off, "ate something else", food log ----------
rep("\"Can't now\"}</button>`}</div></div></article>`",
    "\"Can't now\"}</button>`}${x.kind===\"meal\"&&window.F2C_foodBtn?F2C_foodBtn(x.i):\"\"}</div>${x.kind===\"meal\"&&window.F2C_foodNote?F2C_foodNote(x.i):\"\"}</div></article>`")
rep(' v.innerHTML=h;\n const gw=$("goWorkout");', ' h+=(window.F2C_foodLog?F2C_foodLog():"");\n v.innerHTML=h;\n const gw=$("goWorkout");')
rep('h+=`<div class="timeline">${(pick.meals||[]).map(x=>`<article class="tcard"><div class="ttime">${e_(x.time||"")}</div><div class="tbody"><h4>${e_(x.name)}</h4>',
    'h+=(window.F2C_foodLog?F2C_foodLog():"");\n h+=`<div class="timeline">${(pick.meals||[]).map((x,mi)=>`<article class="tcard"><div class="ttime">${e_(x.time||"")}</div><div class="tbody"><h4>${e_(x.name)}</h4>')
rep('${e_(x.calories)} kcal · ${e_(x.protein_g)} g protein · ${e_(x.carbs_g)} g carbs · ${e_(x.fat_g)} g fat</span></div></article>`).join("")}</div>`;\n if(m.groceryList',
    '${e_(x.calories)} kcal · ${e_(x.protein_g)} g protein · ${e_(x.carbs_g)} g carbs · ${e_(x.fat_g)} g fat</span>${window.F2C_mealActions?F2C_mealActions(pick,mi):""}</div></article>`).join("")}</div>`;\n if(m.groceryList')

rep('document.getElementById("regen").onclick=()=>{if(!A().mode)A().mode="full";step=SECTIONS.length-1;renderAll(false);setTimeout(()=>build(true),0)};',
    'document.getElementById("regen").onclick=()=>{if(athletes[cur]&&athletes[cur].plan&&!confirm("Start over with a brand-new plan?\\n\\nTo keep your plan and only adjust it for new answers, tap Cancel, then use Edit answers or Add new info instead."))return;if(!A().mode)A().mode="full";step=SECTIONS.length-1;renderAll(false);setTimeout(()=>build(true),0)};')

# ---------- credits for the 3D body (license requires attribution; kept here, not on screen) ----------
rep('Our not enforcing a term is not a waiver of it.</p>`;',
    'Our not enforcing a term is not a waiver of it.</p>\n<h4>Credits</h4>\n<p class="small">The 3D body uses muscle and skin models from BodyParts3D, &copy; The Database Center for Life Science, licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>; the models were simplified and recolored for this app. The 3D view runs on three.js (MIT License).</p>`;')

# ---------- per hand / per side: label the boxes and count both hands or both sides in the totals ----------
rep('const K=window.F2C_exKind?F2C_exKind(ex):"load";const SV=',
    'const K=window.F2C_exKind?F2C_exKind(ex):"load";const P=window.F2C_per?F2C_per(ex):{};const SV=')
rep('placeholder="${prev&&prev.wt?e_(prev.wt):(K==="bw"?"BW":"lb")}"',
    'placeholder="${prev&&prev.wt?e_(prev.wt):(K==="bw"?"BW":P.hand?"lb ea":"lb")}"')
rep('<span>${K==="bw"?"+ lb":"Weight"}</span><span>${K==="timed"?"Seconds":"Reps"}</span>',
    '<span>${K==="bw"?F2C_term("bw","+ lb"):P.hand?F2C_term("perhand","Each hand"):"Weight"}</span><span>${K==="timed"?"Seconds":P.side?F2C_term("perside","Reps / side"):"Reps"}</span>')
rep('<span>RIR</span><span>Tempo used</span>','<span>${F2C_term("rir","RIR")}</span><span>${F2C_term("tempo","Tempo used")}</span>')
rep('<div class="rx"><span><b>${n}</b> × ${e_(ex.reps||"")}</span>','<div class="rx"><span>${F2C_term("setsreps",`<b>${n}</b> × ${e_(ex.reps||"")}`)}</span>')
rep('${n!==+ex.sets?`<span class="muted">(${e_(ex.sets)} normally)</span>`:""}</div>',
    '${n!==+ex.sets?`<span class="muted">(${e_(ex.sets)} normally)</span>`:""}${P.tag&&K!=="stretch"?`<span class="pertag" title="${e_(P.tip)}">${e_(P.tag)}</span>`:""}</div>')

# ---------- workout timer, extra sets, added exercises ----------
rep('const L=LOG();h+=d.exercises.map((ex,i)=>exCard(swapped(ex),i,w,L)).join("")}',
    'const L=LOG();h+=XS.map((ex,i)=>exCard(swapped(ex),i,w,L)).join("")}')
rep('if(!d||!(d.exercises||[]).length){h+=`<div class="empty">',
    'h+=window.F2C_wkStart?F2C_wkStart(w,ui.day):"";const XS=((d&&d.exercises)||[]).concat(window.F2C_added?F2C_added(w,ui.day):[]);if(!XS.length){h+=`<div class="empty">')
rep(' h+=`</div>`;v.innerHTML=h;\n $("wPrev")', ' h+=`</div>`+(window.F2C_wkTools?F2C_wkTools(w,ui.day):"");v.innerHTML=h;\n $("wPrev")')
rep('const i=+(b.dataset.vidsave??b.dataset.vidclear),ex=d.exercises[i]','const i=+(b.dataset.vidsave??b.dataset.vidclear),ex=XS[i]')
rep('const r=rec(),ex=d.exercises[+b.dataset.i],k=','const r=rec(),ex=XS[+b.dataset.i],k=')
rep('const row=el.closest(".setrow");if(row&&f==="done")row.classList.toggle("isdone",el.checked);touch()}));',
    'const row=el.closest(".setrow");if(row&&f==="done")row.classList.toggle("isdone",el.checked);touch();if(f==="done"&&window.F2C_setDone)F2C_setDone(k,el.checked)}));')
rep('function exCard(ex,i,w,L){const s=slug(ex.name),n=setsFor(ex.sets,w);for(let k=1;k<=n;k++)window.F2C_KI[`w${w}|${ui.day}|${s}|${k}`]={ex:ex.name,range:ex.reps||"",sets:n};',
    'function exCard(ex,i,w,L){const s=slug(ex.name),n=setsFor(ex.sets,w)+(window.F2C_extra?F2C_extra(w,ui.day,s):0);for(let k=1;k<=n;k++)window.F2C_KI[`w${w}|${ui.day}|${s}|${k}`]={ex:ex.name,range:ex.reps||"",sets:n,rest:ex.rest||""};')
rep('${P.tag&&K!=="stretch"?`<span class="pertag"','${window.F2C_restSec?`<span class="pertag">Rest ${(r=>r>=60?Math.floor(r/60)+":"+String(r%60).padStart(2,"0"):r+" s")(F2C_restSec(ex.name,ex.rest))}</span>`:""}${P.tag&&K!=="stretch"?`<span class="pertag"')
rep('${rows}</div>\n  <button class="histbtn"','${rows}</div>${window.F2C_setBtns?F2C_setBtns(w,ui.day,s,ex):""}\n  <button class="histbtn"')

# ---------- KOT warm-ups split into moves, where you train today, interval button, track options ----------
rep('let rows="";for(let k=1;k<=n;k++){const key=`w${w}|${ui.day}|${s}|${k}`',
    'const WR=K==="stretch"&&window.F2C_warmRows?F2C_warmRows(ex,w,ui.day,s,n,L):null;let rows=WR||"";for(let k=1;k<=n&&!WR;k++){const key=`w${w}|${ui.day}|${s}|${k}`')
rep('${rows}</div>${window.F2C_setBtns?F2C_setBtns(w,ui.day,s,ex):""}',
    '${rows}</div>${(K==="timed"||K==="stretch")&&window.F2C_workBtn?F2C_workBtn(ex,s):""}${window.F2C_setBtns?F2C_setBtns(w,ui.day,s,ex):""}')
rep('h+=window.F2C_wkStart?F2C_wkStart(w,ui.day):"";',
    'h+=(window.F2C_whereBox?F2C_whereBox(w,ui.day):"")+(window.F2C_wkStart?F2C_wkStart(w,ui.day):"");')
rep('function swapped(ex){const r=rec(),k=`${ui.day}|${slug(ex.name)}`,alt=r.swaps&&r.swaps[k];',
    'function swapped(ex){const r=rec(),k=`${ui.day}|${slug(ex.name)}`,alt=(r.swapsWk&&r.swapsWk[`w${ui.week}|${k}`])||(r.swaps&&r.swaps[k]);')
rep('r.swaps=r.swaps||{};\n  if(b.dataset.swapto)r.swaps[k]=b.dataset.swapto;else delete r.swaps[k];touch();rWorkouts()',
    'r.swaps=r.swaps||{};r.swapsWk=r.swapsWk||{};const kw=`w${ui.week}|${k}`,today=window.F2C_where&&F2C_where()!=="usual";if(b.dataset.swapto){if(today)r.swapsWk[kw]=b.dataset.swapto;else r.swaps[k]=b.dataset.swapto}else{delete r.swapsWk[kw];delete r.swaps[k]}touch();rWorkouts()')
rep('function swapBox(ex,i){if(!window.F2C_swaps)return "";const base=ex.orig?{name:ex.orig,alts:ex.alts}:ex,a=rec().a||{};',
    'function swapBox(ex,i){if(!window.F2C_swaps)return "";const base=ex.orig?{name:ex.orig,alts:ex.alts}:ex,a=window.F2C_whereA?F2C_whereA(rec().a||{}):(rec().a||{}),away=window.F2C_where&&F2C_where()!=="usual";')
rep('<button type="button" class="linkbtn small" data-swap="${i}">⇄ ${ex.orig?"Swapped. Change":"Swap equipment"}</button><div class="swapbox" hidden>',
    '<button type="button" class="linkbtn small" data-swap="${i}">⇄ ${ex.orig?"Swapped. Change":away?"Options for today ("+opts.length+")":"Swap equipment"}</button><div class="swapbox"${away&&!ex.orig?"":" hidden"}>')
rep('window.F2C_T={rec,LOG,','window.F2C_T={build:(...x)=>build(...x),rec,LOG,')
rep('ghd:/back extension|ghd/i,machine:/plate-loaded|machines/i};',
    'ghd:/back extension|ghd/i,machine:/plate-loaded|machines/i,sled:/sled/i,rower:/rower/i,bike:/bike/i,treadmill:/treadmill/i,track:/track or field/i};')
rep('const F=[\n',r'''const F=[
 {re:/acceleration sprint|block start|\bsprints?,? \d+ (to \d+ )?m\b/,not:/fly/,alts:[["Acceleration sprints, 20 to 30 m",["track"],""],["Sprints on a field, park or quiet street, 20 to 30 m",["bodyweight"],""],["Hill sprints, 8 to 10 sec, walk-down rest",["bodyweight"],""],["Sled sprints, 20 m, light sled",["sled"],""],["Air bike sprints, 6 to 8 sec all-out, 2 min easy",["bike"],""]]},
 {re:/fly sprint|flying sprint|fly zone/,alts:[["Fly sprints, 20 m fly zone",["track"],""],["Fly sprints on a field or street: 20 m build, 20 m fast",["bodyweight"],""],["Air bike fly: 10 sec build, 6 sec max, 2 min easy",["bike"],""],["Rower fly: 10 sec build, 8 sec max, 2 min easy",["rower"],""]]},
 {re:/\b(150|200|300|400|500)\s*m\b|\bladder\b|speed endurance/,alts:[["Same reps on a flat road, park path or field (measure with your watch)",["bodyweight"],""],["Hill runs, 25 to 35 sec at 90%, walk-down rest",["bodyweight"],""],["Air bike: 30 sec at 90%, 4 min easy",["bike"],""],["Rower: 45 sec hard, 4 min easy",["rower"],""],["Rowing machine 4x4 intervals",["rower"],""],["Air bike 4x4 intervals",["bike"],""]]},
 {re:/4\s*x\s*4|norwegian 4/,alts:[["Rowing machine 4x4 intervals",["rower"],""],["Air bike 4x4 intervals",["bike"],""],["Uphill treadmill 4x4 intervals",["treadmill"],""],["Hill or track 4x4 run intervals",["bodyweight"],""]]},
''')
rep('  {id:"stress",l:"Life and work stress",type:"select",o:["Low","Moderate","High"],lvl:"q"},',
    '  {id:"stress",l:"Life and work stress",type:"select",o:["Low","Moderate","High"],lvl:"q"},\n  {id:"hiit",l:"4x4 interval challenge (VO2 max)",type:"select",o:["No","Once a week","Twice a week","Let my coach decide"],lvl:"q",h:"4 hard 4-minute rounds with 3 minutes easy between, about 40 minutes. Raises VO2 max more than easy cardio."},')
rep('For health, longevity or VO2 max goals add one hard interval session such as 4 x 4 min at 85 to 95% of max heart rate with 3 min easy, ramped over 3 to 4 weeks.',
    'For health, longevity or VO2 max goals add one hard interval session such as 4 x 4 min at 85 to 95% of max heart rate with 3 min easy, ramped over 3 to 4 weeks.\n- 4x4 INTERVALS (Norwegian 4x4): follow the athlete\'s "4x4 interval challenge" answer; "Let my coach decide" = 1 a week when building muscle or in contest prep, 2 a week when heart health or VO2 max is the main goal. Session: 10 min warm-up, 4 x 4 min at 85 to 95% of max heart rate (only a few words possible), 3 min easy at about 60 to 70% between, 5 min cool-down; about 40 min. Week 1: 3 x 4 at 85 to 90%, then 4 x 4. Put it in days[] as its own exercise named like "Rowing machine 4x4 intervals" with sets 4, reps "4 min", rest "3 min" so the app times it. Use the rower or bike when building muscle (less interference and impact than running). Count sprint, track and other hard interval sessions toward a cap of 2 to 3 hard conditioning days a week; never the day before heavy legs or sprints. 3 a week only for a 6 to 8 week VO2 max block with lifting volume cut. Sickle cell trait: cap at about 90% of max heart rate or use 5 x 3 min, hydrate, stop for cramping or "wooden" legs. Known heart disease, chest pain, fainting, or an open doctor question about heart testing: say the doctor should OK interval work first.')
rep('function family(name){const n=String(name||"").toLowerCase();if(',
    'function family(name){const n=String(name||"").toLowerCase();if(!/warm.?up/.test(n)){const tr=F.slice(0,4).find(f=>f.re.test(n)&&!(f.not&&f.not.test(n)));if(tr)return tr}if(')

# ---------- supplement review ----------
rep('$("suppEdSave").onclick=()=>{a.suppItems=ed.get();a.suppConfirmed=Date.now();ui.suppEdit=false;touch();rSupps()};return}',
    '$("suppEdSave").onclick=()=>{a.suppItems=ed.get();a.suppConfirmed=Date.now();ui.suppEdit=false;touch();if(window.F2C_suppSaved)F2C_suppSaved(a);rSupps()};return}')
rep(' v.innerHTML=h;wireSuppChecks(v);',' v.innerHTML=h+(window.F2C_suppReviewHtml?F2C_suppReviewHtml():"");wireSuppChecks(v);')

# ---------- supplement rules: calories vs the eating window, NAC, urolithin A ----------
rep('const VERSION="2026-11-09.1";','const VERSION="2026-11-26.1";')
rep(''' nongel_fiber:{label:"Non-gel fiber (wheat dextrin, inulin)",place:"keep",food:"either",
  why:"Dissolves without gelling; timing doesn't matter.",evidence:"limited",
  src:["Product label"],''',''' nongel_fiber:{label:"Non-gel fiber (wheat dextrin, inulin)",place:"firstMeal",food:"either",kcal:true,
  why:"Dissolves without gelling, so timing doesn't matter for how it works. It has calories (Benefiber: 15 per 2 tsp), so it goes inside your eating window.",evidence:"limited",
  src:["Benefiber label: 2 tsp = 15 calories, 4 g carbohydrate"],''')
rep(''' nac:{label:"NAC",place:"keep",food:"either",
  why:"No meaningful timing data; keep your usual time.",evidence:"none",
  src:["NIH LiverTox / product label"],''',''' nac:{label:"NAC",place:"keep",food:"either",
  why:"No good evidence that food changes how much you absorb, and labels like NOW's give no food direction. Upset stomach is its most common side effect: if it bothers you on an empty stomach, take it with a meal.",evidence:"limited",
  src:["NOW NAC 600 mg label: take 1 capsule twice daily","Papi et al. 2021, Adv Ther (oral NAC peaks 1 to 2 h, half-life about 6 h)"],''')
rep(''' protein:{label:"Protein powder or shake",place:"post",food:"either",rest:"keep",''',''' protein:{label:"Protein powder or shake",place:"post",food:"either",rest:"keep",kcal:true,''')
rep(''' fish_oil:{label:"Fish oil / omega-3",place:"fatMeal",food:true,''',''' fish_oil:{label:"Fish oil / omega-3",place:"fatMeal",food:true,kcal:true,''')
rep(''' citrulline:{label:"L-citrulline / citrulline malate",place:"pre",pre:[45,90],food:false,rest:"firstMeal",''',''' citrulline:{label:"L-citrulline / citrulline malate",place:"pre",pre:[45,90],food:false,rest:"firstMeal",kcal:true,''')
rep(''' nitrate:{label:"Beetroot / nitrate",place:"pre",pre:[120,180],food:"either",rest:"skip",''',''' nitrate:{label:"Beetroot / nitrate",place:"pre",pre:[120,180],food:"either",rest:"skip",kcal:true,''')
rep(''' gel_fiber:{label:"Gel-forming fiber (psyllium, beta-glucan powder, glucomannan)",place:"fiberMeal",food:true,''',''' gel_fiber:{label:"Gel-forming fiber (psyllium, beta-glucan powder, glucomannan)",place:"fiberMeal",food:true,kcal:true,''')
rep(''' ashwagandha:{label:"Ashwagandha",place:"bed",food:"either",''',''' urolithin:{label:"Urolithin A (Mitopure)",place:"firstMeal",food:"either",kcal:true,
  why:"Label: with meals or on an empty stomach, so timing doesn't change how it works. The softgels have 10 calories and 1 g fat per 2, so if you fast they go with your first meal.",evidence:"limited",
  src:["Timeline Mitopure Softgels label: take 2 softgels daily with meals or on an empty stomach; 10 calories, 1 g fat per serving"],
  match:/urolithin|mitopure/i},
 ashwagandha:{label:"Ashwagandha",place:"bed",food:"either",''')
# check: anything with calories must sit inside the eating window
rep(' if(t<ctx.eatStart&&c.food===true)fails.push("needs food, and this is before your first meal");',
    ' if(t<ctx.eatStart&&c.food===true)fails.push("needs food, and this is before your first meal");\n if(c.kcal&&(t<ctx.eatStart-5||t>ctx.eatEnd+30))fails.push("has calories, so it would break your fast; it goes inside your eating window");')
rep('  if(their&&their.spread){placed.push({i,it,spread:true,t:ctx.wake,why:c.why',
    '  if(their&&their.spread&&c.kcal){placed.push({i,it,t:ctx.eatStart,why:c.why,moved:`Moved from ${it.time}: it has calories, so sip it during your eating window, not while fasting.`,from:ctx.wake});return}\n  if(their&&their.spread){placed.push({i,it,spread:true,t:ctx.wake,why:c.why')

# v2.9: detailed health answers satisfy the quick-mode summary question
rep('function filled(a,f){if(f.type==="photos")',
    'function filled(a,f){if(f.id==="q_any"&&empty(a.q_any)&&PARQ7.every(k=>!empty(a[k])))return true;if(f.type==="photos")')
# v2.9: a way back to the current plan from the questions, without rebuilding
rep('const _renderStep=renderStep;renderStep=function(){_renderStep();',
    'const _renderStep=renderStep;renderStep=function(){_renderStep();try{const rr=athletes[cur],sb=document.getElementById("stepBody");if(rr&&rr.plan&&sb&&!document.getElementById("keepPlanBox")){const d=document.createElement("div");d.id="keepPlanBox";d.className="savedNote";d.style.marginBottom="14px";d.innerHTML=`<span><b>Your current plan is still here.</b> Your answers are saved. Go back to it now, or finish here and build an updated plan.</span><div class="nav"><span></span><button class="btn" type="button" id="keepPlanBtn">Back to my plan</button></div>`;sb.prepend(d);document.getElementById("keepPlanBtn").onclick=()=>{try{readStep()}catch(e){}renderAll(true);window.scrollTo(0,0)}}}catch(e){}')

# v2.10: only name, height, weight and goal are required; nothing else ever blocks a plan
rep('function missingIn(a,sec){',
    'const F2C_REQ=["name","age","height","weight","focus"];SECTIONS.forEach(s=>s.f.forEach(f=>{f.req=F2C_REQ.includes(f.id)?1:0}));\nfunction missingIn(a,sec){')
# the button never sits there dead: it says what's needed and jumps to it; with a plan on file it updates that plan
rep('${missing.length||(+a.age>0&&+a.age<13)?" disabled":""}>Build my plan</button>',
    '${(+a.age>0&&+a.age<13)?" disabled":""}>${athletes[cur]&&athletes[cur].plan?"Update my plan":"Build my plan"}</button>')
rep('async function build(regen){\n if(BUSY)return;',
    'async function build(regen){\n if(BUSY)return;\n {const mm=allMissing(A());if(mm.length){const si=SECTIONS.findIndex(s=>s.f.includes(mm[0]));const st0=document.getElementById("buildStatus");if(st0)st0.textContent="Add your "+mm.map(f=>lbl(f,A()).replace(/\\?$/,"").toLowerCase()).join(", ")+" first. Taking you there.";setTimeout(()=>{try{readStep()}catch(e){}showMissing=true;step=si<0?0:si;persist(cur);renderStep();window.scrollTo(0,0)},1200);return}}')
# blank answers get safe, stated defaults in every plan request
rep('function intakeText(a){',
    'function F2C_gaps(a){const g=[];const v=k=>!empty(a[k]);\n if(!PARQ.some(v))g.push("NOT ANSWERED: health screen. Treat as not screened: keep conditioning moderate, no max-effort or all-out intervals in the first 2 weeks, and list a pre-exercise health check with a doctor as step one.");\n else if(!anyYes(a)&&!v("q_any")&&PARQ7.some(k=>!v(k)))g.push("NOT ANSWERED: part of the health screen. Keep conditioning moderate until it is answered.");\n if(!v("age"))g.push("NOT ANSWERED: age. Program as for an adult beginner-to-intermediate; ask for age in the summary.");\n else if(+a.age<18&&a.minor!=="Yes")g.push("NOT ANSWERED: parent or guardian agreement for an athlete under 18. Use teen-appropriate, technique-first programming, no maximal lifts, and say a parent should review the plan.");\n if(!v("days"))g.push("NOT ANSWERED: training days. Use 3 lifting days a week.");\n if(!v("sex"))g.push("NOT ANSWERED: sex. Use ranges that work for either, and note it in the summary.");\n return g.length?"\\n"+g.join("\\n"):""}\nfunction intakeText(a){return _intakeText(a)+F2C_gaps(a)}\nfunction _intakeText(a){')
# review screen says plainly what a blank health screen means instead of blocking
rep('if(+a.age>0&&+a.age<13)h+=',
    'if(!PARQ.some(k=>!empty(a[k])))h+=`<div class="note gold"><b>Health screen not answered.</b> That\'s fine. Your plan will keep conditioning moderate at first and list a quick check with your doctor as step one. You can answer it any time.</div>`;\n if(+a.age>0&&+a.age<13)h+=')
