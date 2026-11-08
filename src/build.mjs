#!/usr/bin/env node
/* India Helpline — static site generator.
   Reads data/ + i18n/ + src/, emits site/ (English at root, Hindi under /hi/).
   No external dependencies. Usage: node src/build.mjs [--site-url https://...] */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, copyFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pageShell, recordCard, recordList, searchBox, regionSelector, esc, fmtDate, t9, loc, telHref, setData, setBasePath } from './lib/render.mjs';
import { categoryIcon, quickIcon } from './lib/icons.mjs';
import { icons } from './lib/icons.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(ROOT, 'site');

// ---------- args ----------
let siteUrl = '';
let basePath = '';
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--site-url') siteUrl = argv[i + 1] || '';
  if (argv[i] === '--base-path') basePath = argv[i + 1] || '';
}
siteUrl = siteUrl.replace(/\/$/, '');
basePath = ('/' + basePath.replace(/^\/+|\/+$/g, '')).replace(/\/$/, ''); // '' or '/india-helpline'
setBasePath(basePath);

// ---------- config ----------
const cfgPath = join(ROOT, 'config.json');
const cfg = existsSync(cfgPath) ? JSON.parse(readFileSync(cfgPath, 'utf8'))
  : { contactEmail: 'reports@indiahelpline.example', ownerNote: 'Owner contact channel not yet configured — see MAINTENANCE.md' };

// ---------- load data ----------
const statesData = JSON.parse(readFileSync(join(ROOT, 'data/states.json'), 'utf8'));
const STATES = statesData.jurisdictions;
const statesByCode = Object.fromEntries(STATES.map((s) => [s.code, s]));

const recordFiles = [];
const recDir = join(ROOT, 'data/records');
for (const f of readdirSync(recDir).filter((f) => f.endsWith('.json'))) {
  recordFiles.push(join(recDir, f));
}
const statesDir = join(recDir, 'states');
if (existsSync(statesDir)) {
  for (const f of readdirSync(statesDir).filter((f) => f.endsWith('.json'))) {
    recordFiles.push(join(statesDir, f));
  }
}
let RECORDS = [];
for (const f of recordFiles) {
  const arr = JSON.parse(readFileSync(f, 'utf8'));
  RECORDS.push(...arr.filter((r) => r && r.id)); // skip coverageNotes wrappers
}

// normalize: state-code aliases some agents use (vehicle codes -> ISO)
const CODE_ALIAS = { UK: 'UT', CG: 'CT', OD_: 'OD' };
for (const r of RECORDS) {
  if (String(r.scope).startsWith('state:')) {
    const c = r.scope.split(':')[1];
    if (CODE_ALIAS[c]) r.scope = 'state:' + CODE_ALIAS[c];
  }
}

const published = RECORDS.filter((r) => r.status === 'published');
const quarantined = RECORDS.filter((r) => r.status && r.status !== 'published');

