import axios from 'axios';

const BASE = process.env.BASE_URL || 'http://localhost:3333';
const ITERATIONS = parseInt(process.env.ITERATIONS || '50', 10);

function ms(start) {
  const diff = process.hrtime.bigint() - start;
  return Number(diff) / 1e6;
}

function stats(times) {
  times.sort((a,b)=>a-b);
  const sum = times.reduce((s,v)=>s+v,0);
  const avg = sum / times.length;
  const median = times[Math.floor(times.length/2)];
  const p95 = times[Math.floor(times.length*0.95)];
  return { avg, median, p95, min: times[0], max: times[times.length-1] };
}

async function registerAndAuth() {
  const email = `perf_${Date.now()}@example.com`;
  const password = 'PerfPass123!';

  const registerRes = await axios.post(`${BASE}/api/auth/register`, { email, password });
  return registerRes.data.token;
}

async function createIndex(token) {
  const payload = {
    name: 'perf-index',
    selected: ['BTC'],
    weights: [1],
    initialInvestment: 1000,
  };

  const res = await axios.post(`${BASE}/api/indices`, payload, { headers: { Authorization: `Bearer ${token}` } });
  return res.data.index.id;
}

async function measureEndpoint(name, fn, iterations = ITERATIONS) {
  const times = [];
  for (let i=0;i<iterations;i++) {
    const start = process.hrtime.bigint();
    await fn();
    times.push(ms(start));
  }
  console.log(`\n== ${name} (${iterations} reqs) ==`);
  console.table(stats(times));
  return stats(times);
}

async function main(){
  console.log('Benchmark base URL:', BASE);
  console.log('Iterations:', ITERATIONS);
  try {
    const token = await registerAndAuth();
    console.log('Got token');
    const indexId = await createIndex(token);
    console.log('Created index', indexId);

    const headers = { Authorization: `Bearer ${token}` };

    await measureEndpoint('/api/auth/verify', async () => {
      await axios.get(`${BASE}/api/auth/verify`, { headers });
    });

    await measureEndpoint('/api/indices', async () => {
      await axios.get(`${BASE}/api/indices`, { headers });
    });

    await measureEndpoint(`/api/indices/:indexId`, async () => {
      await axios.get(`${BASE}/api/indices/${indexId}`, { headers });
    });

    console.log('\nDone. Run server with and without REDIS_URL to compare.');
  } catch (e) {
    console.error('Benchmark error:', e.response?.data || e.message || e);
    process.exit(1);
  }
}

main();
