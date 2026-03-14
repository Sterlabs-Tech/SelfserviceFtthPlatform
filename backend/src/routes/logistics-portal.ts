import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// REQD01 - Fila do Operador Logístico
router.get('/operator/queue/:operatorId', async (req, res) => {
    const { operatorId } = req.params;
    const orders = await prisma.order.findMany({
        where: {
            logisticsOperatorId: operatorId,
            status: { in: ['AWAITING_DISPATCH', 'EQUIPMENT_SEPARATED', 'AWAITING_PICKUP', 'DISPATCHED_TO_DELIVERER'] }
        },
        include: { tenant: true, history: true }
    });
    return res.json(orders);
});

// REQD01 - Vincular ONT (Separar)
router.post('/operator/bind-ont', async (req, res) => {
    const { orderId, designatedOntModel, designatedOntSerial, nfeNumber } = req.body;
    const order = await prisma.order.update({
        where: { id: orderId },
        data: {
            status: 'EQUIPMENT_SEPARATED',
            designatedOntModel,
            designatedOntSerial,
            nfeNumber
        }
    });

    await prisma.orderHistory.create({
        data: {
            orderId,
            responsibleName: "Operador Logístico",
            eventType: "ONT_BINDED",
            newStatus: "EQUIPMENT_SEPARATED",
            reason: `Vinculado Serial: ${designatedOntSerial}`
        }
    });

    return res.json({ success: true, order });
});

// REQD01 - Despachar para Entregador
router.post('/operator/dispatch', async (req, res) => {
    const { orderId, delivererId } = req.body;
    const order = await prisma.order.update({
        where: { id: orderId },
        data: { status: 'DISPATCHED_TO_DELIVERER', delivererId }
    });

    await prisma.orderHistory.create({
        data: {
            orderId,
            responsibleName: "Operador Logístico",
            eventType: "DISPATCHED",
            newStatus: "DISPATCHED_TO_DELIVERER",
            reason: `Equipamento disponibilizado ao entregador (${delivererId})`
        }
    });

    return res.json({ success: true, order });
});

// REQD01 - Reatribuir Entregador (Permitido em AWAITING_PICKUP ou DISPATCHED_TO_DELIVERER)
router.post('/operator/reassign-deliverer', async (req, res) => {
    const { orderId, delivererId } = req.body;
    const order = await prisma.order.update({
        where: { id: orderId },
        data: { delivererId }
    });

    await prisma.orderHistory.create({
        data: {
            orderId,
            responsibleName: "Operador Logístico",
            eventType: "DELIVERER_REASSIGNED",
            newStatus: order.status,
            reason: `Entregador alterado para: ${delivererId}`
        }
    });

    return res.json({ success: true, order });
});

// REQD02 - Fila do Entregador
router.get('/deliverer/queue/:delivererId', async (req, res) => {
    const { delivererId } = req.params;
    const orders = await prisma.order.findMany({
        where: {
            delivererId,
            status: { in: ['DISPATCHED_TO_DELIVERER', 'EN_ROUTE'] }
        },
        include: { tenant: true }
    });
    return res.json(orders);
});

// REQD02 - Update Status Entrega
router.post('/deliverer/update-status', async (req, res) => {
    const { orderId, status, reason } = req.body;
    // Status can be: 'EN_ROUTE', 'DELIVERY_CONFIRMED', 'DELIVERY_FAILED'
    const order = await prisma.order.update({
        where: { id: orderId },
        data: { status }
    });

    await prisma.orderHistory.create({
        data: {
            orderId,
            responsibleName: "Entregador",
            eventType: "DELIVERY_UPDATE",
            newStatus: status,
            reason
        }
    });

    return res.json({ success: true, order });
});

export default router;