// ---------- derived ----------
const _now = new Date();
const BUILD_DATE = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`;
const CATS = ['emergency', 'health', 'safety', 'disaster', 'travel', 'utilities', 'crime', 'other'];

function urgencyOf(rec) {
  if (rec.scope === 'national') return 1;
  return 0.5;
}
function sortRecs(list) {
  const CAT_URGENCY = { emergency: 3, health: 2.2, safety: 2, disaster: 2, crime: 1.6, utilities: 1.2, travel: 1, other: 0.8 };
  return [...list].sort((a, b) => {
    const au = (CAT_URGENCY[a.category] || 1) + urgencyOf(a) * 0.1;
    const bu = (CAT_URGENCY[b.category] || 1) + urgencyOf(b) * 0.1;
    if (au !== bu) return bu - au;
    return (a.name?.en || '').localeCompare(b.name?.en || '');
  });
}

const byCode = {};
for (const st of STATES) {
  byCode[st.code] = sortRecs(published.filter((r) => r.scope === 'state:' + st.code));
}
const NATIONAL = sortRecs(published.filter((r) => r.scope === 'national'));
const catRecs = {};
for (const c of CATS) {
  catRecs[c] = sortRecs(published.filter((r) => r.category === c));
}

// ---------- search index (compact) ----------
function compactIndex(list) {
  return list.map((r) => ({
    id: r.id,
    n: loc(r.name, 'en') || r.id,
    nh: loc(r.name, 'hi') || null,
    p: loc(r.purpose, 'en') || '',
    ph: loc(r.purpose, 'hi') || null,
    o: r.operator || '',
    num: r.displayNumber,
    cat: r.category,
    scope: r.scope,
    a: r.aliases || [],
  }));
}
const INDEX = compactIndex(published);
const statesCompact = STATES.map((s) => ({
  code: s.code, en: s.name.en, hi: s.name.hi,
  n: byCode[s.code].length,
}));

const IH_CORE = JSON.stringify({ build: BUILD_DATE, states: statesCompact, bp: basePath });
const IH_INDEX = JSON.stringify(INDEX);

// search pages get the full index; everything else gets the tiny core
function setDataFor(searchable) {
  setData(IH_CORE, searchable ? IH_INDEX : '');
}

// ---------- helpers ----------
function write(rel, content) {
  const p = join(SITE, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content);
  console.log('  wrote', rel);
}
function dirFor(lang) { return basePath + (lang === 'hi' ? '/hi' : ''); }

const I18N = {
  en: JSON.parse(readFileSync(join(ROOT, 'i18n/en.json'), 'utf8')),
  hi: JSON.parse(readFileSync(join(ROOT, 'i18n/hi.json'), 'utf8')),
};

function buildPage({ lang, path, pageId, title, desc, content, altPath, searchable = false }) {
  const t = I18N[lang];
  setDataFor(searchable);
  const html = pageShell({
    t, lang, base: dirFor(lang), title, desc, content, pageId,
    siteUrl, cfg, buildDate: fmtDate(BUILD_DATE, lang),
    path: lang === 'hi' ? '/hi/' + path : path,
    altPath,
  });
  write((lang === 'hi' ? 'hi/' : '') + path.replace(/^\//, ''), html);
}

// ---------- record card option factory ----------
const cardOpts = (lang) => ({ t: I18N[lang], lang, base: dirFor(lang), statesByCode, cfg });

// ---------- shared sections ----------
function emergencyBanner(t, lang) {
  return `<section class="emg-banner" aria-labelledby="emg-q">
  <div class="wrap emg-in">
    <div class="emg-copy fade-up">
      <p class="emg-kicker"><span class="dot" aria-hidden="true"></span>${esc(t.emergency.kicker)}</p>
      <h1 class="emg-q" id="emg-q">${esc(t.emergency.inDanger)}</h1>
      <p class="emg-sub">${esc(t.emergency.subline)}</p>
    </div>
    <div class="emg-cta fade-up d1">
      <a class="emg-call" href="tel:112">${icons.phone(26)}<span class="tel">112</span></a>
      <span class="emg-hint">${esc(t.emergency.free)}</span>
    </div>
  </div>
  <div class="wrap"><p class="emg-note fade-up d2">${esc(t.emergency.note)} ${esc(t.emergency.powerButton)}</p></div>
</section>`;
}

function quickCards(t, lang) {
  const items = [
    ['ambulance', '/categories/health.html', 'red'],
    ['police', '/categories/emergency.html', 'red'],
    ['fire', '/categories/emergency.html', 'red'],
    ['child', '/categories/safety.html', 'blue'],
    ['fraud', '/categories/crime.html', 'saffron'],
    ['more', '/categories/other.html', 'green'],
  ];
  return `<section aria-labelledby="quick-title">
  <h2 class="section-title" id="quick-title">${esc(t.quick.title)}</h2>
  <div class="quick-grid">
    ${items.map(([key, href, accent], i) => `
    <a class="qcard fade-up d${Math.min(i + 1, 4)}" href="${dirFor(lang)}${href}" data-accent="${accent}">
      <span class="ic">${icons[quickIcon[key]]()}</span>
      <span class="t">${esc(t.quick[key])}</span>
    </a>`).join('\n')}
  </div>
</section>`;
}

function catTiles(t, lang) {
  return `<section aria-labelledby="cats-title">
  <h2 class="section-title" id="cats-title">${esc(t.categories.title)}</h2>
  <div class="tilegrid tertiary">
    ${CATS.map((c) => `
    <a class="tile" href="${dirFor(lang)}/categories/${c}.html">
      <span class="ic">${icons[categoryIcon[c]]()}</span>
      <span class="t">${esc(t.categories[c])}</span>
      <span class="c">${catRecs[c].length}</span>
    </a>`).join('\n')}
  </div>
