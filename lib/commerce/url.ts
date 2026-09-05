export type InvitationMode = "path" | "subdomain";

export function getInvitationMode(): InvitationMode {
  return process.env.PUBLIC_INVITATION_MODE === "subdomain" ? "subdomain" : "path";
}

export function getInvitationBaseUrl(): string {
  const raw =
    process.env.PUBLIC_INVITATION_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export function buildInvitationUrl(options: {
  slug: string;
  guestToken?: string | null;
}): string {
  const base = new URL(getInvitationBaseUrl());
  const mode = getInvitationMode();

  if (mode === "subdomain") {
    base.hostname = `${options.slug}.${base.hostname}`;
    base.pathname = "/";
  } else {
    base.pathname = `/invite/${encodeURIComponent(options.slug)}`;
  }

  base.search = "";
  if (options.guestToken) base.searchParams.set("guest", options.guestToken);
  return base.toString();
}
