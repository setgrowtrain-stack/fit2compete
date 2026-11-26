/* ===== Pain map: tap the spot on the 3D body, describe it, get ideas, bring it to your doctor ===== */
(function(){
const $=id=>document.getElementById(id),e_=s=>esc(s==null?"":String(s));
const T=()=>window.F2C_T,R=()=>T().rec();
let S=null,pick=null,markers=[];
const TYPES=["Sharp","Dull ache","Burning","Shooting / travels","Tingling (pins and needles)","Numbness","Throbbing","Tight / cramping","Weak / gives way","Stiff","Swelling"];
const WHEN=["All the time","At rest","When I move it","During lifting","After training","Sitting a long time","Standing / walking","At night","Morning, then eases","Started suddenly with a pop"];
const SPREAD=["Low back","Glute","Hip","Groin","Back of thigh","Front of thigh","Outside of thigh","Knee","Calf","Shin","Ankle","Foot","Toes","Shoulder","Neck","Upper arm","Elbow","Forearm","Hand","Fingers","Chest","Upper back"];

/* where on the body: model units, feet at 0, top of head about 1.72; +x is the body's left */
function region(p,musc){const x=p.x,y=p.y,z=p.z,ax=Math.abs(x),side=ax<.03?"":(x>0?"Left ":"Right "),front=z>(y>.84?-.01:-.03);
 let a;
 if(y>1.5)a="Head";else if(y>1.42)a=front?"Neck (front)":"Neck";
 else if(ax>.19&&y>.78){a=y>1.36?"Shoulder":y>1.12?(front?"Upper arm (front)":"Upper arm (back)"):y>1.04?"Elbow":y>.86?"Forearm":"Hand / wrist"}
 else if(y>1.2)a=front?"Chest":"Upper back";
 else if(y>.98)a=front?(ax>.1?"Side of stomach":"Stomach / abs"):(ax>.1?"Side of lower back":"Lower back");
 else if(y>.84)a=front?(ax>.07?"Hip / groin":"Lower belly / pelvis"):"Glute";
 else if(y>.53)a=front?(ax>.15?"Outside of thigh":"Front of thigh"):"Back of thigh (hamstring)";
 else if(y>.43)a=front?"Knee (front)":"Back of knee";
 else if(y>.1)a=front?"Shin":"Calf";
 else if(y>.05)a="Ankle";else a="Foot";
 const mid=a==="Head"||/^Neck/.test(a)||(ax<.05&&/Chest|Stomach|Lower belly|Upper back|Lower back/.test(a));
 return {area:mid||!side?a:side+a.charAt(0).toLowerCase()+a.slice(1),side:mid?"":side.trim(),muscle:musc||""}}

/* called by the 3D view each time it draws in Pain mode */
window.F2C_painScene=function(ctx){S=ctx;markers=[];const {THREE,renderer,cam,fig,box}=ctx;
 const btn=document.createElement("button");btn.type="button";btn.className="btn small painfull";btn.textContent="Full screen";
 btn.onclick=()=>{box.classList.toggle("full");btn.textContent=box.classList.contains("full")?"Done":"Full screen"};box.appendChild(btn);const tag=document.createElement("div");tag.className="paintag";tag.id="painTag";tag.textContent=pick?pick.area:"Tap where it hurts";box.appendChild(tag);
 const ray=new THREE.Raycaster();let d0=null;
 renderer.domElement.addEventListener("pointerdown",e=>{d0={x:e.clientX,y:e.clientY,t:Date.now()}});
 renderer.domElement.addEventListener("pointerup",e=>{if(!d0)return;const mv=Math.hypot(e.clientX-d0.x,e.clientY-d0.y),dt=Date.now()-d0.t;d0=null;if(mv>7||dt>600)return;
  const r=renderer.domElement.getBoundingClientRect(),v=new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
  ray.setFromCamera(v,cam);const hit=ray.intersectObjects([ctx.sMesh,ctx.mMesh],false)[0];if(!hit)return;
  const mh=ray.intersectObject(ctx.mMesh,false)[0];let musc="";if(mh){const k=ctx.mi[mh.face.a];if(k>-.5)musc=ctx.MUSCLES[Math.round(k)][1]}
  const lp=fig.worldToLocal(hit.point.clone());pick=Object.assign({p:[+lp.x.toFixed(4),+lp.y.toFixed(4),+lp.z.toFixed(4)]},region(lp,musc));
  drawMarkers();const tg=$("painTag");if(tg)tg.textContent=pick.area+(pick.muscle?" · "+pick.muscle:"")+"  (tap again to move it)";window.F2C_painPanel&&F2C_painPanel(false);});
 drawMarkers()};
function drawMarkers(){if(!S)return;const {THREE,fig}=S;markers.forEach(m=>fig.remove(m));markers=[];
 const add=(p,c,big)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(big?.016:.012,16,12),new THREE.MeshBasicMaterial({color:c,depthTest:false,transparent:true,opacity:.95}));m.renderOrder=9;m.position.set(p[0],p[1],p[2]);fig.add(m);markers.push(m)};
 (R().pain||[]).filter(x=>x.status!=="better").forEach(x=>add(x.p,0xff8a00,false));if(pick)add(pick.p,0xff2d55,true)}

