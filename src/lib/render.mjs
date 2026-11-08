// Render library — pure functions returning HTML strings.
import { icons, categoryIcon, quickIcon } from './icons.mjs';

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const MONTHS = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  hi: ['जन', 'फ़र', 'मार्च', 'अप्रै', 'मई', 'जून', 'जुल', 'अग', 'सित', 'अक्टू', 'नव', 'दिस'],
};

export function fmtDate(iso, lang = 'en') {
  if (!iso) return '';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  const [, y, mo, d] = m;
  return `${d} ${MONTHS[lang]?.[Number(mo) - 1] ?? mo} ${y}`;
}

const fill = (str, vars) =>
  String(str).replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] !== undefined ? vars[k] : ''));

export const t9 = (t, path, vars) => {
  let v = t;
  for (const p of path.split('.')) v = v?.[p];
  if (v === undefined) return '';
  return vars ? fill(v, vars) : v;
};

export const telHref = (dial) => 'tel:' + String(dial).replace(/[^+0-9]/g, '');

// ---------- global data injection (set by build) ----------
const DATA = { core: '', index: '' };
export function setData(core, index) {
  DATA.core = core || '';
  DATA.index = index || '';
}
let BP = ''; // base path, '' or '/india-helpline'
export function setBasePath(bp) { BP = bp || ''; }

// localized text from a {en, hi} or string value
export const loc = (val, lang) => {
  if (val == null) return null;
  if (typeof val === 'string') return val;
  return val[lang] || val.en || null;
};

// ---------- icons as raw html ----------
const ic = (name, cls = '') => {
  const svg = icons[name] ? icons[name]() : '';
  return cls ? svg.replace('<svg ', `<svg class="${cls}" `) : svg;
};

// ---------- page shell ----------
export function pageShell(o) {
  const {
    t, lang, base, title, desc, content, pageId,
    siteUrl, cfg, buildDate, nav = true,
  } = o;
  // enPath: the English-tree path of this page, used for hreflang + language switch
  const enPath = (o.altPath || o.path || 'index.html').replace(/^\/hi\//, '').replace(/^\/+/, '') || 'index.html';
  // same-origin navigation links need the base path; absolute URLs under siteUrl do not
  const hiNav = BP + '/hi/' + (enPath === 'index.html' ? '' : enPath);
  const enNav = BP + '/' + (enPath === 'index.html' ? '' : enPath);
  const otherLang = lang === 'en' ? 'hi' : 'en';
  const otherHref = lang === 'en' ? hiNav : enNav;
  const canonical = siteUrl ? `${siteUrl}/${lang === 'hi' ? 'hi/' + (enPath === 'index.html' ? '' : enPath) : (enPath === 'index.html' ? '' : enPath)}` : null;

  const navHtml = nav ? `
      <nav aria-label="${esc(t9(t, 'nav.services'))}">
        <a href="${base}/categories/emergency.html"${pageId === 'cat-emergency' ? ' aria-current="page"' : ''}>${esc(t9(t, 'categories.emergency'))}</a>
        <a href="${base}/states/"${pageId === 'states' ? ' aria-current="page"' : ''}>${esc(t9(t, 'nav.states'))}</a>
        <a href="${base}/coverage.html"${pageId === 'coverage' ? ' aria-current="page"' : ''}>${esc(t9(t, 'nav.coverage'))}</a>
        <a href="${base}/about.html"${pageId === 'about' ? ' aria-current="page"' : ''}>${esc(t9(t, 'nav.about'))}</a>
      </nav>` : '';

  const dataScripts = [
    DATA.core ? `<script>window.__IH__=${DATA.core}</script>` : '',
    DATA.index ? `<script>window.__IH__.index=${DATA.index}</script>` : '',
  ].filter(Boolean).join('\n');

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc || '')}">
<meta name="color-scheme" content="light dark">
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}
${siteUrl ? `<link rel="alternate" hreflang="en" href="${esc(siteUrl + '/' + (enPath === 'index.html' ? '' : enPath))}">
<link rel="alternate" hreflang="hi" href="${esc(siteUrl + '/hi/' + (enPath === 'index.html' ? '' : enPath))}">
<link rel="alternate" hreflang="x-default" href="${esc(siteUrl + '/' + (enPath === 'index.html' ? '' : enPath))}">` : ''}
<link rel="stylesheet" href="${BP}/ui/styles.css">
<link rel="icon" href="${BP}/ui/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${BP}/ui/apple-touch-icon.png">
<link rel="manifest" href="${BP}/manifest.webmanifest">
<script type="module" src="${BP}/ui/app.js" defer></script>
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc || '')}">
<meta property="og:type" content="website">
${siteUrl ? `<meta property="og:url" content="${esc(canonical || siteUrl)}">
<meta property="og:image" content="${esc(siteUrl + BP + '/ui/og-image.png')}">
<meta name="twitter:card" content="summary_large_image">` : ''}
<meta name="theme-color" content="#C41414" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0F141B" media="(prefers-color-scheme: dark)">
</head>
<body data-page="${esc(pageId || '')}">
${dataScripts}
<a class="skip" href="#main">${esc(t9(t, 'skipLink'))}</a>
<div class="offbanner"><div class="wrap">${esc(t9(t, 'offline.banner', { date: buildDate }))}</div></div>
<header class="topbar">
  <div class="wrap topbar-in">
    <a class="brand" href="${base}/"><span class="mark" aria-hidden="true">112</span>${esc(t9(t, 'siteName'))}</a>
    <span class="spacer"></span>
    ${navHtml}
    <a href="${otherHref}" hreflang="${otherLang}" aria-label="${esc(t9(t, 'a11y.langToggle'))}">
      <span class="lang-switch"><span lang="${otherLang}">${otherLang === 'hi' ? 'हिंदी' : 'English'}</span></span>
    </a>
    <a class="call-chip" href="tel:112">${icons.phone(16)}<span class="n">112</span></a>
  </div>
