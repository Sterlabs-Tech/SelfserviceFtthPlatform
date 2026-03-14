const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const materials = [
    { tipo: 'ONT', manufacturer: 'Nokia', modelCode: 'G-240W-C' },
    { tipo: 'ONT', manufacturer: 'Nokia', modelCode: 'G-1425G' },
    { tipo: 'ONT', manufacturer: 'Huawei', modelCode: 'HG8245H' },
    { tipo: 'ONT', manufacturer: 'ZTE', modelCode: 'F660' },
    { tipo: 'MESH', manufacturer: 'TP-Link', modelCode: 'Deco M5' },
    { tipo: 'MESH', manufacturer: 'Nokia', modelCode: 'Beacon 1' }
  ];

  console.log('Seeding materials...');
  for (const m of materials) {
    await prisma.materialItem.upsert({
      where: {
        tipo_manufacturer_modelCode: {
          tipo: m.tipo,
          manufacturer: m.manufacturer,
          modelCode: m.modelCode
        }
      },
      update: {},
      create: m
    });
  }
  console.log('Materials seeded successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
