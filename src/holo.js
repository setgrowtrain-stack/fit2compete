
/* ===== Body view: holographic 3D figure shaded by training volume ===== */
(function(){
const $=id=>document.getElementById(id),e_=s=>esc(s==null?"":String(s));
const T=()=>window.F2C_T;
const UI=(()=>{try{return JSON.parse(localStorage.getItem("f2c-holo")||"{}")}catch(e){return {}}})();
UI.period=UI.period||"week";UI.color=UI.color||"#22d3ee";
window.F2C_holoUI=UI;
const saveUI=()=>{try{localStorage.setItem("f2c-holo",JSON.stringify(UI))}catch(e){}};
const MUSCLES=[["chest","Chest"],["shoulders","Shoulders"],["biceps","Biceps"],["triceps","Triceps"],["forearms","Forearms"],["abs","Abs"],["obliques","Obliques"],
 ["traps","Traps"],["lats","Lats"],["upperback","Upper back"],["lowerback","Lower back"],["glutes","Glutes"],["quads","Quads"],["hamstrings","Hamstrings"],["calves","Calves"]];
// exercise name -> muscles worked (1 = main target, less = helping)
const MAP=[
 [/warm.?up|stretch|foam|mobility|cool.?down|ankle rock|hip switch|90\/90|walkover|activation|breath/,{}],
 [/face pull|rear.?delt|reverse fly|band pull.?apart/,{upperback:1,shoulders:.4}],
 [/lateral raise|side raise|upright row/,{shoulders:1,traps:.3}],
 [/overhead press|shoulder press|military|arnold|\bohp\b|push press|landmine press/,{shoulders:1,triceps:.5}],
 [/shrug/,{traps:1}],
 [/rower|rowing|\berg\b/,{lats:1,upperback:.8,traps:.5,quads:.7,hamstrings:.6,glutes:.6,shoulders:.4,biceps:.3}],
 [/straight.?arm|pullover/,{lats:1}],
 [/row|pulldown|pull.?up|chin.?up|\blat\b/,{lats:1,upperback:.7,biceps:.5,forearms:.2}],
 [/romanian|\brdl\b|good morning|stiff.?leg/,{hamstrings:1,glutes:.6,lowerback:.4}],
 [/deadlift/,{hamstrings:.7,glutes:.7,lowerback:.7,quads:.3,traps:.3,forearms:.3}],
 [/back extension|hyperextension|superman/,{lowerback:1,glutes:.4,hamstrings:.3}],
 [/hip thrust|glute|bridge|kickback|abduct/,{glutes:1,hamstrings:.3}],
 [/leg curl|nordic|hamstring/,{hamstrings:1}],
 [/leg extension/,{quads:1}],
 [/squat|leg press|hack|lunge|step.?up|wall sit|pistol|sled push/,{quads:1,glutes:.6,hamstrings:.2}],
 [/calf|tibialis/,{calves:1}],
 [/hammer/,{biceps:.8,forearms:.7}],
 [/tricep|pushdown|skull|close.?grip|french press|kickback/,{triceps:1}],
 [/curl/,{biceps:1,forearms:.3}],
 [/fly|flye|pec deck|crossover/,{chest:1,shoulders:.2}],
 [/bench|chest press|push.?up|\bdip|incline press|press/,{chest:1,shoulders:.5,triceps:.5}],
 [/pallof|side plank|oblique|russian|woodchop|suitcase/,{obliques:1,abs:.5}],
 [/crunch|sit.?up|plank|dead bug|leg raise|hollow|rollout|\bab\b|abs|core|v.?up|mountain climber/,{abs:1,obliques:.4}],
 [/carry|farmer|dead hang|hang\b|grip/,{forearms:1,traps:.5}],
 [/sprint|stride|run|jump|bound|hop|skip/,{quads:.4,hamstrings:.5,glutes:.4,calves:.5}]
];
function musclesOf(name){const n=String(name||"").toLowerCase();for(const [re,m] of MAP)if(re.test(n))return m;return {}}

/* ---------- training volume per muscle for the chosen period ---------- */
function range(period){const end=new Date();end.setHours(23,59,59,999);const start=new Date();start.setHours(0,0,0,0);
 if(period==="week")start.setDate(start.getDate()-((start.getDay()+6)%7));
 else if(period==="month")start.setDate(start.getDate()-29);
 else if(period==="year")start.setDate(start.getDate()-364);
 return [start,end]}
/* pounds moved in one set: load x reps. Bodyweight moves count the share of body weight the move lifts, plus any added weight. */
const BWF=[[/push.?up/,.64],[/pull.?up|chin.?up|\bdip|muscle.?up/,1],[/inverted row/,.5],[/calf raise/,1],[/pistol|split squat|lunge|step.?up|air squat|squat/,.7]];
function setLoad(name,v,bw,range){const reps=parseFloat(v.reps)||0;if(!reps)return 0;const kind=window.F2C_exKind?F2C_exKind({name}):"load";
 if(kind==="stretch"||kind==="timed")return 0;const add=parseFloat(String(v.wt||"").replace(/[^\d.]/g,""))||0;
 const P=window.F2C_per?F2C_per({name,reps:range||""}):{mult:1};
 if(kind==="bw"){const n=String(name).toLowerCase(),f=(BWF.find(([re])=>re.test(n))||[0,0])[1];return Math.round((bw*f+add)*reps*(P.side?2:1))}
 return Math.round(add*reps*P.mult)}
window.F2C_setLoad=(name,v,range)=>setLoad(name,v,shape().wt,range);
function volume(period){const t=T(),r=t.rec(),L=r.log||{},names={},bw=shape().wt;
 const ranges={};((r.plan||{}).days||[]).forEach(d=>(d.exercises||[]).forEach(x=>{names[t.slug(x.name)]=x.name;ranges[t.slug(x.name)]=x.reps||""}));
 Object.values(r.swaps||{}).forEach(n=>names[t.slug(n)]=n);
 const [a,b]=range(period),vol={},sets={},lbs={};MUSCLES.forEach(([k])=>{vol[k]=0;sets[k]=0;lbs[k]=0});let total=0,lbTotal=0,days=new Set();
 for(const key in L){const p=key.split("|"),v=L[key]||{};if(p.length!==4||!(v.wt||v.reps||v.done))continue;
  const w=+String(p[0]).slice(1),di=t.DAYS7.indexOf(p[1]);if(!w||di<0)continue;
  const d=new Date(t.weekDate(w));d.setDate(d.getDate()+di);if(d<a||d>b)continue;
  const nm=names[p[2]]||p[2].replace(/-/g," "),m=musclesOf(nm),ld=setLoad(nm,v,bw,ranges[p[2]]);lbTotal+=ld;if(!Object.keys(m).length)continue;
  total++;days.add(d.toDateString());for(const k in m){vol[k]+=m[k];if(m[k]>=.5){sets[k]++;lbs[k]+=ld}}}
 const max=Math.max(0,...Object.values(vol));
 return {vol,sets,lbs,lbTotal,max,total,days:days.size}}

/* ---------- body shape from height, weight, sex and the latest InBody ---------- */
function shape(){const t=T(),a=t.rec().a||{},X=window.F2C_X||{},scans=((X.body||{}).scans||[]).filter(s=>s.confirmed);const last=(UI.shapeFrom==="first"&&scans.length>1)?scans[0]:scans[scans.length-1];
 const female=/^f/i.test(a.sex||"");
 let hIn=0;const hs=String(a.height||"");let m=hs.match(/(\d)\s*['’ ]\s*(\d{1,2})/);if(m)hIn=+m[1]*12+ +m[2];else if((m=hs.match(/(\d{3})\s*cm/i)))hIn=+m[1]/2.54;else if((m=hs.match(/^(\d{2})$/)))hIn=+m[1];
 if(!hIn)hIn=female?64:69;
 const wt=+(last&&last.weight)||parseFloat(a.weight)||(female?140:175);
 const bf=+(last&&last.bf)||parseFloat(a.bf)||(female?26:18);
 const smm=+(last&&last.smm)||0;
 const bmi=703*wt/(hIn*hIn);
 const musc=smm?Math.min(1.5,Math.max(.6,(smm/wt)/(female?.38:.45))):1; // muscle mass vs typical for the sex
 return {female,hIn,wt,bf,bmi,musc,scan:last,first:scans[0],latest:scans[scans.length-1],count:scans.length}}

/* ---------- reshape the figure from the scan: muscle per body part, body fat, visceral fat ---------- */
const ARM=["shoulders","biceps","triceps","forearms"],LEG=["quads","hamstrings","calves","glutes"];
function scanVal(sc,key){const d=sc&&sc.details;if(!d||!d.sections)return null;for(const x of d.sections)for(const it of (x.items||[]))if(it.key===key&&typeof it.value==="number")return it.value;return null}
function factors(S){const sc=S.scan,sg=sc&&sc.details&&sc.details.segments&&sc.details.segments.lean,base=1+(S.musc-1)*.5;
 const f=k=>sg&&sg[k]&&sg[k].pct?Math.max(.8,Math.min(1.3,1+(sg[k].pct-100)*.006)):base;
 const bf=+(sc&&sc.bf)||S.bf,vfl=scanVal(sc,"vfl");
 return {la:f("la"),ra:f("ra"),ll:f("ll"),rl:f("rl"),tr:f("tr"),bf,vis:vfl!=null?Math.max(0,vfl-8)*.004:Math.max(0,bf-20)*.0018,real:!!sg}}
function shapeNote(S){const F=factors(S),pc=v=>{const n=Math.round(100*v-100);return (n>=0?"+":"")+n+"%"};
 return F.real?`Muscle size follows the scan's muscle by body part (arms ${pc((F.la+F.ra)/2)}, legs ${pc((F.ll+F.rl)/2)}, trunk ${pc(F.tr)} vs. average) and the outer layer follows body fat${F.vis>0?" and visceral fat":""}.`
  :"The figure's muscle size and body fat follow your scans. Scans that show muscle by body part shape each arm, leg and the trunk."}
function reshape(THREE,A,S){const F=factors(S),P=A.pos.slice(),G=A.head.groups;
 const segOf=(m,x,y)=>ARM.includes(m)?(x>0?"la":"ra"):LEG.includes(m)?(x>0?"ll":"rl"):(m&&m!=="other"&&m!=="skin")?"tr":(Math.abs(x)>.19&&y>.72?(x>0?"la":"ra"):y<.93?(x>0?"ll":"rl"):"tr");
 G.forEach(g=>{if(g.m==="skin")return;let cx=0,cy=0,cz=0;for(let i=g.v0;i<g.v0+g.vn;i++){cx+=P[3*i];cy+=P[3*i+1];cz+=P[3*i+2]}cx/=g.vn;cy/=g.vn;cz/=g.vn;
  const f=F[segOf(g.m,cx,cy)],fy=1+(f-1)*.25;if(Math.abs(f-1)<.003)return;
  for(let i=g.v0;i<g.v0+g.vn;i++){P[3*i]=cx+(P[3*i]-cx)*f;P[3*i+1]=cy+(P[3*i+1]-cy)*fy;P[3*i+2]=cz+(P[3*i+2]-cz)*f}});
 const sk=G.find(g=>g.m==="skin");if(sk){const tmp=new THREE.BufferGeometry();tmp.setAttribute("position",new THREE.BufferAttribute(A.pos,3));tmp.setIndex(new THREE.BufferAttribute(A.idx.subarray(sk.i0,sk.i0+sk.in),1));tmp.computeVertexNormals();const N=tmp.getAttribute("normal").array;
  const fat=(r,y)=>{const b=(F.bf-15)/100;if(b<0)return Math.max(-.004,b*.08*r);const belly=y==null?1:1+.9*Math.exp(-Math.pow((y-1.0)/.12,2))+.4*Math.exp(-Math.pow((y-.82)/.1,2));return b*.2*r*belly};
  for(let i=sk.v0;i<sk.v0+sk.vn;i++){const x=A.pos[3*i],y=A.pos[3*i+1],seg=segOf(null,x,y),leg=seg==="ll"||seg==="rl";
   const ref=seg==="tr"?.11:leg?.065:.035,reg=seg==="tr"?1:leg?.8:.6;
   let d=(F[seg]-1)*ref+fat(reg,y)*(y>1.47?.2:(!leg&&seg!=="tr"&&y<.86)?.15:1);
   const nz=N[3*i+2];if(F.vis>0&&nz>.15&&y>.93&&y<1.22&&Math.abs(x)<.17){const t=Math.exp(-Math.pow((y-1.06)/.08,2))*Math.max(0,1-Math.abs(x)/.17);d+=F.vis*t*nz*6}
   P[3*i]+=N[3*i]*d;P[3*i+1]+=N[3*i+1]*d;P[3*i+2]+=N[3*i+2]*d}
  // no genitals: smooth the front of the groin into a plain surface
  for(let i=sk.v0;i<sk.v0+sk.vn;i++){const x=A.pos[3*i],y=A.pos[3*i+1],z=A.pos[3*i+2],ax=Math.abs(x);if(ax>.056||y<.70||y>.875||z<-.005)continue;
   const w=1-ss(.034,.056,ax),cap=.068*Math.pow(ss(.705,.87,y),.7)+(P[3*i+2]-z);P[3*i+2]=P[3*i+2]*(1-w)+Math.min(P[3*i+2],cap)*w}
  if(S.female){const amp=.04+Math.min(40,F.bf)*.0007; // breasts, sized a little by body fat
   for(let i=sk.v0;i<sk.v0+sk.vn;i++){const x=A.pos[3*i],y=A.pos[3*i+1],nz=N[3*i+2];if(nz<.2||y<1.15||y>1.4)continue;
    const r2=(Math.pow(Math.abs(x)-.095,2)+Math.pow(y-1.275,2))/(.06*.06);if(r2>4)continue;const d=amp*Math.exp(-r2)*nz;P[3*i]+=N[3*i]*d;P[3*i+1]+=N[3*i+1]*d-d*.25;P[3*i+2]+=N[3*i+2]*d}}}
 if(S.female){ // female frame: narrower shoulders and waist, wider hips
  for(let i=0;i<P.length/3;i++){const y=P[3*i+1];let k=1-.1*ss(1.12,1.36,y)-.06*Math.exp(-Math.pow((y-1.04)/.06,2))+.1*Math.exp(-Math.pow((y-.88)/.09,2));
   if(y<.8)k+=.04*ss(.45,.8,y);P[3*i]*=k}}
 return {P,F}}
function noGroin(A,g){const I=A.idx.subarray(g.i0,g.i0+g.in),P=A.pos,out=[];const bad=v=>{const x=Math.abs(P[3*v]),y=P[3*v+1],z=P[3*v+2];return x<.046&&y>.718&&y<.868&&z>-.01};
 for(let i=0;i<I.length;i+=3){if(bad(I[i])||bad(I[i+1])||bad(I[i+2]))continue;out.push(I[i],I[i+1],I[i+2])}return new Uint32Array(out)}
const ss=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};

/* ---------- 3D ---------- */
let R=null; // {renderer, raf, ro}
function dispose(){if(!R)return;cancelAnimationFrame(R.raf);try{R.ro&&R.ro.disconnect();R.controls&&R.controls.dispose();R.renderer.dispose()}catch(e){}R=null}
/* Real surface muscles and skin from BodyParts3D (CC BY 4.0, credited in Terms of Use), baked into vendor/anatomy.bin */
let ANA=null,ORG=null;
async function loadOrgans(){if(ORG)return ORG;const buf=await (await fetch("vendor/organs.bin")).arrayBuffer();const hl=new DataView(buf).getUint32(0,true);
 const head=JSON.parse(new TextDecoder().decode(new Uint8Array(buf,4,hl)));const o=4+hl;ORG={head,pos:new Float32Array(buf,o,head.nv*3),idx:new Uint32Array(buf,o+head.nv*12,head.ni)};return ORG}
const ORGC={heart:0xc0392b,liver:0x7b2d26,gallbladder:0x3f8f3a,stomach:0xe59a9a,spleen:0x6d2e5c,pancreas:0xe8c07a,kidney:0x8e2b2b,esophagus:0xd98b8b,intestine:0xf0a8a0,colon:0xd9a07a,bladder:0xe9d7a0};
const VISC={stomach:1,intestine:1,colon:1,kidney:1,pancreas:1,spleen:.6,liver:.5};
async function loadAnatomy(){if(ANA)return ANA;const buf=await (await fetch("vendor/anatomy.bin")).arrayBuffer();const hl=new DataView(buf).getUint32(0,true);
 const head=JSON.parse(new TextDecoder().decode(new Uint8Array(buf,4,hl)));const o=4+hl;
 ANA={head,pos:new Float32Array(buf,o,head.nv*3),fib:new Float32Array(buf,o+head.nv*12,head.nv),idx:new Uint32Array(buf,o+head.nv*16,head.ni)};return ANA}
const DBG={chest:0,shoulders:.08,biceps:.16,triceps:.24,forearms:.32,abs:.4,obliques:.48,traps:.56,lats:.64,upperback:.72,lowerback:.8,glutes:.88,quads:.12,hamstrings:.52,calves:.92};
const GRID=`float ln(vec2 c){vec2 g=abs(fract(c-.5)-.5)/fwidth(c);return 1.-min(min(g.x,g.y),1.);}
 float gridAt(vec3 P,float dens){vec3 p=P*dens;vec3 an=abs(normalize(cross(dFdx(P),dFdy(P))));return ln(p.yz)*an.x+ln(p.xz)*an.y+ln(p.xy)*an.z;}`;
async function draw(box,V,S){
 dispose();
 let THREE,OC,A;try{THREE=await import("./vendor/three.module.min.js");OC=(await import("./vendor/OrbitControls.js")).OrbitControls;A=await loadAnatomy()}catch(e){box.innerHTML=`<p class="muted small" style="padding:20px">The 3D view couldn't load on this device.</p>`;return}
 if(!box.isConnected)return;
 const w=box.clientWidth||340,h=box.clientHeight||420;
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));renderer.setSize(w,h);box.innerHTML="";box.appendChild(renderer.domElement);
 const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(30,w/h,.1,50);cam.position.set(0,1.0,4.9);
 const controls=new OC(cam,renderer.domElement);controls.target.set(0,.9,0);controls.enablePan=false;controls.minDistance=1.6;controls.maxDistance=8;controls.autoRotate=true;controls.autoRotateSpeed=1.2;
 controls.addEventListener("start",()=>controls.autoRotate=false);
 controls.zoomToCursor=false;controls.enablePan=true;controls.minDistance=.3;controls.screenSpacePanning=true;
 const hue=new THREE.Color(UI.color),hsl={};hue.getHSL(hsl);
 const tint=t=>t?new THREE.Color().setHSL(hsl.h,1,.62-.3*t):new THREE.Color().setHSL(hsl.h,.18,.66);
 const IDX={};MUSCLES.forEach(([m],i)=>IDX[m]=i);
 const mcol=[],mheat=[];MUSCLES.forEach(([m])=>{const t=UI.debug?1:(V.max?V.vol[m]/V.max:0);mcol.push(UI.debug?new THREE.Color().setHSL(DBG[m],.9,.55):tint(t));mheat.push(t)});
 // split the baked file into the muscle layer and the skin
 const G=A.head.groups,skinG=G.find(g=>g.m==="skin");
 const mi=new Float32Array(A.head.nv).fill(-1);G.forEach(g=>{const k=g.m==="other"||g.m==="skin"?-1:IDX[g.m];mi.fill(k,g.v0,g.v0+g.vn)});
 const RS=reshape(THREE,A,S),all=new THREE.BufferAttribute(RS.P,3);
 const musc=new THREE.BufferGeometry();musc.setAttribute("position",all);musc.setAttribute("mi",new THREE.BufferAttribute(mi,1));musc.setAttribute("fb",new THREE.BufferAttribute(A.fib,1));musc.setIndex(new THREE.BufferAttribute(A.idx.subarray(0,skinG.i0),1));musc.computeVertexNormals();
 const skin=new THREE.BufferGeometry();skin.setAttribute("position",all);skin.setIndex(new THREE.BufferAttribute(noGroin(A,skinG),1));skin.computeVertexNormals();
 const U={mc:{value:mcol},mh:{value:mheat},paleC:{value:tint(0)},hueC:{value:hue},latsH:{value:0},absH:{value:0},absI:{value:IDX.abs},latC:{value:mcol[IDX.lats]},absC:{value:mcol[IDX.abs]}};
 const VS=`attribute float mi;varying float vMi;varying vec3 vP;varying vec3 vO;varying vec3 vN;varying vec3 vV;
  void main(){vMi=mi;vP=position;vO=normal;vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`;
 // muscles: lit like a hologram, trained ones in full color (deeper = more sets), untrained pale
 const mMat=new THREE.ShaderMaterial({uniforms:U,transparent:true,side:THREE.FrontSide,vertexShader:VS.replace('attribute float mi;','attribute float mi;attribute float fb;varying float vF;').replace('vMi=mi;','vMi=mi;vF=fb;'),
  fragmentShader:`uniform vec3 mc[15];uniform float mh[15];uniform vec3 paleC;uniform float absI;varying float vMi;varying float vF;varying vec3 vP;varying vec3 vO;varying vec3 vN;varying vec3 vV;
   void main(){int i=int(vMi+.5);float h=vMi<-.5?0.:mh[i];vec3 c=vMi<-.5?paleC:(h>0.?mc[i]:paleC);
    vec3 n=normalize(vN);float lit=.55+.45*max(dot(n,normalize(vec3(.3,.6,1.))),0.);
    if(vMi>-.5){float k=vF*190.+.4*sin(vF*23.+vP.y*41.)+.25*sin(vP.y*97.+vP.z*53.);float w=fwidth(k);float st=1.-smoothstep(.0,.5,abs(fract(k)-.5)*2.-.4);lit*=1.-.17*st*(1.-smoothstep(.35,.9,w));
     if(i==int(absI)){ // six-pack: tendinous lines across, linea alba down the middle, each segment domed
      float ax=abs(vP.x),yy=vP.y;float ys[5];ys[0]=.96;ys[1]=1.035;ys[2]=1.105;ys[3]=1.175;ys[4]=1.255;
      float sh=1.;for(int r=0;r<4;r++){if(yy>=ys[r]&&yy<ys[r+1]){float u=(ax-.04)/.034,v=(yy-(ys[r]+ys[r+1])*.5)/((ys[r+1]-ys[r])*.5);
        float e=max(abs(u),abs(v));sh=1.-.42*smoothstep(.5,1.02,e)+.16*(-v)*(1.-smoothstep(.6,1.,e))+.1*(-u);}}
      float g=0.;for(int r=1;r<4;r++){float dd=abs(yy-ys[r])/max(fwidth(yy),1e-5);g=max(g,1.-smoothstep(.8,2.6,dd));}
      float lb=1.-smoothstep(1.,2.6,ax/max(fwidth(vP.x),1e-5)-1.2);lit*=sh*(1.-.36*max(g,lb));}}float fr=pow(1.-abs(dot(n,normalize(vV))),2.5);
    float a=h>0.?.96:.85;gl_FragColor=vec4(c*lit+fr*.35*(h>0.?c:vec3(.8)),a);}`});
 // skin: faint glowing grid shell; lats and abs (not in the muscle set) are drawn on it
 const sMat=new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,side:THREE.DoubleSide,vertexShader:VS,
  fragmentShader:`uniform vec3 hueC;uniform vec3 paleC;uniform float latsH;uniform float absH;uniform vec3 latC;uniform vec3 absC;varying vec3 vP;varying vec3 vO;varying vec3 vN;varying vec3 vV;
   ${GRID}
   float box(vec2 p,vec2 lo,vec2 hi,float r){vec2 c=(lo+hi)*.5,hh=(hi-lo)*.5-r;vec2 d=abs(p-c)-hh;return length(max(d,0.))+min(max(d.x,d.y),0.)-r;}
   void main(){float g=gridAt(vP,34.);float fr=pow(1.-abs(dot(normalize(vN),normalize(vV))),2.);
    vec3 c=hueC;float a=g*.16+fr*.3;
    float x=abs(vP.x),y=vP.y;vec3 n=normalize(vO);
    float d=1.;vec3 mcol=paleC;float mh=0.;
    if(d<0.){float rim=1.-smoothstep(0.,fwidth(d)*1.5+.0015,-d-.002);
     float sh=.75+.25*smoothstep(0.,.02,-d);if(mh>0.){c=mcol*sh;a=max(a,.6+.35*mh);}else{c=paleC*sh;a=max(a,.35);}a=max(a,rim*.5);}
    if(!gl_FrontFacing)a*=.3;
    gl_FragColor=vec4(c*(1.+.3*fr),clamp(a,0.,1.));}`});
 const fig=new THREE.Group();const mMesh=new THREE.Mesh(musc,mMat);mMesh.renderOrder=1;const sMesh=new THREE.Mesh(skin,sMat);sMesh.renderOrder=2;fig.add(mMesh,sMesh);
 { // smooth patch over the groin (the model's genitals are removed)
  const F=RS.F,bb=(F.bf-15)/100,d=(bb<0?Math.max(-.004,bb*.08):bb*.2*1.15)+(F.tr-1)*.11,nx=14,ny=18,pos=[],ind=[];
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const x=-.048+.096*i/nx,y=.716+.154*j/ny,ax=Math.abs(x),c=.068*Math.pow(ss(.705,.87,y),.7);
   const z=c*(1-.25*Math.pow(ax/.048,2))+d*ss(.72,.8,y);pos.push(x,y,z)}
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,e=c+1;ind.push(a,b,c,b,e,c)}
  const pg=new THREE.BufferGeometry();pg.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));pg.setIndex(ind);pg.computeVertexNormals();
  const pm=new THREE.Mesh(pg,sMesh.material);pm.renderOrder=2;fig.add(pm);fig.userData.patch=pm}
 fig.scale.setScalar(S.hIn*.0254/1.72);scene.add(fig);
 const LAY=UI.layer||"muscle";
 if(LAY==="fat"){ // yellow fat under the skin over the muscles
  const bf=+(S.scan&&S.scan.bf)||S.bf||20,fa=Math.min(.9,.2+bf*.022);
  sMesh.material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.FrontSide,uniforms:{a:{value:fa}},vertexShader:VS,
   fragmentShader:`uniform float a;varying vec3 vP;varying vec3 vN;varying vec3 vV;void main(){vec3 n=normalize(vN);float fr=pow(1.-abs(dot(n,normalize(vV))),1.6);
    float lit=.6+.4*max(dot(n,normalize(vec3(.3,.6,1.))),0.);float b=.5+.5*sin(vP.y*260.+sin(vP.x*180.)*2.);vec3 c=mix(vec3(.98,.8,.28),vec3(1.,.9,.5),b*.35)*lit;
    gl_FragColor=vec4(c+fr*.25,clamp(a+fr*.25,0.,.95));}`});fig.userData.patch&&(fig.userData.patch.material=sMesh.material);}
 if(LAY==="organs"){mMesh.visible=false;
  try{const O=await loadOrgans();const P=new THREE.BufferAttribute(O.pos,3);
   const vfl=scanVal(S.scan,"vfl"),lv=vfl!=null?vfl:Math.max(1,Math.round(((+(S.scan&&S.scan.bf)||S.bf||20)-10)/1.5));
   O.head.groups.forEach(g=>{const geo=new THREE.BufferGeometry();geo.setAttribute("position",P);geo.setIndex(new THREE.BufferAttribute(O.idx.subarray(g.i0,g.i0+g.in),1));geo.computeVertexNormals();
    const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({color:ORGC[g.m]||0xcc8888,emissive:ORGC[g.m]||0xcc8888,emissiveIntensity:.35}));m.renderOrder=0;fig.add(m);
    const w=VISC[g.m];if(w&&lv>0){ // visceral fat: a yellow layer wrapped around the belly organs, thicker with a higher level
     const n=geo.attributes.normal,src=O.pos,d=(.0015+lv*.0013)*w,arr=new Float32Array(g.vn*3);
     const ix=O.idx.subarray(g.i0,g.i0+g.in),map=new Map();let k=0;const nI=new Uint32Array(ix.length);
     for(let i=0;i<ix.length;i++){const v=ix[i];let j=map.get(v);if(j==null){j=k++;map.set(v,j);arr[j*3]=src[v*3]+n.getX(v)*d;arr[j*3+1]=src[v*3+1]+n.getY(v)*d;arr[j*3+2]=src[v*3+2]+n.getZ(v)*d}nI[i]=j}
     const fg=new THREE.BufferGeometry();fg.setAttribute("position",new THREE.BufferAttribute(arr.subarray(0,k*3),3));fg.setIndex(new THREE.BufferAttribute(nI,1));fg.computeVertexNormals();
     const fm=new THREE.Mesh(fg,new THREE.MeshLambertMaterial({color:0xf6c945,emissive:0xf6c945,emissiveIntensity:.4,transparent:true,opacity:Math.min(.85,.25+lv*.04),depthWrite:false}));fm.renderOrder=1;fig.add(fm)}});
   scene.add(new THREE.AmbientLight(0xffffff,.9));const dl=new THREE.DirectionalLight(0xffffff,1.2);dl.position.set(1,2,3);scene.add(dl);
  }catch(e){console.warn("[F2C] organs",e)}}
 const ringMat=o=>new THREE.MeshBasicMaterial({color:hue,transparent:true,opacity:o,side:THREE.DoubleSide});
 const ring=new THREE.Mesh(new THREE.RingGeometry(.3,.315,64),ringMat(.55));ring.rotation.x=-Math.PI/2;ring.position.y=.002;scene.add(ring);
 const ring2=new THREE.Mesh(new THREE.RingGeometry(.42,.425,64),ringMat(.22));ring2.rotation.x=-Math.PI/2;scene.add(ring2);
 const ro=new ResizeObserver(()=>{const W=box.clientWidth,Hh=box.clientHeight;if(!W||!Hh)return;renderer.setSize(W,Hh);cam.aspect=W/Hh;cam.updateProjectionMatrix()});ro.observe(box);
 R={renderer,controls,ro,raf:0};window.F2C_holoR=R;
 { // double-tap a spot to zoom in on it; double-tap empty space to reset
  const ray=new THREE.Raycaster();let lastT=0,lx=0,ly=0;const home={p:cam.position.clone(),t:controls.target.clone()};let anim=null;
  const fly=(tp,cp)=>{const t0=controls.target.clone(),c0=cam.position.clone(),st=performance.now();anim=()=>{const k=Math.min(1,(performance.now()-st)/450),e=k*(2-k);controls.target.lerpVectors(t0,tp,e);cam.position.lerpVectors(c0,cp,e);if(k>=1)anim=null}};
  renderer.domElement.addEventListener("pointerup",e=>{const now=performance.now();const dbl=now-lastT<320&&Math.hypot(e.clientX-lx,e.clientY-ly)<30;lastT=now;lx=e.clientX;ly=e.clientY;if(!dbl||UI.view==="map")return;lastT=0;
   const r=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),cam);
   const h=ray.intersectObject(sMesh,false)[0];controls.autoRotate=false;
   if(!h){fly(home.t,home.p);return}const dir=cam.position.clone().sub(controls.target).normalize();fly(h.point.clone(),h.point.clone().add(dir.multiplyScalar(.75)))});
  // pinch or scroll: first slide the spot under your fingers to the center, then zoom into it
  const pts=new Map();let wheelT=0;
  const aimAt=(cx,cy)=>{const r=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((cx-r.left)/r.width*2-1,-(cy-r.top)/r.height*2+1),cam);
   const h=ray.intersectObject(sMesh,false)[0];if(!h)return;controls.autoRotate=false;const d=h.point.clone().sub(controls.target);fly(h.point.clone(),cam.position.clone().add(d))};
  renderer.domElement.addEventListener("pointerdown",e=>{pts.set(e.pointerId,[e.clientX,e.clientY]);if(pts.size===2){const [a,b]=[...pts.values()];aimAt((a[0]+b[0])/2,(a[1]+b[1])/2)}},true);
  const up=e=>pts.delete(e.pointerId);renderer.domElement.addEventListener("pointerup",up,true);renderer.domElement.addEventListener("pointercancel",up,true);
  renderer.domElement.addEventListener("wheel",e=>{const n=performance.now();if(n-wheelT>500)aimAt(e.clientX,e.clientY);wheelT=n},{capture:true,passive:true});
  const rb=document.createElement("button");rb.type="button";rb.className="btn small holoreset";rb.textContent="Reset view";rb.onclick=()=>{controls.autoRotate=false;fly(home.t,home.p)};box.appendChild(rb);
  R.anim=()=>anim&&anim()}
 if(UI.view==="pain"){controls.autoRotate=false;ring.visible=ring2.visible=false;
  window.F2C_painScene&&window.F2C_painScene({THREE,scene,cam,fig,renderer,controls,mMesh,sMesh,mi,MUSCLES,box})}
 if(UI.view==="map"){ // front and back side by side, no rotation
  controls.enabled=false;controls.autoRotate=false;ring.visible=ring2.visible=false;
  const oc=new THREE.OrthographicCamera(-1,1,1,-1,.1,20),s=S.hIn*.0254/1.72,Hm=1.72*s;
  const tick2=()=>{if(!box.isConnected){dispose();return}const W=box.clientWidth,Hh=box.clientHeight,half=W/2,aspect=half/Hh;
   let hw=.4*s,hh=Hm/2*1.04;if(hw/hh<aspect)hw=hh*aspect;else hh=hw/aspect;
   oc.left=-hw;oc.right=hw;oc.top=Hm/2+hh;oc.bottom=Hm/2-hh;oc.updateProjectionMatrix();
   renderer.setScissorTest(true);
   [[0,0],[half,Math.PI]].forEach(([x,ry])=>{fig.rotation.y=ry;oc.position.set(0,0,6);oc.lookAt(0,0,0);renderer.setViewport(x,0,half,Hh);renderer.setScissor(x,0,half,Hh);renderer.render(scene,oc)});
   renderer.setScissorTest(false);R.raf=requestAnimationFrame(tick2)};tick2();return}
 const tick=()=>{if(!box.isConnected){dispose();return}R.anim&&R.anim();controls.update();ring.rotation.z+=.004;renderer.render(scene,cam);R.raf=requestAnimationFrame(tick)};tick();
}

