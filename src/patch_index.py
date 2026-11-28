"""Turns the live v1 screens (Netlify, Anthropic key) into v2 (GitHub Pages, Claude scheduled tasks)."""
import re, sys, time

src, dst, module = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(src, encoding='utf-8').read()
BUILD = str(int(time.time()))

def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f'expected {count} of {old[:90]!r}, found {n}')
    s = s.replace(old, new)

def between(start, end, new):
    """Replace text from start (inclusive) up to end (exclusive)."""
    global s
    a = s.index(start); b = s.index(end, a)
    s = s[:a] + new + s[b:]

# ---------- paths for GitHub Pages (served from a sub-folder) ----------
rep('<link rel="manifest" href="/manifest.webmanifest">', '<link rel="manifest" href="manifest.webmanifest">')
rep('<link rel="icon" href="/icons/icon-192.png" type="image/png">', '<link rel="icon" href="icons/icon-192.png" type="image/png">')
rep('<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">', '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">')
rep('fetch("/version.json?t="', 'fetch("version.json?t="')
rep('navigator.serviceWorker.register("/sw.js")', 'navigator.serviceWorker.register("sw.js")')
s = re.sub(r'window\.F2C_BUILD="\d+"', f'window.F2C_BUILD="{BUILD}"', s, count=1)

# ---------- AI bridge: no key; judgment work is queued for Claude's scheduled runs ----------
between('sample={\n json:async(prompt,opts={})=>', 'LIM={images:{maxCount:20}};',
 'sample={\n json:async(prompt,opts={})=>{if(opts&&opts.job)return F2C_queue(opts.job,prompt,opts);throw{code:"later"}},\n limits:async()=>({images:{maxCount:20}})};\n')

rep('function errCopy(e){const c=e&&e.code;',
    'function errCopy(e){const c=e&&e.code;'
    'if(c==="queued")return "Sent to your coach. The answer arrives on the next coach run, usually within 3 hours. This page updates on its own.";'
    'if(c==="later")return "Your coach handles this on the next run.";'
    'if(c==="read_only")return "Only the athlete can send this.";')

