import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log('[TEST-ROUTE] Received GET request');
    return NextResponse.json({ message: "API route is working" });
  } catch (error) {
    console.error('[TEST-ROUTE] Error handling GET request:', error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}