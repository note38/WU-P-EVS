import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Handle caching for avatar images
    if (path.startsWith("/avatars/")) {
      const response = NextResponse.next();
      response.headers.set(
        "Cache-Control",
        "public, max-age=31536000, immutable"
      );
      response.headers.set("Accept-Encoding", "br, gzip");
      return response;
    }

    // Early return for public API routes
    if (path === "/api/voters" || path.startsWith("/api/public")) {
      const response = NextResponse.next();
      response.headers.set(
        "Cache-Control",
        "public, max-age=300, stale-while-revalidate=60"
      );
      return response;
    }

    // If there's no token, redirect to root path (only for protected routes)
    if (!token) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const userRole = token.role;
    const isAdmin = userRole === "ADMIN";
    const isVoter = userRole === "VOTER";

    // Handle admin routes with optimized checks
    if (path.startsWith("/admin_dashboard") || path.startsWith("/api/admin")) {
      if (!isAdmin) {
        return NextResponse.redirect(
          new URL(isVoter ? "/user_dashboard" : "/", req.url)
        );
      }
    }

    // Handle user routes with optimized checks
    if (path.startsWith("/user_dashboard") || path.startsWith("/api/user")) {
      if (!isVoter) {
        return NextResponse.redirect(
          new URL(isAdmin ? "/admin_dashboard" : "/", req.url)
        );
      }
    }

    // Create response with performance headers
    const response = NextResponse.next();

    // Add security and performance headers
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // Add cache headers for static routes
    if (path.includes("/static/") || path.includes("/_next/")) {
      response.headers.set(
        "Cache-Control",
        "public, max-age=31536000, immutable"
      );
    } else {
      response.headers.set(
        "Cache-Control",
        "private, no-cache, no-store, must-revalidate"
      );
    }

    return response;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Only allow authenticated users
    },
    pages: {
      signIn: "/", // Redirect to home page for sign in
    },
  }
);

export const config = {
  matcher: [
    "/admin_dashboard/:path*",
    "/user_dashboard/:path*",
    "/api/admin/:path*",
    "/api/emails/:path*",
    "/api/user/:path*",
    "/avatars/:path*",
  ],
};
