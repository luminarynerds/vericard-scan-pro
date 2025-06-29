'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { ensureContainerInitialized } from '@/lib/di/initialize'
import { container, ServiceTokens } from '@/lib/di/container'
import { ILogger } from '@/lib/interfaces/services'

interface AppContextValue {
  isInitialized: boolean
  error?: Error
}

const AppContext = createContext<AppContextValue>({ isInitialized: false })

export function useApp() {
  return useContext(AppContext)
}

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<Error>()

  useEffect(() => {
    let mounted = true

    async function initialize() {
      try {
        // Initialize DI container
        await ensureContainerInitialized()
        
        // Get logger for app-wide use
        const logger = await container.resolve<ILogger>(ServiceTokens.Logger)
        logger.info('App initialized successfully')
        
        if (mounted) {
          setIsInitialized(true)
        }
      } catch (err) {
        console.error('Failed to initialize app:', err)
        if (mounted) {
          setError(err as Error)
        }
      }
    }

    initialize()

    return () => {
      mounted = false
    }
  }, [])

  // Show loading state while initializing
  if (!isInitialized && !error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Initializing VeriCard Scan Pro...</p>
        </div>
      </div>
    )
  }

  // Show error state if initialization failed
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Initialization Error</h1>
          <p className="text-gray-400 mb-4">Failed to initialize the application. Please refresh the page.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <AppContext.Provider value={{ isInitialized, error }}>
      {children}
    </AppContext.Provider>
  )
}