</section>`;
}

function stateGrid(t, lang) {
  return `<section aria-labelledby="states-title">
  <h2 class="section-title" id="states-title">${esc(t.states.title)}</h2>
  <p class="section-sub">${esc(t.states.intro)}</p>
  <div class="stategrid">
    ${STATES.map((s) => `
    <a class="st" href="${dirFor(lang)}/states/${s.code}.html">
      <span class="code">${s.code}</span>
      <span>${esc(loc(s.name, lang))}</span>
    </a>`).join('\n')}
  </div>
</section>`;
}

function homeNotice(t, lang) {
  return `<section>
  <div class="notice">
    ${esc(t.footer.independence)}
  </div>
</section>`;
}

// ---------- pages ----------
function pageHome(lang) {
  const t = I18N[lang];
  const content = `
${emergencyBanner(t, lang)}
<div class="wrap">
  ${searchBox(t, { base: dirFor(lang) })}
  ${regionSelector(t, lang, dirFor(lang))}
  ${quickCards(t, lang)}
  ${catTiles(t, lang)}
  ${stateGrid(t, lang)}
  ${homeNotice(t, lang)}
</div>`;
  buildPage({
    lang, path: 'index.html', pageId: 'home',
    title: t9(t, 'meta.homeTitle'), desc: t9(t, 'meta.homeDesc'),
    content, altPath: 'index.html', searchable: true,
  });
}

function pageCategory(cat, lang) {
  const t = I18N[lang];
  const recs = catRecs[cat];
  const national = recs.filter((r) => r.scope === 'national');
  const local = recs.filter((r) => r.scope !== 'national');
  const byState = {};
  for (const r of local) {
    const code = r.scope.split(':')[1];
    (byState[code] = byState[code] || []).push(r);
  }

  let body = `<div class="dir" id="dir-list">`;
  if (national.length) body += recordList(national, cardOpts(lang));
  for (const code of Object.keys(byState).sort()) {
    body += recordList(byState[code], cardOpts(lang));
  }
  body += `</div>`;

  const content = `
<div class="wrap">
  <header class="pagehead">
    <p class="crumbs"><a href="${dirFor(lang)}/">${esc(t.nav.home)}</a> › <a href="${dirFor(lang)}/categories/emergency.html">${esc(t.categories.title)}</a></p>
    <h1>${icons[categoryIcon[cat]]({}).replace('<svg ', '<svg style="width:1.2em;height:1.2em" ')} ${esc(t.categories[cat])}</h1>
    <p class="section-sub">${esc(t9(t, 'categoryIntro.' + cat))}</p>
  </header>
  <section class="no-print" style="margin-top:0">
    <div class="stateselect" style="max-width:26rem">
      <label class="sr-only" for="cat-state-filter">${esc(t.states.choose)}</label>
      <select id="cat-state-filter"><option value="">${esc(t.states.placeholder)}</option></select>
    </div>
    <p class="search-status" style="margin-top:.5rem"><span id="cat-count">${recs.length}</span> ${lang === 'hi' ? 'प्रविष्टियाँ' : 'listing(s)'}</p>
  </section>
  ${body}
  ${recs.length === 0 ? `<div class="empty">${esc(t.search.noResults)} ${esc(t.search.noResultsTip)}</div>` : ''}
</div>`;
  buildPage({
    lang, path: `categories/${cat}.html`, pageId: 'cat-' + cat,
    title: t9(t, 'meta.categoryTitle', { cat: t.categories[cat] }),
    desc: t9(t, 'categoryIntro.' + cat),
    content,
  });
}

function pageState(code, lang) {
  const t = I18N[lang];
  const st = statesByCode[code];
  const name = loc(st.name, lang);
  const local = byCode[code];
  const content = `
