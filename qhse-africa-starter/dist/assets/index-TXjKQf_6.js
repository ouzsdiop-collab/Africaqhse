(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))r(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&r(o)}).observe(document,{childList:!0,subtree:!0});function a(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function r(n){if(n.ep)return;n.ep=!0;const i=a(n);fetch(n.href,i)}})();const Mo="qhse-display-mode";function Po(){return document.documentElement}function Ts(){const e=Po().getAttribute("data-display-mode");return e==="simple"||e==="expert"?e:"expert"}function Ro(e){const t=e==="simple"?"simple":"expert";Po().setAttribute("data-display-mode",t);try{localStorage.setItem(Mo,t)}catch{}}function Ms(){let e="expert";try{const t=localStorage.getItem(Mo);(t==="simple"||t==="expert")&&(e=t)}catch{}Ro(e)}const na=["Site principal","Site industriel","Vue groupe multi-sites"],jr=[{label:"Pilotage",items:[{id:"dashboard",label:"Dashboard",icon:"◫"},{id:"analytics",label:"Analytics / Synthèse",icon:"≈"},{id:"performance",label:"Performance QHSE",icon:"▤"},{id:"activity-log",label:"Journal",icon:"≣"}]},{label:"Opérations",items:[{id:"audits",label:"Audits",icon:"☑"},{id:"incidents",label:"Incidents",icon:"!"},{id:"risks",label:"Risques",icon:"△"},{id:"actions",label:"Actions",icon:"✓"}]},{label:"Conformité",items:[{id:"iso",label:"ISO & Conformité",icon:"◎"},{id:"products",label:"Produits / FDS",icon:"⚗"}]},{label:"IA",items:[{id:"ai-center",label:"Centre IA",icon:"✦"}]},{label:"Paramètres",items:[{id:"settings",label:"Paramètres",icon:"⚙"}]}],Ps=[],ga={dashboard:{title:"Cockpit QHSE",kicker:"Pilotage",subtitle:"Vue consolidée des indicateurs critiques, alertes et priorités du jour.",cta:{label:"Voir les incidents",pageId:"incidents"}},sites:{title:"Sites & périmètres",kicker:"Organisation",subtitle:"Référentiel des sites pour rattacher incidents, audits et actions à un périmètre réel (V1).",cta:{label:"Voir les incidents",pageId:"incidents"}},incidents:{title:"Incidents terrain",kicker:"Opérations",subtitle:"Suivi des événements, investigations et plans de correction.",cta:{label:"Aller au plan d’actions",pageId:"actions"}},risks:{title:"Registre des risques",kicker:"Opérations",subtitle:"Cartographie, criticité et traitements associés.",cta:{label:"Plan d’actions",pageId:"actions"}},actions:{title:"Plan d’actions",kicker:"Opérations",subtitle:"Pilotez les actions correctives, préventives et le suivi des échéances.",cta:{label:"Centre IA",pageId:"ai-center"}},iso:{title:"ISO & Conformité",kicker:"Conformité",subtitle:"Pilotage du SMS QHSE, référentiels, exigences et preuves pour audits et revue de direction.",cta:{label:"Audits terrain",pageId:"audits"}},audits:{title:"Audits & conformité",kicker:"Opérations",subtitle:"Audits planifiés, constats et preuves documentaires.",cta:{label:"Produits / FDS",pageId:"products"}},products:{title:"Produits / FDS",kicker:"Conformité",subtitle:"Fiches de données sécurité et registres produits.",cta:{label:"ISO & Conformité",pageId:"iso"}},imports:{title:"Import de documents",kicker:"Documents",subtitle:"Chargement et aperçu brut des contenus (PDF, Excel) — base pour extraction intelligente ultérieure.",cta:{label:"Centre IA",pageId:"ai-center"}},analytics:{title:"Analytics / Synthèse",kicker:"Pilotage",subtitle:"Synthèse consolidée incidents, NC, actions, audits et alertes — base revue direction et rapports périodiques.",cta:{label:"Dashboard",pageId:"dashboard"}},performance:{title:"Performance QHSE",kicker:"Pilotage",subtitle:"Indicateurs clés, tendances et écarts à l’objectif — données issues des modules existants (synthèse, incidents, audits).",cta:{label:"Analytics",pageId:"analytics"}},"ai-center":{title:"Centre IA",kicker:"IA",subtitle:"Assistants et analyses pilotées pour accélérer vos revues QHSE.",cta:{label:"Retour dashboard",pageId:"dashboard"}},"activity-log":{title:"Journal",kicker:"Pilotage",subtitle:"Historique des changements et traçabilité opérationnelle.",cta:{label:"Audits",pageId:"audits"}},settings:{title:"Paramètres & configuration",kicker:"Paramètres",subtitle:"Organisation, alertes, notifications, exports, référentiels, règles IA et cycle de contrôle — préférences locales (démo) jusqu’à branchement API.",cta:{label:"Centre IA",pageId:"ai-center"}}};function Do(e){for(const t of jr){const a=t.items.find(r=>r.id===e);if(a)return{groupLabel:t.label,item:a}}return null}function Rs(e){var i;const t=ga[e],a=Do(e),r=(t==null?void 0:t.title)||((i=a==null?void 0:a.item)==null?void 0:i.label)||"Module",n=[{label:"Accueil",pageId:"dashboard"}];return a&&n.push({label:a.groupLabel,pageId:null}),n.push({label:r,pageId:null}),n}function Ds(){return[...jr.flatMap(t=>t.items.map(a=>({...a,groupLabel:t.label}))),...Ps]}const js=["login","dashboard","incidents","risks","actions","iso","audits","sites","products","imports","analytics","performance","ai-center","activity-log","settings"],Ne={currentPage:"dashboard",currentSite:"Vue groupe (tous sites)",activeSiteId:null,notificationsOpen:!1};function ai(e){js.includes(e)&&(Ne.currentPage=e)}function jo(e,t){const a=e!=null&&String(e).trim()!==""?String(e).trim():null;Ne.activeSiteId=a,t&&String(t).trim()?Ne.currentSite=String(t).trim():Ne.currentSite=a?"Site":"Vue groupe (tous sites)"}const kn="http://localhost:3001";function _n(e){const t=String(e||"");return t==="5173"||t==="5500"||t==="8080"||t==="3000"}function wn(e){const t=String(e||"");return t==="localhost"||t==="127.0.0.1"||t==="::1"}function En(e){const t=String(e||"");return t==="::1"?"http://[::1]:3001":`http://${t}:3001`}function Qt(){if(typeof window>"u")return kn;const e=window.__QHSE_API_BASE__;if(e!=null&&String(e).trim()!==""){const r=String(e).replace(/\/$/,"");return r===window.location.origin&&_n(window.location.port)?En(window.location.hostname):r}const t=window.location.hostname,a=String(window.location.port||"");return wn(t)&&_n(a)?En(t):a==="5173"&&t&&!wn(t)?`http://${t}:3001`:kn}const _r="qhseSessionUser",ii="qhseAuthToken";function Me(){try{const e=sessionStorage.getItem(_r);if(!e)return null;const t=JSON.parse(e);if(t&&typeof t.id=="string"&&typeof t.role=="string")return{id:t.id,name:typeof t.name=="string"?t.name:"",email:typeof t.email=="string"?t.email:"",role:String(t.role??"").trim().toUpperCase()}}catch{}return null}function pa(e){if(!e||!e.id){sessionStorage.removeItem(_r);return}sessionStorage.setItem(_r,JSON.stringify({id:e.id,name:e.name||"",email:e.email||"",role:String(e.role??"").trim().toUpperCase()}))}function wr(){var e;return((e=Me())==null?void 0:e.id)||""}function Or(){try{return sessionStorage.getItem(ii)||""}catch{return""}}function Os(e){if(!e){sessionStorage.removeItem(ii);return}sessionStorage.setItem(ii,e)}function Ma(){sessionStorage.removeItem(ii),pa(null)}function Hs(e,t){Os(t),pa(e)}async function Fs(){var t;const e=Or();if(e)try{const a=await fetch(`${Qt()}/api/auth/me`,{headers:{Authorization:`Bearer ${e}`}});if(!a.ok){Ma();return}const r=await a.json();(t=r==null?void 0:r.user)!=null&&t.id?pa({id:r.user.id,name:r.user.name||"",email:r.user.email||"",role:r.user.role||""}):Ma()}catch{}}async function Se(e,t={}){const a=Qt(),r=e.startsWith("http")?e:`${a}${e.startsWith("/")?e:`/${e}`}`,n=new Headers(t.headers||void 0),i=Or();if(i)n.set("Authorization",`Bearer ${i}`);else{const c=wr();c&&n.set("X-User-Id",c)}t.body instanceof FormData&&n.delete("Content-Type");const o=!!i,s=await fetch(r,{...t,headers:n});if(s.status===401&&o&&Ma(),s.status===403)try{const c=await s.clone().json();(typeof(c==null?void 0:c.error)=="string"?c.error:"").includes("Profil inconnu")&&pa(null)}catch{}return s}let Ft=null,Er=0;const Vs=45e3;async function di(e={}){if(!e.force&&Ft&&Date.now()-Er<Vs)return Ft;const t=await Se("/api/sites");if(!t.ok)return Array.isArray(Ft)?Ft:[];const a=await t.json().catch(()=>[]);return Ft=Array.isArray(a)?a:[],Er=Date.now(),Ft}function Bs(){Ft=null,Er=0}const st=["read","write"],Gs={ADMIN:{"*":!0},QHSE:{settings:["read"],incidents:st,actions:st,audits:st,nonconformities:st,sites:st,dashboard:["read"],notifications:["read"],users:st,reports:st,imports:st},DIRECTION:{incidents:["read"],actions:["read"],audits:["read"],nonconformities:["read"],sites:["read"],dashboard:["read"],notifications:["read"],users:["read"],reports:["read"],imports:["read"]},ASSISTANT:{settings:["read"],incidents:st,actions:["read"],audits:["read"],nonconformities:st,sites:st,dashboard:["read"],notifications:["read"],users:["read"],reports:["read"],imports:st},TERRAIN:{settings:["read"],incidents:st,actions:["read"],audits:["read"],nonconformities:["read"],sites:["read"],dashboard:["read"],notifications:["read"],users:["read"],reports:["read"],imports:["read"]}},Us=new Set(["dashboard","incidents","actions","settings"]);function lt(e,t,a){if(e==null)return!0;const r=String(e).trim().toUpperCase();if(!r)return!1;const n=Gs[r];if(!n)return!1;if(n["*"]===!0)return!0;const i=n[t];return i===!0?!0:Array.isArray(i)?i.includes(a):!1}function yt(e,t){return e&&String(e).toUpperCase()==="TERRAIN"?Us.has(t):!0}const Nn="qhse-sidebar-v2-styles";function Ws(){if(document.getElementById(Nn))return;const e=document.createElement("style");e.id=Nn,e.textContent=`
.sidebar-v2 {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  max-height: 100dvh;
  position: sticky;
  top: 0;
  align-self: flex-start;
  z-index: var(--z-sidebar);
  background: linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 96%, var(--color-subtle)) 0%, var(--color-surface) 48%, var(--color-surface) 100%);
  border-right: 1px solid color-mix(in srgb, var(--color-border) 88%, transparent);
  box-shadow: var(--shadow-sm), inset -1px 0 0 color-mix(in srgb, var(--color-border) 35%, transparent);
  font-family: var(--font-body);
}
.sidebar-v2__brand {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}
.sidebar-v2__brand-mark {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: var(--color-primary-text);
  background: var(--color-primary-bg);
  border: 1px solid var(--color-primary-border);
}
.sidebar-v2__brand-mark svg {
  width: 24px;
  height: 24px;
}
.sidebar-v2__brand-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.sidebar-v2__brand-title {
  font-family: 'Inter', var(--font-body);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.25;
  color: var(--color-text);
  letter-spacing: -0.02em;
}
.sidebar-v2__brand-badge {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  background: var(--color-subtle);
  align-self: flex-start;
}
.sidebar-v2__nav {
  flex: 1 1 0%;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: var(--space-4) var(--space-3) var(--space-5);
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}
.sidebar-v2__group {
  margin-bottom: var(--space-6);
}
.sidebar-v2__group + .sidebar-v2__group {
  margin-top: var(--space-2);
  padding-top: var(--space-5);
  border-top: 1px solid color-mix(in srgb, var(--color-border) 55%, transparent);
}
.sidebar-v2__nav-divider {
  height: 0;
  margin: var(--space-1) 0 var(--space-2);
  border: none;
  border-top: 1px solid color-mix(in srgb, var(--color-border) 50%, transparent);
  background: none;
}
.sidebar-v2__nav-divider + .sidebar-v2__group {
  margin-top: var(--space-3);
  padding-top: 0;
  border-top: none;
}
.sidebar-v2__group:last-child {
  margin-bottom: 0;
}
.sidebar-v2__group-label {
  margin: 0 0 var(--space-2) var(--space-2);
  font-size: 9px;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  opacity: 0.88;
}
.sidebar-v2__items {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.sidebar-v2__item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  text-align: left;
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  padding-left: calc(var(--space-3) + 3px);
  margin: 0;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: transparent;
  cursor: pointer;
  position: relative;
  transition:
    background 220ms cubic-bezier(0.4, 0, 0.2, 1),
    color 220ms cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 220ms cubic-bezier(0.4, 0, 0.2, 1),
    transform 220ms cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar-v2__item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  border-radius: 0 2px 2px 0;
  background: var(--color-primary-text);
  opacity: 0;
  transition:
    height 220ms cubic-bezier(0.4, 0, 0.2, 1),
    opacity 220ms cubic-bezier(0.4, 0, 0.2, 1),
    width 220ms cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar-v2__item:hover {
  background: color-mix(in srgb, var(--color-subtle) 82%, var(--color-primary-bg));
  color: var(--color-text);
}
.sidebar-v2__item--active {
  color: var(--color-text);
  font-weight: 600;
  background: color-mix(in srgb, var(--color-primary-bg) 96%, var(--color-surface));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary-border) 58%, transparent);
}
.sidebar-v2__item--active::before {
  height: 72%;
  min-height: 24px;
  opacity: 1;
  width: 4px;
  border-radius: 0 3px 3px 0;
}
.sidebar-v2__item-text {
  flex: 1 1 auto;
  min-width: 0;
  text-align: left;
}
.sidebar-v2__item-badge {
  flex-shrink: 0;
  margin-left: var(--space-2);
  font-size: 10px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--color-text);
  background: color-mix(in srgb, var(--color-subtle) 70%, var(--color-surface));
  border: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);
  box-sizing: border-box;
}
.sidebar-v2__item-badge[hidden] {
  display: none !important;
}
.sidebar-v2__item-badge--incidents {
  color: var(--color-danger-text);
  background: var(--color-danger-bg);
  border-color: color-mix(in srgb, var(--color-danger-border) 70%, var(--color-border));
}
.sidebar-v2__item-badge--actions {
  color: var(--color-warning-text);
  background: var(--color-warning-bg);
  border-color: color-mix(in srgb, var(--color-warning-border) 72%, var(--color-border));
}
.sidebar-v2__item-badge--audits {
  color: var(--color-info-text, var(--color-primary-text));
  background: color-mix(in srgb, var(--color-primary-bg) 88%, var(--color-surface));
  border-color: color-mix(in srgb, var(--color-primary-border) 55%, transparent);
}
.sidebar-v2__item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: inherit;
  opacity: 0.92;
}
.sidebar-v2__item-icon .shell-nav-svg {
  width: 20px;
  height: 20px;
}
.sidebar-v2__footer {
  flex-shrink: 0;
  padding: var(--space-3) var(--space-4) var(--space-4);
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--color-subtle) 40%, var(--color-surface)) 0%,
    var(--color-subtle) 100%
  );
}
.sidebar-v2__footer--compact {
  padding: 6px 8px 8px;
  gap: 6px;
  background: color-mix(in srgb, var(--color-subtle) 94%, var(--color-surface));
}
.sidebar-v2__footer-identity {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 7px;
  border-radius: var(--radius-md);
  border: 1px solid color-mix(in srgb, var(--color-border) 48%, transparent);
  background: color-mix(in srgb, var(--color-surface) 88%, var(--color-subtle));
}
.sidebar-v2__footer-identity .sidebar-v2__block {
  margin: 0;
}
.sidebar-v2__footer-identity .sidebar-v2__account-card {
  border: none;
  background: transparent;
  padding: 0 0 5px;
  margin: 0;
  border-radius: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--color-border) 45%, transparent);
}
.sidebar-v2__footer-identity .shell-account-actions {
  padding-top: 2px;
}
.sidebar-v2__footer--compact .sidebar-v2__footer-label {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  opacity: 0.72;
  margin: 0 0 5px;
}
.sidebar-v2__footer-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: var(--space-2);
}
.sidebar-v2__context .control-select,
.sidebar-v2 .shell-account-slot > .control-select {
  width: 100%;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  padding: var(--space-2) var(--space-3);
  font-family: inherit;
  font-size: 13px;
}
.sidebar-v2__footer--compact .sidebar-v2__context .control-select,
.sidebar-v2__footer--compact .shell-account-slot > .control-select {
  padding: 4px 8px;
  font-size: 11px;
  line-height: 1.3;
  min-height: 28px;
}
.sidebar-v2 .shell-account-actions {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.sidebar-v2__account-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}
.sidebar-v2__footer--compact .sidebar-v2__account-card {
  gap: 6px;
  padding: 0;
}
.sidebar-v2__account-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-primary-text);
  background: var(--color-primary-bg);
  border: 1px solid var(--color-primary-border);
  flex-shrink: 0;
}
.sidebar-v2__footer--compact .sidebar-v2__account-avatar {
  width: 32px;
  height: 32px;
  font-size: 11px;
  border-radius: var(--radius-sm);
}
.sidebar-v2__account-meta {
  min-width: 0;
  flex: 1;
}
.sidebar-v2__account-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sidebar-v2__footer--compact .sidebar-v2__account-name {
  font-size: 12px;
}
.sidebar-v2__account-role {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: var(--space-1);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.sidebar-v2__footer--compact .sidebar-v2__account-role {
  font-size: 10px;
  margin-top: 1px;
}
.sidebar-v2__btn-logout {
  width: 100%;
  margin-top: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 150ms ease, border-color 150ms ease, color 150ms ease;
}
.sidebar-v2__btn-logout:hover {
  background: var(--color-surface);
  border-color: var(--color-primary-border);
  color: var(--color-text);
}
.sidebar-v2__footer--compact .sidebar-v2__btn-logout {
  margin-top: 4px;
  padding: 4px 8px;
  font-size: 11px;
  min-height: 28px;
}
.sidebar-v2__btn-ghost {
  width: 100%;
  margin-top: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;
}
.sidebar-v2__footer--compact .sidebar-v2__btn-ghost {
  margin-top: 4px;
  padding: 4px 8px;
  font-size: 11px;
  min-height: 28px;
}
.sidebar-v2__btn-ghost:hover {
  background: var(--color-subtle);
  color: var(--color-text);
}
.sidebar-v2__btn-link {
  display: block;
  width: 100%;
  margin-top: var(--space-2);
  padding: var(--space-1) 0;
  border: none;
  background: none;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-info-text);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
  transition: color 150ms ease;
}
.sidebar-v2__btn-link:hover {
  color: var(--color-primary-text);
}
.sidebar-v2__footer-secondary[hidden] {
  display: none !important;
}
.sidebar-v2__footer-secondary {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.sidebar-v2__footer--compact .sidebar-v2__footer-secondary {
  gap: 0;
  margin-top: 1px;
}
.sidebar-v2__footer-secondary > .sidebar-v2__footer-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  opacity: 0.72;
  margin-bottom: 0;
}
.sidebar-v2__footer-shortcuts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);
  width: 100%;
}
.sidebar-v2__footer--compact .sidebar-v2__footer-shortcuts {
  gap: 4px;
}
.sidebar-v2__footer-shortcut {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 50px;
  padding: var(--space-2) var(--space-1);
  margin: 0;
  border: 1px solid color-mix(in srgb, var(--color-border) 78%, transparent);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-family: inherit;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
  line-height: 1.2;
  text-align: center;
  cursor: pointer;
  transition:
    background 180ms cubic-bezier(0.4, 0, 0.2, 1),
    border-color 180ms cubic-bezier(0.4, 0, 0.2, 1),
    color 180ms cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar-v2__footer-shortcut--icon-only {
  flex-direction: row;
  align-items: center;
  justify-content: center;
  min-height: 0;
  aspect-ratio: 1;
  max-height: 28px;
  padding: 0;
  border-radius: var(--radius-sm);
  border-color: color-mix(in srgb, var(--color-border) 65%, transparent);
  background: color-mix(in srgb, var(--color-surface) 88%, transparent);
}
.sidebar-v2__footer-shortcut:hover {
  background: color-mix(in srgb, var(--color-primary-bg) 18%, var(--color-surface));
  border-color: color-mix(in srgb, var(--color-primary-border) 42%, var(--color-border));
  color: var(--color-text);
}
.sidebar-v2__footer-shortcut:active {
  background: color-mix(in srgb, var(--color-primary-bg) 26%, var(--color-surface));
}
.sidebar-v2__footer-shortcut--active {
  border-color: color-mix(in srgb, var(--color-primary-border) 50%, var(--color-border));
  background: color-mix(in srgb, var(--color-primary-bg) 82%, var(--color-surface));
  color: var(--color-text);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary-border) 28%, transparent);
}
.sidebar-v2__footer-shortcut--icon-only.sidebar-v2__footer-shortcut--active {
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary-border) 35%, transparent);
}
.sidebar-v2__footer-shortcut-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  transition: color 200ms ease;
}
.sidebar-v2__footer-shortcut:hover .sidebar-v2__footer-shortcut-icon,
.sidebar-v2__footer-shortcut--active .sidebar-v2__footer-shortcut-icon {
  color: var(--color-primary-text);
}
.sidebar-v2__footer-shortcut-icon .shell-nav-svg {
  width: 18px;
  height: 18px;
}
.sidebar-v2__footer-shortcut--icon-only .sidebar-v2__footer-shortcut-icon .shell-nav-svg {
  width: 14px;
  height: 14px;
}
.sidebar-v2__status {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid color-mix(in srgb, var(--color-border) 55%, transparent);
  background: color-mix(in srgb, var(--color-surface) 65%, var(--color-subtle));
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-muted);
  line-height: 1.35;
  margin: 0;
}
.sidebar-v2__footer--compact .sidebar-v2__status {
  padding: 2px 0 0;
  margin: 0;
  font-size: 9px;
  font-weight: 500;
  border: none;
  background: transparent;
  justify-content: center;
  opacity: 0.75;
  gap: 5px;
}
.sidebar-v2__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--palette-accent, var(--app-accent, #14b8a6)) 75%, var(--color-text-muted));
  opacity: 0.9;
}
.sidebar-v2__footer--compact .sidebar-v2__status-dot {
  width: 4px;
  height: 4px;
}
`,document.head.append(e)}const Sn={dashboard:'<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',sites:'<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9v.01"/><path d="M9 12v.01"/><path d="M9 15v.01"/><path d="M9 18v.01"/></svg>',incidents:'<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',risks:'<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',actions:'<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>',iso:'<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',audits:'<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15l2 2 4-4"/></svg>',products:'<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',imports:'<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',"activity-log":'<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',analytics:'<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',performance:'<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="M7 16l4-6 4 4 5-8"/></svg>',"ai-center":'<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M16 14v2a4 4 0 0 1-8 0v-2"/><path d="M8 10h8"/><path d="M12 18v4"/></svg>',settings:'<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'},Ys='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';function Cn(e){return Sn[e]||Sn.dashboard}function Qs({currentPage:e,onNavigate:t,onSiteChange:a,onSessionUserChange:r}){var b;Ws();const n=document.createElement("aside");n.className="sidebar-v2",n.innerHTML=`
    <div class="sidebar-v2__brand">
      <div class="sidebar-v2__brand-mark" aria-hidden="true">${Ys}</div>
      <div class="sidebar-v2__brand-text">
        <span class="sidebar-v2__brand-title">QHSE Control</span>
        <span class="sidebar-v2__brand-badge" title="Démonstration">Démo</span>
      </div>
    </div>
    <nav class="sidebar-v2__nav" aria-label="Navigation principale"></nav>
    <div class="sidebar-v2__footer sidebar-v2__footer--compact">
      <div class="sidebar-v2__footer-identity">
        <span class="visually-hidden">Compte et périmètre</span>
        <div class="sidebar-v2__block sidebar-v2__block--account">
          <div class="shell-account-slot"></div>
        </div>
        <div class="sidebar-v2__block">
          <div class="sidebar-v2__context context-card"></div>
        </div>
      </div>
      <div class="sidebar-v2__footer-secondary">
        <span class="visually-hidden">Raccourcis</span>
        <div class="sidebar-v2__footer-shortcuts" role="toolbar" aria-label="Raccourcis module"></div>
      </div>
      <p class="sidebar-v2__status" aria-live="polite">
        <span class="sidebar-v2__status-dot" aria-hidden="true"></span>
        <span>Prêt · local</span>
      </p>
    </div>
  `;const i=document.createElement("select");i.className="control-select context-select shell-context-select",i.setAttribute("aria-label","Choisir le site ou la vue groupe");function o(){const y=Ne.activeSiteId;if(y&&[...i.options].find(k=>k.value===y)){i.value=y;return}const v=[...i.options].find(h=>h.dataset.legacy==="1"&&h.textContent===Ne.currentSite);if(v){i.value=v.value;return}i.value=""}async function s(){i.innerHTML="";const y=document.createElement("option");y.value="",y.textContent="Vue groupe (tous sites)",i.append(y);let v=!1;try{const h=await di();Array.isArray(h)&&h.length>0&&(v=!0,h.forEach(k=>{if(!(k!=null&&k.id))return;const _=document.createElement("option");_.value=k.id,_.textContent=k.code?`${k.name} (${k.code})`:k.name,i.append(_)}))}catch{}v||na.forEach(h=>{const k=document.createElement("option");k.value=`leg:${encodeURIComponent(h)}`,k.textContent=h,k.dataset.legacy="1",i.append(k)}),o()}i.addEventListener("change",()=>{const y=i.value,v=i.selectedOptions[0],h=v?v.textContent.trim():"";if(!y){a(null,"Vue groupe (tous sites)");return}if(y.startsWith("leg:")){try{a(null,decodeURIComponent(y.slice(4)))}catch{a(null,h)}return}a(y,h)}),n.querySelector(".context-card").append(i),s();const c=n.querySelector(".shell-account-slot");function l(){if(c.replaceChildren(),Or()){const _=Me(),f=document.createElement("div");f.className="sidebar-v2__account-card";const E=document.createElement("div");E.className="sidebar-v2__account-avatar";const w=((_==null?void 0:_.name)||"U").split(/\s+/).map(W=>W[0]).join("").slice(0,2).toUpperCase();E.textContent=w;const x=document.createElement("div");x.className="sidebar-v2__account-meta";const S=document.createElement("div");S.className="sidebar-v2__account-name",S.textContent=(_==null?void 0:_.name)||"Utilisateur";const N=document.createElement("div");N.className="sidebar-v2__account-role",N.textContent=(_==null?void 0:_.role)||"",x.append(S,N),f.append(E,x),c.append(f);const L=document.createElement("div");L.className="shell-account-actions";const D=document.createElement("button");D.type="button",D.className="sidebar-v2__btn-logout",D.textContent="Déconnexion",D.addEventListener("click",()=>{Se("/api/auth/logout",{method:"POST"}).catch(()=>{}),Ma(),typeof r=="function"&&r()});const q=document.createElement("button");q.type="button",q.className="sidebar-v2__btn-link",q.textContent="Changer de compte",q.addEventListener("click",()=>{Se("/api/auth/logout",{method:"POST"}).catch(()=>{}),Ma(),typeof r=="function"&&r(),window.location.hash="login"}),L.append(D,q),c.append(L);return}const v=document.createElement("select");v.className="control-select context-select shell-context-select",v.setAttribute("aria-label","Choisir un utilisateur pour les permissions"),v.title="Profil démo : filtre les entrées du menu selon le rôle.";const h=document.createElement("option");h.value="",h.textContent="— Mode libre —",v.append(h),c.append(v),(async function(){try{const f=await Se("/api/users");if(!f.ok)return;const E=await f.json();if(!Array.isArray(E))return;E.forEach(x=>{if(!(x!=null&&x.id))return;const S=document.createElement("option");S.value=x.id,S.textContent=`${x.name} (${x.role})`,v.append(S)});const w=Me();w&&E.some(x=>x.id===w.id)&&(v.value=w.id)}catch{}})(),v.addEventListener("change",()=>{const _=v.value;if(!_)pa(null);else{const f=v.selectedOptions[0],E=f?f.textContent.replace(/\s*\([^)]+\)\s*$/,"").trim():"",w=/\(([^)]+)\)\s*$/.exec((f==null?void 0:f.textContent)||""),x=w?w[1].trim():"TERRAIN";pa({id:_,name:E,role:x})}typeof r=="function"&&r()});const k=document.createElement("button");k.type="button",k.className="sidebar-v2__btn-ghost",k.textContent="Connexion",k.addEventListener("click",()=>{window.location.hash="login"}),c.append(k)}l();const d=n.querySelector(".sidebar-v2__nav"),u=new Map;jr.forEach((y,v)=>{var E;const h=document.createElement("section");h.className="sidebar-v2__group";const k=document.createElement("p");k.className="sidebar-v2__group-label",k.textContent=y.label,h.append(k);const _=document.createElement("div");_.className="sidebar-v2__items";const f=(E=Me())==null?void 0:E.role;if(y.items.forEach(w=>{if(!yt(f,w.id))return;const x=document.createElement("button");x.type="button";const S=e===w.id;x.className=`sidebar-v2__item${S?" sidebar-v2__item--active":""}`,x.setAttribute("aria-current",S?"page":"false");const N=document.createElement("span");N.className="sidebar-v2__item-icon",N.innerHTML=Cn(w.id);const L=document.createElement("span");if(L.className="sidebar-v2__item-text",L.textContent=w.label,w.id==="incidents"||w.id==="actions"){const D=document.createElement("span"),q=w.id==="incidents"?"incidents":"actions";D.className=`sidebar-v2__item-badge sidebar-v2__item-badge--${q}`,D.hidden=!0,D.setAttribute("aria-hidden","true"),u.set(w.id,D),x.append(N,L,D)}else x.append(N,L);x.addEventListener("click",()=>t(w.id)),_.append(x)}),h.append(_),d.append(h),v===2){const w=document.createElement("div");w.className="sidebar-v2__nav-divider",w.setAttribute("role","presentation"),d.append(w)}});const p=n.querySelector(".sidebar-v2__footer-shortcuts"),g=n.querySelector(".sidebar-v2__footer-secondary");if(p&&g){const y=[{pageId:"activity-log",label:"Journal",iconId:"activity-log"},{pageId:"settings",label:"Paramètres",iconId:"settings"},{pageId:"iso",label:"Sécurité",iconId:"iso"}],v=(b=Me())==null?void 0:b.role;y.forEach(h=>{if(!yt(v,h.pageId))return;const k=document.createElement("button");k.type="button",k.className="sidebar-v2__footer-shortcut sidebar-v2__footer-shortcut--icon-only",k.setAttribute("aria-label",h.label),k.title=h.label,e===h.pageId&&k.classList.add("sidebar-v2__footer-shortcut--active");const _=document.createElement("span");_.className="sidebar-v2__footer-shortcut-icon",_.innerHTML=Cn(h.iconId),k.append(_),k.addEventListener("click",()=>t(h.pageId)),p.append(k)}),p.children.length||(g.hidden=!0)}function m(y){const v=()=>{u.forEach(k=>{k.hidden=!0})};if(!y||typeof y!="object"){v();return}const h=(k,_)=>{const f=u.get(k);if(!f)return;const E=Math.max(0,Math.floor(Number(_)||0));if(E<1){f.hidden=!0,f.removeAttribute("title");return}f.hidden=!1,f.textContent=E>99?"99+":String(E),f.title=k==="incidents"?"Incidents critiques (aperçu récent)":"Actions en retard"};h("incidents",y.incidents),h("actions",y.overdueActions)}return n.refreshNavBadges=m,n}function C(e,t="success"){const a=document.querySelector(".app-toast");a&&a.remove();const r=t==="error"?"error":t==="info"?"info":t==="warning"?"warning":"success",n=document.createElement("div");n.className=`app-toast app-toast--${r}`,n.setAttribute("role","status"),n.setAttribute("aria-live","polite"),n.textContent=e,document.body.append(n),requestAnimationFrame(()=>{requestAnimationFrame(()=>n.classList.add("app-toast--in"))});const i=window.setTimeout(()=>n.remove(),2800);n.addEventListener("click",()=>{window.clearTimeout(i),n.remove()},{once:!0})}const An="qhse-topbar-v2-styles";function Js(){if(document.getElementById(An))return;const e=document.createElement("style");e.id=An,e.textContent=`
.topbar-v2 {
  position: sticky;
  top: 0;
  z-index: var(--z-topbar);
  flex-shrink: 0;
  min-height: 58px;
  height: auto;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 6px var(--space-4);
  background: linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 94%, var(--color-subtle)) 0%, var(--color-surface) 100%);
  border-bottom: 1px solid color-mix(in srgb, var(--color-border) 92%, transparent);
  box-shadow: var(--shadow-sm);
  font-family: var(--font-body);
}
.topbar-v2__inner {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  width: 100%;
  min-width: 0;
  height: 100%;
}
.topbar-v2__lead {
  flex: 0 1 42%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
}
.topbar-v2__page-title {
  margin: 0;
  padding: 0;
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.25;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: min(420px, 38vw);
}
.topbar-v2__lead .topbar-v2__breadcrumb {
  opacity: 0.92;
}
.topbar-v2__breadcrumb {
  flex: 0 1 auto;
  min-width: 0;
}
.topbar-v2__breadcrumb-nav {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  font-size: 11.5px;
  line-height: 1.35;
  color: var(--color-text-muted);
}
.topbar-v2__breadcrumb-sep {
  color: var(--color-text-muted);
  user-select: none;
  font-weight: 500;
}
.topbar-v2__breadcrumb-link {
  border: none;
  background: none;
  padding: 0;
  margin: 0;
  font: inherit;
  font-size: inherit;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: color 160ms ease;
  text-decoration: none;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.topbar-v2__breadcrumb-link:hover {
  color: var(--color-primary-text);
}
.topbar-v2__breadcrumb-current {
  font-weight: 600;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 280px;
}
.topbar-v2__breadcrumb-static {
  font-weight: 500;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 160px;
}
.topbar-v2__center {
  flex: 1 1 200px;
  min-width: 0;
  display: flex;
  justify-content: center;
}
.topbar-v2 .shell-quick-search {
  position: relative;
  width: 100%;
  max-width: 420px;
}
.topbar-v2 .shell-search-icon {
  position: absolute;
  left: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  color: var(--color-text-muted);
  pointer-events: none;
}
.topbar-v2 .shell-quick-search-input {
  width: 100%;
  box-sizing: border-box;
  padding: var(--space-2) var(--space-3) var(--space-2) 40px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-subtle);
  color: var(--color-text);
  font-family: inherit;
  font-size: 14px;
  line-height: 1.4;
  transition: border-color 150ms ease, background 150ms ease, box-shadow 150ms ease;
}
.topbar-v2 .shell-quick-search-input:hover {
  border-color: var(--color-primary-border);
  background: var(--color-surface);
}
.topbar-v2 .shell-quick-search-input:focus {
  outline: none;
  border-color: var(--color-primary-border);
  background: var(--color-surface);
  box-shadow: 0 0 0 2px var(--color-primary-bg);
}
.topbar-v2 .shell-quick-search:focus-within .shell-search-icon {
  color: var(--color-primary-text);
}
.topbar-v2 .shell-quick-search-results {
  position: absolute;
  top: calc(100% + var(--space-1));
  left: 0;
  right: 0;
  margin: 0;
  padding: var(--space-2);
  list-style: none;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
  max-height: 320px;
  overflow-y: auto;
  z-index: calc(var(--z-topbar) + 1);
}
.topbar-v2 .shell-search-result-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-1);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: background 150ms ease;
}
.topbar-v2 .shell-search-result-btn:hover {
  background: var(--color-subtle);
}
.topbar-v2 .shell-search-result-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}
.topbar-v2 .shell-search-result-group {
  font-size: 12px;
  color: var(--color-text-muted);
}
.topbar-v2 .shell-search-empty {
  padding: var(--space-3);
  font-size: 13px;
  color: var(--color-text-muted);
}
.topbar-v2__trailing {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.topbar-v2__quick-wrap {
  position: relative;
}
.topbar-v2__quick {
  min-height: 36px;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid color-mix(in srgb, var(--color-primary-border) 55%, var(--color-border));
  background: color-mix(in srgb, var(--color-primary-bg) 88%, var(--color-surface));
  color: var(--color-primary-text);
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 160ms cubic-bezier(0.33, 1, 0.68, 1),
    border-color 160ms cubic-bezier(0.33, 1, 0.68, 1);
  white-space: nowrap;
}
.topbar-v2__quick:hover {
  background: color-mix(in srgb, var(--color-primary-bg) 96%, var(--color-surface));
  border-color: color-mix(in srgb, var(--color-primary-border) 72%, var(--color-border));
}
.topbar-v2__quick[aria-expanded="true"] {
  border-color: var(--color-primary-border);
  background: var(--color-primary-bg);
}
.topbar-v2__quick-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  margin: 0;
  padding: var(--space-2);
  list-style: none;
  min-width: 220px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
  z-index: calc(var(--z-topbar) + 2);
  transform-origin: top right;
}
.topbar-v2__quick-menu[hidden] {
  display: none !important;
}
.topbar-v2__quick-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: var(--space-2) var(--space-3);
  margin: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms ease;
}
.topbar-v2__quick-item:hover {
  background: var(--color-subtle);
}
.topbar-v2__ai {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 36px;
  min-width: 36px;
  height: 36px;
  padding: 0;
  border-radius: var(--radius-md);
  border: 1px solid color-mix(in srgb, var(--color-border) 80%, transparent);
  background: transparent;
  color: var(--color-text-muted);
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition: background 150ms ease, border-color 150ms ease, color 150ms ease;
}
.topbar-v2__ai:hover {
  background: var(--color-subtle);
  border-color: var(--color-border);
  color: var(--color-primary-text);
}
.topbar-v2__profile-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  cursor: pointer;
  transition: box-shadow 150ms ease, transform 150ms ease;
}
.topbar-v2__profile-btn:focus-visible {
  outline: none;
  box-shadow: var(--ds-shadow-focus, 0 0 0 2px var(--color-primary-bg));
}
.topbar-v2__profile-btn:hover .topbar-v2__avatar {
  filter: brightness(var(--effect-brightness-hover, 1.06));
}
.display-mode-toggle {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 20px;
  border: 1px solid color-mix(in srgb, var(--color-border) 90%, transparent);
  background: color-mix(in srgb, var(--color-subtle) 40%, transparent);
  color: var(--color-text-muted);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms ease;
  white-space: nowrap;
}
.display-mode-toggle:hover {
  border-color: color-mix(in srgb, var(--color-primary-border) 55%, var(--color-border));
  color: var(--color-text-secondary);
  background: var(--color-subtle);
}
[data-display-mode="simple"] .display-mode-toggle {
  border-color: var(--color-primary-border);
  color: var(--color-primary-text);
  background: var(--color-primary-bg);
}
@media (max-width: 1100px) {
  .topbar-v2__inner {
    gap: var(--space-2);
  }
  .topbar-v2 .display-mode-label {
    display: none;
  }
  .topbar-v2__breadcrumb-current {
    max-width: 140px;
  }
  .topbar-v2__page-title {
    max-width: min(280px, 52vw);
    font-size: 15px;
  }
  .topbar-v2 .shell-quick-search {
    max-width: min(420px, 36vw);
  }
}
.topbar-v2__notif-wrap {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}
.topbar-v2__notif {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition:
    background 180ms cubic-bezier(0.33, 1, 0.68, 1),
    border-color 180ms cubic-bezier(0.33, 1, 0.68, 1),
    color 180ms cubic-bezier(0.33, 1, 0.68, 1),
    opacity 120ms ease;
}
.topbar-v2__notif:hover {
  background: var(--color-subtle);
  color: var(--color-text);
  border-color: color-mix(in srgb, var(--color-primary-border) 45%, var(--color-border));
}
.topbar-v2__notif:active {
  opacity: 0.92;
}
.topbar-v2__notif-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}
.topbar-v2__notif-badge {
  position: absolute;
  top: -3px;
  right: -3px;
  z-index: 2;
  min-width: 15px;
  height: 15px;
  padding: 0 4px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 800;
  line-height: 15px;
  text-align: center;
  background: var(--palette-accent, var(--app-accent, #14b8a6));
  color: #fff;
  border: 2px solid var(--color-surface);
  box-sizing: border-box;
  display: none;
  pointer-events: none;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}
.topbar-v2__notif-badge--visible {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.topbar-v2__avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 800;
  color: var(--color-primary-text);
  background: var(--color-primary-bg);
  border: 1px solid var(--color-primary-border);
  flex-shrink: 0;
}
`,document.head.append(e)}function Sa(e){window.location.hash=e}const Ks='<svg class="topbar-v2-bell-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.3 21a1.94 1.94 0 0 0 4 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';function Xs(e){const t=((e==null?void 0:e.name)||(e==null?void 0:e.email)||"Utilisateur").trim(),a=t.split(/\s+/).filter(Boolean);if(a.length>=2){const r=a[0][0]||"",n=a[a.length-1][0]||"";return(r+n).toUpperCase()}return t.slice(0,2).toUpperCase()||"U"}function Zs(e,t,a,r={}){const{omitCurrentPage:n=!1}=r;e.replaceChildren();let i=Rs(t);n&&i.length>1&&(i=i.slice(0,-1));const o=document.createElement("nav");o.className="topbar-v2__breadcrumb-nav",o.setAttribute("aria-label","Fil d'Ariane"),i.forEach((s,c)=>{if(c>0){const d=document.createElement("span");d.className="topbar-v2__breadcrumb-sep",d.setAttribute("aria-hidden","true"),d.textContent="›",o.append(d)}if(c===i.length-1){const d=document.createElement("span");d.className="topbar-v2__breadcrumb-current",d.textContent=s.label,d.setAttribute("aria-current","page"),o.append(d)}else if(s.pageId){const d=document.createElement("button");d.type="button",d.className="topbar-v2__breadcrumb-link",d.textContent=s.label,d.addEventListener("click",()=>{typeof a=="function"?a(s.pageId):Sa(s.pageId)}),o.append(d)}else{const d=document.createElement("span");d.className="topbar-v2__breadcrumb-static",d.textContent=s.label,o.append(d)}}),e.append(o)}function ec(e){var r;const t=ga[e],a=Do(e);return(t==null?void 0:t.title)||((r=a==null?void 0:a.item)==null?void 0:r.label)||"Module"}function tc({currentPage:e,sessionUser:t,unreadCount:a,onToggleNotifications:r,onNavigate:n}){Js();const i=document.createElement("header");i.className="topbar-v2";const o=t==null?void 0:t.role,s=Math.max(0,Number(a)||0),c=s>99?"99+":String(s),l=Ts();i.innerHTML=`
    <div class="topbar-v2__inner">
      <div class="topbar-v2__lead">
        <p class="topbar-v2__page-title" data-tb2-page-title></p>
        <div class="topbar-v2__breadcrumb" data-tb2-breadcrumb></div>
      </div>
      <div class="topbar-v2__center">
        <div class="shell-quick-search" role="search">
          <label class="visually-hidden" for="tb2-shell-quick-search-input">Rechercher un module</label>
          <span class="shell-search-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </span>
          <input
            id="tb2-shell-quick-search-input"
            type="search"
            class="shell-quick-search-input"
            placeholder="Rechercher…"
            autocomplete="off"
            spellcheck="false"
          />
          <ul class="shell-quick-search-results" hidden></ul>
        </div>
      </div>
      <div class="topbar-v2__trailing">
        <span class="topbar-v2__notif-wrap">
          <button type="button" class="topbar-v2__notif notification-toggle" aria-label="Notifications${s?` (${s} non lues)`:""}">
            <span class="topbar-v2__notif-icon" aria-hidden="true">${Ks}</span>
          </button>
          <span class="topbar-v2__notif-badge${s?" topbar-v2__notif-badge--visible":""}" ${s?"":"hidden"} data-notif-badge>${c}</span>
        </span>
        <div class="topbar-v2__quick-wrap">
          <button type="button" class="topbar-v2__quick topbar-quick-add" aria-expanded="false" aria-haspopup="true" aria-controls="topbar-quick-menu" id="topbar-quick-btn">Créer</button>
          <ul class="topbar-v2__quick-menu" id="topbar-quick-menu" role="menu" aria-labelledby="topbar-quick-btn" hidden></ul>
        </div>
        <button type="button" class="topbar-v2__ai topbar-ai-btn topbar-v2__ai--subtle" aria-label="Centre IA">
          <span aria-hidden="true">✦</span>
        </button>
        <button type="button" class="topbar-v2__profile-btn topbar-v2__avatar-wrap" aria-label="Ouvrir les paramètres">
          <span class="topbar-v2__avatar" aria-hidden="true"></span>
          <span class="visually-hidden topbar-v2__user-name"></span>
        </button>
        <button type="button" class="display-mode-toggle" data-mode="${l}" aria-label="Basculer le mode d'affichage">
          <svg class="display-mode-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="8" height="8" rx="1"/>
            <rect x="13" y="3" width="8" height="8" rx="1"/>
            <rect x="3" y="13" width="8" height="8" rx="1"/>
            <rect x="13" y="13" width="8" height="8" rx="1" opacity="0.4"/>
          </svg>
          <span class="display-mode-label">${l==="simple"?"Expert":"Simplifié"}</span>
        </button>
      </div>
    </div>
  `;const d=i.querySelector("[data-tb2-page-title]");d&&(d.textContent=ec(e));const u=i.querySelector("[data-tb2-breadcrumb]");u&&Zs(u,e,n,{omitCurrentPage:!0});const p=i.querySelector(".topbar-v2__avatar"),g=i.querySelector(".topbar-v2__user-name");function m(){return Ds().filter(W=>yt(o,W.id))}p&&(p.textContent=Xs(t)),g&&(g.textContent=(t==null?void 0:t.name)||(t==null?void 0:t.email)||"Utilisateur");const b=i.querySelector(".shell-quick-search-input"),y=i.querySelector(".shell-quick-search-results"),v=i.querySelector(".shell-quick-search");function h(W){if(!y)return;const K=(W||"").trim().toLowerCase();if(y.replaceChildren(),!K){y.hidden=!0;return}const A=m().filter(z=>z.label.toLowerCase().includes(K)||z.groupLabel.toLowerCase().includes(K));if(A.slice(0,8).forEach(z=>{const R=document.createElement("li"),V=document.createElement("button");V.type="button",V.className="shell-search-result-btn",V.innerHTML=`<span class="shell-search-result-title">${z.label}</span><span class="shell-search-result-group">${z.groupLabel}</span>`,V.addEventListener("click",()=>{b&&(b.value=""),y.hidden=!0,typeof n=="function"?n(z.id):Sa(z.id)}),R.append(V),y.append(R)}),A.length===0){const z=document.createElement("li");z.className="shell-search-empty",z.textContent="Aucun module correspondant",y.append(z)}y.hidden=!1}function k(W){v&&!v.contains(W.target)&&(y&&(y.hidden=!0),document.removeEventListener("click",k,!0))}b&&y&&(b.addEventListener("input",()=>h(b.value)),b.addEventListener("focus",()=>{document.addEventListener("click",k,!0),b.value.trim()&&h(b.value)}),b.addEventListener("keydown",W=>{W.key==="Escape"&&(y.hidden=!0,b.blur())}));const _=i.querySelector(".display-mode-toggle");_&&_.addEventListener("click",()=>{const K=_.dataset.mode==="simple"?"expert":"simple";Ro(K),_.dataset.mode=K;const A=_.querySelector(".display-mode-label");A&&(A.textContent=K==="simple"?"Expert":"Simplifié")});const f=i.querySelector(".notification-toggle");f&&f.addEventListener("click",r);const E=i.querySelector(".topbar-ai-btn");E&&o&&!yt(o,"ai-center")&&(E.style.display="none"),E&&E.addEventListener("click",()=>{typeof n=="function"?n("ai-center"):Sa("ai-center")});const w=i.querySelector(".topbar-quick-add"),x=i.querySelector("#topbar-quick-menu"),S=i.querySelector(".topbar-v2__quick-wrap");if(w&&x&&S){let K=function(){x.hidden||(x.hidden=!0,w.setAttribute("aria-expanded","false"),document.removeEventListener("click",I,!0),document.removeEventListener("keydown",A,!0))},A=function(z){z.key==="Escape"&&(z.preventDefault(),K())},I=function(z){S.contains(z.target)||K()};var L=K,D=A,q=I;const W=[{label:"Incident",pageId:"incidents",toast:"Saisie incident — utilisez le module Incidents."},{label:"Action",pageId:"actions",toast:"Nouvelle action — depuis le plan d’actions."},{label:"Audit",pageId:"audits",toast:"Audit — renseignez le module Audits."}];x.replaceChildren(),W.forEach(z=>{if(o&&!yt(o,z.pageId))return;const R=document.createElement("li"),V=document.createElement("button");V.type="button",V.className="topbar-v2__quick-item",V.setAttribute("role","menuitem"),V.textContent=z.label,V.addEventListener("click",()=>{K(),C(z.toast,"info"),typeof n=="function"?n(z.pageId):Sa(z.pageId)}),R.append(V),x.append(R)}),x.querySelector("li")||(w.style.display="none"),w.addEventListener("click",z=>{if(z.stopPropagation(),!!x.querySelector("li")){if(!x.hidden){K();return}x.hidden=!1,w.setAttribute("aria-expanded","true"),document.addEventListener("click",I,!0),document.addEventListener("keydown",A,!0)}})}const N=i.querySelector(".topbar-v2__profile-btn");return N&&N.addEventListener("click",()=>{typeof n=="function"?n("settings"):Sa("settings")}),i}const zn="qhse-notifications-panel-styles",ac=`
.notif-panel .notifications-list{gap:10px}
.notif-panel-head-lead{margin:6px 0 0;font-size:13px;color:var(--text2);max-width:46ch;line-height:1.45}
.notif-item{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:start;padding:12px 14px;border-radius:14px;border:1px solid rgba(148,163,184,.12);background:rgba(255,255,255,.03);position:relative;overflow:hidden}
.notif-item::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;border-radius:14px 0 0 14px}
.notif-item--incident::before{background:linear-gradient(180deg,var(--palette-warning,#f59e0b),color-mix(in srgb,var(--palette-warning) 65%,#000))}
.notif-item--action::before{background:linear-gradient(180deg,var(--palette-accent,#14b8a6),color-mix(in srgb,var(--palette-accent) 55%,#000))}
.notif-item--audit::before{background:linear-gradient(180deg,var(--palette-accent,#14b8a6),color-mix(in srgb,var(--palette-accent) 50%,#0f766e))}
.notif-item--info::before{background:linear-gradient(180deg,#94a3b8,#64748b)}
.notif-item.unread{background:rgba(77,160,255,.06);border-color:rgba(77,160,255,.2)}
.notif-item__icon{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;font-size:16px;font-weight:800;flex-shrink:0}
.notif-item--incident .notif-item__icon{background:var(--color-warning-bg);color:var(--color-text-warning)}
.notif-item--action .notif-item__icon{background:var(--color-primary-bg);color:var(--color-primary-text)}
.notif-item--audit .notif-item__icon{background:var(--color-primary-bg);color:var(--color-primary-text)}
.notif-item--info .notif-item__icon{background:rgba(148,163,184,.15);color:#cbd5e1}
.notif-item__body{min-width:0}
.notif-item__type-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:6px}
.notif-item__chip{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.notif-prio-tag{font-size:10px;font-weight:800;padding:3px 8px;border-radius:999px;letter-spacing:.03em}
.notif-prio-tag--critical{background:var(--color-danger-bg);color:var(--color-text-danger)}
.notif-prio-tag--high{background:var(--color-warning-bg);color:var(--color-text-warning)}
.notif-prio-tag--normal{background:var(--color-primary-bg);color:var(--color-primary-text)}
.notif-prio-tag--low{background:rgba(148,163,184,.15);color:#e2e8f0}
.notif-item__title{margin:0 0 4px;font-size:14px;font-weight:700;line-height:1.35;color:var(--text)}
.notif-item__detail{margin:0 0 8px;font-size:13px;line-height:1.45;color:var(--text2)}
.notif-item__meta{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:12px;color:var(--text3);margin-bottom:8px}
.notif-item__time{font-variant-numeric:tabular-nums;font-weight:600;color:var(--text2)}
.notif-item__meta-sep{opacity:.5}
.notif-item__ref{font-weight:700;color:var(--text)}
.notif-item__actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.notif-item__link-btn{font-weight:700;padding:6px 0}
.notif-item__status{display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0}
.notif-item__dot{width:8px;height:8px;border-radius:50%;background:rgba(77,160,255,.9);box-shadow:0 0 0 3px rgba(77,160,255,.2)}
.notif-item:not(.unread) .notif-item__dot{display:none}
`;function ic(){if(document.getElementById(zn))return;const e=document.createElement("style");e.id=zn,e.textContent=ac,document.head.append(e)}const ot=[];function rc(e){switch(e.kind){case"incident":{const t=/^Incident critique — (.+)$/.exec(e.title);return{page:"incidents",ref:t?t[1].trim():null}}case"action":case"action_assigned":return{page:"actions",ref:null};case"nonconformity":{const t=/^Non-conformité ouverte — (.+)$/.exec(e.title);return{page:"audits",ref:t?t[1].trim():null}}case"audit":{const t=/^Audit récent — (.+)$/.exec(e.title);return{page:"audits",ref:t?t[1].trim():null}}default:return null}}function nc(e){return e==="critical"?"critical":e==="warning"?"high":"normal"}function oc(e){if(!e||typeof e!="object")return null;const t=e.id,a=e.kind,r=e.title,n=e.detail,i=e.level,o=!!e.read,s=e.timestamp??"";if(typeof t!="string"||typeof a!="string")return null;const c=rc({kind:a,title:r});return{id:t,kind:a,title:String(r??""),detail:String(n??""),level:String(i??"info"),read:o,timestamp:s,priority:nc(i),...c?{link:c}:{}}}async function Oo(){try{const e=await Se("/api/notifications");if(e.status===401||e.status===403){ot.splice(0,ot.length);return}if(!e.ok){ot.splice(0,ot.length),e.status>=500&&C("Notifications indisponibles (serveur).","warning");return}const t=await e.json();if(!Array.isArray(t)){ot.splice(0,ot.length);return}const a=t.map(oc).filter(Boolean);ot.splice(0,ot.length,...a)}catch(e){console.error("[notifications] GET /api/notifications",e),ot.splice(0,ot.length),C("Réseau ou API indisponible (notifications).","warning")}}const Za={all(){return ot},unreadCount(){return ot.filter(e=>!e.read).length},markRead(e){const t=ot.find(a=>String(a.id)===String(e));t&&(t.read=!0)},markAllRead(){ot.forEach(e=>{e.read=!0})}},Ho={incident:{chip:"Incident critique",icon:"!",className:"notif-item--incident"},action:{chip:"Action en retard",icon:"⏱",className:"notif-item--action"},action_assigned:{chip:"Action assignée",icon:"✓",className:"notif-item--info"},audit:{chip:"Audit",icon:"☑",className:"notif-item--audit"},nonconformity:{chip:"Non-conformité",icon:"⚠",className:"notif-item--action"},info:{chip:"Information",icon:"◆",className:"notif-item--info"}},Fo={critical:{label:"Priorité critique",className:"notif-prio-tag--critical"},high:{label:"Priorité élevée",className:"notif-prio-tag--high"},normal:{label:"Priorité normale",className:"notif-prio-tag--normal"},low:{label:"Priorité basse",className:"notif-prio-tag--low"}};function Vo(e){if(e.kind&&Ho[e.kind])return e.kind;const t=`${e.title||""} ${e.detail||""}`.toLowerCase();return t.includes("audit")?"audit":e.kind==="action_assigned"?"action_assigned":t.includes("action")&&t.includes("retard")?"action":t.includes("assignée")||t.includes("assignee")?"action_assigned":t.includes("incident")||e.level==="critical"?"incident":"info"}function sc(e){if(e.priority&&Fo[e.priority])return e.priority;const t=Vo(e);return t==="incident"?"critical":t==="action"||t==="audit"?"high":"normal"}function cc(e,t){return e.read?"blue":t==="incident"?"red":t==="action"||t==="nonconformity"?"amber":"blue"}function lc(e){return!e||!e.page?"":e.ref?"Ouvrir":"Voir le module"}function dc(e,t={}){const{onOpenLink:a}=t,r=Vo(e),n=Ho[r],i=sc(e),o=Fo[i],s=document.createElement("article");s.className=`notif-item ${n.className} ${e.read?"":"unread"}`;const c=document.createElement("div");c.className="notif-item__icon",c.setAttribute("aria-hidden","true"),c.textContent=n.icon;const l=document.createElement("div");l.className="notif-item__body";const d=document.createElement("div");d.className="notif-item__type-row";const u=document.createElement("span");u.className="notif-item__chip",u.textContent=n.chip;const p=document.createElement("span");p.className=`notif-prio-tag ${o.className}`,p.textContent=o.label,d.append(u,p);const g=document.createElement("p");g.className="notif-item__title",g.textContent=e.title;const m=document.createElement("p");m.className="notif-item__detail",m.textContent=e.detail;const b=document.createElement("div");b.className="notif-item__meta";const y=document.createElement("span");if(y.className="notif-item__time",y.textContent=e.timestamp||"—",b.append(y),e.link&&e.link.ref){const k=document.createElement("span");k.className="notif-item__meta-sep",k.setAttribute("aria-hidden","true"),k.textContent="·";const _=document.createElement("span");_.className="notif-item__ref",_.textContent=`Réf. ${e.link.ref}`,b.append(k,_)}if(l.append(d,g,m,b),e.link&&e.link.page){const k=document.createElement("div");k.className="notif-item__actions";const _=document.createElement("button");_.type="button",_.className="text-button notif-item__link-btn",_.textContent=lc(e.link),_.addEventListener("click",f=>{f.preventDefault(),f.stopPropagation(),Za.markRead(e.id);const E={id:e.id,page:e.link.page,ref:e.link.ref||null};typeof a=="function"?a(E):window.location.hash=E.page}),k.append(_),l.append(k)}const v=document.createElement("div");v.className="notif-item__status";const h=document.createElement("span");if(h.className=`badge ${cc(e,r)}`,h.textContent=e.read?"Lu":"Nouveau",v.append(h),!e.read){const k=document.createElement("span");k.className="notif-item__dot",k.title="Non lu",v.append(k)}return s.append(c,l,v),s}function pc({notifications:e,onMarkAllRead:t,onClose:a,onOpenLink:r}){ic();const n=document.createElement("section");n.className="floating-panel card-soft notif-panel",n.innerHTML=`
    <div class="floating-panel-head">
      <div>
        <div class="section-kicker">Notifications</div>
        <h3>Centre d’alertes</h3>
        <p class="notif-panel-head-lead">
          Lecture rapide : type, priorité, horodatage et lien métier (mock). Les actions « Ouvrir » préparent la navigation par module.
        </p>
      </div>
      <div class="inline-actions">
        <button type="button" class="text-button mark-all">Tout lire</button>
        <button type="button" class="text-button close-panel">Fermer</button>
      </div>
    </div>
    <div class="stack notifications-list"></div>
  `;const i=n.querySelector(".notifications-list");return e.forEach(o=>{i.append(dc(o,{onOpenLink:r}))}),n.querySelector(".mark-all").addEventListener("click",t),n.querySelector(".close-panel").addEventListener("click",a),n}function uc({sessionUser:e=null,incidents:t=0,overdueActionItems:a=[],criticalIncidents:r=[]}={}){const n=document.createElement("div");n.className="dashboard-today-block",n.setAttribute("role","region"),n.setAttribute("aria-label","Aujourd'hui");let i={sessionUser:e,incidents:t,overdueActionItems:a,criticalIncidents:r};function o(){const s=i.sessionUser,c=(s==null?void 0:s.name)||(s==null?void 0:s.email)||"Utilisateur",l=Array.isArray(i.overdueActionItems)?i.overdueActionItems.length:0,d=Array.isArray(i.criticalIncidents)?i.criticalIncidents.length:0,u=typeof i.incidents=="number"&&!Number.isNaN(i.incidents)?i.incidents:0;n.innerHTML=`
      <div class="dashboard-today-block__inner">
        <div class="dashboard-today-block__title">Aujourd'hui</div>
        <div class="dashboard-today-block__greet">${mc(c)}</div>
        <div class="dashboard-today-block__stats">
          <span class="dashboard-today-block__stat"><strong>${u}</strong> incidents (total)</span>
          <span class="dashboard-today-block__stat"><strong>${d}</strong> incidents critiques</span>
          <span class="dashboard-today-block__stat"><strong>${l}</strong> actions en retard</span>
        </div>
      </div>
    `}return n.update=s=>{i={...i,...s},o()},o(),n}function mc(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}const $n="qhse-dashboard-module-styles",gc=`
/* —— Hiérarchie direction : CEO → priorités → cockpit (pression) → analyse → activité —— */
.dashboard-page.page-stack{gap:20px}
.dashboard-band{display:flex;flex-direction:column;gap:20px;min-width:0}
.dashboard-band--ceo{
  margin:0 0 2px;
  padding:0;
  border-radius:var(--ds-radius-lg,22px);
  overflow:hidden;
}
.dashboard-band--priority{
  padding:16px 16px 20px;
  margin:2px 0 4px;
  border-radius:var(--ds-radius-lg,20px);
  border:1px solid rgba(61,184,154,.16);
  background:linear-gradient(165deg,rgba(61,184,154,.07) 0%,rgba(18,24,32,.42) 48%,rgba(12,16,22,.28) 100%);
  box-shadow:0 6px 32px rgba(0,0,0,.14);
}
.dashboard-band--cockpit{
  padding:20px 18px 24px;
  margin:4px 0 6px;
  border-radius:var(--ds-radius-lg,20px);
  background:linear-gradient(165deg,rgba(20,184,166,.08) 0%,rgba(18,24,36,.52) 40%,rgba(12,16,24,.32) 100%);
  border:1px solid rgba(20,184,166,.14);
  box-shadow:0 8px 44px rgba(0,0,0,.2),0 0 0 1px rgba(255,255,255,.035) inset;
}
.dashboard-band--alerts{
  padding:18px 16px 22px;
  margin:4px 0 8px;
  border-radius:var(--ds-radius-lg,20px);
  border:1px solid rgba(239,91,107,.14);
  background:linear-gradient(165deg,rgba(239,91,107,.05) 0%,rgba(18,22,30,.5) 55%,rgba(12,16,22,.35) 100%);
  box-shadow:0 6px 40px rgba(0,0,0,.18);
}
.dashboard-band--cockpit .dashboard-alerts-prio-card{
  border-color:rgba(232,93,108,.2);
  box-shadow:0 12px 44px rgba(0,0,0,.22),0 0 0 1px rgba(239,91,107,.08);
}
.dashboard-band--analysis{
  padding:8px 2px 12px;
  gap:20px;
  opacity:.985;
}
.dashboard-band--analysis .dashboard-section-title{
  font-size:clamp(16px,1.5vw,19px);
}
.dashboard-band--actions{
  padding:18px 16px 22px;
  margin:6px 0 4px;
  border-radius:var(--ds-radius-lg,20px);
  border:1px solid rgba(61,184,154,.14);
  background:linear-gradient(165deg,rgba(61,184,154,.06) 0%,rgba(18,24,32,.45) 50%,transparent 100%);
  box-shadow:0 6px 36px rgba(0,0,0,.16);
}
.dashboard-band--situation{
  padding:22px 18px 26px;
  margin:2px 0 6px;
  border-radius:var(--ds-radius-lg,20px);
  background:linear-gradient(165deg,rgba(20,184,166,.09) 0%,rgba(18,24,36,.55) 42%,rgba(12,16,24,.35) 100%);
  border:1px solid rgba(20,184,166,.16);
  box-shadow:0 8px 48px rgba(0,0,0,.22),0 0 0 1px rgba(255,255,255,.04) inset,0 1px 0 rgba(255,255,255,.06) inset;
}
.dashboard-band--secondary{
  padding:4px 2px 8px;
  gap:22px;
}
.dashboard-band--tertiary{
  padding:20px 14px 10px;
  margin-top:6px;
  border-radius:var(--ds-radius-lg,20px);
  border:1px solid rgba(148,163,184,.1);
  background:linear-gradient(180deg,rgba(255,255,255,.02) 0%,rgba(0,0,0,.06) 100%);
  box-shadow:0 -1px 0 rgba(255,255,255,.03) inset;
}
.dashboard-band--tertiary .dashboard-section-head{margin-bottom:12px}
.dashboard-band--tertiary .dashboard-section-kicker{opacity:.88}
.dashboard-band--tertiary .dashboard-section-title{font-size:clamp(17px,1.65vw,21px);letter-spacing:-.02em}
.dashboard-band--tertiary .dashboard-section-sub{font-size:12px;max-width:60ch}
/* Bloc principal direction / CEO */
.dashboard-ceo-hero{
  position:relative;
  overflow:hidden;
  margin:0;
  padding:22px 22px 26px;
  border-radius:var(--ds-radius-lg,22px);
  border:1px solid rgba(20,184,166,.28);
  background:linear-gradient(128deg,rgba(16,22,32,.98) 0%,rgba(12,18,28,.97) 38%,rgba(18,32,36,.92) 100%);
  box-shadow:0 16px 64px rgba(0,0,0,.35),0 0 0 1px rgba(255,255,255,.06) inset,0 1px 0 rgba(255,255,255,.09) inset;
}
.dashboard-ceo-hero::before{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background:radial-gradient(ellipse 85% 65% at 88% -15%,rgba(20,184,166,.28),transparent 52%),
    radial-gradient(ellipse 55% 45% at 4% 102%,rgba(61,184,154,.12),transparent 48%);
}
.dashboard-ceo-hero__topbar{
  position:relative;
  z-index:1;
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  justify-content:space-between;
  gap:12px 16px;
  margin-bottom:18px;
}
.dashboard-ceo-hero__site{
  font-size:11px;
  font-weight:800;
  letter-spacing:.12em;
  text-transform:uppercase;
  color:rgba(186,210,255,.88);
}
.dashboard-ceo-hero__body{
  position:relative;
  z-index:1;
  display:grid;
  grid-template-columns:minmax(0,280px) minmax(0,1fr);
  gap:28px 36px;
  align-items:center;
}
@media (max-width:900px){
  .dashboard-ceo-hero__body{grid-template-columns:1fr;text-align:center}
  .dashboard-ceo-hero__text{text-align:left}
  .dashboard-ceo-hero__visual{margin:0 auto}
}
.dashboard-ceo-hero__visual{
  position:relative;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  padding:18px 14px 14px;
  border-radius:20px;
  border:1px solid rgba(148,163,184,.14);
  background:linear-gradient(165deg,rgba(0,0,0,.22) 0%,rgba(255,255,255,.04) 100%);
  box-shadow:0 8px 40px rgba(0,0,0,.2) inset,0 4px 24px rgba(0,0,0,.12);
  max-width:280px;
  width:100%;
  margin:0 auto;
}
.dashboard-ceo-hero__visual--ok{border-color:rgba(52,211,153,.22);box-shadow:0 0 0 1px rgba(52,211,153,.08),0 8px 40px rgba(0,0,0,.18) inset}
.dashboard-ceo-hero__visual--watch{border-color:rgba(251,191,36,.24)}
.dashboard-ceo-hero__visual--risk{border-color:rgba(248,113,113,.28)}
.dashboard-ceo-hero__status{
  position:absolute;
  top:14px;
  right:14px;
  font-size:10px;
  font-weight:800;
  letter-spacing:.1em;
  text-transform:uppercase;
  padding:6px 10px;
  border-radius:999px;
  border:1px solid rgba(148,163,184,.2);
  background:rgba(0,0,0,.25);
  color:var(--text2);
}
.dashboard-ceo-hero__status--ok{border-color:rgba(52,211,153,.45);color:#6ee7b7;background:rgba(52,211,153,.1)}
.dashboard-ceo-hero__status--watch{border-color:rgba(251,191,36,.5);color:#fde68a;background:rgba(245,158,11,.12)}
.dashboard-ceo-hero__status--risk{border-color:rgba(248,113,113,.55);color:#fecaca;background:rgba(239,91,107,.12)}
.dashboard-ceo-hero__ring-wrap{display:flex;justify-content:center;margin:4px 0 0;min-height:112px}
.dashboard-ceo-hero__svg{display:block;width:100%;max-width:200px;height:auto}
.dashboard-ceo-hero__scorenum{
  margin:6px 0 0;
  font-size:clamp(44px,6vw,56px);
  font-weight:800;
  letter-spacing:-.05em;
  line-height:1;
  font-variant-numeric:tabular-nums;
  color:var(--text);
  text-shadow:0 2px 28px rgba(0,0,0,.35);
}
.dashboard-ceo-hero__scorecaption{margin:10px 0 4px;font-size:13px;font-weight:700;line-height:1.35;color:var(--text);text-align:center;max-width:22ch}
.dashboard-ceo-hero__scorehint{margin:0;font-size:11px;line-height:1.4;color:var(--text3);text-align:center;max-width:26ch}
.dashboard-ceo-hero__text{min-width:0}
.dashboard-ceo-hero__eyebrow{margin:0 0 8px;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:rgba(45,212,191,.88)}
.dashboard-ceo-hero__title{margin:0 0 14px;font-size:clamp(22px,2.4vw,30px);font-weight:800;letter-spacing:-.035em;line-height:1.15;color:var(--text)}
.dashboard-ceo-hero__brief{margin:0 0 16px;font-size:15px;line-height:1.6;font-weight:500;color:var(--text2);max-width:62ch}
.dashboard-ceo-hero__legal-wrap{margin:12px 0 0;max-width:62ch;border-radius:12px;border:1px solid rgba(148,163,184,.1);background:rgba(0,0,0,.12);padding:8px 12px 10px}
.dashboard-ceo-hero__legal-summary{
  cursor:pointer;
  font-size:11px;
  font-weight:700;
  color:var(--text3);
  list-style:none;
  user-select:none;
  line-height:1.4;
}
.dashboard-ceo-hero__legal-summary::-webkit-details-marker{display:none}
.dashboard-ceo-hero__legal-wrap[open] .dashboard-ceo-hero__legal-summary{color:var(--text2)}
.dashboard-ceo-hero__legal{margin:10px 0 0;font-size:11px;line-height:1.45;color:var(--text3);max-width:58ch;opacity:.95}
.dashboard-chart-interpret{
  margin:6px 0 0;
  padding:7px 10px;
  border-radius:var(--ds-radius-sm,10px);
  border-left:2px solid rgba(20,184,166,.45);
  background:rgba(20,184,166,.06);
  font-size:11px;
  line-height:1.45;
  font-weight:600;
  color:var(--text2);
}
.dashboard-priority-now__footer{
  margin-top:16px;
  padding-top:14px;
  border-top:1px dashed rgba(148,163,184,.2);
  display:flex;
  justify-content:flex-start;
}
.dashboard-priority-now__cta{
  min-height:44px!important;
  padding:0 22px!important;
  font-weight:800!important;
  letter-spacing:.02em!important;
}
/* Hero classique (autres pages) : relief + lecture */
.hero.dashboard-hero{
  position:relative;
  overflow:hidden;
  border:1px solid rgba(20,184,166,.2);
  background:linear-gradient(125deg,rgba(20,26,34,.98) 0%,rgba(14,20,28,.95) 45%,rgba(18,30,34,.92) 100%);
  box-shadow:0 12px 48px rgba(0,0,0,.24),0 0 0 1px rgba(255,255,255,.05) inset;
}
.hero.dashboard-hero::before{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background:radial-gradient(ellipse 90% 70% at 92% -10%,rgba(20,184,166,.2),transparent 50%),
    radial-gradient(ellipse 60% 50% at 0% 100%,rgba(61,184,154,.08),transparent 45%);
}
.dashboard-hero__shell{position:relative;z-index:1}
.dashboard-hero__title{text-shadow:0 1px 24px rgba(0,0,0,.25)}
.dashboard-hero__lead--primary{font-size:clamp(14px,1.35vw,16px);font-weight:600;color:var(--text);max-width:62ch}
.dashboard-hero__lead--secondary{opacity:.92}
.dashboard-hero__cta--featured{
  min-height:46px!important;
  padding:0 24px!important;
  font-size:14px!important;
  font-weight:800!important;
  letter-spacing:.02em;
  border-color:rgba(120,180,255,.45)!important;
  box-shadow:0 6px 28px rgba(20,184,166,.38),0 1px 0 rgba(255,255,255,.12) inset!important;
  transition:transform .18s ease,box-shadow .18s ease!important;
}
@media (prefers-reduced-motion:no-preference){
  .dashboard-hero__cta--featured:hover{
    transform:translateY(-2px);
    box-shadow:0 10px 36px rgba(20,184,166,.48),0 1px 0 rgba(255,255,255,.14) inset!important;
  }
}
.dashboard-hero .dashboard-block-link{
  min-height:38px;
  padding:8px 14px;
  font-weight:700;
  border-radius:10px;
}
/* Raccourcis : tuile principale */
.dashboard-shortcuts__tile--featured{
  border-color:rgba(239,91,107,.35)!important;
  background:linear-gradient(145deg,rgba(239,91,107,.12),rgba(255,255,255,.04))!important;
  box-shadow:0 4px 24px rgba(239,91,107,.15),0 1px 0 rgba(255,255,255,.05) inset;
}
.dashboard-shortcuts__tile--featured .dashboard-shortcuts__tile-label{font-size:14px;font-weight:800}
@media (prefers-reduced-motion:no-preference){
  .dashboard-shortcuts__tile--featured:hover{
    border-color:rgba(239,91,107,.5)!important;
    box-shadow:0 8px 32px rgba(239,91,107,.22);
  }
}
/* KPI cartes */
.dashboard-kpi-card{
  border:1px solid rgba(148,163,184,.14);
  background:linear-gradient(165deg,rgba(255,255,255,.05) 0%,rgba(255,255,255,.02) 100%);
  box-shadow:0 4px 20px rgba(0,0,0,.1),0 1px 0 rgba(255,255,255,.04) inset;
  transition:border-color .2s ease,box-shadow .2s ease,transform .15s ease;
}
@media (prefers-reduced-motion:no-preference){
  .dashboard-kpi-card:hover{
    border-color:rgba(20,184,166,.22);
    box-shadow:0 8px 28px rgba(0,0,0,.14);
    transform:translateY(-1px);
  }
}
.dashboard-connectivity-slot{display:flex;justify-content:center;padding:8px 16px 4px;width:100%;box-sizing:border-box}
.dashboard-connectivity-card{max-width:560px;width:100%;margin:0 auto;padding:18px 20px;border:1px solid rgba(243,179,79,.5);background:linear-gradient(165deg,rgba(243,179,79,.08),rgba(20,28,40,.5));box-shadow:0 8px 32px rgba(0,0,0,.2)}
.dashboard-connectivity-title{margin:0 0 10px;font-size:17px;font-weight:800;letter-spacing:-.02em;line-height:1.2;color:var(--text);text-align:center}
.dashboard-connectivity-lead{margin:0 0 14px;font-size:13px;line-height:1.5;color:var(--text2);text-align:center;max-width:48ch;margin-left:auto;margin-right:auto}
.dashboard-connectivity-api-label{margin:0 0 6px;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);text-align:center}
.dashboard-connectivity-code{display:block;margin:0 auto 12px;padding:10px 12px;border-radius:var(--ds-radius-sm,10px);border:1px solid rgba(148,163,184,.2);background:rgba(0,0,0,.2);font-size:12px;font-weight:600;color:var(--accent-blue,#5eead4);text-align:center;word-break:break-all;max-width:100%;box-sizing:border-box}
.dashboard-connectivity-urlhint{margin:0 auto 12px;font-size:12px;line-height:1.45;color:var(--text2);text-align:center;max-width:48ch}
.dashboard-connectivity-filewarn{margin:0 auto 12px;padding:10px 12px;border-radius:var(--ds-radius-sm,10px);border:1px solid rgba(248,113,113,.4);background:rgba(248,113,113,.08);font-size:12px;font-weight:600;line-height:1.4;color:#fecaca;text-align:center;max-width:46ch}
.dashboard-connectivity-actions{display:flex;justify-content:center;margin:0 0 16px}
.dashboard-connectivity-retry{font-size:13px!important;padding:10px 18px!important}
.dashboard-connectivity-steps{margin:0;padding:0 0 0 22px;font-size:12px;line-height:1.55;color:var(--text2);max-width:52ch;margin-left:auto;margin-right:auto}
.dashboard-connectivity-steps li{margin-bottom:8px}
.dashboard-connectivity-steps li:last-child{margin-bottom:0}
.dashboard-section{display:flex;flex-direction:column;gap:12px;margin:0;padding:0 0 6px}
.dashboard-section--charts{gap:8px}
.dashboard-hero__actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:0;align-items:center}
.dashboard-hero__actions .dashboard-block-actions--hero{margin-left:auto}
@media (max-width:520px){.dashboard-hero__actions .dashboard-block-actions--hero{margin-left:0}}
.dashboard-left-stack{display:grid;gap:16px;min-width:0}
.dashboard-muted-lead{margin:6px 0 0;font-size:13px;line-height:1.45;color:var(--text2);max-width:52ch}
.dashboard-kpi-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px}
.dashboard-charts-disclaimer{margin:0;padding:10px 14px;border-radius:var(--ds-radius-sm,12px);border:1px solid rgba(20,184,166,.22);background:linear-gradient(90deg,rgba(20,184,166,.1),rgba(20,184,166,.04));font-size:12px;line-height:1.5;color:var(--text2);max-width:100%;box-shadow:0 2px 12px rgba(20,184,166,.08)}
.dashboard-charts-global-actions{margin:4px 0 0;padding:0 2px 2px}
.dashboard-charts-global-actions .dashboard-block-actions{margin-top:8px;padding-top:10px;border-top:1px dashed rgba(148,163,184,.16)}
.dashboard-charts-disclaimer strong{color:var(--text);font-weight:700}
.dashboard-charts-disclaimer code{font-size:11px;font-weight:600;color:var(--accent-blue, #5eead4);word-break:break-all}
.dashboard-charts-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:16px;align-items:stretch}
.dashboard-chart-card--dash-trend{grid-column:span 5}
.dashboard-chart-card--dash-types{grid-column:span 4}
.dashboard-chart-card--dash-mix{grid-column:span 3}
.dashboard-chart-card--dash-audit{grid-column:span 6}
.dashboard-chart-card--dash-load{grid-column:span 6}
@media (max-width:1180px){
.dashboard-chart-card--dash-trend{grid-column:span 6}
.dashboard-chart-card--dash-types{grid-column:span 6}
.dashboard-chart-card--dash-mix{grid-column:span 6}
.dashboard-chart-card--dash-audit{grid-column:span 6}
.dashboard-chart-card--dash-load{grid-column:span 6}
}
.dashboard-chart-card-head.content-card-head{margin-bottom:10px}
.content-card .dashboard-chart-h{margin:0 0 2px;font-size:16px;font-weight:800;letter-spacing:-.02em;line-height:1.25}
.dashboard-chart-lead{margin-top:4px;font-size:12px;line-height:1.35;max-width:none}
.dashboard-chart-card-inner{
  min-height:0;
  border:1px solid rgba(148,163,184,.14);
  background:linear-gradient(165deg,rgba(255,255,255,.045) 0%,rgba(255,255,255,.015) 55%,rgba(0,0,0,.04) 100%);
  box-shadow:0 6px 32px rgba(0,0,0,.14),0 1px 0 rgba(255,255,255,.04) inset;
}
.dashboard-band--analysis .dashboard-chart-card-inner:hover{
  border-color:rgba(20,184,166,.2);
  box-shadow:0 10px 40px rgba(0,0,0,.16);
}
.dashboard-line-chart-wrap{display:flex;flex-direction:column;gap:8px;width:100%}
.dashboard-line-chart-svg{width:100%;height:auto;max-height:220px;display:block;filter:drop-shadow(0 1px 8px rgba(20,184,166,.08))}
.dashboard-line-chart-wrap--theme-incidents .dashboard-line-chart-svg{filter:drop-shadow(0 2px 14px rgba(249,115,22,.12))}
.dashboard-line-chart-wrap--theme-audits .dashboard-line-chart-svg{filter:drop-shadow(0 2px 16px rgba(99,102,241,.14))}
.dashboard-line-chart-grid{stroke:var(--ds-chart-grid, rgba(148,163,184,.18));stroke-width:1}
.dashboard-line-chart-grid--base{stroke:var(--ds-chart-grid, rgba(148,163,184,.22));stroke-width:1.25}
.dashboard-line-chart-grid--mid{stroke:rgba(148,163,184,.1);stroke-width:1;stroke-dasharray:4 4}
.dashboard-line-chart-area{pointer-events:none}
.dashboard-line-chart-line{stroke:var(--ds-chart-line-primary, #2dd4bf);stroke-width:2.25;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 1px 2px rgba(20,184,166,.22))}
.dashboard-line-chart-dot{fill:var(--ds-surface-1, #141c28);stroke:var(--ds-chart-line-primary, #2dd4bf);stroke-width:2;filter:drop-shadow(0 1px 2px rgba(0,0,0,.25))}
.dashboard-line-chart-wrap--theme-incidents .dashboard-line-chart-line{stroke:#ea580c;stroke-width:2.6;filter:drop-shadow(0 2px 8px rgba(234,88,12,.28))}
.dashboard-line-chart-wrap--theme-incidents .dashboard-line-chart-dot{stroke:#ea580c;fill:var(--color-background-primary, var(--ds-surface-1));stroke-width:2.25}
.dashboard-line-chart-wrap--theme-audits .dashboard-line-chart-line{stroke:#6366f1;stroke-width:2.75;filter:drop-shadow(0 2px 10px rgba(99,102,241,.33))}
.dashboard-line-chart-wrap--theme-audits .dashboard-line-chart-dot{stroke:#6366f1;fill:var(--color-background-primary, var(--ds-surface-1));stroke-width:2.25}
.dashboard-line-chart-values{display:flex;justify-content:space-between;gap:4px;font-size:12px;font-weight:800;color:var(--text);font-variant-numeric:tabular-nums;padding:2px 2px 0}
.dashboard-line-chart-labels{display:flex;justify-content:space-between;gap:4px;font-size:10px;font-weight:700;color:var(--text2);text-transform:capitalize;padding:0 2px 2px;min-width:0}
.dashboard-line-chart-labels span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;flex:1}
.dashboard-mix-foot{margin-top:4px}
.dashboard-chart-foot--tight{margin-top:8px}
.dashboard-mix-chart-wrap{display:flex;flex-direction:column;gap:10px}
.dashboard-mix-bar{display:flex;height:18px;border-radius:999px;overflow:hidden;background:var(--color-background-tertiary, rgba(255,255,255,.05));border:1px solid var(--ds-border-subtle, rgba(148,163,184,.14));box-shadow:0 2px 12px rgba(0,0,0,.12) inset}
.dashboard-mix-bar--pilot{height:26px;border-radius:12px;box-shadow:0 2px 14px rgba(0,0,0,.14) inset}
.dashboard-mix-seg{min-width:4px;transition:flex .2s ease}
.dashboard-mix-seg--overdue{background:linear-gradient(90deg, rgba(217,119,6,.95), rgba(245,158,11,.82))}
.dashboard-mix-seg--done{background:linear-gradient(90deg, rgba(22,163,74,.92), rgba(52,211,153,.78))}
.dashboard-mix-seg--other{background:linear-gradient(90deg, rgba(71,85,105,.65), rgba(100,116,139,.48))}
.dashboard-mix-legend{list-style:none;margin:0;padding:0;display:grid;gap:6px;font-size:12px;color:var(--text2)}
.dashboard-mix-legend-item{display:flex;align-items:center;gap:8px}
.dashboard-mix-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.dashboard-mix-dot--overdue{background:rgba(245,158,11,.9)}
.dashboard-mix-dot--done{background:rgba(66,199,140,.88)}
.dashboard-mix-dot--other{background:rgba(100,116,139,.82)}
.dashboard-mix-seg--pilot-crit{background:linear-gradient(90deg,rgba(220,38,38,.95),rgba(127,29,29,.82))}
.dashboard-mix-seg--pilot-watch{background:linear-gradient(90deg,rgba(251,146,60,.94),rgba(234,88,12,.78))}
.dashboard-mix-seg--pilot-nc{background:linear-gradient(90deg,rgba(124,58,237,.92),rgba(99,102,241,.78))}
.dashboard-mix-dot--pilot-crit{background:rgba(220,38,38,.92)}
.dashboard-mix-dot--pilot-watch{background:rgba(243,179,79,.92)}
.dashboard-mix-dot--pilot-nc{background:linear-gradient(135deg,rgba(124,58,237,.95),rgba(99,102,241,.88))}
.dashboard-mix-seg--req-ok{background:linear-gradient(90deg,rgba(66,199,140,.88),rgba(61,184,154,.72))}
.dashboard-mix-seg--req-part{background:linear-gradient(90deg,rgba(229,184,77,.88),rgba(243,179,79,.68))}
.dashboard-mix-seg--req-nc{background:linear-gradient(90deg,rgba(232,93,108,.9),rgba(248,113,113,.72))}
.dashboard-mix-dot--req-ok{background:rgba(66,199,140,.88)}
.dashboard-mix-dot--req-part{background:rgba(229,184,77,.92)}
.dashboard-mix-dot--req-nc{background:rgba(232,93,108,.88)}
.dashboard-mix-seg--doc-miss{background:linear-gradient(90deg,rgba(248,113,113,.82),rgba(232,93,108,.68))}
.dashboard-mix-seg--doc-obs{background:linear-gradient(90deg,rgba(245,158,11,.85),rgba(229,184,77,.65))}
.dashboard-mix-seg--doc-crit{background:linear-gradient(90deg,rgba(239,91,107,.88),rgba(232,93,108,.72))}
.dashboard-mix-dot--doc-miss{background:rgba(248,113,113,.85)}
.dashboard-mix-dot--doc-obs{background:rgba(245,158,11,.88)}
.dashboard-mix-dot--doc-crit{background:rgba(239,91,107,.85)}
.dashboard-mix-seg--plan-pending{background:linear-gradient(90deg,rgba(20,184,166,.55),rgba(20,184,166,.38))}
.dashboard-mix-seg--plan-run{background:linear-gradient(90deg,rgba(243,179,79,.88),rgba(245,158,11,.72))}
.dashboard-mix-seg--plan-done{background:linear-gradient(90deg,rgba(66,199,140,.85),rgba(52,211,153,.68))}
.dashboard-mix-dot--plan-pending{background:rgba(20,184,166,.78)}
.dashboard-mix-dot--plan-run{background:rgba(243,179,79,.9)}
.dashboard-mix-dot--plan-done{background:rgba(66,199,140,.88)}
.dashboard-breakdown-wrap{display:flex;flex-direction:column;gap:10px}
.dashboard-breakdown-row{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,2fr) auto;gap:10px 12px;align-items:center;font-size:12px}
.dashboard-breakdown-label{color:var(--text2);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word}
.dashboard-breakdown-track{height:11px;border-radius:999px;background:var(--color-background-tertiary, rgba(255,255,255,.07));overflow:hidden;border:1px solid var(--color-border-tertiary, rgba(148,163,184,.08))}
.dashboard-breakdown-fill{height:100%;border-radius:999px;min-width:4px;transition:width .35s cubic-bezier(.25,.8,.25,1)}
.dashboard-breakdown-fill--tone-0{background:linear-gradient(90deg, rgba(234,88,12,.9), rgba(251,113,133,.55));box-shadow:0 0 12px rgba(234,88,12,.2)}
.dashboard-breakdown-fill--tone-1{background:linear-gradient(90deg, rgba(124,58,237,.88), rgba(99,102,241,.52));box-shadow:0 0 12px rgba(99,102,241,.22)}
.dashboard-breakdown-fill--tone-2{background:linear-gradient(90deg, rgba(13,148,136,.9), rgba(45,212,191,.55));box-shadow:0 0 12px rgba(20,184,166,.2)}
.dashboard-breakdown-fill--tone-3{background:linear-gradient(90deg, rgba(37,99,235,.88), rgba(59,130,246,.55));box-shadow:0 0 12px rgba(37,99,235,.18)}
.dashboard-breakdown-fill--tone-4{background:linear-gradient(90deg, rgba(217,119,6,.9), rgba(251,191,36,.55));box-shadow:0 0 12px rgba(245,158,11,.18)}
.dashboard-breakdown-count{font-weight:700;color:var(--text);font-variant-numeric:tabular-nums;min-width:1.5em;text-align:right}
.dashboard-pilot-load{display:flex;flex-direction:column;gap:12px;width:100%;min-width:0}
.dashboard-pilot-load-inner{display:flex;flex-wrap:wrap;align-items:stretch;gap:16px 18px}
.dashboard-pilot-load-main{flex:1.35 1 280px;min-width:0;display:flex;flex-direction:column;gap:10px}
.dashboard-pilot-load-side{flex:1 1 260px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;min-width:0}
@media (max-width:640px){.dashboard-pilot-load-side{grid-template-columns:1fr}}
.dashboard-mix-legend--pilot{margin-top:2px}
.dashboard-pilot-stat{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:4px;padding:12px 10px;border-radius:var(--ds-radius-md,12px);border:1px solid var(--color-border-tertiary);background:var(--color-background-primary);min-height:92px;box-shadow:0 1px 0 rgba(255,255,255,.04) inset}
.dashboard-pilot-stat-val{font-size:clamp(26px,4vw,34px);font-weight:900;letter-spacing:-.04em;line-height:1;font-variant-numeric:tabular-nums;color:var(--text)}
.dashboard-pilot-stat-kicker{font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.dashboard-pilot-stat-sub{font-size:10px;font-weight:600;color:var(--text2);line-height:1.25;opacity:.92}
.dashboard-pilot-stat--crit{border-color:rgba(220,38,38,.35);background:linear-gradient(165deg,rgba(254,226,226,.35),var(--color-background-secondary))}
.dashboard-pilot-stat--crit .dashboard-pilot-stat-val{color:var(--color-text-danger)}
.dashboard-pilot-stat--watch{border-color:rgba(234,88,12,.32);background:linear-gradient(165deg,rgba(255,237,213,.4),var(--color-background-secondary))}
.dashboard-pilot-stat--watch .dashboard-pilot-stat-val{color:var(--color-text-warning)}
.dashboard-pilot-stat--nc{border-color:rgba(124,58,237,.32);background:linear-gradient(165deg,rgba(237,233,254,.45),var(--color-background-secondary))}
.dashboard-pilot-stat--nc .dashboard-pilot-stat-val{color:#6d28d9}
[data-theme='dark'] .dashboard-pilot-stat--nc .dashboard-pilot-stat-val{color:#c4b5fd}
.dashboard-priority-heading--nc .dashboard-priority-dot{background:rgba(229,184,77,.95);box-shadow:0 0 0 2px rgba(229,184,77,.22)}
.dashboard-priority-row--nc{border-left-color:rgba(229,184,77,.55);background:rgba(229,184,77,.06)}
.dashboard-alerts-panel{margin-top:0}
.dashboard-alerts-card{padding:16px 18px}
.dashboard-alerts-host{min-height:0}
.dashboard-activity-wrap{margin:0}
.dashboard-activity-section.content-card{margin-top:0;border-radius:var(--ds-radius-md,14px);box-shadow:0 4px 28px rgba(0,0,0,.12);border:1px solid rgba(148,163,184,.12)}
.dashboard-activity-section--body{box-shadow:0 4px 28px rgba(0,0,0,.12)}
.dashboard-activity-head.content-card-head{margin-bottom:14px;padding-bottom:4px}
.dashboard-activity-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px 28px;align-items:start}
.dashboard-activity-col{display:flex;flex-direction:column;gap:12px;min-width:0;border-left:1px solid var(--ds-border-subtle, rgba(148,163,184,.14));padding-left:20px}
.dashboard-activity-col:first-child{border-left:none;padding-left:0}
.dashboard-activity-col-title{margin:0 0 6px;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:rgba(20,184,166,.88)}
.dashboard-activity-stack{display:flex;flex-direction:column;gap:8px;min-height:0}
.dashboard-activity-col-footer{margin-top:2px;padding-top:4px;border-top:1px dashed rgba(148,163,184,.12)}
.dashboard-activity-col-more{display:inline-flex;align-items:center;gap:6px;margin:0;padding:8px 0;border:none;background:transparent;font:inherit;font-size:11px;font-weight:700;letter-spacing:.04em;color:rgba(20,184,166,.92);cursor:pointer;text-decoration:underline;text-underline-offset:3px;text-decoration-color:rgba(20,184,166,.32);transition:color .15s ease,text-decoration-color .15s ease}
.dashboard-activity-col-more:hover{color:#5eead4;text-decoration-color:rgba(94,234,212,.55)}
.dashboard-activity-col-more:focus-visible{outline:2px solid rgba(20,184,166,.45);outline-offset:2px;border-radius:4px}
.dashboard-activity-col-empty{margin:0;padding:10px 0;font-size:12px;line-height:1.45;color:var(--text3);font-style:italic}
@media (max-width:900px){
.dashboard-activity-grid{grid-template-columns:1fr;gap:20px}
.dashboard-activity-col{border-left:none;padding-left:0;padding-top:16px;border-top:1px solid var(--ds-border-subtle, rgba(148,163,184,.14))}
.dashboard-activity-col:first-child{border-top:none;padding-top:0}
}
.dashboard-activity-global-empty{padding:22px 18px;text-align:center;border-radius:var(--ds-radius-md, 14px);border:1px dashed rgba(148,163,184,.2);background:rgba(255,255,255,.03)}
.dashboard-activity-global-empty-msg{margin:0 0 8px;font-size:15px;font-weight:800;line-height:1.35;color:var(--text);letter-spacing:-.02em}
.dashboard-activity-global-empty-sub{margin:0 auto 16px;max-width:48ch;font-size:12px;line-height:1.5;color:var(--text2);font-weight:500}
.dashboard-activity-item{display:flex;flex-direction:column;gap:6px;padding:12px 14px;border-radius:var(--ds-radius-sm, 12px);background:rgba(255,255,255,.04);border:1px solid rgba(148,163,184,.11);min-width:0;text-align:left}
.dashboard-activity-item--link{cursor:pointer;transition:background .15s ease,border-color .15s ease,box-shadow .15s ease,transform .12s ease}
.dashboard-activity-item--link:hover,.dashboard-activity-item--link:focus{background:rgba(20,184,166,.09);border-color:rgba(20,184,166,.26);outline:none;transform:translateY(-1px)}
.dashboard-activity-item--link:focus-visible{box-shadow:var(--ds-shadow-focus, 0 0 0 3px rgba(20,184,166,.22))}
.dashboard-activity-item__head{margin:0 0 2px}
.dashboard-activity-item__kind{font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--accent-blue)}
.dashboard-activity-item__top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;min-width:0}
.dashboard-activity-item__title{font-size:13px;font-weight:800;letter-spacing:-.02em;line-height:1.3;color:var(--text);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.dashboard-activity-item__badge{flex-shrink:0;font-size:9px!important;padding:3px 8px!important;line-height:1.2;max-width:42%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dashboard-activity-item__ctx{margin:0;font-size:12px;line-height:1.45;color:var(--text2);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.dashboard-activity-item__status-row{display:flex;align-items:baseline;gap:10px;padding:8px 0;margin:2px 0 0;border-top:1px solid rgba(148,163,184,.1);border-bottom:1px solid rgba(148,163,184,.06)}
.dashboard-activity-item__status-k{font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);flex-shrink:0}
.dashboard-activity-item__status-v{font-size:12px;font-weight:600;color:var(--text);line-height:1.3;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dashboard-activity-item__foot{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:6px 10px;margin-top:4px;padding-top:8px}
.dashboard-activity-item__date{font-size:11px;font-weight:800;color:var(--text3);font-variant-numeric:tabular-nums}
.dashboard-activity-item__hint{font-size:11px;font-weight:700;color:var(--accent-blue);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dashboard-chart-card .bar-chart{margin-top:4px}
.dashboard-bar-chart-wrap{display:flex;flex-direction:column;gap:0}
.dashboard-bar-chart--dashboard{display:grid;grid-template-columns:repeat(6,1fr);align-items:end;gap:10px;height:176px;padding-top:8px}
.dashboard-bar{position:relative;border-radius:14px 14px 10px 10px;background:linear-gradient(180deg,rgba(20,184,166,.88),rgba(13,148,136,.72));height:var(--bar-h,45%);min-height:12px;box-shadow:0 6px 18px rgba(20,184,166,.12)}
.dashboard-bar span{position:absolute;left:50%;transform:translateX(-50%);bottom:-24px;font-size:11px;font-weight:600;color:var(--text3);white-space:nowrap}
.dashboard-chart-axis{margin:0 0 4px;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--text3)}
.dashboard-chart-foot{margin-top:26px;font-size:12px;color:var(--text3);line-height:1.45;max-width:62ch}
.dashboard-situation-wrap{display:flex;flex-direction:column;gap:12px}
.dashboard-situation-list{list-style:none;margin:0;padding:0;display:grid;gap:0}
.dashboard-situation-item{display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06);font-size:13px;line-height:1.4}
.dashboard-situation-item:last-child{border-bottom:none;padding-bottom:0}
.dashboard-situation-k{color:var(--text3);font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;flex-shrink:0}
.dashboard-situation-v{font-weight:700;color:var(--text);text-align:right}
.dashboard-situation-note{margin:0;font-size:12px;line-height:1.45;color:var(--text3)}
.dashboard-priority-stack{display:grid;gap:14px}
.dashboard-priority-block{padding:0}
.dashboard-priority-heading{display:flex;align-items:center;gap:8px;margin:0 0 10px;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--text)}
.dashboard-priority-heading--incidents,.dashboard-priority-heading--actions{color:var(--text)}
.dashboard-priority-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.dashboard-priority-heading--incidents .dashboard-priority-dot{background:rgba(239,91,107,.85);box-shadow:0 0 0 2px rgba(239,91,107,.2)}
.dashboard-priority-heading--actions .dashboard-priority-dot{background:rgba(243,179,79,.9);box-shadow:0 0 0 2px rgba(243,179,79,.2)}
.dashboard-priority-list.stack{gap:8px}
.dashboard-priority-row.list-row{border-left-width:3px;border-left-style:solid}
.dashboard-priority-row--incident{border-left-color:rgba(239,91,107,.5);background:rgba(239,91,107,.04)}
.dashboard-priority-row--action{border-left-color:rgba(243,179,79,.5);background:rgba(243,179,79,.05)}
@media (max-width:1200px){.dashboard-kpi-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:900px){
.dashboard-charts-grid{grid-template-columns:1fr}
.dashboard-chart-card--dash-trend,
.dashboard-chart-card--dash-types,
.dashboard-chart-card--dash-mix,
.dashboard-chart-card--dash-audit,
.dashboard-chart-card--dash-load{grid-column:span 1}
}
@media (max-width:1100px){.dashboard-kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:760px){.dashboard-kpi-grid{grid-template-columns:1fr}}
@media (max-width:900px){.dashboard-activity-grid{grid-template-columns:1fr}.dashboard-activity-col{border-left:none;padding-left:0;border-top:1px solid var(--ds-border-subtle, rgba(148,163,184,.1));padding-top:14px}.dashboard-activity-col:first-child{border-top:none;padding-top:0}}
.dashboard-cockpit{
  border-radius:var(--ds-radius-lg,20px);
  border:1px solid rgba(148,163,184,.18);
  background:linear-gradient(165deg, rgba(26,34,50,.98) 0%, rgba(16,22,32,.92) 48%, rgba(20,184,166,.07) 100%);
  box-shadow:0 10px 44px rgba(0,0,0,.2),0 0 0 1px rgba(255,255,255,.04) inset;
  padding:22px 24px 20px;
}
.dashboard-cockpit__inner{display:flex;flex-direction:column;gap:18px;min-width:0}
.dashboard-cockpit__head{margin:0;padding:0 0 2px}
.dashboard-cockpit__kicker{display:block;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--accent-blue);margin:0 0 6px}
.dashboard-cockpit__title{margin:0;font-size:clamp(20px,2.2vw,26px);font-weight:800;letter-spacing:-.03em;line-height:1.15;color:var(--text)}
.dashboard-cockpit__card{border-radius:var(--ds-radius-md,14px);border:1px solid rgba(148,163,184,.1);background:rgba(255,255,255,.025);padding:16px 18px;transition:transform .2s ease, box-shadow .2s ease, border-color .2s ease;box-shadow:0 1px 0 rgba(255,255,255,.04) inset}
.dashboard-cockpit__card:hover{border-color:rgba(148,163,184,.22);box-shadow:none}
.dashboard-cockpit__card--focus{border-color:rgba(20,184,166,.22);background:linear-gradient(135deg, rgba(20,184,166,.09) 0%, rgba(255,255,255,.02) 100%);box-shadow:0 0 0 1px rgba(20,184,166,.08), 0 8px 32px rgba(0,0,0,.1)}
.dashboard-cockpit__card--focus:hover{border-color:rgba(20,184,166,.3)}
.dashboard-cockpit__card--analytics{background:rgba(0,0,0,.12);border-color:rgba(148,163,184,.08)}
.dashboard-cockpit__card--complement{padding:14px 16px;background:rgba(255,255,255,.02);border-color:rgba(148,163,184,.08)}
.dashboard-cockpit__card-head{margin:0 0 14px}
.dashboard-cockpit__card-head--compact{margin:0 0 10px}
.dashboard-cockpit__card-kicker{display:block;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);margin:0 0 4px}
.dashboard-cockpit__card-title{margin:0;font-size:13px;font-weight:700;letter-spacing:-.02em;color:var(--text)}
.dashboard-cockpit__card--complement .dashboard-cockpit__card-title{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text2)}
.dashboard-cockpit__situation{margin:0}
.dashboard-cockpit__intro{margin:0;font-size:14px;line-height:1.45;font-weight:600;color:var(--text);max-width:58ch}
.dashboard-cockpit__micro{margin:10px 0 0;font-size:12px;line-height:1.4;font-weight:600;color:var(--accent-blue)}
.dashboard-cockpit__situation-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px;padding-top:14px;border-top:1px solid rgba(148,163,184,.1)}
.dashboard-cockpit__pill{padding:8px 14px;border-radius:999px;border:1px solid rgba(148,163,184,.2);background:rgba(255,255,255,.04);color:var(--text);font-size:12px;font-weight:600;cursor:pointer;transition:background .18s ease, border-color .18s ease, transform .15s ease, color .15s ease}
.dashboard-cockpit__pill:hover{background:rgba(20,184,166,.12);border-color:rgba(20,184,166,.35);transform:translateY(-1px)}
.dashboard-cockpit__pill--emph{background:rgba(20,184,166,.16);border-color:rgba(20,184,166,.4);color:var(--text)}
.dashboard-cockpit__pill--emph:hover{background:rgba(20,184,166,.24);border-color:rgba(20,184,166,.5)}
.dashboard-cockpit__pill:focus-visible{outline:none;box-shadow:var(--ds-shadow-focus)}
.dashboard-cockpit__chart{padding:0;margin:0;border:none;background:transparent;box-shadow:none}
.dashboard-cockpit__bars{display:flex;flex-direction:column;gap:12px}
.dashboard-cockpit__bar-row{display:grid;grid-template-columns:minmax(112px,1.1fr) minmax(0,2fr) 44px;gap:14px;align-items:center;font-size:13px}
.dashboard-cockpit__bar-label{color:var(--text);font-weight:600;line-height:1.25}
.dashboard-cockpit__bar-track{height:12px;border-radius:999px;background:rgba(255,255,255,.06);overflow:hidden;border:1px solid rgba(255,255,255,.06)}
.dashboard-cockpit__bar-fill{height:100%;border-radius:999px;background:linear-gradient(90deg, rgba(20,184,166,.85), rgba(61,184,154,.75));width:0%;min-width:0;transition:width .4s cubic-bezier(.25,.8,.25,1)}
.dashboard-cockpit__bar-row:nth-child(2) .dashboard-cockpit__bar-fill{background:linear-gradient(90deg, rgba(229,184,77,.88), rgba(232,93,108,.55))}
.dashboard-cockpit__bar-row:nth-child(3) .dashboard-cockpit__bar-fill{background:linear-gradient(90deg, rgba(245,158,11,.75), rgba(243,179,79,.5))}
.dashboard-cockpit__bar-row:nth-child(4) .dashboard-cockpit__bar-fill{background:linear-gradient(90deg, rgba(66,199,140,.75), rgba(20,184,166,.5))}
.dashboard-cockpit__bar-val{font-weight:800;font-size:14px;font-variant-numeric:tabular-nums;color:var(--text);text-align:right}
.dashboard-cockpit__chart-read{margin:14px 0 0;font-size:12px;font-weight:600;line-height:1.45;color:var(--text2);max-width:68ch}
.dashboard-cockpit__chart-note{margin:6px 0 0;font-size:10px;line-height:1.35;color:var(--text3);max-width:62ch;opacity:.88}
.dashboard-cockpit__chart-actions{margin-top:12px;padding-top:12px;border-top:1px solid rgba(148,163,184,.08)}
.dashboard-cockpit__textlink{padding:0;border:none;background:none;color:var(--accent-blue);font-size:12px;font-weight:700;cursor:pointer;text-align:left;transition:opacity .15s ease, color .15s ease}
.dashboard-cockpit__textlink:hover{opacity:.88;color:#5eead4}
.dashboard-cockpit__textlink:focus-visible{outline:none;box-shadow:var(--ds-shadow-focus);border-radius:4px}
.dashboard-cockpit__watch{min-height:0}
.dashboard-cockpit__watch-empty{margin:0;font-size:12px;line-height:1.45;color:var(--text2);font-weight:500;max-width:56ch}
.dashboard-cockpit__watch-list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px}
.dashboard-cockpit__watch-item{width:100%;text-align:left;padding:8px 10px;margin:0;border-radius:var(--ds-radius-sm,10px);border:1px solid rgba(148,163,184,.08);background:rgba(255,255,255,.03);color:var(--text);font-size:12px;font-weight:600;line-height:1.3;cursor:pointer;transition:background .18s ease, border-color .18s ease, transform .12s ease}
.dashboard-cockpit__watch-item:hover{background:rgba(20,184,166,.1);border-color:rgba(20,184,166,.22);transform:translateX(2px)}
.dashboard-cockpit__watch-item:focus-visible{outline:none;box-shadow:var(--ds-shadow-focus)}
.dashboard-cockpit__mini-val{font-size:11px;font-weight:700;line-height:1.25;color:var(--text);max-height:2.75em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-align:center;hyphens:auto}
.dashboard-cockpit__alert{display:flex;flex-direction:column;gap:0;padding:0;border-radius:var(--ds-radius-md,14px);border:1px solid transparent;cursor:pointer;transition:background .2s ease, border-color .2s ease, transform .18s ease, box-shadow .2s ease;box-shadow:0 4px 20px rgba(0,0,0,.1);overflow:hidden}
.dashboard-cockpit__alert:hover{transform:translateY(-2px);box-shadow:0 10px 32px rgba(0,0,0,.14)}
.dashboard-cockpit__alert:focus{outline:none}
.dashboard-cockpit__alert:focus-visible{box-shadow:var(--ds-shadow-focus, 0 0 0 3px rgba(20,184,166,.22)), 0 4px 20px rgba(0,0,0,.1)}
.dashboard-cockpit__alert-body{display:flex;flex-wrap:wrap;align-items:flex-start;gap:8px 16px;padding:15px 18px;text-align:left}
.dashboard-cockpit__alert-secondary{padding:0 18px 12px 18px;border-top:1px solid rgba(255,255,255,.06)}
.dashboard-cockpit__alert-link{padding:4px 0;border:none;background:none;color:var(--accent-blue);font-size:12px;font-weight:700;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.dashboard-cockpit__alert-link:hover{opacity:.9}
.dashboard-cockpit__alert--ok{background:rgba(66,199,140,.11);border-color:rgba(66,199,140,.25)}
.dashboard-cockpit__alert--ok:hover{background:rgba(66,199,140,.15)}
.dashboard-cockpit__alert--warn{background:rgba(243,179,79,.12);border-color:rgba(243,179,79,.3)}
.dashboard-cockpit__alert--warn:hover{background:rgba(243,179,79,.17)}
.dashboard-cockpit__alert--nc{background:rgba(229,184,77,.12);border-color:rgba(229,184,77,.32)}
.dashboard-cockpit__alert--nc:hover{background:rgba(229,184,77,.17)}
.dashboard-cockpit__alert--risk{background:rgba(232,93,108,.12);border-color:rgba(232,93,108,.3)}
.dashboard-cockpit__alert--risk:hover{background:rgba(232,93,108,.17)}
.dashboard-cockpit__alert-k{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);width:100%;flex-basis:100%}
.dashboard-cockpit__alert-msg{flex:1;min-width:min(100%,200px);font-size:15px;font-weight:600;color:var(--text);line-height:1.35}
.dashboard-cockpit__alert-cta{font-size:12px;font-weight:700;color:var(--accent-blue);white-space:nowrap;align-self:center}
.dashboard-cockpit__minis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.dashboard-cockpit__minis--support{opacity:.94}
.dashboard-cockpit__mini{padding:12px 10px;border-radius:var(--ds-radius-sm,12px);background:rgba(255,255,255,.03);border:1px solid rgba(148,163,184,.09);text-align:center;transition:background .18s ease, border-color .18s ease, transform .15s ease}
.dashboard-cockpit__mini:hover{background:rgba(255,255,255,.05);border-color:rgba(148,163,184,.14);transform:translateY(-1px)}
.dashboard-cockpit__mini-label{display:block;font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);margin-bottom:6px}
.dashboard-shortcuts .dashboard-section-sub{max-width:52ch}
.dashboard-shortcuts__grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}
.dashboard-shortcuts__tile{display:flex;flex-direction:column;align-items:flex-start;text-align:left;gap:4px;padding:12px 14px;border-radius:var(--ds-radius-md,14px);border:1px solid rgba(148,163,184,.12);background:rgba(255,255,255,.03);color:var(--text);cursor:pointer;transition:background .2s ease, border-color .2s ease, transform .15s ease, box-shadow .2s ease;min-height:64px;box-shadow:0 1px 0 rgba(255,255,255,.03) inset}
.dashboard-shortcuts__tile:hover{background:rgba(255,255,255,.06);border-color:rgba(20,184,166,.28);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.12)}
.dashboard-shortcuts__tile:focus-visible{outline:none;box-shadow:var(--ds-shadow-focus)}
.dashboard-shortcuts__tile-label{font-size:13px;font-weight:700;line-height:1.25;letter-spacing:-.01em}
.dashboard-shortcuts__tile-hint{font-size:10px;font-weight:600;color:var(--text3);line-height:1.3}
.dashboard-shortcuts__tile--incident:hover{border-color:rgba(239,91,107,.35)}
.dashboard-shortcuts__tile--action:hover{border-color:rgba(243,179,79,.35)}
.dashboard-shortcuts__tile--audit:hover{border-color:rgba(20,184,166,.38)}
.dashboard-shortcuts__tile--nc:hover{border-color:rgba(245,158,11,.38)}
.dashboard-shortcuts__tile--import:hover{border-color:rgba(20,184,166,.35)}
.dashboard-shortcuts__tile--export:hover{border-color:rgba(66,199,140,.35)}
@media (max-width:1100px){.dashboard-shortcuts__grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
.dashboard-alerts-prio-card{
  padding:18px 20px 16px;
  border-radius:var(--ds-radius-md,16px);
  box-shadow:0 10px 40px rgba(0,0,0,.2),0 0 0 1px rgba(255,255,255,.04) inset;
  border:1px solid rgba(148,163,184,.18);
  background:linear-gradient(165deg,rgba(28,36,52,.95) 0%,rgba(18,24,36,.9) 100%);
}
.dashboard-band--alerts .dashboard-alerts-prio-card{
  border-color:rgba(232,93,108,.2);
  box-shadow:0 12px 44px rgba(0,0,0,.22),0 0 0 1px rgba(239,91,107,.08);
}
.dashboard-executive-panel{
  margin-bottom:4px;
  border:1px solid rgba(20,184,166,.18);
  background:linear-gradient(145deg,rgba(255,255,255,.04) 0%,rgba(20,184,166,.05) 40%,rgba(0,0,0,.06) 100%);
  box-shadow:0 6px 32px rgba(0,0,0,.14),0 1px 0 rgba(255,255,255,.04) inset;
}
.dashboard-executive-panel__grid{
  display:grid;
  grid-template-columns:minmax(0,1fr) minmax(200px,248px);
  gap:26px 28px;
  align-items:start;
}
@media (max-width:960px){
  .dashboard-executive-panel__grid{grid-template-columns:1fr}
}
.dashboard-executive-panel__kicker{color:rgba(45,212,191,.9)}
.dashboard-executive-panel__title{
  margin:6px 0 14px;
  font-size:clamp(19px,1.9vw,23px);
  font-weight:800;
  letter-spacing:-.03em;
  line-height:1.2;
  color:var(--text);
}
.dashboard-executive-panel__brief{
  margin:0;
  font-size:14px;
  line-height:1.65;
  color:var(--text2);
  font-weight:500;
  max-width:64ch;
}
.dashboard-exec-score{
  text-align:center;
  padding:16px 14px 14px;
  border-radius:16px;
  border:1px solid rgba(148,163,184,.14);
  background:linear-gradient(165deg,rgba(0,0,0,.12) 0%,rgba(255,255,255,.03) 100%);
  position:relative;
}
.dashboard-exec-score__ring{
  display:flex;
  justify-content:center;
  margin:0 auto 4px;
  height:84px;
}
.dashboard-exec-score__svg{display:block;width:140px;height:84px}
.dashboard-exec-score__value{
  font-size:38px;
  font-weight:800;
  letter-spacing:-.04em;
  line-height:1;
  font-variant-numeric:tabular-nums;
  color:var(--text);
  margin-top:-6px;
}
.dashboard-exec-score__label{
  display:block;
  margin:8px 0 4px;
  font-size:12px;
  font-weight:700;
  line-height:1.35;
  color:var(--text);
  padding:0 6px;
}
.dashboard-exec-score__hint{
  margin:0 0 10px;
  font-size:11px;
  line-height:1.4;
  color:var(--text3);
  padding:0 8px;
}
.dashboard-exec-score__micro{
  margin:0;
  font-size:10px;
  line-height:1.35;
  color:var(--text3);
  opacity:.85;
  padding:10px 8px 0;
  border-top:1px solid rgba(148,163,184,.1);
}
.dashboard-exec-score--ok{border-color:rgba(52,211,153,.22)}
.dashboard-exec-score--watch{border-color:rgba(251,191,36,.22)}
.dashboard-exec-score--risk{border-color:rgba(248,113,113,.22)}
.dashboard-priority-now{
  border:1px solid rgba(148,163,184,.14);
  background:linear-gradient(165deg,rgba(255,255,255,.035) 0%,rgba(0,0,0,.05) 100%);
  box-shadow:0 4px 24px rgba(0,0,0,.1);
}
.dashboard-priority-now__head{margin-bottom:12px}
.dashboard-priority-now__summary{
  display:flex;
  flex-wrap:wrap;
  gap:10px 12px;
  align-items:stretch;
  margin:0 0 14px;
  padding:12px 14px;
  border-radius:14px;
  border:1px solid rgba(148,163,184,.12);
  background:rgba(0,0,0,.06);
}
.dashboard-priority-now__summary-more{
  flex:1 0 100%;
  margin:2px 0 0;
  font-size:11px;
  font-weight:600;
  line-height:1.4;
  color:var(--text3);
  max-width:56ch;
}
.dashboard-priority-now__pill{
  display:flex;
  flex-direction:column;
  gap:4px;
  min-width:0;
  flex:1 1 104px;
  max-width:200px;
  padding:10px 12px;
  border-radius:12px;
  border:1px solid rgba(148,163,184,.1);
  background:rgba(255,255,255,.035);
}
.dashboard-priority-now__pill-value{
  font-size:clamp(18px,2.2vw,22px);
  font-weight:800;
  font-variant-numeric:tabular-nums;
  line-height:1;
  color:var(--text);
  letter-spacing:-.02em;
}
.dashboard-priority-now__pill-label{
  font-size:9px;
  font-weight:800;
  letter-spacing:.07em;
  text-transform:uppercase;
  color:var(--text3);
  line-height:1.25;
}
.dashboard-priority-now__pill--urgent{border-color:rgba(248,113,113,.3);background:rgba(239,91,107,.09)}
.dashboard-priority-now__pill--delay{border-color:rgba(251,191,36,.32);background:rgba(245,158,11,.08)}
.dashboard-priority-now__pill--nc{border-color:rgba(251,191,36,.35);background:rgba(245,158,11,.1)}
.dashboard-priority-now__pill--calm{border-color:rgba(148,163,184,.1)}
.dashboard-priority-now__kicker{color:rgba(52,211,153,.9)}
.dashboard-priority-now__title{margin:6px 0 6px;font-size:clamp(17px,1.6vw,20px);font-weight:800;letter-spacing:-.02em}
.dashboard-priority-now__sub{margin:0;font-size:12px;line-height:1.45;color:var(--text3);max-width:52ch}
.dashboard-priority-now__list{display:flex;flex-direction:column;gap:8px}
.dashboard-priority-now__empty{margin:0;padding:16px 12px;text-align:center;font-size:13px;line-height:1.5;color:var(--text2);border-radius:12px;border:1px dashed rgba(148,163,184,.18);background:rgba(255,255,255,.02)}
.dashboard-priority-now__row{
  display:grid;
  grid-template-columns:auto minmax(0,1fr) auto;
  gap:12px 14px;
  align-items:center;
  width:100%;
  text-align:left;
  padding:12px 14px;
  border-radius:12px;
  border:1px solid rgba(148,163,184,.12);
  background:rgba(255,255,255,.04);
  color:var(--text);
  font-family:inherit;
  cursor:pointer;
  transition:background .18s ease,border-color .18s ease,transform .12s ease,box-shadow .18s ease;
}
@media (prefers-reduced-motion:no-preference){
  .dashboard-priority-now__row:hover{
    background:rgba(20,184,166,.08);
    border-color:rgba(20,184,166,.28);
    transform:translateY(-1px);
    box-shadow:0 6px 20px rgba(0,0,0,.1);
  }
}
.dashboard-priority-now__row--urgent{border-left:4px solid rgba(248,113,113,.75)}
.dashboard-priority-now__row--delay{border-left:4px solid rgba(251,191,36,.8)}
.dashboard-priority-now__row--nc{border-left:4px solid rgba(251,191,36,.82)}
.dashboard-priority-now__chip{
  font-size:9px;
  font-weight:800;
  letter-spacing:.08em;
  text-transform:uppercase;
  padding:5px 8px;
  border-radius:8px;
  border:1px solid rgba(148,163,184,.15);
  color:var(--text3);
  white-space:nowrap;
}
.dashboard-priority-now__main{display:flex;flex-direction:column;gap:3px;min-width:0}
.dashboard-priority-now__row-title{font-size:13px;font-weight:800;line-height:1.3;letter-spacing:-.02em}
.dashboard-priority-now__row-meta{font-size:11px;color:var(--text3);line-height:1.35}
.dashboard-priority-now__go{font-size:12px;font-weight:700;color:var(--accent-blue);white-space:nowrap}
.dashboard-alerts-prio-host{display:flex;flex-direction:column;gap:6px;min-height:0}
.dashboard-alerts-prio-tier-strip{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0 0 14px}
.dashboard-alerts-prio-tier-pill{padding:10px 8px;border-radius:12px;border:1px solid rgba(148,163,184,.12);background:rgba(255,255,255,.035);text-align:center;display:flex;flex-direction:column;gap:4px;min-width:0}
.dashboard-alerts-prio-tier-pill-label{font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.dashboard-alerts-prio-tier-pill-sub{font-size:11px;font-weight:600;color:var(--text2);line-height:1.25}
.dashboard-alerts-prio-tier-pill--urgent-idle{opacity:.72}
.dashboard-alerts-prio-tier-pill--watch-idle{opacity:.72}
.dashboard-alerts-prio-tier-pill--normal-active{
  border-color:rgba(52,211,153,.45);
  background:linear-gradient(145deg,rgba(52,211,153,.16),rgba(52,211,153,.06));
  box-shadow:0 2px 14px rgba(52,211,153,.12);
}
.dashboard-alerts-prio-tier-pill--normal-active .dashboard-alerts-prio-tier-pill-sub{color:var(--text)}
.dashboard-alerts-prio-tier-pill--urgent-idle{border-color:rgba(239,91,107,.12)}
.dashboard-alerts-prio-tier-pill--watch-idle{border-color:rgba(245,158,11,.12)}
.dashboard-alerts-prio-normal--stable{padding:2px 0 0;text-align:left;max-width:100%}
.dashboard-alerts-prio-normal-msg{margin:0 0 6px;font-size:14px;font-weight:800;line-height:1.35;color:var(--text);letter-spacing:-.02em}
.dashboard-alerts-prio-normal-watch{margin:0 0 8px;font-size:12px;line-height:1.45;color:var(--text2);font-weight:500;max-width:56ch}
.dashboard-alerts-prio-normal-watch-k{font-weight:800;letter-spacing:.06em;text-transform:uppercase;font-size:9px;color:var(--text3);margin-right:4px}
.dashboard-alerts-prio-micro{margin:0 0 6px;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.dashboard-alerts-prio-lane-head{display:flex;align-items:center;justify-content:space-between;padding:8px 11px;margin-top:12px;border-radius:10px;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;gap:10px}
.dashboard-alerts-prio-lane-head:first-of-type{margin-top:4px}
.dashboard-alerts-prio-lane-head--urgent{
  background:linear-gradient(90deg,rgba(239,91,107,.22),rgba(239,91,107,.08));
  border:1px solid rgba(248,113,113,.4);
  color:#fecaca;
  box-shadow:0 2px 12px rgba(239,91,107,.12);
}
.dashboard-alerts-prio-lane-head--watch{
  background:linear-gradient(90deg,rgba(245,158,11,.2),rgba(245,158,11,.07));
  border:1px solid rgba(251,191,36,.38);
  color:#fde68a;
  box-shadow:0 2px 12px rgba(245,158,11,.1);
}
.dashboard-alerts-prio-lane-title{flex:1;min-width:0}
.dashboard-alerts-prio-lane-count{font-variant-numeric:tabular-nums;opacity:.9;padding:2px 8px;border-radius:999px;background:rgba(0,0,0,.2);font-size:11px;font-weight:800}
.dashboard-alerts-prio-icon{font-size:15px;line-height:1;text-align:center;opacity:.92;user-select:none}
.dashboard-alerts-prio-row{display:grid;grid-template-columns:26px 72px minmax(0,1fr) auto;gap:8px 10px;align-items:center;width:100%;padding:11px 12px;border-radius:var(--ds-radius-sm,12px);border:1px solid rgba(148,163,184,.11);background:rgba(255,255,255,.035);color:var(--text);cursor:pointer;text-align:left;transition:background .18s ease, border-color .18s ease, transform .12s ease, box-shadow .18s ease}
.dashboard-alerts-prio-row:hover{background:rgba(255,255,255,.07);border-color:rgba(20,184,166,.28);transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,0,0,.1)}
.dashboard-alerts-prio-row:focus-visible{outline:none;box-shadow:var(--ds-shadow-focus)}
.dashboard-alerts-prio-row--urgent{
  border-left:4px solid rgba(248,113,113,.85);
  background:linear-gradient(90deg,rgba(239,91,107,.08),rgba(255,255,255,.03));
}
.dashboard-alerts-prio-row--watch{
  border-left:4px solid rgba(251,191,36,.75);
  background:linear-gradient(90deg,rgba(245,158,11,.07),rgba(255,255,255,.025));
}
.dashboard-alerts-prio-tier{font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);line-height:1.2}
.dashboard-alerts-prio-row--urgent .dashboard-alerts-prio-tier{color:rgba(248,113,113,.95)}
.dashboard-alerts-prio-row--watch .dashboard-alerts-prio-tier{color:rgba(251,191,36,.92)}
.dashboard-alerts-prio-main{display:flex;flex-direction:column;gap:3px;min-width:0}
.dashboard-alerts-prio-title{font-size:13px;font-weight:800;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.01em}
.dashboard-alerts-prio-meta{font-size:11px;color:var(--text2);line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dashboard-alerts-prio-badge{flex-shrink:0;font-size:10px!important;padding:4px 9px!important;font-weight:700!important}
.dashboard-alerts-prio-more{margin:8px 0 0;font-size:11px;color:var(--text3);font-weight:600;text-align:center;padding:6px}
.dashboard-vigilance-card{padding:16px 18px;border-radius:var(--ds-radius-md,14px);border:1px solid rgba(243,179,79,.18);background:linear-gradient(145deg,rgba(243,179,79,.07),rgba(255,255,255,.025));box-shadow:0 4px 28px rgba(0,0,0,.12)}
.dashboard-vigilance-host{min-height:0}
.dashboard-vigilance-empty-block{padding:4px 0 2px}
.dashboard-vigilance-empty-lead{margin:0 0 8px;font-size:14px;font-weight:800;line-height:1.35;color:var(--text);letter-spacing:-.02em}
.dashboard-vigilance-empty-detail{margin:0;font-size:12px;line-height:1.5;color:var(--text2);max-width:58ch}
.dashboard-vigilance-rich-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px}
.dashboard-vigilance-rich-item{margin:0;padding:12px 14px;border-radius:12px;border:1px solid rgba(148,163,184,.12);background:rgba(255,255,255,.04)}
.dashboard-vigilance-rich-item--trend{border-left:3px solid rgba(20,184,166,.65)}
.dashboard-vigilance-rich-item--anomaly{border-left:3px solid rgba(243,179,79,.75)}
.dashboard-vigilance-rich-item--drift{border-left:3px solid rgba(232,93,108,.55)}
.dashboard-vigilance-rich-top{display:flex;align-items:center;gap:8px;margin:0 0 8px}
.dashboard-vigilance-rich-icon{font-size:16px;line-height:1;opacity:.95}
.dashboard-vigilance-rich-variant{font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3)}
.dashboard-vigilance-rich-headline{margin:0 0 6px;font-size:13px;font-weight:800;line-height:1.35;color:var(--text);letter-spacing:-.02em}
.dashboard-vigilance-rich-detail{margin:0 0 10px;font-size:12px;line-height:1.45;color:var(--text2)}
.dashboard-vigilance-rich-cta{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px}
.dashboard-vigilance-investigate{padding:6px 14px;border-radius:999px;border:1px solid rgba(20,184,166,.4);background:rgba(20,184,166,.12);color:var(--accent-blue);font-size:11px;font-weight:800;cursor:pointer;font-family:inherit;transition:background .15s ease,border-color .15s ease}
.dashboard-vigilance-investigate:hover{background:rgba(20,184,166,.2);border-color:rgba(20,184,166,.55)}
.dashboard-vigilance-investigate:focus-visible{outline:none;box-shadow:var(--ds-shadow-focus)}
.dashboard-vigilance-rich-hint{font-size:11px;font-weight:600;color:var(--text3)}
.dashboard-auto-analysis-card{padding:0;border-radius:var(--ds-radius-lg,16px);border:0.5px solid rgba(20,184,166,.22);background:linear-gradient(165deg,rgba(20,184,166,.07),rgba(255,255,255,.02));box-shadow:none;overflow:hidden}
.dashboard-auto-analysis-strip{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;padding:10px 16px 11px;border-bottom:0.5px solid rgba(148,163,184,.12);background:rgba(20,184,166,.05)}
.dashboard-auto-analysis-strip-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:999px;font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--accent-blue);background:rgba(20,184,166,.12);border:0.5px solid rgba(20,184,166,.28)}
.dashboard-auto-analysis-strip-badge--idle{color:var(--text3);background:rgba(148,163,184,.1);border-color:rgba(148,163,184,.22)}
.dashboard-auto-analysis-strip-text{margin:0;flex:1;min-width:min(100%,160px);font-size:11px;line-height:1.35;font-weight:700;color:var(--text2)}
.dashboard-auto-analysis-host{min-height:0;padding:12px 16px 14px}
.dashboard-auto-analysis-empty-block{display:flex;gap:12px;align-items:center;padding:4px 0 2px}
.dashboard-auto-analysis-empty-icon{flex-shrink:0;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:rgba(63,185,80,.12);border:0.5px solid rgba(63,185,80,.32)}
.dashboard-auto-analysis-empty-check{font-size:18px;line-height:1;color:rgba(63,185,80,.95);font-weight:700}
.dashboard-auto-analysis-empty-copy{flex:1;min-width:0}
.dashboard-auto-analysis-empty-lead{margin:0;font-size:13px;font-weight:700;line-height:1.35;color:var(--text);letter-spacing:-.02em}
.dashboard-auto-analysis-empty-detail{margin:0;font-size:12px;line-height:1.45;color:var(--text2);max-width:48ch}
.dashboard-auto-analysis-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
.dashboard-auto-analysis-item{margin:0;padding:0;border-radius:14px;border:0.5px solid rgba(148,163,184,.14);overflow:hidden;display:block;box-shadow:0 1px 0 rgba(255,255,255,.04) inset}
.dashboard-auto-analysis-item--accent-actions{border-left:4px solid var(--color-warning-border, rgba(245,158,11,.95));background:linear-gradient(105deg,color-mix(in srgb,var(--color-warning-bg) 95%,transparent),rgba(255,255,255,.02) 42%)}
.dashboard-auto-analysis-item--accent-incidents{border-left:4px solid var(--color-danger-border, rgba(239,68,68,.95));background:linear-gradient(105deg,color-mix(in srgb,var(--color-danger-bg) 95%,transparent),rgba(255,255,255,.02) 42%)}
.dashboard-auto-analysis-item--accent-compliance{border-left:4px solid var(--color-primary-border, rgba(20,184,166,.9));background:linear-gradient(105deg,color-mix(in srgb,var(--color-primary-bg) 88%,transparent),rgba(255,255,255,.02) 42%)}
.dashboard-auto-analysis-item--accent-calm{border-left:4px solid var(--color-success-border, rgba(34,197,94,.9));background:linear-gradient(105deg,color-mix(in srgb,var(--color-success-bg) 90%,transparent),rgba(255,255,255,.02) 42%)}
.dashboard-auto-analysis-item-body{min-width:0;padding:12px 14px 13px;display:flex;flex-direction:column;gap:0}
.dashboard-auto-analysis-field{margin:0 0 12px}
.dashboard-auto-analysis-field:last-of-type{margin-bottom:10px}
.dashboard-auto-analysis-field-lbl{display:block;margin:0 0 5px;font-size:9px;font-weight:700;letter-spacing:.11em;text-transform:uppercase;color:var(--text3)}
.dashboard-auto-analysis-msg{margin:0;font-size:14px;font-weight:600;line-height:1.45;color:var(--text);letter-spacing:-.015em}
.dashboard-auto-analysis-msg--title{font-size:14px;font-weight:800;letter-spacing:-.025em;line-height:1.22;margin:0 0 4px}
.dashboard-auto-analysis-rec{margin:0;font-size:13px;line-height:1.55;color:var(--text2);font-weight:400}
.dashboard-auto-analysis-rec--key{font-size:12.5px;font-weight:700;font-variant-numeric:tabular-nums;color:var(--text);line-height:1.35;margin:0 0 2px;max-width:100%}
.dashboard-auto-analysis-item-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;padding-top:10px;border-top:0.5px solid rgba(148,163,184,.1);align-items:center}
.dashboard-auto-analysis-act{padding:7px 14px;border-radius:999px;border:0.5px solid rgba(148,163,184,.2);background:rgba(255,255,255,.05);color:var(--text);font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit;transition:background .15s ease,border-color .15s ease,transform .12s ease}
@media (prefers-reduced-motion:no-preference){.dashboard-auto-analysis-act:hover{transform:translateY(-1px)}}
.dashboard-auto-analysis-act:focus-visible{outline:none;box-shadow:var(--ds-shadow-focus)}
.dashboard-auto-analysis-act--see{border-color:rgba(20,184,166,.42);color:var(--accent-blue);background:rgba(20,184,166,.1)}
.dashboard-auto-analysis-act--see:hover{background:rgba(20,184,166,.16);border-color:rgba(20,184,166,.5)}
.dashboard-auto-analysis-act--apply{border-color:rgba(66,199,140,.38);color:#4ade80;background:rgba(66,199,140,.1)}
.dashboard-auto-analysis-act--apply:hover{background:rgba(66,199,140,.16);border-color:rgba(66,199,140,.48)}
.dashboard-block-actions{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;margin-top:10px;padding-top:10px;border-top:1px solid rgba(148,163,184,.1)}
.dashboard-block-actions--hero{margin-top:0;padding-top:0;border-top:none;align-items:center}
.dashboard-block-actions--tight{margin-top:8px;padding-top:8px}
.dashboard-block-actions-sep{color:var(--text3);font-size:12px;font-weight:600;user-select:none}
.dashboard-block-link{
  padding:7px 14px;
  border-radius:10px;
  border:1px solid var(--color-border-tertiary, rgba(148,163,184,.18));
  background:var(--color-background-secondary, rgba(255,255,255,.06));
  color:var(--accent-blue);
  font-size:12px;
  font-weight:700;
  cursor:pointer;
  text-decoration:none;
  font-family:inherit;
  transition:background .18s ease,border-color .18s ease,box-shadow .18s ease;
  box-shadow:0 2px 8px rgba(0,0,0,.08);
}
.dashboard-block-link:hover{
  opacity:1;
  background:var(--color-background-info, rgba(20,184,166,.12));
  border-color:var(--color-border-info, rgba(20,184,166,.38));
  box-shadow:0 4px 16px rgba(20,184,166,.15);
}
.dashboard-block-link:focus-visible{outline:none;box-shadow:var(--ds-shadow-focus);border-radius:8px}
.dashboard-alerts-prio-footer{margin-top:6px;padding-top:8px;border-top:1px solid rgba(148,163,184,.08)}
.dashboard-alerts-prio-footer .dashboard-block-actions{margin-top:0;padding-top:0;border-top:none}
.dashboard-vigilance-actions,.dashboard-auto-analysis-actions{margin-top:10px;padding-top:10px;border-top:1px solid rgba(148,163,184,.08)}
.dashboard-vigilance-actions .dashboard-block-actions,.dashboard-auto-analysis-actions .dashboard-block-actions{margin-top:0;padding-top:0;border-top:none}
.dashboard-kpi-foot{margin-top:2px;padding:0 2px 4px}
.dashboard-kpi-foot .dashboard-block-actions{margin-top:8px;padding-top:10px;border-top:1px dashed rgba(148,163,184,.14)}
.dashboard-chart-card-footacts{padding:0 18px 14px;margin-top:-2px}
.dashboard-chart-card-footacts .dashboard-block-actions{margin-top:0;padding-top:8px;border-top:1px solid rgba(148,163,184,.08)}
.dashboard-sys-status__actions{margin-top:4px;padding-top:8px;border-top:1px solid rgba(148,163,184,.08)}
.dashboard-sys-status__actions .dashboard-block-actions{margin-top:0;padding-top:0;border-top:none}
.dashboard-activity-col-ctas{margin-top:8px;display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center}
.dashboard-activity-global-ctas{margin-top:14px;display:flex;flex-wrap:wrap;gap:8px 12px;justify-content:center;align-items:center}
.dashboard-sys-status{display:grid;grid-template-columns:4px minmax(0,1fr);gap:0;padding:0;overflow:hidden;border-radius:var(--ds-radius-md,14px);min-height:0}
.dashboard-sys-status__strip{border-radius:3px 0 0 3px;min-height:88px;align-self:stretch}
.dashboard-sys-status__strip--stable{background:linear-gradient(180deg,rgba(66,199,140,.85),rgba(52,163,110,.45))}
.dashboard-sys-status__strip--watch{background:linear-gradient(180deg,rgba(243,179,79,.9),rgba(217,119,6,.5))}
.dashboard-sys-status__strip--fix{background:linear-gradient(180deg,rgba(239,91,107,.9),rgba(220,38,38,.55))}
.dashboard-sys-status__body{padding:12px 16px 14px 14px;display:flex;flex-direction:column;gap:8px;min-width:0}
.dashboard-sys-status__headline{margin:0;font-size:15px;font-weight:800;letter-spacing:-.02em;line-height:1.25;color:var(--text)}
.dashboard-sys-status__hint{margin:0;font-size:12px;line-height:1.35;color:var(--text2);font-weight:500;max-width:52ch}
.dashboard-sys-status__grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px 14px;margin-top:4px}
.dashboard-sys-status__cell{display:flex;flex-direction:column;gap:3px;padding:8px 10px;border-radius:var(--ds-radius-sm,10px);background:rgba(255,255,255,.04);border:1px solid rgba(148,163,184,.08);min-width:0}
.dashboard-sys-status__label{font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);line-height:1.2}
.dashboard-sys-status__value{font-size:14px;font-weight:800;color:var(--text);line-height:1.25;font-variant-numeric:tabular-nums}
.dashboard-sys-status--stable .dashboard-sys-status__body{background:linear-gradient(135deg,rgba(66,199,140,.06),transparent)}
.dashboard-sys-status--watch .dashboard-sys-status__body{background:linear-gradient(135deg,rgba(243,179,79,.07),transparent)}
.dashboard-sys-status--fix .dashboard-sys-status__body{background:linear-gradient(135deg,rgba(239,91,107,.07),transparent)}
@media (max-width:900px){.dashboard-sys-status__grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:600px){.dashboard-cockpit{padding:18px 16px}.dashboard-cockpit__minis{grid-template-columns:repeat(2,1fr)}.dashboard-cockpit__bar-row{grid-template-columns:minmax(96px,1fr) minmax(0,1.6fr) 40px;gap:10px}.dashboard-shortcuts__grid{grid-template-columns:repeat(2,minmax(0,1fr))}.dashboard-alerts-prio-tier-strip{grid-template-columns:1fr}.dashboard-alerts-prio-row{grid-template-columns:24px 1fr auto;grid-template-areas:"icon tier badge" "icon main main"}.dashboard-alerts-prio-icon{grid-area:icon;align-self:start;padding-top:2px}.dashboard-alerts-prio-tier{grid-area:tier}.dashboard-alerts-prio-main{grid-area:main}.dashboard-alerts-prio-badge{grid-area:badge;justify-self:end}}
.dashboard-kpi-sticky {
  position: sticky;
  top: 0;
  z-index: 89;
  background: var(--bg, #0f172a);
  padding: 8px 0 12px;
  border-bottom: 1px solid rgba(255,255,255,.07);
  margin-bottom: 20px;
}
.dashboard-extended[data-expanded="false"]{display:none}
.dashboard-extended[data-expanded="true"]{display:block}
.dashboard-toggle-row{
  display:flex;justify-content:center;
  padding:6px 0 2px;
}
.dashboard-toggle-btn{
  display:flex;align-items:center;gap:8px;
  background:none;
  border:1px solid rgba(255,255,255,.1);
  border-radius:20px;padding:6px 18px;
  color:var(--text2,rgba(255,255,255,.5));
  font-size:12px;cursor:pointer;
  transition:border-color 150ms,color 150ms;
}
.dashboard-toggle-btn:hover{
  border-color:rgba(255,255,255,.2);
  color:var(--text,rgba(255,255,255,.85));
}
[data-display-mode="simple"] .dashboard-toggle-row{
  display:none;
}
/* Espacement entre bandes — respiration premium */
.dashboard-band { margin-bottom: 8px; }
.dashboard-band + .dashboard-band { margin-top: 4px; }
.dashboard-band--ceo { margin-bottom: 0; }
.dashboard-band--priority { margin-top: 0; }

/* Réduction opacité des éléments secondaires */
.section-kicker {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  opacity: .55;
}
.dashboard-section-sub {
  font-size: 13px;
  opacity: .6;
  max-width: 52ch;
}

/* Titres de section plus tranchés */
.dashboard-section-title {
  font-size: clamp(18px, 1.8vw, 24px);
  font-weight: 800;
  letter-spacing: -.025em;
  line-height: 1.15;
}

/* CEO Hero — le rendre dominant */
.dashboard-ceo-hero__scorenum {
  font-size: clamp(56px, 6vw, 80px);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -.04em;
}

/* Convention couleur sémantique stricte */
.dashboard-band--priority .dashboard-section-kicker,
.section-kicker--alert { color: rgba(239,91,107,.9); }

.dashboard-band--cockpit .dashboard-section-kicker,
.section-kicker--info { color: rgba(20,184,166,.9); }

.dashboard-band--analysis .dashboard-section-kicker,
.section-kicker--analysis { color: rgba(148,103,254,.9); }

/* Suppression des bordures parasites sur les cartes secondaires */
.dashboard-band--tertiary .content-card {
  border-color: rgba(255,255,255,.05);
}

/* Démo — CEO hero dominant (fin de feuille, surcharge) */
.dashboard-ceo-hero__scorenum,
.dashboard-ceo-hero__score-num,
.dashboard-score-value {
  font-size: clamp(64px, 7vw, 88px) !important;
  font-weight: 900 !important;
  letter-spacing: -.04em !important;
  line-height: 1 !important;
}
.dashboard-ceo-hero {
  min-height: 220px;
}
.dashboard-section-title {
  font-size: clamp(19px, 1.9vw, 26px);
  font-weight: 800;
  letter-spacing: -.025em;
  line-height: 1.15;
}
.section-kicker {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  opacity: .5;
}
.dashboard-section-sub,
.dashboard-muted-lead,
.content-card-lead {
  font-size: 13px;
  line-height: 1.55;
  opacity: .65;
  max-width: 58ch;
}
.dashboard-band + .dashboard-band {
  margin-top: 6px;
}
.dashboard-band--ceo {
  margin-bottom: 2px;
}

/* ── Convention sémantique stricte ──────────────── */
/* Rouge = action requise / urgent                   */
.dashboard-band--priority .section-kicker,
.dashboard-band--alerts .section-kicker,
.dashboard-section-kicker--alert {
  color: rgba(239, 91, 107, .85);
  opacity: 1;
}

/* Teal = information / pilotage                     */
.dashboard-band--cockpit .section-kicker,
.dashboard-band--ceo .section-kicker,
.dashboard-section-kicker--info {
  color: rgba(20, 184, 166, .85);
  opacity: 1;
}

/* Teal clair = analyse / IA (aligné marque)         */
.dashboard-band--analysis .section-kicker,
.dashboard-band--secondary .section-kicker,
.dashboard-section-kicker--analysis {
  color: rgba(94, 234, 212, .88);
  opacity: 1;
}

/* Vert = situation normale / activité               */
.dashboard-band--situation .section-kicker,
.dashboard-band--tertiary .section-kicker,
.dashboard-section-kicker--ok {
  color: rgba(52, 211, 153, .85);
  opacity: 1;
}

/* ── Cartes secondaires plus légères ────────────── */
.dashboard-band--tertiary .content-card {
  border-color: rgba(255, 255, 255, .04);
  background: rgba(255, 255, 255, .015);
}

/* ── Metric cards — valeurs plus lisibles ───────── */
.metric-value {
  font-size: clamp(28px, 3vw, 38px);
  font-weight: 800;
  letter-spacing: -.03em;
  line-height: 1.1;
}
.metric-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  opacity: .55;
}
.metric-note {
  font-size: 12px;
  opacity: .5;
  line-height: 1.4;
}

/* Sections dupliquées — masquées au profit du cockpit premium */
.dashboard-band--cockpit,
.dashboard-band--situation,
.dashboard-band--priority {
  display: none !important;
}

/* Hero CEO « Cockpit QHSE » — masqué (cockpit premium suffit) */
.dashboard-band--ceo {
  display: none !important;
}

.dashboard-ceo-hero__legal-wrap {
  display: none !important;
}
.dashboard-ceo-hero {
  padding: 14px 20px !important;
  min-height: unset !important;
}
.dashboard-ceo-hero__body {
  align-items: center !important;
}
.dashboard-ceo-hero__visual {
  max-width: 110px !important;
}

.shortcut-live-badge {
  font-size: 10px;
  font-weight: 800;
  padding: 1px 7px;
  border-radius: 20px;
  background: rgba(239, 91, 107, 0.15);
  color: rgba(239, 91, 107, 0.9);
  margin-left: 6px;
  flex-shrink: 0;
}

.activity-row {
  display: block;
  padding: 0;
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(148, 163, 184, 0.11);
  box-sizing: border-box;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}
.activity-row--sev-crit {
  border-left: 3px solid rgba(220, 38, 38, 0.7);
}
.activity-row--sev-warn {
  border-left: 3px solid rgba(245, 158, 11, 0.55);
}
.activity-row--action-late {
  border-left: 3px solid rgba(245, 158, 11, 0.5);
}
.activity-row:hover {
  background: rgba(20, 184, 166, 0.07);
  border-color: rgba(20, 184, 166, 0.22);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.1);
}
.activity-row:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.38);
}
.activity-row__inner {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 10px 12px;
  align-items: start;
  padding: 12px 14px;
}
.activity-row__type {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 5px 8px;
  border-radius: 6px;
  background: rgba(20, 184, 166, 0.14);
  color: rgba(167, 243, 208, 0.95);
  flex-shrink: 0;
  min-width: 4.25rem;
  text-align: center;
  line-height: 1.2;
}
.activity-row__body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.activity-row__title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.35;
  color: rgba(241, 245, 249, 0.94);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}
.activity-row__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 10px;
  font-size: 11px;
  line-height: 1.35;
}
.activity-row__status {
  color: rgba(148, 163, 184, 0.78);
  flex: 1 1 12rem;
  min-width: 0;
  font-weight: 500;
}
.activity-row--sev-crit .activity-row__status {
  color: rgba(252, 165, 165, 0.95);
  font-weight: 600;
}
.activity-row--sev-warn .activity-row__status {
  color: rgba(253, 224, 71, 0.88);
  font-weight: 600;
}
.activity-row--action-late .activity-row__status {
  color: rgba(251, 191, 36, 0.9);
  font-weight: 600;
}
.activity-row__date {
  color: rgba(148, 163, 184, 0.52);
  flex-shrink: 0;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.activity-row__date::before {
  content: '·';
  margin-right: 6px;
  color: rgba(148, 163, 184, 0.28);
  font-weight: 700;
}
.activity-row__link {
  font-size: 14px;
  line-height: 1;
  color: rgba(45, 212, 191, 0.55);
  padding-top: 3px;
  transition: color 0.15s ease;
}
.activity-row:hover .activity-row__link {
  color: rgba(45, 212, 191, 0.95);
}

/* —— Analytics / Synthèse cockpit —— */
.page-stack.analytics-cockpit-page {
  gap: 1.15rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  --page-stack-pad-bottom: 1.5rem;
}
.analytics-page-hero__top {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px 24px;
  align-items: start;
}
.analytics-page-hero__copy {
  min-width: 0;
}
.analytics-page-kicker {
  margin: 0 0 6px;
}
.analytics-page-title {
  margin: 0;
  font-size: var(--type-page-title-size, clamp(1.6rem, 3vw, 2.05rem));
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.18;
  color: var(--text);
}
.analytics-page-lead {
  margin: 10px 0 0;
  max-width: min(68ch, 100%);
  font-size: 14px;
  line-height: 1.6;
  font-weight: 500;
  color: var(--text2);
}
.analytics-page-meta {
  margin: 0;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text3);
  text-align: right;
  max-width: 28ch;
  line-height: 1.35;
  padding-top: 2px;
}
@media (max-width: 720px) {
  .analytics-page-hero__top {
    grid-template-columns: 1fr;
  }
  .analytics-page-meta {
    text-align: left;
    max-width: none;
    padding-top: 0;
  }
}
.analytics-content-host {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  flex: 1;
}
.analytics-cockpit-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}
.analytics-cockpit-stack > * {
  min-width: 0;
}
.analytics-main-split {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(260px, 0.95fr);
  gap: 12px;
  align-items: start;
  min-width: 0;
}
.analytics-main-trend-col {
  min-width: 0;
}
.analytics-aside-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}
.analytics-chart-card--aside .content-card-head {
  padding-bottom: 6px;
}
.analytics-chart-card--aside .content-card-head h3 {
  font-size: clamp(14px, 1.25vw, 16px);
}
.analytics-decision-panel--stacked {
  grid-template-columns: 1fr;
  gap: 10px;
  padding: 12px 14px;
}
.analytics-key-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
.analytics-key-bars-row {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 2.2fr) auto;
  gap: 10px 12px;
  align-items: center;
  font-size: 12px;
}
.analytics-key-bars-label {
  color: var(--text2);
  font-weight: 600;
  line-height: 1.3;
}
.analytics-key-bars-track {
  height: 10px;
  border-radius: 999px;
  background: var(--color-background-tertiary, rgba(148, 163, 184, 0.12));
  border: 1px solid var(--color-border-tertiary, rgba(148, 163, 184, 0.1));
  overflow: hidden;
  min-width: 0;
}
.analytics-key-bars-fill {
  height: 100%;
  border-radius: 999px;
  min-width: 3px;
  transition: width 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.analytics-key-bars-row--inc .analytics-key-bars-fill {
  background: linear-gradient(90deg, rgba(234, 88, 12, 0.88), rgba(251, 113, 133, 0.55));
}
.analytics-key-bars-row--nc .analytics-key-bars-fill {
  background: linear-gradient(90deg, rgba(124, 58, 237, 0.88), rgba(99, 102, 241, 0.52));
}
.analytics-key-bars-row--late .analytics-key-bars-fill {
  background: linear-gradient(90deg, rgba(217, 119, 6, 0.9), rgba(245, 158, 11, 0.62));
}
.analytics-key-bars-row--aud .analytics-key-bars-fill {
  background: linear-gradient(90deg, rgba(13, 148, 136, 0.85), rgba(45, 212, 191, 0.5));
}
.analytics-key-bars-val {
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--text);
  font-size: 13px;
  min-width: 2ch;
  text-align: right;
}
.dashboard-pilot-load--compact {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dashboard-pilot-load--compact .dashboard-mix-bar--pilot-compact {
  height: 20px;
  border-radius: 10px;
}
.dashboard-mix-legend--pilot-compact {
  margin-top: 0;
  gap: 4px 10px;
  font-size: 10px;
}
.kpi-multi-line-target {
  stroke: rgba(245, 158, 11, 0.42);
  stroke-width: 1;
  fill: none;
}
.analytics-loading-line {
  margin: 0;
  font-size: 14px;
  color: var(--text2);
}
.analytics-periodic-card {
  border-radius: var(--ds-radius-lg, 16px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
}
.analytics-periodic-lead {
  margin-top: 6px !important;
  font-size: 12px !important;
  line-height: 1.45 !important;
}
.analytics-periodic-form {
  gap: 10px !important;
  align-items: flex-end !important;
}
.analytics-cockpit-header {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}
.analytics-cockpit-stat-hint {
  margin-top: 6px;
  font-size: 10px;
  line-height: 1.3;
  font-weight: 600;
  color: var(--text3);
}
.analytics-chart-card--main {
  box-shadow: 0 4px 28px rgba(0, 0, 0, 0.07);
}
.analytics-secondary-band {
  margin: 0;
}
.analytics-secondary-grid {
  gap: 10px;
}
.analytics-charts-grid.analytics-secondary-grid--quad {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.analytics-chart-card--cell {
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.analytics-chart-card--cell .content-card-head {
  flex-shrink: 0;
}
.analytics-chart-card--cell > *:last-child {
  flex: 1;
  min-height: 0;
}
.analytics-chart-card--main .kpi-multi-line-wrap {
  margin-top: 2px;
}
.kpi-multi-line-wrap--analytics .dashboard-line-chart-grid--base {
  stroke: rgba(148, 163, 184, 0.08);
  stroke-width: 1;
}
.kpi-multi-line-svg--analytics {
  filter: none;
  max-height: 200px;
}
.analytics-chart-card--main .kpi-multi-line-labels {
  font-size: 9px;
  font-weight: 600;
  opacity: 0.92;
}
.analytics-chart-card--main .kpi-multi-line-legend {
  margin-top: 8px;
  font-size: 11px;
  font-weight: 600;
  gap: 8px 14px;
}
.analytics-chart-card--main .dashboard-chart-interpret {
  margin-top: 12px;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.45;
  font-weight: 600;
  color: var(--text2);
  border-radius: 10px;
  border: 1px solid rgba(20, 184, 166, 0.2);
  background: rgba(20, 184, 166, 0.06);
  border-left: 3px solid rgba(20, 184, 166, 0.45);
}
.analytics-decision-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 16px 20px;
  padding: 16px 18px;
  border-radius: var(--ds-radius-lg, 16px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  background: rgba(255, 255, 255, 0.02);
  box-shadow: 0 2px 18px rgba(0, 0, 0, 0.06);
  align-items: start;
}
.analytics-synthesis p {
  margin: 0 0 8px;
  font-size: 14px;
  line-height: 1.5;
  font-weight: 600;
  color: var(--text);
}
.analytics-synthesis p:last-child {
  margin-bottom: 0;
}
.analytics-alerts-compact {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.analytics-alert-chip {
  padding: 8px 11px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.4;
  font-weight: 600;
  color: var(--text2);
  background: rgba(255, 255, 255, 0.04);
  border-left: 3px solid rgba(148, 163, 184, 0.4);
}
.analytics-alert-chip--critical {
  border-left-color: rgba(220, 38, 38, 0.85);
  background: rgba(239, 68, 68, 0.07);
  color: var(--text);
}
.analytics-alert-chip--high {
  border-left-color: rgba(245, 158, 11, 0.88);
  background: rgba(245, 158, 11, 0.08);
}
.analytics-alert-chip--info {
  border-left-color: rgba(20, 184, 166, 0.55);
  background: rgba(20, 184, 166, 0.06);
}
.analytics-cockpit-stat {
  padding: 12px 14px;
  border-radius: var(--ds-radius-lg, 14px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  background: linear-gradient(
    165deg,
    rgba(20, 184, 166, 0.05) 0%,
    rgba(18, 24, 30, 0.38) 55%,
    rgba(12, 16, 22, 0.22) 100%
  );
  box-shadow: 0 1px 12px rgba(0, 0, 0, 0.08);
}
.analytics-cockpit-stat-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text3);
  margin-bottom: 4px;
}
.analytics-cockpit-stat-value {
  font-size: clamp(20px, 2.8vw, 26px);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
}
.analytics-meta-line {
  margin: 0;
  font-size: 11px;
  color: var(--text3);
  letter-spacing: 0.02em;
}
.analytics-insights {
  margin: 0;
  padding: 16px 18px;
  border-radius: var(--ds-radius-lg, 16px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  background: rgba(255, 255, 255, 0.025);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
}
.analytics-insights-empty {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--text2);
  font-weight: 500;
}
.analytics-insights-kicker {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text3);
  margin-bottom: 12px;
}
.analytics-insight-line {
  margin: 0 0 8px;
  padding: 10px 12px 10px 14px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text2);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.035);
  border-left: 2px solid rgba(148, 163, 184, 0.35);
}
.analytics-insight-line--critical {
  border-left-color: rgba(220, 38, 38, 0.85);
  background: rgba(239, 68, 68, 0.06);
}
.analytics-insight-line--high {
  border-left-color: rgba(245, 158, 11, 0.88);
  background: rgba(245, 158, 11, 0.06);
}
.analytics-insight-line--info {
  border-left-color: rgba(20, 184, 166, 0.65);
  background: rgba(20, 184, 166, 0.06);
}
.analytics-insights-more {
  margin-top: 6px;
  font-size: 13px;
  color: var(--text3);
}
.analytics-insights-more summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--text2);
}
.analytics-charts-band {
  margin: 0;
  min-width: 0;
}
.analytics-charts-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.analytics-chart-card .content-card-head {
  padding-bottom: 6px;
}
.analytics-chart-card .content-card-head h3 {
  font-size: clamp(15px, 1.4vw, 17px);
}
.analytics-chart-card .dashboard-line-chart-wrap,
.analytics-chart-card .dashboard-mix-chart-wrap {
  margin-top: 4px;
}
.dashboard-line-chart-wrap--analytics .dashboard-line-chart-svg {
  filter: drop-shadow(0 1px 5px rgba(20, 184, 166, 0.06));
}
.dashboard-line-chart-wrap--analytics .dashboard-line-chart-grid--base {
  stroke: rgba(148, 163, 184, 0.07);
  stroke-width: 1;
}
.analytics-chart-card .dashboard-line-chart-values {
  font-size: 11px;
  font-weight: 700;
  color: var(--text2);
  padding-top: 2px;
}
.analytics-chart-card .dashboard-line-chart-labels {
  font-size: 9px;
  font-weight: 600;
  color: var(--text3);
  opacity: 0.9;
}
.analytics-chart-card .dashboard-line-chart-labels span {
  max-width: 3.5rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.analytics-chart-card .dashboard-mix-bar {
  height: 14px;
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(148, 163, 184, 0.09);
}
.analytics-chart-card .dashboard-mix-legend {
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text2);
}
.analytics-chart-card .dashboard-chart-interpret {
  display: block;
  margin-top: 10px;
  margin-bottom: 0;
  padding: 8px 11px 8px 12px;
  font-size: 11px;
  line-height: 1.45;
  font-weight: 600;
  color: var(--text2);
  border-left: 2px solid rgba(20, 184, 166, 0.4);
  background: rgba(20, 184, 166, 0.06);
  border-radius: 0 8px 8px 0;
  border-top: none;
  border-right: none;
  border-bottom: none;
}
.analytics-chart-card .dashboard-chart-interpret:empty {
  display: none;
}
.analytics-chart-card .dashboard-chart-foot:empty,
.analytics-chart-card .dashboard-mix-foot:empty {
  display: none;
  margin: 0;
  min-height: 0;
}
.analytics-list-overflow {
  margin: 8px 0 0;
  padding: 8px 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed rgba(148, 163, 184, 0.14);
}
.analytics-critical-col-scroll {
  max-height: min(52vh, 320px);
  overflow-y: auto;
  padding-right: 4px;
  min-height: 0;
}
.analytics-critical-col-scroll .stack {
  gap: 8px;
}
.analytics-critical-cockpit .analytics-critical-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  align-items: start;
}
.analytics-critical-col-title {
  margin: 0 0 10px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(20, 184, 166, 0.82);
}
.analytics-critical-cockpit .stack {
  gap: 6px;
}
.analytics-critical-cockpit {
  margin-top: 0;
}
.analytics-extended-details {
  margin: 0;
  padding: 12px 14px;
  border-radius: var(--ds-radius-lg, 14px);
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(255, 255, 255, 0.02);
}
.analytics-extended-details summary {
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  color: var(--text2);
  letter-spacing: -0.01em;
}
.analytics-extended-details summary:hover {
  color: var(--text);
}
.analytics-extended-details-inner {
  margin-top: 10px;
  gap: 10px !important;
}
.analytics-extended-details-inner .dashboard-kpi-grid {
  gap: 10px !important;
}
.analytics-periodic-wrap {
  margin-top: 0;
  padding-top: 10px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}
.analytics-automation-card {
  margin-top: 8px;
}
@media (max-width: 1100px) {
  .analytics-cockpit-header {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .analytics-decision-panel {
    grid-template-columns: 1fr;
  }
  .analytics-secondary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 960px) {
  .analytics-cockpit-header {
    grid-template-columns: 1fr;
  }
  .analytics-main-split {
    grid-template-columns: 1fr;
  }
  .analytics-charts-grid {
    grid-template-columns: 1fr;
  }
  .analytics-critical-cockpit .analytics-critical-grid {
    grid-template-columns: 1fr;
  }
}

/* —— Performance QHSE (KPI) —— */
.kpi-performance-page {
  gap: 28px;
}
.kpi-perf-content.stack {
  gap: 28px !important;
}
.kpi-perf-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px 24px;
}
.kpi-perf-header--toolbar-only {
  align-items: center;
  justify-content: flex-end;
}
.kpi-perf-title-block {
  flex: 1 1 220px;
  min-width: 0;
}
.kpi-perf-title {
  margin: 0;
  font-size: clamp(22px, 2.4vw, 28px);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
  color: var(--text1, var(--color-text));
}
.kpi-perf-lead {
  margin: 8px 0 0;
  max-width: 52ch;
  font-size: 13px;
  line-height: 1.45;
  color: var(--text3, var(--color-text-muted));
}
.kpi-perf-lead strong {
  color: var(--text2, var(--color-text));
  font-weight: 600;
}
.kpi-perf-kpi-legend {
  margin: 0;
  font-size: 11px;
  color: var(--text3);
}
.kpi-perf-foot {
  margin: 0;
  padding-top: 8px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--text3);
  max-width: 72ch;
}
.kpi-perf-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
  align-items: flex-end;
}
.kpi-perf-field span {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text3, var(--color-text-muted));
}
.kpi-perf-loading {
  margin: 0;
  font-size: 14px;
  color: var(--text2);
}
.kpi-perf-kpi-block {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.kpi-perf-section-k {
  margin: 0 0 2px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text3);
}
.kpi-perf-main-grid.kpi-grid.dashboard-kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 16px;
}
.kpi-perf-main-grid.kpi-grid.dashboard-kpi-grid.kpi-perf-main-grid--tier-strat,
.kpi-perf-main-grid.kpi-grid.dashboard-kpi-grid.kpi-perf-main-grid--tier-ops {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}
.kpi-perf-main-grid.kpi-grid.dashboard-kpi-grid.kpi-perf-main-grid--tier-ops {
  margin-top: 0;
}
.kpi-perf-pilotage-row {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 22px;
  align-items: stretch;
}
.kpi-perf-band--charts {
  padding: 16px 18px 18px;
  border-radius: var(--ds-radius-lg, 18px);
  border: 1px solid var(--color-border-tertiary, rgba(148, 163, 184, 0.14));
  background: var(
    --kpi-perf-band-bg,
    linear-gradient(
      180deg,
      rgba(248, 250, 252, 0.65) 0%,
      var(--color-background-primary, #fff) 100%
    )
  );
  box-shadow: 0 2px 20px rgba(15, 23, 42, 0.04);
}
.kpi-perf-dx-kicker {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text3);
  opacity: 0.88;
  margin-bottom: 4px;
}
.kpi-perf-main-gap {
  margin-top: 12px;
  padding: 9px 11px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text2);
  letter-spacing: 0.02em;
  line-height: 1.45;
  background: rgba(148, 163, 184, 0.08);
}
.kpi-perf-main-gap--red {
  color: rgba(185, 28, 28, 0.95);
  background: rgba(239, 68, 68, 0.09);
  font-weight: 800;
}
.kpi-perf-main-gap--amber {
  color: rgba(146, 64, 14, 0.98);
  background: rgba(245, 158, 11, 0.1);
  font-weight: 800;
}
.kpi-perf-main-gap--green {
  color: rgba(21, 128, 61, 0.95);
  background: rgba(34, 197, 94, 0.08);
  font-weight: 800;
}
.kpi-perf-main-gap--blue {
  font-weight: 700;
  background: rgba(45, 212, 191, 0.07);
}
.kpi-perf-cockpit-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: 20px 28px;
  padding: 22px 24px;
  border-radius: var(--ds-radius-lg, 18px);
  border: 1px solid var(--color-border-tertiary, rgba(148, 163, 184, 0.14));
  background: linear-gradient(
    145deg,
    var(--color-background-secondary, rgba(248, 250, 252, 0.9)) 0%,
    var(--color-background-primary, #fff) 48%,
    rgba(99, 102, 241, 0.06) 100%
  );
  box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06);
  align-items: stretch;
}
.kpi-perf-hero-score {
  min-width: 0;
}
.kpi-perf-hero-k {
  display: block;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  color: var(--text3);
  margin-bottom: 10px;
}
.kpi-perf-hero-val-row {
  display: flex;
  align-items: baseline;
  gap: 6px 10px;
  flex-wrap: wrap;
}
.kpi-perf-hero-val {
  font-size: clamp(36px, 5vw, 48px) !important;
  font-weight: 900 !important;
  letter-spacing: -0.04em;
  line-height: 1;
}
.kpi-perf-hero-pct {
  font-size: 22px;
  font-weight: 800;
  color: var(--text3);
}
.kpi-perf-hero-trend {
  font-size: 28px;
  font-weight: 800;
  color: var(--color-text-info, #0f766e);
  margin-left: 4px;
}
.kpi-perf-hero-sub {
  margin: 14px 0 0;
  font-size: 14px;
  color: var(--text2);
  line-height: 1.65;
}
.kpi-perf-hero-sub strong {
  color: var(--text);
}
.kpi-perf-hero-vigil {
  padding: 18px 20px;
  border-radius: var(--ds-radius-md, 14px);
  border: 1px solid var(--color-border-tertiary);
  background: var(--color-background-primary);
  min-width: 0;
}
.kpi-perf-hero-vigil--green {
  border-color: rgba(34, 197, 94, 0.28);
  background: rgba(34, 197, 94, 0.06);
}
.kpi-perf-hero-vigil--amber {
  border-color: rgba(245, 158, 11, 0.35);
  background: rgba(245, 158, 11, 0.07);
}
.kpi-perf-hero-vigil--red {
  border-color: rgba(239, 68, 68, 0.38);
  background: rgba(239, 68, 68, 0.08);
}
.kpi-perf-hero-vigil-k {
  display: block;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text3);
  margin-bottom: 8px;
}
.kpi-perf-hero-vigil-l {
  font-size: clamp(20px, 2.4vw, 26px);
  font-weight: 900;
  letter-spacing: -0.03em;
  color: var(--text);
}
.kpi-perf-hero-vigil-h {
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.65;
  color: var(--text2);
}
.kpi-perf-charts-bank {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.92fr) minmax(0, 0.92fr);
  gap: 16px;
  align-items: stretch;
  min-width: 0;
}
.kpi-perf-chart-card--goalvs .kpi-perf-goalvs-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 6px;
}
.kpi-perf-goalvs-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2.4fr);
  grid-template-rows: auto auto;
  gap: 8px 14px;
  align-items: center;
}
.kpi-perf-goalvs-label {
  grid-row: 1 / span 2;
  font-size: 12px;
  font-weight: 700;
  color: var(--text2);
  line-height: 1.45;
}
.kpi-perf-goalvs-track {
  position: relative;
  height: 10px;
  border-radius: 999px;
  background: var(--color-background-tertiary, rgba(148, 163, 184, 0.12));
  border: 1px solid var(--color-border-tertiary);
  overflow: visible;
}
.kpi-perf-goalvs-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(79, 70, 229, 0.85), rgba(45, 212, 191, 0.65));
  min-width: 0;
  transition: width 0.35s ease;
}
.kpi-perf-goalvs-marker {
  position: absolute;
  top: -3px;
  width: 2px;
  height: 16px;
  margin-left: -1px;
  border-radius: 1px;
  background: rgba(245, 158, 11, 0.95);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.5);
  pointer-events: none;
}
.kpi-perf-goalvs-vals {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text3);
  line-height: 1.45;
}
.kpi-perf-goalvs-real {
  color: var(--text);
}
.kpi-perf-goalvs-foot {
  margin: 16px 0 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--text3);
}
.kpi-perf-charge-body .dashboard-pilot-load--compact {
  margin-top: 2px;
}
.kpi-perf-charge-audits {
  margin: 14px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text3);
  font-weight: 600;
}
.kpi-perf-chart-card--progress .dashboard-line-chart-wrap .dashboard-line-chart-svg {
  max-height: 200px;
}
.kpi-perf-gaps {
  padding: 20px 22px;
  border-radius: var(--ds-radius-lg, 16px);
  border: 1px solid var(--color-border-tertiary);
  background: var(--color-background-primary);
  box-shadow: 0 2px 16px rgba(15, 23, 42, 0.05);
}
.kpi-perf-gaps-title {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text3);
}
.kpi-perf-gaps-sub {
  margin: 0 0 18px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text2);
  letter-spacing: 0.01em;
  line-height: 1.55;
}
.kpi-perf-gaps-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px 18px;
}
.kpi-perf-gaps-col {
  padding: 16px 16px 14px 18px;
  border-radius: 12px;
  border: 1px solid var(--color-border-tertiary);
  background: var(--color-background-secondary, rgba(248, 250, 252, 0.6));
  min-width: 0;
}
.kpi-perf-gaps-col--below {
  border-left: 3px solid rgba(239, 68, 68, 0.42);
}
.kpi-perf-gaps-col--watch {
  border-left: 3px solid rgba(245, 158, 11, 0.48);
}
.kpi-perf-gaps-col--ok {
  border-left: 3px solid rgba(34, 197, 94, 0.38);
}
.kpi-perf-gaps-col-k {
  display: block;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 10px;
  color: var(--text3);
}
.kpi-perf-gaps-col--below .kpi-perf-gaps-col-k {
  color: rgba(185, 28, 28, 0.9);
}
.kpi-perf-gaps-col--watch .kpi-perf-gaps-col-k {
  color: rgba(180, 83, 9, 0.95);
}
.kpi-perf-gaps-col--ok .kpi-perf-gaps-col-k {
  color: rgba(21, 128, 61, 0.9);
}
.kpi-perf-gaps-list {
  margin: 0;
  padding-left: 1.15em;
  font-size: 13px;
  font-weight: 500;
  color: var(--text2);
  line-height: 1.65;
}
.kpi-perf-gaps-list li {
  margin-bottom: 8px;
}
.kpi-perf-gaps-list li:last-child {
  margin-bottom: 0;
}
.kpi-perf-gaps-empty {
  list-style: none;
  margin-left: -1.1em;
  color: var(--text3);
  font-weight: 600;
}
.kpi-perf-priorities {
  padding: 20px 22px;
  border-radius: var(--ds-radius-lg, 16px);
  border: 1px solid rgba(99, 102, 241, 0.2);
  background: linear-gradient(
    165deg,
    rgba(99, 102, 241, 0.07) 0%,
    var(--color-background-primary) 55%
  );
}
.kpi-perf-priorities-title {
  margin: 0 0 14px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text3);
}
.kpi-perf-priorities-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.kpi-perf-priorities-list li {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.55;
  color: var(--text);
}
.kpi-perf-priorities-idx {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 900;
  color: var(--color-text-info, #0f766e);
  background: rgba(20, 184, 166, 0.14);
  border: 1px solid rgba(20, 184, 166, 0.28);
  margin-top: 2px;
}
.kpi-perf-priorities-txt {
  flex: 1;
  min-width: 0;
}
[data-theme='dark'] .kpi-perf-cockpit-hero {
  background: linear-gradient(
    145deg,
    rgba(17, 24, 39, 0.98) 0%,
    rgba(15, 23, 42, 0.95) 50%,
    rgba(99, 102, 241, 0.1) 100%
  );
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
}
[data-theme='dark'] .kpi-perf-band--charts {
  background: linear-gradient(
    180deg,
    rgba(17, 24, 39, 0.55) 0%,
    rgba(15, 23, 42, 0.35) 100%
  );
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
}
.kpi-perf-main-card.metric-card {
  gap: 10px;
  padding: 18px 18px 20px;
  min-height: 0;
}
.kpi-perf-main-card .metric-label {
  line-height: 1.35;
  margin-bottom: 2px;
}
.kpi-perf-main-card {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  border: 1px solid rgba(148, 163, 184, 0.12);
  outline: none;
}
.kpi-perf-main-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.14);
}
.kpi-perf-main-card:focus-visible {
  box-shadow: 0 0 0 2px rgba(45, 212, 191, 0.55);
}
.kpi-perf-main-card--red {
  border-color: rgba(239, 91, 107, 0.22);
}
.kpi-perf-main-card--amber {
  border-color: rgba(245, 158, 11, 0.25);
}
.kpi-perf-main-card--green {
  border-color: rgba(52, 211, 153, 0.22);
}
.kpi-perf-main-card--blue {
  border-color: rgba(45, 212, 191, 0.18);
}
.kpi-perf-main-value {
  font-size: clamp(20px, 2.2vw, 26px) !important;
}
.kpi-perf-main-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  margin-top: 10px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text3);
}
.kpi-perf-delta {
  font-weight: 600;
  color: var(--text2);
}
.kpi-perf-goal {
  opacity: 0.9;
}
.kpi-perf-main-hint {
  margin-top: 10px;
  font-size: 11px;
  font-weight: 600;
  color: rgba(45, 212, 191, 0.85);
  letter-spacing: 0.02em;
}
.kpi-perf-h2 {
  margin: 0;
  font-size: clamp(17px, 1.6vw, 20px);
  font-weight: 700;
}
.kpi-perf-h2--small {
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text3);
}
.kpi-perf-chart-card .kpi-multi-line-wrap {
  padding: 4px 0 2px;
}
.kpi-multi-line-wrap {
  width: 100%;
  min-width: 0;
}
.kpi-multi-line-svg {
  width: 100%;
  height: auto;
  display: block;
  max-height: 200px;
}
.kpi-multi-line-labels {
  display: flex;
  justify-content: space-between;
  gap: 4px;
  margin-top: 6px;
  font-size: 10px;
  color: var(--text3);
}
.kpi-multi-line-labels span {
  flex: 1;
  text-align: center;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.kpi-multi-line-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
  font-size: 12px;
  color: var(--text2);
}
.kpi-multi-line-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.kpi-multi-line-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.kpi-perf-secondary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.kpi-perf-secondary--dual .kpi-perf-dual-rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
}
.kpi-perf-dual-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.kpi-perf-dual-k {
  font-size: 12px;
  color: var(--text3);
  font-weight: 600;
}
.kpi-perf-dual-v {
  font-size: 18px !important;
}
.kpi-perf-secondary {
  padding: 14px 16px;
  border-radius: var(--ds-radius-lg, 16px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  background: rgba(0, 0, 0, 0.06);
}
.kpi-perf-secondary-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text3);
  margin-bottom: 6px;
}
.kpi-perf-secondary-value {
  font-size: 20px !important;
}
.kpi-perf-secondary-sub {
  margin-top: 6px;
  font-size: 11px;
  color: var(--text3);
  line-height: 1.35;
}
.kpi-perf-alerts-wrap {
  margin: 0;
}
.kpi-perf-alerts-details {
  padding: 16px 18px;
  border-radius: var(--ds-radius-lg, 14px);
  border: 1px dashed rgba(148, 163, 184, 0.28);
  background: rgba(0, 0, 0, 0.06);
}
.kpi-perf-alerts-summary {
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.45;
  color: var(--text2);
}
.kpi-perf-alerts-stack {
  margin-top: 14px;
  gap: 12px !important;
}
.kpi-perf-link-analytics {
  align-self: flex-start;
  margin-top: 8px;
}
.kpi-perf-alert {
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--text2);
  background: rgba(0, 0, 0, 0.1);
  border-left: 3px solid rgba(148, 163, 184, 0.5);
}
.kpi-perf-alert--critical {
  border-left-color: rgba(239, 91, 107, 0.95);
  background: rgba(239, 91, 107, 0.07);
}
.kpi-perf-alert--high {
  border-left-color: rgba(245, 158, 11, 0.9);
  background: rgba(245, 158, 11, 0.06);
}
.kpi-perf-alert--info {
  border-left-color: rgba(45, 212, 191, 0.75);
  background: rgba(45, 212, 191, 0.05);
}
.kpi-perf-insight {
  padding: 14px 18px;
  border-radius: var(--ds-radius-lg, 16px);
  border: 1px solid rgba(61, 184, 154, 0.2);
  background: linear-gradient(
    165deg,
    rgba(61, 184, 154, 0.08) 0%,
    rgba(18, 24, 32, 0.4) 100%
  );
}
.kpi-perf-insight-k {
  display: block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text3);
  margin-bottom: 8px;
}
.kpi-perf-insight-text {
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
  color: var(--text2);
  font-weight: 500;
}
.kpi-perf-meta {
  margin: 0;
  font-size: 11px;
  color: var(--text3);
}
.kpi-perf-muted {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--text3);
}
@media (max-width: 1320px) {
  .kpi-perf-main-grid.kpi-grid.dashboard-kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 1100px) {
  .kpi-perf-main-grid.kpi-grid.dashboard-kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .kpi-perf-charts-bank {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 900px) {
  .kpi-perf-cockpit-hero {
    grid-template-columns: 1fr;
  }
  .kpi-perf-gaps-grid {
    grid-template-columns: 1fr;
  }
  .kpi-perf-pilotage-row {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 560px) {
  .kpi-perf-main-grid.kpi-grid.dashboard-kpi-grid {
    grid-template-columns: 1fr;
  }
  .kpi-perf-secondary-grid {
    grid-template-columns: 1fr;
  }
}
`;function Dt(){if(document.getElementById($n))return;const e=document.createElement("style");e.id=$n,e.textContent=gc,document.head.append(e)}function bc(e){const t=(e==null?void 0:e.stats)||{},a=Array.isArray(t.criticalIncidents)?t.criticalIncidents.length:0,r=Math.max(0,Number(t.overdueActions)||0),n=Math.max(0,Number(e.ncOpenCount)||0);let i=100;i-=Math.min(a*14,44),i-=Math.min(r*3.5,36),i-=Math.min(n*2.5,30);const o=!!e.hasAuditScores,s=Number(e.avgAuditScore);return o&&Number.isFinite(s)&&(s>=78?i+=5:s<55?i-=14:s<68&&(i-=8)),Math.max(0,Math.min(100,Math.round(i)))}function hc(e){return e>=74?{tone:"ok",label:"Posture globale favorable",hint:""}:e>=52?{tone:"watch",label:"Vigilance recommandée",hint:"Des sujets méritent un arbitrage dans les prochains échanges de pilotage."}:{tone:"risk",label:"Pilotage serré nécessaire",hint:"Plusieurs signaux se cumulent : prioriser les décisions et le suivi des plans."}}function xc(e){return e==="ok"?"Stable":e==="watch"?"Vigilance":"Critique"}function fc(e){const t=String((e==null?void 0:e.status)||"").toLowerCase();return t?!/(clos|ferm|done|termin|clôtur|résolu|resolu|complete)/i.test(t):!0}function vc(e,t){const s=t==="ok"?"rgba(52,211,153,.95)":t==="watch"?"rgba(251,191,36,.95)":"rgba(248,113,113,.95)",c="rgba(148,163,184,.18)",l=Math.PI*78,d=Math.max(0,Math.min(100,e))/100,u=l*d,p=document.createElementNS("http://www.w3.org/2000/svg","svg");p.setAttribute("viewBox","0 0 200 112"),p.setAttribute("class","dashboard-ceo-hero__svg"),p.setAttribute("role","img"),p.setAttribute("aria-hidden","true");const g=document.createElementNS("http://www.w3.org/2000/svg","path");g.setAttribute("d","M 22 100 A 78 78 0 0 1 178 100"),g.setAttribute("fill","none"),g.setAttribute("stroke",c),g.setAttribute("stroke-width","12"),g.setAttribute("stroke-linecap","round");const m=document.createElementNS("http://www.w3.org/2000/svg","path");return m.setAttribute("d","M 22 100 A 78 78 0 0 1 178 100"),m.setAttribute("fill","none"),m.setAttribute("stroke",s),m.setAttribute("stroke-width","12"),m.setAttribute("stroke-linecap","round"),m.setAttribute("stroke-dasharray",`${u} ${l}`),p.append(g,m),p}function yc(e,t={}){var g;const a=typeof t.onExport=="function"?t.onExport:()=>{},r=document.createElement("article");r.className="dashboard-ceo-hero",r.setAttribute("aria-labelledby","dashboard-ceo-title"),r.style.boxSizing="border-box",r.innerHTML=`
    <div class="dashboard-ceo-hero__topbar">
      <span class="dashboard-ceo-hero__site" data-ceo-site></span>
      <button type="button" class="btn btn-primary dashboard-ceo-hero__export dashboard-hero__cta--featured dashboard-export-btn">
        Exporter le reporting
      </button>
    </div>
    <div class="dashboard-ceo-hero__body">
      <div class="dashboard-ceo-hero__visual" data-ceo-visual>
        <span class="dashboard-ceo-hero__status" data-ceo-status-badge>—</span>
        <div class="dashboard-ceo-hero__ring-wrap" data-ceo-ring></div>
        <div class="dashboard-ceo-hero__scorenum" data-ceo-score>—</div>
        <p class="dashboard-ceo-hero__scorecaption" data-ceo-caption>Indice QHSE synthétique</p>
        <p class="dashboard-ceo-hero__scorehint" data-ceo-hint></p>
      </div>
      <div class="dashboard-ceo-hero__text">
        <p class="dashboard-ceo-hero__eyebrow"></p>
        <h1 id="dashboard-ceo-title" class="dashboard-ceo-hero__title">Cockpit QHSE</h1>
        <p class="dashboard-ceo-hero__brief" data-ceo-brief></p>
        <details class="dashboard-ceo-hero__legal-wrap">
          <summary class="dashboard-ceo-hero__legal-summary">À propos de l’indice</summary>
          <p class="dashboard-ceo-hero__legal" data-ceo-legal></p>
        </details>
      </div>
    </div>
  `;const n=r.querySelector("[data-ceo-site]"),i=r.querySelector("[data-ceo-status-badge]"),o=r.querySelector("[data-ceo-ring]"),s=r.querySelector("[data-ceo-score]"),c=r.querySelector("[data-ceo-caption]"),l=r.querySelector("[data-ceo-hint]"),d=r.querySelector("[data-ceo-brief]"),u=r.querySelector("[data-ceo-visual]");s.style.fontSize="clamp(64px, 7vw, 88px)",s.style.fontWeight="900",s.style.letterSpacing="-0.04em",s.style.lineHeight="1",n.textContent=`Périmètre · ${e||"Tous sites"}`,(g=r.querySelector(".dashboard-ceo-hero__export"))==null||g.addEventListener("click",()=>a());function p(m){const b=(m==null?void 0:m.stats)||{},y=Array.isArray(m==null?void 0:m.ncs)?m.ncs:[],v=Array.isArray(m==null?void 0:m.audits)?m.audits:[],h=y.filter(fc).length,k=v.map(W=>Number(W.score)).filter(W=>Number.isFinite(W)),_=k.length>0,f=_?Math.round(k.reduce((W,K)=>W+K,0)/k.length):null,E=(m==null?void 0:m.siteLabel)!=null&&String(m.siteLabel).trim()?String(m.siteLabel).trim():e||"";n.textContent=`Périmètre · ${E||"Tous sites"}`;const w=Array.isArray(b.criticalIncidents)?b.criticalIncidents.length:0,x=Math.max(0,Number(b.overdueActions)||0),S=[];w>0&&S.push(`${w} critique(s) ouverte(s)`),x>0&&S.push(`${x} action(s) en retard`),h>0&&S.push(`${h} NC ouverte(s)`);const N=S.length?S.join(" · "):"Aucune alerte — situation maîtrisée";d.textContent=N;const L=bc({stats:b,ncOpenCount:h,avgAuditScore:f,hasAuditScores:_}),D=hc(L),q=xc(D.tone);s.textContent=String(L),c.textContent=D.label,l.textContent=D.hint,i.textContent=q,i.className=`dashboard-ceo-hero__status dashboard-ceo-hero__status--${D.tone}`,u.classList.remove("dashboard-ceo-hero__visual--ok","dashboard-ceo-hero__visual--watch","dashboard-ceo-hero__visual--risk"),u.classList.add(`dashboard-ceo-hero__visual--${D.tone}`),o.replaceChildren(),o.append(vc(L,D.tone))}return{root:r,update:p}}function Bo(e){const t=String(e||"").replace(/^#/,"");t&&(window.location.hash=t)}function Rt(e,t={}){var o;if(!Array.isArray(e)||!e.length)return null;const a=e.slice(0,2),r=t.role!==void 0?t.role:((o=Me())==null?void 0:o.role)??null,n=a.filter(s=>(s==null?void 0:s.pageId)&&yt(r,s.pageId));if(!n.length)return null;const i=document.createElement("div");return i.className=t.className||"dashboard-block-actions",n.forEach((s,c)=>{if(c>0){const d=document.createElement("span");d.className="dashboard-block-actions-sep",d.setAttribute("aria-hidden","true"),d.textContent="·",i.append(d)}const l=document.createElement("button");l.type="button",l.className="dashboard-block-link",l.textContent=s.label,l.addEventListener("click",()=>Bo(s.pageId)),i.append(l)}),i}const Ba=5;function Qi(e){if(!e)return"—";try{return new Date(e).toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"2-digit"})}catch{return"—"}}function kc(e){const t=String((e==null?void 0:e.status)||"").toLowerCase();return t?!/(clos|ferm|done|termin|clôtur|résolu|resolu|complete)/i.test(t):!0}function _c(e){const t=String((e==null?void 0:e.status)||"").toLowerCase();return t?/retard|late|overdue|dépass|reprogram|échéance|à planifier|non réalis/i.test(t):!1}function Nr(e){const t=String(e||"").replace(/^#/,"");t&&(window.location.hash=t)}function wc(e,t,a){const r=[],n=[];(Array.isArray(e==null?void 0:e.criticalIncidents)?e.criticalIncidents:[]).forEach(d=>{r.push({tier:"urgent",title:`${d.ref||"—"} — ${d.type||"Incident"}`,badge:"Critique",badgeTone:"red",meta:[d.site,Qi(d.createdAt)].filter(Boolean).join(" · "),hash:"incidents",icon:"⚡"})}),(Array.isArray(e==null?void 0:e.overdueActionItems)?e.overdueActionItems:[]).forEach(d=>{const u=[];d.dueDate&&u.push(`Échéance ${Qi(d.dueDate)}`),d.owner&&u.push(`Resp. ${d.owner}`),r.push({tier:"urgent",title:d.title||"Action en retard",badge:"Retard",badgeTone:"amber",meta:u.length?u.join(" · "):"À traiter",hash:"actions",icon:"⏱"})}),(Array.isArray(t)?t.filter(kc):[]).forEach(d=>{n.push({tier:"watch",title:d.title||"Non-conformité",badge:"NC ouverte",badgeTone:"amber",meta:d.auditRef?`Audit ${d.auditRef}`:Qi(d.createdAt),hash:"audits",icon:"◎"})}),(Array.isArray(a)?a.filter(_c):[]).forEach(d=>{n.push({tier:"watch",title:d.ref?`Audit ${d.ref}`:"Audit",badge:"Audit à suivre",badgeTone:"blue",meta:[d.site,d.status].filter(Boolean).join(" · ").slice(0,80),hash:"audits",icon:"◉"})});const l=[...r,...n];return{merged:l,urgent:r,watch:n,totalAvailable:l.length}}function qn(e){const t=document.createElement("button");t.type="button",t.className=`dashboard-alerts-prio-row dashboard-alerts-prio-row--${e.tier}`,t.setAttribute("role","listitem"),t.setAttribute("aria-label",`${e.tier==="urgent"?"Urgent":"À surveiller"} : ${e.title}`);const a=document.createElement("span");a.className="dashboard-alerts-prio-icon",a.setAttribute("aria-hidden","true"),a.textContent=e.icon||"•";const r=document.createElement("span");r.className="dashboard-alerts-prio-tier",r.textContent=e.tier==="urgent"?"Urgent":"À surveiller";const n=document.createElement("div");n.className="dashboard-alerts-prio-main";const i=document.createElement("span");i.className="dashboard-alerts-prio-title",i.textContent=e.title;const o=document.createElement("span");o.className="dashboard-alerts-prio-meta",o.textContent=e.meta,n.append(i,o);const s=document.createElement("span");return s.className=`dashboard-alerts-prio-badge badge ${e.badgeTone}`,s.textContent=e.badge,t.append(a,r,n,s),t.addEventListener("click",()=>Nr(e.hash)),t}function Ln(e,t,a){const r=document.createElement("div");r.className=`dashboard-alerts-prio-lane-head dashboard-alerts-prio-lane-head--${a}`;const n=document.createElement("span");n.className="dashboard-alerts-prio-lane-title",n.textContent=e;const i=document.createElement("span");return i.className="dashboard-alerts-prio-lane-count",i.textContent=String(t),r.append(n,i),r}function Ec(){const e=document.createElement("article");e.className="content-card card-soft dashboard-alerts-prio-card";const t=document.createElement("div");t.className="dashboard-alerts-prio-host",t.setAttribute("role","list"),e.append(t);function a({stats:r,ncs:n=[],audits:i=[]}){var g;(g=e.querySelector(".dashboard-alerts-prio-footer"))==null||g.remove();const{merged:o,urgent:s,watch:c,totalAvailable:l}=wc(r,n,i);if(t.replaceChildren(),o.length===0){t.setAttribute("role","region"),t.setAttribute("aria-label","Aucune alerte critique, système stable. Hiérarchie urgent, surveillance, normal.");const m=document.createElement("div");m.className="dashboard-alerts-prio-normal dashboard-alerts-prio-normal--stable";const b=document.createElement("div");b.className="dashboard-alerts-prio-tier-strip",b.setAttribute("aria-hidden","true"),[{l:"Urgent",s:"Rien à traiter",c:"urgent-idle"},{l:"À surveiller",s:"Calme",c:"watch-idle"},{l:"Normal",s:"Situation maîtrisée",c:"normal-active"}].forEach(f=>{const E=document.createElement("div");E.className=`dashboard-alerts-prio-tier-pill dashboard-alerts-prio-tier-pill--${f.c}`;const w=document.createElement("span");w.className="dashboard-alerts-prio-tier-pill-label",w.textContent=f.l;const x=document.createElement("span");x.className="dashboard-alerts-prio-tier-pill-sub",x.textContent=f.s,E.append(w,x),b.append(E)});const y=document.createElement("p");y.className="dashboard-alerts-prio-normal-msg",y.textContent="Aucune alerte critique — système stable";const v=document.createElement("p");v.className="dashboard-alerts-prio-normal-watch";const h=document.createElement("span");h.className="dashboard-alerts-prio-normal-watch-k",h.textContent="Synthèse",v.append(h,document.createTextNode(" · Priorité sur la prévention et le suivi des plans d’action."));const k=document.createElement("p");k.className="dashboard-alerts-prio-micro",k.textContent="Actions rapides :";const _=Rt([{label:"Voir les actions",pageId:"actions"},{label:"Voir les incidents",pageId:"incidents"}],{className:"dashboard-block-actions dashboard-block-actions--tight"});if(_)m.append(b,y,v,k,_);else{const f=document.createElement("div");f.className="dashboard-block-actions dashboard-block-actions--tight";const E=document.createElement("button");E.type="button",E.className="dashboard-block-link",E.textContent="Voir les actions",E.addEventListener("click",()=>Nr("actions"));const w=document.createElement("span");w.className="dashboard-block-actions-sep",w.setAttribute("aria-hidden","true"),w.textContent="·";const x=document.createElement("button");x.type="button",x.className="dashboard-block-link",x.textContent="Voir les incidents",x.addEventListener("click",()=>Nr("incidents")),f.append(E,w,x),m.append(b,y,v,k,f)}t.append(m);return}t.setAttribute("role","list"),t.removeAttribute("aria-label");const d=s.slice(0,Ba);let u=Ba-d.length;const p=u>0?c.slice(0,u):[];if(d.length&&(t.append(Ln("Urgent",s.length,"urgent")),d.forEach(m=>t.append(qn(m)))),p.length&&(t.append(Ln("À surveiller",c.length,"watch")),p.forEach(m=>t.append(qn(m)))),l>Ba){const m=document.createElement("p");m.className="dashboard-alerts-prio-more",m.textContent=`+${l-Ba} autre(s) — ouvrir les modules concernés.`,t.append(m)}}return{root:e,update:a}}function _t(e){const t=Ne.activeSiteId;if(!t)return e;const a=e.includes("?")?"&":"?";return`${e}${a}siteId=${encodeURIComponent(t)}`}function Go(e,t,a=6){const r=Math.max(1,Math.min(24,Math.floor(Number(a))||6)),n=new Date,i=[];for(let s=r-1;s>=0;s-=1){const c=new Date(n.getFullYear(),n.getMonth()-s,1);i.push({key:`${c.getFullYear()}-${c.getMonth()}`,label:c.toLocaleDateString("fr-FR",{month:"short"})})}const o=i.map(s=>({label:s.label,value:0}));return Array.isArray(e)&&e.forEach(s=>{const c=t(s);if(!c)return;const l=new Date(c);if(Number.isNaN(l.getTime()))return;const d=`${l.getFullYear()}-${l.getMonth()}`,u=i.findIndex(p=>p.key===d);u>=0&&(o[u].value+=1)}),o}function ri(e){return Go(e,t=>t==null?void 0:t.createdAt,6)}function Nc(e,t=6){const a=Math.max(1,Math.min(24,Math.floor(Number(t))||6)),r=new Date,n=[];for(let i=a-1;i>=0;i-=1){const o=new Date(r.getFullYear(),r.getMonth()-i,1);n.push({key:`${o.getFullYear()}-${o.getMonth()}`,label:o.toLocaleDateString("fr-FR",{month:"short"}),sum:0,cnt:0})}return(e||[]).forEach(i=>{const o=(i==null?void 0:i.createdAt)||(i==null?void 0:i.updatedAt),s=Number(i==null?void 0:i.score);if(!o||!Number.isFinite(s))return;const c=new Date(o);if(Number.isNaN(c.getTime()))return;const l=`${c.getFullYear()}-${c.getMonth()}`,d=n.find(u=>u.key===l);d&&(d.sum+=s,d.cnt+=1)}),n.map(i=>({label:i.label,value:i.cnt>0?Math.round(i.sum/i.cnt*10)/10:0}))}function Sc(e,t,a,r={}){const n=document.createElement("div"),i=r.variant==="analytics";n.className=i?"kpi-multi-line-wrap kpi-multi-line-wrap--analytics":"kpi-multi-line-wrap";const o=Array.isArray(e)&&e.length?e:["—"],s=o.length,c=i?420:380,l=i?178:168,d=16,u=s>1?(c-d*2)/(s-1):0,p=document.createElementNS("http://www.w3.org/2000/svg","svg");p.setAttribute("viewBox",`0 0 ${c} ${l}`),p.setAttribute("class",i?"kpi-multi-line-svg kpi-multi-line-svg--analytics":"kpi-multi-line-svg"),p.setAttribute("role","img"),p.setAttribute("aria-label","Évolution comparée sur la période (une ou plusieurs séries).");const g=document.createElementNS("http://www.w3.org/2000/svg","line");g.setAttribute("x1",String(d)),g.setAttribute("y1",String(l-d)),g.setAttribute("x2",String(c-d)),g.setAttribute("y2",String(l-d)),g.setAttribute("class","dashboard-line-chart-grid dashboard-line-chart-grid--base"),p.append(g);const m=i&&r.targetYPercent!=null&&Number.isFinite(Number(r.targetYPercent))?Math.max(0,Math.min(100,Number(r.targetYPercent))):null;if(m!=null){const _=l-d-m/100*(l-d*2),f=document.createElementNS("http://www.w3.org/2000/svg","line");f.setAttribute("x1",String(d)),f.setAttribute("y1",String(_.toFixed(1))),f.setAttribute("x2",String(c-d)),f.setAttribute("y2",String(_.toFixed(1))),f.setAttribute("class","kpi-multi-line-target"),f.setAttribute("stroke-dasharray","4 6"),p.append(f)}if(!i){const _=d+(l-d*2)/2,f=document.createElementNS("http://www.w3.org/2000/svg","line");f.setAttribute("x1",String(d)),f.setAttribute("y1",String(_)),f.setAttribute("x2",String(c-d)),f.setAttribute("y2",String(_)),f.setAttribute("class","dashboard-line-chart-grid dashboard-line-chart-grid--mid"),p.append(f)}const b=i?"2.05":"2.5",y=i?"3.25":"4",v=100;(t||[]).forEach(_=>{const f=Array.isArray(_.values)?_.values:[],E=o.map((S,N)=>{const L=Math.max(0,Math.min(v,Number(f[N])||0)),D=d+(s===1?(c-d*2)/2:N*u),q=l-d-L/v*(l-d*2);return{x:D,y:q}});if(E.length===0)return;const w=E.map((S,N)=>`${N===0?"M":"L"} ${S.x.toFixed(1)} ${S.y.toFixed(1)}`).join(" "),x=document.createElementNS("http://www.w3.org/2000/svg","path");x.setAttribute("d",w),x.setAttribute("fill","none"),x.setAttribute("stroke-width",_.strokeWidth!=null?String(_.strokeWidth):b),x.setAttribute("stroke-linecap","round"),x.setAttribute("stroke-linejoin","round"),x.setAttribute("stroke",_.color||"rgba(96,165,250,0.9)"),_.lineStyle==="dashed"&&(x.setAttribute("stroke-dasharray","5 5"),x.setAttribute("opacity","0.92")),p.append(x),_.showDots!==!1&&E.forEach(S=>{const N=document.createElementNS("http://www.w3.org/2000/svg","circle");N.setAttribute("cx",String(S.x)),N.setAttribute("cy",String(S.y)),N.setAttribute("r",y),N.setAttribute("fill",_.color||"rgba(96,165,250,0.95)"),N.setAttribute("stroke",i?"rgba(15,23,42,0.45)":"rgba(15,23,42,0.35)"),N.setAttribute("stroke-width","1"),p.append(N)})});const h=document.createElement("div");h.className="kpi-multi-line-labels",o.forEach(_=>{const f=document.createElement("span");f.textContent=_,h.append(f)});const k=document.createElement("ul");if(k.className="kpi-multi-line-legend",(t||[]).forEach(_=>{const f=document.createElement("li");f.className="kpi-multi-line-legend-item";const E=document.createElement("span");E.className="kpi-multi-line-legend-dot",E.style.background=_.color||"#2dd4bf";const w=document.createElement("span");w.textContent=_.name,f.append(E,w),k.append(f)}),n.append(p,h,k),a&&String(a).trim()){const _=document.createElement("p");_.className="dashboard-chart-foot dashboard-chart-foot--tight",_.textContent=a,n.append(_)}if(r.interpretText&&String(r.interpretText).trim()){const _=document.createElement("p");_.className="dashboard-chart-interpret",_.textContent=String(r.interpretText).trim(),n.append(_)}return n}function Cc(e){const t=e.map(i=>Number.isFinite(i.value)?i.value:0),a=t.reduce((i,o)=>i+o,0);if(a===0)return"Aucun incident sur six mois.";const r=t.slice(-3).reduce((i,o)=>i+o,0),n=t.slice(0,3).reduce((i,o)=>i+o,0);return n>0&&r>n*1.25?`La période récente est plus dense qu’au début des six mois (${a} incident${a>1?"s":""} au total) — à regarder de près.`:n>0&&r<n*.75?`Le volume d’incidents semble en baisse sur la fin de période (${a} sur six mois) — dynamique plutôt favorable sur cet échantillon.`:`Rythme stable d’un mois à l’autre (${a} sur six mois).`}function Ac(e){const t=Math.max(0,Number(e.overdue)||0),a=Math.max(0,Number(e.done)||0),r=Math.max(0,Number(e.other)||0),n=t+a+r;if(n===0)return"Aucune donnée sur cette période.";const i=t/n;return i>.28?"Une part importante des actions est en retard.":t===0?"Aucun retard sur les actions affichées.":`Environ ${Math.round(i*100)} % des actions sont en retard.`}function zc(e){if(!e.length)return"";const t=e[0],a=e[1];return a&&t.count>=a.count*1.6?`Le type « ${t.type} » domine (${t.count} cas) : un focus causes sur ce thème peut payer vite.`:`Répartition hétérogène ; le type le plus fréquent est « ${t.type} » (${t.count}).`}function oa(e,t={}){const a=document.createElement("div");a.className="dashboard-line-chart-wrap",t.variant==="analytics"&&a.classList.add("dashboard-line-chart-wrap--analytics");const r=t.lineTheme;r==="incidents"?a.classList.add("dashboard-line-chart-wrap--theme-incidents"):r==="audits"&&a.classList.add("dashboard-line-chart-wrap--theme-audits");const n=Array.isArray(e)&&e.length?e:[{label:"—",value:0}],i=400,o=168,s=14,c=n.map(H=>Number.isFinite(H.value)?H.value:0),l=Math.min(...c),d=Math.max(...c),p=Math.max(d-l,1e-9)*.1;let g=l-p,m=d+p;l>=0&&g<0&&(g=0),m-g<1e-6&&(m=g+1);const b=H=>{const G=(H-g)/(m-g);return o-s-G*(o-s*2)},y=n.length,v=y>1?(i-s*2)/(y-1):0,h=n.map((H,G)=>{const X=s+(y===1?(i-s*2)/2:G*v),$=Number.isFinite(H.value)?H.value:0,T=b($);return{x:X,y:T,...H}}),k=h.map((H,G)=>`${G===0?"M":"L"} ${H.x.toFixed(1)} ${H.y.toFixed(1)}`).join(" "),_=b(Math.max(0,g)),f=document.createElementNS("http://www.w3.org/2000/svg","svg");f.setAttribute("viewBox",`0 0 ${i} ${o}`),f.setAttribute("class","dashboard-line-chart-svg"),f.setAttribute("role","img"),f.setAttribute("aria-label",t.ariaLabel||"Courbe du nombre d’incidents déclarés par mois sur les six derniers mois.");const E=`dlaf-${Math.random().toString(36).slice(2,11)}`,w=document.createElementNS("http://www.w3.org/2000/svg","defs"),x=document.createElementNS("http://www.w3.org/2000/svg","linearGradient");x.setAttribute("id",E),x.setAttribute("x1","0"),x.setAttribute("y1","0"),x.setAttribute("x2","0"),x.setAttribute("y2","1");const S=r==="incidents"?[{off:"0%",color:"rgb(249, 115, 22)",op:"0.34"},{off:"55%",color:"rgb(251, 113, 133)",op:"0.14"},{off:"100%",color:"rgb(234, 88, 12)",op:"0.03"}]:r==="audits"?[{off:"0%",color:"rgb(99, 102, 241)",op:"0.32"},{off:"50%",color:"rgb(45, 212, 191)",op:"0.2"},{off:"100%",color:"rgb(13, 148, 136)",op:"0.06"}]:[{off:"0%",color:"rgb(20, 184, 166)",op:"0.26"},{off:"100%",color:"rgb(20, 184, 166)",op:"0.02"}],N=document.createElementNS("http://www.w3.org/2000/svg","stop");N.setAttribute("offset",S[0].off),N.setAttribute("stop-color",S[0].color),N.setAttribute("stop-opacity",S[0].op);const L=document.createElementNS("http://www.w3.org/2000/svg","stop");L.setAttribute("offset",S[1]?S[1].off:"100%"),L.setAttribute("stop-color",S[1]?S[1].color:S[0].color),L.setAttribute("stop-opacity",S[1]?S[1].op:S[0].op);const D=[N,L];if(S[2]){const H=document.createElementNS("http://www.w3.org/2000/svg","stop");H.setAttribute("offset",S[2].off),H.setAttribute("stop-color",S[2].color),H.setAttribute("stop-opacity",S[2].op),D.push(H)}x.append(...D),w.append(x);const q=document.createElementNS("http://www.w3.org/2000/svg","line");q.setAttribute("x1",String(s)),q.setAttribute("y1",String(o-s)),q.setAttribute("x2",String(i-s)),q.setAttribute("y2",String(o-s)),q.setAttribute("class","dashboard-line-chart-grid dashboard-line-chart-grid--base");const W=s+(o-s*2)/2,K=document.createElementNS("http://www.w3.org/2000/svg","line");K.setAttribute("x1",String(s)),K.setAttribute("y1",String(W)),K.setAttribute("x2",String(i-s)),K.setAttribute("y2",String(W)),K.setAttribute("class","dashboard-line-chart-grid dashboard-line-chart-grid--mid");const A=t.variant==="analytics",I=document.createElementNS("http://www.w3.org/2000/svg","path"),z=`${k} L ${h[h.length-1].x} ${_.toFixed(1)} L ${h[0].x} ${_.toFixed(1)} Z`;I.setAttribute("d",z),I.setAttribute("class","dashboard-line-chart-area"),I.setAttribute("fill",`url(#${E})`);const R=document.createElementNS("http://www.w3.org/2000/svg","path");R.setAttribute("d",k),R.setAttribute("fill","none"),R.setAttribute("class","dashboard-line-chart-line");const V=[w,q];A||V.push(K),V.push(I,R),f.append(...V);const oe=t.variant==="analytics"&&y>5?"3.5":r==="incidents"||r==="audits"?"5.25":"5";h.forEach(H=>{const G=document.createElementNS("http://www.w3.org/2000/svg","circle");G.setAttribute("cx",String(H.x)),G.setAttribute("cy",String(H.y)),G.setAttribute("r",oe),G.setAttribute("class","dashboard-line-chart-dot"),f.append(G)});const ge=document.createElement("div");ge.className="dashboard-line-chart-values",n.forEach(H=>{const G=document.createElement("span");G.textContent=String(H.value),G.title=t.valueTitle?t.valueTitle(H):`${H.value} incident(s)`,ge.append(G)});const B=document.createElement("div");B.className="dashboard-line-chart-labels",n.forEach(H=>{const G=document.createElement("span");G.textContent=H.label,B.append(G)});const re=document.createElement("p");if(re.className="dashboard-chart-foot dashboard-chart-foot--tight",t.footText!==void 0&&t.footText!==null)re.textContent=t.footText;else{const H=n.reduce((G,X)=>G+X.value,0);re.textContent=H===0?"Aucune donnée sur cette période.":""}const se=document.createElement("p");se.className="dashboard-chart-interpret",se.textContent=t.interpretText!==void 0?t.interpretText:Cc(n);const F=[f,ge,B,re];return String(se.textContent).trim()&&F.push(se),a.append(...F),a}function Sr(e){const t=document.createElement("div");t.className="dashboard-mix-chart-wrap";const a=Math.max(0,Number(e.overdue)||0),r=Math.max(0,Number(e.done)||0),n=Math.max(0,Number(e.other)||0),i=a+r+n||1,o=document.createElement("div");o.className="dashboard-mix-bar",o.setAttribute("role","img"),o.setAttribute("aria-label","Répartition des actions : en retard, terminées, autres statuts.");const s=document.createElement("div");s.className="dashboard-mix-seg dashboard-mix-seg--overdue",s.style.flex=`${a/i*100}`,s.title=`En retard : ${a}`;const c=document.createElement("div");c.className="dashboard-mix-seg dashboard-mix-seg--done",c.style.flex=`${r/i*100}`,c.title=`Terminées : ${r}`;const l=document.createElement("div");l.className="dashboard-mix-seg dashboard-mix-seg--other",l.style.flex=`${n/i*100}`,l.title=`Autres : ${n}`,o.append(s,c,l);const d=document.createElement("ul");d.className="dashboard-mix-legend",[{label:"En retard",value:a,cls:"dashboard-mix-dot--overdue"},{label:"Terminées / clos",value:r,cls:"dashboard-mix-dot--done"},{label:"En cours / autre",value:n,cls:"dashboard-mix-dot--other"}].forEach(({label:g,value:m,cls:b})=>{const y=document.createElement("li");y.className="dashboard-mix-legend-item";const v=document.createElement("span");v.className=`dashboard-mix-dot ${b}`;const h=document.createElement("span");h.textContent=`${g} — ${m}`,y.append(v,h),d.append(y)});const u=document.createElement("p");u.className="dashboard-chart-foot dashboard-mix-foot",u.textContent="";const p=document.createElement("p");return p.className="dashboard-chart-interpret",p.textContent=Ac({overdue:a,done:r,other:n}),t.append(o,d,u,p),t}function Wt(e){const t=document.createElement("div");t.className="dashboard-breakdown-wrap";const a=Array.isArray(e)?e.slice(0,5):[],r=Math.max(1,...a.map(o=>Number(o.count)||0));if(!a.length){const o=document.createElement("p");return o.className="dashboard-situation-note",o.textContent="Aucune donnée sur cette période.",t.append(o),t}a.forEach((o,s)=>{const c=document.createElement("div");c.className="dashboard-breakdown-row";const l=document.createElement("div");l.className="dashboard-breakdown-label",l.textContent=o.type||"—";const d=document.createElement("div");d.className="dashboard-breakdown-track";const u=document.createElement("div"),p=s%5;u.className=`dashboard-breakdown-fill dashboard-breakdown-fill--tone-${p}`;const g=Number(o.count)||0;u.style.width=`${Math.round(g/r*100)}%`;const m=document.createElement("span");m.className="dashboard-breakdown-count",m.textContent=String(g),d.append(u),c.append(l,d,m),t.append(c)});const n=document.createElement("p");n.className="dashboard-chart-foot dashboard-chart-foot--tight",n.textContent="";const i=document.createElement("p");return i.className="dashboard-chart-interpret",i.textContent=zc(a),t.append(n,i),t}function Uo(e){if(!Array.isArray(e))return{overdue:0,done:0,other:0};let t=0,a=0,r=0;return e.forEach(n=>{const i=String((n==null?void 0:n.status)||"").toLowerCase();i.includes("retard")?t+=1:/termin|clos|ferm|clôtur|realis|réalis|effectu|complete|complété|fait/.test(i)?a+=1:r+=1}),{overdue:t,done:a,other:r}}function Hr(e,t=5){if(!Array.isArray(e))return[];const a=new Map;return e.forEach(r=>{const n=String((r==null?void 0:r.type)||"Autre").trim()||"Autre";a.set(n,(a.get(n)||0)+1)}),[...a.entries()].map(([r,n])=>({type:r,count:n})).sort((r,n)=>n.count-r.count).slice(0,t)}function Cr(e){if(!Array.isArray(e)||!e.length)return[];const t=e.map(i=>{const o=Number(i==null?void 0:i.score);if(!Number.isFinite(o))return null;const s=(i==null?void 0:i.updatedAt)||(i==null?void 0:i.createdAt),c=s?new Date(s).getTime():NaN;return{t:Number.isNaN(c)?0:c,score:o}}).filter(Boolean);t.sort((i,o)=>i.t-o.t);const a=new Map;t.forEach(i=>{if(i.t<=0)return;const o=new Date(i.t),s=`${o.getFullYear()}-${String(o.getMonth()+1).padStart(2,"0")}`;a.set(s,{t:i.t,score:i.score})});const n=[...a.keys()].sort().slice(-8);return n.length?n.map(i=>{const o=a.get(i);return{label:new Date(o.t).toLocaleDateString("fr-FR",{month:"short",year:"2-digit"}),value:Math.round(Math.max(0,Math.min(100,o.score)))}}):t.slice(-8).map((i,o)=>({label:i.t>0?new Date(i.t).toLocaleDateString("fr-FR",{month:"short",year:"2-digit"}):`${o+1}`,value:Math.round(Math.max(0,Math.min(100,i.score)))}))}function Ar(e){if(!Array.isArray(e)||e.length===0)return"Aucun score d’audit exploitable sur la période chargée.";const t=e.map(i=>i.value).filter(Number.isFinite);if(!t.length)return"Scores non numériques — vérifiez les données.";const a=t[0],r=t[t.length-1],n=r-a;return t.length===1?`Dernier score enregistré : ${r} % — chargez plus d’audits pour une tendance.`:n>=4?`Tendance à la hausse : ${a} % → ${r} % sur la série affichée.`:n<=-4?`Tendance à la baisse : ${a} % → ${r} % — creuser les causes et le plan d’actions.`:`Scores stables autour de ${r} % (fourchette ${Math.min(...t)}–${Math.max(...t)} %).`}function $c(e,t,a){if(e+t+a===0)return"Aucun signal sur ces trois indicateurs — données à enrichir.";const n=Math.max(e,t,a);return n===t&&t>=e&&t>=a&&t>0?"Les actions en retard pèsent fortement — prioriser l’exécution et les relances.":n===a&&a>0?"Volume notable de NC ouvertes — aligner audits et plans d’actions.":n===e&&e>0?"Incidents critiques à traiter en priorité avec la hiérarchie et les équipes.":"Charge répartie entre incidents critiques, retards d’actions et NC ouvertes."}function ni(e,t={}){const a=!!t.compact,r=Math.max(0,Number(e.criticalIncidents)||0),n=Math.max(0,Number(e.overdueActions)||0),i=Math.max(0,Number(e.ncOpen)||0),o=r+n+i||1,s=document.createElement("div");s.className=a?"dashboard-pilot-load dashboard-pilot-load--compact":"dashboard-pilot-load";const c=document.createElement("div");c.className="dashboard-pilot-load-inner";const l=document.createElement("div");l.className="dashboard-pilot-load-main";const d=document.createElement("div");d.className=a?"dashboard-mix-bar dashboard-mix-bar--pilot dashboard-mix-bar--pilot-compact":"dashboard-mix-bar dashboard-mix-bar--pilot",d.setAttribute("role","img"),d.setAttribute("aria-label","Répartition relative : incidents critiques, actions en retard, non-conformités ouvertes.");const u=document.createElement("div");u.className="dashboard-mix-seg dashboard-mix-seg--pilot-crit",u.style.flex=`${r/o*100}`,u.title=`Incidents critiques (liste) : ${r}`;const p=document.createElement("div");p.className="dashboard-mix-seg dashboard-mix-seg--pilot-watch",p.style.flex=`${n/o*100}`,p.title=`Actions en retard : ${n}`;const g=document.createElement("div");g.className="dashboard-mix-seg dashboard-mix-seg--pilot-nc",g.style.flex=`${i/o*100}`,g.title=`NC ouvertes : ${i}`,d.append(u,p,g);const m=document.createElement("ul");m.className=a?"dashboard-mix-legend dashboard-mix-legend--pilot-compact":"dashboard-mix-legend dashboard-mix-legend--pilot",[{label:"Incidents critiques (liste)",value:r,cls:"dashboard-mix-dot--pilot-crit"},{label:"Actions en retard",value:n,cls:"dashboard-mix-dot--pilot-watch"},{label:"NC ouvertes",value:i,cls:"dashboard-mix-dot--pilot-nc"}].forEach(({label:h,value:k,cls:_})=>{const f=document.createElement("li");f.className="dashboard-mix-legend-item";const E=document.createElement("span");E.className=`dashboard-mix-dot ${_}`;const w=document.createElement("span");w.textContent=`${h} — ${k}`,f.append(E,w),m.append(f)});const b=document.createElement("p");if(b.className="dashboard-chart-interpret",b.textContent=$c(r,n,i),a)return s.append(d,m,b),s;l.append(d,m);const y=document.createElement("div");y.className="dashboard-pilot-load-side";function v(h,k,_,f){const E=document.createElement("div");E.className=`dashboard-pilot-stat dashboard-pilot-stat--${h}`;const w=document.createElement("span");w.className="dashboard-pilot-stat-val",w.textContent=String(k);const x=document.createElement("span");x.className="dashboard-pilot-stat-kicker",x.textContent=_;const S=document.createElement("span");return S.className="dashboard-pilot-stat-sub",S.textContent=f,E.append(w,x,S),E}return y.append(v("crit",r,"Critiques","liste chargée"),v("watch",n,"Retards","plan d’actions"),v("nc",i,"NC ouvertes","non conformités")),c.append(l,y),s.append(c),s.append(b),s}function qc(e){const t=[{label:"Incidents (30 j.)",value:Math.max(0,Number(e.incidentsLast30Days)||0),tone:"inc"},{label:"NC ouvertes",value:Math.max(0,Number(e.nonConformitiesOpen)||0),tone:"nc"},{label:"Actions en retard",value:Math.max(0,Number(e.actionsOverdue)||0),tone:"late"},{label:"Audits (base)",value:Math.max(0,Number(e.auditsTotal)||0),tone:"aud"}],a=Math.max(1,...t.map(i=>i.value)),r=document.createElement("div");r.className="analytics-key-bars",r.setAttribute("role","img"),r.setAttribute("aria-label","Volumes relatifs : incidents sur 30 jours, NC ouvertes, actions en retard, audits en base."),t.forEach(i=>{const o=document.createElement("div");o.className=`analytics-key-bars-row analytics-key-bars-row--${i.tone}`;const s=document.createElement("span");s.className="analytics-key-bars-label",s.textContent=i.label;const c=document.createElement("div");c.className="analytics-key-bars-track";const l=document.createElement("div");l.className="analytics-key-bars-fill",l.style.width=`${Math.round(i.value/a*100)}%`;const d=document.createElement("span");d.className="analytics-key-bars-val",d.textContent=String(i.value),c.append(l),o.append(s,c,d),r.append(o)});const n=document.createElement("p");return n.className="dashboard-chart-foot dashboard-chart-foot--tight",n.style.marginTop="10px",n.textContent="Échelle relative au plus grand des quatre volumes — pour comparer rapidement les ordres de grandeur.",r.append(n),r}function Lc(e,t,a){const r=e+t+a;return r===0?"Aucune exigence suivie.":a/r>.2?"Part importante d’exigences non conformes — plan de correction urgent.":t>a*2?"Nombreuses exigences partielles — consolider les preuves et jalons.":`${e} exigence(s) au vert sur ${r} — poursuivre le cycle de preuve.`}function Ic(e){const t=Math.max(0,Number(e.conforme)||0),a=Math.max(0,Number(e.partiel)||0),r=Math.max(0,Number(e.nonConforme)||0),n=t+a+r||1,i=document.createElement("div");i.className="dashboard-mix-chart-wrap";const o=document.createElement("div");o.className="dashboard-mix-bar",o.setAttribute("role","img"),o.setAttribute("aria-label","Répartition des exigences : conforme, partiel, non conforme.");const s=document.createElement("div");s.className="dashboard-mix-seg dashboard-mix-seg--req-ok",s.style.flex=`${t/n*100}`,s.title=`Conformes : ${t}`;const c=document.createElement("div");c.className="dashboard-mix-seg dashboard-mix-seg--req-part",c.style.flex=`${a/n*100}`,c.title=`Partiels : ${a}`;const l=document.createElement("div");l.className="dashboard-mix-seg dashboard-mix-seg--req-nc",l.style.flex=`${r/n*100}`,l.title=`Non conformes : ${r}`,o.append(s,c,l);const d=document.createElement("ul");d.className="dashboard-mix-legend",[{label:"Conforme",value:t,cls:"dashboard-mix-dot--req-ok"},{label:"Partiel",value:a,cls:"dashboard-mix-dot--req-part"},{label:"Non conforme",value:r,cls:"dashboard-mix-dot--req-nc"}].forEach(({label:p,value:g,cls:m})=>{const b=document.createElement("li");b.className="dashboard-mix-legend-item";const y=document.createElement("span");y.className=`dashboard-mix-dot ${m}`;const v=document.createElement("span");v.textContent=`${p} — ${g}`,b.append(y,v),d.append(b)});const u=document.createElement("p");return u.className="dashboard-chart-interpret",u.textContent=Lc(t,a,r),i.append(o,d,u),i}function Tc(e){const t=document.createElement("div");t.className="dashboard-audit-iso-bars",t.setAttribute("role","img"),t.setAttribute("aria-label","Scores indicatifs par référentiel ISO");const a=Array.isArray(e)&&e.length?e:[{norm:"—",score:0}],r=a.map(s=>Math.round(Math.max(0,Math.min(100,Number(s.score)||0)))),n=Math.min(...r),i=a.find((s,c)=>Math.round(Math.max(0,Math.min(100,Number(s.score)||0)))===n);a.forEach(s=>{const c=document.createElement("div");c.className="dashboard-audit-iso-bar-row";const l=document.createElement("span");l.className="dashboard-audit-iso-bar-label",l.textContent=s.norm!=null?String(s.norm):"—";const d=document.createElement("div");d.className="dashboard-audit-iso-bar-track";const u=document.createElement("span");u.className="dashboard-audit-iso-bar-fill";const p=Math.round(Math.max(0,Math.min(100,Number(s.score)||0)));u.style.width=`${p}%`,u.title=`${p} %`;const g=document.createElement("span");g.className="dashboard-audit-iso-bar-value",g.textContent=`${p}%`,d.append(u),c.append(l,d,g),t.append(c)});const o=document.createElement("p");return o.className="dashboard-chart-interpret",o.textContent=i?`Écart principal : ${i.norm} (${Math.round(Math.max(0,Math.min(100,Number(i.score)||0)))} %).`:"Répartition par norme (vue stratégique).",t.append(o),t}const Ji=4;function $a(e){if(!e)return"—";try{return new Date(e).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"})}catch{return"—"}}function ei(e){if(!e)return NaN;const t=new Date(e).getTime();return Number.isNaN(t)?NaN:t}function Ki(e,t){return Array.isArray(e)?[...e].sort((a,r)=>{const n=t(r),i=t(a),o=Number.isFinite(n)?n:-1/0,s=Number.isFinite(i)?i:-1/0;return o-s}):[]}function qa(e,t){const a=String(e||"").trim();return a?a.length<=t?a:`${a.slice(0,t-1)}…`:""}function Wo(e){const t=String(e||"").replace(/^#/,"");t&&(window.location.hash=t)}function Mc(e){const t=String((e==null?void 0:e.status)||"").toLowerCase();return t.includes("retard")?!1:/termin|clos|ferm|clôtur|realis|réalis|effectu|complete|complété|fait/.test(t)}function Pc(e){const t=e!=null&&e.dueDate?ei(e.dueDate):NaN,a=Date.now();return Number.isFinite(t)?!Mc(e)&&t<a?{label:`Échéance ${$a(e.dueDate)}`,hint:"En retard",tone:"amber"}:{label:`Échéance ${$a(e.dueDate)}`,hint:"Dans le calendrier",tone:"blue"}:{label:`Créée ${$a(e.createdAt)}`,hint:e.owner?`Suivi : ${qa(e.owner,24)}`:"À prioriser selon le plan",tone:"info"}}function Rc(e){const t=String(e||"").toLowerCase();return/crit|grave|élev|elev|high|majeur|fatal|sévère|severe/.test(t)?"activity-row--sev-crit":/moyen|modéré|modere|medium|mineur/.test(t)?"activity-row--sev-warn":""}const Dc={Incident:"Incident",Action:"Action",Audit:"Audit"};function Xi(e){const t=document.createElement("div");t.className=["activity-row",e.rowClass||""].filter(Boolean).join(" "),t.tabIndex=0,t.setAttribute("role","link");const a=e.pageHash==="incidents"?"Incidents":e.pageHash==="actions"?"Actions":e.pageHash==="audits"?"Audits":e.pageHash;t.setAttribute("aria-label",`${e.kindLabel} — ${e.title} — ouvrir ${a}`);const r=document.createElement("div");r.className="activity-row__inner";const n=document.createElement("span");n.className="activity-row__type",n.textContent=Dc[e.kindLabel]||String(e.kindLabel||"—").slice(0,8);const i=document.createElement("div");i.className="activity-row__body";const o=document.createElement("span");o.className="activity-row__title";const s=String(e.title||"").trim();o.textContent=qa(s,140),s.length>140&&(o.title=s);const c=document.createElement("div");c.className="activity-row__meta";const l=document.createElement("span");l.className="activity-row__status",l.textContent=e.statusLabel||"—",(e.statusLabel||"").length>56&&(l.title=e.statusLabel);const d=document.createElement("span");d.className="activity-row__date",d.textContent=e.dateLine||"—",c.append(l,d),i.append(o,c);const u=document.createElement("span");u.className="activity-row__link",u.setAttribute("aria-hidden","true"),u.textContent="→",r.append(n,i,u),t.append(r);const p=()=>Wo(e.pageHash);return t.addEventListener("click",p),t.addEventListener("keydown",g=>{(g.key==="Enter"||g.key===" ")&&(g.preventDefault(),p())}),t}const In={incidents:"Voir les incidents",actions:"Voir les actions",audits:"Voir les audits"};function Zi(e,t){const a=document.createElement("div");a.className="dashboard-activity-col";const r=document.createElement("h4");r.className="dashboard-activity-col-title",r.textContent=e;const n=document.createElement("div");n.className="dashboard-activity-stack";const i=document.createElement("p");i.className="dashboard-activity-col-empty",i.textContent="Aucun élément sur l’échantillon chargé.";const o=document.createElement("div");o.className="dashboard-activity-col-footer";const s=document.createElement("button");s.type="button",s.className="dashboard-activity-col-more",s.textContent=In[t]||"Ouvrir le module",s.addEventListener("click",d=>{d.stopPropagation(),Wo(t)}),o.append(s);const c=document.createElement("div");c.className="dashboard-activity-col-ctas";const l=Rt([{label:In[t]||"Ouvrir le module",pageId:t}],{className:"dashboard-block-actions dashboard-block-actions--tight"});return l?c.append(l):c.hidden=!0,a.append(r,n,i,o,c),{col:a,stack:n,empty:i,ctaWrap:c,footer:o}}function er(e,t,a,r,n){n?(t.hidden=!0,a.hidden=!0,r.hidden=!1):(t.hidden=!1,a.hidden=a.childNodes.length===0,r.hidden=!0)}function Tn(e,t={}){const a=t.showHeader!==!1,r=document.createElement("section");r.className=a?"dashboard-activity-section content-card card-soft":"dashboard-activity-section content-card card-soft dashboard-activity-section--body",a&&(r.innerHTML=`
    <div class="content-card-head dashboard-activity-head">
      <div>
        <div class="section-kicker">Suivi</div>
        <h3>Activité récente</h3>
        <p class="dashboard-muted-lead"></p>
      </div>
    </div>
  `);const n=Ki(e.incidents||[],p=>ei(p.createdAt)).slice(0,Ji),i=Ki(e.actions||[],p=>ei(p.createdAt)).slice(0,Ji),o=Ki(e.audits||[],p=>ei(p.createdAt)).slice(0,Ji);if(n.length+i.length+o.length===0){const p=document.createElement("div");p.className="dashboard-activity-global-empty";const g=document.createElement("p");g.className="dashboard-activity-global-empty-msg",g.textContent="Pas d’entrée récente sur l’échantillon chargé";const m=document.createElement("p");m.className="dashboard-activity-global-empty-sub",m.textContent="Échantillon limité — ouvrir un module.";const b=document.createElement("div");b.className="dashboard-activity-global-ctas";const y=Rt([{label:"Voir les incidents",pageId:"incidents"},{label:"Voir les actions",pageId:"actions"}],{className:"dashboard-block-actions dashboard-block-actions--tight"});return y&&b.append(y),p.append(g,m,b),r.append(p),r}const c=document.createElement("div");c.className="dashboard-activity-grid";const l=Zi("Incidents récents","incidents"),d=Zi("Actions récentes","actions"),u=Zi("Audits récents","audits");return n.forEach(p=>{const g=p.ref||"Incident",m=String(p.status||"").trim()||"Statut à suivre",b=String(p.severity||"").trim(),y=qa([b,m].filter(v=>v&&v!=="—").join(" · ")||m,72);l.stack.append(Xi({kindLabel:"Incident",title:g,dateLine:$a(p.createdAt),statusLabel:y,pageHash:"incidents",rowClass:Rc(p.severity)}))}),i.forEach(p=>{const g=Pc(p),m=g.tone==="amber"&&g.hint==="En retard";d.stack.append(Xi({kindLabel:"Action",title:p.title||"Action",dateLine:g.label,statusLabel:qa(String(m?p.status||"En retard":p.status||"En cours"),72),pageHash:"actions",rowClass:m?"activity-row--action-late":""}))}),o.forEach(p=>{const g=Number(p.score),m=String(p.status||"").trim()||"Statut à suivre",b=Number.isFinite(g)?`${g} %`:"",y=qa([b,m].filter(Boolean).join(" · "),72);u.stack.append(Xi({kindLabel:"Audit",title:p.ref||"Audit",dateLine:$a(p.createdAt),statusLabel:y,pageHash:"audits"}))}),er(l.stack,l.empty,l.ctaWrap,l.footer,n.length>0),er(d.stack,d.empty,d.ctaWrap,d.footer,i.length>0),er(u.stack,u.empty,u.ctaWrap,u.footer,o.length>0),c.append(l.col,d.col,u.col),r.append(c),r}function jc(e){return String(e||"").toLowerCase().includes("critique")}function Oc(e){const t=String((e==null?void 0:e.status)||"").toLowerCase();return t?!/(clos|ferm|done|termin|clôtur|résolu|resolu|complete)/i.test(t):!0}function ea(e){const t=String(e||"").replace(/^#/,"");t&&(window.location.hash=t)}function Hc(e){const{riskVal:t,openNc:a,actN:r,audN:n,od:i,actCount:o}=e;return i>=3||i>0&&i>=a+t&&i>=2?"Exécution tendue : des actions sont en retard — à débloquer en priorité.":a>2?"Conformité : beaucoup de NC ouvertes — à traiter ou calendrier avant la revue.":t>0?"Sécurité / gravité : incident(s) critique(s) — suivi terrain attendu.":a>0&&i>0?"Double sujet : NC et retards — arbitrer et piloter les deux files.":a>0?"Conformité : NC ouvertes — traiter ou planifier la suite.":o<=2&&r+n<6?"Peu de mouvement récent sur ce tableau de bord.":a===0&&i===0&&t===0?"Aucune alerte critique sur les indicateurs suivis ici.":"Vue d’ensemble à compléter dans les sections ci-dessous."}function Fc(e,t){const a=e.risks,r=e.nc,n=e.actions,i=e.audits,o=a+r+n+i;if(t<=1&&o<=3)return"Les quatre indicateurs sont peu élevés sur cette vue.";if(n===t&&n>Math.max(r,a)+1)return"Le volume d’actions domine : vérifier la charge côté plan.";if(r===t&&r>0)return"Les NC ressortent le plus : priorité conformité.";if(a===t&&a>0)return"Les incidents critiques ressortent le plus : priorité terrain.";const s=Math.min(a,r,n,i);return t>0&&(t-s)/t<.2?"Les quatre indicateurs sont proches : situation équilibrée sur cette vue.":"Écarts visibles entre les axes : identifier le plus sollicité."}function Vc(e){const{alertesSum:t,od:a,actCount:r,avgScore:n,hasScores:i}=e;let o;t===0?o="Rien à signaler.":t===1?o="1 point d’attention.":o="Plusieurs points à suivre.";let s;i?n>=80?s=`Moyenne audits : ${n} % — bon niveau.`:n>=65?s=`Moyenne audits : ${n} % — correct.`:s=`Moyenne audits : ${n} % — sous objectif.`:s="Note d’audit non disponible ici.";let c;a===0?c="Aucun retard sur les actions.":a===1?c="1 action en retard.":c=`${a} actions en retard.`;let l;return r===0?l="Peu de nouveautés dans le flux.":r<=4?l="Activité récente modérée.":r>=12?l="Activité récente soutenue.":l="Activité récente dans la norme.",{tensions:o,score:s,echeances:c,activite:l}}function Bc(e){const{riskVal:t,openNc:a,od:r,alertesSum:n}=e;return r>=2||t>0?"→ Agir en priorité sur les sujets mis en avant.":a>0?"→ Surveiller la conformité et les plans associés.":n===0?"→ Maintenir le suivi et les revues habituelles.":"→ Conserver une veille sur les indicateurs."}function Gc(e){const{riskVal:t,openNc:a,od:r,avgScore:n,hasScores:i,audN:o}=e,s=[];return t>0&&s.push({text:`${t} incident(s) critique(s)`,hash:"incidents"}),a>0&&s.push({text:`${a} NC ouverte(s) sans clôture`,hash:"audits"}),r>0&&s.push({text:`${r} action(s) en retard`,hash:"actions"}),i&&o>0&&n<65&&s.push({text:`Résultats audits à renforcer (${n} %)`,hash:"analytics"}),s.slice(0,4)}function Uc(e){const{riskVal:t,openNc:a,od:r}=e,n={label:t>0?"Voir les incidents":"Ouvrir le registre risques",hash:t>0?"incidents":"risks",emph:!1},i={label:r>0?"Traiter les retards":a>0?"Voir les NC":"Ouvrir le plan d’actions",hash:r>0?"actions":a>0?"audits":"actions",emph:!1};return r>0||a>0?i.emph=!0:t>0&&(n.emph=!0),[n,i]}function Wc(e,t){const a=e.risks,r=e.nc,n=e.actions;return n===t&&n>Math.max(r,a)?{label:"Aller au plan d’actions",hash:"actions"}:r===t&&r>0?{label:"Aller aux audits",hash:"audits"}:a===t&&a>0?{label:"Aller aux incidents",hash:"incidents"}:{label:"Voir les analyses",hash:"analytics"}}function Yc(e,t,a){return a>0&&a>=Math.max(e,t)?{variant:"warn",kicker:"Priorité",message:`${a} action(s) en retard — prioriser l’exécution.`,cta:"Voir le plan d’actions →",hash:"actions",secondary:e>0?{label:"Voir aussi les NC",hash:"audits"}:void 0}:e>2?{variant:"nc",kicker:"Priorité",message:`${e} NC ouvertes — traiter ou calendrier avant la revue.`,cta:"Voir les audits →",hash:"audits",secondary:a>0?{label:"Voir les retards",hash:"actions"}:void 0}:e>0&&a>0?{variant:"warn",kicker:"Priorité",message:`${e} NC et ${a} retard(s) — arbitrer les deux sujets.`,cta:"Voir les actions →",hash:"actions",secondary:{label:"Voir les NC",hash:"audits"}}:t>0?{variant:"risk",kicker:"Priorité",message:`${t} incident(s) critique(s) — sécuriser le terrain.`,cta:"Voir les incidents →",hash:"incidents",secondary:a>0?{label:"Voir les retards",hash:"actions"}:e>0?{label:"Voir les NC",hash:"audits"}:void 0}:e>0?{variant:"nc",kicker:"Conformité",message:`${e} NC ouverte(s) — suivre les plans d’action.`,cta:"Voir les audits →",hash:"audits",secondary:a>0?{label:"Voir les retards",hash:"actions"}:void 0}:{variant:"ok",kicker:"Synthèse",message:"Aucun retard, NC ouverte ni incident critique sur cette vue.",cta:"Approfondir les analyses →",hash:"analytics"}}function Qc(){const e=document.createElement("section");e.className="dashboard-cockpit",e.setAttribute("aria-labelledby","dashboard-cockpit-title"),e.innerHTML=`
    <div class="dashboard-cockpit__inner">
      <header class="dashboard-cockpit__head">
        <span class="dashboard-cockpit__kicker">Pilotage</span>
        <h2 id="dashboard-cockpit-title" class="dashboard-cockpit__title">Cockpit direction QHSE</h2>
      </header>

      <article class="dashboard-cockpit__card dashboard-cockpit__card--focus" aria-label="Situation">
        <div class="dashboard-cockpit__situation">
          <p class="dashboard-cockpit__intro" data-cockpit-intro></p>
          <p class="dashboard-cockpit__micro" data-cockpit-micro></p>
        </div>
        <div class="dashboard-cockpit__situation-actions" data-cockpit-situation-acts></div>
      </article>

      <div class="dashboard-cockpit__alert" data-cockpit-alert tabindex="0" role="button"></div>

      <article class="dashboard-cockpit__card dashboard-cockpit__card--analytics" aria-label="Comparatif">
        <div class="dashboard-cockpit__card-head">
          <span class="dashboard-cockpit__card-kicker">Analyse</span>
          <h3 class="dashboard-cockpit__card-title">Comparatif en un coup d’œil</h3>
        </div>
        <div class="dashboard-cockpit__chart" data-cockpit-chart role="img" aria-label="Comparatif des quatre indicateurs du cockpit">
          <div class="dashboard-cockpit__bars" data-cockpit-bars></div>
          <p class="dashboard-cockpit__chart-read" data-cockpit-chart-read></p>
          <p class="dashboard-cockpit__chart-note" data-cockpit-chart-note></p>
        </div>
        <div class="dashboard-cockpit__chart-actions" data-cockpit-chart-acts></div>
      </article>

      <div class="dashboard-cockpit__minis dashboard-cockpit__minis--support" data-cockpit-minis></div>

      <article class="dashboard-cockpit__card dashboard-cockpit__card--complement" aria-label="À surveiller">
        <div class="dashboard-cockpit__card-head dashboard-cockpit__card-head--compact">
          <h3 class="dashboard-cockpit__card-title">À surveiller</h3>
        </div>
        <div class="dashboard-cockpit__watch" data-cockpit-watch></div>
      </article>
    </div>
  `;const t=e.querySelector("[data-cockpit-intro]"),a=e.querySelector("[data-cockpit-micro]"),r=e.querySelector("[data-cockpit-situation-acts]"),n=e.querySelector("[data-cockpit-bars]"),i=e.querySelector("[data-cockpit-chart-read]"),o=e.querySelector("[data-cockpit-chart-note]"),s=e.querySelector("[data-cockpit-chart-acts]"),c=e.querySelector("[data-cockpit-alert]"),l=e.querySelector("[data-cockpit-watch]"),d=e.querySelector("[data-cockpit-minis]"),u=[{key:"risks",label:"Incidents critiques",hint:"Gravité « critique » (vue incidents et synthèse chargée ici)"},{key:"nc",label:"NC ouvertes",hint:"Non-conformités non closées (vue chargée)"},{key:"actions",label:"Actions totales",hint:"Nombre total d’actions suivi sur le périmètre"},{key:"audits",label:"Audits listés",hint:"Audits affichés dans cette vue"}],p={};u.forEach(f=>{const E=document.createElement("div");E.className="dashboard-cockpit__bar-row",E.innerHTML=`
      <span class="dashboard-cockpit__bar-label" title="${f.hint}">${f.label}</span>
      <div class="dashboard-cockpit__bar-track">
        <div class="dashboard-cockpit__bar-fill" data-fill></div>
      </div>
      <span class="dashboard-cockpit__bar-val" data-val>—</span>
    `,n.append(E),p[f.key]={fill:E.querySelector("[data-fill]"),val:E.querySelector("[data-val]")}});const g=[{key:"alertes",label:"Tensions"},{key:"score",label:"Audits"},{key:"echeances",label:"Échéances"},{key:"activite",label:"Flux"}],m={};g.forEach(f=>{const E=document.createElement("div");E.className="dashboard-cockpit__mini",E.innerHTML=`<span class="dashboard-cockpit__mini-label">${f.label}</span><span class="dashboard-cockpit__mini-val" data-mv>—</span>`,d.append(E),m[f.key]={wrap:E,val:E.querySelector("[data-mv]")}});function b(f){r.replaceChildren(),Uc(f).forEach(w=>{const x=document.createElement("button");x.type="button",x.className="dashboard-cockpit__pill",w.emph&&x.classList.add("dashboard-cockpit__pill--emph"),x.textContent=w.label,x.addEventListener("click",()=>ea(w.hash)),r.append(x)})}function y(f,E){s.replaceChildren();const w=Wc(f,E),x=document.createElement("button");x.type="button",x.className="dashboard-cockpit__textlink",x.textContent=`${w.label} →`,x.addEventListener("click",()=>ea(w.hash)),s.append(x)}let v="";function h(f){v=f.hash||"",c.className=`dashboard-cockpit__alert dashboard-cockpit__alert--${f.variant}`,c.replaceChildren();const E=document.createElement("div");E.className="dashboard-cockpit__alert-body";const w=document.createElement("span");w.className="dashboard-cockpit__alert-k",w.textContent=f.kicker;const x=document.createElement("span");x.className="dashboard-cockpit__alert-msg",x.textContent=f.message;const S=document.createElement("span");if(S.className="dashboard-cockpit__alert-cta",S.textContent=f.cta,E.append(w,x,S),c.append(E),f.secondary){const N=document.createElement("div");N.className="dashboard-cockpit__alert-secondary";const L=document.createElement("button");L.type="button",L.className="dashboard-cockpit__alert-link",L.textContent=f.secondary.label,L.addEventListener("click",D=>{D.stopPropagation(),ea(f.secondary.hash)}),N.append(L),c.append(N)}c.setAttribute("aria-label",`${f.message} ${f.cta}`)}c.addEventListener("click",f=>{f.target.closest(".dashboard-cockpit__alert-link")||v&&ea(v)}),c.addEventListener("keydown",f=>{(f.key==="Enter"||f.key===" ")&&v&&(f.preventDefault(),ea(v))});function k(f){if(l.replaceChildren(),!f.length){const w=document.createElement("p");w.className="dashboard-cockpit__watch-empty",w.textContent="Rien d’urgent ici. Maintenir le suivi habituel.",l.append(w);return}const E=document.createElement("ul");E.className="dashboard-cockpit__watch-list",f.forEach(w=>{const x=document.createElement("li"),S=document.createElement("button");S.type="button",S.className="dashboard-cockpit__watch-item",S.textContent=w.text,S.title=`Aller à ${w.hash}`,S.addEventListener("click",()=>ea(w.hash)),x.append(S),E.append(x)}),l.append(E)}function _({stats:f,incidents:E,actions:w,audits:x,ncs:S}){const N=Array.isArray(E)?E:[],L=Array.isArray(w)?w:[],D=Array.isArray(x)?x:[],q=Array.isArray(S)?S:[],W=N.filter(Y=>jc(Y.severity)).length,K=Array.isArray(f==null?void 0:f.criticalIncidents)?f.criticalIncidents.length:0,A=Math.max(W,K),I=q.filter(Oc).length,z=Number(f==null?void 0:f.actions),R=Number.isFinite(z)?z:0,V=D.length,oe={risks:A,nc:I,actions:R,audits:V},ge=Math.max(A,I,R,V,1);u.forEach(Y=>{const ne=oe[Y.key],ae=Math.round(ne/ge*100),de=p[Y.key];de&&(de.fill.style.width=`${ae}%`,de.val.textContent=String(ne))});const B=Number(f==null?void 0:f.overdueActions),re=Number.isFinite(B)?B:0,se=Math.min(5,N.length)+Math.min(5,L.length)+Math.min(5,D.length),F=A+re+I,H=(D||[]).map(Y=>Number(Y.score)).filter(Y=>Number.isFinite(Y)),G=H.length>0,X=G?Math.round(H.reduce((Y,ne)=>Y+ne,0)/H.length):0;t.textContent=Hc({riskVal:A,openNc:I,actN:R,audN:V,od:re,actCount:se}),a.textContent=Bc({riskVal:A,openNc:I,od:re,alertesSum:F}),b({riskVal:A,openNc:I,od:re}),h(Yc(I,A,re)),i.textContent=Fc(oe,ge),o.textContent="Les barres s’alignent sur l’indicateur le plus élevé pour faciliter la lecture.",y(oe,ge);const $=Vc({alertesSum:F,od:re,actCount:se,avgScore:X,hasScores:G});m.alertes.val.textContent=$.tensions,m.alertes.wrap.title=`Indicateur composite (${F}) : incidents critiques + retards + NC ouvertes.`,m.score.val.textContent=$.score,m.score.wrap.title="Moyenne des scores sur les audits de cette vue.",m.echeances.val.textContent=$.echeances,m.echeances.wrap.title="Nombre d’actions en retard (synthèse).",m.activite.val.textContent=$.activite,m.activite.wrap.title="Niveau d’activité récente dans le flux du tableau de bord.",k(Gc({riskVal:A,openNc:I,od:re,avgScore:X,hasScores:G,audN:V}));const j=e.querySelector("[data-cockpit-chart]");j&&j.setAttribute("aria-label",`Comparatif : ${A} incidents critiques, ${I} NC ouvertes, ${R} actions, ${V} audits.`)}return{root:e,update:_}}const Mn="qhse-dashboard-cockpit-premium-styles",Jc=`
/* Ancien cockpit direction masqué ; alertes + raccourcis restent visibles dans la bande */
.dashboard-band--cockpit .dashboard-cockpit {
  display: none !important;
}

.dcp-cockpit {
  background: var(--color-background-primary);
  border-radius: var(--ds-radius-lg, 20px);
  border: 1px solid var(--color-border-tertiary);
  padding: 22px 24px;
  margin: 0 0 8px;
  box-sizing: border-box;
  box-shadow: var(--shadow-card);
  color: var(--text);
}

.dcp-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px 16px;
  margin-bottom: 18px;
}

.dcp-header-main {
  min-width: 0;
}

.dcp-date {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text3);
}

.dcp-title {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
  color: var(--text);
}

.dcp-site {
  margin: 0;
  font-size: 12px;
  color: var(--text3);
}

.dcp-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border: 1px solid var(--color-border-secondary);
  background: var(--color-background-secondary);
  color: var(--text2);
}

.dcp-status-pill--success {
  border-color: var(--color-border-success);
  background: var(--color-success-bg);
  color: var(--color-text-success);
}

.dcp-status-pill--warning {
  border-color: var(--color-border-warning);
  background: var(--color-warning-bg);
  color: var(--color-text-warning);
}

.dcp-status-pill--danger {
  border-color: var(--color-border-danger);
  background: var(--color-danger-bg);
  color: var(--color-text-danger);
}

.dcp-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  animation: dcp-pulse 1.6s ease-in-out infinite;
}

@keyframes dcp-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.45; transform: scale(0.92); }
}

.dcp-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

@media (max-width: 960px) {
  .dcp-kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .dcp-kpi-grid {
    grid-template-columns: 1fr;
  }
}

.dcp-kpi-card {
  position: relative;
  padding: 14px 12px 12px;
  border-radius: var(--ds-radius-md, 14px);
  border: 1px solid var(--color-border-tertiary);
  background: var(--color-background-secondary);
  min-width: 0;
}

.dcp-kpi-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 12px;
  right: 12px;
  height: 2px;
  border-radius: 0 0 2px 2px;
  background: rgba(20, 184, 166, 0.78);
}

.dcp-kpi-card--info::before {
  background: rgba(20, 184, 166, 0.78);
}

.dcp-kpi-card--warning::before {
  background: rgba(251, 191, 36, 0.85);
}

.dcp-kpi-card--danger::before {
  background: rgba(248, 113, 113, 0.9);
}

.dcp-kpi-card--success::before {
  background: rgba(52, 211, 153, 0.85);
}

.dcp-kpi-value {
  font-size: 36px;
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1.1;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

.dcp-kpi-label {
  margin: 6px 0 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text3);
}

.dcp-kpi-delta {
  font-size: 11px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--text3);
}

.dcp-mid-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

@media (max-width: 800px) {
  .dcp-mid-grid {
    grid-template-columns: 1fr;
  }
}

.dcp-card {
  padding: 14px 14px 12px;
  border-radius: var(--ds-radius-md, 14px);
  border: 1px solid var(--color-border-tertiary);
  background: var(--color-background-secondary);
  min-height: 140px;
}

.dcp-card-title {
  margin: 0 0 10px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text3);
}

.dcp-alert-item,
.dcp-action-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border-tertiary);
}

.dcp-alert-item:last-child,
.dcp-action-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.dcp-alert-item {
  flex-direction: row;
  align-items: flex-start;
  gap: 10px;
}

.dcp-alert-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--color-text-tertiary) 55%, transparent);
}

.dcp-alert-dot--critique {
  background: rgba(248, 113, 113, 0.9);
}

.dcp-alert-dot--moyen {
  background: rgba(251, 191, 36, 0.9);
}

.dcp-alert-body {
  min-width: 0;
  flex: 1;
}

.dcp-alert-title {
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
  color: var(--text);
  word-break: break-word;
}

.dcp-alert-meta {
  font-size: 11px;
  color: var(--text3);
}

.dcp-badge {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid var(--color-border-secondary);
  background: var(--color-background-tertiary);
  color: var(--text2);
  align-self: flex-start;
}

.dcp-badge--critique {
  border-color: var(--color-border-danger);
  color: var(--color-text-danger);
  background: var(--ds-danger-muted);
}

.dcp-badge--moyen {
  border-color: var(--color-border-warning);
  color: var(--color-text-warning);
  background: var(--ds-warning-muted);
}

.dcp-action-item {
  border-left: 3px solid color-mix(in srgb, var(--color-text-danger) 55%, transparent);
  padding-left: 10px;
  border-bottom-color: var(--color-border-tertiary);
}

.dcp-action-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text);
}

.dcp-action-meta {
  font-size: 11px;
  color: var(--text3);
}

.dcp-overdue-badge {
  display: inline-block;
  margin-top: 4px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 4px 8px;
  border-radius: 999px;
  background: var(--ds-danger-muted);
  color: var(--color-text-danger);
  border: 1px solid var(--color-border-danger);
}

.dcp-empty-ok {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-text-success);
  font-weight: 600;
}

.dcp-bottom-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

@media (max-width: 800px) {
  .dcp-bottom-grid {
    grid-template-columns: 1fr;
  }
}

.dcp-trend-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 6px;
  height: 52px;
  margin: 10px 0 8px;
  padding: 0 2px;
}

.dcp-trend-bar-wrap {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
}

.dcp-trend-bar {
  width: 100%;
  max-width: 28px;
  border-radius: 4px 4px 2px 2px;
  min-height: 4px;
  background: rgba(20, 184, 166, 0.42);
  transition: height 0.2s ease;
}

.dcp-trend-bar--current {
  background: rgba(45, 212, 191, 0.88);
}

.dcp-trend-bar--spike {
  background: rgba(248, 113, 113, 0.85);
}

.dcp-trend-label {
  font-size: 9px;
  font-weight: 700;
  color: var(--text3);
  text-transform: uppercase;
}

.dcp-trend-footer {
  margin: 0;
  font-size: 11px;
  color: var(--text3);
  line-height: 1.4;
}

.dcp-conf-item {
  margin-bottom: 10px;
}

.dcp-conf-item:last-child {
  margin-bottom: 0;
}

.dcp-conf-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 4px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text2);
}

.dcp-conf-pct {
  font-variant-numeric: tabular-nums;
  font-weight: 800;
}

.dcp-conf-track {
  height: 6px;
  border-radius: 999px;
  background: var(--color-background-tertiary);
  border: 1px solid var(--color-border-tertiary);
  box-sizing: border-box;
  overflow: hidden;
}

.dcp-conf-fill {
  height: 100%;
  border-radius: 999px;
  min-width: 0;
  transition: width 0.25s ease;
}

.dcp-conf-fill--low {
  background: rgba(251, 146, 60, 0.85);
}

.dcp-conf-fill--mid {
  background: rgba(20, 184, 166, 0.85);
}

.dcp-conf-fill--high {
  background: rgba(52, 211, 153, 0.88);
}

.dcp-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border-tertiary);
}

.dcp-footer-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dcp-btn {
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  border: 1px solid var(--color-border-secondary);
  background: var(--color-background-primary);
  color: var(--text);
  transition: border-color 0.15s ease, background 0.15s ease;
}

.dcp-btn:hover {
  border-color: var(--color-border-primary);
  background: var(--color-background-tertiary);
}

.dcp-btn--primary {
  border-color: var(--color-border-info);
  background: var(--ds-primary-muted);
  color: var(--color-text-info);
}

.dcp-btn--primary:hover {
  background: color-mix(in srgb, var(--palette-accent) 22%, var(--color-background-primary));
  border-color: var(--color-border-info);
}

.dcp-sync {
  margin: 0;
  font-size: 11px;
  color: var(--text3);
  font-variant-numeric: tabular-nums;
}
`;function Kc(){if(typeof document>"u"||document.getElementById(Mn))return;const e=document.createElement("style");e.id=Mn,e.textContent=Jc,document.head.append(e)}function xt(e){return Array.isArray(e)?e:[]}function sa(e){const t=Number(e);return Number.isFinite(t)?t:0}function Fr(e){return/(clos|ferm|done|termin|clôtur|résolu|resolu|complete)/i.test(String(e||""))}function Xc(e){const t=String((e==null?void 0:e.status)||"").toLowerCase();return t?!/(clos|ferm|done|termin|clôtur|résolu|resolu|complete)/i.test(t):!0}function Ca(e){return String(e||"").toLowerCase().includes("critique")}function Zc(e){return xt(e).filter(t=>Ca(t==null?void 0:t.severity)&&!Fr(t==null?void 0:t.status)).length}function el(e,t){const a=Zc(e),r=sa(t);return a>=4||r>=10?{label:"ACTION URGENTE",color:"danger"}:a>=2||r>=5?{label:"VIGILANCE REQUISE",color:"warning"}:{label:"SITUATION STABLE",color:"success"}}function tl(e){const t=Date.now()-2592e6;return xt(e).filter(a=>{if(!(a!=null&&a.createdAt))return!1;const r=new Date(a.createdAt);return!Number.isNaN(r.getTime())&&r.getTime()>t}).length}function Yo(e){if(!(e!=null&&e.dueDate)||Fr(e==null?void 0:e.status))return!1;const t=new Date(e.dueDate);return Number.isNaN(t.getTime())?!1:t.getTime()<Date.now()}function al(e){if(!(e!=null&&e.dueDate))return 0;const t=new Date(e.dueDate);return Number.isNaN(t.getTime())?0:Math.max(0,Math.floor((Date.now()-t.getTime())/(1440*60*1e3)))}function il(e){return xt(e).filter(t=>Yo(t)?`${(t==null?void 0:t.detail)||""} ${(t==null?void 0:t.title)||""} ${(t==null?void 0:t.status)||""}`.toLowerCase().includes("critique"):!1).length}function Pn(e){const t=xt(e).map(a=>Number(a==null?void 0:a.score)).filter(a=>Number.isFinite(a));return t.length?Math.round(t.reduce((a,r)=>a+r,0)/t.length):null}function rl(e){const t=xt(e).filter(i=>Number.isFinite(Number(i==null?void 0:i.score)));if(t.length<2)return null;const a=Number(t[0].score),r=Number(t[1].score);if(!Number.isFinite(a)||!Number.isFinite(r))return null;const n=a-r;return n===0?"0":n>0?`+ ${n} pts`:`${n} pts`}function Rn(e,t){const a=xt(e);return a.length?a.filter(Xc).length:sa(t)}function nl(e){return xt(e).some(t=>`${(t==null?void 0:t.title)||""} ${(t==null?void 0:t.detail)||""}`.toLowerCase().includes("majeure"))}function Dn(e,t){const a=String(e||"").trim();return a.length<=t?a:`${a.slice(0,Math.max(0,t-1))}…`}function ol(e){try{const t=new Date(e);if(Number.isNaN(t.getTime()))return"";const a=Math.floor((Date.now()-t.getTime())/(1440*60*1e3));return a<=0?"aujourd'hui":a===1?"il y a 1j":`il y a ${a}j`}catch{return""}}function sl(){try{return new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}catch{return"—"}}function cl(e){var n;const t=e&&typeof e=="object"?e:null,a=((n=t==null?void 0:t.defaultSite)==null?void 0:n.name)||(t==null?void 0:t.siteName);if(a&&String(a).trim())return String(a).trim();const r=Ne==null?void 0:Ne.currentSite;return r&&String(r).trim()?String(r).trim():"Tous sites"}function ll(e){return e>5?"danger":e>2?"warning":"info"}function dl(e){return e>5?"danger":e>0?"warning":"success"}function pl(e){return e>0?"warning":"success"}function ul(e){return e==null?"info":e<70?"danger":e<80?"warning":"success"}function ml(e){return e<70?"dcp-conf-fill dcp-conf-fill--low":e<85?"dcp-conf-fill dcp-conf-fill--mid":"dcp-conf-fill dcp-conf-fill--high"}function Ga(e,t,a,r){const n=document.createElement("div");n.className=`dcp-kpi-card dcp-kpi-card--${r}`;const i=document.createElement("div");i.className="dcp-kpi-value",i.textContent=t;const o=document.createElement("div");o.className="dcp-kpi-label",o.textContent=e;const s=document.createElement("div");return s.className="dcp-kpi-delta",s.textContent=a,n.append(i,o,s),n}function gl(e={}){Kc();let t=null;const a=document.createElement("div");a.className="dashboard-band dashboard-band--cockpit-premium";const r=document.createElement("article");r.className="dcp-cockpit",r.setAttribute("aria-label","Cockpit QHSE premium");const n=document.createElement("header"),i=document.createElement("div"),o=document.createElement("div"),s=document.createElement("div"),c=document.createElement("footer");n.className="dcp-header",i.className="dcp-kpi-grid",o.className="dcp-mid-grid",s.className="dcp-bottom-grid",c.className="dcp-footer",r.append(n,i,o,s,c),a.append(r);function l(u){const p=u!=null&&u.data&&typeof u.data=="object"?u.data:{},g=xt(u==null?void 0:u.incidents),m=xt(u==null?void 0:u.actions),b=xt(u==null?void 0:u.audits),y=xt(u==null?void 0:u.ncs),v=(u==null?void 0:u.sessionUser)??null,h=Date.now(),k=t==null,_=k?0:h-t,f=Math.floor(_/6e4);t=h;const E=sa(p.overdueActions),w=el(g,E);n.replaceChildren();const x=document.createElement("div");x.className="dcp-header-main";const S=document.createElement("p");S.className="dcp-date",S.textContent=sl();const N=document.createElement("h2");N.className="dcp-title",N.textContent="Cockpit QHSE";const L=document.createElement("p");L.className="dcp-site",L.textContent=`Site actif · ${cl(v)}`,x.append(S,N,L);const D=document.createElement("div");D.className=`dcp-status-pill dcp-status-pill--${w.color}`;const q=document.createElement("span");q.className="dcp-status-dot",q.setAttribute("aria-hidden","true");const W=document.createElement("span");W.textContent=w.label,D.append(q,W),n.append(x,D);const K=sa(p.incidents),A=tl(g);i.replaceChildren(Ga("Incidents",String(K),`${A} ce mois`,ll(K)),Ga("Actions en retard",String(E),`${il(m)} critiques`,dl(E)),Ga("NC ouvertes",String(Rn(y,p.nonConformities)),nl(y)?"majeure":"stable",pl(Rn(y,p.nonConformities))),(()=>{const O=Pn(b),M=O!=null?`${O}%`:"—",U=rl(b);return Ga("Score audits",M,U??"—",ul(O))})()),o.replaceChildren();const I=document.createElement("div");I.className="dcp-card";const z=document.createElement("h3");z.className="dcp-card-title",z.textContent="À traiter maintenant",I.append(z);const R=g.filter(O=>Ca(O==null?void 0:O.severity)&&!Fr(O==null?void 0:O.status)).sort((O,M)=>{const U=new Date((O==null?void 0:O.createdAt)||0).getTime();return new Date((M==null?void 0:M.createdAt)||0).getTime()-U}).slice(0,3);if(R.length)R.forEach(O=>{const M=document.createElement("div");M.className="dcp-alert-item";const U=document.createElement("span");U.className=`dcp-alert-dot ${Ca(O==null?void 0:O.severity)?"dcp-alert-dot--critique":"dcp-alert-dot--moyen"}`;const J=document.createElement("div");J.className="dcp-alert-body";const te=document.createElement("div");te.className="dcp-alert-title",te.textContent=Dn((O==null?void 0:O.description)||(O==null?void 0:O.type)||(O==null?void 0:O.ref)||"Incident",55);const Z=document.createElement("div");Z.className="dcp-alert-meta";const le=O!=null&&O.createdAt?ol(O.createdAt):"";Z.textContent=[(O==null?void 0:O.site)||"—",le].filter(Boolean).join(" · "),J.append(te,Z);const be=document.createElement("span");be.className=`dcp-badge ${Ca(O==null?void 0:O.severity)?"dcp-badge--critique":"dcp-badge--moyen"}`,be.textContent=Ca(O==null?void 0:O.severity)?"Critique":"Moyen",M.append(U,J,be),I.append(M)});else{const O=document.createElement("p");O.className="dcp-empty-ok",O.textContent="Aucune alerte critique — situation maîtrisée",I.append(O)}const V=document.createElement("div");V.className="dcp-card";const oe=document.createElement("h3");oe.className="dcp-card-title",oe.textContent="Actions en retard",V.append(oe);const ge=m.filter(Yo).slice(0,3);if(ge.length)ge.forEach(O=>{var le;const M=document.createElement("div");M.className="dcp-action-item";const U=document.createElement("div");U.className="dcp-action-title",U.textContent=Dn((O==null?void 0:O.title)||"Action",80);const J=document.createElement("div");J.className="dcp-action-meta",J.textContent=(O==null?void 0:O.owner)||((le=O==null?void 0:O.assignee)==null?void 0:le.name)||"—";const te=document.createElement("span");te.className="dcp-overdue-badge";const Z=al(O);te.textContent=`${Z}j retard`,M.append(U,J,te),V.append(M)});else{const O=document.createElement("p");O.className="dcp-sync",O.textContent="Aucune action en retard sur cet aperçu.",V.append(O)}o.append(I,V),s.replaceChildren();const B=document.createElement("div");B.className="dcp-card";const re=document.createElement("h3");re.className="dcp-card-title",re.textContent="Tendance incidents (6 mois)",B.append(re);const se=ri(g),F=se.map(O=>sa(O.value)),H=Math.max(1,...F),G=F.reduce((O,M)=>O+M,0),X=F.length?G/F.length:0,$=se.length-1,T=document.createElement("div");T.className="dcp-trend-bars",se.forEach((O,M)=>{const U=sa(O.value),J=H?Math.round(U/H*100):0,te=document.createElement("div");te.className="dcp-trend-bar-wrap";const Z=document.createElement("div");Z.className="dcp-trend-bar",M===$&&Z.classList.add("dcp-trend-bar--current"),X>0&&U>X*1.5&&Z.classList.add("dcp-trend-bar--spike"),Z.style.height=`${Math.max(8,J)}%`;const le=document.createElement("span");le.className="dcp-trend-label",le.textContent=O.label||"",te.append(Z,le),T.append(te)}),B.append(T);const j=F[$]??0,Y=F[$-1]??0,ne=j-Y,ae=document.createElement("p");ae.className="dcp-trend-footer",ae.textContent=`${j} incidents ce mois · ${ne>=0?"+":""}${ne} vs mois précédent`,B.append(ae);const de=document.createElement("div");de.className="dcp-card";const he=document.createElement("h3");he.className="dcp-card-title",he.textContent="Conformité (aperçu)",de.append(he);const fe=Pn(b),_e=fe??72;[{label:"ISO 45001",pct:Math.min(100,Math.max(0,_e))},{label:"ISO 14001",pct:Math.min(100,Math.max(0,_e-2))},{label:"ISO 9001",pct:Math.min(100,Math.max(0,_e-4))},{label:"Cadre minier (réf.)",pct:Math.min(100,Math.max(0,_e-6))}].forEach(O=>{const M=document.createElement("div");M.className="dcp-conf-item";const U=document.createElement("div");U.className="dcp-conf-head";const J=document.createElement("span");J.textContent=O.label;const te=document.createElement("span");te.className="dcp-conf-pct",te.textContent=`${Math.round(O.pct)}%`,U.append(J,te);const Z=document.createElement("div");Z.className="dcp-conf-track";const le=document.createElement("div");le.className=ml(O.pct),le.style.width=`${Math.round(O.pct)}%`,Z.append(le),M.append(U,Z),de.append(M)}),s.append(B,de),c.replaceChildren();const ve=document.createElement("div");ve.className="dcp-footer-btns";const Ae=document.createElement("button");Ae.type="button",Ae.className="dcp-btn dcp-btn--primary",Ae.textContent="+ Déclarer un incident",Ae.addEventListener("click",()=>{window.location.hash="incidents"});const ze=document.createElement("button");ze.type="button",ze.className="dcp-btn",ze.textContent="Plan d'actions",ze.addEventListener("click",()=>{window.location.hash="actions"});const Pe=document.createElement("button");Pe.type="button",Pe.className="dcp-btn",Pe.textContent="Voir les audits",Pe.addEventListener("click",()=>{window.location.hash="audits"}),ve.append(Ae,ze,Pe);const We=document.createElement("p");We.className="dcp-sync",k?We.textContent="Sync à l’instant":f<1?We.textContent="Sync il y a moins d’1 min":We.textContent=`Sync il y a ${f} min`,c.append(ve,We)}function d(u){try{l(u||{})}catch(p){console.warn("[dashboardCockpitPremium] render",p)}}return d({data:e.data||{},incidents:e.incidents,actions:e.actions,audits:e.audits,ncs:e.ncs,sessionUser:e.sessionUser}),{root:a,update:d}}function bl(e){e&&(window.location.hash=e)}function hl(e={}){var b;const t=typeof e.onExportDirection=="function"?e.onExportDirection:()=>{};let a=Math.max(0,Number(e.overdueCount)||0),r=Math.max(0,Number(e.ncCount)||0);const n=[{key:"incident",label:"+ Créer un incident",hint:"Déclaration terrain",page:"incidents",variant:"incident"},{key:"action",label:"+ Créer une action",hint:"Plan d’actions",page:"actions",variant:"action"},{key:"audit",label:"+ Lancer un audit",hint:"Module audits",page:"audits",variant:"audit"},{key:"nc",label:"Non-conformités",hint:"Suivi NC & constats",page:"audits",variant:"nc"},{key:"export",label:"Export / rapport",hint:"Direction",variant:"export"}],i=document.createElement("section");i.className="dashboard-section dashboard-shortcuts",i.setAttribute("aria-labelledby","dashboard-shortcuts-title");const o=document.createElement("header");o.className="dashboard-section-head";const s=document.createElement("span");s.className="dashboard-section-kicker",s.textContent="Accès rapide";const c=document.createElement("h2");c.id="dashboard-shortcuts-title",c.className="dashboard-section-title",c.textContent="Raccourcis utiles";const l=document.createElement("p");l.className="dashboard-section-sub",l.textContent="Raccourcis vers les modules.",o.append(s,c,l);const d=document.createElement("div");d.className="dashboard-shortcuts__grid ds-action-grid",d.setAttribute("role","toolbar"),d.setAttribute("aria-label","Raccourcis vers les modules QHSE");const u=((b=Me())==null?void 0:b.role)??null;let p,g;n.forEach(y=>{if(y.page&&!yt(u,y.page))return;const v=document.createElement("button");v.type="button";const h=y.key==="incident"?" dashboard-shortcuts__tile--featured":"";v.className=`dashboard-shortcuts__tile dashboard-shortcuts__tile--${y.variant||"default"}${h}`,v.setAttribute("aria-label",`${y.label} — ${y.hint}`);const k=document.createElement("span");k.className="dashboard-shortcuts__tile-label",k.textContent=y.label;const _=document.createElement("span");if(_.className="dashboard-shortcuts__tile-hint",_.textContent=y.hint,v.append(k),y.key==="action"){const f=document.createElement("span");f.className="shortcut-live-badge",f.hidden=a<=0,f.textContent=String(a),p=f,v.append(f)}else if(y.key==="nc"){const f=document.createElement("span");f.className="shortcut-live-badge",f.hidden=r<=0,f.textContent=String(r),g=f,v.append(f)}v.append(_),y.key==="export"?v.addEventListener("click",()=>t()):y.page&&v.addEventListener("click",()=>bl(y.page)),d.append(v)}),i.append(o,d);function m(y={}){y.overdueCount!=null&&(a=Math.max(0,Number(y.overdueCount)||0)),y.ncCount!=null&&(r=Math.max(0,Number(y.ncCount)||0)),p&&(p.textContent=String(a),p.hidden=a<=0),g&&(g.textContent=String(r),g.hidden=r<=0)}return{root:i,updateShortcutBadges:m}}function xl(e){const t=String((e==null?void 0:e.status)||"").toLowerCase();return t?!/(clos|ferm|done|termin|clôtur|résolu|resolu|complete)/i.test(t):!0}function fl(e){var n,i,o,s;if(!Array.isArray(e)||e.length<4)return"Vue incidents en cours de consolidation";const t=e.length,a=(((n=e[t-1])==null?void 0:n.value)||0)+(((i=e[t-2])==null?void 0:i.value)||0),r=(((o=e[t-3])==null?void 0:o.value)||0)+(((s=e[t-4])==null?void 0:s.value)||0);return a>r+1?"Activité récente en hausse":r>a+1?"Activité récente en baisse":"Activité récente stable"}function vl(e){var s,c,l,d;const{criticalN:t,overdueAgg:a,openNc:r,avgScore:n,series:i}=e,o=Array.isArray(i)&&i.length>=4&&(((s=i[i.length-1])==null?void 0:s.value)||0)+(((c=i[i.length-2])==null?void 0:c.value)||0)>(((l=i[i.length-3])==null?void 0:l.value)||0)+(((d=i[i.length-4])==null?void 0:d.value)||0)+2;return t>0||a>=4||r>=6?{level:"fix",headline:"Des écarts nécessitent une correction",hint:"Prioriser les sujets listés dans les alertes."}:a>=1||r>=1||n!=null&&n<68||o?{level:"watch",headline:"Système sous vigilance",hint:"Surveiller les indicateurs et le suivi des plans."}:{level:"stable",headline:"Système globalement stable",hint:"Maintenir le pilotage et les revues prévues."}}function yl(){const e=document.createElement("article");e.className="content-card card-soft dashboard-sys-status",e.setAttribute("aria-live","polite"),e.innerHTML=`
    <div class="dashboard-sys-status__strip" data-sys-strip></div>
    <div class="dashboard-sys-status__body">
      <p class="dashboard-sys-status__headline" data-sys-headline></p>
      <p class="dashboard-sys-status__hint" data-sys-hint></p>
      <div class="dashboard-sys-status__grid" data-sys-grid></div>
      <div class="dashboard-sys-status__actions" data-sys-actions hidden></div>
    </div>
  `;const t=e.querySelector("[data-sys-strip]"),a=e.querySelector("[data-sys-headline]"),r=e.querySelector("[data-sys-hint]"),n=e.querySelector("[data-sys-grid]"),i=e.querySelector("[data-sys-actions]");function o(c,l){const d=document.createElement("div");d.className="dashboard-sys-status__cell";const u=document.createElement("span");u.className="dashboard-sys-status__label",u.textContent=c;const p=document.createElement("span");return p.className="dashboard-sys-status__value",p.textContent=l,d.append(u,p),d}function s(c){const l=c.stats||{},d=Array.isArray(c.incidents)?c.incidents:[],u=Array.isArray(c.actions)?c.actions:[],p=Array.isArray(c.audits)?c.audits:[],g=Array.isArray(c.ncs)?c.ncs:[],m=Array.isArray(l.criticalIncidents)?l.criticalIncidents.length:0,b=Number(l.overdueActions),y=Number.isFinite(b)?b:0,v=g.filter(xl).length,h=p.map(L=>Number(L.score)).filter(L=>Number.isFinite(L)),k=h.length?Math.round(h.reduce((L,D)=>L+D,0)/h.length):null,_=ri(d),f=Uo(u),E=f.done+f.overdue+f.other,w=E>0?Math.round(f.done/E*100):null,{level:x,headline:S,hint:N}=vl({criticalN:m,overdueAgg:y,openNc:v,avgScore:k,series:_});if(e.className=`content-card card-soft dashboard-sys-status dashboard-sys-status--${x}`,t.className=`dashboard-sys-status__strip dashboard-sys-status__strip--${x}`,a.textContent=S,r.textContent=N,n.replaceChildren(o("Performance audits",k!=null?`${k} %`:"—"),o("Avancement des actions",w!=null?`${w} % traitées`:"—"),o("NC ouvertes",String(v)),o("Tendance incidents",fl(_))),i){i.replaceChildren();const L=Rt([{label:"Piloter les actions",pageId:"actions"},{label:"Voir les audits",pageId:"audits"}],{className:"dashboard-block-actions dashboard-block-actions--tight"});L?(i.append(L),i.hidden=!1):i.hidden=!0}}return{root:e,update:s}}const zr=864e5;function jn(e,t,a){if(!Array.isArray(e))return 0;let r=0;return e.forEach(n=>{if(!(n!=null&&n.createdAt))return;const i=new Date(n.createdAt).getTime();Number.isNaN(i)||i<t||i>=a||(r+=1)}),r}function Qo(e,t=Date.now()){const a=Array.isArray(e)?e:[],r=t-7*zr,n=t-14*zr,i=jn(a,r,t),o=jn(a,n,r),s=i>=2&&i>o&&(o===0||i>=Math.ceil(o*1.35)||i-o>=2);return{last7:i,prev7:o,spike:s}}const kl=5;function _l(e){const t=String((e==null?void 0:e.status)||"").toLowerCase();return t?!/(clos|ferm|done|termin|clôtur|résolu|resolu|complete)/i.test(t):!0}function wl(e){const t=String((e==null?void 0:e.status)||"").toLowerCase();return t?/retard|late|overdue|dépass|reprogram|échéance|à planifier|non réalis/i.test(t):!1}function El(e){const t=String((e==null?void 0:e.status)||"").toLowerCase();return t.includes("retard")?!1:/termin|clos|ferm|clôtur|realis|réalis|effectu|complete|complété|fait/.test(t)}function Nl(e){const t=String(e||"").replace(/^#/,"");t&&(window.location.hash=t)}function Sl(e){const t=(e==null?void 0:e.stats)||{},a=Array.isArray(e==null?void 0:e.incidents)?e.incidents:[],r=Array.isArray(e==null?void 0:e.actions)?e.actions:[],n=Array.isArray(e==null?void 0:e.audits)?e.audits:[],i=Array.isArray(e==null?void 0:e.ncs)?e.ncs:[],o=Date.now(),{spike:s}=Qo(a,o),c=[];s&&c.push({variant:"trend",headline:"Les incidents accélèrent sur 7 jours",detail:"La fenêtre récente dépasse la période précédente : vérifier les causes récurrentes et le terrain.",hash:"incidents"});const l=i.filter(_l),d=new Map,u=new Map;l.forEach(f=>{const E=(f==null?void 0:f.siteId)!=null&&String(f.siteId).trim()?String(f.siteId):"";E&&d.set(E,(d.get(E)||0)+1);const w=(f==null?void 0:f.auditRef)!=null&&String(f.auditRef).trim()?String(f.auditRef).trim():"";w&&u.set(w,(u.get(w)||0)+1)});const p=[...d.values()],g=p.length?Math.max(...p):0,m=[...u.values()],b=m.length?Math.max(...m):0;g>=2?c.push({variant:"anomaly",headline:"NC ouvertes concentrées sur un même site",detail:"Le volume par site sort du schéma habituel : prioriser une revue locale et le plan d’actions.",hash:"audits"}):b>=2&&c.push({variant:"anomaly",headline:"Même filière d’audit : NC qui se répètent",detail:"Plusieurs ouvertures sur un même contexte : creuser la cause système, pas seulement le symptôme.",hash:"audits"});const y=o-30*zr;let v=0;r.forEach(f=>{if(El(f)||!(f!=null&&f.dueDate))return;const E=new Date(f.dueDate).getTime();Number.isNaN(E)||E>=y||(v+=1)});const h=Math.max(0,Number(t.overdueActions)||0);v>=3||h>=6?c.push({variant:"drift",headline:"File d’actions qui vieillit",detail:"Nombre élevé d’actions anciennes ou en retard côté agrégat : risque de dérive du plan — arbitrage nécessaire.",hash:"actions"}):(v>=2||h>=4)&&c.push({variant:"drift",headline:"Plusieurs actions sans clôture prolongée",detail:"Échéances dépassées ou anciennes : relancer les porteurs et séquencer les clôtures.",hash:"actions"});const k=n.filter(wl);if(k.length>=2){const f=new Set(k.map(E=>(E==null?void 0:E.site)!=null&&String(E.site).trim()?String(E.site).trim():""));f.delete(""),c.push({variant:"drift",headline:f.size>=2?"Audits en retard sur plusieurs sites":"Plusieurs audits à finaliser ou à replanifier",detail:"Le calendrier audit s’écarte : sécuriser les dates ou ajuster les ressources.",hash:"audits"})}const _=n.map(f=>({t:f!=null&&f.createdAt?new Date(f.createdAt).getTime():NaN,score:Number(f==null?void 0:f.score)})).filter(f=>Number.isFinite(f.t)&&!Number.isNaN(f.t)&&Number.isFinite(f.score));if(_.sort((f,E)=>f.t-E.t),_.length>=8){const f=Math.floor(_.length/2),E=_.slice(0,f),w=_.slice(f),x=L=>L.reduce((D,q)=>D+q.score,0)/L.length,S=x(E),N=x(w);S>=55&&N<S-7&&c.push({variant:"trend",headline:"Les scores audit baissent sur les dossiers récents",detail:"Écart significatif vs périodes plus anciennes : renforcer le cadrage ou la formation terrain.",hash:"audits"})}return c.slice(0,kl)}const Cl={trend:"📈",anomaly:"⚠",drift:"↘"},Al={trend:"Tendance",anomaly:"Anomalie",drift:"Dérive"};function zl(){const e=document.createElement("article");e.className="content-card card-soft dashboard-vigilance-card";const t=document.createElement("div");t.className="dashboard-vigilance-host",e.append(t);function a(r){var c;(c=e.querySelector(".dashboard-vigilance-actions"))==null||c.remove();const n=Sl(r||{});if(t.replaceChildren(),n.length){const l=document.createElement("ul");l.className="dashboard-vigilance-rich-list",n.forEach(d=>{const u=document.createElement("li");u.className=`dashboard-vigilance-rich-item dashboard-vigilance-rich-item--${d.variant}`;const p=document.createElement("div");p.className="dashboard-vigilance-rich-top";const g=document.createElement("span");g.className="dashboard-vigilance-rich-icon",g.setAttribute("aria-hidden","true"),g.textContent=Cl[d.variant]||"•";const m=document.createElement("span");m.className="dashboard-vigilance-rich-variant",m.textContent=Al[d.variant]||"Veille",p.append(g,m);const b=document.createElement("p");b.className="dashboard-vigilance-rich-headline",b.textContent=d.headline;const y=document.createElement("p");y.className="dashboard-vigilance-rich-detail",y.textContent=d.detail;const v=document.createElement("div");v.className="dashboard-vigilance-rich-cta";const h=document.createElement("button");h.type="button",h.className="dashboard-vigilance-investigate",h.textContent="Investiguer",h.addEventListener("click",()=>Nl(d.hash));const k=document.createElement("span");k.className="dashboard-vigilance-rich-hint",k.textContent="Voir le détail dans le module",v.append(h,k),u.append(p,b,y,v),l.append(u)}),t.append(l)}else{const l=document.createElement("div");l.className="dashboard-vigilance-empty-block";const d=document.createElement("p");d.className="dashboard-vigilance-empty-lead",d.textContent="Aucun signal fort sur les règles actuelles";const u=document.createElement("p");u.className="dashboard-vigilance-empty-detail",u.textContent="Données dans la norme.",l.append(d,u),t.append(l)}const i=document.createElement("div");i.className="dashboard-vigilance-actions";const o=n.length?[{label:"Vue audits & NC",pageId:"audits"},{label:"Vue incidents",pageId:"incidents"}]:[{label:"Explorer les incidents",pageId:"incidents"},{label:"Ouvrir les actions",pageId:"actions"}],s=Rt(o,{className:"dashboard-block-actions dashboard-block-actions--tight"});s&&i.append(s),i.childNodes.length&&e.append(i)}return{root:e,update:a}}const On=2;function $l(e){const t=String((e==null?void 0:e.status)||"").toLowerCase();return t?!/(clos|ferm|done|termin|clôtur|résolu|resolu|complete)/i.test(t):!0}function ql(e){const t=(e==null?void 0:e.stats)||{},a=Array.isArray(e==null?void 0:e.incidents)?e.incidents:[],r=Array.isArray(e==null?void 0:e.ncs)?e.ncs:[],n=Math.max(0,Number(t.overdueActions)||0),i=r.filter($l).length,o=Date.now(),{last7:s,spike:c}=Qo(a,o),l=[];n>=2?l.push({accent:"actions",message:"Retards",recommendation:`${n} actions en retard`,see:{label:"Actions",pageId:"actions"},apply:{label:"Traiter",pageId:"actions"}}):n===1&&l.push({accent:"actions",message:"Retard",recommendation:"1 action en retard",see:{label:"Actions",pageId:"actions"},apply:{label:"Traiter",pageId:"actions"}}),(c||s>=4)&&l.push({accent:"incidents",message:c?"Pic":"Activité 7 j",recommendation:c?`${s} en 7 j`:`${s} · 7 j`,see:{label:"Incidents",pageId:"incidents"},apply:{label:"Voir",pageId:"incidents"}}),i>=1&&l.push({accent:"compliance",message:"NC ouvertes",recommendation:i>=3?`${i} ouvertes`:`${i} ouverte`,see:{label:"NC",pageId:"audits"},apply:{label:"Actions",pageId:"actions"}});const d=Number(t.incidents),u=Number(t.actions);return Number.isFinite(d)&&Number.isFinite(u)&&d===0&&u===0&&n===0&&i===0&&s===0&&l.length<On&&l.push({accent:"calm",message:"Sous contrôle",recommendation:"RAS sur les seuils",see:{label:"Incidents",pageId:"incidents"},apply:{label:"Audits",pageId:"audits"}}),l.slice(0,On)}function Ll(e,t,a){const r=document.createElement("div");r.className="dashboard-auto-analysis-item-acts";const n=(i,o)=>{const s=document.createElement("button");return s.type="button",s.className=`dashboard-auto-analysis-act ${o}`,s.textContent=i.label,s.addEventListener("click",()=>Bo(i.pageId)),s};t.pageId===a.pageId?r.append(n(t,"dashboard-auto-analysis-act--see")):(r.append(n(t,"dashboard-auto-analysis-act--see")),r.append(n(a,"dashboard-auto-analysis-act--apply"))),e.append(r)}function Il(){const e=document.createElement("article");e.className="content-card card-soft dashboard-auto-analysis-card";const t=document.createElement("div");t.className="dashboard-auto-analysis-strip";const a=document.createElement("span");a.className="dashboard-auto-analysis-strip-badge",a.textContent="À traiter";const r=document.createElement("p");r.className="dashboard-auto-analysis-strip-text",t.append(a,r);const n=document.createElement("div");n.className="dashboard-auto-analysis-host",e.append(t,n);function i(o){var c;(c=e.querySelector(".dashboard-auto-analysis-actions"))==null||c.remove();const s=ql(o||{});if(a.textContent=s.length?"Priorité":"Veille",a.classList.toggle("dashboard-auto-analysis-strip-badge--idle",!s.length),r.textContent=s.length===0?"Rien à trancher.":`${s.length} point${s.length>1?"s":""} max.`,n.replaceChildren(),s.length){const l=document.createElement("ul");l.className="dashboard-auto-analysis-list",s.forEach(({message:d,recommendation:u,see:p,apply:g,accent:m})=>{const b=document.createElement("li");b.className=`dashboard-auto-analysis-item dashboard-auto-analysis-item--accent-${m}`;const y=document.createElement("div");y.className="dashboard-auto-analysis-item-body";const v=document.createElement("p");v.className="dashboard-auto-analysis-msg dashboard-auto-analysis-msg--title",v.textContent=d;const h=document.createElement("p");h.className="dashboard-auto-analysis-rec dashboard-auto-analysis-rec--key",h.textContent=u,y.append(v,h),Ll(y,p,g),b.append(y),l.append(b)}),n.append(l)}else{const l=document.createElement("div");l.className="dashboard-auto-analysis-empty-block";const d=document.createElement("div");d.className="dashboard-auto-analysis-empty-icon",d.setAttribute("aria-hidden","true");const u=document.createElement("span");u.className="dashboard-auto-analysis-empty-check",u.textContent="✓",d.append(u);const p=document.createElement("div");p.className="dashboard-auto-analysis-empty-copy";const g=document.createElement("p");g.className="dashboard-auto-analysis-empty-lead",g.textContent="Seuils OK.",p.append(g),l.append(d,p),n.append(l)}if(!s.length){const l=document.createElement("div");l.className="dashboard-auto-analysis-actions";const d=Rt([{label:"Incidents",pageId:"incidents"},{label:"Audits",pageId:"audits"}],{className:"dashboard-block-actions dashboard-block-actions--tight"});d&&l.append(d),l.childNodes.length&&e.append(l)}}return{root:e,update:i}}function tr(e){if(!e)return"—";try{return new Date(e).toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"2-digit"})}catch{return"—"}}function Vr(e){const t=String((e==null?void 0:e.status)||"").toLowerCase();return t?!/(clos|ferm|done|termin|clôtur|résolu|resolu|complete)/i.test(t):!0}function Hn(e){const t=String(e||"").replace(/^#/,"");t&&(window.location.hash=t)}const ca=7;function Br(e){const t=String((e==null?void 0:e.status)||"").toLowerCase();return/retard|late|overdue|dépass|reprogram|échéance|à planifier|non réalis/i.test(t)}function Tl(e,t,a){const r=Array.isArray(e==null?void 0:e.criticalIncidents)?e.criticalIncidents.length:0,n=Array.isArray(e==null?void 0:e.overdueActionItems)?e.overdueActionItems.length:0,i=Array.isArray(t)?t.filter(Vr):[],o=Array.isArray(a)?a.filter(Br):[];return r+n+i.length+o.length}function Ml(e,t,a){const r=[];return(Array.isArray(e==null?void 0:e.criticalIncidents)?e.criticalIncidents:[]).forEach(l=>{r.length>=ca||r.push({kind:"urgent",title:`${l.ref||"Incident"} — ${l.type||"gravité élevée"}`,meta:[l.site,tr(l.createdAt)].filter(Boolean).join(" · ")||"À traiter sans délai",hash:"incidents"})}),(Array.isArray(e==null?void 0:e.overdueActionItems)?e.overdueActionItems:[]).forEach(l=>{if(r.length>=ca)return;const d=[];l.dueDate&&d.push(`Échéance ${tr(l.dueDate)}`),l.owner&&d.push(l.owner),r.push({kind:"delay",title:l.title||"Action en retard",meta:d.length?d.join(" · "):"Plan d’actions",hash:"actions"})}),(Array.isArray(t)?t.filter(Vr):[]).forEach(l=>{r.length>=ca||r.push({kind:"nc",title:l.title||"Non-conformité ouverte",meta:l.auditRef?`Lien audit ${l.auditRef}`:tr(l.createdAt),hash:"audits"})}),(Array.isArray(a)?a:[]).filter(Br).forEach(l=>{r.length>=ca||r.push({kind:"urgent",title:l.ref?`Audit ${l.ref} — à cadrer`:"Audit à finaliser",meta:[l.site,l.status].filter(Boolean).join(" · ").slice(0,72)||"Module Audits",hash:"audits"})}),r}function Pl(){const e=document.createElement("article");e.className="content-card card-soft dashboard-priority-now",e.setAttribute("aria-labelledby","dashboard-priority-now-title");const t=document.createElement("header");t.className="dashboard-priority-now__head",t.innerHTML=`
    <div>
      <span class="section-kicker dashboard-priority-now__kicker">Décision</span>
      <h2 id="dashboard-priority-now-title" class="dashboard-priority-now__title">À traiter immédiatement</h2>
      <p class="dashboard-priority-now__sub">File prioritaire : chaque ligne ouvre le module concerné. Les chiffres ci-dessous = totaux visibles (serveur + listes chargées).</p>
    </div>
  `;const a=document.createElement("div");a.className="dashboard-priority-now__summary",a.setAttribute("aria-label","Synthèse chiffrée");const r=document.createElement("div");r.className="dashboard-priority-now__list",r.setAttribute("role","list");const n=document.createElement("div");n.className="dashboard-priority-now__footer";const i=document.createElement("button");i.type="button",i.className="btn btn-primary dashboard-priority-now__cta",i.textContent="Voir les actions prioritaires",i.addEventListener("click",()=>Hn("actions")),n.append(i),e.append(t,a,r,n);function o(c,l,d){const u=document.createElement("div");u.className=`dashboard-priority-now__pill dashboard-priority-now__pill--${d}`;const p=document.createElement("span");p.className="dashboard-priority-now__pill-value",p.textContent=String(l);const g=document.createElement("span");return g.className="dashboard-priority-now__pill-label",g.textContent=c,u.append(p,g),u}function s({stats:c,ncs:l=[],audits:d=[]}){const u=Array.isArray(c==null?void 0:c.criticalIncidents)?c.criticalIncidents.length:0,p=Array.isArray(d)?d.filter(Br).length:0,g=u+p,m=Math.max(0,Number(c==null?void 0:c.overdueActions)||0),b=Array.isArray(l)?l.filter(Vr).length:0;a.replaceChildren(),a.append(o("Urgences",g,g>0?"urgent":"calm"),o("Actions en retard",m,m>0?"delay":"calm"),o("NC ouvertes",b,b>0?"nc":"calm"));const y=Tl(c,l,d);if(y>ca){const h=document.createElement("p");h.className="dashboard-priority-now__summary-more",h.textContent=`${y-ca} autre(s) non listé(s) ici — ouvrez incidents, actions ou audits.`,a.append(h)}r.replaceChildren();const v=Ml(c,l,d);if(!v.length){const h=document.createElement("p");h.className="dashboard-priority-now__empty",h.textContent="Rien d’imminent sur les listes chargées : consolidez le suivi courant et les échéances à venir.",r.append(h);return}v.forEach(h=>{const k=document.createElement("button");k.type="button",k.className=`dashboard-priority-now__row dashboard-priority-now__row--${h.kind}`,k.setAttribute("role","listitem");const _=document.createElement("span");_.className="dashboard-priority-now__chip",_.textContent=h.kind==="urgent"?"Urgence":h.kind==="delay"?"Retard":"NC";const f=document.createElement("span");f.className="dashboard-priority-now__main";const E=document.createElement("span");E.className="dashboard-priority-now__row-title",E.textContent=h.title;const w=document.createElement("span");w.className="dashboard-priority-now__row-meta",w.textContent=h.meta,f.append(E,w);const x=document.createElement("span");x.className="dashboard-priority-now__go",x.textContent="Ouvrir →",k.append(_,f,x),k.addEventListener("click",()=>Hn(h.hash)),r.append(k)})}return{root:e,update:s}}function ba(e={}){const{title:t,hint:a,nextStep:r}=e,n=document.createElement("aside");if(n.className="qhse-simple-guide",n.setAttribute("role","note"),n.setAttribute("aria-label","Guide — vue simplifiée"),t){const i=document.createElement("p");i.className="qhse-simple-guide__title",i.textContent=t,n.append(i)}if(a){const i=document.createElement("p");i.className="qhse-simple-guide__hint",i.textContent=a,n.append(i)}if(r){const i=document.createElement("p");i.className="qhse-simple-guide__next",i.textContent=r,n.append(i)}return n}const Rl=[{key:"incidents",label:"Incidents",note:"Total déclarés (périmètre)",tone:"amber"},{key:"ncOpen",label:"NC ouvertes",note:"Non clos — détail après chargement",tone:"amber"},{key:"actionsLate",label:"Actions en retard",note:"Total serveur",tone:"red"},{key:"actions",label:"Actions (total)",note:"En base sur le périmètre",tone:"blue"},{key:"auditScore",label:"Score moyen audits",note:"Moyenne sur audits récents",tone:"green"},{key:"auditsN",label:"Audits (liste)",note:"Nombre sur cette vue",tone:"blue"}];function Ua(e){return typeof e=="number"&&!Number.isNaN(e)?String(e):"—"}function Ut(e){const t=Number(e);return Number.isFinite(t)?t:0}function Dl(e){return e==null||typeof e!="object"||Array.isArray(e)?null:{incidents:Ut(e.incidents),actions:Ut(e.actions),overdueActions:Ut(e.overdueActions),nonConformities:Ut(e.nonConformities),criticalIncidents:Array.isArray(e.criticalIncidents)?e.criticalIncidents:[],overdueActionItems:Array.isArray(e.overdueActionItems)?e.overdueActionItems:[]}}function ar(e){const t=String((e==null?void 0:e.status)||"").toLowerCase();return t?!/(clos|ferm|done|termin|clôtur|résolu|resolu|complete)/i.test(t):!0}async function Wa(e){try{const t=await Se(_t(e));if(!t.ok)return null;const a=await t.json().catch(()=>null);return Array.isArray(a)?a:null}catch(t){return console.warn("[dashboard] fetchJsonList",e,t),null}}async function jl(e,{attempts:t=8,delayMs:a=350}={}){let r;for(let n=0;n<t;n++)try{return await Se(e)}catch(i){r=i,n<t-1&&await new Promise(o=>setTimeout(o,a))}throw r}function _a(e,t,a,r=""){const n=document.createElement("article");n.className=["content-card","card-soft","dashboard-chart-card","dashboard-chart-card-inner",r].filter(Boolean).join(" ");const i=document.createElement("div");i.className="content-card-head dashboard-chart-card-head";const o="";i.innerHTML=`
    <div>
      <div class="section-kicker">${e}</div>
      <h3 class="dashboard-chart-h">${t}</h3>
      ${o}
    </div>
  `;const s=document.createElement("div");return s.className="dashboard-chart-body",n.append(i,s),{card:n,body:s}}function Ht(e,t,a){const r=document.createElement("header");r.className="dashboard-section-head";const n=document.createElement("span");n.className="dashboard-section-kicker",n.textContent=e;const i=document.createElement("h2");if(i.className="dashboard-section-title",i.textContent=t,r.append(n,i),a){const o=document.createElement("p");o.className="dashboard-section-sub",o.textContent=a,r.append(o)}return r}function Ol(e){e.hidden=!1,e.replaceChildren();const t=Qt(),a=document.createElement("article");a.className="content-card card-soft dashboard-connectivity-card",a.setAttribute("role","alert"),a.setAttribute("aria-live","polite");const r=document.createElement("h3");r.className="dashboard-connectivity-title",r.textContent="Connexion au serveur impossible";const n=document.createElement("p");n.className="dashboard-connectivity-lead",n.textContent="Le tableau de bord a besoin du backend (API). Sans lui, les données ne peuvent pas s’afficher.";const i=document.createElement("p");i.className="dashboard-connectivity-api-label",i.textContent="URL API utilisée par l’application :";const o=document.createElement("code");o.className="dashboard-connectivity-code",o.textContent=t;const s=document.createElement("p");s.className="dashboard-connectivity-urlhint",s.textContent="Ouvrez l’application via http://localhost:5173 (terminal « vite » avec npm run dev). Ne pas ouvrir index.html en double-clic depuis l’explorateur.";const c=[];if(typeof window<"u"&&window.location.protocol==="file:"){const y=document.createElement("p");y.className="dashboard-connectivity-filewarn",y.textContent="Vous utilisez un fichier local (file://) : le navigateur ne peut pas joindre l’API. Ouvrez http://localhost:5173 dans la barre d’adresse.",c.push(y)}const l=document.createElement("div");l.className="dashboard-connectivity-actions";const d=document.createElement("button");d.type="button",d.className="btn btn-primary dashboard-connectivity-retry",d.textContent="Réessayer (recharger la page)",d.addEventListener("click",()=>{window.location.reload()}),l.append(d);const u=document.createElement("ol");u.className="dashboard-connectivity-steps";const p=document.createElement("li");p.textContent="Ouvrez un terminal dans le dossier qui contient le sous-dossier « qhse-africa-starter », puis : npm run dev (API + front) ou npm run dev:api. Si vous êtes déjà dans qhse-africa-starter : npm run dev --prefix backend.";const g=document.createElement("li");g.textContent="npm run dev --prefix backend ne marche que si le terminal est dans le dossier qhse-africa-starter (le backend est dans qhse-africa-starter/backend).";const m=document.createElement("li");m.textContent="Dans ce navigateur, testez http://127.0.0.1:3001/api/health — si ça ne s’affiche pas, un pare-feu ou l’aperçu intégré bloque l’accès : ouvrez l’app dans Chrome ou Edge (http://localhost:5173).";const b=document.createElement("li");b.textContent="Si l’API tourne ailleurs, définissez window.__QHSE_API_BASE__ avant le chargement de l’app (voir src/config.js).",u.append(p,g,m,b),a.append(r,n,i,o,s,...c,l,u),e.append(a)}function Fn(){Dt();const e=Ne.currentSite||"Tous sites";function t(){C("Export direction (PDF / Excel) : à brancher sur le SI — démo.","info")}const a=yc(e,{onExport:t}),r=document.createElement("section");r.className="page-stack dashboard-page",r.prepend(ba({title:"Vue du jour — l’essentiel en premier",hint:"Les urgences et retards sont regroupés sous « À faire maintenant », puis les raccourcis vers les modules.",nextStep:"Ensuite : ouvrez une ligne prioritaire ou passez en mode Expert pour les graphiques et l’activité détaillée."}));const n=document.createElement("div");n.className="dashboard-band dashboard-band--ceo",n.append(a.root);const i=document.createElement("div");i.className="dashboard-connectivity-slot",i.hidden=!0;const o=Qc(),s=document.createElement("section");s.className="dashboard-section";const c=Ec();s.append(Ht("Alertes","Signaux par criticité","Signaux faibles et tendances"),c.root);let l={criticalIncidents:[],overdueActionItems:[]},d=[];c.update({stats:l,ncs:[],audits:[]});const u=hl({onExportDirection:t,overdueCount:0,ncCount:0}),p=u.root,g=uc({sessionUser:Me(),incidents:0,overdueActionItems:l.overdueActionItems??[],criticalIncidents:l.criticalIncidents??[]}),m=Pl();m.update({stats:l,ncs:[],audits:[]});const b=document.createElement("div");b.className="dashboard-band dashboard-band--priority",b.append(m.root);const y=gl({data:l,incidents:[],actions:[],audits:[],ncs:[],sessionUser:Me()}),v=document.createElement("div");v.className="dashboard-band dashboard-band--cockpit",v.append(o.root,s);const h=document.createElement("div");h.className="dashboard-band dashboard-band--shortcuts",h.append(p);const k=document.createElement("div");k.className="dashboard-extended";const _=localStorage.getItem("dashboard-extended");k.dataset.expanded=_??"true";const f=document.createElement("div");f.className="dashboard-toggle-row";const E=document.createElement("button");E.type="button",E.className="dashboard-toggle-btn",E.innerHTML=`
  <span class="dashboard-toggle-label">Analyses & activité</span>
  <span class="dashboard-toggle-icon" aria-hidden="true">▾</span>
`,f.append(E);const w=localStorage.getItem("dashboard-extended")??"true",x=E.querySelector(".dashboard-toggle-icon");x&&(x.textContent=w==="true"?"▾":"▸"),E.addEventListener("click",()=>{const O=k.dataset.expanded==="true";k.dataset.expanded=O?"false":"true";const M=E.querySelector(".dashboard-toggle-icon");M&&(M.textContent=O?"▸":"▾"),localStorage.setItem("dashboard-extended",O?"false":"true")});const S=document.createElement("section");S.className="dashboard-section";const N=yl();S.append(Ht("Synthèse","État du système QHSE","Lecture direction — maîtrise et vigilance."),N.root),N.update({stats:l,incidents:[],actions:[],audits:[],ncs:[]});const L=document.createElement("section");L.className="dashboard-section";const D=zl();L.append(Ht("Veille","Points de vigilance",""),D.root),D.update({stats:l,incidents:[],actions:[],audits:[],ncs:[]});const q=document.createElement("div");q.className="dashboard-band dashboard-band--secondary",q.append(L);const W=document.createElement("section");W.className="dashboard-section";const K=Il();W.append(Ht("Pilotage","Décisions recommandées",null),K.root),K.update({stats:l,incidents:[],ncs:[]});const A=document.createElement("div");A.className="dashboard-band dashboard-band--analysis",A.append(W);const I={},z={},R=document.createElement("section");R.className="kpi-grid dashboard-kpi-grid",Rl.forEach(O=>{const M=document.createElement("article");M.className="metric-card card-soft dashboard-kpi-card";const U=document.createElement("div");U.className="metric-label",U.textContent=O.label;const J=document.createElement("div");J.className=`metric-value ${O.tone}`,J.textContent="—",I[O.key]=J;const te=document.createElement("div");te.className="metric-note",te.textContent=O.note,O.key==="ncOpen"&&(z.ncOpen=te),M.append(U,J,te),R.append(M)});const V=document.createElement("div");V.className="dashboard-kpi-sticky",V.append(R);const oe=document.createElement("p");oe.className="dashboard-kpi-priority-line dashboard-kpi-priority-line--ok",oe.textContent="";const ge=document.createElement("section");ge.className="dashboard-section";const B=Rt([{label:"Détail incidents",pageId:"incidents"},{label:"Détail actions",pageId:"actions"}],{className:"dashboard-block-actions dashboard-block-actions--tight"}),re=document.createElement("div");re.className="dashboard-kpi-foot",B&&re.append(B),ge.append(Ht("Vue d’ensemble","Indicateurs clés",null),V,oe,...B?[re]:[]);const se=document.createElement("section");se.className="dashboard-section dashboard-section--charts";const F=document.createElement("p");F.className="dashboard-charts-disclaimer",F.innerHTML="";const H=document.createElement("div");H.className="dashboard-charts-grid";const G=_a("Tendance","Incidents (6 mois)","","dashboard-chart-card--dash-trend");G.body.append(oa(ri([]),{lineTheme:"incidents"}));const X=_a("Actions","Statuts","","dashboard-chart-card--dash-mix");X.body.append(Sr({overdue:0,done:0,other:0}));const $=_a("Incidents","Types","","dashboard-chart-card--dash-types");$.body.append(Wt([]));const T=_a("Audits","Scores","","dashboard-chart-card--dash-audit"),j=Cr([]);T.body.append(oa(j,{lineTheme:"audits",ariaLabel:"Évolution des scores d’audit sur les derniers enregistrements chargés.",interpretText:Ar(j),valueTitle:O=>`${O.value} %`,footText:""}));const Y=_a("Charge","Critique · retards · NC","","dashboard-chart-card--dash-load");Y.body.append(ni({criticalIncidents:Array.isArray(l.criticalIncidents)?l.criticalIncidents.length:0,overdueActions:Ut(l.overdueActions),ncOpen:0})),H.append(G.card,$.card,X.card,T.card,Y.card);const ne=document.createElement("div");ne.className="dashboard-charts-global-actions";const ae=Rt([{label:"Voir les incidents",pageId:"incidents"},{label:"Ouvrir le plan d’actions",pageId:"actions"}],{className:"dashboard-block-actions dashboard-block-actions--tight"});ae&&ne.append(ae),se.append(Ht("Analyses","Graphiques",null),F,H,...ae?[ne]:[]);const de=document.createElement("div");de.className="dashboard-band dashboard-band--situation",de.append(S,ge);const he=document.createElement("div");he.className="dashboard-band dashboard-band--analysis",he.append(se);const fe=document.createElement("section");fe.className="dashboard-section";const _e=document.createElement("div");_e.className="dashboard-activity-wrap",_e.append(Tn({incidents:[],actions:[],audits:[]},{showHeader:!1})),fe.append(Ht("Suivi","Activité récente",""),_e);const Ee=document.createElement("div");Ee.className="dashboard-band dashboard-band--tertiary",Ee.append(fe),k.append(de,he,Ee),r.append(g,n,i,y.root,h,A,q,f,k,b,v),a.update({stats:l,ncs:[],audits:[],siteLabel:e}),o.update({stats:l,incidents:[],actions:[],audits:[],ncs:[]}),y.update({data:l,incidents:[],actions:[],audits:[],ncs:[],sessionUser:Me()}),m.update({stats:l,ncs:[],audits:[]});function ve(){const O=l||{},M=Array.isArray(O.criticalIncidents)?O.criticalIncidents.length:0,U=Ut(O.overdueActions),J=d.filter(ar).length,te=M+U+J;te===0?(oe.textContent="Aucun élément critique à traiter en priorité aujourd’hui.",oe.className="dashboard-kpi-priority-line dashboard-kpi-priority-line--ok"):(oe.textContent=`${te} élément${te>1?"s":""} critique${te>1?"s":""} à traiter aujourd’hui`,oe.className="dashboard-kpi-priority-line dashboard-kpi-priority-line--attention")}function Ae(O){I.incidents.textContent=Ua(O.incidents),I.actionsLate.textContent=Ua(O.overdueActions),I.actions.textContent=Ua(O.actions),ve()}function ze(O,M,U){if(Array.isArray(O)){const J=O.filter(ar).length;if(I.ncOpen.textContent=String(J),z.ncOpen){const te=U!=null&&Number.isFinite(Number(U))?`${Ua(Number(U))} NC au total (API)`:"total API indisponible";z.ncOpen.textContent=`${J} ouvertes · ${te}`}}if(M&&M.length){const J=M.map(te=>Number(te.score)).filter(te=>Number.isFinite(te));if(J.length){const te=Math.round(J.reduce((Z,le)=>Z+le,0)/J.length);I.auditScore.textContent=`${te}%`}else I.auditScore.textContent="—";I.auditsN.textContent=String(M.length)}else I.auditScore.textContent="—",I.auditsN.textContent="—"}function Pe(O,M,U,J){const te=O||[],Z=M||[],le=U||[],be=J||[];G.body.replaceChildren(oa(ri(te),{lineTheme:"incidents"})),X.body.replaceChildren(Sr(Uo(Z))),$.body.replaceChildren(Wt(Hr(te)));const ye=Cr(le);T.body.replaceChildren(oa(ye,{lineTheme:"audits",ariaLabel:"Évolution des scores d’audit sur les derniers enregistrements chargés.",interpretText:Ar(ye),valueTitle:me=>`${me.value} %`,footText:""}));const Ie=l||{},$e=be.filter(ar).length;d=be,ve(),Y.body.replaceChildren(ni({criticalIncidents:Array.isArray(Ie.criticalIncidents)?Ie.criticalIncidents.length:0,overdueActions:Ut(Ie.overdueActions),ncOpen:$e}))}function We(O,M,U){_e.replaceChildren(Tn({incidents:O||[],actions:M||[],audits:U||[]},{showHeader:!1}))}return ve(),(async function(){let M;try{M=await jl(_t("/api/dashboard/stats"))}catch(U){console.error("[dashboard] réseau GET /api/dashboard/stats",U),C("Impossible de joindre l’API (tableau de bord). Vérifiez que le serveur backend tourne (ex. port 3001).","warning"),Ol(i);return}try{if(M.status===401){C("Session expirée — reconnectez-vous.","warning");return}if(M.status===403){C("Accès au tableau de bord refusé pour ce profil.","warning");return}if(!M.ok){const qe=await M.json().catch(()=>({})),je=typeof qe.error=="string"&&qe.error.trim()?qe.error.trim():`Données dashboard indisponibles (${M.status}).`;C(je,"warning");return}const U=await M.json().catch(()=>null),J=Dl(U);if(!J){console.error("[dashboard] GET /api/dashboard/stats — corps invalide",U),C("Réponse tableau de bord illisible.","warning");return}i.hidden=!0,i.replaceChildren(),l=J,u.updateShortcutBadges({overdueCount:J.overdueActions??0,ncCount:J.nonConformities??0}),g.update({sessionUser:Me(),incidents:J.incidents,overdueActionItems:J.overdueActionItems,criticalIncidents:J.criticalIncidents}),Ae(J),c.update({stats:l,ncs:[],audits:[]}),N.update({stats:l,incidents:[],actions:[],audits:[],ncs:[]}),D.update({stats:l,incidents:[],actions:[],audits:[],ncs:[]}),K.update({stats:l,incidents:[],ncs:[]}),a.update({stats:l,ncs:[],audits:[],siteLabel:e}),o.update({stats:l,incidents:[],actions:[],audits:[],ncs:[]}),y.update({data:l,incidents:[],actions:[],audits:[],ncs:[],sessionUser:Me()}),m.update({stats:l,ncs:[],audits:[]});const te=await Promise.allSettled([Wa("/api/incidents?limit=500"),Wa("/api/actions?limit=320"),Wa("/api/audits?limit=80"),Wa("/api/nonconformities?limit=150")]),Z=qe=>{const je=te[qe];return je.status==="fulfilled"?je.value:(console.error(`[dashboard] liste ${qe}`,je.reason),null)},le=Z(0),be=Z(1),ye=Z(2),Ie=Z(3);te.some(qe=>qe.status==="rejected")&&C("Certaines listes n’ont pas pu être chargées — affichage partiel.","warning");const $e=le||[],me=be||[],De=ye||[],xe=Ie||[];Pe($e,me,De,xe),ze(xe,De,l.nonConformities),c.update({stats:l,ncs:xe,audits:De}),N.update({stats:l,incidents:$e,actions:me,audits:De,ncs:xe}),We($e,me,De),a.update({stats:l,ncs:xe,audits:De,siteLabel:e}),o.update({stats:l,incidents:$e,actions:me,audits:De,ncs:xe}),y.update({data:l,incidents:$e,actions:me,audits:De,ncs:xe,sessionUser:Me()}),m.update({stats:l,ncs:xe,audits:De}),D.update({stats:l,incidents:$e,actions:me,audits:De,ncs:xe}),K.update({stats:l,incidents:$e,ncs:xe})}catch(U){console.error("[dashboard] traitement après stats",(U==null?void 0:U.message)||U,U),C(`Erreur tableau de bord : ${U instanceof Error?U.message:String(U)} — voir la console (F12).`,"warning")}})(),r}const Vn=[{id:1,module:"incidents",action:"Incident créé",detail:"INC-203 enregistré sur le bassin nord",user:"Responsable HSE",timestamp:"Aujourd’hui · 09:10"},{id:2,module:"actions",action:"Action modifiée",detail:"Action corrective affectée à Maintenance",user:"Manager site",timestamp:"Aujourd’hui · 08:40"}],Be={all(){return[...Vn].reverse()},add(e){Vn.push({id:Date.now(),timestamp:"À l’instant",...e})}},Bn={faible:"Faible",moyen:"Moyen",critique:"Critique"};function Hl(e="moyen"){const t=document.createElement("div");t.className="severity-segment",t.style.display="flex",t.style.gap="8px",t.style.flexWrap="wrap";let a=e;const r=[];["faible","moyen","critique"].forEach(i=>{const o=document.createElement("button");o.type="button",o.className="btn",o.textContent=Bn[i],o.dataset.severity=i,o.style.minHeight="52px",o.style.flex="1 1 90px",o.style.fontSize="15px",o.style.fontWeight="800",o.addEventListener("click",()=>{a=i,n()}),r.push(o),t.append(o)});function n(){r.forEach(i=>{const o=i.dataset.severity===a;i.classList.toggle("btn-primary",o)})}return n(),{element:t,getValue:()=>a,setValue:i=>{Bn[i]&&(a=i,n())}}}async function pi(){const e=await Se("/api/users");if(!e.ok)throw new Error(`GET /api/users ${e.status}`);const t=await e.json();return Array.isArray(t)?t:[]}const Gr="qhseImportDraftV1";function Gn(e){try{sessionStorage.setItem(Gr,JSON.stringify({v:1,savedAt:Date.now(),...e}))}catch(t){console.warn("[importDraft] save",t)}}function Ur(){try{const e=sessionStorage.getItem(Gr);if(!e)return null;const t=JSON.parse(e);return typeof t=="object"&&t?t:null}catch{return null}}function oi(){try{sessionStorage.removeItem(Gr)}catch{}}const Jo=[{title:"Renversement d’engin en pente",detail:"Zone de manutention — signalisation et stabilité des sols à revoir ; plan de manœuvre à formaliser.",causes:"Pente non balisée ; sol meuble après pluie ; manœuvres simultanées.",impacts:"Blessures graves, arrêt chantier, atteinte matériel et image.",status:"Critique",tone:"red",meta:"G5 × P4",responsible:"Chef de chantier",actionLinked:{ref:"ACT-204",status:"En cours",due:"18/04/2026",owner:"Maintenance"},pilotageState:"actif",updatedAt:"2026-04-02",trend:"up"},{title:"Pollution ponctuelle par hydrocarbures",detail:"Zone stockage — rétention incomplète ; contrôle des absorbants et registre des déchets.",causes:"Rétention non conforme ; stockage temporaire prolongé ; contrôles espacés.",impacts:"Pollution sols / eaux, sanctions, coûts de traitement.",status:"Très élevé",tone:"amber",meta:"G4 × P3",responsible:"Resp. environnement",actionLinked:{ref:"ACT-198",status:"Retard",due:"28/03/2026",owner:"Atelier"},pilotageState:"derive",updatedAt:"2026-03-28",trend:"up"},{title:"Exposition bruit opérateurs",detail:"Poste bruyant — EPI disponibles ; campagne de mesures et formation à planifier.",causes:"Postes non insonorisés ; rotations courtes ; affichage insuffisant.",impacts:"Troubles auditifs, plaintes, non-conformité réglementaire.",status:"Élevé",tone:"amber",meta:"G3 × P3",responsible:"Resp. HSE site",actionLinked:{ref:"ACT-201",status:"Planifié",due:"30/04/2026",owner:"HSE"},pilotageState:"actif",updatedAt:"2026-03-20",trend:"stable"},{title:"Dérapage procédure contrôle qualité",detail:"Ligne de conditionnement — non-conformité mineure détectée ; revue du mode opératoire.",causes:"Mode opératoire obsolète ; formation partielle ; surcharge de ligne.",impacts:"Lots non conformes, retouches, perte client ponctuelle.",status:"Élevé",tone:"amber",meta:"G2 × P4",responsible:"Resp. qualité",actionLinked:{ref:"ACT-188",status:"Clôturé",due:"—",owner:"Qualité"},pilotageState:"traite",updatedAt:"2026-01-10",trend:"down"},{title:"Manque de ressources EPI saison hiver",detail:"Saison pluie — stocks limités sur antenne nord ; besoin de réassort anticipé.",causes:"Prévision logistique insuffisante ; pics d’activité non anticipés.",impacts:"Port partiel des EPI, exposition accrue, risque psychosocial.",status:"Modéré",tone:"blue",meta:"G2 × P2",responsible:"Magasinier",actionLinked:null,pilotageState:"actif",updatedAt:"2026-03-15",trend:"stable"}],$r="qhse-custom-risk-titles";function Fl(e){const t=String(e||"").trim();if(!t)return;let a=[];try{a=JSON.parse(sessionStorage.getItem($r)||"[]"),Array.isArray(a)||(a=[])}catch{a=[]}const r=[t,...a.filter(n=>n!==t)];sessionStorage.setItem($r,JSON.stringify(r.slice(0,50)))}function Vl(){const e=Jo.map(n=>n.title).filter(Boolean);let t=[];try{t=JSON.parse(sessionStorage.getItem($r)||"[]"),Array.isArray(t)||(t=[])}catch{t=[]}const a=new Set,r=[];for(const n of[...e,...t])n&&!a.has(n)&&(a.add(n),r.push(n));return r}function Bl(e){return`[Risque lié: ${String(e).trim()}]`}function Un(e){return String(e||"").trim().replace(/\s+/g," ")}const Wn=/\[Risque lié:\s*([^\]]+?)\]/gi;function Gl(e,t){const a=Un(t);if(!a||typeof e!="string")return!1;Wn.lastIndex=0;let r;for(;(r=Wn.exec(e))!==null;)if(Un(r[1])===a)return!0;return!1}function Ul(e,t){return(Array.isArray(e)?e:[]).filter(a=>Gl(a==null?void 0:a.description,t)).map(a=>({ref:a.ref||"—",type:a.type||"—",status:a.status||"—",date:a.createdAt?new Date(a.createdAt).toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric"}):"—"}))}const ir=["Quasi-accident","Accident","Environnement","Engin / circulation","Autre"],rr=["Nouveau","En cours","Investigation","Clôturé"],Yn="qhse-incidents-states-styles";function Wl(){if(document.getElementById(Yn))return;const e=document.createElement("style");e.id=Yn,e.textContent=`
.incidents-skeleton{
  display:flex;flex-direction:column;gap:8px;padding:2px 0;
}
.skeleton-card{
  padding:12px 14px;border-radius:10px;
  border:1px solid rgba(255,255,255,.055);
  background:rgba(255,255,255,.018);
}
.skeleton-line{
  border-radius:3px;
  background:rgba(255,255,255,.065);
  animation:skeletonPulse 1.5s ease-in-out infinite;
}
.skeleton-line--title{height:11px;width:52%;margin-bottom:8px;}
.skeleton-line--sub{height:10px;width:78%;margin-bottom:6px;}
.skeleton-line--meta{height:9px;width:34%;}
@keyframes skeletonPulse{
  0%,100%{opacity:.5}50%{opacity:1}
}
.incidents-list-host .incidents-empty{
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  gap:8px;padding:36px 20px;text-align:center;
}
.incidents-list-host .incidents-empty__title{
  margin:0;font-size:15px;font-weight:600;
  color:var(--text,rgba(255,255,255,.88));
}
.incidents-list-host .incidents-empty__sub{
  margin:0;font-size:13px;line-height:1.5;
  color:var(--text2,rgba(255,255,255,.5));
  max-width:34ch;
}
.incidents-list-host .incidents-empty__cta{margin-top:6px;}
`,document.head.append(e)}const Qn="qhse-incidents-slideover";function Yl(){if(document.getElementById(Qn))return;const e=document.createElement("style");e.id=Qn,e.textContent=`
.inc-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.6);
  z-index: 200;
  opacity: 0;
  pointer-events: none;
  transition: opacity 200ms ease;
}
.inc-overlay--open {
  opacity: 1;
  pointer-events: all;
}
.inc-slideover {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(440px, 100vw);
  background: var(--bg, #0f172a);
  border-left: 1px solid rgba(255,255,255,.09);
  z-index: 201;
  transform: translateX(100%);
  transition: transform 220ms ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.inc-slideover--open {
  transform: translateX(0);
}
.inc-slideover__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(255,255,255,.065);
  flex-shrink: 0;
}
.inc-slideover__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text, rgba(255,255,255,.9));
}
.inc-slideover__close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 0.5px solid rgba(255,255,255,.1);
  background: transparent;
  color: var(--text2, rgba(255,255,255,.5));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms;
}
.inc-slideover__close:hover {
  background: rgba(255,255,255,.07);
  color: var(--text, rgba(255,255,255,.88));
}
.inc-slideover__body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 18px 20px;
}
`,document.head.append(e)}let Fe=[];function Ql(e){return String(e??"").trim().toUpperCase()}function Ko(e){const t=String(e).toLowerCase();return t.includes("critique")?"critique":t.includes("faible")?"faible":"moyen"}function Jl(e){if(!e)return Jn();try{return new Date(e).toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric"})}catch{return Jn()}}function Kl(e){if(!e||typeof e!="string")return"";const[t,a,r]=e.split("-");return!t||!a||!r?e:`${r}/${a}/${t}`}function Xl(e){const t=(e.description||"").trim();if(t){const a=t.split(/\r?\n/)[0].trim();return a.length>76?`${a.slice(0,73)}…`:a}return`${e.type} · ${e.site}`}function nr(e){if(!e||typeof e!="object"||!e.ref)return null;const t=e.createdAt?new Date(e.createdAt).getTime():Date.now(),a=Ko(e.severity);return{ref:e.ref,type:e.type,site:e.site,severity:a,status:e.status??"Nouveau",date:Jl(e.createdAt),createdAt:e.createdAt??null,createdAtMs:t,description:typeof e.description=="string"?e.description:""}}function or(e){return{...e,title:Xl(e)}}function Zl(e){const t=e.map(r=>{const n=/^INC-(\d+)$/i.exec(r.ref);return n?parseInt(n[1],10):0});return`INC-${(t.length?Math.max(...t):200)+1}`}function Jn(){return new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric"})}function Xo(e){return e==="faible"?"ds-badge--ok":e==="critique"?"ds-badge--danger":"ds-badge--warn"}function Kn(e){return e==="critique"?0:e==="moyen"?1:e==="faible"?2:3}function ed(e){return[...e].sort((t,a)=>{const r=Kn(t.severity),n=Kn(a.severity);return r!==n?r-n:(a.createdAtMs||0)-(t.createdAtMs||0)})}function td(e){const t=String(e||"").trim(),a=new Set(rr);return t&&!a.has(t)?[t,...rr]:[...rr]}function Pa(e){return/clos|ferm|termin|clôtur|résolu|resolu|done|complete/i.test(String(e))}function ad(e){return e.filter(t=>!Pa(t.status)).length}function id(e){return e.filter(t=>t.severity==="critique"&&!Pa(t.status)).length}async function rd(e){const t=String(e||"").trim().toUpperCase();if(!t)return[];try{const a=await Se(_t("/api/actions?limit=400"));if(!a.ok)return[];const r=await a.json();return Array.isArray(r)?r.filter(n=>{const i=String(n.title||"").toUpperCase(),o=String(n.detail||"").toUpperCase();return i.includes(t)||o.includes(t)}):[]}catch{return[]}}function nd(e){if(!e.length)return"";const t={};for(const l of e){const d=l.site||"—";t[d]=(t[d]||0)+1}const r=Object.entries(t).sort((l,d)=>d[1]-l[1])[0];if(!r)return"";const[n,i]=r,o=e.length;if(i>=2&&o>=4&&i/o>=.35)return`Fort volume sur le site « ${n} » (${i} incidents) — prioriser la veille terrain.`;const s=Date.now()-7*864e5,c=e.filter(l=>(l.createdAtMs||0)>=s).length;return c>=3?`${c} incident(s) sur les 7 derniers jours — rythme à surveiller.`:""}function od(e,t){const a=Math.max(1,Number(t)||7),r=Date.now()-a*864e5;return e.filter(n=>(n.createdAtMs||0)>=r).length}function sd(e){const t=e.filter(r=>!Pa(r.status));if(!t.length)return null;const a=t.reduce((r,n)=>{const i=n.createdAtMs||Date.now();return r+(Date.now()-i)/864e5},0);return Math.round(a/t.length*10)/10}function cd(e){const t=String(e.type||"");return/accident/i.test(t)&&!/quasi/i.test(t)?"Scénario accidentel : vérifier conditions de poste, EPI et consignes appliquées.":/quasi/i.test(t)?"Near-miss : dérive comportementale ou situation non maîtrisée — creuser avant reproduction.":/environnement/i.test(t)?"Facteur environnement / matière : contrôler stockage, déchets, rejets ou conditions météo.":/engin|circulation/i.test(t)?"Cohabitation engins / piétons ou circulation : signalisation, vitesse, zones de croisement.":"Cause à affiner après retour terrain et recoupement des témoins."}function ld(e){return e.severity==="critique"?"Sécuriser la zone, prévenir la hiérarchie, consigner les faits et lancer une action corrective immédiate.":e.severity==="moyen"?"Analyse rapide en équipe, contrôle des barrières existantes et plan de suivi sous 48 h.":"Point sécurité en début de poste et vérification des mesures préventives habituelles."}function dd(e){let t=0,a=0,r=0;return e.forEach(n=>{n.severity==="critique"?t+=1:n.severity==="faible"?r+=1:a+=1}),[{type:"Critique",count:t},{type:"Moyen",count:a},{type:"Faible",count:r}]}function pd(e){const t=new Map;return Hr(e,12).forEach(({type:a,count:r})=>{const n=a==="Accident"?"Comportement / geste":a==="Quasi-accident"?"Near-miss / vigilance":a==="Environnement"?"Environnement / matière":a==="Engin / circulation"?"Circulation / engins":"Autres facteurs";t.set(n,(t.get(n)||0)+r)}),[...t.entries()].map(([a,r])=>({type:a,count:r})).sort((a,r)=>r.count-a.count).slice(0,5)}let Mt=null;async function Zo(){if(Mt)return Mt;try{Mt=await pi()}catch(e){console.warn("[incidents] fetchUsers",e),Mt=[]}return Mt}async function Xn(e){var i;await Zo();const t=Mt==null?void 0:Mt.find(o=>Ql(o.role)==="QHSE"),a=[`Incident ${e.ref}`,`${e.type} · ${e.site}`,e.severity?`Gravité : ${e.severity}`:"",e.description?e.description.slice(0,400):""].filter(Boolean),r={title:`Suite incident ${e.ref}`,detail:a.join(" — "),status:"À lancer",owner:"Responsable QHSE"};t&&(r.assigneeId=t.id,r.owner=t.name),Ne.activeSiteId&&(r.siteId=Ne.activeSiteId);const n=await Se("/api/actions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(r)});if(!n.ok){try{const o=await n.json();console.error("[incidents] POST action liée",n.status,o)}catch{console.error("[incidents] POST action liée",n.status)}C("Impossible de créer l’action","error");return}C(`Action créée — liée à ${e.ref}`,"info"),Be.add({module:"incidents",action:"Création action liée",detail:`Depuis incident ${e.ref}`,user:((i=Me())==null?void 0:i.name)||"Responsable QHSE"})}function ud(e,t){const{onSelect:a,onDetail:r,onCreateAction:n,canWriteActions:i}=t,o=document.createElement("tr");o.className="incidents-table-row",o.dataset.severity=e.severity,o.dataset.ref=e.ref,o.tabIndex=0,e.severity==="critique"&&o.classList.add("incidents-table-row--critique");const s=document.createElement("td");s.className="incidents-table-cell incidents-table-cell--title";const c=document.createElement("div");c.className="incidents-table-title",c.textContent=e.title;const l=document.createElement("div");l.className="incidents-table-ref",l.textContent=e.ref,s.append(c,l);const d=document.createElement("td");d.className="incidents-table-cell";const u=document.createElement("span");u.className=`ds-badge ${Xo(e.severity)}`,u.textContent=e.severity.charAt(0).toUpperCase()+e.severity.slice(1),d.append(u);const p=document.createElement("td");p.className="incidents-table-cell";const g=document.createElement("span");g.className=`ds-badge ${Pa(e.status)?"ds-badge--ok":"ds-badge--info"}`,g.textContent=e.status,p.append(g);const m=document.createElement("td");m.className="incidents-table-cell incidents-table-cell--num",m.textContent=e.date;const b=document.createElement("td");b.className="incidents-table-cell",b.textContent=e.site;const y=document.createElement("td");y.className="incidents-table-cell incidents-table-cell--acts";const v=document.createElement("button");v.type="button",v.className="btn btn-secondary incidents-table-btn",v.textContent="Voir",v.addEventListener("click",_=>{_.stopPropagation(),r(e)});const h=document.createElement("button");h.type="button",h.className="btn btn-primary incidents-table-btn",h.textContent="Traiter",h.hidden=!i,h.addEventListener("click",_=>{_.stopPropagation(),n(e)}),y.append(v,h),o.append(s,d,p,m,b,y);function k(){a(e)}return o.addEventListener("click",k),o.addEventListener("keydown",_=>{(_.key==="Enter"||_.key===" ")&&(_.preventDefault(),k())}),o}function md(e){var pn,un,mn,gn,bn;Dt(),Fe=[];const t=document.createElement("section");t.className="page-stack incidents-page incidents-page--premium";let a="all",r="all",n="",i="",o="";function s(){Tt()}let c=null;const l=Ne.currentSite||"Tous sites",d=document.createElement("header");d.className="incidents-page-header";const u=document.createElement("div");u.className="incidents-page-header__main";const p=document.createElement("div");p.className="incidents-page-header__titles";const g=ga.incidents??{kicker:"Opérations",title:"Incidents terrain",subtitle:"Suivi des événements, investigations et plans de correction."},m=document.createElement("div");m.className="section-kicker incidents-page-header__kicker",m.textContent=`${g.kicker} · ${l}`;const b=document.createElement("h1");b.className="incidents-page-header__title",b.textContent=g.title;const y=document.createElement("p");y.className="incidents-page-header__subtitle",y.textContent=g.subtitle,p.append(m,b,y);const v=document.createElement("div");v.className="incidents-page-header__stats incidents-synth";function h(Q,P="",ee=""){const pe=document.createElement("div");pe.className=`incidents-synth-tile ${P}`.trim(),ee&&(pe.title=ee);const we=document.createElement("div");we.className="incidents-synth-tile__label",we.textContent=Q;const Ge=document.createElement("div");return Ge.className="incidents-synth-tile__value",Ge.textContent="—",pe.append(we,Ge),{box:pe,val:Ge}}const k=h("Incidents ouverts","","Fiches dont le statut n’est pas clos / terminé"),_=h("Critiques ouverts","incidents-synth-tile--alert","Gravité critique et statut encore ouvert"),f=h("Récents (7 j.)","","Nouvelles déclarations sur les 7 derniers jours"),E=h("Âge moyen ouverts (j)","","Ancienneté moyenne des dossiers ouverts — sans date de clôture en base");v.append(k.box,_.box,f.box,E.box),u.append(p,v);const w=document.createElement("div");w.className="incidents-page-header__actions";const x=document.createElement("button");x.type="button",x.className="btn btn-primary incidents-page-header__cta",x.textContent="+ Déclarer un incident";const S=document.createElement("button");S.type="button",S.className="incidents-page-header__linkish",S.textContent="Tableau de bord",S.addEventListener("click",()=>{window.location.hash="dashboard"}),w.append(x,S),d.append(u,w);const N=document.createElement("div");N.className="incidents-insight",N.setAttribute("role","status"),N.hidden=!0;function L(Q){return Q.filter(P=>{if(n&&P.severity!==n||i&&String(P.status||"").trim()!==i||o&&String(P.site||"").trim()!==o)return!1;if(a==="all")return!0;const ee=String(P.status).toLowerCase();return a==="nouveau"?ee.includes("nouveau")||ee.includes("new"):a==="clos"?Pa(ee):!0})}function D(){let Q=L(Fe);if(r!=="all"){const P=parseInt(r,10),ee=Date.now()-P*864e5;Q=Q.filter(pe=>{const we=pe.createdAtMs;return Number.isFinite(we)&&we>=ee})}return ed(Q)}function q(){if(nt==="loading"||nt==="error"){_.val.textContent="—",k.val.textContent="—",f.val.textContent="—",E.val.textContent="—",N.hidden=!0;return}k.val.textContent=String(ad(Fe)),_.val.textContent=String(id(Fe)),f.val.textContent=String(od(Fe,7));const P=sd(Fe);E.val.textContent=P!=null?String(P):"—";const ee=nd(Fe);ee?(N.textContent=ee,N.hidden=!1):N.hidden=!0}const W=document.createElement("div");W.className="incidents-compact-filters";const K=document.createElement("div");K.className="incidents-compact-filters__grid";const A=document.createElement("label"),I=document.createElement("span");I.textContent="Vue statut";const z=document.createElement("select");z.className="control-select",[["all","Tous"],["nouveau","Nouveau"],["clos","Clos / terminé"]].forEach(([Q,P])=>{const ee=document.createElement("option");ee.value=Q,ee.textContent=P,z.append(ee)}),z.addEventListener("change",()=>{a=z.value,Tt()}),A.append(I,z);const R=document.createElement("label"),V=document.createElement("span");V.textContent="Période";const oe=document.createElement("select");oe.className="control-select",[["all","Toutes"],["7","7 derniers jours"],["30","30 derniers jours"]].forEach(([Q,P])=>{const ee=document.createElement("option");ee.value=Q,ee.textContent=P,oe.append(ee)}),oe.addEventListener("change",()=>{r=oe.value,Tt()}),R.append(V,oe);const ge=document.createElement("label"),B=document.createElement("span");B.textContent="Gravité";const re=document.createElement("select");re.className="control-select incidents-filter-severity",[["","Toutes gravités"],["critique","Critique"],["moyen","Moyen"],["faible","Faible"]].forEach(([Q,P])=>{const ee=document.createElement("option");ee.value=Q,ee.textContent=P,re.append(ee)}),re.addEventListener("change",()=>{n=re.value,s()}),ge.append(B,re);const se=document.createElement("label"),F=document.createElement("span");F.textContent="Statut";const H=document.createElement("select");H.className="control-select incidents-filter-status",[["","Tous statuts"],["Nouveau","Nouveau"],["En cours","En cours"],["Investigation","Investigation"],["Clôturé","Clôturé"]].forEach(([Q,P])=>{const ee=document.createElement("option");ee.value=Q,ee.textContent=P,H.append(ee)}),H.addEventListener("change",()=>{i=H.value,s()}),se.append(F,H);const G=document.createElement("label"),X=document.createElement("span");X.textContent="Site";const $=document.createElement("select");$.className="control-select incidents-filter-site";const T=document.createElement("option");T.value="",T.textContent="Tous les sites",$.append(T),$.addEventListener("change",()=>{o=$.value,s()}),G.append(X,$);const j=document.createElement("div");j.className="incidents-compact-filters__chunk",j.setAttribute("aria-label","Vues rapides"),j.append(A,R);const Y=document.createElement("div");Y.className="incidents-compact-filters__chunk incidents-compact-filters__chunk--refine",Y.setAttribute("aria-label","Filtres précis"),Y.append(ge,se,G),K.append(j,Y),W.append(K);const ne=document.createElement("article");ne.id="incidents-declare",ne.className="content-card card-soft incidents-form-card incidents-premium-card incidents-declare-card";const ae=document.createElement("div");ae.className="content-card-head",ae.innerHTML=`
      <div>
        <div class="section-kicker">Terrain</div>
        <h3>Déclaration express</h3>
        <p class="incidents-form-lead">
          5 étapes courtes — une seule question visible à la fois. Validation finale requise avant envoi API.
        </p>
        <p class="incidents-form-api-hint" title="URL technique pour support / intégration">
          API : <code>${Qt()}</code>
        </p>
      </div>`;const de=document.createElement("div");de.className="incidents-rapid-wizard";const he=document.createElement("div");he.className="incidents-rapid-wizard__step-label";const fe=document.createElement("div");fe.className="incidents-rapid-dots";for(let Q=0;Q<5;Q+=1){const P=document.createElement("span");P.className="incidents-rapid-dot",P.dataset.idx=String(Q),fe.append(P)}de.append(he,fe);const _e=["Type d’incident","Gravité perçue","Description courte","Photo (optionnel)","Site & localisation"],Ee=document.createElement("div");Ee.className="incidents-rapid-pane",Ee.dataset.pane="0";const ve=document.createElement("p");ve.className="incidents-rapid-q",ve.textContent="Quel type d’événement ?";const Ae=document.createElement("div");Ae.className="incidents-rapid-type-chips";const ze=document.createElement("select");ze.className="control-select incident-field-type incidents-sr-only",ze.setAttribute("aria-hidden","true"),ze.tabIndex=-1;const Pe=document.createElement("option");Pe.value="",Pe.textContent="—",ze.append(Pe),ir.forEach(Q=>{const P=document.createElement("option");P.value=Q,P.textContent=Q,ze.append(P)});const We=new Map;ir.forEach(Q=>{const P=document.createElement("button");P.type="button",P.className="incidents-rapid-chip",P.textContent=Q,P.addEventListener("click",()=>{ze.value=Q,We.forEach((ee,pe)=>{ee.classList.toggle("incidents-rapid-chip--on",pe===Q)}),ha()}),We.set(Q,P),Ae.append(P)}),Ee.append(ve,Ae,ze);const O=document.createElement("div");O.className="incidents-rapid-pane",O.dataset.pane="1",O.hidden=!0;const M=document.createElement("p");M.className="incidents-rapid-q",M.textContent="Quelle gravité ?";const U=document.createElement("div");U.className="incident-severity-mount",O.append(M,U);const J=document.createElement("div");J.className="incidents-rapid-pane",J.dataset.pane="2",J.hidden=!0;const te=document.createElement("p");te.className="incidents-rapid-q",te.textContent="Que s’est-il passé ? (2–3 phrases max)";const Z=document.createElement("textarea");Z.className="control-input incidents-field-desc incident-field-desc",Z.maxLength=2e3,Z.rows=3,Z.placeholder="Faits, lieu immédiat, conséquences visibles…",Z.autocomplete="off",J.append(te,Z);const le=document.createElement("div");le.className="incidents-rapid-pane",le.dataset.pane="3",le.hidden=!0;const be=document.createElement("p");be.className="incidents-rapid-q",be.textContent="Ajouter une photo ?";const ye=document.createElement("input");ye.type="file",ye.accept="image/*",ye.className="incidents-rapid-photo-input";const Ie=document.createElement("p");Ie.className="incidents-form-lead incidents-rapid-photo-note",Ie.textContent="Le serveur ne stocke pas encore les médias : une mention « photo signalée » sera ajoutée au texte. Pour archivage réel, branchez un endpoint fichiers.";const $e=document.createElement("div");$e.className="incidents-rapid-photo-preview",ye.addEventListener("change",()=>{var pe;$e.replaceChildren();const Q=(pe=ye.files)==null?void 0:pe[0];if(!Q||!Q.type.startsWith("image/"))return;const P=URL.createObjectURL(Q),ee=document.createElement("img");ee.src=P,ee.alt="Aperçu",ee.className="incidents-rapid-photo-preview__img",$e.append(ee)}),le.append(be,ye,Ie,$e);const me=document.createElement("div");me.className="incidents-rapid-pane",me.dataset.pane="4",me.hidden=!0;const De=document.createElement("p");De.className="incidents-rapid-q",De.textContent="Où cela s’est-il produit ?";const xe=document.createElement("select");xe.className="control-select incident-field-site";const qe=document.createElement("input");qe.type="text",qe.className="control-input incidents-rapid-loc",qe.placeholder="Zone, atelier, ligne, poste…";const je=document.createElement("input");je.type="date",je.className="control-input incidents-field-date incident-field-date";try{je.valueAsDate=new Date}catch{}const at=document.createElement("div");at.className="incidents-rapid-geo-row";const dt=document.createElement("button");dt.type="button",dt.className="btn btn-secondary",dt.textContent="Remplir par GPS",dt.addEventListener("click",()=>{if(!navigator.geolocation){C("Géolocalisation non disponible","warning");return}navigator.geolocation.getCurrentPosition(Q=>{const{latitude:P,longitude:ee}=Q.coords;qe.value=`${P.toFixed(5)}, ${ee.toFixed(5)}`,C("Coordonnées insérées","info")},()=>C("Position refusée ou indisponible","warning"),{enableHighAccuracy:!0,timeout:12e3})}),at.append(dt);const Et=document.createElement("label");Et.className="incidents-rapid-date-field";const Lt=document.createElement("span");Lt.textContent="Date des faits",Et.append(Lt,je);const Nt=document.createElement("label");Nt.className="incidents-rapid-risk-field";const St=document.createElement("span");St.className="incidents-rapid-risk-field__label",St.textContent="Associer à un risque du registre (optionnel)";const bt=document.createElement("select");bt.className="control-select incidents-risk-link-select",bt.setAttribute("aria-label","Risque QHSE lié");const ie=document.createElement("option");ie.value="",ie.textContent="— Aucun —",bt.append(ie);function ce(){bt.querySelectorAll('option:not([value=""])').forEach(Q=>Q.remove()),Vl().forEach(Q=>{const P=document.createElement("option");P.value=Q,P.textContent=Q.length>64?`${Q.slice(0,61)}…`:Q,bt.append(P)})}ce();const ue=document.createElement("p");ue.className="incidents-rapid-risk-field__hint",ue.textContent="Enregistré dans la description sous forme de repère texte — même logique que le module Risques pour retrouver les incidents liés.",Nt.append(St,bt,ue),me.append(De,xe,qe,Et,Nt,at);const Oe=document.createElement("div");Oe.className="incidents-rapid-nav";const Ue=document.createElement("button");Ue.type="button",Ue.className="btn btn-secondary",Ue.textContent="Retour";const Te=document.createElement("button");Te.type="button",Te.className="btn btn-primary",Te.textContent="Continuer";const He=document.createElement("button");He.type="button",He.className="btn btn-primary incidents-submit incident-submit",He.textContent="Enregistrer l’incident",Oe.append(Ue,Te,He),de.append(Ee,O,J,le,me,Oe),ne.append(ae,de);const et=[Ee,O,J,le,me];let rt=0;function ja(Q){rt=Math.max(0,Math.min(4,Q)),et.forEach((P,ee)=>{P.hidden=ee!==rt}),fe.querySelectorAll(".incidents-rapid-dot").forEach((P,ee)=>{P.classList.toggle("incidents-rapid-dot--on",ee===rt),P.classList.toggle("incidents-rapid-dot--done",ee<rt)}),he.textContent=`Étape ${rt+1} / 5 — ${_e[rt]}`,Ue.hidden=rt===0,Te.hidden=rt===4,He.hidden=rt!==4,ha()}function ha(){rt===0?Te.disabled=!ze.value.trim():rt===4?(Te.disabled=!1,He.disabled=!xe.value.trim()):Te.disabled=!1}ze.addEventListener("change",ha),xe.addEventListener("change",ha),Ue.addEventListener("click",()=>ja(rt-1)),Te.addEventListener("click",()=>ja(rt+1));const Oa=Hl("moyen");U.append(Oa.element),ja(0);async function nn(){xe.innerHTML="";const Q=new Set;try{(await di()).forEach(pe=>{if(!(pe!=null&&pe.name))return;const we=document.createElement("option");we.value=pe.name,we.textContent=pe.code?`${pe.name} (${pe.code})`:pe.name,we.dataset.siteId=pe.id,xe.append(we),Q.add(pe.name)})}catch{}if(na.forEach(ee=>{if(Q.has(ee))return;const pe=document.createElement("option");pe.value=ee,pe.textContent=ee,xe.append(pe)}),Ne.activeSiteId){const ee=[...xe.options].find(pe=>pe.dataset.siteId===Ne.activeSiteId);if(ee){xe.value=ee.value;return}}const P=Ne.currentSite;P&&na.includes(P)||[...xe.options].some(ee=>ee.value===P)?xe.value=P:xe.options.length&&(xe.selectedIndex=0)}function $s(){const Q=Ur();if(!Q||Q.targetPageId!=="incidents"||!Q.prefillData)return;const P=Q.prefillData;if(P.type&&ir.includes(P.type)&&(ze.value=P.type,We.forEach((we,Ge)=>{we.classList.toggle("incidents-rapid-chip--on",Ge===P.type)})),P.site&&typeof P.site=="string"){const we=P.site.trim();[...xe.options].some(Ye=>Ye.value===we)?xe.value=we:na.includes(P.site)&&(xe.value=P.site)}const ee=P.severity||P.gravite;ee&&Oa.setValue(Ko(String(ee)));let pe=P.description?String(P.description):"";P.site&&typeof P.site=="string"&&!na.includes(P.site)&&![...xe.options].some(we=>we.value===P.site.trim())&&pe.length<1900&&(pe=`[Site détecté (non listé) : ${P.site.slice(0,48)}] `+pe),pe&&(Z.value=pe.slice(0,2e3)),oi(),C("Brouillon import appliqué — vérifiez puis enregistrez.","info")}(async function(){await nn(),ce(),$s()})();const mi=lt((pn=Me())==null?void 0:pn.role,"incidents","write");!mi&&Me()&&(de.style.opacity="0.58",He.disabled=!0,Te.disabled=!0,Ue.disabled=!0,He.title="Déclaration réservée — votre rôle est en lecture sur les incidents"),Yl(),(un=document.getElementById("qhse-inc-slideover-overlay"))==null||un.remove(),(mn=document.getElementById("qhse-inc-slideover-panel"))==null||mn.remove();function qs(){const Q=document.createElement("div");Q.className="inc-overlay",Q.id="qhse-inc-slideover-overlay",Q.setAttribute("aria-hidden","true");const P=document.createElement("div");P.className="inc-slideover",P.id="qhse-inc-slideover-panel",P.setAttribute("role","dialog"),P.setAttribute("aria-modal","true"),P.setAttribute("aria-label","Déclarer un incident");const ee=document.createElement("div");ee.className="inc-slideover__head",ee.innerHTML=`
    <span class="inc-slideover__title">
      Déclarer un incident
    </span>
    <button type="button"
      class="inc-slideover__close"
      aria-label="Fermer">
      <svg width="18" height="18"
        viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
  `;const pe=document.createElement("div");pe.className="inc-slideover__body",P.append(ee,pe);function we(Je){Je.key==="Escape"&&P.classList.contains("inc-slideover--open")&&(Je.preventDefault(),Ye())}function Ge(Je){var Qe;pe.replaceChildren(Je),Q.setAttribute("aria-hidden","false"),Q.classList.add("inc-overlay--open"),P.classList.add("inc-slideover--open"),document.body.style.overflow="hidden",document.addEventListener("keydown",we),(Qe=P.querySelector("input, select, textarea"))==null||Qe.focus()}function Ye(){Q.setAttribute("aria-hidden","true"),Q.classList.remove("inc-overlay--open"),P.classList.remove("inc-slideover--open"),document.body.style.overflow="",document.removeEventListener("keydown",we),pe.replaceChildren()}return Q.addEventListener("click",Ye),ee.querySelector(".inc-slideover__close").addEventListener("click",Ye),document.body.append(Q,P),{open:Ge,close:Ye}}const gi=qs();x.addEventListener("click",()=>gi.open(ne));const bi=document.createElement("div");bi.className="incidents-split incidents-split--registry-focus";const Ha=document.createElement("div");Ha.className="incidents-split__list content-card card-soft incidents-premium-card",Ha.id="incidents-recent-list";const hi=document.createElement("div");hi.className="incidents-split-list-head";const xi=document.createElement("div");xi.className="incidents-split-list-head__row";const Jt=document.createElement("h2");Jt.className="incidents-list-heading",Jt.textContent="Registre des incidents";const It=document.createElement("span");It.className="incidents-list-count",xi.append(Jt,It);const fi=document.createElement("p");fi.className="incidents-registry-lead",fi.textContent="Tableau principal : tri par criticité, filtres au-dessus du tableau. Sélectionnez une ligne ou « Voir » pour la fiche à droite.",hi.append(xi,fi);const Ct=document.createElement("div");Ct.className="incidents-list-host",Wl(),Ha.append(hi,Ct);const Fa=document.createElement("aside");Fa.className="incidents-split__detail content-card card-soft incidents-premium-card",Fa.setAttribute("aria-label","Détail incident");const Kt=document.createElement("div");Kt.className="incidents-detail-panel",Fa.append(Kt),bi.append(Ha,Fa);let nt="loading";const vi=lt((gn=Me())==null?void 0:gn.role,"incidents","write"),on=lt((bn=Me())==null?void 0:bn.role,"actions","write"),yi=document.createElement("article");yi.className="content-card card-soft incidents-premium-card incidents-analytics-card";const ki=document.createElement("div");ki.className="content-card-head",ki.innerHTML=`
    <div>
      <div class="section-kicker">Pilotage</div>
      <h3>Analytics</h3>
      <p class="incidents-form-lead incidents-analytics-card__lead">
        Tendances sur le périmètre chargé — même source que le registre.
      </p>
    </div>`;const xa=document.createElement("div");xa.className="incidents-analytics-grid",yi.append(ki,xa);const _i=document.createElement("div");_i.className="incidents-registry-shell";const wi=document.createElement("div");wi.className="incidents-registry-zone-title",wi.innerHTML=`
    <p class="incidents-registry-zone-kicker">Opérations</p>
    <h2 class="incidents-registry-zone-heading">Pilotage du registre</h2>
  `,_i.append(wi,W,bi),t.append(ba({title:"Incidents — lire vite, agir sûr",hint:"Les chiffres en tête montrent l’ouvert et le critique ; la liste est votre file d’attente.",nextStep:"Étape suivante : déclarer si besoin, sinon ouvrir une ligne critique ou récente."}),d,N,_i,yi);function fa(){if(xa.replaceChildren(),nt!=="ok"||!Fe.length){const ke=document.createElement("p");ke.className="incidents-detail-muted",ke.textContent=nt==="loading"?"Chargement des graphiques…":"Aucune donnée incident à analyser sur cette vue.",xa.append(ke);return}const Q=Go(Fe,ke=>ke.createdAt?String(ke.createdAt):null,6),P=document.createElement("div");P.className="incidents-analytics-cell";const ee=document.createElement("h4");ee.className="incidents-analytics-cell__title",ee.textContent="Évolution des déclarations",P.append(ee,oa(Q,{lineTheme:"incidents",footText:null,ariaLabel:"Nombre d’incidents déclarés par mois sur six mois."}));const pe=document.createElement("div");pe.className="incidents-analytics-cell";const we=document.createElement("h4");we.className="incidents-analytics-cell__title",we.textContent="Répartition par type",pe.append(we,Wt(Hr(Fe)));const Ge=document.createElement("div");Ge.className="incidents-analytics-cell";const Ye=document.createElement("h4");Ye.className="incidents-analytics-cell__title",Ye.textContent="Gravité",Ge.append(Ye,Wt(dd(Fe)));const Je=document.createElement("div");Je.className="incidents-analytics-cell";const Qe=document.createElement("h4");Qe.className="incidents-analytics-cell__title",Qe.textContent="Causes apparentes (proxy types)",Je.append(Qe,Wt(pd(Fe))),xa.append(P,pe,Ge,Je)}function sn(Q){Kt.replaceChildren();const P=document.createElement("div");P.className="incidents-detail-empty";const ee=document.createElement("p");ee.className="incidents-detail-empty__title",ee.textContent=Q;const pe=document.createElement("p");pe.className="incidents-detail-empty__sub",pe.textContent="Cliquez une ligne dans la liste ou « Voir » pour afficher la fiche, le statut et les actions liées.",P.append(ee,pe),Kt.append(P)}async function cn(Q){Kt.replaceChildren();const P=or(Q),ee=document.createElement("div");ee.className="incidents-detail-filled incidents-detail-filled--premium";const pe=document.createElement("section");pe.className="incidents-detail-section incidents-detail-section--main";const we=document.createElement("h3");we.className="incidents-detail-section__title",we.textContent="Informations principales";const Ge=document.createElement("div");Ge.className="incidents-detail-head";const Ye=document.createElement("h2");Ye.className="incidents-detail-ref",Ye.textContent=P.ref;const Je=document.createElement("p");Je.className="incidents-detail-title-line",Je.textContent=P.title;const Qe=document.createElement("p");Qe.className="incidents-detail-type",Qe.textContent=`${P.type} · ${P.site} · ${P.date}`,Ge.append(Ye,Je,Qe);const ke=document.createElement("div");ke.className="incidents-detail-badges";const Le=document.createElement("span");Le.className=`ds-badge ${Xo(P.severity)}`,Le.textContent=P.severity.charAt(0).toUpperCase()+P.severity.slice(1),ke.append(Le);const Ve=document.createElement("div");Ve.className="incidents-detail-status";const it=document.createElement("label"),At=document.createElement("span");At.textContent="Statut";const Ke=document.createElement("select");Ke.className="control-select",Ke.disabled=!vi,vi||(Ke.title="Modification du statut réservée (écriture incidents)"),td(P.status).forEach(ut=>{const kt=document.createElement("option");kt.value=ut,kt.textContent=ut,Ke.append(kt)}),[...Ke.options].some(ut=>ut.value===P.status)&&(Ke.value=P.status),Ke.addEventListener("change",()=>{Ke.value!==P.status&&Ls(Q,Ke.value,Ke)}),it.append(At,Ke),Ve.append(it),pe.append(we,Ge,ke,Ve);const Xt=document.createElement("section");Xt.className="incidents-detail-section";const jt=document.createElement("h3");jt.className="incidents-detail-section__title",jt.textContent="Description";const pt=document.createElement("p");pt.className="incidents-detail-desc",pt.textContent=(P.description||"").trim()||"— Aucune description.",Xt.append(jt,pt);const Ei=document.createElement("section");Ei.className="incidents-detail-section";const Ni=document.createElement("h3");Ni.className="incidents-detail-section__title",Ni.textContent="Photo";const Si=document.createElement("p");Si.className="incidents-detail-muted";const Is=/📷|photo terrain|Photo signalée/i.test(P.description||"");Si.textContent=Is?"Une mention de photo figure dans la description. Le stockage fichier n’est pas encore branché sur l’API — conserver la preuve selon votre procédure interne.":"Aucune mention de photo sur cette fiche.",Ei.append(Ni,Si);const hn=cd(P),xn=ld(P),Ci=document.createElement("section");Ci.className="incidents-detail-section incidents-detail-section--ai";const Ai=document.createElement("h3");Ai.className="incidents-detail-section__title",Ai.textContent="Suggestions IA (assistance)";const zi=document.createElement("p");zi.className="incidents-detail-muted",zi.textContent="Propositions générées localement (type + gravité). Elles ne sont jamais enregistrées sans action de votre part — l’API PATCH incident ne prend pas encore la description.";const $i=document.createElement("div");$i.className="incidents-ai-grid";const qi=document.createElement("div");qi.className="incidents-ai-box";const Li=document.createElement("span");Li.className="incidents-ai-box__label",Li.textContent="Cause probable";const Ii=document.createElement("p");Ii.className="incidents-ai-box__text",Ii.textContent=hn,qi.append(Li,Ii);const Ti=document.createElement("div");Ti.className="incidents-ai-box";const Mi=document.createElement("span");Mi.className="incidents-ai-box__label",Mi.textContent="Action recommandée";const Pi=document.createElement("p");Pi.className="incidents-ai-box__text",Pi.textContent=xn,Ti.append(Mi,Pi),$i.append(qi,Ti);const Ri=document.createElement("div");Ri.className="incidents-ai-foot";const va=document.createElement("button");va.type="button",va.className="btn btn-secondary",va.textContent="Copier analyse (IA)";const fn=`Cause probable (IA) : ${hn}
Action recommandée (IA) : ${xn}`;va.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(fn),C("Texte copié — à coller dans votre rapport ou SI.","info")}catch{C("Copie impossible sur ce navigateur","error")}});const Di=document.createElement("label");Di.className="incidents-ai-validate";const ji=document.createElement("input");ji.type="checkbox",ji.id=`inc-ai-validate-${P.ref.replace(/[^a-z0-9-]/gi,"")}`;const vn=document.createElement("span");vn.textContent="J’ai relu ces suggestions (validation humaine obligatoire avant toute décision).",Di.append(ji,vn),Ri.append(va,Di),Ci.append(Ai,zi,$i,Ri);const Oi=document.createElement("section");Oi.className="incidents-detail-section";const Hi=document.createElement("h3");Hi.className="incidents-detail-section__title",Hi.textContent="Analyse (brouillon local)";const ya=document.createElement("textarea");ya.className="incidents-detail-analysis-draft",ya.readOnly=!0,ya.rows=5,ya.value=fn;const Fi=document.createElement("p");Fi.className="incidents-detail-muted",Fi.textContent="Non synchronisé avec le serveur — utilisez « Copier » pour votre GED / rapport. Aucune écriture automatique.",Oi.append(Hi,ya,Fi);const Vi=document.createElement("section");Vi.className="incidents-detail-section";const Bi=document.createElement("h3");Bi.className="incidents-detail-section__title",Bi.textContent="Actions liées";const Ot=document.createElement("div");Ot.className="incidents-detail-actions-host";const Gi=document.createElement("p");Gi.className="incidents-detail-muted",Gi.textContent="Chargement…",Ot.append(Gi),Vi.append(Bi,Ot);const Ui=document.createElement("div");Ui.className="incidents-detail-foot";const Zt=document.createElement("button");Zt.type="button",Zt.className="btn btn-primary",Zt.textContent="Créer une action liée",Zt.hidden=!on,Zt.addEventListener("click",()=>{Xn(Q)});const ka=document.createElement("button");ka.type="button",ka.className="btn incidents-detail-foot__secondary",ka.textContent="Ouvrir pilotage actions",ka.addEventListener("click",()=>{window.location.hash="actions"}),Ui.append(Zt,ka),ee.append(pe,Xt,Ei,Ci,Oi,Vi,Ui),Kt.append(ee);const Va=await rd(Q.ref);if(Ot.replaceChildren(),Va.length){const ut=document.createElement("ul");if(ut.className="incidents-detail-action-list",Va.slice(0,12).forEach(kt=>{const Wi=document.createElement("li");Wi.className="incidents-detail-action-item";const yn=document.createElement("strong");yn.textContent=String(kt.title||"—");const Yi=document.createElement("span");Yi.className="incidents-detail-action-status",Yi.textContent=String(kt.status||""),Wi.append(yn,document.createTextNode(" — "),Yi),ut.append(Wi)}),Ot.append(ut),Va.length>12){const kt=document.createElement("p");kt.className="incidents-detail-muted",kt.textContent=`… et ${Va.length-12} autre(s) — voir pilotage actions.`,Ot.append(kt)}}else{const ut=document.createElement("p");ut.className="incidents-detail-muted",ut.textContent="Aucune action trouvée dont le libellé ou le détail mentionne cette référence.",Ot.append(ut)}}function ln(){Ct.querySelectorAll(".incidents-table-row").forEach(Q=>{Q.classList.toggle("incidents-table-row--selected",Q.dataset.ref===c)})}function dn(Q){c=Q.ref,ln(),cn(Q)}async function Ls(Q,P,ee){var pe;ee.disabled=!0;try{const we=await Se(`/api/incidents/${encodeURIComponent(Q.ref)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:P})});if(!we.ok){let Qe="Mise à jour impossible";try{const ke=await we.json();ke.error&&(Qe=ke.error)}catch{}C(Qe,"error"),ee.value=Q.status;return}const Ge=await we.json(),Ye=nr(Ge);if(!Ye){C("Réponse serveur inattendue","error"),ee.value=Q.status;return}const Je=Fe.findIndex(Qe=>Qe.ref===Ye.ref);Je>=0?Fe[Je]=Ye:Fe=[Ye,...Fe],C(`Statut : ${P}`,"info"),typeof e=="function"&&e({module:"incidents",action:"Statut incident",detail:`${Q.ref} → ${P}`,user:((pe=Me())==null?void 0:pe.name)||"Responsable QHSE"}),Tt()}catch(we){console.error("[incidents] PATCH",we),C("Erreur réseau","error"),ee.value=Q.status}finally{ee.disabled=!vi}}function Tt(){const Q=D();if(q(),nt==="ok"){const ke=o;$.querySelectorAll('option:not([value=""])').forEach(Ve=>Ve.remove());const Le=new Set;Fe.forEach(Ve=>{const it=String(Ve.site||"").trim();if(it&&!Le.has(it)){Le.add(it);const At=document.createElement("option");At.value=it,At.textContent=it,$.append(At)}}),na.forEach(Ve=>{if(Ve&&!Le.has(Ve)){Le.add(Ve);const it=document.createElement("option");it.value=Ve,it.textContent=Ve,$.append(it)}}),ke&&[...$.options].some(Ve=>Ve.value===ke)?$.value=ke:(o="",$.value="")}const P=Q.length,ee=Fe.length;if(nt==="loading"?(Jt.textContent="Chargement du registre…",It.textContent="",It.hidden=!0):nt==="error"?(Jt.textContent="Registre indisponible",It.textContent="",It.hidden=!0):(Jt.textContent="Registre des incidents",It.hidden=!1,It.textContent=P===ee?`${P} affiché${P!==1?"s":""}`:`${P} affiché${P!==1?"s":""} / ${ee}`),Ct.replaceChildren(),nt==="loading"){const ke=document.createElement("div");ke.className="incidents-skeleton";const Le=[1,2,3].map(()=>`
  <div class="skeleton-card">
    <div class="skeleton-line skeleton-line--title"></div>
    <div class="skeleton-line skeleton-line--sub"></div>
    <div class="skeleton-line skeleton-line--meta"></div>
  </div>
`).join("");ke.innerHTML=Le,Ct.append(ke),fa();return}if(nt==="error"&&Fe.length===0){const ke=document.createElement("div");ke.className="incidents-empty";const Le=document.createElement("p");Le.className="incidents-empty__title",Le.textContent="Liste indisponible";const Ve=document.createElement("p");Ve.className="incidents-empty__sub",Ve.textContent="Vérifiez que l’API tourne et que le navigateur peut l’atteindre (ex. http://localhost:5173 avec backend actif).",ke.append(Le,Ve),Ct.append(ke),fa();return}if(nt==="ok"&&Fe.length===0){const ke=document.createElement("div");ke.className="incidents-empty",ke.innerHTML=`
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.5"
    style="opacity:.35;color:var(--text2)">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94
             a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <path d="M12 9v4"/><path d="M12 17h.01"/>
  </svg>
  <p class="incidents-empty__title">Aucun incident enregistré</p>
  <p class="incidents-empty__sub">
    Déclarez le premier incident de votre périmètre.
  </p>
  <button type="button" class="btn btn-primary incidents-empty__cta">
    Déclarer un incident
  </button>
`;const Le=ke.querySelector(".incidents-empty__cta");Le&&Le.addEventListener("click",()=>gi.open(ne)),Ct.append(ke),fa();return}if(nt==="ok"&&Q.length===0&&Fe.length>0){const ke=document.createElement("div");ke.className="incidents-empty";const Le=document.createElement("p");Le.className="incidents-empty__title",Le.textContent="Aucun résultat";const Ve=document.createElement("p");Ve.className="incidents-empty__sub",Ve.textContent="Ajustez les filtres (statut, gravité, période) pour retrouver des fiches dans le registre.",ke.append(Le,Ve),Ct.append(ke),fa();return}const pe=Q.map(ke=>or(ke)),we=document.createElement("div");we.className="incidents-table-scroll";const Ge=document.createElement("table");Ge.className="incidents-table-premium";const Ye=document.createElement("thead"),Je=document.createElement("tr");["Incident","Gravité","Statut","Date","Site",""].forEach(ke=>{const Le=document.createElement("th");Le.textContent=ke,Je.append(Le)}),Ye.append(Je);const Qe=document.createElement("tbody");if(pe.forEach(ke=>{Qe.append(ud(ke,{onSelect:Le=>dn(Le),onDetail:Le=>dn(Le),onCreateAction:async Le=>{await Xn(Le)},canWriteActions:on}))}),Ge.append(Ye,Qe),we.append(Ge),Ct.append(we),ln(),c){const ke=Fe.find(Le=>Le.ref===c);ke?cn(or(ke)):(c=null,sn("Sélectionnez un incident"))}fa()}try{sn("Sélectionnez un incident"),Tt()}catch(Q){console.error("[incidents] rendu initial du registre",Q)}return(async function(){try{const P=await Se(_t("/api/incidents?limit=500"));if(!P.ok)throw new Error(`HTTP ${P.status}`);const ee=await P.json();Fe=(Array.isArray(ee)?ee:[]).map(nr).filter(Boolean),nt="ok",Tt()}catch(P){console.error("[incidents] GET /api/incidents",P),C("Erreur serveur","error"),Fe=[],nt="error",Tt()}})(),Zo().catch(()=>{}),He.addEventListener("click",async()=>{var At;const Q=ze.value.trim(),P=xe.value.trim();if(!Q||!P){C("Type et site obligatoires","error");return}const ee=Oa.getValue(),pe=(Z.value||"").trim(),we=je.value&&typeof je.value=="string"?`Faits le ${Kl(je.value)}. `:"",Ge=qe.value.trim()?`[Lieu précis] ${qe.value.trim()}
`:"",Je=!!(ye.files&&ye.files.length)?`📷 Photo terrain signalée (média non stocké sur le serveur dans cette version).
`:"",Qe=bt.value.trim(),ke=Qe?`

${Bl(Qe)}`:"",Le=(we+Ge+Je+pe+ke).trim(),Ve=Le||"Sans description",it=Zl(Fe);He.disabled=!0;try{const Ke=await Se("/api/incidents",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ref:it,type:Q,site:P,severity:ee,description:Le||void 0,status:"Nouveau",...(At=xe.selectedOptions[0])!=null&&At.dataset.siteId?{siteId:xe.selectedOptions[0].dataset.siteId}:{}})});if(!Ke.ok){try{const pt=await Ke.json();console.error("[incidents] POST /api/incidents",Ke.status,pt)}catch{console.error("[incidents] POST /api/incidents",Ke.status)}C("Erreur serveur","error");return}const Xt=await Ke.json(),jt=nr(Xt);if(!jt){console.error("[incidents] réponse POST invalide",Xt),C("Erreur serveur","error");return}Fe=[jt,...Fe.filter(pt=>pt.ref!==jt.ref)],nt="ok",Tt(),gi.close(),typeof e=="function"&&e({module:"incidents",action:"Incident déclaré",detail:`${it} · ${Q} · ${P} · ${ee} — ${Ve.slice(0,80)}${Ve.length>80?"…":""}`,user:"Agent terrain"}),C(`Incident enregistré : ${it}`,"info"),Z.value="",qe.value="",ye.value="",$e.replaceChildren(),Oa.setValue("moyen"),ze.value="",We.forEach(pt=>pt.classList.remove("incidents-rapid-chip--on"));try{je.valueAsDate=new Date}catch{je.value=""}await nn(),ce(),bt.value="",ja(0),setTimeout(()=>{var pt;(pt=document.getElementById("incidents-recent-list"))==null||pt.scrollIntoView({behavior:"smooth",block:"start"})},0)}catch(Ke){console.error("[incidents] POST /api/incidents",Ke),C("Erreur serveur","error")}finally{He.disabled=!mi,mi&&ha()}}),t}const gd=/G\s*([1-5])\s*[×xX*]\s*P\s*([1-5])/;function ft(e){const t=gd.exec(String(e??"").trim());if(!t)return null;const a=Number(t[1]),r=Number(t[2]);return!Number.isFinite(a)||!Number.isFinite(r)||a<1||a>5||r<1||r>5?null:{g:a,p:r}}function bd(e,t){return e*t}function Ra(e,t){const a=e*t;return a>=20?5:a>=12?4:a>=7?3:a>=3?2:1}const hd={1:"Faible",2:"Modéré",3:"Élevé",4:"Très élevé",5:"Critique"};function Pt(e){return hd[Math.min(5,Math.max(1,e))]||"—"}function $t(e){const t=ft(e);if(!t)return null;const a=bd(t.g,t.p),r=Ra(t.g,t.p);return{g:t.g,p:t.p,product:a,tier:r,label:Pt(r)}}const Zn={1:"Improbable",2:"Rare",3:"Occasionnelle",4:"Probable",5:"Fréquente"},eo={1:"Négligeable",2:"Mineure",3:"Modérée",4:"Majeure",5:"Catastrophique"};function Ya(e,t){return Ra(e,t)}function xd(e){if(!e.length)return"";let t=0,a=0;return e.forEach(r=>{const n=r==null?void 0:r.trend;n==="up"?t+=1:n==="down"&&(a+=1)}),t>a?"↑":a>t?"↓":"→"}function fd(e={}){const{onFilterChange:t,variant:a="default",showRiskDots:r=!1,onCellActivate:n}=e,i=document.createElement("div");i.className=a==="embedded"?"risk-matrix-panel risk-matrix-panel--embedded":"risk-matrix-panel";const o=document.createElement("div");o.className="risk-matrix-tool";const s=document.createElement("div");s.className="risk-matrix-tool__head",s.innerHTML=a==="embedded"?'<strong class="risk-matrix-tool__title">Synthèse G×P</strong><p class="risk-matrix-tool__lede">Compteurs et pastilles filtrent le registre. Grille ci-dessous pour affiner par case.</p>':'<strong class="risk-matrix-tool__title">Pilotage par criticité</strong><p class="risk-matrix-tool__lede">Les compteurs ci-dessous suivent vos fiches (G×P). Les pastilles ouvrent le filtre sur le registre — pas besoin de chercher la case dans la grille.</p>';const c=document.createElement("div");c.className="risk-matrix-priority-row",c.setAttribute("aria-label","Répartition par palier");const l=document.createElement("div");l.className="risk-matrix-hotspots-section";const d=document.createElement("div");d.className="risk-matrix-hotspots-section__label",d.textContent="Raccourcis — cases avec fiches";const u=document.createElement("div");u.className="risk-matrix-hotspots",u.setAttribute("role","toolbar"),u.setAttribute("aria-label","Filtrer par case G×P");const p=document.createElement("div");p.className="risk-matrix-status-row";const g=document.createElement("p");g.className="risk-matrix-panel__stats",g.setAttribute("aria-live","polite");const m=document.createElement("button");m.type="button",m.className="btn btn-secondary risk-matrix-panel__reset",m.textContent="Tout afficher",m.hidden=!0,p.append(g,m),l.append(d,u),o.append(s,c,l,p);const b=document.createElement("div");b.className="risk-matrix-grid-wrap";const y=document.createElement("div");y.className="risk-matrix-grid-wrap__label",y.innerHTML='Grille criticité <span class="risk-matrix-grid-wrap__hint">(survol : liste des fiches · densité relative au portefeuille)</span>';const v=document.createElement("div");v.className="risk-matrix-grid risk-matrix-grid--premium",v.setAttribute("role","grid"),v.setAttribute("aria-label","Matrice gravité × probabilité");const h=document.createElement("div");h.className="risk-matrix-cell-tooltip",h.setAttribute("role","tooltip"),h.hidden=!0,b.style.position="relative";let k=0;function _(){h.replaceChildren(),h.hidden=!0}function f(A){const I=A.getBoundingClientRect(),z=b.getBoundingClientRect(),R=I.bottom-z.top+b.scrollTop+6,V=Math.min(Math.max(8,I.left-z.left+b.scrollLeft+I.width/2-120),b.clientWidth-248);h.style.top=`${R}px`,h.style.left=`${V}px`}function E(A){h.replaceChildren();const I=Number(A.dataset.count||"0"),z=Number(A.dataset.g),R=Number(A.dataset.p),V=z*R,oe=Ya(z,R),ge=Pt(oe),B=(A.dataset.riskNames||"").split("").filter(Boolean),re=document.createElement("strong");re.className="risk-matrix-cell-tooltip__title",re.textContent=`G${z} × P${R}`;const se=document.createElement("span");if(se.className="risk-matrix-cell-tooltip__meta",se.textContent=`Score ${V} · ${ge}`,h.append(re,se),I>0){const F=document.createElement("span");F.className="risk-matrix-cell-tooltip__count",F.textContent=`${I} risque(s)`;const H=document.createElement("ul");if(H.className="risk-matrix-cell-tooltip__list",B.slice(0,6).forEach(X=>{const $=document.createElement("li");$.textContent=X,H.append($)}),B.length>6){const X=document.createElement("li");X.textContent="…",H.append(X)}const G=document.createElement("span");G.className="risk-matrix-cell-tooltip__hint",G.textContent="Clic : filtrer le registre ci-dessous · Actions liées dans le tableau",h.append(F,H,G)}else{const F=document.createElement("span");F.className="risk-matrix-cell-tooltip__empty",F.textContent=`Aucune fiche — case ${ge} (score théorique ${V})`,h.append(F)}}v.addEventListener("pointerenter",A=>{const I=A.target.closest(".risk-matrix-cell");!I||!v.contains(I)||(clearTimeout(k),E(I),h.hidden=!1,f(I))},!0),v.addEventListener("pointerleave",A=>{const I=A.relatedTarget;I&&(h===I||h.contains(I))||(k=window.setTimeout(_,120))}),h.addEventListener("pointerenter",()=>clearTimeout(k)),h.addEventListener("pointerleave",()=>{k=window.setTimeout(_,120)});const w=document.createElement("div");w.className="risk-matrix-legend",w.innerHTML=`
    <span class="risk-matrix-legend__compact" title="Couleur selon score G×P (1–25)">
      <span class="risk-matrix-legend__compact-label">Palier</span>
      <span class="risk-matrix-legend__sw risk-matrix-legend__sw--1">F</span>
      <span class="risk-matrix-legend__sw risk-matrix-legend__sw--2">M</span>
      <span class="risk-matrix-legend__sw risk-matrix-legend__sw--3">É</span>
      <span class="risk-matrix-legend__sw risk-matrix-legend__sw--4">T</span>
      <span class="risk-matrix-legend__sw risk-matrix-legend__sw--5">C</span>
    </span>
  `,b.append(y,v,h);let x=null,S=[];const N=new Map;function L(A,I){return`${A}-${I}`}function D(A,I){const z=N.get(L(A,I)),R=Number((z==null?void 0:z.dataset.count)||"0");R!==0&&(x={g:A,p:I},typeof t=="function"&&t(x),typeof n=="function"&&n({g:A,p:I,count:R}),K())}function q(){v.replaceChildren(),N.clear();const A=document.createElement("div");A.className="risk-matrix-grid__corner risk-matrix-grid__corner--premium",A.innerHTML='<span class="risk-matrix-grid__corner-g">Gravité <small>↑ forte</small></span><span class="risk-matrix-grid__corner-p">Probabilité <small>→</small></span>',A.title="Lignes : gravité 5 (haut) → 1. Colonnes : probabilité 1 → 5.",v.append(A);let I=0;for(let z=1;z<=5;z++){const R=document.createElement("div");R.className="risk-matrix-grid__colhead risk-matrix-grid__colhead--premium",R.innerHTML=`<span class="risk-matrix-grid__axis-main">P${z}</span><span class="risk-matrix-grid__axis-sub">${Zn[z]}</span>`,R.title=`Probabilité ${z}/5 — ${Zn[z]}`,v.append(R)}for(let z=5;z>=1;z--){const R=document.createElement("div");R.className="risk-matrix-grid__rowhead risk-matrix-grid__rowhead--premium",R.innerHTML=`<span class="risk-matrix-grid__axis-main">G${z}</span><span class="risk-matrix-grid__axis-sub">${eo[z]}</span>`,R.title=`Gravité ${z}/5 — ${eo[z]}`,v.append(R);for(let V=1;V<=5;V++){const oe=document.createElement("button");oe.type="button",oe.className="risk-matrix-cell risk-matrix-cell--premium",oe.dataset.g=String(z),oe.dataset.p=String(V),oe.style.setProperty("--rm-stagger",String(I*.025)),I+=1;const ge=Ya(z,V);oe.classList.add(`risk-matrix-cell--t${ge}`);const B=z*V;oe.dataset.score=String(B),oe.setAttribute("aria-label",`Gravité ${z}, probabilité ${V}, score ${B}, ${Pt(ge)}`),oe.addEventListener("click",()=>W(z,V)),v.append(oe),N.set(L(z,V),oe)}}}function W(A,I){const z=L(A,I),R=N.get(z),V=Number((R==null?void 0:R.dataset.count)||"0");if(V===0){x&&x.g===A&&x.p===I&&(x=null,typeof t=="function"&&t(null),K());return}x&&x.g===A&&x.p===I?x=null:x={g:A,p:I},typeof t=="function"&&t(x),x&&typeof n=="function"&&V>0&&n({g:A,p:I,count:V}),K()}m.addEventListener("click",()=>{x=null,typeof t=="function"&&t(null),K()});function K(){const A={};let I=0;for(let F=1;F<=5;F++)for(let H=1;H<=5;H++)A[L(F,H)]={titles:[],risks:[],gp:{g:F,p:H}};let z=0,R=0,V=0;S.forEach(F=>{const H=ft(F.meta);if(!H){I+=1;return}const G=$t(F.meta);G&&(G.tier>=5?z+=1:G.tier>=3?R+=1:V+=1);const X=L(H.g,H.p);if(!A[X])return;const $=(F.title||"Sans titre").trim();$&&A[X].titles.push($),A[X].risks.push(F)});let oe=1;for(let F=1;F<=5;F++)for(let H=1;H<=5;H++){const G=A[L(F,H)].risks.length;G>oe&&(oe=G)}c.replaceChildren();function ge(F,H,G,X){const $=document.createElement("div");$.className=`risk-matrix-priority-card ${F}`;const T=document.createElement("span");T.className="risk-matrix-priority-card__value",T.textContent=String(H);const j=document.createElement("div");j.className="risk-matrix-priority-card__text";const Y=document.createElement("span");Y.className="risk-matrix-priority-card__label",Y.textContent=G;const ne=document.createElement("span");ne.className="risk-matrix-priority-card__hint",ne.textContent=X,j.append(Y,ne),$.append(T,j),c.append($)}if(ge("risk-matrix-priority-card--crit",z,"Critique","Palier max (score G×P ≥ 20)"),ge("risk-matrix-priority-card--warn",R,"Élevé","Palier 3–4 (score 7 à 19)"),ge("risk-matrix-priority-card--ok",V,"Modéré / faible","Palier 1–2 (score ≤ 6)"),I>0){const F=document.createElement("div");F.className="risk-matrix-priority-card risk-matrix-priority-card--muted";const H=document.createElement("span");H.className="risk-matrix-priority-card__value",H.textContent=String(I);const G=document.createElement("div");G.className="risk-matrix-priority-card__text";const X=document.createElement("span");X.className="risk-matrix-priority-card__label",X.textContent="Sans G×P";const $=document.createElement("span");$.className="risk-matrix-priority-card__hint",$.textContent="Non visibles sur la matrice",G.append(X,$),F.append(H,G),c.append(F)}u.replaceChildren();const B=[];for(let F=1;F<=5;F++)for(let H=1;H<=5;H++){const G=L(F,H),X=A[G].risks.length;X>0&&B.push({g:F,p:H,n:X,product:F*H,tier:Ya(F,H),titles:A[G].titles})}if(B.sort((F,H)=>H.product-F.product||H.n-F.n),B.length===0){const F=document.createElement("p");F.className="risk-matrix-hotspots-empty",F.textContent="Aucune fiche positionnée : renseignez G×P (ex. G3 × P4) sur chaque risque pour activer la matrice et ces raccourcis.",u.append(F)}else B.forEach(({g:F,p:H,n:G,product:X,tier:$,titles:T})=>{const j=document.createElement("button");j.type="button",j.className=`risk-matrix-hotspot-chip risk-matrix-hotspot-chip--t${$}`,x&&x.g===F&&x.p===H&&j.classList.add("risk-matrix-hotspot-chip--active"),j.innerHTML=`<span class="risk-matrix-hotspot-chip__gp">G${F}×P${H}</span><span class="risk-matrix-hotspot-chip__mid"><strong>${G}</strong> fiche${G>1?"s":""}</span><span class="risk-matrix-hotspot-chip__score">score ${X}</span>`,j.title=`${Pt($)} — ${T.slice(0,3).join(" · ")}${T.length>3?"…":""}`,j.addEventListener("click",()=>D(F,H)),u.append(j)});let re=0;for(let F=1;F<=5;F++)for(let H=1;H<=5;H++){const G=L(F,H),X=N.get(G);if(!X)continue;const{titles:$,risks:T}=A[G],j=T.length;re+=j,X.dataset.count=String(j),X.classList.toggle("risk-matrix-cell--empty",j===0),X.classList.toggle("risk-matrix-cell--has-data",j>0),X.classList.toggle("risk-matrix-cell--active",!!(x&&x.g===F&&x.p===H));const Y=F*H,ne=Pt(Ya(F,H)),ae=oe>0?j/oe:0;X.style.setProperty("--rm-heat",String(ae)),X.dataset.riskNames=T.map(he=>(he.title||"Sans titre").trim()).join(""),X.replaceChildren();const de=document.createElement("span");if(de.className="risk-matrix-cell__score",de.textContent=String(Y),X.append(de),j>0){const he=document.createElement("span");he.className="risk-matrix-cell__mid";const fe=document.createElement("span");fe.className="risk-matrix-cell__count",fe.textContent=String(j);const _e=document.createElement("span");if(_e.className="risk-matrix-cell__trend",_e.setAttribute("aria-hidden","true"),_e.textContent=xd(T),he.append(fe,_e),X.append(he),r){const Ee=document.createElement("span");if(Ee.className="risk-matrix-cell__dots",T.slice(0,6).forEach(ve=>{const Ae=$t(ve.meta),ze=(Ae==null?void 0:Ae.tier)??1,Pe=document.createElement("span");Pe.className=`risk-matrix-cell__dot risk-matrix-cell__dot--t${ze}`,Pe.title=String(ve.title||"Risque"),Ee.append(Pe)}),j>6){const ve=document.createElement("span");ve.className="risk-matrix-cell__dot-more",ve.textContent=`+${j-6}`,Ee.append(ve)}X.append(Ee)}}else{const he=document.createElement("span");he.className="risk-matrix-cell__trend risk-matrix-cell__trend--muted",he.setAttribute("aria-hidden","true"),he.textContent="—",X.append(he)}X.setAttribute("title",j===0?`Case G${F}×P${H} — score ${Y} (${ne}) — vide`:`G${F}×P${H} — score ${Y} (${ne}) — ${j} fiche(s). Clic : filtre registre et actions · second clic : tout afficher.`)}const se=S.length;if(x){const F=S.filter(X=>{const $=ft(X.meta);return $&&$.g===x.g&&$.p===x.p}).length,H=x.g*x.p,G=Pt(Ra(x.g,x.p));g.textContent=`Liste filtrée : G${x.g}×P${x.p} · score ${H} (${G}) · ${F} fiche(s).`,m.hidden=!1}else{const F=[`${se} fiche(s)`,`${re} sur la matrice`];I>0&&F.push(`${I} sans position`),g.textContent=F.join(" · "),m.hidden=!0}}return q(),i.append(o,b,w),{element:i,setRisks(A){S=Array.isArray(A)?[...A]:[],x&&(S.some(z=>{const R=ft(z.meta);return R&&R.g===x.g&&R.p===x.p})||(x=null,typeof t=="function"&&t(null))),K()},clearFilter(){x=null,typeof t=="function"&&t(null),K()},getFilter(){return x}}}function vd(e){return e==="red"?"red":e==="amber"?"amber":"blue"}function yd(e){return e>=5?"red":e>=3?"amber":"blue"}function tt(e){return(e!=null?String(e).trim():"")||"—"}function kd(e){const t=String(e||""),a=t.indexOf("— Mesures envisagées —");return a<0?{main:t.trim(),mesures:""}:{main:t.slice(0,a).trim(),mesures:t.slice(a+22).trim()}}function _d(e,t={}){const a=Array.isArray(t.linkedIncidents)?t.linkedIncidents:[],r=typeof t.incidentsLinkNote=="string"?t.incidentsLinkNote:"Les incidents affichés suivent le filtre site global (comme le module Incidents).",n=$t(e.meta),i=ft(e.meta),o=n?yd(n.tier):vd(e.tone),{main:s,mesures:c}=kd(e.detail),l=document.createElement("tr");l.className=`risk-register-table-row risk-register-table-row--${o}`;const d=document.createElement("td");d.className="risk-register-table-row__name";const u=document.createElement("strong");u.className="risk-register-table-row__title",u.textContent=e.title||"Sans titre",d.append(u);const p=document.createElement("td");p.className="risk-register-table-row__crit",n?p.innerHTML=`<span class="risk-register-table-row__crit-label">${n.label}</span><span class="risk-register-table-row__crit-score" title="Score G×P">×${n.product}</span>`:p.innerHTML=`<span class="risk-register-table-row__crit-na">${tt(e.meta)}</span>`;const g=document.createElement("td");g.className="risk-register-table-row__gp",g.textContent=i?`G${i.g}×P${i.p}`:"—";const m=document.createElement("td");m.className="risk-register-table-row__status";const b=document.createElement("span");b.className=`badge ${o} risk-register-table-row__badge`,b.textContent=e.status||"—",m.append(b);const y=document.createElement("td");y.className="risk-register-table-row__owner",y.textContent=tt(e.responsible);const v=document.createElement("td");v.className="risk-register-table-row__action";const h=e.actionLinked;if(h&&typeof h=="object"){v.innerHTML=`<span class="risk-register-table-row__act-ref">${tt(h.ref)}</span><span class="risk-register-table-row__act-meta">${tt(h.status)} · ${tt(h.due)}</span><span class="risk-register-table-row__act-owner">${tt(h.owner)}</span>`;const A=document.createElement("button");A.type="button",A.className="risk-register-table-row__act-nav",A.textContent="Actions",A.title="Ouvrir le module Plan d’actions",A.addEventListener("click",I=>{I.stopPropagation(),window.location.hash="actions"}),v.append(A)}else{v.innerHTML='<span class="risk-register-table-row__act-none">—</span>';const A=document.createElement("span");A.className="risk-register-table-row__act-hint",A.textContent="À lier",v.append(A)}const k=h&&typeof h=="object"?`${tt(h.ref)} · ${tt(h.status)} · ${tt(h.owner)}`:"Sans action liée";l.title=`${e.title||"Risque"} — ${k}`,l.append(d,p,g,m,y,v);const _=document.createElement("tr");_.className="risk-register-table-row--detail";const f=document.createElement("td");f.colSpan=6,f.className="risk-register-table-row__detail-cell";const E=document.createElement("div");E.className="risk-detail-premium";function w(A,I,z){const R=document.createElement("section");R.className="risk-detail-premium__section";const V=document.createElement("h4");V.className="risk-detail-premium__section-title",V.textContent=A;const oe=document.createElement("div");oe.className="risk-detail-premium__section-body";const ge=typeof I=="string"?I.trim():"";if(ge)oe.textContent=ge;else{const B=document.createElement("p");B.className="risk-detail-premium__empty",B.textContent=z||"Non renseigné — à compléter.",oe.append(B)}return R.append(V,oe),R}E.append(w("Informations",s,"Aucune description détaillée."),w("Causes",e.causes!=null?String(e.causes):"","Causes non structurées — compléter la fiche."),w("Impacts",e.impacts!=null?String(e.impacts):"","Impacts non structurés — compléter la fiche."));const x=document.createElement("section");x.className="risk-detail-premium__section";const S=document.createElement("h4");S.className="risk-detail-premium__section-title",S.textContent="Actions liées";const N=document.createElement("div");if(N.className="risk-detail-premium__section-body",h&&typeof h=="object"){N.innerHTML=`<p class="risk-detail-premium__action-line"><strong>${tt(h.ref)}</strong> — ${tt(h.status)} · échéance ${tt(h.due)} · pilote ${tt(h.owner)}</p>`;const A=document.createElement("button");A.type="button",A.className="risk-detail-premium__nav-btn",A.textContent="Ouvrir le module Actions",A.addEventListener("click",I=>{I.stopPropagation(),window.location.hash="actions"}),N.append(A)}else{const A=document.createElement("p");A.className="risk-detail-premium__empty",A.textContent="Aucune action liée au registre actions.",N.append(A)}if(c){const A=document.createElement("pre");A.className="risk-detail-premium__mesures",A.textContent=c,N.append(A)}x.append(S,N),E.append(x);const L=document.createElement("section");L.className="risk-detail-premium__section";const D=document.createElement("h4");D.className="risk-detail-premium__section-title",D.textContent="Incidents liés";const q=document.createElement("div");if(q.className="risk-detail-premium__section-body",a.length===0){const A=document.createElement("p");A.className="risk-detail-premium__empty",A.textContent="Aucun incident lié : à la déclaration, utiliser « Associer à un risque du registre (optionnel) » dans le module Incidents.",q.append(A)}else{const A=document.createElement("ul");A.className="risk-detail-premium__inc-list",a.forEach(I=>{const z=document.createElement("li");z.className="risk-detail-premium__inc-item",z.innerHTML=`<span class="risk-detail-premium__inc-ref">${tt(I.ref)}</span> <span class="risk-detail-premium__inc-meta">${tt(I.type)} · ${tt(I.status)} · ${tt(I.date)}</span>`,A.append(z)}),q.append(A)}const W=document.createElement("p");W.className="risk-detail-premium__scope-note",W.textContent=r,q.append(W),L.append(D,q),E.append(L),f.append(E),_.append(f),l.addEventListener("click",()=>{_.hidden=!_.hidden,l.classList.toggle("risk-register-table-row--open",!_.hidden)}),_.hidden=!0;const K=document.createDocumentFragment();return K.append(l,_),K}const to="qhse-pilotage-module-styles",wd=`
/* —— Page Risques : structure & blocs —— */
.risks-page{display:flex;flex-direction:column;gap:1.5rem}
.risks-page__kpi{
  padding:16px 18px;
  border-radius:16px;
  border:1px solid rgba(255,255,255,.08);
  background:linear-gradient(165deg,rgba(255,255,255,.045) 0%,rgba(255,255,255,.02) 100%);
  box-shadow:0 1px 0 rgba(255,255,255,.04) inset;
}
[data-theme='dark'] .risks-page__kpi{
  border-color:rgba(240,246,252,.1);
  background:linear-gradient(165deg,rgba(30,38,52,.65) 0%,rgba(18,24,32,.5) 100%);
}
.risks-page__insights{
  padding:18px 20px 20px;
  border-radius:16px;
  border:1px solid rgba(255,255,255,.08);
  background:linear-gradient(165deg,rgba(255,255,255,.04) 0%,rgba(255,255,255,.015) 100%);
  box-shadow:0 1px 0 rgba(255,255,255,.04) inset;
  min-width:0;
}
[data-theme='dark'] .risks-page__insights{
  border-color:rgba(240,246,252,.1);
  background:linear-gradient(165deg,rgba(28,36,48,.55) 0%,rgba(16,22,30,.45) 100%);
}
.risks-insights__head{
  display:flex;
  flex-wrap:wrap;
  align-items:flex-start;
  justify-content:space-between;
  gap:16px 24px;
  margin-bottom:18px;
}
.risks-insights__intro{min-width:0;flex:1;max-width:52ch}
.risks-insights__title{margin:4px 0 6px;font-size:1.1rem;font-weight:800;letter-spacing:-.02em;line-height:1.25;color:var(--text)}
.risks-insights__lead{margin:0;font-size:12.5px;line-height:1.5;color:var(--text2)}
.risks-insights__kpi-inline{display:flex;flex-wrap:wrap;gap:10px}
.risks-insights__kpi-item{
  min-width:140px;
  padding:10px 14px;
  border-radius:12px;
  border:1px solid rgba(255,255,255,.08);
  background:rgba(0,0,0,.12);
  display:flex;
  flex-direction:column;
  gap:2px;
}
.risks-insights__kpi-item--alert{border-color:rgba(239,91,107,.22);background:rgba(239,91,107,.06)}
.risks-insights__kpi-value{font-size:22px;font-weight:800;font-variant-numeric:tabular-nums;line-height:1;color:var(--text)}
.risks-insights__kpi-item--alert .risks-insights__kpi-value{color:#fca5a5}
.risks-insights__kpi-label{font-size:11px;font-weight:800;color:var(--text)}
.risks-insights__kpi-hint{font-size:10px;color:var(--text3);line-height:1.3}
.risks-insights__bar-wrap{margin-bottom:16px}
.risks-insights__bar{
  display:flex;
  height:8px;
  border-radius:999px;
  overflow:hidden;
  background:rgba(255,255,255,.06);
  border:1px solid rgba(255,255,255,.06);
}
.risks-insights__bar-seg{min-width:0;transition:width .25s ease}
.risks-insights__bar-seg--crit{background:linear-gradient(90deg,rgba(239,91,107,.85),rgba(239,91,107,.55))}
.risks-insights__bar-seg--elev{background:linear-gradient(90deg,rgba(243,179,79,.9),rgba(243,179,79,.55))}
.risks-insights__bar-seg--mod{background:linear-gradient(90deg,rgba(34,196,131,.75),rgba(77,160,255,.45))}
.risks-insights__bar-seg--empty{background:rgba(255,255,255,.04)}
.risks-insights__bar-legend{
  display:flex;
  flex-wrap:wrap;
  gap:12px 18px;
  margin-top:10px;
  font-size:11px;
  color:var(--text2);
}
.risks-insights__bar-legend strong{font-weight:800;color:var(--text)}
.risks-insights__dot{
  display:inline-block;
  width:8px;height:8px;border-radius:99px;
  margin-right:6px;vertical-align:middle;
}
.risks-insights__dot--crit{background:rgba(239,91,107,.85)}
.risks-insights__dot--elev{background:rgba(243,179,79,.85)}
.risks-insights__dot--mod{background:rgba(34,196,131,.75)}
.risks-insights__tier-row{
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  gap:10px 14px;
  margin-bottom:16px;
  padding-bottom:16px;
  border-bottom:1px solid rgba(255,255,255,.06);
}
.risks-insights__tier-label{
  font-size:10px;
  font-weight:800;
  letter-spacing:.1em;
  text-transform:uppercase;
  color:var(--text3);
}
.risks-insights__tier-pills{display:flex;flex-wrap:wrap;gap:8px}
.risks-tier-pill{
  font-family:inherit;
  font-size:11px;
  font-weight:700;
  padding:7px 12px;
  border-radius:999px;
  border:1px solid rgba(255,255,255,.12);
  background:rgba(255,255,255,.04);
  color:var(--text2);
  cursor:pointer;
  transition:background .15s ease,border-color .15s ease,color .15s ease,box-shadow .15s ease;
}
.risks-tier-pill:hover{
  background:rgba(255,255,255,.09);
  border-color:rgba(255,255,255,.18);
  color:var(--text);
}
.risks-tier-pill--active{
  background:rgba(77,160,255,.12);
  border-color:rgba(77,160,255,.35);
  color:#bae6fd;
  box-shadow:0 0 0 1px rgba(77,160,255,.2);
}
.risks-insights__top-title{
  font-size:10px;
  font-weight:800;
  letter-spacing:.1em;
  text-transform:uppercase;
  color:var(--text3);
  margin-bottom:10px;
}
.risks-insights__top-list{
  margin:0;
  padding:0;
  list-style:none;
  display:flex;
  flex-direction:column;
  gap:8px;
}
.risks-insights__top-item,.risks-insights__top-empty{
  display:flex;
  align-items:flex-start;
  gap:12px;
  padding:10px 12px;
  border-radius:12px;
  border:1px solid rgba(255,255,255,.07);
  background:rgba(0,0,0,.1);
}
.risks-insights__top-empty{font-size:12px;color:var(--text2);line-height:1.45}
.risks-insights__top-rank{
  flex-shrink:0;
  width:22px;height:22px;
  border-radius:8px;
  display:grid;
  place-items:center;
  font-size:11px;
  font-weight:800;
  background:rgba(255,255,255,.08);
  color:var(--text2);
}
.risks-insights__top-main{min-width:0;flex:1;display:flex;flex-direction:column;gap:2px}
.risks-insights__top-name{font-size:13px;font-weight:700;color:var(--text);line-height:1.35}
.risks-insights__top-sub{font-size:11px;color:var(--text3);line-height:1.35}
.risks-page__active-filters{
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  gap:10px 14px;
  margin-bottom:14px;
  padding:10px 14px;
  border-radius:12px;
  border:1px solid rgba(77,160,255,.22);
  background:rgba(77,160,255,.06);
}
.risks-page__active-filters-label{
  font-size:10px;
  font-weight:800;
  letter-spacing:.08em;
  text-transform:uppercase;
  color:#5eead4;
}
.risks-page__active-filters-actions{display:flex;flex-wrap:wrap;gap:8px}
.risks-page__active-filters-btn{font-size:11px!important;font-weight:700!important;padding:6px 12px!important;min-height:34px!important}
.risks-page__active-filters-btn--ghost{border-style:dashed;opacity:.95}
.risks-page__matrix-section{margin:0;min-width:0}
.risks-matrix-details{
  border-radius:14px;
  border:1px solid rgba(255,255,255,.08);
  background:rgba(0,0,0,.1);
  overflow:hidden;
  box-shadow:0 1px 0 rgba(255,255,255,.03) inset;
}
[data-theme='dark'] .risks-matrix-details{
  border-color:rgba(240,246,252,.1);
  background:linear-gradient(180deg,rgba(22,28,38,.5) 0%,rgba(14,18,24,.4) 100%);
}
.risks-matrix-details__summary{
  list-style:none;
  cursor:pointer;
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  gap:8px 14px;
  padding:12px 16px;
  user-select:none;
  transition:background .15s ease;
}
.risks-matrix-details__summary::-webkit-details-marker{display:none}
.risks-matrix-details__summary::marker{content:''}
.risks-matrix-details__summary:hover{background:rgba(255,255,255,.04)}
.risks-matrix-details__summary-title{
  font-size:13px;
  font-weight:800;
  color:var(--text);
  letter-spacing:-.01em;
}
.risks-matrix-details__summary-meta{font-size:12px;font-weight:600;color:var(--text2)}
.risks-matrix-details__summary-warn{color:#fcd34d;font-weight:700}
.risks-matrix-details__summary-hint{
  margin-left:auto;
  font-size:11px;
  font-weight:600;
  color:var(--text3);
}
.risks-matrix-details__summary-pill{
  margin-left:auto;
  font-size:11px;
  font-weight:700;
  padding:4px 10px;
  border-radius:999px;
  background:rgba(77,160,255,.15);
  border:1px solid rgba(77,160,255,.3);
  color:#bae6fd;
}
@media (max-width:640px){
  .risks-matrix-details__summary-hint,.risks-matrix-details__summary-pill{margin-left:0}
}
.risks-matrix-details__summary::after{
  content:'';
  width:7px;height:7px;
  margin-left:4px;
  border-right:2px solid var(--text3);
  border-bottom:2px solid var(--text3);
  transform:rotate(45deg);
  transition:transform .2s ease;
  flex-shrink:0;
}
.risks-matrix-details[open] > .risks-matrix-details__summary::after{
  transform:rotate(-135deg);
  margin-top:4px;
}
.risks-matrix-details__body{
  padding:0 14px 16px;
  border-top:1px solid rgba(255,255,255,.06);
}
.risks-page__panel{
  display:flex;
  flex-direction:column;
  gap:0;
  min-width:0;
}
.risks-page__panel.content-card{padding-bottom:22px}
.risks-page__panel--register{min-height:0}
.risks-page__panel-head.content-card-head{margin-bottom:0;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,.07)}
.risks-page__panel-head.content-card-head--split{align-items:flex-start;gap:14px 18px}
.risks-page__panel-intro{min-width:0;flex:1}
.risks-page__panel-intro h3{margin:4px 0 8px;font-size:1.25rem;font-weight:800;letter-spacing:-.02em;line-height:1.25}
.risks-page__panel-lead{margin:0;max-width:58ch;font-size:13px;line-height:1.55;color:var(--text2)}
.risks-page__list-region{
  flex:1;
  min-height:0;
  margin-top:18px;
  display:flex;
  flex-direction:column;
  min-width:0;
  overflow-x:auto;
  -webkit-overflow-scrolling:touch;
}
.risks-page__list-empty{
  padding:28px 20px;
  text-align:center;
  border-radius:14px;
  border:1px dashed rgba(255,255,255,.12);
  background:rgba(0,0,0,.12);
}
.risks-page__list-empty-title{margin:0 0 8px;font-size:15px;font-weight:800;color:var(--text)}
.risks-page__list-empty-sub{margin:0;font-size:13px;line-height:1.5;color:var(--text2);max-width:42ch;margin-inline:auto}
.risks-page__matrix-shell{
  margin-top:6px;
  padding:0;
  min-width:0;
}
.risks-page__matrix-shell .risk-matrix-grid{max-width:100%;width:100%}
.qhse-kpi-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}
.qhse-kpi-strip .metric-card{padding:14px 16px}
.qhse-kpi-strip .metric-value{font-size:28px}
.content-card-head--split{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap}
.content-card-lead{margin:0;font-size:13px;line-height:1.5;color:var(--text2)}
.content-card-lead--narrow{max-width:52ch}
.content-card-head--split .content-card-lead{max-width:56ch}
.content-card-head--split .content-card-lead--narrow{max-width:52ch}
.btn--pilotage-cta{white-space:nowrap;min-height:44px;font-weight:800}
.kanban-board--pilotage{
  margin-top:8px;
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:16px;
  align-items:start;
}
@media (max-width:1280px){
  .kanban-board--pilotage{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:700px){
  .kanban-board--pilotage{grid-template-columns:1fr}
}
.kanban-column--pilotage{
  background:rgba(255,255,255,.025);
  border-radius:14px;
  border:1px solid rgba(255,255,255,.08);
  padding:14px 12px 16px;
  min-height:140px;
  box-shadow:0 1px 0 rgba(255,255,255,.04) inset;
}
.kanban-column-head{margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,.06)}
.kanban-column-title{margin:0 0 4px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--text);font-weight:800}
.kanban-column-hint{margin:0;font-size:11px;color:var(--text3);line-height:1.4;max-width:36ch}
.kanban-column--todo{border-top:3px solid rgba(77,160,255,.55)}
.kanban-column--doing{border-top:3px solid rgba(243,179,79,.6)}
.kanban-column--overdue{border-top:3px solid var(--color-warning-border)}
.kanban-column--done{border-top:3px solid rgba(34,196,131,.55)}
.action-card{border-left:3px solid transparent;border-radius:12px}
.action-card--todo,.action-card--col-todo{border-left-color:rgba(77,160,255,.55)}
.action-card--doing,.action-card--col-doing{border-left-color:rgba(243,179,79,.55)}
.action-card--overdue,.action-card--col-overdue{border-left-color:var(--color-warning-border)}
.action-card--done,.action-card--col-done{border-left-color:rgba(34,196,131,.5)}
.action-card--v2{
  padding:12px 12px 10px;
  margin-bottom:10px;
  background:rgba(0,0,0,.18);
  border:1px solid rgba(255,255,255,.07);
  border-left-width:3px;
}
.action-card--v2:last-child{margin-bottom:0}
.action-card__top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px}
.action-card__title{
  margin:0;
  font-size:14px;
  font-weight:800;
  line-height:1.35;
  letter-spacing:-.01em;
  color:var(--text);
  flex:1;
  min-width:0;
}
.action-card__prio{
  flex-shrink:0;
  font-size:10px;
  font-weight:800;
  letter-spacing:.04em;
  text-transform:uppercase;
  padding:4px 8px;
  border-radius:8px;
  border:1px solid rgba(255,255,255,.1);
  background:rgba(255,255,255,.06);
  color:var(--text2);
}
.action-card__prio--danger{border-color:rgba(239,91,107,.35);background:rgba(239,91,107,.12);color:#fecaca}
.action-card__prio--warn{border-color:rgba(243,179,79,.35);background:rgba(243,179,79,.12);color:#fde68a}
.action-card__prio--info{border-color:rgba(77,160,255,.35);background:rgba(77,160,255,.1);color:#bae6fd}
.action-card__prio--neutral{border-color:rgba(148,163,184,.2);background:rgba(255,255,255,.04);color:var(--text3)}
.action-card__prio--ok{border-color:rgba(34,196,131,.35);background:rgba(34,196,131,.12);color:#a7f3d0}
.action-card__status{
  display:inline-block;
  font-size:10px;
  font-weight:800;
  letter-spacing:.06em;
  text-transform:uppercase;
  padding:4px 10px;
  border-radius:999px;
  margin-bottom:10px;
  border:1px solid rgba(255,255,255,.1);
  color:var(--text2);
}
.action-card__status--todo{background:rgba(77,160,255,.1);color:#bae6fd}
.action-card__status--doing{background:rgba(243,179,79,.12);color:#fde68a}
.action-card__status--overdue{background:var(--color-warning-bg);color:var(--color-text-warning);border-color:var(--color-warning-border)}
.action-card__status--done{background:rgba(34,196,131,.12);color:#a7f3d0}
.action-card__meta{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
.action-card__meta-row{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:12px;line-height:1.35}
.action-card__meta-k{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);flex-shrink:0}
.action-card__meta-v{color:var(--text2);text-align:right;min-width:0;word-break:break-word}
.action-card__meta-v--late{color:var(--color-text-warning);font-weight:800}
.action-card__quick{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
.action-card__quick-btn{
  font-family:inherit;
  font-size:11px;
  font-weight:700;
  padding:6px 10px;
  border-radius:8px;
  border:1px solid rgba(255,255,255,.12);
  background:rgba(255,255,255,.05);
  color:var(--text);
  cursor:pointer;
  transition:background .15s ease,border-color .15s ease;
}
.action-card__quick-btn:hover{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.18)}
.action-card__quick-btn:disabled{opacity:.45;cursor:not-allowed}
.action-card__quick-btn--primary{border-color:var(--color-primary-border);background:var(--color-primary-bg);color:var(--color-primary-text)}
.action-card__assign-wrap{margin-top:10px;padding-top:10px;border-top:1px dashed rgba(255,255,255,.08)}
.action-card__assign-label{display:block;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);margin-bottom:4px}
.action-card__field{font-size:12px;color:var(--text2);margin-bottom:6px}
.action-card__label{display:block;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);margin-bottom:2px}
.action-card__value{display:block;margin-top:2px}
.action-card__field--due .action-card__value{font-size:13px;font-weight:800;color:var(--text)}
.action-card__assign-select{width:100%;margin-top:0;padding:8px 10px;font-size:12px;font-weight:600;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.25);color:var(--text)}
.action-detail-dialog{
  border:none;
  border-radius:18px;
  padding:0;
  max-width:min(520px,94vw);
  background:var(--surface,#151821);
  color:var(--text);
  box-shadow:0 24px 80px rgba(0,0,0,.45);
}
.action-detail-dialog::backdrop{background:rgba(0,0,0,.55);backdrop-filter:blur(4px)}
.action-detail-dialog__inner{padding:22px 22px 18px;max-height:min(88vh,720px);overflow-y:auto}
.action-detail-dialog__head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}
.action-detail-dialog__title{margin:0;font-size:1.15rem;font-weight:800;letter-spacing:-.02em;line-height:1.25;flex:1;min-width:0}
.action-detail-dialog__badges{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
.action-detail-dialog__pill{
  font-size:10px;
  font-weight:800;
  letter-spacing:.05em;
  text-transform:uppercase;
  padding:4px 10px;
  border-radius:999px;
  border:1px solid rgba(255,255,255,.12);
}
.action-detail-dialog__pill--danger{background:rgba(239,91,107,.15);color:#fecaca;border-color:rgba(239,91,107,.3)}
.action-detail-dialog__pill--warn{background:rgba(243,179,79,.15);color:#fde68a;border-color:rgba(243,179,79,.3)}
.action-detail-dialog__pill--info{background:rgba(77,160,255,.12);color:#bae6fd;border-color:rgba(77,160,255,.28)}
.action-detail-dialog__pill--ok{background:rgba(34,196,131,.12);color:#a7f3d0;border-color:rgba(34,196,131,.28)}
.action-detail-dialog__grid{
  display:grid;
  grid-template-columns:auto 1fr;
  gap:6px 14px;
  font-size:13px;
  margin:0 0 16px;
}
.action-detail-dialog__grid dt{margin:0;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.action-detail-dialog__grid dd{margin:0;color:var(--text2);word-break:break-word}
.action-detail-dialog__id{font-size:12px;font-weight:600;color:var(--text)}
.action-detail-dialog__api code{font-size:11px;word-break:break-all;color:var(--text3)}
.action-detail-dialog__block{margin-bottom:16px}
.action-detail-dialog__block-label{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);margin-bottom:6px}
.action-detail-dialog__detail{margin:0;font-size:13px;line-height:1.5;color:var(--text2);white-space:pre-wrap}
.action-detail-dialog__foot{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;padding-top:4px;border-top:1px solid rgba(255,255,255,.06)}
.actions-filter-toolbar{margin-top:12px;display:flex;flex-wrap:wrap;gap:10px 16px;align-items:flex-end}
.actions-filter-toolbar .actions-filter-group{display:flex;flex-direction:column;gap:4px;min-width:min(200px,100%)}
.actions-filter-toolbar label{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3)}
.actions-filter-toolbar select{padding:8px 10px;font-size:12px;font-weight:600;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.25);color:var(--text);min-width:180px;max-width:100%}

/* —— Plan d’actions premium : KPI, filtres compacts, Kanban aéré, cartes menu ⋯ —— */
.page-stack--actions-premium{gap:1.35rem}
.actions-page__main-card{padding:20px 22px 26px}
.actions-page__kpi-host{margin-top:12px}
.actions-page__summary{
  margin:12px 0 0;
  font-size:13px;
  line-height:1.45;
  color:var(--text2);
  max-width:62ch;
}
.actions-page__kpi-host .qhse-kpi-strip{grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
@media (max-width:1100px){
  .actions-page__kpi-host .qhse-kpi-strip{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:520px){
  .actions-page__kpi-host .qhse-kpi-strip{grid-template-columns:1fr}
}
.actions-page__kpi-host .metric-card{padding:12px 14px;border-radius:14px}
.actions-page__kpi-host .qhse-kpi-strip > .metric-card:first-child{
  box-shadow:0 0 0 1px rgba(248,113,113,.35),0 6px 20px rgba(220,38,38,.12);
}
.actions-page__kpi-host .metric-value{font-size:24px}
.actions-page__kpi-host .metric-note{font-size:10px;line-height:1.35;margin-top:4px}
.actions-filter-toolbar--premium{
  margin-top:16px;
  flex-wrap:nowrap;
  align-items:center;
  gap:8px 12px;
  padding:10px 12px;
  border-radius:12px;
  border:1px solid rgba(255,255,255,.08);
  background:rgba(0,0,0,.14);
}
.actions-filter-toolbar--premium .actions-filter-group{
  flex:1 1 0;
  min-width:0;
  flex-direction:row;
  align-items:center;
  gap:8px;
  margin:0;
}
.actions-filter-toolbar--premium label{
  flex-shrink:0;
  margin:0;
  white-space:nowrap;
}
.actions-filter-toolbar--premium select{
  flex:1;
  min-width:0;
  max-width:none;
  padding:7px 10px;
  font-size:12px;
}
@media (max-width:900px){
  .actions-filter-toolbar--premium{flex-wrap:wrap}
  .actions-filter-toolbar--premium .actions-filter-group{flex:1 1 calc(50% - 8px)}
}
@media (max-width:520px){
  .actions-filter-toolbar--premium .actions-filter-group{flex:1 1 100%}
}
.actions-page__board-host{margin-top:18px}

.kanban-board--pilotage-premium{margin-top:8px;gap:16px}
.kanban-column--pilotage-premium{
  padding:12px 12px 14px;
  border-radius:12px;
  min-height:120px;
}
.kanban-column--pilotage-premium .kanban-column-head{
  margin-bottom:10px;
  padding-bottom:8px;
}
.kanban-column--pilotage-premium .kanban-column-title{font-size:10px}
.kanban-column--pilotage-premium .kanban-column-hint{
  font-size:11px;
  line-height:1.4;
  color:var(--text3);
  margin:6px 0 0;
  max-width:none;
  display:-webkit-box;
  -webkit-line-clamp:2;
  -webkit-box-orient:vertical;
  overflow:hidden;
}
.kanban-column-empty{
  margin:0;
  padding:10px 8px 4px;
  font-size:12px;
  line-height:1.45;
  color:var(--text3);
  font-style:italic;
}
.kanban-column--pilotage-premium.kanban-column--overdue{
  border-color:rgba(239,91,107,.28);
  box-shadow:inset 0 0 0 1px rgba(239,91,107,.1),0 4px 20px rgba(220,38,38,.08);
}

.action-card--premium{
  padding:11px 11px 10px;
  margin-bottom:10px;
  cursor:pointer;
  transition:transform .18s ease,box-shadow .2s ease,border-color .2s ease,background .2s ease;
}
.action-card--premium:hover{
  transform:translateY(-2px);
  box-shadow:0 10px 28px rgba(0,0,0,.28);
  border-color:rgba(255,255,255,.12);
  background:rgba(255,255,255,.04);
}
.action-card--premium.action-card--critical-accent{
  border-color:rgba(251,113,133,.45)!important;
  box-shadow:0 0 0 1px rgba(251,113,133,.2),0 4px 22px rgba(220,38,38,.2);
}
.action-card--premium.action-card--critical-accent:hover{
  box-shadow:0 0 0 1px rgba(251,113,133,.35),0 12px 32px rgba(220,38,38,.25);
}
.action-card--premium.action-card--dnd-ready{cursor:pointer}
.action-card--premium.action-card--dnd-ready:active{cursor:pointer}

.action-card__premium-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px}
.action-card--premium .action-card__title{font-size:13px;line-height:1.3;margin:0}

.action-card__menu{position:relative;flex-shrink:0}
.action-card__menu-trigger{
  display:grid;place-items:center;
  width:30px;height:30px;padding:0;margin:0;
  border-radius:9px;
  border:1px solid rgba(255,255,255,.1);
  background:rgba(0,0,0,.2);
  color:var(--text2);
  font-size:18px;line-height:1;
  font-weight:700;
  cursor:pointer;
  transition:background .15s ease,border-color .15s ease,color .15s ease;
}
.action-card__menu-trigger:hover{background:rgba(255,255,255,.08);color:var(--text);border-color:rgba(255,255,255,.16)}
.action-card__menu-panel{
  position:absolute;
  top:100%;right:0;margin-top:4px;
  min-width:188px;
  padding:6px;
  border-radius:12px;
  border:1px solid rgba(255,255,255,.12);
  background:linear-gradient(165deg,rgba(22,26,38,.98),rgba(15,18,28,.97));
  box-shadow:0 16px 40px rgba(0,0,0,.45);
  z-index:20;
}
.action-card__menu-item{
  display:block;width:100%;
  text-align:left;
  font-family:inherit;font-size:12px;font-weight:600;
  padding:8px 10px;margin:0;
  border:none;border-radius:8px;
  background:transparent;color:var(--text);
  cursor:pointer;
  transition:background .12s ease;
}
.action-card__menu-item:hover:not(:disabled){background:rgba(255,255,255,.08)}
.action-card__menu-item:disabled{opacity:.45;cursor:not-allowed}
.action-card__menu-assign{
  margin-top:6px;padding-top:8px;
  border-top:1px solid rgba(255,255,255,.08);
}
.action-card__menu-assign-label{font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);margin-bottom:4px}
.action-card__menu-assign-select{
  width:100%;padding:7px 8px;font-size:11px;font-weight:600;
  border-radius:8px;border:1px solid rgba(255,255,255,.12);
  background:rgba(0,0,0,.3);color:var(--text);
}

.action-card__premium-meta{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
  margin-bottom:5px;
  min-width:0;
  padding:5px 0 2px;
  border-top:1px solid rgba(255,255,255,.06);
}
.action-card__premium-meta .action-card__status{
  margin-bottom:0;
  flex:0 1 auto;
  min-width:0;
  max-width:56%;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  font-size:9px;
  padding:3px 8px;
}
.action-card__due-compact{
  display:flex;
  align-items:center;
  justify-content:flex-end;
  gap:5px;
  flex-shrink:0;
  max-width:44%;
  font-size:11px;
  font-weight:700;
  color:var(--text2);
  font-variant-numeric:tabular-nums;
}
.action-card__due-compact-date{white-space:nowrap}
.action-card__due-compact--late .action-card__due-compact-date{
  color:var(--color-text-warning);
  font-weight:800;
}
.action-card__due-badge--mini{
  flex-shrink:0;
  font-size:8px;
  font-weight:800;
  letter-spacing:.04em;
  text-transform:uppercase;
  padding:2px 6px;
  border-radius:999px;
  background:rgba(239,91,107,.28);
  color:#fecaca;
  border:1px solid rgba(239,91,107,.45);
}

.action-card--late-strong .action-card__due-compact--late .action-card__due-compact-date{
  text-decoration:underline;
  text-underline-offset:2px;
}

.action-card__owner-lite{
  margin:0;
  font-size:11px;font-weight:600;color:var(--text3);
  line-height:1.35;
  padding-left:1px;
}
.action-card__owner-lite::before{
  content:'Resp. ';
  font-weight:700;
  color:var(--text3);
  opacity:.75;
}

@media (prefers-reduced-motion:reduce){
  .action-card--premium{transition:none}
  .action-card--premium:hover{transform:none}
}

.risk-register-row{
  border-radius:14px;
  border:1px solid rgba(255,255,255,.08);
  background:rgba(255,255,255,.035);
  padding:16px 18px;
  border-left-width:4px;
  border-left-style:solid;
  transition:background .15s ease,border-color .15s ease,box-shadow .15s ease;
}
.risk-register-row:hover{
  background:rgba(255,255,255,.055);
  border-color:rgba(255,255,255,.11);
  box-shadow:0 4px 20px rgba(0,0,0,.12);
}
.risk-register-row--red{border-left-color:rgba(239,91,107,.45)}
.risk-register-row--amber{border-left-color:rgba(243,179,79,.45)}
.risk-register-row--blue{border-left-color:rgba(77,160,255,.45)}
.risk-register-row__head{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:10px}
.risk-register-row__title{font-size:15px;line-height:1.3}
.risk-register-row__badge{font-size:11px;font-weight:800}
.risk-register-row__crit{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.07)}
.risk-register-row__gp{font-size:13px;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:.02em;color:var(--text)}
.risk-register-row__score{font-size:11px;font-weight:700;padding:4px 9px;border-radius:999px;background:rgba(255,255,255,.08);color:var(--text2)}
.risk-register-row__tier-chip{font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:4px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.12)}
.risk-register-row__tier-chip--t1,.risk-register-row__tier-chip--t2{background:rgba(34,196,131,.15);color:#b6f0d2}
.risk-register-row__tier-chip--t3{background:rgba(243,179,79,.22);color:#fde68a}
.risk-register-row__tier-chip--t4{background:rgba(255,144,70,.22);color:#fed7aa}
.risk-register-row__tier-chip--t5{background:rgba(239,91,107,.22);color:#fecaca}
.risk-register-row__crit-fallback{font-size:12px;font-weight:600;color:var(--text2)}
.risk-register-row__crit-hint{font-size:11px;color:var(--text3);line-height:1.4;flex:1 1 100%}
.risk-register-row__desc{margin:10px 0 0;font-size:13px;line-height:1.45;color:var(--text2)}
.risks-create-dialog{border:none;border-radius:18px;padding:0;max-width:min(560px,94vw);background:var(--surface,#151821);color:var(--text);box-shadow:0 24px 80px rgba(0,0,0,.45)}
.risks-create-dialog::backdrop{background:rgba(0,0,0,.55);backdrop-filter:blur(4px)}
.risks-create-dialog__inner{padding:22px 22px 18px;max-height:min(88vh,720px);overflow-y:auto;-webkit-overflow-scrolling:touch}
.risks-create-dialog__head{margin:0 0 6px;font-size:18px;font-weight:800;letter-spacing:-.02em}
.risks-create-dialog__lead{margin:0 0 16px;font-size:13px;line-height:1.45;color:var(--text2);max-width:52ch}
.risks-form-grid{display:grid;gap:12px}
.risks-form-grid label{display:flex;flex-direction:column;gap:5px;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3)}
.risks-form-grid input,.risks-form-grid select,.risks-form-grid textarea{padding:10px 12px;font-size:13px;font-weight:600;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.22);color:var(--text);width:100%;box-sizing:border-box;font-family:inherit}
.risks-form-grid textarea{min-height:88px;resize:vertical;line-height:1.45}
.risks-form-actions-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:14px}
.risks-form-actions-row .btn{min-height:42px}
.risks-ai-panel{margin-top:14px;padding:14px 14px 12px;border-radius:12px;border:1px dashed rgba(77,160,255,.35);background:rgba(77,160,255,.06)}
.risks-ai-panel[hidden]{display:none!important}
.risks-ai-panel__disclaimer{margin:0 0 10px;font-size:11px;line-height:1.4;color:var(--text2);font-weight:600}
.risks-ai-panel__list{margin:0;padding-left:18px;font-size:12px;line-height:1.45;color:var(--text2)}
.risks-ai-panel__list li{margin-bottom:4px}
.risks-ai-panel__kv{display:grid;gap:6px;margin-bottom:10px;font-size:12px}
.risks-ai-panel__kv span{color:var(--text3);font-weight:700;text-transform:uppercase;font-size:10px;letter-spacing:.06em}
.risks-ai-panel__kv strong{color:var(--text);font-weight:700}
.risks-ai-panel__actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.risks-ai-panel--loading{opacity:.72;pointer-events:none}
.risk-matrix-panel{display:flex;flex-direction:column;gap:1.35rem;width:100%}
.risk-matrix-panel--embedded{gap:.95rem}
.risk-matrix-panel--embedded .risk-matrix-tool{
  padding:12px 14px 12px;
  gap:.85rem;
  border-radius:12px;
}
.risk-matrix-panel--embedded .risk-matrix-priority-row{gap:8px}
.risk-matrix-panel--embedded .risk-matrix-priority-card{padding:10px 12px;gap:10px}
.risk-matrix-panel--embedded .risk-matrix-priority-card__value{font-size:18px}
.risk-matrix-panel--embedded .risk-matrix-hotspot-chip{padding:7px 11px;font-size:11px}
.risk-matrix-panel--embedded .risk-matrix-grid{
  gap:6px;
  grid-template-rows:auto repeat(5,minmax(40px,1fr));
}
.risk-matrix-panel--embedded .risk-matrix-cell{min-height:40px;padding:4px;border-radius:10px}
.risk-matrix-panel--embedded .risk-matrix-cell__count{font-size:15px}
.risk-matrix-panel--embedded .risk-matrix-grid__colhead{padding:6px 2px 8px;font-size:11px}
.risk-matrix-panel--embedded .risk-matrix-grid__rowhead{font-size:11px;padding-right:8px}
.risk-matrix-panel--embedded .risk-matrix-legend{padding-top:8px;margin-top:4px}
.risk-matrix-tool{
  display:flex;
  flex-direction:column;
  gap:1.1rem;
  padding:18px 18px 16px;
  border-radius:14px;
  border:1px solid rgba(255,255,255,.1);
  background:rgba(0,0,0,.14);
  box-shadow:0 1px 0 rgba(255,255,255,.04) inset;
}
.risk-matrix-tool__head{margin:0}
.risk-matrix-tool__title{display:block;font-size:13px;font-weight:800;letter-spacing:.02em;margin-bottom:8px;color:var(--text)}
.risk-matrix-tool__lede{margin:0;font-size:12px;line-height:1.55;color:var(--text2);max-width:56ch}
.risk-matrix-priority-row{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(132px,1fr));
  gap:10px;
}
.risk-matrix-priority-card{
  display:flex;
  align-items:flex-start;
  gap:12px;
  padding:12px 14px;
  border-radius:12px;
  border:1px solid rgba(255,255,255,.08);
  background:rgba(255,255,255,.03);
}
.risk-matrix-priority-card__value{
  font-size:22px;
  font-weight:800;
  line-height:1;
  font-variant-numeric:tabular-nums;
  flex-shrink:0;
  min-width:1.5ch;
}
.risk-matrix-priority-card__text{display:flex;flex-direction:column;gap:3px;min-width:0}
.risk-matrix-priority-card__label{font-size:12px;font-weight:800;color:var(--text)}
.risk-matrix-priority-card__hint{font-size:10px;line-height:1.35;color:var(--text3)}
.risk-matrix-priority-card--crit .risk-matrix-priority-card__value{color:#fca5a5}
.risk-matrix-priority-card--crit{border-color:rgba(239,91,107,.25);background:rgba(239,91,107,.06)}
.risk-matrix-priority-card--warn .risk-matrix-priority-card__value{color:#fcd34d}
.risk-matrix-priority-card--warn{border-color:rgba(243,179,79,.22);background:rgba(243,179,79,.06)}
.risk-matrix-priority-card--ok .risk-matrix-priority-card__value{color:#86efac}
.risk-matrix-priority-card--ok{border-color:rgba(34,196,131,.2);background:rgba(34,196,131,.05)}
.risk-matrix-priority-card--muted .risk-matrix-priority-card__value{color:var(--text3)}
.risk-matrix-priority-card--muted{opacity:.92}
.risk-matrix-hotspots-section__label{
  font-size:10px;
  font-weight:800;
  letter-spacing:.1em;
  text-transform:uppercase;
  color:var(--text3);
  margin-bottom:10px;
}
.risk-matrix-hotspots{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-start}
.risk-matrix-hotspots-empty{margin:0;font-size:12px;line-height:1.5;color:var(--text2);max-width:48ch}
.risk-matrix-hotspot-chip{
  display:inline-flex;
  flex-wrap:wrap;
  align-items:baseline;
  gap:6px 10px;
  padding:10px 14px;
  border-radius:999px;
  border:1px solid rgba(255,255,255,.12);
  background:rgba(255,255,255,.06);
  color:var(--text);
  font-family:inherit;
  font-size:12px;
  cursor:pointer;
  transition:background .15s ease,transform .12s ease,box-shadow .15s ease;
  text-align:left;
}
.risk-matrix-hotspot-chip:hover{background:rgba(255,255,255,.1);transform:translateY(-1px)}
.risk-matrix-hotspot-chip--active{
  box-shadow:0 0 0 2px rgba(88,166,255,.65);
  border-color:rgba(88,166,255,.4);
}
.risk-matrix-hotspot-chip__gp{font-weight:800;font-variant-numeric:tabular-nums}
.risk-matrix-hotspot-chip__mid strong{font-size:13px}
.risk-matrix-hotspot-chip__score{font-size:10px;font-weight:700;opacity:.75}
.risk-matrix-hotspot-chip--t1{background:rgba(34,196,131,.12)}
.risk-matrix-hotspot-chip--t2{background:rgba(110,205,100,.14)}
.risk-matrix-hotspot-chip--t3{background:rgba(243,179,79,.16)}
.risk-matrix-hotspot-chip--t4{background:rgba(255,144,70,.18)}
.risk-matrix-hotspot-chip--t5{background:rgba(239,91,107,.18)}
.risk-matrix-status-row{
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  justify-content:space-between;
  gap:10px 14px;
  padding-top:4px;
}
.risk-matrix-panel__stats{margin:0;font-size:12px;font-weight:600;color:var(--text2);line-height:1.45;flex:1;min-width:12rem}
.risk-matrix-panel__reset{font-size:12px;font-weight:700;padding:8px 14px;min-height:40px;white-space:nowrap}
.risk-matrix-grid-wrap{margin-top:4px}
.risk-matrix-grid-wrap__label{
  font-size:11px;
  font-weight:800;
  letter-spacing:.06em;
  text-transform:uppercase;
  color:var(--text3);
  margin-bottom:12px;
}
.risk-matrix-grid-wrap__hint{
  font-weight:600;
  text-transform:none;
  letter-spacing:0;
  color:var(--text3);
  font-size:11px;
}
.risk-matrix-grid{
  display:grid;
  grid-template-columns:minmax(40px,auto) repeat(5,minmax(0,1fr));
  grid-template-rows:auto repeat(5,minmax(56px,1fr));
  gap:10px;
  align-items:stretch;
  width:100%;
  max-width:100%;
}
.risk-matrix-grid__corner{
  grid-column:1;
  grid-row:1;
  display:flex;
  flex-direction:column;
  justify-content:flex-end;
  gap:6px;
  padding:6px 8px 12px 0;
  font-size:10px;
  font-weight:800;
  letter-spacing:.08em;
  color:var(--text3);
  line-height:1.2;
}
.risk-matrix-grid__colhead{
  grid-row:1;
  font-size:12px;
  font-weight:800;
  text-align:center;
  color:var(--text2);
  padding:10px 4px 14px;
  display:flex;
  align-items:flex-end;
  justify-content:center;
}
.risk-matrix-grid__rowhead{
  grid-column:1;
  font-size:12px;
  font-weight:800;
  text-align:right;
  color:var(--text2);
  display:flex;
  align-items:center;
  justify-content:flex-end;
  padding-right:12px;
}
.risk-matrix-cell{
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:4px;
  border:none;
  border-radius:12px;
  font-family:inherit;
  color:var(--text);
  cursor:pointer;
  transition:transform .12s ease,box-shadow .15s ease,opacity .15s ease;
  border:1px solid rgba(255,255,255,.08);
  min-height:56px;
  padding:8px;
}
.risk-matrix-cell__count{font-size:20px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums}
.risk-matrix-cell:focus-visible{outline:2px solid rgba(77,160,255,.75);outline-offset:2px}
.risk-matrix-cell--empty{
  opacity:.28;
  cursor:default;
  border-style:dashed;
  border-color:rgba(255,255,255,.06);
}
.risk-matrix-cell--empty.risk-matrix-cell--active{opacity:.55;cursor:pointer}
.risk-matrix-cell--has-data{cursor:pointer;opacity:1}
.risk-matrix-cell--has-data:hover{
  transform:translateY(-1px);
  box-shadow:0 4px 16px rgba(0,0,0,.22);
  border-color:rgba(255,255,255,.16);
  filter:brightness(1.06);
}
.risk-matrix-panel--embedded .risk-matrix-cell--has-data:hover{transform:translateY(-1px) scale(1.02)}
.risk-matrix-cell--active{
  box-shadow:0 0 0 2px rgba(88,166,255,.75),0 6px 18px rgba(0,0,0,.2);
  z-index:1;
  opacity:1!important;
  border-color:rgba(88,166,255,.4);
}
.risk-matrix-cell--t1{background:rgba(34,196,131,.14)}
.risk-matrix-cell--t2{background:rgba(110,205,100,.16)}
.risk-matrix-cell--t3{background:rgba(243,179,79,.2)}
.risk-matrix-cell--t4{background:rgba(255,144,70,.22)}
.risk-matrix-cell--t5{background:rgba(239,91,107,.24)}
.risk-matrix-legend{margin-top:6px;padding-top:10px;border-top:1px solid rgba(255,255,255,.06)}
.risk-matrix-legend__compact{
  display:inline-flex;
  align-items:center;
  gap:6px;
  font-size:11px;
  color:var(--text3);
}
.risk-matrix-legend__compact-label{margin-right:4px;font-weight:700}
.risk-matrix-legend__sw{
  display:inline-grid;
  place-items:center;
  width:22px;
  height:22px;
  border-radius:6px;
  font-size:9px;
  font-weight:800;
  color:rgba(0,0,0,.75);
}
.risk-matrix-legend__sw--1{background:linear-gradient(148deg,rgba(52,211,153,.88),rgba(34,197,94,.5) 50%,rgba(0,0,0,.2))}
.risk-matrix-legend__sw--2{background:linear-gradient(148deg,rgba(251,191,36,.92),rgba(245,158,11,.52) 48%,rgba(0,0,0,.18))}
.risk-matrix-legend__sw--3{background:linear-gradient(148deg,rgba(129,140,248,.9),rgba(56,189,248,.42) 45%,rgba(30,27,75,.32))}
.risk-matrix-legend__sw--4{background:linear-gradient(148deg,rgba(167,139,250,.88),rgba(249,115,22,.48) 42%,rgba(40,20,30,.28))}
.risk-matrix-legend__sw--5{background:linear-gradient(148deg,rgba(252,165,165,.95),rgba(185,28,28,.72) 38%,rgba(40,10,12,.42));color:#fff;box-shadow:0 0 14px rgba(220,38,38,.4)}

/* —— Risques premium : bandeau, matrice visible, tableau, évolution, preuves, IA —— */
.risks-page--premium{gap:1.25rem}
.risks-pilot-banner-host{margin-bottom:0}
.risks-pilot-banner{
  border-radius:16px;border:1px solid rgba(125,211,252,.2);
  background:linear-gradient(135deg,rgba(56,189,248,.08),rgba(15,23,42,.42));
  box-shadow:0 12px 36px rgba(0,0,0,.2);
}
.risks-pilot-banner__head{margin-bottom:12px}
.risks-pilot-banner__title{margin:4px 0;font-size:clamp(18px,2.2vw,22px);font-weight:800;letter-spacing:-.02em}
.risks-pilot-banner__lead{margin:0;max-width:58ch;font-size:12.5px;line-height:1.45;color:var(--text2)}
.risks-pilot-banner__kpis{
  display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;
}
@media (max-width:900px){.risks-pilot-banner__kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:440px){.risks-pilot-banner__kpis{grid-template-columns:1fr}}
.risks-pilot-banner__kpi{
  padding:10px 12px;border-radius:12px;border:1px solid rgba(148,163,184,.12);
  background:rgba(0,0,0,.12);display:flex;flex-direction:column;gap:2px;min-width:0;
}
.risks-pilot-banner__kpi-val{font-size:22px;font-weight:800;font-variant-numeric:tabular-nums;line-height:1;color:var(--text)}
.risks-pilot-banner__kpi-lbl{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.risks-pilot-banner__kpi-hint{font-size:10px;color:var(--text3);line-height:1.3}

.risks-matrix-card-prominent{
  border-radius:16px;border:1px solid rgba(148,163,184,.14);
  background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(0,0,0,.1));
}
.risks-matrix-card-prominent__lead{max-width:56ch}
.risks-matrix-card-prominent__status{
  margin:0 0 12px;padding:8px 12px;border-radius:10px;border:1px solid rgba(56,189,248,.2);
  background:rgba(56,189,248,.06);font-size:12px;font-weight:600;color:var(--text2);line-height:1.45;
}
.risks-page__matrix-shell--prominent .risk-matrix-panel{width:100%}

.risk-matrix-cell__dots{
  display:flex;flex-wrap:wrap;gap:3px;justify-content:center;align-items:center;max-width:100%;
}
.risk-matrix-cell__dot{
  width:7px;height:7px;border-radius:50%;flex-shrink:0;box-shadow:0 0 0 1px rgba(0,0,0,.2);
}
.risk-matrix-cell__dot--t1{background:#4ade80}
.risk-matrix-cell__dot--t2{background:#86efac}
.risk-matrix-cell__dot--t3{background:#fbbf24}
.risk-matrix-cell__dot--t4{background:#fb923c}
.risk-matrix-cell__dot--t5{background:#f87171}
.risk-matrix-cell__dot-more{font-size:8px;font-weight:800;color:var(--text3);line-height:1}

.risks-priority-premium{margin:0}
.risks-priority-premium__card{padding-bottom:16px}
.risks-priority-premium__lead{max-width:58ch}
.risks-priority-premium__grid{
  display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:4px;
}
@media (max-width:960px){.risks-priority-premium__grid{grid-template-columns:1fr}}
.risks-priority-premium__col{
  padding:10px 12px;border-radius:12px;border:1px solid rgba(148,163,184,.1);background:rgba(0,0,0,.08);min-width:0;
}
.risks-priority-premium__col-title{
  margin:0 0 8px;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);
}
.risks-priority-premium__col-body{display:flex;flex-direction:column;gap:6px}
.risks-priority-premium__empty{margin:0;font-size:12px;color:var(--text3)}
.risks-priority-premium__line{
  display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%;text-align:left;
  padding:8px 10px;border-radius:10px;border:1px solid rgba(148,163,184,.1);background:rgba(0,0,0,.1);
  color:var(--text);font:inherit;cursor:pointer;transition:border-color .15s,background .15s;
}
.risks-priority-premium__line:hover{border-color:rgba(56,189,248,.35);background:rgba(56,189,248,.06)}
.risks-priority-premium__line-title{font-size:13px;font-weight:700;line-height:1.3}
.risks-priority-premium__line-sub{font-size:11px;color:var(--text3);line-height:1.35}

.risks-insights__head--compact .risks-insights__title{font-size:1.05rem}

.risks-evolution-card__lead{max-width:56ch}
.risks-evolution-chart{
  display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px 16px;padding:8px 4px 4px;
  min-height:140px;border-top:1px solid rgba(255,255,255,.06);margin-top:8px;
}
.risks-evolution-chart__row{
  display:flex;flex-direction:column;align-items:center;gap:6px;flex:1;min-width:48px;max-width:72px;
}
.risks-evolution-chart__lbl{font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase}
.risks-evolution-chart__bars{
  display:flex;gap:4px;align-items:flex-end;height:100px;width:100%;justify-content:center;
}
.risks-evolution-chart__bar-wrap{
  display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;flex:1;max-width:22px;height:100%;
}
.risks-evolution-chart__bar{
  display:block;width:100%;min-height:4px;border-radius:4px 4px 2px 2px;align-self:flex-end;
}
.risks-evolution-chart__bar--crit{background:linear-gradient(180deg,rgba(239,91,107,.9),rgba(239,91,107,.45))}
.risks-evolution-chart__bar--avg{background:linear-gradient(180deg,rgba(56,189,248,.85),rgba(56,189,248,.4))}
.risks-evolution-chart__bar-val{font-size:9px;font-weight:800;font-variant-numeric:tabular-nums;color:var(--text2)}
.risks-evolution-chart__legend{
  width:100%;display:flex;flex-wrap:wrap;gap:14px;justify-content:center;margin-top:10px;
  font-size:11px;color:var(--text2);
}
.risks-evolution-chart__dot{
  display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:6px;vertical-align:middle;
}
.risks-evolution-chart__dot--crit{background:rgba(239,91,107,.85)}
.risks-evolution-chart__dot--avg{background:rgba(56,189,248,.8)}

.risks-proofs-card__lead{max-width:52ch}
.risks-proofs-list{margin:0;padding:0;list-style:none;display:grid;gap:8px}
.risks-proofs-item{
  display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 12px;padding:10px 12px;border-radius:11px;
  border:1px solid rgba(148,163,184,.1);background:rgba(0,0,0,.08);font-size:13px;
}
.risks-proofs-item__kind{
  font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:3px 8px;border-radius:999px;
  border:1px solid rgba(52,211,153,.3);color:#86efac;background:rgba(52,211,153,.08);
}
.risks-proofs-item__label{color:var(--text2);line-height:1.4}

.risks-ia-premium{
  border-radius:14px;border:1px solid rgba(77,160,255,.22);
  background:linear-gradient(135deg,rgba(77,160,255,.07),rgba(168,85,247,.05));
}
.risks-ia-premium__lead{max-width:54ch}
.risks-ia-premium__actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
.risks-ia-premium__btn{min-height:40px}

.risks-register-premium-table{
  width:100%;max-width:100%;table-layout:fixed;
  border-collapse:separate;border-spacing:0;margin-top:10px;
  font-size:12px;border-radius:12px;overflow:hidden;border:1px solid rgba(148,163,184,.12);
}
.risks-register-premium-table thead th{
  text-align:left;padding:10px 10px;font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;
  color:var(--text3);background:rgba(0,0,0,.2);border-bottom:1px solid rgba(148,163,184,.1);
  vertical-align:bottom;
}
.risks-register-premium-table thead th:nth-child(3),
.risks-register-premium-table thead th:nth-child(4),
.risks-register-premium-table thead th:nth-child(6){text-align:center}
.risks-register-premium-table tbody td{
  padding:10px 10px;vertical-align:top;border-bottom:1px solid rgba(148,163,184,.06);
  word-break:break-word;overflow-wrap:anywhere;min-width:0;
}
.risks-register-premium-table tbody tr:last-child td{border-bottom:none}
.risk-register-table-row{cursor:pointer;transition:background .12s}
.risk-register-table-row:hover{background:rgba(255,255,255,.04)}
.risk-register-table-row--open{background:rgba(56,189,248,.06)}
.risk-register-table-row--red td{border-left:3px solid rgba(239,91,107,.4)}
.risk-register-table-row--amber td{border-left:3px solid rgba(243,179,79,.35)}
.risk-register-table-row--blue td{border-left:3px solid rgba(77,160,255,.35)}
.risk-register-table-row__name{min-width:0}
.risk-register-table-row__title{
  display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;
  overflow:hidden;font-size:13px;font-weight:700;line-height:1.35;
}
.risk-register-table-row__desc-clamp{
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
  font-size:11px;color:var(--text3);line-height:1.35;
}
.risk-register-table-row__num{text-align:center;font-weight:800;font-variant-numeric:tabular-nums;color:var(--text2)}
.risk-register-table-row__crit{text-align:left}
.risk-register-table-row__crit-label{display:block;font-weight:700;color:var(--text);font-size:12px;line-height:1.25}
.risk-register-table-row__crit-score{display:block;margin-top:3px;font-size:10px;font-weight:700;color:var(--text3)}
.risk-register-table-row__crit-na{font-size:11px;color:var(--text3);line-height:1.3}
.risk-register-table-row__owner{color:var(--text2);line-height:1.35;font-size:11.5px}
.risk-register-table-row__action{min-width:0}
.risk-register-table-row__act-ref{display:block;font-weight:800;font-size:11px;color:var(--text);line-height:1.3}
.risk-register-table-row__act-meta{display:block;font-size:10px;color:var(--text3);margin-top:3px;line-height:1.35}
.risk-register-table-row__status{text-align:center}
.risk-register-table-row__status .risk-register-table-row__badge,
.risk-register-table-row__status .badge{
  display:inline-block;max-width:100%;white-space:normal!important;text-align:center;
  line-height:1.25;padding:4px 8px;font-size:10px;
}
.risk-register-table-row--detail td{background:rgba(0,0,0,.12)}
.risk-register-table-row__detail-cell{padding:12px 14px!important}
.risk-register-table-row__suivi{font-size:12px;line-height:1.45;color:var(--text2)}
.risk-register-table-row__suivi-lbl{font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);margin-right:6px}
.risk-register-table-row__conformite-hint{margin:8px 0 0;font-size:11px;color:var(--text3);line-height:1.4;font-style:italic}
.risks-page__list-empty-td{padding:0!important;border:none!important}
.risks-page__list-empty-td .risks-page__list-empty{padding:24px 16px;text-align:center}

.risks-register-premium-table__body{display:table-row-group}
.risks-register-col--risk{width:26%}
.risks-register-col--crit{width:11%}
.risks-register-col--gp{width:6%}
.risks-register-col--status{width:13%}
.risks-register-col--owner{width:16%}
.risks-register-col--action{width:28%}
@media (max-width:1100px){
  .risks-register-premium-table{font-size:11px}
}

/* —— Matrice G×P premium : gradients, heatmap, tooltips, axes —— */
.risks-matrix-card-prominent .risk-matrix-grid-wrap{margin-top:4px;padding-bottom:6px}
.risk-matrix-grid--premium{
  grid-template-columns:minmax(56px,auto) repeat(5,minmax(0,1fr));
  grid-template-rows:auto repeat(5,minmax(76px,1fr));
  gap:12px;
  padding:10px 6px 14px;
}
@keyframes risk-matrix-cell-in{
  from{opacity:0;transform:scale(0.9) translateY(4px)}
  to{opacity:1;transform:scale(1) translateY(0)}
}
.risk-matrix-cell--premium{
  position:relative;
  overflow:hidden;
  min-height:76px!important;
  padding:10px 8px!important;
  border-radius:14px!important;
  animation:risk-matrix-cell-in .5s cubic-bezier(.22,1,.36,1) backwards;
  animation-delay:calc(var(--rm-stagger, 0) * 1s);
  transition:transform .22s ease,box-shadow .25s ease,filter .22s ease,border-color .22s ease;
}
.risk-matrix-cell--premium > *{position:relative;z-index:1}
.risk-matrix-cell--premium.risk-matrix-cell--has-data:hover{
  transform:translateY(-4px) scale(1.045);
  z-index:4;
  box-shadow:0 14px 36px rgba(0,0,0,.38),0 0 0 1px rgba(255,255,255,.14);
  filter:brightness(1.09)saturate(1.05);
}
.risk-matrix-panel--embedded .risk-matrix-cell--premium.risk-matrix-cell--has-data:hover{
  transform:translateY(-4px) scale(1.05);
}
.risk-matrix-cell--premium.risk-matrix-cell--empty:hover{
  transform:none;
  filter:none;
}
.risk-matrix-cell--premium::after{
  content:'';
  position:absolute;
  inset:0;
  border-radius:inherit;
  pointer-events:none;
  z-index:0;
  opacity:calc(0.08 + 0.52 * var(--rm-heat, 0));
  background:radial-gradient(ellipse 80% 80% at 30% 20%,rgba(255,255,255,.45),transparent 55%);
  mix-blend-mode:overlay;
  transition:opacity .4s ease;
}
.risk-matrix-cell--premium.risk-matrix-cell--empty::after{opacity:0}

.risk-matrix-grid--premium .risk-matrix-cell--t1{
  background:linear-gradient(148deg,rgba(52,211,153,.42),rgba(34,197,94,.15) 50%,rgba(0,0,0,.12))!important;
  border-color:rgba(52,211,153,.38)!important;
}
.risk-matrix-grid--premium .risk-matrix-cell--t2{
  background:linear-gradient(148deg,rgba(251,191,36,.44),rgba(245,158,11,.18) 48%,rgba(0,0,0,.12))!important;
  border-color:rgba(251,191,36,.42)!important;
}
.risk-matrix-grid--premium .risk-matrix-cell--t3{
  background:linear-gradient(148deg,rgba(129,140,248,.48),rgba(56,189,248,.22) 45%,rgba(30,27,75,.18))!important;
  border-color:rgba(129,140,248,.48)!important;
}
.risk-matrix-grid--premium .risk-matrix-cell--t4{
  background:linear-gradient(148deg,rgba(167,139,250,.46),rgba(249,115,22,.24) 42%,rgba(40,20,30,.16))!important;
  border-color:rgba(192,132,252,.42)!important;
}
.risk-matrix-grid--premium .risk-matrix-cell--t5{
  background:linear-gradient(148deg,rgba(252,165,165,.5),rgba(185,28,28,.38) 38%,rgba(40,10,12,.28))!important;
  border-color:rgba(248,113,113,.55)!important;
  box-shadow:inset 0 0 28px rgba(248,113,113,.18),0 0 22px rgba(220,38,38,.28);
}
.risk-matrix-grid--premium .risk-matrix-cell--t5.risk-matrix-cell--has-data{
  box-shadow:inset 0 0 26px rgba(248,113,113,.22),0 0 32px rgba(220,38,38,.38),0 6px 20px rgba(0,0,0,.28);
}
.risk-matrix-grid--premium .risk-matrix-cell--active{
  box-shadow:0 0 0 2px rgba(96,165,250,.95),0 10px 32px rgba(56,189,248,.28)!important;
  z-index:5!important;
}

.risk-matrix-cell__score{
  font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;
  color:var(--text3);opacity:.88;line-height:1;margin-bottom:2px;
}
.risk-matrix-cell__mid{
  display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;
}
.risk-matrix-grid--premium .risk-matrix-cell__count{
  font-size:20px!important;
  text-shadow:0 2px 12px rgba(0,0,0,.35);
}
.risk-matrix-cell__trend{
  font-size:15px;font-weight:800;line-height:1;
  filter:drop-shadow(0 1px 4px rgba(0,0,0,.4));
}
.risk-matrix-cell__trend--muted{opacity:.3;font-size:13px;font-weight:600}

.risk-matrix-grid__colhead--premium,.risk-matrix-grid__rowhead--premium{
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
  padding:12px 8px!important;
  background:linear-gradient(180deg,rgba(0,0,0,.22),rgba(0,0,0,.12));
  border-radius:11px;
  border:1px solid rgba(148,163,184,.14);
}
.risk-matrix-grid__rowhead--premium{align-items:flex-end;padding-right:12px!important}
.risk-matrix-grid__axis-main{font-size:13px;font-weight:800;color:var(--text);letter-spacing:-.02em}
.risk-matrix-grid__axis-sub{
  font-size:9px;font-weight:700;color:var(--text3);line-height:1.2;text-align:center;max-width:7.5rem;
}
.risk-matrix-grid__corner--premium{
  display:flex!important;flex-direction:column;justify-content:flex-end!important;gap:6px!important;
  padding:10px 10px 14px 0!important;
}
.risk-matrix-grid__corner--premium .risk-matrix-grid__corner-g,
.risk-matrix-grid__corner--premium .risk-matrix-grid__corner-p{
  display:flex;flex-direction:column;gap:2px;font-size:10px;font-weight:800;letter-spacing:.04em;color:var(--text2);
  text-transform:uppercase;
}
.risk-matrix-grid--premium .risk-matrix-grid__corner--premium small{
  font-weight:600;color:var(--text3);font-size:8px;text-transform:none;letter-spacing:0;
}

.risk-matrix-cell-tooltip{
  position:absolute;
  z-index:50;
  min-width:210px;
  max-width:280px;
  padding:12px 14px;
  border-radius:14px;
  border:1px solid rgba(125,211,252,.22);
  background:linear-gradient(165deg,rgba(15,23,42,.98),rgba(30,41,59,.96));
  box-shadow:0 24px 56px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.07);
  pointer-events:auto;
  animation:risk-matrix-tooltip-in .24s ease;
}
@keyframes risk-matrix-tooltip-in{
  from{opacity:0;transform:translateY(8px) scale(.98)}
  to{opacity:1;transform:translateY(0) scale(1)}
}
.risk-matrix-cell-tooltip__title{display:block;font-size:14px;font-weight:800;margin-bottom:4px;color:var(--text)}
.risk-matrix-cell-tooltip__meta{display:block;font-size:11px;color:var(--text2);margin-bottom:8px;line-height:1.4}
.risk-matrix-cell-tooltip__count{
  display:block;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#93c5fd;margin-bottom:6px;
}
.risk-matrix-cell-tooltip__list{margin:0;padding-left:1.1em;font-size:11px;line-height:1.45;color:var(--text2);max-height:128px;overflow:auto}
.risk-matrix-cell-tooltip__hint{
  display:block;margin-top:10px;font-size:10px;line-height:1.4;color:var(--text3);
  border-top:1px solid rgba(255,255,255,.08);padding-top:8px;
}
.risk-matrix-cell-tooltip__empty{font-size:11px;color:var(--text3);line-height:1.45}

/* —— Risques : hub QHSE premium (KPI, matrice héro, analyse, détail fiche) —— */
.risks-pilot-banner--qhse-hub .risks-pilot-banner__head{margin-bottom:14px}
.risks-pilot-banner__kpis--four{
  grid-template-columns:repeat(4,minmax(0,1fr));
}
@media (max-width:960px){
  .risks-pilot-banner__kpis--four{grid-template-columns:repeat(2,minmax(0,1fr))}
}
.risks-pilot-banner__kpi--crit{
  border-color:rgba(239,91,107,.22)!important;
  background:linear-gradient(165deg,rgba(239,91,107,.08),rgba(0,0,0,.06))!important;
}
.risks-pilot-banner__kpi--crit .risks-pilot-banner__kpi-val{color:#fecaca}
.risks-pilot-banner__kpi--elev{
  border-color:rgba(243,179,79,.22)!important;
  background:linear-gradient(165deg,rgba(243,179,79,.07),rgba(0,0,0,.05))!important;
}
.risks-pilot-banner__kpi--elev .risks-pilot-banner__kpi-val{color:#fde68a}
.risks-pilot-banner__kpi--ok{
  border-color:rgba(34,197,94,.2)!important;
  background:linear-gradient(165deg,rgba(34,197,94,.07),rgba(0,0,0,.05))!important;
}
.risks-pilot-banner__kpi--ok .risks-pilot-banner__kpi-val{color:#bbf7d0}
.risks-pilot-banner__kpi--action{
  border-color:rgba(148,163,184,.25)!important;
  background:linear-gradient(165deg,rgba(148,163,184,.08),rgba(0,0,0,.05))!important;
}
.risks-page__matrix-section--hero .risks-matrix-card-prominent{
  padding-bottom:20px;
  border:1px solid rgba(255,255,255,.1);
  background:linear-gradient(175deg,rgba(255,255,255,.055) 0%,rgba(255,255,255,.02) 55%,rgba(0,0,0,.04) 100%);
  box-shadow:0 18px 48px rgba(0,0,0,.22),0 1px 0 rgba(255,255,255,.05) inset;
}
[data-theme='dark'] .risks-page__matrix-section--hero .risks-matrix-card-prominent{
  border-color:rgba(240,246,252,.12);
  background:linear-gradient(175deg,rgba(36,48,64,.75) 0%,rgba(20,26,36,.55) 100%);
}
.risk-matrix-grid--premium .risk-matrix-cell--t1{background:rgba(34,196,131,.1)!important}
.risk-matrix-grid--premium .risk-matrix-cell--t2{background:rgba(110,205,100,.11)!important}
.risk-matrix-grid--premium .risk-matrix-cell--t3{background:rgba(243,179,79,.14)!important}
.risk-matrix-grid--premium .risk-matrix-cell--t4{background:rgba(255,144,70,.15)!important}
.risk-matrix-grid--premium .risk-matrix-cell--t5{background:rgba(239,91,107,.16)!important}
.risk-matrix-grid--premium .risk-matrix-cell--has-data{
  transition:transform .2s ease,box-shadow .2s ease,filter .2s ease,background .2s ease;
}
.risk-matrix-grid--premium .risk-matrix-cell--has-data:hover{
  transform:translateY(-2px) scale(1.03);
  box-shadow:0 10px 28px rgba(0,0,0,.2),0 0 0 1px rgba(255,255,255,.08);
  filter:brightness(1.06);
}
.risks-analysis-premium{margin:0;min-width:0}
.risks-analysis-premium__card{min-width:0}
.risks-analysis-premium__lead{max-width:62ch}
.risks-analysis-premium__list{
  margin:0;padding:0 0 4px;list-style:none;
  display:flex;flex-direction:column;gap:10px;
}
.risks-analysis-premium__item{
  font-size:13px;line-height:1.45;color:var(--text2);
  padding:10px 14px;border-radius:12px;
  border:1px solid rgba(255,255,255,.08);
  background:rgba(0,0,0,.08);
}
.risks-analysis-premium__item--info{border-left:3px solid rgba(56,189,248,.55)}
.risks-analysis-premium__item--warn{border-left:3px solid rgba(243,179,79,.65)}
.risks-analysis-premium__item--err{border-left:3px solid rgba(239,91,107,.65);background:rgba(239,91,107,.05)}
.risk-detail-premium{
  display:grid;gap:14px;
  grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
}
.risk-detail-premium__section{
  padding:12px 14px;border-radius:12px;
  border:1px solid rgba(255,255,255,.07);
  background:rgba(0,0,0,.12);
  min-width:0;
}
.risk-detail-premium__section-title{
  margin:0 0 8px;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);
}
.risk-detail-premium__section-body{font-size:12.5px;line-height:1.5;color:var(--text2)}
.risk-detail-premium__empty{margin:0;font-style:italic;color:var(--text3);font-size:12px}
.risk-detail-premium__action-line{margin:0 0 8px;color:var(--text2)}
.risk-detail-premium__mesures{
  margin:0;padding:10px 12px;border-radius:10px;
  font-family:inherit;font-size:11.5px;line-height:1.45;white-space:pre-wrap;
  background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.06);color:var(--text2);
}
.risk-detail-premium__inc-list{margin:0;padding-left:1.1em}
.risk-detail-premium__inc-item{margin-bottom:6px;color:var(--text2);font-size:12px}
.risk-detail-premium__inc-ref{font-weight:800;color:var(--text);margin-right:8px}
.risk-detail-premium__inc-meta{font-size:11px;color:var(--text3)}
.risk-detail-premium__conformite-hint{
  grid-column:1/-1;margin:4px 0 0;font-size:11px;color:var(--text3);line-height:1.4;font-style:italic;
}
.risks-ia-premium__result{
  margin-top:14px;padding:14px 16px;border-radius:14px;
  border:1px solid rgba(77,160,255,.22);
  background:rgba(77,160,255,.06);
}
.risks-ia-premium__result[hidden]{display:none!important}
.risks-ia-premium__result-title{display:block;font-size:13px;font-weight:800;margin-bottom:10px;color:var(--text)}
.risks-ia-premium__result-list{margin:0;padding-left:1.2em;font-size:12.5px;line-height:1.5;color:var(--text2)}
.risks-ia-premium__result-hint{margin:12px 0 0;font-size:11px;color:var(--text3);line-height:1.4}
.risk-register-table-row__gp{
  text-align:center;font-weight:800;font-variant-numeric:tabular-nums;font-size:12px;color:var(--text);
  white-space:nowrap;
}
.risk-register-table-row__act-owner{
  display:block;font-size:10px;color:var(--text3);margin-top:3px;
}
.risk-register-table-row__act-nav{
  display:block;margin-top:6px;width:100%;text-align:left;
  font-family:inherit;font-size:10px;font-weight:700;
  padding:4px 0;border:none;background:none;cursor:pointer;
  color:#7dd3fc;text-decoration:underline;text-underline-offset:3px;
}
.risk-register-table-row__act-nav:hover{color:#bae6fd}
.risk-register-table-row__act-hint{
  display:block;font-size:10px;color:var(--text3);margin-top:4px;font-style:italic;
}
.risks-register-premium-table__caption{
  caption-side:top;text-align:left;
  font-size:11px;font-weight:600;color:var(--text3);
  padding:0 0 10px;line-height:1.4;
}
.risks-page__secondary{
  border-radius:16px;
  border:1px solid rgba(255,255,255,.08);
  background:rgba(0,0,0,.06);
  overflow:hidden;
}
.risks-page__secondary-summary{
  cursor:pointer;
  list-style:none;
  display:flex;align-items:center;gap:10px;flex-wrap:wrap;
  padding:14px 18px;
  font-size:13px;font-weight:700;color:var(--text2);
}
.risks-page__secondary-summary::-webkit-details-marker{display:none}
.risks-page__secondary-summary::marker{content:''}
.risks-page__secondary-summary:hover{background:rgba(255,255,255,.04)}
.risks-page__secondary-title{color:var(--text)}
.risks-page__secondary-badge{
  font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;
  padding:3px 8px;border-radius:999px;
  border:1px solid rgba(255,255,255,.12);color:var(--text3);
}
.risks-page__secondary-body{
  padding:0 18px 16px;
  display:flex;flex-direction:column;gap:1rem;
  border-top:1px solid rgba(255,255,255,.06);
}
.risk-detail-premium__nav-btn{
  margin-top:10px;
  font-family:inherit;font-size:11px;font-weight:700;
  padding:8px 14px;border-radius:10px;cursor:pointer;
  border:1px solid rgba(77,160,255,.35);
  background:rgba(77,160,255,.1);color:#bae6fd;
}
.risk-detail-premium__nav-btn:hover{background:rgba(77,160,255,.16)}
.risk-detail-premium__scope-note{
  margin:10px 0 0;font-size:10px;line-height:1.4;color:var(--text3);font-style:italic;
}

@media (prefers-reduced-motion:reduce){
  .risk-matrix-cell--premium{animation:none}
  .risk-matrix-cell-tooltip{animation:none}
  .risk-matrix-cell--premium.risk-matrix-cell--has-data:hover{transform:none}
  .risk-matrix-grid--premium .risk-matrix-cell--has-data:hover{transform:none;filter:none;box-shadow:none}
}
`;function qt(){if(document.getElementById(to))return;const e=document.createElement("style");e.id=to,e.textContent=wd,document.head.append(e)}const ao=["Sécurité","Environnement","Qualité","Autre"],Vt=[{value:"élevée",label:"Élevée"},{value:"moyenne",label:"Moyenne"},{value:"faible",label:"Faible"}],io="Suggestions basées sur analyse automatique — à vérifier avant toute décision.",sr=[{m:"Déc",crit:1,avgScore:14},{m:"Jan",crit:2,avgScore:15},{m:"Fév",crit:2,avgScore:16},{m:"Mar",crit:3,avgScore:17},{m:"Avr",crit:2,avgScore:16}],Ed=[{label:"PV revue des risques — 28/03/2026",kind:"Document"},{label:"Contrôle rétention hydrocarbures — constat",kind:"Contrôle"},{label:"Export matrice G×P — version consolidée",kind:"Document"}];function Nd(e){let t=0,a=0,r=0;return e.forEach(n=>{const i=$t(n.meta);if(i){i.tier>=5?t+=1:i.tier>=3?a+=1:r+=1;return}const o=String(n.status).toLowerCase();o.includes("critique")?t+=1:o.includes("très")&&o.includes("élev")||o.includes("élevé")||o.includes("eleve")?a+=1:r+=1}),{critique:t,eleve:a,modere:r}}function Aa(e){const t=$t(e.meta);if(t)return t.tier>=5?"critique":t.tier>=3?"eleve":"modere";const a=String(e.status).toLowerCase();return a.includes("critique")?"critique":a.includes("très")&&a.includes("élev")||a.includes("élevé")||a.includes("eleve")?"eleve":"modere"}function qr(e){return e.filter(t=>!ft(t.meta)).length}function es(e){return(e==null?void 0:e.actionLinked)!=null&&typeof e.actionLinked=="object"}function Sd(e){return e.filter(t=>Aa(t)==="eleve").length}function Cd(e){return e.filter(t=>t.pilotageState==="traite").length}function ts(e){return e.filter(t=>!es(t)).length}function ro(e){const t=[],a=ts(e);a>0&&t.push({level:"warn",text:`${a} risque(s) sans action liée — prioriser le rattachement au registre actions.`});const r=qr(e);r>0&&t.push({level:"info",text:`${r} fiche(s) sans position G×P explicite sur la matrice.`}),e.forEach(i=>{const o=ft(i.meta),s=$t(i.meta),c=String(i.status||"").toLowerCase();if(o&&s&&s.tier>=4&&(c.includes("faible")||c.includes("modéré")||c.includes("modere"))&&t.push({level:"err",text:`Incohérence possible : « ${i.title||"Sans titre"} » — palier ${s.label} vs libellé de statut modeste.`}),o){const l=o.g*o.p;l>=16&&i.trend==="stable"&&i.pilotageState==="actif"&&s&&s.tier>=4&&t.push({level:"warn",text:`Sous-évaluation / veille : « ${i.title||"Sans titre"} » — score G×P ${l} mais tendance stable ; confirmer le pilotage.`})}});const n=new Set;return t.filter(i=>n.has(i.text)?!1:(n.add(i.text),!0))}function no(e){return[...e].sort((t,a)=>{const r=$t(t.meta),n=$t(a.meta),i=(r==null?void 0:r.tier)??0,o=(n==null?void 0:n.tier)??0;if(o!==i)return o-i;const s=(r==null?void 0:r.product)??0;return((n==null?void 0:n.product)??0)-s})}function oo(e,t){const a={élevée:5,moyenne:3,faible:2},r={élevée:4,moyenne:3,faible:2},n=a[e]??3,i=r[t]??3,o=Ra(n,i),s=Pt(o),c=o>=5?"red":o>=3?"amber":"blue";return{meta:`G${n} × P${i}`,tone:c,status:s}}function Ad(e){const t=e.trim().replace(/\s+/g," ");return t?t.length<=72?t:`${t.slice(0,69)}…`:"Nouveau risque"}function zd({onSaved:e}){const t=document.createElement("dialog");t.className="risks-create-dialog";const a=document.createElement("div");a.className="risks-create-dialog__inner",a.innerHTML=`
    <h2 class="risks-create-dialog__head">Nouvelle fiche risque</h2>
    <p class="risks-create-dialog__lead">
      Décrivez le risque. L’analyse automatique propose des pistes : vous gardez le contrôle — rien n’est enregistré sans votre validation.
    </p>
    <form class="risks-form-grid" id="risks-create-form">
      <label>Libellé court
        <input type="text" name="title" autocomplete="off" maxlength="240" placeholder="Ex. Chute hauteur zone concassage" />
      </label>
      <label>Description du risque *
        <textarea name="description" required placeholder="Contexte, causes possibles, exposition…"></textarea>
      </label>
      <div class="risks-form-actions-row">
        <button type="button" class="btn btn-secondary" data-action="analyze">Analyser le risque</button>
      </div>
      <div class="risks-ai-panel" id="risks-ai-panel" hidden>
        <p class="risks-ai-panel__disclaimer" id="risks-ai-disclaimer"></p>
        <div class="risks-ai-panel__kv" id="risks-ai-kv"></div>
        <ul class="risks-ai-panel__list" id="risks-ai-actions"></ul>
        <div class="risks-ai-panel__actions">
          <button type="button" class="btn btn-primary" data-action="apply-suggestions">Copier dans le formulaire (validation requise)</button>
          <button type="button" class="btn btn-secondary" data-action="ignore-suggestions">Masquer</button>
        </div>
      </div>
      <label>Catégorie
        <select name="category">${ao.map(u=>`<option value="${u}">${u}</option>`).join("")}</select>
      </label>
      <label>Gravité estimée
        <select name="severity">${Vt.map(u=>`<option value="${u.value}">${u.label}</option>`).join("")}</select>
      </label>
      <label>Probabilité estimée
        <select name="probability">${Vt.map(u=>`<option value="${u.value}">${u.label}</option>`).join("")}</select>
      </label>
      <label>Actions recommandées (modifiable)
        <textarea name="actions" placeholder="Une mesure par ligne (vous pouvez compléter ou supprimer)."></textarea>
      </label>
      <div class="risks-form-actions-row" style="margin-top:18px">
        <button type="submit" class="btn btn-primary">Valider et ajouter au registre (local)</button>
        <button type="button" class="btn btn-secondary" data-action="close">Annuler</button>
      </div>
    </form>
  `,t.append(a),document.body.append(t);const r=a.querySelector("#risks-create-form"),n=a.querySelector("#risks-ai-panel"),i=a.querySelector("#risks-ai-disclaimer"),o=a.querySelector("#risks-ai-kv"),s=a.querySelector("#risks-ai-actions");let c=null;function l(){n.hidden=!0,n.classList.remove("risks-ai-panel--loading"),c=null,i&&(i.textContent=io),o.replaceChildren(),s.replaceChildren()}function d(u){c=u,i&&(i.textContent=io);const p=Vt.some(b=>b.value===u.severity),g=Vt.some(b=>b.value===u.probability),m=oo(p?u.severity:"moyenne",g?u.probability:"moyenne");o.innerHTML=`
      <div><span>Catégorie suggérée</span><strong>${ct(u.category)}</strong></div>
      <div><span>Gravité (suggestion)</span><strong>${ct(so(u.severity))}</strong></div>
      <div><span>Probabilité (suggestion)</span><strong>${ct(so(u.probability))}</strong></div>
      <div><span>Criticité (suggestion)</span><strong>${ct(m.status)} · ${ct(m.meta)}</strong></div>
    `,s.replaceChildren(),(u.suggestedActions||[]).forEach(b=>{const y=document.createElement("li");y.textContent=b,s.append(y)}),n.hidden=!1}a.querySelector('[data-action="analyze"]').addEventListener("click",async()=>{const u=r.description.value.trim();if(!u){C("Saisissez une description pour lancer l’analyse.","info"),r.description.focus();return}n.hidden=!1,n.classList.add("risks-ai-panel--loading"),i&&(i.textContent="Analyse en cours…"),o.replaceChildren(),s.replaceChildren();try{const p=await Se("/api/risks/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({description:u})}),g=await p.json().catch(()=>({}));if(!p.ok){l();const m=typeof(g==null?void 0:g.error)=="string"?g.error:`Erreur ${p.status}`;C(m,"error");return}if(!g.category||!g.severity||!g.probability||!Array.isArray(g.suggestedActions)){l(),C("Réponse serveur inattendue.","error");return}n.classList.remove("risks-ai-panel--loading"),d(g)}catch(p){console.error("[risks] POST /api/risks/analyze",p),l(),C("Impossible de joindre le serveur pour l’analyse.","error")}}),a.querySelector('[data-action="apply-suggestions"]').addEventListener("click",()=>{if(!c){C("Lancez d’abord une analyse.","info");return}const{category:u,severity:p,probability:g,suggestedActions:m}=c;r.category.value=ao.includes(u)?u:"Autre",r.severity.value=Vt.some(b=>b.value===p)?p:"moyenne",r.probability.value=Vt.some(b=>b.value===g)?g:"moyenne",r.actions.value=m.join(`
`),C("Suggestions copiées dans le formulaire — contrôle humain obligatoire avant validation.","info")}),a.querySelector('[data-action="ignore-suggestions"]').addEventListener("click",()=>{l()}),a.querySelector('[data-action="close"]').addEventListener("click",()=>{t.close()}),r.addEventListener("submit",u=>{u.preventDefault();const p=r.description.value.trim();if(!p){C("La description est obligatoire.","info");return}let g=r.title.value.trim();g||(g=Ad(p));const m=r.severity.value,b=r.probability.value,y=r.actions.value.trim(),v=r.category.value;let h=p;v&&v!=="Autre"&&(h=`${p}

(Catégorie : ${v})`),y.length>0&&(h=`${h}

— Mesures envisagées —
${y}`);const{meta:k,tone:_,status:f}=oo(m,b),E={title:g,detail:h,status:f,tone:_,meta:k,responsible:"À désigner",actionLinked:null,pilotageState:"actif",updatedAt:new Date().toISOString().slice(0,10),trend:"stable"};Fl(g),e(E),t.close(),C("Fiche ajoutée au registre (session courante). Enregistrement serveur : à brancher si besoin.","success")}),t.addEventListener("close",()=>{t.remove()}),t.showModal()}function ct(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function so(e){const t=Vt.find(a=>a.value===e);return t?t.label:e}function $d(){qt();const e=document.createElement("section");e.className="page-stack risks-page risks-page--premium";const t=[...Jo];let a=[];async function r(){try{const $=await Se(_t("/api/incidents?limit=500"));if($.ok){const T=await $.json();a=Array.isArray(T)?T:[]}else a=[]}catch($){console.error("[risks] GET incidents for liaison",$),a=[]}}const n=document.createElement("tbody");n.className="risks-register-premium-table__body";let i=null,o=null;const s=fd({variant:"default",showRiskDots:!0,onFilterChange:$=>{i=$,S(),D(),A()},onCellActivate:()=>{requestAnimationFrame(()=>{var $;($=document.querySelector(".risks-register-premium-table"))==null||$.scrollIntoView({behavior:"smooth",block:"nearest"})})}}),c=document.createElement("div");c.className="risks-pilot-banner-host";const l=document.createElement("p");l.className="risks-matrix-card-prominent__status",l.setAttribute("role","status");function d(){const $=t.filter(fe=>Aa(fe)==="critique").length,T=Sd(t),j=Cd(t),Y=ts(t);c.replaceChildren();const ne=document.createElement("article");ne.className="content-card card-soft risks-pilot-banner risks-pilot-banner--qhse-hub";const ae=document.createElement("div");ae.className="risks-pilot-banner__head",ae.innerHTML=`
      <div>
        <div class="section-kicker">Pôle central QHSE</div>
        <h3 class="risks-pilot-banner__title">Risques</h3>
        <p class="risks-pilot-banner__lead">Matrice, registre, liaisons Incidents / Actions — analyse assistée toujours validée par l’utilisateur.</p>
      </div>`;const de=document.createElement("div");de.className="risks-pilot-banner__kpis risks-pilot-banner__kpis--four",de.setAttribute("aria-label","Indicateurs registre risques"),[["Critiques",String($),"Palier critique","risks-pilot-banner__kpi--crit"],["Élevés",String(T),"Hors palier critique","risks-pilot-banner__kpi--elev"],["Maîtrisés",String(j),"Clôture locale (pilotage)","risks-pilot-banner__kpi--ok"],["Sans action",String(Y),"Sans action liée","risks-pilot-banner__kpi--action"]].forEach(([fe,_e,Ee,ve])=>{const Ae=document.createElement("div");Ae.className=`risks-pilot-banner__kpi ${ve}`,Ae.innerHTML=`<span class="risks-pilot-banner__kpi-val">${_e}</span><span class="risks-pilot-banner__kpi-lbl">${fe}</span><span class="risks-pilot-banner__kpi-hint">${Ee}</span>`,de.append(Ae)}),ne.append(ae,de),c.append(ne)}const u=document.createElement("section");u.className="risks-priority-premium";function p($){const T=ft($.meta),j=T?`G${T.g}×P${T.p}`:"G×P ?",Y=$t($.meta),ne=Y?Y.label:String($.status||"—"),ae=document.createElement("button");return ae.type="button",ae.className="risks-priority-premium__line",ae.innerHTML=`<span class="risks-priority-premium__line-title">${ct(String($.title||""))}</span><span class="risks-priority-premium__line-sub">${ct(j)} · ${ct(String(ne))}</span>`,ae.addEventListener("click",()=>{var de;(de=document.querySelector(".risks-register-premium-table"))==null||de.scrollIntoView({behavior:"smooth",block:"nearest"})}),ae}function g(){u.replaceChildren();const $=document.createElement("article");$.className="content-card card-soft risks-priority-premium__card";const T=document.createElement("div");T.className="content-card-head content-card-head--tight",T.innerHTML='<div><div class="section-kicker">Priorités</div><h3>Risques à surveiller</h3><p class="content-card-lead risks-priority-premium__lead">Raccourcis vers le registre — critiques, récents, dérive.</p></div>';const j=document.createElement("div");j.className="risks-priority-premium__grid";function Y(he,fe){const _e=document.createElement("div");_e.className="risks-priority-premium__col";const Ee=document.createElement("h4");Ee.className="risks-priority-premium__col-title",Ee.textContent=he;const ve=document.createElement("div");if(ve.className="risks-priority-premium__col-body",fe.length)fe.forEach(Ae=>ve.append(Ae));else{const Ae=document.createElement("p");Ae.className="risks-priority-premium__empty",Ae.textContent="Aucune entrée.",ve.append(Ae)}return _e.append(Ee,ve),_e}const ne=no(t.filter(he=>Aa(he)==="critique")).map(p),ae=[...t].sort((he,fe)=>String(fe.updatedAt||"").localeCompare(String(he.updatedAt||""))).slice(0,4).map(p),de=t.filter(he=>he.trend==="up"||he.pilotageState==="derive").map(p);j.append(Y("Critiques",ne),Y("Récents",ae),Y("En augmentation / dérive",de)),$.append(T,j),u.append($)}const m=document.createElement("section");function b(){m.replaceChildren();const $=document.createElement("article");$.className="content-card card-soft risks-evolution-card",$.innerHTML=`
      <div class="content-card-head content-card-head--tight">
        <div>
          <div class="section-kicker">Évolution</div>
          <h3>Tendance (maquette)</h3>
          <p class="content-card-lead risks-evolution-card__lead">Risques critiques et score moyen G×P — série locale, à relier aux indicateurs SI.</p>
        </div>
      </div>
      <div class="risks-evolution-chart" data-risks-evolution-chart></div>
    `;const T=$.querySelector("[data-risks-evolution-chart]"),j=Math.max(...sr.map(ae=>ae.crit),1),Y=Math.max(...sr.map(ae=>ae.avgScore),1);sr.forEach(ae=>{const de=document.createElement("div");de.className="risks-evolution-chart__row";const he=ae.crit/j*100,fe=ae.avgScore/Y*100;de.innerHTML=`
        <span class="risks-evolution-chart__lbl">${ct(ae.m)}</span>
        <div class="risks-evolution-chart__bars">
          <div class="risks-evolution-chart__bar-wrap" title="Critiques : ${ae.crit}">
            <span class="risks-evolution-chart__bar risks-evolution-chart__bar--crit" style="height:${he}%"></span>
            <span class="risks-evolution-chart__bar-val">${ae.crit}</span>
          </div>
          <div class="risks-evolution-chart__bar-wrap" title="Score moyen G×P : ${ae.avgScore}">
            <span class="risks-evolution-chart__bar risks-evolution-chart__bar--avg" style="height:${fe}%"></span>
            <span class="risks-evolution-chart__bar-val">${ae.avgScore}</span>
          </div>
        </div>`,T.append(de)});const ne=document.createElement("div");ne.className="risks-evolution-chart__legend",ne.innerHTML='<span><i class="risks-evolution-chart__dot risks-evolution-chart__dot--crit"></i>Critiques</span><span><i class="risks-evolution-chart__dot risks-evolution-chart__dot--avg"></i>Score moyen G×P</span>',T.append(ne),m.append($)}const y=document.createElement("section");function v(){y.replaceChildren();const $=document.createElement("article");$.className="content-card card-soft risks-proofs-card";const T=document.createElement("div");T.className="content-card-head content-card-head--tight",T.innerHTML='<div><div class="section-kicker">Preuves & contrôles</div><h3>Documents liés</h3><p class="content-card-lead risks-proofs-card__lead">Pièces et contrôles associés au dispositif risques (maquette).</p></div>';const j=document.createElement("ul");j.className="risks-proofs-list",Ed.forEach(Y=>{const ne=document.createElement("li");ne.className="risks-proofs-item",ne.innerHTML=`<span class="risks-proofs-item__kind">${ct(Y.kind)}</span><span class="risks-proofs-item__label">${ct(Y.label)}</span>`,j.append(ne)}),$.append(T,j),y.append($)}const h=document.createElement("article");h.className="content-card card-soft risks-ia-premium",h.innerHTML=`
    <div class="content-card-head content-card-head--tight">
      <div>
        <div class="section-kicker">IA risques</div>
        <h3>Assistant (validation humaine)</h3>
        <p class="content-card-lead risks-ia-premium__lead">Suggestions locales + analyse API dans « Ajouter un risque ». Aucune écriture sans validation explicite.</p>
      </div>
    </div>
    <div class="risks-ia-premium__actions" data-risks-ia-actions></div>
    <div class="risks-ia-premium__result" data-risks-ia-result hidden></div>
  `;const k=h.querySelector("[data-risks-ia-actions]"),_=h.querySelector("[data-risks-ia-result]");function f($,T){if(!_)return;_.hidden=!1;const j=T.map(Y=>`<li>${ct(Y)}</li>`).join("");_.innerHTML=`<strong class="risks-ia-premium__result-title">${ct($)}</strong><ul class="risks-ia-premium__result-list">${j}</ul><p class="risks-ia-premium__result-hint">Aucune écriture automatique — validez manuellement dans le registre ou les actions.</p>`}[{label:"Synthèse risques critiques",key:"ia_crit",run:()=>{const $=no(t.filter(T=>Aa(T)==="critique"));if(!$.length){f("Risques critiques",["Aucune fiche en palier critique actuellement."]);return}f("Risques critiques (à confirmer)",$.map(T=>{const j=ft(T.meta),Y=j?`G${j.g}×P${j.p}`:"G×P ?";return`${T.title||"Sans titre"} — ${Y} — ${T.status||"—"}`}))}},{label:"Pistes d’actions (sans action liée)",key:"ia_actions",run:()=>{const $=t.filter(T=>!es(T));if(!$.length){f("Actions recommandées",["Toutes les fiches ont une action liée (maquette)."]);return}f("Pistes à valider — rattacher une action",$.map(T=>`« ${T.title||"Sans titre"} » : lancer revue courte, désigner un pilote, créer une action dans le module Actions.`))}},{label:"Détecter incohérences",key:"ia_incoh",run:()=>{const $=ro(t).filter(T=>T.level==="err");if(!$.length){f("Incohérences",["Aucune incohérence majeure détectée par les règles locales."]);return}f("Incohérences détectées (à vérifier)",$.map(T=>T.text))}}].forEach(({label:$,key:T,run:j})=>{const Y=document.createElement("button");Y.type="button",Y.className="btn btn-secondary risks-ia-premium__btn",Y.textContent=$,Y.addEventListener("click",()=>{j(),Be.add({module:"risks",action:"Assistant risques (suggestion)",detail:T,user:"Utilisateur"})}),k==null||k.append(Y)});const w=document.createElement("article");w.className="content-card card-soft risks-matrix-card-prominent";const x=document.createElement("div");x.className="content-card-head content-card-head--tight",x.innerHTML='<div><div class="section-kicker">Matrice centrale</div><h3>Gravité × Probabilité</h3><p class="content-card-lead risks-matrix-card-prominent__lead">Survol : détail · Clic sur une case remplie : filtre le registre · Pastilles = palier par fiche.</p></div>',w.append(x,l,s.element);function S(){const $=t.filter(Y=>ft(Y.meta)).length,T=qr(t);let j=`${$}/${t.length} fiche(s) positionnée(s) sur la matrice`;if(T>0&&(j+=` · ${T} sans G×P`),i){const Y=Pt(Ra(i.g,i.p)),ne=i.g*i.p;j+=` · Filtre actif G${i.g}×P${i.p} (${Y}, score ${ne})`}l.textContent=j}const N=document.createElement("div");N.className="risks-page__insights";const L=document.createElement("div");L.className="risks-page__active-filters",L.hidden=!0;function D(){const $=o!=null,T=i!=null;if(L.hidden=!$&&!T,L.replaceChildren(),L.hidden)return;const j=document.createElement("span");j.className="risks-page__active-filters-label",j.textContent="Filtres actifs";const Y=document.createElement("div");if(Y.className="risks-page__active-filters-actions",$){const ae=document.createElement("button");ae.type="button",ae.className="btn btn-secondary risks-page__active-filters-btn",ae.textContent=o==="critique"?"Retirer : Critiques":o==="eleve"?"Retirer : Élevés":"Retirer : Modérés & faibles",ae.addEventListener("click",()=>{o=null,K(),D(),A()}),Y.append(ae)}if(T){const ae=document.createElement("button");ae.type="button",ae.className="btn btn-secondary risks-page__active-filters-btn",ae.textContent=`Retirer : G${i.g}×P${i.p}`,ae.addEventListener("click",()=>{s.clearFilter()}),Y.append(ae)}const ne=document.createElement("button");ne.type="button",ne.className="btn btn-secondary risks-page__active-filters-btn risks-page__active-filters-btn--ghost",ne.textContent="Tout afficher",ne.addEventListener("click",()=>{o=null,s.clearFilter(),K(),D(),A()}),Y.append(ne),L.append(j,Y)}function q(){const{critique:$,eleve:T,modere:j}=Nd(t),Y=t.length,ne=qr(t),ae=Pe=>Y>0?Math.round(Pe/Y*100):0;N.replaceChildren();const de=document.createElement("div");de.className="risks-insights__head risks-insights__head--compact",de.innerHTML=`
      <div class="risks-insights__intro">
        <div class="section-kicker">Pilotage</div>
        <h3 class="risks-insights__title">Répartition & filtres registre</h3>
        <p class="risks-insights__lead">${ne} fiche(s) sans G×P — paliers ci-dessous pour filtrer le tableau.</p>
      </div>
  `;const he=document.createElement("div");he.className="risks-insights__bar-wrap",he.setAttribute("aria-label","Répartition par criticité");const fe=document.createElement("div");fe.className="risks-insights__bar",Y===0?fe.innerHTML='<div class="risks-insights__bar-seg risks-insights__bar-seg--empty" style="width:100%"></div>':fe.innerHTML=`
        <div class="risks-insights__bar-seg risks-insights__bar-seg--crit" style="width:${ae($)}%" title="Critiques : ${$}"></div>
        <div class="risks-insights__bar-seg risks-insights__bar-seg--elev" style="width:${ae(T)}%" title="Élevés : ${T}"></div>
        <div class="risks-insights__bar-seg risks-insights__bar-seg--mod" style="width:${ae(j)}%" title="Modérés / faibles : ${j}"></div>
      `;const _e=document.createElement("div");_e.className="risks-insights__bar-legend",_e.innerHTML=`
      <span><i class="risks-insights__dot risks-insights__dot--crit"></i>Critiques <strong>${$}</strong></span>
      <span><i class="risks-insights__dot risks-insights__dot--elev"></i>Élevés <strong>${T}</strong></span>
      <span><i class="risks-insights__dot risks-insights__dot--mod"></i>Modérés &amp; faibles <strong>${j}</strong></span>
    `,he.append(fe,_e);const Ee=document.createElement("div");Ee.className="risks-insights__tier-row",Ee.setAttribute("role","group"),Ee.setAttribute("aria-label","Filtrer le registre par palier");const ve=document.createElement("span");ve.className="risks-insights__tier-label",ve.textContent="Filtrer le registre";const Ae=document.createElement("div");Ae.className="risks-insights__tier-pills";function ze(Pe,We){const O=document.createElement("button");O.type="button",O.className="risks-tier-pill",O.dataset.tierKey=Pe,O.textContent=We,O.addEventListener("click",()=>{Pe==="all"?o=null:Pe==="critique"?o="critique":Pe==="eleve"?o="eleve":o="modere",K(),D(),A()}),Ae.append(O)}ze("all","Tout"),ze("critique",`Critiques (${$})`),ze("eleve",`Élevés (${T})`),ze("modere",`Modérés & faibles (${j})`),Ee.append(ve,Ae),N.append(de,he,Ee)}function W($,T){$.classList.toggle("risks-tier-pill--active",T),$.setAttribute("aria-pressed",T?"true":"false")}function K(){N.querySelectorAll(".risks-tier-pill").forEach(T=>{const j=T.dataset.tierKey,Y=j==="all"&&o==null||j==="critique"&&o==="critique"||j==="eleve"&&o==="eleve"||j==="modere"&&o==="modere";W(T,!!Y)})}function A(){n.replaceChildren();let $=t;if(o!=null&&($=$.filter(j=>Aa(j)===o)),i!=null&&($=$.filter(j=>{const Y=ft(j.meta);return Y&&Y.g===i.g&&Y.p===i.p})),$.length===0){const j=document.createElement("tr");j.className="risks-register-empty-row";const Y=document.createElement("td");Y.colSpan=6,Y.className="risks-page__list-empty-td";const ne=document.createElement("div");ne.className="risks-page__list-empty";const ae=document.createElement("p");ae.className="risks-page__list-empty-title";const de=document.createElement("p");de.className="risks-page__list-empty-sub",t.length===0?(ae.textContent="Aucune fiche dans le registre",de.textContent="Ajoutez un risque pour alimenter le portefeuille et la matrice G×P."):o!=null&&i!=null?(ae.textContent="Aucun résultat pour cette combinaison de filtres",de.textContent="Élargissez le palier ou réinitialisez le filtre matrice via « Tout afficher »."):o!=null?(ae.textContent="Aucune fiche pour ce palier",de.textContent="Choisissez un autre filtre ou cliquez « Tout » ci-dessus."):(ae.textContent="Aucune fiche pour cette case G×P",de.textContent="Choisissez une autre case ou « Tout afficher » sur la matrice."),ne.append(ae,de),Y.append(ne),j.append(Y),n.append(j);return}const T=Ne.activeSiteId?"Périmètre : site sélectionné dans la barre principale — aligné sur la liste du module Incidents.":"Périmètre : tous les sites visibles par l’API sur cette requête.";$.forEach(j=>n.append(_d(j,{linkedIncidents:Ul(a,String(j.title||"")),incidentsLinkNote:T})))}const I=document.createElement("section");I.className="risks-analysis-premium";function z(){const $=ro(t);I.replaceChildren();const T=document.createElement("article");T.className="content-card card-soft risks-analysis-premium__card";const j=document.createElement("div");j.className="content-card-head content-card-head--tight",j.innerHTML='<div><div class="section-kicker">Analyse globale</div><h3>Veille & cohérence</h3><p class="content-card-lead risks-analysis-premium__lead">Lecture seule : actions manquantes, G×P, incohérences — à valider métier.</p></div>';const Y=document.createElement("ul");if(Y.className="risks-analysis-premium__list",$.length)$.forEach(ne=>{const ae=document.createElement("li");ae.className=`risks-analysis-premium__item risks-analysis-premium__item--${ne.level}`,ae.textContent=ne.text,Y.append(ae)});else{const ne=document.createElement("li");ne.className="risks-analysis-premium__item risks-analysis-premium__item--info",ne.textContent="Aucun écart flaggé par les règles locales — poursuivre revues et terrain.",Y.append(ne)}T.append(j,Y),I.append(T)}async function R(){await r(),d(),g(),b(),v(),q(),z(),K(),S(),D(),s.setRisks(t),A()}R();const V=document.createElement("article");V.className="content-card card-soft risks-page__panel risks-page__panel--register",V.innerHTML=`
    <div class="risks-page__panel-head content-card-head content-card-head--split">
      <div class="risks-page__panel-intro">
        <div class="section-kicker">Registre des risques</div>
        <h3>Tableau compact</h3>
        <p class="content-card-lead risks-page__panel-lead">
          Ligne = synthèse · clic = détail (causes, impacts, action, incidents). Filtres : paliers ou matrice.
        </p>
      </div>
      <button type="button" class="btn btn-primary risks-add-btn btn--pilotage-cta">
        + Ajouter un risque
      </button>
    </div>
    <div class="risks-page__list-region"></div>
  `;const oe=V.querySelector(".risks-page__list-region"),ge=document.createElement("table");ge.className="risks-register-premium-table";const B=document.createElement("caption");B.className="risks-register-premium-table__caption",B.textContent="Registre des risques — ouvrir une ligne pour le détail";const re=document.createElement("colgroup");re.innerHTML=`
    <col class="risks-register-col risks-register-col--risk" />
    <col class="risks-register-col risks-register-col--crit" />
    <col class="risks-register-col risks-register-col--gp" />
    <col class="risks-register-col risks-register-col--status" />
    <col class="risks-register-col risks-register-col--owner" />
    <col class="risks-register-col risks-register-col--action" />
  `;const se=document.createElement("thead");se.innerHTML=`
    <tr>
      <th scope="col">Risque</th>
      <th scope="col">Criticité</th>
      <th scope="col">G×P</th>
      <th scope="col">Statut</th>
      <th scope="col">Responsable</th>
      <th scope="col">Action</th>
    </tr>
  `,ge.append(B,re,se,n),oe.append(L,ge),V.querySelector(".risks-add-btn").addEventListener("click",()=>{zd({onSaved:$=>{t.unshift($),s.clearFilter(),R()}})});const F=document.createElement("section");F.className="risks-page__matrix-section risks-page__matrix-section--hero",F.append(w);const H=document.createElement("details");H.className="risks-page__secondary";const G=document.createElement("summary");G.className="risks-page__secondary-summary",G.innerHTML='<span class="risks-page__secondary-title">Tendances & documents</span><span class="risks-page__secondary-badge">local</span>';const X=document.createElement("div");return X.className="risks-page__secondary-body",X.append(m,y),H.append(G,X),e.append(ba({title:"Risques — prioriser avant la matrice",hint:"Les indicateurs du haut et le bloc « Risques à surveiller » regroupent l’urgence ; la matrice sert ensuite à affiner.",nextStep:"Ensuite : cliquez une ligne prioritaire, puis consultez le tableau pour le détail."}),c,F,N,I,V,u,H,h),e}function qd(e){qt();const t=document.createElement("div");return t.className="qhse-kpi-strip ds-kpi-grid",e.forEach(({label:a,value:r,tone:n="blue",hint:i="",hintTitle:o=""})=>{const s=document.createElement("div");s.className="metric-card card-soft",o&&(s.title=o);const c=document.createElement("div");c.className="metric-label",c.textContent=a;const l=document.createElement("div"),d=n==="red"?"red":n==="amber"?"amber":n==="green"?"green":"blue";if(l.className=`metric-value ${d}`,l.textContent=String(r),s.append(c,l),i){const u=document.createElement("div");u.className="metric-note",u.textContent=i,s.append(u)}t.append(s)}),t}function Ld(e){const t=e.split("•").map(i=>i.trim());let a="—",r="—",n="—";return t.forEach(i=>{if(/^resp/i.test(i))r=i.replace(/^resp\.\s*/i,"").trim();else if(/échéance/i.test(i)){const o=i.match(/([\d/]+)/);o&&(n=o[1])}else if(/\+\d+\s*jours/i.test(i)){const o=i.match(/\+\d+\s*jours/i);o&&(n=`Retard ${o[0]}`)}else i&&(a=i)}),{site:a,owner:r,echeance:n}}function Id(e){if(!e)return null;try{const t=new Date(e);return Number.isNaN(t.getTime())?null:t.toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"})}catch{return null}}function Td(e,t){if(e==="overdue")return{label:"Retard",mod:"action-card__prio--danger"};if(e==="done")return{label:"Terminé",mod:"action-card__prio--ok"};if(t){const a=new Date(t);if(!Number.isNaN(a.getTime())){const r=Date.now(),i=(a.getTime()-r)/864e5;if(i<0)return{label:"Date dépassée",mod:"action-card__prio--danger"};if(i<=3)return{label:"Urgent",mod:"action-card__prio--warn"};if(i<=14)return{label:"Priorité normale",mod:"action-card__prio--info"}}}return{label:"Planifié",mod:"action-card__prio--neutral"}}function as(e,t){if(e==="overdue")return"retard";if(e==="done")return"planifie";if(t){const a=new Date(t);if(!Number.isNaN(a.getTime())){const r=(a.getTime()-Date.now())/864e5;if(r<0)return"retard";if(r<=3)return"urgent";if(r<=14)return"normal"}}return"planifie"}function Md(e){return e==="overdue"?"action-card__status action-card__status--overdue":e==="doing"?"action-card__status action-card__status--doing":e==="done"?"action-card__status action-card__status--done":"action-card__status action-card__status--todo"}function Pd(e,t){const a=document.createElement("article");a.className=`action-card action-card--v2 action-card--premium action-card--col-${t}`,a.setAttribute("draggable","true"),a.dataset.actionId=e.actionId!=null?String(e.actionId):"",a.dataset.columnKey=t,a.classList.add("action-card--dnd-ready");const r=Ld(e.detail||""),i=(e.assigneeName!=null&&String(e.assigneeName).trim()!==""?String(e.assigneeName).trim():r.owner)||"—",o=Id(e.dueDateIso)||r.echeance,s=Td(t,e.dueDateIso);let c=t==="overdue";if(e.dueDateIso){const x=new Date(e.dueDateIso);!Number.isNaN(x.getTime())&&x.getTime()<Date.now()&&(c=!0)}t!=="done"&&(t==="overdue"||s.mod==="action-card__prio--danger"||s.mod==="action-card__prio--warn")&&a.classList.add("action-card--critical-accent"),c&&a.classList.add("action-card--late-strong");const d=document.createElement("div");d.className="action-card__premium-head";const u=document.createElement("h4");u.className="action-card__title",u.textContent=e.title;const p=document.createElement("div");p.className="action-card__menu";const g=document.createElement("button");g.type="button",g.className="action-card__menu-trigger",g.setAttribute("aria-label","Autres actions"),g.setAttribute("aria-expanded","false"),g.setAttribute("aria-haspopup","true"),g.textContent="⋯";const m=document.createElement("div");m.className="action-card__menu-panel",m.hidden=!0,m.setAttribute("role","menu");let b=null;function y(){m.hidden=!0,g.setAttribute("aria-expanded","false"),b&&(document.removeEventListener("click",b,!0),b=null)}function v(){m.hidden=!1,g.setAttribute("aria-expanded","true"),b=x=>{p.contains(x.target)||y()},document.addEventListener("click",b,!0)}g.addEventListener("click",x=>{x.stopPropagation(),m.hidden?v():y()});function h(x,S,N={}){const L=document.createElement("button");return L.type="button",L.className="action-card__menu-item",L.setAttribute("role","menuitem"),L.textContent=x,L.disabled=!!N.disabled,N.title&&(L.title=N.title),L.addEventListener("click",D=>{D.stopPropagation(),y(),S()}),L}if(m.append(h("Voir le détail",()=>{typeof e.onOpenDetail=="function"&&e.rawRow&&e.onOpenDetail(e.rawRow,t)}),h("Modifier",()=>{typeof e.onOpenEdit=="function"&&e.rawRow?e.onOpenEdit(e.rawRow,t):typeof e.onOpenDetail=="function"&&e.rawRow&&(e.onOpenDetail(e.rawRow,t),C("Modification en ligne : prévoir endpoint API dédié.","info"))},{title:"Consultation : la mise à jour complète nécessite une évolution API (PATCH action)."}),h("Terminer",()=>{C("Clôture : à brancher sur PATCH /api/actions/:id (statut) — non disponible dans cette version.","info")},{disabled:t==="done",title:t==="done"?"Action déjà terminée":"Le passage au statut « terminé » nécessite une API de mise à jour (non exposée ici)."})),e.canAssign!==!1&&e.actionId&&Array.isArray(e.users)&&typeof e.onAssign=="function"){const x=document.createElement("div");x.className="action-card__menu-assign",x.addEventListener("click",D=>D.stopPropagation());const S=document.createElement("div");S.className="action-card__menu-assign-label",S.textContent="Réassigner";const N=document.createElement("select");N.id=`assign-${e.actionId}`,N.className="action-card__menu-assign-select",N.setAttribute("aria-label","Assigner un responsable");const L=document.createElement("option");if(L.value="",L.textContent="Non assigné",N.append(L),e.users.forEach(D=>{const q=document.createElement("option");q.value=D.id,q.textContent=`${D.name} (${D.role})`,e.assigneeId&&D.id===e.assigneeId&&(q.selected=!0),N.append(q)}),e.assigneeId&&!e.users.some(D=>D.id===e.assigneeId)){const D=document.createElement("option");D.value=e.assigneeId,D.textContent=e.assigneeName||"Responsable (hors liste)",D.selected=!0,N.append(D)}N.addEventListener("change",()=>{e.onAssign(e.actionId,N.value||null)}),x.append(S,N),m.append(x)}p.append(g,m),d.append(u,p);const k=document.createElement("span");k.className=Md(t),k.textContent=e.statusLabel||"—";const _=document.createElement("div");_.className="action-card__premium-meta";const f=document.createElement("div");f.className="action-card__due-compact",c&&f.classList.add("action-card__due-compact--late"),f.title=o?`Échéance : ${o}`:"Sans échéance";const E=document.createElement("span");if(E.className="action-card__due-compact-date",E.textContent=o||"—",f.append(E),c&&t!=="overdue"){const x=document.createElement("span");x.className="action-card__due-badge action-card__due-badge--mini",x.textContent="Retard",f.append(x)}_.append(k,f);const w=document.createElement("p");return w.className="action-card__owner-lite",w.textContent=i,a.append(d,_,w),a.addEventListener("click",x=>{x.target.closest(".action-card__menu")||typeof e.onOpenDetail=="function"&&e.rawRow&&e.onOpenDetail(e.rawRow,t)}),a.addEventListener("dragstart",x=>{e.actionId!=null&&(x.dataTransfer.setData("application/x-qhse-action-id",String(e.actionId)),x.dataTransfer.setData("text/plain",String(e.actionId)),x.dataTransfer.effectAllowed="move")}),a}function Rd(e){if(!e)return"—";try{const t=new Date(e);return Number.isNaN(t.getTime())?"—":t.toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit",month:"short",year:"numeric"})}catch{return"—"}}function Dd(){const e=document.createElement("dialog");e.className="action-detail-dialog";const t=document.createElement("div");t.className="action-detail-dialog__inner",t.innerHTML=`
    <div class="action-detail-dialog__head">
      <h2 class="action-detail-dialog__title" data-ad-title></h2>
      <button type="button" class="btn btn-secondary action-detail-dialog__close" aria-label="Fermer">Fermer</button>
    </div>
    <div class="action-detail-dialog__badges" data-ad-badges></div>
    <dl class="action-detail-dialog__grid">
      <dt>Statut</dt><dd data-ad-status></dd>
      <dt>Responsable</dt><dd data-ad-owner></dd>
      <dt>Échéance</dt><dd data-ad-due></dd>
      <dt>Identifiant</dt><dd><code class="action-detail-dialog__id" data-ad-id></code></dd>
      <dt>API</dt><dd class="action-detail-dialog__api"><code data-ad-api></code></dd>
    </dl>
    <div class="action-detail-dialog__block">
      <div class="action-detail-dialog__block-label">Description / périmètre</div>
      <p class="action-detail-dialog__detail" data-ad-detail></p>
    </div>
    <div class="action-detail-dialog__foot">
      <button type="button" class="btn btn-secondary" data-ad-copy>Copier l’identifiant</button>
    </div>
  `,e.append(t),document.body.append(e);function a(){e.close()}return t.querySelector(".action-detail-dialog__close").addEventListener("click",a),e.addEventListener("cancel",r=>{r.preventDefault(),a()}),t.querySelector("[data-ad-copy]").addEventListener("click",async()=>{var n,i;const r=((i=(n=t.querySelector("[data-ad-id]"))==null?void 0:n.textContent)==null?void 0:i.trim())||"";if(r)try{await navigator.clipboard.writeText(r)}catch{}}),{element:e,show(r,n){var m;if(!r)return;const i=String(r.title||"Action").trim()||"Action",o=String(r.status||"—").trim(),s=((m=r.assignee)==null?void 0:m.name)!=null&&String(r.assignee.name).trim()?String(r.assignee.name).trim():String(r.owner||"—").trim(),c=Rd(r.dueDate),l=String(r.id||""),d=r.detail!=null&&String(r.detail).trim()?String(r.detail).trim():"—";t.querySelector("[data-ad-title]").textContent=i,t.querySelector("[data-ad-status]").textContent=o,t.querySelector("[data-ad-owner]").textContent=s,t.querySelector("[data-ad-due]").textContent=c,t.querySelector("[data-ad-id]").textContent=l,t.querySelector("[data-ad-detail]").textContent=d,t.querySelector("[data-ad-api]").textContent=`${Qt()}/api/actions`;const u=t.querySelector("[data-ad-badges]");u.replaceChildren();const p=n||"",g=(b,y)=>{const v=document.createElement("span");v.className=`action-detail-dialog__pill ${y||""}`.trim(),v.textContent=b,u.append(v)};p==="overdue"?g("Priorité : retard","action-detail-dialog__pill--danger"):p==="doing"?g("En cours","action-detail-dialog__pill--warn"):p==="todo"?g("À lancer","action-detail-dialog__pill--info"):p==="done"&&g("Terminé","action-detail-dialog__pill--ok"),e.showModal()}}}const jd={todo:{label:"À lancer",hint:"Non démarré — prioriser le cadrage"},doing:{label:"En cours",hint:"Suivi actif — tenir les jalons"},overdue:{label:"En retard",hint:"Relance et escalade"},done:{label:"Terminé",hint:"Actions clôturées (statut métier)"}},Od=["overdue","todo","doing","done"],Hd={todo:[],doing:[],overdue:[],done:[]},Fd={overdue:"Aucune fiche en retard sur ce périmètre.",todo:"Rien en attente de démarrage — ou filtre masque la colonne.",doing:"Aucune action suivie en cours.",done:"Aucune action terminée ne correspond aux filtres."};function is(e){return String(e??"").trim().toUpperCase()}function co(e){return is(e)==="TERRAIN"}function Vd(e){const t=e.todo.length,a=e.doing.length,r=e.overdue.length,n=e.done.length;return{aLancer:t,enCours:a,enRetard:r,terminees:n}}function Bd(e){if(!e)return null;try{const t=new Date(e);return Number.isNaN(t.getTime())?null:t.toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric"})}catch{return null}}function Da(e){const t=String(e||"").toLowerCase().normalize("NFD").replace(new RegExp("\\p{M}","gu"),"");return/\bnon[\s-]*termine\b/.test(t)?"todo":/\b(termine|clos|clotur|ferme|complete|realise|valide|fait|acheve|done|closed)\b/.test(t)||t.includes("termine")||t.includes("clotur")||t.includes("ferme")||t.includes("realise")||t.includes("valide")?"done":t.includes("retard")?"overdue":t.includes("cours")?"doing":(t.includes("lancer"),"todo")}function Gd(e){return Array.isArray(e)?e.filter(t=>{const a=Da(t.status);if(a==="done")return!1;const r=as(a,t.dueDate);return r==="retard"||r==="urgent"}).length:0}function Ud(e,t){return e.getFullYear()===t.getFullYear()&&e.getMonth()===t.getMonth()&&e.getDate()===t.getDate()}function Wd(e){if(!Array.isArray(e))return 0;const t=new Date;return e.filter(a=>{if(Da(a.status)==="done"||!a.dueDate)return!1;const r=new Date(a.dueDate);return Number.isNaN(r.getTime())?!1:Ud(r,t)}).length}function Yd(e){return Array.isArray(e)?e.filter(t=>Da(t.status)!=="done").length:0}function Qd(e,t){const a=Array.isArray(e)?e.length:0;if(a===0)return"Aucune action dans ce périmètre — élargissez le filtre responsable ou créez une fiche.";const r=Yd(e),n=Wd(e);return[`${a} affichée${a>1?"s":""}`,`${r} à traiter`,n>0?`${n} échéance${n>1?"s":""} aujourd’hui`:null,t>0?`${t} critique${t>1?"s":""}`:null].filter(Boolean).join(" · ")}function Jd(e,t,a,r,n){var c,l;const o=["Pilotage QHSE",`Resp. ${((c=e.assignee)==null?void 0:c.name)??e.owner??"—"}`],s=Bd(e.dueDate);return s&&o.push(`Échéance ${s}`),{actionId:e.id,title:e.title,detail:o.join(" • "),assigneeId:e.assigneeId??null,assigneeName:((l=e.assignee)==null?void 0:l.name)??null,dueDateIso:e.dueDate??null,statusLabel:String(e.status||"—").trim()||"—",rawRow:e,onOpenDetail:n.onOpenDetail,onOpenEdit:n.onOpenEdit,users:t,onAssign:a,canAssign:r}}function Kd(e,t,a,r,n){const i={todo:[],doing:[],overdue:[],done:[]};return Array.isArray(e)&&e.forEach(o=>{const s=Jd(o,t,a,r,n),c=Da(o.status);i[c].push(s)}),i}function Xd(e){const t=document.createElement("div");return t.className="kanban-board kanban-board--pilotage kanban-board--pilotage-premium",Od.forEach(a=>{const r=e[a]||[],n=jd[a],i=document.createElement("section");i.className=`kanban-column kanban-column--pilotage kanban-column--pilotage-premium kanban-column--${a}`;const o=document.createElement("div");o.className="kanban-column-head";const s=document.createElement("h4");s.className="kanban-column-title",s.textContent=`${n.label} (${r.length})`,s.title=n.hint;const c=document.createElement("p");if(c.className="kanban-column-hint",c.textContent=n.hint,o.append(s,c),i.append(o),r.length===0){const l=document.createElement("p");l.className="kanban-column-empty",l.textContent=Fd[a]||"Aucune fiche.",i.append(l)}else r.forEach(l=>i.append(Pd(l,a)));t.append(i)}),t}function Zd(e,t,a={}){const{terrainOnly:r=!1}=a,n=document.createElement("div");n.className="actions-filter-toolbar actions-filter-toolbar--premium";const i=document.createElement("div");i.className="actions-filter-group";const o=document.createElement("label");o.htmlFor="qhse-actions-view",o.textContent="Responsable";const s=document.createElement("select");s.id="qhse-actions-view";const c=(b,y)=>{const v=document.createElement("option");v.value=b,v.textContent=y,s.append(v)};if(r)c("mine","Mes actions (profil terrain)"),s.title="Votre rôle limite la liste aux actions qui vous sont assignées.";else{c("all","Toutes les actions"),c("unassigned","Sans responsable déclaré"),c("mine","Mes actions (profil latéral)");const b=document.createElement("optgroup");b.label="Par responsable",e.forEach(y=>{const v=document.createElement("option");v.value=`user:${y.id}`,v.textContent=y.name,b.append(v)}),s.append(b)}i.append(o,s);const l=document.createElement("div");l.className="actions-filter-group";const d=document.createElement("label");d.htmlFor="qhse-actions-status",d.textContent="Statut";const u=document.createElement("select");u.id="qhse-actions-status",u.setAttribute("aria-label","Filtrer par colonne Kanban"),[["all","Toutes les colonnes"],["todo","À lancer"],["doing","En cours"],["overdue","En retard"],["done","Terminé"]].forEach(([b,y])=>{const v=document.createElement("option");v.value=b,v.textContent=y,u.append(v)}),l.append(d,u);const p=document.createElement("div");p.className="actions-filter-group";const g=document.createElement("label");g.htmlFor="qhse-actions-priority",g.textContent="Priorité";const m=document.createElement("select");return m.id="qhse-actions-priority",m.title="Dérivée de l’échéance et de la colonne (filtre local, sans requête API)",[["all","Toutes"],["retard","Retard / dépassé"],["urgent","Urgent (≤ 3 j)"],["normal","Normale (≤ 14 j)"],["planifie","Planifié"]].forEach(([b,y])=>{const v=document.createElement("option");v.value=b,v.textContent=y,m.append(v)}),p.append(g,m),n.append(i,l,p),t.view=s,t.status=u,t.priority=m,n}function ep(){var E;qt(),Dt();const e=Dd(),t={onOpenDetail:(w,x)=>e.show(w,x),onOpenEdit:(w,x)=>{e.show(w,x),C("Édition complète : prévoir un PATCH /api/actions/:id côté API (hors périmètre actuel).","info")}},a=document.createElement("section");a.className="page-stack page-stack--actions-premium";const r=document.createElement("article");r.className="content-card card-soft actions-page__main-card",r.innerHTML=`
    <div class="content-card-head content-card-head--split">
      <div>
        <div class="section-kicker">Pilotage QHSE</div>
        <h3>Plan d’actions</h3>
        <p class="content-card-lead content-card-lead--narrow">
          Vue synthèse puis colonnes : retards en premier, cliquez une carte pour le détail.
        </p>
        <p class="qhse-simple-alt-lead">
          Commencez par la colonne « En retard », puis ouvrez une carte pour voir quoi faire.
        </p>
      </div>
      <button type="button" class="btn btn-primary actions-create-btn btn--pilotage-cta">
        Créer une action
      </button>
    </div>
  `;const n=r.querySelector(".content-card-lead"),i=document.createElement("p");i.className="actions-page__summary",i.setAttribute("aria-live","polite");const o=document.createElement("div");o.className="actions-page__kpi-host";const s=document.createElement("div");s.className="actions-filter-toolbar-host",n.after(i),i.after(o),o.after(s);const c=document.createElement("div");c.className="actions-page__board-host",s.after(c);let l=[],d=[];const u={view:null,status:null,priority:null};let p=co((E=Me())==null?void 0:E.role)?"mine":"all",g="all",m="all",b=async()=>{},y=!0;function v(w){return Array.isArray(w)?w.filter(x=>{const S=Da(x.status);return!(g!=="all"&&S!==g||m!=="all"&&(S==="done"||as(S,x.dueDate)!==m))}):[]}function h(){const w=v(l);k(Kd(w,d,b,y,t))}function k(w){const x=v(l),S=Gd(x);i.textContent=Qd(x,S);const N=Vd(w);o.replaceChildren(qd([{label:"Critiques",value:S,tone:"red",hint:"",hintTitle:"Urgent (≤ 3 j) ou retard — hors terminé, périmètre filtré actuel"},{label:"En retard",value:N.enRetard,tone:"amber",hint:"",hintTitle:"Nombre de fiches dans la colonne « En retard » (filtre actif)"},{label:"En cours",value:N.enCours,tone:"blue",hint:"",hintTitle:"Colonne « En cours » — périmètre filtré"},{label:"À lancer",value:N.aLancer,tone:"green",hint:"",hintTitle:"Colonne « À lancer » — backlog à démarrer"}])),c.replaceChildren(Xd(w))}k(Hd);async function _(){var w;try{if(p==="mine"&&!wr()){C("Choisissez un profil dans le menu latéral pour utiliser « Mes actions ».","warning");const q=u.view;if(q&&q.options.length===1&&((w=q.options[0])==null?void 0:w.value)==="mine"){l=[],h();return}q&&(q.value="all"),p="all"}const x=new URLSearchParams;if(x.set("limit","500"),p==="unassigned")x.set("unassigned","1");else if(p==="mine"){const q=wr();q&&x.set("assigneeId",q)}else p.startsWith("user:")&&x.set("assigneeId",p.slice(5));const S=x.toString(),N=`/api/actions${S?`?${S}`:""}`,L=await Se(N);if(!L.ok)throw new Error(`HTTP ${L.status}`);const D=await L.json();l=Array.isArray(D)?D:[],h()}catch(x){console.error("[actions] GET /api/actions",x),C("Erreur serveur","error"),l=[],h()}}b=async(w,x)=>{try{const S=await Se(`/api/actions/${encodeURIComponent(w)}/assign`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({assigneeId:x??null})});if(!S.ok){let N="Erreur serveur";try{const L=await S.json();L.error&&(N=L.error)}catch{}C(N,"error");return}C(x?"Responsable assigné":"Assignation retirée","info"),Be.add({module:"actions",action:x?"Assignation action":"Retrait assignation",detail:`Action ${w}`,user:"Pilotage QHSE"}),await _()}catch(S){console.error("[actions] PATCH assign",S),C("Erreur serveur","error")}},(async function(){try{d=await pi()}catch(L){console.error("[actions] GET /api/users",L),C("Liste utilisateurs indisponible — assignation désactivée","error"),d=[]}const x=Me();y=lt(x==null?void 0:x.role,"actions","write"),!y&&x?(f.disabled=!0,f.title="Création réservée (rôle lecture ou limité)",f.style.opacity="0.55"):(f.disabled=!1,f.removeAttribute("title"),f.style.opacity="");const S=co(x==null?void 0:x.role);S&&(p="mine");const N=Zd(d,u,{terrainOnly:S});s.append(N),u.view.value=p,u.status.value=g,u.priority.value=m,u.view.addEventListener("change",()=>{p=u.view.value,_()}),u.status.addEventListener("change",()=>{g=u.status.value,h()}),u.priority.addEventListener("change",()=>{m=u.priority.value,h()}),await _()})();const f=r.querySelector(".actions-create-btn");return f.addEventListener("click",async()=>{try{const w=d.find(N=>is(N.role)==="QHSE"),x={title:"Nouvelle action",detail:"Pilotage QHSE • Resp. Responsable QHSE",status:"À lancer",owner:"Responsable QHSE"};w&&(x.assigneeId=w.id,x.owner=w.name),Ne.activeSiteId&&(x.siteId=Ne.activeSiteId);const S=await Se("/api/actions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(x)});if(!S.ok){try{const N=await S.json();console.error("[actions] POST /api/actions",S.status,N)}catch{console.error("[actions] POST /api/actions",S.status)}C("Erreur serveur","error");return}C("Action enregistrée","info"),Be.add({module:"actions",action:"Création action",detail:"Depuis le plan d’actions — API",user:"Responsable QHSE"}),await _()}catch(w){console.error("[actions] POST /api/actions",w),C("Erreur serveur","error")}}),a.append(ba({title:"Plan d’actions — par où commencer ?",hint:"Les filtres avancés sont réduits : gardez « Responsable » et « Statut » pour cadrer votre liste.",nextStep:"Action principale : traiter d’abord les retards, puis les cartes « À lancer »."}),r),a}const rs="qhse_cfg_sensitive_access_v1",Lr="qhse_sensitive_access_pin_v1",Wr="qhse_sa_session_ok",Yr="qhse_sa_last_ok_ts",cr={protectionLevel:"standard",frequency:"per_session",actions:{confidential_document:!0,export_sensitive:!0,critical_validation:!0,security_zone:!1,sensitive_mutation:!0}},lo=[{key:"confidential_document",label:"Documents confidentiels",hint:"Validation d’import / rattachement de preuves sensibles."},{key:"export_sensitive",label:"Exports de rapports sensibles",hint:"PDF audit, reporting périodique, exports CSV liés aux constats."},{key:"critical_validation",label:"Validation d’actions critiques",hint:"Changement de statut d’exigence depuis l’assistance conformité."},{key:"security_zone",label:"Zones « sécurité » (IA, analyses)",hint:"Lancement de simulations au Centre IA — désactivé par défaut (usage fréquent)."},{key:"sensitive_mutation",label:"Enregistrements sensibles après import",hint:"Confirmation d’import vers la base (incidents, audits, etc.)."}];function tp(e,t){try{const a=localStorage.getItem(e);if(!a)return{...t};const r=JSON.parse(a);return r&&typeof r=="object"?r:{...t}}catch{return{...t}}}function Ir(){const e=tp(rs,{}),t={...cr.actions,...e.actions||{}};return{enabled:!!e.enabled,protectionLevel:e.protectionLevel==="strict"?"strict":cr.protectionLevel,frequency:["always","per_session","interval_15m"].includes(e.frequency)?e.frequency:cr.frequency,actions:t}}function ap(e){try{localStorage.setItem(rs,JSON.stringify(e))}catch{}}function Qr(){try{const e=localStorage.getItem(Lr);return e&&/^\d{6}$/.test(e)?e:""}catch{return""}}function po(e){try{e&&/^\d{6}$/.test(e)?localStorage.setItem(Lr,e):localStorage.removeItem(Lr)}catch{}}function ip(e,t){return!!t.actions[e]}function rp(e){if(!e.enabled)return!1;if(!Qr()||e.frequency==="always")return!0;try{if(e.frequency==="per_session")return sessionStorage.getItem(Wr)!=="1";if(e.frequency==="interval_15m"){const t=Number(sessionStorage.getItem(Yr));return Number.isFinite(t)?Date.now()-t>900*1e3:!0}}catch{return!0}return!0}function np(e){try{e.frequency==="per_session"&&sessionStorage.setItem(Wr,"1"),e.frequency==="interval_15m"&&sessionStorage.setItem(Yr,String(Date.now()))}catch{}}function wa(){try{sessionStorage.removeItem(Wr),sessionStorage.removeItem(Yr)}catch{}}const uo="qhse-sensitive-access-gate-styles",op=`
.qhse-sensitive-access-overlay{
  position:fixed;inset:0;z-index:10050;
  display:flex;align-items:center;justify-content:center;
  padding:max(20px,env(safe-area-inset-bottom,20px));
  background:rgba(8,12,22,.55);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);
  box-sizing:border-box;
}
.qhse-sensitive-access-dialog{
  position:relative;
  width:min(380px,100%);
  margin:0;padding:0;border:none;border-radius:16px;
  background:var(--color-background-primary,#fff);
  color:var(--color-text-primary,#0f172a);
  box-shadow:0 20px 50px rgba(0,0,0,.2),0 1px 0 rgba(255,255,255,.06) inset;
  border:1px solid var(--color-border-secondary,rgba(15,23,42,.1));
  overflow:hidden;
  max-height:min(92vh,640px);
  overflow-y:auto;
}
.qhse-sensitive-access-dialog::before{
  content:'';position:absolute;left:0;top:0;bottom:0;width:4px;border-radius:16px 0 0 16px;
  background:linear-gradient(180deg,var(--palette-accent,#14b8a6),#0ea5e9);
  opacity:.9;pointer-events:none;z-index:1;
}
[data-theme='dark'] .qhse-sensitive-access-dialog{
  background:linear-gradient(165deg,#1a2230 0%,#141a24 100%);
  border-color:rgba(148,163,184,.16);
  box-shadow:0 24px 56px rgba(0,0,0,.45);
}
.qhse-sensitive-access-head{
  position:relative;z-index:2;
  padding:18px 22px 14px 22px;
  border-bottom:1px solid var(--color-border-tertiary,rgba(15,23,42,.08));
}
.qhse-sensitive-access-kicker{
  margin:0 0 6px;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;
  color:var(--color-text-tertiary,#64748b);
}
.qhse-sensitive-access-title{
  margin:0;font-size:1.15rem;font-weight:800;letter-spacing:-.02em;line-height:1.25;
  color:var(--color-text-primary);
}
.qhse-sensitive-access-desc{
  margin:10px 0 0;font-size:13px;line-height:1.55;color:var(--color-text-secondary,#475569);
}
.qhse-sensitive-access-strict{
  margin:12px 0 0;padding:10px 12px;border-radius:12px;
  border:1px dashed rgba(245,158,11,.35);
  background:rgba(245,158,11,.08);
  font-size:12px;line-height:1.45;color:var(--color-text-secondary);
}
.qhse-sensitive-access-body{padding:18px 22px 20px}
.qhse-sensitive-access-label{
  display:block;margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
  color:var(--color-text-tertiary);
}
.qhse-sensitive-access-input{
  width:100%;box-sizing:border-box;
  padding:14px 16px;border-radius:12px;
  border:1px solid var(--color-border-secondary);
  background:var(--color-background-secondary,#f8fafc);
  color:var(--color-text-primary);
  font-size:22px;font-weight:700;letter-spacing:.35em;text-align:center;
  font-variant-numeric:tabular-nums;
}
.qhse-sensitive-access-input:focus{
  outline:none;border-color:rgba(20,184,166,.55);
  box-shadow:0 0 0 3px rgba(20,184,166,.18);
}
.qhse-sensitive-access-error{
  margin:10px 0 0;font-size:12px;font-weight:600;color:var(--color-text-danger,#b91c1c);
  min-height:1.25em;
}
.qhse-sensitive-access-actions{
  display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end;margin-top:18px;
}
.qhse-sensitive-access-actions .btn{min-height:44px;font-weight:700}
`;function sp(){if(document.getElementById(uo))return;const e=document.createElement("style");e.id=uo,e.textContent=op,document.head.append(e)}const cp={confidential_document:"Document confidentiel",export_sensitive:"Export sensible",critical_validation:"Validation critique",security_zone:"Zone sécurisée",sensitive_mutation:"Enregistrement sensible"};function Yt(e,t={}){sp();const a=Ir();if(!a.enabled||!ip(e,a))return Promise.resolve(!0);const r=Qr();if(!r)return C("Accès renforcé activé sans code enregistré — définissez un code à 6 chiffres dans Paramètres → Sécurité & accès.","warning"),Promise.resolve(!1);if(!rp(a))return Promise.resolve(!0);const n=cp[e]||"Action sensible",i=t.contextLabel||"";return new Promise(o=>{const s=document.createElement("div");s.className="qhse-sensitive-access-overlay",s.setAttribute("role","presentation");const c=document.createElement("div");c.className="qhse-sensitive-access-dialog",c.setAttribute("role","dialog"),c.setAttribute("aria-modal","true"),c.setAttribute("aria-labelledby","qhse-sa-title");const l=document.createElement("div");l.className="qhse-sensitive-access-head";const d=document.createElement("p");d.className="qhse-sensitive-access-kicker",d.textContent="Sécurité & accès";const u=document.createElement("h2");u.id="qhse-sa-title",u.className="qhse-sensitive-access-title",u.textContent=n;const p=document.createElement("p");if(p.className="qhse-sensitive-access-desc",p.textContent=i?`Pour continuer : ${i}. Saisissez votre code à 6 chiffres.`:"Pour continuer, saisissez votre code de vérification à 6 chiffres.",l.append(d,u,p),a.protectionLevel==="strict"){const x=document.createElement("p");x.className="qhse-sensitive-access-strict",x.textContent="Niveau de protection élevé : vérifiez l’action et le code avant de confirmer.",l.append(x)}const g=document.createElement("div");g.className="qhse-sensitive-access-body";const m=document.createElement("label");m.className="qhse-sensitive-access-label",m.setAttribute("for","qhse-sa-code-input"),m.textContent="Code à 6 chiffres";const b=document.createElement("input");b.id="qhse-sa-code-input",b.type="password",b.className="qhse-sensitive-access-input",b.setAttribute("inputmode","numeric"),b.setAttribute("pattern","[0-9]*"),b.setAttribute("maxlength","6"),b.setAttribute("autocomplete","one-time-code"),b.setAttribute("aria-describedby","qhse-sa-error");const y=document.createElement("p");y.id="qhse-sa-error",y.className="qhse-sensitive-access-error",y.setAttribute("role","alert");const v=document.createElement("div");v.className="qhse-sensitive-access-actions";const h=document.createElement("button");h.type="button",h.className="btn btn-secondary",h.textContent="Annuler";const k=document.createElement("button");k.type="button",k.className="btn btn-primary",k.textContent="Confirmer";const _=document.body.style.overflow;function f(){document.removeEventListener("keydown",w),document.body.style.overflow=_,s.remove()}function E(x){f(),o(x)}function w(x){x.key==="Escape"&&(x.preventDefault(),E(!1))}h.addEventListener("click",()=>E(!1)),k.addEventListener("click",()=>{const x=String(b.value||"").replace(/\D/g,"");if(x.length!==6){y.textContent="Le code doit contenir exactement 6 chiffres.";return}if(x!==r){y.textContent="Code incorrect.",b.value="",b.focus();return}np(a),E(!0)}),b.addEventListener("input",()=>{y.textContent="",b.value=String(b.value||"").replace(/\D/g,"").slice(0,6)}),b.addEventListener("keydown",x=>{x.key==="Enter"&&(x.preventDefault(),k.click())}),s.addEventListener("click",x=>{x.target===s&&E(!1)}),v.append(h,k),g.append(m,b,y,v),c.append(l,g),s.append(c),document.body.append(s),document.body.style.overflow="hidden",document.addEventListener("keydown",w),queueMicrotask(()=>b.focus())})}const mo="qhse-iso-page-styles",lp=`
.iso-page .iso-header-card .content-card-head{align-items:flex-start}
.iso-global-snapshot{border-radius:16px;padding:20px 22px;margin-top:4px;border:1px solid rgba(148,163,184,.16);background:linear-gradient(135deg,rgba(59,130,246,.08),rgba(255,255,255,.02))}
.iso-global-snapshot--ok{border-color:rgba(34,197,94,.25);background:linear-gradient(135deg,rgba(34,197,94,.1),rgba(255,255,255,.02))}
.iso-global-snapshot--watch{border-color:rgba(245,158,11,.28);background:linear-gradient(135deg,rgba(245,158,11,.1),rgba(255,255,255,.02))}
.iso-global-snapshot--risk{border-color:rgba(239,68,68,.3);background:linear-gradient(135deg,rgba(239,68,68,.1),rgba(255,255,255,.02))}
.iso-global-snapshot-inner{display:flex;flex-wrap:wrap;gap:20px;align-items:center}
.iso-global-score{min-width:120px;text-align:center}
.iso-global-pct{font-size:clamp(2.5rem,6vw,3.25rem);font-weight:800;letter-spacing:-.04em;line-height:1;color:var(--text)}
.iso-global-pct-suffix{font-size:1.25rem;font-weight:700;color:var(--text2);vertical-align:super;margin-left:2px}
.iso-global-score-caption{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);margin-top:4px}
.iso-global-copy{flex:1;min-width:200px}
.iso-global-label{font-size:18px;font-weight:800;color:var(--text);margin-bottom:6px}
.iso-global-message{margin:0;font-size:14px;line-height:1.5;color:var(--text2)}
.iso-global-meta{margin-top:10px;font-size:12px;font-weight:600;color:var(--text3)}
.iso-points-panel{border-radius:16px;padding:18px 20px;border:1px solid rgba(148,163,184,.18);background:rgba(0,0,0,.12);margin-top:12px}
.iso-points-panel-title{margin:0 0 6px;font-size:17px;font-weight:800;color:var(--text)}
.iso-points-panel-lead{margin:0 0 16px;font-size:13px;line-height:1.45;color:var(--text2)}
.iso-points-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
@media (max-width:900px){.iso-points-grid{grid-template-columns:1fr}}
.iso-points-col{border-radius:12px;padding:14px 16px;background:rgba(255,255,255,.03);border:1px solid rgba(148,163,184,.1);min-width:0}
.iso-points-col-head{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);margin-bottom:8px}
.iso-points-icon{width:8px;height:8px;border-radius:999px;flex-shrink:0}
.iso-points-icon--req{background:linear-gradient(135deg,#f59e0b,#ef4444)}
.iso-points-icon--doc{background:linear-gradient(135deg,#14b8a6,#0f766e)}
.iso-points-icon--aud{background:linear-gradient(135deg,#22c55e,#14b8a6)}
.iso-points-metric{font-size:14px;font-weight:700;color:var(--text);margin-bottom:10px}
.iso-points-list{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.iso-points-list li{min-width:0}
.iso-points-list-empty,.iso-points-list-more{font-size:12px;color:var(--text2);line-height:1.4}
.iso-points-list-more{color:var(--text3)}
.iso-points-action-link{display:block;width:100%;text-align:left;background:none;border:none;padding:0;font:inherit;font-weight:700;color:var(--accent,#2dd4bf);cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.iso-points-action-link:hover{filter:brightness(1.1)}
.iso-points-mini-badge{font-size:10px!important;padding:2px 6px!important;vertical-align:middle}
.iso-points-list-sub{display:block;font-size:11px;color:var(--text3);margin-top:4px}
.iso-points-doc-tag{display:inline-block;font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:2px 6px;border-radius:6px;margin-right:8px;background:rgba(239,68,68,.2);color:#fecaca}
.iso-points-list-note{margin:4px 0 0;font-size:12px;color:var(--text2);line-height:1.4}
.iso-norms-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:4px}
@media (max-width:1000px){.iso-norms-grid{grid-template-columns:1fr}}
.iso-norms-grid--lite{margin-top:8px}
.iso-norm-card{border:1px solid rgba(148,163,184,.14);border-radius:14px;padding:14px 16px;background:rgba(255,255,255,.02);display:grid;gap:8px;min-width:0}
.iso-norm-card--lite{padding:12px 14px;gap:10px}
.iso-norm-card-top{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px}
.iso-norm-line{margin:0;font-size:13px;line-height:1.45;color:var(--text2)}
.iso-norm-id{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--text3)}
.iso-norm-title{margin:0;font-size:15px;font-weight:700;line-height:1.3;color:var(--text)}
.iso-norm-hint{margin:0;font-size:12px;line-height:1.45;color:var(--text2)}
.iso-req-hot-wrap{display:grid;gap:10px;margin-top:8px}
.iso-req-hot-empty{margin:0;padding:14px;border-radius:12px;border:1px dashed rgba(148,163,184,.2);font-size:13px;color:var(--text2);line-height:1.45}
.iso-req-hot-item{display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;border:1px solid rgba(148,163,184,.12);background:rgba(255,255,255,.02)}
.iso-req-hot-main{flex:1;min-width:180px}
.iso-req-hot-title{font-weight:700;font-size:14px;color:var(--text);line-height:1.3}
.iso-req-hot-sub{font-size:12px;color:var(--text3);margin-top:4px}
.iso-req-hot-btn{font-size:12px!important;padding:8px 14px!important;min-height:36px!important}
.iso-toggle-full-req,.iso-toggle-full-docs{margin-top:0;width:100%;max-width:320px;align-self:flex-start;flex-shrink:0;position:relative;z-index:1}
.iso-req-full-wrap{margin-top:8px}
.iso-doc-attention-list{display:grid;gap:14px;margin-top:8px}
.iso-doc-attention-list--unified{gap:10px}
.iso-doc-attention-row--unified{padding:12px 14px}
.iso-doc-attention-row-top{display:flex;flex-wrap:wrap;align-items:flex-start;gap:8px 10px;min-width:0}
.iso-doc-attention-status-badge{font-size:10px!important;padding:2px 8px!important;flex-shrink:0}
.iso-doc-attention-block-title{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);margin-bottom:8px}
.iso-doc-attention-row{
  padding:10px 12px;border-radius:10px;background:rgba(0,0,0,.12);border:1px solid rgba(148,163,184,.1);
  display:flex;flex-direction:column;align-items:stretch;gap:6px;min-width:0;
}
.iso-doc-attention-row strong{display:block;font-size:13px;color:var(--text);min-width:0;word-break:break-word;line-height:1.35}
.iso-doc-attention-note{margin:6px 0 0;font-size:12px;color:var(--text2);line-height:1.4}
.iso-doc-attention-empty{margin:0;font-size:13px;color:var(--text2);line-height:1.45}
.iso-docs-priority{display:flex;flex-direction:column;align-items:stretch;gap:14px;min-width:0}
.iso-section-stack{display:grid;gap:14px;min-width:0}
.iso-table-wrap{overflow-x:auto;margin-top:8px;border-radius:12px;border:1px solid rgba(148,163,184,.1);max-width:100%}
.iso-doc-proof-strip{display:flex;flex-direction:column;align-items:stretch;gap:0;min-width:0;width:100%;box-sizing:border-box}
.iso-table{display:grid;grid-auto-rows:auto;gap:0;min-width:720px}
.iso-table-head,.iso-table-row{display:grid;grid-template-columns:minmax(180px,2.2fr) minmax(100px,1fr) minmax(110px,1fr) minmax(100px,1fr) minmax(110px,1fr);gap:10px;padding:10px 14px;align-items:center;font-size:12px}
.iso-req-table .iso-table-head,.iso-req-table .iso-table-row{
  grid-template-columns:minmax(200px,2.4fr) minmax(92px,0.9fr) minmax(130px,1.1fr) minmax(110px,1fr) minmax(140px,1.3fr);
  min-width:860px;
}
.iso-cell-small{font-size:11px;font-weight:600;margin-top:4px;display:inline-block}
.iso-analyze-btn{font-size:12px!important;padding:8px 12px!important;min-height:38px!important;white-space:nowrap}
.iso-table-head{font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);background:rgba(0,0,0,.15);border-bottom:1px solid rgba(148,163,184,.12)}
.iso-table-row{border-bottom:1px solid rgba(148,163,184,.08);padding:12px 14px}
.iso-table-row:last-child{border-bottom:none}
.iso-table-row .iso-cell-strong{font-weight:700;color:var(--text);line-height:1.35}
.iso-table-row .iso-cell-muted{color:var(--text2);line-height:1.35}
.iso-doc-table .iso-table-head,.iso-doc-table .iso-table-row{grid-template-columns:minmax(160px,2fr) 80px minmax(100px,1fr) minmax(120px,1.2fr);min-width:560px}
.iso-review-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:8px}
@media (max-width:640px){.iso-review-grid{grid-template-columns:1fr}}
.iso-review-tile{border-radius:12px;border:1px solid rgba(148,163,184,.12);padding:12px 14px;background:rgba(255,255,255,.02)}
.iso-review-tile span:first-child{display:block;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);margin-bottom:6px}
.iso-review-tile .iso-review-value{font-size:20px;font-weight:800;letter-spacing:-.02em;color:var(--text)}
.iso-review-tile .iso-review-detail{display:block;margin-top:4px;font-size:12px;color:var(--text2);line-height:1.4}
.iso-pilotage-aside{display:grid;gap:14px;align-content:start;min-width:0}

/* —— Hiérarchie visuelle (page ISO hub, dark premium) —— tout préfixé .iso-page pour limiter la portée —— */
.iso-page.iso-page--hub{
  gap:1.75rem;
}
.iso-page.iso-page--hub .iso-hub-intro.content-card{
  background:rgba(0,0,0,.06);
  border:1px solid rgba(148,163,184,.11);
  box-shadow:0 1px 0 rgba(255,255,255,.035) inset;
  border-radius:16px;
}
.iso-page.iso-page--hub .iso-hub-intro .content-card-head{margin-bottom:0}
/* Bandeau synthèse : lecture globale avant le hub normes */
.iso-page.iso-page--hub .iso-summary-band{
  width:100%;
  min-width:0;
}
.iso-page.iso-page--hub .iso-summary-band .iso-global-snapshot{
  margin-top:0;
  width:100%;
  box-sizing:border-box;
  border-radius:18px;
  padding:20px 24px;
}
.iso-page.iso-page--hub .iso-summary-band .iso-global-snapshot-inner{
  gap:22px;
  align-items:center;
}
.iso-page.iso-page--hub .iso-summary-band .iso-global-pct{
  font-size:clamp(2.35rem,5.5vw,3.1rem);
}
.iso-page.iso-page--hub .iso-summary-band .iso-global-label{
  font-size:17px;
}
.iso-page.iso-page--hub .iso-summary-band .iso-global-message{
  font-size:14px;
  line-height:1.52;
}
/* Cœur module : normes pleine largeur puis IA — hub normes visuellement dominant */
.iso-page.iso-page--hub .iso-focus-zone{
  display:grid;
  grid-template-columns:minmax(0,1.15fr) minmax(280px,380px);
  gap:1.65rem;
  align-items:stretch;
  width:100%;
  max-width:min(1180px,100%);
  margin-inline:auto;
  min-width:0;
}
.iso-page.iso-page--hub .iso-focus-zone--stack{
  display:flex;
  flex-direction:column;
  gap:1.75rem;
  align-items:stretch;
}
@media (max-width:960px){
  .iso-page.iso-page--hub .iso-focus-zone:not(.iso-focus-zone--stack){
    grid-template-columns:1fr;
  }
}
.iso-page.iso-page--hub .iso-focus-zone .iso-norms-hub{
  width:100%;
  max-width:none;
  margin-inline:0;
  min-width:0;
}
.iso-page.iso-page--hub .iso-focus-zone .iso-norms-central.content-card{
  width:100%;
}
.iso-page.iso-page--hub .iso-focus-zone .iso-norms-grid{
  gap:18px;
}
@media (min-width:900px){
  .iso-page.iso-page--hub .iso-focus-zone .iso-norms-hub .iso-norms-grid{
    grid-template-columns:repeat(3,minmax(0,1fr));
  }
}
.iso-page.iso-page--hub .iso-focus-zone .iso-ai-spotlight{
  display:flex;
  flex-direction:column;
  min-height:100%;
}
.iso-page.iso-page--hub .iso-focus-zone .iso-ai-spotlight .iso-ai-steps{
  margin-top:auto;
  padding-top:4px;
}
/* Repère visuel actions prioritaires */
.iso-page.iso-page--hub .iso-priority-shell{
  position:relative;
  max-width:min(1180px,100%);
  margin-inline:auto;
  padding-left:14px;
  width:100%;
  box-sizing:border-box;
}
.iso-page.iso-page--hub .iso-priority-shell::before{
  content:'';
  position:absolute;
  left:0;
  top:10px;
  bottom:10px;
  width:4px;
  border-radius:999px;
  background:linear-gradient(180deg,#fbbf24,#f97316,#ef4444);
  opacity:.85;
}
/* Second niveau : libellé de zone puis exigences / docs / revue */
.iso-page.iso-page--hub .iso-secondary-wrap{
  max-width:min(1180px,100%);
  margin-inline:auto;
  width:100%;
  min-width:0;
}
.iso-page.iso-page--hub .iso-zone-kicker{
  margin:0 0 12px;
  padding:0 2px;
  font-size:10px;
  font-weight:800;
  letter-spacing:.16em;
  text-transform:uppercase;
  color:var(--text3);
}
/* Zone secondaire : exigences, documents, revue */
.iso-page.iso-page--hub .iso-secondary-zone{
  display:flex;
  flex-direction:column;
  gap:1.5rem;
  margin-top:.35rem;
  padding-top:1.65rem;
  border-top:1px solid rgba(148,163,184,.12);
}
/* Bloc central normes : palier visuel maximal */
.iso-page.iso-page--hub .iso-norms-central.content-card{
  position:relative;
  z-index:1;
  border-radius:20px;
  border:1px solid rgba(125,211,252,.24);
  background:linear-gradient(165deg,rgba(255,255,255,.06) 0%,rgba(255,255,255,.022) 45%,rgba(8,12,20,.35) 100%);
  box-shadow:
    0 0 0 1px rgba(125,211,252,.1),
    0 22px 56px rgba(0,0,0,.3),
    0 1px 0 rgba(255,255,255,.07) inset;
}
.iso-page.iso-page--hub .iso-norms-hero-wrap .content-card-head{padding-bottom:6px;border-bottom:1px solid rgba(125,211,252,.1);margin-bottom:4px}
.iso-page.iso-page--hub .iso-norms-hero-wrap .content-card-head h3{
  font-size:1.32rem;
  letter-spacing:-.025em;
}
.iso-page.iso-page--hub .iso-norms-hero-wrap .content-card-lead{
  max-width:62ch;
  line-height:1.55;
  color:var(--text2);
}
.iso-page.iso-page--hub .iso-norms-hero-wrap .iso-norms-grid{
  margin-top:14px;
  gap:14px;
}
.iso-page.iso-page--hub .iso-norm-card--hero{
  padding:16px 18px;
  border-radius:16px;
  border-color:rgba(148,163,184,.2);
  background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.012));
}
.iso-page.iso-page--hub .iso-norm-card--hero .iso-norm-title{
  margin:6px 0 6px;
  font-size:14px;
  font-weight:700;
  line-height:1.3;
}
.iso-page.iso-page--hub .iso-norm-card--hero .iso-norm-hint{
  margin:10px 0 0;
  font-size:12px;
  line-height:1.45;
}
/* Assistant conformité : second palier, halo distinct des cartes neutres */
.iso-page.iso-page--hub .iso-ai-spotlight{
  position:relative;
  overflow:hidden;
  border-radius:18px;
  padding:22px 26px 24px;
  border:1px solid rgba(125,211,252,.32);
  background:linear-gradient(135deg,rgba(56,189,248,.16),rgba(168,85,247,.1),rgba(255,255,255,.028));
  box-shadow:
    0 1px 0 rgba(255,255,255,.07) inset,
    0 0 0 1px rgba(56,189,248,.08),
    0 16px 48px rgba(0,0,0,.22);
}
.iso-page.iso-page--hub .iso-ai-spotlight::before{
  content:'';
  position:absolute;
  inset:0;
  background:radial-gradient(ellipse 70% 55% at 15% -10%,rgba(56,189,248,.2),transparent 52%);
  pointer-events:none;
}
.iso-page.iso-page--hub .iso-ai-visual{
  position:absolute;
  top:-28%;
  right:-12%;
  width:min(220px,55vw);
  height:min(220px,55vw);
  border-radius:50%;
  background:radial-gradient(circle at 32% 28%,rgba(192,132,252,.42),rgba(56,189,248,.22) 42%,transparent 68%);
  filter:blur(0.5px);
  opacity:.95;
  pointer-events:none;
  z-index:0;
}
.iso-page.iso-page--hub .iso-ai-spotlight>*{
  position:relative;
  z-index:1;
}
.iso-page.iso-page--hub .iso-ai-spotlight .iso-ai-visual{
  z-index:0;
}
.iso-page.iso-page--hub .iso-ai-spotlight .iso-ai-badge{
  display:inline-flex;
  align-items:center;
  gap:8px;
  font-size:10px;
  font-weight:800;
  letter-spacing:.14em;
  text-transform:uppercase;
  color:#a5f3fc;
  margin-bottom:10px;
  padding:6px 12px;
  border-radius:999px;
  background:rgba(0,0,0,.28);
  border:1px solid rgba(125,211,252,.35);
  box-shadow:0 0 20px rgba(56,189,248,.15);
}
.iso-page.iso-page--hub .iso-ai-spotlight .iso-ai-badge::before{
  content:'';
  width:7px;
  height:7px;
  border-radius:50%;
  background:linear-gradient(135deg,#38bdf8,#c084fc);
  box-shadow:0 0 10px rgba(56,189,248,.7);
  flex-shrink:0;
}
.iso-page.iso-page--hub .iso-ai-spotlight h3{
  margin:0 0 10px;
  font-size:1.3rem;
  font-weight:800;
  letter-spacing:-.02em;
  color:var(--text);
}
.iso-page.iso-page--hub .iso-ai-spotlight .iso-ai-lead{
  margin:0;
  font-size:13.5px;
  line-height:1.62;
  color:var(--text2);
  max-width:72ch;
}
.iso-page.iso-page--hub .iso-ai-spotlight .iso-ai-trust{
  margin:0 0 14px;
  padding:10px 12px;
  border-radius:12px;
  border:1px dashed rgba(196,181,253,.28);
  background:rgba(0,0,0,.14);
  font-size:12px;
  line-height:1.55;
  color:var(--text3);
  max-width:72ch;
}
.iso-page.iso-page--hub .iso-ai-spotlight .iso-ai-steps{
  margin:18px 0 0;
  padding:0;
  list-style:none;
  display:flex;
  flex-wrap:wrap;
  gap:12px;
}
.iso-page.iso-page--hub .iso-ai-spotlight .iso-ai-steps li{
  font-size:12px;
  font-weight:600;
  color:var(--text2);
  padding:10px 14px;
  border-radius:12px;
  background:rgba(0,0,0,.26);
  border:1px solid rgba(125,211,252,.2);
  line-height:1.4;
}
/* Actions prioritaires : palier intermédiaire (ni héros ni liste plate) */
.iso-page.iso-page--hub .iso-points-panel{
  margin-top:0;
  padding:22px 24px 24px;
  border-radius:18px;
  border:1px solid rgba(148,163,184,.17);
  background:linear-gradient(180deg,rgba(0,0,0,.2),rgba(0,0,0,.11));
  box-shadow:0 10px 32px rgba(0,0,0,.2);
}
.iso-page.iso-page--hub .iso-actions-priority-section .iso-points-panel-title{
  font-size:1.07rem;
  letter-spacing:-.018em;
}
.iso-page.iso-page--hub .iso-points-panel-title{margin-bottom:8px}
.iso-page.iso-page--hub .iso-points-panel-lead{margin-bottom:20px;line-height:1.55}
.iso-page.iso-page--hub .iso-points-grid{gap:16px}
.iso-page.iso-page--hub .iso-points-col{
  padding:16px 18px;
  border-radius:14px;
  background:rgba(255,255,255,.025);
  border-color:rgba(148,163,184,.11);
}
.iso-page.iso-page--hub .iso-points-list{gap:12px}
/* Cartes détail (exigences, docs, revue) : palier bas — moins d’élévation */
.iso-page.iso-page--hub .two-column .content-card.card-soft,
.iso-page.iso-page--hub .iso-secondary-zone>article.content-card.card-soft{
  background:rgba(0,0,0,.065);
  border:1px solid rgba(148,163,184,.09);
  box-shadow:none;
  border-radius:15px;
}
.iso-page.iso-page--hub .two-column .content-card .content-card-head{
  border-bottom:1px solid rgba(255,255,255,.05);
  padding-bottom:12px;
  margin-bottom:4px;
}
.iso-page.iso-page--hub .iso-section-stack{gap:18px}
.iso-page.iso-page--hub .iso-pilotage-aside{gap:18px}
.iso-page.iso-page--hub .iso-req-hot-wrap{gap:12px;margin-top:10px}
.iso-page.iso-page--hub .iso-req-hot-item{
  padding:14px 16px;
  border-radius:14px;
  background:rgba(255,255,255,.02);
  border-color:rgba(148,163,184,.1);
}
.iso-page.iso-page--hub .two-column{gap:20px}
/* Registre + documents : évite le débordement de grille (min-content table) et les chevauchements */
.iso-page.iso-page--hub .iso-register-docs-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start}
@media (max-width:1024px){
  .iso-page.iso-page--hub .iso-register-docs-layout{grid-template-columns:1fr}
}
.iso-page.iso-page--hub .iso-register-docs-layout > .iso-register-docs-col{min-width:0}
.iso-page.iso-page--hub .iso-req-hub-card,
.iso-page.iso-page--hub .iso-docs-hub-card{
  min-width:0;
  display:flex;
  flex-direction:column;
  align-items:stretch;
  gap:14px;
}
.iso-page.iso-page--hub .iso-req-hub-card > .content-card-head,
.iso-page.iso-page--hub .iso-docs-hub-card > .content-card-head{
  flex-shrink:0;
  margin-bottom:0;
}
.iso-page.iso-page--hub .iso-req-hub-card > .iso-table-wrap,
.iso-page.iso-page--hub .iso-docs-hub-card > .iso-doc-proof-strip,
.iso-page.iso-page--hub .iso-docs-hub-card > .iso-docs-priority{
  flex-shrink:0;
  min-width:0;
}
.iso-page.iso-page--hub .iso-req-hub-card > .iso-table-wrap{margin-top:0}
.iso-page.iso-page--hub .iso-docs-hub-card > .iso-doc-proof-strip{margin-top:0;margin-bottom:0}
.iso-page.iso-page--hub .iso-review-hub-card{
  display:flex;
  flex-direction:column;
  align-items:stretch;
  gap:14px;
  min-width:0;
}
.iso-page.iso-page--hub .iso-review-hub-card > .content-card-head{
  flex-shrink:0;
  margin-bottom:0;
}
.iso-page.iso-page--hub .iso-review-hub-card > .iso-review-grid{
  flex:1 1 auto;
  min-width:0;
}
.iso-page.iso-page--hub .iso-doc-import-bar{flex-shrink:0;min-width:0}
.iso-page.iso-page--hub .iso-doc-attention-list{min-width:0}
.iso-page.iso-page--hub .iso-docs-priority .iso-doc-import-bar{margin-bottom:0}
.iso-page.iso-page--hub .iso-req-full-wrap{min-width:0}
.iso-page.iso-page--hub .iso-review-hub-card .iso-review-grid{margin-top:0}
.iso-req-table .iso-table-row{align-items:start}
.iso-req-table .iso-table-row > *{min-width:0}

/* —— Cockpit premium : hero, cycle, hub normes enrichi, priorités, preuves, audits —— */
.iso-page.iso-page--cockpit.iso-page--hub{gap:1.85rem}
.iso-page.iso-page--cockpit .iso-cockpit-hero.content-card{
  border-radius:20px;
  border:1px solid rgba(125,211,252,.2);
  background:linear-gradient(165deg,rgba(255,255,255,.07) 0%,rgba(255,255,255,.02) 42%,rgba(8,12,22,.45) 100%);
  box-shadow:0 20px 50px rgba(0,0,0,.28),0 1px 0 rgba(255,255,255,.06) inset;
}
.iso-cockpit-hero-top{
  display:flex;
  flex-wrap:wrap;
  align-items:flex-start;
  justify-content:space-between;
  gap:18px 24px;
  margin-bottom:18px;
}
.iso-cockpit-hero-copy{flex:1;min-width:min(100%,280px);max-width:720px}
.iso-cockpit-hero-copy h1{
  margin:0;
  font-size:var(--type-page-title-size,clamp(1.5rem,3vw,2rem));
  font-weight:800;
  letter-spacing:-.03em;
  line-height:1.18;
  color:var(--text);
}
.iso-cockpit-hero-lead{max-width:62ch;line-height:1.55;margin-top:8px}
.iso-cockpit-hero-actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.iso-cockpit-hero-kpis{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:12px 16px;
  margin-bottom:6px;
}
.iso-cockpit-hero-kpis--dual{
  grid-template-columns:repeat(2,minmax(0,1fr));
  max-width:520px;
}
.iso-cockpit-hero-snapshot-host--compact .iso-global-snapshot{
  margin-top:10px;
  padding:16px 18px;
}
/* Évite le double affichage du % : déjà dans les KPI du hero */
.iso-cockpit-hero-snapshot-host--compact .iso-global-score{
  display:none;
}
.iso-page.iso-page--cockpit .iso-conformity-charts-row--single{
  grid-template-columns:1fr;
  max-width:min(720px,100%);
  margin-inline:auto;
}
.iso-page.iso-page--cockpit .iso-conformity-charts-row--single .iso-conformity-chart-card{
  margin-inline:0;
}
.iso-page.iso-page--hub .iso-cockpit-priorities .content-card-head h3{
  font-size:1.22rem;
  letter-spacing:-.02em;
}
.iso-page.iso-page--hub .iso-section-stack .content-card-head h3,
.iso-page.iso-page--hub .iso-pilotage-aside .content-card-head h3{
  font-size:1.12rem;
  letter-spacing:-.015em;
}
@media (max-width:720px){
  .iso-cockpit-hero-kpis{grid-template-columns:1fr}
}
.iso-hero-kpi{
  border-radius:14px;
  padding:14px 16px;
  background:rgba(0,0,0,.22);
  border:1px solid rgba(148,163,184,.14);
  text-align:center;
}
.iso-hero-kpi-value{
  display:block;
  font-size:clamp(1.65rem,4vw,2rem);
  font-weight:800;
  letter-spacing:-.03em;
  color:var(--text);
  line-height:1.1;
}
.iso-hero-kpi-label{
  display:block;
  margin-top:8px;
  font-size:10px;
  font-weight:800;
  letter-spacing:.12em;
  text-transform:uppercase;
  color:var(--text3);
  line-height:1.35;
}
.iso-cockpit-hero-snapshot-host .iso-global-snapshot{
  margin-top:12px;
  width:100%;
  box-sizing:border-box;
  border-radius:16px;
}
.iso-compliance-cycle{
  display:flex;
  flex-wrap:wrap;
  align-items:stretch;
  gap:8px 10px;
  margin:14px 0 18px;
  padding:14px 16px;
  border-radius:14px;
  background:rgba(0,0,0,.18);
  border:1px solid rgba(148,163,184,.12);
}
.iso-norms-central .iso-compliance-cycle{
  margin-top:18px;
  margin-bottom:0;
  opacity:.95;
}
.iso-compliance-cycle-step{
  flex:1;
  min-width:72px;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:6px;
  padding:8px 6px;
  text-align:center;
}
.iso-cycle-num{
  width:28px;height:28px;border-radius:999px;
  display:flex;align-items:center;justify-content:center;
  font-size:12px;font-weight:800;
  background:linear-gradient(135deg,rgba(56,189,248,.35),rgba(168,85,247,.22));
  border:1px solid rgba(125,211,252,.35);
  color:var(--text);
}
.iso-cycle-label{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text3);line-height:1.25}
.iso-compliance-cycle-cap{
  width:100%;
  margin:10px 0 0;
  font-size:11px;
  line-height:1.45;
  color:var(--text3);
  text-align:center;
}
.iso-norm-cockpit-metrics{
  margin-top:10px;
  padding-top:12px;
  border-top:1px solid rgba(148,163,184,.14);
  display:grid;
  gap:8px;
}
.iso-norm-metric-row{
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  justify-content:space-between;
  gap:8px;
  font-size:12px;
}
.iso-norm-metric-label{color:var(--text3);font-weight:600}
.iso-norm-metric-val{font-weight:800;color:var(--text)}
.iso-norm-metric-val--muted{font-weight:700;color:var(--text2)}
.iso-norm-audit-line{font-size:11px;font-weight:600;color:var(--text2);text-align:right;max-width:58%}
.iso-norm-metric-row--audit{align-items:flex-start}
.iso-req-filter-bar{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  margin-bottom:12px;
  padding:4px 2px 0;
}
.iso-req-filter-btn{font-size:12px!important;padding:8px 14px!important;min-height:36px!important}
.iso-req-filter-btn--active{
  border-color:rgba(56,189,248,.45)!important;
  background:rgba(56,189,248,.12)!important;
  color:var(--text)!important;
}
.iso-req-table .iso-table-row{
  transition:background .12s ease;
}
.iso-req-table .iso-table-row:hover{
  background:rgba(255,255,255,.035);
}
.iso-req-status-cell{
  display:flex;
  align-items:center;
}
.iso-req-status-badge{
  display:inline-block;
  min-width:7.25rem;
  text-align:center;
  box-sizing:border-box;
}
.iso-audits-linked-item-top{
  display:flex;
  flex-wrap:wrap;
  align-items:flex-start;
  justify-content:space-between;
  gap:8px 12px;
}
.iso-audits-linked-status{
  flex-shrink:0;
  font-size:9px!important;
  letter-spacing:.06em;
}
.iso-cockpit-priorities .content-card-head{border-bottom:1px solid rgba(255,255,255,.06);padding-bottom:12px;margin-bottom:14px}
.iso-cockpit-prio-list{display:grid;gap:12px}
.iso-cockpit-human-row{
  display:grid;
  grid-template-columns:1fr auto;
  gap:12px 16px;
  padding:14px 16px;
  border-radius:14px;
  border:1px solid rgba(148,163,184,.12);
  background:rgba(255,255,255,.025);
  align-items:start;
}
@media (max-width:800px){
  .iso-cockpit-human-row{grid-template-columns:1fr}
}
.iso-cockpit-human-title{font-weight:800;font-size:14px;color:var(--text);line-height:1.3}
.iso-cockpit-human-detail{margin:6px 0 0;font-size:12px;line-height:1.45;color:var(--text2)}
.iso-cockpit-human-meta{display:flex;flex-wrap:wrap;align-items:center;gap:8px;justify-content:flex-end}
.iso-cockpit-human-row .iso-human-actions{
  grid-column:1/-1;
  display:flex;flex-wrap:wrap;gap:8px;
}
.iso-human-btn{font-size:11px!important;padding:6px 12px!important;min-height:32px!important}
.iso-ia-suggestion-pill{
  display:inline-flex;
  align-items:center;
  font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;
  padding:4px 8px;border-radius:999px;
  background:rgba(168,85,247,.18);
  border:1px solid rgba(192,132,252,.35);
  color:#e9d5ff;
}
.iso-cockpit-prio-action{margin-top:4px;padding-top:4px}
.iso-doc-proof-strip{
  margin-top:4px;
  margin-bottom:14px;
  padding:12px 14px;
  border-radius:12px;
  background:rgba(0,0,0,.14);
  border:1px solid rgba(148,163,184,.1);
}
.iso-doc-proof-strip-title{
  font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);margin-bottom:10px
}
.iso-doc-proof-row{
  display:flex;align-items:flex-start;justify-content:space-between;gap:10px;
  padding:8px 0;border-bottom:1px solid rgba(148,163,184,.08);
  font-size:13px;min-width:0;
}
.iso-doc-proof-row:last-child{border-bottom:none}
.iso-doc-proof-name{font-weight:600;color:var(--text);min-width:0;word-break:break-word;line-height:1.35}
.iso-doc-proof-badge{font-size:10px!important;padding:2px 8px!important}
.iso-doc-import-bar{
  margin-bottom:12px;padding:12px 14px;border-radius:12px;
  border:1px solid rgba(82,148,247,.22);
  background:linear-gradient(165deg,rgba(82,148,247,.07),rgba(0,0,0,.1));
}
.iso-doc-import-lead{margin:0 0 10px;font-size:12px;line-height:1.45;color:var(--text2);max-width:62ch}
.iso-doc-import-btn{max-width:280px}
.iso-import-overlay{
  position:fixed;inset:0;z-index:9998;display:flex;align-items:center;justify-content:center;
  padding:max(16px,env(safe-area-inset-bottom,16px));
  background:rgba(8,12,20,.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
}
.iso-import-dialog{
  width:min(520px,100%);max-height:min(88vh,720px);overflow:auto;margin:0;
  padding:18px 20px 20px;border-radius:16px;
  border:1px solid rgba(148,163,184,.18);
  background:linear-gradient(180deg,rgba(26,34,50,.98),rgba(16,22,32,.96));
  box-shadow:0 24px 64px rgba(0,0,0,.45);
}
.iso-import-dialog .content-card-head{margin-bottom:12px}
.iso-import-body{display:grid;gap:14px}
.iso-import-block{padding:10px 12px;border-radius:12px;border:1px solid rgba(148,163,184,.1);background:rgba(0,0,0,.12)}
.iso-import-block-title{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);margin-bottom:8px}
.iso-import-type-value{margin:0;font-size:14px;font-weight:700;color:var(--text);line-height:1.35}
.iso-import-list{margin:0;padding:0 0 0 18px;font-size:12px;line-height:1.45;color:var(--text2)}
.iso-import-list li{margin-bottom:6px}
.iso-import-list li:last-child{margin-bottom:0}
.iso-import-note{margin:0;font-size:11px;line-height:1.4;color:var(--text3);font-style:italic}
.iso-import-proof-radios{display:flex;flex-wrap:wrap;gap:14px 18px}
.iso-import-radio{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--text);cursor:pointer}
.iso-import-radio input{accent-color:var(--app-accent,#14b8a6)}
.iso-import-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px;padding-top:14px;border-top:1px solid rgba(148,163,184,.1)}
.iso-evidence-cell{font-size:12px}
.iso-audits-linked{
  padding:16px 18px;
  border-radius:16px;
  border:1px solid rgba(148,163,184,.12);
  background:rgba(0,0,0,.12);
}
.iso-audits-linked-head{
  font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--text3);margin-bottom:10px
}
.iso-audits-linked-list{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.iso-audits-linked-item{
  padding:10px 12px;border-radius:10px;
  background:rgba(255,255,255,.03);border:1px solid rgba(148,163,184,.08);
  display:flex;flex-direction:column;gap:4px;
}
.iso-audits-linked-item strong{font-size:13px;color:var(--text)}
.iso-audits-linked-sub{font-size:11px;color:var(--text3)}
.iso-audits-linked-empty{margin:0 0 12px;font-size:12px;color:var(--text2);line-height:1.45}
.iso-audits-linked-cta{width:100%;margin-top:10px}
.iso-page.iso-page--hub .iso-ai-spotlight .iso-ai-suggestion-grid{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:10px;
  margin:14px 0 12px;
}
@media (max-width:520px){
  .iso-page.iso-page--hub .iso-ai-spotlight .iso-ai-suggestion-grid{grid-template-columns:1fr}
}
.iso-page.iso-page--hub .iso-ai-spotlight .iso-ai-suggestion-btn{
  font-size:12px!important;line-height:1.3;text-align:left;justify-content:flex-start;
}
.iso-ai-suggestion-note{
  margin:0 0 14px;
  font-size:12px;
  line-height:1.5;
  color:var(--text2);
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  gap:8px;
}

/* —— ISO conformité premium : cadre page, bandeau exécutif, zones lisibles —— */
.iso-page.iso-page--hub.iso-page--conformite-premium{
  width:100%;
  max-width:min(1220px,100%);
  margin-inline:auto;
  gap:2rem;
  padding-bottom:max(2rem,env(safe-area-inset-bottom,0px));
  box-sizing:border-box;
}
.iso-page.iso-page--conformite-premium.iso-page--cockpit{
  gap:2rem;
}
.iso-cockpit-hero-executive-band{
  display:grid;
  grid-template-columns:minmax(0,300px) minmax(0,1fr);
  gap:20px 26px;
  align-items:stretch;
  padding-top:22px;
  margin-top:4px;
  border-top:1px solid rgba(148,163,184,.14);
}
@media (max-width:900px){
  .iso-cockpit-hero-executive-band{
    grid-template-columns:1fr;
  }
}
.iso-cockpit-hero-executive-band .iso-cockpit-hero-kpis--dual{
  max-width:none;
  margin:0;
  align-content:start;
}
.iso-cockpit-hero-executive-band .iso-cockpit-hero-snapshot-host--compact{
  display:flex;
  min-width:0;
}
.iso-cockpit-hero-executive-band .iso-cockpit-hero-snapshot-host--compact .iso-global-snapshot{
  margin-top:0;
  flex:1;
  display:flex;
  flex-direction:column;
  min-height:100%;
  box-sizing:border-box;
}
.iso-cockpit-hero-executive-band .iso-global-snapshot-inner{
  flex:1;
  align-items:stretch;
}
.iso-cockpit-hero-trust{
  margin:14px 0 0;
  font-size:13px;
  line-height:1.58;
  color:var(--text2);
  max-width:min(68ch,100%);
  padding:12px 16px;
  border-radius:14px;
  border:1px dashed rgba(148,163,184,.22);
  background:rgba(0,0,0,.1);
}
[data-theme='light'] .iso-cockpit-hero-trust{
  background:rgba(15,23,42,.04);
  border-color:rgba(15,23,42,.12);
  color:var(--color-text-secondary);
}
.iso-page.iso-page--conformite-premium .iso-cockpit-hero.content-card{
  padding:26px 28px 28px;
  border-radius:22px;
}
.iso-focus-wrap{
  display:flex;
  flex-direction:column;
  gap:1rem;
  width:100%;
  max-width:min(1180px,100%);
  margin-inline:auto;
  min-width:0;
}
.iso-focus-zone-intro{
  padding:0 2px;
}
.iso-zone-header{
  padding:0 2px 2px;
}
.iso-zone-header__kicker{
  margin:0 0 8px;
  font-size:10px;
  font-weight:800;
  letter-spacing:.16em;
  text-transform:uppercase;
  color:var(--text3);
}
.iso-zone-header__title{
  margin:0;
  font-size:clamp(1.12rem,1.9vw,1.4rem);
  font-weight:800;
  letter-spacing:-.025em;
  color:var(--text);
  line-height:1.22;
}
.iso-zone-header__desc{
  margin:10px 0 0;
  font-size:13.5px;
  line-height:1.58;
  color:var(--text2);
  max-width:min(72ch,100%);
}
.iso-insights-zone{
  width:100%;
  max-width:min(1180px,100%);
  margin-inline:auto;
  display:flex;
  flex-direction:column;
  gap:1rem;
  min-width:0;
}
.iso-page.iso-page--hub .iso-priority-shell{
  max-width:min(1180px,100%);
  margin-inline:auto;
  width:100%;
}
.iso-page.iso-page--hub .iso-priority-shell .iso-cockpit-priorities{
  border-radius:20px;
  border:1px solid rgba(251,191,36,.28);
  background:linear-gradient(165deg,rgba(251,191,36,.09),rgba(15,23,42,.35) 55%,rgba(8,12,20,.5) 100%);
  box-shadow:0 20px 52px rgba(0,0,0,.28),0 1px 0 rgba(255,255,255,.06) inset;
  padding:4px 4px 6px;
}
[data-theme='light'] .iso-page.iso-page--hub .iso-priority-shell .iso-cockpit-priorities{
  background:linear-gradient(165deg,rgba(251,191,36,.12),#fff 45%,#f8fafc 100%);
  border-color:rgba(245,158,11,.35);
  box-shadow:0 12px 40px rgba(15,23,42,.08);
}
.iso-priority-item{
  display:grid;
  grid-template-columns:1fr auto;
  gap:14px 20px;
  padding:16px 18px;
  border-radius:15px;
  border:1px solid rgba(148,163,184,.14);
  background:rgba(0,0,0,.14);
  align-items:center;
}
@media (max-width:640px){
  .iso-priority-item{grid-template-columns:1fr}
  .iso-priority-item-actions{justify-content:flex-start}
}
.iso-priority-item-title{font-size:14px;font-weight:800;color:var(--text);line-height:1.3}
.iso-priority-item-detail{margin:6px 0 0;font-size:12.5px;line-height:1.52;color:var(--text2)}
.iso-page.iso-page--hub .iso-secondary-zone{
  padding-top:1.85rem;
  margin-top:.35rem;
  gap:1.85rem;
  border-top:1px solid rgba(148,163,184,.1);
}
.iso-page.iso-page--hub .iso-zone-kicker{
  margin:0 0 14px;
  padding:0 2px;
  font-size:11px;
  font-weight:800;
  letter-spacing:.14em;
  text-transform:uppercase;
  color:var(--text2);
}
.iso-page.iso-page--hub .iso-secondary-zone .content-card.card-soft{
  border-radius:17px;
  border:1px solid rgba(148,163,184,.11);
  background:rgba(0,0,0,.07);
  box-shadow:0 10px 36px rgba(0,0,0,.14);
}
[data-theme='light'] .iso-page.iso-page--hub .iso-secondary-zone .content-card.card-soft{
  background:var(--color-background-primary);
  box-shadow:var(--shadow-card);
}
.iso-page.iso-page--hub .iso-conformity-charts-row--single .iso-conformity-chart-card{
  border-radius:18px;
  border:1px solid rgba(125,211,252,.18);
  background:linear-gradient(165deg,rgba(255,255,255,.05),rgba(0,0,0,.12));
  box-shadow:0 14px 40px rgba(0,0,0,.18);
}
[data-theme='light'] .iso-page.iso-page--hub .iso-conformity-charts-row--single .iso-conformity-chart-card{
  background:var(--color-background-primary);
}
`;function dp(){if(document.getElementById(mo))return;const e=document.createElement("style");e.id=mo,e.textContent=lp,document.head.append(e)}const go="qhse-iso-compliance-assist-styles",pp=`
.iso-ca-overlay{
  position:fixed;inset:0;z-index:200;
  background:rgba(0,0,0,.55);
  display:flex;align-items:center;justify-content:center;
  padding:20px;box-sizing:border-box;
  backdrop-filter:blur(6px);
}
.iso-ca-panel{
  width:100%;max-width:560px;max-height:min(90vh,720px);
  overflow:auto;display:flex;flex-direction:column;gap:0;
  padding:0!important;
  border:1px solid rgba(148,163,184,.18);
  box-shadow:0 24px 64px rgba(0,0,0,.4);
}
.iso-ca-head{
  display:flex;align-items:flex-start;justify-content:space-between;gap:12px;
  padding:18px 20px 12px;
  border-bottom:1px solid rgba(148,163,184,.1);
}
.iso-ca-kicker{margin-bottom:4px}
.iso-ca-title{margin:0 0 6px;font-size:18px;font-weight:800;letter-spacing:-.02em}
.iso-ca-sub{margin:0;font-size:13px;line-height:1.45;color:var(--text2);max-width:48ch}
.iso-ca-close{flex-shrink:0;min-width:40px;padding:8px 12px!important}
.iso-ca-body{padding:16px 20px 20px}
.iso-ca-loading-text{margin:0 0 8px;font-size:15px;font-weight:700;color:var(--text)}
.iso-ca-loading-hint{margin:0;font-size:12px;line-height:1.5;color:var(--text3);max-width:52ch}
.iso-ca-proposed{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-bottom:14px}
.iso-ca-ia-badge{
  font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;padding:5px 10px;border-radius:999px;
  color:var(--color-primary-text);background:var(--color-primary-bg);border:1px solid var(--color-primary-border);
}
.iso-ca-proposed-label{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3)}
.iso-ca-status-pill{
  display:inline-flex;align-items:center;padding:8px 14px;border-radius:999px;
  font-size:14px;font-weight:800;letter-spacing:.02em;
}
.iso-ca-status-pill--conforme{background:var(--color-success-bg);color:var(--color-text-success);border:1px solid var(--color-border-success)}
.iso-ca-status-pill--partiel{background:var(--color-warning-bg);color:var(--color-text-warning);border:1px solid var(--color-border-warning)}
.iso-ca-status-pill--non_conforme{background:var(--color-danger-bg);color:var(--color-text-danger);border:1px solid var(--color-border-danger)}
.iso-ca-explain{margin:0 0 16px;font-size:14px;line-height:1.55;color:var(--text2)}
.iso-ca-block{margin-bottom:14px}
.iso-ca-h4{margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.iso-ca-list{margin:0;padding-left:1.2rem;font-size:13px;line-height:1.55;color:var(--text2)}
.iso-ca-list li{margin-bottom:6px}
.iso-ca-docs{margin:0;padding-left:0;list-style:none;font-size:13px;line-height:1.45;color:var(--text2)}
.iso-ca-docs li{margin-bottom:10px;padding-bottom:10px;border-bottom:1px dashed rgba(148,163,184,.12)}
.iso-ca-docs li:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
.iso-ca-doc-meta{display:block;margin-top:4px;font-size:11px;color:var(--text3);font-weight:600}
.iso-ca-disclaimer{margin:14px 0 0;padding:12px 14px;border-radius:12px;border:1px solid var(--color-border-info);
  background:var(--color-info-bg);font-size:11px;line-height:1.5;color:var(--text2)}
.iso-ca-human{margin-top:18px;padding-top:16px;border-top:1px solid rgba(148,163,184,.12)}
.iso-ca-human-title{margin:0 0 6px;font-size:13px;font-weight:800;color:var(--text)}
.iso-ca-human-text{margin:0 0 14px;font-size:12px;line-height:1.5;color:var(--text2)}
.iso-ca-actions-row{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px}
.iso-ca-override-label{margin:0 0 8px;font-size:11px;font-weight:700;color:var(--text3)}
.iso-ca-override-row{display:flex;flex-wrap:wrap;gap:8px}
.iso-ca-error-msg{margin:0 0 12px;font-size:13px;color:var(--color-text-danger);line-height:1.45}
`;function up(){if(document.getElementById(go))return;const e=document.createElement("style");e.id=go,e.textContent=pp,document.head.append(e)}function mp(e){up();const t=document.createElement("div");t.className="iso-ca-overlay",t.setAttribute("role","dialog"),t.setAttribute("aria-modal","true"),t.setAttribute("aria-labelledby","iso-ca-title");const a=document.createElement("div");a.className="iso-ca-panel content-card card-soft";const r=document.createElement("div");r.className="iso-ca-head",r.innerHTML=`
    <div>
      <p class="section-kicker iso-ca-kicker">Assistance conformité</p>
      <h3 id="iso-ca-title" class="iso-ca-title">Analyse de l’exigence</h3>
      <p class="iso-ca-sub" data-iso-ca-req-label></p>
    </div>
    <button type="button" class="iso-ca-close btn btn-secondary" aria-label="Fermer">✕</button>
  `;const n=document.createElement("div");n.className="iso-ca-body",n.innerHTML=`
    <div class="iso-ca-loading" data-iso-ca-loading>
      <p class="iso-ca-loading-text">Analyse en cours…</p>
      <p class="iso-ca-loading-hint">Recoupement avec vos documents maîtrisés, les imports récents et les signaux du tableau de bord (sans service d’IA externe).</p>
    </div>
    <div class="iso-ca-result" data-iso-ca-result hidden>
      <div class="iso-ca-proposed">
        <span class="iso-ca-ia-badge" aria-hidden="true">Suggestion IA</span>
        <span class="iso-ca-proposed-label">Proposition automatique</span>
        <span class="iso-ca-status-pill" data-iso-ca-pill></span>
      </div>
      <p class="iso-ca-explain" data-iso-ca-explain></p>
      <div class="iso-ca-block">
        <h4 class="iso-ca-h4">Actions recommandées</h4>
        <ul class="iso-ca-list" data-iso-ca-actions></ul>
      </div>
      <div class="iso-ca-block" data-iso-ca-docs-wrap>
        <h4 class="iso-ca-h4">Documents rapprochés</h4>
        <ul class="iso-ca-docs" data-iso-ca-docs></ul>
      </div>
      <p class="iso-ca-disclaimer" data-iso-ca-disclaimer></p>
      <div class="iso-ca-human">
        <p class="iso-ca-human-title">Validation humaine obligatoire</p>
        <p class="iso-ca-human-text">Choisissez une action : accepter la proposition, enregistrer un autre statut, ou fermer sans modifier.</p>
        <div class="iso-ca-actions-row">
          <button type="button" class="btn btn-primary" data-iso-ca-accept>Valider la proposition</button>
          <button type="button" class="btn btn-secondary" data-iso-ca-reject>Fermer sans changer</button>
        </div>
        <p class="iso-ca-override-label">Ou choisir explicitement un statut :</p>
        <div class="iso-ca-override-row">
          <button type="button" class="btn btn-secondary iso-ca-ov" data-iso-ca-set="conforme">Conforme</button>
          <button type="button" class="btn btn-secondary iso-ca-ov" data-iso-ca-set="partiel">Partiel</button>
          <button type="button" class="btn btn-secondary iso-ca-ov" data-iso-ca-set="non_conforme">Non conforme</button>
        </div>
      </div>
    </div>
    <div class="iso-ca-error" data-iso-ca-error hidden>
      <p class="iso-ca-error-msg" data-iso-ca-error-msg></p>
      <button type="button" class="btn btn-primary" data-iso-ca-retry>Réessayer</button>
    </div>
  `,a.append(r,n),t.append(a),document.body.append(t);const i=e.requirement,o=r.querySelector("[data-iso-ca-req-label]");o.textContent=`${i.normCode} · ${i.clause} — ${i.title}`;function s(){t.remove()}r.querySelector(".iso-ca-close").addEventListener("click",s),t.addEventListener("click",u=>{u.target===t&&s()});let c=null;async function l(){n.querySelector("[data-iso-ca-loading]").hidden=!1,n.querySelector("[data-iso-ca-result]").hidden=!0,n.querySelector("[data-iso-ca-error]").hidden=!0;try{const u=await Se("/api/compliance/analyze-assist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({requirement:{id:i.id,normId:i.normId,normCode:i.normCode,clause:i.clause,title:i.title,summary:i.summary,evidence:i.evidence,currentStatus:i.status},controlledDocuments:e.controlledDocuments,siteId:e.siteId})}),p=await u.json().catch(()=>({}));if(!u.ok){const h=typeof p.error=="string"?p.error:`Erreur ${u.status}`;throw new Error(h)}c={suggestedStatus:p.suggestedStatus},n.querySelector("[data-iso-ca-loading]").hidden=!0,n.querySelector("[data-iso-ca-result]").hidden=!1;const g=n.querySelector("[data-iso-ca-pill]");g.textContent=p.statusLabel||p.suggestedStatus,g.className=`iso-ca-status-pill iso-ca-status-pill--${p.suggestedStatus}`,n.querySelector("[data-iso-ca-explain]").textContent=p.explanation||"—";const m=n.querySelector("[data-iso-ca-actions]");m.replaceChildren(),(p.recommendedActions||[]).forEach(h=>{const k=document.createElement("li");k.textContent=h,m.append(k)});const b=n.querySelector("[data-iso-ca-docs]"),y=n.querySelector("[data-iso-ca-docs-wrap]"),v=p.matchedDocuments||[];b.replaceChildren(),v.length?(y.hidden=!1,v.forEach(h=>{const k=document.createElement("li");k.innerHTML=`<strong>${lr(h.name)}</strong> <span class="iso-ca-doc-meta">${lr(h.source)} · pertinence ${lr(h.relevance)}</span>`,b.append(k)})):y.hidden=!0,n.querySelector("[data-iso-ca-disclaimer]").textContent=p.disclaimer||"Cette proposition est indicative ; seul un humain peut valider la conformité réelle."}catch(u){console.warn("[iso compliance assist]",u),n.querySelector("[data-iso-ca-loading]").hidden=!0,n.querySelector("[data-iso-ca-error]").hidden=!1,n.querySelector("[data-iso-ca-error-msg]").textContent=u instanceof Error?u.message:String(u)}}n.querySelector("[data-iso-ca-retry]").addEventListener("click",()=>l());function d(u,p){e.onStatusCommitted(i.id,u,{source:p}),C(p==="accepted_suggestion"?"Statut enregistré conformément à la proposition (validation humaine).":"Statut enregistré suite à votre choix explicite.","info"),s()}n.querySelector("[data-iso-ca-accept]").addEventListener("click",()=>{if(!(c!=null&&c.suggestedStatus)){C("Aucune proposition à valider.","warning");return}d(c.suggestedStatus,"accepted_suggestion")}),n.querySelector("[data-iso-ca-reject]").addEventListener("click",()=>{C("Fermeture sans modification du statut.","info"),s()}),n.querySelectorAll("[data-iso-ca-set]").forEach(u=>{u.addEventListener("click",()=>{const p=u.getAttribute("data-iso-ca-set");d(p,"human_override")})}),l()}function lr(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}const ns="qhse-conformity-status-v1",os="qhse-iso-imported-proofs-v1",ss=[{id:"iso9001",code:"ISO 9001",title:"Management de la qualité"},{id:"iso14001",code:"ISO 14001",title:"Management environnemental"},{id:"iso45001",code:"ISO 45001",title:"Santé et sécurité au travail"}],Jr=[{name:"Manuel intégré SMS",version:"4.2"},{name:"Procédure audits internes",version:"3.1"},{name:"Instruction déchets dangereux",version:"2.4"},{name:"Registre des aspects environnementaux",version:"1.8"},{name:"DDR site et fiches risques",version:"2.0"},{name:"Registre gestion du changement (GMC)",version:"1.3"}],Kr={critical:[{name:"Manuel intégré SMS",version:"4.2",note:"Document de référence certification"}],missing:[{name:"Plan de réponse aux déversements (version signée)",note:"Exigé pour la surveillance environnementale — pièce à produire."}],obsolete:[{name:"Procédure audits internes",version:"3.1",note:"Révision à planifier selon le cycle documentaire interne."}]},La=[{title:"Audit interne ISO 45001 (Q2)",horizon:"Avant le 15/04/2026",owner:"Qualité site"},{title:"Surveillance certification ISO 9001",horizon:"Fenêtre juin 2026",owner:"Direction"}],gp=[{id:"req-9-1-1",normId:"iso9001",clause:"9.1.1",title:"Suivi et évaluation des processus",summary:"Indicateurs, sources de données et analyse des performances des processus.",owner:"Responsable qualité site",evidence:"Revue processus Q1 + tableau de bord qualité",defaultStatus:"conforme",actionNote:"Actions liées : indicateurs retard / plans qualité (module Actions).",auditNote:"Vérifier lors des audits internes processus (module Audits)."},{id:"req-10-2",normId:"iso9001",clause:"10.2",title:"Non-conformités et actions correctives",summary:"Réaction aux écarts, causes, actions et efficacité des corrections.",owner:"QHSE",evidence:"Registre NC + plans d’actions",defaultStatus:"partiel",actionNote:"Suivre les actions correctives ouvertes.",auditNote:"Constats NC des derniers audits."},{id:"req-7-1-5",normId:"iso9001",clause:"7.1.5",title:"Ressources pour la mesure et le suivi",summary:"Étalonnage et maîtrise des équipements de mesure.",owner:"Maintenance / Qualité",evidence:"Planning étalonnage 2026",defaultStatus:"conforme",actionNote:"Actions sur instruments en retard d’étalonnage.",auditNote:"Preuves d’étalonnage en audit."},{id:"req-6-1-2",normId:"iso14001",clause:"6.1.2",title:"Aspects environnementaux",summary:"Identification, critères et mise à jour des aspects significatifs.",owner:"HSE",evidence:"Matrice aspects / impacts révisée",defaultStatus:"conforme",actionNote:"Actions sur aspects nouveaux ou non maîtrisés.",auditNote:"Audit environnemental / conformité matrice."},{id:"req-8-1",normId:"iso14001",clause:"8.1",title:"Planification et contrôle opérationnels",summary:"Conditions opérationnelles pour les processus et prévention de la pollution.",owner:"Exploitation",evidence:"Modes opératoires et registres associés",defaultStatus:"partiel",actionNote:"Actions sur écarts opérationnels (déchets, rejets).",auditNote:"Visites terrain et constats documentés."},{id:"req-9-1-1-env",normId:"iso14001",clause:"9.1.1",title:"Surveillance et mesure environnementales",summary:"Suivi des indicateurs environnementaux et conformité réglementaire.",owner:"HSE",evidence:"Rapports de mesures et autocontrôles",defaultStatus:"non_conforme",actionNote:"Plan d’actions sur dépassements ou non-conformités réglementaires.",auditNote:"Revue des preuves de conformité réglementaire."},{id:"req-6-1-2-ohs",normId:"iso45001",clause:"6.1.2",title:"Identification des dangers et évaluation des risques",summary:"DDR, mesures de maîtrise et mise à jour après changement.",owner:"SSE / Encadrement",evidence:"DDR site + fiches de risques par poste",defaultStatus:"conforme",actionNote:"Actions sur risques résiduels ou habilitations.",auditNote:"Audits SST / reprise des DDR."},{id:"req-8-1-3",normId:"iso45001",clause:"8.1.3",title:"Gestion du changement",summary:"GMC pour activités, équipements et organisation impactant la SST.",owner:"Managers opérationnels",evidence:"Registre GMC + validations HSE",defaultStatus:"partiel",actionNote:"Actions issues des GMC non clos.",auditNote:"Échantillon de GMC en audit interne."},{id:"req-10-2-ohs",normId:"iso45001",clause:"10.2",title:"Incidents, non-conformités et actions correctives",summary:"Enquêtes, enregistrement et traitement des événements SST.",owner:"QHSE",evidence:"Registre incidents + liens NC",defaultStatus:"partiel",actionNote:"Correspond au module Incidents / Actions.",auditNote:"Revue des dossiers incidents en audit."}];function cs(){try{const e=localStorage.getItem(ns);if(!e)return{};const t=JSON.parse(e);return t&&typeof t=="object"?t:{}}catch{return{}}}function bp(e){try{localStorage.setItem(ns,JSON.stringify(e))}catch{}}function wt(){const e=cs();return gp.map(t=>{var n;const a=(n=e[t.id])==null?void 0:n.status,r=a==="conforme"||a==="partiel"||a==="non_conforme"?a:t.defaultStatus;return{...t,status:r}})}function hp(e,t){if(t!=="conforme"&&t!=="partiel"&&t!=="non_conforme")return;const a=cs();a[e]={status:t},bp(a)}function ua(e){return ss.find(t=>t.id===e)||null}function ls(){try{const e=localStorage.getItem(os);if(!e)return[];const t=JSON.parse(e);return Array.isArray(t)?t:[]}catch{return[]}}function xp(e){try{localStorage.setItem(os,JSON.stringify(e))}catch{}}function ds(){return ls().map(e=>({...e}))}function fp(e){const t=ls(),a=e.id&&String(e.id).trim()?String(e.id).trim():`imp-${Date.now()}-${Math.random().toString(36).slice(2,9)}`,r=e.proofStatus==="missing"||e.proofStatus==="verify"?e.proofStatus:"present",n={id:a,fileName:String(e.fileName||"document").slice(0,240),requirementId:String(e.requirementId||"").trim(),proofStatus:r,docTypeLabel:String(e.docTypeLabel||"Document").slice(0,120),keyPoints:Array.isArray(e.keyPoints)?e.keyPoints.map(i=>String(i).slice(0,400)):[],gaps:Array.isArray(e.gaps)?e.gaps.map(i=>String(i).slice(0,400)):[],createdAt:e.createdAt||new Date().toISOString()};return n.requirementId?(t.push(n),xp(t),a):""}function dr(){const e=wt(),t=e.length;if(t===0)return{pct:0,globalLabel:"—",globalTone:"watch",message:"Aucune exigence chargée.",nonOk:0,partial:0,ok:0};let a=0,r=0,n=0,i=0;e.forEach(d=>{d.status==="conforme"?(a+=100,i+=1):d.status==="partiel"?(a+=50,n+=1):r+=1});const o=Math.round(a/t);let s="ok",c="Situation saine",l="Toutes les exigences suivies sont au vert : poursuivez les revues et gardez les preuves à jour.";return r>0?(s="risk",c="Action requise",l=`Vous avez ${r} exigence(s) en non-conformité : traitez-les en priorité avant la revue ou l’audit.`):n>0&&(s="watch",c="À consolider",l=`${n} exigence(s) sont partiellement couvertes : complétez les preuves ou les actions liées.`),{pct:o,globalLabel:c,globalTone:s,message:l,nonOk:r,partial:n,ok:i}}const vp=[{id:"ISO 9001",status:"Sous contrôle",badge:"amber",line:"Réserves mineures : plan qualité en cours."},{id:"ISO 14001",status:"Conforme",badge:"green",line:"Dernier audit interne sans écart majeur."},{id:"ISO 45001",status:"À surveiller",badge:"amber",line:"Point habilitations — clôture visée mi-avril."}],yp=[{label:"Incidents",value:"4",detail:"3 clos · 1 analyse en cours (terrain nord)"},{label:"Audits",value:"2",detail:"1 interne planifié · 1 surveillance ISO"},{label:"Actions",value:"12",detail:"7 en retard < 15 j · 5 dans les délais"},{label:"Indicateurs",value:"8/10",detail:"2 indicateurs en attente de consolidation groupe"}];function kp(e){return e==="conforme"?"green":e==="partiel"?"amber":"red"}function _p(e){return e==="conforme"?"Conforme":e==="partiel"?"Partiel":"Non conforme"}function vt(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function wp(e){const t=String(e||"document"),a=t.toLowerCase(),r=wt();if(!r.length)return{docTypeLabel:"Document",requirementId:"",keyPoints:["Aucune exigence chargée."],gaps:["Chargez le registre ou réessayez."],confidenceNote:"Proposition locale (démo front)."};let n=r[0],i=-1;const o=[{re:/audit|contrôle|vérification/i,boost:p=>String(p.clause).includes("9")?4:2},{re:/environnement|déchet|aspect|impact/i,boost:p=>p.normId==="iso14001"?5:0},{re:/sst|santé|sécurité|risque|habilitation|incident/i,boost:p=>p.normId==="iso45001"?5:0},{re:/qualité|nc|correct|process|indicateur/i,boost:p=>p.normId==="iso9001"?4:1},{re:/mesure|étalon|calibr|instrument/i,boost:p=>String(p.clause).includes("7.1.5")?6:0},{re:/formation|compétence/i,boost:p=>String(p.clause).includes("7.2")?5:0}];if(r.forEach(p=>{let g=0;const m=`${p.title} ${p.summary} ${p.evidence} ${p.clause}`.toLowerCase();o.forEach(({re:y,boost:v})=>{(y.test(a)||y.test(t))&&(g+=v(p)),y.test(m)&&(g+=1)}),([...t].reduce((y,v)=>y+v.charCodeAt(0),0)+p.clause.length)%7===0&&(g+=1),g>i&&(i=g,n=p)}),i<=0){const p=[...t].reduce((g,m)=>g+m.charCodeAt(0),0)%r.length;n=r[p]}const s=ua(n.normId),c=["Procédure opérationnelle","Registre / enregistrement","Plan de management","Instruction","Politique","Fiche de données"],l=c[[...t].reduce((p,g)=>p+g.charCodeAt(0),0)%c.length],d=[`Type probable : ${l} — à confirmer après lecture humaine.`,`Rattachement suggéré : ${n.clause} — ${n.title} (${s?s.code:n.normId}).`,"Contrôler version, diffusion contrôlée et cohérence avec le SMS."],u=[];return/sign|visa|approuv|valid/i.test(a)||u.push("Aucune mention explicite de signature ou validation détectée sur le nom de fichier — vérifier le PDF."),/brouillon|draft|copie|old|ancien/i.test(a)&&u.push("Intitulé pouvant indiquer un brouillon ou une version non maîtrisée."),u.length===0&&u.push("Vérifier la correspondance exacte avec la preuve attendue dans le référentiel."),{docTypeLabel:l,requirementId:n.id,keyPoints:d,gaps:u,confidenceNote:"Proposition locale (démo front, sans envoi serveur). Validez, corrigez le rattachement ou rejetez avant enregistrement."}}function Ep({fileName:e,analysis:t,onValidate:a,onReject:r}){var y,v;const n=document.querySelector(".iso-import-overlay");n&&n.remove();const i=document.createElement("div");i.className="iso-import-overlay",i.setAttribute("role","dialog"),i.setAttribute("aria-modal","true"),i.setAttribute("aria-labelledby","iso-import-dialog-title");const o=document.createElement("div");o.className="iso-import-dialog card-soft";const s=wt(),c=()=>{i.remove(),document.removeEventListener("keydown",l)},l=h=>{h.key==="Escape"&&(c(),r())};document.addEventListener("keydown",l),o.innerHTML=`
    <div class="iso-import-dialog-head content-card-head">
      <div>
        <div class="section-kicker">Import documentaire</div>
        <h3 id="iso-import-dialog-title">Revue avant rattachement</h3>
        <p class="content-card-lead iso-import-file-label"></p>
      </div>
    </div>
    <div class="iso-import-body">
      <div class="iso-import-block">
        <div class="iso-import-block-title">Type de document (indicatif)</div>
        <p class="iso-import-type-value"></p>
      </div>
      <div class="iso-import-block">
        <div class="iso-import-block-title">Exigence ISO cible</div>
        <label class="field"><span>Choisir l’exigence</span>
          <select class="control-select iso-import-req-select"></select>
        </label>
      </div>
      <div class="iso-import-block">
        <div class="iso-import-block-title">Points clés</div>
        <ul class="iso-import-list iso-import-keypoints"></ul>
      </div>
      <div class="iso-import-block">
        <div class="iso-import-block-title">Manques ou points d’attention</div>
        <ul class="iso-import-list iso-import-gaps"></ul>
      </div>
      <p class="iso-import-note"></p>
      <div class="iso-import-block">
        <div class="iso-import-block-title">Statut preuve après validation</div>
        <div class="iso-import-proof-radios">
          <label class="iso-import-radio"><input type="radio" name="iso-import-proof" value="present" checked /> Présent</label>
          <label class="iso-import-radio"><input type="radio" name="iso-import-proof" value="verify" /> À vérifier</label>
          <label class="iso-import-radio"><input type="radio" name="iso-import-proof" value="missing" /> Manquant</label>
        </div>
      </div>
    </div>
    <div class="iso-import-actions">
      <button type="button" class="btn btn-primary iso-import-validate">Valider le rattachement</button>
      <button type="button" class="btn btn-secondary iso-import-reject">Rejeter</button>
    </div>
  `;const d=o.querySelector(".iso-import-file-label");d&&(d.textContent=`Fichier : ${e}`);const u=o.querySelector(".iso-import-type-value");u&&(u.textContent=t.docTypeLabel);const p=o.querySelector(".iso-import-req-select");p&&(s.forEach(h=>{const k=ua(h.normId),_=document.createElement("option");_.value=h.id,_.textContent=`${h.clause} — ${h.title} (${k?k.code:h.normId})`,p.append(_)}),p.value=t.requirementId||s[0].id);const g=o.querySelector(".iso-import-keypoints");g&&t.keyPoints.forEach(h=>{const k=document.createElement("li");k.textContent=h,g.append(k)});const m=o.querySelector(".iso-import-gaps");m&&t.gaps.forEach(h=>{const k=document.createElement("li");k.textContent=h,m.append(k)});const b=o.querySelector(".iso-import-note");b&&(b.className="iso-import-note",b.textContent=t.confidenceNote||""),(y=o.querySelector(".iso-import-validate"))==null||y.addEventListener("click",()=>{const h=(p==null?void 0:p.value)||"",k=o.querySelector('input[name="iso-import-proof"]:checked'),_=(k==null?void 0:k.value)==="missing"||(k==null?void 0:k.value)==="verify"?k.value:"present";if(!h){C("Choisissez une exigence.","warning");return}c(),a({requirementId:h,proofStatus:_})}),(v=o.querySelector(".iso-import-reject"))==null||v.addEventListener("click",()=>{c(),r()}),i.addEventListener("click",h=>{h.target===i&&(c(),r())}),i.append(o),document.body.append(i),p==null||p.focus()}function ps(e){return e==="missing"?"Manquant":e==="verify"?"À vérifier":"Présent"}function Np(e,t){const a=String(e||"—"),r=ds().filter(i=>i.requirementId===t);if(!r.length)return a;const n=r.map(i=>`· ${i.fileName} (${ps(i.proofStatus)})`);return`${a}
${n.join(`
`)}`}function Sp(e){const t=document.createElement("div");t.className=`iso-global-snapshot iso-global-snapshot--${e.globalTone}`,t.innerHTML=`
    <div class="iso-global-snapshot-inner">
      <div class="iso-global-score" aria-label="Score de conformité">
        <span class="iso-global-pct">${e.pct}</span>
        <span class="iso-global-pct-suffix">%</span>
        <div class="iso-global-score-caption">conformité (exigences)</div>
      </div>
      <div class="iso-global-copy">
        <div class="iso-global-label">${vt(e.globalLabel)}</div>
        <p class="iso-global-message">${vt(e.message)}</p>
        <div class="iso-global-meta" aria-hidden="true"></div>
      </div>
    </div>
  `;const a=t.querySelector(".iso-global-meta");return a&&(a.textContent=`${e.ok} conforme(s) · ${e.partial} partiel(le)(s) · ${e.nonOk} non conforme(s)`),t}function Cp(e,t){e.className=`iso-global-snapshot iso-global-snapshot--${t.globalTone}`;const a=e.querySelector(".iso-global-pct"),r=e.querySelector(".iso-global-label"),n=e.querySelector(".iso-global-message"),i=e.querySelector(".iso-global-meta");a&&(a.textContent=String(t.pct)),r&&(r.textContent=t.globalLabel),n&&(n.textContent=t.message),i&&(i.textContent=`${t.ok} conforme(s) · ${t.partial} partiel(le)(s) · ${t.nonOk} non conforme(s)`)}function Ap(e){const t=document.createElement("article");t.className="iso-norm-card iso-norm-card--lite iso-norm-card--hero";const a=document.createElement("div");a.className="iso-norm-card-top";const r=document.createElement("span");r.className="iso-norm-id",r.textContent=e.id;const n=document.createElement("span");if(n.className=`badge ${e.badge}`,n.textContent=e.status,a.append(r,n),t.append(a),e.title){const o=document.createElement("h4");o.className="iso-norm-title",o.textContent=e.title,t.append(o)}const i=document.createElement("p");if(i.className="iso-norm-line",i.textContent=e.line,t.append(i),e.statsTotal!=null&&e.cockpitPct==null){const o=document.createElement("p");o.className="iso-norm-hint";const s=e.statsTotal-(e.statsNonOk??0);o.textContent=e.statsNonOk&&e.statsNonOk>0?`${e.statsTotal} exigence(s) suivie(s) · ${e.statsNonOk} en écart · ${s} au vert`:`${e.statsTotal} exigence(s) suivie(s) · aucun écart sur ce référentiel`,t.append(o)}if(e.cockpitPct!=null){const o=document.createElement("div");o.className="iso-norm-cockpit-metrics";const s=document.createElement("div");s.className="iso-norm-metric-row";const c=document.createElement("span");c.className="iso-norm-metric-label",c.textContent="Score conformité";const l=document.createElement("span");l.className="iso-norm-metric-val",l.textContent=`${e.cockpitPct} %`,s.append(c,l);const d=document.createElement("div");d.className="iso-norm-metric-row";const u=document.createElement("span");u.className="iso-norm-metric-label",u.textContent="Pilotage";const p=document.createElement("span");p.className=`badge ${e.cockpitLevelClass||"amber"}`,p.textContent=e.cockpitLevelLabel||"—",d.append(u,p);const g=document.createElement("div");g.className="iso-norm-metric-row";const m=document.createElement("span");m.className="iso-norm-metric-label",m.textContent="Exigences non conformes";const b=document.createElement("span");b.className="iso-norm-metric-val iso-norm-metric-val--muted";const y=e.strictNcCount!=null?e.strictNcCount:e.statsNonOk!=null?e.statsNonOk:0;b.textContent=String(y),g.append(m,b);const v=document.createElement("div");v.className="iso-norm-metric-row";const h=document.createElement("span");h.className="iso-norm-metric-label",h.textContent="Documents manquants (indic.)";const k=document.createElement("span");k.className="iso-norm-metric-val iso-norm-metric-val--muted",k.textContent=String(e.docsMissingCount??0),v.append(h,k);const _=document.createElement("div");_.className="iso-norm-metric-row iso-norm-metric-row--audit";const f=document.createElement("span");f.className="iso-norm-metric-label",f.textContent="Audits liés";const E=document.createElement("span");E.className="iso-norm-audit-line",E.textContent=e.auditLine||"—",_.append(f,E),o.append(s,d,g,v,_),t.append(o)}return t}function zp(e){const t=document.createElement("div");t.className="iso-table-wrap iso-table-wrap--req";let a="all";const r=document.createElement("div");r.className="iso-req-filter-bar",r.setAttribute("role","group"),r.setAttribute("aria-label","Filtrer les exigences par statut");const n=(g,m)=>{const b=document.createElement("button");return b.type="button",b.className="btn btn-secondary iso-req-filter-btn",b.dataset.filter=g,b.textContent=m,b.addEventListener("click",()=>{a=g,r.querySelectorAll(".iso-req-filter-btn").forEach(y=>{y.classList.toggle("iso-req-filter-btn--active",y.dataset.filter===g)}),p()}),b},i=n("all","Toutes"),o=n("gap","Écarts"),s=n("partial","Partiels"),c=n("nc","Non conformes"),l=n("ok","Conformes");i.classList.add("iso-req-filter-btn--active"),r.append(i,o,s,c,l);const d=document.createElement("div");d.className="iso-table iso-req-table";const u=document.createElement("div");u.className="iso-table-head",u.innerHTML=`
    <span>Exigence</span>
    <span>Statut</span>
    <span>Action</span>
    <span>Responsable</span>
    <span>Preuve documentaire</span>
  `,d.append(u);function p(){d.querySelectorAll(".iso-table-row").forEach(m=>m.remove());let g=wt();a==="gap"?g=g.filter(m=>m.status!=="conforme"):a==="partial"?g=g.filter(m=>m.status==="partiel"):a==="nc"?g=g.filter(m=>m.status==="non_conforme"):a==="ok"&&(g=g.filter(m=>m.status==="conforme")),g.forEach(m=>{const b=ua(m.normId),y=b?b.code:m.normId,v=document.createElement("div");v.className="iso-table-row";const h=kp(m.status),k=_p(m.status),_=document.createElement("span");_.className="iso-cell-strong",_.innerHTML=`${vt(m.clause)} — ${vt(m.title)}<br/><span class="iso-cell-muted iso-cell-small">${vt(y)}</span>`;const f=document.createElement("span");f.className="iso-req-status-cell",f.innerHTML=`<span class="badge ${h} iso-req-status-badge">${vt(k)}</span>`;const E=document.createElement("span"),w=document.createElement("button");w.type="button",w.className="btn btn-secondary iso-analyze-btn",w.textContent="Traiter",w.addEventListener("click",()=>e.onAnalyze({...m,normCode:y})),E.append(w);const x=document.createElement("span");x.className="iso-cell-muted",x.textContent=m.owner;const S=document.createElement("span");S.className="iso-cell-muted iso-evidence-cell",S.style.whiteSpace="pre-line",S.textContent=Np(m.evidence,m.id),v.append(_,f,E,x,S),d.append(v)})}return p(),e.refreshTable=p,t.append(r,d),t}function $p(){const e=document.createElement("div");e.className="iso-table-wrap";const t=document.createElement("div");t.className="iso-table iso-doc-table";const a=document.createElement("div");return a.className="iso-table-head",a.innerHTML="<span>Document</span><span>Version</span><span>Révision</span><span>Propriétaire</span>",t.append(a),Jr.forEach(r=>{const n=document.createElement("div");n.className="iso-table-row",n.innerHTML=`
      <span class="iso-cell-strong">${vt(r.name)}</span>
      <span class="iso-cell-muted">${vt(r.version||"—")}</span>
      <span class="iso-cell-muted">—</span>
      <span class="iso-cell-muted">—</span>
    `,t.append(n)}),e.append(t),e}function qp(e,t){const a=document.createElement("div");a.className="iso-docs-priority";const r=document.createElement("div");r.className="iso-doc-import-bar";const n=document.createElement("p");n.className="iso-doc-import-lead",n.textContent="Importez une pièce, rattachez-la à une exigence et validez le statut de preuve (traitement local, démo).";const i=document.createElement("button");i.type="button",i.className="btn btn-secondary iso-doc-import-btn",i.textContent="Importer un document";const o=document.createElement("input");o.type="file",o.className="iso-doc-import-file",o.setAttribute("aria-label","Choisir un fichier à importer"),o.accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.csv,application/pdf",o.hidden=!0,i.addEventListener("click",()=>o.click()),o.addEventListener("change",()=>{const u=o.files&&o.files[0];o.value="",u&&(i.disabled=!0,C("Traitement du document en cours (simulation)…","info"),window.setTimeout(()=>{i.disabled=!1;const p=wp(u.name);Ep({fileName:u.name,analysis:p,onValidate:({requirementId:g,proofStatus:m})=>{(async()=>await Yt("confidential_document",{contextLabel:"validation de l’import et rattachement de preuve"})&&(fp({fileName:u.name,requirementId:g,proofStatus:m,docTypeLabel:p.docTypeLabel,keyPoints:p.keyPoints,gaps:p.gaps}),C("Document rattaché à l’exigence — preuve enregistrée localement.","success"),typeof t=="function"&&t({module:"iso",action:"Import document validé (preuve)",detail:`${u.name} → ${g} (${m})`,user:"Utilisateur"}),typeof e.refreshPilotage=="function"&&e.refreshPilotage()))()},onReject:()=>{C("Import annulé.","info")}})},620))}),r.append(n,i,o);const s=document.createElement("div");s.className="iso-doc-attention-list";function c(){s.replaceChildren(),s.className="iso-doc-attention-list iso-doc-attention-list--unified";const{critical:u,missing:p,obsolete:g}=Kr,m=[...p.map(b=>({badge:"Manquant",badgeClass:"red",d:b})),...g.map(b=>({badge:"À vérifier",badgeClass:"amber",d:b})),...u.map(b=>({badge:"Critique",badgeClass:"red",d:b}))];if(!m.length){const b=document.createElement("p");b.className="iso-doc-attention-empty",b.textContent="Aucune pièce prioritaire signalée pour ce site.",s.append(b);return}m.forEach(({badge:b,badgeClass:y,d:v})=>{const h=document.createElement("div");h.className="iso-doc-attention-row iso-doc-attention-row--unified";const k=document.createElement("div");k.className="iso-doc-attention-row-top";const _=document.createElement("span");_.className=`badge ${y} iso-doc-attention-status-badge`,_.textContent=b;const f=document.createElement("strong");f.textContent=v.name+(v.version?` · v${v.version}`:""),k.append(_,f);const E=document.createElement("p");E.className="iso-doc-attention-note",E.textContent=v.note,h.append(k,E),s.append(h)})}c();const l=document.createElement("button");l.type="button",l.className="btn btn-secondary iso-toggle-full-docs",l.setAttribute("aria-expanded","false"),l.textContent="Voir tous les documents maîtrisés";const d=document.createElement("div");return d.className="iso-req-full-wrap",d.hidden=!0,d.append($p()),l.addEventListener("click",()=>{const u=d.hidden;d.hidden=!u,l.setAttribute("aria-expanded",u?"true":"false"),l.textContent=u?"Masquer la liste complète":"Voir tous les documents maîtrisés"}),a.append(r,s,l,d),{root:a,renderAttention:c}}function Lp(){const e=document.createElement("div");e.className="iso-compliance-cycle",e.setAttribute("aria-label","Phases de contrôle et correction"),["Détection","Contrôle","Correction","Vérification","Clôture"].forEach((r,n)=>{const i=document.createElement("div");i.className="iso-compliance-cycle-step";const o=document.createElement("span");o.className="iso-cycle-num",o.textContent=String(n+1);const s=document.createElement("span");s.className="iso-cycle-label",s.textContent=r,i.append(o,s),e.append(i)});const a=document.createElement("p");return a.className="iso-compliance-cycle-cap",a.textContent="Exigences, documents et écarts suivent ce cycle — décision et validation humaines à chaque étape.",e.append(a),e}function Ip(e){const t=document.createElement("article");t.className="content-card card-soft iso-cockpit-priorities",t.setAttribute("aria-labelledby","iso-cockpit-prio-title");const a=document.createElement("div");a.className="content-card-head",a.innerHTML=`
    <div>
      <div class="section-kicker">Pilotage</div>
      <h3 id="iso-cockpit-prio-title">Priorités à traiter</h3>
      <p class="content-card-lead">Exigences en écart, pièces à consolider, audits à caler — une action principale par sujet.</p>
    </div>
  `;const r=document.createElement("div");r.className="iso-cockpit-prio-list iso-cockpit-prio-list--unified";function n(o,s,c,l){const d=document.createElement("div");d.className="iso-priority-item";const u=document.createElement("div");u.className="iso-priority-item-main";const p=document.createElement("div");p.className="iso-priority-item-title",p.textContent=o;const g=document.createElement("p");g.className="iso-priority-item-detail",g.textContent=s,u.append(p,g);const m=document.createElement("div");m.className="iso-priority-item-actions";const b=document.createElement("button");b.type="button",b.className="btn btn-primary iso-priority-cta",b.textContent=c,b.addEventListener("click",l),m.append(b),d.append(u,m),r.append(d)}function i(){r.replaceChildren();const o=wt().filter(v=>v.status==="non_conforme"),s=wt().filter(v=>v.status!=="conforme"),{missing:c,obsolete:l,critical:d}=Kr,u=[];c.forEach(v=>u.push({tag:"Manquant",name:v.name,note:v.note})),l.forEach(v=>u.push({tag:"À vérifier",name:v.name+(v.version?` · v${v.version}`:""),note:v.note})),d.forEach(v=>u.push({tag:"Critique",name:v.name+(v.version?` · v${v.version}`:""),note:v.note}));const p=s[0];n("Exigences en écart",s.length?`${s.length} exigence(s) partielle(s) ou non conforme(s) sur le registre.`:"Aucune exigence en écart sur le périmètre suivi.","Traiter",()=>{if(p){const v=ua(p.normId);e({...p,normCode:v?v.code:p.normId})}else C("Aucun écart à traiter sur le registre.","info")});const g=u.length===0?"Aucune pièce prioritaire signalée (démo).":`${u.length} pièce(s) — ${u[0].name} (${u[0].tag})${u.length>1?` · +${u.length-1} autre(s)`:""}`;n("Documents & preuves",g,"Ouvrir documents",()=>{var v;(v=document.querySelector(".iso-page .iso-docs-priority"))==null||v.scrollIntoView({behavior:"smooth",block:"start"})});const m=La.length?La.map(v=>`· ${v.title} — ${v.horizon}`).join(`
`):"Aucune échéance planifiée dans les données démo.";n("Audits à planifier",m,"Voir Audits",()=>{window.location.hash="audits",C("Module Audits.","info")});const b=o[0],y=b?`${b.clause} — ${b.title} (non-conformité à traiter en priorité).`:"Aucune non-conformité stricte ouverte sur le registre démo.";n("Non-conformités majeures",y,"Traiter",()=>{if(b){const v=ua(b.normId);e({...b,normCode:v?v.code:b.normId})}else C("Aucune NC majeure listée.","info")})}return i(),t.append(a,r),{root:t,refresh:i}}function Tp(){const e=document.createElement("div");e.className="iso-doc-proof-strip",e.setAttribute("aria-label","Statut des preuves documentaires");function t(){e.replaceChildren();const a=document.createElement("div");a.className="iso-doc-proof-strip-title",a.textContent="Preuves (statut indicatif)",e.append(a),Jr.forEach((n,i)=>{const o=(String(n.name).length+i)%3;let s;o===0?s={label:"Présent",cls:"green"}:o===1?s={label:"Manquant",cls:"red"}:s={label:"À vérifier",cls:"amber"};const c=document.createElement("div");c.className="iso-doc-proof-row";const l=document.createElement("span");l.className="iso-doc-proof-name",l.textContent=n.name;const d=document.createElement("span");d.className=`badge ${s.cls} iso-doc-proof-badge`,d.textContent=s.label,c.append(l,d),e.append(c)});const r=ds();if(r.length){const n=document.createElement("div");n.className="iso-doc-proof-strip-title",n.style.marginTop="12px",n.textContent="Preuves importées (validées)",e.append(n),r.forEach(i=>{const o=wt().find(g=>g.id===i.requirementId),s=o?ua(o.normId):null,c=o?`${o.clause} (${s?s.code:""})`:i.requirementId,l=document.createElement("div");l.className="iso-doc-proof-row";const d=document.createElement("span");d.className="iso-doc-proof-name",d.textContent=`${i.fileName} · ${i.docTypeLabel} → ${c}`;const u=document.createElement("span"),p=i.proofStatus==="present"?"green":i.proofStatus==="missing"?"red":"amber";u.className=`badge ${p} iso-doc-proof-badge`,u.textContent=ps(i.proofStatus),l.append(d,u),e.append(l)})}}return t(),{root:e,refresh:t}}function Mp(){const e=document.createElement("div");return e.className="iso-review-grid",yp.forEach(t=>{const a=document.createElement("div");a.className="iso-review-tile";const r=document.createElement("span");r.textContent=t.label;const n=document.createElement("span");n.className="iso-review-value",n.textContent=t.value;const i=document.createElement("span");i.className="iso-review-detail",i.textContent=t.detail,a.append(r,n,i),e.append(a)}),e}function Pp(e){dp(),qt(),Dt();const t=document.createElement("section");t.className="page-stack iso-page iso-page--hub iso-page--cockpit iso-page--conformite-premium";const a={req:null},r=ga.iso,n=document.createElement("article");n.className="content-card card-soft iso-header-card iso-hub-intro iso-cockpit-hero",n.innerHTML=`
    <div class="iso-cockpit-hero-top">
      <div class="iso-cockpit-hero-copy">
        <div class="section-kicker">${vt(r==null?void 0:r.kicker)}</div>
        <h1>${vt(r==null?void 0:r.title)}</h1>
        <p class="content-card-lead iso-cockpit-hero-lead">
          ${vt(r==null?void 0:r.subtitle)}
        </p>
        <p class="iso-cockpit-hero-trust" role="note">
          Vue unique pour direction et auditeurs : indicateurs, preuves et écarts — chaque décision reste validée par vos équipes (aucune écriture automatique).
        </p>
      </div>
      <div class="iso-cockpit-hero-actions">
        <button type="button" class="btn btn-secondary iso-hero-scroll-prio">Voir les priorités</button>
        <button type="button" class="btn btn-primary btn--pilotage-cta iso-prep-audit">Préparer l’audit</button>
      </div>
    </div>
    <div class="iso-cockpit-hero-executive-band">
      <div class="iso-cockpit-hero-kpis iso-cockpit-hero-kpis--dual" aria-label="Synthèse express">
        <div class="iso-hero-kpi">
          <span class="iso-hero-kpi-value iso-hero-stat-pct">—</span>
          <span class="iso-hero-kpi-label">Score global</span>
        </div>
        <div class="iso-hero-kpi">
          <span class="iso-hero-kpi-value iso-hero-stat-gaps">—</span>
          <span class="iso-hero-kpi-label">Exigences en écart</span>
        </div>
      </div>
      <div class="iso-cockpit-hero-snapshot-host iso-cockpit-hero-snapshot-host--compact"></div>
    </div>
  `,n.querySelector(".iso-prep-audit").addEventListener("click",()=>{C("Préparation d’audit : checklist, équipe et pièces — workflow à brancher sur le SI (démo).","info"),typeof e=="function"&&e({module:"iso",action:"Préparation audit lancée",detail:"Depuis le cockpit ISO & Conformité — simulation prototype",user:"Responsable QHSE"})}),n.querySelector(".iso-hero-scroll-prio").addEventListener("click",()=>{var G;(G=document.querySelector(".iso-page .iso-cockpit-priorities"))==null||G.scrollIntoView({behavior:"smooth",block:"start"})});const i=document.createElement("article");i.className="content-card card-soft iso-ai-spotlight",i.setAttribute("aria-label","Assistance conformité"),i.innerHTML=`
    <div class="iso-ai-visual" aria-hidden="true"></div>
    <div class="iso-ai-badge">IA assistée</div>
    <h3>Assistant conformité</h3>
    <p class="iso-ai-trust">Suggestions contextuelles uniquement — le registre et les statuts sont toujours validés par un humain.</p>
    <p class="iso-ai-lead">
      Accélérez les revues : analyse des écarts, preuves manquantes et pistes de plan d’action, puis traitement dans le registre.
    </p>
    <div class="iso-ai-suggestion-grid" role="group" aria-label="Assistant conformité — actions suggérées">
      <button type="button" class="btn btn-secondary iso-ai-suggestion-btn" data-iso-suggest="ecarts">Analyser les écarts</button>
      <button type="button" class="btn btn-secondary iso-ai-suggestion-btn" data-iso-suggest="preuves">Identifier preuves manquantes</button>
      <button type="button" class="btn btn-secondary iso-ai-suggestion-btn" data-iso-suggest="plan">Proposer plan d’action</button>
    </div>
  `,i.querySelectorAll(".iso-ai-suggestion-btn").forEach(G=>{G.addEventListener("click",()=>{var T,j;const X=G.getAttribute("data-iso-suggest");C({ecarts:"Croiser écarts par norme et responsable — à confirmer en réunion (démo).",preuves:"Rapprocher preuves documentaires et exigences ouvertes (démo).",plan:"Ébauche de plan d’action — à formaliser et valider (démo)."}[X]||"Piste conformité (démo).","info"),X==="ecarts"&&((T=document.querySelector(".iso-page .iso-cockpit-priorities"))==null||T.scrollIntoView({behavior:"smooth",block:"start"})),X==="preuves"&&((j=document.querySelector(".iso-page .iso-docs-priority"))==null||j.scrollIntoView({behavior:"smooth",block:"start"}))})});const o=dr(),s=Sp(o),c=n.querySelector(".iso-cockpit-hero-snapshot-host");c&&c.append(s);function l(){const G=dr(),X=wt().filter(j=>j.status!=="conforme").length,$=n.querySelector(".iso-hero-stat-pct"),T=n.querySelector(".iso-hero-stat-gaps");$&&($.textContent=`${G.pct} %`),T&&(T.textContent=String(X))}l();const d={refreshTable:()=>{},onAnalyze:()=>{}};d.onAnalyze=G=>{mp({requirement:{id:G.id,normId:G.normId,normCode:G.normCode,clause:G.clause,title:G.title,summary:G.summary,evidence:G.evidence,status:G.status},controlledDocuments:Jr,siteId:Ne.activeSiteId,onStatusCommitted:(X,$,T)=>{(async()=>await Yt("critical_validation",{contextLabel:"mise à jour du statut d’exigence (conformité)"})&&(hp(X,$),x(),typeof e=="function"&&e({module:"iso",action:"Statut exigence mis à jour (validation humaine)",detail:`${X} → ${$} (${T.source})`,user:"Utilisateur"})))()}})};const u={refreshPilotage(){}},p=qp(u,e),g=Tp(),m=document.createElement("article");m.className="content-card card-soft iso-norms-hero-wrap iso-norms-central";const b=document.createElement("div");b.className="content-card-head",b.innerHTML=`
    <div>
      <div class="section-kicker">Référentiels</div>
      <h3>9001 · 14001 · 45001 — lecture consolidée</h3>
      <p class="content-card-lead">
        Score, statut et écarts par norme, alignés sur le registre d’exigences. Données de démonstration.
      </p>
    </div>
  `;const y=Lp(),v=document.createElement("div");v.className="iso-norms-grid iso-norms-grid--lite";function h(G){if(!G.length)return 100;let X=0;return G.forEach($=>{$.status==="conforme"?X+=100:$.status==="partiel"&&(X+=50)}),Math.round(X/G.length)}function k(G){const X=G.filter(T=>T.status==="non_conforme").length,$=G.filter(T=>T.status!=="conforme").length;return X>0?{label:"Critique",cls:"red"}:$>0?{label:"À risque",cls:"amber"}:{label:"OK",cls:"green"}}function _(){v.replaceChildren();const{missing:G,obsolete:X,critical:$}=Kr,T=[G.length,X.length,$.length];ss.forEach((j,Y)=>{const ne=vp.find(ve=>ve.id===j.code);if(!ne)return;const ae=wt().filter(ve=>ve.normId===j.id),de=ae.filter(ve=>ve.status!=="conforme").length,he=ae.filter(ve=>ve.status==="non_conforme").length,fe=k(ae),_e=La[Y%Math.max(La.length,1)],Ee=La.length>0?`${_e.title} · ${_e.horizon}`:"Aucun audit lié en données démo";v.append(Ap({id:j.code,title:j.title,status:ne.status,badge:ne.badge,line:ne.line,statsTotal:ae.length,statsNonOk:de,strictNcCount:he,cockpitPct:h(ae),cockpitLevelLabel:fe.label,cockpitLevelClass:fe.cls,docsMissingCount:T[Y%3],auditLine:Ee}))})}_(),m.append(b,y,v);const{root:f,refresh:E}=Ip(G=>d.onAnalyze(G));function w(){if(a.req){const G=wt();let X=0,$=0,T=0;G.forEach(j=>{j.status==="conforme"?X+=1:j.status==="partiel"?$+=1:T+=1}),a.req.replaceChildren(Ic({conforme:X,partiel:$,nonConforme:T}))}}function x(){Cp(s,dr()),l(),_(),E(),d.refreshTable(),p.renderAttention(),g.refresh(),w()}u.refreshPilotage=x;const S=document.createElement("article");S.className="content-card card-soft iso-req-hub-card",S.innerHTML=`
    <div class="content-card-head">
      <div>
        <div class="section-kicker">Exigences</div>
        <h3>Registre des exigences</h3>
        <p class="content-card-lead">
          Filtres par statut, colonne <strong>Traiter</strong> pour l’assistance conformité.
        </p>
      </div>
    </div>
  `,S.append(zp(d));const N=document.createElement("article");N.className="content-card card-soft iso-docs-hub-card",N.innerHTML=`
    <div class="content-card-head">
      <div>
        <div class="section-kicker">Documentation</div>
        <h3>Documents &amp; preuves</h3>
        <p class="content-card-lead">Preuves indicatives, pièces à traiter puis liste maîtrisée (repliable).</p>
      </div>
    </div>
  `,N.append(g.root,p.root);const L=document.createElement("article");L.className="content-card card-soft iso-review-hub-card",L.innerHTML=`
    <div class="content-card-head">
      <div>
        <div class="section-kicker">Revue de direction</div>
        <h3>Synthèse rapide</h3>
        <p class="content-card-lead">Entrées pour le comité — chiffres de démo.</p>
      </div>
    </div>
  `,L.append(Mp());const D=document.createElement("section");D.className="two-column iso-register-docs-layout";const q=document.createElement("div");q.className="iso-section-stack iso-register-docs-col iso-register-docs-col--req",q.append(S);const W=document.createElement("div");W.className="iso-pilotage-aside iso-register-docs-col iso-register-docs-col--docs",W.append(N),D.append(q,W);const K=document.createElement("div");K.className="iso-norms-hub",K.append(m);const A=document.createElement("div");A.className="iso-focus-zone",A.append(K,i);const I=document.createElement("div");I.className="iso-zone-header iso-focus-zone-intro",I.innerHTML=`
    <p class="iso-zone-header__kicker">Cartographie</p>
    <h2 class="iso-zone-header__title">Normes &amp; assistance</h2>
    <p class="iso-zone-header__desc">Référentiels et lecture opérationnelle, avec l’assistant pour préparer vos revues — le registre reste la source de vérité.</p>
  `;const z=document.createElement("div");z.className="iso-focus-wrap",z.append(I,A);const R=document.createElement("div");R.className="iso-secondary-zone",R.append(D,L);const V=document.createElement("div");V.className="iso-secondary-wrap";const oe=document.createElement("p");oe.className="iso-zone-kicker",oe.setAttribute("aria-hidden","true"),oe.textContent="Registre, documentation & revue",V.append(oe,R);const ge=document.createElement("article");ge.className="content-card card-soft iso-conformity-chart-card",ge.innerHTML=`
    <div class="content-card-head">
      <div>
        <div class="section-kicker">Registre</div>
        <h3>Répartition des exigences</h3>
        <p class="content-card-lead">Vue graphique du registre (mêmes totaux que le tableau).</p>
      </div>
    </div>
  `;const B=document.createElement("div");B.className="dashboard-chart-card-inner",ge.append(B);const re=document.createElement("div");re.className="two-column iso-conformity-charts-row iso-conformity-charts-row--single",re.append(ge),a.req=B,w();const se=document.createElement("div");se.className="iso-priority-shell",se.append(f);const F=document.createElement("div");F.className="iso-insights-zone";const H=document.createElement("div");return H.className="iso-zone-header",H.innerHTML=`
    <p class="iso-zone-header__kicker">Indicateurs</p>
    <h2 class="iso-zone-header__title">Lecture du registre</h2>
    <p class="iso-zone-header__desc">Répartition des statuts d’exigences — cohérente avec le tableau et les filtres ci-dessous.</p>
  `,F.append(H,re),t.append(ba({title:"Conformité — par où commencer",hint:"Le score et les écarts en tête donnent la santé globale ; les priorités listent ce qui mérite une action maintenant.",nextStep:"Étape suivante : traiter les priorités, puis les normes ci-dessous — le registre détaillé reste accessible en défilant ou en mode Expert."}),n,se,z,F,V),t}const bo="qhse-audit-products-styles",Rp=`
.audit-products-page .audit-last-card{border:1px solid rgba(148,163,184,.12)}
.audit-last-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:14px;margin-top:12px}
.audit-last-item{display:grid;gap:4px}
.audit-last-item span:first-child{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3)}
.audit-last-item span:last-child{font-size:14px;font-weight:700;color:var(--text)}
.audit-last-score{font-size:28px;font-weight:800;letter-spacing:-.03em}
.audit-checklist-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:10px}
.audit-checklist-row{align-items:center}
.audit-score-panel{text-align:center}
.audit-score-gauge-wrap{display:grid;place-items:center;margin:8px 0 12px}
.audit-score-gauge{width:160px;height:160px;border-radius:50%;box-shadow:0 12px 32px rgba(0,0,0,.2)}
.audit-score-gauge-inner{display:grid;place-items:center;width:160px;height:160px;margin-top:-160px;position:relative;pointer-events:none}
.audit-score-gauge-inner strong{font-size:36px;font-weight:800;letter-spacing:-.04em}
.audit-score-gauge-inner small{display:block;font-size:12px;color:var(--text3);margin-top:2px}
.audit-history-stack{display:grid;gap:8px}
.audit-history-row{padding:12px 14px}
.audit-actions-bar{margin-top:16px;display:flex;justify-content:flex-end}
.audit-right-stack{display:grid;gap:14px;min-width:0}
.products-toolbar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;align-items:center}
.products-toolbar .control-input{max-width:320px;flex:1;min-width:200px}
.products-list{display:grid;gap:10px}
.products-row{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap}
.products-row-main{min-width:0;flex:1}
.products-row-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.products-actions-bar{margin-top:16px;display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap}
.products-page-header{margin-bottom:4px;padding:20px 22px 22px;border-radius:16px}
.products-page-header__inner{max-width:62rem}
.products-page-title{margin:6px 0 0;font-size:clamp(22px,2.4vw,28px);font-weight:800;letter-spacing:-.03em;color:var(--text)}
.products-page-lead{margin:10px 0 0;font-size:14px;line-height:1.55;color:var(--text2);max-width:56ch}
.products-flow-inline{margin:10px 0 0;font-size:12px;font-weight:600;letter-spacing:.04em;color:var(--text3);max-width:48ch}
.products-import-card,.products-validation-card,.products-list-card{margin-bottom:0}
.products-import-lead{max-width:56ch}
.products-import-row{display:flex;flex-wrap:wrap;gap:12px 16px;align-items:flex-end;margin-top:8px}
.products-file-label{display:flex;flex-direction:column;gap:6px;min-width:min(100%,220px);flex:1}
.products-file-label__text{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text3)}
.products-fds-input{min-height:44px;font-size:13px}
.products-ia-disclaimer{margin:12px 0 0;font-size:11px;line-height:1.45;color:var(--text3);max-width:62ch;opacity:.92}
.products-human-gate{
  margin:0 0 14px;padding:10px 14px;border-radius:12px;
  border:1px solid rgba(52,211,153,.28);background:rgba(52,211,153,.06);
  font-size:13px;line-height:1.45;color:var(--text2);
}
.products-human-gate strong{color:var(--text);font-weight:700}
.products-validation-grid{margin-top:4px}
.products-validation-actions{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-top:16px;padding-top:14px;border-top:1px solid rgba(148,163,184,.12)}
.products-list-empty{margin:0;font-size:13px;color:var(--text3)}
.products-row-doc{margin:4px 0 0;font-size:11px;color:var(--text3)}
.products-detail-host{margin-top:18px}
.products-detail-card{padding:20px 22px 22px}
.products-detail-title{margin:4px 0 0;font-size:18px;font-weight:800}
.products-detail-meta{margin:8px 0 0;font-size:13px;color:var(--text2)}
.products-detail-body{display:grid;gap:18px;margin-top:16px}
.products-detail-block h4{margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.products-detail-text{margin:0;font-size:13px;line-height:1.5;color:var(--text2)}
.products-detail-note{margin:8px 0 0;font-size:12px;color:var(--text3);line-height:1.45}
.products-detail-list{margin:0;padding-left:1.2rem;font-size:13px;line-height:1.5;color:var(--text2)}
.products-detail-muted{font-size:13px;color:var(--text3)}
.products-detail-valid{margin:6px 0 0;font-size:12px;font-weight:600;color:var(--text2)}
.products-detail-valid--expired{color:var(--color-text-warning,#f59e0b)}
.products-detail-subh{margin:10px 0 4px;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.products-detail-block--general{border-left:3px solid rgba(56,189,248,.45);padding-left:14px}
.products-detail-block--urgent{border-left:3px solid rgba(248,113,113,.5);padding-left:14px;background:rgba(248,113,113,.06);border-radius:12px;padding:14px 14px 14px 18px}
.products-detail-urgency{font-weight:600;color:var(--text)}
.products-detail-block--ia{border-left:3px solid rgba(168,85,247,.4);padding-left:14px;background:rgba(168,85,247,.05);border-radius:12px;padding:14px 14px 14px 18px}
.products-picto-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.products-picto-chip{font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:5px 10px;border-radius:8px;border:1px solid rgba(148,163,184,.2);background:rgba(0,0,0,.15);color:var(--text2)}
.products-kpi-host{min-width:0}
.products-kpi-card{padding:20px 22px 22px;border-radius:16px;border:1px solid rgba(125,211,252,.18);background:linear-gradient(165deg,rgba(255,255,255,.04),rgba(0,0,0,.08))}
.products-kpi-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:12px}
@media (max-width:640px){.products-kpi-grid{grid-template-columns:1fr}}
.products-kpi-tile{padding:14px 16px;border-radius:12px;border:1px solid rgba(148,163,184,.12);background:rgba(0,0,0,.12);text-align:center}
.products-kpi-tile--alert{border-color:rgba(248,113,113,.35);background:rgba(248,113,113,.08)}
.products-kpi-label{display:block;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);margin-bottom:6px}
.products-kpi-val{font-size:26px;font-weight:800;letter-spacing:-.03em;color:var(--text);line-height:1}
.products-dist-block{margin-top:18px;padding-top:16px;border-top:1px solid rgba(148,163,184,.1)}
.products-dist-title{margin:0 0 10px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.products-dist-bars{display:grid;gap:8px;max-width:420px}
.products-dist-row{display:grid;grid-template-columns:52px 1fr 28px;align-items:center;gap:10px;font-size:12px;color:var(--text2)}
.products-dist-track{height:10px;border-radius:999px;background:rgba(0,0,0,.2);overflow:hidden;border:1px solid rgba(148,163,184,.1)}
.products-dist-fill{display:block;height:100%;border-radius:999px;min-width:4px}
.products-dist-fill--el{background:linear-gradient(90deg,rgba(248,113,113,.9),rgba(220,38,38,.75))}
.products-dist-fill--mo{background:linear-gradient(90deg,rgba(251,191,36,.9),rgba(217,119,6,.75))}
.products-dist-fill--fa{background:linear-gradient(90deg,rgba(52,211,153,.85),rgba(16,185,129,.7))}
.products-alerts-block{margin-top:16px;padding-top:14px;border-top:1px solid rgba(148,163,184,.1)}
.products-alerts-title{margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.products-alerts-empty{margin:0;font-size:13px;color:var(--text3)}
.products-alerts-list{margin:0;padding:0;list-style:none;display:grid;gap:6px}
.products-alert-link{display:block;width:100%;text-align:left;font:inherit;font-size:13px;font-weight:600;color:var(--text);padding:8px 10px;border-radius:10px;border:1px solid rgba(148,163,184,.12);background:rgba(0,0,0,.1);cursor:pointer;transition:background .15s ease,border-color .15s ease}
.products-alert-link:hover{background:rgba(255,255,255,.06);border-color:rgba(248,113,113,.25)}
.products-row-card{
  padding:16px 18px;border-radius:14px;border:1px solid rgba(148,163,184,.12);
  background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(0,0,0,.06));
  box-shadow:0 4px 20px rgba(0,0,0,.12);
}
.products-row-title{display:block;font-size:15px;font-weight:800;color:var(--text);line-height:1.3}
.products-row-sub{margin:6px 0 0;font-size:13px;color:var(--text2)}
.products-row-rev{margin:4px 0 0;font-size:12px;color:var(--text3)}
.products-row-validity{margin:4px 0 0;font-size:11px;font-weight:600;color:var(--text2)}
.products-row-validity--late{color:var(--color-text-warning,#fbbf24)}
.products-row-doc--warn{color:var(--color-text-warning,#fbbf24)}
.products-row-pills{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.products-alert-pill{font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:4px 8px;border-radius:6px;border:1px solid rgba(148,163,184,.15)}
.products-alert-pill--miss{border-color:rgba(248,113,113,.4);background:rgba(248,113,113,.12);color:#fecaca}
.products-alert-pill--exp{border-color:rgba(251,191,36,.45);background:rgba(251,191,36,.1);color:#fde68a}
.products-alert-pill--nc{border-color:rgba(239,91,107,.4);background:rgba(239,91,107,.1);color:#fecdd3}
.products-danger-badge{flex-shrink:0}
.products-terrain-host{min-width:0}
.products-terrain-card{padding:18px 20px;border-radius:16px;border:1px solid rgba(20,184,166,.28);background:linear-gradient(135deg,rgba(20,184,166,.1),rgba(0,0,0,.1))}
.products-terrain-head{margin-bottom:12px}
.products-terrain-kicker{font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#5eead4}
.products-terrain-title{margin:6px 0 0;font-size:16px;font-weight:800;color:var(--text)}
.products-terrain-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:14px}
@media (max-width:720px){.products-terrain-grid{grid-template-columns:1fr}}
.products-terrain-cell{padding:12px 14px;border-radius:12px;border:1px solid rgba(148,163,184,.1);background:rgba(0,0,0,.14);min-width:0}
.products-terrain-cell--danger{border-color:rgba(248,113,113,.35);background:rgba(248,113,113,.08)}
.products-terrain-cell--urgent{border-color:rgba(56,189,248,.3);background:rgba(56,189,248,.08)}
.products-terrain-lbl{display:block;font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);margin-bottom:6px}
.products-terrain-val{margin:0;font-size:13px;font-weight:600;line-height:1.45;color:var(--text)}
.products-terrain-mini{margin:4px 0 0;font-size:11px;color:var(--text3)}
.products-terrain-empty{margin:0;font-size:13px;color:var(--text2)}
.products-ia-preview{
  margin:0 0 16px;padding:14px 16px;border-radius:12px;
  border:1px dashed rgba(168,85,247,.35);background:rgba(168,85,247,.06);
}
.products-ia-preview-title{margin:0 0 10px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.products-ia-preview-cols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
@media (max-width:640px){.products-ia-preview-cols{grid-template-columns:1fr}}
.products-ia-preview-sub{margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text3)}
.products-ia-preview-list{margin:0;padding-left:1.1rem;font-size:12px;line-height:1.45;color:var(--text2)}
.products-ia-preview-empty{list-style:none;margin-left:-1.1rem;color:var(--text3)}
.audit-products-page{display:flex;flex-direction:column;gap:20px;padding-bottom:1.5rem}
.products-page--premium{width:100%;max-width:min(1120px,100%);margin-inline:auto;box-sizing:border-box}
.products-detail-head-actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px;justify-content:flex-end}
.products-detail-summary{
  display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px;padding:12px 14px;border-radius:12px;
  border:1px solid rgba(148,163,184,.14);background:rgba(0,0,0,.1);
}
@media (max-width:560px){.products-detail-summary{grid-template-columns:1fr}}
.products-detail-summary-item{min-width:0;text-align:center}
.products-detail-summary-lbl{display:block;font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);margin-bottom:4px}
.products-detail-summary-val{display:block;font-size:14px;font-weight:800;color:var(--text);line-height:1.25}
.products-detail-summary-val--red{color:#fecaca}
.products-detail-summary-val--amber{color:#fde68a}
.products-detail-summary-val--green{color:#a7f3d0}
.products-detail-exploit-note{margin:12px 0 0;font-size:12px;line-height:1.5;color:var(--text3);max-width:62ch;padding:10px 12px;border-radius:10px;border:1px dashed rgba(125,211,252,.25);background:rgba(56,189,248,.06)}
.products-detail-block--modules .products-detail-module-hint{margin-bottom:10px}
.products-detail-module-btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.products-human-confirm-wrap{margin-top:4px}
.products-human-confirm-wrap .products-human-confirm-label{display:flex;gap:10px;align-items:flex-start;font-size:13px;line-height:1.5;color:var(--text2)}
.products-human-confirm-check{margin-top:3px;flex-shrink:0;accent-color:var(--app-accent,#14b8a6)}
.products-terrain-picker{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:10px}
.products-terrain-picker-label{font-size:11px;font-weight:700;letter-spacing:.04em;color:var(--text3)}
.products-terrain-select{min-width:min(100%,320px);max-width:100%}
.products-detail-ia-refresh{margin-top:14px}
.products-kpi-card{box-shadow:0 8px 32px rgba(0,0,0,.14)}
`;function us(){if(document.getElementById(bo))return;const e=document.createElement("style");e.id=bo,e.textContent=Rp,document.head.append(e)}const ho="qhse-audit-plus-styles",Dp=`
.audit-plus-page .audit-kpi-strip{margin-bottom:14px}
.audit-last-card .audit-last-lead{margin:0}
.audit-plan-card{margin-bottom:14px}
.audit-plan-table-wrap{overflow-x:auto;margin-top:10px;border-radius:12px;border:1px solid rgba(148,163,184,.1)}
.audit-plan-table{min-width:640px;display:grid;gap:0}
.audit-plan-head,.audit-plan-row{display:grid;grid-template-columns:minmax(100px,0.9fr) minmax(120px,1.1fr) minmax(100px,0.85fr) minmax(90px,0.75fr) minmax(100px,0.9fr);gap:8px;padding:10px 12px;align-items:center;font-size:12px}
.audit-plan-head{font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--text3);background:rgba(0,0,0,.18);border-bottom:1px solid rgba(148,163,184,.12)}
.audit-plan-row{border-bottom:1px solid rgba(148,163,184,.08)}
.audit-plan-row:last-child{border-bottom:none}
.audit-plan-ref{font-weight:700;color:var(--text)}
.audit-plan-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;justify-content:flex-end}
.audit-last-progress{margin-top:14px}
.audit-last-progress-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;font-size:12px;color:var(--text2)}
.audit-progress-bar{height:8px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden}
.audit-progress-bar > span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,rgba(77,160,255,.9),rgba(52,211,153,.85))}
.audit-last-status-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:10px}
.audit-last-status-row .badge{font-size:11px}
.audit-field-panel{margin-top:14px;padding:0;border-radius:14px;border:1px solid rgba(77,160,255,.22);background:rgba(77,160,255,.04);overflow:hidden}
.audit-field-panel[hidden]{display:none!important}
.audit-field-panel-head{padding:14px 16px;border-bottom:1px solid rgba(148,163,184,.12);background:rgba(0,0,0,.12)}
.audit-field-panel-head h4{margin:0 0 4px;font-size:15px;font-weight:800}
.audit-field-panel-head p{margin:0;font-size:13px;color:var(--text2);line-height:1.45}
.audit-field-stack{padding:14px 16px;display:grid;gap:12px}
.audit-field-item{border-radius:12px;border:1px solid rgba(148,163,184,.12);background:rgba(0,0,0,.1);padding:12px 14px}
.audit-field-item__title{margin:0 0 10px;font-size:14px;font-weight:700;line-height:1.35;color:var(--text)}
.audit-field-toggles{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}
.audit-field-toggles button{min-height:38px;padding:0 14px;border-radius:10px;border:1px solid rgba(148,163,184,.2);background:rgba(0,0,0,.15);color:var(--text);font-size:12px;font-weight:700;cursor:pointer}
.audit-field-toggles button.is-on.conforme{border-color:rgba(52,211,153,.45)!important;background:rgba(52,211,153,.12)!important;color:#86efac!important}
.audit-field-toggles button.is-on.nonconforme{border-color:rgba(239,91,107,.45)!important;background:rgba(239,91,107,.1)!important;color:#fecaca!important}
.audit-field-comment{width:100%;min-height:56px;padding:8px 10px;border-radius:10px;border:1px solid rgba(148,163,184,.18);background:rgba(0,0,0,.2);color:var(--text);font-size:13px;resize:vertical;box-sizing:border-box}
.audit-nc-block{margin-top:14px;padding:14px 16px;border-top:1px solid rgba(148,163,184,.1);background:rgba(239,91,107,.05)}
.audit-nc-block h5{margin:0 0 10px;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#fecaca}
.audit-nc-list{display:grid;gap:10px}
.audit-nc-card{border-radius:12px;border:1px solid rgba(239,91,107,.35);background:rgba(0,0,0,.2);padding:12px 14px;display:grid;gap:8px}
.audit-nc-card__ref{font-size:11px;font-weight:800;letter-spacing:.06em;color:#fca5a5}
.audit-nc-card__text{font-size:13px;line-height:1.45;color:var(--text2);margin:0}
.audit-nc-card__actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}
.audit-main-actions{display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end;margin-top:14px;align-items:center}
/* —— Cockpit audit premium —— */
.audit-cockpit-hero{
  border-radius:18px;border:1px solid rgba(125,211,252,.22);
  background:linear-gradient(165deg,rgba(56,189,248,.1),rgba(255,255,255,.03) 40%,rgba(8,12,20,.45) 100%);
  box-shadow:0 20px 50px rgba(0,0,0,.25),0 1px 0 rgba(255,255,255,.06) inset;
  margin-bottom:16px;padding:22px 24px 24px;
}
.audit-cockpit-hero .content-card-head{margin-bottom:0}
.audit-cockpit-hero__actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;align-items:center}
.audit-cockpit-hero__stats{
  display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:20px;
}
.audit-cockpit-hero__stats--five{
  grid-template-columns:repeat(5,minmax(0,1fr));
}
.audit-cockpit-hero__stats--four{
  grid-template-columns:repeat(4,minmax(0,1fr));
}
@media (max-width:1100px){.audit-cockpit-hero__stats--five{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:1000px){.audit-cockpit-hero__stats--four{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:900px){.audit-cockpit-hero__stats{grid-template-columns:repeat(2,1fr)}}
@media (max-width:900px){.audit-cockpit-hero__stats--five{grid-template-columns:repeat(2,1fr)}}
@media (max-width:480px){.audit-cockpit-hero__stats{grid-template-columns:1fr}}
@media (max-width:480px){.audit-cockpit-hero__stats--five{grid-template-columns:1fr}}
@media (max-width:480px){.audit-cockpit-hero__stats--four{grid-template-columns:1fr}}
.audit-cockpit-metrics--three{
  grid-template-columns:repeat(3,minmax(0,1fr));
}
@media (max-width:720px){
  .audit-cockpit-metrics--three{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:420px){
  .audit-cockpit-metrics--three{grid-template-columns:1fr}
}
.audit-cockpit-stat{
  padding:12px 14px;border-radius:14px;border:1px solid rgba(148,163,184,.12);
  background:rgba(0,0,0,.2);
}
.audit-cockpit-stat__val{display:block;font-size:22px;font-weight:800;letter-spacing:-.03em;color:var(--text);line-height:1.1}
.audit-cockpit-stat__lbl{display:block;margin-top:4px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text3)}
.audit-cockpit-main{
  border-radius:18px;border:1px solid rgba(148,163,184,.14);
  background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(0,0,0,.12));
  box-shadow:0 14px 40px rgba(0,0,0,.2);margin-bottom:16px;overflow:hidden;
}
.audit-cockpit-main .content-card-head{border-bottom:1px solid rgba(255,255,255,.06);padding-bottom:14px;margin-bottom:0}
.audit-cockpit-main__grid{
  display:grid;grid-template-columns:minmax(0,280px) minmax(0,1fr);gap:20px;padding:18px 20px 20px;
  align-items:start;
}
@media (max-width:960px){.audit-cockpit-main__grid{grid-template-columns:1fr}}
.audit-cockpit-main__aside{display:grid;gap:14px;min-width:0}
.audit-cockpit-metrics{
  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;
}
.audit-cockpit-metric{
  padding:12px 14px;border-radius:12px;border:1px solid rgba(148,163,184,.1);background:rgba(0,0,0,.15);
}
.audit-cockpit-metric span:first-child{display:block;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.audit-cockpit-metric span:last-child{display:block;margin-top:4px;font-size:17px;font-weight:800;color:var(--text)}
.audit-cockpit-cycle{margin-top:4px}
.audit-cockpit-cycle__label{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);margin:0 0 10px}
.audit-cockpit-cycle-progress{
  margin:10px 0 0;font-size:12px;line-height:1.5;color:var(--text2);max-width:56ch;
}
.audit-cockpit-cycle-progress strong{color:#bae6fd;font-weight:700}
.audit-cockpit-stepper{display:flex;flex-wrap:wrap;gap:8px}
.audit-cockpit-step{
  flex:1;min-width:72px;padding:10px 8px;border-radius:12px;text-align:center;
  border:1px solid rgba(148,163,184,.12);background:rgba(0,0,0,.12);font-size:10px;font-weight:700;
  color:var(--text3);line-height:1.25;
}
.audit-cockpit-step--active{
  border-color:rgba(56,189,248,.45);background:rgba(56,189,248,.12);color:#bae6fd;
  box-shadow:0 0 0 1px rgba(56,189,248,.15);
}
.audit-cockpit-step--done{border-color:rgba(52,211,153,.3);color:#86efac}
.audit-cockpit-pills{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.audit-cockpit-pill{
  font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:6px 10px;border-radius:999px;
  border:1px solid rgba(148,163,184,.15);color:var(--text2);
}
.audit-cockpit-pill--on{border-color:rgba(251,191,36,.45);color:#fde68a;background:rgba(251,191,36,.08)}
.audit-cockpit-pill--ok{border-color:rgba(52,211,153,.4);color:#86efac;background:rgba(52,211,153,.06)}
.audit-cockpit-pill--wait{border-color:rgba(148,163,184,.2);color:var(--text3)}
.audit-cockpit-ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,.06)}
.audit-cockpit-ia{
  border-radius:16px;border:1px solid rgba(168,85,247,.28);
  background:linear-gradient(135deg,rgba(168,85,247,.1),rgba(56,189,248,.06),rgba(255,255,255,.02));
  margin-bottom:16px;padding:18px 20px 20px;
}
.audit-cockpit-ia__head{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-bottom:12px}
.audit-cockpit-ia__badge{
  font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;padding:5px 10px;border-radius:999px;
  color:#e9d5ff;background:rgba(168,85,247,.22);border:1px solid rgba(196,181,253,.35);
}
.audit-cockpit-ia__title{margin:0;font-size:15px;font-weight:800;color:var(--text)}
.audit-cockpit-ia__lead{margin:0 0 8px;font-size:13px;line-height:1.5;color:var(--text2);max-width:62ch}
.audit-cockpit-ia__trust{
  margin:0 0 14px;padding:10px 12px;border-radius:12px;border:1px dashed rgba(196,181,253,.25);
  background:rgba(0,0,0,.12);font-size:12px;line-height:1.5;color:var(--text3);max-width:62ch;
}
.audit-cockpit-ia__grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}
.audit-cockpit-ia__btn{
  text-align:left;padding:12px 14px;border-radius:12px;border:1px solid rgba(148,163,184,.15);
  background:rgba(0,0,0,.18);color:var(--text2);font-size:12px;font-weight:600;line-height:1.4;cursor:pointer;
  transition:border-color .15s,background .15s;
}
.audit-cockpit-ia__btn:hover{border-color:rgba(168,85,247,.35);background:rgba(168,85,247,.08);color:var(--text)}
.audit-cockpit-prio{
  border-radius:16px;border:1px solid rgba(248,113,113,.22);background:rgba(248,113,113,.06);
  margin-bottom:16px;padding:18px 20px;
}
.audit-cockpit-prio h4{margin:0 0 10px;font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#fecaca}
.audit-cockpit-prio__lead{margin:0 0 14px;font-size:12.5px;line-height:1.5;color:var(--text2);max-width:58ch}
.audit-cockpit-prio ul{margin:0;padding:0;list-style:none;display:grid;gap:10px}
.audit-cockpit-prio li{
  display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;align-items:flex-start;
  padding:10px 12px;border-radius:12px;background:rgba(0,0,0,.15);border:1px solid rgba(148,163,184,.08);
  font-size:13px;color:var(--text2);
}
.audit-cockpit-prio li strong{color:var(--text);font-weight:700;flex-shrink:0;max-width:42%}
.audit-cockpit-prio__detail{min-width:0;flex:1;text-align:right;line-height:1.45}
@media (max-width:600px){
  .audit-cockpit-prio li{flex-direction:column;align-items:stretch}
  .audit-cockpit-prio li strong{max-width:100%}
  .audit-cockpit-prio__detail{text-align:left}
}
.audit-constat-human{margin-bottom:14px}
.audit-constat-human .audit-checklist-row{border-radius:12px}
.audit-human-strip{
  margin-top:8px;padding:10px 12px;border-radius:12px;border:1px dashed rgba(125,211,252,.22);
  background:rgba(0,0,0,.12);display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;
}
.audit-human-status{font-size:11px;font-weight:700;color:var(--text2)}
.audit-human-status--pending{color:#fde68a}
.audit-human-status--validated{color:#86efac}
.audit-human-status--adjusted{color:#7dd3fc}
.audit-human-status--rejected{color:#fecaca}
.audit-human-actions{display:flex;flex-wrap:wrap;gap:8px}
.audit-human-actions .btn{min-height:36px!important;padding:6px 12px!important;font-size:12px!important}
.audit-cockpit-proofs{margin-bottom:16px}
.audit-proof-row{
  display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;
  padding:12px 14px;border-radius:12px;border:1px solid rgba(148,163,184,.1);background:rgba(0,0,0,.1);margin-top:8px;
}
.audit-proof-row span:first-child{font-size:13px;font-weight:600;color:var(--text)}
.audit-proof-badge{font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:4px 8px;border-radius:8px}
.audit-proof-badge--present{color:#86efac;border:1px solid rgba(52,211,153,.35);background:rgba(52,211,153,.1)}
.audit-proof-badge--missing{color:#fecaca;border:1px solid rgba(248,113,113,.4);background:rgba(248,113,113,.1)}
.audit-proof-badge--verify{color:#fde68a;border:1px solid rgba(251,191,36,.4);background:rgba(251,191,36,.08)}
.audit-plan-card.audit-plan-card--cockpit .audit-plan-row{padding:12px 14px}
.audit-plan-card.audit-plan-card--cockpit .audit-plan-head{padding:12px 14px}
.audit-plus-page .qhse-kpi-strip.ds-kpi-grid{
  grid-template-columns:repeat(auto-fit,minmax(148px,1fr));gap:14px;margin-bottom:18px;
}
.audit-cockpit-history{
  border-radius:16px;border:1px solid rgba(148,163,184,.12);
  background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(0,0,0,.1));
}
.audit-cockpit-history__lead{margin:6px 0 0;font-size:12.5px;line-height:1.45;max-width:52ch}
.audit-cockpit-history__trend{
  margin:12px 0 0;padding:10px 12px;border-radius:12px;border:1px solid rgba(56,189,248,.15);
  background:rgba(56,189,248,.06);font-size:12px;line-height:1.45;color:var(--text2);
}
.audit-cockpit-layout{gap:18px}
.audit-cockpit-footer-actions{
  margin-top:18px;padding:16px 18px;border-radius:16px;border:1px solid rgba(148,163,184,.1);
  background:rgba(0,0,0,.12);justify-content:flex-end!important;
}
.audit-cockpit-checklist .content-card-head{margin-bottom:4px}
@media (max-width:900px){
  .audit-plan-head{display:none}
  .audit-plan-row{grid-template-columns:1fr;gap:6px;padding:12px}
  .audit-plan-card.audit-plan-card--cockpit .audit-plan-row span[data-label]:before{
    content:attr(data-label);display:block;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--text3);margin-bottom:2px;
  }
}
/* Notifications intelligentes cockpit */
.audit-cockpit-notifs{
  border-radius:16px;border:1px solid rgba(56,189,248,.2);
  background:linear-gradient(165deg,rgba(56,189,248,.07),rgba(255,255,255,.025) 38%,rgba(8,12,20,.4) 100%);
  box-shadow:0 10px 32px rgba(0,0,0,.18),0 1px 0 rgba(255,255,255,.04) inset;
  margin-bottom:0;padding:16px 18px 18px;
}
.audit-cockpit-notifs .content-card-head{margin-bottom:0}
.audit-cockpit-notifs__head{align-items:flex-start!important;gap:14px}
.audit-cockpit-notifs__lead{margin:6px 0 0;max-width:52ch;line-height:1.45;font-size:12px;color:var(--text2)}
.audit-cockpit-notifs__badges{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:flex-end}
.audit-cockpit-notifs__count,.audit-cockpit-notifs__prio{font-size:10px!important;letter-spacing:.06em}
.audit-cockpit-notifs__list{
  margin-top:12px;display:grid;gap:8px;
}
.audit-cockpit-notifs__item{
  display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:8px 12px;
  padding:10px 12px;border-radius:12px;
  border:1px solid rgba(148,163,184,.1);
  background:rgba(0,0,0,.12);
}
.audit-cockpit-notifs__item-main{flex:1;min-width:min(100%,220px)}
.audit-cockpit-notifs__item-title{font-size:12px;font-weight:800;color:var(--text);line-height:1.3}
.audit-cockpit-notifs__item-detail{margin:4px 0 0;font-size:11px;line-height:1.45;color:var(--text2);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.audit-cockpit-notifs__type{font-size:9px!important;letter-spacing:.08em;text-transform:uppercase;flex-shrink:0}
.audit-cockpit-notifs__empty{margin:0;padding:14px;border-radius:12px;border:1px dashed rgba(148,163,184,.2);font-size:13px;color:var(--text2)}
.audit-cockpit-notifs__ia{
  margin-top:14px;padding:12px 14px;border-radius:14px;
  border:1px dashed rgba(168,85,247,.28);background:rgba(0,0,0,.12);
  display:flex;flex-wrap:wrap;align-items:flex-start;gap:10px 14px;
}
.audit-cockpit-notifs__ia-pill{
  font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;
  padding:4px 10px;border-radius:999px;
  background:rgba(168,85,247,.2);border:1px solid rgba(192,132,252,.35);color:#e9d5ff;flex-shrink:0
}
.audit-cockpit-notifs__ia-text{
  margin:0;flex:1;min-width:min(100%,200px);font-size:12px;line-height:1.5;color:var(--text3)
}
.audit-cockpit-notifs__foot{
  margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.06);
  display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center;justify-content:space-between;
}
.audit-notify-participants-btn{min-height:44px}
.audit-notify-participants-btn:disabled{opacity:.55;cursor:not-allowed}
.audit-cockpit-notifs__role-hint{
  margin:0;flex:1;min-width:min(100%,240px);font-size:11px;line-height:1.45;color:var(--text3);max-width:52ch
}

/* —— Cockpit stratégique : 4 tiers, hero synthèse, graphiques ISO —— */
.audit-cockpit-tier{
  display:flex;flex-direction:column;gap:18px;
  margin-bottom:24px;
  scroll-margin-top:1.25rem;
}
.audit-cockpit-tier:last-of-type{margin-bottom:8px}
.audit-cockpit-tier .content-card{margin-bottom:0}
.audit-cockpit-tier .audit-plan-card{margin-bottom:0}
.audit-cockpit-tier .audit-cockpit-main{margin-bottom:0}
.audit-cockpit-tier .audit-cockpit-prio{margin-bottom:0}
.audit-cockpit-tier .audit-cockpit-notifs{margin-bottom:0}
.audit-cockpit-tier .audit-cockpit-proofs{margin-bottom:0}
.audit-cockpit-tier .audit-cockpit-ia{margin-bottom:0}
.audit-cockpit-tier .audit-kpi-strip{margin-bottom:0}
.audit-cockpit-tier .audit-main-actions{margin-top:0}
.audit-cockpit-tier .audit-iso-treatment-card,
.audit-cockpit-tier .audit-iso-trace-card{margin-bottom:0}

.audit-cockpit-hero{padding:24px 26px 26px;margin-bottom:0}
.audit-cockpit-hero__prime{
  display:grid;
  grid-template-columns:minmax(0,1fr) minmax(0,1.15fr) minmax(0,1fr);
  gap:20px 28px;
  align-items:center;
  margin-top:18px;
  padding:20px 22px;border-radius:16px;
  border:1px solid rgba(125,211,252,.2);
  background:rgba(0,0,0,.14);
}
.audit-cockpit-hero__score-block{display:flex;flex-direction:column;gap:4px}
.audit-cockpit-hero__score-val{
  font-size:clamp(34px,5.5vw,46px);font-weight:800;letter-spacing:-.04em;color:var(--text);line-height:1;
}
.audit-cockpit-hero__score-lbl{
  font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);
}
.audit-cockpit-hero__status-block{display:flex;flex-direction:column;align-items:flex-start;gap:8px}
.audit-cockpit-hero__status-line{
  margin:0;font-size:13px;line-height:1.45;color:var(--text2);max-width:44ch;
}
.audit-cockpit-hero__exec-summary{
  font-size:14px;font-weight:600;color:var(--text2);
  display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:flex-end;
}
.audit-cockpit-hero__exec-sep{opacity:.4;font-weight:400}
.audit-cockpit-hero__tagline{font-size:13px!important;line-height:1.5!important}

.audit-cockpit-hero__nav{
  display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;
  margin-top:16px;padding-top:14px;
  border-top:1px solid rgba(255,255,255,.07);
}
.audit-cockpit-hero__nav-btn{
  margin:0;padding:6px 12px;border-radius:999px;
  border:1px solid rgba(148,163,184,.2);
  background:rgba(0,0,0,.12);
  color:var(--text2);
  font-size:12px;font-weight:600;cursor:pointer;
  transition:border-color .15s,background .15s,color .15s;
}
.audit-cockpit-hero__nav-btn:hover{
  border-color:rgba(56,189,248,.4);
  background:rgba(56,189,248,.1);
  color:#bae6fd;
}

@media (max-width:900px){
  .audit-cockpit-hero__prime{
    grid-template-columns:1fr;text-align:center;
  }
  .audit-cockpit-hero__status-block{align-items:center}
  .audit-cockpit-hero__status-line{max-width:100%}
  .audit-cockpit-hero__exec-summary{justify-content:center}
}

.audit-plus-page .two-column.audit-cockpit-charts-row{
  display:grid;grid-template-columns:1fr;gap:24px;
}

.audit-cockpit-chart-card .content-card-head{margin-bottom:4px}
.audit-cockpit-strategic-chart-body{
  display:flex;flex-direction:column;gap:20px;
  padding:20px 22px 24px!important;
}
.audit-cockpit-embed-plan-mix .dashboard-chart-interpret{
  font-size:12px;line-height:1.45;margin-top:8px;opacity:.95;
}
.audit-cockpit-embed-plan-mix .dashboard-mix-legend{
  margin-top:10px;
}

.dashboard-audit-iso-bars{display:flex;flex-direction:column;gap:14px}
.dashboard-audit-iso-bars .dashboard-chart-interpret{margin-top:4px;margin-bottom:0}
.dashboard-audit-iso-bar-row{
  display:grid;
  grid-template-columns:96px 1fr 44px;
  gap:12px;
  align-items:center;
}
.dashboard-audit-iso-bar-label{font-size:12px;font-weight:700;color:var(--text)}
.dashboard-audit-iso-bar-track{
  height:11px;border-radius:999px;
  background:rgba(255,255,255,.07);
  overflow:hidden;border:1px solid rgba(148,163,184,.14);
}
.dashboard-audit-iso-bar-fill{
  display:block;height:100%;border-radius:999px;
  background:linear-gradient(90deg,rgba(56,189,248,.9),rgba(45,212,191,.75));
  min-width:3px;
}
.dashboard-audit-iso-bars > .dashboard-audit-iso-bar-row:nth-child(2) .dashboard-audit-iso-bar-fill{
  background:linear-gradient(90deg,rgba(34,197,94,.85),rgba(52,211,153,.6));
}
.dashboard-audit-iso-bars > .dashboard-audit-iso-bar-row:nth-child(3) .dashboard-audit-iso-bar-fill{
  background:linear-gradient(90deg,rgba(251,191,36,.9),rgba(249,115,22,.65));
}
.dashboard-audit-iso-bar-value{
  font-size:12px;font-weight:800;font-variant-numeric:tabular-nums;color:var(--text2);text-align:right;
}
@media (max-width:520px){
  .dashboard-audit-iso-bar-row{grid-template-columns:1fr;gap:6px}
  .dashboard-audit-iso-bar-value{text-align:left}
}

.audit-cockpit-delta-strip{
  padding:10px 14px;border-radius:12px;
  border:1px solid rgba(56,189,248,.22);
  background:rgba(56,189,248,.06);
  font-size:12px;line-height:1.45;color:var(--text2);
}
.audit-cockpit-delta-strip strong{color:#7dd3fc;font-weight:800}

.audit-cockpit-embed-plan-mix{
  padding-top:6px;border-top:1px solid rgba(255,255,255,.07);
}
.audit-cockpit-embed-plan-mix__title{
  margin:0 0 14px;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--text3);
}

.audit-cockpit-ia__insight{
  margin:0 0 12px;padding:12px 16px;border-radius:14px;
  border:1px solid rgba(196,181,253,.35);
  background:rgba(168,85,247,.1);
  font-size:13px;font-weight:600;line-height:1.45;color:#e9d5ff;
}
.audit-cockpit-ia__lead{margin-top:0}

.content-card-head--tight{margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(148,163,184,.08)}
.content-card-head--tight h3{margin:0 0 4px}
.content-card-head--tight .content-card-lead{font-size:12px;margin:0;max-width:52ch;line-height:1.45}

.audit-cockpit-page.page-stack.audit-premium-page{gap:20px}
.audit-premium-header{
  padding:14px 16px 16px;margin-bottom:0;
  border-radius:16px;border:1px solid rgba(125,211,252,.2);
  background:linear-gradient(135deg,rgba(56,189,248,.09),rgba(15,23,42,.4));
  box-shadow:0 12px 36px rgba(0,0,0,.22);
}
.audit-premium-header__row{
  display:grid;grid-template-columns:minmax(0,1.15fr) minmax(132px,0.5fr) minmax(0,1fr);
  gap:16px 22px;align-items:center;
}
@media (max-width:900px){
  .audit-premium-header__row{grid-template-columns:1fr}
  .audit-premium-header__score{max-width:280px;margin:0 auto}
  .audit-premium-header__side{align-items:stretch}
  .audit-premium-header__nav,.audit-premium-header__ctas{justify-content:center}
}
.audit-premium-header__title{margin:4px 0;font-size:clamp(17px,2.4vw,21px);font-weight:800;letter-spacing:-.02em;line-height:1.15}
.audit-premium-header__sub{margin:0 0 10px;font-size:12px;color:var(--text2);line-height:1.4}
.audit-premium-header__status{font-size:11px}
.audit-premium-header__score{
  text-align:center;padding:10px 14px;border-radius:12px;
  border:1px solid rgba(56,189,248,.32);background:rgba(0,0,0,.22);
}
.audit-premium-header__score-val{display:block;font-size:clamp(26px,4vw,36px);font-weight:900;letter-spacing:-.04em;line-height:1;color:#7dd3fc}
.audit-premium-header__score-lbl{display:block;margin-top:4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--text3)}
.audit-premium-header__side{display:flex;flex-direction:column;gap:12px;align-items:flex-end;min-width:0}
.audit-premium-header__nav{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end}
.audit-premium-header__ctas{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}
.audit-premium-header__progress-wrap{margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.07)}
.audit-premium-header__progress-top{display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:var(--text2);margin-bottom:6px}
.audit-premium-header__progress-bar{height:5px}

.audit-strategic-kpis{
  display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:8px 0 10px;
}
@media (max-width:960px){.audit-strategic-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:480px){.audit-strategic-kpis{grid-template-columns:1fr}}
.audit-strategic-kpi{
  padding:10px 12px;border-radius:11px;border:1px solid rgba(148,163,184,.12);
  background:rgba(0,0,0,.12);display:flex;flex-direction:column;gap:3px;min-width:0;
}
.audit-strategic-kpi__lbl{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.audit-strategic-kpi__val{font-size:18px;font-weight:800;letter-spacing:-.03em;color:var(--text);line-height:1.1}
.audit-strategic-kpi__hint{font-size:11px;color:var(--text2);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}

.audit-premium-chart-wrap{width:100%;margin:0}
.audit-premium-chart-card .content-card-head--tight{margin-bottom:6px}
.audit-premium-chart-sub{margin:4px 0 0;font-size:11px;line-height:1.4;color:var(--text3);max-width:44ch}
.audit-premium-chart-body{padding-top:2px}
.audit-premium-chart-body .dashboard-chart-interpret{
  font-size:11px!important;line-height:1.4!important;margin-top:6px!important;margin-bottom:0!important;
}

.audit-premium-cockpit .content-card-head{border-bottom:1px solid rgba(255,255,255,.06);padding-bottom:12px;margin-bottom:0}
.audit-premium-cockpit__body{padding:10px 0 4px;display:flex;flex-direction:column;gap:10px}
.audit-premium-cockpit__iso{font-size:11px!important;font-weight:700!important;line-height:1.35!important;color:var(--text2)!important;white-space:normal!important}

.audit-premium-checklist-stack{gap:8px!important}
.audit-checklist-compact-top--nc{border-left:3px solid rgba(239,91,107,.45)}
.audit-checklist-compact-point{flex:1;min-width:200px;font-size:12px;font-weight:600;color:var(--text);line-height:1.45}
.audit-checklist-compact-badge{flex-shrink:0}
.audit-checklist-treat{font-size:12px;font-weight:700;padding:4px 0;min-height:auto}
.audit-human-strip--collapsible{margin-top:8px;padding:8px 10px;border-radius:10px;background:rgba(0,0,0,.08);border:1px solid rgba(148,163,184,.1)}
.audit-human-strip--collapsible .audit-human-actions{gap:6px;flex-wrap:wrap}
.audit-human-strip--collapsible .btn.btn-secondary{font-size:11px;padding:6px 10px;min-height:36px}

.audit-premium-nc__list{margin:10px 0 0;padding-left:1.15em;line-height:1.55;font-size:13px;color:var(--text2)}
.audit-premium-nc__foot{margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.06)}

.audit-premium-proofs-groups{
  display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:4px;
}
@media (max-width:840px){.audit-premium-proofs-groups{grid-template-columns:1fr}}
.audit-premium-proofs-col{padding:9px 11px;border-radius:10px;border:1px solid rgba(148,163,184,.11);background:rgba(0,0,0,.1);min-width:0}
.audit-premium-proofs-col--missing{border-color:rgba(239,91,107,.28)}
.audit-premium-proofs-col__title{margin:0 0 8px;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3)}
.audit-premium-proofs-col__list{margin:0;padding-left:1.1em;font-size:12px;line-height:1.5;color:var(--text2)}
.audit-premium-proofs-col__empty{list-style:none;margin-left:-1.1em;font-style:italic;color:var(--text3);font-size:12px}

.audit-premium-assistant{
  padding:12px 14px 14px;border-radius:14px;
  border:1px solid rgba(168,85,247,.22);background:rgba(88,28,135,.07);
}
.audit-premium-assistant__title{margin:2px 0 4px;font-size:16px;font-weight:800;letter-spacing:-.02em}
.audit-premium-assistant__lead{margin:0;font-size:12px;color:var(--text2);max-width:58ch;line-height:1.45}
.audit-premium-assistant__insight{
  margin:8px 0 0;padding:6px 10px;border-radius:8px;
  border:1px solid rgba(196,181,253,.25);background:rgba(168,85,247,.08);
  font-size:11px;line-height:1.4;color:#e9d5ff;max-width:62ch;
}
.audit-premium-assistant__insight--empty{display:none!important;margin:0!important;padding:0!important}
.audit-premium-assistant__primary{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.audit-premium-assistant__btn-main{min-height:38px;font-size:12px}
.audit-premium-assistant__more{margin-top:10px;font-size:12px;color:var(--text2)}
.audit-premium-assistant__more summary{cursor:pointer;font-weight:700;list-style-position:outside}
.audit-premium-assistant__grid{display:flex;flex-direction:column;gap:8px}

.audit-premium-footer-actions{margin-top:12px;padding-top:12px;border-top:1px solid rgba(148,163,184,.1)}

.audit-cockpit-tier--score.audit-premium-tier{display:flex;flex-direction:column;gap:14px}
.audit-premium-history .audit-cockpit-history__trend{
  margin-top:10px;padding:8px 10px;font-size:11px;line-height:1.4;
}

/* —— Bandeau pilotage ISO & conformité —— */
.audit-iso-pilot-wrap{display:flex;flex-direction:column;gap:0}
.audit-iso-pilot-bar{
  display:flex;flex-direction:column;gap:10px;
}
.audit-iso-pilot-bar__main{
  display:grid;
  grid-template-columns:minmax(0,1fr) minmax(0,1.35fr) minmax(120px,0.42fr);
  gap:12px 16px;
  align-items:start;
}
@media (max-width:960px){
  .audit-iso-pilot-bar__main{grid-template-columns:1fr;justify-items:stretch}
  .audit-iso-pilot-bar__main .audit-premium-header__score{max-width:100%}
}
.audit-iso-pilot-bar__title-block{min-width:0}
.audit-iso-pilot-bar__meta{
  margin:0;display:grid;
  grid-template-columns:repeat(auto-fill,minmax(148px,1fr));
  gap:10px 14px;
  font-size:12px;
}
.audit-iso-pilot-bar__meta-item{
  padding:6px 8px;border-radius:9px;
  border:1px solid rgba(148,163,184,.12);background:rgba(0,0,0,.1);
}
.audit-iso-pilot-bar__meta-item dt{
  margin:0;font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);
}
.audit-iso-pilot-bar__meta-item dd{margin:4px 0 0;font-weight:600;color:var(--text);line-height:1.35}
.audit-iso-pilot-bar__footer{
  display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;
  padding-top:10px;border-top:1px solid rgba(255,255,255,.07);
}
.audit-iso-pilot-bar__footer .audit-premium-header__nav{margin-top:0;padding-top:0;border-top:none;flex:1;min-width:min(100%,220px)}
.audit-iso-pilot-bar__footer .audit-premium-header__ctas{justify-content:flex-end}

.audit-iso-conformity-row{
  display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:8px 0 6px;
}
@media (max-width:900px){.audit-iso-conformity-row{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:440px){.audit-iso-conformity-row{grid-template-columns:1fr}}
.audit-iso-conformity-card{
  padding:9px 11px;border-radius:11px;border:1px solid rgba(148,163,184,.12);
  background:rgba(0,0,0,.11);display:flex;flex-direction:column;gap:2px;min-width:0;
}
.audit-iso-conformity-card--ok{border-left:3px solid rgba(52,211,153,.45)}
.audit-iso-conformity-card--partial{border-left:3px solid rgba(251,191,36,.5)}
.audit-iso-conformity-card--nc{border-left:3px solid rgba(248,113,113,.5)}
.audit-iso-conformity-card--act{border-left:3px solid rgba(56,189,248,.5)}
.audit-iso-conformity-card__lbl{font-size:9px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--text3)}
.audit-iso-conformity-card__val{font-size:19px;font-weight:800;letter-spacing:-.03em;line-height:1;color:var(--text)}
.audit-iso-conformity-card__hint{font-size:10px;color:var(--text3);line-height:1.35}

.audit-iso-export-bar{
  padding:10px 12px;border-radius:12px;border:1px solid rgba(125,211,252,.16);
  background:rgba(0,0,0,.08);margin:2px 0 0;
  display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:10px 14px;
}
.audit-iso-export-bar__head{flex:1;min-width:min(100%,200px);margin-bottom:0}
.audit-iso-export-bar__title{
  display:block;font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);
}
.audit-iso-export-bar__sub{display:block;margin-top:2px;font-size:11px;line-height:1.4;color:var(--text3);max-width:48ch}
.audit-iso-export-bar__actions{display:flex;flex-wrap:wrap;gap:6px;flex-shrink:0}

.audit-checklist-compact-top{
  display:grid;
  grid-template-columns:minmax(0,1.2fr) auto minmax(120px,0.95fr) auto;
  gap:8px 10px;align-items:center;
  padding:8px 12px;border-radius:11px;
  border:1px solid rgba(148,163,184,.11);background:rgba(0,0,0,.1);
}
@media (max-width:720px){
  .audit-checklist-compact-top{grid-template-columns:1fr auto;grid-template-rows:auto auto}
  .audit-checklist-compact-point{grid-column:1/-1}
  .audit-checklist-compact-badge{grid-column:1}
  .audit-checklist-compact-proof{grid-column:1/-1}
}
.audit-checklist-compact-proof{
  font-size:11px;color:var(--text2);line-height:1.4;
  font-style:italic;min-width:0;
}
.audit-human-validation-legend{
  margin:0 0 6px;width:100%;font-size:10px;line-height:1.4;color:var(--text3);max-width:52ch;
}

.audit-iso-treatment-card__lead,.audit-iso-trace-card__lead,.audit-premium-checklist__legend,.audit-premium-proofs__iso-lead{
  margin:4px 0 0;font-size:11px;line-height:1.4;color:var(--text3);max-width:52ch;
}

.audit-iso-treatment-table{
  margin-top:4px;border-radius:12px;border:1px solid rgba(148,163,184,.1);overflow:hidden;
}
.audit-iso-treatment-head,.audit-iso-treatment-row{
  display:grid;
  grid-template-columns:minmax(90px,0.9fr) minmax(72px,0.65fr) minmax(120px,1fr) minmax(88px,0.75fr);
  gap:6px;padding:8px 10px;align-items:center;font-size:11px;
}
.audit-iso-treatment-head{
  font-weight:800;letter-spacing:.06em;text-transform:uppercase;font-size:10px;color:var(--text3);
  background:rgba(0,0,0,.16);border-bottom:1px solid rgba(148,163,184,.1);
}
.audit-iso-treatment-row{
  border-bottom:1px solid rgba(148,163,184,.07);background:rgba(0,0,0,.06);
}
.audit-iso-treatment-row:last-child{border-bottom:none}
@media (max-width:640px){
  .audit-iso-treatment-head{display:none}
  .audit-iso-treatment-row{grid-template-columns:1fr;gap:4px}
  .audit-iso-treatment-row span[data-label]:before{
    content:attr(data-label) " · ";font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--text3);
  }
}

.audit-iso-trace-list{
  margin:6px 0 0;padding:0;list-style:none;display:grid;gap:6px;
}
.audit-iso-trace-item{
  display:grid;
  grid-template-columns:minmax(100px,0.85fr) minmax(88px,0.75fr) minmax(0,1.2fr) minmax(0,1fr);
  gap:8px;padding:8px 10px;border-radius:10px;
  border:1px solid rgba(148,163,184,.1);background:rgba(0,0,0,.08);font-size:11px;line-height:1.35;
}
@media (max-width:800px){
  .audit-iso-trace-item{grid-template-columns:1fr 1fr}
  .audit-iso-trace-item__action,.audit-iso-trace-item__comment{grid-column:1/-1}
}
.audit-iso-trace-item__who{font-weight:800;color:var(--text)}
.audit-iso-trace-item__when{font-size:11px;color:var(--text3);font-variant-numeric:tabular-nums}
.audit-iso-trace-item__action{color:var(--text2)}
.audit-iso-trace-item__comment{font-size:11px;color:var(--text3);font-style:italic}
`;function ms(){if(document.getElementById(ho))return;const e=document.createElement("style");e.id=ho,e.textContent=Dp,document.head.append(e)}const xo="Écart constaté sur le terrain — détail à compléter";let gs=1;function jp(){return`NC-AUD-2026-${String(gs++).padStart(3,"0")}`}function Op({points:e,auditRef:t="AUD-0000",siteId:a}){ms();const r={};e.forEach(p=>{r[p.id]={status:null,comment:""}});const n=document.createElement("div");n.className="audit-field-panel",n.hidden=!0;const i=document.createElement("div");i.className="audit-field-panel-head",i.innerHTML=`
    <h4>Mode audit terrain</h4>
    <p>Marquez chaque point : <strong>Conforme</strong> ou <strong>Non conforme</strong>, ajoutez un commentaire si besoin. Les écarts enregistrent une NC et une action dans le plan d’actions.</p>
  `;const o=document.createElement("div");o.className="audit-field-stack";const s=document.createElement("div");s.className="audit-nc-block";const c=document.createElement("h5");c.textContent="Non-conformités détectées";const l=document.createElement("div");l.className="audit-nc-list",s.append(c,l);function d(){l.innerHTML="";const p=e.filter(g=>r[g.id].status==="non_conforme");if(p.length===0){const g=document.createElement("p");g.style.margin="0",g.style.fontSize="13px",g.style.color="var(--text3)",g.textContent="Aucun écart pour l’instant — marquez un point « Non conforme » pour voir une NC.",l.append(g);return}p.forEach(g=>{var x;const m=g.ncRef||(g.ncRef=jp()),b=document.createElement("article");b.className="audit-nc-card",b.style.borderLeft="4px solid rgba(239, 91, 107, 0.75)",b.style.paddingLeft="14px";const y=document.createElement("div");y.className="audit-nc-card__ref";const v=/^NC-\d+$/.test(String(m));y.textContent=v?`Réf. NC (serveur) : ${m}`:`Réf. provisoire : ${m}`;const h=document.createElement("p");h.className="audit-nc-card__text";const _=((x=r[g.id].comment)==null?void 0:x.trim())||xo;h.textContent=`${g.point} — ${_}`;const f=document.createElement("p");f.style.margin="10px 0 0",f.style.fontSize="12px",f.style.lineHeight="1.45",f.style.color="var(--text2)",f.textContent="Une action corrective a été générée automatiquement — suivi dans le module Actions.";const E=document.createElement("div");E.className="audit-nc-card__actions",E.style.marginTop="12px";const w=document.createElement("button");w.type="button",w.className="btn btn-primary",w.textContent="Créer action corrective",w.addEventListener("click",()=>{C("L’action corrective est créée automatiquement avec la non-conformité (voir module Actions).","info"),Be.add({module:"audits",action:"Rappel action liée NC",detail:"Depuis non-conformité audit",user:"Responsable QHSE"})}),E.append(w),b.append(y,h,f,E),l.append(b)})}function u(p){const g=document.createElement("div");g.className="audit-field-item";const m=document.createElement("p");m.className="audit-field-item__title",m.textContent=p.point;const b=document.createElement("div");b.className="audit-field-toggles";const y=document.createElement("button");y.type="button",y.textContent="Conforme";const v=document.createElement("button");v.type="button",v.textContent="Non conforme";function h(){y.className=r[p.id].status==="conforme"?"is-on conforme":"",v.className=r[p.id].status==="non_conforme"?"is-on nonconforme":""}y.addEventListener("click",()=>{r[p.id].status="conforme",delete p.ncRef,h(),d()}),v.addEventListener("click",async()=>{var x,S;if(!lt((x=Me())==null?void 0:x.role,"nonconformities","write")){C("Enregistrement NC non autorisé pour ce rôle.","warning");return}const _=r[p.id].status==="non_conforme";if(r[p.id].status="non_conforme",h(),d(),_)return;const E=(r[p.id].comment||"").trim()||xo,w={title:p.point,detail:E,auditRef:t,...a?{siteId:a}:{}};try{const N=await Se("/api/nonconformities",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(w)});if(!N.ok){try{const W=await N.json();console.error("[audits] POST /api/nonconformities",N.status,W)}catch{console.error("[audits] POST /api/nonconformities",N.status)}C("Erreur serveur","error");return}const L=await N.json(),D=(S=L==null?void 0:L.nonConformity)==null?void 0:S.id,q=D!=null?`NC-${D}`:p.ncRef||"—";D!=null&&(p.ncRef=q,d()),C("Non-conformité enregistrée","info"),Be.add({module:"audits",action:"Non-conformité enregistrée",detail:`Audit ${t} · Point : ${p.point} · ${q}`,user:"Auditeur terrain"})}catch(N){console.error("[audits] POST /api/nonconformities",N),C("Erreur serveur","error")}});const k=document.createElement("textarea");return k.className="audit-field-comment",k.rows=2,k.placeholder="Commentaire (observation, preuve, recommandation)",k.value=r[p.id].comment,k.addEventListener("input",()=>{r[p.id].comment=k.value,d()}),h(),b.append(y,v),g.append(m,b,k),g}return e.forEach(p=>o.append(u(p))),n.append(i,o,s),d(),{element:n,show(){n.hidden=!1},hide(){n.hidden=!0},reset(){e.forEach(p=>{r[p.id]={status:null,comment:""},delete p.ncRef}),gs=1,o.innerHTML="",e.forEach(p=>{o.append(u(p))}),d()}}}const Hp=2,bs=8,Xr=5,Fp=[{name:"PV d’audit signé",status:"present"},{name:"Photos zones de stockage",status:"missing"},{name:"Registre déchets (extrait)",status:"verify"}],Vp=[{label:"NC critiques",detail:"2 écarts majeurs liés au dernier audit — pilotage plan d’actions"},{label:"Audits à préparer",detail:"AUD-P-021 (08/04) — dossier preuves incomplet"},{label:"Preuves manquantes",detail:"3 pièces signalées sur le périmètre stockage"},{label:"Actions urgentes",detail:`${Xr} actions en retard < 15 j (lien module Actions)`}],fo=["Détection","Contrôle humain","Correction","Vérification","Clôture"],pr=1;function Bp(e){return ui.filter(t=>t.statut===e).length}function Tr(e){const t=String(e||"").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);if(!t)return null;const a=new Date(Number(t[3]),Number(t[2])-1,Number(t[1]));return Number.isNaN(a.getTime())?null:a}function Gp(e,t){const a=r=>Date.UTC(r.getFullYear(),r.getMonth(),r.getDate());return Math.round((a(t)-a(e))/864e5)}function Up(){const e=new Date,t=[];ui.forEach(i=>{const o=Tr(i.date),s=i.statut;if(s==="terminé"){t.push({key:`done-${i.ref}`,title:`Audit terminé — ${i.ref}`,detail:`${i.site} · ${i.date} · clôture à consolider côté preuves / synthèse.`,tone:"green"});return}if(s==="en cours"){t.push({key:`run-${i.ref}`,title:`Audit en cours — ${i.ref}`,detail:`${i.site} · auditeur : ${i.auditeur} · date prévue ${i.date}.`,tone:"amber"});return}if(s==="à venir"&&o){const c=Gp(e,o);c<=0?t.push({key:`late-${i.ref}`,title:`Échéance atteinte / dépassée — ${i.ref}`,detail:`${i.site} · prévu le ${i.date} — vérifier le calendrier et notifier les participants.`,tone:"red"}):c<=7?t.push({key:`soon-${i.ref}`,title:`Audit imminent — ${i.ref}`,detail:`${i.site} dans ${c} jour(s) (${i.date}) · rappel aux équipes et auditeur (${i.auditeur}).`,tone:"amber"}):t.push({key:`plan-${i.ref}`,title:`Audit planifié — ${i.ref}`,detail:`${i.site} · ${i.date} · ${i.auditeur}.`,tone:"blue"})}else s==="à venir"&&t.push({key:`plan-${i.ref}`,title:`Audit planifié — ${i.ref}`,detail:`${i.site} · date ${i.date} · ${i.auditeur}.`,tone:"blue"})}),t.push({key:"retard-global",title:"Audits en retard (pilotage)",detail:`${Hp} position(s) à reprogrammer ou escalader — synchroniser avec le planning.`,tone:"red"}),t.push({key:"nc-open",title:"Non-conformités détectées / ouvertes",detail:`${bs} NC suivies sur le registre — informer les responsables et le plan d’actions.`,tone:"amber"}),t.push({key:"actions-late",title:"Actions en retard",detail:`${Xr} action(s) liées aux audits en retard < 15 j — relance recommandée.`,tone:"red"});const a=t.some(i=>i.key.startsWith("soon-")||i.key.startsWith("late-")),r=t.some(i=>i.key.startsWith("run-"));let n="Suggestion IA : notifier après validation humaine du périmètre et des participants (aucun envoi automatique).";return a?n="Suggestion IA : envoyer un rappel aux participants et au site dans les 48 h — l’audit est imminent ou l’échéance est passée.":r?n="Suggestion IA : notifier pour point d’étape mi-parcours (constats provisoires) — à valider avec l’auditeur.":n="Suggestion IA : notifier les pilotes d’actions et la direction sur les NC et retards — message à personnaliser avant envoi.",{items:t,suggestNotifyHint:n}}function Wp(e){const{canAuditWrite:t,su:a,model:r}=e,{items:n}=r,i=document.createElement("article");i.className="content-card card-soft audit-cockpit-notifs",i.setAttribute("aria-labelledby","audit-cockpit-notifs-title");const o=n.filter(m=>m.tone==="red"||m.tone==="amber").length,s=document.createElement("div");s.className="content-card-head content-card-head--split audit-cockpit-notifs__head",s.innerHTML=`
    <div>
      <div class="section-kicker">Pilotage</div>
      <h3 id="audit-cockpit-notifs-title">Alertes planning</h3>
      <p class="content-card-lead audit-cockpit-notifs__lead">
        Échéances et relances — <strong>aucun envoi auto</strong> sans clic.
      </p>
    </div>
    <div class="audit-cockpit-notifs__badges" aria-label="Synthèse alertes">
      <span class="badge blue audit-cockpit-notifs__count">${n.length} alerte(s)</span>
      ${o?`<span class="badge amber audit-cockpit-notifs__prio">${o} à traiter</span>`:'<span class="badge green audit-cockpit-notifs__prio">Situation stable</span>'}
    </div>
  `;const c=document.createElement("div");if(c.className="audit-cockpit-notifs__list",c.setAttribute("role","list"),n.forEach(m=>{const b=document.createElement("div");b.className="audit-cockpit-notifs__item",b.setAttribute("role","listitem");const y=document.createElement("div");y.className="audit-cockpit-notifs__item-main";const v=document.createElement("div");v.className="audit-cockpit-notifs__item-title",v.textContent=m.title;const h=document.createElement("p");h.className="audit-cockpit-notifs__item-detail",h.textContent=m.detail,y.append(v,h);const k=document.createElement("span");k.className=`badge ${m.tone} audit-cockpit-notifs__type`,k.textContent=m.key.startsWith("plan-")&&m.tone==="blue"?"Planifié":m.key.startsWith("soon-")?"Rappel":m.key.startsWith("late-")?"Échéance":m.key.startsWith("run-")?"En cours":m.key.startsWith("done-")?"Terminé":m.key==="nc-open"?"NC":m.key==="actions-late"?"Actions":m.key==="retard-global"?"Retard":"Pilotage",b.append(y,k),c.append(b)}),n.length===0){const m=document.createElement("p");m.className="audit-cockpit-notifs__empty",m.textContent="Aucune alerte dérivée des données affichées — le registre est à jour (mock).",c.append(m)}const l=document.createElement("div");l.className="audit-cockpit-notifs__foot";const d=document.createElement("button");d.type="button",d.className="btn btn-primary audit-notify-participants-btn",d.textContent="Notifier les participants";const u=t;!u&&a&&(d.disabled=!0,d.title="Réservé aux profils avec droit d’écriture sur les audits (ex. QHSE, Admin)."),d.addEventListener("click",()=>{if(!u){C("Action réservée aux rôles pouvant piloter les audits (écriture). Contactez votre référent QHSE.","info");return}const m=n.slice(0,5).map(b=>b.title).join(" · ");C("Maquette : notification enregistrée pour diffusion aux participants (e-mail / push à brancher sur votre SI).","info"),Be.add({module:"audits",action:"Notification participants (maquette cockpit)",detail:m||"Aucune alerte active",user:(a==null?void 0:a.name)||"Utilisateur"})});const p=document.createElement("p");p.className="audit-cockpit-notifs__role-hint";const g=lt(a==null?void 0:a.role,"notifications","read");return p.textContent=g?"Avec « notifications », ce bandeau pourra alimenter le canal une fois branché.":"Sans écriture audits : lecture seule, pas d’envoi.",l.append(d,p),i.append(s,c,l),i}const ui=[{ref:"AUD-P-021",site:"Site principal",auditeur:"M. Diallo",date:"08/04/2026",statut:"à venir"},{ref:"AUD-P-022",site:"Site sud",auditeur:"Équipe qualité",date:"02/04/2026",statut:"en cours"},{ref:"AUD-P-019",site:"Site principal",auditeur:"Cabinet externe",date:"15/03/2026",statut:"terminé"}],Xe={date:"28/03/2026",site:"Site principal",score:78,progress:72,ref:"AUD-2026-014",ncCount:2,auditeur:"M. Diallo — Auditeur interne SMS"},Yp="ISO 9001 · 14001 · 45001",ur=[{nc:"NC-2026-014-A",action:"ACT-441",owner:"Responsable maintenance",due:"12/04/2026"},{nc:"NC-2026-014-B",action:"ACT-442",owner:"HSE site",due:"18/04/2026"}],Qp=[{who:"M. Diallo",when:"28/03/2026 · 14:20",action:"Constat enregistré — déchets",comment:"Preuve registre demandée"},{who:"Coordinateur QHSE",when:"27/03/2026 · 09:05",action:"Ouverture fiche audit",comment:"—"}],vo=(()=>{const e=Number(Xe.score)||0;return[{norm:"ISO 9001",score:Math.min(100,Math.max(0,e+4))},{norm:"ISO 14001",score:Math.min(100,Math.max(0,e-5))},{norm:"ISO 45001",score:Math.min(100,Math.max(0,e+1))}]})(),Ea=[{point:"Contrôles opérationnels documentés",conforme:!0,proofRef:"PV d’audit signé"},{point:"Gestion des déchets dangereux (registres)",conforme:!1,proofRef:"Registre déchets (extrait)"},{point:"Habilitations et autorisations à jour",conforme:!0,proofRef:"Tableau habilitations Q1"},{point:"Plan urgence environnementale / exercices",conforme:!1,proofRef:"—"}],Mr=[{date:"15/02/2026",score:82},{date:"20/11/2025",score:79},{date:"05/08/2025",score:74}];function Jp(){const e=[...Mr].sort((r,n)=>{var s,c;const i=((s=Tr(r.date))==null?void 0:s.getTime())??0,o=((c=Tr(n.date))==null?void 0:c.getTime())??0;return i-o});if(!e.length)return null;const t=e[e.length-1],a=Math.round(Math.max(0,Math.min(100,Number(t.score)||0)));return Number.isFinite(a)?a:null}const Kp=[{id:"f1",point:"Contrôles opérationnels documentés"},{id:"f2",point:"Gestion des déchets dangereux (registres)"},{id:"f3",point:"Habilitations et autorisations à jour"},{id:"f4",point:"Plan urgence environnementale / exercices"}];async function hs(){const e=await Se("/api/audits?limit=500");if(!e.ok)return{ok:!1,row:null,status:e.status};const t=await e.json().catch(()=>null);return!Array.isArray(t)||t.length===0?{ok:!0,row:null}:{ok:!0,row:t[0]}}async function yo(){const{ok:e,row:t,status:a}=await hs();return{ok:e,ref:(t==null?void 0:t.ref)??null,status:a,row:t}}function Xp(e,t,a){const r=document.createElement("article");r.className="content-card card-soft",r.style.marginBottom="14px",r.innerHTML=`
    <div class="content-card-head">
      <div>
        <div class="section-kicker">Import documentaire</div>
        <h3>Brouillon audit — à valider</h3>
        <p class="content-card-lead" style="margin:0;max-width:56ch;font-size:13px">Données proposées depuis l’import ; rien n’est créé tant vous n’enregistrez pas.</p>
      </div>
    </div>
    <div class="form-grid" style="gap:12px">
      <label class="field"><span>Référence</span><input type="text" class="control-input audit-draft-ref" autocomplete="off" /></label>
      <label class="field"><span>Site</span><input type="text" class="control-input audit-draft-site" autocomplete="off" /></label>
      <label class="field"><span>Score (0–100)</span><input type="number" min="0" max="100" class="control-input audit-draft-score" /></label>
      <label class="field field-full"><span>Statut</span><input type="text" class="control-input audit-draft-status" placeholder="ex. terminé, en cours" autocomplete="off" /></label>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:12px;align-items:center">
      <button type="button" class="btn btn-primary audit-draft-save">Créer l’audit</button>
      <button type="button" class="text-button audit-draft-dismiss" style="font-weight:700">Ignorer le brouillon</button>
    </div>
  `;const n=r.querySelector(".audit-draft-ref"),i=r.querySelector(".audit-draft-site"),o=r.querySelector(".audit-draft-score"),s=r.querySelector(".audit-draft-status");n.value=e.ref!=null?String(e.ref):"",i.value=e.site!=null?String(e.site):"",o.value=e.score!=null&&e.score!==""?String(e.score):"",s.value=e.status!=null?String(e.status):"en cours";const c=r.querySelector(".audit-draft-save"),l=r.querySelector(".audit-draft-dismiss");return!t&&a&&(c.disabled=!0,c.title="Création réservée"),c.addEventListener("click",async()=>{const d=n.value.trim(),u=i.value.trim(),p=s.value.trim()||"en cours",g=parseInt(o.value,10);if(!d||!u||Number.isNaN(g)){C("Référence, site et score valides requis","error");return}c.disabled=!0;try{const m=await Se("/api/audits",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ref:d,site:u,score:g,status:p,checklist:Array.isArray(e.checklist)?e.checklist:void 0,...Ne.activeSiteId?{siteId:Ne.activeSiteId}:{}})}),b=await m.json().catch(()=>({}));if(!m.ok){C(typeof b.error=="string"?b.error:"Erreur création","error");return}C(`Audit ${d} enregistré.`,"info"),oi(),r.remove(),Be.add({module:"audits",action:"Audit créé depuis import documentaire",detail:d,user:"Utilisateur"})}catch(m){console.error(m),C("Erreur serveur","error")}finally{c.disabled=!t&&!!a}}),l.addEventListener("click",()=>{oi(),r.remove()}),r}function Zp(e){return e==="terminé"?"green":e==="en cours"?"amber":"blue"}function eu(e){const t=document.createElement("div");t.className="audit-constat-human audit-constat-human--compact";const a=!!(e!=null&&e.conforme),r=document.createElement("div");r.className="audit-checklist-compact-top",a||r.classList.add("audit-checklist-compact-top--nc");const n=document.createElement("span");n.className="audit-checklist-compact-point",n.textContent=(e==null?void 0:e.point)!=null?String(e.point):"—";const i=document.createElement("span");i.className=`badge ${a?"green":"red"} audit-checklist-compact-badge`,i.textContent=a?"Conforme":"NC";const o=document.createElement("span");o.className="audit-checklist-compact-proof",o.setAttribute("title","Preuve documentaire ciblée (lien indicatif — maquette)"),o.textContent=(e==null?void 0:e.proofRef)!=null&&String(e.proofRef).trim()!==""?String(e.proofRef):"—";const s=document.createElement("button");s.type="button",s.className="text-button audit-checklist-treat",s.textContent="Traiter",s.setAttribute("aria-expanded","false"),r.append(n,i,o,s);const c=document.createElement("div");c.className="audit-human-strip audit-human-strip--collapsible",c.hidden=!0;const l=document.createElement("p");l.className="audit-human-validation-legend",l.textContent="Décision humaine requise — états ci-dessous après action explicite uniquement.";const d=document.createElement("span");d.className="audit-human-status audit-human-status--pending";const u=document.createElement("div");u.className="audit-human-actions";let p="pending";const g={pending:"En attente",validated:"Validé",adjusted:"Modifié",rejected:"Rejeté"};function m(){d.textContent=g[p],d.className=`audit-human-status audit-human-status--${p}`}m();function b(y,v){const h=document.createElement("button");return h.type="button",h.className="btn btn-secondary",h.textContent=y,h.addEventListener("click",()=>{p=v,m(),C(`Suggestion / constat — ${g[v]} (maquette, validation humaine).`,"info"),Be.add({module:"audits",action:`Validation constat : ${g[v]}`,detail:String(e.point||"").slice(0,80),user:"Auditeur"})}),h}return u.append(b("Valider","validated"),b("Ajuster","adjusted"),b("Rejeter","rejected")),c.append(l,d,u),s.addEventListener("click",()=>{c.hidden=!c.hidden,s.setAttribute("aria-expanded",c.hidden?"false":"true")}),t.append(r,c),t}function tu(){const e=document.createElement("div");e.className="audit-plan-table-wrap";const t=document.createElement("div");t.className="audit-plan-table";const a=document.createElement("div");return a.className="audit-plan-head",a.innerHTML=`
    <span>Réf.</span>
    <span>Site</span>
    <span>Auditeur</span>
    <span>Date</span>
    <span>Statut</span>
  `,t.append(a),ui.forEach(r=>{const n=document.createElement("div");n.className="audit-plan-row";const i=Zp(r.statut);n.innerHTML=`
      <span class="audit-plan-ref" data-label="Réf.">${r.ref}</span>
      <span data-label="Site">${r.site}</span>
      <span data-label="Auditeur">${r.auditeur}</span>
      <span data-label="Date">${r.date}</span>
      <span data-label="Statut"><span class="badge ${i}">${r.statut}</span></span>
    `,t.append(n)}),e.append(t),e}function au(){us(),ms(),qt(),Dt();const e=Me(),t=lt(e==null?void 0:e.role,"audits","write"),a=lt(e==null?void 0:e.role,"reports","read"),r=lt(e==null?void 0:e.role,"reports","write"),n=Up(),i="red",o=Jp(),s=document.createElement("section");s.className="page-stack audit-products-page audit-plus-page audit-cockpit-page audit-premium-page";const c=Ur(),l=(c==null?void 0:c.targetPageId)==="audits"&&c.prefillData?Xp(c.prefillData,t,e):null,d=Op({points:Kp,auditRef:Xe.ref,siteId:Ne.activeSiteId||void 0});function u(){d.reset(),d.show(),d.element.scrollIntoView({behavior:"smooth",block:"nearest"}),C("Mode terrain activé — renseignez la checklist ci-dessous.","info"),Be.add({module:"audits",action:"Ouverture mode audit terrain",detail:"Checklist interactive — maquette",user:"Auditeur terrain"})}async function p(){try{const{ok:ie,ref:ce,status:ue}=await yo();if(!ie)throw new Error(`Audits ${ue}`);if(!ce){C("Aucun audit en base : impossible de générer le rapport PDF.","error");return}const Oe=await Se(`/api/audits/${encodeURIComponent(ce)}/report`);if(!Oe.ok){C("Export PDF indisponible","error");return}const Ue=await Oe.blob(),Te=URL.createObjectURL(Ue);window.open(Te,"_blank"),setTimeout(()=>URL.revokeObjectURL(Te),12e4),Be.add({module:"audits",action:"Demande de rapport audit",detail:`Synthèse ${ce} — export PDF`,user:"Responsable QHSE"})}catch(ie){console.error(ie),C("Erreur serveur","error")}}function g(){const ie="Point;Statut;Preuve_documentaire",ce=et=>String(et??"").replace(/\r?\n/g," ").replace(/;/g,","),ue=Ea.map(et=>{const rt=et.conforme?"Conforme":"Non_conforme";return`${ce(et.point)};${rt};${ce(et.proofRef)}`}),Oe=`\uFEFF${[ie,...ue].join(`\r
`)}`,Ue=new Blob([Oe],{type:"text/csv;charset=utf-8"}),Te=URL.createObjectURL(Ue),He=document.createElement("a");He.href=Te,He.download=`constats-${Xe.ref.replace(/[^\w-]+/g,"_")}.csv`,He.click(),URL.revokeObjectURL(Te),C("Export constats téléchargé (CSV, maquette locale).","info"),Be.add({module:"audits",action:"Export CSV constats audit",detail:Xe.ref,user:(e==null?void 0:e.name)||"Utilisateur"})}function m(){const ie="NC;Action_corrective;Responsable;Echeance",ce=et=>String(et??"").replace(/\r?\n/g," ").replace(/;/g,","),ue=ur.map(et=>[ce(et.nc),ce(et.action),ce(et.owner),ce(et.due)].join(";")),Oe=`\uFEFF${[ie,...ue].join(`\r
`)}`,Ue=new Blob([Oe],{type:"text/csv;charset=utf-8"}),Te=URL.createObjectURL(Ue),He=document.createElement("a");He.href=Te,He.download=`plan-actions-${Xe.ref.replace(/[^\w-]+/g,"_")}.csv`,He.click(),URL.revokeObjectURL(Te),C("Export plan d’actions téléchargé (CSV, maquette locale).","info"),Be.add({module:"audits",action:"Export CSV plan d’actions audit",detail:Xe.ref,user:(e==null?void 0:e.name)||"Utilisateur"})}const b=Ea.filter(ie=>ie.conforme).length,y=Ea.length-b,v=Ea.filter(ie=>ie.partial===!0).length,h=Xe.ncCount+ur.length+2,k=document.createElement("article");k.className="content-card card-soft audit-premium-header",k.innerHTML=`
    <div class="audit-iso-pilot-wrap">
      <div class="audit-iso-pilot-bar">
        <div class="audit-iso-pilot-bar__main">
          <div class="audit-iso-pilot-bar__title-block">
            <div class="section-kicker audit-premium-header__kicker">Audit documenté</div>
            <h3 class="audit-premium-header__title">${Xe.ref}</h3>
          </div>
          <dl class="audit-iso-pilot-bar__meta" aria-label="Fiche d’identification audit">
            <div class="audit-iso-pilot-bar__meta-item">
              <dt>Référentiel</dt>
              <dd>${Yp}</dd>
            </div>
            <div class="audit-iso-pilot-bar__meta-item">
              <dt>Site</dt>
              <dd>${Xe.site}</dd>
            </div>
            <div class="audit-iso-pilot-bar__meta-item">
              <dt>Auditeur</dt>
              <dd>${Xe.auditeur}</dd>
            </div>
            <div class="audit-iso-pilot-bar__meta-item">
              <dt>Date</dt>
              <dd>${Xe.date}</dd>
            </div>
            <div class="audit-iso-pilot-bar__meta-item">
              <dt>Statut</dt>
              <dd><span class="badge ${i} audit-premium-header__status">Non conforme</span></dd>
            </div>
          </dl>
          <div class="audit-premium-header__score" aria-label="Score global">
            <span class="audit-premium-header__score-val">${Xe.score}%</span>
            <span class="audit-premium-header__score-lbl">Score global</span>
          </div>
        </div>
        <div class="audit-iso-pilot-bar__footer">
          <nav class="audit-premium-header__nav" data-audit-tier-nav aria-label="Aller à une section"></nav>
          <div class="audit-premium-header__ctas" data-audit-hero-ctas></div>
        </div>
      </div>
      <div class="audit-premium-header__progress-wrap" aria-label="Avancement traitement des constats">
        <div class="audit-premium-header__progress-top">
          <span>Progression constats</span>
          <span>${Xe.progress}%</span>
        </div>
        <div class="audit-progress-bar audit-premium-header__progress-bar"><span style="width:${Xe.progress}%"></span></div>
      </div>
    </div>
  `;const _=k.querySelector("[data-audit-hero-ctas]"),f=document.createElement("button");f.type="button",f.className="btn btn-primary",f.textContent="Lancer un audit",f.addEventListener("click",u),!t&&e&&(f.style.display="none");const E=document.createElement("button");E.type="button",E.className="btn btn-secondary",E.textContent="Rapport PDF",E.addEventListener("click",()=>{p()}),!a&&e&&(E.style.display="none"),_==null||_.append(f,E);const w=Wp({canAuditWrite:t,su:e,model:n}),x=document.createElement("div");x.className="audit-iso-conformity-row",x.setAttribute("aria-label","Résumé de conformité — constats checklist"),x.innerHTML=`
    <div class="audit-iso-conformity-card audit-iso-conformity-card--ok">
      <span class="audit-iso-conformity-card__lbl">Conformes</span>
      <span class="audit-iso-conformity-card__val">${b}</span>
      <span class="audit-iso-conformity-card__hint">Points checklist</span>
    </div>
    <div class="audit-iso-conformity-card audit-iso-conformity-card--partial">
      <span class="audit-iso-conformity-card__lbl">Partiels</span>
      <span class="audit-iso-conformity-card__val">${v}</span>
      <span class="audit-iso-conformity-card__hint">Déclarés sur l’extrait</span>
    </div>
    <div class="audit-iso-conformity-card audit-iso-conformity-card--nc">
      <span class="audit-iso-conformity-card__lbl">Non-conformités</span>
      <span class="audit-iso-conformity-card__val">${y}</span>
      <span class="audit-iso-conformity-card__hint">Constats checklist</span>
    </div>
    <div class="audit-iso-conformity-card audit-iso-conformity-card--act">
      <span class="audit-iso-conformity-card__lbl">Actions générées</span>
      <span class="audit-iso-conformity-card__val">${h}</span>
      <span class="audit-iso-conformity-card__hint">Maquette pilotage</span>
    </div>
  `;const S=document.createElement("div");S.className="audit-strategic-kpis",S.setAttribute("aria-label","Indicateurs stratégiques"),S.innerHTML=`
    <div class="audit-strategic-kpi">
      <span class="audit-strategic-kpi__lbl">Audits en cours</span>
      <span class="audit-strategic-kpi__val">${Bp("en cours")}</span>
    </div>
    <div class="audit-strategic-kpi">
      <span class="audit-strategic-kpi__lbl">Planifiés</span>
      <span class="audit-strategic-kpi__val">${ui.length}</span>
      <span class="audit-strategic-kpi__hint">Registre planification</span>
    </div>
    <div class="audit-strategic-kpi">
      <span class="audit-strategic-kpi__lbl">NC ouvertes</span>
      <span class="audit-strategic-kpi__val">${bs}</span>
    </div>
    <div class="audit-strategic-kpi">
      <span class="audit-strategic-kpi__lbl">Actions en retard</span>
      <span class="audit-strategic-kpi__val">${Xr}</span>
    </div>
  `;const N=document.createElement("div");N.className="audit-iso-export-bar",N.setAttribute("aria-label","Exports audit ISO"),N.innerHTML=`
    <div class="audit-iso-export-bar__head">
      <span class="audit-iso-export-bar__title">Exports complémentaires</span>
      <span class="audit-iso-export-bar__sub">Constats et plan (CSV, local). Synthèse PDF : bandeau de pilotage.</span>
    </div>
    <div class="audit-iso-export-bar__actions" data-audit-iso-export-actions></div>
  `;const L=N.querySelector("[data-audit-iso-export-actions]"),D=document.createElement("button");D.type="button",D.className="btn btn-secondary",D.textContent="Exporter constats (CSV)",D.addEventListener("click",()=>{(async()=>await Yt("export_sensitive",{contextLabel:"export CSV des constats audit"})&&g())()});const q=document.createElement("button");q.type="button",q.className="btn btn-secondary",q.textContent="Exporter plan d’actions (CSV)",q.addEventListener("click",()=>{(async()=>await Yt("export_sensitive",{contextLabel:"export CSV du plan d’actions audit"})&&m())()}),L==null||L.append(D,q);const W=document.createElement("article");W.className="content-card card-soft audit-cockpit-chart-card audit-premium-chart-card",W.innerHTML=`
    <div class="content-card-head content-card-head--tight">
      <div>
        <div class="section-kicker">Lecture direction</div>
        <h3>Scores par norme</h3>
        <p class="audit-premium-chart-sub">Lecture synthétique — écart vs audit précédent sous le graphique.</p>
      </div>
    </div>
  `;const K=document.createElement("div");K.className="dashboard-chart-card-inner audit-cockpit-strategic-chart-body audit-premium-chart-body",K.append(Tc(vo));const A=document.createElement("div");if(A.className="audit-cockpit-delta-strip",A.setAttribute("role","status"),o==null)A.textContent="Évolution : pas d’audit précédent sur l’extrait affiché.";else{const ie=Math.round(Math.max(0,Math.min(100,Number(Xe.score)||0))),ce=ie-o,ue=ce>0?"+":"";A.innerHTML=`<strong>${ue}${ce} pts</strong> vs audit précédent (${o}% → ${ie}%).`}K.append(A),W.append(K);const I=document.createElement("section");I.className="audit-premium-chart-wrap",I.append(W);const z=document.createElement("article");z.className="content-card card-soft audit-cockpit-main audit-last-card audit-premium-cockpit";const R=fo.map((ie,ce)=>{let ue="audit-cockpit-step";return ce<pr?ue+=" audit-cockpit-step--done":ce===pr&&(ue+=" audit-cockpit-step--active"),`<div class="${ue}" role="listitem">${ie}</div>`}).join("");z.innerHTML=`
    <div class="content-card-head content-card-head--tight">
      <div>
        <div class="section-kicker">Pilotage</div>
        <h3>Synthèse opérationnelle</h3>
        <p class="content-card-lead audit-last-lead">${Xe.ref} · cycle de correction</p>
      </div>
    </div>
    <div class="audit-premium-cockpit__body">
      <div class="audit-cockpit-metrics audit-premium-cockpit__metrics">
        <div class="audit-cockpit-metric"><span>NC (audit)</span><span>${Xe.ncCount}</span></div>
        <div class="audit-cockpit-metric"><span>Référentiels</span><span class="audit-premium-cockpit__iso">9001 · 14001 · 45001</span></div>
      </div>
      <div class="audit-cockpit-cycle">
        <p class="audit-cockpit-cycle__label">Cycle contrôle &amp; correction</p>
        <div class="audit-cockpit-stepper" role="list">${R}</div>
        <p class="audit-cockpit-cycle-progress">Phase active : <strong>${fo[pr]}</strong></p>
      </div>
    </div>
    <div class="audit-cockpit-ctas" data-audit-cockpit-ctas></div>
  `;const V=z.querySelector("[data-audit-cockpit-ctas]"),oe=document.createElement("button");oe.type="button",oe.className="btn btn-secondary",oe.textContent="Voir la checklist",oe.addEventListener("click",()=>{var ie;(ie=document.querySelector(".audit-cockpit-checklist"))==null||ie.scrollIntoView({behavior:"smooth",block:"nearest"})}),V==null||V.append(oe);const B=[...vo].sort((ie,ce)=>ie.score-ce.score)[0],re=B&&String(B.norm).includes("14001")?"Insight : priorité environnement ISO 14001 — écart vs 9001/45001 (cockpit démo).":B?`Insight : focus ${B.norm} (${B.score} %).`:"",se=document.createElement("article");se.className="content-card card-soft audit-cockpit-ia audit-premium-assistant",se.innerHTML=`
    <div class="audit-premium-assistant__head">
      <div>
        <div class="section-kicker">IA</div>
        <h3 class="audit-premium-assistant__title">Assistant audit</h3>
        <p class="audit-premium-assistant__lead">Suggestions — validation humaine, sans écriture automatique.</p>
      </div>
    </div>
    <p class="audit-premium-assistant__insight" role="status"></p>
    <div class="audit-premium-assistant__primary" data-audit-ia-primary></div>
    <details class="audit-premium-assistant__more">
      <summary>Autres aides (démo)</summary>
      <div class="audit-cockpit-ia__grid audit-premium-assistant__grid" data-audit-ia-secondary></div>
    </details>
  `;const F=se.querySelector(".audit-premium-assistant__insight");if(F){const ie=String(re||"").trim();ie?F.textContent=ie:(F.classList.add("audit-premium-assistant__insight--empty"),F.textContent="")}const H=se.querySelector("[data-audit-ia-primary]"),G=se.querySelector("[data-audit-ia-secondary]"),X=[{label:"Résumer les constats",key:"resume"},{label:"Proposer plan d’actions",key:"plan"},{label:"Identifier preuves manquantes",key:"proof_gap"}],$=[{label:"Préparer l’audit",key:"prep"},{label:"Détecter les écarts critiques",key:"gap"},{label:"Générer synthèse de clôture",key:"close"},{label:"Suggérer quand notifier les équipes",key:"suggest_notify"}];function T(ie,ce,ue){ie.addEventListener("click",()=>{var Oe,Ue;if(ue==="suggest_notify"){C(n.suggestNotifyHint,"info"),(Oe=document.querySelector(".audit-cockpit-notifs"))==null||Oe.scrollIntoView({behavior:"smooth",block:"nearest"}),Be.add({module:"audits",action:"Suggestion IA — fenêtre de notification",detail:"Quand notifier les participants (maquette)",user:"Utilisateur"});return}if(ue==="proof_gap"){C("Analyse locale : consulter « Documents & preuves » — colonnes manquants / à vérifier (aucun classement automatique engageant).","info"),(Ue=document.querySelector(".audit-cockpit-proofs"))==null||Ue.scrollIntoView({behavior:"smooth",block:"nearest"}),Be.add({module:"audits",action:"Assistant audit — preuves à compléter",detail:"Scroll zone preuves (maquette)",user:"Utilisateur"});return}C(`Suggestion IA « ${ce} » — maquette front, branchez votre moteur ou API.`,"info"),Be.add({module:"audits",action:"Action IA audit (maquette)",detail:ue,user:"Utilisateur"})})}H&&X.forEach(({label:ie,key:ce})=>{const ue=document.createElement("button");ue.type="button",ue.className="btn btn-secondary audit-premium-assistant__btn-main",ue.textContent=ie,T(ue,ie,ce),H.append(ue)}),G&&$.forEach(({label:ie,key:ce})=>{const ue=document.createElement("button");ue.type="button",ue.className="audit-cockpit-ia__btn",ue.textContent=ie,T(ue,ie,ce),G.append(ue)});const j=document.createElement("article");j.className="content-card card-soft audit-cockpit-prio audit-premium-nc";const Y=document.createElement("ul");Y.className="audit-premium-nc__list",Vp.forEach(ie=>{const ce=document.createElement("li"),ue=document.createElement("strong");ue.textContent=ie.label;const Oe=document.createElement("span");Oe.className="audit-cockpit-prio__detail",Oe.textContent=ie.detail,ce.append(ue,Oe),Y.append(ce)}),j.innerHTML=`
    <div class="content-card-head content-card-head--tight">
      <div>
        <div class="section-kicker">Non-conformités</div>
        <h3>Points critiques &amp; priorités</h3>
        <p class="audit-cockpit-prio__lead">Vue priorisée — plan d’actions module Actions.</p>
      </div>
    </div>
  `,j.append(Y);const ne=document.createElement("div");ne.className="audit-premium-nc__foot";const ae=document.createElement("button");ae.type="button",ae.className="btn btn-primary",ae.textContent="Ouvrir le plan d’actions",ae.addEventListener("click",()=>{window.location.hash="actions"}),ne.append(ae),j.append(ne);const de=document.createElement("article");de.className="content-card card-soft audit-plan-card audit-plan-card--cockpit",de.innerHTML=`
    <div class="content-card-head content-card-head--tight">
      <div>
        <div class="section-kicker">Planification</div>
        <h3>Audits planifiés</h3>
      </div>
    </div>
  `,de.append(tu());const he=document.createElement("div");he.className="audit-plan-actions";const fe=document.createElement("button");fe.type="button",fe.className="btn btn-primary",fe.textContent="Planifier un audit",fe.addEventListener("click",()=>{C("Planification : ouvrir le module calendrier / workflow (démo).","info"),Be.add({module:"audits",action:"Demande de planification audit",detail:"Depuis Audit+ — maquette front",user:"Coordinateur QHSE"})}),!t&&e&&(fe.style.display="none"),he.append(fe),de.append(he);const _e=document.createElement("article");_e.className="content-card card-soft audit-iso-treatment-card audit-cockpit-treatment",_e.id="audit-iso-tier-treatment",_e.innerHTML=`
    <div class="content-card-head content-card-head--tight">
      <div>
        <div class="section-kicker">Traitement</div>
        <h3>Non-conformités ouvertes &amp; actions correctives</h3>
        <p class="content-card-lead audit-iso-treatment-card__lead">NC, actions, responsables, échéances.</p>
      </div>
    </div>
  `;const Ee=document.createElement("div");Ee.className="audit-iso-treatment-table",Ee.setAttribute("role","table"),Ee.setAttribute("aria-label","Liaison NC et actions correctives");const ve=document.createElement("div");ve.className="audit-iso-treatment-head",ve.setAttribute("role","row"),ve.innerHTML=`
    <span role="columnheader">NC</span>
    <span role="columnheader">Action</span>
    <span role="columnheader">Responsable</span>
    <span role="columnheader">Échéance</span>
  `,Ee.append(ve),ur.forEach(ie=>{const ce=document.createElement("div");ce.className="audit-iso-treatment-row",ce.setAttribute("role","row"),ce.innerHTML=`
      <span role="cell" data-label="NC">${ie.nc}</span>
      <span role="cell" data-label="Action">${ie.action}</span>
      <span role="cell" data-label="Responsable">${ie.owner}</span>
      <span role="cell" data-label="Échéance">${ie.due}</span>
    `,Ee.append(ce)}),_e.append(Ee);const Ae=document.createElement("section"),ze=document.createElement("article");ze.className="content-card card-soft audit-cockpit-checklist audit-premium-checklist",ze.innerHTML=`
    <div class="content-card-head content-card-head--tight">
      <div>
        <div class="section-kicker">Constats / checklist</div>
        <h3>Exigences — ${Xe.ref}</h3>
        <p class="content-card-lead audit-premium-checklist__legend">Point, statut, preuve, validation.</p>
      </div>
    </div>
  `;const Pe=document.createElement("div");Pe.className="stack audit-premium-checklist-stack",Ea.forEach(ie=>Pe.append(eu(ie))),ze.append(Pe);const We=document.createElement("div");We.className="audit-right-stack";const O=document.createElement("article");O.className="content-card card-soft audit-cockpit-history audit-premium-history",O.innerHTML=`
    <div class="content-card-head content-card-head--tight">
      <div>
        <div class="section-kicker">Historique</div>
        <h3>Scores précédents</h3>
      </div>
    </div>
  `;const M=document.createElement("div");M.className="audit-history-stack",Mr.forEach(ie=>{const ce=document.createElement("article");ce.className="list-row audit-history-row",ce.innerHTML=`
      <div>
        <strong>${ie.date}</strong>
        <p style="margin:4px 0 0;font-size:13px;color:var(--text2)">Score ${ie.score}%</p>
      </div>
      <span class="badge blue">Interne</span>
    `,M.append(ce)}),O.append(M);const U=document.createElement("p");U.className="audit-cockpit-history__trend";const J=Mr.map(ie=>ie==null?void 0:ie.score).filter(ie=>typeof ie=="number"&&Number.isFinite(ie)),te=J.length?Math.min(...J):null,Z=J.length?Math.max(...J):null,le=te!=null&&Z!=null&&J.length>=2?Z-te:null;U.textContent=le!=null?`Écart de scores sur l’extrait (mock) : ${le} pts (min ${te}% · max ${Z}%) — indépendant de l’ordre d’affichage.`:"Tendance : au moins deux scores valides requis sur cet extrait.",O.append(U),We.append(O),Ae.className="two-column audit-cockpit-layout",Ae.append(ze,We);const be=document.createElement("article");be.className="content-card card-soft audit-iso-trace-card audit-cockpit-trace",be.id="audit-iso-tier-trace",be.innerHTML=`
    <div class="content-card-head content-card-head--tight">
      <div>
        <div class="section-kicker">Traçabilité</div>
        <h3>Piste d’audit — qui, quand, quoi</h3>
        <p class="content-card-lead audit-iso-trace-card__lead">Journal local des événements affichés.</p>
      </div>
    </div>
  `;const ye=document.createElement("ul");ye.className="audit-iso-trace-list",Qp.forEach(ie=>{const ce=document.createElement("li");ce.className="audit-iso-trace-item",ce.innerHTML=`
      <div class="audit-iso-trace-item__who">${ie.who}</div>
      <div class="audit-iso-trace-item__when">${ie.when}</div>
      <div class="audit-iso-trace-item__action">${ie.action}</div>
      <div class="audit-iso-trace-item__comment">${ie.comment}</div>
    `,ye.append(ce)}),be.append(ye);const Ie=document.createElement("article");Ie.className="content-card card-soft audit-cockpit-proofs audit-premium-proofs",Ie.innerHTML=`
    <div class="content-card-head content-card-head--tight">
      <div>
        <div class="section-kicker">Documents &amp; preuves</div>
        <h3>Dossier probatoire — ${Xe.ref}</h3>
        <p class="content-card-lead audit-premium-proofs__iso-lead">Présents · à vérifier · manquants.</p>
      </div>
    </div>
  `;const $e=document.createElement("div");$e.className="audit-premium-proofs-groups";const me={present:[],verify:[],missing:[]};Fp.forEach(ie=>{ie.status==="present"?me.present.push(ie):ie.status==="missing"?me.missing.push(ie):me.verify.push(ie)});function De(ie,ce,ue){const Oe=document.createElement("div");Oe.className=`audit-premium-proofs-col audit-premium-proofs-col--${ce}`;const Ue=document.createElement("h4");Ue.className="audit-premium-proofs-col__title",Ue.textContent=ie;const Te=document.createElement("ul");if(Te.className="audit-premium-proofs-col__list",ue.length)ue.forEach(He=>{const et=document.createElement("li");et.textContent=He.name,Te.append(et)});else{const He=document.createElement("li");He.className="audit-premium-proofs-col__empty",He.textContent="Aucune",Te.append(He)}return Oe.append(Ue,Te),Oe}$e.append(De("Présents","present",me.present),De("À vérifier","verify",me.verify),De("Manquants","missing",me.missing)),Ie.append($e);const xe=document.createElement("div");xe.className="audit-main-actions audit-cockpit-footer-actions audit-premium-footer-actions";const qe=document.createElement("div");qe.className="audit-send-report-row",qe.style.cssText="display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:0;width:100%";const je=document.createElement("input");je.type="text",je.className="control-input audit-send-report-email",je.setAttribute("aria-label","Destinataires du rapport PDF par e-mail"),je.placeholder="E-mail(s), séparés par une virgule",je.autocomplete="off",je.style.cssText="flex:1;min-width:min(100%,260px);min-height:44px";const at=document.createElement("button");at.type="button",at.className="text-button",at.textContent="Envoyer le PDF par e-mail",at.style.fontWeight="800",qe.append(je,at),pi().then(ie=>{if(!Array.isArray(ie)||!ie.length)return;const ce=document.createElement("datalist");ce.id=`qhse-audit-report-emails-${Math.random().toString(36).slice(2,9)}`,ie.forEach(ue=>{if(!(ue!=null&&ue.email))return;const Oe=document.createElement("option");Oe.value=ue.email,ue.name&&(Oe.label=ue.name),ce.append(Oe)}),je.setAttribute("list",ce.id),qe.append(ce)}).catch(()=>{}),at.addEventListener("click",async()=>{const ie=(je.value||"").trim();if(!ie){C("Indiquez au moins une adresse e-mail.","error");return}at.disabled=!0;try{const{ok:ce,ref:ue,status:Oe}=await yo();if(!ce)throw new Error(`Audits ${Oe}`);if(!ue){C("Aucun audit en base : impossible d’envoyer le rapport.","error");return}const Ue=await Se(`/api/audits/${encodeURIComponent(ue)}/send-report`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to:ie})}),Te=await Ue.json().catch(()=>({}));if(!Ue.ok){const He=typeof Te.error=="string"?Te.error:`Envoi impossible (erreur ${Ue.status})`;C(He,"error");return}if(Te.ok!==!0){C(typeof Te.error=="string"?Te.error:"Réponse serveur inattendue.","error");return}C(Te.message||"Rapport PDF envoyé par e-mail.","info"),Be.add({module:"audits",action:"Envoi rapport PDF par e-mail",detail:`${ue} → ${Array.isArray(Te.sentTo)?Te.sentTo.join(", "):ie}`,user:"Responsable QHSE"})}catch(ce){console.error(ce),C("Erreur serveur","error")}finally{at.disabled=!1}}),!r&&e&&(qe.style.display="none");const dt=document.createElement("p");dt.className="content-card-lead audit-auto-report-note",dt.style.cssText="margin:8px 0 0;font-size:12px;color:var(--text3);max-width:60ch;line-height:1.45",dt.hidden=!0,xe.append(qe,dt),hs().then(({ok:ie,row:ce})=>{if(!ie||!(ce!=null&&ce.autoReportSentAt))return;const ue=new Date(ce.autoReportSentAt);Number.isNaN(ue.getTime())||(dt.textContent=`Audit ${ce.ref} : rapport PDF envoyé automatiquement le ${ue.toLocaleString("fr-FR",{dateStyle:"short",timeStyle:"short"})} (clôture).`,dt.hidden=!1)});const Et=document.createElement("section");Et.className="audit-cockpit-tier audit-cockpit-tier--score audit-premium-tier",Et.id="audit-cockpit-tier-score",Et.append(k,S,I);const Lt=document.createElement("section");Lt.className="audit-cockpit-tier audit-cockpit-tier--critical",Lt.id="audit-cockpit-tier-critical",Lt.append(j);const Nt=document.createElement("section");Nt.className="audit-cockpit-tier audit-cockpit-tier--progress",Nt.id="audit-cockpit-tier-progress",Nt.append(z,de,_e,Ae,be);const St=document.createElement("section");St.className="audit-cockpit-tier audit-cockpit-tier--actions",St.id="audit-cockpit-tier-actions",St.append(w,se,Ie,d.element,xe);const bt=k.querySelector("[data-audit-tier-nav]");return bt&&[["Vue ISO",Et],["Critiques",Lt],["Avancement",Nt],["Actions",St]].forEach(([ie,ce])=>{const ue=document.createElement("button");ue.type="button",ue.className="audit-cockpit-hero__nav-btn",ue.textContent=ie,ue.addEventListener("click",()=>{ce.scrollIntoView({behavior:"smooth",block:"start"})}),bt.append(ue)}),s.append(ba({title:"Audit — ce qui compte tout de suite",hint:"Le bandeau du haut résume le dernier audit ; la zone « Critiques » liste ce qui bloque la conformité.",nextStep:"Ensuite : traiter les constats ouverts, puis le suivi d’avancement — le détail technique reste en mode Expert."}),...l?[l]:[],Et,Lt,Nt,St),s}const iu=[{id:"seed-0",name:"Acide sulfurique",cas:"7664-93-9",site:"Site principal",danger:"élevé",revision:"02/2026",signalWord:"Danger",hazards:"H314 Peau corrosion / yeux. H290 Peut être corrosif pour les métaux.",fdsFileName:"",fdsValidUntil:"2024-06-01",fdsPictograms:["GHS05 Corrosif","GHS07 Exclamation"],fdsEpi:["Gants chimiques","Lunettes étanches","Tablier"],fdsStorage:"Récipient fermé, zone ventilée, séparé des bases et métaux réactifs.",fdsRescue:"Retirer les victimes à l’air frais. Rincer abondamment à l’eau (15 min). Consulter un médecin.",fdsMeasures:"Poste de rinçage oculaire à proximité. Pas d’évacuation à l’égout.",risksLinked:["Corrosion","Projection","Réaction avec eau"],incidentsHint:"Aucun incident lié sur la période démo — consulter le module Incidents.",fdsHumanValidated:!0,iaSuggestedActions:[],iaInconsistencies:[]},{id:"seed-1",name:"Gasoil industriel",cas:"68334-30-5",site:"Zone carburants",danger:"élevé",revision:"01/2026",signalWord:"Danger",hazards:"H226 Liquide et vapeurs inflammables. H304 Peut être mortel en cas de pénétration.",fdsFileName:"gasoil-fds-demo.pdf",fdsValidUntil:"2027-03-15",fdsPictograms:["GHS02 Flamme","GHS08 Santé"],fdsEpi:["Gants","Vêtements antistatiques"],fdsStorage:"Cuves conformes ATEX, mise à la terre, écart sources d’ignition.",fdsRescue:"Ne pas faire vomir en cas d’ingestion. Appeler les secours.",fdsMeasures:"Détecteurs gaz, permis feu, ventilation.",risksLinked:["Inflammabilité","Atmosphères explosives"],incidentsHint:"Aucun incident lié en démo.",fdsHumanValidated:!0,iaSuggestedActions:[],iaInconsistencies:[]},{id:"seed-2",name:"Soude caustique",cas:"1310-73-2",site:"Atelier chimie",danger:"moyen",revision:"11/2025",signalWord:"Danger",hazards:"H314 Corrosif pour la peau et les yeux.",fdsFileName:"",fdsPictograms:["GHS05"],fdsEpi:["Gants","Lunettes"],fdsStorage:"À l’abri de l’humidité.",fdsRescue:"Rinçage eau prolongé, appel centre antipoison.",fdsMeasures:"",risksLinked:["Corrosion cutanée"],incidentsHint:"Aucun incident lié en démo.",fdsHumanValidated:!1,iaSuggestedActions:["Compléter la FDS signée","Former les nouveaux opérateurs"],iaInconsistencies:["Fichier FDS non joint au registre"]},{id:"seed-3",name:"Antigel technique",cas:"107-21-1",site:"Magasin général",danger:"faible",revision:"09/2025",signalWord:"Attention",hazards:"H302 Nocif en cas d’ingestion.",fdsFileName:"",fdsPictograms:["GHS07"],fdsEpi:["Gants si contact prolongé"],fdsStorage:"Température ambiante.",fdsRescue:"Appeler un médecin en cas d’ingestion.",fdsMeasures:"Lavage des mains après usage.",risksLinked:["Toxicité aiguë faible"],incidentsHint:"Aucun incident lié en démo.",fdsHumanValidated:!0,iaSuggestedActions:[],iaInconsistencies:[]}],xs="qhseProductsPersistedV1",mr=new Map;let Qa=[],Ja=[];function ma(e){const t=String(e).toLowerCase();return t.includes("élev")||t.includes("elev")?{cls:"red",label:"Élevé"}:t.includes("moyen")?{cls:"amber",label:"Moyen"}:{cls:"green",label:"Faible"}}function ru(e,t){return t?`${e.name} ${e.cas} ${e.site}`.toLowerCase().includes(t):!0}function si(e){return String(e||"").split(`
`).map(t=>t.trim()).filter(Boolean)}function fs(e){if(!e||typeof e!="object")return e;const t={...e};return Array.isArray(t.fdsPictograms)||(t.fdsPictograms=typeof t.fdsPictograms=="string"?si(t.fdsPictograms):[]),Array.isArray(t.fdsEpi)||(t.fdsEpi=typeof t.fdsEpi=="string"?si(t.fdsEpi):[]),typeof t.fdsStorage!="string"&&(t.fdsStorage=""),typeof t.fdsRescue!="string"&&(t.fdsRescue=""),typeof t.fdsMeasures!="string"&&(t.fdsMeasures=""),typeof t.fdsValidUntil!="string"&&(t.fdsValidUntil=""),typeof t.fdsHumanValidated!="boolean"&&(t.fdsHumanValidated=!1),Array.isArray(t.iaSuggestedActions)||(t.iaSuggestedActions=[]),Array.isArray(t.iaInconsistencies)||(t.iaInconsistencies=[]),t}function Zr(){try{const e=localStorage.getItem(xs);if(!e)return[];const t=JSON.parse(e);return Array.isArray(t)?t.map(a=>fs(a)):[]}catch{return[]}}function vs(e){try{localStorage.setItem(xs,JSON.stringify(e))}catch(t){console.warn("[products] persist",t),C("Stockage local plein ou indisponible","error")}}function Pr(){return[...iu.map(e=>fs(e)),...Zr()]}function nu(){var e;return String(((e=Me())==null?void 0:e.role)??"").trim().toUpperCase()==="TERRAIN"}function ou(e){if(!e||typeof e!="string")return null;const t=new Date(e);return Number.isNaN(t.getTime())?null:t.getTime()}function ci(e){const t=ou(e.fdsValidUntil);if(t==null)return!1;const a=new Date(t);return a.setHours(23,59,59,999),a.getTime()<Date.now()}function en(e){return!e.fdsFileName||String(e.fdsFileName).trim()===""}function tn(e){return ma(e.danger).cls==="red"}function ys(e){return tn(e)&&(en(e)||!e.fdsHumanValidated)}function su(e){return e.filter(t=>tn(t)).length}function cu(e){let t=0,a=0,r=0;return e.forEach(n=>{const i=ma(n.danger).cls;i==="red"?t+=1:i==="amber"?a+=1:r+=1}),{el:t,mo:a,fa:r,total:e.length}}function lu(e){const t=[];return e.forEach(a=>{en(a)&&t.push({type:"missing",product:a,text:`FDS manquante — ${a.name}`}),ci(a)&&t.push({type:"expired",product:a,text:`FDS expirée — ${a.name}`}),ys(a)&&t.push({type:"uncontrolled",product:a,text:`Produit dangereux non maîtrisé — ${a.name}`})}),t}function ks(e){return new Promise(t=>{const a=String((e==null?void 0:e.name)||"document.pdf"),r=a.toLowerCase(),n=/\.(png|jpe?g|webp|gif)$/i.test(r)||/^image\//.test(String((e==null?void 0:e.type)||"")),o=a.replace(/\.(pdf|png|jpe?g|webp|gif)$/i,"").replace(/[_-]+/g," ").trim()||"Produit (FDS importée)",s=[...a].reduce((c,l)=>c+l.charCodeAt(0),0);setTimeout(()=>{const c=s%3===0?["GHS05 Corrosif","GHS07 Exclamation"]:s%3===1?["GHS02 Flamme","GHS08 Santé"]:["GHS09 Environnement","GHS07 Exclamation"],l=s%2===0?["Gants de protection chimique","Lunettes étanches","Combinaison si projection"]:["Gants nitrile","Lunettes","Masque FFP2 si poussières"],d="Conserver dans un récipient fermé, zone ventilée, à l’écart des sources d’ignition et des incompatibles (démo IA).",u="En cas de contact : rincer abondamment à l’eau 15 min. En cas d’ingestion : ne pas faire vomir, appeler les secours (démo IA).",p="Ventilation locale, postes de rinçage, formation manipulation, interdiction repas sur poste (démo IA).",g=["Vérifier la cohérence N° CAS avec la FDS officielle fournisseur.","Mettre à jour le registre des risques si nouvelle substance.","Prévoir une fiche de poste EPI pour les opérateurs."],m=[];n&&m.push("Import image : l’extraction automatique est moins fiable — contrôle humain renforcé requis."),/brouillon|draft|copie/i.test(a)&&m.push("Le nom de fichier suggère un brouillon — confirmer la version maîtrisée."),s%5===0&&m.push("Écart possible entre mot-signal détecté et pictogrammes — recouper section 2 CLP.");const b=new Date;b.setMonth(b.getMonth()+18);const y=b.toISOString().slice(0,10);t({name:o.slice(0,120),cas:"— à vérifier sur la FDS",site:"Site principal",danger:"moyen",revision:new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric"}),signalWord:"Attention",hazards:"Extraction démo (fichier non lu) : reprendre intégralement les phrases H et P depuis le document officiel signé.",fdsValidUntil:y,pictograms:c,epi:l,storage:d,rescue:u,measures:p,iaSuggestedActions:g,iaInconsistencies:m})},950)})}function du(){return`prd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`}function Re(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function pu(e,t={}){const{onDetail:a,onFds:r}=t,n=document.createElement("article");n.className="list-row products-row products-row-card";const i=ma(e.danger),o=[];en(e)&&o.push({cls:"products-alert-pill--miss",t:"FDS manquante"}),ci(e)&&o.push({cls:"products-alert-pill--exp",t:"FDS expirée"}),ys(e)&&o.push({cls:"products-alert-pill--nc",t:"Non maîtrisé"});const s=document.createElement("div");s.className="products-row-main";const c=e.fdsFileName&&String(e.fdsFileName).trim()?`<p class="products-row-doc">Pièce jointe : ${Re(e.fdsFileName)}</p>`:'<p class="products-row-doc products-row-doc--warn">Pas de fichier — fiche = données saisies</p>',l=e.fdsValidUntil&&String(e.fdsValidUntil).trim()?`<p class="products-row-validity ${ci(e)?"products-row-validity--late":""}">Validité FDS : ${Re(e.fdsValidUntil)}</p>`:"",d=o.length>0?`<div class="products-row-pills">${o.map(y=>`<span class="products-alert-pill ${y.cls}">${Re(y.t)}</span>`).join("")}</div>`:"";s.innerHTML=`
    <strong class="products-row-title">${Re(e.name)}</strong>
    <p class="products-row-sub">CAS ${Re(e.cas)} · ${Re(e.site)}</p>
    <p class="products-row-rev">FDS révisée ${Re(e.revision)}</p>
    ${l}
    ${c}
    ${d}
  `;const u=document.createElement("div");u.className="products-row-actions";const p=document.createElement("span");p.className=`badge ${i.cls} products-danger-badge`,p.textContent=`Danger ${i.label}`;const g=!!(e.fdsFileName&&String(e.fdsFileName).trim()),m=document.createElement("button");m.type="button",m.className="btn",m.textContent=g?"Ouvrir fichier":"Sans fichier",m.disabled=!g,m.title=g?"PDF ou image d’origine — la fiche exploitable pour le terrain est constituée des champs structurés (détail).":"Aucune pièce jointe : la substance reste gérée via les champs de la fiche.",m.addEventListener("click",()=>{typeof r=="function"?r(e):C(`Fichier source — ${e.name} (démo).`,"info")});const b=document.createElement("button");return b.type="button",b.className="btn btn-primary",b.textContent="Détails",b.addEventListener("click",()=>{typeof a=="function"?a(e):C(`Fiche produit ${e.name} (démo).`,"info")}),u.append(p,m,b),n.append(s,u),n}function Ka(e){return!e||!e.length?"<li>—</li>":e.map(t=>`<li>${Re(t)}</li>`).join("")}function za(e,t){var d,u,p,g,m;t.replaceChildren(),t.hidden=!1;const a=document.createElement("article");a.className="content-card card-soft products-detail-card";const r=e.fdsFileName?String(e.fdsFileName):"Aucun fichier lié — ajoutez la FDS signée.",n=e.fdsValidUntil?String(e.fdsValidUntil):"—",i=ci(e)?" products-detail-valid--expired":"",o=ma(e.danger),s=!!(e.fdsFileName&&String(e.fdsFileName).trim());a.innerHTML=`
    <div class="content-card-head content-card-head--split">
      <div>
        <div class="section-kicker">Fiche produit / substance</div>
        <h3 class="products-detail-title">${Re(e.name)}</h3>
        <p class="products-detail-meta">CAS ${Re(e.cas)} · ${Re(e.site)} · Révision ${Re(e.revision)}</p>
        <p class="products-detail-valid${i}">Validité FDS (indicative) : ${Re(n)}</p>
      </div>
      <div class="products-detail-head-actions">
        <button type="button" class="btn btn-secondary products-detail-copy">Copier synthèse</button>
        <button type="button" class="text-button products-detail-close" style="font-weight:700">Fermer</button>
      </div>
    </div>
    <div class="products-detail-summary" role="region" aria-label="Synthèse">
      <div class="products-detail-summary-item">
        <span class="products-detail-summary-lbl">Criticité</span>
        <span class="products-detail-summary-val products-detail-summary-val--${Re(o.cls)}">${Re(o.label)}</span>
      </div>
      <div class="products-detail-summary-item">
        <span class="products-detail-summary-lbl">Validité</span>
        <span class="products-detail-summary-val${i}">${Re(n)}</span>
      </div>
      <div class="products-detail-summary-item">
        <span class="products-detail-summary-lbl">Pièce jointe</span>
        <span class="products-detail-summary-val">${s?"Oui":"Non"}</span>
      </div>
    </div>
    <p class="products-detail-exploit-note" role="note">
      <strong>Fiche exploitable :</strong> dangers, EPI, stockage et secours ci-dessous servent au terrain et au pilotage. Le fichier PDF/image n’est qu’une référence (non archivée serveur en démo).
    </p>
    <div class="products-detail-body">
      <section class="products-detail-block products-detail-block--general">
        <h4>Infos générales</h4>
        <p class="products-detail-text"><strong>Référence document :</strong> ${Re(r)}</p>
        <p class="products-detail-text"><strong>Validation humaine (registre) :</strong> ${e.fdsHumanValidated?"Oui":"Non — à compléter"}</p>
      </section>
      <section class="products-detail-block">
        <h4>Dangers &amp; CLP</h4>
        <p class="products-detail-text"><strong>Mot-signal :</strong> ${Re(e.signalWord||"—")}</p>
        <p class="products-detail-text">${Re(e.hazards||"—")}</p>
        <div class="products-picto-chips">${(e.fdsPictograms||[]).length?(e.fdsPictograms||[]).map(b=>`<span class="products-picto-chip">${Re(b)}</span>`).join(""):'<span class="products-detail-muted">—</span>'}</div>
      </section>
      <section class="products-detail-block">
        <h4>EPI recommandés</h4>
        <ul class="products-detail-list">${Ka(e.fdsEpi)}</ul>
      </section>
      <section class="products-detail-block">
        <h4>Mesures &amp; stockage</h4>
        <p class="products-detail-text"><strong>Stockage :</strong> ${Re(e.fdsStorage||"—")}</p>
        <p class="products-detail-text"><strong>Prévention :</strong> ${Re(e.fdsMeasures||"—")}</p>
      </section>
      <section class="products-detail-block products-detail-block--urgent">
        <h4>Urgence &amp; secours</h4>
        <p class="products-detail-text products-detail-urgency">${Re(e.fdsRescue||"—")}</p>
      </section>
      <section class="products-detail-block products-detail-block--ia">
        <h4>Analyse IA (indicative)</h4>
        <p class="products-detail-note">Pistes générées (démo) — à recouper avec la FDS ; aucune décision automatique.</p>
        <p class="products-detail-subh">Incohérences signalées</p>
        <ul class="products-detail-list">${Ka(e.iaInconsistencies)}</ul>
        <p class="products-detail-subh">Actions suggérées</p>
        <ul class="products-detail-list">${Ka(e.iaSuggestedActions)}</ul>
      </section>
      <section class="products-detail-block products-detail-block--modules">
        <h4>Risques, incidents &amp; actions</h4>
        <p class="products-detail-text products-detail-module-hint">Même sans lien automatique, utilisez le <strong>CAS ${Re(e.cas)}</strong> ou le <strong>nom produit</strong> dans la recherche de chaque module.</p>
        <p class="products-detail-text"><strong>Risques (registre local) :</strong></p>
        <ul class="products-detail-list">${Ka(e.risksLinked)}</ul>
        <p class="products-detail-text"><strong>Incidents :</strong> ${Re(e.incidentsHint||"Voir le registre incidents.")}</p>
        <div class="products-detail-module-btns">
          <button type="button" class="btn btn-secondary products-goto-risks">Risques</button>
          <button type="button" class="btn btn-secondary products-goto-incidents">Incidents</button>
          <button type="button" class="btn btn-secondary products-goto-actions">Actions</button>
        </div>
      </section>
    </div>
  `,(d=a.querySelector(".products-detail-close"))==null||d.addEventListener("click",()=>{t.replaceChildren(),t.hidden=!0}),(u=a.querySelector(".products-detail-copy"))==null||u.addEventListener("click",()=>{const b=ma(e.danger).label,y=e.fdsEpi&&e.fdsEpi[0]||"—",v=(e.fdsRescue||"").slice(0,400),h=[`Produit : ${e.name}`,`CAS : ${e.cas}`,`Site : ${e.site}`,`Danger : ${b}`,`Mot-signal : ${e.signalWord||"—"}`,`EPI (extrait) : ${y}`,`Urgence / secours : ${v||"—"}`].join(`
`);navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(h).then(()=>C("Synthèse copiée dans le presse-papiers.","info"),()=>C("Copie impossible — sélectionnez le texte manuellement.","warning")):C("Copie non disponible dans ce navigateur.","warning")});const c=a.querySelector(".products-detail-block--ia"),l=String(e.id||"");if(c&&l.startsWith("prd-")){const b=document.createElement("button");b.type="button",b.className="btn btn-secondary products-detail-ia-refresh",b.textContent="Régénérer analyse IA (démo)",b.title="Simule une nouvelle passe IA locale — met à jour les listes sur la fiche enregistrée.",c.append(b),b.addEventListener("click",async()=>{b.disabled=!0,b.textContent="Analyse…";try{const y=new File([""],String(e.fdsFileName||"fds.pdf"),{type:"application/pdf"}),v=await ks(y),h=Array.isArray(v.iaInconsistencies)?v.iaInconsistencies:[],k=Array.isArray(v.iaSuggestedActions)?v.iaSuggestedActions:[],_=Zr(),f=_.findIndex(w=>w.id===e.id);if(f===-1){C("Fiche introuvable en stockage local.","error");return}_[f].iaInconsistencies=[...h],_[f].iaSuggestedActions=[...k],vs(_);const E={..._[f]};za(E,t),C("Analyse IA régénérée — validation humaine toujours requise pour toute décision.","info")}finally{b.disabled=!1,b.textContent="Régénérer analyse IA (démo)"}})}(p=a.querySelector(".products-goto-incidents"))==null||p.addEventListener("click",()=>{window.location.hash="incidents"}),(g=a.querySelector(".products-goto-risks"))==null||g.addEventListener("click",()=>{window.location.hash="risks"}),(m=a.querySelector(".products-goto-actions"))==null||m.addEventListener("click",()=>{window.location.hash="actions"}),t.append(a)}function uu(e){const t=document.createElement("article");t.className="content-card card-soft products-kpi-card";const a=e.length,r=su(e),n=cu(e),i=lu(e),o=Math.max(n.el,n.mo,n.fa,1);return t.innerHTML=`
    <div class="content-card-head">
      <div>
        <div class="section-kicker">Pilotage substances</div>
        <h3>Vue d’ensemble</h3>
        <p class="content-card-lead">Indicateurs calculés sur le registre local (navigateur) — pas de serveur en démo.</p>
      </div>
    </div>
    <div class="products-kpi-grid">
      <div class="products-kpi-tile">
        <span class="products-kpi-label">Produits</span>
        <span class="products-kpi-val">${a}</span>
      </div>
      <div class="products-kpi-tile products-kpi-tile--alert">
        <span class="products-kpi-label">Dangereux (élevé)</span>
        <span class="products-kpi-val">${r}</span>
      </div>
      <div class="products-kpi-tile">
        <span class="products-kpi-label">Alertes actives</span>
        <span class="products-kpi-val">${i.length}</span>
      </div>
    </div>
    <div class="products-dist-block">
      <h4 class="products-dist-title">Répartition des dangers</h4>
      <div class="products-dist-bars" role="img" aria-label="Répartition danger élevé, moyen, faible">
        <div class="products-dist-row"><span>Élevé</span><div class="products-dist-track"><i class="products-dist-fill products-dist-fill--el" style="width:${Math.round(n.el/o*100)}%"></i></div><span>${n.el}</span></div>
        <div class="products-dist-row"><span>Moyen</span><div class="products-dist-track"><i class="products-dist-fill products-dist-fill--mo" style="width:${Math.round(n.mo/o*100)}%"></i></div><span>${n.mo}</span></div>
        <div class="products-dist-row"><span>Faible</span><div class="products-dist-track"><i class="products-dist-fill products-dist-fill--fa" style="width:${Math.round(n.fa/o*100)}%"></i></div><span>${n.fa}</span></div>
      </div>
    </div>
    <div class="products-alerts-block">
      <h4 class="products-alerts-title">Alertes</h4>
      ${i.length===0?'<p class="products-alerts-empty">Aucune alerte sur le périmètre affiché.</p>':`<ul class="products-alerts-list">${i.slice(0,8).map(s=>`<li><button type="button" class="products-alert-link" data-pid="${Re(s.product.id)}">${Re(s.text)}</button></li>`).join("")}</ul>`}
    </div>
  `,t}function mu(e,t){e.querySelectorAll(".products-alert-link").forEach(a=>{a.addEventListener("click",()=>{const r=a.getAttribute("data-pid"),n=Pr().find(i=>i.id===r);n&&typeof t=="function"&&t(n)})})}function gu(e,t){const a=document.createElement("div");a.className="content-card card-soft products-terrain-card";const r=e.filter(p=>tn(p)),n=r.length?r:e;let i=n[0];if(!i)return a.innerHTML='<p class="products-terrain-empty">Aucun produit enregistré.</p>',a;const o=document.createElement("div");o.className="products-terrain-head";const s=document.createElement("span");s.className="products-terrain-kicker",s.textContent="Mode terrain";const c=document.createElement("h3");c.className="products-terrain-title",c.textContent=`Accès rapide — ${i.name}`;const l=document.createElement("div");l.className="products-terrain-grid";function d(p,g){const m=g.fdsEpi&&g.fdsEpi[0]||"—",b=g.fdsRescue||"";p.innerHTML=`
      <div class="products-terrain-cell products-terrain-cell--danger">
        <span class="products-terrain-lbl">Danger</span>
        <p class="products-terrain-val">${Re(ma(g.danger).label)}</p>
        <p class="products-terrain-mini">${Re(g.signalWord||"")}</p>
      </div>
      <div class="products-terrain-cell">
        <span class="products-terrain-lbl">EPI (prioritaire)</span>
        <p class="products-terrain-val">${Re(m)}</p>
      </div>
      <div class="products-terrain-cell products-terrain-cell--urgent">
        <span class="products-terrain-lbl">Urgence</span>
        <p class="products-terrain-val">${Re(b.slice(0,160))}${b.length>160?"…":""}</p>
      </div>
    `}if(o.append(s),n.length>1){const p=document.createElement("div");p.className="products-terrain-picker";const g=document.createElement("label");g.className="products-terrain-picker-label",g.htmlFor="products-terrain-product-select",g.textContent="Produit critique";const m=document.createElement("select");m.id="products-terrain-product-select",m.className="control-select products-terrain-select",m.setAttribute("aria-label","Choisir un produit pour le mode terrain"),n.forEach((b,y)=>{const v=document.createElement("option");v.value=String(y),v.textContent=`${b.name} (CAS ${b.cas})`,b.id===i.id&&(v.selected=!0),m.append(v)}),p.append(g,m),o.append(c,p),m.addEventListener("change",()=>{const b=Number(m.value);i=n[Number.isFinite(b)?b:0]||i,c.textContent=`Accès rapide — ${i.name}`,d(l,i)})}else o.append(c);d(l,i);const u=document.createElement("button");return u.type="button",u.className="btn btn-primary products-terrain-open-detail",u.textContent="Fiche complète",u.addEventListener("click",()=>{typeof t=="function"&&t(i)}),a.append(o,l,u),a}function bu(){var oe,ge;us();const e=document.createElement("section");e.className="page-stack audit-products-page products-page--premium";const t=document.createElement("header");t.className="products-page-header content-card card-soft",t.innerHTML=`
    <div class="products-page-header__inner">
      <div class="section-kicker">Substances dangereuses</div>
      <h1 class="products-page-title">Produits &amp; FDS</h1>
      <p class="products-page-lead">
        La <strong>fiche structurée</strong> (dangers, EPI, secours…) est l’outil terrain ; le PDF n’est qu’une pièce jointe. Import → contrôle humain → registre local.
      </p>
      <p class="products-flow-inline" aria-label="Étapes">Import · IA (démo) · Validation humaine · Registre</p>
    </div>
  `;const a=document.createElement("div");a.className="products-kpi-host";const r=document.createElement("div");r.className="products-terrain-host";const n=document.createElement("article");n.className="content-card card-soft products-import-card",n.innerHTML=`
    <div class="content-card-head">
      <div>
        <div class="section-kicker">Étape 1 — Import</div>
        <h3>Importer une FDS (PDF ou image)</h3>
        <p class="content-card-lead products-import-lead">
          PDF ou image : préremplissage <strong>simulé</strong> (pas d’OCR réel ici) — vous complétez la fiche exploitable avant enregistrement.
        </p>
      </div>
    </div>
    <div class="products-import-row">
      <label class="products-file-label">
        <span class="products-file-label__text">Fichier</span>
        <input type="file" class="products-fds-input" accept=".pdf,application/pdf,.png,.jpg,.jpeg,.webp,.gif,image/*" />
      </label>
      <button type="button" class="btn btn-primary products-extract-btn" disabled>Lancer l’analyse IA</button>
    </div>
    <p class="products-ia-disclaimer" role="note">IA indicative uniquement — rien n’est enregistré sans votre validation (voir étape 2).</p>
  `;const i=document.createElement("article");i.className="content-card card-soft products-validation-card",i.hidden=!0,i.innerHTML=`
    <div class="content-card-head">
      <div>
        <div class="section-kicker">Étape 2 — Contrôle humain</div>
        <h3>Contrôle avant enregistrement</h3>
        <p class="content-card-lead">Alignez chaque champ sur la FDS officielle ; l’IA propose des pistes, pas des décisions.</p>
      </div>
    </div>
    <p class="products-human-gate" role="status">
      <strong>Validation requise :</strong> rien n’est écrit dans le registre local tant que vous n’avez pas validé ci-dessous.
    </p>
    <div class="products-ia-preview" aria-live="polite">
      <h4 class="products-ia-preview-title">Analyse IA — à vérifier</h4>
      <div class="products-ia-preview-cols">
        <div>
          <p class="products-ia-preview-sub">Incohérences détectées</p>
          <ul class="products-ia-preview-list products-ia-inc-list"></ul>
        </div>
        <div>
          <p class="products-ia-preview-sub">Actions suggérées</p>
          <ul class="products-ia-preview-list products-ia-act-list"></ul>
        </div>
      </div>
    </div>
    <div class="products-validation-grid form-grid">
      <label class="field"><span>Nom produit</span><input type="text" class="control-input products-field-name" autocomplete="off" /></label>
      <label class="field"><span>N° CAS</span><input type="text" class="control-input products-field-cas" autocomplete="off" /></label>
      <label class="field"><span>Site / zone</span><input type="text" class="control-input products-field-site" autocomplete="off" /></label>
      <label class="field"><span>Criticité</span>
        <select class="control-select products-field-danger">
          <option value="faible">Faible</option>
          <option value="moyen">Moyen</option>
          <option value="élevé">Élevé</option>
        </select>
      </label>
      <label class="field"><span>Révision FDS (libellé)</span><input type="text" class="control-input products-field-revision" autocomplete="off" placeholder="MM/AAAA" /></label>
      <label class="field"><span>Validité FDS jusqu’au</span><input type="date" class="control-input products-field-valid-until" autocomplete="off" /></label>
      <label class="field"><span>Mot-signal</span><input type="text" class="control-input products-field-signal" autocomplete="off" /></label>
      <label class="field field-full"><span>Pictogrammes / mentions (une ligne chacune)</span>
        <textarea class="control-input products-field-pictograms" rows="2" autocomplete="off" placeholder="GHS05 Corrosif"></textarea>
      </label>
      <label class="field field-full"><span>EPI (une ligne par équipement)</span>
        <textarea class="control-input products-field-epi" rows="2" autocomplete="off"></textarea>
      </label>
      <label class="field field-full"><span>Stockage</span>
        <textarea class="control-input products-field-storage" rows="2" autocomplete="off"></textarea>
      </label>
      <label class="field field-full"><span>Secours / premiers secours</span>
        <textarea class="control-input products-field-rescue" rows="2" autocomplete="off"></textarea>
      </label>
      <label class="field field-full"><span>Mesures de prévention</span>
        <textarea class="control-input products-field-measures" rows="2" autocomplete="off"></textarea>
      </label>
      <label class="field field-full"><span>Mentions dangers / phrases H (texte libre)</span>
        <textarea class="control-input products-field-hazards" rows="3" autocomplete="off"></textarea>
      </label>
      <label class="field field-full"><span>Nom du document source</span>
        <input type="text" class="control-input products-field-filename" readonly />
      </label>
      <label class="field field-full products-human-confirm-wrap">
        <span class="products-human-confirm-label">
          <input type="checkbox" class="products-human-confirm-check" />
          Je confirme avoir vérifié chaque champ contre la <strong>FDS officielle</strong> fournisseur avant enregistrement.
        </span>
      </label>
    </div>
    <div class="products-validation-actions">
      <button type="button" class="btn btn-primary products-validate-btn">Valider et enregistrer</button>
      <button type="button" class="text-button products-cancel-draft-btn" style="font-weight:700">Annuler</button>
    </div>
  `;const o=document.createElement("article");o.className="content-card card-soft products-list-card",o.innerHTML=`
    <div class="content-card-head">
      <div>
        <div class="section-kicker">Registre</div>
        <h3>Liste des produits</h3>
        <p class="content-card-lead">Cartes criticité, validité FDS et alertes — recherche locale.</p>
      </div>
    </div>
    <div class="products-toolbar">
      <input type="search" class="control-input products-search" placeholder="Rechercher un produit, un CAS, un site…" autocomplete="off" />
    </div>
  `;const s=document.createElement("div");s.className="products-list",o.append(s);const c=document.createElement("div");c.className="products-detail-host",c.hidden=!0;const l=n.querySelector(".products-fds-input"),d=n.querySelector(".products-extract-btn");let u=null;const p=i.querySelector(".products-field-name"),g=i.querySelector(".products-field-cas"),m=i.querySelector(".products-field-site"),b=i.querySelector(".products-field-danger"),y=i.querySelector(".products-field-revision"),v=i.querySelector(".products-field-valid-until"),h=i.querySelector(".products-field-signal"),k=i.querySelector(".products-field-hazards"),_=i.querySelector(".products-field-filename"),f=i.querySelector(".products-field-pictograms"),E=i.querySelector(".products-field-epi"),w=i.querySelector(".products-field-storage"),x=i.querySelector(".products-field-rescue"),S=i.querySelector(".products-field-measures"),N=i.querySelector(".products-ia-inc-list"),L=i.querySelector(".products-ia-act-list");function D(B,re){if(N&&(N.replaceChildren(),(B||[]).forEach(se=>{const F=document.createElement("li");F.textContent=se,N.append(F)}),!B||!B.length)){const se=document.createElement("li");se.className="products-ia-preview-empty",se.textContent="—",N.append(se)}if(L&&(L.replaceChildren(),(re||[]).forEach(se=>{const F=document.createElement("li");F.textContent=se,L.append(F)}),!re||!re.length)){const se=document.createElement("li");se.className="products-ia-preview-empty",se.textContent="—",L.append(se)}}function q(){u=null,Qa=[],Ja=[],l&&(l.value=""),d&&(d.disabled=!0),i.hidden=!0,D([],[]);const B=i.querySelector(".products-human-confirm-check");B&&(B.checked=!1)}function W(){const B=Pr();a.replaceChildren();const re=uu(B);if(a.append(re),mu(re,se=>{za(se,c),c.scrollIntoView({behavior:"smooth",block:"nearest"})}),r.replaceChildren(),nu()){const se=gu(B,F=>{za(F,c),c.scrollIntoView({behavior:"smooth",block:"nearest"})});r.append(se)}}l==null||l.addEventListener("change",()=>{u=l.files&&l.files[0]||null,d&&(d.disabled=!u)}),d==null||d.addEventListener("click",async()=>{if(u){d.disabled=!0,d.textContent="Analyse en cours…";try{const B=await ks(u);Qa=Array.isArray(B.iaSuggestedActions)?[...B.iaSuggestedActions]:[],Ja=Array.isArray(B.iaInconsistencies)?[...B.iaInconsistencies]:[],D(Ja,Qa),p.value=B.name||"",g.value=B.cas||"",m.value=B.site||"",b.value=B.danger||"moyen",y.value=B.revision||"",h.value=B.signalWord||"",k.value=B.hazards||"",_.value=u.name||"",v&&B.fdsValidUntil&&(v.value=B.fdsValidUntil),f&&Array.isArray(B.pictograms)&&(f.value=B.pictograms.join(`
`)),E&&Array.isArray(B.epi)&&(E.value=B.epi.join(`
`)),w&&(w.value=B.storage||""),x&&(x.value=B.rescue||""),S&&(S.value=B.measures||""),i.hidden=!1,i.scrollIntoView({behavior:"smooth",block:"nearest"}),C("Analyse terminée — contrôlez chaque champ avant validation.","info")}finally{d.disabled=!u,d.textContent="Lancer l’analyse IA"}}}),(oe=i.querySelector(".products-cancel-draft-btn"))==null||oe.addEventListener("click",()=>{q(),C("Brouillon annulé.","info")}),(ge=i.querySelector(".products-validate-btn"))==null||ge.addEventListener("click",()=>{var $,T;if(!(($=i.querySelector(".products-human-confirm-check"))==null?void 0:$.checked)){C("Cochez la confirmation de contrôle humain contre la FDS officielle.","error");return}const re=(p.value||"").trim(),se=(m.value||"").trim();if(!re||!se){C("Nom et site sont obligatoires.","error");return}const F=(g.value||"").trim(),H=du(),G={id:H,name:re,cas:F||"—",site:se,danger:b.value||"moyen",revision:(y.value||"").trim()||"—",signalWord:(h.value||"").trim()||"—",hazards:(k.value||"").trim()||"—",fdsFileName:(_.value||"").trim()||((u==null?void 0:u.name)??""),fdsValidUntil:v&&v.value||"",fdsPictograms:si((f==null?void 0:f.value)||""),fdsEpi:si((E==null?void 0:E.value)||""),fdsStorage:((w==null?void 0:w.value)||"").trim(),fdsRescue:((x==null?void 0:x.value)||"").trim(),fdsMeasures:((S==null?void 0:S.value)||"").trim(),risksLinked:["À qualifier selon FDS validée"],incidentsHint:"Consulter le module Incidents pour les liens terrain.",fdsHumanValidated:!0,iaSuggestedActions:[...Qa],iaInconsistencies:[...Ja]},X=Zr();if(X.push(G),vs(X),u){const j=mr.get(H);j&&URL.revokeObjectURL(j),mr.set(H,URL.createObjectURL(u))}Be.add({module:"products",action:"Produit enregistré (FDS)",detail:`${re} — validation humaine`,user:((T=Me())==null?void 0:T.name)||"Utilisateur"}),C(`Produit « ${re} » enregistré dans le registre.`,"info"),q(),I(),W(),za(G,c),c.scrollIntoView({behavior:"smooth",block:"nearest"})});const K=o.querySelector(".products-search");function A(B){const re=mr.get(B.id);if(re){window.open(re,"_blank","noopener,noreferrer");return}C(`Aucune pièce jointe en session pour « ${B.name} » — la fiche repose sur les champs saisis (démo).`,"info")}function I(){const B=(K.value||"").trim().toLowerCase();if(s.replaceChildren(),Pr().filter(re=>ru(re,B)).forEach(re=>s.append(pu(re,{onDetail:se=>{za(se,c),c.scrollIntoView({behavior:"smooth",block:"nearest"})},onFds:A}))),!s.children.length){const re=document.createElement("p");re.className="products-list-empty",re.textContent="Aucun produit ne correspond à la recherche.",s.append(re)}}K.addEventListener("input",I);const z=document.createElement("div");z.className="products-actions-bar";const R=document.createElement("button");R.type="button",R.className="btn btn-primary",R.textContent="Importer une FDS",R.addEventListener("click",()=>{n.scrollIntoView({behavior:"smooth",block:"start"}),l==null||l.focus()}),z.append(R),e.append(t,a,r,n,i,o,c,z);const V=Ur();if((V==null?void 0:V.targetPageId)==="products"&&V.prefillData&&typeof V.prefillData=="object"){const B=V.prefillData;i.hidden=!1,B.name!=null&&(p.value=String(B.name)),B.cas!=null&&(g.value=String(B.cas)),B.site!=null&&(m.value=String(B.site)),B.danger!=null&&(b.value=String(B.danger)),B.revision!=null&&(y.value=String(B.revision)),B.signalWord!=null&&(h.value=String(B.signalWord)),B.hazards!=null&&(k.value=String(B.hazards)),B.fdsFileName!=null&&(_.value=String(B.fdsFileName)),C("Brouillon import appliqué — contrôlez puis validez.","info"),oi()}return W(),I(),e}const zt=5;function li(e){if(!e)return"—";try{return new Date(e).toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return"—"}}function la(e){if(!e)return"—";try{return new Date(e).toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric"})}catch{return"—"}}function _s(e){return e==="critical"?"red":e==="high"?"amber":"blue"}function gt(e){const t=document.createElement("p");return t.style.margin="0",t.style.fontSize="13px",t.style.color="var(--text3)",t.textContent=e,t}function gr(e,t,a){const r=document.createElement("p");return r.className="analytics-list-overflow",r.textContent=`${e} ${e>1?a:t}`,r}function hu(e){if(!Array.isArray(e)||!e.length)return{labels:[],series:[]};const t=e.map(n=>n.label),a=e.map(n=>Number.isFinite(n.value)?n.value:0),r=a.map((n,i)=>i===0?n:Math.round((a[i-1]+n)/2*10)/10);return{labels:t,series:[{name:"Score audit (%)",color:"rgb(79, 70, 229)",values:a,strokeWidth:2.15},{name:"Moyenne mobile (2 mois)",color:"rgb(148, 163, 184)",values:r,lineStyle:"dashed",showDots:!1,strokeWidth:1.65}]}}function xu(e){if(!Array.isArray(e)||!e.length)return[];const t=new Map;return e.forEach(a=>{const r=String(a.type||"Autre").trim()||"Autre";t.set(r,(t.get(r)||0)+1)}),[...t.entries()].map(([a,r])=>({type:a,count:r})).sort((a,r)=>r.count-a.count).slice(0,5)}function fu(e){if(!Array.isArray(e)||!e.length)return[];const t=new Map;return e.forEach(a=>{const r=String(a.status||"—").trim()||"—";t.set(r,(t.get(r)||0)+1)}),[...t.entries()].map(([a,r])=>({type:a,count:r})).sort((a,r)=>r.count-a.count).slice(0,5)}function vu(e,t){const a=[];return e.incidentsCriticalOpen>0&&a.push(`${e.incidentsCriticalOpen} incident(s) critique(s) encore ouvert(s) — priorité sécurité.`),e.actionsOverdue>0&&a.push(`${e.actionsOverdue} action(s) en retard — relancer les porteurs.`),e.nonConformitiesOpen>=5&&a.push(`${e.nonConformitiesOpen} NC ouvertes : arbitrer les traitements et les jalons.`),t.auditScoreAvg!=null&&!Number.isNaN(t.auditScoreAvg)&&t.auditScoreAvg<70&&e.auditsTotal>0&&a.push(`Score moyen des audits à ${t.auditScoreAvg} % — renforcer les plans d'amélioration.`),a.length===0&&a.push("Indicateurs stables sur l’échantillon automatique — poursuivre le pilotage et ouvrir le détail si besoin."),a.slice(0,3)}function yu(e,t,a,r="split"){const n=document.createElement("section");n.className="analytics-decision-panel"+(r==="stacked"?" analytics-decision-panel--stacked":"");const i=document.createElement("div");i.className="analytics-synthesis",vu(e,t).forEach(d=>{const u=document.createElement("p");u.textContent=d,i.append(u)});const o=document.createElement("div");o.className="analytics-alerts-compact",o.setAttribute("aria-label","Alertes synthétiques");const s=Array.isArray(a)?a:[],c=s.filter(d=>d.level==="critical"||d.level==="high"),l=(c.length?c:s).slice(0,3);return l.length?l.forEach(d=>{const u=document.createElement("div");u.className=`analytics-alert-chip analytics-alert-chip--${d.level}`,u.textContent=(d.message||d.code||"—").trim(),o.append(u)}):o.append(gt("Aucune alerte listée.")),n.append(i,o),n}function ku(e,t){const a=document.createElement("div");a.className="analytics-cockpit-header";const r=Math.max(0,Number(e.nonConformitiesTotal)||0),n=Math.max(0,Number(e.nonConformitiesOpen)||0),i=Math.max(0,r-n);let o="—",s="blue";if(r>0){const d=Math.round(i/r*100);o=`${d} %`,d>=75?s="green":d>=45?s="amber":s="red"}const c=Number(e.incidentsLast30Days)||0;return[{label:"Conformité NC",value:o,tone:s,hint:r?`${i} clôturées / ${r} enregistrées`:"Aucune NC en base"},{label:"Incidents (30 j.)",value:String(e.incidentsLast30Days??"—"),tone:c>=10?"amber":"blue",hint:`${e.incidentsTotal??"—"} total périmètre`},{label:"Actions en retard",value:String(e.actionsOverdue??"—"),tone:e.actionsOverdue>0?"amber":"green",hint:`Sur ${e.actionsTotal??"—"} actions`},{label:"Score audits",value:t.auditScoreAvg!=null&&!Number.isNaN(t.auditScoreAvg)?`${t.auditScoreAvg} %`:"—",tone:t.auditScoreAvg!=null&&t.auditScoreAvg<70?"amber":"green",hint:t.auditScoreMin!=null&&t.auditScoreMax!=null?`Fourchette ${t.auditScoreMin}–${t.auditScoreMax} %`:"Données limitées"}].forEach(d=>{const u=document.createElement("article");u.className="analytics-cockpit-stat card-soft";const p=document.createElement("div");p.className="analytics-cockpit-stat-label",p.textContent=d.label;const g=document.createElement("div");g.className=`metric-value ${d.tone} analytics-cockpit-stat-value`,g.textContent=d.value;const m=document.createElement("div");m.className="analytics-cockpit-stat-hint",m.textContent=d.hint,u.append(p,g,m),a.append(u)}),a}function da(e,t,a,r=""){const n=document.createElement("article");n.className="content-card card-soft dashboard-chart-card-inner analytics-chart-card"+(r?` ${r}`:"");const i=document.createElement("div");i.className="content-card-head";const o=document.createElement("div"),s=document.createElement("div");s.className="section-kicker",s.textContent=e;const c=document.createElement("h3");return c.textContent=t,o.append(s,c),i.append(o),n.append(i,a),n}function _u(e,t){const a=Cr(t.recentAudits),{labels:r,series:n}=hu(a),i=document.createElement("div");if(!r.length)i.append(gt("Pas assez de scores d’audit datés pour une courbe — complétez les audits dans le temps."));else{const o=Sc(r,n,`${e.auditsTotal??"—"} audit(s) en base · 0–100 % · réf. 75 %`,{variant:"analytics",targetYPercent:75,interpretText:Ar(a)});i.append(o)}return da("Vue globale","Évolution des scores d’audit",i,"analytics-chart-card--main")}function wu(e,t,a,r){const n=document.createElement("div");n.className="analytics-main-split";const i=document.createElement("div");i.className="analytics-main-trend-col",i.append(_u(e,t));const o=document.createElement("aside");o.className="analytics-aside-col",o.setAttribute("aria-label","Synthèse et pression opérationnelle"),o.append(yu(e,a,r,"stacked"));const s=document.createElement("div");s.append(ni({criticalIncidents:Math.max(0,Number(e.incidentsCriticalOpen)||0),overdueActions:Math.max(0,Number(e.actionsOverdue)||0),ncOpen:Math.max(0,Number(e.nonConformitiesOpen)||0)},{compact:!0}));const c=da("Pression","Critiques · retards · NC",s,"analytics-chart-card--aside");return o.append(c),n.append(i,o),n}function Eu(e,t){const a=document.createElement("section");a.className="analytics-charts-band analytics-secondary-band";const r=document.createElement("div");r.className="analytics-charts-grid analytics-secondary-grid analytics-secondary-grid--quad";const n=Math.max(0,Number(e.actionsTotal)||0),i=Math.max(0,Number(e.actionsOverdue)||0),o=Sr({overdue:i,done:0,other:Math.max(0,n-i)}),s=Wt(xu(t.criticalIncidents)),c=Wt(fu(t.recentAudits)),l=qc(e);return r.append(da("Actions","Retard vs autres",o,"analytics-chart-card--cell"),da("Volumes","Ordres de grandeur (relatif)",l,"analytics-chart-card--cell"),da("Incidents","Types (critiques ouverts)",s,"analytics-chart-card--cell"),da("Audits","Statuts (échantillon)",c,"analytics-chart-card--cell")),a.append(r),a}function Nu(e,t,a){const r=document.createElement("article");r.className="content-card card-soft analytics-critical-cockpit";const n=document.createElement("div");n.className="content-card-head";const i=document.createElement("div"),o=document.createElement("div");o.className="section-kicker",o.textContent="Points critiques";const s=document.createElement("h3");s.textContent="NC · Actions en retard · Audits récents",i.append(o,s),n.append(i);const c=document.createElement("div");c.className="analytics-critical-grid";function l(d,u){const p=document.createElement("div");p.className="analytics-critical-col";const g=document.createElement("h4");return g.className="analytics-critical-col-title",g.textContent=d,p.append(g,u),p}return c.append(l("Non-conformités ouvertes",e),l("Actions en retard",t),l("Audits récents",a)),r.append(n,c),r}function Su(e,t){const a=document.createElement("section");return a.className="kpi-grid dashboard-kpi-grid",[{label:"Incidents (total)",value:String(e.incidentsTotal??"—"),tone:"blue",note:`${e.incidentsLast30Days??"—"} sur 30 j.`},{label:"Incidents critiques ouverts",value:String(e.incidentsCriticalOpen??"—"),tone:e.incidentsCriticalOpen>0?"red":"green",note:"Sur les 400 derniers incidents (non clos)"},{label:"NC ouvertes",value:String(e.nonConformitiesOpen??"—"),tone:e.nonConformitiesOpen>=5?"amber":"blue",note:`Sur ${e.nonConformitiesTotal??"—"} enregistrées`},{label:"Actions en retard",value:String(e.actionsOverdue??"—"),tone:e.actionsOverdue>0?"amber":"green",note:`Sur ${e.actionsTotal??"—"} actions`},{label:"Audits (total)",value:String(e.auditsTotal??"—"),tone:"blue",note:"Référentiel audits"},{label:"Score moyen audits",value:t.auditScoreAvg!=null&&!Number.isNaN(t.auditScoreAvg)?`${t.auditScoreAvg} %`:"—",tone:t.auditScoreAvg!=null&&t.auditScoreAvg<70?"amber":"green",note:t.auditScoreMin!=null&&t.auditScoreMax!=null?`Min ${t.auditScoreMin} % · Max ${t.auditScoreMax} %`:"Pas assez de données"}].forEach(n=>{const i=document.createElement("article");i.className="metric-card card-soft",i.innerHTML=`
      <div class="metric-label">${n.label}</div>
      <div class="metric-value ${n.tone}">${n.value}</div>
      <div class="metric-note">${n.note}</div>
    `,a.append(i)}),a}function Gt(e,t,a){const r=document.createElement("article");r.className="content-card card-soft";const n=document.createElement("div");return n.className="content-card-head",n.innerHTML=`
    <div>
      <div class="section-kicker">${t}</div>
      <h3>${e}</h3>
    </div>
  `,r.append(n,a),r}function Cu(e){const t=document.createElement("section");return t.className="kpi-grid dashboard-kpi-grid",[{label:"Incidents créés (période)",value:String(e.incidentsCreated??"—"),tone:"blue",note:"Déclarations sur la fenêtre"},{label:"Audits enregistrés",value:String(e.auditsRecorded??"—"),tone:"blue",note:"Créés sur la période"},{label:"Score moyen audits",value:e.auditScoreAvg!=null&&!Number.isNaN(e.auditScoreAvg)?`${e.auditScoreAvg} %`:"—",tone:e.auditScoreAvg!=null&&e.auditScoreAvg<70?"amber":"green",note:"Sur les audits de la période"},{label:"NC créées",value:String(e.nonConformitiesCreated??"—"),tone:"amber",note:`${e.nonConformitiesOpenAmongCreated??"—"} encore ouvertes`},{label:"Actions créées",value:String(e.actionsCreated??"—"),tone:"blue",note:`${e.actionsCreatedWithClosedLikeStatus??"—"} statut terminé/clôturé`},{label:"Actions en retard (stock)",value:String(e.actionsOverdueStock??"—"),tone:e.actionsOverdueStock>0?"amber":"green",note:"À la fin de la période, filtres appliqués"},{label:"Incidents critiques (période)",value:String(e.criticalIncidentsInPeriod??"—"),tone:e.criticalIncidentsOpenInPeriod>0?"red":"green",note:`${e.criticalIncidentsOpenInPeriod??"—"} non clôturés`}].forEach(r=>{const n=document.createElement("article");n.className="metric-card card-soft",n.innerHTML=`
      <div class="metric-label">${r.label}</div>
      <div class="metric-value ${r.tone}">${r.value}</div>
      <div class="metric-note">${r.note}</div>
    `,t.append(n)}),t}function Au(e){const t=e.querySelector(".analytics-periodic-period"),a=e.querySelector(".analytics-periodic-start"),r=e.querySelector(".analytics-periodic-end"),n=e.querySelector(".analytics-periodic-site"),i=e.querySelector(".analytics-periodic-assignee"),o=e.querySelector(".analytics-periodic-load"),s=e.querySelector(".analytics-periodic-results"),c=e.querySelector(".analytics-periodic-status");(async function(){n.innerHTML='<option value="">— Tous sites —</option>',i.innerHTML='<option value="">— Tous responsables —</option>';try{(await di()).forEach(u=>{if(!(u!=null&&u.id))return;const p=document.createElement("option");p.value=u.id,p.textContent=u.code?`${u.name} (${u.code})`:u.name,n.append(p)})}catch{}Ne.activeSiteId&&(n.value=Ne.activeSiteId);try{(await pi()).forEach(u=>{if(!(u!=null&&u.id))return;const p=document.createElement("option");p.value=u.id,p.textContent=`${u.name} (${u.role})`,i.append(p)})}catch{}})(),o.addEventListener("click",async()=>{var m,b,y,v;const l=new URLSearchParams,d=(a.value||"").trim(),u=(r.value||"").trim();if(d&&!u||!d&&u){c.textContent="Indiquez la date de début et la date de fin, ou laissez les deux vides.",C("Période personnalisée : renseigner début et fin, ou utiliser la liste « Période » sans dates.","warning");return}d&&u?(l.set("startDate",d),l.set("endDate",u)):l.set("period",t.value||"weekly");const p=(n.value||"").trim();p&&l.set("siteId",p);const g=(i.value||"").trim();if(g&&l.set("assigneeId",g),!!await Yt("export_sensitive",{contextLabel:"chargement du reporting périodique consolidé"})){o.disabled=!0,c.textContent="Chargement…",s.replaceChildren();try{const h=await Se(`/api/reports/periodic?${l.toString()}`);if(h.status===403){c.textContent="Permission « rapports » requise.",C("Accès reporting périodique refusé","error");return}if(!h.ok){let R=`Erreur ${h.status}`;try{const V=await h.json();V.error&&(R=V.error)}catch{}c.textContent=R,C(R,"error");return}const k=await h.json(),_=k.meta||{};c.textContent=`Période : ${la(_.startDate)} → ${la(_.endDate)} · généré ${li(_.generatedAt)}`;const f=document.createElement("p");f.style.margin="0 0 10px",f.style.fontSize="12px",f.style.color="var(--text3)",f.style.lineHeight="1.45";const E=Array.isArray(_.limitations)?_.limitations:[];f.textContent=E.length>0?`Limites V1 : ${E.join(" ")}`:"",s.append(f),s.append(Cu(k.summary||{}));const w=document.createElement("div");w.className="stack";const x=Array.isArray(k.alerts)?k.alerts:[];x.length===0?w.append(gt("Aucune alerte.")):x.forEach(R=>{const V=document.createElement("article");V.className="list-row";const oe=_s(R.level);V.innerHTML=`
            <div>
              <strong>${R.code||"ALERTE"}</strong>
              <p style="margin:6px 0 0;font-size:13px;line-height:1.45;color:var(--text2)">${R.message||""}</p>
            </div>
            <span class="badge ${oe}">${R.level==="critical"?"Critique":R.level==="high"?"Priorité":"Info"}</span>
          `,w.append(V)}),s.append(Gt("Alertes (période)","Pilotage",w));const S=document.createElement("div");S.className="two-column";const N=document.createElement("div");N.className="stack";const L=Array.isArray((m=k.incidents)==null?void 0:m.sample)?k.incidents.sample:[];L.length===0?N.append(gt("Aucun incident sur la période.")):L.forEach(R=>{const V=document.createElement("article");V.className="list-row",V.innerHTML=`
            <div>
              <strong>${R.ref} — ${R.type}</strong>
              <p style="margin:6px 0 0;font-size:13px;color:var(--text2)">${R.site} · ${R.status}</p>
            </div>
            <span class="badge blue">${la(R.createdAt)}</span>
          `,N.append(V)});const D=document.createElement("div");D.className="stack";const q=Array.isArray((b=k.audits)==null?void 0:b.sample)?k.audits.sample:[];q.length===0?D.append(gt("Aucun audit sur la période.")):q.forEach(R=>{const V=document.createElement("article");V.className="list-row",V.innerHTML=`
            <div>
              <strong>${R.ref}</strong>
              <p style="margin:6px 0 0;font-size:13px;color:var(--text2)">${R.site} · ${R.status}</p>
            </div>
            <span class="badge blue">${R.score} %</span>
          `,D.append(V)}),S.append(Gt("Incidents (extrait)","Période",N),Gt("Audits (extrait)","Période",D)),s.append(S);const W=document.createElement("div");W.className="two-column";const K=document.createElement("div");K.className="stack";const A=Array.isArray((y=k.nonConformities)==null?void 0:y.sample)?k.nonConformities.sample:[];A.length===0?K.append(gt("Aucune NC créée sur la période.")):A.forEach(R=>{const V=document.createElement("article");V.className="list-row",V.innerHTML=`
            <div>
              <strong>${R.title}</strong>
              <p style="margin:6px 0 0;font-size:13px;color:var(--text2)">Audit ${R.auditRef} · ${R.status}</p>
            </div>
            <span class="badge amber">NC</span>
          `,K.append(V)});const I=document.createElement("div");I.className="stack";const z=Array.isArray((v=k.actions)==null?void 0:v.overdueSample)?k.actions.overdueSample:[];z.length===0?I.append(gt("Aucun extrait d’actions en retard (ou liste vide).")):z.forEach(R=>{const V=document.createElement("article");V.className="list-row";const oe=R.dueDate?la(R.dueDate):"—";V.innerHTML=`
            <div>
              <strong>${R.title}</strong>
              <p style="margin:6px 0 0;font-size:13px;color:var(--text2)">${R.owner||"—"} · Échéance ${oe}</p>
            </div>
            <span class="badge amber">Retard</span>
          `,I.append(V)}),W.append(Gt("NC créées (extrait)","Période",K),Gt("Actions en retard (extrait)","Stock fin période",I)),s.append(W)}catch(h){console.error("[analytics] periodic",h),c.textContent="Erreur réseau ou serveur.",C("Erreur chargement reporting périodique","error")}finally{o.disabled=!1}}})}function zu(e){const t=Me(),a=String((t==null?void 0:t.role)??"").toUpperCase();if(!t||a!=="ADMIN"&&a!=="QHSE")return;const r=document.createElement("article");r.className="content-card card-soft analytics-automation-card",r.innerHTML=`
    <div class="content-card-head">
      <div>
        <div class="section-kicker">Automatisation</div>
        <h3>Jobs planifiés (V1)</h3>
        <p class="dashboard-muted-lead" style="margin:6px 0 0;font-size:12px">
          E-mails hebdo + relances actions · SMTP requis côté serveur.
        </p>
      </div>
    </div>
    <p class="automation-status-line" style="margin:0;font-size:13px;color:var(--text2)"></p>
    <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:10px;align-items:center">
      <button type="button" class="btn btn-primary automation-run-btn" style="min-height:44px;font-weight:700">Exécuter maintenant</button>
    </div>
    <p class="automation-run-result" style="margin:10px 0 0;font-size:12px;color:var(--text3);white-space:pre-wrap"></p>
  `;const n=r.querySelector(".automation-status-line"),i=r.querySelector(".automation-run-result"),o=r.querySelector(".automation-run-btn");(async function(){try{const c=await Se("/api/automation/status");if(!c.ok){n.textContent="Statut indisponible (droits ou API).";return}const l=await c.json(),d=l.lastRunAt!=null?` · Dernier passage : ${li(l.lastRunAt)}`:"";n.textContent=`SMTP : ${l.smtpConfigured?"configuré":"non configuré"} · Planificateur serveur : ${l.schedulerEnabled?"oui":"non"}${d}`}catch{n.textContent="Impossible de charger le statut."}})(),o.addEventListener("click",async()=>{o.disabled=!0,i.textContent="Exécution…";try{const s=await Se("/api/automation/run",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({})}),c=await s.json().catch(()=>({}));if(!s.ok){i.textContent=c.error||`Erreur ${s.status}`,C(c.error||"Erreur","error");return}i.textContent=JSON.stringify(c.result??c,null,2),C("Jobs exécutés","info");try{const l=await Se("/api/automation/status");if(l.ok){const d=await l.json(),u=d.lastRunAt!=null?` · Dernier passage : ${li(d.lastRunAt)}`:"";n.textContent=`SMTP : ${d.smtpConfigured?"configuré":"non configuré"} · Planificateur serveur : ${d.schedulerEnabled?"oui":"non"}${u}`}}catch{}}catch(s){i.textContent=String((s==null?void 0:s.message)||s),C("Erreur réseau","error")}finally{o.disabled=!1}}),e.append(r)}function $u(){qt(),Dt();const e=document.createElement("section");e.className="page-stack analytics-cockpit-page";const t=ga.analytics,a=document.createElement("header");a.className="analytics-page-hero";const r=document.createElement("div");r.className="analytics-page-hero__top";const n=document.createElement("div");n.className="analytics-page-hero__copy";const i=document.createElement("p");i.className="section-kicker analytics-page-kicker",i.textContent=t==null?void 0:t.kicker;const o=document.createElement("h1");o.className="analytics-page-title",o.textContent=t==null?void 0:t.title;const s=document.createElement("p");s.className="analytics-page-lead",s.textContent=t==null?void 0:t.subtitle;const c=document.createElement("p");c.className="analytics-page-meta",c.setAttribute("aria-live","polite"),c.textContent="Chargement…",n.append(i,o,s),r.append(n,c),a.append(r);const l=document.createElement("p");l.className="analytics-loading-line",l.textContent="Chargement de la synthèse…";const d=document.createElement("div");d.className="analytics-content-host",d.append(l);const u=document.createElement("article");u.className="content-card card-soft analytics-periodic-card",u.innerHTML=`
    <div class="content-card-head analytics-periodic-card-head">
      <div>
        <div class="section-kicker">Rapport</div>
        <h3>Période et filtres</h3>
        <p class="dashboard-muted-lead analytics-periodic-lead">
          Rapport périodique (API <code>/api/reports/periodic</code>) — hebdo, mois en cours ou plage personnalisée.
        </p>
      </div>
    </div>
    <div class="form-grid analytics-periodic-form">
      <label class="field">
        <span>Période</span>
        <select class="control-select analytics-periodic-period" aria-label="Type de période">
          <option value="weekly">7 derniers jours</option>
          <option value="monthly">Mois en cours (1er → aujourd’hui)</option>
        </select>
      </label>
      <label class="field">
        <span>Début (optionnel)</span>
        <input type="date" class="control-input analytics-periodic-start" />
      </label>
      <label class="field">
        <span>Fin (optionnel)</span>
        <input type="date" class="control-input analytics-periodic-end" />
      </label>
      <label class="field">
        <span>Site</span>
        <select class="control-select analytics-periodic-site" aria-label="Filtrer par site"></select>
      </label>
      <label class="field">
        <span>Responsable (actions)</span>
        <select class="control-select analytics-periodic-assignee" aria-label="Filtrer par assigné"></select>
      </label>
      <button type="button" class="btn btn-primary analytics-periodic-load" style="min-height:44px;font-weight:700">
        Charger le reporting périodique
      </button>
    </div>
    <p class="analytics-periodic-status" style="margin:10px 0 0;font-size:12px;color:var(--text3)"></p>
    <div class="analytics-periodic-results stack" style="margin-top:12px"></div>
  `,Au(u);const p=document.createElement("div");return p.className="analytics-periodic-wrap",p.append(u),e.append(a,d,p),zu(e),(async function(){var m;try{const b=await Se(_t("/api/reports/summary"));if(b.status===403){l.textContent="Accès refusé : la synthèse nécessite la permission « rapports » (lecture).",c.textContent="Permission insuffisante",C("Permission rapports requise pour la synthèse.","error");return}if(!b.ok)throw new Error(`HTTP ${b.status}`);const y=await b.json();c.textContent=`Mise à jour ${li(y.generatedAt)} · ${((m=y.export)==null?void 0:m.documentTitle)??"Synthèse QHSE"}`,d.replaceChildren();const v=y.counts||{},h=y.kpis||{},k=Array.isArray(y.priorityAlerts)?y.priorityAlerts:[],_=document.createElement("div");_.className="analytics-cockpit-stack",_.append(ku(v,h),wu(v,y,h,k),Eu(v,y)),d.append(_);const f=document.createElement("div");f.className="stack";const E=Array.isArray(y.openNonConformities)?y.openNonConformities:[];E.length===0?f.append(gt("Aucune non-conformité ouverte listée (ou échantillon vide).")):(E.slice(0,zt).forEach(z=>{const R=document.createElement("article");R.className="list-row",R.innerHTML=`
            <div>
              <strong>${z.title}</strong>
              <p style="margin:6px 0 0;font-size:13px;color:var(--text2)">Audit ${z.auditRef} · ${z.status}</p>
            </div>
            <span class="badge amber">NC</span>
          `,f.append(R)}),E.length>zt&&f.append(gr(E.length-zt,"autre NC ouverte dans l’échantillon.","autres NC ouvertes dans l’échantillon.")));const w=document.createElement("div");w.className="stack";const x=Array.isArray(y.overdueActions)?y.overdueActions:[];x.length===0?w.append(gt("Aucune action en retard dans les extraits récents.")):(x.slice(0,zt).forEach(z=>{const R=document.createElement("article");R.className="list-row";const V=z.dueDate?la(z.dueDate):"—";R.innerHTML=`
            <div>
              <strong>${z.title}</strong>
              <p style="margin:6px 0 0;font-size:13px;color:var(--text2)">${z.owner||"—"} · Échéance ${V}</p>
            </div>
            <span class="badge amber">Retard</span>
          `,w.append(R)}),x.length>zt&&w.append(gr(x.length-zt,"autre action en retard dans l’échantillon.","autres actions en retard dans l’échantillon.")));const S=document.createElement("div");S.className="stack";const N=Array.isArray(y.recentAudits)?y.recentAudits:[];N.length===0?S.append(gt("Aucun audit enregistré.")):(N.slice(0,zt).forEach(z=>{const R=document.createElement("article");R.className="list-row",R.innerHTML=`
            <div>
              <strong>${z.ref}</strong>
              <p style="margin:6px 0 0;font-size:13px;color:var(--text2)">${z.site} · ${z.status}</p>
            </div>
            <span class="badge blue">${z.score} %</span>
          `,S.append(R)}),N.length>zt&&S.append(gr(N.length-zt,"autre audit dans l’échantillon.","autres audits dans l’échantillon.")));const L=document.createElement("div");L.className="stack";const D=Array.isArray(y.criticalIncidents)?y.criticalIncidents:[];D.length===0?L.append(gt("Aucun incident critique ouvert dans le périmètre analysé.")):D.forEach(I=>{const z=document.createElement("article");z.className="list-row",z.innerHTML=`
            <div>
              <strong>${I.ref} — ${I.type}</strong>
              <p style="margin:6px 0 0;font-size:13px;color:var(--text2)">${I.site} · ${I.status}</p>
            </div>
            <span class="badge red">${la(I.createdAt)}</span>
          `,L.append(z)});const q=document.createElement("div");q.className="stack",k.length===0?q.append(gt("Aucune alerte renvoyée.")):k.forEach(I=>{const z=document.createElement("article");z.className="list-row";const R=_s(I.level);z.innerHTML=`
            <div>
              <strong>${I.code||"ALERTE"}</strong>
              <p style="margin:6px 0 0;font-size:13px;line-height:1.45;color:var(--text2)">${I.message||""}</p>
            </div>
            <span class="badge ${R}">${I.level==="critical"?"Critique":I.level==="high"?"Priorité":"Info"}</span>
          `,q.append(z)}),d.append(Nu(f,w,S));const W=document.createElement("details");W.className="analytics-extended-details",W.setAttribute("open","");const K=document.createElement("summary");K.textContent="Indicateurs détaillés, incidents critiques et alertes (listes)",W.append(K);const A=document.createElement("div");A.className="analytics-extended-details-inner stack",A.append(Su(v,h)),A.append(Gt("Incidents critiques (aperçu)","Sécurité",L)),A.append(Gt("Alertes prioritaires (liste)","Pilotage",q)),W.append(A),d.append(W)}catch(b){console.error("[analytics] /api/reports/summary",b),l.textContent="Impossible de charger la synthèse. Vérifiez l’API et la console.",c.textContent="Erreur de chargement",C("Erreur chargement synthèse reporting","error")}})(),e}const Rr="qhse-performance-kpi-snapshot-v1",Ce={conformity:85,auditScore:80,actionsOverdue:0,incidents30:5,ncTreatmentRate:75,actionOnTrackPct:92};function ws(e){return`${Ne.activeSiteId||"groupe"}|m${e}`}function qu(e){try{const t=sessionStorage.getItem(Rr);return t&&JSON.parse(t)[ws(e)]||null}catch{return null}}function Lu(e,t){try{const a=sessionStorage.getItem(Rr),r=a?JSON.parse(a):{};r[ws(e)]=t,sessionStorage.setItem(Rr,JSON.stringify(r))}catch{}}function Iu(e,t){const a=Number(t==null?void 0:t.auditScoreAvg),r=Number.isFinite(a)?a:72,n=Math.max(0,Number(e==null?void 0:e.nonConformitiesTotal)||0),i=Math.max(0,Number(e==null?void 0:e.nonConformitiesOpen)||0),o=n>0?i/n*28:i>0?14:0,s=Math.max(0,Number(e==null?void 0:e.actionsTotal)||0),c=Math.max(0,Number(e==null?void 0:e.actionsOverdue)||0),l=s>0?c/s*22:c>0?11:0,d=Math.max(0,Number(e==null?void 0:e.incidentsLast30Days)||0),u=Math.min(18,d*1.4),p=r-o-l-u;return Math.round(Math.max(0,Math.min(100,p)))}function Bt(e,t){if(e==null||Number.isNaN(Number(e)))return"—";const a=Math.round((Number(t)-Number(e))*10)/10;return Math.abs(a)<.05?"=":(a>0?"+":"")+String(a)}function Ze(e,t,a=!1){return a?e>t?"red":e>t*.5&&t>0?"amber":"green":e<t-8?"red":e<t-3?"amber":"green"}function ta(e,t,a,r="pt"){if(e==null||t==null||Number.isNaN(Number(e)))return"—";const n=Number(e),i=Number(t);if(a){if(i===0)return n<=0?"À la cible":`${n} hors cible`;const s=i-n;return Math.abs(s)<.05?"À la cible":s>0?`Marge +${Math.round(s*10)/10}${r==="pt"?"":r}`:`Dépassement ${Math.round(s*10)/10}${r==="pt"?"":r}`}const o=n-i;return Math.abs(o)<.05?"À la cible":o>=0?`+${Math.round(o*10)/10} ${r}`:`${Math.round(o*10)/10} ${r}`}function Tu(e,t,a){const r=Number(t==null?void 0:t.incidentsCriticalOpen)||0,n=Number(t==null?void 0:t.actionsOverdue)||0,i=a==null?void 0:a.auditScoreAvg;return r>0||n>12||i!=null&&i<65||e<55?{label:"Alerte",tone:"red",hint:"Décisions rapides attendues."}:n>5||i!=null&&i<Ce.auditScore||e<Ce.conformity?{label:"Vigilance",tone:"amber",hint:"Serrer le suivi des écarts."}:{label:"Maîtrise",tone:"green",hint:"Cap soutenable — consolider."}}function Mu(e){return e==="—"||e==="="?"→":String(e).startsWith("+")?"↑":String(e).startsWith("-")?"↓":"→"}function Pu(e,t){const a=[],r=Number(e==null?void 0:e.actionsOverdue)||0,n=Number(e==null?void 0:e.nonConformitiesOpen)||0,i=Number(e==null?void 0:e.incidentsCriticalOpen)||0,o=t==null?void 0:t.auditScoreAvg;return i>0&&a.push("Clôturer les incidents critiques."),r>0&&a.push(`Débloquer ${r} action(s) en retard.`),n>=4&&a.push(`Réduire les NC ouvertes (${n}).`),o!=null&&!Number.isNaN(o)&&o<Ce.auditScore&&a.push(`Rehausser le score audit (cible ${Ce.auditScore} %).`),a.length===0&&a.push("Préparer revue direction et preuves."),a.slice(0,3)}function Dr(e){const t=String(e||"").replace(/^#/,"");t&&(window.location.hash=t)}function aa(e){const{title:t,valueText:a,deltaText:r,goalText:n,gapText:i,tone:o,hash:s,statusTone:c}=e,l=document.createElement("article");l.className=`kpi-perf-main-card metric-card card-soft kpi-perf-main-card--${c||"blue"}`,l.tabIndex=0,l.setAttribute("role","link"),l.setAttribute("aria-label",`${t} — ouvrir le module associé`),l.addEventListener("click",()=>Dr(s)),l.addEventListener("keydown",u=>{(u.key==="Enter"||u.key===" ")&&(u.preventDefault(),Dr(s))});const d=i&&String(i).trim()?`<div class="kpi-perf-main-gap kpi-perf-main-gap--${o||"blue"}">${i}</div>`:"";return l.innerHTML=`
    <div class="metric-label">${t}</div>
    <div class="metric-value ${o} kpi-perf-main-value">${a}</div>
    <div class="kpi-perf-main-meta">
      <span class="kpi-perf-delta">Tendance ${r}</span>
      <span class="kpi-perf-goal">Obj. ${n}</span>
    </div>
    ${d}
  `,l}function Ru(e,t,a,r){const n=Tu(e,a,r),i=t?Bt(t.conformity,e):"—",o=Mu(i),s=document.createElement("section");return s.className="kpi-perf-cockpit-hero",s.innerHTML=`
    <div class="kpi-perf-hero-score">
      <span class="kpi-perf-hero-k">Indice de maîtrise QHSE</span>
      <div class="kpi-perf-hero-val-row">
        <span class="kpi-perf-hero-val metric-value ${Ze(e,Ce.conformity)}">${e}</span>
        <span class="kpi-perf-hero-pct">%</span>
        <span class="kpi-perf-hero-trend" aria-hidden="true">${o}</span>
      </div>
      <p class="kpi-perf-hero-sub">vs dernière visite : <strong>${i}</strong> pts</p>
    </div>
    <div class="kpi-perf-hero-vigil kpi-perf-hero-vigil--${n.tone}">
      <span class="kpi-perf-hero-vigil-k">Niveau de vigilance</span>
      <span class="kpi-perf-hero-vigil-l">${n.label}</span>
      <p class="kpi-perf-hero-vigil-h">${n.hint}</p>
    </div>
  `,s}function Du(e){const t=document.createElement("article");t.className="content-card card-soft kpi-perf-chart-card kpi-perf-chart-card--goalvs";const a=document.createElement("div");a.className="content-card-head",a.innerHTML='<div><div class="kpi-perf-dx-kicker">Écart</div><h2 class="kpi-perf-h2 kpi-perf-h2--small">Objectif vs réel</h2></div>';const r=document.createElement("div");r.className="kpi-perf-goalvs-body",e.forEach(i=>{const o=Math.max(0,Math.min(100,Number(i.pctReal)||0)),s=Math.max(0,Math.min(100,Number(i.pctGoal)||0)),c=document.createElement("div");c.className="kpi-perf-goalvs-row",c.innerHTML=`
      <div class="kpi-perf-goalvs-label">${i.label}</div>
      <div class="kpi-perf-goalvs-track" role="presentation">
        <div class="kpi-perf-goalvs-fill" style="width:${o}%"></div>
        <div class="kpi-perf-goalvs-marker" style="left:${s}%"></div>
      </div>
      <div class="kpi-perf-goalvs-vals">
        <span class="kpi-perf-goalvs-real">${i.realText}</span>
        <span class="kpi-perf-goalvs-goal">cible ${i.goalText}</span>
      </div>
    `,r.append(c)});const n=document.createElement("p");return n.className="kpi-perf-goalvs-foot",n.textContent="Réel (barre) · objectif (trait). Échelle normalisée par ligne.",t.append(a,r,n),t}function ju(e,t){const a=document.createElement("section");if(a.className="kpi-perf-gaps",a.innerHTML=`<h2 class="kpi-perf-gaps-title">Écarts à l’objectif</h2>
    <div class="kpi-perf-gaps-grid">
      <div class="kpi-perf-gaps-col kpi-perf-gaps-col--below">
        <span class="kpi-perf-gaps-col-k">Sous la cible</span>
        <ul class="kpi-perf-gaps-list"></ul>
      </div>
      <div class="kpi-perf-gaps-col kpi-perf-gaps-col--watch">
        <span class="kpi-perf-gaps-col-k">À surveiller</span>
        <ul class="kpi-perf-gaps-list"></ul>
      </div>
      <div class="kpi-perf-gaps-col kpi-perf-gaps-col--ok">
        <span class="kpi-perf-gaps-col-k">À la cible</span>
        <ul class="kpi-perf-gaps-list"></ul>
      </div>
    </div>`,t&&String(t).trim()){const i=document.createElement("p");i.className="kpi-perf-gaps-sub",i.textContent=t,a.querySelector(".kpi-perf-gaps-title").after(i)}const r=a.querySelectorAll(".kpi-perf-gaps-col"),n=[r[0].querySelector("ul"),r[1].querySelector("ul"),r[2].querySelector("ul")];return(e.below||[]).forEach(i=>{const o=document.createElement("li");o.textContent=i,n[0].append(o)}),(e.watch||[]).forEach(i=>{const o=document.createElement("li");o.textContent=i,n[1].append(o)}),(e.ok||[]).forEach(i=>{const o=document.createElement("li");o.textContent=i,n[2].append(o)}),[0,1,2].forEach(i=>{if(!n[i].children.length){const o=document.createElement("li");o.className="kpi-perf-gaps-empty",o.textContent="—",n[i].append(o)}}),a}function Ou(e){const t=document.createElement("section");t.className="kpi-perf-priorities";const a=document.createElement("h2");a.className="kpi-perf-priorities-title",a.textContent="Priorités de pilotage";const r=document.createElement("ol");return r.className="kpi-perf-priorities-list",e.forEach((n,i)=>{const o=document.createElement("li"),s=document.createElement("span");s.className="kpi-perf-priorities-idx",s.textContent=String(i+1);const c=document.createElement("span");c.className="kpi-perf-priorities-txt",c.textContent=n,o.append(s,c),r.append(o)}),t.append(a,r),t}function Hu(e){const t=[],a=[],r=[];return e.forEach(n=>{n.zone==="below"?t.push(n.label):n.zone==="watch"?a.push(n.label):r.push(n.label)}),{below:t,watch:a,ok:r}}function Fu(){Dt();const e=document.createElement("section");e.className="page-stack kpi-performance-page";const t=document.createElement("header");t.className="kpi-perf-header kpi-perf-header--toolbar-only";const a=document.createElement("div");a.className="kpi-perf-toolbar";const r=document.createElement("label");r.className="field kpi-perf-field",r.innerHTML="<span>Période</span>";const n=document.createElement("select");n.className="control-select",n.setAttribute("aria-label","Nombre de mois sur le graphique"),[{v:"3",t:"3 mois"},{v:"6",t:"6 mois"},{v:"12",t:"12 mois"}].forEach(d=>{const u=document.createElement("option");u.value=d.v,u.textContent=d.t,n.append(u)}),n.value="6",r.append(n);const i=document.createElement("label");i.className="field kpi-perf-field",i.innerHTML="<span>Site</span>";const o=document.createElement("select");o.className="control-select",o.setAttribute("aria-label","Filtrer par site"),i.append(o),a.append(r,i),t.append(a),e.append(t);const s=document.createElement("p");s.className="kpi-perf-loading",s.textContent="Chargement des indicateurs…";const c=document.createElement("div");c.className="kpi-perf-content stack",c.append(s),e.append(c),(async function(){o.innerHTML='<option value="">Vue groupe (tous sites)</option>';try{(await di()).forEach(p=>{if(!(p!=null&&p.id))return;const g=document.createElement("option");g.value=p.id,g.textContent=p.code?`${p.name} (${p.code})`:p.name,o.append(g)})}catch{}Ne.activeSiteId&&(o.value=Ne.activeSiteId)})();let l=()=>{};return o.addEventListener("change",()=>{const d=o.value||"",u=o.selectedOptions[0],p=u?u.textContent:"Vue groupe (tous sites)";jo(d||null,p),l()}),n.addEventListener("change",()=>l()),l=async function(){const u=Math.max(3,Math.min(12,parseInt(n.value,10)||6));s.style.display="block",[...c.children].forEach(p=>{p.classList.contains("kpi-perf-loading")||p.remove()});try{const[p,g,m]=await Promise.all([Se(_t("/api/reports/summary")),Se(_t("/api/incidents?limit=500")),Se(_t("/api/audits?limit=500"))]);if(p.status===403){s.textContent="Permission « rapports » requise pour les KPI consolidés.",C("Permission rapports requise pour Performance QHSE.","error");return}if(!p.ok)throw new Error(`summary ${p.status}`);const b=await p.json(),y=g.ok?await g.json().catch(()=>[]):[],v=m.ok?await m.json().catch(()=>[]):[],h=b.counts||{},k=b.kpis||{},_=Iu(h,k),f=qu(u),E=k.auditScoreAvg!=null&&!Number.isNaN(k.auditScoreAvg)?k.auditScoreAvg:null,w=Number(h.incidentsLast30Days)||0,x=Number(h.actionsOverdue)||0,S=Math.max(0,Number(h.actionsTotal)||0),N=Math.max(0,Number(h.nonConformitiesTotal)||0),L=Math.max(0,Number(h.nonConformitiesOpen)||0),D=Number(h.incidentsCriticalOpen)||0,q=N>0?Math.round((N-L)/N*1e3)/10:null,W=S>0?Math.round((S-x)/S*1e3)/10:null,A=Nc(v,u).map(me=>({label:me.label,value:Math.max(0,Math.min(100,Math.round(Number(me.value)||0)))})),I=oa(A,{ariaLabel:"Score moyen des audits par mois.",footText:"Moyenne mensuelle (audits datés, 0–100).",interpretText:"",valueTitle:me=>`${me.label} : ${me.value} %`}),z=[{label:"Conformité (indice)",pctReal:_,pctGoal:Ce.conformity,realText:`${_} %`,goalText:`${Ce.conformity} %`},{label:"Score audit moyen",pctReal:E??0,pctGoal:Ce.auditScore,realText:E!=null?`${E} %`:"—",goalText:`${Ce.auditScore} %`},{label:"NC traitées (%)",pctReal:q??0,pctGoal:Ce.ncTreatmentRate,realText:q!=null?`${q} %`:"—",goalText:`${Ce.ncTreatmentRate} %`},{label:"Actions hors retard",pctReal:W??0,pctGoal:Ce.actionOnTrackPct,realText:W!=null?`${W} %`:"—",goalText:`${Ce.actionOnTrackPct} %`},{label:"Pression retards (inv.)",pctReal:S>0?Math.min(100,x/S*100):x>0?100:0,pctGoal:0,realText:`${x} / ${S||"—"}`,goalText:"0 retard"}],R=me=>me==="red"?"below":me==="amber"?"watch":"ok",V=[{label:`Conformité globale (${_} %)`,zone:R(Ze(_,Ce.conformity))},{label:q!=null?`Taux traitement NC (${q} %)`:"Taux traitement NC (données insuffisantes)",zone:q==null?"watch":R(Ze(q,Ce.ncTreatmentRate))},{label:`Incidents critiques (${D})`,zone:R(Ze(D,Ce.actionsOverdue,!0))},{label:E!=null?`Score audit (${E} %)`:"Score audit (—)",zone:E==null?"watch":R(Ze(E,Ce.auditScore))},{label:W!=null?`Exécution actions (${W} % hors retard)`:"Exécution actions (—)",zone:W==null?"watch":R(Ze(W,Ce.actionOnTrackPct))},{label:`Actions en retard (${x})`,zone:R(Ze(x,Ce.actionsOverdue,!0))}],oe=document.createElement("div");oe.className="kpi-perf-charge-body",oe.append(ni({criticalIncidents:D,overdueActions:x,ncOpen:L},{compact:!0}));const ge=document.createElement("p");ge.className="kpi-perf-charge-audits",ge.textContent=`Audits en base : ${h.auditsTotal??"—"}.`;const B=document.createElement("article");B.className="content-card card-soft kpi-perf-chart-card kpi-perf-chart-card--charge";const re=document.createElement("div");re.className="content-card-head",re.innerHTML='<div><div class="kpi-perf-dx-kicker">Pression</div><h2 class="kpi-perf-h2 kpi-perf-h2--small">Charge critique</h2></div>',B.append(re,oe,ge);const se=document.createElement("article");se.className="content-card card-soft kpi-perf-chart-card kpi-perf-chart-card--progress";const F=document.createElement("div");F.className="content-card-head",F.innerHTML='<div><div class="kpi-perf-dx-kicker">Trajectoire</div><h2 class="kpi-perf-h2 kpi-perf-h2--small">Score audit par mois</h2></div>',se.append(F,I);const H=document.createElement("div");H.className="kpi-perf-band kpi-perf-band--charts";const G=document.createElement("div");G.className="kpi-perf-charts-bank",G.append(Du(z),B,se),H.append(G),s.style.display="none";const X=document.createElement("section");X.className="kpi-perf-main-grid kpi-grid dashboard-kpi-grid kpi-perf-main-grid--tier-strat";const $=document.createElement("section");$.className="kpi-perf-main-grid kpi-grid dashboard-kpi-grid kpi-perf-main-grid--tier-ops";const T=f?Bt(f.conformity,_):"—";X.append(aa({title:"Conformité globale",valueText:`${_} %`,deltaText:T,goalText:`${Ce.conformity} %`,gapText:ta(_,Ce.conformity,!1,"pts"),tone:Ze(_,Ce.conformity),hash:"iso",statusTone:Ze(_,Ce.conformity)}));const j=E!=null?`${E} %`:"—",Y=f&&E!=null&&f.auditScore!=null?Bt(f.auditScore,E):"—";X.append(aa({title:"Score audit moyen",valueText:j,deltaText:Y,goalText:`${Ce.auditScore} %`,gapText:E!=null?ta(E,Ce.auditScore,!1,"pts"):"—",tone:E!=null?Ze(E,Ce.auditScore):"blue",hash:"audits",statusTone:E!=null?Ze(E,Ce.auditScore):"blue"}));const ne=f?Bt(f.critOpen,D):"—";X.append(aa({title:"Incidents critiques ouverts",valueText:String(D),deltaText:ne,goalText:"0",gapText:ta(D,0,!0,""),tone:Ze(D,0,!0),hash:"incidents",statusTone:Ze(D,0,!0)}));const ae=f&&q!=null&&f.ncCloseRate!=null?Bt(f.ncCloseRate,q):"—";$.append(aa({title:"Taux de traitement NC",valueText:q!=null?`${q} %`:"—",deltaText:ae,goalText:`${Ce.ncTreatmentRate} %`,gapText:q!=null?ta(q,Ce.ncTreatmentRate,!1,"pts"):"—",tone:q!=null?Ze(q,Ce.ncTreatmentRate):"blue",hash:"iso",statusTone:q!=null?Ze(q,Ce.ncTreatmentRate):"blue"}));const de=f&&W!=null&&f.actOnTrackPct!=null?Bt(f.actOnTrackPct,W):"—";$.append(aa({title:"Respect des échéances",valueText:W!=null?`${W} %`:"—",deltaText:de,goalText:`${Ce.actionOnTrackPct} %`,gapText:W!=null?ta(W,Ce.actionOnTrackPct,!1,"pts"):"—",tone:W!=null?Ze(W,Ce.actionOnTrackPct):"blue",hash:"actions",statusTone:W!=null?Ze(W,Ce.actionOnTrackPct):"blue"}));const he=f?Bt(f.actionsOverdue,x):"—";$.append(aa({title:"Actions en retard",valueText:String(x),deltaText:he,goalText:String(Ce.actionsOverdue),gapText:ta(x,Ce.actionsOverdue,!0,""),tone:Ze(x,Ce.actionsOverdue,!0),hash:"actions",statusTone:Ze(x,Ce.actionsOverdue,!0)}));const fe=document.createElement("div");fe.className="kpi-perf-kpi-block";const _e=document.createElement("p");_e.className="kpi-perf-section-k",_e.textContent="Indicateurs clés",fe.append(_e,X,$);const Ee=Ru(_,f,h,k),ve=Hu(V),Ae=V.filter(me=>me.zone==="below").length,ze=V.filter(me=>me.zone==="watch").length,Pe=V.filter(me=>me.zone==="ok").length,We=ju(ve,`${Ae} sous cible · ${ze} à surveiller · ${Pe} à la cible`),O=Ou(Pu(h,k,_)),M=Array.isArray(b.priorityAlerts)?b.priorityAlerts.slice(0,3):[],U=document.createElement("div");U.className="kpi-perf-alerts-wrap";const J=document.createElement("details");J.className="kpi-perf-alerts-details",J.open=M.some(me=>me.level==="critical"||me.level==="high");const te=document.createElement("summary");te.className="kpi-perf-alerts-summary",te.textContent=M.length===0?"Alertes automatiques — aucune":`Alertes automatiques (${M.length})`,J.append(te);const Z=document.createElement("div");if(Z.className="stack kpi-perf-alerts-stack",M.length===0){const me=document.createElement("p");me.className="kpi-perf-muted",me.textContent="Aucune alerte moteur.",Z.append(me)}else M.forEach(me=>{const De=document.createElement("div"),xe=me.level==="critical"?"critical":me.level==="high"?"high":"info";De.className=`kpi-perf-alert kpi-perf-alert--${xe}`,De.textContent=me.message||me.code||"—",Z.append(De)});const le=document.createElement("button");le.type="button",le.className="btn btn-secondary kpi-perf-link-analytics",le.textContent="Ouvrir Analytics / Synthèse",le.addEventListener("click",()=>Dr("analytics")),Z.append(le),J.append(Z),U.append(J);const be=document.createElement("div");be.className="kpi-perf-pilotage-row",be.append(We,O);const ye=document.createElement("p");ye.className="kpi-perf-foot";const Ie=Array.isArray(y)?y.length:0,$e=Array.isArray(v)?v.length:0;ye.textContent=`Cartes cliquables (module lié). Tendance = dernière visite. Série : ${Ie} incidents · ${$e} audits. Objectifs = repères locaux.`,c.append(Ee,fe,be,H,U,ye),Lu(u,{conformity:_,actionsOverdue:x,incidents30:w,auditScore:E??null,ncCloseRate:q??null,actOnTrackPct:W??null,critOpen:D})}catch(p){console.error("[performance]",p),s.textContent="Impossible de charger les KPI.",C("Erreur chargement Performance QHSE","error")}},l(),e}const ko="qhse-ai-center-styles",Vu=`
.ai-center-page .ai-hero{margin-bottom:4px}
.ai-use-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:12px}
@media (max-width:900px){.ai-use-grid{grid-template-columns:1fr}}
.ai-use-card{border-radius:14px;border:1px solid rgba(148,163,184,.12);background:rgba(255,255,255,.03);padding:14px 16px;display:grid;gap:8px;min-height:0}
.ai-use-card__label{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3)}
.ai-use-card__title{margin:0;font-size:15px;font-weight:700;line-height:1.3;color:var(--text)}
.ai-use-card__body{margin:0;font-size:13px;line-height:1.5;color:var(--text2)}
.ai-use-card__foot{font-size:12px;color:var(--text3);font-style:italic}
.ai-sim-card{margin-top:14px}
.ai-sim-layout{display:grid;grid-template-columns:minmax(220px,300px) 1fr;gap:16px;align-items:start;margin-top:10px}
@media (max-width:800px){.ai-sim-layout{grid-template-columns:1fr}}
.ai-sim-controls{display:flex;flex-direction:column;gap:10px}
.ai-sim-controls label{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.ai-sim-controls select,.ai-sim-controls .control-input{width:100%;padding:10px 12px;border-radius:10px;border:1px solid rgba(148,163,184,.2);background:rgba(0,0,0,.2);color:var(--text);font-size:13px}
.ai-sim-main{display:flex;flex-direction:column;gap:12px;min-width:0}
.ai-sim-output{border-radius:14px;border:1px solid rgba(148,163,184,.14);background:rgba(0,0,0,.14);padding:0;min-height:200px;overflow:hidden}
.ai-sim-output--empty{padding:18px 20px;background:rgba(0,0,0,.12)}
.ai-sim-output--empty .ai-sim-placeholder{margin:0;font-size:13px;line-height:1.55;color:var(--text3);font-style:italic}
.ai-sim-result-head{padding:16px 18px 12px;border-bottom:1px solid rgba(148,163,184,.1);background:rgba(0,0,0,.12)}
.ai-sim-result-ref{display:inline-block;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#5eead4;margin-bottom:6px}
.ai-sim-result-title{margin:0;font-size:16px;font-weight:800;letter-spacing:-.02em;line-height:1.35;color:var(--text)}
.ai-sim-result-body{padding:12px 18px 8px;display:grid;gap:14px}
.ai-sim-section{margin:0}
.ai-sim-section__title{margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.ai-sim-section__list{margin:0;padding:0 0 0 18px;font-size:13px;line-height:1.55;color:var(--text2)}
.ai-sim-section__list li{margin-bottom:6px}
.ai-sim-section__list li:last-child{margin-bottom:0}
.ai-sim-result-foot{margin:0;padding:12px 18px 16px;font-size:11px;line-height:1.45;color:var(--text3);border-top:1px solid rgba(148,163,184,.08);background:rgba(0,0,0,.08)}
.ai-sim-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.ai-sim-toolbar .btn,.ai-sim-toolbar .text-button{min-height:40px}
.ai-sim-hint{font-size:12px;color:var(--text3);margin:0;flex:1;min-width:200px}
.ai-sim-history{border-radius:14px;border:1px solid rgba(148,163,184,.1);background:rgba(0,0,0,.08);padding:12px 14px}
.ai-sim-history__title{margin:0 0 10px;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3)}
.ai-sim-history__list{display:grid;gap:8px;margin:0;padding:0;list-style:none}
.ai-sim-history__item{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:baseline;font-size:12px;color:var(--text2);padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.03);border:1px solid rgba(148,163,184,.06)}
.ai-sim-history__time{font-variant-numeric:tabular-nums;font-weight:600;color:var(--text3);font-size:11px}
.ai-sim-history__ref{font-weight:800;color:#5eead4;font-size:11px}
.ai-sim-history__label{flex:1;min-width:120px;color:var(--text)}
`;function Bu(){if(document.getElementById(ko))return;const e=document.createElement("style");e.id=ko,e.textContent=Vu,document.head.append(e)}function br(e,t,a){return{ref:e,title:t,sections:a}}const hr={hydrocarbure:br("SIM-2026-ENV-01","Fuite mineure — bac de rétention",[{id:"resume",title:"Résumé incident",items:["Détection : écart hydrocarbure localisé au pied du bac de rétention zone stockage.","Confinement : barrage absorbant posé, aucune propagation hors aire technique.","Impact : pas d’atteinte aux eaux superficielles (contrôle visuel mock)."]},{id:"gravite",title:"Gravité / criticité",items:["Niveau suggéré : modéré (environnement / conformité stockage).","Pas de blessé — pas d’escalade SST immédiate au-delà du signalement HSE."]},{id:"actions",title:"Suggestions d’actions",items:["Pompage / absorbants jusqu’à élimination des traces ; photo à joindre au dossier.","Analyse cause racine sous 48 h (joints, surcharge, maintenance).","Contrôle des équipements voisins et relevé cuves J-12 pour corrélation."]},{id:"analyse",title:"Analyse simple",items:["Facteurs probables : vieillissement joint / opération de transfert non conforme.","Facteurs organisationnels : à croiser avec planning maintenance et habilitations."]},{id:"direction",title:"Synthèse direction",items:["Message court : incident environnemental maîtrisé sur site, suivi des causes et preuves de clôture attendu sous une semaine."]}]),chute:br("SIM-2026-SST-02","Chute de hauteur — échafaudage",[{id:"resume",title:"Résumé incident",items:["Chute d’environ 1,8 m depuis plan de travail échafaudage zone B.","Blessé pris en charge ; EPI portés (harnais + longe — à vérifier au rapport officiel).","Arrêt de travail côté activité mock : journée."]},{id:"gravite",title:"Gravité / criticité",items:["Classification SST : à valider avec médecine du travail — gravité potentielle élevée si MTT.","Signal fort pour le plan de prévention hauteur du site."]},{id:"actions",title:"Suggestions d’actions",items:["Mise en sécurité immédiate : périmètre, accès échafaudage interdit jusqu’inspection.","Inspection structure, ancrages, garde-corps niveau N+1 par personne habilitée.","Briefing équipe hauteur + rappel procédure montage / démontage."]},{id:"analyse",title:"Analyse simple",items:["Piste : déplacement charge ou défaut garde-corps — à confirmer par enquête terrain.","Organisation : planning chargements / coactivité à examiner."]},{id:"direction",title:"Synthèse direction",items:["Priorité sécurité : incident avec arrêt ; décision attendue sur renforcement contrôles hauteur et communication multi-sites."]}]),nc_audit:br("SIM-2026-ISO-03","Non-conformité mineure — traçabilité déchets",[{id:"resume",title:"Résumé incident",items:["Constat : registre déchets incomplet sur deux mouvements (preuve documentaire manquante).","Contexte : audit interne / préparation certification ISO 14001 (mock)."]},{id:"gravite",title:"Gravité / criticité",items:["NC mineure documentaire — risque majeur environnemental non démontré sur la base des infos saisies.","Exposition audit externe : modérée si non clôturée avant prochaine visite."]},{id:"actions",title:"Suggestions d’actions",items:["Compléter le registre et joindre bons / pesées / BSD selon flux réel.","Rappel procédure aux agents et point de contrôle J+7 sur échantillon de mouvements.","Mettre à jour la matrice de preuves pour le dossier ISO."]},{id:"analyse",title:"Analyse simple",items:["Cause probable : surcharge administrative ou oubli de saisie terrain.","Système : renforcer double validation hiérarchique sur les sorties de site."]},{id:"direction",title:"Synthèse direction",items:["Message : écart documentaire sous contrôle si plan de clôture < 15 j ; pas d’impact image si traité vite et tracé."]}])};function Gu(e){return hr[e]?{...hr[e]}:{...hr.hydrocarbure}}function Uu(e){const t=[];return t.push("QHSE Control — sortie assistant (mock)"),t.push(`Réf. ${e.ref} — ${e.title}`),t.push(""),e.sections.forEach(a=>{t.push(`— ${a.title}`),a.items.forEach(r=>{t.push(`  • ${r}`)}),t.push("")}),t.push("(Données simulées — ne pas utiliser comme preuve réglementaire sans validation humaine.)"),t.join(`
`)}function Wu(e,t){e.innerHTML="",e.className="ai-sim-output ai-sim-output--filled";const a=document.createElement("header");a.className="ai-sim-result-head";const r=document.createElement("span");r.className="ai-sim-result-ref",r.textContent=t.ref;const n=document.createElement("h4");n.className="ai-sim-result-title",n.textContent=t.title,a.append(r,n);const i=document.createElement("div");i.className="ai-sim-result-body",t.sections.forEach(s=>{const c=document.createElement("section");c.className="ai-sim-section";const l=document.createElement("h5");l.className="ai-sim-section__title",l.textContent=s.title;const d=document.createElement("ul");d.className="ai-sim-section__list",s.items.forEach(u=>{const p=document.createElement("li");p.textContent=u,d.append(p)}),c.append(l,d),i.append(c)});const o=document.createElement("p");o.className="ai-sim-result-foot",o.textContent="Sortie générée en démonstration — validation humaine et rattachement au SI requis pour exploitation réelle.",e.append(a,i,o)}function Yu(e){return Uu(e)}const Qu=6,ti=[];function Ju(e){for(ti.unshift({...e,at:Date.now()});ti.length>Qu;)ti.pop()}function Ku(){return ti.map(e=>({...e}))}const Xu=[{id:"summary",label:"Résumé incident",title:"Synthèse terrain exploitable immédiatement",body:"Structuration automatique : faits, lieu, personnes exposées, mesures immédiates et périmètre — prête pour compte rendu HSE et déclarations internes.",foot:"Livrable type : paragraphe unique + puces pour les suites."},{id:"actions",label:"Suggestions d’actions",title:"Plan d’actions aligné criticité & ISO",body:"Propositions de mesures correctives / préventives, séquencement logique, rattachement aux plans d’actions et aux échéances déjà suivies sur le site.",foot:"Priorisation mock : SST → environnement → conformité documentaire."},{id:"analysis",label:"Analyse simple",title:"Facteurs et causes contributives",body:"Lecture structurée (technique + organisation) pour nourrir l’enquête sans la remplacer — points de vigilance pour auditeur ou comité.",foot:"Sortie : sections prêtes à copier dans le rapport d’investigation."},{id:"exec",label:"Synthèse direction",title:"Brief décisionnel QHSE",body:"Vue condensée : état du risque, tendance, décision attendue et message clé pour la revue de direction ou le comité trimestriel.",foot:"Ton adapté à une lecture exécutive (2–3 minutes)."}];function Zu(e){const t=document.createElement("article");t.className="ai-use-card";const a=document.createElement("span");a.className="ai-use-card__label",a.textContent=e.label;const r=document.createElement("h4");r.className="ai-use-card__title",r.textContent=e.title;const n=document.createElement("p");n.className="ai-use-card__body",n.textContent=e.body;const i=document.createElement("p");return i.className="ai-use-card__foot",i.textContent=e.foot,t.append(a,r,n,i),t}function em(e){try{return new Date(e).toLocaleString("fr-FR",{dateStyle:"short",timeStyle:"short"})}catch{return"—"}}function _o(e){e.innerHTML="";const t=Ku();if(t.length===0){const a=document.createElement("li");a.className="ai-sim-history__item",a.style.fontStyle="italic",a.style.color="var(--text3)",a.textContent="Aucune simulation dans cette session — lancez une analyse pour alimenter l’historique.",e.append(a);return}t.forEach(a=>{const r=document.createElement("li");r.className="ai-sim-history__item";const n=document.createElement("span");n.className="ai-sim-history__time",n.textContent=em(a.at);const i=document.createElement("span");i.className="ai-sim-history__ref",i.textContent=a.ref;const o=document.createElement("span");o.className="ai-sim-history__label",o.textContent=a.title,r.append(n,i,o),e.append(r)})}function tm(e){let t=null;const a=document.createElement("div");a.className="ai-sim-layout";const r=document.createElement("div");r.className="ai-sim-controls";const n=document.createElement("label");n.setAttribute("for","ai-scenario"),n.textContent="Scénario terrain";const i=document.createElement("select");i.id="ai-scenario",i.className="control-input",[["hydrocarbure","Fuite hydrocarbure — bac de rétention"],["chute","Chute de hauteur — échafaudage"],["nc_audit","Non-conformité audit — traçabilité déchets"]].forEach(([h,k])=>{const _=document.createElement("option");_.value=h,_.textContent=k,i.append(_)});const o=document.createElement("div");o.className="ai-sim-main";const s=document.createElement("div");s.className="ai-sim-output ai-sim-output--empty";const c=document.createElement("p");c.className="ai-sim-placeholder",c.textContent="Choisissez un scénario puis lancez la simulation. La sortie est structurée en sections (résumé, gravité, actions, analyse, synthèse direction) — aucun envoi réseau.",s.append(c);const l=document.createElement("div");l.className="ai-sim-toolbar";const d=document.createElement("button");d.type="button",d.className="btn btn-primary",d.textContent="Lancer la simulation";const u=document.createElement("button");u.type="button",u.className="text-button",u.textContent="Copier le texte",u.disabled=!0;const p=document.createElement("button");p.type="button",p.className="text-button",p.textContent="Enregistrer (démo)",p.disabled=!0;const g=document.createElement("p");g.className="ai-sim-hint",g.textContent="Copie = export brut pour rapport / mail. Enregistrer = trace dans le journal (mock).";function m(){t=Gu(i.value),s.className="ai-sim-output ai-sim-output--filled",Wu(s,t),u.disabled=!1,p.disabled=!1;const h=i.options[i.selectedIndex].text;Ju({scenarioLabel:h,title:t.title,ref:t.ref}),_o(v),C("Analyse générée (mock) — prête à être copiée ou enregistrée.","info"),typeof e=="function"&&e({module:"ai-center",action:"Simulation IA terrain",detail:`${t.ref} — ${h}`,user:"Copilote IA"})}d.addEventListener("click",()=>{(async()=>await Yt("security_zone",{contextLabel:"lancement d’une simulation IA (sortie locale)"})&&m())()}),u.addEventListener("click",async()=>{if(!t)return;const h=Yu(t);try{await navigator.clipboard.writeText(h),C("Texte copié dans le presse-papiers.","info")}catch{C("Copie impossible — sélectionnez le texte manuellement.","info")}}),p.addEventListener("click",()=>{t&&(C("Brouillon enregistré (démo) — à connecter au SI documentaire.","info"),typeof e=="function"&&e({module:"ai-center",action:"Enregistrement analyse IA",detail:`${t.ref} — ${t.title}`,user:"Responsable QHSE"}))}),l.append(d,u,p,g);const b=document.createElement("div");b.className="ai-sim-history";const y=document.createElement("p");y.className="ai-sim-history__title",y.textContent="Historique de session";const v=document.createElement("ul");return v.className="ai-sim-history__list",b.append(y,v),_o(v),r.append(n,i),o.append(s,l,b),a.append(r,o),a}function am(e){Bu(),qt();const t=document.createElement("section");t.className="page-stack ai-center-page";const a=document.createElement("article");a.className="content-card card-soft ai-hero",a.innerHTML=`
    <div class="content-card-head content-card-head--split">
      <div>
        <div class="section-kicker">Assistants</div>
        <h3>Centre IA — aide à la décision QHSE</h3>
        <p class="content-card-lead content-card-lead--narrow" style="display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-bottom:10px">
          <span style="font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;padding:5px 10px;border-radius:8px;border:1px solid var(--color-primary-border);color:var(--color-primary-text);background:var(--color-primary-bg)">Suggestion IA</span>
          <span style="font-size:13px;font-weight:700;color:var(--text2)">Toujours : humain = validation · jamais d’auto-décision</span>
        </p>
        <p class="content-card-lead content-card-lead--narrow">
          Assistants orientés terrain et audit : résumés d’incidents, plans d’actions, analyses structurées et briefs direction.
          Les sorties ci-dessous sont simulées pour démonstration client — aucune inférence réelle sur vos données.
        </p>
        <p class="content-card-lead content-card-lead--narrow ai-center-human-trust" style="margin-top:10px;padding:12px 14px;border-radius:12px;border:1px solid rgba(52,211,153,.25);background:rgba(34,197,94,.08);font-size:13px;line-height:1.5;color:var(--text2)">
          <strong style="color:#86efac">Validation humaine</strong> — chaque proposition reste une suggestion : copiez, adaptez ou ignorez avant toute décision ou enregistrement officiel.
        </p>
      </div>
      <button type="button" class="btn btn-primary btn--pilotage-cta ai-quick-run">Enregistrer une analyse (démo)</button>
    </div>
  `,a.querySelector(".ai-quick-run").addEventListener("click",()=>{C("Enregistrement : connecter au SI et au workflow HSE (démo).","info"),typeof e=="function"&&e({module:"ai-center",action:"Brouillon analyse IA",detail:"Action utilisateur — enregistrement simulé depuis le Centre IA",user:"Responsable QHSE"})});const r=document.createElement("div");r.className="ai-use-grid",Xu.forEach(i=>r.append(Zu(i)));const n=document.createElement("article");return n.className="content-card card-soft ai-sim-card",n.innerHTML=`
    <div class="content-card-head">
      <div>
        <div class="section-kicker">Simulation</div>
        <h3>Zone interactive — sortie structurée</h3>
        <p class="content-card-lead">
          Scénarios types prédéfinis : la simulation produit une fiche en sections (résumé, gravité, actions, analyse, synthèse direction) avec référence documentaire mock.
        </p>
      </div>
    </div>
  `,n.append(tm(e)),t.append(a,r,n),t}const wo="qhse-activity-log-styles",im=`
.activity-log-page .activity-log-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px;padding:10px 12px;border-radius:12px;background:rgba(0,0,0,.12);border:1px solid rgba(148,163,184,.1)}
.activity-log-page .activity-log-toolbar > span:first-child{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--text3)}
.activity-log-toolbar-note{font-size:13px;font-weight:600;color:var(--text2)}

.activity-log-summary{display:grid;grid-template-columns:minmax(140px,0.9fr) minmax(200px,1.4fr) minmax(140px,1fr);gap:12px;margin-bottom:14px}
@media (max-width:900px){.activity-log-summary{grid-template-columns:1fr}}
.activity-log-summary-card{border-radius:14px;border:1px solid rgba(148,163,184,.12);background:rgba(255,255,255,.03);padding:12px 14px;display:grid;gap:6px;min-width:0}
.activity-log-summary-card--stretch{min-height:100%}
.activity-log-summary-k{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3)}
.activity-log-summary-v{font-size:28px;font-weight:800;letter-spacing:-.03em;color:var(--text);line-height:1.1}
.activity-log-summary-v--sm{font-size:15px;font-weight:700;letter-spacing:-.01em}
.activity-log-summary-h{font-size:11px;color:var(--text3);line-height:1.35}
.activity-log-summary-chips{display:flex;flex-wrap:wrap;gap:6px;align-items:center;min-height:32px}
.activity-log-summary-chip{font-size:11px;font-weight:800;padding:5px 10px;border-radius:999px;border:1px solid rgba(148,163,184,.2);background:rgba(0,0,0,.15)}
.activity-log-summary-empty{font-size:12px;color:var(--text3);font-style:italic}
.activity-log-summary-chip.mod-incidents{color:var(--color-text-warning);border-color:var(--color-warning-border);background:var(--color-warning-bg)}
.activity-log-summary-chip.mod-actions{color:var(--color-text-warning);border-color:var(--color-warning-border);background:var(--color-warning-bg)}
.activity-log-summary-chip.mod-audits{color:var(--color-primary-text);border-color:var(--color-primary-border);background:var(--color-primary-bg)}
.activity-log-summary-chip.mod-iso{color:var(--color-primary-text);border-color:var(--color-primary-border);background:var(--color-primary-bg)}
.activity-log-summary-chip.mod-products{color:var(--color-primary-text);border-color:var(--color-primary-border);background:var(--color-primary-bg)}
.activity-log-summary-chip.mod-context{color:#cbd5e1;border-color:rgba(148,163,184,.3)}
.activity-log-summary-chip.mod-ai-center{color:var(--color-primary-text);border-color:var(--color-primary-border);background:var(--color-primary-bg)}
.activity-log-summary-chip.mod-system{color:#e2e8f0;border-color:rgba(203,213,225,.25)}
.activity-log-summary-chip.mod-default{color:var(--text2)}

.activity-log-quick{margin-bottom:16px;padding:14px 16px;border-radius:14px;border:1px solid rgba(148,163,184,.12);background:rgba(0,0,0,.06)}
.activity-log-quick-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 16px;margin-bottom:12px}
.activity-log-quick-title{font-size:10px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;color:var(--text3)}
.activity-log-period-toggle{display:flex;flex-wrap:wrap;gap:6px}
.activity-log-chip{font-size:11px;font-weight:700;padding:6px 12px;border-radius:999px;border:1px solid rgba(148,163,184,.25);background:transparent;color:var(--text2);cursor:pointer;transition:background .15s,border-color .15s,color .15s}
.activity-log-chip:hover{border-color:rgba(45,212,191,.4)}
.activity-log-chip--on{background:rgba(45,212,191,.15);border-color:rgba(45,212,191,.4);color:var(--text)}
.activity-log-quick-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.activity-log-quick-card{border-radius:12px;border:1px solid rgba(148,163,184,.12);background:rgba(255,255,255,.03);padding:10px 12px;display:flex;flex-direction:column;gap:4px;min-width:0}
.activity-log-quick-card--alert{border-color:rgba(239,68,68,.22);background:rgba(239,68,68,.06)}
.activity-log-quick-k{font-size:10px;font-weight:700;color:var(--text3);line-height:1.3}
.activity-log-quick-v{font-size:22px;font-weight:800;letter-spacing:-.03em;color:var(--text);line-height:1}
.activity-log-digest{margin:0 0 14px;padding:12px 14px;border-radius:12px;border-left:3px solid rgba(45,212,191,.45);background:rgba(45,212,191,.06);font-size:13px;font-weight:600;line-height:1.5;color:var(--text2)}
.activity-log-prefs{display:flex;flex-wrap:wrap;align-items:flex-start;gap:14px 20px;margin-bottom:14px;padding:12px 14px;border-radius:12px;border:1px dashed rgba(148,163,184,.22);background:rgba(0,0,0,.04)}
.activity-log-prefs-block{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;flex:1;min-width:200px}
.activity-log-prefs-k{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);width:100%}
.activity-log-prefs-select{min-width:140px}
.activity-log-prefs-check{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:var(--text2);cursor:pointer;flex:1;min-width:200px}
.activity-log-prefs-hint{margin:0;width:100%;font-size:11px;color:var(--text3);line-height:1.4}
.activity-log-filters{display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px 16px;margin-bottom:12px;padding:10px 12px;border-radius:12px;background:rgba(0,0,0,.1);border:1px solid rgba(148,163,184,.1)}
.activity-log-filters-k{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--text3);align-self:center;margin-right:4px}
.activity-log-filter-field{display:flex;flex-direction:column;gap:4px;font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.04em}
.activity-log-filter-field .control-select{min-width:160px}
.activity-log-export-row{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px}
.activity-log-summary-mount{margin-bottom:4px}

.activity-log-table{margin-top:4px;border-radius:14px;border:1px solid rgba(148,163,184,.12);overflow:hidden;display:flex;flex-direction:column}
.activity-log-head,.activity-log-row{display:grid;grid-template-columns:minmax(112px,1fr) minmax(130px,1.15fr) minmax(160px,1.5fr) minmax(108px,1fr) minmax(104px,.95fr);gap:12px;padding:12px 16px;align-items:start;font-size:12px}
.activity-log-empty-msg{width:100%;box-sizing:border-box;padding:28px 16px;text-align:center;font-size:13px;font-weight:600;color:var(--text3);background:rgba(0,0,0,.04);border-bottom:1px solid rgba(148,163,184,.08)}
.activity-log-head{font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--text3);background:rgba(0,0,0,.22);border-bottom:1px solid rgba(148,163,184,.18)}
.activity-log-row{border-bottom:1px solid rgba(148,163,184,.08);position:relative}
.activity-log-row:last-child{border-bottom:none}
.activity-log-row:nth-child(even){background:rgba(255,255,255,.025)}
.activity-log-row--clickable{cursor:pointer;transition:background .15s ease,transform .12s ease,box-shadow .15s ease}
.activity-log-row--clickable:hover{background:rgba(20,184,166,.09)!important;box-shadow:inset 0 0 0 1px rgba(45,212,191,.15)}
.activity-log-row--clickable:focus-visible{outline:2px solid rgba(45,212,191,.5);outline-offset:2px}
.activity-log-kind-badge{font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:2px 7px;border-radius:999px;border:1px solid rgba(148,163,184,.2);flex-shrink:0;line-height:1.2}
.activity-log-kind-badge--create{color:#0f766e;border-color:rgba(45,212,191,.35);background:rgba(45,212,191,.12)}
.activity-log-kind-badge--modify{color:#1d4ed8;border-color:rgba(59,130,246,.35);background:rgba(59,130,246,.1)}
.activity-log-kind-badge--close{color:#b45309;border-color:rgba(245,158,11,.4);background:rgba(245,158,11,.1)}
.activity-log-kind-badge--other{color:var(--text3);opacity:.88}
.activity-log-row--emphasis{background:rgba(20,184,166,.06)!important;border-left:3px solid rgba(20,184,166,.42);padding-left:13px;margin-left:0}
.activity-log-cell{display:flex;flex-direction:column;gap:6px;min-width:0}
.activity-log-module-badge{display:inline-flex;flex-direction:column;align-items:flex-start;gap:2px;padding:8px 10px;border-radius:12px;border:1px solid rgba(148,163,184,.15);background:rgba(0,0,0,.12);max-width:100%}
.activity-log-module-short{font-size:13px;font-weight:800;letter-spacing:.06em}
.activity-log-module-full{font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--text3);line-height:1.2}
.mod-incidents .activity-log-module-short{color:var(--color-text-warning)}
.mod-actions .activity-log-module-short{color:var(--color-text-warning)}
.mod-audits .activity-log-module-short{color:var(--color-primary-text)}
.mod-iso .activity-log-module-short{color:var(--color-primary-text)}
.mod-products .activity-log-module-short{color:var(--color-primary-text)}
.mod-context .activity-log-module-short{color:#94a3b8}
.mod-ai-center .activity-log-module-short{color:var(--color-primary-text)}
.mod-system .activity-log-module-short{color:#cbd5e1}
.mod-default .activity-log-module-short{color:var(--text2)}
.activity-log-action-wrap{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.activity-log-cell--action .activity-log-strong{font-weight:700;font-size:13px;color:var(--text);line-height:1.4}
.activity-log-importance{font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:3px 8px;border-radius:999px;background:rgba(20,184,166,.12);color:#5eead4;border:1px solid rgba(20,184,166,.25)}
.activity-log-cell--detail .activity-log-detail-text{font-size:12px;line-height:1.5;color:var(--text2)}
.activity-log-meta{font-size:12px;font-weight:600;color:var(--text)}
.activity-log-time{font-size:12px;color:var(--text2);font-variant-numeric:tabular-nums;font-weight:600}

.activity-log-extension-slot{margin-top:14px;padding:10px 12px;border-radius:12px;border:1px dashed rgba(148,163,184,.2);background:rgba(0,0,0,.08);display:flex;flex-wrap:wrap;gap:8px 14px;align-items:baseline}
.activity-log-extension-label{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3)}
.activity-log-extension-text{font-size:12px;color:var(--text3);line-height:1.45;max-width:62ch}

@media (max-width:900px){
  .activity-log-quick-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .activity-log-head{display:none}
  .activity-log-row{grid-template-columns:1fr;gap:10px;padding:16px;border-bottom:1px solid rgba(148,163,184,.1)}
  .activity-log-cell--module::before{content:'Module';font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
  .activity-log-cell--action::before{content:'Action';font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
  .activity-log-cell--detail::before{content:'Détail';font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
  .activity-log-cell--user::before{content:'Utilisateur';font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
  .activity-log-cell--time::before{content:'Date / heure';font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
}
@media (max-width:480px){
  .activity-log-quick-grid{grid-template-columns:1fr}
}
`;function rm(){if(document.getElementById(wo))return;const e=document.createElement("style");e.id=wo,e.textContent=im,document.head.append(e)}const nm={incidents:{label:"Incidents",short:"INC",className:"mod-incidents"},actions:{label:"Actions",short:"ACT",className:"mod-actions"},audits:{label:"Audits",short:"AUD",className:"mod-audits"},iso:{label:"Conformité ISO",short:"ISO",className:"mod-iso"},products:{label:"Produits / FDS",short:"PRD",className:"mod-products"},context:{label:"Contexte site",short:"CTX",className:"mod-context"},system:{label:"Système",short:"SYS",className:"mod-system"},"ai-center":{label:"Centre IA",short:"IA",className:"mod-ai-center"}};function Es(e){return nm[e]||{label:e||"—",short:"—",className:"mod-default"}}function Ns(e){if(!e)return"normal";const t=e.toLowerCase();return["créé","création","supprim","audit","conformité","initialis","changement de site","préparation","incident","sécurité"].some(r=>t.includes(r))?"high":"normal"}function om(e){const t=e.length,a=t&&e[0].timestamp||"—",r=[],n=new Set;for(let i=0;i<e.length&&r.length<6;i++){const o=e[i].module;o&&!n.has(o)&&(n.add(o),r.push(o))}return{total:t,lastActivity:a,recentModuleKeys:r}}function Ss(e,t){if(t==="all")return!0;const a=String(e.timestamp||""),r=/à l['\u2019]instant/i.test(a),n=/aujourd/i.test(a);return t==="24h"?r||n:t==="7j"?r||n||/semaine|cette semaine|7\s*derniers/i.test(a)?!0:!/^\d{2}\/\d{2}\/\d{4}/.test(a)&&!/^\d{4}-\d{2}-\d{2}/.test(a):!0}function an(e){const t=String(e||"").toLowerCase();return/(clôtur|fermé|clos|terminé|résolu|archiv)/i.test(t)?"close":/(créé|création|enregistré|ajouté|ouvert|lancé|nouveau|nouvelle)/i.test(t)?"create":/(modifi|mis à jour|affecté|changé|édité|mise à jour)/i.test(t)?"modify":"other"}function rn(e){const t=`${e.action||""} ${e.detail||""}`.toLowerCase();return!!(/critique|critical|sécurité|grave|majeur/.test(t)||e.module==="incidents"&&Ns(e.action)==="high")}function sm(e,t){const a=e.filter(c=>Ss(c,t));let r=0,n=0,i=0,o=0,s=0;return a.forEach(c=>{const l=an(c.action);if(c.module==="incidents"&&(l==="create"||/créé|création|enregistré/i.test(c.action||""))&&(r+=1),c.module==="actions"&&(l==="modify"||/modifi/i.test(c.action||""))&&(n+=1),c.module==="actions"){const d=`${c.action||""} ${c.detail||""}`.toLowerCase();/retard|échéance|en retard|dépass|depass|overdue|late/i.test(d)&&(s+=1)}c.module==="audits"&&(l==="create"||/lanc|prépar|planif|programmé|démarré|planifié/i.test(c.action||""))&&(i+=1),rn(c)&&(o+=1)}),{incCreated:r,actMod:n,audLaunched:i,crit:o,actLate:s}}function cm(e,t){const a=[];return e.crit>0&&a.push(`${e.crit} incident(s) ou anomalie(s) critique(s) sur ${t}`),e.incCreated>0&&a.push(`${e.incCreated} incident(s) créé(s)`),e.actLate>0&&a.push(`${e.actLate} action(s) en retard (mentions dans le journal)`),e.actMod>0&&a.push(`${e.actMod} action(s) modifiée(s)`),e.audLaunched>0&&a.push(`${e.audLaunched} mouvement(s) sur audits`),a.length===0?`Aucun fait marquant détecté sur ${t} avec les règles actuelles.`:`${a.join(" + ")}.`}function lm(e){const t=new Set;return e.forEach(a=>{a.user&&String(a.user).trim()&&t.add(String(a.user).trim())}),[...t].sort((a,r)=>a.localeCompare(r,"fr"))}function xr(e,t){return e.filter(a=>!(!Ss(a,t.period)||t.kind!=="all"&&an(a.action)!==t.kind||t.user&&String(a.user||"").trim()!==t.user||t.criticalOnly&&!rn(a)))}function dm(e){return{incidents:"incidents",actions:"actions",audits:"audits",iso:"iso",products:"products",context:"settings",system:"settings","ai-center":"ai-center"}[e]||"dashboard"}function pm(e){const t=document.createElement("div");t.className="activity-log-summary";const a=document.createElement("div");a.className="activity-log-summary-card",a.innerHTML=`
    <span class="activity-log-summary-k">Entrées enregistrées</span>
    <span class="activity-log-summary-v">${e.total}</span>
    <span class="activity-log-summary-h">Périmètre journal (mock)</span>
  `;const r=document.createElement("div");r.className="activity-log-summary-card activity-log-summary-card--stretch";const n=document.createElement("span");n.className="activity-log-summary-k",n.textContent="Modules récents";const i=document.createElement("div");if(i.className="activity-log-summary-chips",e.recentModuleKeys.length===0){const c=document.createElement("span");c.className="activity-log-summary-empty",c.textContent="Aucune entrée",i.append(c)}else e.recentModuleKeys.forEach(c=>{const l=Es(c),d=document.createElement("span");d.className=`activity-log-summary-chip ${l.className}`,d.title=l.label,d.textContent=l.short,i.append(d)});const o=document.createElement("span");o.className="activity-log-summary-h",o.textContent="D’après les dernières lignes (ordre temps décroissant)",r.append(n,i,o);const s=document.createElement("div");return s.className="activity-log-summary-card",s.innerHTML=`
    <span class="activity-log-summary-k">Dernière activité</span>
    <span class="activity-log-summary-v activity-log-summary-v--sm">${e.lastActivity}</span>
    <span class="activity-log-summary-h">Horodatage tel qu’affiché dans le journal</span>
  `,t.append(a,r,s),t}function um(e){const t=Es(e.module),a=Ns(e.action),r=an(e.action),n=document.createElement("article");n.className="activity-log-row activity-log-row--clickable",n.tabIndex=0,n.setAttribute("role","link"),n.setAttribute("aria-label",`Ouvrir le module ${t.label} — ${e.action||"entrée"}`),a==="high"&&n.classList.add("activity-log-row--emphasis");const i=()=>{window.location.hash=dm(e.module)};n.addEventListener("click",i),n.addEventListener("keydown",_=>{(_.key==="Enter"||_.key===" ")&&(_.preventDefault(),i())});const o=document.createElement("div");o.className="activity-log-cell activity-log-cell--module";const s=document.createElement("span");s.className=`activity-log-module-badge ${t.className}`,s.title=t.label;const c=document.createElement("span");c.className="activity-log-module-short",c.textContent=t.short;const l=document.createElement("span");l.className="activity-log-module-full",l.textContent=t.label,s.append(c,l),o.append(s);const d=document.createElement("div");d.className="activity-log-cell activity-log-cell--action";const u=document.createElement("div");u.className="activity-log-action-wrap";const p=document.createElement("span");p.className=`activity-log-kind-badge activity-log-kind-badge--${r}`,p.textContent=r==="create"?"Créé":r==="modify"?"Modifié":r==="close"?"Clôturé":"Autre",p.title="Type d’événement (classification locale pour lecture ISO)";const g=document.createElement("span");if(g.className="activity-log-strong",g.textContent=e.action||"—",u.append(p,g),a==="high"){const _=document.createElement("span");_.className="activity-log-importance",_.textContent="À suivre",_.title="Action ou événement sensible pour la traçabilité (règle mock)",u.append(_)}d.append(u);const m=document.createElement("div");m.className="activity-log-cell activity-log-cell--detail";const b=document.createElement("span");b.className="activity-log-detail-text",b.textContent=e.detail||"",m.append(b);const y=document.createElement("div");y.className="activity-log-cell activity-log-cell--user";const v=document.createElement("span");v.className="activity-log-meta",v.textContent=e.user||"—",y.append(v);const h=document.createElement("div");h.className="activity-log-cell activity-log-cell--time";const k=document.createElement("span");return k.className="activity-log-time",k.textContent=e.timestamp||"—",h.append(k),n.append(o,d,m,y,h),n}const Eo="qhse-activity-log-schedule",No="qhse-activity-log-export-scope",So="qhse-activity-log-critical-only";function mm(e){const t=document.createElement("div");t.className="activity-log-table",t.setAttribute("data-activity-log-table","");const a=document.createElement("div");if(a.className="activity-log-head",a.innerHTML=`
    <span>Module</span>
    <span>Action</span>
    <span>Détail</span>
    <span>Utilisateur</span>
    <span>Date / heure</span>
  `,t.append(a),!e.length){const r=document.createElement("div");return r.className="activity-log-empty-msg",r.setAttribute("role","status"),r.textContent="Aucune entrée ne correspond aux filtres.",t.append(r),t}return e.forEach(r=>{t.append(um(r))}),t}function gm(e){return e==="24h"?"24 h":e==="7j"?"7 jours":"tout l’historique affiché"}function bm(e){const a=o=>`"${String(o??"").replace(/"/g,'""')}"`,r=[["Module","Action","Détail","Utilisateur","Horodatage"].map(a).join(";")];e.forEach(o=>{r.push([o.module,o.action,o.detail,o.user,o.timestamp].map(a).join(";"))});const n=new Blob([`\uFEFF${r.join(`
`)}`],{type:"text/csv;charset=utf-8;"}),i=document.createElement("a");i.href=URL.createObjectURL(n),i.download=`journal-qhse-${new Date().toISOString().slice(0,10)}.csv`,i.click(),URL.revokeObjectURL(i.href)}function hm(e){const a=`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>Journal QHSE</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;padding:20px;font-size:11px;color:#111}
h1{font-size:16px;margin:0 0 12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f4f4f5;font-size:10px;text-transform:uppercase}
.foot{margin-top:16px;font-size:10px;color:#666}</style></head><body>
<h1>Journal des modifications — export</h1>
<table><thead><tr><th>Module</th><th>Action</th><th>Détail</th><th>Utilisateur</th><th>Date</th></tr></thead><tbody>${e.map(n=>`<tr><td>${ia(n.module)}</td><td>${ia(n.action)}</td><td>${ia(n.detail)}</td><td>${ia(n.user)}</td><td>${ia(n.timestamp)}</td></tr>`).join("")}</tbody></table>
<p class="foot">Généré le ${ia(new Date().toLocaleString("fr-FR"))} — impression ou « Enregistrer au format PDF ».</p>
<script>addEventListener('load',function(){setTimeout(function(){print()},200)})<\/script>
</body></html>`,r=window.open("","_blank");r&&(r.document.write(a),r.document.close())}function ia(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function xm(){rm();const e=document.createElement("section");e.className="page-stack activity-log-page";const t=document.createElement("article");t.className="content-card card-soft";const a=document.createElement("div");a.className="content-card-head",a.innerHTML=`
    <div>
      <div class="section-kicker">Traçabilité</div>
      <h3>Journal des modifications</h3>
      <p class="content-card-lead">
        Traçabilité ISO : synthèse, filtres et exports sur la piste locale — prête pour branchement serveur sans changer la structure des lignes.
      </p>
    </div>
  `;const r={period:"7j",kind:"all",user:"",criticalOnly:localStorage.getItem(So)==="1",schedule:localStorage.getItem(Eo)||"off",exportScope:localStorage.getItem(No)||"full"},n=document.createElement("div");n.className="activity-log-quick",n.innerHTML=`
    <div class="activity-log-quick-head">
      <span class="activity-log-quick-title">Résumé rapide</span>
      <div class="activity-log-period-toggle" role="group" aria-label="Période du résumé">
        <button type="button" class="activity-log-chip" data-period="24h">24 h</button>
        <button type="button" class="activity-log-chip activity-log-chip--on" data-period="7j">7 j</button>
        <button type="button" class="activity-log-chip" data-period="all">Tout</button>
      </div>
    </div>
    <div class="activity-log-quick-grid">
      <div class="activity-log-quick-card"><span class="activity-log-quick-k">Incidents créés</span><span class="activity-log-quick-v" data-quick="inc">0</span></div>
      <div class="activity-log-quick-card"><span class="activity-log-quick-k">Actions modifiées</span><span class="activity-log-quick-v" data-quick="act">0</span></div>
      <div class="activity-log-quick-card"><span class="activity-log-quick-k">Audits (lancés / prép.)</span><span class="activity-log-quick-v" data-quick="aud">0</span></div>
      <div class="activity-log-quick-card activity-log-quick-card--alert"><span class="activity-log-quick-k">Anomalies critiques</span><span class="activity-log-quick-v" data-quick="crit">0</span></div>
    </div>
  `;const i=document.createElement("p");i.className="activity-log-digest";const o=document.createElement("div");o.className="activity-log-prefs",o.innerHTML=`
    <div class="activity-log-prefs-block">
      <span class="activity-log-prefs-k">Envoi périodique (UI)</span>
      <select class="control-select activity-log-prefs-select" data-pref="schedule" aria-label="Fréquence d’envoi">
        <option value="off">Désactivé</option>
        <option value="weekly">Hebdomadaire</option>
        <option value="monthly">Mensuel</option>
      </select>
      <select class="control-select activity-log-prefs-select" data-pref="scope" aria-label="Contenu du futur envoi">
        <option value="anomalies">Anomalies seulement</option>
        <option value="actions">Actions</option>
        <option value="full">Complet</option>
      </select>
    </div>
    <label class="activity-log-prefs-check">
      <input type="checkbox" data-pref="critical" />
      <span>Alertes : événements critiques uniquement (réglage local)</span>
    </label>
    <p class="activity-log-prefs-hint">L’envoi automatique sera branché côté serveur — les choix sont mémorisés localement.</p>
  `;const s=document.createElement("div");s.className="activity-log-filters",s.innerHTML=`
    <span class="activity-log-filters-k">Filtres</span>
    <label class="activity-log-filter-field"><span>Type</span>
      <select class="control-select" data-filter="kind" aria-label="Filtrer par type d’événement">
        <option value="all">Tous</option>
        <option value="create">Création</option>
        <option value="modify">Modification</option>
        <option value="close">Clôture</option>
      </select>
    </label>
    <label class="activity-log-filter-field"><span>Utilisateur</span>
      <select class="control-select" data-filter="user" aria-label="Filtrer par utilisateur"><option value="">Tous</option></select>
    </label>
  `;const c=document.createElement("div");c.className="activity-log-export-row";const l=document.createElement("button");l.type="button",l.className="btn btn-secondary",l.textContent="Export Excel (CSV)";const d=document.createElement("button");d.type="button",d.className="btn btn-secondary",d.textContent="Export PDF",c.append(l,d);const u=document.createElement("div");u.className="activity-log-summary-mount";const p=document.createElement("div");p.className="activity-log-toolbar",p.setAttribute("role","note"),p.innerHTML=`
    <span>Journal filtré</span>
    <span class="activity-log-toolbar-note">Tri antichronologique · ligne cliquable vers le module · export = vue courante</span>
  `;const g=document.createElement("div");g.className="activity-log-table-mount";const m=document.createElement("div");m.className="activity-log-extension-slot",m.innerHTML=`
    <span class="activity-log-extension-label">Note ISO</span>
    <span class="activity-log-extension-text">Les horodatages textuels sont enrichis côté client à la prochaine évolution ; la structure module / action / détail / auteur reste stable pour audit.</span>
  `,t.append(a,n,i,o,s,c,u,p,g,m),e.append(t);const b=s.querySelector('[data-filter="user"]'),y=s.querySelector('[data-filter="kind"]'),v=o.querySelector('[data-pref="schedule"]'),h=o.querySelector('[data-pref="scope"]'),k=o.querySelector('[data-pref="critical"]');lm(Be.all()).forEach(w=>{const x=document.createElement("option");x.value=w,x.textContent=w,b.append(x)}),v.value=r.schedule,h.value=r.exportScope,k.checked=r.criticalOnly;function _(){n.querySelectorAll(".activity-log-chip[data-period]").forEach(w=>{w.classList.toggle("activity-log-chip--on",w.getAttribute("data-period")===r.period)})}function f(){const w=Be.all(),x=xr(w,{period:r.period,kind:r.kind,user:r.user,criticalOnly:r.criticalOnly}),S=sm(w,r.period);n.querySelector('[data-quick="inc"]').textContent=String(S.incCreated),n.querySelector('[data-quick="act"]').textContent=String(S.actMod),n.querySelector('[data-quick="aud"]').textContent=String(S.audLaunched),n.querySelector('[data-quick="crit"]').textContent=String(S.crit),i.textContent=cm(S,gm(r.period)),u.replaceChildren(pm(om(x))),g.replaceChildren(mm(x)),_()}n.querySelectorAll(".activity-log-chip[data-period]").forEach(w=>{w.addEventListener("click",()=>{r.period=w.getAttribute("data-period"),f()})}),y.addEventListener("change",()=>{r.kind=y.value,f()}),b.addEventListener("change",()=>{r.user=b.value,f()}),v.addEventListener("change",()=>{r.schedule=v.value,localStorage.setItem(Eo,r.schedule)}),h.addEventListener("change",()=>{r.exportScope=h.value,localStorage.setItem(No,r.exportScope)}),k.addEventListener("change",()=>{r.criticalOnly=k.checked,localStorage.setItem(So,r.criticalOnly?"1":"0"),f()});function E(w){return r.exportScope==="anomalies"?w.filter(x=>rn(x)):r.exportScope==="actions"?w.filter(x=>x.module==="actions"):w}return l.addEventListener("click",()=>{const w=Be.all(),x=xr(w,{period:r.period,kind:r.kind,user:r.user,criticalOnly:r.criticalOnly});bm(E(x))}),d.addEventListener("click",()=>{const w=Be.all(),x=xr(w,{period:r.period,kind:r.kind,user:r.user,criticalOnly:r.criticalOnly});hm(E(x))}),f(),e}const Co="qhse-settings-page-styles",fm=`
.settings-page{gap:1.5rem;display:flex;flex-direction:column;min-width:0}
.settings-page .settings-hero.content-card{
  border-radius:18px;border:1px solid rgba(125,211,252,.2);
  background:linear-gradient(165deg,rgba(255,255,255,.05) 0%,rgba(8,12,20,.4) 100%);
  box-shadow:0 18px 48px rgba(0,0,0,.22);
}
.settings-page .settings-hero .content-card-lead{max-width:62ch;line-height:1.55}
.settings-section{
  border-radius:16px;border:1px solid rgba(148,163,184,.12);
  background:rgba(0,0,0,.08);padding:20px 22px 22px;
  box-shadow:0 1px 0 rgba(255,255,255,.04) inset;
}
.settings-section__head{margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,.06)}
.settings-section__kicker{
  font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--text3);margin:0 0 6px;
}
.settings-section__title{margin:0;font-size:1.05rem;font-weight:800;letter-spacing:-.02em;color:var(--text)}
.settings-section__lead{margin:8px 0 0;font-size:13px;line-height:1.5;color:var(--text2);max-width:60ch}
.settings-grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
@media (max-width:800px){.settings-grid-2{grid-template-columns:1fr}}
.settings-link-card{
  display:flex;flex-direction:column;gap:10px;padding:16px 18px;border-radius:14px;
  border:1px solid rgba(148,163,184,.14);background:rgba(255,255,255,.03);text-align:left;min-height:0;
}
.settings-link-card__label{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.settings-link-card__title{margin:0;font-size:15px;font-weight:700;color:var(--text)}
.settings-link-card__desc{margin:0;font-size:13px;line-height:1.45;color:var(--text2);flex:1}
.settings-link-card .btn{align-self:flex-start;margin-top:4px}
.settings-alert-list{display:grid;gap:12px;margin-top:4px}
.settings-alert-row{
  display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;
  padding:14px 16px;border-radius:14px;border:1px solid rgba(148,163,184,.1);
  background:rgba(255,255,255,.02);
}
@media (max-width:640px){.settings-alert-row{grid-template-columns:1fr}}
.settings-alert-main{min-width:0}
.settings-alert-name{margin:0 0 4px;font-size:14px;font-weight:700;color:var(--text)}
.settings-alert-meta{margin:0;font-size:12px;line-height:1.45;color:var(--text3)}
.settings-alert-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.settings-tag{
  font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:4px 8px;border-radius:8px;
  border:1px solid rgba(148,163,184,.2);color:var(--text2);
}
.settings-tag--info{border-color:rgba(56,189,248,.35);color:#7dd3fc;background:rgba(56,189,248,.08)}
.settings-tag--warning{border-color:rgba(251,191,36,.4);color:#fde68a;background:rgba(251,191,36,.08)}
.settings-tag--critique{border-color:rgba(248,113,113,.45);color:#fecaca;background:rgba(248,113,113,.1)}
.settings-switch-wrap{display:flex;align-items:center;gap:10px;justify-content:flex-end}
.settings-switch{
  position:relative;width:44px;height:24px;border-radius:999px;border:1px solid rgba(148,163,184,.25);
  background:rgba(0,0,0,.25);cursor:pointer;padding:0;flex-shrink:0;
  transition:background .2s,border-color .2s;
}
.settings-switch[aria-checked="true"]{
  background:rgba(34,197,94,.25);border-color:rgba(34,197,94,.45);
}
.settings-switch::after{
  content:'';position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;
  background:var(--text);opacity:.9;transition:transform .2s;
}
.settings-switch[aria-checked="true"]::after{transform:translateX(20px);background:#86efac}
.settings-switch-label{font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em}
.settings-prefs-grid{display:grid;gap:12px;margin-top:8px}
.settings-pref-row{
  display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;
  padding:12px 14px;border-radius:12px;background:rgba(0,0,0,.12);border:1px solid rgba(148,163,184,.08);
}
.settings-pref-row span{font-size:13px;color:var(--text2)}
.settings-check-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:10px}
@media (max-width:700px){.settings-check-grid{grid-template-columns:1fr}}
.settings-check{
  display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border-radius:12px;
  border:1px solid rgba(148,163,184,.1);background:rgba(255,255,255,.02);cursor:pointer;font-size:13px;color:var(--text2);
  line-height:1.4;
}
.settings-check input{accent-color:#38bdf8;margin-top:2px;flex-shrink:0}
.settings-ia-grid{display:grid;gap:12px;margin-top:10px}
.settings-ia-module{
  padding:14px 16px;border-radius:14px;border:1px solid rgba(168,85,247,.2);
  background:linear-gradient(135deg,rgba(168,85,247,.06),rgba(255,255,255,.02));
}
.settings-ia-module__top{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
.settings-ia-module__name{margin:0;font-size:14px;font-weight:700;color:var(--text);min-width:0;flex:1}
.settings-badge-ia{
  font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;padding:4px 8px;border-radius:6px;
  color:#e9d5ff;background:rgba(168,85,247,.2);border:1px solid rgba(196,181,253,.35);
}
.settings-mode-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.settings-mode-btn{
  padding:8px 12px;border-radius:10px;border:1px solid rgba(148,163,184,.2);background:rgba(0,0,0,.15);
  color:var(--text2);font-size:12px;font-weight:600;cursor:pointer;
}
.settings-mode-btn--on{border-color:rgba(56,189,248,.45);color:#bae6fd;background:rgba(56,189,248,.12)}
.settings-ia-states{margin:12px 0 0;padding:10px 12px;border-radius:10px;border:1px dashed rgba(148,163,184,.15);font-size:12px;color:var(--text3);line-height:1.5}
.settings-cycle-stepper{
  display:flex;flex-wrap:wrap;gap:10px;margin:16px 0 18px;counter-reset:step;
}
.settings-cycle-step{
  flex:1;min-width:120px;padding:14px 14px 12px;border-radius:14px;
  border:1px solid rgba(148,163,184,.12);background:rgba(255,255,255,.025);position:relative;
}
.settings-cycle-step::before{
  counter-increment:step;content:counter(step);
  display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:10px;
  font-size:12px;font-weight:800;background:rgba(56,189,248,.15);color:#7dd3fc;margin-bottom:8px;
}
.settings-cycle-step__label{margin:0;font-size:12px;font-weight:700;color:var(--text);line-height:1.35}
.settings-cycle-step__hint{margin:6px 0 0;font-size:11px;line-height:1.4;color:var(--text3)}
.settings-status-legend{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.settings-pill{
  font-size:11px;font-weight:600;padding:6px 10px;border-radius:999px;border:1px solid rgba(148,163,184,.15);color:var(--text2);
}
.settings-pill--muted{opacity:.85}
.settings-human-row{
  display:flex;flex-wrap:wrap;gap:10px;margin-top:14px;padding:12px 14px;border-radius:12px;
  background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.2);
}
.settings-human-row span{font-size:12px;font-weight:700;color:#86efac;letter-spacing:.02em}
.settings-actions-bar{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}
/* —— HQ / premium layer (additive — classes existantes inchangées) —— */
.settings-page--hq{gap:1.75rem}
.settings-page--hq .settings-section{
  padding:22px 24px 24px;border-radius:18px;
  border:1px solid rgba(148,163,184,.14);
  background:linear-gradient(165deg,rgba(255,255,255,.035) 0%,rgba(0,0,0,.1) 100%);
  box-shadow:0 14px 40px rgba(0,0,0,.18),0 1px 0 rgba(255,255,255,.05) inset;
}
.settings-page--hq .settings-section__head{
  margin-bottom:16px;padding-bottom:14px;
  border-bottom:1px solid rgba(148,163,184,.1);
}
.settings-hero-premium{padding:2px 2px 4px}
.settings-hero-premium__top{max-width:68ch}
.settings-hero-premium__eyebrow{
  display:inline-flex;align-items:center;gap:8px;
  font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#94a3b8;margin:0 0 10px;
}
.settings-hero-premium__eyebrow::before{
  content:'';width:6px;height:6px;border-radius:50%;background:linear-gradient(135deg,#38bdf8,#a78bfa);
  box-shadow:0 0 12px rgba(56,189,248,.5);
}
.settings-hero-premium__title{
  margin:0 0 14px;font-size:var(--type-page-title-size,clamp(1.55rem,2.8vw,2rem));font-weight:800;letter-spacing:-.03em;line-height:1.18;color:var(--text);
}
.settings-hero-premium__lead{
  margin:0;font-size:14px;line-height:1.6;color:var(--text2);max-width:62ch;
}
.settings-hero-premium__meta{
  display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;
}
.settings-hero-chip{
  font-size:11px;font-weight:600;padding:6px 11px;border-radius:999px;
  border:1px solid rgba(148,163,184,.18);color:var(--text2);
  background:rgba(0,0,0,.12);
}
.settings-hero-premium__meta--note{margin-top:10px;opacity:.92}
.settings-hero-chip--note{
  font-size:10px;font-weight:600;opacity:.88;
  border-color:rgba(148,163,184,.12);background:rgba(0,0,0,.08);color:var(--text3);
}
.settings-cycle-bridge + .settings-subsection{
  margin-top:12px;padding-top:0;border-top:none;
}
.settings-toc{
  display:flex;flex-wrap:wrap;gap:8px;margin-top:20px;padding-top:18px;
  border-top:1px solid rgba(148,163,184,.12);
}
.settings-toc__btn{
  border:1px solid rgba(148,163,184,.16);background:rgba(255,255,255,.03);
  color:var(--text2);font-size:12px;font-weight:600;padding:8px 12px;border-radius:10px;cursor:pointer;
  transition:border-color .15s,background .15s,color .15s;
}
.settings-toc__btn:hover{
  border-color:rgba(56,189,248,.35);color:#e2e8f0;background:rgba(56,189,248,.08);
}
.settings-subsection{margin-top:20px;padding-top:18px;border-top:1px solid rgba(148,163,184,.08)}
.settings-subsection:first-of-type{margin-top:0;padding-top:0;border-top:none}
.settings-subsection__title{
  margin:0 0 6px;font-size:13px;font-weight:800;letter-spacing:-.01em;color:var(--text);
}
.settings-subsection__lead{margin:0 0 14px;font-size:12.5px;line-height:1.5;color:var(--text3);max-width:62ch}
.settings-cycle-bridge{
  display:grid;gap:12px;margin:14px 0 18px;padding:14px 16px;border-radius:14px;
  border:1px solid rgba(56,189,248,.2);background:rgba(56,189,248,.06);
}
.settings-cycle-bridge__title{margin:0;font-size:12px;font-weight:800;color:#bae6fd;letter-spacing:.04em;text-transform:uppercase}
.settings-cycle-bridge__text{margin:0;font-size:12.5px;line-height:1.55;color:var(--text2)}
.settings-usage-matrix{display:grid;gap:12px;margin-top:4px}
@media (min-width:900px){.settings-usage-matrix{grid-template-columns:repeat(2,minmax(0,1fr))}}
.settings-usage-card{
  display:flex;flex-direction:column;gap:12px;padding:14px 16px;border-radius:14px;
  border:1px solid rgba(148,163,184,.12);background:rgba(0,0,0,.1);
}
.settings-usage-card__title{margin:0;font-size:13px;font-weight:700;color:var(--text)}
.settings-usage-card__hint{margin:0;font-size:11.5px;line-height:1.45;color:var(--text3)}
.settings-usage-card__row{display:flex;flex-wrap:wrap;align-items:center;gap:10px;justify-content:space-between}
.settings-usage-card__row label{font-size:12px;color:var(--text2);font-weight:600}
.settings-usage-card__row select.control-input{min-width:160px;max-width:100%;font-size:12px;padding:8px 10px}
.settings-cycle-map{
  display:flex;flex-wrap:wrap;align-items:center;gap:8px 6px;margin:18px 0 8px;font-size:11px;font-weight:700;color:var(--text3);
}
.settings-cycle-map__step{
  padding:8px 11px;border-radius:10px;border:1px solid rgba(148,163,184,.14);
  background:rgba(255,255,255,.03);color:var(--text2);
}
.settings-cycle-map__arrow{color:var(--text3);font-weight:800;opacity:.7}
.settings-status-pills{margin-top:14px}
.settings-status-pills__cap{margin:0 0 8px;font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.08em}
.settings-pill--watch{border-color:rgba(56,189,248,.35);color:#bae6fd;background:rgba(56,189,248,.1)}
.settings-pill--fix{border-color:rgba(251,191,36,.4);color:#fde68a;background:rgba(251,191,36,.1)}
.settings-pill--done{border-color:rgba(52,211,153,.4);color:#a7f3d0;background:rgba(52,211,153,.08)}
.settings-pill--verify{border-color:rgba(167,139,250,.4);color:#ddd6fe;background:rgba(167,139,250,.1)}
.settings-pill--ok{border-color:rgba(34,197,94,.4);color:#bbf7d0;background:rgba(34,197,94,.1)}
.settings-pill--reject{border-color:rgba(248,113,113,.4);color:#fecaca;background:rgba(248,113,113,.12)}
.settings-show-reject-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;
  margin-top:12px;padding:12px 14px;border-radius:12px;background:rgba(0,0,0,.1);border:1px solid rgba(148,163,184,.08);
}
.settings-show-reject-row span{font-size:12px;color:var(--text2);max-width:42ch;line-height:1.45}
.settings-org-context-bar{margin-top:16px;padding-top:18px;border-top:1px solid rgba(148,163,184,.1)}
.settings-org-context-bar__cap{margin:0 0 10px;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3)}
.settings-org-context-bar__actions{display:flex;flex-wrap:wrap;gap:10px}
.settings-ia-human-pattern{
  display:flex;flex-wrap:wrap;align-items:center;gap:12px 18px;margin:14px 0 16px;
  padding:14px 16px;border-radius:14px;border:1px solid rgba(168,85,247,.22);
  background:rgba(168,85,247,.07);
}
.settings-ia-human-pattern__cta{
  font-size:12px;font-weight:800;color:#e9d5ff;letter-spacing:.03em;
}
.settings-ia-state-strip{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.settings-ia-state-chip{
  font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 9px;border-radius:8px;
  border:1px solid rgba(148,163,184,.18);color:var(--text3);background:rgba(0,0,0,.12);
}
.settings-section--cycle-premium{
  border-color:rgba(56,189,248,.16);
  background:linear-gradient(165deg,rgba(56,189,248,.06) 0%,rgba(0,0,0,.1) 55%,rgba(167,139,250,.04) 100%);
  box-shadow:0 16px 44px rgba(0,0,0,.2),0 1px 0 rgba(255,255,255,.06) inset;
}
.settings-cycle-parcours{
  margin:4px 0 20px;padding:20px 18px 18px;border-radius:16px;
  border:1px solid rgba(56,189,248,.22);
  background:linear-gradient(180deg,rgba(56,189,248,.1),rgba(8,12,18,.35));
}
.settings-cycle-parcours__title{
  margin:0 0 16px;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#7dd3fc;
}
.settings-cycle-rail{
  display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:12px 8px;
  position:relative;padding:10px 4px 6px;
}
.settings-cycle-rail::before{
  content:'';position:absolute;left:6%;right:6%;top:20px;height:2px;z-index:0;
  background:linear-gradient(90deg,rgba(56,189,248,.2),rgba(167,139,250,.35),rgba(34,197,94,.25));
  border-radius:2px;
}
.settings-cycle-rail__step{
  flex:1;min-width:72px;max-width:140px;position:relative;z-index:1;
  display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;
}
.settings-cycle-rail__dot{
  width:13px;height:13px;border-radius:50%;
  background:linear-gradient(135deg,#38bdf8,#4ade80);
  box-shadow:0 0 0 4px rgba(8,12,20,.88),0 0 16px rgba(56,189,248,.35);
  flex-shrink:0;
}
.settings-cycle-rail__name{font-size:11px;font-weight:800;color:var(--text);line-height:1.2;letter-spacing:-.01em}
.settings-cycle-rail__hint{font-size:10px;font-weight:500;color:var(--text3);line-height:1.35;max-width:13ch}
@media (max-width:700px){
  .settings-cycle-rail::before{display:none}
  .settings-cycle-rail{flex-direction:column;align-items:stretch;padding-left:12px;border-left:2px solid rgba(56,189,248,.25)}
  .settings-cycle-rail__step{flex-direction:row;max-width:none;align-items:center;text-align:left;gap:12px}
  .settings-cycle-rail__hint{max-width:none;flex:1}
}
.settings-section--sensitive-access .settings-sensitive-access-toolbar{margin-bottom:8px}
.settings-sensitive-access-master{align-items:center}
.settings-sensitive-access-hint{margin:8px 0 0;font-size:12.5px;line-height:1.5;color:var(--text2);max-width:72ch}
.settings-sensitive-actions-grid{display:grid;gap:12px;margin-top:8px}
.settings-sensitive-action-row{
  display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:12px 16px;
  padding:12px 14px;border-radius:14px;border:1px solid rgba(148,163,184,.12);background:rgba(0,0,0,.06);
}
.settings-sensitive-action-row strong{display:block;font-size:13px;font-weight:700;color:var(--text)}
.settings-sensitive-action-hint{margin:6px 0 0;font-size:12px;line-height:1.45;color:var(--text3);max-width:52ch}
.settings-sensitive-pin-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 16px;max-width:420px}
@media (max-width:520px){.settings-sensitive-pin-grid{grid-template-columns:1fr}}
.settings-sensitive-select-label{flex:1;min-width:0;font-size:13px;font-weight:600;color:var(--text2)}
.settings-subsection__lead--tight{margin-top:6px;font-size:12.5px;line-height:1.5;color:var(--text3)}
`;function vm(){if(document.getElementById(Co))return;const e=document.createElement("style");e.id=Co,e.textContent=fm,document.head.append(e)}const Ao="qhse_cfg_alerts_v1",fr="qhse_cfg_notif_v1",zo="qhse_cfg_export_pdf_v1",vr="qhse_cfg_ia_modules_v1",Na="qhse_cfg_control_cycle_v1",$o="qhse_cfg_cycle_usage_v1";function ra(e,t){try{const a=localStorage.getItem(e);if(!a)return{...t};const r=JSON.parse(a);return r&&typeof r=="object"?r:{...t}}catch{return{...t}}}function ht(e,t){try{localStorage.setItem(e,JSON.stringify(t))}catch{C("Enregistrement local impossible (navigateur).","warning")}}const ym=[{id:"al-1",name:"Actions en retard",condition:"Échéance dépassée > 7 j (paramétrage serveur à brancher)",level:"warning",channel:"app",on:!0},{id:"al-2",name:"Incident critique ouvert",condition:"Gravité critique et statut non clos",level:"critique",channel:"email",on:!0},{id:"al-3",name:"Nouvelle non-conformité majeure",condition:"NC créée depuis audit — classement majeur",level:"critique",channel:"app",on:!1},{id:"al-4",name:"Rapport périodique PDF",condition:"Synthèse hebdomadaire (planification serveur)",level:"info",channel:"pdf",on:!1}],km=[["a_controler","À contrôler"],["a_corriger","À corriger"],["corrige","Corrigé"],["a_verifier","À vérifier"],["valide","Validé"],["rejete","Rejeté"]],Cs=[{key:"aiExtract",title:"Extraction IA (document)",hint:"Exemple : sortie structurée à valider avant publication au référentiel."},{key:"iaSuggest",title:"Suggestion IA",hint:"Exemple : proposition à corriger ou reformuler avant application."},{key:"importDoc",title:"Import documentaire",hint:"Exemple : fiche importée — contrôle puis validation après correction si besoin."},{key:"autoExtract",title:"Extraction automatique",hint:"Exemple : champs pré-remplis — passage souvent en « à vérifier »."},{key:"ecartNc",title:"Écart / non-conformité",hint:"Exemple : constat — typiquement « à corriger » avec preuves attendues."},{key:"audit",title:"Audits & constats",hint:"Exemple : preuves et réponses — contrôle humain avant clôture."},{key:"preuve",title:"Preuve / document à vérifier",hint:"Exemple : pièce jointe — état « à vérifier » jusqu’à visa."}],yr={aiExtract:{defaultStatus:"a_controler",humanRequired:!0},iaSuggest:{defaultStatus:"a_corriger",humanRequired:!0},importDoc:{defaultStatus:"a_controler",humanRequired:!0},autoExtract:{defaultStatus:"a_verifier",humanRequired:!0},ecartNc:{defaultStatus:"a_corriger",humanRequired:!0},audit:{defaultStatus:"a_controler",humanRequired:!0},preuve:{defaultStatus:"a_verifier",humanRequired:!0}};function _m(e){const t={...yr};return Cs.forEach(({key:a})=>{const r=e&&typeof e[a]=="object"?e[a]:{};t[a]={defaultStatus:typeof r.defaultStatus=="string"?r.defaultStatus:yr[a].defaultStatus,humanRequired:typeof r.humanRequired=="boolean"?r.humanRequired:yr[a].humanRequired}}),t}function wm(e){return e==="critique"?"settings-tag--critique":e==="warning"?"settings-tag--warning":"settings-tag--info"}function Em(e){return e==="email"?"E-mail":e==="pdf"?"PDF":"Application"}function Nm(e,t,a){e.replaceChildren(),t.forEach(r=>{const n=document.createElement("div");n.className="settings-alert-row";const i=document.createElement("div");i.className="settings-alert-main";const o=document.createElement("p");o.className="settings-alert-name",o.textContent=r.name;const s=document.createElement("p");s.className="settings-alert-meta",s.textContent=r.condition;const c=document.createElement("div");c.className="settings-alert-tags";const l=document.createElement("span");l.className=`settings-tag ${wm(r.level)}`,l.textContent=r.level;const d=document.createElement("span");d.className="settings-tag",d.textContent=Em(r.channel),c.append(l,d),i.append(o,s,c);const u=document.createElement("div");u.className="settings-switch-wrap";const p=document.createElement("span");p.className="settings-switch-label",p.textContent=r.on?"Actif":"Inactif";const g=document.createElement("button");g.type="button",g.className="settings-switch",g.setAttribute("role","switch"),g.setAttribute("aria-checked",r.on?"true":"false"),g.setAttribute("aria-label",`Alerte ${r.name}`),g.addEventListener("click",()=>{const m=t.map(b=>b.id===r.id?{...b,on:!b.on}:b);a(m)}),u.append(p,g),n.append(i,u),e.append(n)})}function Ia(e){window.location.hash=e}const As="qhse_import_intent_v1";function Sm(e){try{sessionStorage.setItem(As,e)}catch{}Ia("imports")}function Cm(){try{sessionStorage.removeItem(As)}catch{}Ia("imports")}function Am(e){const t=document.getElementById(e);t&&typeof t.scrollIntoView=="function"&&t.scrollIntoView({behavior:"smooth",block:"start"})}function zm(){var Ae,ze,Pe,We,O;vm(),qt();const e=document.createElement("section");e.className="page-stack settings-page settings-page--hq";const t=document.createElement("article");t.className="content-card card-soft settings-hero",t.innerHTML=`
    <div class="settings-hero-premium">
      <div class="settings-hero-premium__top">
        <p class="settings-hero-premium__eyebrow">Espace configuration</p>
        <h1 class="settings-hero-premium__title">Paramètres &amp; pilotage QHSE</h1>
        <p class="settings-hero-premium__lead">
          Cadre central pour l’organisation, la veille, les notifications, les exports, les référentiels,
          la gouvernance IA et le cycle de maîtrise (détection → clôture). Les réglages ci-dessous sont
          enregistrés localement dans le navigateur (démo) — prêts à être reliés à une API paramètres.
        </p>
        <div class="settings-hero-premium__meta" aria-hidden="true">
          <span class="settings-hero-chip">Piloter · Agir · Contrôler</span>
          <span class="settings-hero-chip">Corriger · Prouver · Décider</span>
          <span class="settings-hero-chip">IA sous validation humaine</span>
        </div>
        <div class="settings-hero-premium__meta settings-hero-premium__meta--note" aria-hidden="true">
          <span class="settings-hero-chip settings-hero-chip--note">Persistance locale (navigateur)</span>
          <span class="settings-hero-chip settings-hero-chip--note">Modules &amp; routes existants préservés</span>
        </div>
      </div>
      <nav class="settings-toc" aria-label="Accès aux sections"></nav>
    </div>
  `;const a=t.querySelector(".settings-toc");[{id:"settings-anchor-org",label:"Organisation"},{id:"settings-anchor-alerts",label:"Alertes"},{id:"settings-anchor-notif",label:"Notifications"},{id:"settings-anchor-exports",label:"Exports"},{id:"settings-anchor-security-access",label:"Sécurité & accès"},{id:"settings-anchor-ref",label:"Référentiels"},{id:"settings-anchor-ia",label:"IA"},{id:"settings-anchor-cycle",label:"Maîtrise"}].forEach(({id:M,label:U})=>{const J=document.createElement("button");J.type="button",J.className="settings-toc__btn",J.textContent=U,J.addEventListener("click",()=>Am(M)),a==null||a.append(J)});const n=document.createElement("section");n.className="settings-section",n.id="settings-anchor-org",n.setAttribute("aria-labelledby","settings-org-title"),n.innerHTML=`
    <header class="settings-section__head">
      <p class="settings-section__kicker">A · Organisation &amp; sites</p>
      <h4 class="settings-section__title" id="settings-org-title">Organisation &amp; sites</h4>
      <p class="settings-section__lead">
        Référentiel des sites et import documentaire : mêmes écrans, mêmes routes (#sites, #imports) et mêmes droits.
        Le périmètre actif reste piloté depuis le pied de menu latéral.
      </p>
    </header>
    <div class="settings-grid-2" data-settings-org-grid></div>
    <div class="settings-org-context-bar" data-settings-org-context></div>
  `;const i=n.querySelector("[data-settings-org-grid]"),o=document.createElement("div");o.className="settings-link-card",o.innerHTML=`
    <span class="settings-link-card__label">Référentiel</span>
    <h5 class="settings-link-card__title">Sites &amp; périmètres</h5>
    <p class="settings-link-card__desc">Sites, codes et rattachement des modules opérationnels.</p>
  `;const s=document.createElement("button");s.type="button",s.className="btn btn-primary",s.textContent="Ouvrir Sites",s.addEventListener("click",()=>Ia("sites")),o.append(s);const c=Me();c&&!yt(c.role,"sites")&&(s.disabled=!0,s.title="Accès réservé pour votre profil",s.style.opacity="0.55");const l=document.createElement("div");l.className="settings-link-card",l.innerHTML=`
    <span class="settings-link-card__label">Documents</span>
    <h5 class="settings-link-card__title">Import de documents</h5>
    <p class="settings-link-card__desc">Chargement, pré-analyse et brouillon — validation sur le module cible.</p>
  `;const d=document.createElement("button");d.type="button",d.className="btn btn-secondary",d.textContent="Ouvrir Import",d.addEventListener("click",()=>Cm()),l.append(d),c&&!yt(c.role,"imports")&&(d.disabled=!0,d.title="Accès réservé pour votre profil",d.style.opacity="0.55"),i&&i.append(o,l);const u=n.querySelector("[data-settings-org-context]");if(u){let J=function(te,Z){const le=document.createElement("button");return le.type="button",le.className="btn btn-secondary",le.textContent=te,le.addEventListener("click",()=>Sm(Z)),c&&!yt(c.role,"imports")&&(le.disabled=!0,le.title="Accès réservé pour votre profil",le.style.opacity="0.55"),le};var ve=J;const M=document.createElement("p");M.className="settings-org-context-bar__cap",M.textContent="Imports contextuels (préparation)";const U=document.createElement("div");U.className="settings-org-context-bar__actions",U.append(J("Import orienté risques","risks"),J("Import FDS / produits","fds"),J("Import ISO / exigences","iso")),u.append(M,U)}const p=ra(Ao,{});let g=Array.isArray(p.list)&&p.list.length?p.list:[...ym];const m=document.createElement("section");m.className="settings-section",m.id="settings-anchor-alerts",m.innerHTML=`
    <header class="settings-section__head">
      <p class="settings-section__kicker">B · Alertes intelligentes</p>
      <h4 class="settings-section__title">Alertes intelligentes</h4>
      <p class="settings-section__lead">
        Règles et niveaux de criticité (maquette). L’évaluation réelle des conditions restera côté serveur.
      </p>
    </header>
    <div class="settings-alert-list" data-settings-alerts></div>
    <div class="settings-actions-bar">
      <button type="button" class="btn btn-secondary" data-settings-add-alert>Créer une alerte</button>
    </div>
  `;const b=m.querySelector("[data-settings-alerts]");function y(){ht(Ao,{list:g})}function v(){b&&Nm(b,g,M=>{g=M,y(),v()})}v(),(Ae=m.querySelector("[data-settings-add-alert]"))==null||Ae.addEventListener("click",()=>{const M=`al-${Date.now()}`;g=[...g,{id:M,name:"Nouvelle alerte",condition:"Condition à définir (placeholder)",level:"info",channel:"app",on:!0}],y(),v(),C("Alerte ajoutée (locale). Branchez la création sur l’API.","info")});let h={minLevel:"warning",digest:!0,push:!1,...ra(fr,{})};const k=document.createElement("section");k.className="settings-section",k.id="settings-anchor-notif",k.innerHTML=`
    <header class="settings-section__head">
      <p class="settings-section__kicker">C · Notifications</p>
      <h4 class="settings-section__title">Notifications</h4>
      <p class="settings-section__lead">
        Filtres d’affichage dans l’application (mock). Le centre de notifications existant n’est pas modifié.
      </p>
    </header>
    <div class="settings-prefs-grid" data-settings-notif></div>
  `;const _=k.querySelector("[data-settings-notif]");function f(M,U,J,te){const Z=document.createElement("div");Z.className="settings-pref-row";const le=document.createElement("span");if(le.textContent=M,Z.append(le),J==="select"){const be=document.createElement("select");be.className="control-input",te.forEach(([ye,Ie])=>{const $e=document.createElement("option");$e.value=ye,$e.textContent=Ie,be.append($e)}),be.value=h[U]||te[0][0],be.addEventListener("change",()=>{h={...h,[U]:be.value},ht(fr,h),C("Préférence enregistrée (navigateur).","info")}),Z.append(be)}else{const be=document.createElement("button");be.type="button",be.className="settings-switch",be.setAttribute("role","switch"),be.setAttribute("aria-label",`${M} — ${h[U]?"activé":"désactivé"}`),be.setAttribute("aria-checked",h[U]?"true":"false"),be.addEventListener("click",()=>{const ye=!h[U];h={...h,[U]:ye},be.setAttribute("aria-checked",ye?"true":"false"),be.setAttribute("aria-label",`${M} — ${ye?"activé":"désactivé"}`),ht(fr,h),C("Préférence enregistrée (navigateur).","info")}),Z.append(be)}return Z}_.append(f("Niveau minimum affiché","minLevel","select",[["info","Info et plus"],["warning","Avertissement et plus"],["critique","Critique uniquement"]]),f("Digest quotidien (e-mail)","digest","toggle"),f("Notifications push navigateur","push","toggle"));let E=ra(zo,{audits:!0,nc:!0,actions:!0,incidents:!0,iso:!1});const w=document.createElement("section");w.className="settings-section",w.id="settings-anchor-exports",w.innerHTML=`
    <header class="settings-section__head">
      <p class="settings-section__kicker">D · Exports &amp; rapports</p>
      <h4 class="settings-section__title">Exports &amp; rapports PDF</h4>
      <p class="settings-section__lead">
        Chapitres inclus dans les futurs modèles de synthèse (UI seule ; génération réelle côté serveur).
      </p>
    </header>
    <div class="settings-check-grid" data-settings-export></div>
  `;const x=w.querySelector("[data-settings-export]");[["audits","Audits & constats"],["nc","Non-conformités"],["actions","Plan d’actions"],["incidents","Incidents"],["iso","Synthèse ISO / exigences"]].forEach(([M,U])=>{const J=document.createElement("label");J.className="settings-check";const te=document.createElement("input");te.type="checkbox",te.checked=!!E[M],te.addEventListener("change",()=>{E={...E,[M]:te.checked},ht(zo,E)});const Z=document.createElement("span");Z.textContent=U,J.append(te,Z),x.append(J)});let N=Ir();const L=document.createElement("section");L.className="settings-section settings-section--sensitive-access",L.id="settings-anchor-security-access",L.innerHTML=`
    <header class="settings-section__head">
      <p class="settings-section__kicker">H · Sécurité &amp; accès</p>
      <h4 class="settings-section__title">Code de vérification (accès renforcé)</h4>
      <p class="settings-section__lead">
        Optionnel : code à 6 chiffres sur les actions que vous cochez. Par défaut : une demande par session navigateur (recommandé pour limiter les interruptions).
        Le Centre IA peut être exclu (décoché par défaut). Stockage local — à remplacer par une politique serveur / SSO en production.
      </p>
    </header>
    <div class="settings-sensitive-access-toolbar">
      <div class="settings-pref-row settings-sensitive-access-master">
        <span>Activer le code renforcé</span>
        <button type="button" class="settings-switch" role="switch" data-sa-master aria-label="Activer accès renforcé"></button>
      </div>
      <p class="settings-sensitive-access-hint" data-sa-status></p>
    </div>
    <div class="settings-subsection" data-sa-actions-wrap>
      <h5 class="settings-subsection__title">Types d’actions concernés</h5>
      <p class="settings-subsection__lead">Décochez pour laisser une catégorie sans demande de code (tant que le renfort est actif).</p>
      <div class="settings-sensitive-actions-grid" data-sa-actions></div>
    </div>
    <div class="settings-subsection" data-sa-freq-wrap>
      <h5 class="settings-subsection__title">Fréquence de la demande</h5>
      <p class="settings-subsection__lead settings-subsection__lead--tight">
        Une fois le code accepté, les actions protégées peuvent être débloquées pour toute la session (ou 15 min), selon votre choix.
      </p>
      <div class="settings-pref-row">
        <label class="settings-sensitive-select-label" for="settings-sa-frequency">Politique après saisie correcte</label>
        <select id="settings-sa-frequency" class="control-input" data-sa-frequency>
          <option value="per_session">Une fois par session (recommandé)</option>
          <option value="interval_15m">Au plus une fois toutes les 15 minutes</option>
          <option value="always">À chaque action protégée</option>
        </select>
      </div>
    </div>
    <div class="settings-subsection" data-sa-level-wrap>
      <h5 class="settings-subsection__title">Niveau de protection</h5>
      <div class="settings-pref-row">
        <label class="settings-sensitive-select-label" for="settings-sa-level">Affichage modal</label>
        <select id="settings-sa-level" class="control-input" data-sa-level>
          <option value="standard">Standard (sobre)</option>
          <option value="strict">Strict (rappel visuel renforcé)</option>
        </select>
      </div>
    </div>
    <div class="settings-subsection">
      <h5 class="settings-subsection__title">Code à 6 chiffres</h5>
      <p class="settings-subsection__lead">Même code pour toutes les actions cochées. Ne pas réutiliser un code bancaire.</p>
      <div class="settings-sensitive-pin-grid">
        <label class="field">
          <span>Nouveau code</span>
          <input type="password" class="control-input" data-sa-pin-a maxlength="6" inputmode="numeric" pattern="[0-9]*" autocomplete="new-password" placeholder="••••••" />
        </label>
        <label class="field">
          <span>Confirmer</span>
          <input type="password" class="control-input" data-sa-pin-b maxlength="6" inputmode="numeric" pattern="[0-9]*" autocomplete="new-password" placeholder="••••••" />
        </label>
      </div>
      <div class="settings-actions-bar" style="margin-top:12px">
        <button type="button" class="btn btn-primary" data-sa-pin-save>Enregistrer le code</button>
        <button type="button" class="btn btn-secondary" data-sa-pin-clear>Retirer le code</button>
      </div>
    </div>
  `;const D=L.querySelector("[data-sa-master]"),q=L.querySelector("[data-sa-status]"),W=L.querySelector("[data-sa-actions]"),K=L.querySelector("[data-sa-frequency]"),A=L.querySelector("[data-sa-level]"),I=L.querySelector("[data-sa-pin-a]"),z=L.querySelector("[data-sa-pin-b]"),R=L.querySelector("[data-sa-actions-wrap]"),V=L.querySelector("[data-sa-freq-wrap]"),oe=L.querySelector("[data-sa-level-wrap]");function ge(){ap(N)}function B(){if(N=Ir(),D&&D.setAttribute("aria-checked",N.enabled?"true":"false"),q){const U=Qr();q.textContent=N.enabled?U?"Code enregistré — les actions cochées demanderont le code selon la fréquence choisie.":"Renfort activé mais aucun code : les actions protégées seront bloquées jusqu’à enregistrement d’un code.":"Accès renforcé désactivé — aucune demande de code."}const M=N.enabled;[R,V,oe].forEach(U=>{U&&(U.style.opacity=M?"1":"0.5")}),K&&(K.disabled=!M),A&&(A.disabled=!M),W&&W.querySelectorAll(".settings-switch").forEach(U=>{U.toggleAttribute("disabled",!M)}),K&&(K.value=N.frequency),A&&(A.value=N.protectionLevel)}lo.forEach(({key:M,label:U,hint:J})=>{const te=document.createElement("div");te.className="settings-sensitive-action-row";const Z=document.createElement("div"),le=document.createElement("strong");le.textContent=U;const be=document.createElement("p");be.className="settings-sensitive-action-hint",be.textContent=J,Z.append(le,be);const ye=document.createElement("button");ye.type="button",ye.className="settings-switch",ye.setAttribute("role","switch"),ye.setAttribute("data-sa-act",M),ye.setAttribute("aria-label",U),ye.addEventListener("click",()=>{if(!N.enabled)return;const Ie=!!N.actions[M];N={...N,actions:{...N.actions,[M]:!Ie}},ye.setAttribute("aria-checked",Ie?"false":"true"),ge(),wa(),B(),C("Paramètre enregistré (navigateur).","info")}),te.append(Z,ye),W==null||W.append(te)}),D==null||D.addEventListener("click",()=>{const M=!N.enabled;N={...N,enabled:M},ge(),M||wa(),B(),C(M?"Accès renforcé activé.":"Accès renforcé désactivé.","info")}),K==null||K.addEventListener("change",()=>{const M=K.value;(M==="always"||M==="per_session"||M==="interval_15m")&&(N={...N,frequency:M},ge(),wa(),C("Fréquence enregistrée — prochaine action demandera le code si nécessaire.","info"))}),A==null||A.addEventListener("change",()=>{const M=A.value==="strict"?"strict":"standard";N={...N,protectionLevel:M},ge(),C("Niveau enregistré.","info")}),(ze=L.querySelector("[data-sa-pin-save]"))==null||ze.addEventListener("click",()=>{const M=String((I==null?void 0:I.value)||"").replace(/\D/g,""),U=String((z==null?void 0:z.value)||"").replace(/\D/g,"");if(M.length!==6||U.length!==6){C("Saisissez deux fois un code à exactement 6 chiffres.","warning");return}if(M!==U){C("Les deux saisies ne correspondent pas.","warning");return}po(M),wa(),I&&(I.value=""),z&&(z.value=""),B(),C("Code enregistré localement.","info")}),(Pe=L.querySelector("[data-sa-pin-clear]"))==null||Pe.addEventListener("click",()=>{po(""),wa(),I&&(I.value=""),z&&(z.value=""),B(),C("Code retiré.","info")}),B(),lo.forEach(({key:M})=>{const U=L.querySelector(`[data-sa-act="${M}"]`);U&&U.setAttribute("aria-checked",N.actions[M]?"true":"false")});const re=document.createElement("section");re.className="settings-section",re.id="settings-anchor-ref",re.innerHTML=`
    <header class="settings-section__head">
      <p class="settings-section__kicker">E · Référentiels</p>
      <h4 class="settings-section__title">Référentiels</h4>
      <p class="settings-section__lead">
        Accès aux modules conformité et produits déjà en place (exigences, FDS, preuves).
      </p>
    </header>
    <div class="settings-actions-bar">
      <button type="button" class="btn btn-primary" data-settings-goto-iso>Ouvrir ISO &amp; Conformité</button>
      <button type="button" class="btn btn-secondary" data-settings-goto-products>Ouvrir Produits / FDS</button>
    </div>
  `,(We=re.querySelector("[data-settings-goto-iso]"))==null||We.addEventListener("click",()=>Ia("iso")),(O=re.querySelector("[data-settings-goto-products]"))==null||O.addEventListener("click",()=>Ia("products"));const se={iso:{enabled:!0,mode:"human"},imports:{enabled:!0,mode:"human"},audits:{enabled:!0,mode:"suggest"},risks:{enabled:!1,mode:"suggest"},aiCenter:{enabled:!0,mode:"suggest"}};let F={...se,...ra(vr,{})};const H=document.createElement("section");H.className="settings-section",H.id="settings-anchor-ia",H.innerHTML=`
    <header class="settings-section__head">
      <p class="settings-section__kicker">F · IA &amp; validation humaine</p>
      <h4 class="settings-section__title">IA &amp; validation humaine</h4>
      <p class="settings-section__lead">
        L’IA propose ; l’humain valide, ajuste ou rejette. Les flux métiers (imports, NC, audits) restent sur leurs écrans —
        ce bloc fixe la politique affichée côté configuration.
      </p>
    </header>
    <div class="settings-ia-human-pattern">
      <span class="settings-badge-ia">Suggestion IA</span>
      <span class="settings-ia-human-pattern__cta">Valider · Modifier · Rejeter</span>
      <div class="settings-ia-state-strip">
        <span class="settings-ia-state-chip">En attente</span>
        <span class="settings-ia-state-chip">Validé</span>
        <span class="settings-ia-state-chip">Modifié</span>
        <span class="settings-ia-state-chip">Rejeté</span>
      </div>
    </div>
    <div class="settings-human-row" role="note">
      <span>Flux cible</span>
      <span style="color:var(--text3);font-weight:600">→</span>
      <span>Détection · contrôle humain · correction · vérification · clôture</span>
    </div>
    <div class="settings-ia-grid" data-settings-ia></div>
    <p class="settings-ia-states">
      <strong>Statuts de pilotage (maquette locale) :</strong>
      en attente · validé · modifié · rejeté — à synchroniser avec les workflows NC, imports et audits côté API.
    </p>
  `;const G=H.querySelector("[data-settings-ia]"),X=[{key:"iso",label:"ISO & Conformité (assistance exigence)"},{key:"imports",label:"Import documents (extraction)"},{key:"audits",label:"Audits & constats"},{key:"risks",label:"Risques"},{key:"aiCenter",label:"Centre IA (simulations)"}];function $(){G&&(G.replaceChildren(),X.forEach(({key:M,label:U})=>{const te={...se[M]||{enabled:!0,mode:"human"},...typeof F[M]=="object"&&F[M]?F[M]:{}},Z=document.createElement("div");Z.className="settings-ia-module";const le=document.createElement("div");le.className="settings-ia-module__top";const be=document.createElement("p");be.className="settings-ia-module__name",be.textContent=U;const ye=document.createElement("span");ye.className="settings-badge-ia",ye.textContent="Suggestion IA";const Ie=document.createElement("button");Ie.type="button",Ie.className="settings-switch",Ie.setAttribute("role","switch"),Ie.setAttribute("aria-checked",te.enabled?"true":"false"),Ie.setAttribute("aria-label",`Activer IA ${U}`),Ie.addEventListener("click",()=>{F={...F,[M]:{...te,enabled:!te.enabled}},ht(vr,F),$()}),le.append(be,ye,Ie);const $e=document.createElement("div");$e.className="settings-mode-row",[["suggest","Suggestion seule"],["human","Validation humaine obligatoire"]].forEach(([De,xe])=>{const qe=document.createElement("button");qe.type="button",qe.className=`settings-mode-btn${te.mode===De?" settings-mode-btn--on":""}`,qe.textContent=xe,qe.addEventListener("click",()=>{F={...F,[M]:{...te,mode:De}},ht(vr,F),$()}),$e.append(qe)}),Z.append(le,$e),G.append(Z)}))}$();let T={controlRequired:!0,correctionRequired:!0,revalidateAfterFix:!0,revalidateScope:"full",showRejectedInViews:!0,controllerRole:"Responsable qualité",correctorRole:"Opérationnel terrain",validatorRole:"Direction / QHSE",...ra(Na,{})};(!T.revalidateScope||typeof T.revalidateScope!="string")&&(T={...T,revalidateScope:"full"});let j=_m(ra($o,{}));const Y=document.createElement("section");Y.className="settings-section settings-section--cycle-premium",Y.id="settings-anchor-cycle",Y.innerHTML=`
    <header class="settings-section__head">
      <p class="settings-section__kicker">G · Phases de contrôle et correction</p>
      <h4 class="settings-section__title">Phases de contrôle et de correction</h4>
      <p class="settings-section__lead">
        Pilotage crédible : détection, <strong>contrôle humain</strong>, correction, vérification, clôture — pour
        <strong>prouver</strong> et <strong>décider</strong> sans sacrifier la traçabilité. Paramètres d’intention (local) prêts pour l’API.
      </p>
    </header>
    <div class="settings-cycle-parcours">
      <p class="settings-cycle-parcours__title">Parcours de maîtrise</p>
      <div class="settings-cycle-rail" role="img" aria-label="Cinq phases : détection, contrôle humain, correction, vérification, clôture">
        <div class="settings-cycle-rail__step">
          <span class="settings-cycle-rail__dot" aria-hidden="true"></span>
          <span class="settings-cycle-rail__name">Détection</span>
          <span class="settings-cycle-rail__hint">Signaux, imports, IA</span>
        </div>
        <div class="settings-cycle-rail__step">
          <span class="settings-cycle-rail__dot" aria-hidden="true"></span>
          <span class="settings-cycle-rail__name">Contrôle humain</span>
          <span class="settings-cycle-rail__hint">Revue &amp; arbitrage</span>
        </div>
        <div class="settings-cycle-rail__step">
          <span class="settings-cycle-rail__dot" aria-hidden="true"></span>
          <span class="settings-cycle-rail__name">Correction</span>
          <span class="settings-cycle-rail__hint">Actions &amp; plans</span>
        </div>
        <div class="settings-cycle-rail__step">
          <span class="settings-cycle-rail__dot" aria-hidden="true"></span>
          <span class="settings-cycle-rail__name">Vérification</span>
          <span class="settings-cycle-rail__hint">Preuves &amp; relecture</span>
        </div>
        <div class="settings-cycle-rail__step">
          <span class="settings-cycle-rail__dot" aria-hidden="true"></span>
          <span class="settings-cycle-rail__name">Clôture</span>
          <span class="settings-cycle-rail__hint">Validation finale</span>
        </div>
      </div>
    </div>
    <div class="settings-cycle-bridge">
      <p class="settings-cycle-bridge__title">Lecture transverse</p>
      <p class="settings-cycle-bridge__text">
        Les statuts <strong>à contrôler</strong>, <strong>à corriger</strong>, <strong>corrigé</strong>,
        <strong>à vérifier</strong>, <strong>validé</strong> et <strong>rejeté</strong> matérialisent l’avancement
        sur les flux IA, imports, extractions, écarts, audits et preuves — avec contrôle humain aux passages critiques.
      </p>
    </div>
    <div class="settings-subsection">
      <h5 class="settings-subsection__title">Applications par type d’usage</h5>
      <p class="settings-subsection__lead">
        Statut initial proposé à la création et obligation de passage humain (maquette locale — pas d’appel API).
      </p>
      <div class="settings-usage-matrix" data-settings-usage-matrix></div>
    </div>
    <div class="settings-subsection">
      <h5 class="settings-subsection__title">Chaîne opératoire</h5>
      <p class="settings-subsection__lead">Repère visuel aligné sur les étapes du cycle de maîtrise.</p>
      <div class="settings-cycle-map" aria-hidden="true">
        <span class="settings-cycle-map__step">1 · Détection</span>
        <span class="settings-cycle-map__arrow">→</span>
        <span class="settings-cycle-map__step">2 · Contrôle humain</span>
        <span class="settings-cycle-map__arrow">→</span>
        <span class="settings-cycle-map__step">3 · Correction</span>
        <span class="settings-cycle-map__arrow">→</span>
        <span class="settings-cycle-map__step">4 · Vérification</span>
        <span class="settings-cycle-map__arrow">→</span>
        <span class="settings-cycle-map__step">5 · Clôture</span>
      </div>
      <div class="settings-cycle-stepper" role="list">
        <div class="settings-cycle-step" role="listitem">
          <p class="settings-cycle-step__label">Détection</p>
          <p class="settings-cycle-step__hint">Signaux, imports, IA, audits</p>
        </div>
        <div class="settings-cycle-step" role="listitem">
          <p class="settings-cycle-step__label">Contrôle humain</p>
          <p class="settings-cycle-step__hint">Revue &amp; arbitrage</p>
        </div>
        <div class="settings-cycle-step" role="listitem">
          <p class="settings-cycle-step__label">Correction</p>
          <p class="settings-cycle-step__hint">Plans d’actions</p>
        </div>
        <div class="settings-cycle-step" role="listitem">
          <p class="settings-cycle-step__label">Vérification</p>
          <p class="settings-cycle-step__hint">Preuves &amp; relecture</p>
        </div>
        <div class="settings-cycle-step" role="listitem">
          <p class="settings-cycle-step__label">Clôture</p>
          <p class="settings-cycle-step__hint">Validation finale</p>
        </div>
      </div>
    </div>
    <div class="settings-subsection">
      <h5 class="settings-subsection__title">Règles globales du cycle</h5>
      <p class="settings-subsection__lead">Interrupteurs d’intention — exécution métier inchangée sur les pages existantes.</p>
      <div class="settings-prefs-grid" data-settings-cycle-toggles></div>
      <div class="settings-pref-row" data-settings-revalidate-scope-wrap style="margin-top:10px"></div>
      <div class="settings-show-reject-row">
        <span>Afficher le statut <strong>Rejeté</strong> dans les vues de suivi (listes, badges, exports futurs).</span>
        <button type="button" class="settings-switch" role="switch" data-settings-cycle-reject-switch aria-label="Afficher rejeté"></button>
      </div>
    </div>
    <div class="settings-subsection">
      <h5 class="settings-subsection__title">Rôles responsables (libellés indicatifs)</h5>
      <p class="settings-subsection__lead">Contrôle, correction et validation finale — à mapper sur vos rôles SI.</p>
      <div class="settings-prefs-grid" data-settings-cycle-roles></div>
    </div>
    <div class="settings-subsection">
      <p class="settings-status-pills__cap">Statuts de suivi</p>
      <div class="settings-status-legend settings-status-pills" data-settings-status-pills>
        <span class="settings-pill settings-pill--watch">À contrôler</span>
        <span class="settings-pill settings-pill--fix">À corriger</span>
        <span class="settings-pill settings-pill--done">Corrigé</span>
        <span class="settings-pill settings-pill--verify">À vérifier</span>
        <span class="settings-pill settings-pill--ok">Validé</span>
        <span class="settings-pill settings-pill--reject settings-pill--muted">Rejeté</span>
      </div>
    </div>
  `;const ne=Y.querySelector("[data-settings-usage-matrix]");function ae(){ht($o,j)}function de(){ne&&(ne.replaceChildren(),Cs.forEach(({key:M,title:U,hint:J})=>{const te=j[M],Z=document.createElement("div");Z.className="settings-usage-card";const le=document.createElement("p");le.className="settings-usage-card__title",le.textContent=U;const be=document.createElement("p");be.className="settings-usage-card__hint",be.textContent=J;const ye=document.createElement("div");ye.className="settings-usage-card__row";const Ie=document.createElement("label");Ie.htmlFor=`settings-usage-st-${M}`,Ie.textContent="Statut initial cible";const $e=document.createElement("select");$e.id=`settings-usage-st-${M}`,$e.className="control-input",km.forEach(([qe,je])=>{const at=document.createElement("option");at.value=qe,at.textContent=je,$e.append(at)}),$e.value=te.defaultStatus,$e.addEventListener("change",()=>{j={...j,[M]:{...te,defaultStatus:$e.value}},ae(),C("Paramètre enregistré (navigateur).","info")}),ye.append(Ie,$e);const me=document.createElement("div");me.className="settings-usage-card__row";const De=document.createElement("span");De.textContent="Contrôle humain requis avant diffusion";const xe=document.createElement("button");xe.type="button",xe.className="settings-switch",xe.setAttribute("role","switch"),xe.setAttribute("aria-checked",te.humanRequired?"true":"false"),xe.setAttribute("aria-label",`Contrôle humain pour ${U}`),xe.addEventListener("click",()=>{const qe=!j[M].humanRequired;j={...j,[M]:{...j[M],humanRequired:qe}},xe.setAttribute("aria-checked",qe?"true":"false"),ae(),C("Paramètre enregistré (navigateur).","info")}),me.append(De,xe),Z.append(le,be,ye,me),ne.append(Z)}))}de();const he=Y.querySelector("[data-settings-cycle-toggles]");he&&[["controlRequired","Contrôle humain obligatoire"],["correctionRequired","Correction obligatoire"],["revalidateAfterFix","Revalidation après correction"]].forEach(([M,U])=>{const J=document.createElement("div");J.className="settings-pref-row";const te=document.createElement("span");te.textContent=U;const Z=document.createElement("button");Z.type="button",Z.className="settings-switch",Z.setAttribute("role","switch"),Z.setAttribute("aria-label",`${U} — ${T[M]?"activé":"désactivé"}`),Z.setAttribute("aria-checked",T[M]?"true":"false"),Z.addEventListener("click",()=>{const le=!T[M];T={...T,[M]:le},Z.setAttribute("aria-checked",le?"true":"false"),Z.setAttribute("aria-label",`${U} — ${le?"activé":"désactivé"}`),ht(Na,T),C("Paramètre cycle enregistré (navigateur).","info")}),J.append(te,Z),he.append(J)});const fe=Y.querySelector("[data-settings-revalidate-scope-wrap]");if(fe){const M=document.createElement("span");M.style.maxWidth="48ch",M.style.lineHeight="1.45",M.innerHTML='<strong style="color:var(--text)">Portée de la revalidation</strong> après correction <span style="opacity:.8;font-weight:500">(maquette locale)</span>';const U=document.createElement("select");U.className="control-input",U.setAttribute("aria-label","Portée de la revalidation après correction"),[["full","Relecture complète des preuves"],["targeted","Points sensibles uniquement"],["procedural","Contrôle documentaire (sans terrain)"]].forEach(([J,te])=>{const Z=document.createElement("option");Z.value=J,Z.textContent=te,U.append(Z)}),U.value=["full","targeted","procedural"].includes(String(T.revalidateScope))?String(T.revalidateScope):"full",U.addEventListener("change",()=>{T={...T,revalidateScope:U.value},ht(Na,T),C("Portée de revalidation enregistrée (navigateur).","info")}),fe.append(M,U)}const _e=Y.querySelector("[data-settings-cycle-reject-switch]");_e&&(_e.setAttribute("aria-checked",T.showRejectedInViews!==!1?"true":"false"),_e.addEventListener("click",()=>{const M=T.showRejectedInViews===!1;T={...T,showRejectedInViews:M},_e.setAttribute("aria-checked",M?"true":"false"),ht(Na,T),C("Préférence enregistrée (navigateur).","info")}));const Ee=Y.querySelector("[data-settings-cycle-roles]");return Ee&&[["controllerRole","Rôle responsable du contrôle"],["correctorRole","Rôle responsable de la correction"],["validatorRole","Rôle validation / clôture"]].forEach(([M,U])=>{const J=document.createElement("div");J.className="settings-pref-row",J.style.flexDirection="column",J.style.alignItems="stretch";const te=document.createElement("span");te.textContent=U;const Z=document.createElement("input");Z.type="text",Z.className="control-input",Z.value=String(T[M]||""),Z.addEventListener("change",()=>{T={...T,[M]:Z.value},ht(Na,T)}),J.append(te,Z),Ee.append(J)}),e.append(t,n,m,k,w,L,re,H,Y),e}function $m(e){switch(e){case"analysis_only":return"Analyse seule";case"validated":return"Import validé";case"failed":return"Échec validation";case"analysis_failed":return"Échec analyse";default:return e?String(e):"—"}}const qo="qhse_import_intent_v1";function qm(){var n;let e="";try{e=sessionStorage.getItem(qo)||""}catch{return null}const a={risks:{title:"Contexte actif : risques",desc:"Orientation import vers enrichissement du registre risques — extraction IA indicative, validation humaine requise avant enregistrement."},fds:{title:"Contexte actif : FDS / produits",desc:"Orientation import vers Produits / FDS — même flux fichier ; rattachement et visa côté module cible."},iso:{title:"Contexte actif : ISO / exigences",desc:"Orientation import vers SMS & exigences — preuves et documents maîtrisés sous contrôle humain."}}[e];if(!a)return null;const r=document.createElement("article");return r.className="content-card card-soft",r.style.marginBottom="14px",r.style.border="1px solid rgba(167,139,250,.28)",r.style.background="linear-gradient(135deg,rgba(167,139,250,.1),rgba(255,255,255,.02))",r.setAttribute("data-import-context-banner","1"),r.innerHTML=`
    <div class="content-card-head content-card-head--split" style="align-items:flex-start;gap:12px">
      <div>
        <div class="section-kicker">Import contextuel</div>
        <h3 style="margin:0 0 8px;font-size:15px">${a.title}</h3>
        <p class="content-card-lead" style="margin:0;max-width:58ch;font-size:13px;line-height:1.55;color:var(--text2)">${a.desc}</p>
      </div>
      <button type="button" class="btn btn-secondary" data-import-context-dismiss>Fermer le contexte</button>
    </div>
  `,(n=r.querySelector("[data-import-context-dismiss]"))==null||n.addEventListener("click",()=>{try{sessionStorage.removeItem(qo)}catch{}r.remove()}),r}function zs(e){switch(e){case"audit":return"Audit";case"incident":return"Incident";case"fds":return"FDS / produit";case"iso":return"Document ISO / SMS";case"unknown":return"Inconnu / non classé";default:return e?String(e):"—"}}function Lm(e){const t=e.suggestedModule,a=t&&(t.label||t.pageId)?`${t.label??"—"}${t.pageId?` (module : ${t.pageId})`:""}`:"—",r=Array.isArray(e.detectedHints)?e.detectedHints.slice(0,8):[],n=r.length>0?["Indices repérés :",...r.map(l=>`  • ${l}`),""]:["Indices repérés : —",""],i=e.detectedDocumentType!==void 0?["— — —","Pré-analyse métier (indicatif)",`Type document suggéré : ${zs(e.detectedDocumentType)}`,`Confiance : ${typeof e.confidence=="number"?`${e.confidence} %`:"—"}`,`Module suggéré : ${a}`,...n,"— — —",""]:[],o=e.prefillData&&typeof e.prefillData=="object"?["Brouillon préremplissage (à valider manuellement)",JSON.stringify(e.prefillData,null,2),Array.isArray(e.missingFields)&&e.missingFields.length?`Champs probablement manquants : ${e.missingFields.join(", ")}`:"","— — —",""]:[],s=[e.importHistoryId?`Trace import : ${e.importHistoryId}`:"",`Format fichier : ${e.fileType??e.detectedType??"—"}`,`Fichier : ${e.originalName??"—"}`,`MIME : ${e.mimeType??"—"}`,`Métadonnées : ${JSON.stringify(e.meta??{},null,2)}`,...i,...o],c=e.preview;return(c==null?void 0:c.kind)==="text"?s.push(c.text??""):(c==null?void 0:c.kind)==="sheet"?(s.push(`Feuilles : ${(c.sheetNames||[]).join(", ")}`,`Feuille active : ${c.activeSheet??"—"}`,`Lignes (aperçu) : ${Array.isArray(c.rows)?c.rows.length:0}`,""),(c.rows||[]).forEach(l=>{s.push(Array.isArray(l)?l.join("	"):String(l))}),c.truncated&&s.push(`
[… lignes ou colonnes tronquées]`)):s.push(JSON.stringify(e,null,2)),s.join(`
`)}function Im(){qt();const e=Me(),t=lt(e==null?void 0:e.role,"imports","write"),a=lt(e==null?void 0:e.role,"imports","read");let r=null;const n=document.createElement("section");n.className="page-stack";const i=document.createElement("article");i.className="content-card card-soft",i.style.marginBottom="14px",i.style.border="1px solid rgba(125,211,252,.22)",i.style.background="linear-gradient(135deg,rgba(56,189,248,.08),rgba(255,255,255,.02))",i.innerHTML=`
    <div class="content-card-head">
      <div>
        <div class="section-kicker">Feuille de route</div>
        <h3 style="margin:0 0 8px;font-size:16px">Imports contextuels (préparation)</h3>
        <p class="content-card-lead" style="margin:0;max-width:62ch;font-size:13px;line-height:1.55;color:var(--text2)">
          Prochaine étape : déclencher l’import depuis <strong>Risques</strong>, <strong>Produits / FDS</strong> et <strong>ISO &amp; Conformité</strong>, avec extraction assistée puis
          <strong>validation humaine</strong> systématique. Cette page centrale reste le point d’entrée fichier unique.
        </p>
      </div>
    </div>
  `,n.append(i);const o=qm();o&&n.append(o);const s=document.createElement("article");s.className="content-card card-soft",s.innerHTML=`
    <div class="content-card-head">
      <div>
        <div class="section-kicker">Documents</div>
        <h3>Import intelligent — phase 1</h3>
        <p class="content-card-lead" style="margin:0;max-width:54ch;font-size:14px;line-height:1.5;color:var(--text2)">
          PDF ou Excel : aperçu brut, pré-analyse et brouillon de préremplissage indicatif — rien n’est enregistré sans votre validation sur le module cible.
        </p>
      </div>
    </div>
  `;const c=document.createElement("div");c.style.cssText="display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:14px";const l=document.createElement("input");l.type="file",l.accept=".pdf,.xlsx,.xls,.xlsm,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",l.className="control-input",l.setAttribute("aria-label","Fichier à importer"),l.style.flex="1",l.style.minWidth="200px";const d=document.createElement("button");d.type="button",d.className="btn btn-primary",d.textContent="Analyser le fichier";const u=document.createElement("pre");u.setAttribute("aria-live","polite"),u.style.cssText="margin-top:16px;padding:12px;border-radius:8px;background:rgba(0,0,0,.04);font-size:12px;line-height:1.45;overflow:auto;max-height:min(52vh,420px);white-space:pre-wrap;word-break:break-word;color:var(--text2)";const p=document.createElement("div");p.className="import-draft-panel",p.style.cssText="display:none;margin-top:14px;padding:12px;border-radius:8px;background:rgba(0,0,0,.03);font-size:13px;line-height:1.45;color:var(--text2)",p.setAttribute("aria-live","polite"),!t&&e&&(d.disabled=!0,d.style.opacity="0.55",d.title="Import réservé (ex. QHSE, Assistant)"),d.addEventListener("click",async()=>{var _,f;const h=(_=l.files)==null?void 0:_[0];if(!h){C("Choisissez un fichier.","warning");return}const k=new FormData;k.append("file",h),d.disabled=!0;try{const E=await Se("/api/imports/preview",{method:"POST",body:k}),w=await E.json().catch(()=>({}));if(!E.ok){r=null,C(typeof w.error=="string"?w.error:"Import impossible","error"),u.textContent="",p.style.display="none",p.replaceChildren(),v();return}r=typeof w.importHistoryId=="string"?w.importHistoryId:null,u.textContent=Lm(w),p.replaceChildren();const x=(f=w.suggestedModule)==null?void 0:f.pageId;if(w.prefillData&&typeof w.prefillData=="object"&&w.detectedDocumentType&&w.detectedDocumentType!=="unknown"){p.style.display="block";const N=document.createElement("div");N.style.fontWeight="700",N.style.marginBottom="8px",N.textContent="Brouillon de préremplissage (indicatif — rien n’est enregistré sans votre action)",p.append(N);const L=document.createElement("dl");if(L.style.cssText="margin:0;display:grid;gap:6px 12px;grid-template-columns:auto 1fr;max-width:72ch",Object.entries(w.prefillData).forEach(([q,W])=>{if(W==null||W==="")return;const K=document.createElement("dt");K.style.opacity="0.85",K.textContent=q;const A=document.createElement("dd");A.style.margin="0",A.textContent=typeof W=="object"?JSON.stringify(W):String(W),L.append(K,A)}),p.append(L),Array.isArray(w.missingFields)&&w.missingFields.length){const q=document.createElement("p");q.style.cssText="margin:10px 0 0;font-size:12px;color:var(--text3)",q.textContent=`À compléter probablement : ${w.missingFields.join(", ")}`,p.append(q)}const D=document.createElement("div");if(D.style.cssText="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;align-items:center",x==="incidents"){const q=document.createElement("button");q.type="button",q.className="btn btn-primary",q.textContent="Ouvrir la déclaration incident avec ce brouillon",q.addEventListener("click",()=>{Gn({targetPageId:"incidents",prefillData:w.prefillData,missingFields:w.missingFields,detectedDocumentType:w.detectedDocumentType}),window.location.hash="incidents"}),D.append(q)}if(x==="audits"){const q=document.createElement("button");q.type="button",q.className="btn btn-primary",q.textContent="Ouvrir Audits pour valider la création",q.addEventListener("click",()=>{Gn({targetPageId:"audits",prefillData:w.prefillData,missingFields:w.missingFields,detectedDocumentType:w.detectedDocumentType}),window.location.hash="audits"}),D.append(q)}if(x==="products"||x==="iso"){const q=document.createElement("button");q.type="button",q.className="btn",q.textContent="Copier le brouillon (JSON)",q.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(JSON.stringify(w.prefillData,null,2)),C("Brouillon copié","info")}catch{C("Copie impossible","warning")}}),D.append(q)}if(x==="incidents"||x==="audits"){const q=document.createElement("button");q.type="button",q.className="btn",q.textContent="Valider le brouillon et enregistrer en base",q.addEventListener("click",async()=>{var K,A;if(!await Yt("sensitive_mutation",{contextLabel:"enregistrement en base après import analysé"}))return;const W=x==="incidents"?{...w.prefillData,severity:((K=w.prefillData)==null?void 0:K.severity)??((A=w.prefillData)==null?void 0:A.gravite)??""}:{...w.prefillData};q.disabled=!0;try{const I=await Se("/api/imports/confirm",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({targetModule:x,suggestedModule:w.suggestedModule,validatedData:W,sourceFileName:w.originalName??null,importHistoryId:r})}),z=await I.json().catch(()=>({}));if(I.ok&&z.success){const V=z.createdEntityRef||z.createdEntityId;C(`Enregistré : ${V}${z.moduleCreated?` (${z.moduleCreated})`:""}`,"info"),Array.isArray(z.warnings)&&z.warnings.length&&C(z.warnings[0],"warning"),window.location.hash=x,v();return}const R=Array.isArray(z.warnings)&&z.warnings[0]||z.error||"Enregistrement impossible";C(R,"error"),v()}catch(I){console.error(I),C("Erreur réseau","error")}finally{q.disabled=!1}}),D.append(q)}if(x==="products"||x==="iso"){const q=document.createElement("button");q.type="button",q.className="btn",q.style.opacity="0.92",q.textContent="Tester la persistance serveur",q.addEventListener("click",async()=>{q.disabled=!0;try{const W=await Se("/api/imports/confirm",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({targetModule:x,validatedData:w.prefillData,sourceFileName:w.originalName??null,importHistoryId:r})}),K=await W.json().catch(()=>({})),A=Array.isArray(K.warnings)&&K.warnings[0]||"Réponse inattendue";C(A,W.ok?"info":"warning"),v()}catch(W){console.error(W),C("Erreur réseau","error")}finally{q.disabled=!1}}),D.append(q)}D.children.length&&p.append(D)}else p.style.display="none";C("Aperçu généré","info"),v()}catch(E){console.error(E),C("Erreur réseau","error")}finally{d.disabled=!t&&!!e,(t||!e)&&(d.disabled=!1)}});const g=document.createElement("article");g.className="content-card card-soft",g.style.marginTop="14px",g.innerHTML=`
    <div class="content-card-head">
      <div>
        <div class="section-kicker">Traçabilité</div>
        <h3>Historique des imports</h3>
        <p class="content-card-lead" style="margin:0;max-width:56ch;font-size:13px">
          Dernières analyses et validations (lecture seule si vous n’avez pas l’import en écriture).
        </p>
      </div>
    </div>
  `;const m=document.createElement("div");m.className="stack",m.style.marginTop="10px";const b=document.createElement("pre");b.style.cssText="display:none;margin-top:12px;padding:12px;border-radius:8px;background:rgba(0,0,0,.04);font-size:11px;line-height:1.45;overflow:auto;max-height:240px;white-space:pre-wrap;word-break:break-word;color:var(--text2)",g.append(m,b);let y=null;async function v(){if(!a&&e){m.innerHTML='<p style="margin:0;font-size:13px;color:var(--text3)">Historique non disponible pour ce rôle.</p>';return}m.replaceChildren(),b.style.display="none",b.textContent="",y=null;try{const h=await Se("/api/imports");if(!h.ok){const _=document.createElement("p");_.style.cssText="margin:0;font-size:13px;color:var(--text3)";const f=await h.json().catch(()=>({}));_.textContent=typeof f.error=="string"?f.error:`Impossible de charger l’historique (${h.status}).`,m.append(_);return}const k=await h.json().catch(()=>[]);if(!Array.isArray(k)||k.length===0){const _=document.createElement("p");_.style.cssText="margin:0;font-size:13px;color:var(--text3)",_.textContent="Aucun import enregistré pour le moment.",m.append(_);return}k.forEach(_=>{const f=document.createElement("article");f.className="list-row",f.style.cssText="display:flex;flex-wrap:wrap;gap:8px;align-items:flex-start;justify-content:space-between";const E=document.createElement("div"),w=_.createdAt?new Date(_.createdAt).toLocaleString("fr-FR",{dateStyle:"short",timeStyle:"short"}):"—";E.innerHTML=`
          <strong style="font-size:13px">${String(_.fileName||"—")}</strong>
          <p style="margin:4px 0 0;font-size:12px;color:var(--text2)">
            ${w} · ${String(_.fileType||"—")} · ${zs(_.detectedDocumentType)}
          </p>
          <p style="margin:4px 0 0;font-size:12px;color:var(--text3)">
            Module suggéré : ${_.suggestedModule||"—"}
            ${_.moduleCreated?` · Créé : ${_.moduleCreated}`:""}
          </p>
        `;const x=document.createElement("div");x.style.cssText="display:flex;flex-direction:column;align-items:flex-end;gap:6px";const S=document.createElement("span");S.className="badge info",S.style.fontSize="11px",S.textContent=$m(_.status);const N=document.createElement("button");N.type="button",N.className="text-button",N.style.fontSize="12px",N.style.fontWeight="700",N.textContent="Détail",N.addEventListener("click",async()=>{if(y===_.id&&b.style.display==="block"){b.style.display="none",y=null;return}try{const D=await(await Se(`/api/imports/${encodeURIComponent(_.id)}`)).json().catch(()=>null);b.textContent=JSON.stringify(D,null,2),b.style.display="block",y=_.id}catch{C("Détail indisponible","error")}}),x.append(S,N),f.append(E,x),m.append(f)})}catch{const h=document.createElement("p");h.style.cssText="margin:0;font-size:13px;color:var(--text3)",h.textContent="Erreur réseau (historique).",m.append(h)}}return c.append(l,d),s.append(c,u,p),n.append(s,g),v(),n}function Tm(){const e=document.createElement("section");e.className="page-stack";const t=Me(),a=lt(t==null?void 0:t.role,"sites","read"),r=lt(t==null?void 0:t.role,"sites","write");e.innerHTML=`
    <article class="content-card card-soft">
      <div class="content-card-head">
        <div>
          <div class="section-kicker">Organisation</div>
          <h3>Sites (référentiel)</h3>
          <p class="content-card-lead" style="margin:0;max-width:56ch;font-size:13px">
            Création et consultation des sites utilisés pour le filtrage des modules et les liaisons API
            (<code style="font-size:12px">${Qt()}</code>).
          </p>
        </div>
      </div>
      <div class="sites-list-host stack" style="margin-top:12px"></div>
    </article>
    <article class="content-card card-soft" style="margin-top:14px">
      <div class="content-card-head">
        <div>
          <div class="section-kicker">Nouveau</div>
          <h3>Ajouter un site</h3>
        </div>
      </div>
      <div class="form-grid" style="gap:12px;margin-top:8px">
        <label class="field field-full">
          <span>Nom <span style="color:var(--text3)">(obligatoire)</span></span>
          <input type="text" class="control-input sites-in-name" maxlength="200" autocomplete="organization" />
        </label>
        <label class="field">
          <span>Code</span>
          <input type="text" class="control-input sites-in-code" maxlength="40" autocomplete="off" />
        </label>
        <label class="field field-full">
          <span>Adresse</span>
          <input type="text" class="control-input sites-in-address" maxlength="500" autocomplete="street-address" />
        </label>
        <button type="button" class="btn btn-primary sites-btn-create field-full" style="min-height:48px;font-weight:700">
          Enregistrer le site
        </button>
      </div>
    </article>
  `;const n=e.querySelector(".sites-list-host"),i=e.querySelector(".sites-in-name"),o=e.querySelector(".sites-in-code"),s=e.querySelector(".sites-in-address"),c=e.querySelector(".sites-btn-create");if(!a&&t)return n.innerHTML='<p style="margin:0;font-size:13px;color:var(--text2)">Lecture des sites non autorisée pour ce rôle.</p>',e.querySelectorAll(".form-grid input").forEach(d=>{d.disabled=!0}),c.disabled=!0,e;async function l(){n.innerHTML='<p style="margin:0;font-size:13px;color:var(--text2)">Chargement…</p>';try{const d=await Se("/api/sites");if(!d.ok)throw new Error(`HTTP ${d.status}`);const u=await d.json();if(!Array.isArray(u)||u.length===0){n.innerHTML='<p style="margin:0;font-size:13px;color:var(--text2)">Aucun site — créez le premier ci-dessous.</p>';return}n.replaceChildren(),u.forEach(p=>{const g=document.createElement("article");g.className="list-row",g.style.display="flex",g.style.justifyContent="space-between",g.style.alignItems="flex-start",g.style.gap="12px";const m=document.createElement("div"),b=document.createElement("strong");b.textContent=p.name||"—";const y=document.createElement("p");y.style.margin="6px 0 0",y.style.fontSize="12px",y.style.color="var(--text2)";const v=[];p.code&&v.push(`Code : ${p.code}`),p.address&&v.push(p.address),v.push(`id : ${p.id}`),y.textContent=v.join(" · "),m.append(b,y),g.append(m),n.append(g)})}catch{n.innerHTML='<p style="margin:0;font-size:13px;color:var(--text2)">Liste indisponible — vérifiez l’API.</p>'}}return c.addEventListener("click",async()=>{if(!r&&t){C("Création réservée","warning");return}const d=(i.value||"").trim();if(!d){C("Le nom du site est requis","error");return}const u=(o.value||"").trim()||void 0,p=(s.value||"").trim()||void 0;c.disabled=!0;try{const g=await Se("/api/sites",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:d,code:u,address:p})}),m=await g.json().catch(()=>({}));if(!g.ok){C(typeof m.error=="string"?m.error:"Erreur création","error");return}C("Site créé","info"),i.value="",o.value="",s.value="",Bs(),await l()}catch{C("Erreur serveur","error")}finally{c.disabled=!1}}),!r&&t&&(c.disabled=!0,c.title="Création réservée — rôle lecture",c.style.opacity="0.55"),l(),e}const Lo="qhse-loginv2-styles";function Mm(){if(document.getElementById(Lo))return;const e=document.createElement("style");e.id=Lo,e.textContent=`
.lv2-screen {
  min-height: 100vh;
  display: flex;
  background: #0d1117;
}
.lv2-left {
  width: 42%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 80px 48px 40px;
  position: relative;
  background: rgba(10,14,22,.98);
  border-right: 1px solid rgba(255,255,255,.06);
}
.lv2-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 32px;
}
.lv2-right-inner {
  width: 100%;
  max-width: 380px;
}
.lv2-logo {
  position: absolute;
  top: 28px; left: 32px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.lv2-logo-name {
  font-size: 14px;
  font-weight: 700;
  color: rgba(226,232,240,.9);
  letter-spacing: -.01em;
}
.lv2-headline {
  font-size: clamp(24px, 3vw, 32px);
  font-weight: 900;
  letter-spacing: -.03em;
  color: #f1f5f9;
  line-height: 1.15;
  margin: 0 0 10px;
}
.lv2-tagline {
  font-size: 13px;
  color: rgba(148,163,184,.65);
  margin: 0 0 28px;
  letter-spacing: .01em;
}
.lv2-sep {
  height: 1px;
  background: rgba(255,255,255,.07);
  margin: 0 0 28px;
}
.lv2-benefits {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.lv2-benefit {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
  color: rgba(203,213,225,.8);
  line-height: 1.5;
}
.lv2-gdpr {
  position: absolute;
  bottom: 24px; left: 32px;
  font-size: 11px;
  color: rgba(148,163,184,.3);
}
.lv2-form-title {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -.025em;
  color: #f1f5f9;
  margin: 0 0 6px;
}
.lv2-form-sub {
  font-size: 13px;
  color: rgba(148,163,184,.55);
  margin: 0 0 28px;
  line-height: 1.4;
}
.lv2-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}
.lv2-field-label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(148,163,184,.7);
  letter-spacing: .02em;
}
.lv2-input {
  width: 100%;
}
.lv2-password-wrap {
  position: relative;
}
.lv2-password-wrap .lv2-input {
  padding-right: 44px;
}
.lv2-eye-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: rgba(148,163,184,.5);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}
.lv2-eye-btn:hover {
  color: rgba(148,163,184,.85);
}
.lv2-submit {
  width: 100%;
  min-height: 44px;
  font-size: 14px;
  font-weight: 700;
  margin-top: 20px;
}
.lv2-demo-link {
  display: block;
  margin: 18px auto 0;
  background: none;
  border: none;
  color: rgba(148,163,184,.45);
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
  transition: color 150ms;
}
.lv2-demo-link:hover {
  color: rgba(148,163,184,.75);
}
.lv2-mobile-brand {
  display: none;
  align-items: center;
  gap: 8px;
  margin-bottom: 32px;
  font-size: 15px;
  font-weight: 700;
  color: #e2e8f0;
}
@media (max-width: 768px) {
  .lv2-left { display: none; }
  .lv2-right { padding: 32px 24px; }
  .lv2-mobile-brand { display: flex; }
  .lv2-screen { background: #0d1117; }
}
`,document.head.append(e)}const kr='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(52,211,153,.8)" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>',Io='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',Pm='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';function Rm({onSuccess:e}){Dt(),Mm();const t=document.createElement("div");t.className="lv2-screen";const a=document.createElement("div");a.className="lv2-left",a.innerHTML=`
    <div class="lv2-logo">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(82,148,247,.9)" stroke-width="1.75" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      <span class="lv2-logo-name">QHSE Control</span>
    </div>
    <div class="lv2-left-main">
      <h1 class="lv2-headline">Pilotez votre conformité QHSE</h1>
      <p class="lv2-tagline">Incidents · Risques · Audits · Actions</p>
      <div class="lv2-sep" aria-hidden="true"></div>
      <div class="lv2-benefits">
        <div class="lv2-benefit">
          <span style="flex-shrink:0;margin-top:2px">${kr}</span>
          <span>Déclaration terrain en moins de 2 minutes</span>
        </div>
        <div class="lv2-benefit">
          <span style="flex-shrink:0;margin-top:2px">${kr}</span>
          <span>Suivi ISO 45001 · 14001 · 9001 intégré</span>
        </div>
        <div class="lv2-benefit">
          <span style="flex-shrink:0;margin-top:2px">${kr}</span>
          <span>Alertes et plans d'actions automatisés</span>
        </div>
      </div>
    </div>
    <p class="lv2-gdpr">Conforme RGPD · Données hébergées EU</p>
  `;const r=a.querySelector(".lv2-left-main");r&&(r.style.cssText="flex:1;display:flex;flex-direction:column;justify-content:center;min-height:0;width:100%;max-width:100%");const n=document.createElement("div");n.className="lv2-right";const i=document.createElement("div");i.className="lv2-right-inner",i.innerHTML=`
    <div class="lv2-mobile-brand">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(82,148,247,.9)" stroke-width="1.75" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      <span>QHSE Control</span>
    </div>
    <form class="lv2-form" novalidate>
      <p class="lv2-form-title">Connexion à votre espace</p>
      <p class="lv2-form-sub">Entrez vos identifiants pour accéder au tableau de bord</p>
      <label class="lv2-field">
        <span class="lv2-field-label">Adresse e-mail</span>
        <input type="email" name="email" class="control-input lv2-input lv2-email" autocomplete="username" placeholder="vous@entreprise.com" />
      </label>
      <label class="lv2-field">
        <span class="lv2-field-label">Mot de passe</span>
        <div class="lv2-password-wrap">
          <input type="password" name="password" class="control-input lv2-input lv2-password" autocomplete="current-password" />
          <button type="button" class="lv2-eye-btn" aria-label="Afficher le mot de passe">
            ${Io}
          </button>
        </div>
      </label>
      <button type="submit" class="btn btn-primary lv2-submit">Se connecter</button>
      <div class="lv2-sep" style="margin:20px 0" aria-hidden="true"></div>
      <button type="button" class="lv2-demo-link">Continuer en démonstration →</button>
    </form>
  `;const o=i.querySelector(".lv2-form"),s=i.querySelector(".lv2-email"),c=i.querySelector(".lv2-password"),l=i.querySelector(".lv2-submit"),d=i.querySelector(".lv2-demo-link"),u=i.querySelector(".lv2-eye-btn");if(u&&c){const p=u;u.addEventListener("click",()=>{const g=c.type==="password";c.type=g?"text":"password",p.innerHTML=g?Pm:Io,p.setAttribute("aria-label",g?"Masquer le mot de passe":"Afficher le mot de passe")})}return d==null||d.addEventListener("click",()=>{window.location.hash="dashboard",e()}),o==null||o.addEventListener("submit",async p=>{var y;p.preventDefault();const g=String((s==null?void 0:s.value)||"").trim(),m=(c==null?void 0:c.value)||"";if(!g||!m){C("Saisissez e-mail et mot de passe","error");return}const b=(l==null?void 0:l.textContent)||"";l&&(l.disabled=!0,l.textContent="Connexion…");try{const v=await fetch(`${Qt()}/api/auth/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:g,password:m})}),h=await v.json().catch(()=>({}));if(!v.ok){C(typeof h.error=="string"?h.error:"Connexion impossible","error");return}if(!h.token||!((y=h.user)!=null&&y.id)){C("Réponse serveur invalide","error");return}Hs({id:h.user.id,name:h.user.name||"",email:h.user.email||"",role:h.user.role||""},h.token),C(`Bienvenue, ${h.user.name||h.user.email}`,"success"),window.location.hash="dashboard",e()}catch{C("Réseau ou serveur indisponible","error")}finally{l&&(l.disabled=!1,l.textContent=b)}}),n.append(i),t.append(a,n),t}function To(e){console.error("[QHSE] Rendu page",e);const t=document.createElement("div");t.className="page-stack";const a=document.createElement("article");a.className="content-card card-soft",a.style.padding="1.5rem",a.style.maxWidth="42rem";const r=document.createElement("h2");r.style.margin="0 0 10px",r.textContent="Impossible d’afficher cette page";const n=document.createElement("p");n.style.margin="0 0 8px",n.style.color="var(--text2)",n.style.lineHeight="1.5",n.textContent="Une erreur technique a interrompu l’affichage. Ouvrez la console (F12) pour le détail.";const i=document.createElement("p");i.style.margin="0 0 16px",i.style.fontSize="13px",i.style.wordBreak="break-word",i.style.opacity="0.9",i.textContent=e instanceof Error?e.message:String(e);const o=document.createElement("button");return o.type="button",o.className="btn btn-primary",o.textContent="Retour tableau de bord",o.addEventListener("click",()=>{window.location.hash="dashboard"}),a.append(r,n,i,o),t.append(a),t}function Dm({currentPage:e,onAddLog:t}){if(e==="login")return document.createElement("div");const a=Me();if(a&&!yt(a.role,e)){const r=window.location.hash.replace(/^#/,"");r&&r!=="dashboard"&&(window.location.hash="dashboard");try{return Fn()}catch(n){return To(n)}}try{switch(e){case"incidents":return md(t);case"risks":return $d();case"actions":return ep();case"iso":return Pp(t);case"audits":return au();case"products":return bu();case"imports":return Im();case"sites":return Tm();case"analytics":return $u();case"performance":return Fu();case"ai-center":return am(t);case"activity-log":return xm();case"settings":return zm();case"dashboard":default:return Fn()}}catch(r){return To(r)}}async function jm(e){if(!e||typeof e.refreshNavBadges!="function")return;const t={incidents:0,overdueActions:0};try{const a=await Se(_t("/api/dashboard/stats"));if(a.ok){const r=await a.json().catch(()=>({}));t.incidents=Array.isArray(r.criticalIncidents)?r.criticalIncidents.length:0,t.overdueActions=Number(r.overdueActions)||0}}catch{}e.refreshNavBadges(t)}function Om(e,t){var o;if(t==="dashboard"||t==="login"||t==="incidents"||t==="settings"||t==="iso"||t==="analytics"||!((o=e==null?void 0:e.classList)!=null&&o.contains("page-stack"))||e.querySelector(".page-intro"))return;const a=ga[t];if(!(a!=null&&a.title))return;const r=document.createElement("div");r.className="page-intro module-page-hero";const n=document.createElement("div");if(n.className="module-page-hero__inner",a.kicker){const s=document.createElement("p");s.className="page-intro__kicker section-kicker",s.textContent=a.kicker,n.append(s)}const i=document.createElement("h1");if(i.className="page-intro__title",i.textContent=a.title,n.append(i),a.subtitle){const s=document.createElement("p");s.className="page-intro__desc",s.textContent=a.subtitle,n.append(s)}r.append(n),e.prepend(r)}const Xa=document.querySelector("#app");function Ta(e,t){const a=document.querySelector("#app")||document.body;a.innerHTML="",a.id==="app"&&(a.style.minHeight="100vh");const r=document.createElement("div");r.style.cssText="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;background:#0f172a;color:#e2e8f0;font-family:system-ui,sans-serif;";const n=document.createElement("div");n.style.cssText="max-width:520px;border:1px solid rgba(148,163,184,.25);border-radius:16px;padding:22px 24px;background:rgba(15,23,42,.9);";const i=document.createElement("h1");i.style.cssText="margin:0 0 12px;font-size:18px;",i.textContent=e;const o=document.createElement("p");o.style.cssText="margin:0 0 14px;font-size:14px;line-height:1.5;opacity:.9;",o.textContent="Si vous ouvrez les fichiers en double-clic (file://), utilisez plutôt le serveur de dev : dans le dossier du projet, exécutez npm run dev puis ouvrez http://localhost:5173 .";const s=document.createElement("pre");s.style.cssText="margin:0 0 16px;padding:12px;border-radius:10px;background:rgba(0,0,0,.35);font-size:12px;overflow:auto;white-space:pre-wrap;word-break:break-word;",s.textContent=t||"";const c=document.createElement("button");c.type="button",c.textContent="Recharger la page",c.style.cssText="padding:10px 18px;border-radius:10px;border:none;font-weight:700;cursor:pointer;background:#14b8a6;color:#fff;",c.addEventListener("click",()=>window.location.reload()),n.append(i,o,s,c),r.append(n),a.append(r)}function Hm(){Be.add({module:"system",action:"Application initialisée",detail:"Shell front chargé avec succès",user:"Système"})}function mt(){if(!Xa){Ta("Élément #app introuvable",'Vérifiez que index.html contient <div id="app"></div>.');return}try{Xa.innerHTML=""}catch(i){Ta("Impossible de préparer l’interface",String((i==null?void 0:i.message)||i));return}if(Ne.currentPage==="login"){Xa.append(Rm({onSuccess:()=>mt()}));return}const e=document.createElement("div");e.className="app-shell";const t=Qs({currentPage:Ne.currentPage,onNavigate:i=>{ai(i),window.location.hash=i,mt()},onSiteChange:(i,o)=>{var s;jo(i,o),Be.add({module:"context",action:"Changement de site",detail:`Contexte actif: ${Ne.currentSite}${Ne.activeSiteId?` · ref ${Ne.activeSiteId}`:""}`,user:((s=Me())==null?void 0:s.name)||"Responsable QHSE"}),mt()},onSessionUserChange:()=>{Oo().then(()=>mt())}}),a=document.createElement("main");a.className="main-shell";const r=tc({currentPage:Ne.currentPage,sessionUser:Me(),unreadCount:Za.unreadCount(),onToggleNotifications:()=>{Ne.notificationsOpen=!Ne.notificationsOpen,mt()},onNavigate:i=>{ai(i),window.location.hash=i,mt()}}),n=Dm({currentPage:Ne.currentPage,onAddLog:i=>{Be.add(i),mt()}});Om(n,Ne.currentPage),a.append(r,n),Ne.notificationsOpen&&a.append(pc({notifications:Za.all(),onMarkAllRead:()=>{Za.markAllRead(),mt()},onClose:()=>{Ne.notificationsOpen=!1,mt()}})),e.append(t,a);try{Xa.append(e)}catch(i){console.error(i),Ta("Erreur lors du rendu de l’application",String((i==null?void 0:i.message)||i));return}jm(t)}function Fm(){const e=window.location.hash.replace("#","");e&&ai(e)}async function Vm(){try{if(Ms(),typeof window<"u"&&window.location.protocol==="file:"){Ta("Application non chargée (fichier local)","Ouvrez http://localhost:5173 après npm run dev (dossier qhse-africa-starter). Le mode file:// ne charge pas correctement les modules JavaScript.");return}Fm(),await Fs(),Hm(),mt(),Oo().then(()=>mt())}catch(e){console.error(e),Ta("Erreur au démarrage",String((e==null?void 0:e.message)||e))}}Vm();window.addEventListener("hashchange",()=>{const e=window.location.hash.replace("#","");e&&(ai(e),mt())});
