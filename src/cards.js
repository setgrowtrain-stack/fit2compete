/* ===== v2.6 cards: WHOOP detail screens (tap Recovery, Sleep or Strain on Today) and WHOOP-style scan cards on Body ===== */
(function(){
const X=()=>window.F2C_X||{};
const e_=s=>esc(s==null?"":String(s));
const IC={
 scale:'<rect x="3" y="4" width="18" height="16" rx="4"/><path d="M8 10a4 4 0 0 1 8 0z"/><path d="M12 10l1.6-2.2"/>',
 drop:'<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
 bicep:'<path d="M4 16c1-5 4-9 7-10l1.2 3-2 1.2c1 2 3 3 5 2.2 2.2-.8 4.3.6 4.3 3.1 0 2.8-2.7 4.5-6 4.5H6a2 2 0 0 1-2-2z"/>',
 lean:'<circle cx="12" cy="4.5" r="2"/><path d="M8 21l2-8-3.5-3.5L12 8l5.5 1.5L14 13l2 8"/>',
 arm:'<path d="M4 16c1-5 4-9 7-10l1.2 3-2 1.2c1 2 3 3 5 2.2 2.2-.8 4.3.6 4.3 3.1 0 2.8-2.7 4.5-6 4.5H6a2 2 0 0 1-2-2z"/>',
 trunk:'<path d="M8 3c-2 1-3 3-3 5l1 5 1 8h10l1-8 1-5c0-2-1-4-3-5-1 1.5-2.5 2-4 2S9 4.5 8 3z"/>',
 leg:'<path d="M8.5 3h7l-1.2 8.5L15.5 21h-3L12 14l-.8 7h-3l1.4-9.5z"/>',
 moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
 bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
 heart:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
 hrv:'<path d="M2 12h4l2-5 3 10 3-7 2 2h6"/>',
 o2:'<circle cx="9" cy="12" r="5"/><path d="M16 15.5c0-1 2.5-1.5 2.5-3a1.3 1.3 0 0 0-2.5-.4M16 17h3"/>',
 temp:'<path d="M14 14.5V5a2 2 0 0 0-4 0v9.5a4 4 0 1 0 4 0z"/>',
 lungs:'<path d="M12 4v8M12 12c-1 1-2 1-3 0M12 12c1 1 2 1 3 0M8 7c-3 1-4 5-4 9 0 2 1 3 3 3 2 0 2-2 2-4V8zM16 7c3 1 4 5 4 9 0 2-1 3-3 3-2 0-2-2-2-4V8z"/>',
 steps:'<path d="M7 14c-1.5 0-2.5 1.5-2.5 3S5.5 20 7 20s2-1.5 2-3-.5-3-2-3zM15 4c-1.5 0-2.5 1.5-2.5 3s1 3 2.5 3 2-1.5 2-3-.5-3-2-3z"/>',
 fire:'<path d="M12 3c2 3 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-8z"/>',
 bed:'<path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.6"/>',
 clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
 wake:'<path d="M12 3v3M5.6 5.6l2.1 2.1M3 12h3M18 12h3M16.3 7.7l2.1-2.1"/><path d="M7 17a5 5 0 0 1 10 0z"/><path d="M3 20h18"/>',
 target:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
 run:'<circle cx="14" cy="4.5" r="2"/><path d="M6 20l3.5-5 3 2V21M8 11l3-3 3 2 2 3h3M11 8l-1 5"/>'};
const ic=(k,cls)=>`<svg viewBox="0 0 24 24" class="${cls||"wic"}">${IC[k]||""}</svg>`;
const G="var(--wd-green)",Y="var(--wd-yellow)",R="var(--wd-red)",BL="var(--wd-strain)",SL="var(--wd-sleep)",MU="var(--wd-mut)";
const num=v=>v!=null&&v!==""&&isFinite(+v);
const hm=min=>{if(!num(min))return "–";min=Math.round(+min);return Math.floor(min/60)+"h "+String(min%60).padStart(2,"0")+"m"};
const avg=(arr,k)=>{const v=arr.map(d=>d[k]).filter(num).map(Number);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null};

/* ---------------- Body tab: muscle / fat by body part ---------------- */
const SEGIC={la:"arm",ra:"arm",tr:"trunk",ll:"leg",rl:"leg"};
window.F2C_segCard=function(k,title,m,pm,SEG){const lean=k==="lean";
 const col=p=>!num(p)?MU:lean?(p>=100?G:p>=90?Y:R):(p<=100?G:p<=160?Y:R);
 const rows=SEG.filter(([x])=>m[x]).map(([x,l])=>{const v=m[x]||{},p=pm&&pm[x]||{},pct=num(v.pct)?+v.pct:null,c=col(pct);
  const w=pct==null?0:Math.max(3,Math.min(100,pct/150*100));
  const d=pm&&num(v.lb)&&num(p.lb)?Math.round((v.lb-p.lb)*100)/100:null;
  const dc=d==null||d===0?MU:((d>0)===lean?G:R);
  return `<div class="segrow" data-wd="scan:part:${x}" role="button" tabindex="0"><div class="segic" style="color:${c}">${ic(SEGIC[x]||"arm","segsvg"+(x[0]==="r"?" flip":""))}</div>
   <div class="segmain"><div class="segtop"><b>${e_(l)}</b><span>${num(v.lb)?e_(v.lb)+" lb":""}</span></div>
   <div class="segbar"><i style="width:${w}%;background:${c}"></i><em title="100%"></em></div></div>
   <div class="segpct" style="color:${c}">${pct!=null?e_(pct)+"%":"–"}${d!=null?`<i style="color:${dc}">${d>0?"▲ +":d<0?"▼ ":""}${d} lb</i>`:""}</div></div>`}).join("");
 const bal=(a,b,name)=>{const A=m[a]&&+m[a].lb,B=m[b]&&+m[b].lb;if(!num(A)||!num(B)||!A||!B)return "";const diff=Math.abs(A-B)/Math.max(A,B)*100,ok=diff<=3;
  return `<div class="segbal"><span style="color:${ok?G:Y}">${ok?"✓":"!"}</span> ${name} ${diff.toFixed(1)}% apart · ${ok?"balanced":"stronger side: "+(A>B?"left":"right")}</div>`};
 return `<div class="sheet wearcard segcard"><div class="whead"><span>${lean?ic("bicep","hic")+" ":ic("drop","hic")+" "}${lean?"MUSCLE BY BODY PART":"FAT BY BODY PART"}</span><span>% OF IDEAL</span></div>
  <div class="seglist">${rows}</div>
  ${lean?`<div class="segbals">${bal("la","ra","Arms")}${bal("ll","rl","Legs")}</div>`:""}
  <p class="wadv small">${lean?"100% is average for your height (the white mark). 90 to 110% is the normal range; green is at or above average. Left and right within 3% is balanced.":"100% is the normal amount of fat for that body part. Lower is green; yellow is above normal."}${pm?" Arrows compare with your scan before this one.":""}</p></div><!--segend-->`};

/* ---------------- Body tab: since your last scan ---------------- */
window.F2C_sinceCard=function(c,scans){const last=scans[scans.length-1]||{},prev=scans[scans.length-2]||{};
 const tile=(icon,label,key,unit,good,col)=>{const x=c.change&&c.change[key],has=num(x),n=has?Math.round(x*10)/10:null;
  const cc=!has?MU:n===0?MU:((n>0)===good?G:R);
  const from=num(prev[key])&&num(last[key])?`${e_(prev[key])} → ${e_(last[key])}${unit.trim()==="%"?"%":" "+unit.trim()}`:"";
  return `<div class="wt sincet"><div class="sinceic" style="color:${col}">${ic(icon)}</div><span>${label}</span>
   <b style="color:${cc}">${has?(n>0?"▲ +":n<0?"▼ ":"")+n+unit:"–"}</b><small>${has?from:"Not on both scans"}</small></div>`};
 return `<div class="sheet wearcard sincecard"><div class="whead"><span>SINCE YOUR LAST SCAN</span><span>${c.weeks} WEEK${c.weeks>1?"S":""}</span></div>
  <div class="sincegrid">${tile("scale","WEIGHT","weight"," lb",true,"#ffffff")}${tile("drop","BODY FAT","bf","%",false,Y)}${tile("bicep","MUSCLE (SMM)","smm"," lb",true,BL)}${tile("lean","LEAN MASS","lean"," lb",true,SL)}</div>
  <p class="wadv small">${e_(c.from)} to ${e_(c.to)}. Green is the direction you want: muscle and lean mass up, body fat down. Weight is green when it goes up, since you're building.</p></div>`};

/* ---------------- WHOOP detail screens ---------------- */
let DS={kind:null,i:-1};
function days(){return (X().wear||[]).slice().sort((a,b)=>a.date<b.date?-1:1)}
function zoneCol(r){return !num(r)?MU:r>=67?G:r>=34?Y:R}
function strainZone(s){return !num(s)?["",MU]:s>=18?["All out",R]:s>=14?["High","#ff8a00"]:s>=10?["Moderate",Y]:["Light",BL]}
function ring(p,c,size){const r=42,C=2*Math.PI*r,v=Math.max(0,Math.min(100,p||0));return `<svg viewBox="0 0 100 100" class="${size||"dring"}"><circle cx="50" cy="50" r="${r}" fill="none" class="wtrack" stroke-width="8"/><circle cx="50" cy="50" r="${r}" fill="none" style="stroke:${c}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${C*v/100} ${C}" transform="rotate(-90 50 50)"/></svg>`}
function gauge(s,col){const v=Math.max(0,Math.min(21,+s||0))/21,r=42,C=Math.PI*r*1.5;return `<svg viewBox="0 0 100 100" class="dring"><circle cx="50" cy="50" r="${r}" fill="none" class="wtrack" stroke-width="8" stroke-dasharray="${C} 999" transform="rotate(135 50 50)" stroke-linecap="round"/><circle cx="50" cy="50" r="${r}" fill="none" style="stroke:${col||BL}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${C*v} 999" transform="rotate(135 50 50)"/></svg>`}
function bars(W,i,key,colFn,fmtFn,max){const from=Math.max(0,i-6),sl=W.slice(from,i+1);const mx=max||Math.max(1,...sl.map(d=>num(d[key])?+d[key]:0));
 return `<div class="dbars">${sl.map((d,j)=>{const v=num(d[key])?+d[key]:null,h=v==null?2:Math.max(4,v/mx*100),idx=from+j,sel=idx===i,bc=colFn(v,d);
  return `<button type="button" class="dbar${sel?" sel":""}" data-wdi="${idx}" aria-label="${e_(d.date)}"><span class="dbv">${v==null?"":fmtFn(v)}</span><span class="dbt"><i style="height:${h}%;background:${bc}"></i></span><span class="dbd">${new Date(d.date+"T12:00:00").toLocaleDateString("en-US",{weekday:"short"}).slice(0,2)}</span></button>`}).join("")}</div>`}
function stat(icon,label,val,base,key,good,fmtFn){if(!num(val))return "";let ch="";
 if(num(base)&&good){const diff=val-base,rel=Math.abs(diff)/(Math.abs(base)||1);if(rel>0.03){const better=(diff>0)===(good>0);ch=`<i style="color:${better?G:R}">${diff>0?"▲":"▼"}</i>`}}
 return `<div class="dstat">${ic(icon)}<div><b>${fmtFn(+val)} ${ch}</b><span>${label}</span>${num(base)?`<small>30-day avg ${fmtFn(base)}</small>`:""}</div></div>`}
const F={pct:v=>Math.round(v)+"%",ms:v=>Math.round(v)+" ms",bpm:v=>Math.round(v)+" bpm",dec:v=>(Math.round(v*10)/10)+"",hrs:v=>hm(v*60),min:v=>hm(v),int:v=>Math.round(v).toLocaleString("en-US"),c:v=>(Math.round(v*10)/10)+"°C",rpm:v=>(Math.round(v*10)/10)+" /min"};
function body(kind,W,i){const d=W[i]||{},prev=W.slice(Math.max(0,i-30),i),A=k=>avg(prev,k);let h="";
 if(kind==="rec"){const c=zoneCol(d.rec),zn=!num(d.rec)?"":d.rec>=67?"GREEN":d.rec>=34?"YELLOW":"RED";
  h+=`<div class="dhero">${ring(d.rec,c)}<div class="dherov"><b style="color:${c}">${num(d.rec)?Math.round(d.rec)+"%":"–"}</b><span style="color:${c}">RECOVERY${zn?" · "+zn:""}</span></div></div>`;
  const adv=window.F2C_wearAdvice?F2C_wearAdvice(d,{hrv:A("hrv"),rhr:A("rhr")}):"";if(adv)h+=`<p class="dadv">${e_(adv)}</p>`;
  h+=`<h4 class="dsect">Last 7 days</h4>${bars(W,i,"rec",zoneCol,v=>Math.round(v),100)}`;
  h+=`<h4 class="dsect">What went into it</h4><div class="dstats">${stat("hrv","Heart rate variability",d.hrv,A("hrv"),"hrv",1,F.ms)}${stat("heart","Resting heart rate",d.rhr,A("rhr"),"rhr",-1,F.bpm)}${stat("o2","Blood oxygen",d.spo2,A("spo2"),"spo2",0,F.pct)}${stat("temp","Skin temperature",d.temp,A("temp"),"temp",0,F.c)}${stat("lungs","Breathing rate (asleep)",d.resp,A("resp"),"resp",0,F.rpm)}${stat("moon","Sleep performance",d.perf,A("perf"),"perf",1,F.pct)}</div>`;
  h+=`<p class="dnote">Recovery zones: green 67 to 100%, yellow 34 to 66%, red 0 to 33%. Higher HRV and lower resting heart rate than your own average usually mean better recovery. Skin temperature and breathing rate matter when they move away from your normal, not by the number itself.</p>`}
 if(kind==="sleep"){const perf=num(d.perf)?+d.perf:null,asleep=num(d.sleep)?d.sleep*60:null,c=F2C_sleepCol(d.perf,d.sleep,d.need);
  h+=`<div class="dhero">${ring(perf!=null?perf:(asleep&&d.need?asleep/d.need*100:0),c)}<div class="dherov"><b style="color:${c}">${perf!=null?Math.round(perf)+"%":hm(asleep)}</b><span style="color:${c}">SLEEP${perf!=null?" PERFORMANCE":""}</span><small>${asleep!=null?hm(asleep)+" asleep":""}</small>${num(d.need)?`<small>needed ${hm(d.need)}</small>`:""}</div></div>`;
  const st=[["awake","Awake","#c7ced6"],["light","Light",SL],["deep","Deep (SWS)","#7b61ff"],["rem","REM","#28d0c8"]].filter(([k])=>num(d[k]));
  const tot=st.reduce((n,[k])=>n+(+d[k]),0);
  if(tot>0)h+=`<h4 class="dsect">Sleep stages</h4><div class="dstages">${st.map(([k,l,col])=>`<i style="width:${(+d[k])/tot*100}%;background:${col}"></i>`).join("")}</div>
   <div class="dstagel">${st.map(([k,l,col])=>`<div><span style="background:${col}"></span><b>${hm(d[k])}</b><small>${l} · ${Math.round((+d[k])/tot*100)}%</small></div>`).join("")}</div>`;
  h+=`<h4 class="dsect">Hours asleep, last 7 days</h4>${bars(W,i,"sleep",(v,x)=>F2C_sleepCol(x.perf,x.sleep,x.need),v=>(Math.round(v*10)/10)+"h")}`;
  h+=`<div class="dstats">${stat("bed","Time in bed",d.bed,A("bed"),"bed",0,F.min)}${stat("target","Sleep needed",d.need,A("need"),"need",0,F.min)}${stat("clock","Sleep efficiency",d.eff,A("eff"),"eff",1,F.pct)}${stat("clock","Sleep consistency",d.cons,A("cons"),"cons",1,F.pct)}${stat("moon","Sleep debt",d.debt,A("debt"),"debt",-1,F.min)}${stat("wake","Disturbances",d.dist,A("dist"),"dist",-1,F.int)}${stat("lungs","Breathing rate",d.resp,A("resp"),"resp",0,F.rpm)}</div>`;
  if(!num(d.light)&&!num(d.eff))h+=`<p class="dnote">More sleep numbers (light sleep, efficiency, consistency, sleep needed) fill in after the next WHOOP sync.</p>`;
  h+=`<p class="dnote">Color: green 85% and up, yellow 70 to 84%, red under 70%. Sleep performance is the sleep you got compared with the sleep your body needed. Efficiency is the share of time in bed you were asleep. Consistency is how close your bed and wake times are to the days before.</p>`}
 if(kind==="strain"){const [zn,zc]=strainZone(d.strain);
  const sc=F2C_strainCol(d.strain,d.rec);h+=`<div class="dhero">${gauge(d.strain,sc)}<div class="dherov"><b style="color:${sc}">${num(d.strain)?(+d.strain).toFixed(1):"–"}</b><span style="color:${sc}">STRAIN</span><small style="color:${zc}">${zn}</small></div></div>`;
  h+=`<h4 class="dsect">Last 7 days</h4>${bars(W,i,"strain",(v,x)=>F2C_strainCol(v,x.rec),v=>(Math.round(v*10)/10)+"",21)}`;
  h+=`<div class="dstats">${stat("fire","Calories burned",d.cal,A("cal"),"cal",0,F.int)}${stat("bolt","Energy (kJ)",d.kj,A("kj"),"kj",0,F.int)}${stat("heart","Average heart rate",d.hravg,A("hravg"),"hravg",0,F.bpm)}${stat("heart","Max heart rate",d.hrmax,A("hrmax"),"hrmax",0,F.bpm)}${stat("steps","Steps",d.steps,A("steps"),"steps",1,F.int)}${stat("run","Workouts",d.wkn,null,"wkn",0,F.int)}${stat("clock","Workout time",d.wkmin,A("wkmin"),"wkmin",0,F.min)}</div>`;
  if(!num(d.hravg)&&!num(d.kj))h+=`<p class="dnote">Heart rate, kJ and workouts fill in after the next WHOOP sync.</p>`;
  h+=`<p class="dnote">Strain runs 0 to 21: light under 10, moderate 10 to 13.9, high 14 to 17.9, all out 18 and up. Color shows how the day fits your recovery: green is in range (about 14 to 18 on a green recovery day, 10 to 14 on yellow, under 10 on red), yellow is under it, red is pushing past it on a yellow or red day.</p>`}
 return h}
const PARTN={la:"Left arm",ra:"Right arm",tr:"Trunk",ll:"Left leg",rl:"Right leg"},OTHER={la:"ra",ra:"la",ll:"rl",rl:"ll"};
function partHtml(code){const all=((X().body||{}).scans||[]).filter(s=>s.confirmed&&s.details&&s.details.segments&&s.details.segments.lean&&s.details.segments.lean[code]);
 if(!all.length)return `<p class="dnote">No ${PARTN[code]||"body part"} numbers on your scans yet.</p>`;
 const last=all[all.length-1],prev=all[all.length-2],sg=last.details.segments,L=sg.lean[code]||{},Fa=(sg.fat||{})[code]||{},PL=prev?prev.details.segments.lean[code]||{}:null,PF=prev?((prev.details.segments.fat||{})[code]||{}):null;
 const pct=num(L.pct)?+L.pct:null,c=!num(pct)?MU:pct>=100?G:pct>=90?Y:R;
 let h=`<div class="dhero">${ring(pct==null?0:Math.min(100,pct/150*100),c)}<div class="dherov"><b style="color:${c}">${pct!=null?Math.round(pct*10)/10+"%":"–"}</b><span style="color:${c}">OF IDEAL MUSCLE</span><small>${num(L.lb)?L.lb+" lb lean mass":""}</small></div></div>`;
 const d=(a,b2)=>num(a)&&num(b2)?Math.round((a-b2)*100)/100:null,sgn=n=>n==null?"–":(n>0?"+":"")+n;
 const dl=d(L.lb,PL&&PL.lb),df=d(Fa.lb,PF&&PF.lb);
 const tile=(icon,label,val,sub,col)=>`<div class="dstat">${ic(icon)}<div><b${col?` style="color:${col}"`:""}>${val}</b><span>${label}</span>${sub?`<small>${sub}</small>`:""}</div></div>`;
 h+=`<div class="dstats">${tile("bicep","Lean mass",num(L.lb)?L.lb+" lb":"–",prev?`${sgn(dl)} lb since ${new Date(prev.date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}`:"",dl==null?null:dl>0?G:dl<0?R:null)}${tile("target","Muscle vs ideal",pct!=null?pct+"%":"–","100% = average for your height")}`+
  (num(Fa.lb)||num(Fa.pct)?tile("drop","Fat",num(Fa.lb)?Fa.lb+" lb":"–",prev&&df!=null?`${sgn(df)} lb since ${new Date(prev.date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}`:"",df==null?null:df<0?G:df>0?R:null)+tile("drop","Fat vs normal",num(Fa.pct)?Fa.pct+"%":"–","100% = normal amount"):"");
 const o=OTHER[code],OL=o&&sg.lean[o];if(OL&&num(OL.lb)&&num(L.lb)&&L.lb&&OL.lb){const diff=Math.abs(L.lb-OL.lb)/Math.max(L.lb,OL.lb)*100,ok=diff<=3;
  h+=tile("target","Vs "+PARTN[o].toLowerCase(),`${OL.lb} lb`,`${diff.toFixed(1)}% apart · ${ok?"balanced":L.lb>OL.lb?"this side is bigger":"this side is smaller"}`,ok?G:Y)}
 h+=`</div>`;
 const hs=all.slice(-8),mx=Math.max(...hs.map(s=>+s.details.segments.lean[code].lb||0),1);
 if(hs.length>1)h+=`<h4 class="dsect">Lean mass, scan by scan</h4><div class="dbars" style="grid-template-columns:repeat(${hs.length},1fr)">${hs.map((s,i)=>{const v=+s.details.segments.lean[code].lb||0,hh=Math.max(4,(v-mx*0.8)/(mx*0.2)*100);
  return `<div class="dbar${i===hs.length-1?" sel":""}"><span class="dbv">${v||""}</span><span class="dbt"><i style="height:${Math.min(100,hh)}%;background:${BL}"></i></span><span class="dbd">${new Date(s.date+"T12:00:00").toLocaleDateString("en-US",{month:"short"})}</span></div>`}).join("")}</div><p class="dnote">Bars start at 80% of your best scan so small changes show.</p>`;
 h+=`<p class="dnote">InBody measures lean mass in each arm, each leg and the trunk. 90 to 110% of ideal is the normal range. Compare scans taken the same way (time of day, fasted, no workout first).</p>`;
 return h}
function drawScan(o){const k=DS.kind.split(":"),tab=k[1]||"parts",part=k[2];const dt=window.F2C_scanDate?F2C_scanDate():"";
 const TABS=[["parts","Body parts"],["changes","Changes"],["all","All values"],["hist","History"],["add","+ Add"]];
 const title=part?(PARTN[part]||"").toUpperCase():"SCAN"+(dt?" · "+new Date(dt+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"}).toUpperCase():"");
 o.innerHTML=`<div class="wdtop"><button type="button" class="wdback" ${part?'data-wd="scan:parts"':"data-wdclose"} aria-label="${part?"Back":"Close"}">‹</button><b>${e_(title)}</b><span></span></div>
  ${part?`<div class="wdtabs scroll">${Object.keys(PARTN).map(c=>`<button type="button" data-wd="scan:part:${c}" class="${c===part?"on":""}">${PARTN[c]}</button>`).join("")}</div>`
   :`<div class="wdtabs scroll">${TABS.map(([t,l])=>`<button type="button" data-wd="scan:${t}" class="${t===tab?"on":""}">${l}</button>`).join("")}</div>`}
  <div class="wdbody scanbody">${part?partHtml(part):(window.F2C_scanTab?F2C_scanTab(tab):"")}${!part&&tab==="parts"?`<p class="dnote">Tap a body part for its own numbers and history.</p>`:""}</div>`;
 try{window.F2C_scanWire&&F2C_scanWire(o)}catch(e){console.warn("[F2C] scan wire",e)}}
function draw(){const W=days();let o=document.getElementById("wdSheet");const isScan=DS.kind&&DS.kind.startsWith("scan");
 if(!DS.kind||(!isScan&&!W.length)){if(o)o.remove();document.body.classList.remove("wdopen");return}
 if(isScan){if(!o){o=document.createElement("div");o.id="wdSheet";o.setAttribute("role","dialog");o.setAttribute("aria-modal","true");document.body.appendChild(o);history.pushState({wd:1},"")}
  const y=o.dataset.kind===DS.kind?o.scrollTop:0;drawScan(o);o.dataset.kind=DS.kind;o.scrollTop=y;document.body.classList.add("wdopen");return}
 if(DS.i<0||DS.i>=W.length)DS.i=W.length-1;const d=W[DS.i],today=new Date().toISOString().slice(0,10);
 const title={rec:"RECOVERY",sleep:"SLEEP",strain:"STRAIN"}[DS.kind];
 const dl=d.date===today?"Today":new Date(d.date+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
 const html=`<div class="wdtop"><button type="button" class="wdback" data-wdclose aria-label="Close">‹</button><b>${title}</b><span></span></div>
  <div class="wdtabs">${["rec","sleep","strain"].map(k=>`<button type="button" data-wd="${k}" class="${k===DS.kind?"on":""}">${{rec:"Recovery",sleep:"Sleep",strain:"Strain"}[k]}</button>`).join("")}</div>
  <div class="wdday"><button type="button" data-wdi="${DS.i-1}" ${DS.i<=0?"disabled":""} aria-label="Day before">‹</button><span>${e_(dl)}</span><button type="button" data-wdi="${DS.i+1}" ${DS.i>=W.length-1?"disabled":""} aria-label="Next day">›</button></div>
  <div class="wdbody">${body(DS.kind,W,DS.i)}</div>`;
 if(!o){o=document.createElement("div");o.id="wdSheet";o.setAttribute("role","dialog");o.setAttribute("aria-modal","true");document.body.appendChild(o);history.pushState({wd:1},"")}
 o.innerHTML=html;document.body.classList.add("wdopen")}
function close(fromPop){DS.kind=null;draw();if(!fromPop&&history.state&&history.state.wd)history.back()}
window.F2C_wdRedraw=()=>{if(DS.kind&&document.getElementById("wdSheet"))draw()};
document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest("[data-term],a,input,label,select,textarea"))return;const t=e.target.closest&&e.target.closest("[data-wd],[data-wdi],[data-wdclose]");if(!t)return;
 if(t.hasAttribute("data-wdclose")){close();return}
 if(t.dataset.wd){const keep=!!document.getElementById("wdSheet");DS.kind=t.dataset.wd;if(!keep)DS.i=-1;draw();const o=document.getElementById("wdSheet");if(o&&!DS.kind.startsWith("scan:part")&&o.dataset.kind!==DS.kind)o.scrollTop=0;return}
 if(t.dataset.wdi!=null&&document.getElementById("wdSheet")){DS.i=+t.dataset.wdi;draw()}});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&DS.kind)close();if((e.key==="Enter"||e.key===" ")&&e.target&&e.target.dataset&&e.target.dataset.wd&&!document.getElementById("wdSheet")){e.preventDefault();e.target.click()}});
