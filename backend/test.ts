import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    const mapped = users.map(u => ({ email: `'${u.email}'`, pass: `'${u.password}'`, active: u.active }));
    console.log(JSON.stringify(mapped, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
