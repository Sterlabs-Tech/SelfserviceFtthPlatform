import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const counts = await prisma.order.groupBy({
        by: ['status'],
        _count: { id: true }
    });
    console.log('Order counts by status:', JSON.stringify(counts, null, 2));

    const sample = await prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { status: true, createdAt: true }
    });
    console.log('Sample orders:', JSON.stringify(sample, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
