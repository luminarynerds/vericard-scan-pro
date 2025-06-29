/**
 * Card Database Manager - Rich Klein: Accurate, verifiable card data
 */

import { Injectable } from '../di/container'
import { ICardDatabaseService, ILogger, ICacheManager } from '../interfaces/services'
import { CardDetails } from '@/services/CardIdentificationService'
import { 
  CardDatabaseEntry, 
  ValidationResult, 
  SetInfo, 
  CardVariant 
} from '../interfaces/services'
import { Card, CardAttributes } from '../domain/models'
import { NotFoundError, ExternalServiceError } from '../errors'

// Card database provider interface
export interface ICardProvider {
  name: string
  searchCards(query: string): Promise<CardDatabaseEntry[]>
  getCard(id: string): Promise<CardDatabaseEntry | null>
  getSetInfo(year: number, manufacturer: string, setName: string): Promise<SetInfo | null>
  validateCard(details: CardDetails): Promise<Partial<ValidationResult>>
}

// TCDB Provider - The Trading Card Database
export class TCDBProvider implements ICardProvider {
  name = 'tcdb'
  private baseUrl = 'https://api.tcdb.com/v1'
  
  constructor(private apiKey?: string) {}

  async searchCards(query: string): Promise<CardDatabaseEntry[]> {
    try {
      const response = await fetch(`${this.baseUrl}/cards/search?q=${encodeURIComponent(query)}`, {
        headers: this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}
      })

      if (!response.ok) {
        throw new Error(`TCDB API error: ${response.status}`)
      }

      const data = await response.json()
      return this.transformTCDBCards(data.cards || [])
    } catch (error) {
      // Return mock data in development
      if (process.env.NODE_ENV === 'development') {
        return this.getMockCards(query)
      }
      throw new ExternalServiceError('TCDB', error as Error)
    }
  }

  async getCard(id: string): Promise<CardDatabaseEntry | null> {
    try {
      const response = await fetch(`${this.baseUrl}/cards/${id}`, {
        headers: this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}
      })

      if (response.status === 404) return null
      if (!response.ok) {
        throw new Error(`TCDB API error: ${response.status}`)
      }

      const data = await response.json()
      return this.transformTCDBCard(data)
    } catch (error) {
      return null
    }
  }

  async getSetInfo(year: number, manufacturer: string, setName: string): Promise<SetInfo | null> {
    try {
      const query = `${year} ${manufacturer} ${setName}`
      const response = await fetch(`${this.baseUrl}/sets/search?q=${encodeURIComponent(query)}`, {
        headers: this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}
      })

      if (!response.ok) return null

      const data = await response.json()
      const set = data.sets?.[0]
      if (!set) return null

      return {
        name: set.name,
        year: set.year,
        manufacturer: set.manufacturer,
        totalCards: set.cardCount,
        subsets: set.subsets || [],
        releaseDate: new Date(set.releaseDate),
        description: set.description || ''
      }
    } catch (error) {
      return null
    }
  }

  async validateCard(details: CardDetails): Promise<Partial<ValidationResult>> {
    const cards = await this.searchCards(`${details.player} ${details.year} ${details.set}`)
    const match = cards.find(c => 
      c.player === details.player &&
      c.year === details.year &&
      c.set === details.set &&
      (!details.cardNumber || c.cardNumber === details.cardNumber)
    )

    if (match) {
      return {
        isValid: true,
        confidence: 95,
        issues: []
      }
    }

    return {
      isValid: false,
      confidence: 0,
      issues: ['Card not found in database']
    }
  }

  private transformTCDBCards(cards: any[]): CardDatabaseEntry[] {
    return cards.map(card => this.transformTCDBCard(card))
  }

  private transformTCDBCard(card: any): CardDatabaseEntry {
    return {
      id: card.id.toString(),
      player: card.player || card.subject || 'Unknown',
      year: card.year,
      manufacturer: card.manufacturer,
      set: card.setName,
      subset: card.subset,
      cardNumber: card.cardNumber,
      attributes: {
        isRookie: card.rookie || false,
        isAutograph: card.auto || false,
        isPatch: card.relic || false,
        isSerialNumbered: card.serialized || false,
        printRun: card.printRun
      },
      variants: card.variants || [],
      metadata: {
        tcdbId: card.id,
        imageUrl: card.frontImage,
        backImageUrl: card.backImage
      }
    }
  }

  private getMockCards(query: string): CardDatabaseEntry[] {
    const mockDatabase: CardDatabaseEntry[] = [
      {
        id: '1',
        player: 'Mike Trout',
        year: 2023,
        manufacturer: 'Topps',
        set: 'Chrome',
        cardNumber: '27',
        attributes: {
          isRookie: false,
          isAutograph: false,
          isPatch: false,
          isSerialNumbered: false
        },
        variants: ['Base', 'Refractor', 'Gold Refractor /50', 'Superfractor 1/1'],
        metadata: {}
      },
      {
        id: '2',
        player: 'Connor Bedard',
        year: 2023,
        manufacturer: 'Upper Deck',
        set: 'Young Guns',
        cardNumber: '451',
        attributes: {
          isRookie: true,
          isAutograph: false,
          isPatch: false,
          isSerialNumbered: false
        },
        variants: ['Base', 'Canvas', 'Exclusives /100'],
        metadata: {}
      },
      {
        id: '3',
        player: 'Michael Jordan',
        year: 1986,
        manufacturer: 'Fleer',
        set: 'Basketball',
        cardNumber: '57',
        attributes: {
          isRookie: true,
          isAutograph: false,
          isPatch: false,
          isSerialNumbered: false
        },
        variants: ['Base'],
        metadata: {}
      }
    ]

    // Simple search matching
    const lowerQuery = query.toLowerCase()
    return mockDatabase.filter(card => 
      card.player.toLowerCase().includes(lowerQuery) ||
      card.set.toLowerCase().includes(lowerQuery) ||
      card.manufacturer.toLowerCase().includes(lowerQuery) ||
      card.year.toString().includes(lowerQuery)
    )
  }
}