/* ---------- panel ---------- */
function layerNote(S){const sc=S.scan,bf=+(sc&&sc.bf)||S.bf,vfl=scanVal(sc,"vfl");
 if(UI.layer==="fat")return `Yellow is the fat under your skin, drawn from ${sc?"your scan's":"your profile's"} ${Math.round(bf*10)/10}% body fat. The thicker and more solid the yellow, the more fat. As body fat drops, it thins and the muscle shows through.`;
 return `Visceral fat is the fat packed around your organs, the kind linked to heart disease and diabetes. ${vfl!=null?`Your InBody visceral fat level is <b>${vfl}</b>. InBody counts under 10 as healthy; the yellow layer around your stomach, intestines and kidneys grows with the level.`:`No visceral fat level on your scans yet, so the yellow layer is estimated from body fat. An InBody scan gives a real level.`} Organs are a standard model, not your own; only the fat layer changes with your numbers.`}
const LBL={day:"Today",week:"This week",month:"30 days",year:"12 months"};
function panel(){const v=$("v-body");if(!v||!T()||!athletes[cur])return;let host=$("holoWrap");
 if(!host){host=document.createElement("div");host.id="holoWrap";v.insertBefore(host,v.firstChild)}
 const V=volume(UI.period),S=shape();
 const lb=n=>Math.round(n).toLocaleString("en-US");const ranked=MUSCLES.map(([k,l])=>({k,l,v:V.vol[k],n:V.sets[k],w:V.lbs[k]})).filter(x=>x.v>0).sort((a,b)=>b.v-a.v);
 const sc=S.scan,fs=S.first;
 host.innerHTML=`<div class="sheet holo"><div class="sheethead"><div><span class="label">Your body</span><h3>Training map</h3></div>
  <span class="seg holoview">${[["3d","3D"],["map","Front & back"],["pain","Pain"]].map(([k,l])=>`<button type="button" data-hv="${k}" aria-pressed="${(UI.view||"3d")===k}">${l}</button>`).join("")}</span><label class="holocol" title="Pick the color">Color <input type="color" id="holoColor" value="${e_(UI.color)}"></label></div>
  <div class="seg holoseg hololayer">${[["muscle","Muscles"],["fat","Body fat"],["organs","Organs + visceral fat"]].map(([k,l])=>`<button type="button" data-hl="${k}" aria-pressed="${(UI.layer||"muscle")===k}">${l}</button>`).join("")}</div>
  <div class="seg holoseg">${["day","week","month","year"].map(p=>`<button type="button" data-hp="${p}" aria-pressed="${p===UI.period}">${p==="day"?"Day":p[0].toUpperCase()+p.slice(1)}</button>`).join("")}</div>
  <div class="holostage" id="holoStage" style="--hc:${e_(UI.color)}"><p class="muted small" style="padding:20px">Loading 3D…</p></div>
  ${(UI.layer||"muscle")!=="muscle"?`<p class="small holoLayerNote">${layerNote(S)}</p>`:""}<p class="muted small holohint">${UI.view==="pain"?"Pinch over a spot and it slides to the center and zooms into it, or double-tap a spot to jump to it. Drag to turn, two fingers to slide. Tap the exact spot that hurts. ":UI.view==="map"?"Front on the left, back on the right. ":"Drag to turn. Pinch over a spot and it slides to the center and zooms into it, or double-tap a spot to jump to it (double-tap empty space to reset). Two fingers to slide. "}${UI.period==="day"?"Lit muscles are the ones you trained today.":"Darker shade = more sets for that muscle."}</p>
  ${UI.view==="pain"?`<div id="painBox"></div>`:""}${UI.view!=="pain"&&V.total?`<div class="holobars">${ranked.slice(0,8).map(x=>`<div class="v2tot"><span>${e_(x.l)}</span><div class="v2meter"><i style="width:${Math.round(100*x.v/V.max)}%;background:${e_(UI.color)}"></i></div><b>${Math.max(1,Math.round(x.v))} set${Math.max(1,Math.round(x.v))===1?"":"s"}${x.w?`<small class="holoLb">${lb(x.w)} lb</small>`:""}</b></div>`).join("")}</div>
   <div class="holoTotal"><span class="label">${LBL[UI.period]}</span><b>${lb(V.lbTotal)} lb</b><span class="muted small">total ${F2C_term("lifted","weight lifted")} · ${V.total} sets on ${V.days} day${V.days===1?"":"s"}</span></div>
   <p class="muted small">Weight lifted = weight × reps for every set, added up. Dumbbell moves count both hands, and one-arm or one-leg moves count both sides. Bodyweight moves count the part of your body weight they lift (about 64% for push-ups, all of it for pull-ups and dips) plus any added weight. A muscle's pounds include every set that works it, so the muscle numbers overlap and add up to more than the total.</p>`:UI.view==="pain"?"":`<p class="muted small">No sets logged ${UI.period==="day"?"today":"in "+LBL[UI.period].toLowerCase()} yet. Log sets in Workouts and the muscles light up here.</p>`}
  ${S.count>1?`<div class="seg holoseg">${[["latest","Now"],["first","First scan"]].map(([k,l])=>`<button type="button" data-hs="${k}" aria-pressed="${(UI.shapeFrom||"latest")===k}">${l}${k==="first"?" ("+e_(fs.date)+")":""}</button>`).join("")}</div>`:""}
  <p class="muted small">Shape from ${sc?`your InBody on ${e_(sc.date)} (${e_(sc.weight)} lb, ${e_(sc.bf)}% body fat${sc.smm?", "+e_(sc.smm)+" lb muscle":""})`:`your profile (${Math.round(S.wt)} lb). Add an InBody scan below to shape it from your real numbers`}.${fs&&sc&&fs!==sc?` Since ${e_(fs.date)}: ${(sc.weight-fs.weight>0?"+":"")+Math.round((sc.weight-fs.weight)*10)/10} lb, muscle ${(sc.smm-fs.smm>0?"+":"")+Math.round((sc.smm-fs.smm)*10)/10} lb.`:""} Muscle colors come from your logged sets. ${shapeNote(S)}</p></div>`;
 host.querySelectorAll("[data-hp]").forEach(b=>b.onclick=()=>{UI.period=b.dataset.hp;saveUI();panel()});
 host.querySelectorAll("[data-hs]").forEach(b=>b.onclick=()=>{UI.shapeFrom=b.dataset.hs;saveUI();panel()});
 host.querySelectorAll("[data-hl]").forEach(b=>b.onclick=()=>{UI.layer=b.dataset.hl;saveUI();panel()});
 host.querySelectorAll("[data-hv]").forEach(b=>b.onclick=()=>{UI.view=b.dataset.hv;saveUI();panel()});
 $("holoColor").oninput=e=>{UI.color=e.target.value;saveUI();clearTimeout(panel._t);panel._t=setTimeout(panel,250)};
 draw($("holoStage"),V,S);window.F2C_painPanel&&UI.view==="pain"&&F2C_painPanel()}
window.F2C_holoPanel=()=>panel();
const _rb=window.F2C_rBody;window.F2C_rBody=function(){const r=_rb&&_rb.apply(this,arguments);try{panel()}catch(e){console.warn("[F2C] body view",e)}return r};
const st=document.createElement("style");st.textContent=`.holo{display:grid;gap:10px}.holoreset{position:absolute;right:8px;bottom:8px;z-index:2}.holostage.full{position:fixed;inset:0;z-index:9999;height:100vh!important;border-radius:0}.holostage{position:relative;height:min(62vh,460px);border-radius:14px;overflow:hidden;touch-action:none;
 background:radial-gradient(ellipse at 50% 40%,color-mix(in srgb,var(--hc) 22%,#0b1220) 0%,#060a14 70%)}
.holostage canvas{display:block;width:100%!important;height:100%!important}.holocol{display:flex;align-items:center;gap:6px;font-weight:700;font-size:.82rem}.holocol input{width:36px;height:30px;border:0;background:none;padding:0}
.holoseg{justify-self:start}.holoview button{padding:6px 10px}.sheethead .holoview{margin-left:auto;margin-right:8px}.holobars{display:grid;gap:6px}.holobars .v2tot b{display:flex;flex-direction:column;align-items:flex-end;line-height:1.15;min-width:84px}.holoLb{font-weight:500;font-size:12px;opacity:.7}.holoTotal{display:grid;gap:2px;padding:10px 12px;border-radius:12px;background:var(--bg2,#f1f5f9)}.holoTotal b{font-size:26px;line-height:1.1}.pertag{font-size:12px;font-weight:600;padding:2px 8px;border-radius:999px;background:var(--bg2,#eef2f7);color:var(--ink2,#334155)}`;document.head.appendChild(st);
})();
