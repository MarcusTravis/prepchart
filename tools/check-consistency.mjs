#!/usr/bin/env node
// Basic site checks. Run from anywhere:  node tools/check-consistency.mjs   (Node 18+, no install)
//  1. every page has canonical, theme.css, ko-fi footer line, Cloudflare Web Analytics beacon
//  2. chart pages include the price rule + scroll-hint.js
//  3. internal links and local asset references resolve
//  4. every page appears in sitemap.xml (except 404)
//  5. DATA rows parse; a row with a price must have an https source and a checked date
//  6. pre-rendered table rows == DATA rows
//  7. banned content: external fonts, firearm words, work/employer wording
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HOST = "https://bugoutchart.pages.dev";
const PRICE = "Lowest publicly listed MSRP or current list price on the manufacturer's or major US retailer's product page for a new unit. Checked date shown. When no live retail found, leave price blank.";
const problems = [];
const bad = (w, m) => problems.push(`${w}: ${m}`);
const files = fs.readdirSync(ROOT).filter(f => f.endsWith(".html"));
const sitemap = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
let rowCount = 0;
for (const f of files) {
  const h = fs.readFileSync(path.join(ROOT, f), "utf8");
  if (f !== "404.html") {
    const slug = f === "index.html" ? HOST + "/" : `${HOST}/${f.replace(/\.html$/, "")}`;
    if (!h.includes(`<link rel="canonical" href="${slug}">`)) bad(f, "canonical missing or wrong");
    if (!sitemap.includes(`<loc>${slug}</loc>`)) bad(f, "not in sitemap.xml");
  }
  if (!h.includes('href="theme.css"') && !h.includes('href="/theme.css"')) bad(f, "theme.css not linked");
  if (!h.includes('Free and ad-free. If this site helped you, <a href="https://ko-fi.com/marcustravis"')) bad(f, "ko-fi footer line missing");
  if (!h.includes("static.cloudflareinsights.com/beacon.min.js") || !h.includes("data-cf-beacon")) bad(f, "analytics beacon missing");
  if (/fonts\.googleapis|fonts\.gstatic/.test(h)) bad(f, "external fonts");
  if (/\b(firearm|rifle|pistol|ammunition|handgun)s?\b/i.test(h.replace(/ammochart\.net|Firearms (and|or)[^<]*|Ammo Reference|firearms and ammunition charts[^<]*/gi, ""))) bad(f, "possible firearms wording");
  if (/\b(my employer|side[- ]project|work hours)\b/i.test(h)) bad(f, "banned wording");
  for (const m of h.replace(/<script>[\s\S]*?<\/script>/g, "").matchAll(/(?:href|src)="([^"#?]+)(?:[#?][^"]*)?"/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|data:)/.test(u)) continue;
    if (!fs.existsSync(path.join(ROOT, u.replace(/^\//, "")))) bad(f, `broken local link ${u}`);
  }
  if (h.includes('<section class="chart"')) {
    if (!h.includes(PRICE)) bad(f, "price rule missing from caption");
    if (!h.includes('src="scroll-hint.js"')) bad(f, "scroll-hint.js missing");
    for (const m of h.matchAll(/const DATA_(\w+)=(\[[\s\S]*?\n\]);/g)) {
      let data; try { data = vm.runInNewContext(m[2]); } catch (e) { bad(f, `DATA_${m[1]} does not parse`); continue; }
      const sec = h.match(new RegExp(`<section class="chart" id="${m[1].replace(/_/g, "-")}">[\\s\\S]*?</section>`));
      const trs = sec ? (sec[0].match(/<tr>/g) || []).length - 1 : -1;
      if (trs !== data.length) bad(f, `${m[1]}: ${data.length} DATA rows but ${trs} pre-rendered rows`);
      rowCount += data.length;
      data.forEach((d, i) => {
        if (d.price && (!/^https:\/\//.test(d.src || "") || !d.checked)) bad(f, `${m[1]} row ${i + 1} (${d.name}): price without source and checked date`);
        if (d.price && !/^\d+(\.\d{2})?$/.test(String(d.price))) bad(f, `${m[1]} row ${i + 1}: price should be a plain number`);
        if (d.src && !/^https:\/\//.test(d.src)) bad(f, `${m[1]} row ${i + 1}: src must be https`);
        if (!d.name) bad(f, `${m[1]} row ${i + 1}: no name`);
      });
    }
  }
}
for (const need of ["robots.txt", "_headers", "SOURCES.md", "CHANGELOG.md", "README.md", "favicon.svg", "favicon.ico", "apple-touch-icon.png", "og-image.png", "scroll-hint.js", "theme.css"])
  if (!fs.existsSync(path.join(ROOT, need))) bad(need, "missing");
if (!fs.readFileSync(path.join(ROOT, "robots.txt"), "utf8").includes(`Sitemap: ${HOST}/sitemap.xml`)) bad("robots.txt", "sitemap line");
if (problems.length) { console.error(problems.map(p => "✗ " + p).join("\n")); console.error(`\n${problems.length} problem(s)`); process.exit(1); }
console.log(`OK: ${files.length} pages, ${rowCount} chart rows checked`);
