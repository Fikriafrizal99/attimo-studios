import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function read(path: string) {
  return readFileSync(path, "utf8");
}

function expect(source: string, marker: string, label: string) {
  if (!source.includes(marker)) throw new Error(`${label} missing marker: ${marker}`);
}

const privacy = read("app/privacy/page.tsx");
expect(privacy, "Privacy & Guest Data Notice", "privacy notice");
expect(privacy, "Link tamu personal", "guest token disclosure");
expect(privacy, "retensi", "retention disclosure");

const terms = read("app/terms/page.tsx");
expect(terms, "Konten pelanggan", "customer-content rights clause");
expect(terms, "Musik dan media pihak ketiga", "music rights clause");
expect(terms, "baseline produk pra-peluncuran", "pre-launch legal review marker");

const landing = read("components/landing/EndriyaLanding.tsx");
expect(landing, 'href="/privacy"', "public privacy link");
expect(landing, 'href="/terms"', "public terms link");

const rights = read("docs/commerce/ASSET_RIGHTS_REGISTER.md");
for (const marker of [
  "Customer couple/event photos",
  "Music/audio uploaded or linked by customer",
  "Upstream bundled images/decorative assets",
  "BLOCKED FOR COMMERCIAL RELEASE",
]) expect(rights, marker, "asset rights register");

const music = read("docs/commerce/MUSIC_USAGE_POLICY.md");
expect(music, "does not grant a license", "music license disclaimer");
expect(music, "If rights are uncertain, publish the invitation without music", "music safe fallback");

const upstream = read("docs/commerce/UPSTREAM_LICENSE_STATUS.md");
expect(upstream, "BLOCKED FOR COMMERCIAL RELEASE", "upstream commercial blocker");
expect(upstream, "explicit written permission", "upstream resolution path");

const fonts = read("templates/typography/catalog.ts");
expect(fonts, 'license: "OFL-1.1"', "font license metadata");
expect(fonts, 'source: "Google Fonts"', "font source metadata");

const forbidden: string[] = [];
const roots = ["app", "components", "templates"];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx"]);

function walk(path: string) {
  for (const entry of readdirSync(path)) {
    const full = join(path, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full);
      continue;
    }
    const dot = entry.lastIndexOf(".");
    if (dot < 0 || !extensions.has(entry.slice(dot))) continue;
    const source = read(full);
    if (/\battimo\b/i.test(source)) forbidden.push(full);
  }
}

for (const root of roots) walk(root);
if (forbidden.length) {
  throw new Error(`Upstream Attimo branding remains in public/product source: ${forbidden.join(", ")}`);
}

console.log("Phase 8.4 product/legal baseline verification passed");
