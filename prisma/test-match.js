const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMatchLogic() {
  const email = 'user1@example.com';
  const currentUser = await prisma.user.findUnique({
    where: { email },
    include: { profile: true, preferences: true }
  });

  if (!currentUser) {
    console.log("User not found");
    return;
  }

  const myProfile = currentUser.profile;
  const myPrefs = currentUser.preferences;
  const targetGender = myProfile.gender === "Male" ? "Female" : "Male";

  console.log(`Searching for: ${targetGender} for ${myProfile.fullName}`);

  const minAge = (myPrefs.minAge || 18);
  const maxAge = (myPrefs.maxAge || 60);
  
  const minDob = new Date();
  minDob.setFullYear(minDob.getFullYear() - maxAge);
  
  const maxDob = new Date();
  maxDob.setFullYear(maxDob.getFullYear() - minAge);

  const profiles = await prisma.profile.findMany({
    where: {
      userId: { not: currentUser.id },
      gender: targetGender,
      isCompleted: true,
      dateOfBirth: {
        gte: minDob,
        lte: maxDob,
      }
    },
    include: { user: { select: { lastActive: true } } },
    take: 5
  });

  console.log(`Found ${profiles.length} potential matches.`);
  
  profiles.forEach(p => {
    let score = 0;
    if (p.religion === myProfile.religion) score += 20;
    if (p.city === myProfile.city) score += 15;
    if (p.education === myProfile.education) score += 10;
    if (p.state === myProfile.state) score += 8;
    console.log(`Match: ${p.fullName} | Score: ${score}`);
  });
}

testMatchLogic().finally(() => prisma.$disconnect());
