const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@bhartiyerishtey.com';
  const password = 'AdminPassword123';
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Admin already exists. Updating role...');
    await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' }
    });
  } else {
    console.log('Creating new admin user...');
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'ADMIN',
        isVerified: true,
        profile: {
          create: {
            fullName: 'Platform Administrator',
            gender: 'Male',
            dateOfBirth: new Date('1990-01-01'),
            location: 'Mumbai, India',
            isCompleted: true
          }
        }
      }
    });
  }
  console.log('✅ Admin user ready:');
  console.log('Email:', email);
  console.log('Password:', password);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
