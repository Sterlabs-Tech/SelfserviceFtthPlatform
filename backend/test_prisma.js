const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.tenant.update({
    where: { id: 'f958f235-6a9c-48d5-8f7d-ef4244d5e900' },
    data: { name: 'Tenant At', active: true, allowedServices: 'REPAIR', allowedUFs: 'SP' }
}).then(console.log).catch(console.error).finally(() => prisma.$disconnect());
