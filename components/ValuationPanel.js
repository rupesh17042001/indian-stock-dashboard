'use client'

function fmtINR(val) {
  if (val === null || val === undefined) return '—'
  return '₹' + parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtN(val, dec=2) {
  if (val === null || val === undefined) return '—'
  return parseFloat(val).toFixed(dec)
}

export default function ValuationPanel({ data }) {
  if (!data) return null
  const p = data.currentPrice

  const blocks = [
    {
      id: 'lynch_current',
      title: 'Peter Lynch Fair Value (Current)',
      desc: 'Based on Trailing 12-Month EPS and Current Expected Growth.',
      formula: 'EPS × (Growth + Div Yield) × 100',
      value: data.peterLynchFairValue,
      mos: data.peterLynchFairValue ? ((data.peterLynchFairValue - p) / data.peterLynchFairValue) * 100 : null,
      mosLabel: 'Discount to Fair Value',
      signal: data.peterLynchFairValue > p * 1.1 ? 'bull' : data.peterLynchFairValue < p * 0.9 ? 'bear' : 'neut',
      tag: data.peterLynchFairValue > p * 1.1 ? '🟢 Discount' : data.peterLynchFairValue < p * 0.9 ? '🔴 Premium' : '🟡 Fair',
      details: [
        { l: 'Trailing EPS', v: fmtINR(data.eps) },
        { l: 'Growth Rate', v: fmtN((data.earningsGrowth||0)*100) + '%' },
        { l: 'Div Yield', v: fmtN((data.divYield||0)*100) + '%' }
      ]
    }
  ]

  if (data.peterLynchFairValueNextQtr && data.nextQtrValues) {
    blocks.push({
      id: 'lynch_next_qtr',
      title: 'Peter Lynch Fair Value (Next Qtr)',
      desc: 'Based on Annualized Next Quarter EPS Estimates.',
      formula: '(Next Qtr EPS × 4) × (Next Qtr Growth + Div Yield) × 100',
      value: data.peterLynchFairValueNextQtr,
      mos: data.peterLynchFairValueNextQtr ? ((data.peterLynchFairValueNextQtr - p) / data.peterLynchFairValueNextQtr) * 100 : null,
      mosLabel: 'Discount to Fair Value',
      signal: data.peterLynchFairValueNextQtr > p * 1.1 ? 'bull' : data.peterLynchFairValueNextQtr < p * 0.9 ? 'bear' : 'neut',
      tag: data.peterLynchFairValueNextQtr > p * 1.1 ? '🟢 Discount' : data.peterLynchFairValueNextQtr < p * 0.9 ? '🔴 Premium' : '🟡 Fair',
      details: [
        { l: 'Annualized EPS', v: fmtINR(data.nextQtrValues.eps) },
        { l: 'Growth Rate', v: fmtN(data.nextQtrValues.growth * 100) + '%' },
        { l: 'Div Yield', v: fmtN(data.nextQtrValues.divYield * 100) + '%' }
      ]
    })
  }

  if (data.peterLynchFairValueNextYear && data.nextYearValues) {
    blocks.push({
      id: 'lynch_next_year',
      title: 'Peter Lynch Fair Value (Next Year)',
      desc: 'Based on Next Year (FY) EPS Estimates.',
      formula: 'Next Year EPS × (Next Year Growth + Div Yield) × 100',
      value: data.peterLynchFairValueNextYear,
      mos: data.peterLynchFairValueNextYear ? ((data.peterLynchFairValueNextYear - p) / data.peterLynchFairValueNextYear) * 100 : null,
      mosLabel: 'Discount to Fair Value',
      signal: data.peterLynchFairValueNextYear > p * 1.1 ? 'bull' : data.peterLynchFairValueNextYear < p * 0.9 ? 'bear' : 'neut',
      tag: data.peterLynchFairValueNextYear > p * 1.1 ? '🟢 Discount' : data.peterLynchFairValueNextYear < p * 0.9 ? '🔴 Premium' : '🟡 Fair',
      details: [
        { l: 'Expected EPS', v: fmtINR(data.nextYearValues.eps) },
        { l: 'Growth Rate', v: fmtN(data.nextYearValues.growth * 100) + '%' },
        { l: 'Div Yield', v: fmtN(data.nextYearValues.divYield * 100) + '%' }
      ]
    })
  }

  const targetPrice = data.peterLynchFairValue ? data.peterLynchFairValue * 1.15 : null
  const upsidePct = targetPrice && p ? ((targetPrice - p) / p) * 100 : null

  return (
    <div className="main-grid">
      <div className="card" style={{ gridColumn: '1 / -1', background: 'rgba(59,130,246,0.05)', borderColor: 'rgba(59,130,246,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h3 style={{ fontSize: 14, color: 'var(--blue2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Price</h3>
            <div style={{ fontSize: 36, fontWeight: 800, fontFamily: 'Space Grotesk' }}>{fmtINR(targetPrice)}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
              Target = Current Peter Lynch Fair Value × 1.15 buffer
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 4 }}>Current Price</div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Space Grotesk', color: 'var(--text)' }}>{fmtINR(p)}</div>
            {upsidePct !== null && (
              <div className={`tag ${upsidePct >= 0 ? 'tag-green' : 'tag-red'}`} style={{ marginTop: 8, fontSize: 14, padding: '6px 12px' }}>
                {upsidePct >= 0 ? '▲' : '▼'} {fmtN(Math.abs(upsidePct))}% {upsidePct >= 0 ? 'Upside' : 'Downside'}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gridColumn: '1 / -1' }}>
        {blocks.map(b => {
          return (
            <div key={b.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Space Grotesk', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {b.title}
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{b.desc}</p>
                </div>
                <span className={`val-signal ${b.signal}`}>{b.tag}</span>
              </div>
              
              <div style={{ padding: '16px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>Calculated Value</div>
                  <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Space Grotesk' }}>
                    {typeof b.value === 'number' ? fmtINR(b.value) : b.value || '—'}
                  </div>
                </div>
                {b.mos !== null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{b.mosLabel}</div>
                    <div className={`val-number ${b.mos > 0 ? 'accent-green' : 'accent-red'}`}>
                      {b.mos > 0 ? '+' : ''}{fmtN(b.mos)}%
                    </div>
                  </div>
                )}
              </div>

              <div style={{ background: 'var(--navy)', padding: 12, borderRadius: 8, fontSize: 11, fontFamily: 'monospace', color: 'var(--text3)', marginBottom: 16 }}>
                {b.formula}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {b.details.map(d => (
                  <div key={d.l}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{d.l}</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{d.v}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
