# India Helpline — Maintenance Guide

This directory is a small, dependency-free static site. Anyone who can edit a
JSON file and run one Node command can maintain it.

## What lives where

| Path | Purpose |
|---|---|
| `data/states.json` | Official list of States & UTs (ISO 3166-2 codes) |
| `data/records/national.json` | Verified **national** helpline records |
| `data/records/states/*.json` | Verified **state/UT-level** records (one file per state group, `scope: "state:XX"`) |
| `data/leads.md` | Unverified leads. **Never published** — do not move a lead into `records/` until you have verified it yourself |
| `i18n/en.json`, `i18n/hi.json` | All interface text (English / Hindi) |
| `src/build.mjs` | Static site generator → `site/` |
| `src/validate.mjs` | Data validator — run before every publish |
| `src/lib/`, `src/assets/` | Templates, design system, client JS, service worker |
| `config.json` | Owner contact e-mail (report-incorrect-details channel) |

## Record schema (each published record needs ALL of these)

```json
{
  "id": "stable-kebab-id",              // never change once published
  "name": { "en": "…", "hi": "…" },     // hi optional, falls back to en
  "operator": "…",
  "purpose": { "en": "…", "hi": "…" },  // what happens when you call
  "category": "emergency|health|safety|disaster|travel|utilities|crime|other",
  "serviceType": "dispatch|reporting|advice|complaints",
  "displayNumber": "112",               // exactly as the operator publishes it
  "dial": "112",                        // tel: string — short codes NEVER get +91
  "scope": "national",                  // or "state:XX" with the ISO code
  "sourceUrl": "https://…",             // the page YOU read the number on
  "hours": "24x7 | 8:00 AM – 8:00 PM (IST) | Hours not published",
  "charges": "toll-free | charged | not published",
  "channels": { "sms": null, "whatsapp": null, "web": null },
  "aliases": ["transliterations", "common misspellings"],
  "languages": ["documented operator languages"],
  "evidence": "verbatim quote from the source page",
  "checkedDate": "YYYY-MM-DD",
  "status": "published"                 // or "quarantined"/"withdrawn" + statusNote
}
```

## How to verify a new or replacement record

1. Open the **operator's own page** (gov.in / official operator domain). Search
   snippets and other directories are not sources.
2. Match **digits, operator, purpose and jurisdiction** against the page text.
   Quote the confirming sentence into `evidence`.
3. Never infer 24x7, toll-free status, or nationwide coverage from a short
   code — only publish what the source states. Say `Hours not published` when
   the source is silent.
4. Add the record to the right file with today's `checkedDate` (local date).
5. `node src/validate.mjs` → must print `RESULT: PASS`.
6. `node src/build.mjs` → rebuilds `site/`. Deploy per your host's process.
7. Commit data + `site/` together. Update `CHANGELOG.md`.

## Review cycle

- **Owner role**: one named person owns the directory (see `config.json`).
- **Interval**: re-check every record at least every **180 days**; the
  validator warns at 365. Prioritize dispatch lines (112, 108, fire) monthly.
- **Broken link / complaint** → re-open the source within 2 working days.
- **Retire quickly**: set `"status": "withdrawn"` + `statusNote` → validate →
  rebuild → deploy. The record disappears from the site and from the offline
  cache after the visitor's next online visit (service worker refreshes
  `directory.json` and pages network-first).
- **Quarantine**: if sources conflict or can't be re-confirmed, set
  `"status": "quarantined"` + `statusNote` (reason). Quarantined records never
  render; the coverage page shows how many are held back.
- **Change history**: `CHANGELOG.md` + git history of `data/`.
- **Rollback**: revert the data commit, rebuild, redeploy — the site is fully
  static, so rollback is a redeploy of the previous build.

## Owner contact channel (action needed)

`config.json` currently ships a **placeholder** e-mail
(`reports@indiahelpline.example`). The owner must replace it with a mailbox or
issue tracker they actually monitor. Until then, every listing's "Report
incorrect details" mailto points at the placeholder and the About page
discloses this gap openly — a deliberate choice over pretending a monitored
channel exists.

## Deployment

The `site/` folder is plain static files — host it anywhere (any static host,
object storage, nginx). After deploy, run `node src/build.mjs --site-url
https://<final-url>` once so canonical/hreflang URLs are absolute, rebuild and
re-upload.
