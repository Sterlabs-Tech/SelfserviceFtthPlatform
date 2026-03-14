import { Router } from 'express';
import prisma from '../lib/prisma';
import eligibilityRoutes from './eligibility';
import orderRoutes from './orders';
import logisticsPortalRoutes from './logistics-portal';
import dashboardRoutes from './dashboard';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id: type string
 *         name: type string
 *         email: type string
 *         profile: type string
 *         active: type boolean
 *     Tenant:
 *       type: object
 *       properties:
 *         id: type string
 *         name: type string
 *         active: type boolean
 *         allowedServices:
 *           type: array
 *           items:
 *             type: string
 *         allowedUFs:
 *           type: array
 *           items:
 *             type: string
 *         logoUrl: type string
 */

/**
 * @openapi
 * /api/login:
 *   post:
 *     summary: Autentica um usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *       401:
 *         description: Credenciais inválidas
 */

/**
 * @openapi
 * /api/tenants:
 *   get:
 *     summary: Lista todas as tenants
 *     tags: [Configurações]
 *     responses:
 *       200:
 *         description: Lista de tenants
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tenant'
 */
router.use('/auto-repair', eligibilityRoutes);
router.use('/orders', orderRoutes);
router.use('/logistics-portal', logisticsPortalRoutes);
router.use('/dashboard', dashboardRoutes);

// REQA02 - Tenants
router.get('/tenants', async (req, res) => {
    const tenants = await prisma.tenant.findMany();
    res.json(tenants);
});
router.post('/tenants', async (req, res) => {
    const { name, active, allowedServices, allowedUFs, logoUrl } = req.body;
    const tenant = await prisma.tenant.create({
        data: { name, active, allowedServices, allowedUFs, logoUrl }
    });
    res.json(tenant);
});
router.put('/tenants/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, active, allowedServices, allowedUFs, logoUrl } = req.body;
        const tenant = await prisma.tenant.update({
            where: { id },
            data: {
                name,
                active: Boolean(active),
                allowedServices,
                allowedUFs,
                logoUrl
            }
        });
        res.json(tenant);
    } catch (e: any) {
        console.error('Error updating tenant:', e);
        res.status(500).json({ error: e.message });
    }
});
router.delete('/tenants/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Verify orders or users before deleting
        await prisma.tenant.delete({ where: { id } });
        res.json({ success: true });
    } catch (e: any) {
        console.error('Error deleting tenant:', e);
        if (e.code === 'P2003') {
            res.status(400).json({ error: 'Cannot delete Tenant because it has associated Users or Orders.' });
        } else {
            res.status(500).json({ error: e.message });
        }
    }
});

// REQA01 - Logistics Operators - DETAILS MUST BE BEFORE PARAMETERIZED DELETE/PUT
router.get('/logistics/:id/details', async (req, res) => {
    try {
        const { id } = req.params;
        const operator = await prisma.logisticsOperator.findUnique({
            where: { id },
            include: {
                users: {
                    select: { id: true, name: true, email: true, profile: true, active: true }
                },
                _count: {
                    select: { orders: true, users: true }
                }
            }
        });

        if (!operator) return res.status(404).json({ error: 'Operator not found' });

        const now = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const orders = await prisma.order.findMany({
            where: {
                logisticsOperatorId: id,
                createdAt: { gte: sixMonthsAgo }
            },
            select: {
                id: true,
                createdAt: true,
                updatedAt: true,
                slaTarget: true,
                status: true
            }
        });

        const performance: Record<string, { month: string, success: number, risk: number, delayed: number }> = {};
        for (let i = 0; i < 6; i++) {
            const d = new Date();
            d.setMonth(now.getMonth() - i);
            const monthKey = d.toISOString().slice(0, 7);
            performance[monthKey] = {
                month: d.toLocaleString('pt-BR', { month: 'short' }).replace('.', ''),
                success: 0,
                risk: 0,
                delayed: 0
            };
        }

        orders.forEach(o => {
            const monthKey = o.createdAt.toISOString().slice(0, 7);
            if (performance[monthKey]) {
                const isFinished = o.status === 'FINISHED' || o.status === 'COMPLETED';
                const finishTime = isFinished ? o.updatedAt : now;
                if (isFinished) {
                    if (o.slaTarget && finishTime <= o.slaTarget) performance[monthKey].success++;
                    else performance[monthKey].delayed++;
                } else {
                    if (o.slaTarget) {
                        if (now > o.slaTarget) performance[monthKey].delayed++;
                        else if ((o.slaTarget.getTime() - now.getTime()) < 6 * 3600 * 1000) performance[monthKey].risk++;
                        else performance[monthKey].success++;
                    } else performance[monthKey].success++;
                }
            }
        });

        const sortedPerformance = Object.entries(performance)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(e => e[1]);

        res.json({
            operator,
            deliverers: operator.users,
            totalDeliveries: operator._count.orders,
            performance: sortedPerformance
        });
    } catch (e: any) {
        console.error('Error fetching operator details:', e);
        res.status(500).json({ error: e.message });
    }
});

