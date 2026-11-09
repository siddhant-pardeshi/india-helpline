# Changelog

All notable changes to the directory data and the site. Dates are the local
date the change was verified/built.

## 2026-11-09 — later the same day: north + south/west batches + hardening

- **+61 verified state/UT records** across 7 jurisdictions (north batch), later +39 across RJ/GJ/MH/GA/KA/KL/TN/AP/TS (south/west batch) — 16/36 jurisdictions live — Delhi (10),
  Haryana (8), Punjab (5), Himachal Pradesh (12), Uttarakhand (9),
  Uttar Pradesh (5), Jammu & Kashmir (12) — each with its own official state
  source page and evidence quote.
- **+1 national record**: 1906 LPG Emergency Helpline (MoPNG/OMCs, 24x7).
- **7 quarantined for audit**: five state-scope 112 duplicates of the national
  ERSS record; one landline whose source omits the STD code; one portal
  tech-support line (e-RaktKosh) that is not a public-assistance number.
- **`data/leads.md` created**: unverified leads ledger (KIRAN conflict,
  discom numbers, unreachable-SDMA gaps, RPF 1512, WCCB…).
- **Site fixes**: service-worker syntax error that had blocked registration
  everywhere; `wireRegion` null crash on state pages; out-of-state numbers
  hard-excluded from search; region select persists immediately; Devanagari
  search (transliteration); fuzzy-matching tightened; WCAG contrast tokens
  corrected (all pairs ≥ 4.57); mobile overflow at 320/390px; topbar/hero
  double-class padding bug; offline pill now shows the saved date.
- **Build hardening**: `node --check` syntax gate on shipped scripts.
- **Additions**: sitemap.xml (102 URLs), og:image + apple-touch-icon PNGs,
  media-scoped theme-color, noscript hint on search.
- **Repo page**: animated footer (pulsing badge, radar rings,
  verify→publish→retire ticker, numbers marquee) + motion on the banner,
  `prefers-reduced-motion` honored; voice walkthrough (MP3 1:50) with
  transcript.

## 2026-11-09 — initial release

- Site: first complete build (EN + HI trees, 36 jurisdiction pages, 8
  category pages, coverage, print, about, privacy, search, 404; service
  worker + PWA manifest).
- Verified national records published (10):
  - 112 ERSS (112.gov.in)
  - 139 RailMadad — railway security & medical (railmadad.indianrailways.gov.in)
  - 1930 Cyber/financial fraud (i4c.mha.gov.in)
  - 1098 Child Helpline (wcd.gov.in, Mission Vatsalya)
  - 181 Women Helpline (wcd.gov.in, Mission Shakti) — note: not operational in West Bengal per scheme document
  - 15100 NALSA legal aid (nalsa.gov.in)
  - 14567 Elderline (dosje.gov.in) — 8 AM–8 PM, not 24x7
  - 14456 Divyangjan disability helpline (PIB/DEPwD) + Divya WhatsApp chatbot
  - 1091 women distress police line (MHA/BPR&D advisory)
  - 7827-170-170 NCW 24x7 women helpline (NCW annual report)
- Later the same day (same release cycle): +7 health records (Tele-MANAS,
  108, 102, 2× poison centres, PM-JAY, Vay Vandana) and +10 travel/disaster
  records (182, 1033, 1363, 1078, NDMA control room, NDRF, 1554, IMD,
  MoEFCC, AirSewa) — see national-health.json, national-travel.json.
- Leads quarantined during research: none published without a verifiable
  official source; unverified candidates remain in data/leads.md.
- Known gaps: state/UT coverage is being extended batch by batch (see
  coverage page).