# Plan: one request; Claude writes the whole plan (all workout days) and the meal plan together.
between('async function build(regen){', 'function errCopy(e){', r'''async function build(regen){
 if(BUSY)return;
 if(await appOutdated())return;
 const st=statusSink(document.getElementById("buildStatus")?"buildStatus":"reviseStatus");BUSY=true;
 const a=A();const btns=[document.getElementById("build"),document.getElementById("regen")].filter(Boolean);btns.forEach(b=>b.disabled=true);
 try{
  if(st)st.textContent="Sending your answers to your coach…";
  const rec=athletes[cur];const files=F2C_planFiles(rec);const now=intakeNow(a);
  const supp=window.F2C_suppText?"\n\nAPP SUPPLEMENT SCHEDULE (built from fixed rules; treat as correct and do not change)\n"+F2C_suppText(a):"";
  if(rec.plan&&!regen){
   // Existing plan: adjust it for what changed instead of writing a new one.
   const before=String(rec.planIntake||"").split("\n"),after=now.split("\n");
   const added=after.filter(l=>l&&!before.includes(l)),removed=rec.planIntake?before.filter(l=>l&&!after.includes(l)):[];
   if(rec.planIntake&&!added.length&&!removed.length){if(st)st.textContent="Nothing changed since your plan was written, so your plan stays the same.";return}
   const prog=window.F2C_progressText?F2C_progressText():"";
   const prompt=METHOD+"\n\nATHLETE INTAKE (current)\n"+intakeText(a)+(rec.planIntake?"\n\nWHAT CHANGED IN THE ATHLETE'S ANSWERS SINCE THE PLAN WAS WRITTEN\nNew or changed:\n"+(added.join("\n")||"none")+"\nNo longer true:\n"+(removed.join("\n")||"none"):"\n\nThe athlete updated their answers; compare the intake with the current plan to find what changed.")+
    "\n\nCURRENT PLAN (JSON, with workouts)\n"+JSON.stringify(rec.plan)+(prog?"\n\nPROGRESS FROM THE APP\n"+prog:"")+supp+"\n\n"+files.text+"\n\n"+ADJUST_RULES;
   await persistNow(cur);
   rec.planIntake=now;rec.updated=Date.now();persist(cur);
   await F2C_submit("revise",prompt,{fileIds:files.ids.slice(0,12),meta:{kind:"update"}});
   if(st)st.textContent="Sent to your coach as an update to your current plan (only what your new answers affect will change). "+errCopy({code:"queued"}).replace(/^Sent to your coach\. /,"");
   return}
  const full=a.mealPlanType==="Full 7-day meal plan";
  const want=full?"Write 7 meal days (Mon to Sun), labeling training and rest days to match the training week.":"Write two meal days: one training day and one rest day.";
  const prompt=METHOD+PLAN_V2+"\n\nMEAL PLAN RULES (for the \"meals\" part)\n"+MEAL_PROMPT+"\n"+want+"\n\nATHLETE INTAKE\n"+intakeText(a)+"\n\n"+files.text+supp;
  rec.planIntake=now;rec.updated=Date.now();await persistNow(cur);
  await F2C_submit("plan",prompt,{fileIds:files.ids,meta:{kind:"plan"}});
  if(st)st.textContent=errCopy({code:"queued"});
 }catch(e){if(st)st.textContent=errCopy(e)}
 finally{BUSY=false;st.done();btns.forEach(b=>b.disabled=false);const bb=$("build");if(bb)bb.disabled=false}
}
function intakeNow(a){return intakeText(a).split("\n").filter(l=>!/^Today's date:/.test(l)&&!/^NOT ANSWERED:/.test(l)).join("\n")}
const ADJUST_RULES=`HOW TO CHANGE AN EXISTING PLAN (the athlete asked that new information adjusts their plan, not replaces it):
- Keep the plan. Change only what the new or changed information actually affects. Keep the week layout, exercise names and order, sets, rep ranges and tempos the same unless the change requires otherwise, because the athlete's progress tracking follows exercise names.
- Never swap exercises for variety. When an exercise must change (injury, equipment), pick the closest replacement for the same muscles and keep its sets and reps.
- Adjust nutrition numbers only if the new information changes them (weight, goal, labs, schedule).
- Write a new plan from scratch ONLY when the change makes the current plan wrong or unsafe as a whole: a different main goal or sport, a new injury that rules out much of the plan, a big change in training days or equipment, or a new show date that changes the phases. Then set "rebuilt":true and say why first in "changes".
- Add "changes":["what changed and why, one line each"]. If nothing needs to change, return the plan unchanged with "changes":["Your new information doesn't change the plan: <one line why>"].
Reply with ONLY one JSON object: {"plan": <the full plan in the OUTPUT shape, including every day in "days">}. Add "meals": <a new meal plan in the app's meal plan shape> only if calories or foods changed.`;
const PLAN_V2=`\n\nTHIS REQUEST (Fit 2 Compete v2, answered by the coach's scheduled run): write the COMPLETE plan in the OUTPUT shape, INCLUDING "days": one entry for every non-rest day in "week", each with at most 9 exercises including one short warm-up item, no cool-down item; for each exercise give name, sets, reps (a range such as "8-10" for lifts), tempo where it matters, notes of at most 12 words (include the rest time, for example "rest 2 min"), and "alts": 1 or 2 short names of exercises for the same muscles using DIFFERENT equipment they have ([] for warm-ups and cardio). The "week" list names every day Mon to Sun ("Rest" for rest days). Leave "supplements" as an empty list and write no supplement or medication timing. Repeat every stop and caution item from the CODE CHECKS in safety. Look at every attached Drive file (photos, lab reports, scans, equipment) before writing. Before you answer, check the plan against the intake, the safety rules and the app supplement schedule, and fix anything that conflicts.\nReply with ONLY one JSON object: {"plan": <the plan in the OUTPUT shape with days>, "meals": <the meal plan in the meal plan shape below>}.`;
''')

