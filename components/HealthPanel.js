'use client'

function fmtN(val, dec=2) {
  if (val === null || val === undefined) return '—'
  return parseFloat(val).toFixed(dec)
}
function fmtPct(val) {
  if (val === null || val === undefined) return '—'
  return (parseFloat(val) * 100).toFixed(2) + '%'
}

export default function HealthPanel({ data }) {
  if (!data) return null

  const pio = data.piotroskiSignals || {}
  
  const pioSignals = [
    { id: 'f1', title: 'Positive Net Income', val: pio.f1, desc: 'Is trailing net income positive?' },
    { id: 'f2', title: 'Positive Operating Cash Flow', val: pio.f2, desc: 'Is operating cash flow positive?' },
    { id: 'f3', title: 'Higher ROA', val: pio.f3, desc: 'Is ROA higher than previous year?' },
    { id: 'f4', title: 'Quality of Earnings', val: pio.f4, desc: 'Is operating cash flow > net income?' },
    { id: 'f5', title: 'Decreasing Leverage', val: pio.f5, desc: 'Is long-term debt to equity lower?' },
    { id: 'f6', title: 'Increasing Liquidity', val: pio.f6, desc: 'Is current ratio higher?' },
    { id: 'f7', title: 'No Dilution', val: pio.f7, desc: 'No new shares issued?' },
    { id: 'f8', title: 'Higher Gross Margin', val: pio.f8, desc: 'Is gross margin higher?' },
    { id: 'f9', title: 'Higher Asset Turnover', val: pio.f9, desc: 'Is asset turnover higher?' },
  ]

  return (
    <div className="main-grid">
      
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div className="score-circle" style={{ '--pct': data.healthScore, width: 140, height: 140 }}>
            <div className="score-inner">
              <div className={`score-num ${data.healthScore >= 70 ? 'accent-green' : data.healthScore >= 50 ? 'accent-amber' : 'accent-red'}`} style={{ fontSize: 36 }}>{data.healthScore}</div>
              <div className="score-denom">/100</div>
            </div>
          </div>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Space Grotesk', marginBottom: 8 }}>Overall Financial Health</h2>
            <p style={{ color: 'var(--text2)', maxWidth: 600, lineHeight: 1.6 }}>
              A composite score evaluating profitability, leverage, liquidity, and operating efficiency.
              Scores above 70 indicate a very strong balance sheet and cash generation.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-header">
          <div className="section-dot" />
          <h3 className="section-title">Piotroski F-Score</h3>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
          <div style={{ fontSize: 48, fontWeight: 800, fontFamily: 'Space Grotesk', lineHeight: 1, color: data.piotroski >= 7 ? 'var(--green)' : data.piotroski >= 4 ? 'var(--amber)' : 'var(--red)' }}>
            {data.piotroski}
          </div>
          <div style={{ fontSize: 18, color: 'var(--text3)' }}>/ 9</div>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {pioSignals.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
              <div className={`signal-dot ${s.val === 1 ? 'pass' : 'fail'}`} style={{ marginTop: 6 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: s.val === 1 ? 'var(--text)' : 'var(--text2)' }}>{s.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="section-header">
          <div className="section-dot" style={{ background: 'var(--gradient2)' }} />
          <h3 className="section-title">Key Solvency Metrics</h3>
        </div>
        <div className="kpi-grid">
          <div className="kpi">
            <div className="kpi-label">Debt to Equity</div>
            <div className={`kpi-value ${(data.debtToEquity||999)<50?'green':(data.debtToEquity||0)<100?'amber':'red'}`}>{data.debtToEquity !== null ? fmtN(data.debtToEquity/100, 2) + '×' : '—'}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Current Ratio</div>
            <div className={`kpi-value ${(data.currentRatio||0)>2?'green':(data.currentRatio||0)>1?'amber':'red'}`}>{fmtN(data.currentRatio)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">ROE</div>
            <div className={`kpi-value ${(data.roe||0)>0.15?'green':(data.roe||0)>0.10?'amber':'red'}`}>{fmtPct(data.roe)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">ROA</div>
            <div className={`kpi-value ${(data.roa||0)>0.05?'green':'amber'}`}>{fmtPct(data.roa)}</div>
          </div>
        </div>
      </div>

    </div>
  )
}
