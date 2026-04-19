const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Fix existing profiles to be marked as completed
  const result = await prisma.profile.updateMany({
    where: { completionPct: { gte: 50 } },
    data: { isCompleted: true },
  });
  console.log(`Updated ${result.count} profiles to isCompleted=true`);

  // Also create an admin user for testing admin panel
  const bcrypt = require('bcryptjs');
  const existing = await prisma.user.findUnique({ where: { email: 'admin@vowsheritage.com' } });
  if (!existing) {
    const hash = await bcrypt.hash('Admin123', 12);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@vowsheritage.com',
        passwordHash: hash,
        role: 'ADMIN',
        isVerified: true,
        profile: {
          create: {
            fullName: 'Platform Admin',
            gender: 'A Groom',
            dateOfBirth: new Date('1990-01-01'),
            completionPct: 100,
            isCompleted: true,
            isVisible: false, // Admin shouldn't appear in matches
          },
        },
      },
    });
    console.log('Admin user created:', admin.email);
  } else {
    console.log('Admin user already exists');
  }

  // Print final state
  const profiles = await prisma.profile.findMany({ select: { fullName: true, isCompleted: true, completionPct: true, isVisible: true } });
  console.log('\n=== FINAL PROFILES ===');
  profiles.forEach(p => console.log(JSON.stringify(p)));
}

main().catch(console.error).finally(() => prisma.$disconnect());