between('async function buildMeals(){', 'document.getElementById("reviseBtn").onclick=', r'''async function buildMeals(){
 if(BUSY||await appOutdated())return;
 const st=statusSink("mealStatus"),b=document.getElementById("mealBtn")||{};
 const rec=athletes[cur],a=rec.a,p=rec.plan;if(!p){st.done();return}
 if(F2C_pending("meals")||F2C_pending("plan")){st.textContent=errCopy({code:"queued"});st.done();return}
 BUSY=true;b.disabled=true;st.textContent="Sending to your coach…";
 const full=a.mealPlanType==="Full 7-day meal plan";
 const want=full?"Write 7 days (Mon to Sun), labeling training and rest days to match the training week.":"Write two days: one training day and one rest day.";
 try{
  const prompt=MEAL_PROMPT+"\n\n"+want+"\n\nATHLETE INTAKE\n"+intakeText(a)+"\n\nTRAINING WEEK\n"+JSON.stringify(p.week||[])+"\n\nNUTRITION TARGETS FROM THE PLAN\n"+JSON.stringify(p.nutrition||{})+
   (F2C_X.targets&&F2C_X.targets.by!=="plan"?"\n\nCURRENT TARGETS SET BY THE COACH (use these)\n"+JSON.stringify(F2C_X.targets):"");
  await F2C_submit("meals",prompt,{meta:{kind:"meals"}});st.textContent=errCopy({code:"queued"});
 }catch(e){st.textContent=errCopy(e);b.disabled=false}finally{BUSY=false;st.done()}}

''')

between('document.getElementById("reviseBtn").onclick=async()=>{', 'function list(arr){', r'''document.getElementById("reviseBtn").onclick=async()=>{
 if(BUSY||await appOutdated())return;
 const st=document.getElementById("reviseStatus"),req=document.getElementById("reviseText").value.trim();
 if(!req){st.textContent="Type the change you want first.";return}
 const b=document.getElementById("reviseBtn");b.disabled=true;st.textContent="Sending to your coach…";
 try{
  const old=athletes[cur].plan;
  const prog=window.F2C_progressText?F2C_progressText():"";
  const prompt=METHOD+"\n\nATHLETE INTAKE\n"+intakeText(A())+"\n\nCURRENT PLAN (JSON, with workouts)\n"+JSON.stringify(old)+(prog?"\n\nPROGRESS FROM THE APP\n"+prog:"")+"\n\nREQUESTED CHANGE\n"+req+
   "\n\nApply the change if it is safe and sensible; if it conflicts with the rules or the evidence, keep the plan sound and explain why in summary.\n\n"+ADJUST_RULES;
  await F2C_submit("revise",prompt,{fileIds:F2C_planFiles().ids.slice(0,10),meta:{kind:"revise"}});
  document.getElementById("reviseText").value="";st.textContent=errCopy({code:"queued"});
 }catch(e){st.textContent=errCopy(e)}finally{b.disabled=false}};

''')

# Reading lab reports, scans and supplement lists: the file is saved to Drive and read on the next run.
rep(' if(!file._fromDrive)saveCopy(cur,id,file);\n const st=document.getElementById("st_"+id)',
    ' const savedId=file._fromDrive?null:await saveCopy(cur,id,file);\n const st=document.getElementById("st_"+id)')
between('  const r=await sample.json((id==="labs"?LAB_PROMPT:id==="supps"?SUPP_PROMPT:SCAN_PROMPT)', ' }catch(e){say(e&&e.code?errCopy(e):"Couldn\'t read that file. Try a clearer photo, or type the numbers in.")}', r'''  const fl=((A().files||{})[id]||[]);const fid=savedId||(fl.length?fl[fl.length-1].id:null);
  await F2C_submit("read",(id==="labs"?LAB_PROMPT:id==="supps"?SUPP_PROMPT:SCAN_PROMPT)+(text?"\n\nREPORT TEXT\n"+text:"\n\nThe report is the attached Drive file."),{fileIds:fid?[fid]:[],meta:{kind:"doc",field:id,name}});
  say("Saved. Your coach reads it on the next run (usually within 3 hours) and fills this in. You can type the key numbers now if you want.");
''')

