import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tenants = await prisma.tenant.findMany();
    const operators = await prisma.logisticsOperator.findMany();

    if (tenants.length === 0 || operators.length === 0) {
        console.error("Erro: Preciso de pelo menos uma Tenant e um Operador para criar as ordens.");
        return;
    }

    const tId = tenants[0].id;
    const oId = operators[0].id;

    const orderData = [
        { customerName: "Maria Silva", status: "AWAITING_ELIGIBILITY", subscriberId: "HC1001", customerAddress: "Rua das Flores, 123", customerPhone: "11999998888" },
        { customerName: "José Santos", status: "AWAITING_DISPATCH", subscriberId: "HC1002", customerAddress: "Av. Paulista, 1000", customerPhone: "11988887777" },
        { customerName: "Ana Oliveira", status: "EQUIPMENT_SEPARATED", subscriberId: "HC1003", customerAddress: "Rua Augusta, 500", customerPhone: "11977776666" },
        { customerName: "Carlos Pereira", status: "AWAITING_PICKUP", subscriberId: "HC1004", customerAddress: "Rua Oscar Freire, 200", customerPhone: "11966665555" },
        { customerName: "Juliana Lima", status: "DISPATCHED_TO_DELIVERER", subscriberId: "HC1005", customerAddress: "Alameda Santos, 1500", customerPhone: "11955554444" },
        { customerName: "Ricardo Souza", status: "DELIVERY_IN_PROGRESS", subscriberId: "HC1006", customerAddress: "Rua Bela Cintra, 800", customerPhone: "11944443333" },
        { customerName: "Fernanda Costa", status: "CLIENT_CONTACTED", subscriberId: "HC1007", customerAddress: "Rua Haddock Lobo, 300", customerPhone: "11933332222" },
        { customerName: "Paulo Rocha", status: "ACTIVATION_PENDING", subscriberId: "HC1008", customerAddress: "Av. Rebouças, 1200", customerPhone: "11922221111" },
        { customerName: "Luciana Mello", status: "COMPLETED", subscriberId: "HC1009", customerAddress: "Rua da Consolação, 2000", customerPhone: "11911110000" },
        { customerName: "Marcos Vinicius", status: "SUPPORT_REQUIRED", subscriberId: "HC1010", customerAddress: "Av. Brigadeiro, 3000", customerPhone: "11900009999" },
    ];

    console.log(`Criando ${orderData.length} ordens de exemplo...`);

    for (const data of orderData) {
        await prisma.order.create({
            data: {
                ...data,
                tenantId: tId,
                logisticsOperatorId: oId,
                type: "REPAIR_ONT_SWAP",
                source: "PORTAL",
                externalId: `VTAL-${Math.floor(Math.random() * 90000) + 10000}`,
            }
        });
    }

    console.log("Ordens de exemplo criadas com sucesso!");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
