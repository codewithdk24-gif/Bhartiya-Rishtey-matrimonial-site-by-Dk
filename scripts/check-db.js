const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const profiles = await prisma.profile.findMany({
    select: {
      fullName: true,
      gender: true,
      isCompleted: true,
      completionPct: true,
      religion: true,
      profession: true,
      isVisible: true,
    },
  });
  console.log('=== PROFILES ===');
  profiles.forEach(p => console.log(JSON.stringify(p)));

  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true },
  });
  console.log('\n=== USERS ===');
  users.forEach(u => console.log(JSON.stringify(u)));
}

main().catch(console.error).finally(() => prisma.$disconnect());
