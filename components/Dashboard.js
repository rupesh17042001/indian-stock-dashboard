'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ValuationPanel from './ValuationPanel'
import HealthPanel    from './HealthPanel'
import GrowthPanel    from './GrowthPanel'
import Watchlist      from './Watchlist'
import Portfolio      from './Portfolio'
import PriceChart     from './PriceChart'

const POPULAR = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'WIPRO', 'ICICIBANK', 'BAJFINANCE', 'SBIN', 'LT', 'MARUTI']
const TABS = ['Overview', 'Valuation', 'Health', 'Growth', 'Watchlist', 'Portfolio']

function fmt(val, prefix = '', suffix = '', decimals = 2) {
  if (val === null || val === undefined) return '—'
  const n = parseFloat(val)
  if (isNaN(n)) return '—'
  if (Math.abs(n) >= 1e12) return prefix + (n / 1e12).toFixed(decimals) + 'T' + suffix
  if (Math.abs(n) >= 1e9)  return prefix + (n / 1e9).toFixed(decimals) + 'B' + suffix
  if (Math.abs(n) >= 1e7)  return prefix + (n / 1e7).toFixed(decimals) + 'Cr' + suffix
  if (Math.abs(n) >= 1e5)  return prefix + (n / 1e5).toFixed(decimals) + 'L' + suffix
  return prefix + n.toFixed(decimals) + suffix
}

