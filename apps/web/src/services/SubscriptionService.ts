export interface Subscription {
  plan: 'free' | 'pro' | 'dealer'
  expiresAt: number | null
  scanCount: number
  monthlyReset: number
}

export class SubscriptionService {
  private static STORAGE_KEY = 'vericard_subscription'
  private static FREE_SCAN_LIMIT = 10

  static getSubscription(): Subscription {
    if (typeof window === 'undefined') {
      return this.getDefaultSubscription()
    }

    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (!stored) {
      return this.getDefaultSubscription()
    }

    try {
      const subscription = JSON.parse(stored) as Subscription
      
      // Check if month has rolled over and reset scan count
      const now = Date.now()
      const currentMonth = new Date(now).getMonth()
      const resetMonth = new Date(subscription.monthlyReset).getMonth()
      
      if (currentMonth !== resetMonth) {
        subscription.scanCount = 0
        subscription.monthlyReset = now
        this.saveSubscription(subscription)
      }

      return subscription
    } catch {
      return this.getDefaultSubscription()
    }
  }

  static getDefaultSubscription(): Subscription {
    return {
      plan: 'free',
      expiresAt: null,
      scanCount: 0,
      monthlyReset: Date.now()
    }
  }

  static saveSubscription(subscription: Subscription): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(subscription))
    }
  }

  static incrementScanCount(): void {
    const subscription = this.getSubscription()
    subscription.scanCount++
    this.saveSubscription(subscription)
  }

  static canScan(): boolean {
    const subscription = this.getSubscription()
    
    // Pro and dealer have unlimited scans
    if (subscription.plan !== 'free') {
      return true
    }
    
    // Free users have scan limit
    return subscription.scanCount < this.FREE_SCAN_LIMIT
  }

  static getScansRemaining(): number {
    const subscription = this.getSubscription()
    
    if (subscription.plan !== 'free') {
      return Infinity
    }
    
    return Math.max(0, this.FREE_SCAN_LIMIT - subscription.scanCount)
  }

  static upgradeToPro(expiresAt: number): void {
    const subscription = this.getSubscription()
    subscription.plan = 'pro'
    subscription.expiresAt = expiresAt
    this.saveSubscription(subscription)
  }

  static upgradeToDealer(expiresAt: number): void {
    const subscription = this.getSubscription()
    subscription.plan = 'dealer'
    subscription.expiresAt = expiresAt
    this.saveSubscription(subscription)
  }

  static checkExpiration(): void {
    const subscription = this.getSubscription()
    
    if (subscription.plan !== 'free' && subscription.expiresAt) {
      if (Date.now() > subscription.expiresAt) {
        // Subscription expired, revert to free
        subscription.plan = 'free'
        subscription.expiresAt = null
        this.saveSubscription(subscription)
      }
    }
  }
}