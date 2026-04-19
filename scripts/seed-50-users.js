const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const professions = ['Software Engineer', 'Marketing Manager', 'Doctor', 'Business Analyst', 'Teacher', 'Lawyer', 'Banker', 'Data Scientist', 'HR Professional'];
const educations = ['B.Tech', 'MBA', 'B.Com', 'M.Sc', 'BBA', 'MBBS', 'LLB', 'BA', 'M.Tech'];
const religions = ['Hindu', 'Muslim', 'Sikh', 'Christian', 'Jain', 'Buddhist'];
const locations = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad', 'Surat'];
const incomeTiers = ['5-10L', '10-20L', '20-50L', '50L+'];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function fetchRandomUsers() {
  const response = await fetch('https://randomuser.me/api/?results=50&nat=in');
  const data = await response.json();
  return data.results;
}

async function seed() {
  console.log('Fetching 50 users from API for demo...');
  const usersToInsert = await fetchRandomUsers();
  console.log(`Fetched ${usersToInsert.length} users. Seeding database...`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const apiUser of usersToInsert) {
    const email = apiUser.email;

    // Check if exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      skippedCount++;
      continue;
    }

    const passwordHash = await bcrypt.hash('Demo1234', 12);

    const fullName = `${apiUser.name.first} ${apiUser.name.last}`;
    const gender = apiUser.gender === 'male' ? 'A Groom' : 'A Bride';
    const dob = new Date(apiUser.dob.date);
    const heightCm = Math.floor(Math.random() * (185 - 150 + 1)) + 150;

    // Create photo array as JSON string
    const photosArr = [apiUser.picture.large];
    if (Math.random() > 0.5 && apiUser.picture.medium) {
      photosArr.push(apiUser.picture.medium);
    }

    const photosJson = JSON.stringify(photosArr);

    const profession = randomItem(professions);
    const religion = randomItem(religions);
    const location = `${apiUser.location.city}, ${apiUser.location.state}`;

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'USER',
        isVerified: true,
        profile: {
          create: {
            fullName,
            gender,
            dateOfBirth: dob,
            heightCm,
            religion,
            location,
            education: randomItem(educations),
            profession,
            incomeTier: randomItem(incomeTiers),
            bio: `Hello! I am a ${profession} living in ${location}. I value family, honesty, and continuous self-improvement. Looking forward to connecting with someone compatible.`,
            photos: photosJson,
            completionPct: 90, // Photos + Details
            isCompleted: true,
            isVisible: true,
          },
        },
      },
    });

    createdCount++;
  }

  console.log(`✅ Seeding Complete: Added ${createdCount} users, Skipped ${skippedCount}`);
}

seed()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
