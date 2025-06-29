'use client'

import { useState } from 'react'
import { Camera, CreditCard, Shield, Zap, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold text-white">VeriCard Scan Pro</span>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/scanner" className="text-white/80 hover:text-white transition">
                Scanner
              </Link>
              <Link href="/dashboard" className="text-white/80 hover:text-white transition">
                Dashboard
              </Link>
              <Link href="/pricing" className="text-white/80 hover:text-white transition">
                Pricing
              </Link>
              <Link 
                href="/scanner" 
                className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition"
              >
                Launch App
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Card Verification
            <br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Reimagined
            </span>
          </h1>
          <p className="text-xl text-white/80 mb-12 max-w-3xl mx-auto">
            Professional-grade card authentication powered by AI. Instant verification, 
            damage detection, and market insights in under 0.8 seconds.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/scanner"
              className="group relative px-8 py-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all transform hover:scale-105"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <span className="flex items-center justify-center">
                Start Scanning
                <ChevronRight className={`ml-2 transition-transform ${isHovered ? 'translate-x-1' : ''}`} />
              </span>
            </Link>
            
            <Link
              href="/demo"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl backdrop-blur-sm transition-all"
            >
              Watch Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Enterprise Features
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Camera className="w-12 h-12" />}
              title="Multi-Angle Capture"
              description="Capture front, back, and all four edges with guided workflows for complete verification."
            />
            
            <FeatureCard
              icon={<Zap className="w-12 h-12" />}
              title="0.8s Processing"
              description="Lightning-fast AI processing with local-first architecture and cloud fallback."
            />
            
            <FeatureCard
              icon={<Shield className="w-12 h-12" />}
              title="Theft Prevention"
              description="48-hour transaction freeze protocol with blockchain audit trails."
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <StatCard number="95%" label="Accuracy Rate" />
            <StatCard number="<0.8s" label="Scan Time" />
            <StatCard number="$0.001" label="Per Scan Cost" />
            <StatCard number="100%" label="Offline Ready" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Card Business?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Join thousands of card shops and breakers using VeriCard Scan Pro
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/scanner"
              className="px-8 py-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all transform hover:scale-105"
            >
              Start Free Trial
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl backdrop-blur-sm transition-all"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/70">{description}</p>
    </div>
  )
}

function StatCard({ number, label }: { number: string, label: string }) {
  return (
    <div>
      <div className="text-4xl font-bold text-primary mb-2">{number}</div>
      <div className="text-white/70">{label}</div>
    </div>
  )
}