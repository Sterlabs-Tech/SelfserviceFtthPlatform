const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  try {
    const operator = await prisma.logisticsOperator.findFirst({
      select: {
          id: true,
          zipCode: true,
          city: true
      }
    });
    console.log('Successfully queried LogisticsOperator. Address fields exist in model.');
    if (operator) {
        console.log('Sample operator:', JSON.stringify(operator, null, 2));
    } else {
        console.log('No operators found in database, but schema is valid.');
    }
  } catch (error) {
    console.error('Error verifying LogisticsOperator address:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