# Equipment and meal photos
between('  if(id==="equipPhotos"){\n   const r=await sample.json(EQUIP_PROMPT()', ' }catch(e){say(errCopy(e))}finally{const b=document.querySelector(`[data-gact="${id}"]`)', r'''  const fl=((A().files||{})[id]||[]).map(m=>m.id);const ids=g.map(p=>p.driveId).filter(Boolean);
  await F2C_submit("read",id==="equipPhotos"?EQUIP_PROMPT():MEAL_PHOTO_PROMPT,{fileIds:(ids.length?ids:fl).slice(-10),images:ids.length||fl.length?[]:g.map(p=>p.file),meta:{kind:"gallery",field:id}});
  say("Sent to your coach. The list fills in on the next run, usually within 3 hours.");
''')

# App data and food log imports
rep('''    const r=await sample.json((id==="foodLog"?FOOD_PROMPT:DEVICE_PROMPT)+(body?"\\n\\nDATA\\n"+body:"\\n\\nThe data is in the attached screenshots."),opts);
    if(!r||!r.summary)throw{code:"invalid_json"};summary=String(r.summary).trim()}}''',
'''    await F2C_submit("read",(id==="foodLog"?FOOD_PROMPT:DEVICE_PROMPT)+(body?"\\n\\nDATA\\n"+body:"\\n\\nThe data is in the attached screenshots."),{images:texts.length?[]:imgs.slice(0,8),meta:{kind:"import",field:id}});
    skipped.push("files that need your coach to read (sent; the summary is added on the next run, usually within 3 hours)")}}''')
rep(' if(!sample)skipped.push("files that need Claude to read (Claude isn\'t available in this view)");\n   else if',
    ' if(false)skipped.push("");\n   else if')

# Typed supplement list
rep('try{const r=await sample.json(SUPP_PROMPT+"\\n\\nLIST AS TYPED OR SAVED\\n"+a.supps,{modelTier:"quick",maxTokens:3000,cache:false});',
    'try{const r=await sample.json(SUPP_PROMPT+"\\n\\nLIST AS TYPED OR SAVED\\n"+a.supps,{job:"suppList",meta:{kind:"suppList"}});')

# ---------- Workouts: RIR per set, sync to the Sheet, progression suggestion ----------
rep('.setrow{display:grid;grid-template-columns:22px minmax(0,1fr) minmax(0,.8fr) minmax(0,1.3fr) 40px;gap:6px;align-items:center}',
    '.setrow{display:grid;grid-template-columns:20px minmax(0,1fr) minmax(0,.8fr) minmax(0,.72fr) minmax(0,1fr) 40px;gap:5px;align-items:center}.setrow select[data-f=rir]{padding:6px 2px;text-align:center}')
rep('<div class="sethdr"><span></span><span>Weight</span><span>Reps</span><span>Tempo used</span><span></span></div>',
    '<div class="sethdr"><span></span><span>Weight</span><span>Reps</span><span>RIR</span><span>Tempo used</span><span></span></div>')
rep('''   <label><span class="sr">Tempo used, set ${k}</span><select data-k="${key}" data-f="t"''',
    '''   <label><span class="sr">Reps in reserve, set ${k}</span><select data-k="${key}" data-f="rir" class="${v.rir?"on":""}">${RIRS.map(o=>`<option value="${o[0]}"${o[0]===(v.rir||"")?" selected":""}>${o[1]}</option>`).join("")}</select></label>
   <label><span class="sr">Tempo used, set ${k}</span><select data-k="${key}" data-f="t"''')
rep('function exCard(ex,i,w,L){const s=slug(ex.name),n=setsFor(ex.sets,w);',
    'function exCard(ex,i,w,L){const s=slug(ex.name),n=setsFor(ex.sets,w);for(let k=1;k<=n;k++)window.F2C_KI[`w${w}|${ui.day}|${s}|${k}`]={ex:ex.name,range:ex.reps||"",sets:n};')
