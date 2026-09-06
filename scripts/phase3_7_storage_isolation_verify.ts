import { readFileSync } from "node:fs";
import {
  buildWeddingAssetPath,
  detectWeddingImageType,
  isWeddingAssetPathForWedding,
  isValidWeddingId,
  WEDDING_ASSET_MAX_BYTES,
} from "../lib/commerce/storage";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const weddingA = "11111111-1111-4111-8111-111111111111";
const weddingB = "22222222-2222-4222-8222-222222222222";

assert(isValidWeddingId(weddingA), "valid UUID should be accepted");
assert(!isValidWeddingId("../../other-wedding"), "path-like wedding id must be rejected");
assert(WEDDING_ASSET_MAX_BYTES === 5 * 1024 * 1024, "asset size cap must remain 5MB");

const path = buildWeddingAssetPath({
  weddingId: weddingA,
  extension: "webp",
  token: "0123456789abcdef01234567",
  timestamp: 1234567890,
});
assert(
  path === `weddings/${weddingA}/assets/1234567890-0123456789abcdef01234567.webp`,
  "asset path must be generated inside the wedding namespace"
);
assert(isWeddingAssetPathForWedding(path, weddingA), "wedding A must recognize its own path");
assert(!isWeddingAssetPathForWedding(path, weddingB), "wedding B must not recognize wedding A path");
assert(
  !isWeddingAssetPathForWedding(`weddings/${weddingA}/assets/../../secret.webp`, weddingA),
  "traversal-like object names must fail validation"
);

const jpeg = detectWeddingImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]));
assert(jpeg?.mimeType === "image/jpeg" && jpeg.extension === "jpg", "JPEG signature missing");

const png = detectWeddingImageType(
  new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
);
assert(png?.mimeType === "image/png", "PNG signature missing");

const gif = detectWeddingImageType(new TextEncoder().encode("GIF89a"));
assert(gif?.mimeType === "image/gif", "GIF signature missing");

const webp = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);
assert(detectWeddingImageType(webp)?.mimeType === "image/webp", "WebP signature missing");
assert(
  detectWeddingImageType(new TextEncoder().encode("<script>alert(1)</script>")) === null,
  "non-image payload must not be accepted"
);

const uploadRoute = readFileSync("app/api/weddings/[id]/upload/route.ts", "utf8");
assert(uploadRoute.includes("hasWeddingAccess"), "upload route must authorize wedding membership");
assert(uploadRoute.includes("buildWeddingAssetPath"), "upload route must generate server-side object paths");
assert(uploadRoute.includes("detectWeddingImageType"), "upload route must inspect file signatures");
assert(
  uploadRoute.includes("file.type !== detected.mimeType"),
  "upload route must reject MIME/content mismatches"
);
assert(
  !uploadRoute.includes('formData.get("path")'),
  "browser must not be allowed to supply an object path"
);

const migration = readFileSync(
  "supabase/migrations/20260906000800_storage_isolation.sql",
  "utf8"
);
for (const command of ["INSERT", "UPDATE", "DELETE"]) {
  assert(
    migration.includes(`FOR ${command}`),
    `storage isolation migration must cover direct ${command}`
  );
}
assert(
  (migration.match(/AS RESTRICTIVE/g) ?? []).length === 3,
  "all mutation policies must be restrictive"
);
assert(
  migration.includes("bucket_id <> ''wedding-assets''"),
  "restrictive policies must deny wedding-assets mutations"
);

console.log("Phase 3.7 storage isolation verification passed.");
