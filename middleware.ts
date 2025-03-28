import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (path === "/api/voters") {
      return NextResponse.next();
    }

    // If there's no token, redirect to root path
    if (!token) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Handle admin routes
    if (path.startsWith("/admin_dashboard")) {
      if (token.role !== "ADMIN") {
        // If user is not an admin, redirect appropriately
        return NextResponse.redirect(
          new URL(token.role === "USER" ? "/user_dashboard" : "/", req.url)
        );
      }
    }

    // Handle user routes
    if (path.startsWith("/user_dashboard")) {
      if (token.role !== "VOTER") {
        // If user is not a regular user, redirect appropriately
        return NextResponse.redirect(
          new URL(token.role === "ADMIN" ? "/admin_dashboard" : "/", req.url)
        );
      }
    }

    // Allow the request to proceed
    return NextResponse.next();
  },
  {
    callbacks: {
      // Always return true to let our middleware handle the logic
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: [
    "/admin_dashboard/:path*",
    "/user_dashboard/:path*",
    "/api/admin/:path*",
    "/api/user/:path*",
  ],
};
