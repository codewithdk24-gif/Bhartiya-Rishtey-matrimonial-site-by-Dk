const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedPaymentRequests() {
  // Get 10 users who are not owners (ADMIN)
  const users = await prisma.user.findMany({
    where: { role: 'USER' },
    take: 10
  });

  console.log(`Creating 10 pending payment requests for demo...`);

  const tiers = ['PRIME', 'ROYAL', 'LEGACY'];
  const amounts = [999, 1999, 4999];

  let count = 0;
  for (const user of users) {
    const tierIndex = Math.floor(Math.random() * tiers.length);
    
    await prisma.paymentRequest.create({
      data: {
        userId: user.id,
        tier: tiers[tierIndex],
        amount: amounts[tierIndex],
        screenshotUrl: `https://images.unsplash.com/photo-1554224155-1696413565d3?q=80&w=400&auto=format&fit=crop`, // Dummy receipt image
        status: 'PENDING'
      }
    });
    count++;
  }

  console.log(`Successfully added ${count} payment requests in PENDING status.`);
}

seedPaymentRequests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
