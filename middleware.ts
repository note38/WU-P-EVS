import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
  "/",
  "/home(.*)",
  "/api/webhooks(.*)",
  "/api/auth/check-email",
  "/api/auth/check-clerk-user",
  "/api/auth/sync-user",
  "/api/auth/manual-sync",
  "/api/auth/direct-sync",
  "/api/auth/validate-session",
  "/api/auth/check-user-sync",
  "/api/auth/debug",
  "/api/auth/link-user",
  "/api/auth/get-user",
  // CAUTION: The routes below are public. Review them to ensure they don't expose
  // sensitive data or functionality without their own authorization checks.
  // "/api/admin/stats",
  // "/api/admin/elections",
  // "/api/admin/departments",
  // "/api/voters",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
