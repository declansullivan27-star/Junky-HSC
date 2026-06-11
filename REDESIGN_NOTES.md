# HaulKC — Conversion / SEO / Performance Overhaul

Date: 2026-06-11 · Branch: `claude/junky-hsc-booking-setup-e1w8ti`

This documents the autonomous overhaul of the HaulKC booking site, what changed
and **why it helps conversions/SEO**, plus a launch checklist of things only you
can finish (real domain, photos, reviews, etc.).

---

## TL;DR of what changed

| File | Change |
|---|---|
| `index.html` | Full SEO head, structured data, 8 new trust/conversion sections, progress + inline validation + photo upload + disclaimer on the quote form, accessibility + perf upgrades. Booking engine untouched. |
| `api/notify-crew.js` | Photo attachments, HTML-escaping of booking fields, payload size guard. |
| `package.json` | **New** — declares `resend` so the email function actually deploys on Vercel. |
| `vercel.json` | **New** — caching + security headers, clean URLs. |
| `robots.txt`, `sitemap.xml` | **New** — crawlability; admin + api disallowed. |
| `favicon.svg`, `og-image.svg` | **New** — browser icon + social share card source. |
| `admin.html` | `noindex` so the crew dashboard never shows in search. |

---

## Phase-by-phase

### Phase 1 — Audit (findings, highest impact first)
1. **No `package.json`** → the `import { Resend }` in the email function had no
   dependency declared, so on Vercel the function would fail. **Fixed.**
2. **Almost no SEO** → only a `<title>`. No description, canonical, OG, structured
   data, robots, or sitemap. **Fixed.**
3. **No trust content** → single CTA, no reviews/process/guarantee/FAQ/service-area.
   Cold visitors had nothing to build confidence on. **Fixed.**
4. **Missing the required estimate disclaimer.** **Fixed.**
5. No progress indicator / inline validation → abandonment. **Fixed.**
6. No photo upload → quotes were guesses. **Fixed.**
7. Phone present but no sticky mobile call bar. **Fixed.**
8. A11y gaps (no landmarks/skip link), render-blocking font `@import`,
   no caching/security headers. **Fixed.**

