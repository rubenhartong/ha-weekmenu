// Screenshots of the panel in the main states, phone + desktop, light + dark.
// Usage: node test/shots.mjs [outdir]   (serves the repo root on :8765 itself)
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { mkdirSync } from "node:fs";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const root = resolve(new URL("../..", import.meta.url).pathname);
const out = resolve(process.argv[2] || join(root, "frontend/test/shots"));
mkdirSync(out, { recursive: true });

const types = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json" };
const server = createServer(async (req, res) => {
  try {
    const path = join(root, decodeURIComponent(new URL(req.url, "http://x").pathname));
    res.writeHead(200, { "content-type": types[extname(path)] || "application/octet-stream" });
    res.end(await readFile(path));
  } catch { res.writeHead(404); res.end(); }
}).listen(8765);

const browser = await chromium.launch();
const errors = [];
async function shot(name, { width, height, narrow, dark, state = "proposed", user, act, scale = 1 }) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  page.on("pageerror", (e) => errors.push(`${name}: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(`${name}: ${m.text()}`));
  await page.route(/picnicinternational/, (r) => r.abort());
  await page.goto(`http://localhost:8765/frontend/test/harness.html?state=${state}&narrow=${narrow ? 1 : 0}&dark=${dark ? 1 : 0}&user=${user || "Ruben"}`);
  await page.waitForFunction(() => window.__panel?.shadowRoot?.querySelector(".wrap > *"));
  if (act) await act(page);
  await page.waitForTimeout(350);
  await page.screenshot({ path: join(out, `${name}.png`) });
  await page.close();
}

const sr = (sel) => (page) => page.evaluate((s) => window.__panel.shadowRoot.querySelector(s).click(), sel);
const tab = (i) => sr(`.tabbar button:nth-child(${i}), .htabs button:nth-child(${i})`);
const phone = { width: 390, height: 844, narrow: true };
const desk = { width: 1280, height: 860, narrow: false };

for (const [m, dark] of [["light", false], ["dark", true]]) {
  await shot(`${m}-phone-week`, { ...phone, dark });
  await shot(`${m}-phone-day-open`, { ...phone, dark, act: async (p) => { await sr(".day:nth-child(4) .dhead")(p); await p.evaluate(() => window.__panel.renderRoot.querySelector("main").scrollTo(0, 560)); } });
  await shot(`${m}-phone-list`, { ...phone, dark, act: tab(2) });
  await shot(`${m}-phone-approve`, { ...phone, dark, act: sr(".actionbar .btn") });
  await shot(`${m}-phone-cook`, { ...phone, dark, state: "cooking", act: async (p) => { await sr(".tonight .btn")(p); await sr(".nav.p")(p); await sr(".nav.p")(p); await sr(".nav.p")(p); } });
  await shot(`${m}-desk-week`, { ...desk, dark, act: sr(".day:nth-child(1) .dhead") });
  await shot(`${m}-desk-approved`, { ...desk, dark, state: "approved" });
}
await shot("light-phone-link", { ...phone, act: async (p) => { await tab(2)(p); await sr(".tag.attention")(p); } });
await shot("light-phone-price", { ...phone, act: async (p) => { await tab(2)(p); await sr(".tools .btn")(p); await p.waitForTimeout(100); await sr(".prow")(p); } });
await shot("light-phone-michelle", { ...phone, user: "Michelle" });
await shot("light-phone-empty", { ...phone, state: "empty" });

await browser.close();
server.close();
if (errors.length) { console.error("ERRORS:\n" + errors.join("\n")); process.exit(1); }
console.log("ok", out);
