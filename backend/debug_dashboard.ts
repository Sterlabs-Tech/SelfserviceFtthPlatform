import { PrismaClient } from '@prisma/client';
import { subMonths, format } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 6);

    const orders = await prisma.order.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { id: true, createdAt: true, status: true }
    });

    console.log(`Total orders in last 6 months: ${orders.length}`);
    
    const monthlyData: Record<string, any> = {};
    for (let i = 0; i < 6; i++) {
        const dateStr = format(subMonths(now, i), 'yyyy-MM');
        monthlyData[dateStr] = { total: 0, success: 0, cancelled: 0, inProgress: 0 };
    }

    orders.forEach(o => {
        const monthStr = format(o.createdAt, 'yyyy-MM');
        if (monthlyData[monthStr]) {
            monthlyData[monthStr].total++;
            if (o.status === 'CANCELLED') {
                monthlyData[monthStr].cancelled++;
            } else if (o.status === 'COMPLETED') {
                monthlyData[monthStr].success++;
            } else {
                monthlyData[monthStr].inProgress++;
            }
        }
    });

    console.log('Monthly Data Structure:');
    console.log(JSON.stringify(monthlyData, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