### Phase 2 — Homepage
- **Strong hero** with one clear value prop ("price in 30s, no deposit, pay when
  done") and a star/social-proof row. *Why: a single, benefit-led promise above
  the fold lifts engagement.*
- **How it works (3 steps)** — removes uncertainty about the process.
- **What we haul** — six service cards (furniture/appliance/yard waste/construction
  debris/cleanouts/misc) doubling as keyword landing content.
- **Before & after gallery** — CSS placeholders ready for real photos.
- **Service area** — names every city, reinforcing "they cover me."
- **Testimonials**, **why/guarantee**, **FAQ**, and a **final CTA** band.
- **Multiple CTAs** + **sticky mobile call/quote bar**. *Why: a returning CTA on a
  long page captures intent wherever the visitor stops scrolling; on mobile the
  fixed bar keeps "Call" and "Get my price" one thumb-tap away.*

### Phase 3 — Quote form
- **Progress indicator** ("X of 3 done") — completion nudge reduces abandonment.
- **Inline validation** with per-field messages + focus jump to the first error.
- **Photo upload** — drag/drop or tap, up to 6 images, **resized client-side**
  (max 1400px, JPEG q0.7) so uploads are fast and emails stay small. Photos go to
  the **crew email as attachments**; they are *not* added to the Supabase insert,
  so the existing table schema is untouched.
- **Required disclaimer** shown in the quote box and on the confirmation screen:
  *"All online quotes are estimates. Final pricing is confirmed on-site before
  work begins."*

### Phase 4 — Local SEO
- Meta title/description tuned for **"Kansas City junk removal / hauling"**.
- **LocalBusiness** JSON-LD (phone, geo, areaServed, hours, service catalog) for
  the Google local pack / maps.
- **FAQPage** JSON-LD (eligible for FAQ rich results).
- Open Graph + Twitter cards for clean link previews.
- Section copy targets: furniture removal KC, appliance removal KC, yard waste
  removal KC, construction debris removal KC.
- Internal linking via header nav + footer columns. `robots.txt` + `sitemap.xml`.

### Phase 5 — Design system
- Kept and reused the existing token system (colors, type, spacing, radii,
  shadows, motion). All new components (sections, cards, buttons, FAQ, footer,
  mobile bar) are built **only** from those tokens, so the look stays consistent.

### Phase 6 — Performance
- Fonts: `preconnect` + async stylesheet load (removed the render-blocking
  `@import`) with a `<noscript>` fallback.
- `preconnect`/`dns-prefetch` to Supabase so the booking POST connects faster.
- `vercel.json` caching headers for static assets; security headers (HSTS,
  nosniff, frame options, referrer + permissions policy).
- SVG icons inline (no icon-font/image requests); gallery is pure CSS.

### Phase 7 — Trust & conversion
- Reviews, 4 guarantee/why cards (upfront pricing, same-day, pay-when-done,
  donate/recycle), explicit process, transparent starting prices, prominent phone
  in header/footer/mobile bar, and the estimate disclaimer.

### Phase 8 — Polish / hardening
- `notify-crew.js`: **HTML-escapes** all booking fields in the email (prevents a
  hostile submission from injecting markup/links into the crew inbox) and **caps
  photo payload** (max 6, ~8MB total) defensively.
- `admin.html`: `noindex, nofollow`.
- Validated: JSON-LD parses, inline JS passes `node --check`, all JS-referenced
  element IDs exist, tags balanced, `package.json`/`vercel.json` valid JSON.

---

## ✅ Launch checklist — YOU MUST DO THESE MANUALLY

1. **Set your real domain.** Everywhere I used `https://haulkc.com` — update to your
   production domain:
   - `index.html`: `<link rel="canonical">`, all `og:`/`twitter:` URLs, both JSON-LD
     blocks (`url`, `@id`, `image`).
   - `robots.txt` (`Sitemap:` line) and `sitemap.xml` (`<loc>`).
2. **Export the OG image to PNG.** `og-image.svg` is the source. Social platforms
   don't render SVG — export it to **`og-image.png` at 1200×630** and drop it at the
   site root (the meta tag already points to `/og-image.png`).
3. **Replace the testimonials** with real Google reviews (names/locations/quotes).
   They're clearly marked as placeholders in the Reviews section. Once you have real
   review counts you can also add `aggregateRating` to the LocalBusiness JSON-LD —
   I left it out on purpose so we don't publish unverifiable ratings.
4. **Swap the before/after gallery** placeholders for real crew job photos
   (`#gallery` section). Real transformation photos are one of the biggest
   conversion levers for this kind of service.
5. **Add a real street address** to the LocalBusiness JSON-LD (`streetAddress`) if
   you have a physical/dispatch address — strengthens local ranking.
6. **Confirm Vercel env vars** are set: `RESEND_API_KEY`, `CREW_EMAILS`,
   `RESEND_FROM` (a domain verified in Resend), `ADMIN_PASSWORD`,
   `SUPABASE_SERVICE_ROLE_KEY`. Redeploy after the new `package.json` so `resend`
   installs.
7. **Verify business hours** in the JSON-LD (`openingHoursSpecification`) match
   reality — I used 8am–8pm daily as a sensible default.
8. **Submit `sitemap.xml`** in Google Search Console once the domain is live.

---

## Test steps (end-to-end)
1. Open the live site. Pick a load size → price appears; progress shows "1 of 3".
2. Add photos → thumbnails render; remove one works.
3. Pick day + window → progress "2 of 3"; fill address/name/phone → "3 of 3".
4. Enter an out-of-area ZIP (e.g. `64701`) → "Just outside our area" warning.
5. Enter a valid ZIP (e.g. `64111`) and submit:
   - Supabase → Table Editor → `bookings`: new row, status `new`.
   - Crew inbox (`CREW_EMAILS`): "New HaulKC Booking" email **with photo
     attachments** and a Photos count.
   - Confirmation screen shows recap + disclaimer.
6. Validation: submit with a blank name/bad phone → inline errors + focus jump.
7. Mobile: sticky bottom bar shows Call + Get my price; nav anchors scroll.
8. SEO: view-source shows meta/OG tags; test the page in Google's Rich Results Test
   for LocalBusiness + FAQ once the domain is live.
