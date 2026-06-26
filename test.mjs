import { GET } from './app/api/stock/route.js';

async function test() {
  const req = { url: 'http://localhost/api/stock?ticker=WIPRO' };
  const res = await GET(req);
  const j = await res.json();
  console.log(JSON.stringify({
    ticker: j.ticker,
    eps: j.eps, 
    growth: j.earningsGrowth, 
    divYield: j.divYield, 
    pe: j.pe, 
    peterLynchScore: j.peterLynchScore, 
    peterLynchFairValue: j.peterLynchFairValue,
    targetPrice: j.targetPrice,
    rawValues: {
      pe: j.pe,
      eps: j.eps,
      divYield: j.divYield,
      earningsGrowth: j.earningsGrowth
    }
  }, null, 2));
}
test();
