import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

export async function checkRepairEligibility(subscriberId: string, tenantId: string) {
    // 1. Check Tenant
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return { eligible: false, reason: "Tenant não encontrada." };
    if (!tenant.active) return { eligible: false, reason: "Tenant não habilitada para autosserviço." };
    
    // Check if repair is allowed
    const allowedServices = tenant.allowedServices.split(',');
    if (!allowedServices.includes("REPAIR")) {
        return { eligible: false, reason: "Tenant não possui serviço de REPAIR habilitado." };
    }

    // 2. Find a real active operator (for MVP, pick the first active one as "Rapidão do RJ")
    const activeOperator = await prisma.logisticsOperator.findFirst({
        where: { active: true }
    });

    if (!activeOperator) {
        return { eligible: false, reason: "Nenhum operador logístico ativo encontrado." };
    }

    return {
        eligible: true,
        slaEstimationHours: activeOperator.slaHours || 24,
        businessHours: activeOperator.businessHours || "08:00-18:00",
        designatedOperatorId: activeOperator.id,
        designatedOperatorName: "Rapidão do RJ",
        compatibleOntStock: 100,
        customerCurrentOnt: { 
            model: "NOKIA-G1425G", 
            serial: "ALCLF0000000" 
        },
        message: "Elegível para Auto Reparo (Modo Simplificado)."
    };
}

// REQB01 - Serviço de Elegibilidade Auto Reparo
/**
 * @openapi
 * /api/auto-repair/eligibility/repair:
 *   post:
 *     summary: Verifica a elegibilidade do cliente para Auto Reparo
 *     tags: [Público - Elegibilidade]
 *     description: API utilizada por sistemas externos (Portal NIO, Apps) para validar se um cliente pode abrir uma ordem de autosserviço de reparo.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subscriberId, tenantId]
 *             properties:
 *               subscriberId:
 *                 type: string
 *               tenantId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Resultado da análise de elegibilidade
 */
router.post('/eligibility/repair', async (req, res) => {
    const { subscriberId, tenantId } = req.body;
    try {
        const result = await checkRepairEligibility(subscriberId, tenantId);
        return res.json(result);
    } catch (error) {
        console.error('Eligibility Error:', error);
        return res.status(500).json({ eligible: false, reason: "Erro interno ao processar a elegibilidade." });
    }
});

export default router;
