import { PrismaClient } from '@prisma/client';
import { addDays, subDays } from 'date-fns';

const prisma = new PrismaClient();

const UFS = [
    'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
    'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 
    'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'
];

async function main() {
    console.log('--- Starting Mass Data Generation ---');

    // 1. Ensure Tenants exist
    const tenants = [
        { id: 'tenant-nio', name: 'NIO', allowedServices: 'Reparo,Instalação', allowedUFs: UFS.join(',') },
        { id: 'tenant-tim', name: 'TIM', allowedServices: 'Reparo', allowedUFs: UFS.join(',') },
        { id: 'tenant-claro', name: 'CLARO', allowedServices: 'Reparo', allowedUFs: UFS.join(',') }
    ];

    for (const t of tenants) {
        await prisma.tenant.upsert({
            where: { id: t.id },
            update: {},
            create: t
        });
    }
    console.log('Tenants checked/created.');

    // 2. Ensure Logistics Operators for each UF
    const operators: Record<string, string> = {};
    for (const uf of UFS) {
        const opId = `op-${uf.toLowerCase()}`;
        const op = await prisma.logisticsOperator.upsert({
            where: { id: opId },
            update: { state: uf, regions: uf },
            create: {
                id: opId,
                name: `Logística ${uf}`,
                state: uf,
                regions: uf,
                active: true,
                slaHours: 24,
                city: 'Capital',
                neighborhood: 'Centro'
            }
        });
        operators[uf] = op.id;
    }
    console.log('Logistics Operators checked/created (one per UF).');

    // 3. Generate 30,000 orders
    const TOTAL_ORDERS = 30000;
    const BATCH_SIZE = 1000;
    // Jan 2025 (month 0) to Feb 2026 (month 1 in 2026)
    const startDate = new Date(2025, 0, 1);
    const endDate = new Date(2026, 1, 28);
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    console.log(`Generating ${TOTAL_ORDERS} orders between ${startDate.toISOString()} and ${endDate.toISOString()}...`);

    for (let i = 0; i < TOTAL_ORDERS; i += BATCH_SIZE) {
        const orders = [];
        for (let j = 0; j < BATCH_SIZE && (i + j) < TOTAL_ORDERS; j++) {
            const randomUF = UFS[Math.floor(Math.random() * UFS.length)];
            const operatorId = operators[randomUF];
            
            // Tenant distribution weights: Nio (80), Tim (25), Claro (5) -> Total 110
            const randTenant = Math.random() * 110;
            let tenantId = 'tenant-nio';
            if (randTenant > 80 && randTenant <= 105) tenantId = 'tenant-tim';
            else if (randTenant > 105) tenantId = 'tenant-claro';

            const createdAt = new Date(startTime + Math.random() * (endTime - startTime));
            const slaTarget = addDays(createdAt, 1);
            
            // 20% cancellation rate
            const isCancelled = Math.random() < 0.20;
            const status = isCancelled ? 'CANCELLED' : 'COMPLETED';
            
            // SLA Compliance: 90% on time for successful orders
            let updatedAt = new Date(createdAt);
            if (!isCancelled) {
                const isOnTime = Math.random() < 0.90;
                if (isOnTime) {
                    // Completed before SLA target
                    updatedAt = new Date(createdAt.getTime() + Math.random() * (slaTarget.getTime() - createdAt.getTime()));
                } else {
                    // Completed after SLA target
                    // Some orders very late, some just a bit
                    updatedAt = new Date(slaTarget.getTime() + Math.random() * (48 * 60 * 60 * 1000));
                }
            }

            orders.push({
                tenantId,
                logisticsOperatorId: operatorId,
                type: 'Reparo',
                subscriberId: `SUB-${1000000 + i + j}`,
                customerName: `Cliente Mass ${i + j}`,
                customerAddress: `Logradouro Fictício, ${i + j}`,
                customerCity: 'Cidade Exemplo',
                customerState: randomUF,
                customerPhone: '11999999999',
                externalId: `OS-MASS-${i + j}`,
                source: 'MASS_GENERATION',
                status,
                slaTarget,
                createdAt,
                updatedAt
            });
        }
        await prisma.order.createMany({ data: orders });
        console.log(`Progress: ${i + orders.length} orders created...`);
    }

    console.log('--- Mass Data Generation Completed ---');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
