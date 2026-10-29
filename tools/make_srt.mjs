// Writes out/<id>.srt (captions) and out/<id>-vo-script.txt from src/captions/<id>.json for DaVinci Resolve.
// Usage: node tools/make_srt.mjs atlas-peak-539843
import fs from "node:fs";
const id = process.argv[2];
if (!id) { console.error("usage: node tools/make_srt.mjs <listing-id>"); process.exit(1); }
const { lines } = JSON.parse(fs.readFileSync(`src/captions/${id}.json`, "utf8"));
const FPS = 30;
const ts = (f) => {
  const ms = Math.round((f / FPS) * 1000);
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};
fs.mkdirSync("out", { recursive: true });
const srt = lines.map((l, i) => `${i + 1}\n${ts(l.from)} --> ${ts(l.to)}\n${l.show}\n`).join("\n");
fs.writeFileSync(`out/${id}.srt`, srt);
const vo = lines.map((l) => `[${(l.from / FPS).toFixed(1)}s] ${l.text}`).join("\n");
fs.writeFileSync(`out/${id}-vo-script.txt`, vo + "\n");
console.log(`wrote out/${id}.srt (${lines.length} captions) and out/${id}-vo-script.txt`);
