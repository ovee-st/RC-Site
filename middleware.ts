import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = ["/admin", "/employee", "/employer", "/candidate", "/support"];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requestHeaders = new Headers(request.headers);
  const correlationId = requestHeaders.get("x-correlation-id") || crypto.randomUUID();
  requestHeaders.set("x-correlation-id", correlationId);
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set("x-correlation-id", correlationId);
  response.headers.set("x-rc-route-guard", protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ? "protected" : "public");
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("x-frame-options", "SAMEORIGIN");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set("permissions-policy", "camera=(), microphone=(), geolocation=(), payment=()");
  response.headers.set("cross-origin-opener-policy", "same-origin-allow-popups");
  if (process.env.NODE_ENV === "production") response.headers.set("strict-transport-security", "max-age=31536000; includeSubDomains; preload");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"]
};
