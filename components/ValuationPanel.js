'use client'

function fmtINR(val) {
  if (val === null || val === undefined) return '—'
  return '₹' + parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtN(val, dec=2) {
  if (val === null || val === undefined) return '—'
  return parseFloat(val).toFixed(dec)
}
function scoreSignal(score) {
  if (score === null || score === undefined) return { signal: 'neut', tag: '—' }
  if (score > 1.5) return { signal: 'bull', tag: '🟢 Strong Buy' }
  if (score > 1)   return { signal: 'bull', tag: '🟢 Undervalued' }
  if (score >= 0.8)return { signal: 'neut', tag: '🟡 Fair Value' }
  return { signal: 'bear', tag: '🔴 Overvalued' }
}

function ScoreCard({ title, desc, score, values, currentPrice }) {
  const { signal, tag } = scoreSignal(score)
  const isAvailable = score !== null && score !== undefined
  const fairValue = isAvailable && currentPrice ? currentPrice * score : null
  const barWidth = isAvailable ? Math.min(Math.max((score / 2) * 100, 2), 100) : 0
  const barColor = signal === 'bull' ? 'var(--green)' : signal === 'bear' ? 'var(--red)' : 'var(--amber)'

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 700, fontFamily: 'Space Grotesk' }}>{title}</h3>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{desc}</p>
        </div>
        {isAvailable && <span className={`val-signal ${signal}`}>{tag}</span>}
      </div>

      {/* Score + Fair Value */}
      <div style={{ padding: '16px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>Peter Lynch Score</div>
            <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'Space Grotesk', color: barColor, lineHeight: 1 }}>
              {isAvailable ? fmtN(score) : '—'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>Fair Value of Share</div>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Space Grotesk', color: barColor, lineHeight: 1 }}>
              {fmtINR(fairValue)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Current Price × Score</div>
          </div>
        </div>

        {/* Visual bar */}
        <div style={{ background: 'var(--navy)', borderRadius: 6, height: 8, position: 'relative' }}>
          <div style={{ background: barColor, borderRadius: 6, height: '100%', width: `${barWidth}%`, transition: 'width 0.4s ease' }} />
          <div style={{ position: 'absolute', left: '50%', top: -4, width: 2, height: 16, background: 'var(--text3)', borderRadius: 1 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>
          <span>0 (Overvalued)</span>
          <span>1.0 = Fair Value</span>
          <span>2+ (Undervalued)</span>
        </div>
      </div>

      {/* Formula */}
      <div style={{ background: 'var(--navy)', padding: '10px 14px', borderRadius: 8, fontSize: 11, fontFamily: 'monospace', color: 'var(--text3)', marginBottom: 16 }}>
        Score = (Growth% + DivYield%) ÷ P/E &nbsp;|&nbsp; Fair Value = Current Price × Score
      </div>

      {/* Values used */}
      {values && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Growth Estimate</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{fmtN(values.growthPct)}%</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Dividend Yield</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{fmtN(values.divYieldPct)}%</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>P/E Ratio</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{fmtN(values.pe)}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ValuationPanel({ data }) {
  if (!data) return null
  const p = data.currentPrice

  const periods = [
    data.scoreNextQtr != null && {
      title: 'Short Term (Next Quarter)',
      desc: 'Based on expected growth for the upcoming quarter.',
      score: data.scoreNextQtr,
      values: data.valuesNextQtr
    },
    data.scoreCurrYear != null && {
      title: 'Medium Term (Current Year)',
      desc: 'Based on expected growth for the current financial year.',
      score: data.scoreCurrYear,
      values: data.valuesCurrYear
    },
    data.scoreNextYear != null && {
      title: 'Long Term (Next Year)',
      desc: 'Based on expected growth for the next financial year.',
      score: data.scoreNextYear,
      values: data.valuesNextYear
    }
  ].filter(Boolean)

  return (
    <div className="main-grid">
      {/* Header */}
      <div className="card" style={{ gridColumn: '1 / -1', background: 'rgba(59,130,246,0.05)', borderColor: 'rgba(59,130,246,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, color: 'var(--blue2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>Is the stock fairly priced?</h3>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, maxWidth: 800 }}>
              This panel uses the <strong>Peter Lynch approach</strong> to find the true value of a share based on its expected growth and dividends.
              <br/><br/>
              <strong>Score &gt; 1:</strong> 🟢 <strong>Undervalued.</strong> The expected growth and dividend returns are higher than what you are paying for the stock today.<br/>
              <strong>Score = 1:</strong> 🟡 <strong>Fair Value.</strong> The price perfectly matches the expected growth.<br/>
              <strong>Score &lt; 1:</strong> 🔴 <strong>Overvalued.</strong> The stock is expensive compared to how much it is expected to grow.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>Current Price</div>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Space Grotesk' }}>
              {'₹' + parseFloat(p).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Score cards */}
      <div className="grid-2" style={{ gridColumn: '1 / -1' }}>
        {periods.length > 0
          ? periods.map(period => <ScoreCard key={period.title} {...period} currentPrice={p} />)
          : <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text3)' }}>No analyst estimates available for this stock.</div>
        }
      </div>
    </div>
  )
}
