// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/db";

// export async function GET() {
//   try {
//     // Test basic database connection
//     const electionCount = await prisma.election.count();

//     return NextResponse.json({
//       success: true,
//       message: "Database connection successful",
//       electionCount,
//       timestamp: new Date().toISOString(),
//     });
//   } catch (error) {
//     return NextResponse.json(
//       {
//         success: false,
//         error: "Database connection failed",
//         details: error instanceof Error ? error.message : "Unknown error",
//       },
//       { status: 500 }
//     );
//   }
// }
