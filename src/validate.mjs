#!/usr/bin/env node
/* India Helpline — directory validator.
   Validates required fields, duplicates, dial-link consistency, scopes,
   dates and link schemes. Publishes nothing itself: run before deploy.
   Usage: node src/validate.mjs [--stale-days 365] */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
let staleDays = 365;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--stale-days') staleDays = Number(argv[i + 1]) || 365;
}

const errors = [];
const warnings = [];
const err = (id, msg) => errors.push(`[${id}] ${msg}`);
const warn = (id, msg) => warnings.push(`[${id}] ${msg}`);

// ---- load ----
const STATES = JSON.parse(readFileSync(join(ROOT, 'data/states.json'), 'utf8')).jurisdictions;
const CODES = new Set(STATES.map((s) => s.code));

let RECORDS = [];
let srcFile = '(unknown)';
const files = [];
const recDir = join(ROOT, 'data/records');
for (const f of readdirSync(recDir).filter((f) => f.endsWith('.json'))) files.push(join(recDir, f));
const sdir = join(recDir, 'states');
if (existsSync(sdir)) for (const f of readdirSync(sdir).filter((f) => f.endsWith('.json'))) files.push(join(sdir, f));
for (const f of files) {
  srcFile = f;
  const arr = JSON.parse(readFileSync(f, 'utf8'));
  for (const r of arr) if (r && r.id && !r.coverageNotes) RECORDS.push({ ...r, __src: f });
}

// normalize code aliases like the build does
const CODE_ALIAS = { UK: 'UT', CG: 'CT' };
for (const r of RECORDS) {
  if (String(r.scope).startsWith('state:')) {
    const c = r.scope.split(':')[1];
    if (CODE_ALIAS[c]) r.scope = 'state:' + CODE_ALIAS[c];
  }
}

const CATS = new Set(['emergency', 'health', 'safety', 'disaster', 'travel', 'utilities', 'crime', 'other']);
const TYPES = new Set(['dispatch', 'reporting', 'advice', 'complaints']);
// local calendar date (the operator's clock), not UTC
const _now = new Date();
const TODAY = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`;

const seenIds = new Map();
const seenNum = new Map();
const published = RECORDS.filter((r) => r.status === 'published');

const digitsOf = (s) => String(s).replace(/\D/g, '');
const isShortCode = (digits) => digits.length <= 5 || /^(1[0-9]{2}|10[0-9])$/.test(digits);

for (const r of RECORDS) {
  const id = r.id || '(no id)';

  // required fields
  for (const f of ['id', 'name', 'operator', 'purpose', 'category', 'serviceType', 'displayNumber', 'dial', 'scope', 'sourceUrl', 'checkedDate', 'status']) {
    if (r[f] === undefined || r[f] === null || r[f] === '') err(id, `missing required field: ${f}`);
  }
  if (!r.name?.en) err(id, 'missing name.en');
  if (!r.purpose?.en) err(id, 'missing purpose.en');
  if (!CATS.has(r.category)) err(id, `unknown category: ${r.category}`);
  if (!TYPES.has(r.serviceType)) err(id, `unknown serviceType: ${r.serviceType}`);

  // ids unique
  if (seenIds.has(r.id)) err(id, `duplicate id (also in ${seenIds.get(r.id)})`);
  else seenIds.set(r.id, r.__src || srcFile);

  // scope
  if (r.scope && r.scope !== 'national' && !/^state:[A-Z]{2}$/.test(r.scope)) err(id, `bad scope: ${r.scope}`);
  if (r.scope?.startsWith('state:') && !CODES.has(r.scope.split(':')[1])) err(id, `unknown state code in scope: ${r.scope}`);

  // numbers
  if (r.displayNumber && r.dial) {
    const dNum = digitsOf(r.displayNumber);
    const dDial = digitsOf(r.dial);
    if (!dNum) err(id, 'displayNumber has no digits');
    if (r.dial === r.displayNumber && r.dial === dDial) {
      // fine — pure digits
    } else if (dDial !== dNum && dDial !== '91' + dNum && !dDial.endsWith(dNum)) {
      err(id, `dial digits (${dDial}) do not match displayNumber digits (${dNum})`);
    }
    if (isShortCode(dNum) && String(r.dial).startsWith('+91')) err(id, 'never prepend +91 to short codes');
    if (String(r.dial).startsWith('0091')) err(id, 'dial uses 0091 prefix');
    if (dNum.length > 5 && dNum.length < 10 && dNum[0] !== '1') warn(id, `number length ${dNum.length} — verify STD/area code preserved`);
    if (dNum.length === 10 && !/^(1800|[6-9])/.test(dNum)) warn(id, '10-digit number should start 6-9 or be 1800 toll-free');
  }

  // source URL
  if (r.sourceUrl && !/^https:\/\//.test(r.sourceUrl)) err(id, 'sourceUrl must be https');

  // checked date
  if (r.checkedDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.checkedDate)) err(id, `bad checkedDate format: ${r.checkedDate}`);
    else {
      if (r.checkedDate > TODAY) err(id, 'checkedDate is in the future');
      const days = Math.floor((new Date(TODAY) - new Date(r.checkedDate)) / 86400000);
      if (days > staleDays && r.status === 'published') warn(id, `checked ${days} days ago — due for review`);
    }
  }

  // status hygiene
  if (r.status && r.status !== 'published' && !r.statusNote) err(id, 'quarantined/withdrawn records need statusNote');

  // aliases sanity
  if (r.status === 'published' && !(Array.isArray(r.aliases) && r.aliases.length)) warn(id, 'no aliases — search findability suffers');

  // duplicate number+scope
  if (r.status === 'published') {
    const key = digitsOf(r.displayNumber) + '@' + r.scope;
    if (seenNum.has(key)) warn(id, `same number+scope as ${seenNum.get(key)} — verify these are distinct services`);
    else seenNum.set(key, id);
  }
}

// 112 must exist and be reserved for emergency
const erss = published.find((r) => digitsOf(r.displayNumber) === '112');
if (!erss) err('site', '112 record missing');
else if (erss.category !== 'emergency') err(erss.id, '112 must be category emergency');
else if (erss.serviceType !== 'dispatch') err(erss.id, '112 must be serviceType dispatch');

// state coverage report
const byState = {};
for (const r of published) {
  if (r.scope.startsWith('state:')) {
    const c = r.scope.split(':')[1];
    byState[c] = (byState[c] || 0) + 1;
  }
}

// ---- report ----
console.log('India Helpline — directory validation');
console.log('=====================================');
console.log(`records total: ${RECORDS.length}`);
console.log(`published: ${published.length}`);
console.log(`quarantined/withdrawn: ${RECORDS.length - published.length}`);
console.log(`national published: ${published.filter((r) => r.scope === 'national').length}`);
console.log(`jurisdictions with local listings: ${Object.keys(byState).length}/${STATES.length}`);
if (Object.keys(byState).length) {
  console.log('  ' + Object.entries(byState).map(([c, n]) => `${c}:${n}`).join('  '));
}
console.log('');
if (errors.length) {
  console.log(`ERRORS (${errors.length}):`);
  for (const e of errors) console.log('  ✗ ' + e);
} else {
  console.log('errors: none');
}
if (warnings.length) {
  console.log(`\nwarnings (${warnings.length}):`);
  for (const w of warnings) console.log('  ⚠ ' + w);
} else {
  console.log('warnings: none');
}
console.log('');
if (errors.length) {
  console.log('RESULT: FAIL — fix errors before publishing.');
  process.exit(1);
}
console.log('RESULT: PASS');