rep('''  <div class="rx"><span><b>${n}</b> × ${e_(ex.reps||"")}</span>''',
    '''  ${window.F2C_chip?F2C_chip(s):""}<div class="rx"><span><b>${n}</b> × ${e_(ex.reps||"")}</span>''')
rep('''  if(!L[k].wt&&!L[k].reps&&!L[k].t&&!L[k].done)delete L[k];if(el.tagName==="SELECT")el.classList.toggle("on",!!el.value);''',
    '''  if(!L[k].wt&&!L[k].reps&&!L[k].t&&!L[k].done&&!L[k].rir)delete L[k];if(el.tagName==="SELECT")el.classList.toggle("on",!!el.value);window.F2C_setChanged&&F2C_setChanged(k);''')
rep('const TEMPOS=[', 'const RIRS=[["","RIR"],["0","0"],["1","1"],["2","2"],["3","3"],["4","4+"]];\nconst TEMPOS=[')
rep('''sets.push(`${e_(v.wt||"–")}×${e_(v.reps||"–")}''', '''sets.push(`${e_(v.wt||"–")}×${e_(v.reps||"–")}${v.rir?` <em>RIR ${e_(v.rir)}</em>`:""}''')

# ---------- Scans tab ----------
rep(''' coach:'<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>'};''',
    ''' coach:'<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',body:'<path d="M12 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM7 9h10M12 9v12M9 21l3-6 3 6"/>'};''')
rep('const TABS=[["today","Today"],["workouts","Workouts"],["meals","Meals"],["supps","Supps"],["coach","Coach"],["plan","Plan"]];',
    'const TABS=[["today","Today"],["workouts","Workouts"],["meals","Meals"],["supps","Supps"],["body","Body"],["coach","Coach"],["plan","Plan"]];')
rep('<div id="v-supps" class="pview"></div><div id="v-coach" class="pview"></div>',
    '<div id="v-supps" class="pview"></div><div id="v-body" class="pview"></div><div id="v-coach" class="pview"></div>')
rep('coach:()=>window.F2C_rCoach&&window.F2C_rCoach()})[ui.tab]();',
    'coach:()=>window.F2C_rCoach&&window.F2C_rCoach(),body:()=>window.F2C_rBody&&window.F2C_rBody()})[ui.tab]();')

# ---------- Today: coach notes, scan reminder, eaten vs target; meals sync ----------
rep(''' h+=`<h4 class="sect">Today's schedule</h4>''', ''' h+=(window.F2C_todayExtras?F2C_todayExtras():"");\n h+=`<h4 class="sect">Today's schedule</h4>''')
rep('''(g.items||[]).forEach(it=>D.supp[skey(g,it)]=!all);delete D.skip["supp@"+g.time]}touch();rToday()});''',
    '''(g.items||[]).forEach(it=>D.supp[skey(g,it)]=!all);delete D.skip["supp@"+g.time]}touch();if(k==="meal"&&window.F2C_mealsChanged)F2C_mealsChanged();rToday()});''')
rep(''' if(pick.totals)h+=`<div class="macros">''', ''' h+=(window.F2C_mealTotals?F2C_mealTotals():"");\n if(pick.totals)h+=`<div class="macros">''')

