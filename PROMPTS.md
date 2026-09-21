# GridPe.com — Phase-Wise Build Prompts

**Concept:** *Grid Pe* ("on the grid") — India's independent electricity, rooftop-solar and EV money engine.
**Model:** free calculators → organic traffic → AdSense + exclusive solar/EV-charger installer leads + reader support + sponsorship.
**Stack:** pure static HTML/CSS/vanilla JS + versioned JSON datasets, templated by GitHub Pages' built-in Jekyll. Hosts free on GitHub Pages forever.

Each phase below is a self-contained prompt. Paste it into Claude (or any capable coding agent) together with the repo. Phases 1–7 are **built and live** in this repo; use them to rebuild, audit or fork. Phases 8–12 are the **expansion roadmap**.

---

## Why this niche (the numbers that decided it)

| Lever | Figure | Why it matters |
|---|---|---|
| PM Surya Ghar demand | ~1 crore target households | Massive, subsidised, search-driven purchase decision |
| Subsidy | ₹30k/kW ×2 + ₹18k, capped ₹78,000 | Makes 3 kW the default — a very quotable, calculable product |
| Rooftop lead value (India) | ₹300–1,500 exclusive | Among the highest-value residential leads in Indian lead-gen |
| Installed cost | ₹40–70/W | Enough spread that a "fair price benchmark" is genuinely valuable |
| EV home vs petrol | ~₹1.17/km vs ~₹6.81/km | Evergreen, high-CTR comparison content |
| Competition | Brochure-ware from installers | Few neutral, formula-transparent calculators rank |

**Naming risk avoided:** do **not** position GridPe as a payments/fintech brand. The "-Pe" suffix has been litigated aggressively in India (PhonePe v. BharatPe and others). The energy positioning carries no such exposure.

---

## Research base — 27 sites studied

**Solar lead-gen & calculators:** EnergySage, SolarReviews, Solar-Estimate.org, NREL PVWatts, BijliBachao, pmsuryaghar.gov.in, LoomSolar, Tata Power Solar, Luminous, SolarSquare
**EV & grid data:** PlugShare, ChargePoint, A Better Route Planner, Statiq, Tata Power EZ Charge, ElectricVehicleWeb.in, EVreporter, Electricity Maps, Grid-India (POSOCO) reports
**Monetisation, donation & community:** Buy Me a Coffee, Ko-fi, Patreon, GitHub Sponsors, Ketto, Milaap, Wikipedia fundraising, Product Hunt

**Patterns adopted:**
- Result before contact (SolarReviews, Solar-Estimate) — never gate the number behind a phone field
- India field order users already trust: PIN → bill band → property → name → WhatsApp (SolarSquare / PM Surya Ghar portal)
- No OTP at capture (OTP kills 20–40% of completions) — verify post-submit
- Published assumptions table (PVWatts) → authority + backlinks
- State-by-state data tables (SolarReviews, BijliBachao) → programmatic SEO
- Real-world efficiency over brochure range (ABRP, Autocar tests)
- Tiered support with a highlighted middle tier + open amount (BMC, Wikipedia)
- Fee/incentive transparency page (Milaap, Ketto) → trust
- Skill-based contests only (Indian Prize Competitions Act compliance)
- Anti-scam line on careers page ("we never charge applicants")

---

## PHASE 1 — Foundation & design system ✅ built

