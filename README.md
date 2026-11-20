# Prep Chart

Free, ad-free emergency preparedness reference: charts, calculators and plain-words guides. Static HTML, CSS and JS with no framework and no build step. Serve the repo root. Canonical host: https://bugoutchart.pages.dev

## Updating chart data
Each chart page has an inline `const DATA_<id> = [...]` array in its `<script>`, plus a `COLS_<id>` column spec. The table body is also pre-rendered in the HTML so it works without JavaScript. **When you change a DATA row, change the matching `<tr>` in the HTML too** (or re-render it by loading the page and copying the table body). Keep the "Checked" date and source link on any row where you fill in a price. Then run:

    node tools/check-consistency.mjs

## Price rule
**Price rule:** Lowest publicly listed MSRP or current list price on the manufacturer's or major US retailer's product page for a new unit. Checked date shown. When no live retail found, leave price blank.

Never invent a number: blank beats a guess. Editorial estimates (for example bag weights) must be labeled as estimates. Per-row sources and check status live in SOURCES.md.

## Rules
- System fonts only; no external fonts, ads or affiliate links.
- No firearms content (link to https://ammochart.net instead).
- Summarize official lists in our own words and link out.
- Safety notes stay on first aid, water treatment and generator/fuel (CO) pages.
- Cloudflare Web Analytics beacon is at the bottom of every page.

## Files
- `theme.css`, `scroll-hint.js`: shared styling and the wide-table scroll cue.
- `sitemap.xml`, `robots.txt`, `_headers`: SEO and canonical link header.
- `tools/check-consistency.mjs`: sanity checks.
