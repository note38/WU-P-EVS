import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  try {
    // Clear existing data
    await prisma.vote.deleteMany();
    await prisma.candidate.deleteMany();
    await prisma.position.deleteMany();
    await prisma.voter.deleteMany();
    await prisma.partylist.deleteMany();
    await prisma.department.deleteMany();
    await prisma.year.deleteMany();
    await prisma.election.deleteMany();
    await prisma.user.deleteMany();

    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 10);
    const admin = await prisma.user.create({
      data: {
        username: "admin",
        email: "admin@example.com",
        password: adminPassword,
        role: "ADMIN",
      },
    });

    // Create departments and years
    const csDepartment = await prisma.department.create({
      data: {
        name: "Computer Science",
        years: {
          create: [
            { name: "First Year" },
            { name: "Second Year" },
            { name: "Third Year" },
            { name: "Fourth Year" },
          ],
        },
      },
      include: { years: true },
    });

    // Create an election
    const election = await prisma.election.create({
      data: {
        name: "Student Council Election 2023",
        description: "Annual election for student council positions",
        startDate: new Date("2023-10-15"),
        endDate: new Date("2023-10-16"),
        status: "ACTIVE",
        createdById: admin.id,
        positions: {
          create: [
            {
              name: "President",
              maxCandidates: 1,
            },
            {
              name: "Vice President",
              maxCandidates: 1,
            },
          ],
        },
        partylists: {
          create: [
            { name: "Future Leaders Party" },
            { name: "Progressive Students Alliance" },
          ],
        },
      },
      include: {
        positions: true,
        partylists: true,
      },
    });

    // Create candidates
    const [presidentPosition, vicePresidentPosition] = election.positions;
    const [futureLeaders, progressiveStudents] = election.partylists;

    await prisma.candidate.createMany({
      data: [
        {
          name: "Alice Johnson",
          positionId: presidentPosition.id,
          partylistId: futureLeaders.id,
        },
        {
          name: "Bob Smith",
          positionId: presidentPosition.id,
          partylistId: progressiveStudents.id,
        },
        {
          name: "Charlie Brown",
          positionId: vicePresidentPosition.id,
          partylistId: futureLeaders.id,
        },
        {
          name: "Diana Prince",
          positionId: vicePresidentPosition.id,
          partylistId: progressiveStudents.id,
        },
      ],
    });

    // Create voters with new model fields
    const voterPassword = await bcrypt.hash("voter123", 10);
    const voters = await prisma.voter.createMany({
      data: [
        {
          voterId: "V-001",
          firstName: "John",
          lastName: "Doe",
          middleName: "Michael", // Note the typo in 'midlleName'
          email: "john.doe@example.com",
          hashpassword: voterPassword,
          electionId: election.id,
          departmentId: csDepartment.id,
          status: "REGISTERED",
          avatar: "https://example.com/avatar/john-doe.jpg", // Added avatar
          pollingStation: "Main Hall", // Optional polling station
          credentialsSent: false,
        },
        {
          voterId: "V-002",
          firstName: "Jane",
          lastName: "Smith",
          middleName: "Elizabeth",
          email: "jane.smith@example.com",
          hashpassword: voterPassword,
          electionId: election.id,
          departmentId: csDepartment.id,
          status: "VOTED",
          avatar: "https://example.com/avatar/jane-smith.jpg", // Added avatar
          pollingStation: "Science Building", // Optional polling station
          credentialsSent: true,
        },
      ],
    });

    // Fetch voters to get their IDs for creating votes
    const votersList = await prisma.voter.findMany();
    const candidates = await prisma.candidate.findMany();

    // Create votes
    await prisma.vote.createMany({
      data: [
        {
          voterId: votersList[1].id,
          candidateId: candidates[0].id,
          positionId: presidentPosition.id,
          electionId: election.id,
        },
        {
          voterId: votersList[1].id,
          candidateId: candidates[2].id,
          positionId: vicePresidentPosition.id,
          electionId: election.id,
        },
      ],
    });

    console.log("Seed data created successfully!");
    console.log("Admin credentials:", {
      username: "admin",
      password: "admin123",
    });
    console.log("Voter credentials:", {
      username: "john.doe@example.com or jane.smith@example.com",
      password: "voter123",
    });
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
