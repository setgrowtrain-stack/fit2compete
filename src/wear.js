/* ===== Wearable data: upload exports (WHOOP, Oura, Fitbit, Garmin CSV...), screenshots read by the coach, show and use it ===== */
(function(){
/* Traffic-light colors for WHOOP numbers (same on every look). Sleep: WHOOP sleep performance bands, 85%+ optimal (green), 70 to 84% sufficient (yellow), under 70% poor (red); without a score, hours slept vs sleep needed.
   Strain: green when the day's strain fits the recovery (green recovery 14 to 18, yellow 10 to 14, red under 10), yellow when below that, red when above it on a yellow or red recovery day. */
window.F2C_sleepCol=(perf,hrs,need)=>{const p=perf!=null&&perf!==""?+perf:(hrs!=null&&need?hrs*6000/need:null);return p==null||!isFinite(p)?"var(--wd-mut)":p>=85?"var(--wd-green)":p>=70?"var(--wd-yellow)":"var(--wd-red)"};
window.F2C_strainCol=(st,rec)=>{if(st==null||st===""||!isFinite(+st))return "var(--wd-mut)";st=+st;const t=rec==null||rec===""?[10,14]:rec>=67?[14,18]:rec>=34?[10,14]:[0,10];if(st<t[0])return "var(--wd-yellow)";if(st<=t[1])return "var(--wd-green)";return rec!=null&&rec!==""&&rec<67?"var(--wd-red)":"var(--wd-yellow)"};
const T=()=>window.F2C_T,X=()=>window.F2C_X||{},$=id=>document.getElementById(id);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const KEYS=["rec","hrv","rhr","sleep","perf","deep","rem","debt","strain","steps","cal","spo2","temp","resp"];
const DEVS=[["whoop","WHOOP"],["oura","Oura Ring"],["garmin","Garmin"],["fitbit","Fitbit / Google"],["apple","Apple Watch / Health"],["samsung","Samsung Health"],["polar","Polar"],["hume","Hume Band"],["amazfit","Amazfit (Zepp)"],["other","Something else"]];
const HOW={oura:"Oura: open the Oura app or ouraring.com, Membership hub, Export data, choose CSV. Upload the file here.",garmin:"Garmin: on connect.garmin.com open Reports (sleep, steps, HRV, stress), pick the range and export CSV. Upload it here.",
 fitbit:"Fitbit / Google: go to takeout.google.com, choose Fitbit, export, then upload the zip here.",apple:"Apple Health has no web export for other apps. Take screenshots of Sleep, Heart Rate Variability, Resting Heart Rate and Steps (week view) and upload them; your coach reads them.",
 samsung:"Samsung Health: Settings, Download personal data, then upload the CSV files here. Or upload screenshots.",hume:"Hume Band: Hume says your data is exportable. In the Hume Health app, look under your profile or settings for data export and upload the file here. If you can't find it, upload screenshots of your sleep, HRV, resting heart rate and steps screens.",amazfit:"Amazfit: in the Zepp app go to Profile, Settings, and look for Export Data (or Data Management), then upload the file here. Or upload screenshots of your sleep, heart rate and steps screens.",polar:"Polar: on flow.polar.com, Settings, Export data, then upload the CSV here.",other:"Upload any CSV export with dates, or screenshots of your sleep, recovery and steps screens."};

/* ---------- reading files ---------- */
function csv(text){const rows=[];let row=[],f="",q=false;text=text.replace(/^﻿/,"");
 for(let i=0;i<text.length;i++){const c=text[i];if(q){if(c==='"'){if(text[i+1]==='"'){f+='"';i++}else q=false}else f+=c}
  else if(c==='"')q=true;else if(c===","||c===";"&&false){row.push(f);f=""}else if(c==="\n"){row.push(f);rows.push(row);row=[];f=""}else if(c!=="\r")f+=c}
 if(f||row.length){row.push(f);rows.push(row)}return rows.filter(r=>r.some(x=>x.trim()!==""))}
async function unzip(buf){const dv=new DataView(buf),u8=new Uint8Array(buf),out=[];let eocd=-1;
 for(let i=buf.byteLength-22;i>=Math.max(0,buf.byteLength-70000);i--)if(dv.getUint32(i,true)===0x06054b50){eocd=i;break}
 if(eocd<0)throw new Error("not a zip");let p=dv.getUint32(eocd+16,true);const n=dv.getUint16(eocd+10,true);
 for(let k=0;k<n;k++){if(dv.getUint32(p,true)!==0x02014b50)break;const method=dv.getUint16(p+10,true),csize=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),el=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),lo=dv.getUint32(p+42,true);
  const name=new TextDecoder().decode(u8.subarray(p+46,p+46+nl));p+=46+nl+el+cl;
  if(!/\.csv$/i.test(name)||/__MACOSX/.test(name))continue;
  const start=lo+30+dv.getUint16(lo+26,true)+dv.getUint16(lo+28,true),data=u8.subarray(start,start+csize);let text;
  if(method===0)text=new TextDecoder().decode(data);else if(method===8){const ds=new DecompressionStream("deflate-raw");text=await new Response(new Blob([data]).stream().pipeThrough(ds)).text()}else continue;
  out.push({name,text})}
 return out}