```
Build the foundation for GridPe.com, a static website for India's electricity, rooftop solar
and EV costs. Pure HTML/CSS/vanilla JS, no framework, no build dependency beyond one Python
script. Must run on GitHub Pages free plan.

Deliver:
1. assets/css/style.css — a complete design system: CSS custom-property tokens (electric teal
   #00C6A2 brand, amber #FFB020 accent, navy surfaces), light + dark themes (prefers-color-scheme
   AND a manual data-theme toggle), Inter font, fluid type with clamp(), buttons, cards, badges,
   chips, forms (inputs, selects, radio-cards, range sliders, input groups), a two-pane
   calculator shell with a gradient "result hero", key-value result rows, stat tiles, CSS bar
   charts and meters, responsive tables, FAQ accordion, article prose, callouts, lead-capture
   band (dark gradient), multi-step form pips, ad-slot containers with reserved height (CLS ≈ 0),
   click-to-load YouTube facade, donation tier cards, sticky dismissible support banner, footer,
   toast, reveal-on-scroll, prefers-reduced-motion, print styles. Mobile-first; no horizontal
   scroll at 360px.
2. A required top bar on EVERY page reading "Contact, if you are interested in this
   website/domain name" linking to https://web.works/contact.
3. assets/js/site.js — a single CONFIG object (form endpoint, UPI VPA, Razorpay, BMC, Ko-fi,
   PayPal, AdSense client + enable flag, YouTube channel); theme toggle; mobile nav + dropdowns;
   FAQ; reveal; toast; Indian number formatting (₹ en-IN, lakh/crore compaction); animated
   counters; JSON loader; a generic form engine (validation for Indian mobile, 6-digit PIN,
   email; multi-step panels; success state) that POSTs to CONFIG.formEndpoint or falls back to a
   runtime-built mailto.
4. CONTACT EMAIL RULE: the site's single inbox must never appear in plain text anywhere in
   source, DOM or repo. Store it reversed + base64, decode only at click/submit time.
5. Jekyll (native to GitHub Pages, zero build tooling): one _layouts/default.html holding
   head/meta/OG/canonical/JSON-LD, the top bar, nav and footer includes, and script tags.
   Every page is a body fragment with JSON front matter (title, desc, slug, calc, pagejs,
   schema). Guides inherit p: "../" via _config.yml defaults for relative paths.
```

## PHASE 2 — Data layer ✅ built

```
Create versioned JSON datasets in /data, each with version, asOf and a plain-English disclaimer:

- tariffs.json — state → DISCOM → domestic LT slabs {upto, rate}, mode (telescopic|flat),
  fixedPerKw, fixedMin, fppcaPct, dutyPct, meterRent, note. Cover 25 states/UTs, 37+ DISCOMs.
- solar.json — PM Surya Ghar bands (₹30k/kW first 2 kW, ₹18k third, cap ₹78k), RWA provision
  (₹18k/kW to 500 kW), eligibility conditions, state top-ups (Delhi ₹10k/kW cap ₹30k + GBI;
  UP ₹15k/kW cap ₹30k), installed ₹/kW bands by size, state kWh/kW/day yields (33 states),
  model assumptions (0.6% degradation, 4% escalation, ₹500/kW O&M, inverter ₹6k/kW in yr 12,
  8% discount rate, 90 sq ft/kW).
- ev-models.json — 20 India EVs with battery, usable kWh, claimed range, REAL km/kWh from
  independent tests, max AC/DC kW, price; city petrol/diesel/CNG prices; charger catalogue;
  public network rates.
- discoms.json — 63 DISCOMs with state, short name, official site, complaint number (1912).
- appliances.json — 50 Indian household appliances with watts, typical hours, category.
Every figure must be traceable to a primary source; never invent a tariff.
```

## PHASE 3 — Calculator engine ✅ built

```
Build assets/js/calc.js: pure math functions + per-page controllers selected by
<body data-calc="...">. All formulas in one auditable file.

Math: telescopic vs flat slab energy charge; full bill (energy + max(fixedMin, fixedPerKw×load)
+ FPPCA% + duty% + meter rent); inverse bill→units by bisection; PM Surya Ghar subsidy with
state top-up; cost band lookup; kW rounding; 25-year cash flow (degradation, escalation,
self-consumed at retail, exported at 75% retail, O&M, inverter replacement) returning payback,
NPV, IRR (bisection); EMI; EV ₹/km = tariff/(km/kWh × 0.88 AC | 0.94 DC); petrol ₹/km;
charge time = kWh/(min(charger,car) × 0.88 AC | 0.75 DC taper); appliance units.

Controllers: bill, solar, subsidy, ev, charging, appliance, emi, roof. Every input recalculates
live; results animate; solar result pre-fills the lead form context.
```

