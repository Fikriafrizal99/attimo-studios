import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveWeddingSubdomainSlug } from "@/lib/commerce/subdomain";
import { createRequestId } from "@/lib/commerce/observability";

function responseWithRequestId(response: NextResponse, requestId: string) {
  response.headers.set("x-request-id", requestId);
  return response;
}

function nextWithRequestId(request: NextRequest, requestId: string) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);
  return responseWithRequestId(
    NextResponse.next({ request: { headers: requestHeaders } }),
    requestId
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const allowPublicSignup = process.env.ALLOW_PUBLIC_SIGNUP === "true";
  const requestId = createRequestId(request);

  if (!allowPublicSignup && pathname.startsWith("/api/auth/sign-up")) {
    return responseWithRequestId(
      NextResponse.json({ error: "Public sign-up is disabled" }, { status: 404 }),
      requestId
    );
  }

  if (!allowPublicSignup && pathname === "/signup") {
    return responseWithRequestId(
      NextResponse.redirect(new URL("/login", request.url)),
      requestId
    );
  }

  // API calls only need request correlation here. Invitation subdomain routing
  // applies to document requests and must never rewrite/redirect API paths.
  if (pathname.startsWith("/api/")) {
    return nextWithRequestId(request, requestId);
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
          return responseWithRequestId(NextResponse.redirect(canonical, 308), requestId);
        }

        const url = request.nextUrl.clone();
        url.pathname = "/invitation";
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-wedding-slug", slug);
        requestHeaders.set("x-request-id", requestId);
        return responseWithRequestId(
          NextResponse.rewrite(url, {
            request: { headers: requestHeaders },
          }),
          requestId
        );
      }
    }
  }

  return nextWithRequestId(request, requestId);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3)$).*)",
  ],
};
