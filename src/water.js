/* ===== v2.7 water: log drinks on Today, daily goal, 7-day bars =====
   Stored in the athlete record: r.water = {"YYYY-MM-DD": ounces}, r.waterGoal = ounces (optional, set by the athlete).
   Default goal = fluids from drinks in the National Academies (IOM 2004) adequate intake: men 19+ 101 oz (3.0 L), women 19+ 74 oz (2.2 L);
   boys 14-18 2.6 L, girls 14-18 1.8 L, boys 9-13 1.8 L, girls 9-13 1.6 L. All drinks count (coffee, tea, milk), not only water. */
(function(){
const e_=s=>esc(s==null?"":String(s));
const R=()=>window.F2C_T&&F2C_T.rec&&F2C_T.rec();
const today=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const dayStr=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const L_OZ=33.814;
function readOnly(r){return !!(r&&r.readOnly)}
function defGoal(r){const a=(r&&r.a)||{},age=+a.age||30,fem=/^f/i.test(a.sex||"");
 const L=age>=19?(fem?2.2:3.0):age>=14?(fem?1.8:2.6):(fem?1.6:1.8);return Math.round(L*L_OZ)}
function goal(r){return +r.waterGoal>0?+r.waterGoal:defGoal(r)}
function card(){const r=R();if(!r)return "";const W=r.water||{},t=today(),oz=Math.round((+W[t]||0)*10)/10,g=goal(r),pct=Math.min(100,oz/g*100),ro=readOnly(r);
 const C=2*Math.PI*42,col=pct>=100?"var(--wd-green)":"var(--accent)";
 const days=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);days.push(dayStr(d))}
 const mx=Math.max(g,...days.map(d=>+W[d]||0));
 return `<div class="sheet wearcard watercard" id="waterCard"><div class="whead"><span><svg viewBox="0 0 24 24" class="hic"><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/></svg> WATER</span><span>${pct>=100?"GOAL MET ✓":Math.round(pct)+"% OF GOAL"}</span></div>
  <div class="wtrow"><div class="wtring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="none" class="wtrack" stroke-width="9"/><circle cx="50" cy="50" r="42" fill="none" style="stroke:${col}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${C*pct/100} ${C}" transform="rotate(-90 50 50)"/></svg>
   <div><b>${oz}</b><span>of ${g} oz</span></div></div>
   <div class="wtbars">${days.map(d=>{const v=+W[d]||0,h=v?Math.max(6,v/mx*100):3;return `<div class="wtb${d===t?" now":""}"><span class="wtbt"><i style="height:${h}%;background:${v>=g?"var(--wd-green)":"var(--accent)"}"></i><em style="bottom:${g/mx*100}%"></em></span><small>${new Date(d+"T12:00:00").toLocaleDateString("en-US",{weekday:"short"}).slice(0,2)}</small></div>`}).join("")}</div></div>
  ${ro?"":`<div class="wtbtns"><button type="button" class="wt wsm" data-water="8">+8 oz<small>cup</small></button><button type="button" class="wt wsm" data-water="16.9">+16.9<small>bottle</small></button><button type="button" class="wt wsm" data-water="24">+24 oz<small>shaker</small></button><button type="button" class="wt wsm" data-water="32">+32 oz<small>big bottle</small></button></div>
  <div class="wtmore"><button type="button" class="linkbtn small" data-water="-8" ${oz>0?"":"disabled"}>− 8 oz</button><span class="wtcustom"><input inputmode="decimal" id="waterAmt" placeholder="oz" aria-label="Ounces to add"><button type="button" class="linkbtn small" data-wateradd>Add</button></span><button type="button" class="linkbtn small" data-watergoal>Goal: ${g} oz</button></div>
  <div class="wtgoalbox" hidden><label class="small">Daily goal (oz) <input inputmode="numeric" id="waterGoalIn" value="${+r.waterGoal>0?r.waterGoal:""}" placeholder="${defGoal(r)}"></label><button type="button" class="btn small primary" data-watergoalsave>Save</button><button type="button" class="btn small" data-watergoalreset>Use default</button>
   <p class="wadv small">Default ${defGoal(r)} oz comes from the National Academies: about 101 oz of drinks a day for men and 74 oz for women (19 and up), with the rest of your water coming from food. Coffee, tea and milk count. Hard training or heat means more; drink to thirst and replace sweat. If a doctor gave you a fluid limit, set that number here.</p></div>`}
 </div>`}
