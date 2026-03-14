const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const stocks = await prisma.stock.findMany({
      include: { operator: true }
  });
  console.log('Stocks:', stocks.map(s => ({
      tipo: s.tipo,
      mn: s.manufacturer,
      mod: s.modelCode,
      qty: s.quantity,
      op: s.operator.name
  })));
}

main().finally(() => prisma.$disconnect());
