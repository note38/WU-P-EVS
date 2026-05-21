// app/api/voters/import-excel/route.ts
import { prisma } from "@/lib/db";
import { VoterStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

interface ImportVoterItem {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  yearId: number;
  electionId?: number | null;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { voters } = body;

    if (!Array.isArray(voters) || voters.length === 0) {
      return NextResponse.json(
        { error: "Invalid data. Expected an array of voters." },
        { status: 400 }
      );
    }

    console.log(`=== Starting Excel Voter Import of ${voters.length} items ===`);

    let importedCount = 0;
    let skippedCount = 0;
    const errors: Array<{ email: string; name: string; error: string }> = [];

    // Get all existing voter emails in a single query to make duplicate checking extremely fast
    const existingVoters = await prisma.voter.findMany({
      select: { email: true },
    });
    const existingEmailsSet = new Set(
      existingVoters.map((v) => v.email.toLowerCase().trim())
    );

    // Process the voters
    for (const item of voters) {
      const email = String(item.email).trim().toLowerCase();
      const firstName = String(item.firstName).trim();
      const lastName = String(item.lastName).trim();
      const middleName = item.middleName ? String(item.middleName).trim() : "";
      const yearId = parseInt(String(item.yearId));
      const electionId = item.electionId ? parseInt(String(item.electionId)) : null;

      const fullName = `${firstName} ${lastName}`;

      // Validation
      if (!firstName || !lastName || !email || isNaN(yearId)) {
        errors.push({
          email: item.email || "N/A",
          name: fullName || "Unknown",
          error: "Missing required fields (First Name, Last Name, Email, or Year)",
        });
        skippedCount++;
        continue;
      }

      // Check if duplicate email exists
      if (existingEmailsSet.has(email)) {
        errors.push({
          email: item.email,
          name: fullName,
          error: "Email already registered in the system",
        });
        skippedCount++;
        continue;
      }

      try {
        // Create voter in the database
        await prisma.voter.create({
          data: {
            avatar: "default-avatar.png",
            firstName,
            lastName,
            middleName,
            email,
            hashpassword: null,
            yearId,
            status: "UNCAST" as VoterStatus,
            ...(electionId ? { electionId } : {}),
          },
        });

        // Add to our local set to prevent duplicates within the same upload batch
        existingEmailsSet.add(email);
        importedCount++;
      } catch (err) {
        console.error(`Error importing voter ${fullName}:`, err);
        errors.push({
          email: item.email,
          name: fullName,
          error: err instanceof Error ? err.message : String(err),
        });
        skippedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      importedCount,
      skippedCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully imported ${importedCount} voter(s). Skipped ${skippedCount} duplicate or invalid voter(s).`,
    });
  } catch (error: any) {
    console.error("Bulk Excel import request error:", error);
    return NextResponse.json(
      {
        error: "Failed to process import request",
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
