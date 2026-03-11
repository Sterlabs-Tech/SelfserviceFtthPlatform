const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function listTables() {
  let db;
  try {
    db = await open({
      filename: './dev.db',
      driver: sqlite3.Database
    });

    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    console.log("Tables in dev.db:");
    tables.forEach(t => console.log(`- ${t.name}`));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (db) await db.close();
  }
}

listTables();
