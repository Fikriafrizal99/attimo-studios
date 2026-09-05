import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const allowPublicSignup = process.env.ALLOW_PUBLIC_SIGNUP === "true";

  if (!allowPublicSignup && pathname.startsWith("/api/auth/sign-up")) {
    return NextResponse.json({ error: "Public sign-up is disabled" }, { status: 404 });
  }

  if (!allowPublicSignup && pathname === "/signup") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (process.env.PUBLIC_INVITATION_MODE === "subdomain") {
    const configuredBase = process.env.PUBLIC_INVITATION_BASE_URL;
    if (configuredBase) {
      try {
        const baseHostname = new URL(configuredBase).hostname.toLowerCase();
        const requestHostname = (request.headers.get("host") ?? "")
          .split(":")[0]
          .toLowerCase();
        const suffix = `.${baseHostname}`;

        if (
          requestHostname.endsWith(suffix) &&
          requestHostname !== baseHostname &&
          !pathname.startsWith("/api") &&
          !pathname.startsWith("/_next")
        ) {
          const slug = requestHostname.slice(0, -suffix.length);
          if (slug && !slug.includes(".")) {
            const url = request.nextUrl.clone();
            url.pathname = "/invitation";
            const requestHeaders = new Headers(request.headers);
            requestHeaders.set("x-wedding-slug", slug);
            return NextResponse.rewrite(url, {
              request: { headers: requestHeaders },
            });
          }
        }
      } catch {
        // Invalid PUBLIC_INVITATION_BASE_URL will be surfaced by server URL helpers.
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/auth/sign-up/:path*",
    "/signup",
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3)$).*)",
  ],
};
