const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');
  
  const tenant = await prisma.tenant.upsert({
    where: { id: 'default-tenant' },
    update: {},
    create: {
      id: 'default-tenant',
      name: 'V.tal Principal',
      active: true,
      allowedServices: 'REPAIR,INSTALLATION',
      allowedUFs: 'SP,RJ,MG'
    }
  });
  console.log('Tenant created:', tenant.name);

  const operator = await prisma.logisticsOperator.upsert({
    where: { id: 'default-operator' },
    update: {},
    create: {
      id: 'default-operator',
      name: 'Operador Logístico 01',
      active: true,
      regions: 'SP,RJ',
      slaHours: 24,
      businessHours: '08:00-18:00'
    }
  });
  console.log('Operator created:', operator.name);

  const user = await prisma.user.upsert({
    where: { email: 'niraldo.junior@gmail.com' },
    update: { password: '123' },
    create: {
      name: 'Niraldo Junior',
      email: 'niraldo.junior@gmail.com',
      password: '123',
      profile: 'ADMIN',
      active: true,
      tenantId: tenant.id
    }
  });
  console.log('User created:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