function redraw(){const el=document.getElementById("waterCard");if(!el)return;el.outerHTML=card();const n=document.getElementById("waterCard");const b=n&&n.querySelector(".wtgoalbox");if(b&&window._wtGoalOpen)b.hidden=false}
function add(oz){const r=R();if(!r||readOnly(r)||!isFinite(oz)||!oz)return;r.water=r.water||{};const t=today();r.water[t]=Math.max(0,Math.round(((+r.water[t]||0)+oz)*10)/10);
 const keys=Object.keys(r.water).sort();if(keys.length>400)keys.slice(0,keys.length-400).forEach(k=>delete r.water[k]);
 F2C_T.touch();redraw()}
document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-water],[data-wateradd],[data-watergoal],[data-watergoalsave],[data-watergoalreset]");if(!t)return;
 if(t.dataset.water){add(+t.dataset.water);return}
 if(t.dataset.wateradd!=null){const i=document.getElementById("waterAmt"),v=parseFloat(i&&i.value);if(v>0&&v<=200)add(v);else if(i)i.focus();return}
 if(t.dataset.watergoal!=null){const b=t.closest("#waterCard").querySelector(".wtgoalbox");b.hidden=!b.hidden;window._wtGoalOpen=!b.hidden;return}
 if(t.dataset.watergoalsave!=null){const r=R(),v=parseInt(document.getElementById("waterGoalIn").value,10);if(r&&v>=16&&v<=300){r.waterGoal=v;window._wtGoalOpen=false;F2C_T.touch();redraw()}else document.getElementById("waterGoalIn").focus();return}
 if(t.dataset.watergoalreset!=null){const r=R();if(r){delete r.waterGoal;window._wtGoalOpen=false;F2C_T.touch();redraw()}}});
document.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target&&e.target.id==="waterAmt"){e.preventDefault();const b=document.querySelector("[data-wateradd]");b&&b.click()}});
/* loads before wear.js, so the WHOOP card stays first and water comes right after it */
const _te=window.F2C_todayExtras;window.F2C_todayExtras=function(){let w="";try{w=card()}catch(err){console.warn("[F2C] water",err)}return w+(_te?_te.apply(this,arguments):"")};
window.F2C_waterToday=card;
const css=document.createElement("style");css.textContent=`
.watercard{display:grid;gap:10px}.wtrow{display:grid;grid-template-columns:120px 1fr;gap:14px;align-items:center}
.wtring{position:relative;width:120px;height:120px}.wtring svg{width:100%;height:100%}.wtring>div{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}.wtring b{font-size:1.7rem;line-height:1}.wtring span{font-size:.72rem;color:var(--muted);margin-top:3px}
.wtbars{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;height:110px}.wtb{display:flex;flex-direction:column;align-items:center;gap:4px}.wtb small{font-size:.66rem;color:var(--muted)}.wtb.now small{color:var(--ink);font-weight:800}
.wtbt{position:relative;flex:1;width:70%;background:var(--wd-tile);border-radius:6px;overflow:hidden;display:flex;align-items:flex-end}.wtbt i{width:100%;border-radius:6px 6px 0 0}.wtbt em{position:absolute;left:0;right:0;height:1px;border-top:1px dashed var(--wd-line2)}
.wtbtns{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.wtbtns .wt{cursor:pointer;border:0;color:var(--ink);font-weight:800;font-size:.9rem;display:flex;flex-direction:column;align-items:center;padding:10px 4px!important}.wtbtns .wt small{font-size:.66rem;color:var(--muted);font-weight:700}.wtbtns .wt:active{transform:scale(.96);background:var(--accent-soft)}
.wtmore{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}.wtmore .linkbtn{color:var(--accent)}.wtcustom{display:flex;align-items:center;gap:4px}.wtcustom input{width:64px;background:var(--bg);color:var(--ink);border:1px solid var(--wd-tile2);border-radius:10px;padding:6px 8px}
.wtgoalbox{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.wtgoalbox input{width:80px;background:var(--bg);color:var(--ink);border:1px solid var(--wd-tile2);border-radius:10px;padding:6px 8px;margin-left:6px}.wtgoalbox .wadv{flex-basis:100%}`;
document.head.appendChild(css);
})();
