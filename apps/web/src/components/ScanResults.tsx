'use client'

import { useState, useEffect } from 'react'
import { Check, X, TrendingUp, TrendingDown, Activity, RotateCw, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface ScanResultsProps {
  scanResult: any
  marketData: any
  popReport: any
  onReset: () => void
}

export function ScanResults({ scanResult, marketData, popReport, onReset }: ScanResultsProps) {
  const [showGrade, setShowGrade] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [showMarket, setShowMarket] = useState(false)
  const [priceCounter, setPriceCounter] = useState(0)

  useEffect(() => {
    // Dramatic reveal sequence
    const timers = [
      setTimeout(() => setShowGrade(true), 500),
      setTimeout(() => setShowDetails(true), 1200),
      setTimeout(() => setShowMarket(true), 1800),
    ]

    // Animate price counter
    if (marketData?.averagePrice) {
      const targetPrice = marketData.averagePrice
      const increment = targetPrice / 30
      let current = 0
      
      const priceTimer = setInterval(() => {
        current += increment
        if (current >= targetPrice) {
          setPriceCounter(targetPrice)
          clearInterval(priceTimer)
        } else {
          setPriceCounter(Math.floor(current))
        }
      }, 50)

      return () => {
        clearInterval(priceTimer)
        timers.forEach(timer => clearTimeout(timer))
      }
    }

    return () => timers.forEach(timer => clearTimeout(timer))
  }, [marketData])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl font-bold">Scan Complete!</h1>
          <Sparkles className="w-6 h-6 text-yellow-500" />
          <span className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-sm font-semibold">
            BETA
          </span>
        </div>
        
        {/* Rich Klein: Accuracy disclaimer */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-300">
            <strong>Note:</strong> Grade estimates are AI-generated and should not replace professional grading services. 
            Results are for reference only and may vary from PSA, BGS, or SGC grades.
          </p>
        </div>

        {/* Card Preview with Flip Animation */}
        <div className="card-flip-container mb-8">
          <div className="relative aspect-[3/4] max-w-sm mx-auto">
            {scanResult.captures?.front && (
              <div className="card-flip">
                <div className="card-face card-face-front">
                  <img 
                    src={scanResult.captures.front} 
                    alt="Card front" 
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Grade Reveal */}
        {showGrade && (
          <div className="text-center mb-8 grade-reveal">
            <h2 className="text-sm text-gray-400 mb-2">AI Estimated Grade</h2>
            <div className="text-8xl font-bold text-primary mb-4">
              {scanResult.grade}
              <span className="text-3xl text-gray-400">/10</span>
            </div>
            
            {/* Confidence Meter */}
            <div className="max-w-xs mx-auto mb-4">
              <div className="confidence-meter">
                <div 
                  className="confidence-fill"
                  style={{ '--confidence': `${scanResult.confidence}%` } as any}
                />
              </div>
              <p className={`text-sm mt-2 ${
                scanResult.confidence >= 85 ? 'text-green-500' : 
                scanResult.confidence >= 70 ? 'text-yellow-500' : 
                'text-red-500'
              }`}>
                {scanResult.confidence}% Confidence
              </p>
            </div>
          </div>
        )}

        {/* Card Details */}
        {showDetails && scanResult.cardDetails && (
          <div className="bg-gray-800 rounded-xl p-6 mb-6 shimmer">
            <h2 className="text-lg font-semibold mb-4">Card Identification</h2>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="text-sm text-gray-400 mb-1">Player</h3>
                <p className="text-xl font-bold">{scanResult.cardDetails.player}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-400 mb-1">Year</h3>
                <p className="text-xl font-bold">{scanResult.cardDetails.year}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-400 mb-1">Set</h3>
                <p className="text-xl font-bold">{scanResult.cardDetails.set}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-400 mb-1">Card Number</h3>
                <p className="text-xl font-bold">{scanResult.cardDetails.cardNumber || 'Base'}</p>
              </div>
            </div>

            {/* Special Badges with Pop Animation */}
            <div className="flex flex-wrap gap-2">
              {scanResult.cardDetails.isRookie && (
                <span className="badge-pop bg-green-500/20 text-green-500 px-4 py-2 rounded-full text-sm font-semibold inline-flex items-center">
                  <Sparkles className="w-4 h-4 mr-1" />
                  ROOKIE
                </span>
              )}
              {scanResult.cardDetails.isAutograph && (
                <span className="badge-pop bg-purple-500/20 text-purple-500 px-4 py-2 rounded-full text-sm font-semibold">
                  AUTO
                </span>
              )}
              {scanResult.cardDetails.isPatch && (
                <span className="badge-pop bg-blue-500/20 text-blue-500 px-4 py-2 rounded-full text-sm font-semibold">
                  PATCH
                </span>
              )}
            </div>
          </div>
        )}

        {/* Damage & Authentication */}
        {showDetails && (
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="font-semibold mb-4">Condition Analysis</h3>
              <ul className="space-y-2">
                {scanResult.damages?.map((damage: any, i: number) => (
                  <li key={i} className="flex items-center text-sm">
                    <X className="w-4 h-4 text-red-500 mr-2" />
                    {damage.type}: {damage.severity}
                  </li>
                )) || (
                  <li className="flex items-center text-sm text-green-500">
                    <Check className="w-4 h-4 mr-2" />
                    No significant damage detected
                  </li>
                )}
              </ul>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="font-semibold mb-4">Authentication</h3>
              <div className={`text-2xl font-bold ${scanResult.authentic ? 'text-green-500' : 'text-red-500'}`}>
                {scanResult.authentic ? '✓ Appears Authentic' : '⚠️ Authentication Warning'}
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Based on AI visual analysis
              </p>
            </div>
          </div>
        )}

        {/* Market Analysis with Animation */}
        {showMarket && (
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              Market Analysis
              {marketData?.trend === 'rising' && <TrendingUp className="w-5 h-5 text-green-500 ml-2" />}
              {marketData?.trend === 'falling' && <TrendingDown className="w-5 h-5 text-red-500 ml-2" />}
              {marketData?.trend === 'stable' && <Activity className="w-5 h-5 text-gray-400 ml-2" />}
            </h2>

            <div className="text-center mb-6">
              <p className="text-sm text-gray-400 mb-2">Estimated Value</p>
              <p className="text-5xl font-bold text-primary price-count">
                ${priceCounter}
              </p>
              {marketData && (
                <p className="text-sm text-gray-500 mt-2">
                  ${marketData.priceRange.min} - ${marketData.priceRange.max}
                </p>
              )}
            </div>

            {/* Market Stats */}
            {marketData && (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{marketData.velocity}</p>
                  <p className="text-xs text-gray-400">Sales/Month</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{marketData.recentSales.length}</p>
                  <p className="text-xs text-gray-400">Recent Sales</p>
                </div>
                <div>
                  <p className={`text-2xl font-bold ${
                    marketData.trend === 'rising' ? 'text-green-500' : 
                    marketData.trend === 'falling' ? 'text-red-500' : 
                    'text-gray-400'
                  }`}>
                    {marketData.trend === 'rising' ? '↑' : 
                     marketData.trend === 'falling' ? '↓' : '→'}
                  </p>
                  <p className="text-xs text-gray-400">Trend</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Population Report */}
        {showMarket && popReport && (
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <h3 className="font-semibold mb-4">Population Report</h3>
            <p className="text-sm mb-4">
              <span className="font-bold text-2xl">{popReport.total.toLocaleString()}</span> total graded
            </p>
            <div className="grid grid-cols-5 gap-3">
              {[10, 9, 8, 7, 6].map(grade => (
                <div 
                  key={grade} 
                  className={`text-center p-3 rounded-lg ${
                    scanResult.grade === grade ? 'bg-primary/20 ring-2 ring-primary' : 'bg-gray-700/50'
                  }`}
                >
                  <p className="text-xs text-gray-400">PSA {grade}</p>
                  <p className="text-lg font-bold">{popReport.byGrade[grade] || 0}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">
              Source: {popReport.source.toUpperCase()} • Population data
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          {scanResult.confidence < 70 ? (
            <button
              onClick={onReset}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black py-3 rounded-lg font-semibold transition flex items-center justify-center pulse-glow"
            >
              <RotateCw className="w-5 h-5 mr-2" />
              Retake Scan (Recommended)
            </button>
          ) : (
            <button
              onClick={onReset}
              className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-semibold transition"
            >
              Scan Another Card
            </button>
          )}
          <Link
            href="/dashboard"
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition text-center"
          >
            View Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}