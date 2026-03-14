import http from 'http';

http.get('http://localhost:3001/api/dashboard/stats', (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        try {
            const parsedData = JSON.parse(rawData);
            console.log('--- SLA Compliance Data (Last 6 months) ---');
            console.log(JSON.stringify(parsedData.slaCompliance, null, 2));
        } catch (e) {
            console.error(e.message);
        }
    });
}).on('error', (e) => {
    console.error(`Error: ${e.message}`);
});