# ---------- Coach: questions and check-ins go to the queue ----------
between('async function ask(q){', '// Older messages are folded', r'''async function ask(q){if(busy||!q)return;
 const c=C();busy=true;note("Sending…");
 try{const convo=c.msgs.slice(-MAX_KEEP).concat([{r:"u",t:q}]).map(m=>(m.r==="u"?"ATHLETE: ":"COACH: ")+m.t).join("\n");
  const id=await F2C_submit("coach",RULES+"\n\n"+context()+"\n\nRECENT CONVERSATION\n"+convo+"\n\nAnswer the athlete's last message. Reply with ONLY the JSON object described above (\"reply\" and \"advice\").",{meta:{kind:"coach"}});
  c.msgs.push({r:"u",t:q,at:Date.now(),req:id,pending:true});T.touch();rCoach();note("Sent. Your coach answers on the next run, usually within 3 hours.");
 }catch(e){note(typeof errCopy==="function"?errCopy(e):"That didn't send. Try again.")}
 finally{busy=false;const b=$("coachSend");if(b)b.disabled=false}}

''')
between('async function checkin(){', 'function note(t){', r'''async function checkin(){if(busy)return;
 busy=true;note("Sending…");const b=$("checkinBtn");if(b)b.disabled=true;
 try{await F2C_submit("checkin",CHECKIN+"\n\n"+context()+"\n\nAlso include \"week\":"+T.currentWeek()+" in the JSON.",{meta:{kind:"checkin"}});note("Check-in sent. Your coach answers on the next run, usually within 3 hours. A check-in also runs every Sunday evening.");
 }catch(e){note(typeof errCopy==="function"?errCopy(e):"That didn't work. Try again.")}finally{busy=false;if(b)b.disabled=false}}

''')
rep('''<p class="muted small">Your coach sees your plan, your workout logs, your meal and supplement check-offs, and the advice already given${last?`. Last check-in: ${fmtD(last.at)}`:""}. It won't change supplement times, doses or medications.</p></div>`;''',
    '''<p class="muted small">Your coach sees your plan, your workout logs, your meal and supplement check-offs, and the advice already given${last?`. Last check-in: ${fmtD(last.at)}`:""}. Answers come on the coach's next run, usually within 3 hours. It won't change supplement times, doses or medications.</p></div>`+(window.F2C_coachNotes?F2C_coachNotes():"");''')
rep('''<span class="when">${new Date(m.at).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</span></div>`).join("");''',
    '''<span class="when">${new Date(m.at).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}${m.pending?" · waiting for your coach":""}</span></div>`).join("");''')

# supplement schedule text for plan requests (rules engine output, read-only for the coach)
rep('window.F2C_T={rec,LOG,DAILY,touch,slug,DAYS7,currentWeek,weekDate,phaseOf,dayPlan,mealDayFor,engineOut,ui,',
    'window.F2C_suppText=()=>{try{const E=engineOut();return E?JSON.stringify(E.s.supplements.map(g=>({time:g.time,days:g.days,items:(g.items||[]).map(i=>i.name+(i.dose?" "+i.dose:""))}))):"none"}catch(e){return "none"}};\nwindow.F2C_T={rec,LOG,DAILY,touch,slug,DAYS7,currentWeek,weekDate,phaseOf,dayPlan,mealDayFor,engineOut,ui,')

exec(open('/home/claude/v2/patch_extra.py',encoding='utf-8').read())
exec(open('/home/claude/v2/patch_fast.py',encoding='utf-8').read())

# ---------- v2 module, loaded before the service worker line ----------
mod = open(module, encoding='utf-8').read() + '\n' + open('/home/claude/v2/holo.js', encoding='utf-8').read() + '\n' + open('/home/claude/v2/workout.js', encoding='utf-8').read() + '\n' + open('/home/claude/v2/water.js', encoding='utf-8').read() + '\n' + open('/home/claude/v2/wear.js', encoding='utf-8').read() + '\n' + open('/home/claude/v2/supp.js', encoding='utf-8').read() + '\n' + open('/home/claude/v2/pain.js', encoding='utf-8').read() + '\n' + open('/home/claude/v2/setup.js', encoding='utf-8').read() + '\n' + open('/home/claude/v2/cards.js', encoding='utf-8').read() + '\n' + open('/home/claude/v2/library.js', encoding='utf-8').read() + '\n' + open('/home/claude/v2/focus.js', encoding='utf-8').read() + '\n' + open('/home/claude/v2/family.js', encoding='utf-8').read()
rep('<script>if("serviceWorker" in navigator)', '<script>\n' + mod + '\n</script>\n<script>if("serviceWorker" in navigator)')

open(dst, 'w', encoding='utf-8').write(s)
print('ok', BUILD, len(s))
