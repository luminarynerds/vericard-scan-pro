import { CardDetails } from './CardIdentificationService'

export interface MarketData {
  recentSales: Sale[]
  averagePrice: number
  medianPrice: number
  priceRange: { min: number; max: number }
  velocity: number // sales per month
  trend: 'rising' | 'falling' | 'stable'
  lastUpdated: number
  dataSource: string
}

export interface Sale {
  price: number
  date: number
  source: 'ebay' | 'tcdb' | 'pwcc' | 'other'
  condition: string
  title: string
  url?: string
}

export interface PopulationReport {
  total: number
  byGrade: Record<number, number>
  source: 'psa' | 'bgs' | 'sgc'
  lastUpdated: number
}

export class MarketDataService {
  private static instance: MarketDataService
  private cache: Map<string, { data: MarketData; timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 15 * 60 * 1000 // 15 minutes

  static getInstance(): MarketDataService {
    if (!MarketDataService.instance) {
      MarketDataService.instance = new MarketDataService()
    }
    return MarketDataService.instance
  }

  async getMarketData(card: CardDetails, grade: number): Promise<MarketData> {
    const cacheKey = this.getCacheKey(card, grade)
    
    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }

    try {
      // In production, these would be real API calls
      const [ebayData, tcdbData] = await Promise.all([
        this.fetchEbayData(card, grade),
        this.fetchTCDBData(card, grade)
      ])

      const allSales = [...ebayData, ...tcdbData].sort((a, b) => b.date - a.date)
      const marketData = this.analyzeMarketData(allSales)

      // Cache the result
      this.cache.set(cacheKey, { data: marketData, timestamp: Date.now() })

      return marketData
    } catch (error) {
      console.error('Market data fetch failed:', error)
      // Return mock data as fallback
      return this.getMockMarketData(card, grade)
    }
  }

  private async fetchEbayData(card: CardDetails, grade: number): Promise<Sale[]> {
    // In production: Use eBay Finding API or web scraping
    // For now, return realistic mock data based on card type
    
    const searchQuery = `${card.player} ${card.year} ${card.set} ${card.cardNumber || ''} PSA ${grade}`
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Generate realistic sales data based on card attributes
    const basePrice = this.calculateBaseMarketPrice(card, grade)
    const sales: Sale[] = []
    
    // Generate 10-20 recent sales with variance
    const numSales = 10 + Math.floor(Math.random() * 10)
    for (let i = 0; i < numSales; i++) {
      const daysAgo = i * 3 + Math.floor(Math.random() * 5)
      const variance = 0.7 + Math.random() * 0.6 // 70% to 130% of base
      
      sales.push({
        price: Math.round(basePrice * variance),
        date: Date.now() - (daysAgo * 24 * 60 * 60 * 1000),
        source: 'ebay',
        condition: `PSA ${grade}`,
        title: `${card.year} ${card.set} ${card.player} #${card.cardNumber || 'N/A'} PSA ${grade}`,
        url: `https://www.ebay.com/itm/${Math.random().toString(36).substr(2, 9)}`
      })
    }

    return sales
  }

  private async fetchTCDBData(card: CardDetails, grade: number): Promise<Sale[]> {
    // In production: Use TCDB API
    // For now, return empty array (eBay is primary source)
    return []
  }

  private analyzeMarketData(sales: Sale[]): MarketData {
    if (sales.length === 0) {
      return {
        recentSales: [],
        averagePrice: 0,
        medianPrice: 0,
        priceRange: { min: 0, max: 0 },
        velocity: 0,
        trend: 'stable',
        lastUpdated: Date.now(),
        dataSource: 'none'
      }
    }

    const prices = sales.map(s => s.price).sort((a, b) => a - b)
    const averagePrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    const medianPrice = prices[Math.floor(prices.length / 2)]
    
    // Calculate velocity (sales per month)
    const oldestSale = sales[sales.length - 1]
    const daysCovered = (Date.now() - oldestSale.date) / (1000 * 60 * 60 * 24)
    const velocity = Math.round((sales.length / daysCovered) * 30)

    // Determine trend by comparing recent vs older prices
    const recentAvg = sales.slice(0, 5).reduce((a, s) => a + s.price, 0) / Math.min(5, sales.length)
    const olderAvg = sales.slice(-5).reduce((a, s) => a + s.price, 0) / Math.min(5, sales.length)
    const trend = recentAvg > olderAvg * 1.1 ? 'rising' : 
                  recentAvg < olderAvg * 0.9 ? 'falling' : 'stable'

    return {
      recentSales: sales.slice(0, 10), // Top 10 most recent
      averagePrice,
      medianPrice,
      priceRange: { min: prices[0], max: prices[prices.length - 1] },
      velocity,
      trend,
      lastUpdated: Date.now(),
      dataSource: 'ebay'
    }
  }

