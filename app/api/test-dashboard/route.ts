// import { NextResponse } from "next/server";
// import { DashboardDataService } from "@/lib/data/dashboard";

// export async function GET() {
//   try {
//     console.log("🔍 Testing DashboardDataService methods...");

//     // Test getElectionResults
//     console.log("📊 Testing getElectionResults...");
//     const allResults = await DashboardDataService.getElectionResults();
//     console.log("✅ getElectionResults successful. Count:", allResults.length);

//     // Test getActiveElectionResults
//     console.log("📊 Testing getActiveElectionResults...");
//     const activeResults = await DashboardDataService.getActiveElectionResults();
//     console.log(
//       "✅ getActiveElectionResults successful. Active election:",
//       activeResults ? "Found" : "Not found"
//     );

//     return NextResponse.json({
//       success: true,
//       message: "DashboardDataService methods working",
//       allResultsCount: allResults.length,
//       hasActiveElection: !!activeResults,
//       timestamp: new Date().toISOString(),
//     });
//   } catch (error) {
//     console.error("❌ DashboardDataService test failed:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         error: "DashboardDataService test failed",
//         details: error instanceof Error ? error.message : "Unknown error",
//         stack: error instanceof Error ? error.stack : undefined,
//       },
//       { status: 500 }
//     );
//   }
// }
