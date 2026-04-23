const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.profile.count();
  const maleCount = await prisma.profile.count({ where: { gender: { in: ["Male", "A Groom"] } } });
  const femaleCount = await prisma.profile.count({ where: { gender: { in: ["Female", "A Bride"] } } });
  console.log("Total Profiles:", count);
  console.log("Male Profiles:", maleCount);
  console.log("Female Profiles:", femaleCount);
}

main().catch(console.error).finally(() => prisma.$disconnect());
