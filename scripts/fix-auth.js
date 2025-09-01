const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function fixUserSync(email, clerkId) {
  try {
    console.log(
      `🔧 Fixing user sync for email: ${email}, Clerk ID: ${clerkId}`
    );

    await prisma.$connect();

    // Check admin users
    const adminUser = await prisma.user.findUnique({
      where: { email },
    });

    if (adminUser) {
      console.log(`✅ Found admin user: ${adminUser.id}`);

      if (adminUser.clerkId === clerkId) {
        console.log(`✅ Admin user already has correct Clerk ID`);
        return { type: "admin", user: adminUser, fixed: false };
      }

      // Update with Clerk ID
      const updatedAdmin = await prisma.user.update({
        where: { id: adminUser.id },
        data: {
          clerkId: clerkId,
          updatedAt: new Date(),
        },
      });

      console.log(
        `✅ Admin user updated with Clerk ID: ${updatedAdmin.clerkId}`
      );
      return { type: "admin", user: updatedAdmin, fixed: true };
    }

    // Check voters
    const voter = await prisma.voter.findUnique({
      where: { email },
    });

    if (voter) {
      console.log(`✅ Found voter: ${voter.id}`);

      if (voter.clerkId === clerkId) {
        console.log(`✅ Voter already has correct Clerk ID`);
        return { type: "voter", user: voter, fixed: false };
      }

      // Update with Clerk ID
      const updatedVoter = await prisma.voter.update({
        where: { id: voter.id },
        data: {
          clerkId: clerkId,
          updatedAt: new Date(),
        },
      });

      console.log(`✅ Voter updated with Clerk ID: ${updatedVoter.clerkId}`);
      return { type: "voter", user: updatedVoter, fixed: true };
    }

    console.log(`❌ No user found with email: ${email}`);
    return null;
  } catch (error) {
    console.error("❌ Fix failed:", error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

async function listUnlinkedUsers() {
  try {
    console.log("🔍 Finding users without Clerk IDs...");

    await prisma.$connect();

    // Find admin users without Clerk IDs
    const unlinkedAdmins = await prisma.user.findMany({
      where: {
        clerkId: null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    // Find voters without Clerk IDs
    const unlinkedVoters = await prisma.voter.findMany({
      where: {
        clerkId: null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    console.log(`\n👥 Admin users without Clerk IDs: ${unlinkedAdmins.length}`);
    unlinkedAdmins.forEach((user) => {
      console.log(
        `   - ID: ${user.id}, Email: ${user.email}, Username: ${user.username}`
      );
    });

    console.log(`\n🗳️ Voters without Clerk IDs: ${unlinkedVoters.length}`);
    unlinkedVoters.forEach((voter) => {
      console.log(
        `   - ID: ${voter.id}, Email: ${voter.email}, Name: ${voter.firstName} ${voter.lastName}`
      );
    });

    return { unlinkedAdmins, unlinkedVoters };
  } catch (error) {
    console.error("❌ Failed to list unlinked users:", error);
    return { unlinkedAdmins: [], unlinkedVoters: [] };
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
async function main() {
  console.log("🚀 Starting authentication fix...\n");

  const args = process.argv.slice(2);

  if (args.length === 0) {
    // List unlinked users
    await listUnlinkedUsers();
  } else if (args.length === 2) {
    // Fix specific user
    const [email, clerkId] = args;
    await fixUserSync(email, clerkId);
  } else {
    console.log("Usage:");
    console.log(
      "  node scripts/fix-auth.js                    # List unlinked users"
    );
    console.log(
      "  node scripts/fix-auth.js email clerkId      # Fix specific user"
    );
  }

  console.log("\n✨ Fix completed!");
}

main().catch(console.error);