  private calculateBaseMarketPrice(card: CardDetails, grade: number): number {
    // More sophisticated pricing based on real market factors
    let basePrice = 10

    // Player factor (top players command premium)
    const elitePlayers = ['Mike Trout', 'Connor Bedard', 'Michael Jordan', 'Tom Brady', 'Shohei Ohtani']
    const starPlayers = ['Julio Rodriguez', 'Patrick Mahomes', 'LeBron James', 'Wayne Gretzky']
    
    if (elitePlayers.includes(card.player)) {
      basePrice *= 20
    } else if (starPlayers.includes(card.player)) {
      basePrice *= 10
    }

    // Rookie premium
    if (card.isRookie) {
      basePrice *= 3
    }

    // Special card premiums
    if (card.isAutograph) {
      basePrice *= 5
    }
    if (card.isPatch) {
      basePrice *= 2
    }
    if (card.variant?.toLowerCase().includes('refractor')) {
      basePrice *= 1.5
    }
    if (card.serialNumber) {
      basePrice *= 2
    }

    // Vintage premium
    if (card.year < 1990) {
      basePrice *= 3
    } else if (card.year < 2000) {
      basePrice *= 1.5
    }

    // Grade multiplier (exponential for high grades)
    const gradeMultipliers: Record<number, number> = {
      10: 10,
      9: 3,
      8: 1.5,
      7: 1,
      6: 0.5,
      5: 0.25,
      4: 0.1,
      3: 0.05,
      2: 0.02,
      1: 0.01
    }
    basePrice *= gradeMultipliers[grade] || 0.5

    return Math.round(basePrice)
  }

  async getPopulationReport(card: CardDetails): Promise<PopulationReport> {
    // In production: Query PSA, BGS, SGC APIs
    // For now, return realistic mock data
    
    await new Promise(resolve => setTimeout(resolve, 300))

    // Generate realistic population numbers
    const isModern = card.year >= 2020
    const isVintage = card.year < 1990
    const totalBase = isVintage ? 1000 : isModern ? 10000 : 5000

    // Adjust for card rarity
    let totalMultiplier = 1
    if (card.isAutograph) totalMultiplier *= 0.1
    if (card.isPatch) totalMultiplier *= 0.2
    if (card.serialNumber) totalMultiplier *= 0.05
    
    const total = Math.round(totalBase * totalMultiplier)

    // Generate bell curve distribution
    const distribution = {
      10: Math.round(total * 0.02),
      9: Math.round(total * 0.15),
      8: Math.round(total * 0.25),
      7: Math.round(total * 0.20),
      6: Math.round(total * 0.15),
      5: Math.round(total * 0.10),
      4: Math.round(total * 0.07),
      3: Math.round(total * 0.04),
      2: Math.round(total * 0.015),
      1: Math.round(total * 0.005)
    }

    return {
      total,
      byGrade: distribution,
      source: 'psa',
      lastUpdated: Date.now()
    }
  }

  private getCacheKey(card: CardDetails, grade: number): string {
    return `${card.player}-${card.year}-${card.set}-${card.cardNumber}-${grade}`
  }

  private getMockMarketData(card: CardDetails, grade: number): MarketData {
    const basePrice = this.calculateBaseMarketPrice(card, grade)
    
    return {
      recentSales: [
        {
          price: basePrice,
          date: Date.now() - 24 * 60 * 60 * 1000,
          source: 'ebay',
          condition: `PSA ${grade}`,
          title: `${card.year} ${card.set} ${card.player}`,
        }
      ],
      averagePrice: basePrice,
      medianPrice: basePrice,
      priceRange: { min: basePrice * 0.8, max: basePrice * 1.2 },
      velocity: 5,
      trend: 'stable',
      lastUpdated: Date.now(),
      dataSource: 'mock'
    }
  }
}

export const marketDataService = MarketDataService.getInstance()