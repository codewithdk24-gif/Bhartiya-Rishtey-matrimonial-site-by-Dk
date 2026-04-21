const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const models = ['interest', 'conversation', 'message', 'notification', 'block', 'report'];
  for (const model of models) {
    try {
      await prisma[model].count();
      console.log(`Model ${model} exists.`);
    } catch (e) {
      console.error(`Model ${model} MISSING or ERROR:`, e.message);
    }
  }
}

check().finally(() => prisma.$disconnect());
