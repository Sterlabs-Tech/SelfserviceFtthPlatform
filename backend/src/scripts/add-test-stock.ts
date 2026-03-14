import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const operators = await prisma.logisticsOperator.findMany();
    if (operators.length === 0) {
        console.log('No operators found.');
        return;
    }
    
    const regions = ['SP', 'RJ', 'MG', 'RS', 'PR'];
    const op = operators[0];
    if (!op) return;
    
    for (const region of regions) {
        await prisma.stock.create({
            data: {
                operatorId: op.id,
                modelCode: 'NOKIA-G1425G',
                manufacturer: 'NOKIA',
                quantity: 100
            }
        });
        console.log(`Added 100 stock for ${op.name}`);
    }
}

main().finally(() => prisma.$disconnect());
