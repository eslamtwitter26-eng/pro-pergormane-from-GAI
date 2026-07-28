/**
 * Folds the preview build into a single portable HTML file.
 *
 * Usage (from repo root):
 *   npm run build:preview && node artifacts/trading-dashboard/scripts/inline-preview.mjs
 *
 * Output: ./preview.html — openable with file://, no server required.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, "..", "dist", "preview");
const assets = path.join(dist, "assets");
const repoRoot = path.resolve(here, "..", "..", "..");

if (!fs.existsSync(dist)) {
  console.error("No preview build found. Run `npm run build:preview` first.");
  process.exit(1);
}

let html = fs.readFileSync(path.join(dist, "preview.html"), "utf8");
const files = fs.readdirSync(assets);

const css = Object.fromEntries(
  files.filter((f) => f.endsWith(".css")).map((f) => [f, fs.readFileSync(path.join(assets, f), "utf8")])
);
const js = files.filter((f) => f.endsWith(".js"));

if (js.length !== 1) {
  console.error(`Expected exactly one JS chunk (inlineDynamicImports), got: ${js.join(", ")}`);
  process.exit(1);
}
const jsSrc = fs.readFileSync(path.join(assets, js[0]), "utf8");

// Inline stylesheets
const inlineCss = (m, href) => {
  const name = href.split("/").pop();
  return css[name] ? `<style>\n${css[name]}\n</style>` : m;
};
html = html.replace(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, inlineCss);
html = html.replace(/<link[^>]*href="([^"]+\.css)"[^>]*rel="stylesheet"[^>]*>/g, inlineCss);
html = html.replace(/<link[^>]+rel="modulepreload"[^>]*>/g, "");

// Inline the module script
html = html.replace(
  /<script[^>]*src="[^"]*\.js"[^>]*><\/script>/,
  () => `<script type="module">\n${jsSrc}\n</script>`
);

// Favicon as a data URI so nothing is fetched from disk
const favicon = path.resolve(here, "..", "public", "favicon.svg");
if (fs.existsSync(favicon)) {
  const b64 = fs.readFileSync(favicon).toString("base64");
  html = html.replace(/href="[^"]*favicon\.svg"/, `href="data:image/svg+xml;base64,${b64}"`);
}

const out = path.join(repoRoot, "preview.html");
fs.writeFileSync(out, html);

const leftovers = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((u) => !u.startsWith("data:") && !u.startsWith("https://fonts") && !u.startsWith("#") && !u.includes("'+"));

console.log(`Wrote ${out} (${(fs.statSync(out).size / 1e6).toFixed(2)} MB)`);
console.log(leftovers.length ? `WARNING external refs: ${leftovers}` : "Self-contained: no external asset refs.");
