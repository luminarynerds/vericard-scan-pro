/**
 * DI Container Initialization - Grace Hopper: Clean service registration
 */

import { container, ServiceTokens } from './container'
import { Logger } from '../services/Logger'
import { FeatureFlagService } from '../features/FeatureFlags'
import { VisionPipeline } from '../vision/VisionPipeline'
import { MarketDataAggregator } from '../market/MarketDataAggregator'
import { CardDatabaseManager } from '../card-database/CardDatabaseManager'
import { ScanRepository } from '../repositories/ScanRepository'

// Import existing services to wrap
import { aiService } from '@/services/AIService'
import { CameraService } from '@/services/CameraService'
import { DatabaseService } from '@/services/DatabaseService'
import { cardIdentificationService } from '@/services/CardIdentificationService'
import { marketDataService } from '@/services/MarketDataService'
import { cardDatabaseService } from '@/services/CardDatabaseService'
import { SubscriptionService } from '@/services/SubscriptionService'

// Import repositories
import { ScanRepository } from '../repositories/ScanRepository'
import { TransactionRepository } from '../repositories/TransactionRepository'

// Cache manager implementation
class SimpleCacheManager {
  private cache = new Map<string, { value: any; expiry: number }>()

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }
    
    return item.value
  }

  async set<T>(key: string, value: T, ttl = 60000): Promise<void> {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    })
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async clear(): Promise<void> {
    this.cache.clear()
  }

  async wrap<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached) return cached
    
    const value = await factory()
    await this.set(key, value, ttl)
    return value
  }
}

// Event bus implementation
class SimpleEventBus {
  private events = new Map<string, Set<Function>>()

  emit<T = any>(event: string, data: T): void {
    const handlers = this.events.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`Event handler error for ${event}:`, error)
        }
      })
    }
  }

  on<T = any>(event: string, handler: (data: T) => void): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    
    this.events.get(event)!.add(handler)
    
    return () => this.off(event, handler)
  }

  once<T = any>(event: string, handler: (data: T) => void): () => void {
    const wrapper = (data: T) => {
      handler(data)
      this.off(event, wrapper)
    }
    
    return this.on(event, wrapper)
  }

  off(event: string, handler?: Function): void {
    if (!handler) {
      this.events.delete(event)
    } else {
      const handlers = this.events.get(event)
      if (handlers) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          this.events.delete(event)
        }
      }
    }
  }
}

/**
 * Initialize all services in the DI container
 */
export async function initializeContainer(): Promise<void> {
  // Core infrastructure
  container.registerSingleton(ServiceTokens.Logger, () => new Logger())
  container.registerSingleton(ServiceTokens.ConfigService, () => new FeatureFlagService())
  container.registerSingleton(ServiceTokens.CacheManager, () => new SimpleCacheManager())
  container.registerSingleton(ServiceTokens.EventBus, () => new SimpleEventBus())

  // Get logger for other services
  const logger = await container.resolve(ServiceTokens.Logger)
  const cache = await container.resolve(ServiceTokens.CacheManager)
  const config = await container.resolve(ServiceTokens.ConfigService)

  // Domain services with dependencies
  container.registerSingleton(ServiceTokens.AIService, async () => {
    const { AIServiceRefactored } = await import('@/services/AIServiceRefactored')
    
    const cardIdService = await container.resolve(ServiceTokens.CardIdentificationService)
    const marketService = await container.resolve(ServiceTokens.MarketDataService)
    
    const aiService = new AIServiceRefactored(logger, cardIdService, marketService)
    await aiService.initialize()
    return aiService
  })

  container.registerSingleton(ServiceTokens.CameraService, () => CameraService)
  
  container.registerSingleton(ServiceTokens.DatabaseService, async () => {
    const useRefactored = await config.getFeatureFlag('refactoredDatabase')
    if (useRefactored) {
      const { DatabaseServiceRefactored } = await import('@/services/DatabaseServiceRefactored')
      const scanRepo = await container.resolve(ServiceTokens.ScanRepository)
      const txRepo = await container.resolve(ServiceTokens.TransactionRepository)
      
      return new DatabaseServiceRefactored(scanRepo, txRepo, logger)
    }
    return DatabaseService
  })
  
  container.registerSingleton(ServiceTokens.CardIdentificationService, () => cardIdentificationService)
  
  container.registerSingleton(ServiceTokens.MarketDataService, async () => {
    // Use new aggregator if feature flag enabled
    const useAggregator = await config.getFeatureFlag('marketDataIntegration')
    if (useAggregator) {
      return new MarketDataAggregator(logger, cache)
    }
    return marketDataService
  })

  container.registerSingleton(ServiceTokens.CardDatabaseService, async () => {
    return new CardDatabaseManager(logger, cache)
  })

  container.registerSingleton(ServiceTokens.SubscriptionService, () => SubscriptionService)

  // Repositories
  container.registerSingleton(ServiceTokens.ScanRepository, () => new ScanRepository())
  container.registerSingleton(ServiceTokens.TransactionRepository, () => new TransactionRepository())

  logger.info('DI container initialized', {
    services: Object.keys(ServiceTokens).length
  })
}

/**
 * Get a service from the container
 */
export async function getService<T>(token: symbol): Promise<T> {
  return container.resolve<T>(token)
}

/**
 * Initialize container on app startup
 */
let initialized = false
export async function ensureContainerInitialized(): Promise<void> {
  if (!initialized) {
    await initializeContainer()
    initialized = true
  }
}