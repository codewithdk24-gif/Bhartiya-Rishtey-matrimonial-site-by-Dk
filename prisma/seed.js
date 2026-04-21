const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding...');

  // Clear existing data (optional, but good for clean seed)
  // await prisma.user.deleteMany(); 

  const passwordHash = await bcrypt.hash('password123', 10);

  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur'];
  const states = ['Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Gujarat', 'Tamil Nadu', 'West Bengal', 'Gujarat', 'Maharashtra', 'Rajasthan'];
  const religions = ['Hindu', 'Muslim', 'Sikh', 'Christian', 'Jain', 'Buddhist'];
  const castes = ['Brahmin', 'Kshatriya', 'Vaishya', 'Shudra', 'Sunni', 'Shia', 'Jat', 'Khatri'];
  const occupations = ['Software Engineer', 'Doctor', 'Teacher', 'Architect', 'Business Owner', 'Chartered Accountant', 'Marketing Manager', 'Pilot', 'Lawyer', 'Graphic Designer'];

  const profiles = [];

  for (let i = 1; i <= 40; i++) {
    const gender = i % 2 === 0 ? 'Male' : 'Female';
    const religion = religions[Math.floor(Math.random() * religions.length)];
    const cityIndex = Math.floor(Math.random() * cities.length);
    const city = cities[cityIndex];
    const state = states[cityIndex];
    const occupation = occupations[Math.floor(Math.random() * occupations.length)];
    const caste = castes[Math.floor(Math.random() * castes.length)];
    
    const name = gender === 'Male' ? `User Male ${i}` : `User Female ${i}`;
    const email = `user${i}@example.com`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name,
        passwordHash,
        phone: `9876543${i.toString().padStart(3, '0')}`,
        role: 'USER',
        plan: i % 5 === 0 ? 'premium' : 'free',
        profile: {
          create: {
            fullName: name,
            gender,
            dateOfBirth: new Date(1990 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
            city,
            state,
            religion,
            caste,
            occupation,
            education: 'Bachelor\'s Degree',
            incomeTier: '5L - 10L',
            isCompleted: true,
            profilePhoto: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          }
        },
        preferences: {
          create: {
            minAge: 20,
            maxAge: 35,
            religions: JSON.stringify([religion]),
          }
        }
      }
    });

    console.log(`Created user: ${user.email}`);
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
