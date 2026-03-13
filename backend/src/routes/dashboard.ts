/** Dashboard API - Refined with Open Orders count **/
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { subDays, subMonths, startOfDay, format, isAfter, startOfMonth } from 'date-fns';

const router = Router();
const prisma = new PrismaClient();

router.get('/stats', async (req, res) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = subDays(now, 30);
        const sixMonthsAgo = subMonths(now, 6);

        // 1. Total Stock
        const stockAgg = await prisma.stock.aggregate({
            _sum: { quantity: true }
        });
        const totalStock = stockAgg._sum.quantity || 0;

        // 2. Daily Orders (Last 30 days)
        const recentOrders = await prisma.order.findMany({
            where: {
                createdAt: { gte: thirtyDaysAgo }
            },
            select: {
                createdAt: true,
                status: true
            }
        });

        const dailyData: Record<string, { opened: number, closed: number }> = {};
        for (let i = 0; i < 30; i++) {
            const dateStr = format(subDays(now, i), 'yyyy-MM-dd');
            dailyData[dateStr] = { opened: 0, closed: 0 };
        }

        recentOrders.forEach(o => {
            const dateStr = format(o.createdAt, 'yyyy-MM-dd');
            if (dailyData[dateStr]) {
                dailyData[dateStr].opened++;
                if (o.status === 'COMPLETED') {
                    dailyData[dateStr].closed++;
                }
            }
        });

        const dailyOrdersArray = Object.entries(dailyData)
            .map(([date, counts]) => ({ date, ...counts }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // 3. SLA Compliance (Last 6 months)
        const yearOrders = await prisma.order.findMany({
            where: {
                createdAt: { gte: sixMonthsAgo }
            },
            select: {
                createdAt: true,
                status: true,
                slaTarget: true,
                updatedAt: true
            }
        });

        const monthlyData: Record<string, { total: number, withinSla: number, overdue: number, cancelled: number }> = {};
        for (let i = 0; i < 6; i++) {
            const dateStr = format(subMonths(now, i), 'yyyy-MM');
            monthlyData[dateStr] = { total: 0, withinSla: 0, overdue: 0, cancelled: 0 };
        }

        yearOrders.forEach(o => {
            const monthStr = format(o.createdAt, 'yyyy-MM');
            if (monthlyData[monthStr]) {
                const m = monthlyData[monthStr];
                m.total++;
                if (o.status === 'CANCELLED') {
                    m.cancelled++;
                } else if (o.status === 'COMPLETED') {
                    if (o.slaTarget && isAfter(o.updatedAt, o.slaTarget)) {
                        m.overdue++;
                    } else {
                        m.withinSla++;
                    }
                } else {
                    // Still in progress, check current SLA
                    if (o.slaTarget && isAfter(now, o.slaTarget)) {
                        m.overdue++;
                    } else {
                        m.withinSla++;
                    }
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

        // 4. UF Distribution (Heat Map)
        const ufOrders = await prisma.order.groupBy({
            by: ['customerState'],
            _count: { id: true }
        });
        const ufDistribution = ufOrders.map(item => ({
            uf: item.customerState || 'N/A',
            count: item._count.id
        }));

        // 5. Operators Locations
        const operators = await prisma.logisticsOperator.findMany({
            where: { active: true },
            select: {
                id: true,
                name: true,
                city: true,
                state: true
            }
        });

        // 6. Basic Totals for cards
        const totalOpenOrders = await prisma.order.count({
            where: {
                status: { notIn: ['COMPLETED', 'CANCELLED'] }
            }
        });
        const totalTenants = await prisma.tenant.count();
        const totalUsers = await prisma.user.count();
        const totalOperators = await prisma.logisticsOperator.count();

        res.json({
            totalStock,
            totalOpenOrders,
            totalOrders: await prisma.order.count(), // Keep total for reference if needed
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
