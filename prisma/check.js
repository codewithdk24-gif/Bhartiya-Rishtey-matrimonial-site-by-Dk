const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const userCount = await prisma.user.count();
  const profileCount = await prisma.profile.count();
  const prefCount = await prisma.preferences.count();
  console.log({ userCount, profileCount, prefCount });
}

check().finally(() => prisma.$disconnect());
