import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ป้องกัน /admin/* ทุกหน้า (ยกเว้น /admin-login)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin-login")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || "raredrop_secret_key_123",
    });

    const role = (token as any)?.role;
    const isAdmin = role === "admin" || role === "super_admin";

    if (!token || !isAdmin) {
      const loginUrl = new URL("/admin-login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
