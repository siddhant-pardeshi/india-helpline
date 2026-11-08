/* India Helpline — client app. No external requests. Progressive enhancement only. */
(() => {
  'use strict';

  const D = window.__IH__ || { states: [], index: [], build: '', bp: '' };
  const BP = D.bp || '';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const page = document.body.dataset.page || '';
  const lang = document.documentElement.lang || 'en';
  const base = BP + (lang === 'hi' ? '/hi' : '');

  const STATE_KEY = 'ih:state';

  /* ---------- normalize + search ---------- */
  const STOP = new Set(['chahiye','chaahiye','mujhe','mera','meri','hai','help','madad','sahayata','sahayta','need','want','please','karo','kare','in','on','for','a','the','my','me','is','of','and','to']);

  const norm = (s) => String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // global synonyms: user word -> canonical tokens to also try
  const SYN = {
    aag: ['fire','emergency'], agni: ['fire'], agg: ['fire'], aaglagi: ['fire'],
    ambulence: ['ambulance'], ambulans: ['ambulance'], emblance: ['ambulance'], ambulancechahiye: ['ambulance'],
    pulis: ['police'], pulice: ['police'],
    baccha: ['child'], bachcha: ['child'], bacha: ['child'], balak: ['child'], bacche: ['child'], kid: ['child'], bachpan: ['child'],
    khoagya: [], khoya: ['lost','child'], khoagayi: ['lost','child'], khoagaya: ['lost','child'],
    thagi: ['fraud','cyber'], dhoka: ['fraud'], dhokha: ['fraud'], paisa: ['fraud','financial'], paise: ['fraud','financial'], scam: ['fraud'], frad: ['fraud'], fruad: ['fraud'],
    zeher: ['poison'], vish: ['poison'],
    khoon: ['blood'], rakta: ['blood'],
    gaadi: ['railway','train'], gadi: ['railway','train'], rel: ['railway'], railgadi: ['railway','train'],
    bhukamp: ['earthquake','disaster'], baadh: ['flood','disaster'], badh: ['flood','disaster'], tufan: ['cyclone','disaster'], samudra: ['coast','sea','rescue'],
    gasleak: ['gas','lpg'], lpg: ['gas'], chulha: ['gas','lpg'],
    bijli: ['electricity','power'], current: ['electricity','power'], bijlikata: ['electricity'],
    hinsa: ['violence'], maarpeet: ['violence'], atyachar: ['violence','abuse'],
    manasik: ['mental'], avsad: ['mental','depression'], depression: ['mental'], pareshan: ['mental','counselling'], dukhi: ['mental'],
    buzurg: ['elder','senior'], budha: ['elder'], budhi: ['elder'], vriddh: ['elder'],
    andha: ['disability'], divyang: ['disability'], viklang: ['disability'],
    kanoon: ['legal'], vakil: ['legal','advocate'], adhivakta: ['legal'],
    ashram: ['shelter'], aashray: ['shelter'],
    mahila: ['women'], stri: ['women'],
    udhaar: [], bank: ['fraud','bank'], atm: ['fraud','bank'],
    rasta: ['highway'], highway: ['highway'], sadak: ['highway','road'], marg: ['highway'],
    pravasi: ['migrant'], mazdoor: ['worker','migrant'],
    jaanwar: ['animal'], pashu: ['animal'], kutta: ['animal'], billi: ['animal'],
    machli: ['coast','sea'], fisherman: ['coast'],
    garmi: ['heat'], loo: ['heat'], garmi: ['heat'],
    barf: ['snow'], jungle: ['forest'], aagjungle: ['forest','fire'],
    chori: ['theft'], chor: ['theft'],
    maut: [], lash: [], shav: [],
    upi: ['fraud','upi'], paytm: ['fraud','upi'], gpay: ['fraud','upi'], phonepe: ['fraud','upi'],
    dokan: [], bima: [],
  };

  function tokens(q) {
    return norm(q).split(' ').filter((w) => w && !STOP.has(w));
  }

  function expand(word) {
    const out = [word];
    if (SYN[word]) SYN[word].forEach((w) => out.push(w));
    // light stemming: try dropping trailing plural-ish chars
    if (word.length > 4 && word.endsWith('s')) out.push(word.slice(0, -1));
    if (word.length > 5 && word.endsWith('es')) out.push(word.slice(0, -2));
    return out;
  }

  function editDistance(a, b, max = 2) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      let best = i;
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
        best = Math.min(best, cur[j]);
      }
      if (best > max) return max + 1;
      prev = cur;
    }
    return prev[b.length];
  }

  const URGENCY = { emergency: 3, health: 2.2, safety: 2, disaster: 2, crime: 1.6, utilities: 1.2, travel: 1, other: 0.8 };

  function scoreRec(rec, words, stateSel) {
    let s = 0;
    const hay = { name: norm(rec.n), purpose: norm(rec.p), alias: (rec.a || []).map(norm).join(' '), op: norm(rec.o), num: rec.num.replace(/\D/g, ''), cat: rec.cat, scope: rec.scope };
    const digitsQ = (String(D.__q_digits || ''));

    for (const w of words) {
      const forms = expand(w);
      let matched = false;
      for (const f of forms) {
        if (!f) continue;
        // number exact / prefix
        if (hay.num === f) { s += 1000; matched = true; continue; }
        if (hay.num.startsWith(f) && f.length >= 2) { s += 500; matched = true; continue; }
        // name
        if (hay.name === f) { s += 600; matched = true; continue; }
        if (hay.name.startsWith(f)) { s += 350; matched = true; continue; }
        if (hay.name.includes(f)) { s += 220; matched = true; continue; }
        // aliases
        if (hay.alias) {
          const aliasWords = hay.alias.split(' ');
          if (aliasWords.includes(f)) { s += 400; matched = true; continue; }
          if (aliasWords.some((aw) => aw.startsWith(f) && f.length >= 3)) { s += 260; matched = true; continue; }
          if (hay.alias.includes(f)) { s += 180; matched = true; continue; }
        }
        // purpose
        if (hay.purpose.includes(f) && f.length >= 3) { s += 120; matched = true; continue; }
        // operator
        if (hay.op.includes(f) && f.length >= 3) { s += 100; matched = true; continue; }
        // category
        if (hay.cat === f || hay.cat.includes(f)) { s += 90; matched = true; continue; }
        // fuzzy on name + alias words
        if (f.length >= 4) {
          const pool = hay.name.split(' ').concat(hay.alias ? hay.alias.split(' ') : []);
          for (const pw of pool) {
            if (Math.abs(pw.length - f.length) <= 2) {
              const d = editDistance(f, pw, 2);
              if (d <= 2) { s += 150 - d * 40; matched = true; }
            }
          }
        }
      }
      if (!matched) s -= 40; // every unmatched word hurts
    }

    if (s <= 0) return -1;

    // scope: chosen state first, national next, other states excluded from "local" but flagged
    if (stateSel) {
      if (rec.scope === 'state:' + stateSel) s += 300;
      else if (rec.scope === 'national') s += 120;
      else if (rec.scope.startsWith('state:')) s -= 200; // another state's local number
    }
    // urgency multiplier
    s *= 1 + (URGENCY[rec.cat] || 1) * 0.06;
    return s;
  }

  function highlight(text, words) {
    let html = text;
    for (const w of words) {
      if (w.length < 3) continue;
      const re = new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      html = html.replace(re, '<mark class="m">$1</mark>');
    }
    return html;
  }

  function recLink(rec) {
    if (rec.scope === 'national') return `${base}/categories/${rec.cat}.html#${rec.id}`;
    const code = rec.scope.split(':')[1];
    return `${base}/states/${code}.html#${rec.id}`;
  }

  function scopeTag(rec, statesById) {
    if (rec.scope === 'national') return lang === 'hi' ? 'पूरा भारत' : 'All India';
    const code = rec.scope.split(':')[1];
    const st = (D.states || []).find((s) => s.code === code);
    const nm = st ? (lang === 'hi' ? st.hi : st.en) : code;
    return lang === 'hi' ? `केवल ${nm}` : nm + ' only';
  }

  function runSearch(q, box, results) {
    results.innerHTML = '';
    const words = tokens(q);
    if (!words.length) return;
    const digits = q.replace(/\D/g, '');
    const stateSel = localStorage.getItem(STATE_KEY) || '';

    const scored = [];
    for (const rec of D.index || []) {
      const s = scoreRec(Object.assign({ __q_digits: digits }, rec), words, stateSel);
      if (s > 0) scored.push([s, rec]);
    }
    scored.sort((a, b) => b[0] - a[0] || a[1].n.localeCompare(b[1].n));
    const top = scored.slice(0, 8).map((x) => x[1]);

    const status = document.createElement('p');
    status.className = 'search-status';
    if (!top.length) {
      status.textContent = lang === 'hi'
        ? 'कोई मेल नहीं मिला। दूसरा शब्द आज़माएँ, या नीचे सभी सेवाएँ देखें। अगर यह आपात स्थिति है, तो 112 पर कॉल करें।'
        : 'No matching service found. Try another word, or browse all services below. If it is an emergency, call 112.';
      results.appendChild(status);
      return;
    }
    status.textContent = (lang === 'hi' ? top.length + ' परिणाम — ' : top.length + ' result(s) — ') + q;
    results.appendChild(status);

    for (const rec of top) {
      const a = document.createElement('a');
      a.className = 'mini';
      a.href = recLink(rec);
      const nm = lang === 'hi' && rec.nh ? rec.nh : rec.n;
      const dsc = lang === 'hi' && rec.ph ? rec.ph : rec.p;
      a.innerHTML =
        `<span class="num">${rec.num}</span>` +
        `<span class="meta"><span class="t">${highlight(nm, words)}</span>` +
        `<span class="d">${highlight(dsc, words)} · ${scopeTag(rec)}</span></span>`;
      results.appendChild(a);
    }
  }

  function wireSearch() {
    const input = $('#q');
    const results = $('#search-results');
    if (!input || !results) return;
    let deb;
    input.addEventListener('input', () => {
      clearTimeout(deb);
      deb = setTimeout(() => runSearch(input.value, input, results), 90);
    });
    input.addEventListener('search', () => runSearch(input.value, input, results));
    // keyboard navigation
    input.addEventListener('keydown', (e) => {
      const items = $$('.mini', results);
      if (!items.length) return;
      let idx = items.findIndex((el) => el.classList.contains('focus'));
      if (e.key === 'ArrowDown') { e.preventDefault(); idx = Math.min(idx + 1, items.length - 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); idx = Math.max(idx - 1, 0); }
      else if (e.key === 'Enter' && idx >= 0) { location.href = items[idx].href; return; }
      else if (e.key === 'Escape') { results.innerHTML = ''; input.value = ''; return; }
      else return;
      items.forEach((el, i) => el.classList.toggle('focus', i === idx));
      items[idx] && items[idx].focus();
    });
    // prefill from ?q=
    const qp = new URLSearchParams(location.search).get('q');
    if (qp) { input.value = qp; runSearch(qp, input, results); input.focus(); }
  }

  /* ---------- copy buttons ---------- */
  function wireCopy() {
    $$('.btn-copy').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const val = btn.dataset.copy || '';
        try { await navigator.clipboard.writeText(val); }
        catch {
          const ta = document.createElement('textarea');
          ta.value = val; document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); } catch {}
          ta.remove();
        }
        toast(lang === 'hi' ? 'नंबर कॉपी हुआ' : 'Number copied');
      });
    });
  }

  let toastT;
  function toast(msg) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove('show'), 1800);
  }

  /* ---------- region select ---------- */
  function wireRegion() {
    const sel = $('[data-state-select]');
    if (!sel) return;
    // populate
    for (const st of D.states || []) {
      const o = document.createElement('option');
      o.value = st.code;
      o.textContent = lang === 'hi' ? st.hi : st.en;
      sel.appendChild(o);
    }
    // restore
    const saved = localStorage.getItem(STATE_KEY);
    const cur = sel.dataset.current;
    if (cur) sel.value = cur;
    else if (saved) sel.value = saved;
    sel.closest('form').addEventListener('submit', (e) => {
      e.preventDefault();
      const v = sel.value;
      if (!v) return;
      localStorage.setItem(STATE_KEY, v);
      location.href = `${base}/states/${v}.html`;
    });
  }

  /* ---------- offline / SW ---------- */
  function wireOffline() {
    const update = () => {
      document.documentElement.classList.toggle('offline', !navigator.onLine);
    };
    update();
    addEventListener('online', update);
    addEventListener('offline', update);

    const pill = $('#offline-pill-text');
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(BP + '/sw.js').catch(() => {});
      navigator.serviceWorker.ready.then((reg) => {
        if (pill && D.build) pill.textContent = (lang === 'hi' ? 'ऑफ़लाइन के लिए सहेजा गया' : 'Saved for offline use');
      });
      navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data && e.data.type === 'cached-date' && pill) {
          pill.textContent = (lang === 'hi' ? 'सहेजा गया ' : 'Saved ') + e.data.date;
        }
      });
    }
  }

  /* ---------- category page state filter ---------- */
  function wireCatFilter() {
    const sel = $('#cat-state-filter');
    if (!sel) return;
    for (const st of D.states || []) {
      const o = document.createElement('option');
      o.value = st.code;
      o.textContent = (lang === 'hi' ? st.hi : st.en);
      sel.appendChild(o);
    }
    const apply = () => {
      const v = sel.value;
      const cards = $$('.dir .svc');
      let shown = 0;
      for (const c of cards) {
        const scope = c.dataset.scope;
        const show = !v || scope === 'national' || scope === 'state:' + v;
        c.style.display = show ? '' : 'none';
        if (show) shown++;
      }
      const count = $('#cat-count');
      if (count) count.textContent = shown;
    };
    sel.addEventListener('change', () => {
      if (sel.value) localStorage.setItem(STATE_KEY, sel.value);
      apply();
    });
    const saved = localStorage.getItem(STATE_KEY);
    if (saved && !sel.value) sel.value = saved;
    apply();
  }

  /* ---------- record state filter on state pages (national vs local already server-rendered) ---------- */
  function boot() {
    wireSearch();
    wireCopy();
    wireRegion();
    wireOffline();
    wireCatFilter();
    // highlight :target record gently
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el && el.classList.contains('svc')) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.boxShadow = '0 0 0 3px var(--focus)';
        setTimeout(() => { el.style.boxShadow = ''; }, 2200);
      }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
