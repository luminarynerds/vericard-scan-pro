import { CardDetails } from './CardIdentificationService'

export interface CardDatabase {
  id: string
  player: string
  year: number
  set: string
  cardNumber?: string
  manufacturer: string
  sport: 'baseball' | 'basketball' | 'football' | 'hockey' | 'soccer' | 'other'
  team?: string
  position?: string
  attributes: {
    isRookie: boolean
    isAutograph: boolean
    isPatch: boolean
    isSerial: boolean
    isRefractor: boolean
    isParallel: boolean
  }
  variants: CardVariant[]
  marketInfo?: {
    lastSale?: number
    averagePrice?: number
    priceHistory?: PricePoint[]
  }
}

export interface CardVariant {
  name: string
  serialTo?: number
  rarity: 'common' | 'uncommon' | 'rare' | 'super-rare' | 'ultra-rare'
  estimatedPrintRun?: number
}

export interface PricePoint {
  date: number
  price: number
  grade: number
  source: string
}

export class CardDatabaseService {
  private static instance: CardDatabaseService
  private mockDatabase: Map<string, CardDatabase> = new Map()

  constructor() {
    this.initializeMockDatabase()
  }

  static getInstance(): CardDatabaseService {
    if (!CardDatabaseService.instance) {
      CardDatabaseService.instance = new CardDatabaseService()
    }
    return CardDatabaseService.instance
  }

  async lookupCard(details: Partial<CardDetails>): Promise<CardDatabase | null> {
    // In production: Query TCDB, Beckett, or proprietary database
    // For now: Use mock database with fuzzy matching
    
    await new Promise(resolve => setTimeout(resolve, 300)) // Simulate API delay

    // Try exact match first
    const exactKey = this.generateKey(details)
    if (this.mockDatabase.has(exactKey)) {
      return this.mockDatabase.get(exactKey)!
    }

    // Fuzzy match by player and year
    const entries = Array.from(this.mockDatabase.entries())
    for (const [key, card] of entries) {
      if (card.player === details.player && card.year === details.year) {
        return card
      }
    }

    // Return null if no match found
    return null
  }

