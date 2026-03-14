const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function checkSqlite() {
  let db;
  try {
    db = await open({
      filename: './prisma/dev.db',
      driver: sqlite3.Database
    });

    const tables = ['LogisticsOperator', 'User', '"Order"', 'Stock', 'MaterialItem'];
    for (const table of tables) {
      try {
        const count = await db.get(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`${table}: ${count.count} items`);
      } catch (e) {
        console.log(`${table}: Table not found or error`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (db) await db.close();
  }
}

checkSqlite();
