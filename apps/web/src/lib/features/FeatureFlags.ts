/**
 * Feature Flags - Sam: Gradual rollout and A/B testing
 */

import { IConfigService, ILogger } from '../interfaces/services'

export interface FeatureFlag {
  key: string
  enabled: boolean
  description: string
  rolloutPercentage?: number
  enabledForUsers?: string[]
  metadata?: Record<string, any>
}

export interface FeatureFlagProvider {
  getFlags(): Promise<FeatureFlag[]>
  getFlag(key: string): Promise<FeatureFlag | null>
}

// Local storage provider for development
export class LocalStorageProvider implements FeatureFlagProvider {
  private readonly storageKey = 'vericard_feature_flags'

  async getFlags(): Promise<FeatureFlag[]> {
    if (typeof window === 'undefined') return []
    
    const stored = localStorage.getItem(this.storageKey)
    if (!stored) return this.getDefaultFlags()
    
    try {
      return JSON.parse(stored)
    } catch {
      return this.getDefaultFlags()
    }
  }

  async getFlag(key: string): Promise<FeatureFlag | null> {
    const flags = await this.getFlags()
    return flags.find(f => f.key === key) || null
  }

  async setFlag(flag: FeatureFlag): Promise<void> {
    const flags = await this.getFlags()
    const index = flags.findIndex(f => f.key === flag.key)
    
    if (index >= 0) {
      flags[index] = flag
    } else {
      flags.push(flag)
    }
    
    localStorage.setItem(this.storageKey, JSON.stringify(flags))
  }

  private getDefaultFlags(): FeatureFlag[] {
    return [
      {
        key: 'multiAngleScanning',
        enabled: true,
        description: 'Enable multi-angle card scanning for enhanced accuracy'
      },
      {
        key: 'offlineMode',
        enabled: true,
        description: 'Enable offline scanning with local AI models'
      },
      {
        key: 'marketDataIntegration',
        enabled: true,
        description: 'Show real-time market data from multiple sources'
      },
      {
        key: 'advancedGrading',
        enabled: false,
        description: 'Use advanced AI grading with subgrades',
        rolloutPercentage: 20
      },
      {
        key: 'communityFeatures',
        enabled: false,
        description: 'Enable community collection sharing',
        rolloutPercentage: 10
      },
      {
        key: 'exportToPDF',
        enabled: true,
        description: 'Allow exporting scan results to PDF'
      },
      {
        key: 'bulkScanning',
        enabled: false,
        description: 'Enable bulk card scanning mode',
        rolloutPercentage: 5
      },
      {
        key: 'priceAlerts',
        enabled: true,
        description: 'Enable price movement alerts'
      },
      {
        key: 'darkMode',
        enabled: true,
        description: 'Enable dark mode theme'
      },
      {
        key: 'betaFeatures',
        enabled: false,
        description: 'Show beta features in UI',
        enabledForUsers: ['beta-tester@example.com']
      }
    ]
  }
}

// Remote provider for production
export class RemoteFeatureFlagProvider implements FeatureFlagProvider {
  constructor(
    private endpoint: string,
    private apiKey: string
  ) {}

