const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('--- Iniciando carga aleatória de estoque ---');

    // 1. Limpar estoque atual
    await prisma.stock.deleteMany({});
    console.log('Estoque atual removido.');

    // 2. Buscar todos os operadores e materiais
    const operators = await prisma.logisticsOperator.findMany();
    const materials = await prisma.materialItem.findMany();

    console.log(`Processando ${operators.length} operadores e ${materials.length} tipos de materiais.`);

    let createdCount = 0;
    let gapCount = 0;

    for (const op of operators) {
      for (const mat of materials) {
        // Chance de 10% de deixar um "gap" (não cadastrar para simular vida real)
        if (Math.random() < 0.10) {
          gapCount++;
          continue;
        }

        // Gerar quantidade aleatória
        // 15% de chance de ser crítico (0-19)
        // 85% de chance de ser normal (20-150)
        let quantity;
        if (Math.random() < 0.15) {
          quantity = Math.floor(Math.random() * 20); // 0 a 19
        } else {
          quantity = 20 + Math.floor(Math.random() * 131); // 20 a 150
        }

        await prisma.stock.create({
          data: {
            operatorId: op.id,
            tipo: mat.tipo,
            manufacturer: mat.manufacturer,
            modelCode: mat.modelCode,
            quantity: quantity
          }
        });
        createdCount++;
      }
    }

    console.log(`--- Carga finalizada ---`);
    console.log(`Registros criados: ${createdCount}`);
    console.log(`Gaps simulados (não cadastrados): ${gapCount}`);
  } catch (error) {
    console.error('ERRO DURANTE A EXECUÇÃO:');
    console.error(error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
