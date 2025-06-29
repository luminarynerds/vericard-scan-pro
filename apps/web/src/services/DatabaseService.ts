import Dexie, { Table } from 'dexie'

interface Scan {
  id?: number
  timestamp: number
  captures: Record<string, string>
  result: any
  userId?: string
}

interface Transaction {
  id?: number
  scanId: number
  timestamp: number
  amount: number
  status: 'pending' | 'completed' | 'frozen'
  freezeReason?: string
}

class VeriCardDatabase extends Dexie {
  scans!: Table<Scan>
  transactions!: Table<Transaction>

  constructor() {
    super('VeriCardDB')
    
    this.version(1).stores({
      scans: '++id, timestamp, userId',
      transactions: '++id, scanId, timestamp, status'
    })
  }
}

export class DatabaseService {
  private static db: VeriCardDatabase

  static async init() {
    if (!this.db) {
      this.db = new VeriCardDatabase()
      await this.db.open()
    }
  }

  static async saveScan(scan: Omit<Scan, 'id'>): Promise<number> {
    await this.init()
    return await this.db.scans.add(scan)
  }

  static async getScan(id: number): Promise<Scan | undefined> {
    await this.init()
    return await this.db.scans.get(id)
  }

  static async getRecentScans(limit: number = 10): Promise<Scan[]> {
    await this.init()
    return await this.db.scans
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray()
  }

  static async getTotalScans(): Promise<number> {
    await this.init()
    return await this.db.scans.count()
  }

  static async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<number> {
    await this.init()
    return await this.db.transactions.add(transaction)
  }

  static async freezeTransaction(transactionId: number, reason: string): Promise<void> {
    await this.init()
    await this.db.transactions.update(transactionId, {
      status: 'frozen',
      freezeReason: reason
    })
  }

  static async getTransactionsByScan(scanId: number): Promise<Transaction[]> {
    await this.init()
    return await this.db.transactions
      .where('scanId')
      .equals(scanId)
      .toArray()
  }

  static async clearAll(): Promise<void> {
    await this.init()
    await this.db.scans.clear()
    await this.db.transactions.clear()
  }

  static async exportData(): Promise<string> {
    await this.init()
    const scans = await this.db.scans.toArray()
    const transactions = await this.db.transactions.toArray()
    
    return JSON.stringify({ scans, transactions }, null, 2)
  }
}