  async getFlags(): Promise<FeatureFlag[]> {
    try {
      const response = await fetch(this.endpoint, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error(`Feature flag API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      // Fall back to empty array on error
      console.error('Failed to fetch feature flags:', error)
      return []
    }
  }

  async getFlag(key: string): Promise<FeatureFlag | null> {
    const flags = await this.getFlags()
    return flags.find(f => f.key === key) || null
  }
}

export class FeatureFlagService implements IConfigService {
  private provider: FeatureFlagProvider
  private cache: Map<string, FeatureFlag> = new Map()
  private cacheExpiry = 5 * 60 * 1000 // 5 minutes
  private lastFetch = 0
  private userId?: string

  constructor(private logger?: ILogger) {
    // Use remote provider in production, local in development
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_FEATURE_FLAG_API) {
      this.provider = new RemoteFeatureFlagProvider(
        process.env.NEXT_PUBLIC_FEATURE_FLAG_API,
        process.env.NEXT_PUBLIC_FEATURE_FLAG_API_KEY || ''
      )
    } else {
      this.provider = new LocalStorageProvider()
    }
  }

  setUserId(userId: string): void {
    this.userId = userId
    // Clear cache when user changes
    this.cache.clear()
    this.lastFetch = 0
  }

  async getFeatureFlag(flag: string): Promise<boolean> {
    await this.refreshCacheIfNeeded()
    
    const feature = this.cache.get(flag)
    if (!feature) return false

    // Check if explicitly enabled/disabled
    if (feature.enabled !== undefined) {
      // Check user-specific enablement
      if (feature.enabledForUsers && this.userId) {
        if (feature.enabledForUsers.includes(this.userId)) {
          return true
        }
      }

      // Check rollout percentage
      if (feature.rolloutPercentage !== undefined && feature.rolloutPercentage < 100) {
        return this.isInRolloutGroup(flag, feature.rolloutPercentage)
      }

      return feature.enabled
    }

    return false
  }

  get<T = any>(key: string, defaultValue?: T): T {
    // For IConfigService compatibility
    const value = process.env[key] || defaultValue
    return value as T
  }

  getRequired<T = any>(key: string): T {
    const value = process.env[key]
    if (!value) {
      throw new Error(`Required config key not found: ${key}`)
    }
    return value as T
  }

  isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development'
  }

  isProduction(): boolean {
    return process.env.NODE_ENV === 'production'
  }

  private async refreshCacheIfNeeded(): Promise<void> {
    if (Date.now() - this.lastFetch < this.cacheExpiry) {
      return
    }

    try {
      const flags = await this.provider.getFlags()
      
      this.cache.clear()
      for (const flag of flags) {
        this.cache.set(flag.key, flag)
      }
      
      this.lastFetch = Date.now()
      
      this.logger?.info('Feature flags refreshed', {
        count: flags.length,
        flags: flags.map(f => ({ key: f.key, enabled: f.enabled }))
      })
    } catch (error) {
      this.logger?.error('Failed to refresh feature flags', error as Error)
    }
  }

  private isInRolloutGroup(flagKey: string, percentage: number): boolean {
    if (!this.userId) {
      // For anonymous users, use a stable random value
      const sessionId = this.getOrCreateSessionId()
      return this.hashToPercentage(flagKey + sessionId) < percentage
    }

    // For logged-in users, use their ID for stable rollout
    return this.hashToPercentage(flagKey + this.userId) < percentage
  }

  private hashToPercentage(input: string): number {
    // Simple hash function to convert string to percentage
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100
  }

  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return 'server'
    
    const key = 'vericard_session_id'
    let sessionId = sessionStorage.getItem(key)
    
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem(key, sessionId)
    }
    
    return sessionId
  }

  // Helper methods for common feature checks
  async isMultiAngleScanningEnabled(): Promise<boolean> {
    return this.getFeatureFlag('multiAngleScanning')
  }

  async isOfflineModeEnabled(): Promise<boolean> {
    return this.getFeatureFlag('offlineMode')
  }

  async isMarketDataEnabled(): Promise<boolean> {
    return this.getFeatureFlag('marketDataIntegration')
  }

  async isAdvancedGradingEnabled(): Promise<boolean> {
    return this.getFeatureFlag('advancedGrading')
  }

  async isCommunityEnabled(): Promise<boolean> {
    return this.getFeatureFlag('communityFeatures')
  }

  async isBulkScanningEnabled(): Promise<boolean> {
    return this.getFeatureFlag('bulkScanning')
  }

  // Get all enabled features for UI
  async getEnabledFeatures(): Promise<string[]> {
    await this.refreshCacheIfNeeded()
    
    const enabled: string[] = []
    for (const [key, flag] of Array.from(this.cache.entries())) {
      if (await this.getFeatureFlag(key)) {
        enabled.push(key)
      }
    }
    
    return enabled
  }
}