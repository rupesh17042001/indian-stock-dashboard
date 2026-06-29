import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function test(query) {
  try {
    const result = await yahooFinance.search(query, { quotesCount: 5, newsCount: 0 });
    console.log(JSON.stringify(result.quotes, null, 2));
  } catch (e) {
    console.error(`Error for ${query}:`, e.message);
  }
}

await test('Tata Motors');