<div class="wrap">
  <header class="pagehead">
    <p class="crumbs"><a href="${dirFor(lang)}/">${esc(t.nav.home)}</a> › <a href="${dirFor(lang)}/states/">${esc(t.states.title)}</a></p>
    <h1>${esc(name)}</h1>
    <p class="section-sub">${esc(t.states.helpElsewhere)}</p>
  </header>
  <section class="no-print">
    <div class="stateselect" data-region-form style="max-width:26rem">
      <label class="sr-only" for="statepick">${esc(t.states.choose)}</label>
      <select id="statepick" data-state-select data-current="${code}"><option value="">${esc(t.states.placeholder)}</option></select>
      <button type="button" data-state-go>${esc(t.states.go)}</button>
    </div>
    <p style="margin-top:1rem"><button class="btn-copy no-print" type="button" onclick="window.print()">${icons.printer(16)} ${esc(t.states.printThis)}</button>
    <a class="btn-copy no-print" style="text-decoration:none;display:inline-flex;align-items:center;gap:.4rem" href="${dirFor(lang)}/print.html">${esc(t.print.title)}</a></p>
  </section>
  <section aria-labelledby="local-title">
    <h2 class="section-title" id="local-title">${esc(t9(t, 'states.localTitle', { state: name }))}</h2>
    ${local.length
      ? recordList(local, cardOpts(lang))
      : `<div class="empty">${esc(t9(t, 'states.localEmpty', { state: name, coverageLink: '@@LINK@@' })).replace('@@LINK@@', `<a href="${dirFor(lang)}/coverage.html">${esc(t.nav.coverage)}</a>`)}</div>`}
  </section>
  <section aria-labelledby="national-title">
    <h2 class="section-title" id="national-title">${esc(t.states.nationalTitle)}</h2>
    <p class="section-sub">${esc(t9(t, 'states.nationalApplies', { state: name }))}</p>
    ${recordList(NATIONAL, cardOpts(lang))}
  </section>
</div>`;
  buildPage({
    lang, path: `states/${code}.html`, pageId: 'state-' + code,
    title: t9(t, 'meta.stateTitle', { state: name }),
    desc: `${name} — ${t9(t, 'siteTagline')}`,
    content,
  });
}

function pageStatesIndex(lang) {
  const t = I18N[lang];
  const content = `
<div class="wrap">
  <header class="pagehead">
    <p class="crumbs"><a href="${dirFor(lang)}/">${esc(t.nav.home)}</a></p>
    <h1>${esc(t.states.title)}</h1>
    <p class="section-sub">${esc(t.states.intro)}</p>
  </header>
  <section>${regionSelector(t, lang, dirFor(lang))}</section>
  <section>${stateGrid(t, lang)}</section>
</div>`;
  buildPage({ lang, path: 'states/index.html', pageId: 'states', title: t9(t, 'states.title'), desc: t9(t, 'states.intro'), content });
}

function pageCoverage(lang) {
  const t = I18N[lang];
  const rows = STATES.map((s) => {
    const n = byCode[s.code].length;
    const st = statesCompact.find((x) => x.code === s.code);
    return `<div class="cov-row">
      <span class="code">${s.code}</span>
      <span class="nm">${esc(loc(s.name, lang))}</span>
      ${n ? `<span class="badge-ok">${t9(t, 'coverage.hasLocal', { n })}</span>` : `<span class="badge-none">${esc(t9(t, 'coverage.noneYet'))}</span>`}
      <span class="st">${n ? byCode[s.code].map((r) => esc(loc(r.name, lang))).join(' · ') : ''}</span>
    </div>`;
  }).join('\n');
  const content = `
<div class="wrap">
  <header class="pagehead">
    <p class="crumbs"><a href="${dirFor(lang)}/">${esc(t.nav.home)}</a></p>
    <h1>${esc(t.coverage.title)}</h1>
    <p class="section-sub">${esc(t.coverage.intro)}</p>
    <p><strong>${t9(t, 'coverage.nationalCount', { count: NATIONAL.length })}</strong> · ${t9(t, 'coverage.lastChecked', { date: fmtDate(BUILD_DATE, lang) })}</p>
  </header>
  <section class="cov">${rows}</section>
  ${quarantined.length ? `<section><div class="notice blue">${lang === 'hi'
      ? `${quarantined.length} प्रविष्टियाँ अस्पष्ट स्रोतों के कारण क्वारंटाइन हैं और प्रकाशित नहीं हैं।`
      : `${quarantined.length} record(s) are quarantined because sources were unresolved — they are not published.`}</div></section>` : ''}
