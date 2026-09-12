import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets, images, favicon and next internal routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".") ||
    pathname === "/icon.svg"
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET || "elap_production_super_secret_jwt_key_2026_change_me",
  });

  // Public route: /login
  if (pathname === "/login") {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Root redirect
  if (pathname === "/") {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If not authenticated, allow client AuthContext to handle redirect or redirect directly
  if (!token) {
    // For API routes, return 410 / 401 Unauthorized
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const userRole = token.role as "EMPLOYEE" | "MANAGER" | "HR" | undefined;

  // RBAC Route Protection Guards
  if (pathname.startsWith("/approvals") || pathname.startsWith("/team")) {
    if (userRole !== "MANAGER") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (
    pathname.startsWith("/employees") ||
    pathname.startsWith("/departments") ||
    pathname.startsWith("/leave-requests") ||
    pathname.startsWith("/audit")
  ) {
    if (userRole !== "HR") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (pathname.startsWith("/leave/apply")) {
    if (userRole !== "EMPLOYEE") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
