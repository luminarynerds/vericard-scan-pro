/**
 * Service Interfaces - Grace Hopper: Clean contracts for all services
 */

import { CardDetails } from '@/services/CardIdentificationService'
import { ScanResult, DamageAnalysis } from '@/services/AIService'
import { MarketData, PopulationReport } from '@/services/MarketDataService'

// Core AI Service Interface
export interface IAIService {
  initialize(): Promise<void>
  analyzeCard(imageData: ImageData): Promise<ScanResult>
  processCard(captures: Record<string, string>): Promise<ProcessedCard>
  processWithCloudFallback(imageData: ImageData, cardValue: number): Promise<ScanResult>
  dispose(): void
}

// Card Identification Interface
export interface ICardIdentificationService {
  identifyCard(images: Record<string, string>): Promise<CardDetails>
  formatCardName(card: CardDetails): string
  getCardIndicators(card: CardDetails): string[]
  estimateBaseValue(card: CardDetails): number
}

// Market Data Service Interface
export interface IMarketDataService {
  getMarketData(card: CardDetails, grade: number): Promise<MarketData>
  getPopulationReport(card: CardDetails): Promise<PopulationReport>
  getPriceHistory(card: CardDetails, days: number): Promise<PricePoint[]>
  subscribeToUpdates(card: CardDetails, callback: (data: MarketData) => void): () => void
}

// Database Service Interface
export interface IDatabaseService {
  saveScan(scan: ScanData): Promise<number>
  getScan(id: number): Promise<ScanData | undefined>
  getRecentScans(limit: number): Promise<ScanData[]>
  getTotalScans(): Promise<number>
  createTransaction(transaction: TransactionData): Promise<number>
  freezeTransaction(transactionId: number, reason: string): Promise<void>
  clearAll(): Promise<void>
  exportData(): Promise<string>
}

// Card Database Interface (Rich Klein: Accurate card data)
export interface ICardDatabaseService {
  lookupCard(details: Partial<CardDetails>): Promise<CardDatabaseEntry | null>
  searchCards(query: string): Promise<CardDatabaseEntry[]>
  validateCard(details: CardDetails): Promise<ValidationResult>
  getSetInfo(year: number, manufacturer: string, setName: string): Promise<SetInfo>
  getVariants(baseCard: CardDetails): Promise<CardVariant[]>
}

// Camera Service Interface
export interface ICameraService {
  checkPermissions(): Promise<boolean>
  getDevices(): Promise<MediaDeviceInfo[]>
  captureFrame(video: HTMLVideoElement): Promise<string>
  applyUVFilter(imageData: ImageData): ImageData
  detectGlare(imageData: ImageData): boolean
}

// Subscription Service Interface
export interface ISubscriptionService {
  checkExpiration(): void
  canScan(): boolean
  getScansRemaining(): number
  incrementScanCount(): void
  getSubscriptionStatus(): SubscriptionStatus
  upgradeSubscription(plan: SubscriptionPlan): Promise<void>
}

// Logger Interface (Grace Hopper: Comprehensive logging)
export interface ILogger {
  debug(message: string, context?: any): void
  info(message: string, context?: any): void
  warn(message: string, context?: any): void
  error(message: string, error?: Error, context?: any): void
  metric(name: string, value: number, tags?: Record<string, string>): void
}

// Cache Manager Interface (Sara Menker: Efficient data caching)
export interface ICacheManager {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
  wrap<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>
}

// Event Bus Interface (Grace Hopper: Decoupled architecture)
export interface IEventBus {
  emit<T = any>(event: string, data: T): void
  on<T = any>(event: string, handler: (data: T) => void): () => void
  once<T = any>(event: string, handler: (data: T) => void): () => void
  off(event: string, handler?: Function): void
}

// Configuration Service Interface
export interface IConfigService {
  get<T = any>(key: string, defaultValue?: T): T
  getRequired<T = any>(key: string): T
  isDevelopment(): boolean
  isProduction(): boolean
  getFeatureFlag(flag: string): boolean
}

// Types
export interface ProcessedCard {
  grade: number
  confidence: number
  damages?: Array<{type: string; severity: string; location: string}>
  authentic: boolean
  estimatedValue?: number
  cardDetails?: CardDetails
  captures?: Record<string, string>
}

export interface ScanData {
  id?: number
  timestamp: number
  captures: Record<string, string>
  result: any
  userId?: string
}

export interface TransactionData {
  id?: number
  scanId: number
  timestamp: number
  amount: number
  status: 'pending' | 'completed' | 'frozen'
  freezeReason?: string
}

export interface CardDatabaseEntry {
  id: string
  player: string
  year: number
  manufacturer: string
  set: string
  subset?: string
  cardNumber?: string
  attributes: {
    isRookie: boolean
    isAutograph: boolean
    isPatch: boolean
    isSerialNumbered: boolean
    printRun?: number
  }
  variants: string[]
  metadata: Record<string, any>
}

export interface ValidationResult {
  isValid: boolean
  confidence: number
  issues: string[]
  suggestions: string[]
}

export interface SetInfo {
  name: string
  year: number
  manufacturer: string
  totalCards: number
  subsets: string[]
  releaseDate: Date
  description: string
}

export interface CardVariant {
  name: string
  rarity: string
  estimatedPrintRun?: number
  distinguishingFeatures: string[]
}

export interface PricePoint {
  date: Date
  price: number
  volume: number
  source: string
}

export interface SubscriptionStatus {
  isActive: boolean
  plan: SubscriptionPlan
  scansUsed: number
  scansLimit: number
  expiresAt?: Date
}

export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'enterprise'