const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function addPositionColumn() {
  try {
    console.log("Attempting to add position column to User table...");

    // Try to add the position column to User table
    try {
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN "position" TEXT`;
      console.log("Added position column to User table");
    } catch (error) {
      if (
        error.message.includes(
          'column "position" of relation "User" already exists'
        )
      ) {
        console.log("position column already exists in User table");
      } else {
        console.log("Error adding position to User table:", error.message);
        // Try a different approach
        console.log("Trying alternative approach...");
        try {
          // Check if column exists first
          const result =
            await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'position'`;
          if (result.length > 0) {
            console.log("position column already exists in User table");
          } else {
            console.log("position column does not exist");
          }
        } catch (checkError) {
          console.log("Error checking for column:", checkError.message);
        }
      }
    }

    console.log("Position column check completed");
  } catch (error) {
    console.error("Error adding position column:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addPositionColumn();