## PHASE 4 — Calculator pages ✅ built

```
Create 8 calculator pages, each: breadcrumb, H1, lede, two-pane calculator, ad slot, then
800–1,500 words of genuinely useful explanatory content (assumptions table, worked example,
"when this does NOT pay", FAQ accordion), sticky sidebar with ad + related tools + lead CTA,
WebApplication JSON-LD.

bill-calculator · solar-calculator · subsidy-calculator · ev-calculator ·
charging-calculator · appliance-calculator · emi-calculator · roof-calculator

Tone: analytical, numbers first, honest about downside. Always name the conditions under which
the purchase is a bad idea — this is the trust moat vs installer-owned calculators.
```

## PHASE 5 — Data directory pages ✅ built

```
Build tariffs.html (searchable state/DISCOM tariff cards, links into the bill calculator
pre-filled by state), discoms.html (searchable/filterable directory + anti-scam warning +
escalation path), ev-models.html (sortable table, user-editable home tariff, live ₹/km columns).
All rendered client-side from /data JSON.
```

## PHASE 6 — Lead generation, support & community ✅ built

```
1. quote.html — the dedicated conversion page. Left: value proposition (empanelled vendors
   only, price benchmark first, one follow-up max, subsidy help), what-happens-next, the
   9-point quote comparison checklist. Right: sticky 4-step form —
   (1) PIN + state → (2) bill band radio cards → (3) property type, connection-in-your-name,
   timeline → (4) name, WhatsApp, email, notes, consent. Hidden field carries calculator
   context. Ask for the phone number LAST. No OTP.
2. Embedded lead bands on the homepage and CTAs on every calculator result.
3. support.html — Wikipedia/BMC-style reader funding: ₹49 / ₹199 / ₹499 (highlighted) / ₹2,499
   tiers + open amount; UPI deep link (upi://pay?pa=&pn=&am=&cu=INR&tn=), UPI QR slot, Razorpay
   payment page, BMC/Ko-fi/PayPal for overseas — all driven by CONFIG and hidden until set;
   full "where our money comes from" disclosure.
4. contests.html — three SKILL-BASED contests (Bill-Cut Challenge, Quote Audit Bounty, Data
   Correction Bounty) with complete Indian-law-aware terms: organiser, no purchase necessary,
   18+, judging criteria, TDS u/s 194B above ₹10,000, platform non-affiliation, cancellation.
5. careers.html — roles with pay bands, must/nice-to-have, application form asking for links
   not cover letters, "we never charge applicants" anti-scam notice.
6. advertise.html — formats, what we will NOT sell, media-kit request form.
7. videos.html — click-to-load YouTube facade grid driven by a JS array of video IDs.
8. Sitewide dismissible support banner (30-day suppression).
```

## PHASE 7 — Trust, legal, SEO & launch ✅ built

```
Create about, contact (form + obfuscated mailto link), privacy (AdSense/DoubleClick cookie
disclosure, opt-out links, DPDP Act 2023 rights), terms, disclaimer, editorial-policy
(independence, sourcing, conservative assumptions, corrections, AI-use policy), sitemap.html,
404. Six 1,500–2,500-word pillar guides with Article JSON-LD, TOC, bylines, FAQs:
PM Surya Ghar guide · rooftop solar cost · EV vs petrol · why your bill is high ·
net metering · home EV charger. Plus robots.txt, sitemap.xml, ads.txt, site.webmanifest,
.nojekyll, FUNDING.yml. Verify: zero exposed email, zero broken internal links, top bar on
every page, all JSON parses, every calculator produces output in a headless browser, no
horizontal scroll at 390px. Push to GitHub and enable Pages.
```

---

## PHASE 8 — Programmatic SEO scale-out (next)

