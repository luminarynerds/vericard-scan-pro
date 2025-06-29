'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, Download, Calendar, TrendingUp, Shield } from 'lucide-react'
import { DatabaseService } from '@/services/DatabaseService'

export default function ReportsPage() {
  const [scans, setScans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecentScans()
  }, [])

  const loadRecentScans = async () => {
    try {
      await DatabaseService.init()
      const recentScans = await DatabaseService.getRecentScans(20)
      setScans(recentScans)
    } catch (error) {
      console.error('Failed to load scans:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const exportReport = (scan: any, format: 'pdf' | 'csv') => {
    // In production, would generate actual PDF/CSV
    console.log(`Exporting scan ${scan.id} as ${format}`)
    alert(`Export to ${format.toUpperCase()} coming soon!`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading scan history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Scan Reports</h1>
            <Link
              href="/scanner"
              className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-semibold transition"
            >
              New Scan
            </Link>
          </div>

          {scans.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-12 text-center">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Scans Yet</h2>
              <p className="text-gray-400 mb-6">Start scanning cards to see your reports here</p>
              <Link
                href="/scanner"
                className="inline-block bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                Start Scanning
              </Link>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Total Scans</span>
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-2xl font-bold">{scans.length}</p>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Avg Grade</span>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold">
                    {(scans.reduce((acc, s) => acc + (s.result?.grade || 0), 0) / scans.length).toFixed(1)}
                  </p>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Total Value</span>
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-2xl font-bold">
                    ${scans.reduce((acc, s) => acc + (s.result?.estimatedValue || 0), 0).toLocaleString()}
                  </p>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Authenticated</span>
                    <Shield className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold">
                    {scans.filter(s => s.result?.authentic).length}
                  </p>
                </div>
              </div>

              {/* Scan History */}
              <div className="bg-gray-800 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-gray-700">
                  <h2 className="text-xl font-semibold">Recent Scans</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-750 text-sm text-gray-400">
                      <tr>
                        <th className="px-6 py-3 text-left">Date</th>
                        <th className="px-6 py-3 text-left">Card</th>
                        <th className="px-6 py-3 text-center">Grade</th>
                        <th className="px-6 py-3 text-center">Value</th>
                        <th className="px-6 py-3 text-center">Status</th>
                        <th className="px-6 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {scans.map((scan) => (
                        <tr key={scan.id} className="hover:bg-gray-750 transition">
                          <td className="px-6 py-4 text-sm">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                              {formatDate(scan.timestamp)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium">Card #{scan.id}</p>
                            <p className="text-sm text-gray-400">
                              {scan.result?.authentic ? 'Authenticated' : 'Needs Review'}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-block bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-semibold">
                              {scan.result?.grade || 'N/A'}/10
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-semibold text-green-500">
                            ${scan.result?.estimatedValue || 0}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              scan.result?.authentic 
                                ? 'bg-green-500/20 text-green-500' 
                                : 'bg-yellow-500/20 text-yellow-500'
                            }`}>
                              {scan.result?.authentic ? 'Verified' : 'Review'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => exportReport(scan, 'pdf')}
                                className="p-2 hover:bg-gray-700 rounded transition"
                                title="Export as PDF"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => exportReport(scan, 'csv')}
                                className="p-2 hover:bg-gray-700 rounded transition"
                                title="Export as CSV"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}