const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tables = ['LogisticsOperator', 'User', 'Order', 'Stock', 'MaterialItem'];
  for (const table of tables) {
    const count = await prisma[table.charAt(0).toLowerCase() + table.slice(1)].count();
    console.log(`${table}: ${count} items`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
