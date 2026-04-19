const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function generateShortId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function backfill() {
  const users = await prisma.user.findMany({
    where: { shortId: null }
  });

  console.log(`Found ${users.length} users needing shortId backfill...`);

  let count = 0;
  for (const u of users) {
    let success = false;
    let attempts = 0;
    while (!success && attempts < 10) {
      try {
        const id = generateShortId();
        await prisma.user.update({
          where: { id: u.id },
          data: { shortId: id }
        });
        success = true;
        count++;
      } catch (err) {
        // Retry on unique constraint fail
        attempts++;
      }
    }
  }

  console.log(`Backfill complete. Updated ${count} users.`);
}

backfill()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
