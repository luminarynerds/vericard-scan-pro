/**
 * Logger Service - Grace Hopper: Comprehensive logging with multiple transports
 */

import { ILogger } from '../interfaces/services'

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: Date
  level: LogLevel
  message: string
  context?: any
  error?: Error
  userId?: string
  sessionId?: string
  metadata?: Record<string, any>
}

export interface LogTransport {
  name: string
  log(entry: LogEntry): void | Promise<void>
}

// Console transport
export class ConsoleTransport implements LogTransport {
  name = 'console'

  log(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString()
    const level = LogLevel[entry.level]
    const prefix = `[${timestamp}] [${level}]`

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(prefix, entry.message, entry.error, entry.context)
        break
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.context)
        break
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.context)
        break
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.context)
        break
    }
  }
}

// IndexedDB transport for offline logging
export class IndexedDBTransport implements LogTransport {
  name = 'indexeddb'
  private db?: IDBDatabase

  constructor() {
    this.initDB()
  }

  private async initDB(): Promise<void> {
    const request = indexedDB.open('VeriCardLogs', 1)
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains('logs')) {
        const store = db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true })
        store.createIndex('timestamp', 'timestamp')
        store.createIndex('level', 'level')
        store.createIndex('userId', 'userId')
      }
    }

    request.onsuccess = (event) => {
      this.db = (event.target as IDBOpenDBRequest).result
    }
  }

  async log(entry: LogEntry): Promise<void> {
    if (!this.db) return

    const transaction = this.db.transaction(['logs'], 'readwrite')
    const store = transaction.objectStore('logs')
    
    store.add({
      ...entry,
      timestamp: entry.timestamp.getTime()
    })

    // Clean up old logs (keep last 1000)
    const countRequest = store.count()
    countRequest.onsuccess = () => {
      if (countRequest.result > 1000) {
        const deleteCount = countRequest.result - 1000
        const cursor = store.openCursor()
        let deleted = 0
        
        cursor.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result
          if (cursor && deleted < deleteCount) {
            cursor.delete()
            deleted++
            cursor.continue()
          }
        }
      }
    }
  }
}

// Remote logging transport (for production)
export class RemoteTransport implements LogTransport {
  name = 'remote'
  private queue: LogEntry[] = []
  private flushInterval: number = 5000 // 5 seconds

  constructor(private endpoint: string, private apiKey: string) {
    // Batch logs and send periodically
    setInterval(() => this.flush(), this.flushInterval)
    
    // Also flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush())
    }
  }

  log(entry: LogEntry): void {
    this.queue.push(entry)
    
    // Immediate send for errors
    if (entry.level === LogLevel.ERROR) {
      this.flush()
    }
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return

    const batch = [...this.queue]
    this.queue = []

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ logs: batch })
      })
    } catch (error) {
      // Re-queue failed logs
      this.queue.unshift(...batch)
      console.error('Failed to send logs:', error)
    }
  }
}

export class Logger implements ILogger {
  private transports: LogTransport[] = []
  private minLevel: LogLevel = LogLevel.INFO
  private sessionId: string
  private userId?: string

  constructor() {
    this.sessionId = this.generateSessionId()
    
    // Initialize transports based on environment
    if (process.env.NODE_ENV === 'development') {
      this.minLevel = LogLevel.DEBUG
      this.transports.push(new ConsoleTransport())
    } else {
      this.transports.push(new ConsoleTransport())
      this.transports.push(new IndexedDBTransport())
      
      // Add remote transport if configured
      if (process.env.NEXT_PUBLIC_LOG_ENDPOINT) {
        this.transports.push(
          new RemoteTransport(
            process.env.NEXT_PUBLIC_LOG_ENDPOINT,
            process.env.NEXT_PUBLIC_LOG_API_KEY || ''
          )
        )
      }
    }
  }

  setUserId(userId: string): void {
    this.userId = userId
  }

  debug(message: string, context?: any): void {
    this.log(LogLevel.DEBUG, message, context)
  }

  info(message: string, context?: any): void {
    this.log(LogLevel.INFO, message, context)
  }

  warn(message: string, context?: any): void {
    this.log(LogLevel.WARN, message, context)
  }

  error(message: string, error?: Error, context?: any): void {
    this.log(LogLevel.ERROR, message, context, error)
  }

  metric(name: string, value: number, tags?: Record<string, string>): void {
    this.log(LogLevel.INFO, `METRIC: ${name}`, {
      metric: name,
      value,
      tags,
      type: 'metric'
    })
  }

  private log(level: LogLevel, message: string, context?: any, error?: Error): void {
    if (level < this.minLevel) return

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      error,
      userId: this.userId,
      sessionId: this.sessionId,
      metadata: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined
      }
    }

    // Send to all transports
    for (const transport of this.transports) {
      try {
        const result = transport.log(entry)
        if (result instanceof Promise) {
          result.catch(err => console.error(`Transport ${transport.name} failed:`, err))
        }
      } catch (err) {
        console.error(`Transport ${transport.name} failed:`, err)
      }
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Performance monitoring
  startTimer(label: string): () => void {
    const start = performance.now()
    
    return () => {
      const duration = performance.now() - start
      this.metric(`timing.${label}`, duration)
    }
  }

  // Error boundary integration
  logErrorBoundary(error: Error, errorInfo: any): void {
    this.error('React Error Boundary triggered', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    })
  }

  // Utility methods for structured logging
  logApiCall(method: string, url: string, status: number, duration: number): void {
    this.info('API Call', {
      method,
      url,
      status,
      duration,
      type: 'api'
    })
    
    this.metric('api.duration', duration, {
      method,
      status: status.toString(),
      endpoint: new URL(url).pathname
    })
  }

  logScanResult(scanId: string, confidence: number, processingTime: number, success: boolean): void {
    this.info('Scan completed', {
      scanId,
      confidence,
      processingTime,
      success,
      type: 'scan'
    })
    
    this.metric('scan.processing_time', processingTime)
    this.metric('scan.confidence', confidence)
  }
}