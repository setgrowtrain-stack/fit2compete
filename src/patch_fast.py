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