// Beckett Provider
export class BeckettProvider implements ICardProvider {
  name = 'beckett'
  private baseUrl = 'https://api.beckett.com/v1'

  constructor(private apiKey: string) {}

  async searchCards(query: string): Promise<CardDatabaseEntry[]> {
    // Beckett API integration would go here
    // Requires paid subscription
    return []
  }

  async getCard(id: string): Promise<CardDatabaseEntry | null> {
    return null
  }

  async getSetInfo(year: number, manufacturer: string, setName: string): Promise<SetInfo | null> {
    return null
  }

  async validateCard(details: CardDetails): Promise<Partial<ValidationResult>> {
    return {
      isValid: false,
      confidence: 0,
      issues: ['Beckett validation not implemented']
    }
  }
}

// Local database provider for offline support
export class LocalDatabaseProvider implements ICardProvider {
  name = 'local'
  private db: IDBDatabase | null = null

  async initialize(): Promise<void> {
    const request = indexedDB.open('VeriCardDatabase', 1)
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      
      if (!db.objectStoreNames.contains('cards')) {
        const cardStore = db.createObjectStore('cards', { keyPath: 'id' })
        cardStore.createIndex('player', 'player')
        cardStore.createIndex('year', 'year')
        cardStore.createIndex('set', 'set')
      }
      
      if (!db.objectStoreNames.contains('sets')) {
        const setStore = db.createObjectStore('sets', { keyPath: 'id' })
        setStore.createIndex('yearManufacturer', ['year', 'manufacturer'])
      }
    }

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  async searchCards(query: string): Promise<CardDatabaseEntry[]> {
    if (!this.db) await this.initialize()
    
    const transaction = this.db!.transaction(['cards'], 'readonly')
    const store = transaction.objectStore('cards')
    const cards: CardDatabaseEntry[] = []
    
    return new Promise((resolve, reject) => {
      const request = store.openCursor()
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          const card = cursor.value as CardDatabaseEntry
          if (this.matchesQuery(card, query)) {
            cards.push(card)
          }
          cursor.continue()
        } else {
          resolve(cards)
        }
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  async getCard(id: string): Promise<CardDatabaseEntry | null> {
    if (!this.db) await this.initialize()
    
    const transaction = this.db!.transaction(['cards'], 'readonly')
    const store = transaction.objectStore('cards')
    
    return new Promise((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getSetInfo(year: number, manufacturer: string, setName: string): Promise<SetInfo | null> {
    if (!this.db) await this.initialize()
    
    const transaction = this.db!.transaction(['sets'], 'readonly')
    const store = transaction.objectStore('sets')
    const index = store.index('yearManufacturer')
    
    return new Promise((resolve, reject) => {
      const request = index.get([year, manufacturer])
      request.onsuccess = () => {
        const sets = request.result as SetInfo[]
        const match = sets?.find(s => s.name === setName)
        resolve(match || null)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async validateCard(details: CardDetails): Promise<Partial<ValidationResult>> {
    const card = await this.searchCards(`${details.player} ${details.year} ${details.set}`)
      .then(cards => cards[0])
    
    return {
      isValid: !!card,
      confidence: card ? 90 : 0,
      issues: card ? [] : ['Card not found in local database']
    }
  }

  async saveCard(card: CardDatabaseEntry): Promise<void> {
    if (!this.db) await this.initialize()
    
    const transaction = this.db!.transaction(['cards'], 'readwrite')
    const store = transaction.objectStore('cards')
    await store.put(card)
  }

  private matchesQuery(card: CardDatabaseEntry, query: string): boolean {
    const lowerQuery = query.toLowerCase()
    return (
      card.player.toLowerCase().includes(lowerQuery) ||
      card.set.toLowerCase().includes(lowerQuery) ||
      card.manufacturer.toLowerCase().includes(lowerQuery) ||
      card.year.toString().includes(lowerQuery) ||
      (card.cardNumber && card.cardNumber.includes(lowerQuery))
    )
  }
}

// Main Card Database Manager
@Injectable()
export class CardDatabaseManager implements ICardDatabaseService {
  private providers: ICardProvider[] = []
  private localProvider: LocalDatabaseProvider

  constructor(
    private logger?: ILogger,
    private cache?: ICacheManager
  ) {
    this.localProvider = new LocalDatabaseProvider()
    this.initializeProviders()
  }

  private initializeProviders(): void {
    // Always use local provider
    this.providers.push(this.localProvider)
    
    // Add TCDB
    this.providers.push(new TCDBProvider(process.env.NEXT_PUBLIC_TCDB_API_KEY))
    
    // Add Beckett if API key available
    if (process.env.NEXT_PUBLIC_BECKETT_API_KEY) {
      this.providers.push(new BeckettProvider(process.env.NEXT_PUBLIC_BECKETT_API_KEY))
    }
    
    this.logger?.info('Card database providers initialized', {
      providers: this.providers.map(p => p.name)
    })
  }

  async lookupCard(details: Partial<CardDetails>): Promise<CardDatabaseEntry | null> {
    const query = [details.player, details.year, details.set, details.cardNumber]
      .filter(Boolean)
      .join(' ')
    
    const cacheKey = `card:${query}`
    
    // Check cache
    if (this.cache) {
      const cached = await this.cache.get<CardDatabaseEntry>(cacheKey)
      if (cached) return cached
    }

    // Search across all providers
    for (const provider of this.providers) {
      try {
        const cards = await provider.searchCards(query)
        const match = this.findBestMatch(cards, details)
        
        if (match) {
          // Cache successful result
          if (this.cache) {
            await this.cache.set(cacheKey, match, 24 * 60 * 60 * 1000) // 24 hours
          }
          
          // Save to local database for offline support
          if (provider.name !== 'local') {
            await this.localProvider.saveCard(match)
          }
          
          return match
        }
      } catch (error) {
        this.logger?.warn(`Provider ${provider.name} lookup failed`, { error })
      }
    }

    return null
  }

  async searchCards(query: string): Promise<CardDatabaseEntry[]> {
    const cacheKey = `search:${query}`
    
    if (this.cache) {
      const cached = await this.cache.get<CardDatabaseEntry[]>(cacheKey)
      if (cached) return cached
    }

    const allResults: CardDatabaseEntry[] = []
    const seen = new Set<string>()

    // Search all providers in parallel
    const promises = this.providers.map(provider =>
      provider.searchCards(query)
        .catch(err => {
          this.logger?.warn(`Provider ${provider.name} search failed`, { error: err })
          return []
        })
    )

    const results = await Promise.all(promises)
    
    for (const providerResults of results) {
      for (const card of providerResults) {
        const key = `${card.player}-${card.year}-${card.set}-${card.cardNumber}`
        if (!seen.has(key)) {
          seen.add(key)
          allResults.push(card)
        }
      }
    }

    // Sort by relevance
    const sortedResults = this.sortByRelevance(allResults, query)
    
    if (this.cache) {
      await this.cache.set(cacheKey, sortedResults, 60 * 60 * 1000) // 1 hour
    }

    return sortedResults
  }

  async validateCard(details: CardDetails): Promise<ValidationResult> {
    const validations = await Promise.all(
      this.providers.map(provider =>
        provider.validateCard(details)
          .catch(() => ({ isValid: false, confidence: 0, issues: [] }))
      )
    )

    // Aggregate validation results
    const validCount = validations.filter(v => v.isValid).length
    const totalConfidence = validations.reduce((sum, v) => sum + (v.confidence || 0), 0)
    const allIssues = validations.flatMap(v => v.issues || [])
    
    const isValid = validCount > 0
    const confidence = totalConfidence / this.providers.length
    
    const suggestions: string[] = []
    if (!isValid) {
      suggestions.push('Check card number and variant spelling')
      suggestions.push('Verify manufacturer name (Topps vs. Topps Chrome)')
      suggestions.push('Ensure year is correct')
    }

    return {
      isValid,
      confidence,
      issues: [...new Set(allIssues)], // Deduplicate
      suggestions
    }
  }

  async getSetInfo(year: number, manufacturer: string, setName: string): Promise<SetInfo> {
    // Try each provider until we get a result
    for (const provider of this.providers) {
      try {
        const info = await provider.getSetInfo(year, manufacturer, setName)
        if (info) return info
      } catch (error) {
        this.logger?.warn(`Provider ${provider.name} set info failed`, { error })
      }
    }

    // Return default if no provider has the info
    return {
      name: setName,
      year,
      manufacturer,
      totalCards: 0,
      subsets: [],
      releaseDate: new Date(year, 0, 1),
      description: ''
    }
  }

  async getVariants(baseCard: CardDetails): Promise<CardVariant[]> {
    const card = await this.lookupCard(baseCard)
    if (!card) return []

    const variants: CardVariant[] = []
    
    for (const variantName of card.variants) {
      variants.push({
        name: variantName,
        rarity: this.determineRarity(variantName),
        estimatedPrintRun: this.estimatePrintRun(variantName),
        distinguishingFeatures: this.getDistinguishingFeatures(variantName)
      })
    }

    return variants
  }

  private findBestMatch(cards: CardDatabaseEntry[], target: Partial<CardDetails>): CardDatabaseEntry | null {
    if (cards.length === 0) return null
    
    // Score each card based on matching fields
    const scored = cards.map(card => {
      let score = 0
      
      if (target.player && card.player === target.player) score += 10
      if (target.year && card.year === target.year) score += 10
      if (target.set && card.set === target.set) score += 10
      if (target.cardNumber && card.cardNumber === target.cardNumber) score += 5
      if (target.manufacturer && card.manufacturer === target.manufacturer) score += 5
      
      // Bonus for matching special attributes
      if (target.isRookie !== undefined && card.attributes.isRookie === target.isRookie) score += 2
      if (target.isAutograph !== undefined && card.attributes.isAutograph === target.isAutograph) score += 2
      
      return { card, score }
    })

    // Sort by score and return best match
    scored.sort((a, b) => b.score - a.score)
    return scored[0].score > 10 ? scored[0].card : null
  }

  private sortByRelevance(cards: CardDatabaseEntry[], query: string): CardDatabaseEntry[] {
    const lowerQuery = query.toLowerCase()
    
    return cards.sort((a, b) => {
      // Exact matches first
      const aExact = a.player.toLowerCase() === lowerQuery
      const bExact = b.player.toLowerCase() === lowerQuery
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      
      // Then rookies and special cards
      const aSpecial = a.attributes.isRookie || a.attributes.isAutograph
      const bSpecial = b.attributes.isRookie || b.attributes.isAutograph
      if (aSpecial && !bSpecial) return -1
      if (!aSpecial && bSpecial) return 1
      
      // Then by year (newer first)
      return b.year - a.year
    })
  }

  private determineRarity(variantName: string): string {
    const lower = variantName.toLowerCase()
    
    if (lower.includes('1/1') || lower.includes('superfractor')) return 'legendary'
    if (lower.includes('/10') || lower.includes('/25')) return 'mythic'
    if (lower.includes('/50') || lower.includes('/99')) return 'rare'
    if (lower.includes('refractor') || lower.includes('/199')) return 'uncommon'
    
    return 'common'
  }

  private estimatePrintRun(variantName: string): number | undefined {
    const match = variantName.match(/\/(\d+)/)
    if (match) return parseInt(match[1])
    
    if (variantName.includes('1/1')) return 1
    if (variantName.toLowerCase().includes('base')) return undefined // Unknown high print run
    
    return undefined
  }

  private getDistinguishingFeatures(variantName: string): string[] {
    const features: string[] = []
    const lower = variantName.toLowerCase()
    
    if (lower.includes('refractor')) features.push('Refractor coating')
    if (lower.includes('gold')) features.push('Gold coloring')
    if (lower.includes('black')) features.push('Black coloring')
    if (lower.includes('auto')) features.push('Autographed')
    if (lower.includes('patch')) features.push('Game-worn patch')
    if (lower.includes('prizm')) features.push('Prizm technology')
    if (lower.includes('chrome')) features.push('Chrome finish')
    
    return features
  }
}