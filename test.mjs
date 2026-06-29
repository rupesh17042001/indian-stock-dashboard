import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function test(ticker) {
  try {
    const modules = [
      'price',
      'summaryDetail',
      'defaultKeyStatistics',
      'financialData'
    ];
    
    console.log(`\n=== Fetching ${ticker} ===`);
    const result = await yahooFinance.quoteSummary(ticker, { modules });
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.error(`Error for ${ticker}:`, e.message);
  }
}

await test('TCS.NS');
