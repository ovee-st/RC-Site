import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = ["/admin", "/employee", "/employer", "/candidate", "/support"];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const response = NextResponse.next();

  response.headers.set("x-rc-route-guard", protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ? "protected" : "public");
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("x-frame-options", "SAMEORIGIN");

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/employee/:path*", "/employer/:path*", "/candidate/:path*", "/support/:path*"]
};
