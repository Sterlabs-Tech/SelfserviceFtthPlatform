/** Dashboard API - Refined with Open Orders count **/
import { Router } from 'express';
import prisma from '../lib/prisma';
import { subDays, subMonths, startOfDay, format, isAfter, startOfMonth } from 'date-fns';

const router = Router();

router.get('/stats', async (req, res) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = subDays(now, 30);
        const sixMonthsAgo = subMonths(now, 6);

        // Consolidate queries into fewer round-trips using a transaction
        const [
            stockAgg,
            sixMonthOrders,
            ufOrders,
            operators,
            totalOpenOrders,
            totalTenants,
            totalUsers,
            totalOperators,
            totalOrders
        ] = await prisma.$transaction([
            prisma.stock.aggregate({ _sum: { quantity: true } }),
            prisma.order.findMany({
                where: { createdAt: { gte: sixMonthsAgo } },
                select: { createdAt: true, status: true, slaTarget: true, updatedAt: true }
            }),
            prisma.order.groupBy({ 
                by: ['customerState'], 
                _count: { id: true },
                orderBy: { customerState: 'asc' }
            }),
            prisma.logisticsOperator.findMany({
                where: { active: true },
                select: { id: true, name: true, city: true, state: true }
            }),
            prisma.order.count({ where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } } }),
            prisma.tenant.count(),
            prisma.user.count(),
            prisma.logisticsOperator.count(),
            prisma.order.count()
        ]);

        const totalStock = stockAgg._sum.quantity || 0;

        // Process Daily Data (Last 30 days) from the 6-month aggregate
        const dailyData: Record<string, { opened: number, closed: number }> = {};
        for (let i = 0; i < 30; i++) {
            const dateStr = format(subDays(now, i), 'yyyy-MM-dd');
            dailyData[dateStr] = { opened: 0, closed: 0 };
        }

        sixMonthOrders.forEach(o => {
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
        const monthlyData: Record<string, { total: number, withinSla: number, overdue: number, cancelled: number }> = {};
        for (let i = 0; i < 6; i++) {
            const dateStr = format(subMonths(now, i), 'yyyy-MM');
            monthlyData[dateStr] = { total: 0, withinSla: 0, overdue: 0, cancelled: 0 };
        }

        sixMonthOrders.forEach(o => {
            const monthStr = format(o.createdAt, 'yyyy-MM');
            if (monthlyData[monthStr]) {
                const m = monthlyData[monthStr];
                m.total++;
                if (o.status === 'CANCELLED') {
                    m.cancelled++;
                } else if (o.status === 'COMPLETED') {
                    if (o.slaTarget && isAfter(o.updatedAt, o.slaTarget)) m.overdue++;
                    else m.withinSla++;
                } else {
                    if (o.slaTarget && isAfter(now, o.slaTarget)) m.overdue++;
                    else m.withinSla++;
                }
            }
        });

        const slaComplianceArray = Object.entries(monthlyData)
            .map(([month, stats]) => ({
                month,
                total: stats.total,
                withinSla: stats.total > 0 ? (stats.withinSla / stats.total) * 100 : 0,
                overdue: stats.total > 0 ? (stats.overdue / stats.total) * 100 : 0,
                cancelled: stats.total > 0 ? (stats.cancelled / stats.total) * 100 : 0
            }))
            .sort((a, b) => a.month.localeCompare(b.month));

        const ufDistribution = ufOrders.map(item => ({
            uf: item.customerState || 'N/A',
            count: (item as any)._count?.id || 0
        }));

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
