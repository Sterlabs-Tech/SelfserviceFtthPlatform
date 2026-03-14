const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Carga Completa de Dados ---');

  // 1. Tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: 'default-tenant' },
    update: {},
    create: {
      id: 'default-tenant',
      name: 'NIO Principal',
      active: true,
      allowedServices: 'REPAIR,INSTALLATION',
      allowedUFs: 'SP,RJ,MG'
    }
  });
  console.log('Tenant OK:', tenant.name);

  // 2. Operadores
  const opData = [
    { id: 'op-rj-01', name: 'Rapidão do RJ', state: 'RJ', city: 'Niterói', regions: 'Niterói,São Gonçalo,Maricá' },
    { id: 'op-bh-01', name: 'Rapidão de BH', state: 'MG', city: 'Belo Horizonte', regions: 'Belo Horizonte,Contagem,Betim' },
    { id: 'op-sp-01', name: 'Logística SP Mix', state: 'SP', city: 'São Paulo', regions: 'São Paulo,Campinas,Osasco' }
  ];

  for (const op of opData) {
    await prisma.logisticsOperator.upsert({
      where: { id: op.id },
      update: {},
      create: {
        ...op,
        active: true,
        slaHours: 24,
        businessStart: '08:00',
        businessEnd: '18:00'
      }
    });
  }
  console.log('Operadores OK');

  // 3. Usuários
  const userData = [
    { name: 'Niraldo Rocha Granado Junior', email: 'niraldo.junior@gmail.com', profile: 'ADMIN', opId: 'op-rj-01' },
    { name: 'Amanda Bicudo', email: 'amanda@nio.com.br', profile: 'OPERATOR', opId: 'op-rj-01' },
    { name: 'Ricardo Simoes', email: 'ricardo@nio.com.br', profile: 'DELIVERER', opId: 'op-rj-01' },
    { name: 'Marcelo Sally', email: 'marcelo@nio.com.br', profile: 'OPERATOR', opId: 'op-bh-01' },
    { name: 'Pablo Guimaraes', email: 'pablo@nio.com.br', profile: 'DELIVERER', opId: 'op-bh-01' }
  ];

  for (const u of userData) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { tenantId: 'default-tenant', logisticsOperatorId: u.opId },
      create: {
        name: u.name,
        email: u.email,
        password: '123',
        profile: u.profile,
        active: true,
        tenantId: 'default-tenant',
        logisticsOperatorId: u.opId
      }
    });
  }
  console.log('Usuários OK');

  // 4. Materiais (MaterialItem)
  const materials = [
    { tipo: 'ONT', manufacturer: 'Nokia', modelCode: 'G-240W-C' },
    { tipo: 'ONT', manufacturer: 'Huawei', modelCode: 'HG8245H' },
    { tipo: 'ONT', manufacturer: 'ZTE', modelCode: 'F670L' },
    { tipo: 'MESH', manufacturer: 'TP-Link', modelCode: 'Deco M5' },
    { tipo: 'MESH', manufacturer: 'Huawei', modelCode: 'WS5200' }
  ];

  for (const m of materials) {
    await prisma.materialItem.upsert({
      where: { tipo_manufacturer_modelCode: { tipo: m.tipo, manufacturer: m.manufacturer, modelCode: m.modelCode } },
      update: {},
      create: m
    });
  }
  console.log('Materiais OK');

  // 5. Estoque Inicial (Stock)
  const stocks = [
    { operatorId: 'op-rj-01', tipo: 'ONT', manufacturer: 'Nokia', modelCode: 'G-240W-C', quantity: 150 },
    { operatorId: 'op-rj-01', tipo: 'MESH', manufacturer: 'TP-Link', modelCode: 'Deco M5', quantity: 45 },
    { operatorId: 'op-bh-01', tipo: 'ONT', manufacturer: 'Huawei', modelCode: 'HG8245H', quantity: 200 }
  ];

  for (const s of stocks) {
      // Find or create stock record (non-unique index, so we check first)
      const existing = await prisma.stock.findFirst({
          where: { operatorId: s.operatorId, manufacturer: s.manufacturer, modelCode: s.modelCode }
      });

      if (existing) {
          await prisma.stock.update({ where: { id: existing.id }, data: { quantity: s.quantity } });
      } else {
          await prisma.stock.create({ data: s });
      }
  }
  console.log('Estoque OK');

  console.log('--- Carga Completa Finalizada ---');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