  async verifyAuthenticity(cardId: string, features: any): Promise<{
    authentic: boolean
    confidence: number
    warnings?: string[]
  }> {
    // In production: Compare against known counterfeit patterns
    // Check print quality, color matching, security features
    
    await new Promise(resolve => setTimeout(resolve, 200))

    const warnings: string[] = []
    let confidence = 95

    // Mock authenticity checks
    if (Math.random() > 0.95) {
      warnings.push('Unusual print pattern detected')
      confidence -= 20
    }

    if (Math.random() > 0.98) {
      warnings.push('Color saturation outside normal range')
      confidence -= 15
    }

    return {
      authentic: confidence > 70,
      confidence,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }

  private generateKey(details: Partial<CardDetails>): string {
    return `${details.player}-${details.year}-${details.set}-${details.cardNumber || 'base'}`
  }

  private initializeMockDatabase() {
    // Initialize with comprehensive mock data
    const mockCards: CardDatabase[] = [
      {
        id: 'bishop-sankey-2015-valor-vrap-bs',
        player: 'Bishop Sankey',
        year: 2015,
        set: 'Topps Valor Football',
        cardNumber: 'VRAP-BS',
        manufacturer: 'Topps',
        sport: 'football',
        team: 'Tennessee Titans',
        position: 'RB',
        attributes: {
          isRookie: true,
          isAutograph: true,
          isPatch: true,
          isSerial: false,
          isRefractor: false,
          isParallel: true
        },
        variants: [
          { name: 'Valor Rookie Autograph Patches', rarity: 'super-rare', estimatedPrintRun: 199 }
        ]
      },
      {
        id: 'mike-trout-2023-chrome-27',
        player: 'Mike Trout',
        year: 2023,
        set: 'Topps Chrome',
        cardNumber: '27',
        manufacturer: 'Topps',
        sport: 'baseball',
        team: 'Los Angeles Angels',
        position: 'CF',
        attributes: {
          isRookie: false,
          isAutograph: false,
          isPatch: false,
          isSerial: false,
          isRefractor: false,
          isParallel: false
        },
        variants: [
          { name: 'Base', rarity: 'common' },
          { name: 'Refractor', rarity: 'uncommon' },
          { name: 'Gold Refractor', serialTo: 50, rarity: 'rare' },
          { name: 'Superfractor', serialTo: 1, rarity: 'ultra-rare' }
        ]
      },
      {
        id: 'julio-rodriguez-2022-topps-215',
        player: 'Julio Rodriguez',
        year: 2022,
        set: 'Topps Series 1',
        cardNumber: '215',
        manufacturer: 'Topps',
        sport: 'baseball',
        team: 'Seattle Mariners',
        position: 'CF',
        attributes: {
          isRookie: true,
          isAutograph: false,
          isPatch: false,
          isSerial: false,
          isRefractor: false,
          isParallel: false
        },
        variants: [
          { name: 'Base Rookie Card', rarity: 'common' },
          { name: 'Gold', serialTo: 2022, rarity: 'uncommon' },
          { name: 'Black', serialTo: 70, rarity: 'rare' },
          { name: 'Platinum Anniversary', serialTo: 1, rarity: 'ultra-rare' }
        ],
        marketInfo: {
          lastSale: 125,
          averagePrice: 110,
          priceHistory: [
            { date: Date.now() - 30 * 24 * 60 * 60 * 1000, price: 95, grade: 9, source: 'ebay' },
            { date: Date.now() - 15 * 24 * 60 * 60 * 1000, price: 115, grade: 9, source: 'ebay' },
            { date: Date.now() - 7 * 24 * 60 * 60 * 1000, price: 125, grade: 9, source: 'ebay' }
          ]
        }
      },
      {
        id: 'connor-bedard-2023-yg-451',
        player: 'Connor Bedard',
        year: 2023,
        set: 'Upper Deck Young Guns',
        cardNumber: '451',
        manufacturer: 'Upper Deck',
        sport: 'hockey',
        team: 'Chicago Blackhawks',
        position: 'C',
        attributes: {
          isRookie: true,
          isAutograph: false,
          isPatch: false,
          isSerial: false,
          isRefractor: false,
          isParallel: false
        },
        variants: [
          { name: 'Young Guns', rarity: 'uncommon' },
          { name: 'Young Guns Canvas', rarity: 'rare' },
          { name: 'Young Guns Exclusive', serialTo: 100, rarity: 'super-rare' }
        ]
      },
      {
        id: 'michael-jordan-1986-fleer-57',
        player: 'Michael Jordan',
        year: 1986,
        set: 'Fleer Basketball',
        cardNumber: '57',
        manufacturer: 'Fleer',
        sport: 'basketball',
        team: 'Chicago Bulls',
        position: 'SG',
        attributes: {
          isRookie: true,
          isAutograph: false,
          isPatch: false,
          isSerial: false,
          isRefractor: false,
          isParallel: false
        },
        variants: [
          { name: 'Base Rookie', rarity: 'rare', estimatedPrintRun: 200000 }
        ],
        marketInfo: {
          lastSale: 25000,
          averagePrice: 20000,
          priceHistory: [
            { date: Date.now() - 365 * 24 * 60 * 60 * 1000, price: 15000, grade: 8, source: 'pwcc' },
            { date: Date.now() - 180 * 24 * 60 * 60 * 1000, price: 18000, grade: 8, source: 'heritage' },
            { date: Date.now() - 30 * 24 * 60 * 60 * 1000, price: 25000, grade: 8, source: 'goldin' }
          ]
        }
      }
    ]

    // Add to mock database
    mockCards.forEach(card => {
      const key = this.generateKey({
        player: card.player,
        year: card.year,
        set: card.set,
        cardNumber: card.cardNumber
      })
      this.mockDatabase.set(key, card)
    })
  }

  async getSetChecklist(manufacturer: string, year: number, setName: string): Promise<CardDatabase[]> {
    // In production: Return full checklist from database
    const checklist: CardDatabase[] = []
    
    const cards = Array.from(this.mockDatabase.values())
    for (const card of cards) {
      if (card.manufacturer === manufacturer && 
          card.year === year && 
          card.set === setName) {
        checklist.push(card)
      }
    }

    return checklist.sort((a, b) => {
      const numA = parseInt(a.cardNumber || '0')
      const numB = parseInt(b.cardNumber || '0')
      return numA - numB
    })
  }

  async searchPlayers(query: string): Promise<Array<{
    player: string
    teams: string[]
    years: number[]
    sport: string
  }>> {
    // In production: Full-text search across player database
    const players = new Map<string, {
      teams: Set<string>
      years: Set<number>
      sport: string
    }>()

    const cards = Array.from(this.mockDatabase.values())
    for (const card of cards) {
      if (card.player.toLowerCase().includes(query.toLowerCase())) {
        if (!players.has(card.player)) {
          players.set(card.player, {
            teams: new Set(),
            years: new Set(),
            sport: card.sport
          })
        }
        const playerData = players.get(card.player)!
        if (card.team) playerData.teams.add(card.team)
        playerData.years.add(card.year)
      }
    }

    return Array.from(players.entries()).map(([player, data]) => ({
      player,
      teams: Array.from(data.teams),
      years: Array.from(data.years).sort(),
      sport: data.sport
    }))
  }
}

export const cardDatabaseService = CardDatabaseService.getInstance()