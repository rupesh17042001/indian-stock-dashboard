import './globals.css'

export const metadata = {
  title: 'Indian Stock Valuation Dashboard',
  description: 'Free, real-time Indian stock analysis — Graham Value, PEG, Peter Lynch Score, Piotroski F-Score, Altman Z, Portfolio Tracker & Watchlist for NSE/BSE stocks.',
  keywords: 'Indian stock analysis, NSE BSE valuation, Graham number, Piotroski F-score, stock dashboard',
  openGraph: {
    title: 'Indian Stock Valuation Dashboard',
    description: 'Professional Indian stock analysis tool — free & shareable',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      </head>
      <body>{children}</body>
    </html>
  )
}
