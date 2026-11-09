# Unverified leads — NOT published

Numbers and gaps collected during research that could **not** be verified on an
official, reachable source page during the check. They are recorded here so
future review rounds can re-check them, and so nobody mistakes them for
directory data. **None of these appear anywhere on the website.**

| Lead | Why it is not published | Source status at check (2026-11-09) |
|---|---|---|
| KIRAN 1800-599-0019 (mental health) | PIB (Feb 2025) says it was **merged into Tele-MANAS in 2022**; other listings still show it active — conflicting sources | conflict — see national-telemanas-14416 notes |
| Mahanagar Gas (Mumbai) 1800-266-9944 | Not verified on an official Mahanagar Gas page | lead only |
| GAIL Gas 15101 | Not verified on an official GAIL page | lead only |
| BRPL 19123 / BYPL 19122 (Delhi discoms) | bsesdelhi.com blocks automated access; numbers seen in secondary sources | lead only |
| TPDDL 19124 (Delhi discom) | tatapower-ddl.com blocks automated access | lead only |
| UHBVN 1912 (north Haryana discom) | Not separately verified on an official UHBVN page | lead only |
| HSDMA (Haryana) EOC control room | hsdma.org unreachable; revenueharyana.gov.in publishes no number | lead only |
| UPSDMA 1077 (UP) | upsdma.up.nic.in live but prints no control-room number; 1070/1077 appear only in plan PDFs | lead only |
| Punjab 181 Women Helpline | sswdpunjab.gov.in unreachable; no live official page | lead only |
| HP 181 Women Helpline | Not published on reachable official HP pages | lead only |
| Uttarakhand 181 Women Helpline | wcd.uk.gov.in unreachable; nav carries an unlabelled tel:1090 link | lead only |
| UP 104 health helpline | upnrhm/uphealth pages carry no live 104 text | lead only |
| UP CM Helpline 1076 | jansunwai.up.nic.in does not print it in page text | lead only |
| J&K SDMA state EOC 1070/1077 | jksdma.nic.in, sdma.jk.gov.in, relief.jk.gov.in all unreachable | lead only |
| Jammu district Nasha Mukt Helpline 0191-2571616 | District-level number, source page reachable but scope limited to Jammu district | lead only |
| RPF helpline 1512 | Seen only in social-media/secondary sources | lead only |
| WCCB wildlife-crime national line | wccb.gov.in NXDOMAIN at check; no official page publishes a national dialable number (channels are email/regional offices) | lead only |
| Delhi DDMA EOC landlines | Exist only inside PDFs on ddma.delhi.gov.in, not published as live page numbers | lead only |
| Srinagar District Control Room 2483651/2457543/2457552 | Source omits the STD code — dial string incomplete outside Srinagar; record quarantined pending a source that prints it | quarantined (in data, not rendered) |

| MP Police WhatsApp emergency channel +91-7587600100 | Documented on the MP Dial-112 page; channels live on the quarantined state-112 card (see its statusNote) | verified but unrendered (see quarantine note) |
| WB Paschim Medinipur Traffic Control Room 03222-267983/275125/275126 | District-level traffic number; kept out as district-scope | verified on official district page |

## How to promote a lead into the directory

1. Find and open an **official** page that prints the number (see
   MAINTENANCE.md "How to verify a new or replacement record").
2. Add the record with `evidence` quote + `checkedDate`, remove it from this
   list, run `node src/validate.mjs`, rebuild, deploy, log in CHANGELOG.md.
