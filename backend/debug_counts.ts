import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const all = await prisma.order.groupBy({
        by: ['status'],
        _count: { id: true }
    });
    console.log('--- Order Status Distribution ---');
    console.log(JSON.stringify(all, null, 2));
    
    const cancelCount = await prisma.order.count({ where: { status: 'CANCELLED' } });
    const successCount = await prisma.order.count({ where: { status: 'COMPLETED' } });
    const totalCount = await prisma.order.count();
    
    console.log(`Total: ${totalCount}`);
    console.log(`Success (COMPLETED): ${successCount}`);
    console.log(`Cancelled (CANCELLED): ${cancelCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
