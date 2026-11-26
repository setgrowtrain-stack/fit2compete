/* ===== Supplement review: the coach checks whether each supplement is needed; times always come from the fixed rules ===== */
(function(){
const T=()=>window.F2C_T,X=()=>window.F2C_X||{},R=()=>T().rec();
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm=n=>String(n||"").toLowerCase().replace(/\([^)]*\)/g,"").replace(/[^a-z0-9]/g,"");
const same=(a,b)=>{const x=norm(a),y=norm(b);return x===y||(x.length>4&&y.length>4&&(x.includes(y)||y.includes(x)))};
const isRx=it=>it.cat==="medication";
function reviewPrompt(a){const RU=window.F2C_RULES||{},cats=(RU.CAT_IDS||[]).filter(c=>c!=="medication").join(", ");
 const list=(a.suppItems||[]).map(x=>`- ${x.name}${x.dose?" | "+x.dose:""} | type ${x.cat} | ${x.status}${x.condition?" ("+x.condition+")":""}`).join("\n");
 return `Review this athlete's supplement list. For each item decide if they actually need it for their goals, health and labs. Be honest: many supplements people take have weak evidence or duplicate something else. Do not judge prescription medications (type medication): leave them out of your answer. Do not set times: the app sets times from fixed rules.
ATHLETE: age ${a.age||"?"}, sex ${a.sex||"?"}, goals: ${[].concat(a.goals||a.goal||[]).join(", ")||"?"}${a.showDate?", show date "+a.showDate:""}${a.drugTested?", drug-tested competition":""}.
HEALTH AND LABS: ${String(a.health||a.conditions||"").slice(0,600)} ${a.labValues?JSON.stringify(a.labValues).slice(0,1500):""}
DIET NOTES: ${String(a.diet||a.dietNotes||"").slice(0,400)}
EATING WINDOW / FASTING: ${String(a.eating||"not given").slice(0,120)}. Wake ${a.wakeTime||"?"}, bed ${a.bedTime||"?"}, trains ${a.timeOfDay||"?"}.
LIST (name | amount | type | status):
${list}
Reply with ONLY JSON: {"items":[{"name":"exact name from the list","need":"keep" or "not-needed" or "optional" or "restart","why":"one plain sentence with the main reason","dose":"better amount if the current one is wrong, else empty","cat":"one of: ${cats}, only if the listed type is wrong, else empty","label":"only if there is a real conflict: what the product label or the research says about food, timing, splitting the dose, calories during a fast, or spacing from other items, in one sentence; else empty"}],"add":[{"name":"product","dose":"amount","cat":"type","why":"one sentence"}],"note":"one or two sentences"}
Use "not-needed" when evidence is weak for their goal, it duplicates another item, or it adds risk (lead, drug-test risk before a tested show, interactions). Use "restart" for a paused item that is worth taking again. Only add something when there is a clear, specific reason. Check each product's actual label directions (search for them) and say where the athlete's current use differs. Anything with calories (fiber powders, protein, amino acids in grams, fish oil) breaks a fast. Never guess: if you could not find the label, say so in "label".`}
async function askReview(){const a=R().a||{};if(!(a.suppItems||[]).some(x=>!isRx(x)))return;
 const names=(a.suppItems||[]).filter(x=>!isRx(x)).map(x=>norm(x.name)).sort().join("|");
 a.suppReviewKey=names;T().touch();return F2C_submit("question",reviewPrompt(a),{meta:{kind:"suppReview"}})}
window.F2C_suppSaved=function(a){const names=(a.suppItems||[]).filter(x=>!isRx(x)).map(x=>norm(x.name)).sort().join("|");if(names&&names!==a.suppReviewKey)askReview().catch(()=>{})};
/* Apply an answered review: not needed -> stopped (with the reason), restart -> taking, dose and type fixes, additions. Medications are never touched. */
function apply(ans,id){const a=R().a||{},items=a.suppItems=a.suppItems||[],date=new Date().toISOString().slice(0,10);let n=0;
 (ans.items||[]).forEach(v=>{const it=items.find(x=>same(x.name,v.name));if(!it||isRx(it))return;
  it.verdict={need:v.need,why:String(v.why||"").slice(0,300),date,req:id};if(v.label)it.labelNote=String(v.label).slice(0,300);if(v.time)it.time=String(v.time).slice(0,80);
  if(v.need==="not-needed"&&it.status!=="stopped"&&!it.keepAnyway){it.prevStatus=it.status;it.status="stopped";it.stoppedBy="coach";n++}
  if(v.need==="restart"&&(it.status==="paused"||it.status==="stopped")){it.status="taking";n++}
  if(v.dose&&String(v.dose).trim()&&v.dose!==it.dose){it.prevDose=it.dose;it.dose=String(v.dose).slice(0,80);n++}
  const RU=window.F2C_RULES||{};if(v.cat&&RU.CATS&&RU.CATS[v.cat]&&v.cat!=="medication"&&v.cat!==it.cat){it.cat=v.cat;n++}});
 (ans.add||[]).forEach(v=>{if(!v.name||items.some(x=>same(x.name,v.name)))return;const RU=window.F2C_RULES||{};
  items.push({name:String(v.name).slice(0,80),dose:String(v.dose||"").slice(0,80),time:String(v.time||"").slice(0,80),cat:RU.CATS&&RU.CATS[v.cat]&&v.cat!=="medication"?v.cat:(window.F2C_ENGINE?F2C_ENGINE.guessCat(v.name):"other"),status:"taking",verdict:{need:"add",why:String(v.why||"").slice(0,300),date,req:id}});n++});
 a.suppReviewNote=ans.note?{text:String(ans.note).slice(0,400),date}:a.suppReviewNote;a.suppReviewKey=items.filter(x=>!isRx(x)).map(x=>norm(x.name)).sort().join("|");
 return n}
async function applyAnswered(){const q=(X().requests||[]).filter(r=>r.type==="question"&&r.meta&&r.meta.kind==="suppReview"&&r.status==="answered"&&r.answer&&(Array.isArray(r.answer.items)||Array.isArray(r.answer.add)));
 if(!q.length)return;for(const r of q){apply(r.answer,r.id);r.status="applied";window.F2C_markApplied&&F2C_markApplied(r.id)}
 T().touch();if(T().ui.tab==="supps")T().show("supps");if(window.F2C_toast)F2C_toast("Your coach reviewed your supplements. See the Supplements tab.")}
window.F2C_suppReviewHtml=function(){setTimeout(()=>applyAnswered().catch(()=>{}),0);const a=R().a||{},items=a.suppItems||[];
 const off=items.filter(x=>x.status==="stopped"&&x.stoppedBy==="coach"),opt=items.filter(x=>x.verdict&&x.verdict.need==="optional"&&x.status!=="stopped"),
  added=items.filter(x=>x.verdict&&(x.verdict.need==="add"||x.verdict.need==="restart")&&x.status==="taking"),pend=(X().requests||[]).some(r=>r.type==="question"&&r.meta&&r.meta.kind==="suppReview"&&(r.status==="new"||r.status==="working"));
 let h=`<div class="sheet suppreview"><span class="label">Do you need them? · coach review</span>`;
 if(a.suppReviewNote)h+=`<p class="small">${esc(a.suppReviewNote.text)} <span class="muted">(${esc(a.suppReviewNote.date)})</span></p>`;
 if(off.length)h+=`<h4 class="sect">Taken off your schedule</h4>${off.map(x=>`<div class="srev"><div><b>${esc(x.name)}</b><p class="small">${esc(x.verdict&&x.verdict.why||"")}</p></div><button type="button" class="btn small" data-keepsupp="${esc(x.name)}">Keep taking it</button></div>`).join("")}`;
 if(added.length)h+=`<h4 class="sect">Started or restarted</h4>${added.map(x=>`<div class="srev"><div><b>${esc(x.name)}</b>${x.dose?` <span class="muted small">${esc(x.dose)}</span>`:""}<p class="small">${esc(x.verdict.why)}</p></div></div>`).join("")}`;
 if(opt.length)h+=`<h4 class="sect">Optional</h4>${opt.map(x=>`<div class="srev"><div><b>${esc(x.name)}</b><p class="small">${esc(x.verdict.why)}</p></div></div>`).join("")}`;
 const lab=items.filter(x=>x.labelNote&&x.status!=="stopped");if(lab.length)h+=`<h4 class="sect">Label and timing checks</h4>${lab.map(x=>`<div class="srev"><div><b>${esc(x.name)}</b><p class="small">${esc(x.labelNote)}</p></div></div>`).join("")}`;
 if(pend)h+=`<div class="note gold">Your coach is checking your list. Results show up here, usually within 3 hours.</div>`;
 else if(!off.length&&!added.length&&!opt.length&&!a.suppReviewNote)h+=`<p class="small">Your coach can check whether each supplement is worth taking for your goals and labs. Prescription medicines are never changed.</p>`;
 h+=`<div class="nav"><span class="muted small">Times are always set by the fixed rules. Prescriptions stay as your doctor wrote them.</span><button type="button" class="btn small" data-suppreview>${a.suppReviewNote||off.length?"Review again":"Review my list"}</button></div></div>`;
 return h};
document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-keepsupp],[data-suppreview]");if(!t)return;const a=R().a||{};
 if(t.dataset.keepsupp){const it=(a.suppItems||[]).find(x=>x.name===t.dataset.keepsupp);if(it){it.status=it.prevStatus||"taking";it.keepAnyway=true;delete it.stoppedBy;T().touch();T().show("supps")}return}
 if(t.dataset.suppreview!=null){t.disabled=true;t.textContent="Sending…";askReview().then(()=>T().show("supps")).catch(()=>{t.disabled=false;t.textContent="Try again"})}},true);
const _le=window.F2C_loadExtras;if(_le)window.F2C_loadExtras=async function(){const r=await _le.apply(this,arguments);try{await applyAnswered()}catch(e){}return r};
addEventListener("load",()=>setTimeout(()=>{applyAnswered().catch(()=>{})},4000));
const st=document.createElement("style");st.textContent=`.srev{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:8px 0;border-top:1px solid var(--line,#e2e8f0)}.srev p{margin:2px 0 0}`;document.head.appendChild(st);
window.F2C_suppApply=apply;
})();
