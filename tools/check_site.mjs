// Pre-publish guard for site/. Fails (exit 1) if anything could put a visitor at risk or break the ad rules:
//   - a price leaks: any MSRP / Your Price / admin-fee figure from data/listings.source.json, or the words
//     "Your Price", "MSRP $", "/mo", "per month", "down payment"
//   - code or assets load from another site (<script src="http...">, <link href="http...">, import from http,
//     url(http...) in CSS), or inline <script>/<style> blocks / on*= handlers in HTML (the CSP would block them)
//   - innerHTML / outerHTML / insertAdjacentHTML / document.write / eval / new Function in the site's own JS
//   - a target="_blank" link without rel="noopener noreferrer"
//   - the price-bearing source file or other non-public files inside site/
// Usage: node tools/check_site.mjs
import fs from "node:fs";
import path from "node:path";

const SITE = "site";
const src = JSON.parse(fs.readFileSync("data/listings.source.json", "utf8"));
const problems = [];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = walk(SITE);
const ours = (f) => !f.includes(path.join("vendor", "three"));
const text = (f) => /\.(html|css|js|json|txt|htaccess)$|_headers$/.test(f);

const money = (n) => [String(n), n.toLocaleString("en-US")];
const priceFigures = src.listings.flatMap((l) => [...money(l.msrp), ...money(l.yourPrice)]);

for (const f of files) {
  const rel = f.replace(/\\/g, "/");
  if (/listings\.source\.json$|\.(md|mjs|py|bak|log)$/.test(f)) problems.push(`${rel}: non-public file inside site/`);
  if (!text(f) || !ours(f)) continue;
  const s = fs.readFileSync(f, "utf8");
  for (const fig of priceFigures) if (s.includes(fig) && !/\.(css)$/.test(f)) problems.push(`${rel}: contains a price figure (${fig})`);
  for (const [re, why] of [
    [/your price/i, 'the words "Your Price"'], [/MSRP\s*\$/i, "an MSRP dollar figure"], [/\/mo\b|per month|down payment/i, "payment wording"],
    [/<script[^>]+src=["']?https?:/i, "a script from another site"], [/<link[^>]+href=["']?https?:/i, "a stylesheet/font from another site"],
    [/import[^;]*from\s*["']https?:/i, "a JS import from another site"], [/url\(\s*["']?https?:/i, "a CSS url() to another site"],
    [/\.innerHTML\s*=|outerHTML\s*=|insertAdjacentHTML|document\.write|\beval\(|new Function\(/, "an HTML/script injection sink"],
  ]) if (re.test(s)) problems.push(`${rel}: ${why}`);
  if (/\.html$/.test(f)) {
    if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(s)) problems.push(`${rel}: inline <script> block`);
    if (/<style[\s>]/i.test(s) || /\sstyle=["']/i.test(s)) problems.push(`${rel}: inline style (blocked by the CSP)`);
    if (/\son[a-z]+=["']/i.test(s)) problems.push(`${rel}: inline event handler`);
    for (const m of s.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi)) if (!/rel=["'][^"']*noopener[^"']*noreferrer/.test(m[0])) problems.push(`${rel}: _blank link without rel="noopener noreferrer"`);
    if (!/Content-Security-Policy/.test(s)) problems.push(`${rel}: no Content-Security-Policy`);
  }
  if (/\.js$/.test(f) && /target:\s*'_blank'/.test(s) && !/rel:\s*'noopener noreferrer'/.test(s)) problems.push(`${rel}: _blank link without rel`);
}

if (problems.length) { console.error("Site check FAILED:\n  " + [...new Set(problems)].join("\n  ")); process.exit(1); }
console.log(`Site check passed: ${files.length} files, no prices, no third-party code, no injection sinks, safe external links.`);
