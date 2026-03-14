const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.orderHistory.count();
  console.log(`OrderHistory: ${count} items`);
  
  const sample = await prisma.orderHistory.findFirst();
  console.log('Sample History:', sample);
}

main().finally(() => prisma.$disconnect());
