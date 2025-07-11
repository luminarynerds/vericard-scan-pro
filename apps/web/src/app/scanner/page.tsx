'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Webcam from 'react-webcam'
import { Camera, RotateCw, Check, X, Loader2, Info, Upload, Image, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import Link from 'next/link'
import { CameraService } from '@/services/CameraService'
import { aiService } from '@/services/AIService'
import { DatabaseService } from '@/services/DatabaseService'
import { SubscriptionService } from '@/services/SubscriptionService'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { marketDataService } from '@/services/MarketDataService'
import { ScanResults } from '@/components/ScanResults'

type CaptureStep = 'front' | 'back' | 'edge-top' | 'edge-bottom' | 'edge-left' | 'edge-right' | 'complete'

function ScannerContent() {
  const webcamRef = useRef<Webcam>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentStep, setCurrentStep] = useState<CaptureStep>('front')
  const [captures, setCaptures] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [scanResult, setScanResult] = useState<any>(null)
  const [marketData, setMarketData] = useState<any>(null)
  const [popReport, setPopReport] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [simpleMode, setSimpleMode] = useState(true) // Start with simple mode
  const [scansRemaining, setScansRemaining] = useState<number>(0)
  const [modelLoading, setModelLoading] = useState(false)
  const [scanMode, setScanMode] = useState<'camera' | 'upload' | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [captureFlash, setCaptureFlash] = useState(false)

  const stepLabels: Record<CaptureStep, string> = {
    'front': 'Card Front',
    'back': 'Card Back',
    'edge-top': 'Top Edge',
    'edge-bottom': 'Bottom Edge',
    'edge-left': 'Left Edge',
    'edge-right': 'Right Edge',
    'complete': 'Scan Complete'
  }

  // Check camera permissions on mount
  useEffect(() => {
    CameraService.checkPermissions().then(setHasPermission)
    // Check subscription status
    SubscriptionService.checkExpiration()
    setScansRemaining(SubscriptionService.getScansRemaining())
    
    // Preload AI model
    setModelLoading(true)
    aiService.initialize()
      .then(() => setModelLoading(false))
      .catch(err => {
        console.error('Failed to load AI model:', err)
        setError('Failed to load AI model. Please refresh the page.')
        setModelLoading(false)
      })
  }, [])

  // Handle webcam errors
  const handleWebcamError = useCallback((error: string | DOMException) => {
    console.error('Webcam error:', error)
    setError('Camera access failed. Please check permissions and try again.')
    setHasPermission(false)
  }, [])

  const capture = useCallback(() => {
    // Check scan limits before capturing
    if (!SubscriptionService.canScan()) {
      setError(`You've reached your free scan limit (${SubscriptionService.getScansRemaining()} remaining). Please upgrade to continue.`)
      setTimeout(() => {
        window.location.href = '/subscription'
      }, 3000)
      return
    }

    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc && currentStep !== 'complete') {
      // Trigger capture flash animation
      setCaptureFlash(true)
      setTimeout(() => setCaptureFlash(false), 300)
      
      setCaptures(prev => ({ ...prev, [currentStep]: imageSrc }))
      
      if (simpleMode) {
        // In simple mode, process immediately after front capture
        processScan({ front: imageSrc })
      } else {
        // Multi-angle mode
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
    }
  }, [currentStep, captures, simpleMode])

  const processScan = async (allCaptures: Record<string, string>) => {
    setIsProcessing(true)
    setError(null)
    
    try {
      // Grace Hopper: Initialize with error handling
      try {
        await DatabaseService.init()
      } catch (dbError) {
        console.error('Database initialization failed:', dbError)
        // Continue anyway - we can still process without saving
      }
      
      // Grace Hopper: Process with fallback behavior
      const result = await aiService.processCard(allCaptures)
      
      // Grace Hopper: Save with graceful failure
      try {
        const scan = await DatabaseService.saveScan({
          captures: allCaptures,
          result,
          timestamp: Date.now()
        })
        
        // Increment scan count only if save succeeded
        SubscriptionService.incrementScanCount()
      } catch (saveError) {
        console.error('Failed to save scan:', saveError)
        // Show result anyway
      }
      
      setScanResult(result)
      setCurrentStep('complete')
      
      // Fetch market data and population report if card was identified
      if (result.cardDetails) {
        try {
          const [mktData, popData] = await Promise.all([
            marketDataService.getMarketData(result.cardDetails, result.grade),
            marketDataService.getPopulationReport(result.cardDetails)
          ])
          setMarketData(mktData)
          setPopReport(popData)
        } catch (err) {
          console.error('Failed to fetch market data:', err)
        }
      }
    } catch (err) {
      // Grace Hopper: User-friendly error messages
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Unable to process scan. Please try again.'
      setError(errorMessage)
      console.error('Scan processing error:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const reset = () => {
    setCurrentStep('front')
    setCaptures({})
    setScanResult(null)
    setError(null)
    setScanMode(null)
    setUploadedImage(null)
    setMarketData(null)
    setPopReport(null)
    // Reset file input too
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check scan limits
    if (!SubscriptionService.canScan()) {
      setError(`You've reached your free scan limit (${SubscriptionService.getScansRemaining()} remaining). Please upgrade to continue.`)
      setTimeout(() => {
        window.location.href = '/subscription'
      }, 3000)
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, etc.)')
      return
    }

    // Read file and convert to base64
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      if (base64) {
        // Show preview first
        setUploadedImage(base64)
        // Don't set scan mode - let the UI handle it based on uploadedImage
      }
    }
    reader.onerror = () => {
      setError('Failed to read image file. Please try again.')
    }
    reader.readAsDataURL(file)
  }

  if (currentStep === 'complete' && scanResult) {
    return (
      <ScanResults 
        scanResult={scanResult}
        marketData={marketData}
        popReport={popReport}
        onReset={reset}
      />
    )
  }


  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-lg border-b border-white/10 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">VeriCard Scan Pro</Link>
          <div className="flex items-center gap-4">
            {scansRemaining !== Infinity && (
              <div className="text-sm">
                <span className="text-gray-400">Free scans: </span>
                <span className={scansRemaining <= 3 ? 'text-yellow-500' : 'text-primary'}>
                  {scansRemaining} remaining
                </span>
              </div>
            )}
            {scanMode && (
              <div className="flex items-center gap-4">
                <button
                  onClick={reset}
                  className="text-sm text-gray-400 hover:text-white transition"
                >
                  ← Back
                </button>
                <div className="text-sm">
                  Step {currentStep !== 'complete' ? stepLabels[currentStep] : 'Processing'}
                </div>
              </div>
            )}
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

        {/* Mode Selection */}
        {!scanMode && !uploadedImage && !isProcessing && (
          <div className="w-full max-w-2xl">
            <h1 className="text-3xl font-bold text-center mb-8">Choose Scan Method</h1>
            <div className="grid md:grid-cols-2 gap-6">
              <button
                onClick={() => setScanMode('camera')}
                className="bg-gray-800 hover:bg-gray-700 rounded-xl p-8 transition group"
              >
                <Camera className="w-16 h-16 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold mb-2">Scan with Camera</h3>
                <p className="text-gray-400 text-sm">Use your device camera to scan cards in real-time</p>
              </button>
              
              <button
                onClick={() => {
                  // Don't set scan mode here - wait for actual file selection
                  // Reset the file input to ensure it works properly
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                  fileInputRef.current?.click()
                }}
                className="bg-gray-800 hover:bg-gray-700 rounded-xl p-8 transition group"
              >
                <Upload className="w-16 h-16 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold mb-2">Upload Photos</h3>
                <p className="text-gray-400 text-sm">Upload existing photos of your cards</p>
              </button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {/* Camera/Upload Interface */}
        {scanMode === 'camera' && (
          <>
            <div className="relative w-full max-w-2xl aspect-[4/3] bg-black rounded-xl overflow-hidden mb-6">
              {isProcessing ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
                <p className="text-lg">Processing scan...</p>
                <p className="text-sm text-gray-400">This may take a few seconds</p>
              </div>
            </div>
          ) : hasPermission === false ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center">
                <Camera className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-lg mb-2">Camera Access Required</p>
                <p className="text-sm text-gray-400 mb-4">Please enable camera permissions to scan cards</p>
                <button
                  onClick={() => CameraService.checkPermissions().then(setHasPermission)}
                  className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg"
                >
                  Enable Camera
                </button>
              </div>
            </div>
          ) : hasPermission === null ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <Loader2 className="w-8 h-8 animate-spin" />
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
                onUserMediaError={handleWebcamError}
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Capture flash */}
                {captureFlash && <div className="capture-flash" />}
                
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

            {/* Model Loading Indicator - Fei-Fei Li: Clear loading feedback */}
            {modelLoading && (
              <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-center">
                <Loader2 className="w-5 h-5 animate-spin mr-3 text-blue-500" />
                <span className="text-sm text-blue-300">Loading AI model for the first time...</span>
              </div>
            )}

            {/* Capture Progress */}
            {!simpleMode && (
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
            )}

            {/* Mode Toggle */}
            <div className="mb-4">
              <button
                onClick={() => {
                  setSimpleMode(!simpleMode)
                  reset()
                }}
                className="text-sm text-gray-400 hover:text-white transition"
              >
                {simpleMode ? 'Switch to Multi-Angle Mode' : 'Switch to Simple Mode'}
              </button>
            </div>

            {/* Controls */}
            <div className="flex gap-4">
              <button
                onClick={capture}
                disabled={isProcessing || currentStep === 'complete' || modelLoading}
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
          </>
        )}

        {/* Processing State for Upload */}
        {uploadedImage && isProcessing && (
          <div className="w-full max-w-2xl">
            <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
                <p className="text-lg">Processing scan...</p>
                <p className="text-sm text-gray-400">This may take a few seconds</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Preview */}
        {uploadedImage && !isProcessing && (
          <div className="w-full max-w-2xl">
            <h2 className="text-2xl font-bold text-center mb-6">Review Your Image</h2>
            <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden mb-6">
              <img 
                src={uploadedImage} 
                alt="Uploaded card" 
                className="w-full h-full object-contain"
              />
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => processScan({ front: uploadedImage })}
                disabled={modelLoading}
                className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-gray-700 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center"
              >
                <Check className="w-5 h-5 mr-2" />
                Process Card
              </button>
              
              <button
                onClick={() => {
                  // Reset the file input to allow re-selecting the same file
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                  fileInputRef.current?.click()
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center"
              >
                <Image className="w-5 h-5 mr-2" />
                Choose Different Image
              </button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Grace Hopper: Wrap with error boundary for resilience
export default function ScannerPage() {
  // Use refactored scanner if available, fallback to original
  const useRefactored = process.env.NEXT_PUBLIC_USE_REFACTORED === 'true'
  
  if (useRefactored) {
    const { ScannerContentRefactored } = require('./ScannerContentRefactored')
    return (
      <ErrorBoundary>
        <ScannerContentRefactored />
      </ErrorBoundary>
    )
  }
  
  return (
    <ErrorBoundary>
      <ScannerContent />
    </ErrorBoundary>
  )
}