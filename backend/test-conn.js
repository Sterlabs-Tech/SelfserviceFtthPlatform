const net = require('net');
const client = net.connect({ host: 'db.tgkecxmbsqqjcucfizkd.supabase.co', port: 5432 }, () => {
  console.log('Connected to Supabase!');
  client.end();
});
client.on('error', (err) => {
  console.error('Connection failed:', err.message);
  process.exit(1);
});
