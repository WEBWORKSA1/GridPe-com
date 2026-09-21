# GridPe.com

**Grid Pe — India's independent electricity, rooftop solar & EV money engine.**

Free calculators built on published tariff orders, the PM Surya Ghar subsidy structure and independently tested EV efficiency. Static site, zero backend, hosted on GitHub Pages (built by Pages' native Jekyll from the `gh-pages` branch).

**Live:** https://webworksa1.github.io/GridPe-com/

> **This domain and website may be available.** Enquiries: [web.works/contact](https://web.works/contact)

## What's inside

| | |
|---|---|
| **8 calculators** | Electricity bill (37 DISCOMs, slab-wise) · Rooftop solar savings (25-yr cash flow, NPV, IRR) · PM Surya Ghar subsidy · EV vs petrol · EV charging cost & time · Appliance load · Solar EMI · Roof area → kW |
| **3 data directories** | State tariff tables · DISCOM directory (63) · EV model database (20) |
| **6 pillar guides** | Subsidy · solar cost · EV vs petrol · high bills · net metering · home EV charger |
| **Conversion** | 4-step solar quote funnel · homepage lead band · calculator CTAs |
| **Community & revenue** | Reader support (UPI / Razorpay / BMC / Ko-fi / PayPal) · skill-based contests · careers · advertise · AdSense-ready slots · YouTube facade library |
| **Trust & compliance** | Privacy (AdSense + DPDP Act) · Terms · Disclaimer · Editorial policy · sitemap.xml · robots.txt · ads.txt · JSON-LD on every page |

## Structure

```
_layouts/default.html           shared shell: head, SEO meta, JSON-LD, top domain bar, scripts
_includes/                      nav, footer, ad slots
index.html + 26 root pages      page bodies with JSON front matter (calculators, data, legal…)
guides/                         6 long-form articles
assets/css/style.css            design system (light + dark)
assets/js/site.js               CONFIG, forms, nav, theme, obfuscated contact
assets/js/calc.js               every formula on the site, in one auditable file
assets/js/page-*.js             data-page renderers (tariffs, DISCOMs, EVs, videos, support)
data/*.json                     versioned datasets (tariffs, solar, EVs, DISCOMs, appliances)
PROMPTS.md                      phase-wise build prompts + expansion roadmap
```

## Going live

All switches live in the `CONFIG` object at the top of `assets/js/site.js` — form endpoint, UPI/Razorpay/BMC/Ko-fi/PayPal, AdSense, YouTube. Nothing appears on the page until it's set. See the checklist at the end of `PROMPTS.md`.

Contact submissions never expose the inbox: the address is stored encoded and only assembled at submit time.

## Custom domain

1. Add a file named `CNAME` containing `gridpe.com` to the `gh-pages` branch
2. DNS: `A` records → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`; `www` `CNAME` → `webworksa1.github.io`
3. Repo Settings → Pages → Enforce HTTPS

## Data disclaimer

All figures are estimates from published sources, dated in each dataset. Not financial advice.
