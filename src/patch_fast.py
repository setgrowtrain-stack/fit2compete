# Fast start (v2.6): show the phone's saved copy right away, then refresh it from the server in the background.
# Exec'd from patch_index.py after patch_extra.py, so rep() and s are in scope.

# Fonts no longer block the first paint (text shows in the system font for a moment, then swaps).
rep('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Lato:wght@400;700;900&family=JetBrains+Mono:wght@500&display=swap">',
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Lato:wght@400;700;900&family=JetBrains+Mono:wght@500&display=swap" media="print" onload="this.media=\'all\'">')

# A fresh sign-in never uses the saved copy (it may belong to someone else on this device).
rep('TOKEN=r.token;setTokenStore(TOKEN);await enter()}', 'TOKEN=r.token;setTokenStore(TOKEN);await enter(true)}')

rep('''async function enter(){
 $("login").hidden=true;setSave("Loading…");
 const r=await gs("listAthletes",TOKEN);''', '''async function enter(fromLogin){
 $("login").hidden=true;
 let fast=false,before="";
 if(!fromLogin&&!ME&&document.readyState==="loading")await new Promise(res=>document.addEventListener("DOMContentLoaded",res,{once:true}));  // the rest of the app's code must be loaded first
 if(!fromLogin&&!ME){try{const u=JSON.parse(localStorage.getItem("f2c-me")||"null");
  if(u&&u.email){LS="f2c-athletes-"+u.email;loadLocal();const ks=Object.keys(athletes).filter(k=>athletes[k]&&(athletes[k].a&&athletes[k].a.name||athletes[k].plan));
   if(ks.length){ME=u;$("whoName").innerHTML=esc(ME.name||ME.email)+(ME.role==="admin"?' <span class="adminTag">COACH</span>':"");$("who").hidden=false;
    const mine=ks.filter(k=>!athletes[k].owner||athletes[k].owner===ME.email),pool=mine.length?mine:ks;
    cur=pool.sort((x,y)=>(athletes[y].updated||0)-(athletes[x].updated||0))[0];
    $("app").hidden=false;resume();fast=true;before=JSON.stringify(athletes)}else{athletes={};LS="f2c-athletes"}}}catch(e){fast=false}}
 setSave(fast?"Syncing…":"Loading…");
 let r;
 try{r=await gs("listAthletes",TOKEN)}
 catch(e){if(!fast||e.code==="signed_out")throw e;setSave("Offline · showing your saved copy");setTimeout(()=>{if(TOKEN)enter().catch(()=>{})},30000);return}''')

rep(' cur=pool.sort((x,y)=>(athletes[y].updated||0)-(athletes[x].updated||0))[0];\n if(!athletes[cur].a.name',
    ' if(!(fast&&athletes[cur]))cur=pool.sort((x,y)=>(athletes[y].updated||0)-(athletes[x].updated||0))[0];\n if(!athletes[cur].a.name')

rep(' saveLocal();$("app").hidden=false;setSave("Saved");resume();loadPhotos(cur);',
    ' saveLocal();try{localStorage.setItem("f2c-me",JSON.stringify(ME))}catch(e){}\n'
    ' $("app").hidden=false;setSave("Saved");if(!fast||JSON.stringify(athletes)!==before)resume();loadPhotos(cur);')

# Sign out clears the saved copies too.
rep('try{await gs("signOut",t)}catch(e){} try{localStorage.removeItem(LS)}catch(e){}',
    'try{await gs("signOut",t)}catch(e){} try{localStorage.removeItem(LS);localStorage.removeItem("f2c-me");Object.keys(localStorage).filter(k=>k.startsWith("f2c-x-")).forEach(k=>localStorage.removeItem(k))}catch(e){} ME=null;')

# Updating to a new version: refresh the phone's copy first, so the reload actually gets the new page (the service worker opens from that copy).
rep('''   location.reload();return true}}catch(e){}return false}''',
    '''   try{const last=+sessionStorage.getItem("f2c-upd")||0;if(Date.now()-last<60000){bar.hidden=true;return false}sessionStorage.setItem("f2c-upd",String(Date.now()))}catch(e){}
   try{if(window.caches){const root=new URL("./",location.href).href,fresh=await fetch(root,{cache:"no-store"});if(fresh.ok){for(const k of await caches.keys())if(k.startsWith("f2c-shell"))await (await caches.open(k)).put(root,fresh.clone())}}}catch(e){}
   location.reload();return true}}catch(e){}return false}''')

