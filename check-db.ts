import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== DB DIAGNOSTIC START ===");
  const depts = await prisma.department.findMany({
    orderBy: { name: "asc" }
  });
  console.log(`Departments found: ${depts.length}`);
  depts.forEach(d => console.log(`  - [Dept] ID: ${d.id}, Name: "${d.name}"`));

  const progs = await prisma.program.findMany({
    include: { department: true },
    orderBy: { name: "asc" }
  });
  console.log(`Programs found: ${progs.length}`);
  progs.forEach(p => console.log(`  - [Prog] ID: ${p.id}, Name: "${p.name}", Dept ID: ${p.departmentId} ("${p.department?.name}")`));

  const years = await prisma.year.findMany({
    include: {
      program: {
        include: { department: true }
      }
    },
    orderBy: { name: "asc" }
  });
  console.log(`Years found: ${years.length}`);
  years.forEach(y => console.log(`  - [Year] ID: ${y.id}, Name: "${y.name}", Prog ID: ${y.programId} ("${y.program?.name}")`));
  console.log("=== DB DIAGNOSTIC END ===");
}

main()
  .catch((e) => {
    console.error("Diagnostic error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
