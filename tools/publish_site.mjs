// Copies site/ into a publish folder (the gh-pages checkout) and stamps a version on every page, style,
// data and module URL (?v=<commit>), so browsers fetch the new files on each publish instead of reusing
// cached ones (GitHub Pages lets browsers cache for 10 minutes). The source in site/ is never changed.
// Usage: node tools/build_site.mjs && node tools/check_site.mjs && node tools/publish_site.mjs <dest>
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const dest = process.argv[2];
if (!dest || !fs.existsSync(path.join(dest, ".git"))) throw new Error("usage: node tools/publish_site.mjs <gh-pages checkout>");

const v = execSync("git rev-parse --short HEAD").toString().trim() + "-" + Date.now().toString(36);
for (const e of fs.readdirSync(dest)) if (e !== ".git") fs.rmSync(path.join(dest, e), { recursive: true, force: true });
fs.cpSync("site", dest, { recursive: true });
fs.writeFileSync(path.join(dest, ".nojekyll"), "");

const stamp = (file, re) => {
  const p = path.join(dest, file);
  const before = fs.readFileSync(p, "utf8");
  const after = before.replace(re, (m, a, url, b) => `${a}${url}?v=${v}${b}`);
  fs.writeFileSync(p, after);
  return (after.match(/\?v=/g) || []).length;
};
let n = stamp("index.html", /((?:href|src)=")((?:css|js|data)\/[^"?]+\.(?:css|js))(")/g);
for (const f of fs.readdirSync(path.join(dest, "js"))) n += stamp(path.join("js", f), /(from\s+')(\.{1,2}\/[^'?]+\.js)(')/g);
console.log(`published site/ to ${dest} with version ${v} (${n} URLs stamped)`);
