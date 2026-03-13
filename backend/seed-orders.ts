import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const firstNames = ["Maria", "José", "Ana", "Carlos", "Juliana", "Ricardo", "Fernanda", "Paulo", "Luciana", "Marcos", "Leandro", "Cláudia", "Roberto", "Patrícia", "Bruno", "Sonia", "Tiago", "Vanessa", "Gabriel", "Aline"];
const lastNames = ["Silva", "Santos", "Oliveira", "Pereira", "Lima", "Souza", "Costa", "Rocha", "Mello", "Vinicius", "Almeida", "Nascimento", "Rodrigues", "Ferreira", "Gomes", "Carvalho", "Martins", "Araújo", "Pinto", "Barbosa"];
const streets = ["Rua das Flores", "Av. Paulista", "Rua Augusta", "Rua Oscar Freire", "Alameda Santos", "Rua Bela Cintra", "Rua Haddock Lobo", "Av. Rebouças", "Rua da Consolação", "Av. Brigadeiro", "Rua Vergueiro", "Rua Domingos de Morais", "Av. Ipiranga", "Rua São Bento", "Rua Direita"];

const IN_PROGRESS_STATUSES = [
    'AWAITING_DISPATCH',
    'EQUIPMENT_SEPARATED',
    'AWAITING_PICKUP',
    'DISPATCHED_TO_DELIVERER',
    'EN_ROUTE',
    'DELIVERY_CONFIRMED',
    'RETURNED_FOR_REDELIVERY',
    'ONT_ACTIVATION_STARTED',
    'ONT_ASSOCIATION_FAILED'
];

async function main() {
    const tenants = await prisma.tenant.findMany();
    const operators = await prisma.logisticsOperator.findMany();

    if (tenants.length === 0 || operators.length === 0) {
        console.error("Erro: Preciso de pelo menos uma Tenant e um Operador para criar as ordens.");
        return;
    }

    console.log(`Limpando ordens existentes...`);
    await prisma.orderHistory.deleteMany({});
    await prisma.order.deleteMany({});

    console.log(`Gerando 200 ordens em andamento e 300 finalizadas...`);

    const totalOrders = 500;
    const completedCount = 300;
    
    for (let i = 0; i < totalOrders; i++) {
        const isCompleted = i < completedCount;
        const status = (isCompleted ? 'COMPLETED' : IN_PROGRESS_STATUSES[Math.floor(Math.random() * IN_PROGRESS_STATUSES.length)]) as string;
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]!;
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]!;
        const street = streets[Math.floor(Math.random() * streets.length)]!;
        const num = Math.floor(Math.random() * 2000) + 1;
        
        const slaTarget = new Date();
        // Random SLA between 4 hours ago and 48 hours in the future
        slaTarget.setHours(slaTarget.getHours() + (Math.floor(Math.random() * 52) - 4));

        await prisma.order.create({
            data: {
                customerName: `${firstName} ${lastName}`,
                status: status,
                subscriberId: `HC${1000 + i}`,
                customerAddress: `${street}, ${num}`,
                customerPhone: `${Math.floor(Math.random() * 89 + 10)}9${Math.floor(Math.random() * 89999999 + 10000000)}`,
                tenantId: tenants[Math.floor(Math.random() * tenants.length)]!.id,
                logisticsOperatorId: operators[Math.floor(Math.random() * operators.length)]!.id,
                type: "REPAIR_ONT_SWAP",
                source: "PORTAL",
                externalId: `VTAL-${Math.floor(Math.random() * 90000) + 10000}`,
                slaTarget: slaTarget,
            }
        });

        if (i % 50 === 0) console.log(`Criadas ${i} ordens...`);
    }

    console.log("500 ordens criadas com sucesso!");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