function day(v){v=String(v||"").trim();let m;
 if((m=v.match(/^(\d{4})-(\d{2})-(\d{2})/)))return `${m[1]}-${m[2]}-${m[3]}`;
 if((m=v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/))){const y=m[3].length===2?"20"+m[3]:m[3];return `${y}-${m[1].padStart(2,"0")}-${m[2].padStart(2,"0")}`}
 const t=Date.parse(v);if(!isNaN(t)){const d=new Date(t);return d.toISOString().slice(0,10)}return ""}
const num=v=>{const n=parseFloat(String(v||"").replace(/[^\d.\-]/g,""));return isFinite(n)?n:null};
/* Map a CSV's columns to our fields by their names. Works for WHOOP, Oura, Fitbit, Garmin and most "export to CSV" files. */
const MAP=[["rec",/recovery score|readiness score|^readiness$|body battery|recovery/],["hrv",/heart rate variability|\bhrv\b|average hrv/],["rhr",/resting heart rate|resting hr|lowest heart rate|\brhr\b/],
 ["sleep",/asleep duration|total sleep|time asleep|minutes asleep|sleep duration|hours of sleep|^sleep$/],["perf",/sleep performance|sleep score/],["deep",/deep/],["rem",/\brem\b/],["debt",/sleep debt/],
 ["strain",/strain/],["steps",/steps/],["cal",/energy burned|calories|kilojoule|\bkj\b/],["spo2",/blood oxygen|spo2|oxygen saturation/],["temp",/skin temp/],["resp",/respiratory rate|breathing rate|respiration/]];
