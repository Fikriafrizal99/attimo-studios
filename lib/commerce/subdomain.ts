import { validateSlug } from "@/lib/commerce/validation";

function firstForwardedHost(value: string): string {
  return value.split(",")[0]?.trim() ?? "";
}

function hostWithoutPort(value: string): string {
  const normalized = firstForwardedHost(value).toLowerCase();
  return normalized.split(":")[0] ?? "";
}

export function resolveWeddingSubdomainSlug(options: {
  requestHost: string;
  baseUrl: string;
}): string | null {
  let baseHostname: string;
  try {
    baseHostname = new URL(options.baseUrl).hostname.trim().toLowerCase();
  } catch {
    return null;
  }

  const requestHostname = hostWithoutPort(options.requestHost);
  if (!requestHostname || requestHostname === baseHostname) return null;

  const suffix = `.${baseHostname}`;
  if (!requestHostname.endsWith(suffix)) return null;

  const candidate = requestHostname.slice(0, -suffix.length);
  if (!candidate || candidate.includes(".")) return null;

  const validated = validateSlug(candidate);
  return validated.ok ? validated.value : null;
}
