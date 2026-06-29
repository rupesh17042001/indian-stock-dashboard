import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();

  if (!query) {
    return Response.json([]);
  }

  try {
    const result = await yahooFinance.search(query, {
      quotesCount: 15,
      newsCount: 0
    });

    // Filter to show only Equities (stocks), preferably Indian exchanges (NSI/NSE, BSE)
    const suggestions = (result.quotes || [])
      .filter(q => q.quoteType === 'EQUITY' && q.isYahooFinance)
      .map(q => ({
        symbol: q.symbol,
        name: q.longname || q.shortname || q.symbol,
        exchange: q.exchDisp || q.exchange || 'Unknown'
      }));

    // Optionally sort/prioritize NSE/BSE over others
    const indianExchanges = ['NSE', 'NSI', 'BSE', 'Bombay'];
    suggestions.sort((a, b) => {
      const aIsIndian = indianExchanges.includes(a.exchange) ? 1 : 0;
      const bIsIndian = indianExchanges.includes(b.exchange) ? 1 : 0;
      return bIsIndian - aIsIndian;
    });

    return Response.json(suggestions.slice(0, 8)); // Return top 8 suggestions
  } catch (error) {
    console.error('Search API Error:', error);
    return Response.json([], { status: 500 });
  }
}