```
Using tariffs.json, solar.json and ev-models.json, generate static landing pages (a small script that writes Jekyll page files from the JSON):
- /electricity-bill/{state}.html and /electricity-bill/{discom}.html (~60 pages) — pre-selected
  calculator + that DISCOM's slab table + state free-unit scheme + FAQ
- /solar/{state}.html (~33) — local yield, top-up, example 2/3/5 kW economics, net-metering rule
- /solar/{n}-kw-price.html for 1,2,3,4,5,6,8,10 kW
- /ev/{model}-running-cost.html (20) and /ev/{a}-vs-{b}.html for top comparisons
Each page must have ≥400 words of unique, data-driven text (not spun), unique title/meta,
canonical, breadcrumb schema, and internal links to its parent hub. Update sitemap.xml.
Target: 150–200 indexable pages without thin content.
```

## PHASE 9 — AdSense approval & ad optimisation

```
Pre-approval: confirm 25–30+ substantive articles, privacy/terms/about/contact live, no
"under construction" sections, site indexed in Search Console, real traffic flowing.
Apply. On approval: set CONFIG.adsenseClient + adsenseEnabled, replace ads.txt pub ID, add the
AdSense loader script to _layouts/default.html <head>, give each ad-slot a data-ad-slot ID. Start with Auto
Ads (vignettes/interstitials OFF), then migrate to manual units. Rules: max 1 unit above the
fold on mobile, never adjacent to buttons or form fields, never inside a calculator result.
Track CLS in PageSpeed Insights — must stay < 0.1.
```

## PHASE 10 — Lead monetisation

```
1. Set CONFIG.formEndpoint to a FormSubmit hashed AJAX endpoint or Formspree form so leads
   arrive without opening the visitor's mail client. Keep the endpoint the only thing that
   knows the inbox.
2. Recruit 3–5 PM Surya Ghar-empanelled installers per top-10 state on flat per-lead pricing
   (target ₹400–1,200 exclusive; ₹150–300 shared). Publish the "flat fee, same for everyone"
   policy — it is part of the conversion copy.
3. Add an EV home-charger installation lead variant (Tata Power EZ Home / ChargeZone / local
   electricians) on the charging calculator.
4. Add a B2B form for housing societies (RWA common-area solar, ₹18k/kW, up to 500 kW) — the
   highest-ticket lead on the site.
5. Instrument conversion: GA4 generate_lead event already fires on submit.
```

## PHASE 11 — YouTube & distribution

```
Produce 6 launch videos (titles pre-written in videos.html) in Hindi + English, 3–5 minutes,
screen-recorded calculator walkthroughs. Put video IDs into the videos.html array. Cut each
into 3 Shorts. Every description links the matching calculator with UTM tags. Monetise the
channel once eligible — a second AdSense revenue stream on the same content.
```

## PHASE 12 — Productisation (bold path)

```
1. Email capture: "Tariff change alerts for your DISCOM" (static form → newsletter tool).
   A list of Indians who own or plan rooftop solar is a sponsorship asset.
2. Paid data: annual "India Rooftop Solar Price Index" built from reader-submitted quotes —
   sell the dataset/report to installers, lenders and investors (EVreporter model, ₹25–35k/yr).
3. White-label calculator embed for installers and banks (iframe + attribution), licensed
   monthly.
4. Custom domain: add a CNAME file containing gridpe.com to the gh-pages branch, set DNS A records
   to GitHub Pages IPs (185.199.108–111.153) + www CNAME → webworksa1.github.io; enforce HTTPS.
```

---

## Go-live checklist (edit `assets/js/site.js` → `CONFIG`)

- [ ] `formEndpoint` — FormSubmit/Formspree endpoint (leads arrive silently)
- [ ] `upiVpa`, `razorpayPage` — activates donation buttons automatically
- [ ] `bmcSlug` / `kofiSlug` / `paypalMe` — overseas support
- [ ] Drop a static UPI QR at `assets/img/upi-qr.png` and swap it into support.html
- [ ] `adsenseClient` + `adsenseEnabled: true` after approval; update `ads.txt`
- [ ] YouTube video IDs in `videos.html`
- [ ] Custom domain (CNAME + DNS) when ready
