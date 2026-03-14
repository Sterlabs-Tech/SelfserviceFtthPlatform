const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyze() {
  try {
    console.log('--- Table Sizes ---');
    const tableSizes = await prisma.$queryRaw`
      SELECT relname AS table_name, n_live_tup AS row_count
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC;
    `;
    tableSizes.forEach(t => console.log(`Table: ${t.table_name} | Rows: ${t.row_count}`));

    console.log('\n--- Index Usage ---');
    const indexUsage = await prisma.$queryRaw`
      SELECT relname AS table_name, indexrelname AS index_name, idx_scan
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public';
    `;
    indexUsage.forEach(idx => console.log(`Table: ${idx.table_name} | Index: ${idx.index_name} | Scans: ${idx.idx_scan}`));

    console.log('\n--- Missing Indexes (Heuristic) ---');
    const missingIndexes = await prisma.$queryRaw`
      SELECT relname AS table_name, seq_scan, seq_tup_read
      FROM pg_stat_user_tables
      WHERE seq_scan > 50
      ORDER BY seq_tup_read DESC;
    `;
    missingIndexes.forEach(mi => console.log(`Table: ${mi.table_name} | Seq Scans: ${mi.seq_scan} | Seq Tup Read: ${mi.seq_tup_read}`));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

analyze();