function parseTable(rows,name){if(rows.length<2)return [];const H=rows[0].map(h=>h.trim().toLowerCase());
 const dateCol=["wake onset","cycle start time","calendar date","summary date","date","day","start time","sleep onset","timestamp","start"].map(k=>H.findIndex(h=>h===k||h.startsWith(k))).find(i=>i>=0);
 if(dateCol==null||dateCol<0)return [];
 const col={};MAP.forEach(([k,re])=>{const i=H.findIndex((h,j)=>j!==dateCol&&re.test(h)&&!(k==="rec"&&/time|duration/.test(h))&&!(k==="sleep"&&/need|debt|onset|efficiency|consistency|latency|score|performance|deep|rem|light/.test(h))&&!(k==="deep"&&/score/.test(h))&&!(k==="rem"&&/score/.test(h)));if(i>=0)col[k]=i});
 if(Object.keys(col).length===0)return [];
 return rows.slice(1).map(r=>{const o={date:day(r[dateCol])};if(!o.date)return null;
  for(const k in col){let v=num(r[col[k]]);if(v==null)continue;const h=H[col[k]];
   if(k==="sleep"){if(/\(min|minutes/.test(h)||v>24&&v<=1440)v=v/60;else if(v>1440)v=v/3600;v=Math.round(v*100)/100}
   if((k==="deep"||k==="rem"||k==="debt")&&!/\(min|minutes/.test(h)&&v>600)v=Math.round(v/60);
   if(k==="cal"&&/kilojoule|\bkj\b/.test(h))v=Math.round(v/4.184);
   if(k==="hrv"&&v<1)v=Math.round(v*1000);
   o[k]=v}
  return Object.keys(o).length>1?o:null}).filter(Boolean)}
function merge(lists){const by={};lists.forEach(l=>l.forEach(o=>{const d=by[o.date]=by[o.date]||{date:o.date};for(const k of KEYS)if(o[k]!=null&&d[k]==null)d[k]=o[k]}));return Object.values(by).sort((a,b)=>a.date<b.date?-1:1)}
async function readFiles(files){const tables=[];let source="";
 for(const f of files){const n=(f.name||"").toLowerCase();
  if(/whoop/.test(n))source="whoop";else if(/oura/.test(n))source=source||"oura";else if(/garmin/.test(n))source=source||"garmin";else if(/fitbit/.test(n))source=source||"fitbit";
  if(/\.zip$/.test(n)||f.type==="application/zip"){const items=await unzip(await f.arrayBuffer());
   items.sort((a,b)=>/physiological|cycle|daily|summary/i.test(a.name)?-1:/physiological|cycle|daily|summary/i.test(b.name)?1:0);
   if(items.some(x=>/physiological_cycles/i.test(x.name)))source="whoop";
   items.forEach(x=>tables.push(parseTable(csv(x.text),x.name)))}
  else if(/\.csv$|\.txt$/.test(n)||/csv|text/.test(f.type)){const t=await f.text();if(/physiological|recovery score/i.test(t.slice(0,600)))source="whoop";tables.push(parseTable(csv(t),n))}}
 return {days:merge(tables),source:source||"upload"}}

/* ---------- screenshots and PDFs go to the coach ---------- */
const WEAR_PROMPT=`Read these screenshots or files from a fitness wearable or health app (WHOOP, Oura, Apple Health, Garmin, Fitbit, Samsung, or similar). Reply with ONLY JSON:
{"source":"device or app name, lower case","days":[{"date":"YYYY-MM-DD","rec":recovery or readiness score 0-100,"hrv":HRV in ms,"rhr":resting heart rate bpm,"sleep":hours asleep (decimal),"perf":sleep score or sleep performance %,"deep":deep sleep minutes,"rem":REM minutes,"debt":sleep debt minutes,"strain":strain or effort score,"steps":steps,"cal":calories burned,"spo2":blood oxygen %,"temp":skin temperature C or deviation,"resp":respiratory rate}],"notes":"anything unclear"}
One object per day shown. Use the dates printed; if only "today" or a weekday is shown, work out the date from today's date ${new Date().toISOString().slice(0,10)}. Leave out any number that isn't shown. Never guess.`;
async function sendShots(files){return F2C_submit("question",WEAR_PROMPT,{images:files,meta:{kind:"wear"}})}
async function applyCoachReads(){const q=(X().requests||[]).filter(r=>r.type==="question"&&r.meta&&r.meta.kind==="wear"&&r.status==="answered"&&r.answer&&Array.isArray(r.answer.days));
 for(const r of q){try{const res=await F2C_call("saveWearables",r.answer.days,r.answer.source||"screenshot");X().wear=res.wear;window.F2C_markApplied&&await F2C_markApplied(r.id);r.status="applied"}catch(e){}}
 if(q.length)render()}

/* ---------- show it ---------- */
const avg=(arr,k)=>{const v=arr.map(d=>d[k]).filter(x=>x!=null&&isFinite(x));return v.length?v.reduce((a,b)=>a+b,0)/v.length:null};
const fmt={rec:v=>Math.round(v)+"%",hrv:v=>Math.round(v)+" ms",rhr:v=>Math.round(v)+" bpm",sleep:v=>{const h=Math.floor(v),m=Math.round((v-h)*60);return h+"h "+String(m).padStart(2,"0")+"m"},perf:v=>Math.round(v)+"%",strain:v=>(Math.round(v*10)/10)+"",steps:v=>Math.round(v).toLocaleString("en-US"),cal:v=>Math.round(v).toLocaleString("en-US"),deep:v=>Math.round(v)+" min",rem:v=>Math.round(v)+" min",spo2:v=>(Math.round(v*10)/10)+"%",resp:v=>(Math.round(v*10)/10)+"",temp:v=>(Math.round(v*10)/10)+"°",debt:v=>Math.round(v)+" min"};
const LBL={rec:"Recovery",hrv:"HRV",rhr:"Resting HR",sleep:"Sleep",perf:"Sleep score",strain:"Strain",steps:"Steps",cal:"Calories",deep:"Deep sleep",rem:"REM sleep",spo2:"Blood oxygen",resp:"Breathing rate",temp:"Skin temp",debt:"Sleep debt"};
const GOOD={rec:1,hrv:1,rhr:-1,sleep:1,perf:1,steps:1,deep:1,rem:1,debt:-1};
/* v2.11 tile colors. Steps: 10,000+ green, 7,000+ yellow (Paluch et al., Lancet Public Health 2022: risk keeps falling to about 8,000 to 10,000). HRV and resting HR: against your own 30-day average (needs 7+ days): HRV 95%+ green, 85 to 95% yellow; resting HR within 2 bpm green, 3 to 6 above yellow. Without a baseline, resting HR under 65 green, 65 to 80 yellow, over 80 red; HRV stays uncolored (it only means something against your own normal). Eaten: on pace for the day's target (8 AM to 9 PM), 90%+ of pace green, 75%+ yellow; well over target yellow then red (more room when the goal is to gain). */
window.F2C_tileZone=function(k,v,b){if(v==null||!isFinite(v))return "";b=b||{};
 if(k==="steps")return v>=10000?"green":v>=7000?"yellow":"red";
 if(k==="hrv"){if(!b.hrv)return "";const r=v/b.hrv;return r>=.95?"green":r>=.85?"yellow":"red"}
 if(k==="rhr"){if(b.rhr){const d=v-b.rhr;return d<=2?"green":d<=6?"yellow":"red"}return v<65?"green":v<=80?"yellow":"red"}
 if(k==="eat"){const t=b.target;if(!t)return "";const gain=!!b.gain,over=v/t;if(over>(gain?1.3:1.15))return "red";if(over>(gain?1.15:1.08))return "yellow";if(over>=.9)return "green";
  const h=new Date().getHours()+new Date().getMinutes()/60;if(h<10)return "";const frac=Math.min(1,Math.max(.15,(h-8)/13)),pace=v/(t*frac);return pace>=.9?"green":pace>=.75?"yellow":"red"}
 return ""};
function zone(r){return r==null?"":r>=67?"green":r>=34?"yellow":"red"}
function advice(d,base){if(!d)return "";const z=zone(d.rec),hrvLow=d.hrv!=null&&base.hrv&&d.hrv<base.hrv*0.85,rhrHigh=d.rhr!=null&&base.rhr&&d.rhr>=base.rhr+5,short=d.sleep!=null&&d.sleep<6;
 if(z==="red"||(hrvLow&&rhrHigh))return "Low recovery. Lift as planned but hold your weights (no increases), skip or shorten hard intervals and sprints, and get to bed early.";
 if(z==="yellow"||hrvLow||rhrHigh||short)return "Middling recovery. Do the workout, but stop sets 1 to 2 reps short and keep hard intervals at the low end of the range.";
 if(z==="green")return "Good recovery. A good day to push: go for weight increases and full-effort intervals.";return ""}
window.F2C_wearToday=function(){const W=X().wear||[];if(!W.length)return "";const last=W[W.length-1],today=new Date().toISOString().slice(0,10),prev=W.slice(-31,-1),base={hrv:avg(prev,"hrv"),rhr:avg(prev,"rhr")};
 const stale=last.date<new Date(Date.now()-2*864e5).toISOString().slice(0,10);
 const slc=F2C_sleepCol(last.perf,last.sleep,last.need),stc=F2C_strainCol(last.strain,last.rec);
 const ZC={green:"var(--wd-green)",yellow:"var(--wd-yellow)",red:"var(--wd-red)"},rz=last.rec!=null?zone(last.rec):"",rc=ZC[rz]||"#9aa4af";
 const ring=v=>{const r=42,c=2*Math.PI*r,p=Math.max(0,Math.min(100,v||0));return `<svg viewBox="0 0 100 100" class="wring"><circle cx="50" cy="50" r="${r}" fill="none" class="wtrack" stroke-width="9"/><circle cx="50" cy="50" r="${r}" fill="none" style="stroke:${rc}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${c*p/100} ${c}" transform="rotate(-90 50 50)"/></svg>`};
 const I={hrv:'<path d="M2 12h4l2-5 3 10 3-7 2 2h6"/>',rhr:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',steps:'<path d="M7 14c-1.5 0-2.5 1.5-2.5 3S5.5 20 7 20s2-1.5 2-3-0.5-3-2-3zM15 4c-1.5 0-2.5 1.5-2.5 3s1 3 2.5 3 2-1.5 2-3-.5-3-2-3zM6 12c0-2 .5-4 1.5-4S9 10 8.5 12M14 13c.5 2 1 4 2 4s1.5-2 1-4"/>',cal:'<path d="M12 3c2 3 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-8z"/>',debt:'<path d="M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z"/>'};
 const ic=k=>`<svg viewBox="0 0 24 24" class="wic">${I[k]||""}</svg>`;
 const nb=prev.filter(d=>d.hrv!=null).length,nr=prev.filter(d=>d.rhr!=null).length,eat=window.F2C_eatenVsTarget?F2C_eatenVsTarget():null;
 const tcol=k=>{const v=last[k],z=window.F2C_tileZone?F2C_tileZone(k,v,{hrv:nb>=7?base.hrv:null,rhr:nr>=7?base.rhr:null}):"";return ZC[z]||"var(--ink)"};
 const tile=(k,val,lab,col,wd)=>`<div class="wt wsm" data-wd="${wd}" role="button" tabindex="0">${ic(k)}<b style="color:${col}">${val}</b><span>${lab}</span></div>`;
 const small=["hrv","rhr","steps"].filter(k=>last[k]!=null).map(k=>tile(k,fmt[k](last[k]),k==="hrv"?"HRV":k==="rhr"?"RESTING HR":"STEPS",tcol(k),k==="steps"?"strain":"rec")).join("")+
  (eat&&eat.target?tile("cal",eat.cal?Math.round(eat.cal).toLocaleString("en-US"):"–",eat.cal?"EATEN / "+Math.round(eat.target).toLocaleString("en-US"):"LOG MEALS · "+Math.round(eat.target).toLocaleString("en-US"),eat.cal?(ZC[F2C_tileZone("eat",eat.cal,eat)]||"var(--ink)"):"var(--ink)","strain"):last.cal!=null?tile("cal",fmt.cal(last.cal),"CAL BURNED","var(--ink)","strain"):"");
 const src=(last.src||[]).some(x=>/whoop/.test(x))?"WHOOP":(last.src||[]).join(", ").toUpperCase();
 return `<div class="sheet wearcard"><div class="whead"><span>${esc(src||"WEARABLE")}</span><span>${last.date===today?"TODAY":esc(last.date)}</span></div>
  <div class="wtop"><div class="wt wrec" data-wd="rec" role="button" tabindex="0" aria-label="Recovery details">${ring(last.rec)}<div class="wrecv"><b style="color:${rc}">${last.rec!=null?Math.round(last.rec)+"%":"–"}</b><span style="color:${rc}">RECOVERY</span></div></div>
   <div class="wcol"><div class="wt wmid" data-wd="sleep" role="button" tabindex="0" aria-label="Sleep details"><b style="color:${slc}">${last.perf!=null?Math.round(last.perf)+"%":last.sleep!=null?fmt.sleep(last.sleep):"–"}</b><span style="color:${slc}">SLEEP${last.perf!=null&&last.sleep!=null?" · "+fmt.sleep(last.sleep):""}</span></div>
   <div class="wt wmid" data-wd="strain" role="button" tabindex="0" aria-label="Strain details"><b style="color:${stc}">${last.strain!=null?(+last.strain).toFixed(1):"–"}</b><span style="color:${stc}">STRAIN</span></div></div></div>
  ${small?`<div class="wsmall">${small}</div>`:""}
  <p class="wtap">Tap Recovery, Sleep or Strain for the details</p>
  ${stale?`<p class="wadv">No new data for a couple of days. Sync or upload in Settings › Connected devices.</p>`:`<p class="wadv">${esc(advice(last,base))}</p>`}</div>`};
function wearHtml(){const W=X().wear||[],X7=W.slice(-7),P7=W.slice(-14,-7),X30=W.slice(-30);
 let h=`<div class="sheet" id="wearBox"><span class="label">Connected devices</span>`;
 const wh=X().whoop||{};
 h+=`<div class="whoopbox">${wh.connected?`<p class="small"><b>WHOOP connected.</b> Syncs on its own every few hours${wh.last?" · last "+esc(new Date(wh.last).toLocaleString([], {month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})):""}.</p><div class="row"><button type="button" class="btn small" data-whoop="sync">Sync now</button><button type="button" class="linkbtn small" data-whoop="off">Disconnect</button></div>`:`<button type="button" class="btn primary" data-dev="open">Connect a device</button>
  <div class="devpick" id="devPick" hidden><p class="small">Pick your device:</p><div class="devlist">${DEVS.map(d=>`<button type="button" class="btn small" data-dev="${d[0]}">${esc(d[1])}</button>`).join("")}</div><div id="devHow"></div></div>`}</div>`;
 if(W.length){const ks=KEYS.filter(k=>X7.some(d=>d[k]!=null));
  h+=`<details><summary class="small"><b>Your numbers</b>: last 7 days vs the week before</summary><div class="scroll"><table><thead><tr><th></th><th>Last 7 days</th><th>Week before</th><th>30 days</th></tr></thead><tbody>${ks.map(k=>{const a=avg(X7,k),b=avg(P7,k),c=avg(X30,k);let ch="";if(a!=null&&b!=null&&GOOD[k]){const up=a>b,better=(up?1:-1)*GOOD[k]>0,diff=Math.abs(a-b);if(diff/(Math.abs(b)||1)>0.03)ch=` <span class="${better?"wgood":"wbad"}">${up?"▲":"▼"}</span>`}
   return `<tr><td>${LBL[k]}</td><td class="num">${a!=null?fmt[k](a):""}${ch}</td><td class="num">${b!=null?fmt[k](b):""}</td><td class="num">${c!=null?fmt[k](c):""}</td></tr>`}).join("")}</tbody></table></div>
   <p class="muted small">${W.length} days on file, ${esc(W[0].date)} to ${esc(W[W.length-1].date)}. Your coach uses these in weekly check-ins and the monthly review, and Today adjusts how hard to push.</p></details>`}
 else h+=`<p class="small">Bring in sleep, recovery, HRV, resting heart rate, strain and steps from your watch or ring. Your coach uses them to set how hard to push and when to back off.</p>`;
 h+=`<details><summary class="small"><b>Other devices</b>: upload a file or screenshots from any watch or ring</summary>
  <div class="wearup"><p class="small"><b>Export file (best):</b> WHOOP: More → App Settings → Data Export, then upload the zip from the email. Oura: Membership hub → Export data (CSV). Fitbit or Google: Google Takeout. Garmin Connect: export a report to CSV. Any CSV with dates works.</p>
  <label class="btn small"><input type="file" id="wearFile" accept=".zip,.csv,text/csv,application/zip" multiple hidden>Upload export (zip or CSV)</label>
  <p class="small"><b>Or screenshots:</b> Apple Health, Samsung Health or any app. Your coach reads them, usually within 3 hours.</p>
  <label class="btn small"><input type="file" id="wearShot" accept="image/*,application/pdf" multiple hidden>Upload screenshots</label>
  <p class="status small" id="wearSt" role="status"></p></div></details>`;
 const pend=(X().requests||[]).filter(r=>r.type==="question"&&r.meta&&r.meta.kind==="wear"&&(r.status==="new"||r.status==="working"));
 if(pend.length)h+=`<div class="note gold">Your coach is reading ${pend.length===1?"your screenshots":pend.length+" uploads"}. They'll show up here.</div>`;
 return h+`</div>`}
function render(){const v=$("setupDevices")||$("v-body");if(!v)return;const old=$("wearBox");const html=wearHtml();if(old)old.outerHTML=html;else v.insertAdjacentHTML("afterbegin",html);wire()}
function wire(){const f=$("wearFile"),s=$("wearShot"),st=$("wearSt");
 if(f)f.onchange=async()=>{const files=[...f.files];if(!files.length)return;st.textContent="Reading your file…";
  try{const r=await readFiles(files);if(!r.days.length){st.textContent="Couldn't find daily numbers in that file. Try the screenshots button instead.";return}
   st.textContent=`Found ${r.days.length} days (${r.days[0].date} to ${r.days[r.days.length-1].date}). Saving…`;
   let res;for(let i=0;i<r.days.length;i+=400)res=await F2C_call("saveWearables",r.days.slice(i,i+400),r.source);
   X().wear=res.wear;render();const s2=$("wearSt");if(s2)s2.textContent=`Saved ${r.days.length} days from ${r.source==="upload"?"your file":r.source.toUpperCase()}.`}
  catch(e){st.textContent=e&&e.code==="read_only"?"Only the athlete or parent can add data.":"Couldn't read that file. If it's a zip, try one CSV from inside it."}};
 if(s)s.onchange=async()=>{const files=[...s.files];if(!files.length)return;st.textContent="Sending to your coach…";
  try{await sendShots(files.slice(0,10));render();const s2=$("wearSt");if(s2)s2.textContent="Sent. Your coach will read it, usually within 3 hours."}catch(e){st.textContent="Couldn't send. Try again."}}}
const _rb=window.F2C_rBody;window.F2C_rBody=function(){const r=_rb&&_rb.apply(this,arguments);try{render();applyCoachReads()}catch(e){console.warn("[F2C] wear",e)}return r};
const _te=window.F2C_todayExtras;window.F2C_todayExtras=function(){let h="";try{h=F2C_wearToday()}catch(e){}return h+(_te?_te.apply(this,arguments):"")};
window.F2C_wearRead=readFiles;window.F2C_wearAdvice=advice;window.F2C_wearRender=()=>render();
document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-dev]");if(!t)return;const d=t.dataset.dev,pk=$("devPick"),how=$("devHow");
 if(d==="open"){if(pk)pk.hidden=!pk.hidden;return}
 if(d==="whoop"){const wh=X().whoop||{};if(wh.ready){const b=document.createElement("button");b.dataset.whoop="on";b.hidden=true;document.body.appendChild(b);b.click();b.remove()}else if(how)how.innerHTML=`<p class="small">WHOOP sign-in isn't switched on yet. Upload your WHOOP data export instead (WHOOP app: More, App Settings, Data Export).</p>`;return}
 if(how){how.innerHTML=`<p class="small"><b>${esc((DEVS.find(x=>x[0]===d)||[])[1]||"")}</b> doesn't offer a sign-in other apps can use yet, so it comes in by file. ${esc(HOW[d]||"")}</p><div class="row"><button type="button" class="btn small" onclick="document.getElementById('wearFile').click()">Upload export</button><button type="button" class="btn small" onclick="document.getElementById('wearShot').click()">Upload screenshots</button></div>`}},true);
