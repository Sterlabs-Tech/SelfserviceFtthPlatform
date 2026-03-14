import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const operator = await prisma.logisticsOperator.findFirst({
        where: { name: 'Rapidão do RJ' }
    });

    if (operator) {
        console.log(`Found operator: ${operator.name}`);
        const currentRegions = operator.regions.split(',').map(r => r.trim());
        const filteredRegions = currentRegions.filter(r => r.toUpperCase() !== 'RJ');
        const newRegions = filteredRegions.join(', ');

        await prisma.logisticsOperator.update({
            where: { id: operator.id },
            data: { regions: newRegions }
        });
        console.log(`Updated regions to: ${newRegions}`);
    } else {
        console.log('Operator not found');
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
