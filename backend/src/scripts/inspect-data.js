const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ops = await prisma.logisticsOperator.findMany();
  console.log('Operators:', ops.map(o => o.name));
  
  const users = await prisma.user.findMany();
  console.log('Users:', users.map(u => u.name));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
