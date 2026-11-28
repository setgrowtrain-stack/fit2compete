/* ===== v2.16 Same layout as Settings on Today, Supps and Meals: what you act on now stays open; the rest becomes rows that open the slide-up sheet ===== */
(function(){
const $=id=>document.getElementById(id),esc_=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
const I=d=>`<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`,CHEV=I('<path d="M9 6l6 6-6 6"/>');
const IC={day:'<path d="M3 10h18M7 3v4M17 3v4M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/>',
 food:'<path d="M5 3v8a3 3 0 0 0 6 0V3M8 3v18M16 3c-2 2-2 6 0 8v10"/>',pill:'<rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-45 12 12)"/><path d="M9 9l6 6"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',moon:'<path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z"/>',
 bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',shield:'<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/>',pause:'<path d="M8 5v14M16 5v14"/>',chat:'<path d="M4 5h16v11H8l-4 4z"/>',log:'<path d="M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6"/>'};
const row=(k,t,sub,ic,dot)=>`<button type="button" class="pirow" data-nk="${esc_(k)}"><span class="piic">${I(ic)}</span><span class="pitx"><b>${esc_(t)}</b><small>${dot?`<i style="background:${dot}"></i>`:""}${esc_(sub)}</small></span><span class="pich">${CHEV}</span></button>`;
const clip=(t,n=80)=>{t=String(t||"").replace(/\s+/g," ").trim();return t.length>n?t.slice(0,n-2).replace(/\s\S*$/,"")+"…":t};
const kids=v=>[...v.children];
let cur=null,reopening=false;   // {view,key,title}

/* ---- per-tab layouts: each returns {rows:[[key,title,sub,icon,dot]], nodes:{key:()=>[node,...]}, titles:{key:title}} ---- */
const L={
 today(v){const tl=v.querySelector(":scope > .timeline");const out={rows:[],nodes:{},titles:{}};
  if(tl){const cards=[...tl.querySelectorAll(":scope > .tcard")],nx=cards.findIndex(c=>c.classList.contains("next")),done=cards.filter(c=>c.classList.contains("isdone")).length;
   tl.classList.add("tlcut");cards.forEach((c,i)=>{if(nx>=0&&(i===nx||i===nx+1))c.setAttribute("data-nshow","");else c.removeAttribute("data-nshow")});
   const h=tl.previousElementSibling;if(h&&h.matches("h4.sect"))h.textContent=nx>=0?"Next up":"Today's schedule";
   if(nx<0&&!v.querySelector(".tlnone"))tl.insertAdjacentHTML("afterend",`<p class="muted small tlnone">${cards.length?(done===cards.length?"Everything on today's schedule is done.":"Nothing else coming up right now."):"Nothing scheduled today."}</p>`);
   if(cards.length){out.rows.push(["tl","See the whole day",`${done} of ${cards.length} done · meals and supplements`,IC.day,done===cards.length?"var(--wd-green)":null]);
    out.nodes.tl=()=>{const t=v.querySelector(":scope > .timeline");if(t)t.classList.remove("tlcut");return [t]};out.titles.tl="Today's schedule"}}
  const fl=v.querySelector(":scope > .v2food");if(fl){fl.classList.add("nesthide");out.rows.push(["food","Food log","Log anything you ate that isn't on the plan",IC.log]);out.nodes.food=()=>[v.querySelector(":scope > .v2food")];out.titles.food="Food log"}
  return out},
 supps(v){const out={rows:[],nodes:{},titles:{}};const tl=v.querySelector(":scope > .timeline");if(!tl)return null;
  const cards=[...tl.querySelectorAll(":scope > .tcard")];let tot=0,got=0;
  cards.forEach((c,i)=>{const boxes=[...c.querySelectorAll("input[type=checkbox][data-s]")],n=boxes.length,d=boxes.filter(b=>b.checked).length;tot+=n;got+=d;
   const time=(c.querySelector(".ttime")||{}).textContent||"",when=((c.querySelector("h4")||{}).childNodes[0]||{}).textContent||"",names=[...c.querySelectorAll("li b")].map(b=>b.textContent);
   const h=parseInt(time),pm=/pm/i.test(time),hr=isNaN(h)?12:(h%12)+(pm?12:0),ic=hr<11?IC.sun:hr>=19?IC.moon:/train|workout|pre|post/i.test(when)?IC.bolt:IC.pill;
   out.rows.push(["c"+i,`${time}${when?" · "+when.trim():""}`,`${d}/${n} · ${clip(names.join(", "),70)}`,ic,n&&d===n?"var(--wd-green)":d?"var(--wd-yellow)":null]);
   out.nodes["c"+i]=()=>{const t=v.querySelector(":scope > .timeline");return [t&&t.querySelectorAll(":scope > .tcard")[i]]};out.titles["c"+i]=`${time}${when?" · "+when.trim():""}`});
  tl.classList.add("nesthide");
  const fl=v.querySelector(":scope > .flags"),bn=[...v.querySelectorAll(":scope > .note.small")],rest=[...v.querySelectorAll(":scope > p.muted.small")];
  if(fl||bn.length){const stop=fl&&fl.querySelector(".flag.stop"),cau=fl&&fl.querySelector(".flag.caution"),n=fl?fl.querySelectorAll(".flag").length:0;
   [fl,...bn,...rest].forEach(x=>x&&x.classList.add("nesthide"));
   out.rows.push(["notes","Safety notes and timing",`${n?n+" note"+(n>1?"s":"")+" · ":""}wake, meals and training times used`,IC.shield,stop?"var(--wd-red)":cau?"var(--wd-yellow)":null]);
   out.nodes.notes=()=>[v.querySelector(":scope > .flags"),...v.querySelectorAll(":scope > .note.small"),...v.querySelectorAll(":scope > p.muted.small")];out.titles.notes="Safety notes and timing"}
  const ns=[...v.querySelectorAll(":scope > .sheet")].find(s=>/not scheduled/i.test((s.querySelector("h4")||{}).textContent||""));
  if(ns){ns.classList.add("nesthide");out.rows.push(["paused","Not scheduled",clip([...ns.querySelectorAll("li")].map(l=>l.textContent).join(", "),70),IC.pause]);out.nodes.paused=()=>[[...v.querySelectorAll(":scope > .sheet")].find(s=>/not scheduled/i.test((s.querySelector("h4")||{}).textContent||""))];out.titles.paused="Not scheduled"}
  const rv=v.querySelector(":scope > .suppreview");if(rv){rv.classList.add("nesthide");out.rows.push(["review","Do you need them?","Coach review of each supplement",IC.chat]);out.nodes.review=()=>[v.querySelector(":scope > .suppreview")];out.titles.review="Do you need them?"}
  out.head=`<div class="sheet nesthead"><span class="label">Today</span><h3>${got} of ${tot} taken</h3><div class="v2meter"><i style="width:${tot?Math.round(100*got/tot):0}%;background:var(--wd-green)"></i></div></div>`;
  return out},
 meals(v){const out={rows:[],nodes:{},titles:{}};const tl=v.querySelector(":scope > .timeline");if(!tl)return null;
  [...tl.querySelectorAll(":scope > .tcard")].forEach((c,i)=>{const time=(c.querySelector(".ttime")||{}).textContent||"",name=(c.querySelector("h4")||{}).textContent||"Meal",m=(c.querySelector(".tbody > .muted.small")||{}).textContent||"";
   const k=(m.match(/([\d,]+)\s*kcal/)||[])[1],p=(m.match(/([\d.]+)\s*g protein/)||[])[1];
   out.rows.push(["m"+i,name,`${time}${k?" · "+k+" kcal":""}${p?" · "+p+" g protein":""}`,IC.food]);out.nodes["m"+i]=()=>{const t=v.querySelector(":scope > .timeline");return [t&&t.querySelectorAll(":scope > .tcard")[i]]};out.titles["m"+i]=name});
  tl.classList.add("nesthide");
  const fl=v.querySelector(":scope > .v2food");if(fl){fl.classList.add("nesthide");out.rows.push(["food","Food log","Log anything you ate that isn't on the plan",IC.log]);out.nodes.food=()=>[v.querySelector(":scope > .v2food")];out.titles.food="Food log"}
  [...v.querySelectorAll(":scope > details.sheet")].forEach((d,i)=>{const t=((d.querySelector("summary")||{}).textContent||"More").trim();d.classList.add("nesthide");
   out.rows.push(["d"+i,t,/grocer/i.test(t)?"Everything to buy for the week":"Make-ahead tips and easy swaps",/grocer/i.test(t)?IC.food:IC.log]);
   out.nodes["d"+i]=()=>{const x=v.querySelectorAll(":scope > details.sheet")[i];if(x)x.open=true;return [x]};out.titles["d"+i]=t});
  return out}};
const AT={today:".timeline",supps:".timeline",meals:".timeline"};   // rows go right after this element

const LAST={};
function process(tab,force){const v=$("v-"+tab);if(!v||!L[tab])return;
 const fresh=!v.querySelector(":scope > .nestix");if(!fresh&&!force)return;
 v.querySelectorAll(":scope > .nestix, :scope > .nesthead").forEach(x=>x.remove());
 const out=L[tab](v);if(!out)return;LAST[tab]=out;
 const anchor=v.querySelector(":scope > .tlnone")||v.querySelector(`:scope > ${AT[tab]}`)||v.lastElementChild;
 const box=document.createElement("div");box.className="pilist nestix";box.innerHTML=out.rows.map(r=>row(...r)).join("");
 if(out.rows.length)anchor.after(box);
 if(out.head){const tl=v.querySelector(":scope > .timeline");(tl||box).insertAdjacentHTML("beforebegin",out.head)}
 if(fresh&&cur&&cur.view===tab&&!reopening)openKey(tab,cur.key,true)}
function openKey(tab,key,refresh){const out=LAST[tab];if(!out||!out.nodes[key])return;const nodes=out.nodes[key]().filter(Boolean);if(!nodes.length)return;
 const body=$("pdBody"),sc=refresh&&body?body.scrollTop:0;
 reopening=true;cur={view:tab,key};
 window.F2C_pdOpen(out.titles[key]||"",nodes,"",()=>{if(reopening)return;const t=cur&&cur.view;cur=null;if(t)setTimeout(()=>process(t,true),0)});
 reopening=false;if(sc&&$("pdBody"))$("pdBody").scrollTop=sc}
window.F2C_nestOpen=openKey;
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-nk]");if(!b)return;const v=b.closest("[id^=v-]");if(!v)return;
 const tab=v.id.slice(2);process(tab,true);openKey(tab,b.dataset.nk)});
// after any tab render, lay it out again
let tm=null;new MutationObserver(()=>{clearTimeout(tm);tm=setTimeout(()=>{for(const t of ["today","supps","meals"]){const v=$("v-"+t);if(v&&!v.hidden)process(t)}},60)}).observe(document.documentElement,{childList:true,subtree:true});

const st=document.createElement("style");st.textContent=`
#v-today>.nesthide,#v-supps>.nesthide,#v-meals>.nesthide{display:none!important}
.tlcut>.tcard:not([data-nshow]){display:none}
.nestix{margin:12px 0 16px}
.nesthead h3{margin:2px 0 8px}.nesthead .v2meter{height:8px}
.tlnone{margin:4px 2px 8px}
#pdBody>details>summary{display:none}#pdBody>details.sheet{border:0;box-shadow:none;background:none;padding:0}
`;document.head.appendChild(st);
})();
