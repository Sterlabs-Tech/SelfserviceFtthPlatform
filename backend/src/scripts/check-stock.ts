import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Database Inspection ---');
    const tenants = await prisma.tenant.findMany();
    console.log(`Tenants: ${tenants.length}`);
    
    const operators = await prisma.logisticsOperator.findMany();
    console.log(`Operators: ${operators.length}`);
    
    const stocks = await prisma.stock.findMany();
    console.log(`Stocks: ${stocks.length}`);

    if (stocks.length === 0 && operators.length > 0) {
        console.log('No stock found. Adding test stock...');
        for (const op of operators) {
            const regions = op.regions?.split(',') || ['SP'];
            for (const region of regions) {
                await prisma.stock.create({
                    data: {
                        operatorId: op.id,
                        modelCode: 'NOKIA-G1425G',
                        manufacturer: 'NOKIA',
                        quantity: 100
                    }
                });
                console.log(`Added stock for ${op.name}`);
            }
        }
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
