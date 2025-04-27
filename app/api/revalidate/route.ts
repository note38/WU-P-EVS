import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    // Extract tag from the request query
    const tag = request.nextUrl.searchParams.get("tag");

    if (!tag) {
      return NextResponse.json(
        { error: "Missing tag parameter" },
        { status: 400 }
      );
    }

    // Revalidate the specified tag
    revalidateTag(tag);

    return NextResponse.json(
      { success: true, message: `Revalidated tag: ${tag}` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json(
      {
        error: "Failed to revalidate",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
