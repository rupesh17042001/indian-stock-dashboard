import { GET } from './app/api/stock/route.js';

async function test(ticker) {
  const req = { url: `http://localhost/api/stock?ticker=${ticker}` };
  const res = await GET(req);
  const j = await res.json();
  const g = (j.earningsGrowth||0)*100, d = (j.divYield||0)*100;
  console.log(`\n=== ${ticker} ===`);
  console.log(`EPS: ₹${j.eps}, Growth: ${g.toFixed(1)}%, DivYield: ${d.toFixed(1)}%, PE: ${j.pe?.toFixed(1)}`);
  console.log(`Score = (${g.toFixed(1)} + ${d.toFixed(1)}) / ${j.pe?.toFixed(1)} = ${j.peterLynchScore?.toFixed(3)} [${j.peterLynchScore > 1 ? 'UNDERVALUED ✅' : 'OVERVALUED ❌'}]`);
  console.log(`Fair Value = ₹${j.eps} × ${(g+d).toFixed(1)} = ₹${j.peterLynchFairValue?.toFixed(2)}`);
}

await test('INFY');
await test('TCS');
await test('WIPRO');
