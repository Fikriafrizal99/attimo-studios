import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const roots = ["app", "lib"];
const allowedServiceRoleFiles = new Set([
  "app/api/rsvp/route.ts",
  "app/api/wishes/route.ts",
  "app/api/weddings/[id]/upload/route.ts",
  "app/invite/[slug]/page.tsx",
  "app/invitation/page.tsx",
  "lib/supabase.ts",
]);

async function collect(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await collect(full)));
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) files.push(full);
  }
  return files;
}

const files = (await Promise.all(roots.map(collect))).flat();
const violations = [];

for (const file of files) {
  const normalized = file.split(path.sep).join("/");
  const source = await readFile(file, "utf8");

  if (source.includes("createServerClient")) {
    violations.push(`${normalized}: legacy createServerClient is forbidden`);
  }

  const usesServiceRole =
    source.includes("createServiceRoleClient") ||
    source.includes("SUPABASE_SERVICE_ROLE_KEY");

  if (usesServiceRole && !allowedServiceRoleFiles.has(normalized)) {
    violations.push(`${normalized}: service-role access is outside the explicit allowlist`);
  }
}

if (violations.length) {
  console.error("Service-role boundary check failed:\n" + violations.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log("Service-role boundary check passed.");
