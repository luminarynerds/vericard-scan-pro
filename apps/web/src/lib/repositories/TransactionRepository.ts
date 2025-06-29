/**
 * Transaction Repository Implementation
 */

import Dexie from 'dexie'
import { ITransactionRepository, Transaction, TransactionStatus } from '../interfaces/repositories'
import { Injectable } from '../di/container'

interface TransactionRecord {
  id: string
  scanId: string
  userId: string
  amount: number
  status: TransactionStatus
  createdAt: number
  updatedAt: number
  metadata?: Record<string, any>
}

@Injectable()
export class TransactionRepository implements ITransactionRepository {
  private db: Dexie
  private transactions: Dexie.Table<TransactionRecord, string>

  constructor() {
    this.db = new Dexie('VeriCardTransactions')
    
    this.db.version(1).stores({
      transactions: 'id, scanId, userId, status, createdAt'
    })
    
    this.transactions = this.db.table('transactions')
  }

  async create(transaction: Transaction): Promise<string> {
    const record: TransactionRecord = {
      ...transaction,
      createdAt: transaction.createdAt.getTime(),
      updatedAt: transaction.updatedAt.getTime()
    }
    
    await this.transactions.add(record)
    return transaction.id
  }

  async findById(id: string): Promise<Transaction | null> {
    const record = await this.transactions.get(id)
    return record ? this.mapToDomain(record) : null
  }

  async findByScanId(scanId: string): Promise<Transaction[]> {
    const records = await this.transactions
      .where('scanId')
      .equals(scanId)
      .toArray()
    
    return records.map(r => this.mapToDomain(r))
  }

  async updateStatus(id: string, status: TransactionStatus): Promise<void> {
    await this.transactions.update(id, {
      status,
      updatedAt: Date.now()
    })
  }

  async freeze(id: string, reason: string): Promise<void> {
    await this.transactions.update(id, {
      status: 'frozen' as TransactionStatus,
      metadata: { freezeReason: reason },
      updatedAt: Date.now()
    })
  }

  private mapToDomain(record: TransactionRecord): Transaction {
    return {
      ...record,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt)
    }
  }
}