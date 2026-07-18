import { NextRequest, NextResponse } from "next/server";
import { setShowResultsUntil } from "@/lib/show-results-store";
import { validateAdminAccess } from "@/lib/auth-utils";

export async function POST(req: NextRequest, context: any) {
  try {
    const adminValidation = await validateAdminAccess();
    if (!adminValidation.success) {
      return adminValidation.response;
    }

    const params = await context.params;
    const electionId = parseInt(params.electionId);

    if (isNaN(electionId)) {
      return NextResponse.json(
        { error: "Invalid election ID format" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "show";

    if (action === "hide") {
      setShowResultsUntil(electionId, null);
      return NextResponse.json({
        message: "Election results will be hidden from the home page",
      });
    } else {
      // Set showResultsUntil to 24 hours from now
      const showUntil = new Date();
      showUntil.setHours(showUntil.getHours() + 24);

      setShowResultsUntil(electionId, showUntil);

      return NextResponse.json({
        message: "Election results will be shown on the home page for 24 hours",
      });
    }
  } catch (error) {
    console.error("Error showing election results:", error);
    return NextResponse.json(
      { error: "Failed to show election results" },
      { status: 500 }
    );
  }
}
