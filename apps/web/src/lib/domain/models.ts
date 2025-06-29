/**
 * Domain Models - Rich Klein & Grace Hopper: Clean, validated domain entities
 */

// Rich Klein: Card entity with comprehensive metadata
export class Card {
  constructor(
    public readonly id: string,
    public readonly player: string,
    public readonly year: number,
    public readonly manufacturer: string,
    public readonly set: string,
    public readonly cardNumber?: string,
    public readonly subset?: string,
    public readonly variant?: string,
    public readonly attributes: CardAttributes = new CardAttributes(),
    public readonly metadata: Record<string, any> = {}
  ) {
    this.validate()
  }

  private validate(): void {
    if (!this.player || this.player.trim().length === 0) {
      throw new Error('Card player name is required')
    }
    if (this.year < 1900 || this.year > new Date().getFullYear() + 1) {
      throw new Error('Invalid card year')
    }
    if (!this.manufacturer || !this.set) {
      throw new Error('Manufacturer and set are required')
    }
  }

  get displayName(): string {
    const parts = [this.year, this.manufacturer, this.set]
    if (this.cardNumber) parts.push(`#${this.cardNumber}`)
    parts.push(this.player)
    if (this.variant) parts.push(`(${this.variant})`)
    return parts.join(' ')
  }

  get uniqueId(): string {
    return `${this.year}-${this.manufacturer}-${this.set}-${this.cardNumber || 'base'}-${this.player}`.toLowerCase().replace(/\s+/g, '-')
  }

  isHighValue(): boolean {
    return this.attributes.isRookie || 
           this.attributes.isAutograph || 
           this.attributes.isPatch ||
           (this.attributes.serialNumber !== undefined && this.attributes.serialNumber < 100)
  }
}

export class CardAttributes {
  constructor(
    public readonly isRookie: boolean = false,
    public readonly isAutograph: boolean = false,
    public readonly isPatch: boolean = false,
    public readonly isRefractor: boolean = false,
    public readonly isParallel: boolean = false,
    public readonly serialNumber?: number,
    public readonly printRun?: number
  ) {}

  get rarity(): 'common' | 'uncommon' | 'rare' | 'legendary' {
    if (this.serialNumber && this.serialNumber <= 10) return 'legendary'
    if (this.isAutograph && this.isPatch) return 'legendary'
    if (this.isAutograph || (this.serialNumber && this.serialNumber <= 100)) return 'rare'
    if (this.isPatch || this.isRefractor || this.isRookie) return 'uncommon'
    return 'common'
  }
}

// Fei-Fei Li: Scan result with confidence scoring
export class ScanResult {
  constructor(
    public readonly scanId: string,
    public readonly timestamp: Date,
    public readonly card: Card | null,
    public readonly grade: Grade,
    public readonly damageAssessment: DamageAssessment,
    public readonly authenticity: AuthenticityResult,
    public readonly confidence: ConfidenceScore,
    public readonly images: ScanImages,
    public readonly processingTime: number
  ) {}

  get isHighConfidence(): boolean {
    return this.confidence.overall >= 85
  }

  get requiresManualReview(): boolean {
    return this.confidence.overall < 70 || !this.authenticity.isAuthentic
  }
}

export class Grade {
  private static readonly GRADE_LABELS = {
    10: 'Gem Mint',
    9.5: 'Gem Mint',
    9: 'Mint',
    8.5: 'Near Mint-Mint+',
    8: 'Near Mint-Mint',
    7.5: 'Near Mint+',
    7: 'Near Mint',
    6.5: 'Excellent-Mint+',
    6: 'Excellent-Mint',
    5.5: 'Excellent+',
    5: 'Excellent',
    4.5: 'Very Good-Excellent+',
    4: 'Very Good-Excellent',
    3.5: 'Very Good+',
    3: 'Very Good',
    2.5: 'Good+',
    2: 'Good',
    1.5: 'Fair-Good',
    1: 'Poor'
  }

  constructor(
    public readonly numeric: number,
    public readonly centering: CenteringScore,
    public readonly corners: number,
    public readonly edges: number,
    public readonly surface: number
  ) {
    if (numeric < 1 || numeric > 10) {
      throw new Error('Grade must be between 1 and 10')
    }
  }

  get label(): string {
    return (Grade.GRADE_LABELS as any)[this.numeric] || 'Unknown'
  }

  get subgrades(): { centering: string; corners: number; edges: number; surface: number } {
    return {
      centering: this.centering.toString(),
      corners: this.corners,
      edges: this.edges,
      surface: this.surface
    }
  }
}

export class CenteringScore {
  constructor(
    public readonly leftRight: number,
    public readonly topBottom: number
  ) {}

  toString(): string {
    return `${this.leftRight}/${100 - this.leftRight} LR, ${this.topBottom}/${100 - this.topBottom} TB`
  }

  get score(): number {
    const lrDiff = Math.abs(50 - this.leftRight)
    const tbDiff = Math.abs(50 - this.topBottom)
    return 10 - (lrDiff + tbDiff) / 10
  }
}

export class DamageAssessment {
  constructor(
    public readonly damages: Damage[] = [],
    public readonly overallCondition: 'mint' | 'near-mint' | 'excellent' | 'good' | 'poor'
  ) {}

