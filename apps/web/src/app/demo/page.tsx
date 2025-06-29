'use client'

import Link from 'next/link'
import { Play, Camera, Shield, TrendingUp } from 'lucide-react'

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">See VeriCard Scan Pro in Action</h1>
          
          {/* Video placeholder */}
          <div className="relative aspect-video bg-gray-800 rounded-2xl mb-12 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Play className="w-10 h-10 text-primary" />
                </div>
                <p className="text-xl font-semibold mb-2">Demo Video Coming Soon</p>
                <p className="text-gray-400">See how easy it is to scan and grade your cards</p>
              </div>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Multi-Angle Scanning</h3>
              <p className="text-gray-400 text-sm">Capture every detail with our guided 6-angle scan process</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">AI Authentication</h3>
              <p className="text-gray-400 text-sm">Advanced AI detects counterfeits and authenticates cards</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Market Values</h3>
              <p className="text-gray-400 text-sm">Real-time market data for accurate valuations</p>
            </div>
          </div>

          {/* Sample results */}
          <div className="bg-gray-800 rounded-xl p-8 mb-12">
            <h2 className="text-2xl font-bold mb-6">Sample Scan Results</h2>
            
            <div className="space-y-6">
              <div className="border-b border-gray-700 pb-4">
                <h3 className="font-semibold mb-2">1986 Fleer Michael Jordan #57</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Grade:</span>
                    <p className="font-semibold text-primary">8.5/10</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Centering:</span>
                    <p className="font-semibold">55/45</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Corners:</span>
                    <p className="font-semibold">Sharp</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Est. Value:</span>
                    <p className="font-semibold text-green-500">$2,500</p>
                  </div>
                </div>
              </div>

              <div className="border-b border-gray-700 pb-4">
                <h3 className="font-semibold mb-2">2003 Topps Chrome LeBron James #111</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Grade:</span>
                    <p className="font-semibold text-primary">9/10</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Centering:</span>
                    <p className="font-semibold">50/50</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Corners:</span>
                    <p className="font-semibold">Mint</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Est. Value:</span>
                    <p className="font-semibold text-green-500">$1,200</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/scanner"
              className="inline-block bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-lg font-semibold text-lg transition"
            >
              Try It Free Now
            </Link>
            <p className="text-gray-400 mt-4">No credit card required • 10 free scans</p>
          </div>
        </div>
      </div>
    </div>
  )
}