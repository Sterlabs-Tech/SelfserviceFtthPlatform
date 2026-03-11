import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// REQC01 - Serviço de Abertura Ordens de Auto Troca de ONT
/**
 * @openapi
 * /api/orders/create:
 *   post:
 *     summary: Abre uma nova Ordem de Serviço de Auto Troca
 *     tags: [Público - Ordens]
 *     description: Endpoint para criação formal de ordens de autosserviço. Inicia automaticamente o workflow logístico.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenantId, subscriberId, customerName, customerAddress, hcRegion]
 *             properties:
 *               tenantId:
 *                 type: string
 *               subscriberId:
 *                 type: string
 *               customerName:
 *                 type: string
 *               customerAddress:
 *                 type: string
 *               customerPhone:
 *                 type: string
 *               hcRegion:
 *                 type: string
 *               externalId:
 *                 type: string
 *               source:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ordem criada com sucesso
 *       400:
 *         description: Erro na validação (estoque ou tenant)
 */
router.post('/create', async (req, res) => {
    const {
        tenantId, subscriberId, customerName, customerAddress,
        customerPhone, externalId, source, hcRegion // Region is passed just for validation in MVP
    } = req.body;

    // Ideally, re-execute the eligibility check via internal function instead of duplicating rules
    // For MVP purposes, let's fast check if Tenant is valid and stock exists.
    try {
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant || !tenant.active) {
            return res.status(400).json({ success: false, reason: "Tenant inválida ou nâo habilitada." });
        }

        const operators = await prisma.logisticsOperator.findMany({
            where: { active: true, regions: { contains: hcRegion } },
            include: { stocks: true }
        });

        const availableOperator = operators.find(op =>
            op.stocks.some(stock => stock.quantity > 0 && stock.region === hcRegion)
        );

        if (!availableOperator) {
            return res.status(400).json({ success: false, reason: "Abertura rejeitada: Sem estoque/operador para a região." });
        }

        // Crate Order
        const newOrder = await prisma.order.create({
            data: {
                tenantId,
                type: "REPAIR_ONT_SWAP",
                subscriberId,
                customerName,
                customerAddress,
                customerPhone,
                externalId,
                source,
                status: "AWAITING_DISPATCH", // Automtically starts dispatch flow (Domínio D)
                logisticsOperatorId: availableOperator.id,
                // SLA Target in 24hs for example
                slaTarget: new Date(Date.now() + availableOperator.slaHours * 3600 * 1000)
            }
        });

        // Register initial audit trail
        await prisma.orderHistory.create({
            data: {
                orderId: newOrder.id,
                responsibleName: "Sistema / API NIO",
                eventType: "ORDER_CREATED",
                newStatus: "AWAITING_DISPATCH",
                reason: "Elegibilidade confirmada e Ordem Aberta"
            }
        });

        // Decrement stock tentatively (normally done at dispatch, but simplified for MVP)
        const stockToDecrement = availableOperator.stocks.find(s => s.region === hcRegion && s.quantity > 0);
        if (stockToDecrement) {
            await prisma.stock.update({
                where: { id: stockToDecrement.id },
                data: { quantity: stockToDecrement.quantity - 1 }
            });
        }

        return res.status(201).json({
            success: true,
            orderId: newOrder.id,
            message: "Ordem gerada com sucesso e cliente notificado (Mock via canais digitais)."
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, reason: "Erro interno na abertura da Ordem." });
    }
});

// Endpoint for checking open orders (Operator Portal and Support)
router.get('/', async (req, res) => {
    const orders = await prisma.order.findMany({
        include: { tenant: true, operator: true, deliverer: true }
    });
    return res.json(orders);
});

export default router;
