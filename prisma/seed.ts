import { PrismaClient, Role, VoterStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  console.log("Starting seeding process...");

  // Clean up existing data if needed
  await prisma.vote.deleteMany({});
  await prisma.voter.deleteMany({});
  await prisma.candidate.deleteMany({});
  await prisma.position.deleteMany({});
  await prisma.partylist.deleteMany({});
  await prisma.election.deleteMany({});
  await prisma.year.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Database cleaned. Creating new seed data...");

  // Create admin user
  const adminPassword = await hashPassword("admin123");
  const admin = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@example.com",
      password: adminPassword,
      role: Role.ADMIN,
      avatar: "https://ui-avatars.com/api/?name=Admin&background=random",
      clerkId: "user_admin1", // Add clerkId field
    },
  });
  console.log(`Created admin user: ${admin.username}`);

  // Create a second admin user
  const admin2Password = await hashPassword("admin456");
  const admin2 = await prisma.user.create({
    data: {
      username: "sarah_admin",
      email: "sarah@example.com",
      password: admin2Password,
      role: Role.ADMIN,
      avatar: "https://ui-avatars.com/api/?name=Sarah+Admin&background=random",
      clerkId: "user_admin2", // Add clerkId field
    },
  });
  console.log(`Created second admin user: ${admin2.username}`);

  // Create a department
  const cseDepartment = await prisma.department.create({
    data: {
      name: "Computer Science Engineering",
      image: "https://ui-avatars.com/api/?name=CSE&background=random",
    },
  });

  const meDepartment = await prisma.department.create({
    data: {
      name: "Mechanical Engineering",
      image: "https://ui-avatars.com/api/?name=ME&background=random",
    },
  });

  // Create years for each department
  const year1CSE = await prisma.year.create({
    data: {
      name: "First Year",
      departmentId: cseDepartment.id,
    },
  });

  const year2CSE = await prisma.year.create({
    data: {
      name: "Second Year",
      departmentId: cseDepartment.id,
    },
  });

  const year1ME = await prisma.year.create({
    data: {
      name: "First Year",
      departmentId: meDepartment.id,
    },
  });

  // Create an election
  const currentDate = new Date();
  const nextMonth = new Date(currentDate);
  nextMonth.setMonth(currentDate.getMonth() + 1);

  const election = await prisma.election.create({
    data: {
      name: "Student Body Election 2025",
      description: "Annual election for student body representatives",
      startDate: currentDate,
      endDate: nextMonth,
      status: "ACTIVE",
      hideName: false, // Add hideName field
      createdById: admin.id,
    },
  });
  console.log(`Created election: ${election.name}`);

  // Create voters (10 voters)
  const voterData = [
    {
      firstName: "John",
      lastName: "Doe",
      middleName: "A",
      email: "john.doe@student.edu",
      yearId: year1CSE.id,
    },
    {
      firstName: "Jane",
      lastName: "Smith",
      middleName: "B",
      email: "jane.smith@student.edu",
      yearId: year1CSE.id,
    },
    {
      firstName: "Robert",
      lastName: "Johnson",
      middleName: "C",
      email: "robert.johnson@student.edu",
      yearId: year2CSE.id,
    },
    {
      firstName: "Maria",
      lastName: "Garcia",
      middleName: "D",
      email: "maria.garcia@student.edu",
      yearId: year2CSE.id,
    },
    {
      firstName: "David",
      lastName: "Brown",
      middleName: "E",
      email: "david.brown@student.edu",
      yearId: year1ME.id,
    },
    {
      firstName: "Sarah",
      lastName: "Davis",
      middleName: "F",
      email: "sarah.davis@student.edu",
      yearId: year1ME.id,
    },
    {
      firstName: "Michael",
      lastName: "Wilson",
      middleName: "G",
      email: "michael.wilson@student.edu",
      yearId: year1CSE.id,
    },
    {
      firstName: "Emily",
      lastName: "Taylor",
      middleName: "H",
      email: "emily.taylor@student.edu",
      yearId: year2CSE.id,
    },
    {
      firstName: "James",
      lastName: "Thomas",
      middleName: "I",
      email: "james.thomas@student.edu",
      yearId: year1ME.id,
    },
    {
      firstName: "Jessica",
      lastName: "Lee",
      middleName: "J",
      email: "jessica.lee@student.edu",
      yearId: year2CSE.id,
    },
  ];

  // Create voters with hashed passwords
  const defaultPassword = await hashPassword("password123");

  for (const voter of voterData) {
    const createdVoter = await prisma.voter.create({
      data: {
        firstName: voter.firstName,
        lastName: voter.lastName,
        middleName: voter.middleName,
        email: voter.email,
        hashpassword: defaultPassword,
        avatar: `https://ui-avatars.com/api/?name=${voter.firstName}+${voter.lastName}&background=random`,
        yearId: voter.yearId,
        electionId: election.id,
        // Use the correct enum value that matches the database
        status: VoterStatus.UNCAST,
        clerkId: `voter_${voter.firstName.toLowerCase()}_${voter.lastName.toLowerCase()}`, // Add clerkId field
      },
    });
    console.log(
      `Created voter: ${createdVoter.firstName} ${createdVoter.lastName}`
    );
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
