// Builds the showroom site data from data/listings.source.json (kept OUTSIDE site/ so MSRP and price never deploy):
//   - integrity check per car: MSRP - dealer discount - retail bonus + admin fee must equal Your Price
//   - downloads each car's listing photos to site/cars/<id>/NN.webp (skips ones already there)
//   - copies a rendered video from out/<id>.mp4 to site/video/<id>.mp4 when it exists
//   - writes site/data/cars.json with discounts only (no MSRP, price or payment ever leaves this script)
// Usage: node tools/build_site.mjs
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const FFMPEG = "node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe";
const src = JSON.parse(fs.readFileSync("data/listings.source.json", "utf8"));
const usd = (n) => "$" + Math.round(n).toLocaleString("en-US");
const bad = [];
const cars = [];

for (const l of src.listings) {
  const calc = l.msrp - l.dealerDiscount - l.retailBonus + l.adminFee;
  if (calc !== l.yourPrice) { bad.push(`${l.id}: ${calc} != ${l.yourPrice}`); continue; }

  const dir = path.join("site", "cars", l.id);
  fs.mkdirSync(dir, { recursive: true });
  const photos = [];
  for (let i = 0; i < l.photos.length; i++) {
    const rel = `cars/${l.id}/${String(i + 1).padStart(2, "0")}.webp`;
    const file = path.join("site", rel);
    if (!fs.existsSync(file)) {
      const res = await fetch(l.photos[i]);
      if (!res.ok) { console.log(`  ${l.id} photo ${i + 1}: HTTP ${res.status}`); continue; }
      fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    }
    photos.push(rel);
  }

  let video = null, poster = null;
  if (l.video && fs.existsSync(path.join("out", l.video))) {
    fs.mkdirSync("site/video", { recursive: true });
    fs.copyFileSync(path.join("out", l.video), path.join("site", "video", l.video));
    video = `video/${l.video}`;
    // poster = a frame from the Reveal scene (real hero photo + title), using Remotion's bundled ffmpeg
    poster = `video/${l.video.replace(/\.mp4$/, ".jpg")}`;
    spawnSync(FFMPEG, ["-v", "error", "-y", "-ss", "3.2", "-i", path.join("site", video), "-frames:v", "1", "-vf", "scale=540:-1", "-q:v", "4", path.join("site", poster)]);
    if (!fs.existsSync(path.join("site", poster))) poster = null;
  }

  const discounts = [
    { label: "Dealer Discount", amount: l.dealerDiscount },
    { label: "Retail Customer Bonus", amount: l.retailBonus },
  ];
  const ifQualify = [];
  if (l.military) ifQualify.push({ label: "Military & First Responders", amount: l.military });
  if (l.collegeGrad) ifQualify.push({ label: "College Graduate", amount: l.collegeGrad });

  // Every highlight is a line from the listing's own spec sheet.
  const highlights = [
    `${l.seats} seats`,
    l.drive === "AWD" ? "All-wheel drive" : "Front-wheel drive",
    `${l.hp} horsepower`,
    l.sunroof === "panoramic" ? "Panoramic sunroof" : null,
    l.tow ? `Tows ${l.tow.toLocaleString("en-US")} lbs` : null,
    `${l.mpg} MPG`,
    l.interior ? `${l.interior} interior` : null,
  ].filter(Boolean);

  const total = discounts.reduce((s, d) => s + d.amount, 0);
  cars.push({
    id: l.id, year: l.year, model: l.model, trim: l.trim, stock: l.stock, vin: l.vin, url: l.url,
    exterior: l.exterior, allNew: !!l.allNew, accent: l.accent || "#FF6A1A",
    total, discounts, ifQualify, highlights,
    hero: (l.hero || 2) - 1, photos, video, poster,
  });
  console.log(`${l.id.padEnd(42)} ${usd(total).padStart(7)} off  ${photos.length} photos${video ? "  + video" : ""}`);
}

if (bad.length) { console.error("Integrity check FAILED, fix the source before building:\n  " + bad.join("\n  ")); process.exit(1); }
cars.sort((a, b) => b.total - a.total);
const out = { asOf: src.asOf, bonusEnds: src.bonusEnds, cars };

fs.writeFileSync("site/data/cars.js", "window.CARS = " + JSON.stringify(out) + ";\n");
console.log(`wrote site/data/cars.js (${cars.length} cars, all passed the integrity check)`);
