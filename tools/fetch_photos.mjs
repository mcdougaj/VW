// Downloads the real listing photos for every car in src/photos.json into public/<id>/NN.webp.
// Run on your PC (the cloud session can't reach the dealer's image server):  node tools/fetch_photos.mjs
import fs from "node:fs";
import path from "node:path";

const list = JSON.parse(fs.readFileSync("src/photos.json", "utf8"));
for (const [id, urls] of Object.entries(list)) {
  const dir = path.join("public", id);
  fs.mkdirSync(dir, { recursive: true });
  let ok = 0;
  for (let i = 0; i < urls.length; i++) {
    const file = path.join(dir, String(i + 1).padStart(2, "0") + ".webp");
    if (fs.existsSync(file)) { ok++; continue; }
    const res = await fetch(urls[i]);
    if (!res.ok) { console.log(`  ${id} #${i + 1} failed: HTTP ${res.status}`); continue; }
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    ok++;
  }
  console.log(`${id}: ${ok}/${urls.length} photos in ${dir}`);
}
