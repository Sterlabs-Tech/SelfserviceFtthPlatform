import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import eligibilityRoutes from './eligibility';
import orderRoutes from './orders';
import logisticsPortalRoutes from './logistics-portal';

const router = Router();
const prisma = new PrismaClient();

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

// REQA01 - Logistics Operators
router.get('/logistics', async (req, res) => {
    const ops = await prisma.logisticsOperator.findMany();
    res.json(ops);
});
router.post('/logistics', async (req, res) => {
    const { name, active, regions, slaHours, businessHours } = req.body;
    const op = await prisma.logisticsOperator.create({
        data: { name, active: Boolean(active), regions, slaHours: Number(slaHours), businessHours }
    });
    res.json(op);
});
router.put('/logistics/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { active, slaHours, businessHours, regions, name } = req.body;
        const op = await prisma.logisticsOperator.update({
            where: { id },
            data: { active: Boolean(active), slaHours: Number(slaHours), businessHours, regions, name }
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
    const { operatorId, region, modelCode, manufacturer, quantity } = req.body;
    const stock = await prisma.stock.create({
        data: { operatorId, region, modelCode, manufacturer, quantity: Number(quantity) }
    });
    res.json(stock);
});
router.put('/stock/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { operatorId, region, modelCode, manufacturer, quantity } = req.body;
        const stock = await prisma.stock.update({
            where: { id },
            data: { operatorId, region, modelCode, manufacturer, quantity: Number(quantity) }
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
