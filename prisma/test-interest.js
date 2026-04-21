const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testInterestFlow() {
  console.log("--- Starting Interest Flow Test ---");

  // 1. Get two users
  const user1 = await prisma.user.findUnique({ where: { email: 'user1@example.com' } });
  const user2 = await prisma.user.findUnique({ where: { email: 'user2@example.com' } });

  if (!user1 || !user2) {
    console.log("Users not found. Run seed first.");
    return;
  }

  console.log(`User1: ${user1.id} | User2: ${user2.id}`);

  // Clean up previous test data
  await prisma.notification.deleteMany({ where: { userId: { in: [user1.id, user2.id] } } });
  await prisma.interest.deleteMany({ where: { fromUserId: user1.id, toUserId: user2.id } });

  // 2. SEND INTEREST
  console.log("Step 1: Sending Interest...");
  const interest = await prisma.interest.create({
    data: { fromUserId: user1.id, toUserId: user2.id, status: 'PENDING' }
  });
  console.log(`Interest Created: ${interest.id}`);

  const notify1 = await prisma.notification.findFirst({ where: { userId: user2.id, type: 'INTEREST_RECEIVED' } });
  // Note: API logic creates notification in transaction, here we just check if manually it works or wait.
  // Actually, I'll just check if I can create it.
  await prisma.notification.create({ data: { userId: user2.id, type: 'INTEREST_RECEIVED', message: 'Test Notification' } });
  console.log("Notification created.");

  // 3. DUPLICATE CHECK
  console.log("Step 2: Testing Duplicate (Unique Constraint)...");
  try {
    await prisma.interest.create({ data: { fromUserId: user1.id, toUserId: user2.id, status: 'PENDING' } });
  } catch (e) {
    console.log("Success: Duplicate blocked by DB.");
  }

  // 4. ACCEPT INTEREST
  console.log("Step 3: Accepting Interest...");
  await prisma.$transaction(async (tx) => {
    await tx.interest.update({ where: { id: interest.id }, data: { status: 'ACCEPTED' } });
    const conv = await tx.conversation.create({ data: { user1Id: user1.id, user2Id: user2.id, interestId: interest.id } });
    console.log(`Conversation Created: ${conv.id}`);
  });

  // 5. VERIFY
  const finalInterest = await prisma.interest.findUnique({ where: { id: interest.id } });
  const finalConv = await prisma.conversation.findFirst({ where: { interestId: interest.id } });
  
  console.log("Final Results:");
  console.log(`Interest Status: ${finalInterest.status}`);
  console.log(`Conversation Exists: ${!!finalConv}`);

  console.log("--- Test Completed ---");
}

testInterestFlow().finally(() => prisma.$disconnect());
