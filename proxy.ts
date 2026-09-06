import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveWeddingSubdomainSlug } from "@/lib/commerce/subdomain";

export function proxy(request: NextRequest) {
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
      const forwardedHost = request.headers.get("x-forwarded-host") ?? "";
      const requestHost = forwardedHost || request.headers.get("host") || "";
      const slug = resolveWeddingSubdomainSlug({
        requestHost,
        baseUrl: configuredBase,
      });

      if (slug) {
        if (pathname !== "/") {
          const canonical = request.nextUrl.clone();
          canonical.pathname = "/";
          return NextResponse.redirect(canonical, 308);
        }

        const url = request.nextUrl.clone();
        url.pathname = "/invitation";
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-wedding-slug", slug);
        return NextResponse.rewrite(url, {
          request: { headers: requestHeaders },
        });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/auth/sign-up/:path*",
    "/signup",
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3)$).*)",
  ],
};