router.get('/logistics', async (req, res) => {
    const ops = await prisma.logisticsOperator.findMany();
    res.json(ops);
});
router.post('/logistics', async (req, res) => {
    const { name, active, regions, slaHours, businessStart, businessEnd, workSaturdays, workSundays, workHolidays, zipCode, street, number, complement, neighborhood, city, state } = req.body;
    const op = await prisma.logisticsOperator.create({
        data: { 
            name, 
            active: Boolean(active), 
            regions, 
            slaHours: Number(slaHours), 
            businessStart: businessStart || "08:00",
            businessEnd: businessEnd || "18:00",
            workSaturdays: Boolean(workSaturdays),
            workSundays: Boolean(workSundays),
            workHolidays: Boolean(workHolidays),
            zipCode,
            street,
            number,
            complement,
            neighborhood,
            city,
            state
        }
    });
    res.json(op);
});
router.put('/logistics/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { active, slaHours, businessStart, businessEnd, workSaturdays, workSundays, workHolidays, regions, name, zipCode, street, number, complement, neighborhood, city, state } = req.body;
        const op = await prisma.logisticsOperator.update({
            where: { id },
            data: { 
                active: Boolean(active), 
                slaHours: Number(slaHours), 
                businessStart, 
                businessEnd,
                workSaturdays: Boolean(workSaturdays),
                workSundays: Boolean(workSundays),
                workHolidays: Boolean(workHolidays),
                regions, 
                name,
                zipCode,
                street,
                number,
                complement,
                neighborhood,
                city,
                state
            }
        });
        res.json(op);
    } catch (e: any) {
        console.error('Error updating logistics:', e);
        res.status(500).json({ error: e.message });
    }
});
router.delete('/logistics/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.logisticsOperator.delete({ where: { id } });
        res.json({ success: true });
    } catch (e: any) {
        console.error('Error deleting logistics operator:', e);
        if (e.code === 'P2003') {
            res.status(400).json({ error: 'Cannot delete Operator because it has associated Stock or Orders.' });
        } else {
            res.status(500).json({ error: e.message });
        }
    }
});


// REQA03 - Stock
router.get('/stock', async (req, res) => {
    const stock = await prisma.stock.findMany({ include: { operator: true } });
    res.json(stock);
});
router.post('/stock', async (req, res) => {
    const { operatorId, region, modelCode, manufacturer, quantity, tipo } = req.body;
    const stock = await prisma.stock.create({
        data: { operatorId, region, modelCode, manufacturer, quantity: Number(quantity), tipo: tipo || "ONT" }
    });
    res.json(stock);
});
router.put('/stock/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { operatorId, region, modelCode, manufacturer, quantity, tipo } = req.body;
        const stock = await prisma.stock.update({
            where: { id },
            data: { operatorId, region, modelCode, manufacturer, quantity: Number(quantity), tipo: tipo || "ONT" }
        });
        res.json(stock);
    } catch (e: any) {
        console.error('Error updating stock:', e);
        res.status(500).json({ error: e.message });
    }
});
router.delete('/stock/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.stock.delete({ where: { id } });
        res.json({ success: true });
    } catch (e: any) {
        console.error('Error deleting stock:', e);
        res.status(500).json({ error: e.message });
    }
});

// REQA04 - Users
router.get('/users', async (req, res) => {
    const users = await prisma.user.findMany({ include: { tenant: true, logisticsOperator: true } });
    res.json(users);
});
router.post('/users', async (req, res) => {
    const { name, email, profile, tenantId, logisticsOperatorId, photoUrl, password } = req.body;
    const user = await prisma.user.create({
        data: { name, email, profile, tenantId, logisticsOperatorId, photoUrl, password: password || "123456" }
    });
    res.json(user);
});
router.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, profile, active, tenantId, logisticsOperatorId, photoUrl, password } = req.body;

        let updateData: any = { name, email, profile, active: Boolean(active), tenantId, logisticsOperatorId, photoUrl };
        if (password) {
            updateData.password = password;
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData
        });
        res.json(user);
    } catch (e: any) {
        console.error('Error updating user:', e);
        res.status(500).json({ error: e.message });
    }
});
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.user.delete({ where: { id } });
        res.json({ success: true });
    } catch (e: any) {
        console.error('Error deleting user:', e);
        res.status(500).json({ error: e.message });
    }
});

// Auth Endpoint
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email }, include: { tenant: true, logisticsOperator: true } });
        if (!user || !user.active) {
            return res.status(401).json({ error: 'Credenciais inválidas ou usuário inativo.' });
        }

        // In a real app we would use bcrypt, but here we just do a literal match
        if (user.password !== password) {
            return res.status(401).json({ error: 'Credenciais inválidas ou usuário inativo.' });
        }

        // Don't send the password back to the client
        const { password: _, ...safeUser } = user;
        res.json({ user: safeUser, token: 'fake-jwt-token-1234' });
    } catch (e: any) {
        console.error('Login error:', e);
        res.status(500).json({ error: e.message });
    }
});

export default router;
