'use client'
import { useEffect, useRef } from 'react'

export default function PriceChart({ data, currentPrice }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!data || data.length < 2) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    canvas.width  = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    const prices  = data.map(d => d.close)
    const minP = Math.min(...prices) * 0.99
    const maxP = Math.max(...prices) * 1.01
    const range = maxP - minP
    const n = prices.length
    const pad = { top: 20, right: 20, bottom: 40, left: 60 }
    const w = W - pad.left - pad.right
    const h = H - pad.top - pad.bottom

    const x = i => pad.left + (i / (n - 1)) * w
    const y = v => pad.top + (1 - (v - minP) / range) * h

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const yy = pad.top + (i / 4) * h
      ctx.beginPath(); ctx.moveTo(pad.left, yy); ctx.lineTo(pad.left + w, yy); ctx.stroke()
      const val = maxP - (i / 4) * range
      ctx.fillStyle = '#64748b'
      ctx.font = '10px Inter'
      ctx.textAlign = 'right'
      ctx.fillText('₹' + val.toFixed(0), pad.left - 6, yy + 4)
    }

    // X labels (show ~6)
    const step = Math.floor(n / 6)
    ctx.fillStyle = '#64748b'
    ctx.font = '10px Inter'
    ctx.textAlign = 'center'
    for (let i = 0; i < n; i += step) {
      if (data[i]) ctx.fillText(data[i].date, x(i), H - pad.bottom + 20)
    }

    // Gradient fill
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + h)
    const isUp = prices[prices.length - 1] >= prices[0]
    const color = isUp ? '34,197,94' : '239,68,68'
    grad.addColorStop(0, `rgba(${color},0.25)`)
    grad.addColorStop(1, `rgba(${color},0)`)
    ctx.beginPath()
    ctx.moveTo(x(0), y(prices[0]))
    for (let i = 1; i < n; i++) ctx.lineTo(x(i), y(prices[i]))
    ctx.lineTo(x(n-1), pad.top + h)
    ctx.lineTo(x(0), pad.top + h)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // Line
    ctx.beginPath()
    ctx.moveTo(x(0), y(prices[0]))
    for (let i = 1; i < n; i++) ctx.lineTo(x(i), y(prices[i]))
    ctx.strokeStyle = isUp ? '#22c55e' : '#ef4444'
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.stroke()

    // Current price dot
    const lastX = x(n - 1)
    const lastY = y(prices[n - 1])
    ctx.beginPath()
    ctx.arc(lastX, lastY, 5, 0, Math.PI * 2)
    ctx.fillStyle = isUp ? '#22c55e' : '#ef4444'
    ctx.fill()

  }, [data, currentPrice])

  if (!data || data.length === 0) {
    return <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 13 }}>Price history not available</div>
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: 240, display: 'block' }}
    />
  )
}
