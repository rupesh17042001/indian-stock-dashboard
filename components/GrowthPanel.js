'use client'
import { useEffect, useRef } from 'react'

function fmtCr(val) {
  if (!val) return '—'
  return '₹' + (val / 10000000).toFixed(0) + ' Cr'
}

function BarChart({ data, title, color }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!data || data.length === 0) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    const pad = { t: 20, r: 10, b: 30, l: 40 }
    const w = W - pad.l - pad.r
    const h = H - pad.t - pad.b

    const maxVal = Math.max(...data.map(d => d.val)) * 1.1 || 1

    // axes
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t+h); ctx.lineTo(pad.l+w, pad.t+h); ctx.stroke()

    const barW = (w / data.length) * 0.6
    const space = (w / data.length) * 0.4

    data.forEach((d, i) => {
      const x = pad.l + space/2 + i * (barW + space)
      const barH = (d.val / maxVal) * h
      const y = pad.t + h - barH

      // Bar
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0])
      ctx.fill()

      // Label
      ctx.fillStyle = '#94a3b8'
      ctx.font = '10px Inter'
      ctx.textAlign = 'center'
      ctx.fillText(d.label, x + barW/2, pad.t + h + 15)

      // Value tooltip text if room
      if (barH > 20 && barW > 30) {
        ctx.fillStyle = '#fff'
        const valStr = (d.val / 10000000).toFixed(0)
        ctx.fillText(valStr, x + barW/2, y + 14)
      }
    })

  }, [data, color])

  return (
    <div>
      <h4 style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>{title} (₹ Cr)</h4>
      <canvas ref={canvasRef} style={{ width: '100%', height: 180, display: 'block' }} />
    </div>
  )
}

export default function GrowthPanel({ data }) {
  if (!data || !data.annuals || data.annuals.length === 0) {
    return <div className="card">Income statement history not available for this stock.</div>
  }

  const { annuals } = data

  const revData = annuals.map(a => ({ label: a.year, val: a.revenue })).filter(d => d.val)
  const niData  = annuals.map(a => ({ label: a.year, val: a.netIncome })).filter(d => d.val)
  const ebitData= annuals.map(a => ({ label: a.year, val: a.ebit })).filter(d => d.val)

  return (
    <div className="main-grid">
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <div className="section-header">
          <div className="section-dot" style={{ background: 'var(--green)' }} />
          <h3 className="section-title">Income Statement (Last 4 Years)</h3>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Metric</th>
                {annuals.map(a => <th key={a.year} style={{ textAlign: 'right' }}>{a.year}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Revenue</td>
                {annuals.map(a => <td key={a.year} className="num">{fmtCr(a.revenue)}</td>)}
              </tr>
              <tr>
                <td>Gross Profit</td>
                {annuals.map(a => <td key={a.year} className="num">{fmtCr(a.grossProfit)}</td>)}
              </tr>
              <tr>
                <td>Operating Income (EBIT)</td>
                {annuals.map(a => <td key={a.year} className="num">{fmtCr(a.ebit)}</td>)}
              </tr>
              <tr>
                <td>Net Income</td>
                {annuals.map(a => <td key={a.year} className="num">{fmtCr(a.netIncome)}</td>)}
              </tr>
              <tr>
                <td>Diluted EPS (₹)</td>
                {annuals.map(a => <td key={a.year} className="num">{a.eps ? a.eps.toFixed(2) : '—'}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <BarChart data={revData} title="Revenue Trend" color="#3b82f6" />
      </div>

      <div className="card">
        <BarChart data={niData} title="Net Income Trend" color="#14b8a6" />
      </div>

      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <div className="section-header">
          <div className="section-dot" style={{ background: 'var(--purple)' }} />
          <h3 className="section-title">Growth &amp; Margins</h3>
        </div>
        <div className="kpi-grid">
          <div className="kpi">
            <div className="kpi-label">Revenue Growth (YoY)</div>
            <div className={`kpi-value ${(data.revenueGrowth||0)>0.1?'green':(data.revenueGrowth||0)>0?'amber':'red'}`}>
              {data.revenueGrowth ? (data.revenueGrowth * 100).toFixed(2) + '%' : '—'}
            </div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Earnings Growth (YoY)</div>
            <div className={`kpi-value ${(data.earningsGrowth||0)>0.1?'green':(data.earningsGrowth||0)>0?'amber':'red'}`}>
              {data.earningsGrowth ? (data.earningsGrowth * 100).toFixed(2) + '%' : '—'}
            </div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Gross Margin</div>
            <div className="kpi-value">{data.grossMargin ? (data.grossMargin * 100).toFixed(2) + '%' : '—'}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Net Margin</div>
            <div className="kpi-value blue">{data.profitMargin ? (data.profitMargin * 100).toFixed(2) + '%' : '—'}</div>
          </div>
        </div>
      </div>

      {data.earningsTrend && data.earningsTrend.length > 0 && (
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="section-header">
            <div className="section-dot" style={{ background: 'var(--blue)' }} />
            <h3 className="section-title">Analyst Estimates</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th style={{ textAlign: 'right' }}>EPS Estimate</th>
                  <th style={{ textAlign: 'right' }}>Revenue Estimate</th>
                  <th style={{ textAlign: 'right' }}>Expected Growth</th>
                </tr>
              </thead>
              <tbody>
                {data.earningsTrend.map((trend) => {
                  const periodLabel = {
                    '0q': 'Current Quarter',
                    '+1q': 'Next Quarter',
                    '0y': 'Current Year',
                    '+1y': 'Next Year'
                  }[trend.period] || trend.period

                  const eps = trend.earningsEstimate?.avg
                  const rev = trend.revenueEstimate?.avg
                  const growth = trend.growth

                  return (
                    <tr key={trend.period}>
                      <td><strong>{periodLabel}</strong></td>
                      <td className="num">{eps ? `₹${eps.toFixed(2)}` : '—'}</td>
                      <td className="num">{rev ? fmtCr(rev) : '—'}</td>
                      <td className="num" style={{ color: growth > 0 ? 'var(--green)' : growth < 0 ? 'var(--red)' : 'var(--text)' }}>
                        {growth ? (growth * 100).toFixed(2) + '%' : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
