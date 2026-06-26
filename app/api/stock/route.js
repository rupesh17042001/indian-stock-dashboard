import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const ticker = searchParams.get('ticker')?.toUpperCase().trim()

  if (!ticker) {
    return Response.json({ error: 'Ticker is required' }, { status: 400 })
  }

  // Yahoo Finance uses .NS for NSE, .BO for BSE
  const symbol = ticker.includes('.') ? ticker : `${ticker}.NS`

  try {
    const modules = [
      'price',
      'summaryDetail',
      'defaultKeyStatistics',
      'financialData',
      'incomeStatementHistory',
      'balanceSheetHistory',
      'cashflowStatementHistory',
      'earningsTrend',
    ];

    let result;
    try {
        result = await yahooFinance.quoteSummary(symbol, { modules });
    } catch (e) {
        return Response.json({ error: `Stock "${ticker}" not found. Try NSE symbol like RELIANCE, TCS, INFY` }, { status: 404 });
    }
    
    let historyRes = { quotes: [] };
    try {
        historyRes = await yahooFinance.chart(symbol, {
            period1: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
            interval: '1d'
        });
    } catch (e) {
        // ignore missing history
    }

    const price = result.price || {}
    const sd = result.summaryDetail || {}
    const ks = result.defaultKeyStatistics || {}
    const fd = result.financialData || {}
    const is = result.incomeStatementHistory?.incomeStatementHistory || []
    const bs = result.balanceSheetHistory?.balanceSheetStatements || []
    const cf = result.cashflowStatementHistory?.cashflowStatements || []
    const earningsTrend = result.earningsTrend?.trend || []

    const priceHistory = (historyRes.quotes || []).map(d => ({
        date: new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        close: d.close !== null && d.close !== undefined ? parseFloat(d.close.toFixed(2)) : null,
    })).filter(d => d.close !== null).slice(-252);

    // ── Build structured response ──────────────────────────────────────────
    const currentPrice   = price?.regularMarketPrice ?? null
    const prevClose      = price?.regularMarketPreviousClose ?? null
    const change         = currentPrice && prevClose ? currentPrice - prevClose : null
    const changePct      = change && prevClose ? (change / prevClose) * 100 : null

    const eps            = ks?.trailingEps ?? fd?.revenuePerShare ?? null
    const bookValue      = ks?.bookValue ?? null
    const pe             = sd?.trailingPE ?? price?.trailingPE ?? null
    const pb             = ks?.priceToBook ?? null
    const divYield       = sd?.dividendYield ?? 0
    const marketCap      = price?.marketCap ?? null
    const weekHigh52     = sd?.fiftyTwoWeekHigh ?? null
    const weekLow52      = sd?.fiftyTwoWeekLow ?? null
    const beta           = sd?.beta ?? null
    const roe            = fd?.returnOnEquity ?? null
    const roa            = fd?.returnOnAssets ?? null
    const grossMargin    = fd?.grossMargins ?? null
    const operMargin     = fd?.operatingMargins ?? null
    const profitMargin   = fd?.profitMargins ?? null
    const debtToEquity   = fd?.debtToEquity ?? null
    const currentRatio   = fd?.currentRatio ?? null
    const totalDebt      = fd?.totalDebt ?? null
    const fcf            = fd?.freeCashflow ?? null
    const revenueGrowth  = fd?.revenueGrowth ?? null
    const earningsGrowth = fd?.earningsGrowth ?? null
    const avgVolume      = sd?.averageVolume ?? null
    const sharesOut      = ks?.sharesOutstanding ?? null
    const fwdPE          = sd?.forwardPE ?? null
    const pegRatio       = ks?.pegRatio ?? null
    const evEbitda       = ks?.enterpriseToEbitda ?? null
    const evRevenue      = ks?.enterpriseToRevenue ?? null
    const shortName      = price?.shortName || price?.longName || ticker
    const longName       = price?.longName || shortName
    const sector         = price?.sector || null
    const industry       = price?.industry || null
    const exchange       = price?.exchangeName || 'NSE'

    // ── Historical Income Statement (last 4 years) ─────────────────────────
    const annuals = is.slice(0, 4).map(stmt => ({
      year: new Date(stmt.endDate).getFullYear(),
      revenue:    stmt.totalRevenue,
      netIncome:  stmt.netIncome,
      ebit:       stmt.ebit,
      grossProfit:stmt.grossProfit,
      eps:        stmt.dilutedEPS ?? (eps ?? null),
    })).filter(a => a.year)

    const bsAnnuals = bs.slice(0, 4).map(stmt => ({
      year:        new Date(stmt.endDate).getFullYear(),
      totalAssets: stmt.totalAssets,
      totalLiab:   stmt.totalLiab,
      equity:      stmt.totalStockholderEquity,
      cash:        stmt.cash,
      totalDebt:   stmt.longTermDebt,
    })).filter(a => a.year)

    const cfAnnuals = cf.slice(0, 4).map(stmt => ({
      year:   new Date(stmt.endDate).getFullYear(),
      opCF:   stmt.totalCashFromOperatingActivities,
      capex:  stmt.capitalExpenditures,
      fcf:    stmt.freeCashflow ?? 
              ((stmt.totalCashFromOperatingActivities || 0) + (stmt.capitalExpenditures || 0)),
    })).filter(a => a.year)

    // ── Valuation Calculations ─────────────────────────────────────────────
    // EPS growth rate: use YoY if available, fallback to earningsGrowth
    const epsGrowthRate = earningsGrowth ?? 0.12
    const peterLynchScore = eps && pe && epsGrowthRate
      ? (epsGrowthRate * 100 + divYield * 100) / pe : null

    const pegyRatio = pe && epsGrowthRate && divYield
      ? pe / ((epsGrowthRate + divYield) * 100) : null

    // EPS-based fair value: Peter Lynch Fair Value
    // Fair P/E = Growth Rate + Dividend Yield
    const peterLynchFairValue = eps && epsGrowthRate > 0
      ? eps * ((epsGrowthRate + divYield) * 100) : null

    const targetPrice = peterLynchFairValue ? peterLynchFairValue * 1.15 : null
    const upsidePct = targetPrice && currentPrice ? ((targetPrice - currentPrice) / currentPrice) * 100 : null
    const earningsYield = eps && currentPrice ? (eps / currentPrice) * 100 : null

    // ── Piotroski F-Score ──────────────────────────────────────────────────
    const latestIS = is[0] || {}; const prevIS = is[1] || {}
    const latestBS = bs[0] || {}; const prevBS = bs[1] || {}
    const latestCF = cf[0] || {}

    const f1 = latestIS?.netIncome > 0 ? 1 : 0
    const f2 = latestCF?.totalCashFromOperatingActivities > 0 ? 1 : 0
    const f3 = (roe || 0) > 0.05 ? 1 : 0
    const f4 = (latestCF?.totalCashFromOperatingActivities || 0) >
               (latestIS?.netIncome || 0) ? 1 : 0
    const f5 = (() => {
      const d0 = latestBS?.longTermDebt || 0
      const d1 = prevBS?.longTermDebt || 0
      const e0 = latestBS?.totalStockholderEquity || 1
      const e1 = prevBS?.totalStockholderEquity || 1
      return (d0/e0) <= (d1/e1) ? 1 : 0
    })()
    const f6 = (currentRatio || 0) > 1 ? 1 : 0
    const f7 = (() => {
      const s0 = latestBS?.commonStock || 0
      const s1 = prevBS?.commonStock || 0
      return s0 <= s1 ? 1 : 0
    })()
    const f8 = (() => {
      const gm0 = (latestIS?.grossProfit || 0) / (latestIS?.totalRevenue || 1)
      const gm1 = (prevIS?.grossProfit || 0) / (prevIS?.totalRevenue || 1)
      return gm0 >= gm1 ? 1 : 0
    })()
    const f9 = (() => {
      const r0 = latestIS?.totalRevenue || 0
      const a0 = latestBS?.totalAssets || 1
      const r1 = prevIS?.totalRevenue || 0
      const a1 = prevBS?.totalAssets || 1
      return (r0/a0) >= (r1/a1) ? 1 : 0
    })()
    const piotroski = f1+f2+f3+f4+f5+f6+f7+f8+f9
    const piotroskiSignals = { f1, f2, f3, f4, f5, f6, f7, f8, f9 }

    // ── Altman Z-Score (proxy) ─────────────────────────────────────────────
    const totalAssets = latestBS?.totalAssets || 1
    const totalLiab   = latestBS?.totalLiab || 0
    const workingCap  = (latestBS?.totalCurrentAssets || 0) - (latestBS?.totalCurrentLiabilities || 0)
    const retainedEarnings = latestBS?.retainedEarnings || 0
    const ebitVal     = latestIS?.ebit || 0
    const revenues    = latestIS?.totalRevenue || 0
    const mvEquity    = marketCap || 0
    const bookDebt    = totalLiab || 1

    const X1 = workingCap / totalAssets
    const X2 = retainedEarnings / totalAssets
    const X3 = ebitVal / totalAssets
    const X4 = mvEquity / bookDebt
    const X5 = revenues / totalAssets
    const altmanZ = 1.2*X1 + 1.4*X2 + 3.3*X3 + 0.6*X4 + 1.0*X5

    // ── Financial Health Score /100 ────────────────────────────────────────
    let healthScore = 0
    healthScore += Math.min(piotroski / 9 * 40, 40)
    healthScore += Math.min((roe || 0) / 0.15 * 10, 10)
    healthScore += Math.min((profitMargin || 0) / 0.10 * 10, 10)
    healthScore += Math.min((operMargin || 0) / 0.15 * 10, 10)
    if ((debtToEquity||999) < 50) healthScore += 10
    else if ((debtToEquity||999) < 100) healthScore += 5
    if ((currentRatio || 0) > 1.5) healthScore += 5
    else if ((currentRatio || 0) > 1) healthScore += 2.5
    if (piotroski >= 2 && (latestCF?.totalCashFromOperatingActivities||0) > 0) healthScore += 5
    healthScore = Math.min(Math.round(healthScore), 100)

    // ── Overall Signal ─────────────────────────────────────────────────────
    let overallSignal = 'HOLD'
    if (peterLynchScore !== null && peterLynchScore < 1) overallSignal = 'BUY'
    else if ((peterLynchScore || 0) > 2) overallSignal = 'AVOID'

    return Response.json({
      ticker,
      symbol,
      shortName,
      longName,
      sector,
      industry,
      exchange,
      // Price
      currentPrice,
      prevClose,
      change,
      changePct,
      weekHigh52,
      weekLow52,
      beta,
      avgVolume,
      marketCap,
      // Ratios
      pe,
      fwdPE,
      pb,
      eps,
      bookValue,
      divYield,
      pegRatio,
      evEbitda,
      evRevenue,
      sharesOut,
      // Profitability
      roe,
      roa,
      grossMargin,
      operMargin,
      profitMargin,
      debtToEquity,
      currentRatio,
      totalDebt,
      fcf,
      revenueGrowth,
      earningsGrowth,
      // Valuation
      peterLynchScore,
      pegyRatio,
      peterLynchFairValue,
      targetPrice,
      upsidePct,
      earningsYield,
      // Health
      piotroski,
      piotroskiSignals,
      altmanZ,
      healthScore,
      overallSignal,
      // Historical
      annuals,
      bsAnnuals,
      cfAnnuals,
      priceHistory,
      // Estimates
      earningsTrend,
    })
  } catch (err) {
    console.error('Stock API error:', err)
    return Response.json(
      { error: 'Failed to fetch data. Check ticker or try again.' },
      { status: 500 }
    )
  }
}
