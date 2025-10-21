import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sso-callback(.*)",
  "/",
  "/home(.*)",
  "/api/webhooks(.*)",
  "/api/home(.*)",
  "/api/logs(.*)",
  "/api/test",
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
  "/api/voters(.*)",
  "/api/years(.*)", // Add this line to make years API public for testing
  "/test-auth",
  "/api/backup",
  "/api/restore",
  "/api/test-backup",
  "/api/test-restore",
  "/api/test-db",
]);

// Cron routes require special handling
const isCronRoute = createRouteMatcher(["/api/cron(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Handle cron routes with enhanced security
  if (isCronRoute(req)) {
    const userAgent = req.headers.get("user-agent") || "";
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    console.log("[MIDDLEWARE] Cron request:", {
      path: req.nextUrl.pathname,
      userAgent,
      hasAuth: !!authHeader,
      hasSecret: !!cronSecret,
    });

    // Check if request comes from Vercel cron
    const isVercelCron =
      userAgent.includes("vercel-cron") || userAgent.includes("vercel");

    // Check if has valid secret token
    const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`;

    // Allow if either Vercel cron OR valid secret (for manual testing)
    if (!isVercelCron && !hasValidSecret) {
      console.log("[MIDDLEWARE] Blocking unauthorized cron request");
      return NextResponse.json(
        {
          error: "Unauthorized",
          message:
            "Cron endpoints require Vercel user-agent or valid secret token",
        },
        { status: 401 }
      );
    }

    console.log("[MIDDLEWARE] Cron request authorized");
    // Allow cron requests to proceed without Clerk authentication
    return NextResponse.next();
  }

  // Handle regular routes
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};