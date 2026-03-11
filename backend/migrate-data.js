const { PrismaClient } = require('@prisma/client');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

// Prisma client configured for Supabase PostgreSQL (writing)
const pgPrisma = new PrismaClient();

async function migrateData() {
  console.log('--- Iniciando Migração de Dados (SQLite -> Supabase) ---');

  let db;
  try {
    // Open SQLite database directly
    db = await open({
      filename: './prisma/dev.db',
      driver: sqlite3.Database
    });

    // 1. Tenants
    const tenants = await db.all('SELECT * FROM Tenant');
    console.log(`Migrando ${tenants.length} Tenants...`);
    for (const tenant of tenants) {
      await pgPrisma.tenant.upsert({
        where: { id: tenant.id },
        update: {},
        create: {
            ...tenant,
            active: !!tenant.active,
            createdAt: new Date(tenant.createdAt),
            updatedAt: new Date(tenant.updatedAt)
        }
      });
    }

    // 2. Logistics Operators
    const operators = await db.all('SELECT * FROM LogisticsOperator');
    console.log(`Migrando ${operators.length} Operadores Logísticos...`);
    for (const op of operators) {
      await pgPrisma.logisticsOperator.upsert({
        where: { id: op.id },
        update: {},
        create: {
            ...op,
            active: !!op.active,
            createdAt: new Date(op.createdAt),
            updatedAt: new Date(op.updatedAt)
        }
      });
    }

    // 3. Users
    const users = await db.all('SELECT * FROM User');
    console.log(`Migrando ${users.length} Usuários...`);
    for (const user of users) {
      await pgPrisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: {
            ...user,
            active: !!user.active,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt)
        }
      });
    }

    // 4. Stocks
    const stocks = await db.all('SELECT * FROM Stock');
    console.log(`Migrando ${stocks.length} itens de Estoque...`);
    for (const stock of stocks) {
      await pgPrisma.stock.upsert({
        where: { id: stock.id },
        update: {},
        create: {
            ...stock,
            createdAt: new Date(stock.createdAt),
            updatedAt: new Date(stock.updatedAt)
        }
      });
    }

    // 5. Orders
    const orders = await db.all('SELECT * FROM "Order"');
    console.log(`Migrando ${orders.length} Ordens...`);
    for (const order of orders) {
      // Explicitly map only valid fields based on current Prisma schema
      await pgPrisma.order.upsert({
        where: { id: order.id },
        update: {},
        create: {
          id: order.id,
          tenantId: order.tenantId,
          type: order.type,
          subscriberId: order.subscriberId,
          customerName: order.customerName,
          customerAddress: order.customerAddress,
          customerPhone: order.customerPhone,
          externalId: order.externalId,
          source: order.source,
          status: order.status,
          logisticsOperatorId: order.logisticsOperatorId,
          delivererId: order.delivererId,
          designatedOntModel: order.designatedOntModel,
          designatedOntSerial: order.designatedOntSerial,
          nfeNumber: order.nfeNumber,
          slaTarget: order.slaTarget ? new Date(order.slaTarget) : null,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt)
        }
      });
    }

    // 6. Order History
    const histories = await db.all('SELECT * FROM OrderHistory');
    console.log(`Migrando ${histories.length} Históricos de Ordens...`);
    for (const history of histories) {
      // Explicitly map only valid fields based on current Prisma schema
      await pgPrisma.orderHistory.upsert({
        where: { id: history.id },
        update: {},
        create: {
            id: history.id,
            orderId: history.orderId,
            timestamp: new Date(history.timestamp),
            responsibleName: history.responsibleName,
            responsibleId: history.responsibleId,
            eventType: history.eventType,
            oldStatus: history.oldStatus,
            newStatus: history.newStatus,
            reason: history.reason,
            evidenceUrl: history.evidenceUrl
        }
      });
    }

    console.log('--- Migração Concluída com Sucesso! ---');

  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    if (db) await db.close();
    await pgPrisma.$disconnect();
  }
}

migrateData();