</div>`;
  buildPage({ lang, path: 'coverage.html', pageId: 'coverage', title: t9(t, 'coverage.title'), desc: t9(t, 'coverage.intro'), content });
}

function pagePrint(lang) {
  const t = I18N[lang];
  const natRows = NATIONAL.map((r) => `
    <div class="cov-row">
      <span class="nm" style="flex:1;min-width:14rem">${esc(loc(r.name, lang))}</span>
      <span style="font-variant-numeric:tabular-nums;font-weight:800">${esc(r.displayNumber)}</span>
      <span class="st">${r.scope === 'national' ? esc(t.record.scopeNational) : esc(r.scope.split(':')[1])}</span>
      <span class="st">${esc(fmtDate(r.checkedDate, lang))}</span>
    </div>`).join('\n');
  const stateSections = STATES.filter((s) => byCode[s.code].length).map((s) => `
    <section aria-labelledby="p-${s.code}">
      <h2 class="section-title" id="p-${s.code}">${t9(t, 'print.stateSection', { state: loc(s.name, lang), n: byCode[s.code].length })}</h2>
      <div class="cov">
        ${byCode[s.code].map((r) => `
        <div class="cov-row">
          <span class="nm" style="flex:1;min-width:14rem">${esc(loc(r.name, lang))}</span>
          <span style="font-variant-numeric:tabular-nums;font-weight:800">${esc(r.displayNumber)}</span>
          <span class="st">${esc(fmtDate(r.checkedDate, lang))}</span>
        </div>`).join('\n')}
      </div>
    </section>`).join('\n');
  const content = `
<div class="wrap">
  <header class="pagehead">
    <h1>${esc(t.print.title)}</h1>
    <p class="section-sub">${esc(t.print.intro)}</p>
    <p class="no-print"><button class="btn-copy" type="button" onclick="window.print()">${icons.printer(16)} ${esc(t.print.printButton)}</button></p>
  </header>
  <section aria-labelledby="p-nat">
    <h2 class="section-title" id="p-nat">${esc(t.print.nationalSection)}</h2>
    <div class="cov">${natRows}</div>
  </section>
  ${stateSections}
  <p class="foot-note" style="margin-top:2rem">${esc(t.footer.independence)}</p>
</div>`;
  buildPage({ lang, path: 'print.html', pageId: 'print', title: t9(t, 'print.title'), desc: t9(t, 'print.intro'), content });
}

function pageAbout(lang) {
  const t = I18N[lang];
  const faq = ['q1', 'q2', 'q3', 'q4'].map((k, i) => `
    <details class="svc-details" style="background:var(--surface);border:1px solid var(--line);border-radius:var(--r-md);padding:1rem 1.2rem">
      <summary>${esc(t.faq['q' + (i + 1)])}</summary>
      <p style="color:var(--ink-soft);margin:.6rem 0 0">${esc(t.faq['a' + (i + 1)])}</p>
    </details>`).join('\n');
  const content = `
<div class="wrap">
  <header class="pagehead">
    <p class="crumbs"><a href="${dirFor(lang)}/">${esc(t.nav.home)}</a></p>
    <h1>${esc(t.about.title)}</h1>
  </header>
  <section style="max-width:46rem">
    <p>${esc(t.about.p1)}</p>
    <p>${esc(t.about.p2)}</p>
    <p>${esc(t.about.p3)}</p>
    <h2 class="section-title" style="margin-top:2rem">${esc(t.about.verifyTitle)}</h2>
    <div class="dir" style="grid-template-columns:1fr">
      ${['verify1', 'verify2', 'verify3', 'verify4'].map((k, i) => `
      <div class="cov-row"><span class="code">${i + 1}</span><span class="st">${esc(t.about[k])}</span></div>`).join('\n')}
    </div>
    <div class="notice blue" style="margin-top:1.5rem">${esc(cfg.ownerNote)}</div>
    <h2 class="section-title" style="margin-top:2.5rem">${esc(t.faq.title)}</h2>
    <div class="dir" style="grid-template-columns:1fr">
      ${faq}
    </div>
  </section>
</div>`;
  buildPage({ lang, path: 'about.html', pageId: 'about', title: t9(t, 'about.title'), desc: t9(t, 'about.p1'), content });
}

function pagePrivacy(lang) {
  const t = I18N[lang];
  const content = `
<div class="wrap">
  <header class="pagehead">
    <p class="crumbs"><a href="${dirFor(lang)}/">${esc(t.nav.home)}</a></p>
    <h1>${esc(t.privacy.title)}</h1>
  </header>
  <section style="max-width:46rem">
    <p>${esc(t.privacy.p1)}</p>
    <p>${esc(t.privacy.p2)}</p>
    <p>${esc(t.privacy.p3)}</p>
    <p>${esc(t.privacy.p4)}</p>
    <p>${esc(t.privacy.p5)}</p>
  </section>
