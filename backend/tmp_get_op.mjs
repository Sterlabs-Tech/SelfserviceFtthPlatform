import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const ops = await prisma.logisticsOperator.findMany({ select: { id: true, name: true } });
  console.log(JSON.stringify(ops));
  await prisma.$disconnect();
}
run();
