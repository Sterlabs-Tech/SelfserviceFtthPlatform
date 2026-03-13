const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    try {
        const op = await p.logisticsOperator.findFirst({ where: { active: true } });
        console.log('Operator found:', op ? op.id : 'NONE');

        const order = await p.order.create({
            data: {
                tenantId: 'default-tenant',
                type: 'REPAIR_ONT_SWAP',
                subscriberId: 'HC9999',
                customerName: 'Test User',
                customerAddress: 'Rua Teste 123',
                customerPhone: '21999999999',
                source: 'PORTAL',
                status: 'AWAITING_DISPATCH',
                logisticsOperatorId: op ? op.id : null,
                slaTarget: new Date(Date.now() + 24 * 3600 * 1000)
            }
        });
        console.log('SUCCESS - Order created:', order.id);
    } catch (e) {
        console.error('ERROR:', e.message);
        console.error('CODE:', e.code); 
        console.error('META:', JSON.stringify(e.meta));
    } finally {
        await p.$disconnect();
    }
}

main();
