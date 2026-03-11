const { Client } = require('pg');
const connectionString = "postgresql://postgres.tgkecxmbsqqjcucfizkd:zwvyF79naObFyact@aws-0-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require";

const client = new Client({
  connectionString: connectionString,
});

async function test() {
  try {
    console.log('Connecting to Supabase pooler...');
    await client.connect();
    console.log('Connected successfully!');
    const res = await client.query('SELECT NOW()');
    console.log('Result:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('Connection error details:', err);
    process.exit(1);
  }
}

test();
