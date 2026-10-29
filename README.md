# VW sales videos (Midlands Volkswagen of Columbia)

One 30-second vertical video (1080x1920, 30 fps) per listing. Discounts only, no prices.
Original 120 BPM soundtrack in `public/beat.wav` (made by `tools/make_beat.py`, so there are no licensing issues).

## Run it on your PC
Open a terminal in this folder (for example `D:\AppsVSC\VW`) and run:

    npm install
    node tools/fetch_photos.mjs
    npx remotion studio

- `fetch_photos.mjs` downloads the real listing photos into `public/<listing-id>/`.
- `remotion studio` opens a live preview in your browser. Pick `atlas-peak-539843`.

To render the MP4:

    npx remotion render atlas-peak-539843 out/atlas-peak-539843.mp4 --codec=h264 --crf=18

## Files
- `src/data.ts`: one entry per car (discounts, bonuses, features, stock, VIN, QR link, photos). Re-check every number against the live listing before posting.
- `src/photos.json`: the listing photo URLs for each car.
- `src/Listing.tsx`: the 7 scenes (hook, reveal, features, savings stack, if-you-qualify, Joey CTA, end card).
- `src/theme.ts`: colors and scene timings. Every cut lands on a beat (15 frames).

## Still to do
- Check which photo number is the interior shot, and set it as the second entry in `photos` in `src/data.ts`.
- Put a headshot at `public/joey.jpg` and add `headshot: "joey.jpg"` to the listing in `data.ts`.
- Add the other 11 cars (the data is in `vw_listings.json`).
