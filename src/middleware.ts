import { NextResponse } from "next/server";
import { config as authConfig } from "@/lib/auth";
import NextAuth from "next-auth";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userEmail = req.auth?.user?.email?.toLowerCase().trim();

  // Get admin emails from environment
  const adminEmails =
    process.env.ADMIN_EMAILS?.split(",").map((email) => email.trim().toLowerCase()) || [];
  const isAdminUser = userEmail && adminEmails.includes(userEmail);

  // Check if accessing admin routes
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isAdminLoginPage = nextUrl.pathname === "/admin/login";

  if (isAdminRoute) {
    // Allow access to login page
    if (isAdminLoginPage) {
      // If already logged in as admin, redirect to admin dashboard
      if (isLoggedIn && isAdminUser) {
        return NextResponse.redirect(new URL("/admin", nextUrl));
      }
      // Allow access to login page
      return NextResponse.next();
    }

    // For all other admin routes, require authentication
    if (!isLoggedIn || !isAdminUser) {
      const loginUrl = new URL("/admin/login", nextUrl);
      // Add the current path as a callback parameter
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  // Matcher configuration for Next.js middleware
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
