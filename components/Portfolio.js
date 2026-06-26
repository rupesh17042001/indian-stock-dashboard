'use client'
import { useState, useEffect } from 'react'

function fmtN(val, dec=2) { return parseFloat(val).toFixed(dec) }
function fmtINR(val) { return '₹' + parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

export default function Portfolio() {
  const [list, setList] = useState([])
  const [input, setInput] = useState({ ticker: '', qty: '', price: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('stock_portfolio')
      if (stored) setList(JSON.parse(stored))
    } catch (e) {}
  }, [])

  useEffect(() => {
    if (list.length > 0) {
      localStorage.setItem('stock_portfolio', JSON.stringify(list))
    } else {
      localStorage.removeItem('stock_portfolio')
    }
  }, [list])

  const addPosition = async (e) => {
    e.preventDefault()
    if (!input.ticker || !input.qty || !input.price) return
    const sym = input.ticker.trim().toUpperCase()
    
    setLoading(true)
    try {
      const res = await fetch(`/api/stock?ticker=${encodeURIComponent(sym)}`)
      const data = await res.json()
      if (res.ok && !data.error) {
        setList(prev => [...prev, {
          id: Date.now(),
          ticker: sym,
          qty: parseFloat(input.qty),
          buyPrice: parseFloat(input.price),
          currentPrice: data.currentPrice,
          name: data.shortName
        }])
        setInput({ ticker: '', qty: '', price: '' })
      } else {
        alert('Stock not found. Try NSE ticker like RELIANCE')
      }
    } catch (e) {
      alert('Error fetching stock')
    } finally {
      setLoading(false)
    }
  }

  const remove = (id) => {
    setList(list.filter(item => item.id !== id))
  }

  const refreshAll = async () => {
    setLoading(true)
    const nextList = []
    for (const item of list) {
      try {
        const res = await fetch(`/api/stock?ticker=${encodeURIComponent(item.ticker)}`)
        const data = await res.json()
        if (res.ok && !data.error) {
          nextList.push({ ...item, currentPrice: data.currentPrice })
        } else nextList.push(item)
      } catch (e) {
        nextList.push(item)
      }
    }
    setList(nextList)
    setLoading(false)
  }

  const totalInvested = list.reduce((sum, item) => sum + (item.buyPrice * item.qty), 0)
  const totalValue = list.reduce((sum, item) => sum + (item.currentPrice * item.qty), 0)
  const totalPL = totalValue - totalInvested
  const totalPLPct = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0

  return (
    <div className="main-grid" style={{ gridTemplateColumns: '1fr' }}>
      
      <div className="grid-3" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Total Invested</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Space Grotesk' }}>{fmtINR(totalInvested)}</div>
        </div>
        <div className="card">
          <div className="card-title">Current Value</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Space Grotesk', color: 'var(--blue2)' }}>{fmtINR(totalValue)}</div>
        </div>
        <div className="card">
          <div className="card-title">Total P&amp;L</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Space Grotesk', color: totalPL >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {totalPL >= 0 ? '+' : ''}{fmtINR(totalPL)}
          </div>
          <div style={{ fontSize: 13, color: totalPL >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {totalPLPct >= 0 ? '▲' : '▼'} {fmtN(Math.abs(totalPLPct))}%
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Space Grotesk' }}>Holdings</h2>
          </div>
          <form onSubmit={addPosition} className="input-row" style={{ margin: 0, width: '100%', maxWidth: 500 }}>
            <input className="input-field" placeholder="Ticker" value={input.ticker} onChange={e => setInput({...input, ticker: e.target.value})} disabled={loading} style={{ width: 100 }} required />
            <input className="input-field" type="number" step="any" placeholder="Qty" value={input.qty} onChange={e => setInput({...input, qty: e.target.value})} disabled={loading} style={{ width: 80 }} required />
            <input className="input-field" type="number" step="any" placeholder="Avg Price" value={input.price} onChange={e => setInput({...input, price: e.target.value})} disabled={loading} style={{ width: 100 }} required />
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? '...' : '+ Add'}</button>
            <button type="button" className="btn" style={{ background: 'rgba(255,255,255,0.06)' }} onClick={refreshAll} disabled={loading}>⟳</button>
          </form>
        </div>

        {list.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text3)' }}>No holdings yet. Add a trade above.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Buy Price</th>
                  <th style={{ textAlign: 'right' }}>CMP</th>
                  <th style={{ textAlign: 'right' }}>Invested</th>
                  <th style={{ textAlign: 'right' }}>Cur. Value</th>
                  <th style={{ textAlign: 'right' }}>P&amp;L</th>
                  <th style={{ textAlign: 'right' }}>Change %</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {list.map(item => {
                  const inv = item.qty * item.buyPrice
                  const val = item.qty * item.currentPrice
                  const pl = val - inv
                  const plPct = (pl / inv) * 100
                  return (
                    <tr key={item.id}>
                      <td><a href={`?ticker=${item.ticker}`} style={{ color: 'var(--blue2)', textDecoration: 'none' }}>{item.ticker}</a></td>
                      <td className="num">{item.qty}</td>
                      <td className="num">{fmtINR(item.buyPrice)}</td>
                      <td className="num">{fmtINR(item.currentPrice)}</td>
                      <td className="num">{fmtINR(inv)}</td>
                      <td className="num">{fmtINR(val)}</td>
                      <td className="num" style={{ color: pl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        {pl >= 0 ? '+' : ''}{fmtINR(pl)}
                      </td>
                      <td className="num" style={{ color: pl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        {pl >= 0 ? '+' : ''}{fmtN(plPct)}%
                      </td>
                      <td>
                        <button onClick={() => remove(item.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16 }}>×</button>
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