  get hasMajorDamage(): boolean {
    return this.damages.some(d => d.severity === 'major')
  }

  get damageTypes(): string[] {
    return Array.from(new Set(this.damages.map(d => d.type)))
  }
}

export class Damage {
  constructor(
    public readonly type: DamageType,
    public readonly severity: 'minor' | 'moderate' | 'major',
    public readonly location: string,
    public readonly description?: string
  ) {}
}

export type DamageType = 
  | 'scratch'
  | 'crease'
  | 'corner-wear'
  | 'edge-wear'
  | 'surface-wear'
  | 'stain'
  | 'fade'
  | 'print-defect'

export class AuthenticityResult {
  constructor(
    public readonly isAuthentic: boolean,
    public readonly confidence: number,
    public readonly indicators: AuthenticityIndicator[],
    public readonly warnings: string[] = []
  ) {}

  get risk(): 'low' | 'medium' | 'high' {
    if (!this.isAuthentic || this.confidence < 60) return 'high'
    if (this.confidence < 80 || this.warnings.length > 0) return 'medium'
    return 'low'
  }
}

export interface AuthenticityIndicator {
  feature: string
  detected: boolean
  confidence: number
}

export class ConfidenceScore {
  constructor(
    public readonly overall: number,
    public readonly cardIdentification: number,
    public readonly gradeAccuracy: number,
    public readonly damageDetection: number,
    public readonly authenticityCheck: number
  ) {}

  get lowest(): number {
    return Math.min(
      this.cardIdentification,
      this.gradeAccuracy,
      this.damageDetection,
      this.authenticityCheck
    )
  }
}

export class ScanImages {
  constructor(
    public readonly front: string,
    public readonly back?: string,
    public readonly topEdge?: string,
    public readonly bottomEdge?: string,
    public readonly leftEdge?: string,
    public readonly rightEdge?: string
  ) {}

  get all(): string[] {
    return Object.values(this).filter(img => img !== undefined)
  }

  get hasAllAngles(): boolean {
    return !!(this.front && this.back && this.topEdge && this.bottomEdge && this.leftEdge && this.rightEdge)
  }
}

// Sara Menker: Market data with trend analysis
export class MarketValue {
  constructor(
    public readonly card: Card,
    public readonly grade: number,
    public readonly currentPrice: number,
    public readonly priceHistory: PriceHistory,
    public readonly marketTrend: MarketTrend,
    public readonly comparables: Comparable[],
    public readonly lastUpdated: Date
  ) {}

  get priceRange(): { low: number; high: number } {
    const prices = this.priceHistory.points.map(p => p.price)
    return {
      low: Math.min(...prices),
      high: Math.max(...prices)
    }
  }

  get volatility(): number {
    const prices = this.priceHistory.points.map(p => p.price)
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - avg, 2), 0) / prices.length
    return Math.sqrt(variance) / avg
  }
}

export class PriceHistory {
  constructor(
    public readonly points: PricePoint[],
    public readonly period: 'day' | 'week' | 'month' | 'year'
  ) {}

  get average(): number {
    if (this.points.length === 0) return 0
    return this.points.reduce((sum, p) => sum + p.price, 0) / this.points.length
  }

  get median(): number {
    if (this.points.length === 0) return 0
    const sorted = [...this.points].sort((a, b) => a.price - b.price)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[mid].price : (sorted[mid - 1].price + sorted[mid].price) / 2
  }
}

export class PricePoint {
  constructor(
    public readonly date: Date,
    public readonly price: number,
    public readonly source: string,
    public readonly volume?: number,
    public readonly listingUrl?: string
  ) {}
}

export class MarketTrend {
  constructor(
    public readonly direction: 'rising' | 'falling' | 'stable',
    public readonly percentageChange: number,
    public readonly velocity: number, // sales per period
    public readonly momentum: number // -1 to 1
  ) {}

  get strength(): 'weak' | 'moderate' | 'strong' {
    const absMomentum = Math.abs(this.momentum)
    if (absMomentum < 0.3) return 'weak'
    if (absMomentum < 0.7) return 'moderate'
    return 'strong'
  }
}

export class Comparable {
  constructor(
    public readonly card: Card,
    public readonly grade: number,
    public readonly price: number,
    public readonly date: Date,
    public readonly source: string,
    public readonly similarity: number // 0-100
  ) {}
}

// Nigo: Collection management
export class Collection {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly name: string,
    public readonly cards: CollectionCard[],
    public readonly value: CollectionValue,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  get size(): number {
    return this.cards.length
  }

  get uniqueCards(): number {
    return new Set(this.cards.map(c => c.card.uniqueId)).size
  }
}

export class CollectionCard {
  constructor(
    public readonly card: Card,
    public readonly grade: Grade,
    public readonly purchasePrice?: number,
    public readonly purchaseDate?: Date,
    public readonly notes?: string,
    public readonly images?: ScanImages
  ) {}
}

export class CollectionValue {
  constructor(
    public readonly total: number,
    public readonly costBasis: number,
    public readonly unrealizedGain: number,
    public readonly topCards: { card: Card; value: number }[]
  ) {}

  get returnPercentage(): number {
    if (this.costBasis === 0) return 0
    return (this.unrealizedGain / this.costBasis) * 100
  }
}