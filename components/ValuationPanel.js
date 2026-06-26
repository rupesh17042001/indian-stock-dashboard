'use client'
import { useState } from 'react'

function fmtINR(val) {
  if (val === null || val === undefined) return '—'
  return '₹' + parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtN(val, dec=2) {
  if (val === null || val === undefined) return '—'
  return parseFloat(val).toFixed(dec)
}

export default function ValuationPanel({ data }) {
  const [activeModels, setActiveModels] = useState({
    graham: true,
    lynch: true,
    dcf: true
  })

  if (!data) return null
  const p = data.currentPrice

  const blocks = [
    {
      id: 'graham',
      title: 'Graham Number',
      desc: 'Benjamin Graham\'s formula for intrinsic value.',
      formula: '√(22.5 × EPS × Book Value)',
      value: data.grahamNumber,
      mos: data.mosGraham,
      mosLabel: 'Margin of Safety',
      signal: (data.mosGraham||0) > 20 ? 'bull' : (data.mosGraham||0) < 0 ? 'bear' : 'neut',
      tag: (data.mosGraham||0) > 20 ? '🟢 Buy' : (data.mosGraham||0) < 0 ? '🔴 Overvalued' : '🟡 Fair',
      details: [
        { l: 'EPS', v: fmtINR(data.eps) },
        { l: 'Book Value', v: fmtINR(data.bookValue) },
        { l: 'Base Multiple', v: '22.5' }
      ]
    },
    {
      id: 'lynch',
      title: 'Peter Lynch Fair Value',
      desc: 'Fair Value = EPS × (Growth Rate + Dividend Yield)',
      formula: 'EPS × (Growth + Div Yield) × 100',
      value: data.peterLynchFairValue,
      mos: data.peterLynchFairValue ? ((data.peterLynchFairValue - p) / data.peterLynchFairValue) * 100 : null,
      mosLabel: 'Discount to Fair Value',
      signal: data.peterLynchFairValue > p * 1.1 ? 'bull' : data.peterLynchFairValue < p * 0.9 ? 'bear' : 'neut',
      tag: data.peterLynchFairValue > p * 1.1 ? '🟢 Discount' : data.peterLynchFairValue < p * 0.9 ? '🔴 Premium' : '🟡 Fair',
      details: [
        { l: 'Trailing EPS', v: fmtINR(data.eps) },
        { l: 'Growth Rate', v: fmtN((data.earningsGrowth||0.12)*100) + '%' },
        { l: 'Score (GARP)', v: fmtN(data.peterLynchScore) }
      ]
    },
    {
      id: 'dcf',
      title: 'DCF (Gordon Growth)',
      desc: 'Dividend-based valuation.',
      formula: 'Annual Dividend ÷ (Required Return − Growth Rate)',
      value: data.dcfValue,
      mos: data.dcfValue ? ((data.dcfValue - p) / data.dcfValue) * 100 : null,
      mosLabel: 'Discount to Fair Value',
      signal: data.dcfValue > p * 1.1 ? 'bull' : data.dcfValue < p * 0.9 ? 'bear' : 'neut',
      tag: data.dcfValue > p * 1.1 ? '🟢 Discount' : data.dcfValue < p * 0.9 ? '🔴 Premium' : '🟡 Fair',
      details: [
        { l: 'Annual Dividend', v: fmtINR(data.annualDiv) },
        { l: 'Required Return', v: '12%' },
        { l: 'Terminal Growth', v: '4%' }
      ]
    }
  ]

  // Calculate dynamic blended target price
  const selectedValues = blocks
    .filter(b => activeModels[b.id])
    .map(b => b.value)
    .filter(v => v && v > 0)
    
  const blendedFV = selectedValues.length > 0
    ? selectedValues.reduce((a, b) => a + b, 0) / selectedValues.length
    : null
    
  const targetPrice = blendedFV ? blendedFV * 1.15 : null
  const upsidePct = targetPrice && p ? ((targetPrice - p) / p) * 100 : null

  const toggleModel = (id) => {
    setActiveModels(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  return (
    <div className="main-grid">
      <div className="card" style={{ gridColumn: '1 / -1', background: 'rgba(59,130,246,0.05)', borderColor: 'rgba(59,130,246,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h3 style={{ fontSize: 14, color: 'var(--blue2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Blended Target Price</h3>
            <div style={{ fontSize: 36, fontWeight: 800, fontFamily: 'Space Grotesk' }}>{fmtINR(targetPrice)}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
              Target = Fair Value × 1.15 buffer
            </div>
            
            {/* Toggle Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              {blocks.map(b => (
                <button 
                  key={`toggle-${b.id}`}
                  onClick={() => toggleModel(b.id)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '12px',
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: activeModels[b.id] ? 'var(--blue)' : 'var(--border)',
                    background: activeModels[b.id] ? 'rgba(59,130,246,0.1)' : 'transparent',
                    color: activeModels[b.id] ? 'var(--blue)' : 'var(--text3)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span style={{ 
                    display: 'inline-block', 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: activeModels[b.id] ? 'var(--blue)' : 'var(--text3)' 
                  }}></span>
                  {b.title}
                </button>
              ))}
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
          const isActive = activeModels[b.id]
          return (
            <div key={b.title} className="card" style={{ opacity: isActive ? 1 : 0.6, transition: 'opacity 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Space Grotesk', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {b.title}
                    {!isActive && <span style={{ fontSize: '10px', padding: '2px 6px', background: 'var(--bg2)', borderRadius: '4px', color: 'var(--text3)' }}>DISABLED</span>}
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{b.desc}</p>
                </div>
                {isActive && <span className={`val-signal ${b.signal}`}>{b.tag}</span>}
              </div>
              
              <div style={{ padding: '16px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>Calculated Value</div>
                  <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Space Grotesk', textDecoration: isActive ? 'none' : 'line-through' }}>
                    {typeof b.value === 'number' && b.title !== 'Peter Lynch Score' ? fmtINR(b.value) : b.value || '—'}
                  </div>
                </div>
                {b.mos !== null && isActive && (
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
