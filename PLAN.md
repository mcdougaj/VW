# Midlands VW listing videos: build plan

Owner: Joey McDougal, Sales Manager, Midlands Volkswagen of Columbia
Goal: one 30-second vertical sales video per real listing, starting with **one car for review**, then 12.
Build machine: Joey's Windows PC (local Claude Code + Remotion + DaVinci Resolve). The cloud session was blocked from the dealer's photo server, so all photo work happens locally.

---

## 1. Rules (non-negotiable)

1. **Real car only.** Every frame of the car is the actual listing's photos for that VIN. No stock art, no drawn or AI cars.
2. **No prices on screen.** Show only available discounts and bonuses. Never MSRP, "Your Price" or a payment.
3. **Headline savings = discounts every retail buyer gets:** Dealer Discount + Retail Customer Bonus. Eligibility programs (Military & First Responders, College Grad) are shown separately as "if you qualify" and never added to the headline.
4. **Say "off MSRP"** with the savings, plus a dated end-card disclaimer with stock # and VIN.
5. **Re-verify every number** against the live listing right before rendering and again before posting. Discounts change. A sold car gets pulled.
6. **Captions on everything.** Most viewers watch muted.
7. Presenter: "Ask for Joey McDougal · Sales Manager · Midlands Volkswagen of Columbia". Phone: 803-404-5150 unless Joey supplies a direct line.

---

## 2. Data sources

| What | Where |
|---|---|
| Machine-readable inventory | https://www.midlandsvw.com/llms.txt (links to `/llm/inventory/?type=new` etc.) |
| New inventory, all pages | https://www.midlandsvw.com/new-vehicles/ (`?_p=2`, `?_p=3`, `?_p=4`). 73 cars on 2026-10-29 |
| Specials | https://www.midlandsvw.com/new-vehicles/new-vehicle-specials/ |
| One listing | `https://www.midlandsvw.com/inventory/new-<year>-volkswagen-<model-trim>-<vin>/` |
| Photos | `https://vehicle-images.carscommerce.inc/<hash>-11001818/<VIN>/<file>.webp` (22 per car, 01 = hero) |
| Dealer | 655 Broad River Road, Columbia, SC 29210 · Sales 803-404-5150 |

Each listing shows the lines **MSRP, Dealer Discounts, Retail Customer Bonus, Admin Fee ($599), Your Price**, plus the eligibility lines. **Integrity check (required):** MSRP − Dealer Discount − Retail Bonus + Admin Fee must equal Your Price. If it doesn't tie, the scrape is wrong. Don't use it.

---

## 3. The 12 cars (pulled 2026-10-29, re-verify before use)

| # | Car | VIN | Dealer disc. | Retail bonus | **Headline** | If you qualify |
|---|---|---|---|---|---|---|
| 1 | 2026 Atlas Peak Edition AWD (stock V36200, Black, Titan Black w/ orange stitch) | 1V2CN2CA3TC539843 | $1,615 | $5,000 | **$6,615** | Military/FR $500 |
| 2 | 2026 Atlas SE w/Technology | 1V2JN2CA8TC590469 | $976 | $5,000 | **$5,976** | Military/FR $500 |
| 3 | 2026 Atlas SEL Premium R-Line | 1V2FN2CA7TC533072 | $1,463 | $4,500 | **$5,963** | Military/FR $500 |
| 4 | 2026 Atlas SEL AWD w/ Nav | 1V2BN2CA7TC545432 | $1,346 | $4,500 | **$5,846** | Military/FR $500 |
| 5 | 2026 Atlas Cross Sport SEL w/ Nav | 1V2BC2CA3TC219083 | $1,297 | $3,750 | **$5,047** | Military/FR $500 |
| 6 | 2026 Atlas Cross Sport SEL R-Line Black | 1V2AC2CA6TC232843 | $851 | $3,750 | **$4,601** | Military/FR $500 |
| 7 | 2026 Atlas Cross Sport SE w/Technology | 1V2WC2CA1TC244176 | $550 | $4,000 | **$4,550** | Military/FR $500 |
| 8 | 2027 Atlas SE w/Technology (all-new model) | 1V2H53DH8VC501647 | $500 | $1,000 | **$1,500** | none listed |
| 9 | 2026 Tiguan S AWD | 3VVBR7RM7TM032086 | $753 | $3,000 | **$3,753** | Military/FR $500 · College Grad $500 |
| 10 | 2026 Tiguan SE R-Line Black AWD | 3VVGR7RMXTM135217 | $575 | $3,000 | **$3,575** | Military/FR $500 · College Grad $500 |
| 11 | 2026 Tiguan SE | 3VVFR7RM8TM135499 | $534 | $3,000 | **$3,534** | Military/FR $500 · College Grad $500 |
| 12 | 2026 Jetta 1.5T Sport | 3VWBW7BU3TM038837 | $686 | $2,000 | **$2,686** | Military/FR $500 · College Grad $1,000 |