document.addEventListener("click",async e=>{const t=e.target.closest&&e.target.closest("[data-whoop]");if(!t)return;const m=t.dataset.whoop,st=$("wearSt");
 try{if(m==="on"){t.disabled=true;const r=await F2C_call("whoopStart");location.href=r.url;return}
  if(m==="sync"){t.disabled=true;t.textContent="Syncing…";const r=await F2C_call("whoopSync");X().wear=r.wear;X().whoop=Object.assign({},X().whoop,{last:Date.now()});render();return}
  if(m==="off"){if(!confirm("Disconnect WHOOP? Data already saved stays."))return;await F2C_call("whoopDisconnect");X().whoop=Object.assign({},X().whoop,{connected:false});render()}}
 catch(err){t.disabled=false;if(st)st.textContent=err&&err.message?err.message:"Couldn't reach WHOOP. Try again."}},true);
const st=document.createElement("style");st.textContent=`.wearcard{background:var(--card)!important;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);color:var(--ink);border-color:var(--wd-tile)!important;display:grid;gap:10px}.whead{display:flex;justify-content:space-between;font-weight:800;letter-spacing:.12em;font-size:.78rem;color:var(--ink)}.wt{background:var(--wd-tile);border-radius:18px;padding:12px;box-sizing:border-box;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.wt b{font-size:1.6rem;line-height:1.1;white-space:nowrap}.wt span{font-size:.7rem;font-weight:800;letter-spacing:.08em;margin-top:4px;color:var(--muted)}.wtop{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:10px}.wrec{position:relative;aspect-ratio:1}.wring{width:100%;max-width:170px}.wrecv{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}.wrecv b{font-size:2.2rem}.wcol{display:grid;gap:10px}.wmid b{font-size:1.9rem}.wsmall{display:grid;grid-template-columns:repeat(auto-fit,minmax(0,1fr));gap:8px}.wsm{padding:10px 4px}.wsm b{font-size:1.15rem;color:var(--ink)}.wsm span{font-size:.6rem}.wic{width:22px;height:22px;fill:none;stroke:var(--ink);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;margin-bottom:4px}.wch{font-style:normal;font-size:.72rem;font-weight:800;margin-top:3px;color:var(--muted)}.wt b small{font-size:.55em;margin-left:2px;opacity:.85}.scancard .wrecv .wch{margin-top:2px}.wadv{margin:0;font-size:.95rem;line-height:1.4;color:var(--ink)}.z-green{color:#16a34a}.z-yellow{color:#ca8a04}.z-red{color:#dc2626}.wgood{color:#16a34a}.wbad{color:#dc2626}.wearup{display:grid;gap:8px;margin-top:8px}.wearup .btn{justify-self:start;cursor:pointer}.devlist{display:flex;flex-wrap:wrap;gap:6px}.devpick{margin-top:8px;display:grid;gap:8px}`;document.head.appendChild(st);
})();
