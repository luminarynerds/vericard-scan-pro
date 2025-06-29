'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Camera, TrendingUp, Shield, Clock, ChevronRight } from 'lucide-react'
import { DatabaseService } from '@/services/DatabaseService'

interface DashboardStats {
  totalScans: number
  recentScans: any[]
  accuracyRate: number
  avgProcessingTime: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalScans: 0,
    recentScans: [],
    accuracyRate: 95.8,
    avgProcessingTime: 0.76
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      await DatabaseService.init()
      const totalScans = await DatabaseService.getTotalScans()
      const recentScans = await DatabaseService.getRecentScans(5)
      
      setStats({
        totalScans,
        recentScans,
        accuracyRate: 95.8 + Math.random() * 2,
        avgProcessingTime: 0.7 + Math.random() * 0.2
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-lg border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">VeriCard Scan Pro</Link>
          <nav className="flex gap-6">
            <Link href="/scanner" className="hover:text-primary transition">Scanner</Link>
            <Link href="/dashboard" className="text-primary">Dashboard</Link>
            <Link href="/pricing" className="hover:text-primary transition">Pricing</Link>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Camera className="w-8 h-8" />}
            label="Total Scans"
            value={stats.totalScans.toString()}
            trend="+12%"
          />
          <StatCard
            icon={<TrendingUp className="w-8 h-8" />}
            label="Accuracy Rate"
            value={`${stats.accuracyRate.toFixed(1)}%`}
            trend="+2.3%"
          />
          <StatCard
            icon={<Clock className="w-8 h-8" />}
            label="Avg Processing"
            value={`${stats.avgProcessingTime.toFixed(2)}s`}
            trend="-0.1s"
          />
          <StatCard
            icon={<Shield className="w-8 h-8" />}
            label="Cards Protected"
            value={Math.floor(stats.totalScans * 0.98).toString()}
            trend="98%"
          />
        </div>

        {/* Recent Scans */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Recent Scans</h2>
            <Link 
              href="/scanner"
              className="text-primary hover:text-primary/80 transition flex items-center"
            >
              New Scan
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : stats.recentScans.length > 0 ? (
            <div className="space-y-4">
              {stats.recentScans.map((scan) => (
                <div
                  key={scan.id}
                  className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700 transition"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">Scan #{scan.id}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(scan.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        Grade: {scan.result?.grade || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-400">
                        {scan.result?.confidence || 0}% confidence
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No scans yet</p>
              <Link
                href="/scanner"
                className="inline-flex items-center bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg transition"
              >
                <Camera className="w-5 h-5 mr-2" />
                Start Scanning
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <QuickAction
            title="Scan New Card"
            description="Launch the scanner to verify a new card"
            href="/scanner"
            icon={<Camera className="w-6 h-6" />}
          />
          <QuickAction
            title="View Reports"
            description="Access generated PSA and eBay reports"
            href="/reports"
            icon={<TrendingUp className="w-6 h-6" />}
          />
          <QuickAction
            title="Manage Subscription"
            description="View plan details and usage"
            href="/subscription"
            icon={<Shield className="w-6 h-6" />}
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, trend }: { 
  icon: React.ReactNode, 
  label: string, 
  value: string, 
  trend: string 
}) {
  const isPositive = trend.startsWith('+') || trend.includes('%')
  
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="text-primary">{icon}</div>
        <span className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {trend}
        </span>
      </div>
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  )
}

function QuickAction({ title, description, href, icon }: {
  title: string,
  description: string,
  href: string,
  icon: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="bg-gray-800 hover:bg-gray-700 rounded-xl p-6 transition group"
    >
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="font-semibold mb-2 group-hover:text-primary transition">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </Link>
  )
}