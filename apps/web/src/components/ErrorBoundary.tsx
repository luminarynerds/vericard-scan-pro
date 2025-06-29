'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'
import { container, ServiceTokens } from '@/lib/di/container'
import { ILogger } from '@/lib/interfaces/services'
import { ErrorHandler } from '@/lib/errors'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private logger?: ILogger

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
    
    // Get logger from DI container if available
    container.resolve<ILogger>(ServiceTokens.Logger)
      .then(logger => this.logger = logger)
      .catch(() => {
        // Logger not available, fall back to console
      })
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Grace Hopper: Proper error state management
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Grace Hopper: Comprehensive error logging
    const veriCardError = ErrorHandler.handle(error)
    
    if (this.logger) {
      this.logger.error('React Error Boundary triggered', veriCardError, {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      })
    } else {
      console.error('ErrorBoundary caught:', error, errorInfo)
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return (
        <FallbackComponent error={this.state.error} reset={this.reset} />
      )
    }

    return this.props.children
  }
}

// Default error UI following Grace Hopper's clarity principles
function DefaultErrorFallback({ 
  error, 
  reset 
}: { 
  error?: Error
  reset: () => void 
}) {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
        <p className="text-gray-400 mb-4">
          {error?.message || 'An unexpected error occurred'}
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition"
          >
            Go Home
          </button>
          <button
            onClick={reset}
            className="flex-1 bg-primary hover:bg-primary/90 text-white py-2 rounded-lg transition"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  )
}