/* instant guidance from the description; never a diagnosis */
function guide(x){const t=(x.types||[]).join(" ").toLowerCase(),a=(x.area||"").toLowerCase(),sp=(x.spread||[]).join(" ").toLowerCase(),wn=(x.when||[]).join(" ").toLowerCase(),d=(x.desc||"").toLowerCase(),all=[a,sp,d].join(" ");
 const urgent=[],soon=[],ideas=[];
 if(/chest|left arm|jaw/.test(a+sp)&&!/after training|during lifting/.test(wn)||/pressure|squeez|short of breath|sweat/.test(d))urgent.push("Chest pain or pressure, or pain spreading to the arm, jaw or back, especially with shortness of breath or sweating: call 911 now. Don't drive yourself and don't wait to see if it passes.");
 if(/groin|saddle|bladder|bowel|pee|poop/.test(d+sp)&&/numb|tingl/.test(t+d)||/bladder|bowel/.test(d))urgent.push("Numbness between the legs or in the groin, or trouble controlling your bladder or bowels, with back pain: go to the emergency room now. This needs same-day care.");
 if(/calf|back of knee/.test(a)&&(/swell/.test(t+d)||/warm|red|hot/.test(d)))urgent.push("Calf pain with swelling, warmth or redness can be a blood clot: get seen today (urgent care or ER), especially after a long drive, flight or time off your feet.");
 if(/head/.test(a)&&/sudden|worst/.test(d+wn))urgent.push("A sudden, severe headache (worst of your life) needs the emergency room now.");
 if(/weak|gives way/.test(t)||/foot drop|can't lift|drag/.test(d))soon.push("Weakness, like a foot that slaps or drags or a leg that gives way, means a nerve may be pressed hard. See a doctor within a few days, sooner if it's getting worse.");
 if(/pop/.test(wn+d))soon.push("Pain that started with a pop during a lift can be a tear. Stop training that area and see a doctor or sports medicine clinic this week.");
 if(/swell/.test(t)&&/knee|ankle|elbow|shoulder/.test(a))soon.push("A joint that swells after an injury should be checked, especially if it locks, catches or won't hold your weight.");
 if((x.level||0)>=8)soon.push("Pain at 8/10 or higher should be seen soon, not trained through.");
 const shoot=/shoot|travel/.test(t)||sp.length>0,nerve=/numb|tingl|burn/.test(t);
 if((/glute|back of thigh|lower back|side of lower back/.test(a)||/glute|low back/.test(sp))&&(shoot||nerve)&&/thigh|calf|foot|knee|toes/.test(sp+a+d))
  ideas.push({what:"Pain that travels from the low back or glute down the back of the leg, with burning, tingling or numbness, is the classic pattern of sciatica: a nerve root in the low back, or the sciatic nerve itself, being irritated. A tight piriformis muscle deep in the glute can feel the same.",
   try:["Walk for 10 to 20 minutes a few times a day. Moving usually calms a nerve more than resting.","Break up sitting every 30 minutes. Long sitting and slouching often flare it.","Gentle sciatic nerve glides: sit tall, straighten the sore knee while lifting your head, then bend the knee as you look down. 10 slow reps, a few times a day. Stop if it sharpens.","Heat on the low back or glute for 15 to 20 minutes.","Sleep on your side with a pillow between your knees."],
   avoid:["Heavy deadlifts, squats, good mornings and bent-over rows until it settles.","Hard hamstring stretching. It pulls on the nerve and can make it worse.","Sitting on a wallet or a hard edge."]});
 else if(/foot|toes/.test(a)&&nerve)ideas.push({what:"Numbness or tingling in the foot can come from a nerve pinched higher up (low back or behind the knee), from tight shoes or laces pressing on the top of the foot, or from nerve changes linked to blood sugar or low B12. Whether it's one foot or both matters, so note that.",
   try:["Loosen your laces and check for tight shoes or socks.","Notice whether it's one foot or both, and whether it comes with back or leg pain.","Ask your doctor about blood sugar (A1c) and B12 if it's both feet or keeps coming back."],avoid:["Long stretches of sitting cross-legged or with pressure behind the knee."]});
 else if(/knee/.test(a))ideas.push({what:/back of knee/.test(a)?"Pain behind the knee is often a tight or strained hamstring or calf tendon. A Baker's cyst can also cause fullness there.":"Pain around or under the kneecap that's worse with squats, stairs or long sitting is usually patellofemoral pain: the kneecap tracking under load. Pain on the inside or outside after a twist can be the meniscus or a ligament.",
  try:["Cut squat and lunge depth to a pain-free range for 1 to 2 weeks.","Strengthen around it: glute bridges, side-lying leg raises, and wall sits held at a comfortable angle.","Ice for 15 minutes after training if it's sore."],avoid:["Deep loaded knee bending, jumping and downhill running while it's sore."]});
 else if(/shoulder|upper arm/.test(a))ideas.push({what:"Shoulder pain with pressing, overhead work or reaching back is most often the rotator cuff or a pinched tendon. Pain at night or real weakness lifting the arm should be checked.",
  try:["Swap overhead pressing for landmine presses or a neutral-grip incline.","Band external rotations and face pulls, light, 2 to 3 sets.","Keep moving in the pain-free range."],avoid:["Behind-the-neck presses, upright rows and deep dips until it calms down."]});
 else if(/elbow|forearm/.test(a))ideas.push({what:"Pain on the outside of the elbow is often tennis elbow and on the inside golfer's elbow: overloaded forearm tendons from gripping and pulling.",
  try:["Use straps on heavy pulls and lighter grip work for 2 weeks.","Slow wrist curls and reverse wrist curls with a light dumbbell, 3 x 15."],avoid:["Heavy curls and thick-grip pulling while it's sore."]});
 else if(/lower back|side of lower back/.test(a))ideas.push({what:"Low back pain without leg symptoms is usually a muscle or joint strain. Most cases settle in days to a few weeks.",
  try:["Keep walking daily. Bed rest slows recovery.","Heat for 15 to 20 minutes.","Gentle movement: cat-cow, bird dogs, dead bugs."],avoid:["Heavy hinging and spinal loading for 3 to 7 days."]});
 if(/after training/.test(wn)&&/dull|tight|stiff/.test(t)&&!nerve&&!/sharp/.test(t))ideas.unshift({what:"A dull, tight soreness 1 to 3 days after training, in the muscle you worked, is usually normal muscle soreness (DOMS). It fades on its own.",try:["Light movement, a walk or easy bike.","Sleep, protein and fluids."],avoid:["Max-effort work on that muscle until it's mostly gone."]});
 return {urgent,soon,ideas}}

function summary(x){return `${x.area}${x.muscle?" ("+x.muscle+")":""}. ${(x.types||[]).join(", ")||"Pain"}, ${x.level!=null?x.level+"/10":""}.${(x.spread||[]).length?" Travels to: "+x.spread.join(", ")+".":""}${(x.when||[]).length?" When: "+x.when.join(", ")+".":""}${x.since?" Since "+x.since+".":""}${x.desc?" "+x.desc:""}`}

function guideHtml(x){const g=guide(x);let h="";
 if(g.urgent.length)h+=`<div class="note red"><b>Get care now</b>${g.urgent.map(s=>`<p>${e_(s)}</p>`).join("")}</div>`;
 if(g.soon.length)h+=`<div class="note gold"><b>See a doctor soon</b>${g.soon.map(s=>`<p>${e_(s)}</p>`).join("")}</div>`;
 g.ideas.slice(0,2).forEach(i=>h+=`<div class="painidea"><p>${e_(i.what)}</p>${i.try.length?`<span class="label">Things that often help</span><ul>${i.try.map(s=>`<li>${e_(s)}</li>`).join("")}</ul>`:""}${i.avoid.length?`<span class="label">Ease off</span><ul>${i.avoid.map(s=>`<li>${e_(s)}</li>`).join("")}</ul>`:""}</div>`);
 if(!g.ideas.length&&!g.urgent.length)h+=`<p class="muted small">Not enough detail to suggest a likely cause. Ask your coach below, or add more about how it feels and what makes it worse.</p>`;
 return h}

function coachAns(x){const q=((window.F2C_X||{}).requests||[]).find(r=>r.id===x.req);if(!q)return "";
 if(q.status!=="answered"||!q.answer)return `<p class="note gold small">Your coach is looking at this. Usually within 3 hours.</p>`;const a=q.answer;
 return `<div class="painidea"><span class="label">Coach</span>${a.likely?`<p><b>${e_(a.likely)}</b></p>`:""}${a.why?`<p class="small">${e_(a.why)}</p>`:""}${(a.try||[]).length?`<span class="label">Try</span><ul>${a.try.map(s=>`<li>${e_(s)}</li>`).join("")}</ul>`:""}${(a.avoid||[]).length?`<span class="label">Ease off</span><ul>${a.avoid.map(s=>`<li>${e_(s)}</li>`).join("")}</ul>`:""}${(a.training||"")?`<p class="small"><b>Training:</b> ${e_(a.training)}</p>`:""}${a.doctor?`<p class="small"><b>Doctor:</b> ${e_(a.doctor)}</p>`:""}</div>`}

const DISC=`<p class="muted small painDisc">This doesn't diagnose or treat anything. It gives you possible explanations and a clear record to take to your doctor or physical therapist, who should check any pain that's new, getting worse or lasting more than 2 weeks.</p>`;
const chips=(name,list,sel)=>`<div class="chips">${list.map(v=>`<label class="chip"><input type="checkbox" name="${name}" value="${e_(v)}"${(sel||[]).includes(v)?" checked":""}><span>${e_(v)}</span></label>`).join("")}</div>`;

window.F2C_painPanel=function(scroll){const box=$("painBox");if(!box||!T())return;const r=R(),list=(r.pain||[]).slice().reverse(),open=list.filter(x=>x.status!=="better"),old=list.filter(x=>x.status==="better");
 let h=`<div class="sheet painsheet"><span class="label">Pain map</span>`;
 if(pick)h+=`<div class="painform"><p class="muted small">Red dot on the body is your spot. Wrong spot? Tap the body again. Scroll down when it's right.</p><h4>Where: <input name="area" value="${e_(pick.area)}" class="painarea"></h4>${pick.muscle?`<p class="muted small">Closest muscle: ${e_(pick.muscle)}</p>`:""}
  <span class="label">What it feels like</span>${chips("types",TYPES)}
  <label class="field"><span class="flabel">How bad, 0 to 10: <b id="painLv">4</b></span><input type="range" name="level" min="0" max="10" value="4" oninput="document.getElementById('painLv').textContent=this.value"></label>
  <span class="label">Does it travel? Tap everywhere it goes</span>${chips("spread",SPREAD)}
  <span class="label">When it happens</span>${chips("when",WHEN)}
  <label class="field"><span class="flabel">Since</span><input type="date" name="since" value="${new Date().toLocaleDateString("en-CA")}"></label>
  <label class="field"><span class="flabel">Describe it in your words</span><textarea name="desc" rows="3" placeholder="e.g. Shoots from my right glute down the back of my leg to my foot. Worse after sitting in the truck."></textarea></label>
  <div class="nav"><button type="button" class="linkbtn small" data-pain="cancel">Cancel</button><button type="button" class="btn primary small" data-pain="save">Save</button></div></div>`;
 else h+=`<p class="small">Zoom in and tap the exact spot on the body where it hurts. ${open.length?"Orange dots are pain you've logged.":""}</p>`;
 h+=open.map(x=>`<details class="painitem"${x.id===window.F2C_painOpen?" open":""}><summary><b>${e_(x.area)}</b> <span class="muted small">${e_((x.types||[]).slice(0,2).join(", "))}${x.level!=null?" · "+x.level+"/10":""} · ${e_(x.since||x.at.slice(0,10))}</span></summary>
  <p class="small">${e_(summary(x))}</p>${guideHtml(x)}${x.req?coachAns(x):""}
  <div class="row">${x.req?"":`<button type="button" class="btn small" data-pain="ask" data-id="${e_(x.id)}">Ask my coach</button>`}<button type="button" class="btn small" data-pain="copy" data-id="${e_(x.id)}">Copy for my doctor</button><button type="button" class="linkbtn small" data-pain="better" data-id="${e_(x.id)}">It's better</button><button type="button" class="linkbtn small" data-pain="del" data-id="${e_(x.id)}">Delete</button></div></details>`).join("");
 if(old.length)h+=`<details><summary class="muted small">Past pain (${old.length})</summary>${old.map(x=>`<p class="small">${e_(x.since||x.at.slice(0,10))}: ${e_(summary(x))}</p>`).join("")}</details>`;
 h+=DISC+`<p class="small painStatus muted"></p></div>`;box.innerHTML=h;if(scroll)box.scrollIntoView({behavior:"smooth",block:"start"})};

document.addEventListener("click",async e=>{const t=e.target.closest&&e.target.closest("[data-pain]");if(!t)return;const r=R(),m=t.dataset.pain,id=t.dataset.id,x=(r.pain||[]).find(p=>p.id===id),st=document.querySelector(".painStatus");
 if(m==="cancel"){pick=null;drawMarkers();const tg=$("painTag");if(tg)tg.textContent="Tap where it hurts";F2C_painPanel();return}
 if(m==="save"){const f=t.closest(".painform"),q=s=>[...f.querySelectorAll(`[name="${s}"]:checked`)].map(i=>i.value);
  const n={id:"p"+Date.now().toString(36),at:new Date().toISOString(),area:f.querySelector('[name="area"]').value.trim()||pick.area,side:pick.side,muscle:pick.muscle,p:pick.p,types:q("types"),level:+f.querySelector('[name="level"]').value,spread:q("spread"),when:q("when"),since:f.querySelector('[name="since"]').value,desc:f.querySelector('[name="desc"]').value.trim().slice(0,1500),status:"open"};
  r.pain=(r.pain||[]).concat([n]).slice(-60);pick=null;window.F2C_painOpen=n.id;T().touch();drawMarkers();F2C_painPanel();return}
 if(!x)return;
 if(m==="better"){x.status="better";x.betterAt=new Date().toISOString();T().touch();drawMarkers();F2C_painPanel();return}
 if(m==="del"){if(!confirm("Delete this pain entry?"))return;r.pain=r.pain.filter(p=>p!==x);T().touch();drawMarkers();F2C_painPanel();return}
 if(m==="copy"){const txt=`Pain log from Fit 2 Compete\n${summary(x)}\nLogged ${x.at.slice(0,10)}.`;try{await navigator.clipboard.writeText(txt);if(st)st.textContent="Copied. Paste it into a message to your doctor or bring it to your visit."}catch(err){prompt("Copy this:",txt)}return}
 if(m==="ask"){t.disabled=true;if(st)st.textContent="Sending…";const a=r.a||{},p=r.plan||{};
  const prompt=`An athlete logged pain on the Fit 2 Compete body map. Give possible explanations and safe things to try, in plain words. You are not diagnosing. Always say who to see and how soon. Put any emergency warning first.
PAIN: ${summary(x)}
ATHLETE: age ${a.age||"?"}, sex ${a.sex||"?"}, goals ${a.goals||a.goal||"?"}, injuries ${a.injuries||"none listed"}. Training days: ${(p.days||[]).map(d=>(d.day||d.title)+": "+(d.exercises||[]).slice(0,6).map(e=>e.name).join(", ")).join(" | ").slice(0,1500)}
Reply with ONLY JSON: {"likely":"one line: the most likely explanation, worded as 'often' or 'may be'","why":"2 sentences on why the pattern fits and what else it could be","try":["3 to 5 specific things that often help"],"avoid":["2 to 4 things to ease off"],"training":"how to change their current plan this week, naming exercises","doctor":"who to see (doctor, physical therapist, ER) and how soon, plus any warning signs"}`;
  try{const q=await F2C_submit("question",prompt,{meta:{kind:"pain",area:x.area}});x.req=q&&q.id||x.req;T().touch();F2C_painPanel()}catch(err){t.disabled=false;if(st)st.textContent=err&&err.code==="read_only"?"Only the athlete or parent can ask.":"Couldn't send. Try again."}}},true);

const st=document.createElement("style");st.textContent=`.painfull{position:absolute;top:8px;right:8px;z-index:2}.paintag{position:absolute;left:8px;right:110px;top:8px;z-index:2;background:rgba(0,0,0,.6);color:#fff;font-weight:700;font-size:.85rem;padding:6px 10px;border-radius:8px;pointer-events:none}.painsheet{display:grid;gap:10px}.painform{display:grid;gap:8px}.painarea{font:inherit;font-weight:700;border:1px solid var(--line,#ccc);border-radius:8px;padding:4px 8px;width:min(100%,320px)}
.chips{display:flex;flex-wrap:wrap;gap:6px}.chip{display:inline-flex}.chip input{position:absolute;opacity:0;width:0;height:0}.chip span{border:1px solid var(--line,#ccc);border-radius:999px;padding:6px 10px;font-size:.85rem;cursor:pointer}.chip input:checked+span{background:#ff2d55;border-color:#ff2d55;color:#fff}
.painitem{border:1px solid var(--line,#ddd);border-radius:12px;padding:10px}.painidea{border-left:3px solid #ff8a00;padding-left:10px}.painidea ul{margin:4px 0 8px 18px}.note.red{background:#fde2e2;border-left:4px solid #d11;padding:10px;border-radius:8px}`;document.head.appendChild(st);
})();