function fmtPct(val) {
  if (val === null || val === undefined) return '—'
  return (parseFloat(val) * 100).toFixed(2) + '%'
}
function fmtN(val, dec=2) {
  if (val === null || val === undefined) return '—'
  return parseFloat(val).toFixed(dec)
}
function fmtINR(val) {
  if (val === null || val === undefined) return '—'
  return '₹' + parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function Dashboard() {
  const searchParams = useSearchParams()
  const router       = useRouter()

  const [ticker,   setTicker]   = useState(searchParams.get('ticker') || '')
  const [input,    setInput]    = useState(searchParams.get('ticker') || '')
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [tab,      setTab]      = useState('Overview')
  const [toast,    setToast]    = useState(false)
  
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const fetchStock = useCallback(async (sym) => {
    if (!sym) return
    setLoading(true); setError(null); setData(null)
    try {
      const res = await fetch(`/api/stock?ticker=${encodeURIComponent(sym)}`)
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to fetch')
      setData(json)
      setTicker(sym)
      router.replace(`?ticker=${sym}`, { scroll: false })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    const t = searchParams.get('ticker')
    if (t && t !== ticker) { setInput(t); fetchStock(t) }
    else if (t) fetchStock(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!input.trim() || input.toUpperCase() === ticker) {
      setSuggestions([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(input)}`)
        const json = await res.json()
        setSuggestions(json)
      } catch(e) {}
    }, 300)
    return () => clearTimeout(timer)
  }, [input, ticker])

  const handleSearch = (e) => {
    e.preventDefault()
    setShowSuggestions(false)
    if (input.trim()) fetchStock(input.trim().toUpperCase())
  }

  const share = () => {
    const url = `${window.location.origin}?ticker=${ticker}`
    navigator.clipboard.writeText(url)
    setToast(true)
    setTimeout(() => setToast(false), 2500)
  }

  const upDown = data?.changePct >= 0 ? 'up' : 'down'
  const signalClass = { BUY: 'buy', HOLD: 'hold', AVOID: 'avoid' }[data?.overallSignal] || 'hold'
  const signalEmoji = { BUY: '🟢', HOLD: '🟡', AVOID: '🔴' }[data?.overallSignal] || '🟡'
  const signalLabel = { BUY: 'Strong BUY', HOLD: 'HOLD / Fairly Valued', AVOID: 'AVOID / Overvalued' }[data?.overallSignal] || 'HOLD'

  // 52W range %
  const range52 = data?.weekHigh52 && data?.weekLow52 && data?.currentPrice
    ? ((data.currentPrice - data.weekLow52) / (data.weekHigh52 - data.weekLow52)) * 100
    : 50

  return (
    <div className="app-bg">
      {/* ── Navbar ────────────────────────────────────────────── */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="logo">
            <span className="logo-icon">📈</span>
            <span>StockSense India</span>
          </div>

          <form className="search-wrap" onSubmit={handleSearch}>
            <input
              className="search-input"
              value={input}
              onChange={e => {
                setInput(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Search by company name or ticker..."
            />
            <button type="submit" className="search-btn">GO</button>

            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {suggestions.map(s => (
                  <div key={s.symbol} className="suggestion-item" onClick={() => {
                    setInput(s.symbol)
                    fetchStock(s.symbol)
                    setShowSuggestions(false)
                  }}>
                    <div className="sugg-name">{s.name}</div>
                    <div className="sugg-sym">{s.symbol} &middot; {s.exchange}</div>
                  </div>
                ))}
              </div>
            )}
          </form>

          <div className="nav-links">
            {TABS.map(t => (
              <button key={t} className={`nav-link ${tab === t && data ? 'active' : ''}`}
                onClick={() => { if (data) setTab(t) }}>{t}</button>
            ))}
          </div>

          {data && (
            <button className="share-btn" onClick={share}>
              🔗 Share
            </button>
          )}
        </div>
      </nav>

      {/* ── Loading ──────────────────────────────────────────── */}
      {loading && (
        <div className="loading-wrap">
          <div className="spinner" />
          <p className="loading-text">Fetching live data for <strong>{input}</strong>…</p>
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────── */}
      {!loading && error && (
        <div className="error-wrap">
          <div className="error-icon">⚠️</div>
          <div className="error-title">Data Not Found</div>
          <p className="error-msg">{error}</p>
          <p className="error-msg" style={{ marginTop: 8, fontSize: 12, color: 'var(--text3)' }}>
            Try: RELIANCE, TCS, INFY, HDFCBANK, WIPRO
          </p>
        </div>
      )}

      {/* ── Landing ──────────────────────────────────────────── */}
      {!loading && !error && !data && (
        <div className="landing">
          <div className="landing-logo">📈</div>
          <h1 className="landing-title">Indian Stock Valuation</h1>
          <p className="landing-sub">
            Simple, easy-to-understand stock analysis for NSE &amp; BSE. 
            Find out if a stock is fairly valued and financially healthy. Free, live, and shareable.
          </p>
          <div className="landing-chips">
            {POPULAR.map(sym => (
              <button key={sym} className="landing-chip"
                onClick={() => { setInput(sym); fetchStock(sym) }}>
                {sym}
              </button>
            ))}
          </div>
          <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 8 }}>
            Search any NSE symbol above ↑ or click a popular stock
          </p>
        </div>
      )}

      {/* ── Main Dashboard ───────────────────────────────────── */}
      {!loading && !error && data && (
        <>
          {/* Hero header */}
          <div className="hero">
            <div className="hero-top">
              <div className="company-info">
                <div className="company-name">{data.longName || data.shortName}</div>
                <div className="company-meta">
                  <span className="badge">{data.ticker} · {data.exchange}</span>
                  {data.sector && <span className="badge sector">{data.sector}</span>}
                  {data.industry && <span className="badge">{data.industry}</span>}
                </div>
              </div>
              <div className="price-block">
                <div className="price-main">{fmtINR(data.currentPrice)}</div>
                <div className="price-change">
                  <span className={`change-badge ${upDown}`}>
                    {upDown === 'up' ? '▲' : '▼'} {fmtINR(data.change)} ({fmtN(data.changePct, 2)}%)
                  </span>
                  <span style={{ color: 'var(--text3)', fontSize: 12 }}>Today</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab nav */}
          <div className="tab-nav">
            {TABS.map(t => (
              <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`}
                onClick={() => setTab(t)}>{t}</button>
            ))}
          </div>

          {/* ── OVERVIEW TAB ──────────────────────────────────── */}
          {tab === 'Overview' && (
            <div className="main-grid">
              {/* Signal banner */}
              <div className={`signal-banner ${signalClass}`}>
                <div className="signal-emoji">{signalEmoji}</div>
                <div className="signal-text">
                  <h2>{signalLabel}</h2>
                  <p>
                    Based on our analysis of the company's growth potential and financial health.
                  </p>
                </div>
                {data.targetPrice && (
                  <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>Target Price</div>
                    <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--text)' }}>
                      {fmtINR(data.targetPrice)}
                    </div>
                    <div style={{ fontSize: 12, color: data.upsidePct >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {data.upsidePct >= 0 ? '▲' : '▼'} {fmtN(Math.abs(data.upsidePct))}% upside
                    </div>
                  </div>
                )}
              </div>

              {/* Price chart + 52W */}
              <div className="card" style={{ gridColumn: '1 / -1' }}>
                <div className="card-title"><span className="card-title-icon">📉</span>1-Year Price History</div>
                <PriceChart data={data.priceHistory} currentPrice={data.currentPrice} />
                <div style={{ marginTop: 16 }}>
                  <div className="range-bar-labels">
                    <span>52W Low: {fmtINR(data.weekLow52)}</span>
                    <span style={{ color: 'var(--text2)', fontSize: 11 }}>Current: {fmtINR(data.currentPrice)}</span>
                    <span>52W High: {fmtINR(data.weekHigh52)}</span>
                  </div>
                  <div className="range-bar-wrap">
                    <div className="range-bar-track">
                      <div className="range-bar-fill" style={{ width: `${Math.min(Math.max(range52, 2), 98)}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* KPI Grid */}
              <div className="card" style={{ gridColumn: '1 / -1' }}>
                <div className="card-title"><span className="card-title-icon">📊</span>Key Metrics</div>
                <div className="kpi-grid">
                  <div className="kpi">
                    <div className="kpi-label">P/E Ratio</div>
                    <div className={`kpi-value ${(data.pe||99)<25?'green':(data.pe||0)>40?'red':'amber'}`}>{fmtN(data.pe)}</div>
                    <div className="kpi-sub">Price to Earnings</div>
                  </div>
                  <div className="kpi">
                    <div className="kpi-label">Market Cap</div>
                    <div className="kpi-value gold">{fmt(data.marketCap, '₹')}</div>
                    <div className="kpi-sub">Company Size</div>
                  </div>
                  <div className="kpi">
                    <div className="kpi-label">ROE</div>
                    <div className={`kpi-value ${(data.roe||0)>0.15?'green':(data.roe||0)>0.10?'amber':'red'}`}>{fmtPct(data.roe)}</div>
                    <div className="kpi-sub">Return on Equity (Profitability)</div>
                  </div>
                  <div className="kpi">
                    <div className="kpi-label">Div Yield</div>
                    <div className="kpi-value amber">{data.divYield ? fmtN(data.divYield * 100) + '%' : '—'}</div>
                    <div className="kpi-sub">Annual Dividend Return</div>
                  </div>
                  <div className="kpi">
                    <div className="kpi-label">Face Value</div>
                    <div className="kpi-value">{data.faceValue ? `₹${data.faceValue}` : '—'}</div>
                    <div className="kpi-sub">Per Share</div>
                  </div>
                </div>
              </div>

              {/* Quick valuation summary */}
              <div className="card">
                <div className="card-title"><span className="card-title-icon">📐</span>Quick Valuation</div>
                {[
                  { label: 'Fair Value (Next Quarter)', value: data.scoreNextQtr ? fmtINR(data.currentPrice * data.scoreNextQtr) : '—', sub: `Based on expected short-term growth`, signal: (data.scoreNextQtr||0) > 1 ? 'bull' : (data.scoreNextQtr||0) < 0.8 ? 'bear' : 'neut', tag: (data.scoreNextQtr||0) > 1 ? '🟢 Undervalued' : (data.scoreNextQtr||0) < 0.8 ? '🔴 Overvalued' : '🟡 Fair' },
                  { label: 'Fair Value (Current Year)', value: data.scoreCurrYear ? fmtINR(data.currentPrice * data.scoreCurrYear) : '—', sub: `Based on expected full-year growth`, signal: (data.scoreCurrYear||0) > 1 ? 'bull' : (data.scoreCurrYear||0) < 0.8 ? 'bear' : 'neut', tag: '' },
                  { label: 'Fair Value (Next Year)', value: data.scoreNextYear ? fmtINR(data.currentPrice * data.scoreNextYear) : '—', sub: `Based on expected long-term growth`, signal: (data.scoreNextYear||0) > 1 ? 'bull' : (data.scoreNextYear||0) < 0.8 ? 'bear' : 'neut', tag: '' }
                ].map(item => (
                  <div className="val-row" key={item.label}>
                    <div>
                      <div className="val-label">{item.label}</div>
                      <div className="val-formula">{item.sub}</div>
                    </div>
                    <div className="val-right">
                      <div className={`val-number ${item.signal === 'bull' ? 'accent-green' : item.signal === 'bear' ? 'accent-red' : ''}`}>{item.value}</div>
                      {item.tag && <span className={`val-signal ${item.signal}`}>{item.tag}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick health */}
              <div className="card">
                <div className="card-title"><span className="card-title-icon">🏥</span>Financial Health</div>
                <div className="score-wrap">
                  <div className="score-circle" style={{ '--pct': data.healthScore }}>
                    <div className="score-inner">
                      <div className={`score-num ${data.healthScore >= 70 ? 'accent-green' : data.healthScore >= 50 ? 'accent-amber' : 'accent-red'}`}>{data.healthScore}</div>
                      <div className="score-denom">/100</div>
                    </div>
                  </div>
                  <div className="score-details">
                    <div className="score-item">
                      <div className="score-item-label">Piotroski F-Score</div>
                      <div className={`score-item-val ${data.piotroski>=7?'accent-green':data.piotroski>=4?'accent-amber':'accent-red'}`}>{data.piotroski}/9</div>
                    </div>
                    <div className="score-item">
                      <div className="score-item-label">Is the company profitable? (ROE)</div>
                      <div className={`score-item-val ${(data.roe||0)>0.15?'accent-green':data.roe?'accent-amber':'accent-red'}`}>{fmtPct(data.roe)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'Valuation'  && <ValuationPanel data={data} />}
          {tab === 'Health'     && <HealthPanel    data={data} />}
          {tab === 'Growth'     && <GrowthPanel    data={data} />}
          {tab === 'Watchlist'  && <Watchlist />}
          {tab === 'Portfolio'  && <Portfolio />}
        </>
      )}

      {/* Share toast */}
      {toast && <div className="share-toast">✅ Link copied to clipboard!</div>}
    </div>
  )
}
