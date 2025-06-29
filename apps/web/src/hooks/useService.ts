/**
 * React hook for accessing DI services
 */

import { useEffect, useState } from 'react'
import { container, ServiceTokens } from '@/lib/di/container'
import { useApp } from '@/components/providers/AppProvider'

/**
 * Hook to get a service from the DI container
 * @param token Service token from ServiceTokens
 * @returns The service instance or undefined while loading
 */
export function useService<T>(token: symbol): T | undefined {
  const { isInitialized } = useApp()
  const [service, setService] = useState<T>()
  const [error, setError] = useState<Error>()

  useEffect(() => {
    if (!isInitialized) return

    let cancelled = false

    async function loadService() {
      try {
        const instance = await container.resolve<T>(token)
        if (!cancelled) {
          setService(instance)
        }
      } catch (err) {
        console.error(`Failed to resolve service ${token.toString()}:`, err)
        if (!cancelled) {
          setError(err as Error)
        }
      }
    }

    loadService()

    return () => {
      cancelled = true
    }
  }, [token, isInitialized])

  if (error) {
    throw error
  }

  return service
}

/**
 * Hook to get multiple services at once
 * @param tokens Array of service tokens
 * @returns Object with services keyed by token description
 */
export function useServices<T extends Record<string, symbol>>(
  tokens: T
): { [K in keyof T]?: any } {
  const { isInitialized } = useApp()
  const [services, setServices] = useState<{ [K in keyof T]?: any }>({})
  const [error, setError] = useState<Error>()

  useEffect(() => {
    if (!isInitialized) return

    let cancelled = false

    async function loadServices() {
      try {
        const loadedServices: { [K in keyof T]?: any } = {}
        
        for (const [key, token] of Object.entries(tokens)) {
          loadedServices[key as keyof T] = await container.resolve(token as symbol)
        }
        
        if (!cancelled) {
          setServices(loadedServices)
        }
      } catch (err) {
        console.error('Failed to resolve services:', err)
        if (!cancelled) {
          setError(err as Error)
        }
      }
    }

    loadServices()

    return () => {
      cancelled = true
    }
  }, [tokens, isInitialized])

  if (error) {
    throw error
  }

  return services
}

// Convenience hooks for common services
export function useLogger() {
  return useService(ServiceTokens.Logger) as any
}

export function useAIService() {
  return useService(ServiceTokens.AIService) as any
}

export function useDatabaseService() {
  return useService(ServiceTokens.DatabaseService) as any
}

export function useMarketDataService() {
  return useService(ServiceTokens.MarketDataService) as any
}

export function useCardDatabaseService() {
  return useService(ServiceTokens.CardDatabaseService) as any
}

export function useFeatureFlags() {
  return useService(ServiceTokens.ConfigService) as any
}