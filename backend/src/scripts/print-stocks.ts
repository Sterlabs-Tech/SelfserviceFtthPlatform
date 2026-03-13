import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const stocks = await prisma.stock.findMany();
    console.log(JSON.stringify(stocks, null, 2));
}

main().finally(() => prisma.$disconnect());
