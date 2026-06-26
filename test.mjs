import { GET } from './app/api/stock/route.js';

async function test() {
  const req = { url: 'http://localhost/api/stock?ticker=WIPRO' };
  const res = await GET(req);
  const j = await res.json();
  const nextQtr = j.earningsTrend?.find(t => t.period === '+1q');
  const nextYear = j.earningsTrend?.find(t => t.period === '+1y');
  console.log("Next Qtr EPS:", nextQtr?.earningsEstimate?.avg, "Growth:", nextQtr?.growth);
  console.log("Next Yr EPS:", nextYear?.earningsEstimate?.avg, "Growth:", nextYear?.growth);
}
test();
