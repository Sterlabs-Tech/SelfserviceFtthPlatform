async function test() {
    try {
        const res = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'niraldo.junior@gmail.com', password: '123' })
        });
        const data = await res.json();
        console.log('STATUS:', res.status, 'BODY:', data);
    } catch (e: any) {
        console.error('ERROR:', e.message);
    }
}
test();
