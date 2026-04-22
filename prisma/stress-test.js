const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runStressTest() {
  console.log('🚀 Starting System Stress Test...');

  const userA = 'user-a-id';
  const userB = 'user-b-id';

  // Ensure users exist
  await prisma.user.upsert({
    where: { id: userA },
    update: {},
    create: { id: userA, email: 'stressA@test.com', passwordHash: 'hash', name: 'Stress A', plan: 'FREE' }
  });
  await prisma.user.upsert({
    where: { id: userB },
    update: {},
    create: { id: userB, email: 'stressB@test.com', passwordHash: 'hash', name: 'Stress B', plan: 'FREE' }
  });

  console.log('✅ Users ready.');

  // 1. Test Duplicate Like Prevention
  console.log('🧪 Testing Duplicate Like Prevention...');
  try {
    const p1 = prisma.like.upsert({
      where: { senderId_receiverId: { senderId: userA, receiverId: userB } },
      update: {},
      create: { senderId: userA, receiverId: userB }
    });
    const p2 = prisma.like.upsert({
      where: { senderId_receiverId: { senderId: userA, receiverId: userB } },
      update: {},
      create: { senderId: userA, receiverId: userB }
    });
    await Promise.all([p1, p2]);
    const count = await prisma.like.count({ where: { senderId: userA, receiverId: userB } });
    console.log(`   Result: Found ${count} like (Expected: 1)`);
  } catch (err) {
    console.error('   ❌ Duplicate like test failed:', err.message);
  }

  // 2. Test Match Idempotency & Sorting
  console.log('🧪 Testing Match Sorting & Idempotency...');
  const [u1, u2] = [userA, userB].sort();
  try {
    // Simulate reverse like from B to A
    await prisma.like.upsert({
      where: { senderId_receiverId: { senderId: userB, receiverId: userA } },
      update: {},
      create: { senderId: userB, receiverId: userA }
    });

    // Create match as if A liked B
    const m1 = prisma.match.upsert({
      where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
      update: {},
      create: { user1Id: u1, user2Id: u2, status: 'ACTIVE' }
    });
    // Create match as if B liked A (should result in same record)
    const m2 = prisma.match.upsert({
      where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
      update: {},
      create: { user1Id: u1, user2Id: u2, status: 'ACTIVE' }
    });

    await Promise.all([m1, m2]);
    const matchCount = await prisma.match.count({
      where: {
        OR: [
          { user1Id: userA, user2Id: userB },
          { user1Id: userB, user2Id: userA }
        ]
      }
    });
    console.log(`   Result: Found ${matchCount} match (Expected: 1)`);
  } catch (err) {
    console.error('   ❌ Match test failed:', err.message);
  }

  console.log('🏁 Stress Test Completed.');
  await prisma.$disconnect();
}

runStressTest();