</header>
<main id="main">
${content}
</main>
<footer>
  <div class="wrap foot-grid">
    <p class="foot-note">${esc(t9(t, 'footer.independence'))}<br>${esc(t9(t, 'footer.privacy'))}</p>
    <div class="foot-links">
      <a href="${base}/about.html">${esc(t9(t, 'nav.about'))}</a>
      <a href="${base}/coverage.html">${esc(t9(t, 'nav.coverage'))}</a>
      <a href="${base}/privacy.html">${esc(t9(t, 'privacy.title'))}</a>
      <a href="${base}/print.html">${esc(t9(t, 'print.title'))}</a>
      <a href="mailto:${esc(cfg.contactEmail)}?subject=${encodeURIComponent('India Helpline — problem report')}">${esc(t9(t, 'record.report'))}</a>
    </div>
    <span class="offline-pill" id="offline-pill"><span class="dot"></span><span id="offline-pill-text">${esc(t9(t, 'footer.offlineNone'))}</span></span>
  </div>
</footer>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
</body>
</html>`;
}

// ---------- record card ----------
export function recordCard(rec, o) {
  const { t, lang, base, statesByCode, cfg } = o;
  const name = loc(rec.name, lang) || rec.name?.en || rec.id;
  const desc = loc(rec.purpose, lang) || rec.purpose?.en || '';
  const isState = String(rec.scope).startsWith('state:');
  const stateCode = isState ? rec.scope.split(':')[1] : null;
  const scopeTag = isState
    ? esc(t9(t, 'record.scopeState', { state: loc(statesByCode[stateCode]?.name, lang) || stateCode }))
    : esc(t9(t, 'record.scopeNational'));
  const typeTag = esc(t9(t, ['record.type', rec.serviceType].join('.')));
  const chargesLabel = esc(t9(t, 'record.charges.' + (rec.charges || 'not published')));
  const href = telHref(rec.dial);
  const numText = esc(rec.displayNumber);
  const channels = rec.channels || {};
  const chans = [];
  if (channels.sms) chans.push(`<div class="row"><span class="k">${esc(t9(t, 'record.sms'))}</span><span class="v">${esc(channels.sms)}</span></div>`);
  if (channels.whatsapp) chans.push(`<div class="row"><span class="k">${esc(t9(t, 'record.whatsapp'))}</span><span class="v">${esc(channels.whatsapp)}</span></div>`);
  if (channels.web) chans.push(`<div class="row"><span class="k">${esc(t9(t, 'record.web'))}</span><span class="v"><a href="${esc(channels.web)}" rel="noopener">${esc(channels.web)}</a></span></div>`);
  const langs = (rec.languages || []).join(', ');
  const reportHref = `mailto:${esc(cfg.contactEmail)}?subject=${encodeURIComponent(`Incorrect details: ${rec.id} (${rec.displayNumber})`)}&body=${encodeURIComponent(`Listing: ${rec.id}\nNumber shown: ${rec.displayNumber}\nWhat is wrong:\n\nSource we should check: `)}${encodeURIComponent(rec.sourceUrl)}`;

  return `<article class="svc" id="${esc(rec.id)}" data-scope="${esc(rec.scope)}" data-cat="${esc(rec.category)}" data-urg="${esc(rec.urgency || '')}">
  <div class="svc-top">
    <div class="svc-body">
      <h3 class="svc-name">${esc(name)}</h3>
      <p class="svc-desc">${esc(desc)}</p>
      <div class="svc-tags">
        <span class="tag scope">${ic('pin')} ${scopeTag}</span>
        <span class="tag type-${esc(rec.serviceType)}">${typeTag}</span>
        <span class="tag verified">${ic('check')} ${esc(t9(t, 'record.verified'))}</span>
      </div>
    </div>
    <div class="svc-call">
      <a class="btn-call" href="${esc(href)}" aria-label="${esc(t9(t, 'record.callAria', { number: rec.displayNumber }))}">${icons.phone(18)}<span>${esc(t9(t, 'record.callNow'))}&nbsp;<span class="num-strong">${numText}</span></span></a>
      <span class="svc-numtext">${numText}</span>
      <button class="btn-copy" type="button" data-copy="${esc(rec.displayNumber)}" data-id="${esc(rec.id)}">${ic('copy')} ${esc(t9(t, 'record.copy'))}</button>
    </div>
  </div>
  <details class="svc-details">
    <summary>${ic('chevR')} ${esc(t9(t, 'record.details'))}</summary>
    <div class="facts">
      <div class="row"><span class="k">${esc(t9(t, 'record.operator'))}</span><span class="v">${esc(rec.operator)}</span></div>
      <div class="row"><span class="k">${esc(t9(t, 'record.hours'))}</span><span class="v">${esc(rec.hours || t9(t, 'record.hoursUnknown'))}</span></div>
      <div class="row"><span class="k">${esc(t9(t, 'record.chargesLabel'))}</span><span class="v">${chargesLabel}</span></div>
      ${chans.join('\n      ')}
      ${langs ? `<div class="row"><span class="k">${esc(t9(t, 'record.languages'))}</span><span class="v">${esc(langs)}</span></div>` : ''}
      ${rec.notes ? `<div class="row"><span class="k">${lang === 'hi' ? 'नोट' : 'Note'}</span><span class="v">${esc(loc(rec.notes, lang) || rec.notes.en)}</span></div>` : ''}
      <div class="row"><span class="k">${esc(t9(t, 'record.source'))}</span><span class="v"><a href="${esc(rec.sourceUrl)}" rel="noopener" target="_blank">${esc(rec.sourceUrl)}</a></span></div>
      <div class="row"><span class="k">${esc(t9(t, 'record.checked', { date: fmtDate(rec.checkedDate, lang) }))}</span></div>
    </div>
    <p class="report-line"><a href="${esc(reportHref)}">${ic('report')} ${esc(t9(t, 'record.report'))}</a><br><small>${esc(t9(t, 'record.reportNote'))}</small></p>
  </details>
