/**
 * Repository Interfaces - Grace Hopper: Clean data access contracts
 */

import { 
  Card, 
  ScanResult, 
  MarketValue, 
  Collection,
  PriceHistory,
  Grade,
  CardAttributes
} from '../domain/models'

// Base repository interface
export interface IRepository<T, ID> {
  findById(id: ID): Promise<T | null>
  findAll(): Promise<T[]>
  save(entity: T): Promise<T>
  delete(id: ID): Promise<void>
  exists(id: ID): Promise<boolean>
}

// Scan Repository Interface
export interface IScanRepository extends IRepository<ScanResult, string> {
  findByUserId(userId: string, limit?: number): Promise<ScanResult[]>
  findByCard(card: Card): Promise<ScanResult[]>
  findByDateRange(start: Date, end: Date): Promise<ScanResult[]>
  countByUser(userId: string): Promise<number>
  getRecentScans(limit: number): Promise<ScanResult[]>
}

// Card Repository Interface (Rich Klein: Comprehensive card data)
export interface ICardRepository extends IRepository<Card, string> {
  findByPlayer(player: string): Promise<Card[]>
  findBySet(year: number, manufacturer: string, set: string): Promise<Card[]>
  findByAttributes(attributes: Partial<CardAttributes>): Promise<Card[]>
  search(query: string, limit?: number): Promise<Card[]>
  validateCard(card: Partial<Card>): Promise<{ isValid: boolean; issues: string[] }>
  getSimilarCards(card: Card, limit?: number): Promise<Card[]>
}

// Market Data Repository Interface (Sara Menker: Real-time market data)
export interface IMarketDataRepository {
  getLatestPrice(card: Card, grade: number): Promise<number | null>
  getPriceHistory(card: Card, grade: number, days: number): Promise<PriceHistory>
  getMarketValue(card: Card, grade: number): Promise<MarketValue | null>
  saveMarketData(marketValue: MarketValue): Promise<void>
  getComparables(card: Card, grade: number, limit?: number): Promise<MarketValue[]>
  subscribeToUpdates(
    card: Card, 
    grade: number, 
    callback: (value: MarketValue) => void
  ): () => void
}

// User Repository Interface
export interface IUserRepository {
  findById(userId: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  save(user: User): Promise<User>
  updatePreferences(userId: string, preferences: UserPreferences): Promise<void>
  getSubscription(userId: string): Promise<Subscription | null>
  updateSubscription(userId: string, subscription: Subscription): Promise<void>
}

// Collection Repository Interface (Nigo: Collection management)
export interface ICollectionRepository extends IRepository<Collection, string> {
  findByUserId(userId: string): Promise<Collection[]>
  addCard(collectionId: string, card: Card, grade: Grade, metadata?: any): Promise<void>
  removeCard(collectionId: string, cardId: string): Promise<void>
  updateCardMetadata(collectionId: string, cardId: string, metadata: any): Promise<void>
  calculateValue(collectionId: string): Promise<number>
  getTopValueCards(collectionId: string, limit?: number): Promise<{ card: Card; value: number }[]>
}

// Transaction Repository Interface
export interface ITransactionRepository {
  create(transaction: Transaction): Promise<string>
  findById(id: string): Promise<Transaction | null>
  findByScanId(scanId: string): Promise<Transaction[]>
  updateStatus(id: string, status: TransactionStatus): Promise<void>
  freeze(id: string, reason: string): Promise<void>
}

// Types
export interface User {
  id: string
  email: string
  name?: string
  preferences: UserPreferences
  subscription?: Subscription
  createdAt: Date
  updatedAt: Date
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  notifications: {
    email: boolean
    push: boolean
    marketAlerts: boolean
  }
  privacy: {
    shareScans: boolean
    anonymousAnalytics: boolean
  }
  scanning: {
    defaultMode: 'simple' | 'advanced'
    autoSave: boolean
    highQualityImages: boolean
  }
}

export interface Subscription {
  plan: 'free' | 'basic' | 'pro' | 'enterprise'
  status: 'active' | 'cancelled' | 'expired'
  startDate: Date
  endDate?: Date
  scansUsed: number
  scansLimit: number
  features: string[]
}

export interface Transaction {
  id: string
  scanId: string
  userId: string
  amount: number
  status: TransactionStatus
  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, any>
}

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'frozen'

// Query options
export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  order?: 'asc' | 'desc'
  include?: string[]
}

// Batch operations
export interface IBatchOperations<T, ID> {
  saveMany(entities: T[]): Promise<T[]>
  deleteMany(ids: ID[]): Promise<void>
  findByIds(ids: ID[]): Promise<T[]>
}