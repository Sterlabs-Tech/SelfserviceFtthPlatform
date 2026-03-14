const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const stocks = await prisma.stock.findMany();
    console.log('STOCKS_COUNT:', stocks.length);
    console.log(JSON.stringify(stocks, null, 2));
  } catch (e) {
    console.error('ERROR_FETCHING_STOCKS:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
