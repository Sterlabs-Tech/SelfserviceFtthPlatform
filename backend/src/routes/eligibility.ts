import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// REQB01 - Serviço de Elegibilidade Auto Reparo
/**
 * @openapi
 * /api/auto-repair/eligibility:
 *   post:
 *     summary: Verifica a elegibilidade do cliente para Auto Reparo
 *     tags: [Público - Elegibilidade]
 *     description: API utilizada por sistemas externos (Portal NIO, Apps) para validar se um cliente pode abrir uma ordem de autosserviço baseada em regras de negócio e estoque.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subscriberId, tenantId, hcRegion]
 *             properties:
 *               subscriberId:
 *                 type: string
 *                 description: ID do Assinante (ex. CPF ou matrícula)
 *               tenantId:
 *                 type: string
 *                 description: ID da Tenant (empresa parceira)
 *               hcRegion:
 *                 type: string
 *                 description: UF ou Região do Home Connected para checagem de estoque
 *     responses:
 *       200:
 *         description: Resultado da análise de elegibilidade
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 eligible:
 *                   type: boolean
 *                 reason:
 *                   type: string
 *                 slaEstimationHours:
 *                   type: integer
 */
router.post('/eligibility', async (req, res) => {
    const { subscriberId, tenantId, hcRegion } = req.body;

    try {
        // 1. Check Tenant
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) return res.json({ eligible: false, reason: "Tenant não encontrada." });
        if (!tenant.active) return res.json({ eligible: false, reason: "Tenant não habilitada para autosserviço." });
        if (!tenant.allowedServices.includes("REPAIR")) return res.json({ eligible: false, reason: "Tenant não possui serviço de REPAIR." });

        // 2. Mocking Netwin/SOM checks for HC
        // In a real scenario we would call External APIs to check if HC is active, has no pending OS, and the equipment list.
        const isHcActive = true;
        const hasOpenOs = false;
        const hasIncompatibleEquipments = false;
        const customerCurrentOnt = { model: "NOKIA-G1425G", serial: "ALCLF0000000" };

        if (!isHcActive) return res.json({ eligible: false, reason: "HC inativo." });
        if (hasOpenOs) return res.json({ eligible: false, reason: "HC possui OS em aberto." });
        if (hasIncompatibleEquipments) return res.json({ eligible: false, reason: "Equipamentos incompatíveis no HC (Ex: Mesh)." });

        // 3. Logic for Operator and Stock in HC Region
        // In MVP hcRegion string must match operator regions
        const operators = await prisma.logisticsOperator.findMany({
            where: {
                active: true,
                regions: { contains: hcRegion }
            },
            include: { stocks: true }
        });

        if (operators.length === 0) {
            return res.json({ eligible: false, reason: "Nenhum operador logístico habilitado para esta região." });
        }

        const availableOperator = operators.find(op =>
            op.stocks.some(stock => stock.quantity > 0 && stock.region === hcRegion)
        );

        if (!availableOperator) {
            return res.json({ eligible: false, reason: "Sem estoque disponível de ONT compatível na região." });
        }

        // Returning success
        return res.json({
            eligible: true,
            slaEstimationHours: availableOperator.slaHours,
            businessHours: availableOperator.businessHours,
            designatedOperatorId: availableOperator.id,
            customerCurrentOnt,
            message: "Elegível para Auto Reparo."
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ eligible: false, reason: "Erro interno ao processar a elegibilidade." });
    }
});

export default router;
