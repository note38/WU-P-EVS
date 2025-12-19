// import { prisma } from "@/lib/db";
// import { auth } from "@clerk/nextjs/server";
// import { NextRequest, NextResponse } from "next/server";
// import { resend } from "@/lib/resend";

// export async function POST(req: NextRequest, context: any) {
//   try {
//     const { userId } = await auth();

//     if (!userId) {
//       return NextResponse.json(
//         { error: "You must be logged in" },
//         { status: 401 }
//       );
//     }

//     // Get user data from database to check if they're an admin
//     const userResponse = await fetch(
//       `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/get-user`,
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ userId }),
//       }
//     );

//     if (!userResponse.ok) {
//       return NextResponse.json({ error: "User not found" }, { status: 404 });
//     }

//     const userData = await userResponse.json();

//     if (userData.type !== "admin") {
//       return NextResponse.json(
//         { error: "Admin access required" },
//         { status: 403 }
//       );
//     }

//     const params = await context.params;
//     const electionId = parseInt(params.electionId);

//     if (isNaN(electionId)) {
//       return NextResponse.json(
//         { error: "Invalid election ID format" },
//         { status: 400 }
//       );
//     }

//     // Get election with results
//     const election = await prisma.election.findUnique({
//       where: { id: electionId },
//       include: {
//         positions: {
//           include: {
//             candidates: {
//               include: {
//                 partylist: true,
//               },
//             },
//           },
//         },
//         voters: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             middleName: true,
//             email: true,
//           },
//         },
//       },
//     });

//     if (!election) {
//       return NextResponse.json(
//         { error: "Election not found" },
//         { status: 404 }
//       );
//     }

//     // Get vote counts for each candidate
//     const voteCounts = await prisma.vote.groupBy({
//       by: ["candidateId"],
//       where: {
//         electionId: electionId,
//       },
//       _count: {
//         candidateId: true,
//       },
//     });

//     const voteCountMap = voteCounts.reduce(
//       (acc, vote) => {
//         acc[vote.candidateId] = vote._count.candidateId;
//         return acc;
//       },
//       {} as Record<number, number>
//     );

//     // Format results for email
//     const results = election.positions.map((position) => {
//       const candidates = position.candidates.map((candidate) => ({
//         name: candidate.name,
//         partylist: candidate.partylist.name,
//         votes: voteCountMap[candidate.id] || 0,
//       }));

//       // Sort by votes (descending)
//       candidates.sort((a, b) => b.votes - a.votes);

//       return {
//         position: position.name,
//         winner: candidates[0],
//         candidates,
//         totalVotes: candidates.reduce((sum, c) => sum + c.votes, 0),
//       };
//     });

//     // Send emails to all voters
//     const emailPromises = election.voters.map(async (voter) => {
//       const fullName = `${voter.firstName} ${voter.middleName ? voter.middleName + " " : ""}${voter.lastName}`;

//       // Create results HTML
//       const resultsHtml = results
//         .map(
//           (result) => `
//         <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e0e0e0; border-radius: 8px;">
//           <h3 style="color: #1f2937; margin: 0 0 10px 0;">${result.position}</h3>
//           <div style="background: #f0f9ff; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
//             <strong style="color: #0369a1;">Winner: ${result.winner.name}</strong>
//             <br>
//             <span style="color: #64748b;">Party: ${result.winner.partylist}</span>
//             <br>
//             <span style="color: #64748b;">Votes: ${result.winner.votes}</span>
//           </div>
//           <details style="margin-top: 10px;">
//             <summary style="cursor: pointer; color: #6b7280;">View all candidates</summary>
//             <div style="margin-top: 10px;">
//               ${result.candidates
//                 .map(
//                   (candidate, index) => `
//                 <div style="padding: 5px 0; border-bottom: 1px solid #f3f4f6;">
//                   ${index + 1}. ${candidate.name} (${candidate.partylist}) - ${candidate.votes} votes
//                 </div>
//               `
//                 )
//                 .join("")}
//             </div>
//           </details>
//         </div>
//       `
//         )
//         .join("");

//       const emailHtml = `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <div style="text-align: center; margin-bottom: 30px;">
//             <img src="${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/wup-logo.png" alt="WUP Logo" style="width: 80px; height: 80px;">
//             <h1 style="color: #1f2937; margin: 20px 0;">Election Results Announcement</h1>
//           </div>

//           <p style="color: #374151;">Dear ${fullName},</p>

//           <p style="color: #374151;">
//             We are pleased to announce the official results of <strong>${election.name}</strong>.
//             Thank you for your participation in this democratic process.
//           </p>

//           <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
//             <h2 style="color: #1f2937; margin: 0 0 20px 0;">Official Results</h2>
//             ${resultsHtml}
//           </div>

//           <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
//             This is an official announcement from the Wesleyan University Philippines Develop Voting System.
//             If you have any questions about these results, please contact the election administrator.
//           </p>
//         </div>
//       `;

//       if (!resend) {
//         throw new Error("Email service not configured");
//       }

//       return resend.emails.send({
//         from: "WUP Election System <noreply@wup-evs.com>",
//         to: voter.email,
//         subject: `Election Results: ${election.name}`,
//         html: emailHtml,
//       });
//     });

//     // Send all emails
//     const emailResults = await Promise.allSettled(emailPromises);

//     const successful = emailResults.filter(
//       (result) => result.status === "fulfilled"
//     ).length;
//     const failed = emailResults.filter(
//       (result) => result.status === "rejected"
//     ).length;

//     return NextResponse.json({
//       success: true,
//       message: `Results announced successfully`,
//       stats: {
//         total: election.voters.length,
//         successful,
//         failed,
//       },
//     });
//   } catch (error) {
//     console.error("Error announcing results:", error);
//     return NextResponse.json(
//       { error: "Failed to announce results" },
//       { status: 500 }
//     );
//   }
// }
