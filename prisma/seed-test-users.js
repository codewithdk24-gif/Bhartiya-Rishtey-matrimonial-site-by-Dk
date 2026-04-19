const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123', 10);

  // Groom
  const user1 = await prisma.user.upsert({
    where: { email: 'rahul@test.com' },
    update: { isVerified: true },
    create: {
      email: 'rahul@test.com',
      passwordHash,
      role: 'USER',
      isVerified: true,
      profile: {
        create: {
          fullName: 'Rahul Sharma',
          gender: 'A Groom',
          dateOfBirth: new Date('1992-05-15'),
          heightCm: 178,
          religion: 'Hindu',
          caste: 'Brahmin',
          location: 'Mumbai, MH',
          education: 'MBA',
          profession: 'Product Manager',
          incomeTier: '20-50L',
          bio: 'Looking for a compatible life partner who shares similar values.',
          completionPct: 100,
          isCompleted: true,
        }
      }
    },
  });

  // Bride
  const user2 = await prisma.user.upsert({
    where: { email: 'priya@test.com' },
    update: { isVerified: true },
    create: {
      email: 'priya@test.com',
      passwordHash,
      role: 'USER',
      isVerified: true,
      profile: {
        create: {
          fullName: 'Priya Verma',
          gender: 'A Bride',
          dateOfBirth: new Date('1995-08-22'),
          heightCm: 165,
          religion: 'Hindu',
          caste: 'Kshatriya',
          location: 'Delhi, NCR',
          education: 'B.Tech',
          profession: 'Software Engineer',
          incomeTier: '10-20L',
          bio: 'Simple and caring person looking for a meaningful relationship.',
          completionPct: 100,
          isCompleted: true,
        }
      }
    },
  });

  console.log({ user1, user2 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