All 12 passed the integrity check on 2026-10-29. Full rows are in `vw_listings.json`.
Retail Customer Bonus end date: the Atlas Peak listing says "Exp. 11/02/2026" (checked 2026-10-29); confirm per car, since it goes on the end card as `bonusEnds`. Not yet confirmed: whether the eligibility bonuses stack. The College Grad program runs to Jan 4, 2027 per the dealer's own page.

---

## 4. Video spec

- **Format:** 1080×1920 vertical, 30 fps, 30 s (900 frames), H.264. 16:9 version later from the same code.
- **Safe zones:** keep text out of the top 220 px and the bottom 380 px (TikTok/Reels buttons). The caption band sits at y≈1400.
- **Look:** near-black navy background, white Inter Black type, accent color taken from the car (orange for the Peak's stitching). Film grain + vignette.
- **Music:** original 120 BPM bed (`tools/make_beat.py`). One beat = 15 frames, and every cut and pop lands on a beat. Impact hits at 0 s, 12 s, 19 s (total locks) and 24 s.

### Storyboard (frames)

| Frames | Scene | Content and motion |
|---|---|---|
| 0–45 | **Hook** | "SAVE / $6,615 / OFF MSRP" slams in (scale 2.4→1, white flash, camera shake) over the blurred hero photo. Car name fades in. Whip-pans out with a blur smear. |
| 45–180 | **Reveal** | Whip-in to the **real hero photo** with a slow push + drift and two light sweeps across the paint. Kinetic title: year (accent) / MODEL (huge) / TRIM, rising on beats, then an accent underline wipes in. |
| 180–360 | **Features** | Real interior photo, darkened. "BUILT FOR IT". Up to 6 feature chips snap in on beats from alternating sides. |
| 360–600 | **Savings stack** | "YOUR SAVINGS". Each discount drops in as a labeled bar that fills (bar length ∝ amount). A divider, then TOTAL counts up and locks at frame 570 with a glow pulse and a flash. "OFF MSRP". |
| 600–720 | **If you qualify** | "EVEN MORE / IF YOU QUALIFY". One card per eligibility program fans in (+$500 …). With no programs: "ASK ABOUT CURRENT OFFERS". |
| 720–840 | **Joey CTA** | Headshot in an accent ring, "ASK FOR / JOEY McDOUGAL / Sales Manager · Midlands Volkswagen of Columbia", phone pill, QR code to that VIN's listing, "SCAN TO SEE THIS ATLAS". |
| 840–900 | **End card** | Dealer address and phone, plus fine print: savings off MSRP as of date, stock #, VIN, the discount breakdown, eligibility note, excludes tax/tag/title/fees, subject to prior sale. |

### Voiceover and captions (car #1)

The script and timing live in `src/captions/atlas-peak-539843.json`. Joey reads it in about 28 s:

> Sixty-six fifteen off. This is the 2026 Atlas Peak Edition. Right here at Midlands VW. Seven seats, all-wheel drive, sunroof, tow package. And that orange-stitch interior. Sixteen-fifteen dealer discount. Plus a five thousand dollar retail customer bonus. Sixty-six fifteen off MSRP. Military or first responder? Take another five hundred off. I'm Joey McDougal, sales manager at Midlands VW. Call me, or scan the code.

Captions show the figures as numerals ("$6,615 OFF.") and highlight word by word in the accent color.

---

## 5. Repo layout (github.com/mcdougaj/VW)

```
src/data.ts              one entry per car: discounts, ifQualify, features, stock, VIN, url, photos, headshot, captions flag
src/photos.json          listing photo URLs per car id
src/captions/<id>.json   VO script + caption timing per car
src/Listing.tsx          the 7 scenes
src/Captions.tsx         karaoke caption band
src/parts.tsx            PhotoSlot (Ken Burns), LightSweep, Vignette, Grain, QR
src/theme.ts / motion.ts colors, scene timings, springs/shake/flash
tools/fetch_photos.mjs   downloads real photos -> public/<id>/NN.webp
tools/make_srt.mjs       writes out/<id>.srt + out/<id>-vo-script.txt for Resolve
tools/make_beat.py       original soundtrack -> public/beat.wav
vw_listings.json         the 12-car data pull
```

Pinned stack: remotion / @remotion/cli 4.0.409, react 19.2.3, typescript 5.9.3, qrcode 1.5.4, @fontsource/inter 5.2.8 (bundled font, works offline).

---

## 6. Build steps: ONE CAR FIRST (Atlas Peak)

### Step 1: Set up (local)
```
git clone https://github.com/mcdougaj/VW D:\AppsVSC\VW
cd D:\AppsVSC\VW
git checkout captions-atlas-peak      (or main, once merged)
npm install
npx tsc -p .                          (must print nothing)
```

### Step 2: Real photos
```
node tools/fetch_photos.mjs           -> public/atlas-peak-539843/01..22.webp
```
- Make a contact sheet and pick: **hero** (best front 3/4) and **interior** (dash/seats showing the orange stitching). Optional third: cargo or 3rd row.
- Set `photos: ["atlas-peak-539843/NN.webp", "atlas-peak-539843/NN.webp"]` in `src/data.ts`. Atlas Peak: 02 = hero (01 has the dealer banner burned in), 08 = interior with orange stitching. Listing photos are only 640x480, so the Reveal uses `PhotoSlot band` (full-width sharp photo over a blurred fill) instead of a 9:16 cover crop. Review stills: `node tools/stills.mjs <id> 20,100,250,590,800`.

### Step 3: Headshot
Put the photo at `public/joey.jpg` and add `headshot: "joey.jpg"` to the listing in `data.ts`.

### Step 4: Preview and fix
```
npx remotion studio
```
Check each scene with the real photos:
- Is the car framed well under the push/drift?
- Does the title text sit on a dark enough area?
- Do the light sweeps read on black paint?

Adjust `zoom` and `drift` per scene, and the accent color if needed.

### Step 5: Voiceover
- Record Joey reading the script (phone voice memo or Resolve Fairlight, quiet room, about 28 s).
- Line the VO up against the beat. Adjust `from`/`to` in `src/captions/atlas-peak-539843.json` to match the actual read.

### Step 6: Two renders
```
# A) Captioned, ready to post (captions burned in by Remotion)
npx remotion render atlas-peak-539843 out/atlas-peak-539843.mp4 --codec=h264 --crf=18

# B) Clean, for finishing in DaVinci Resolve
npx remotion render atlas-peak-539843 out/atlas-peak-539843-clean.mp4 --codec=h264 --crf=18 --props="{\"captions\":false}"
node tools/make_srt.mjs atlas-peak-539843
```

### Step 7: Finish in DaVinci Resolve (path B)
1. New project, timeline 1080×1920 @ 30 fps.
2. Import `out/atlas-peak-539843-clean.mp4` and Joey's VO.
3. Put the VO on A2 and duck the music under it (Fairlight: about −10 dB on A1 while VO plays).
4. **File → Import → Subtitle** → `out/atlas-peak-539843.srt`, then drag it to the subtitle track. Style it: Inter Black, about 60 px, white with a black stroke/shadow, positioned about 400 px from the bottom. Optional: Resolve Studio **Timeline → Create Subtitles from Audio** to auto-caption the real VO, then fix spellings ($6,615, McDougal, MSRP).
5. Deliver as H.264 MP4, 1080×1920, 30 fps, high quality. Subtitle export: **burn into video**.

### Step 8: QA checklist (every video)
- [ ] Every dollar figure matches the live listing today (run the integrity check).
- [ ] The car on screen is this VIN's photos.
- [ ] No price, MSRP figure, or payment anywhere.
- [ ] Headline = dealer discount + retail bonus only.
- [ ] Eligibility bonuses labeled "if you qualify".
- [ ] QR opens this exact listing on a phone.
- [ ] Captions readable, nothing under the app buttons, nothing cut off.
- [ ] End-card date, stock # and VIN are correct.
- [ ] Audio peaks are not clipping and the VO is clear over the music.

**Review gate:** Joey approves car #1 before anything is copied to the other 11.

---

## 7. Roll out to the other 11

For each car:
1. Pull the listing page for: exterior/interior color, features, current discount lines, all photo URLs, stock #. Run the integrity check.
2. Add an entry to `data.ts` (id = `<model>-<last6 of VIN>`) and its URLs to `photos.json`.
3. Write `src/captions/<id>.json` with the same 11-line structure, using that car's numbers and features.
4. Register its captions in `src/Root.tsx` (`captionsById`).
5. Special cases:
   - **2027 Atlas:** no eligibility programs, so the qualify scene switches to "ASK ABOUT CURRENT OFFERS". Consider a "The 2027 is here" hook.
   - **Tiguans and Jetta:** two qualify cards (Military/FR + College Grad).
6. Run `fetch_photos`, pick hero + interior, then do Steps 4–8.

Add a batch script once the template is final (`tools/render_all.mjs`) to render every composition, both captioned and clean, plus SRTs.

---

## 8. Before posting (every time)

1. Re-pull each listing. If any discount changed, update `data.ts`, set `asOf`, and re-render that car.
2. If a car sold, don't post it (and take down any live post).
3. Post with a caption like: "2026 Atlas Peak — $6,615 off MSRP at Midlands VW. Ask for Joey. 803-404-5150 #Columbia #SC #VW".

---

## 9. Status at handoff (2026-10-29)

- Template, soundtrack, caption system, SRT export, photo fetcher and 12-car data: **done**, type-checks clean.
- Rendered and reviewed in the cloud: layout and motion only, with a drawn placeholder car (not for use).
- **Not done:**
  - Real photos (blocked in the cloud, so fetch locally).
  - Headshot.
  - The real voiceover and the caption timing re-sync to it.
  - Review of the caption-band layout with the real photos.
  - The other 11 cars.

---

## 10. Showroom site (`site/`, added 2026-10-29)

A scroll-driven 3D night lot in the style of joeyi.org: one lit display bay per car showing its **real listing photo**, a floating savings tag, a carousel of all cars, and a detail panel with the video (or "video coming soon"), photo gallery, savings stack, "if you qualify", highlights and a button to the car's own listing on midlandsvw.com. Static files only, no build step.

- Data: `data/listings.source.json` (read from each live listing; holds MSRP/Your Price ONLY for the integrity check, kept outside `site/` so it never deploys).
- Build: `node tools/build_site.mjs` (integrity check, downloads photos to `site/cars/`, copies `out/<id>.mp4` + a poster frame to `site/video/`, writes `site/data/cars.js` with discounts only).
- Publish: `node tools/publish_site.mjs <gh-pages checkout>` copies site/ there and version-stamps every script/style/data URL so visitors get the new files at once; then commit and push gh-pages. Live at https://mcdougaj.github.io/VW/.
- Guard: `node tools/check_site.mjs` must pass before every upload (no price figures, no third-party code, no injection sinks, safe external links, CSP present).
- Visitor safety: CSP meta (`script-src 'self'`, nothing external), plus the same CSP, HSTS, nosniff, frame DENY, no-referrer and a locked-down Permissions-Policy as host headers in `site/.htaccess` (Apache) and `site/_headers` (Netlify/Cloudflare). Three.js and fonts are vendored; no cookies, storage, forms, trackers or analytics.
- Preview: launch config `vw-lot-site` (python http.server on 127.0.0.1:8361). `?static` shows the no-3D page, `?debug` exposes `window.__lot` for checks.
- Lot look (2026-10-29): a dealership front row at night. Each stall holds the real car cut out of its own hero photo (`tools/cutout_cars.py`, rembg BiRefNet; needs a venv with `rembg[cpu]`, writes `site/cars/<id>/cutout.webp`, then rerun `build_site.mjs`), with LED pole lights, light pools, pennant strings, a landscaped curb with palmettos, the gate and the showroom.
- Adding a car: add it to `data/listings.source.json` (or render its video to `out/<id>.mp4`), run the two scripts. The lot grows a bay automatically.
