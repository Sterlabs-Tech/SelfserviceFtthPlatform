import { Router } from 'express';
import prisma from '../lib/prisma';
import { checkRepairEligibility } from './eligibility';

const router = Router();

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
 *               openingOrigin:
 *                 type: string
 *                 description: |
 *                   Origem da abertura: 
 *                   MANUAL (Portal), 
 *                   REPAIR (Reparo), 
 *                   INSTALLATION (Instalação), 
 *                   ADDRESS_CHANGE (Mudança de endereço)
 *     responses:
 *       201:
 *         description: Ordem criada com sucesso
 *       400:
 *         description: Erro na validação (estoque ou tenant)
 */
router.post('/create', async (req, res) => {
    console.log('[BACKEND] /api/orders/create called with refactored logic');
    const {
        tenantId, subscriberId, customerName, customerAddress,
        customerNumber, customerComplement,
        customerNeighborhood, customerCity, customerState, customerZip,
        customerPhone, externalId, source, openingOrigin
    } = req.body;

    try {
        // 1. Perform Eligibility Check for data enrichment and validation
        const eligibility = await checkRepairEligibility(subscriberId as string, tenantId as string);
        
        if (!eligibility.eligible) {
            console.log(`[BACKEND] Creation rejected by eligibility: ${eligibility.reason}`);
            return res.status(400).json({ success: false, reason: eligibility.reason });
        }

        // Crate Order
        const orderData: any = {
            tenantId: String(tenantId),
            type: "REPAIR_ONT_SWAP",
            subscriberId: String(subscriberId),
            customerName: String(customerName),
            customerAddress: String(customerAddress),
            customerNumber: customerNumber ? String(customerNumber) : null,
            customerComplement: customerComplement ? String(customerComplement) : null,
            customerNeighborhood: customerNeighborhood ? String(customerNeighborhood) : null,
            customerCity: customerCity ? String(customerCity) : null,
            customerState: customerState ? String(customerState) : null,
            customerZip: customerZip ? String(customerZip) : null,
            customerPhone: String(customerPhone),
            externalId: externalId ? String(externalId) : null,
            source: String(source || 'PORTAL'),
            openingOrigin: openingOrigin ? String(openingOrigin) : 'MANUAL',
            status: "AWAITING_DISPATCH",
            logisticsOperatorId: eligibility.designatedOperatorId || null,
            slaTarget: new Date(Date.now() + (eligibility.slaEstimationHours || 24) * 3600 * 1000),
            designatedOntModel: eligibility.customerCurrentOnt?.model || null,
            designatedOntSerial: eligibility.customerCurrentOnt?.serial || null
        };

        const newOrder = await prisma.order.create({ data: orderData });

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
        // Note: For MVP we skip complex stock find since we use mock operator.
        // In real scenario, we would use the dedicated operator's stock for the region.
        
        return res.status(201).json({
            success: true,
            orderId: newOrder.id,
            message: "Ordem gerada com sucesso e cliente notificado (Mock via canais digitais)."
        });

    } catch (error: any) {
        console.error('[BACKEND] Order creation error:', error?.message || error);
        console.error('[BACKEND] Error code:', error?.code);
        console.error('[BACKEND] Error meta:', JSON.stringify(error?.meta));
        return res.status(500).json({ success: false, reason: "Erro interno na abertura da Ordem." });
    }
});

router.get('/', async (req, res) => {
    const { q } = req.query;
    console.log('[BACKEND] GET /api/orders query:', q);
    
    let whereClause = {};
    if (q && typeof q === 'string') {
        whereClause = {
            OR: [
                { id: { contains: q, mode: 'insensitive' } },
                { subscriberId: { contains: q, mode: 'insensitive' } },
                { customerName: { contains: q, mode: 'insensitive' } },
                { customerAddress: { contains: q, mode: 'insensitive' } },
                { customerNeighborhood: { contains: q, mode: 'insensitive' } },
                { customerCity: { contains: q, mode: 'insensitive' } },
                { customerState: { contains: q, mode: 'insensitive' } },
                { customerZip: { contains: q, mode: 'insensitive' } },
            ]
        };
    }
    console.log('[BACKEND] whereClause:', JSON.stringify(whereClause, null, 2));

    const orders = await prisma.order.findMany({
        where: whereClause,
        include: { tenant: true, operator: true, deliverer: true },
        orderBy: { createdAt: 'desc' }
    });
    return res.json(orders);
});

// Endpoint for checking open orders (Operator Portal and Support)
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
        where: { id },
        include: { 
            tenant: true, 
            operator: true, 
            deliverer: true,
            history: {
                orderBy: { timestamp: 'desc' }
            }
        }
    });
    if (!order) return res.status(404).json({ error: "Ordem não encontrada" });
    return res.json(order);
});

export default router;
