'use client'

import { useState, useRef, useCallback } from 'react'
import Webcam from 'react-webcam'
import { Camera, RotateCw, Check, X, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { CameraService } from '@/services/CameraService'
import { AIService } from '@/services/AIService'
import { DatabaseService } from '@/services/DatabaseService'

type CaptureStep = 'front' | 'back' | 'edge-top' | 'edge-bottom' | 'edge-left' | 'edge-right' | 'complete'

export default function ScannerPage() {
  const webcamRef = useRef<Webcam>(null)
  const [currentStep, setCurrentStep] = useState<CaptureStep>('front')
  const [captures, setCaptures] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [scanResult, setScanResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const stepLabels: Record<CaptureStep, string> = {
    'front': 'Card Front',
    'back': 'Card Back',
    'edge-top': 'Top Edge',
    'edge-bottom': 'Bottom Edge',
    'edge-left': 'Left Edge',
    'edge-right': 'Right Edge',
    'complete': 'Scan Complete'
  }

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc && currentStep !== 'complete') {
      setCaptures(prev => ({ ...prev, [currentStep]: imageSrc }))
      
      // Move to next step
      const steps: CaptureStep[] = ['front', 'back', 'edge-top', 'edge-bottom', 'edge-left', 'edge-right', 'complete']
      const currentIndex = steps.indexOf(currentStep)
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1] as CaptureStep)
      }
      
      // If all captures complete, process
      if (currentIndex === steps.length - 2) {
        processScan({ ...captures, [currentStep]: imageSrc })
      }
    }
  }, [currentStep, captures])

  const processScan = async (allCaptures: Record<string, string>) => {
    setIsProcessing(true)
    setError(null)
    
    try {
      // Initialize services
      await DatabaseService.init()
      
      // Process with AI
      const result = await AIService.processCard(allCaptures)
      
      // Save to database
      const scan = await DatabaseService.saveScan({
        captures: allCaptures,
        result,
        timestamp: Date.now()
      })
      
      setScanResult(result)
      setCurrentStep('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const reset = () => {
    setCurrentStep('front')
    setCaptures({})
    setScanResult(null)
    setError(null)
  }

  if (currentStep === 'complete' && scanResult) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Scan Results</h1>
          
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-sm text-gray-400 mb-1">Condition Grade</h3>
                <p className="text-3xl font-bold text-primary">{scanResult.grade}/10</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-400 mb-1">Confidence</h3>
                <p className="text-3xl font-bold text-green-500">{scanResult.confidence}%</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Damage Detection</h3>
                <ul className="space-y-1">
                  {scanResult.damages?.map((damage: any, i: number) => (
                    <li key={i} className="flex items-center text-sm">
                      <X className="w-4 h-4 text-red-500 mr-2" />
                      {damage.type}: {damage.severity} ({damage.location})
                    </li>
                  )) || (
                    <li className="flex items-center text-sm text-green-500">
                      <Check className="w-4 h-4 mr-2" />
                      No significant damage detected
                    </li>
                  )}
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Authentication</h3>
                <p className={`text-sm ${scanResult.authentic ? 'text-green-500' : 'text-red-500'}`}>
                  {scanResult.authentic ? '✓ Appears Authentic' : '⚠️ Authentication Warning'}
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Market Value Estimate</h3>
                <p className="text-2xl font-bold text-primary">${scanResult.estimatedValue || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={reset}
              className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-semibold transition"
            >
              Scan Another Card
            </button>
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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-lg border-b border-white/10 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">VeriCard Scan Pro</Link>
          <div className="text-sm">
            Step {currentStep !== 'complete' ? stepLabels[currentStep] : 'Processing'}
          </div>
        </div>
      </div>

      {/* Scanner Interface */}
      <div className="flex flex-col items-center justify-center p-4 min-h-[calc(100vh-80px)]">
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg max-w-md">
            {error}
          </div>
        )}

        <div className="relative w-full max-w-2xl aspect-[4/3] bg-black rounded-xl overflow-hidden mb-6">
          {isProcessing ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
                <p className="text-lg">Processing scan...</p>
                <p className="text-sm text-gray-400">This may take a few seconds</p>
              </div>
            </div>
          ) : (
            <>
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="w-full h-full object-cover"
                videoConstraints={{
                  width: 1280,
                  height: 720,
                  facingMode: "environment"
                }}
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Scan line animation */}
                <div className="scan-line" />
                
                {/* Corner guides */}
                <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-primary" />
                <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-primary" />
                <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-primary" />
                <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-primary" />
                
                {/* Instructions */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <p className="text-center text-lg font-semibold">
                    Position {stepLabels[currentStep]}
                  </p>
                  <p className="text-center text-sm text-gray-300 mt-1">
                    Align card within the guides and hold steady
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Capture Progress */}
        <div className="flex gap-2 mb-6">
          {Object.entries(stepLabels).filter(([k]) => k !== 'complete').map(([step, label]) => (
            <div
              key={step}
              className={`px-3 py-1 rounded-full text-sm ${
                captures[step] 
                  ? 'bg-green-500 text-white' 
                  : step === currentStep 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-700 text-gray-400'
              }`}
            >
              {captures[step] ? '✓' : ''} {label}
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex gap-4">
          <button
            onClick={capture}
            disabled={isProcessing || currentStep === 'complete'}
            className="bg-primary hover:bg-primary/90 disabled:bg-gray-700 disabled:opacity-50 text-white px-8 py-3 rounded-lg font-semibold transition flex items-center"
          >
            <Camera className="w-5 h-5 mr-2" />
            Capture {stepLabels[currentStep]}
          </button>
          
          <button
            onClick={reset}
            disabled={isProcessing}
            className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center"
          >
            <RotateCw className="w-5 h-5 mr-2" />
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}