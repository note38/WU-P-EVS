// import { NextResponse } from "next/server";
// import { auth } from "@clerk/nextjs/server";
// import { getUserByClerkId } from "@/lib/clerk-auth";
// import { prisma } from "@/lib/db";

// export async function GET() {
//   try {
//     console.log("🔍 Testing user lookup...");

//     const { userId } = await auth();
//     console.log("👤 Clerk userId:", userId);

//     if (!userId) {
//       return NextResponse.json({
//         success: false,
//         error: "No userId from Clerk auth",
//         timestamp: new Date().toISOString(),
//       });
//     }

//     // Test getUserByClerkId
//     console.log("📊 Testing getUserByClerkId...");
//     const userData = await getUserByClerkId(userId);
//     console.log(
//       "✅ getUserByClerkId result:",
//       userData ? "Found" : "Not found"
//     );

//     // Test direct database queries
//     console.log("📊 Testing direct database queries...");

//     const adminUser = await prisma.user.findUnique({
//       where: { clerkId: userId },
//       select: { id: true, email: true, role: true },
//     });
//     console.log("✅ Admin user query:", adminUser ? "Found" : "Not found");

//     const voter = await prisma.voter.findUnique({
//       where: { clerkId: userId },
//       select: { id: true, email: true, firstName: true, lastName: true },
//     });
//     console.log("✅ Voter query:", voter ? "Found" : "Not found");

//     // Count total users
//     const adminCount = await prisma.user.count();
//     const voterCount = await prisma.voter.count();
//     console.log(
//       "📊 Database counts - Admins:",
//       adminCount,
//       "Voters:",
//       voterCount
//     );

//     return NextResponse.json({
//       success: true,
//       clerkUserId: userId,
//       userData: userData
//         ? {
//             type: userData.type,
//             hasUser: !!userData.user,
//           }
//         : null,
//       directQueries: {
//         adminUser: adminUser
//           ? { id: adminUser.id, email: adminUser.email, role: adminUser.role }
//           : null,
//         voter: voter
//           ? {
//               id: voter.id,
//               email: voter.email,
//               name: `${voter.firstName} ${voter.lastName}`,
//             }
//           : null,
//       },
//       databaseCounts: {
//         admins: adminCount,
//         voters: voterCount,
//       },
//       timestamp: new Date().toISOString(),
//     });
//   } catch (error) {
//     console.error("❌ Test users failed:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         error: "Test failed",
//         details: error instanceof Error ? error.message : "Unknown error",
//         timestamp: new Date().toISOString(),
//       },
//       { status: 500 }
//     );
//   }
// }
