import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function test() {
  try {
    const res = await yahooFinance.quoteSummary('INFY.NS', { modules: ['earningsTrend'] });
    console.log(JSON.stringify(res.earningsTrend, null, 2));
  } catch (e) {
    console.error(e);
  }
}
test();
