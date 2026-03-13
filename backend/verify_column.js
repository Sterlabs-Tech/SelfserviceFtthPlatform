const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  try {
    const orders = await prisma.order.findMany({
      take: 1,
      select: {
          id: true,
          openingOrigin: true
      }
    });
    console.log('Successfully queried orders. openingOrigin exists in model.');
    console.log('Sample order:', JSON.stringify(orders[0], null, 2));
  } catch (error) {
    console.error('Error verifying openingOrigin:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