</article>`;
}

// ---------- search box ----------
export function searchBox(t, o = {}) {
  const action = o.base ? `${o.base}/search.html` : './search.html';
  return `<section class="searchbox" id="search" aria-labelledby="search-label">
  <h2 class="section-title" id="search-label">${esc(t9(t, 'search.label'))}</h2>
  <p class="section-sub">${esc(t9(t, 'search.byNumber'))}</p>
  <form action="${esc(action)}" method="get" role="search">
    <label class="sr-only" for="q">${esc(t9(t, 'search.label'))}</label>
    <div style="display:flex;gap:.6rem">
      <input type="search" id="q" name="q" placeholder="${esc(t9(t, 'search.placeholder'))}" autocomplete="off" enterkeyhint="search">
      <button type="submit" aria-label="${esc(t9(t, 'search.submit'))}">${icons.search(20)}</button>
    </div>
  </form>
  <div class="search-results" id="search-results" role="region" aria-live="polite" aria-label="${esc(t9(t, 'a11y.searchStatus'))}"></div>
</section>`;
}

// ---------- region selector ----------
export function regionSelector(t, lang, base) {
  return `<section class="region" aria-labelledby="region-label">
  <h2 class="sr-only" id="region-label">${esc(t9(t, 'states.selected'))}</h2>
  <form class="stateselect" action="${esc(base)}/states/" method="get" data-region-form>
    <label class="sr-only" for="statepick">${esc(t9(t, 'states.choose'))}</label>
    <select id="statepick" name="state" data-state-select>
      <option value="">${esc(t9(t, 'states.placeholder'))}</option>
    </select>
    <button type="submit">${esc(t9(t, 'states.go'))}</button>
  </form>
</section>`;
}

// ---------- record list ----------
export function recordList(recs, o) {
  if (!recs.length) return '';
  return `<div class="dir">${recs.map((r) => recordCard(r, o)).join('\n')}</div>`;
}