</div>`;
  buildPage({ lang, path: 'privacy.html', pageId: 'privacy', title: t9(t, 'privacy.title'), desc: t9(t, 'privacy.p1'), content });
}

function pageSearch(lang) {
  const t = I18N[lang];
  const catTilesHtml = CATS.map((c) => `
    <a class="tile" href="${dirFor(lang)}/categories/${c}.html">
      <span class="ic">${icons[categoryIcon[c]]()}</span>
      <span class="t">${esc(t.categories[c])}</span>
      <span class="c">${catRecs[c].length}</span>
    </a>`).join('\n');
  const content = `
<div class="wrap">
  <header class="pagehead">
    <p class="crumbs"><a href="${dirFor(lang)}/">${esc(t.nav.home)}</a></p>
    <h1>${esc(t.search.label)}</h1>
  </header>
  ${searchBox(t, { base: dirFor(lang) })}
  <section style="margin-top:2.5rem">
    <h2 class="section-title">${esc(t.categories.title)}</h2>
    <div class="tilegrid">${catTilesHtml}</div>
  </section>
</div>`;
  buildPage({ lang, path: 'search.html', pageId: 'search', title: t9(t, 'search.submit'), desc: t9(t, 'search.byNumber'), content, searchable: true });
}

function page404(lang) {
  const t = I18N[lang];
  const content = `
<div class="wrap">
  <header class="pagehead">
    <h1>${esc(t.meta.notFound)}</h1>
    <p class="section-sub">${esc(t.meta.notFoundBody)}</p>
    <p><a class="btn-call" style="display:inline-flex;text-decoration:none" href="tel:112">${icons.phone(18)} <span>112</span></a></p>
    <p><a href="${dirFor(lang)}/">${esc(t.meta.notFoundHome)}</a></p>
  </header>
</div>`;
  buildPage({ lang, path: '404.html', pageId: '404', title: t9(t, 'meta.notFound'), desc: t9(t, 'meta.notFoundBody'), content });
}

// ---------- assets ----------
function writeAssets() {
  mkdirSync(join(SITE, 'ui'), { recursive: true });
  copyFileSync(join(ROOT, 'src/assets/styles.css'), join(SITE, 'ui/styles.css'));
  copyFileSync(join(ROOT, 'src/assets/app.js'), join(SITE, 'ui/app.js'));
  // sw.js at the site root so its scope covers all pages
  copyFileSync(join(ROOT, 'src/assets/sw.js'), join(SITE, 'sw.js'));
  copyFileSync(join(ROOT, 'src/assets/favicon.svg'), join(SITE, 'ui/favicon.svg'));
  copyFileSync(join(ROOT, 'src/assets/maskable.svg'), join(SITE, 'ui/maskable.svg'));
  copyFileSync(join(ROOT, 'src/assets/manifest.webmanifest'), join(SITE, 'manifest.webmanifest'));
  write('robots.txt', 'User-agent: *\nAllow: /\n');
  write('directory.json', JSON.stringify({
    build: BUILD_DATE,
    contact: cfg.contactEmail,
    states: statesCompact,
    records: published.map((r) => ({
      id: r.id, name: r.name, operator: r.operator, purpose: r.purpose,
      category: r.category, serviceType: r.serviceType,
      displayNumber: r.displayNumber, dial: r.dial, scope: r.scope,
      sourceUrl: r.sourceUrl, hours: r.hours, charges: r.charges,
      channels: r.channels, aliases: r.aliases, languages: r.languages,
      notes: r.notes || null, checkedDate: r.checkedDate,
    })),
  }));
  console.log('  wrote assets + directory.json');
}

// ---------- main ----------
console.log('Building India Helpline…');
for (const lang of ['en', 'hi']) {
  console.log('— language:', lang);
  pageHome(lang);
  for (const c of CATS) pageCategory(c, lang);
  pageStatesIndex(lang);
  for (const s of STATES) pageState(s.code, lang);
  pageCoverage(lang);
  pagePrint(lang);
  pageAbout(lang);
  pagePrivacy(lang);
  pageSearch(lang);
  page404(lang);
}
writeAssets();

console.log(`\nDone. ${published.length} published records, ${quarantined.length} quarantined.`);
console.log(`National: ${NATIONAL.length}, states with local listings: ${STATES.filter((s) => byCode[s.code].length).length}/${STATES.length}`);
if (!siteUrl) console.log('(pass --site-url <https://...> to add canonical URLs)');
