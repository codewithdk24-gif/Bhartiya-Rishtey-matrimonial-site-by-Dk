const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addPremiumUsers() {
  const users = await prisma.user.findMany({
    take: 15,
    where: { role: 'USER' } // Select normal users to make premium
  });

  console.log(`Giving premium to 15 users out of ${users.length} fetched...`);

  let count = 0;
  for (const user of users) {
    // Determine expiration 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create active subscription
    await prisma.subscription.create({
      data: {
        userId: user.id,
        tier: 'PREMIUM',
        status: 'ACTIVE',
        paymentId: `PAY_DEMO_${user.shortId || user.id.substring(0, 5)}`,
        expiresAt: expiresAt
      }
    });
    count++;
  }

  console.log(`Added PREMIUM subscription to ${count} users successfully!`);
}

addPremiumUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
