/** Dashboard API - Refined with Open Orders count **/
import { Router } from 'express';
import prisma from '../lib/prisma';
import { subDays, subMonths, startOfDay, format, isAfter, startOfMonth } from 'date-fns';

const router = Router();

router.get('/stats', async (req, res) => {
    console.log('--- DASHBOARD STATS REQUEST RECEIVED ---');
    try {
        const now = new Date();
        const thirtyDaysAgo = subDays(now, 30);
        const sixMonthsAgo = subMonths(now, 6);

        const [
            stockAgg,
            operators,
            totalOpenOrders,
            totalTenants,
            totalUsers,
            totalOperators,
            totalOrders,
            ufOrders
        ] = await prisma.$transaction([
            prisma.stock.aggregate({ _sum: { quantity: true } }),
            prisma.logisticsOperator.findMany({
                where: { active: true },
                select: { id: true, name: true, city: true, state: true }
            }),
            prisma.order.count({ where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } } }),
            prisma.tenant.count(),
            prisma.user.count(),
            prisma.logisticsOperator.count(),
            prisma.order.count(),
            prisma.order.groupBy({ 
                by: ['customerState'], 
                _count: { id: true },
                orderBy: { customerState: 'asc' }
            })
        ]);

        const totalStock = stockAgg._sum.quantity || 0;
        const ufDistribution = ufOrders.map(item => ({
            uf: item.customerState || 'N/A',
            count: (item as any)._count?.id || 0
        }));

        // Note: For complex monthly grouping by status, prisma.groupBy doesn't easily support dynamic month keys 
        // across statuses in a single call without raw SQL. 
        // To maintain 30k+ efficiency, we'll fetch only what's needed.
        const sixMonthsOrdersSummary = await prisma.order.findMany({
            where: { createdAt: { gte: sixMonthsAgo } },
            select: { createdAt: true, status: true }
        });

        // Process Daily Data (Last 30 days)
        const dailyData: Record<string, { opened: number, closed: number }> = {};
        for (let i = 0; i < 30; i++) {
            const dateStr = format(subDays(now, i), 'yyyy-MM-dd');
            dailyData[dateStr] = { opened: 0, closed: 0 };
        }

        sixMonthsOrdersSummary.forEach(o => {
            if (isAfter(o.createdAt, thirtyDaysAgo)) {
                const dateStr = format(o.createdAt, 'yyyy-MM-dd');
                if (dailyData[dateStr]) {
                    dailyData[dateStr].opened++;
                    if (o.status === 'COMPLETED') {
                        dailyData[dateStr].closed++;
                    }
                }
            }
        });

        const dailyOrdersArray = Object.entries(dailyData)
            .map(([date, counts]) => ({ date, ...counts }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Process SLA Compliance (Last 6 months)
        const monthlyData: Record<string, { total: number, success: number, cancelled: number, inProgress: number }> = {};
        for (let i = 0; i < 6; i++) {
            const dateStr = format(subMonths(now, i), 'yyyy-MM');
            monthlyData[dateStr] = { total: 0, success: 0, cancelled: 0, inProgress: 0 };
        }

        sixMonthsOrdersSummary.forEach(o => {
            const monthStr = format(o.createdAt, 'yyyy-MM');
            if (monthlyData[monthStr]) {
                const m = monthlyData[monthStr];
                m.total++;
                if (o.status === 'CANCELLED') {
                    m.cancelled++;
                } else if (o.status === 'COMPLETED') {
                    m.success++;
                } else {
                    m.inProgress++;
                }
            }
        });

        const slaComplianceArray = Object.entries(monthlyData)
            .map(([month, stats]) => ({
                month,
                total: stats.total,
                success: stats.success,
                inProgress: stats.inProgress,
                cancelled: stats.cancelled
            }))
            .sort((a, b) => a.month.localeCompare(b.month));

        console.log(`[DASHBOARD-SIX-MONTHS] Sending ${slaComplianceArray.length} months of data`);

        res.json({
            totalStock,
            totalOpenOrders,
            totalOrders,
            totalTenants,
            totalUsers,
            totalOperators,
            dailyOrders: dailyOrdersArray,
            slaCompliance: slaComplianceArray,
            ufDistribution,
            operators
        });

    } catch (error: any) {
        console.error('[DASHBOARD ERROR]', error);
        res.status(500).json({ error: 'Erro ao carregar dados do dashboard' });
    }
});

export default router;
