'use client'
import { useState, useEffect } from 'react'

function fmtN(val, dec=2) {
  if (val === null || val === undefined) return '—'
  return parseFloat(val).toFixed(dec)
}
function fmtINR(val) {
  if (val === null || val === undefined) return '—'
  return '₹' + parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function Watchlist() {
  const [list, setList] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  // Load from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('stock_watchlist')
      if (stored) setList(JSON.parse(stored))
    } catch (e) {}
  }, [])

  // Save to local storage
  useEffect(() => {
    if (list.length > 0) {
      localStorage.setItem('stock_watchlist', JSON.stringify(list))
    }
  }, [list])

  const addStock = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    const sym = input.trim().toUpperCase()
    if (list.find(item => item.ticker === sym)) {
      setInput('')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/stock?ticker=${encodeURIComponent(sym)}`)
      const data = await res.json()
      if (res.ok && !data.error) {
        setList(prev => [...prev, data])
      } else {
        alert('Stock not found. Try NSE ticker like RELIANCE')
      }
    } catch (e) {
      alert('Error fetching stock')
    } finally {
      setLoading(false)
      setInput('')
    }
  }

  const remove = (ticker) => {
    const next = list.filter(item => item.ticker !== ticker)
    setList(next)
    if (next.length === 0) localStorage.removeItem('stock_watchlist')
  }

  const refreshAll = async () => {
    setLoading(true)
    const nextList = []
    for (const item of list) {
      try {
        const res = await fetch(`/api/stock?ticker=${encodeURIComponent(item.ticker)}`)
        const data = await res.json()
        if (res.ok && !data.error) nextList.push(data)
        else nextList.push(item)
      } catch (e) {
        nextList.push(item)
      }
    }
    setList(nextList)
    setLoading(false)
  }

  return (
    <div className="main-grid" style={{ gridTemplateColumns: '1fr' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Space Grotesk' }}>My Watchlist</h2>
            <p style={{ color: 'var(--text2)', fontSize: 13 }}>Track your favorite stocks and their valuation signals</p>
          </div>
          <form onSubmit={addStock} className="input-row" style={{ margin: 0, width: '100%', maxWidth: 400 }}>
            <input 
              className="input-field" 
              placeholder="Add NSE ticker (e.g. TCS)" 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              disabled={loading}
            />
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? '...' : '+ Add'}
            </button>
            <button type="button" className="btn" style={{ background: 'rgba(255,255,255,0.06)' }} onClick={refreshAll} disabled={loading}>
              ⟳
            </button>
          </form>
        </div>

        {list.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text3)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👀</div>
            <p>Your watchlist is empty.</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Add a ticker above to start tracking valuations.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>P/E</th>
                  <th style={{ textAlign: 'right' }}>ROE</th>
                  <th style={{ textAlign: 'right' }}>F-Score</th>
                  <th style={{ textAlign: 'right' }}>MoS %</th>
                  <th style={{ textAlign: 'center' }}>Signal</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {list.map(item => {
                  const signalClass = { BUY: 'bull', HOLD: 'neut', AVOID: 'bear' }[item.overallSignal] || 'neut'
                  return (
                    <tr key={item.ticker}>
                      <td>
                        <a href={`?ticker=${item.ticker}`} style={{ color: 'var(--blue2)', textDecoration: 'none' }}>
                          {item.ticker}
                        </a>
                      </td>
                      <td className="num">{fmtINR(item.currentPrice)}</td>
                      <td className="num">{fmtN(item.pe)}</td>
                      <td className="num" style={{ color: item.roe > 0.15 ? 'var(--green)' : 'inherit' }}>
                        {item.roe ? (item.roe * 100).toFixed(1) + '%' : '—'}
                      </td>
                      <td className="num" style={{ color: item.piotroski >= 7 ? 'var(--green)' : 'inherit' }}>
                        {item.piotroski}/9
                      </td>
                      <td className="num" style={{ color: item.mosGraham > 10 ? 'var(--green)' : item.mosGraham < -10 ? 'var(--red)' : 'inherit' }}>
                        {item.mosGraham ? item.mosGraham.toFixed(1) + '%' : '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`val-signal ${signalClass}`}>{item.overallSignal}</span>
                      </td>
                      <td>
                        <button onClick={() => remove(item.ticker)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16 }}>×</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