window.addEventListener("popstate",()=>{if(DS.kind)close(true)});
window.F2C_wdOpen=(k,i)=>{DS.kind=k;DS.i=i==null?-1:i;draw()};

const css=document.createElement("style");css.textContent=`
.wearcard [data-wd]{cursor:pointer;transition:transform .12s,background .12s}.wearcard [data-wd]:active{transform:scale(.97);background:var(--wd-tile2)}
.wtap{margin:0;text-align:center;font-size:.72rem;letter-spacing:.06em;color:var(--muted)}
.hic{width:15px;height:15px;vertical-align:-2px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.seglist{display:grid;gap:8px}.segrow{display:grid;grid-template-columns:40px minmax(0,1fr) 78px;gap:10px;align-items:center;background:var(--wd-tile);border-radius:16px;padding:10px 12px}
.segic{width:40px;height:40px;border-radius:12px;background:var(--wd-tile);display:flex;align-items:center;justify-content:center}.segsvg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.segsvg.flip{transform:scaleX(-1)}
.segtop{display:flex;justify-content:space-between;gap:8px;align-items:baseline}.segtop b{font-size:.95rem;color:var(--ink);white-space:nowrap}.segtop span{font-size:.82rem;color:var(--muted);white-space:nowrap}.segpct i{display:block;font-style:normal;font-weight:700;font-size:.7rem;margin-top:2px}
.segbar{position:relative;height:8px;border-radius:6px;background:var(--wd-tile2);margin-top:7px}.segbar i{position:absolute;left:0;top:0;bottom:0;border-radius:6px}.segbar em{position:absolute;left:66.7%;top:-3px;bottom:-3px;width:2px;background:var(--ink);opacity:.8;border-radius:1px}
.segpct{font-weight:800;font-size:1.15rem;text-align:right;white-space:nowrap}
.segbals{display:grid;grid-template-columns:1fr 1fr;gap:8px}.segbal{background:var(--wd-tile);border-radius:14px;padding:8px 10px;font-size:.78rem;color:var(--ink)}.segbal span{font-weight:900;margin-right:2px}
.sincegrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.sincet{align-items:flex-start!important;text-align:left!important;gap:2px;padding:12px 14px!important}
.sinceic{width:34px;height:34px;border-radius:11px;background:var(--wd-tile);display:flex;align-items:center;justify-content:center;margin-bottom:6px}.sinceic .wic{width:20px;height:20px}
.sincet span{margin-top:0!important}.sincet b{font-size:1.45rem!important}.sincet small{font-size:.72rem;color:var(--muted)}
.wic{fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
body.wdopen{overflow:hidden}
#wdSheet{position:fixed;inset:0;z-index:9999;background:var(--bg);color:var(--ink);overflow-y:auto;-webkit-overflow-scrolling:touch;padding:max(10px,env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom));animation:wdin .18s ease-out}
@keyframes wdin{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}
.wdtop{display:grid;grid-template-columns:44px 1fr 44px;align-items:center;text-align:center;max-width:640px;margin:0 auto}.wdtop b{letter-spacing:.16em;font-size:.9rem}
.wdback{width:44px;height:44px;border-radius:50%;border:0;background:var(--wd-tile);color:var(--ink);font-size:1.7rem;line-height:1;cursor:pointer}
.wdtabs{display:flex;gap:6px;justify-content:center;margin:10px auto 4px;max-width:640px}.wdtabs button{flex:1;border:0;border-radius:999px;padding:9px 0;background:var(--wd-tile);color:var(--muted);font-weight:800;font-size:.82rem;letter-spacing:.04em;cursor:pointer}.wdtabs button.on{background:var(--ink);color:var(--bg)}
.wdday{display:flex;align-items:center;justify-content:center;gap:14px;margin:8px auto;max-width:640px}.wdday span{min-width:130px;text-align:center;font-weight:700;color:var(--ink)}.wdday button{width:36px;height:36px;border-radius:50%;border:0;background:var(--wd-tile);color:var(--ink);font-size:1.3rem;cursor:pointer}.wdday button:disabled{opacity:.25;cursor:default}
.wdbody{max-width:640px;margin:0 auto}
.wdtabs.scroll{overflow-x:auto;justify-content:flex-start;scrollbar-width:none}.wdtabs.scroll::-webkit-scrollbar{display:none}.wdtabs.scroll button{flex:none;padding:9px 14px}
.scanbody .sheet:not(.wearcard){background:var(--card);color:var(--ink);border-color:var(--wd-tile)}.scanbody .sheet:not(.wearcard) .muted,.scanbody .sheet:not(.wearcard) .small{color:var(--muted)}
.scanbody table{color:var(--ink)}.scanbody th{color:var(--muted)}.scanbody td,.scanbody th{border-color:var(--wd-tile)!important}.scanbody input{background:var(--bg);color:var(--ink);border-color:var(--wd-tile2)}
.scanbody .wearcard{margin-bottom:12px}.segrow[data-wd]{cursor:pointer}.segrow[data-wd]:active{transform:scale(.98)}
.scanbody .sheet:not(.wearcard) .sect,.scanbody .sheet:not(.wearcard) .label,.scanbody .sheet:not(.wearcard) summary{color:var(--ink)!important}.scanbody .note.gold{color:#1b1b1b}
#v-body .scantap .wadv.small{display:none}.holobox .holoreset{top:48px;bottom:auto;right:8px;font-size:.72rem;padding:5px 10px}
.scantap{cursor:pointer;display:block}.scantap .wtap{margin-top:2px}
.scanstrip{display:flex;align-items:center;gap:10px;padding:10px 12px!important}.ssico{width:38px;height:38px;border-radius:12px;background:var(--gold-soft,#f6efd9);display:flex;align-items:center;justify-content:center;flex:none}.ssico .wic{width:22px;height:22px}
.sstext{flex:1;min-width:0;display:flex;flex-direction:column}.sstext b{font-size:.95rem}.sstext span{font-size:.8rem;color:var(--muted,#64748b)}
.sspill{border:1px solid var(--gold,#c9a227);background:var(--gold-soft,#f6efd9);color:inherit;font-weight:800;font-size:.75rem;border-radius:999px;padding:6px 10px;cursor:pointer}
.dhero{position:relative;width:min(230px,62vw);margin:6px auto 4px}.dring{width:100%;display:block}.dherov{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.dherov b{font-size:2.6rem;line-height:1}.dherov span{font-size:.72rem;font-weight:800;letter-spacing:.1em;margin-top:6px}.dherov small{font-size:.75rem;color:var(--muted);margin-top:3px;max-width:62%;line-height:1.25}
.dadv{background:var(--wd-tile);border-radius:16px;padding:12px 14px;font-size:.9rem;line-height:1.45;color:var(--ink)}
.dsect{font-size:.72rem;letter-spacing:.14em;color:var(--muted);margin:18px 0 8px;text-transform:uppercase}
.dbars{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;background:var(--wd-tile);border-radius:16px;padding:10px 8px}
.dbar{border:0;background:none;color:inherit;display:flex;flex-direction:column;align-items:center;gap:4px;padding:2px;cursor:pointer;border-radius:10px}.dbar.sel{background:var(--wd-tile2)}
.dbv{font-size:.68rem;color:var(--ink);min-height:1em}.dbt{height:84px;width:60%;display:flex;align-items:flex-end;background:var(--wd-tile);border-radius:6px;overflow:hidden}.dbt i{width:100%;border-radius:6px 6px 0 0}.dbd{font-size:.68rem;color:var(--muted)}
.dstats{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.dstat{display:flex;gap:10px;align-items:flex-start;background:var(--wd-tile);border-radius:16px;padding:11px 12px}.dstat .wic{width:22px;height:22px;flex:none;color:var(--wd-sleep);margin-top:2px}
.dstat b{display:block;font-size:1.1rem;white-space:nowrap}.dstat b i{font-style:normal;font-size:.75rem}.dstat span{display:block;font-size:.72rem;color:var(--muted);font-weight:700}.dstat small{display:block;font-size:.68rem;color:var(--muted);margin-top:2px}
.dstages{display:flex;height:16px;border-radius:8px;overflow:hidden;gap:2px}.dstages i{display:block}
.dstagel{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:8px}.dstagel div{display:flex;flex-direction:column}.dstagel span{width:10px;height:10px;border-radius:3px;margin-bottom:4px}.dstagel b{font-size:.9rem}.dstagel small{font-size:.66rem;color:var(--muted)}
.dnote{font-size:.78rem;color:var(--muted);line-height:1.5;margin-top:14px}
@media (max-width:360px){.dstats{grid-template-columns:1fr}.dstagel{grid-template-columns:repeat(2,1fr)}}`;
document.head.appendChild(css);
})();
