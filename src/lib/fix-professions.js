const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const professions = [
  'Software Engineer',
  'Doctor',
  'Chartered Accountant',
  'Marketing Manager',
  'Business Analyst',
  'Teacher',
  'Nurse',
  'Civil Engineer',
  'Lawyer',
  'Graphic Designer',
  'Project Manager',
  'HR Specialist',
  'Data Scientist',
  'Architect',
  'Pharmacist',
  'Bank Manager',
  'Mechanical Engineer',
  'Sales Executive',
  'Professor',
  'Interior Designer'
];

async function fixProfessions() {
  try {
    const profiles = await prisma.profile.findMany();
    console.log(`Found ${profiles.length} profiles to check professions.`);

    for (const profile of profiles) {
      if (!profile.profession || profile.profession === 'Professional' || profile.profession === 'Not specified') {
        const randomProf = professions[Math.floor(Math.random() * professions.length)];
        await prisma.profile.update({
          where: { id: profile.id },
          data: {
            profession: randomProf
          }
        });
        console.log(`Updated profile ${profile.id} profession to ${randomProf}`);
      }
    }
    console.log("Profession fix complete!");
  } catch (err) {
    console.error("Error fixing professions:", err);
  } finally {
    await prisma.$disconnect();
  }
}

fixProfessions();