# Check for a newer version shortly after opening (the saved copy may be one version behind).
rep(' tryEnter();\n})();', ' tryEnter();\n setTimeout(()=>{if(!BUSY)appOutdated()},2500);\n})();')

# v2.7: library exercises show their photo on the exercise card (tap for photos and steps).
rep('return `<article class="excard"><div class="exhead"><div><h4>${e_(ex.name)}</h4>',
    'return `<article class="excard"><div class="exhead">${window.F2C_libThumb?F2C_libThumb(ex):""}<div><h4>${e_(ex.name)}</h4>')

# v2.7.1: boot screen with a running figure. Shown at every open until the app or sign-in is on screen.
# Before showing anything, a phone that opened from its saved copy checks version.json (1.5 s cap). If a newer
# version is live, it refreshes the saved copy and reloads behind the boot screen, so the old look never shows.
SPLASH = r'''<div id="bootSplash" role="status" aria-live="polite"><div class="bsbox">
<svg viewBox="0 0 64 64" class="bsrun" aria-hidden="true"><g class="bsbody"><circle cx="35" cy="10" r="5"/><path d="M34 16L30 33"/>
<g class="bsa1"><path d="M33 19L26 26L21 23"/></g><g class="bsa2"><path d="M33 19L40 25L45 21"/></g>
<g class="bsl1"><path d="M30 33L23 43L17 45"/></g><g class="bsl2"><path d="M30 33L36 44L33 53"/></g></g>
<path class="bsground" d="M2 58H62"/></svg>
<b>FIT 2 COMPETE</b><span id="bootMsg">Loading…</span></div></div>
<style>#bootSplash{position:fixed;inset:0;z-index:100000;background:#060a14;display:flex;align-items:center;justify-content:center;transition:opacity .25s}
#bootSplash.gone{opacity:0;pointer-events:none}#bootSplash{color:#e8edf2}.bsbox{display:flex;flex-direction:column;align-items:center;gap:10px;color:inherit;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
.bsbox b{letter-spacing:.22em;font-size:.9rem}.bsbox span{font-size:.85rem;color:#8a96a2;min-height:1.2em}
.bsrun{width:96px;height:96px;fill:none;stroke:var(--bs,#22d3ee);stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round}.bsrun circle{fill:var(--bs,#22d3ee);stroke:none}
.bsbody{animation:bsbob .32s ease-in-out infinite alternate}.bsa1,.bsa2{transform-origin:33px 19px}.bsl1,.bsl2{transform-origin:30px 33px}
.bsa1,.bsl2{animation:bssw .64s ease-in-out infinite alternate}.bsa2,.bsl1{animation:bssw .64s ease-in-out infinite alternate-reverse}
.bsground{stroke:currentColor;opacity:.35;stroke-width:2;stroke-dasharray:6 6;animation:bsgr .5s linear infinite}
@keyframes bssw{from{transform:rotate(-38deg)}to{transform:rotate(38deg)}}@keyframes bsbob{from{transform:translateY(0)}to{transform:translateY(-2px)}}@keyframes bsgr{to{stroke-dashoffset:12}}
@media (prefers-reduced-motion:reduce){.bsbody,.bsa1,.bsa2,.bsl1,.bsl2,.bsground{animation:none}}</style>
<script>/* Looks (themes). Single source: setup.js builds the Appearance picker from this table. */
window.F2C_THEMES={
 light:{g:"l",l:"Red",n:"The original",dark:0,bg:"#f3f4f7",card:"#ffffff",acc:"#E42626"},
 cyanl:{g:"l",l:"Cyan",n:"White and cyan",dark:0,bg:"#eefbfd",card:"#ffffff",line:"#cdeef4",ink:"#0f172a",mut:"#4b6470",acc:"#0891b2",ai:"#ffffff",soft:"#cffafe",h1:"#155e75",h2:"#0891b2",link:"#0e7490"},
 goldl:{g:"l",l:"Gold",n:"White and gold",dark:0,bg:"#fdf9ee",card:"#ffffff",line:"#efe3c4",ink:"#1c1917",mut:"#6b6152",acc:"#ca8a04",ai:"#1a1300",soft:"#fef3c7",h1:"#854d0e",h2:"#b7791f",link:"#a16207"},
 forestl:{g:"l",l:"Forest",n:"White and green",dark:0,bg:"#eff9f4",card:"#ffffff",line:"#cfe9dc",ink:"#0f1f17",mut:"#4f6a5c",acc:"#059669",ai:"#ffffff",soft:"#d1fae5",h1:"#065f46",h2:"#059669",link:"#047857"},
 emberl:{g:"l",l:"Ember",n:"White and orange",dark:0,bg:"#fff6f0",card:"#ffffff",line:"#f6dcc9",ink:"#1f140d",mut:"#6e5a4d",acc:"#ea580c",ai:"#ffffff",soft:"#ffedd5",h1:"#9a3412",h2:"#ea580c",link:"#c2410c"},
 royall:{g:"l",l:"Royal",n:"White and violet",dark:0,bg:"#f6f3ff",card:"#ffffff",line:"#e1d8fb",ink:"#1a1433",mut:"#5f5880",acc:"#7c3aed",ai:"#ffffff",soft:"#ede9fe",h1:"#5b21b6",h2:"#7c3aed",link:"#6d28d9"},
 arctic:{g:"l",l:"Arctic",n:"White and blue",dark:0,bg:"#eef4fa",card:"#ffffff",line:"#d5e1ee",ink:"#0f172a",mut:"#52627a",acc:"#2563eb",ai:"#ffffff",soft:"#dbeafe",h1:"#1d4ed8",h2:"#3b82f6",link:"#1d4ed8"},
 cyan:{g:"d",l:"Dark mode",n:"Navy and cyan",dark:1,bg:"#0e1729",card:"#17223a",line:"#24324d",ink:"#e8edf2",mut:"#94a3b8",acc:"#22d3ee",ai:"#04121a",soft:"#0f3340",h1:"#155e75",h2:"#0891b2",link:"#67e8f9"},
 gold:{g:"d",l:"Black & gold",n:"Charcoal and gold",dark:1,bg:"#161618",card:"#212124",line:"#323237",ink:"#f2f2f2",mut:"#a3a3ad",acc:"#f5b301",ai:"#1a1300",soft:"#33290c",h1:"#854d0e",h2:"#b7791f",link:"#fcd34d"},
 forest:{g:"d",l:"Forest",n:"Deep green and mint",dark:1,bg:"#0d1e15",card:"#162b20",line:"#22402f",ink:"#e6f2ec",mut:"#98b1a3",acc:"#34d399",ai:"#03140c",soft:"#123826",h1:"#065f46",h2:"#059669",link:"#6ee7b7"},
 ember:{g:"d",l:"Ember",n:"Charcoal and orange",dark:1,bg:"#1c130e",card:"#291c14",line:"#3d2a1e",ink:"#f5ece6",mut:"#b2a094",acc:"#ff7a1a",ai:"#1c0b00",soft:"#3d200e",h1:"#9a3412",h2:"#ea580c",link:"#fdba74"},
 royal:{g:"d",l:"Royal",n:"Deep purple and violet",dark:1,bg:"#161034",card:"#211946",line:"#33295f",ink:"#ece8fb",mut:"#aca5cc",acc:"#a78bfa",ai:"#12082b",soft:"#2c2160",h1:"#5b21b6",h2:"#7c3aed",link:"#c4b5fd"},
 dark:{g:"d",l:"Navy & red",n:"Navy with red",dark:1,bg:"#0e1729",card:"#17223a",line:"#24324d",ink:"#e6edf6",mut:"#9aa8bb",acc:"#E42626",ai:"#ffffff",soft:"#3a1418",h1:"#991b1b",h2:"#dc2626",link:"#7fb6ff"}};
window.F2C_applyTheme=function(t){var T=window.F2C_THEMES,h=document.documentElement;if(!T[t])t="light";var x=T[t];
 h.classList.toggle("dark",!!x.dark);h.classList.toggle("tint",!!x.h1);h.classList.toggle("cyan",t==="cyan");h.setAttribute("data-look",t);
 var V={"--bg":x.bg,"--card":x.card,"--line":x.line,"--ink":x.ink,"--muted":x.mut,"--head":x.ink,"--accent":x.acc,"--accent-ink":x.ai,"--accent-soft":x.soft,"--hero-a":x.h1,"--hero-b":x.h2,"--link":x.link};
 for(var k in V){if(x.h1&&V[k])h.style.setProperty(k,V[k]);else h.style.removeProperty(k)}
 var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",x.dark?x.bg:"#ffffff");
 var sp=document.getElementById("bootSplash");if(sp){sp.style.background=x.bg;sp.style.color=x.dark?"#e8edf2":(x.ink||"#141a2b");sp.style.setProperty("--bs",x.h1?x.acc:(x.dark?"#22d3ee":x.acc))}return t};
try{var _t=localStorage.getItem("f2c-theme");if(_t)window.F2C_applyTheme(_t)}catch(e){}</script>
<script>(function(){var t0=Date.now(),checked=false;
 function el(){return document.getElementById("bootSplash")}
 function ready(){var a=document.getElementById("app"),l=document.getElementById("login");return !!((a&&!a.hidden)||(l&&!l.hidden))}
 function hide(){var s=el();if(!s||s.classList.contains("gone"))return;s.classList.add("gone");setTimeout(function(){var x=el();if(x&&x.classList.contains("gone"))x.remove()},350)}
 function tick(){if((checked&&ready())||Date.now()-t0>20000){hide();return}setTimeout(tick,50)}
 window.F2C_freshShell=function(){if(!window.caches)return Promise.resolve();var root=new URL("./",location.href).href;
  return fetch(root,{cache:"no-store"}).then(function(fresh){if(!fresh.ok)return;return caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k.indexOf("f2c-shell")===0}).map(function(k){return caches.open(k).then(function(c){return c.put(root,fresh.clone())})}))})}).catch(function(){})};
 window.F2C_updateNow=function(){var sw=new Promise(function(res){var n=navigator.serviceWorker;if(!n||!n.controller)return res();var done=false;function fin(){if(!done){done=true;res()}}
   n.addEventListener("controllerchange",fin,{once:true});n.getRegistration().then(function(r){if(r)return r.update().then(function(){if(!r.installing&&!r.waiting)fin()})}).catch(fin);setTimeout(fin,4000)});
  return Promise.all([sw,window.F2C_freshShell()]).then(function(){return window.F2C_freshShell()})};
 window.F2C_splash=function(text){var s=el();if(!s){document.body.insertAdjacentHTML("afterbegin",'<div id="bootSplash" role="status" aria-live="polite"><div class="bsbox">'+document.querySelector("#bsTpl").innerHTML+'</div></div>');s=el()}
  s.classList.remove("gone");var m=document.getElementById("bootMsg");if(m)m.textContent=text||"Loading…"};
 var sw=navigator.serviceWorker&&navigator.serviceWorker.controller;
 if(!sw){checked=true}else{var done=false,to=setTimeout(function(){if(!done){done=true;checked=true}},1500);
  fetch("version.json?t="+Date.now(),{cache:"no-store"}).then(function(r){return r.json()}).then(function(j){if(done)return;done=true;clearTimeout(to);
   if(j&&j.v&&String(j.v)!==String(window.F2C_BUILD)){var last=0;try{last=+sessionStorage.getItem("f2c-upd")||0}catch(e){}
    if(Date.now()-last>60000){try{sessionStorage.setItem("f2c-upd",String(Date.now()))}catch(e){}var m=document.getElementById("bootMsg");if(m)m.textContent="Updating to the newest version…";
     window.F2C_updateNow().then(function(){location.reload()});return}}
   checked=true}).catch(function(){if(!done){done=true;clearTimeout(to);checked=true}})}
 tick()})();</script>
<template id="bsTpl"><svg viewBox="0 0 64 64" class="bsrun" aria-hidden="true"><g class="bsbody"><circle cx="35" cy="10" r="5"/><path d="M34 16L30 33"/><g class="bsa1"><path d="M33 19L26 26L21 23"/></g><g class="bsa2"><path d="M33 19L40 25L45 21"/></g><g class="bsl1"><path d="M30 33L23 43L17 45"/></g><g class="bsl2"><path d="M30 33L36 44L33 53"/></g></g><path class="bsground" d="M2 58H62"/></svg><b>FIT 2 COMPETE</b><span id="bootMsg">Loading…</span></template>'''
rep('</head><body>', '</head><body>' + SPLASH)

# The in-app update (on return to the app) shows the boot screen instead of flashing the old page.
rep('''   try{if(window.caches){const root=new URL("./",location.href).href,fresh=await fetch(root,{cache:"no-store"});if(fresh.ok){for(const k of await caches.keys())if(k.startsWith("f2c-shell"))await (await caches.open(k)).put(root,fresh.clone())}}}catch(e){}
   location.reload();return true}}catch(e){}return false}''',
    '''   if(window.F2C_splash)F2C_splash("Updating to the newest version…");
   try{if(window.F2C_updateNow)await F2C_updateNow()}catch(e){}
   location.reload();return true}}catch(e){}return false}''')
