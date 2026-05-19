import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";

// Gate /app/* behind a valid session. Everything else (login, api/auth,
// static assets) is public.
export default auth((request: NextRequest & { auth: unknown }) => {
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
