const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedInterests() {
  try {
    const userId = "cmo9zlte60000umu4kbsgasyk";
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!targetUser) {
      console.log("No user found to seed interests for.");
      return;
    }

    console.log(`Seeding interests for user: ${targetUser.name} (${userId})`);

    const targetGender = targetUser.profile.gender;
    const isMale = targetGender === 'Male' || targetGender === 'A Groom';
    const oppositeGenders = isMale ? ['Female', 'A Bride'] : ['Male', 'A Groom'];

    // 2. Find some other users to interact with
    const otherUsers = await prisma.user.findMany({
      where: { 
        id: { not: userId },
        profile: { gender: { in: oppositeGenders } } 
      },
      take: 5
    });

    if (otherUsers.length < 4) {
      console.log("Not enough other users to seed all states. Found:", otherUsers.length);
    }

    // CASE 1: SENT (Accepted)
    if (otherUsers[0]) {
      const u = otherUsers[0];
      const interest = await prisma.interest.upsert({
        where: { fromUserId_toUserId: { fromUserId: userId, toUserId: u.id } },
        update: { status: 'ACCEPTED' },
        create: { fromUserId: userId, toUserId: u.id, status: 'ACCEPTED' }
      });
      // Ensure conversation
      await prisma.conversation.upsert({
        where: { interestId: interest.id },
        update: {},
        create: { user1Id: userId, user2Id: u.id, interestId: interest.id }
      });
      console.log(`- Created Sent Accepted interest for ${u.name}`);
    }

    // CASE 2: SENT (Pending)
    if (otherUsers[1]) {
      const u = otherUsers[1];
      await prisma.interest.upsert({
        where: { fromUserId_toUserId: { fromUserId: userId, toUserId: u.id } },
        update: { status: 'PENDING' },
        create: { fromUserId: userId, toUserId: u.id, status: 'PENDING' }
      });
      console.log(`- Created Sent Pending interest for ${u.name}`);
    }

    // CASE 3: RECEIVED (Pending)
    if (otherUsers[2]) {
      const u = otherUsers[2];
      await prisma.interest.upsert({
        where: { fromUserId_toUserId: { fromUserId: u.id, toUserId: userId } },
        update: { status: 'PENDING' },
        create: { fromUserId: u.id, toUserId: userId, status: 'PENDING' }
      });
      console.log(`- Created Received Pending interest from ${u.name}`);
    }

    // CASE 4: RECEIVED (Accepted)
    if (otherUsers[3]) {
      const u = otherUsers[3];
      const interest = await prisma.interest.upsert({
        where: { fromUserId_toUserId: { fromUserId: u.id, toUserId: userId } },
        update: { status: 'ACCEPTED' },
        create: { fromUserId: u.id, toUserId: userId, status: 'ACCEPTED' }
      });
      // Ensure conversation
      await prisma.conversation.upsert({
        where: { interestId: interest.id },
        update: {},
        create: { user1Id: u.id, user2Id: userId, interestId: interest.id }
      });
      console.log(`- Created Received Accepted interest from ${u.name}`);
    }

    console.log("Seeding complete!");

  } catch (err) {
    console.error("Seeding Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

seedInterests();
