import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
  "/api/years(.*)",
  "/ballot/thank-you",
  "/test-auth",
  "/api/backup",
  "/api/restore",
  "/api/test-backup",
  "/api/test-restore",
  "/api/test-db",
  "/dashboard-redirect",
  "/api/elections/auto-status-update",
]);

const isCronRoute = createRouteMatcher(["/api/cron(.*)"]);

// Matches the actual admin dashboard and all its sub-routes
const isAdminRoute = createRouteMatcher(["/admin_dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // ── Cron routes: secret-based auth, bypass Clerk ──────────────────────────
  if (isCronRoute(req)) {
    const userAgent = req.headers.get("user-agent") || "";
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    console.log("[PROXY] Cron request:", {
      path: req.nextUrl.pathname,
      userAgent,
      hasAuth: !!authHeader,
      hasSecret: !!cronSecret,
    });

    const isVercelCron =
      userAgent.includes("vercel-cron") || userAgent.includes("vercel");
    const hasValidSecret =
      cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isVercelCron && !hasValidSecret) {
      console.log("[PROXY] Blocking unauthorized cron request");
      return NextResponse.json(
        {
          error: "Unauthorized",
          message:
            "Cron endpoints require Vercel user-agent or valid secret token",
        },
        { status: 401 }
      );
    }

    console.log("[PROXY] Cron request authorized");
    return NextResponse.next();
  }

  // ── All non-public routes: require Clerk authentication ───────────────────
  if (!isPublicRoute(req)) {
    const { userId } = await auth();

    // Not signed in with Clerk → redirect to sign-in
    if (!userId) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Enforce Clerk session
    await auth.protect();

    // ── Admin dashboard: verify the user is in the admin (User) table ────────
    if (isAdminRoute(req)) {
      try {
        const adminUser = await prisma.user.findUnique({
          where: { clerkId: userId },
          select: { id: true, role: true },
        });

        if (!adminUser) {
          // User is a voter (exists in voter table) or unknown — block access
          console.log(
            `[PROXY] Non-admin user ${userId} tried to access admin dashboard`
          );
          return NextResponse.redirect(new URL("/ballot", req.url));
        }

        // User is confirmed admin — allow through
        console.log(`[PROXY] Admin user ${userId} granted access`);
      } catch (err) {
        // Fail closed: on any DB error, deny access to admin
        console.error("[PROXY] DB error during admin check — denying access:", err);
        return NextResponse.redirect(new URL("/ballot", req.url));
      }
    }
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
