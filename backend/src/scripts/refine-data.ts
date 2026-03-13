
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CITIES_BY_STATE: any = {
    'SP': ['São Paulo', 'Campinas', 'São Bernardo do Campo', 'Santo André', 'Osasco'],
    'RJ': ['Rio de Janeiro', 'Niterói', 'Duque de Caxias', 'São Gonçalo'],
    'MG': ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora'],
    'PR': ['Curitiba', 'Londrina', 'Maringá'],
    'RS': ['Porto Alegre', 'Caxias do Sul', 'Pelotas'],
    'PE': ['Recife', 'Jaboatão dos Guararapes', 'Olinda'],
    'BA': ['Salvador', 'Feira de Santana', 'Vitória da Conquista']
};

const NEIGHBORHOODS = [
    'Centro', 'Vila Mariana', 'Moema', 'Jardins', 'Pinheiros', 'Itaim Bibi', 'Brooklin',
    'Tijuca', 'Copacabana', 'Barra da Tijuca', 'Botafogo', 'Flamengo',
    'Lourdes', 'Savassi', 'Funcionários', 'Santo Antônio',
    'Batel', 'Bigorrilho', 'Água Verde', 'Santa Felicidade',
    'Moinhos de Vento', 'Petrópolis', 'Bela Vista',
    'Boa Viagem', 'Madalena', 'Graças',
    'Pituba', 'Barra', 'Graça', 'Rio Vermelho'
];

const STREETS = [
    'Avenida Paulista', 'Rua Augusta', 'Rua Oscar Freire', 'Rua da Consolação',
    'Rua Domingos de Morais', 'Avenida Rio Branco', 'Avenida Atlântica',
    'Rua das Laranjeiras', 'Avenida Afonso Pena', 'Rua dos Inconfidentes',
    'Rua das Flores', 'Avenida Sete de Setembro', 'Rua da Aurora'
];

const STATUS_FLOW = [
    'AWAITING_DISPATCH',
    'EQUIPMENT_SEPARATED',
    'AWAITING_PICKUP',
    'DISPATCHED_TO_DELIVERER',
    'EN_ROUTE',
    'DELIVERY_CONFIRMED',
    'ONT_ACTIVATION_STARTED',
    'ONT_ASSOCIATION_FAILED',
    'SUPPORT_REQUIRED',
    'COMPLETED'
];

function getRandom(arr: any[]) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateZip() {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
}

async function refineData() {
    console.log('--- Starting Data Refinement ---');
    const orders = await prisma.order.findMany({ take: 50 }); // Limit to 50 for quick verification
    console.log(`Found ${orders.length} orders to update.`);

    let count = 0;
    for (const order of orders) {
        count++;
        if (count % 5 === 0) console.log(`Processing order ${count}/${orders.length}...`);
        
        const state = getRandom(Object.keys(CITIES_BY_STATE));
        const city = getRandom(CITIES_BY_STATE[state]);
        const neighborhood = getRandom(NEIGHBORHOODS);
        const street = getRandom(STREETS);
        const number = Math.floor(Math.random() * 2000) + 1;
        const zip = generateZip();

        // Update Order
        await prisma.order.update({
            where: { id: order.id },
            data: {
                customerAddress: `${street}, ${number}`,
                customerNeighborhood: neighborhood,
                customerCity: city,
                customerState: state,
                customerZip: zip
            }
        });

        // WIPE History
        await prisma.orderHistory.deleteMany({
            where: { orderId: order.id }
        });

        // Create History Sequence
        const currentStatus = order.status;
        const statusIndex = STATUS_FLOW.indexOf(currentStatus);
        
        // Initial Event
        let historyEntries = [
            {
                orderId: order.id,
                responsibleName: 'Sistema / Registro Automático',
                eventType: 'ORDER_CREATED',
                newStatus: 'AWAITING_DISPATCH',
                reason: 'Ordem aberta via portal de autoatendimento',
                timestamp: new Date(Date.now() - (statusIndex + 1) * 3600000) // Hours ago
            }
        ];

        // Intermediate Events
        if (statusIndex > 0) {
            for (let i = 1; i <= statusIndex; i++) {
                historyEntries.push({
                    orderId: order.id,
                    responsibleName: i % 2 === 0 ? 'Operador Logístico' : 'NIO Core',
                    eventType: 'STATUS_UPDATED',
                    newStatus: STATUS_FLOW[i],
                    reason: `Transição automática para status ${STATUS_FLOW[i]}`,
                    timestamp: new Date(Date.now() - (statusIndex - i + 0.5) * 3600000)
                });
            }
        }

        // Save History
        for (const entry of historyEntries) {
            await prisma.orderHistory.create({ data: entry });
        }
    }

    console.log('--- Data Refinement Complete ---');
}

refineData()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
