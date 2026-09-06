export const WEDDING_ASSET_BUCKET = "wedding-assets";
export const WEDDING_ASSET_MAX_BYTES = 5 * 1024 * 1024;

export type AllowedWeddingImage = {
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  extension: "jpg" | "png" | "webp" | "gif";
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TOKEN_RE = /^[0-9a-f]{16,64}$/i;

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

export function detectWeddingImageType(bytes: Uint8Array): AllowedWeddingImage | null {
  if (bytes.length >= 3 && startsWith(bytes, [0xff, 0xd8, 0xff])) {
    return { mimeType: "image/jpeg", extension: "jpg" };
  }

  if (
    bytes.length >= 8 &&
    startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  ) {
    return { mimeType: "image/png", extension: "png" };
  }

  if (bytes.length >= 6) {
    const header = String.fromCharCode(...bytes.slice(0, 6));
    if (header === "GIF87a" || header === "GIF89a") {
      return { mimeType: "image/gif", extension: "gif" };
    }
  }

  if (bytes.length >= 12) {
    const riff = String.fromCharCode(...bytes.slice(0, 4));
    const webp = String.fromCharCode(...bytes.slice(8, 12));
    if (riff === "RIFF" && webp === "WEBP") {
      return { mimeType: "image/webp", extension: "webp" };
    }
  }

  return null;
}

export function isValidWeddingId(value: string): boolean {
  return UUID_RE.test(value);
}

export function buildWeddingAssetPrefix(weddingId: string): string {
  if (!isValidWeddingId(weddingId)) throw new Error("Invalid wedding id for asset path");
  return `weddings/${weddingId}/assets/`;
}

export function buildWeddingAssetPath(input: {
  weddingId: string;
  extension: AllowedWeddingImage["extension"];
  token: string;
  timestamp?: number;
}): string {
  const prefix = buildWeddingAssetPrefix(input.weddingId);
  if (!TOKEN_RE.test(input.token)) throw new Error("Invalid asset token");
  if (!Number.isSafeInteger(input.timestamp ?? Date.now()) || (input.timestamp ?? 0) < 0) {
    throw new Error("Invalid asset timestamp");
  }
  return `${prefix}${input.timestamp ?? Date.now()}-${input.token}.${input.extension}`;
}

export function isWeddingAssetPathForWedding(path: string, weddingId: string): boolean {
  try {
    const prefix = buildWeddingAssetPrefix(weddingId);
    if (!path.startsWith(prefix)) return false;
    const filename = path.slice(prefix.length);
    return /^\d+-[0-9a-f]{16,64}\.(jpg|png|webp|gif)$/i.test(filename);
  } catch {
    return false;
  }
}
