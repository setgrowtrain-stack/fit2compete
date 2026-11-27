/* ===== Plan tab gets a Setup page (plan buttons, devices, appearance); dark theme ===== */
(function(){
const $=id=>document.getElementById(id);
const get=k=>{try{return localStorage.getItem(k)}catch(e){return null}},put=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
function theme(t){if(!["light","dark","cyan"].includes(t))t="light";const h=document.documentElement;h.classList.toggle("dark",t==="dark"||t==="cyan");h.classList.toggle("cyan",t==="cyan");put("f2c-theme",t);const m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t==="light"?"#ffffff":"#060a14")}
theme(get("f2c-theme")||"light");
let sub=get("f2c-plansub")||"plan";
function ensure(){const pp=$("planPanel"),vp=$("v-plan");if(!pp||!vp)return;
 let seg=$("planSeg"),sv=$("setupView");
 if(!seg){seg=document.createElement("div");seg.id="planSeg";seg.className="seg plansub";seg.innerHTML=`<button type="button" data-ps="plan">Written plan</button><button type="button" data-ps="setup">Setup &amp; devices</button>`;vp.insertBefore(seg,vp.firstChild)}
 if(!sv){sv=document.createElement("div");sv.id="setupView";sv.className="setupview";sv.innerHTML=`<div id="setupHead"></div><div id="setupDevices"></div>
  <div class="sheet"><span class="label">Appearance</span><div class="seg themeseg"><button type="button" data-theme="light">Light</button><button type="button" data-theme="cyan">Dark mode</button><button type="button" data-theme="dark">Navy &amp; red</button></div><p class="muted small">Dark mode is deep navy with cyan, like the loading screen. Navy &amp; red keeps the red buttons on navy. Light is the original look.</p></div>`;seg.after(sv)}
 const top=pp.querySelector(":scope > .top");if(top&&top.parentNode!==$("setupHead"))$("setupHead").appendChild(top);
 const ap=$("addPanel");if(ap&&ap.parentNode!==sv)sv.insertBefore(ap,$("setupDevices").nextSibling);
 if(!$("wearBox")&&window.F2C_wearRender)try{F2C_wearRender()}catch(e){}
 seg.querySelectorAll("[data-ps]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.ps===sub));
 sv.querySelectorAll("[data-theme]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.theme===(get("f2c-theme")||"light")));
 [...vp.children].forEach(c=>{if(c===seg)return;c.hidden=sub==="setup"?c!==sv:c===sv})}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("button[data-ps],button[data-theme],[data-gosetup]");if(!b||b.closest("#ptabs"))return;
 if(b.dataset.ps){sub=b.dataset.ps;put("f2c-plansub",sub);ensure();return}
 if(b.dataset.theme){theme(b.dataset.theme);ensure();window.F2C_holoPanel&&0;return}
 if(b.dataset.gosetup!=null){sub="setup";put("f2c-plansub",sub);const t=document.querySelector('#ptabs button[data-tab="plan"]');t&&t.click();setTimeout(ensure,0)}});
const mo=new MutationObserver(()=>{if($("v-plan")){mo.disconnect();ensure();new MutationObserver(()=>{clearTimeout(ensure._t);ensure._t=setTimeout(ensure,50)}).observe($("planPanel"),{childList:true})}});
mo.observe(document.documentElement,{childList:true,subtree:true});
window.F2C_setupEnsure=ensure;
const st=document.createElement("style");st.textContent=`.plansub{margin-bottom:12px}.setupview{display:grid;gap:16px}.setupview .top{margin:0}
html.dark{--bg:#060a14;--card:#0e1625;--ink:#e6edf6;--muted:#9aa8bb;--line:#1d2a3f;--accent-soft:#3a1418;--ok-soft:#0f2a1c;--gold:#f0b44c;--gold-soft:#2b210f;--warn-soft:#331414;--head:#e6edf6;--shadow:0 1px 2px rgba(0,0,0,.4),0 6px 20px rgba(0,0,0,.35);color-scheme:dark}
html.dark body{background:radial-gradient(ellipse at 50% 0%,#0f2236 0%,#060a14 60%) no-repeat,#060a14;color:var(--ink)}
html.dark .ptabs,html.dark #ptabs{background:rgba(8,13,24,.94)!important;border-color:var(--line)!important}
html.dark #ptabs button{color:var(--muted)}html.dark #ptabs button[aria-selected="true"]{background:transparent!important;color:var(--accent)}
html.dark header,html.dark .appbar,html.dark .topbar{background:#08101d!important;border-color:var(--line)!important}
html.dark input,html.dark select,html.dark textarea{background:#0a1220;color:var(--ink);border-color:var(--line)}
html.dark .btn:not(.primary),html.dark .chipbtn:not([aria-pressed="true"]),html.dark .seg button:not([aria-pressed="true"]){background:#101b2d;color:var(--ink);border-color:var(--line)}
html.dark .seg{background:#0a1220;border-color:var(--line)}html.dark .note{color:var(--ink)}html.dark table th{background:#0f1a2b}html.dark .kpi,html.dark .chip span{background:#101b2d;border-color:var(--line)}
html.dark .pill{background:#1a2638;color:var(--ink)}html.dark a{color:#7fb6ff}html.dark .note.red{background:#3a1416}
/* Dark mode: the loading screen's deep navy, cyan and white */
html.cyan{--bg:#060a14;--card:#0b1322;--ink:#e8edf2;--muted:#8a96a2;--line:#18253a;--accent:#22d3ee;--accent-ink:#04121a;--accent-soft:#0b2a35;--head:#e8edf2;--ok-soft:#0f2a1c}
html.cyan body{background:#060a14}
html.cyan .btn.primary{box-shadow:0 2px 10px rgba(34,211,238,.25)}
html.cyan .hero{background:linear-gradient(135deg,#0e7490,#22d3ee)!important;color:#04121a!important;box-shadow:0 8px 24px rgba(34,211,238,.18)!important}
html.cyan .hero *{color:inherit}
html.cyan a{color:#67e8f9}html.cyan h1 span{color:var(--accent)}
html.cyan .seg button[aria-pressed="true"],html.cyan .chipbtn[aria-pressed="true"]{background:var(--accent)!important;color:var(--accent-ink)!important;border-color:var(--accent)!important}
html.cyan #ptabs button[aria-selected="true"]{color:var(--accent)}html.cyan #ptabs button[aria-selected="true"] svg{color:var(--accent);stroke:var(--accent)}
html.cyan .note.red{background:#3a1416}html.cyan .sspill{background:#0b2a35;border-color:#22d3ee}html.cyan .ssico{background:#0b2a35;color:#22d3ee}
html.cyan .libopenbtn{background:var(--card);border-color:var(--line)}`;document.head.appendChild(st);
})();
