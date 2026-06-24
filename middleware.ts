import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/auth.config";
import { isRegionBlocked } from "@/lib/geo";

// Edge-safe: middleware uses ONLY auth.config (no adapter, no node:crypto).
const { auth } = NextAuth(authConfig);

// Gate /app/* behind a valid session. Everything else is public.
export default auth((request) => {
  const url = request.nextUrl;

  // SAFE-1: geo-restrict UK/EU/EEA. x-vercel-ip-country is only populated on
  // Vercel — locally/elsewhere the header is absent, so local dev always allows
  // (best-effort, documented). Let /blocked through first to avoid redirect loops.
  const country = request.headers.get("x-vercel-ip-country");
  if (isRegionBlocked(country) && !url.pathname.startsWith("/blocked")) {
    return NextResponse.redirect(new URL("/blocked", url));
  }

  const isProtected = url.pathname.startsWith("/app");
  const session = request.auth;

  if (isProtected && !session) {
    const signIn = new URL("/login", url);
    signIn.searchParams.set("callbackUrl", url.pathname);
    return NextResponse.redirect(signIn);
  }

  return NextResponse.next();
}) as unknown as (req: NextRequest) => NextResponse | Promise<NextResponse>;

export const config = {
  // Skip Next internals, static files, favicon, and the auth endpoints.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
