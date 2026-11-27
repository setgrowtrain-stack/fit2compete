/* ===== Plan tab gets a Setup page (plan buttons, devices, appearance); dark theme ===== */
(function(){
const $=id=>document.getElementById(id);
const get=k=>{try{return localStorage.getItem(k)}catch(e){return null}},put=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
function theme(t){t=window.F2C_applyTheme?F2C_applyTheme(t):"cyan";put("f2c-theme",t);
 const U=window.F2C_holoUI;if(U&&!U.colorSet){try{U.color=getComputedStyle(document.documentElement).getPropertyValue("--accent").trim()||U.color;localStorage.setItem("f2c-holo",JSON.stringify(U))}catch(e){}}
 if(window.F2C_wdRedraw)F2C_wdRedraw()}
const LOOKS=()=>window.F2C_THEMES||{light:{l:"Light",n:"The original",bg:"#f3f4f7",card:"#fff",acc:"#E42626"}};
function looksHtml(){const cur=get("f2c-theme")||"cyan",T=LOOKS();
 const tile=k=>{const x=T[k];return `<button type="button" class="look" data-theme="${k}" role="radio" aria-checked="${k===cur}" aria-pressed="${k===cur}"><span class="lkprev" style="background:${x.bg}"><i style="background:${x.card}"></i><b style="background:${x.acc}"></b><em style="background:${x.acc}"></em></span><span class="lkname">${esc(x.l)}</span><small>${esc(x.n||"")}</small></button>`};
 const grp=(g,title)=>{const ks=Object.keys(T).filter(k=>(T[k].g||"l")===g);return ks.length?`<h4 class="sect lookgrp">${title}</h4><div class="looks" role="radiogroup" aria-label="${title}">${ks.map(tile).join("")}</div>`:""};
 return grp("l","Light backgrounds")+grp("d","Dark backgrounds")}
theme(get("f2c-theme")||"cyan");
let sub=get("f2c-plansub")||"plan";
function ensure(){const pp=$("planPanel"),vp=$("v-plan");if(!pp||!vp)return;
 let seg=$("planSeg"),sv=$("setupView");
 if(!seg){seg=document.createElement("div");seg.id="planSeg";seg.className="seg plansub";seg.innerHTML=`<button type="button" data-ps="plan">Written plan</button><button type="button" data-ps="setup">Setup &amp; devices</button>`;vp.insertBefore(seg,vp.firstChild)}
 if(!sv){sv=document.createElement("div");sv.id="setupView";sv.className="setupview";sv.innerHTML=`<div id="setupHead"></div><div id="setupDevices"></div>
  <div class="sheet"><span class="label">Appearance</span><div id="looksBox">${looksHtml()}</div><p class="muted small">Pick a look. It changes this phone only, and the loading screen matches it.</p></div>`;seg.after(sv)}
 const top=pp.querySelector(":scope > .top");if(top&&top.parentNode!==$("setupHead"))$("setupHead").appendChild(top);
 const ap=$("addPanel");if(ap&&ap.parentNode!==sv)sv.insertBefore(ap,$("setupDevices").nextSibling);
 if(!$("wearBox")&&window.F2C_wearRender)try{F2C_wearRender()}catch(e){}
 seg.querySelectorAll("[data-ps]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.ps===sub));
 {const lb=sv.querySelector("#looksBox");if(lb)lb.innerHTML=looksHtml()}
 [...vp.children].forEach(c=>{if(c===seg)return;c.hidden=sub==="setup"?c!==sv:c===sv})}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("button[data-ps],button[data-theme],[data-gosetup]");if(!b||b.closest("#ptabs"))return;
 if(b.dataset.ps){sub=b.dataset.ps;put("f2c-plansub",sub);ensure();return}
 if(b.dataset.theme){theme(b.dataset.theme);ensure();window.F2C_holoPanel&&0;return}
 if(b.dataset.gosetup!=null){sub="setup";put("f2c-plansub",sub);const t=document.querySelector('#ptabs button[data-tab="plan"]');t&&t.click();setTimeout(ensure,0)}});
const mo=new MutationObserver(()=>{if($("v-plan")){mo.disconnect();ensure();new MutationObserver(()=>{clearTimeout(ensure._t);ensure._t=setTimeout(ensure,50)}).observe($("planPanel"),{childList:true})}});
mo.observe(document.documentElement,{childList:true,subtree:true});
window.F2C_setupEnsure=ensure;
const st=document.createElement("style");st.textContent=`
:root{--wd-strain:var(--accent);--wd-sleep:color-mix(in srgb,var(--accent) 45%,var(--muted));--wd-mut:var(--muted);--wd-tile:color-mix(in srgb,var(--ink) 6%,transparent);--wd-tile2:color-mix(in srgb,var(--ink) 12%,transparent);--wd-line2:color-mix(in srgb,var(--ink) 35%,transparent);
 --stage-a:color-mix(in srgb,var(--hero-a,#7f1d1d) 55%,#0b1220);--stage-b:color-mix(in srgb,var(--hero-a,#7f1d1d) 25%,#060a14)}
html.dark{--stage-a:var(--card);--stage-b:color-mix(in srgb,var(--bg) 88%,#000)}
circle.wtrack{stroke:var(--wd-tile2)}
/* Surfaces that had white written in: follow the look */
html.tint .appbar,html.tint .who .btn,html.tint .ptabs,html.tint .ptabs button[aria-selected="true"],html.tint .excard,html.tint .srow input,html.tint .srow select,html.tint .tbox,html.tint .fbanner,html.tint .wherebox .seg button,
html.dark .excard,html.dark .srow input,html.dark .srow select,html.dark .tbox,html.dark .fbanner,html.dark .wherebox .seg button,html.dark .swapbox{background:var(--card)!important;color:var(--ink)!important}
html.tint .swapbox,html.dark .swapbox{background:var(--accent-soft)!important;border-color:var(--line)!important;color:var(--ink)!important}
html.tint .excard h4,html.tint .excard .muted,html.dark .excard h4{color:inherit}html.tint .excard .muted,html.tint .excard small{color:var(--muted)!important}
html.tint .dchip[aria-selected="true"] i{background:var(--accent-ink)}
:root{--wd-green:#16a34a;--wd-yellow:#d49b00;--wd-red:#e11d48}html.dark{--wd-green:#16ec06;--wd-yellow:#ffde00;--wd-red:#ff2a4a}
.wearcard{border:1px solid var(--line)!important;box-shadow:var(--shadow,0 1px 2px rgba(0,0,0,.06))}
.plansub{margin-bottom:12px}.setupview{display:grid;gap:16px}.setupview .top{margin:0}
html.dark{--bg:#1a2740;--card:#23324f;--ink:#e6edf6;--muted:#9aa8bb;--line:#1d2a3f;--accent-soft:#3a1418;--ok-soft:#0f2a1c;--gold:#f0b44c;--gold-soft:#2b210f;--warn-soft:#331414;--head:#e6edf6;--shadow:0 1px 2px rgba(0,0,0,.4),0 6px 20px rgba(0,0,0,.35);color-scheme:dark}
html.dark body{background:var(--bg);color:var(--ink)}
html.dark .ptabs,html.dark #ptabs{background:rgba(8,13,24,.94)!important;border-color:var(--line)!important}
html.dark #ptabs button{color:var(--muted)}html.dark #ptabs button[aria-selected="true"]{background:transparent!important;color:var(--accent)}
html.dark header,html.dark .appbar,html.dark .topbar{background:#08101d!important;border-color:var(--line)!important}
html.dark input,html.dark select,html.dark textarea{background:#0a1220;color:var(--ink);border-color:var(--line)}
html.dark .btn:not(.primary),html.dark .chipbtn:not([aria-pressed="true"]),html.dark .seg button:not([aria-pressed="true"]){background:#101b2d;color:var(--ink);border-color:var(--line)}
html.dark .seg{background:#0a1220;border-color:var(--line)}html.dark .note{color:var(--ink)}html.dark table th{background:#0f1a2b}html.dark .kpi,html.dark .chip span{background:#101b2d;border-color:var(--line)}
html.dark .pill{background:#1a2638;color:var(--ink)}html.dark a{color:#7fb6ff}html.dark .note.red{background:#3a1416}
/* Looks with their own colors (Dark mode, Black & gold, Forest, Ember, Royal, Arctic): variables set by F2C_applyTheme */
html.tint body{background:var(--bg)}
html.tint .btn.primary{box-shadow:0 2px 10px color-mix(in srgb,var(--accent) 28%,transparent)}
html.tint .hero{background:linear-gradient(135deg,var(--hero-a),var(--hero-b))!important;color:#fff!important;box-shadow:0 8px 24px color-mix(in srgb,var(--accent) 20%,transparent)!important}
html.tint .hero *{color:inherit}
html.tint a{color:var(--link)}html.tint h1 span{color:var(--accent)}
html.tint .seg button[aria-pressed="true"],html.tint .chipbtn[aria-pressed="true"]{background:var(--accent)!important;color:var(--accent-ink)!important;border-color:var(--accent)!important}
html.tint #ptabs button[aria-selected="true"]{color:var(--accent)}html.tint #ptabs button[aria-selected="true"] svg{color:var(--accent);stroke:var(--accent)}
html.tint .sspill{background:var(--accent-soft);border-color:var(--accent)}html.tint .ssico{background:var(--accent-soft);color:var(--accent)}
html.tint.dark .note.red{background:#3a1416}html.tint .libopenbtn{background:var(--card);border-color:var(--line)}
html.tint:not(.dark) body{color:var(--ink)}
.looks{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.lookgrp{margin:10px 0 6px}.lookgrp:first-child{margin-top:0}
.look{display:flex;flex-direction:column;align-items:center;gap:3px;border:2px solid var(--line);background:var(--card);color:var(--ink);border-radius:16px;padding:8px 4px;cursor:pointer;font:inherit}
.look[aria-checked="true"]{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 25%,transparent)}
.lkprev{position:relative;width:100%;aspect-ratio:1/1.15;border-radius:10px;overflow:hidden;border:1px solid rgba(127,127,127,.25)}
.lkprev i{position:absolute;left:12%;right:12%;top:14%;height:42%;border-radius:6px}.lkprev b{position:absolute;left:12%;right:12%;bottom:12%;height:16%;border-radius:999px}
.lkprev em{position:absolute;left:22%;top:24%;width:40%;height:7%;border-radius:4px;opacity:.85}
.lkname{font-weight:800;font-size:.78rem;line-height:1.2;text-align:center}.look small{font-size:.64rem;color:var(--muted);text-align:center;line-height:1.2}
@media (max-width:360px){.looks{grid-template-columns:repeat(2,1fr)}}`;document.head.appendChild(st);
})();
