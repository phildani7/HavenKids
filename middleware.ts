import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/auth.config";

// Edge-safe: middleware uses ONLY auth.config (no adapter, no node:crypto).
const { auth } = NextAuth(authConfig);

// Gate /app/* behind a valid session. Everything else is public.
export default auth((request) => {
  const url = request.nextUrl;
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
