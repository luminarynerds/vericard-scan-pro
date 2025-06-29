/**
 * Grace Hopper: Dependency Injection Container
 * Clean, testable, modular architecture
 */

type Constructor<T = {}> = new (...args: any[]) => T
type Factory<T> = () => T | Promise<T>
type Registration<T> = {
  factory: Factory<T>
  singleton: boolean
  instance?: T
}

export class DIContainer {
  private registrations = new Map<string | symbol, Registration<any>>()
  
  /**
   * Register a singleton instance
   */
  registerSingleton<T>(token: string | symbol, factory: Factory<T>): void {
    this.registrations.set(token, {
      factory,
      singleton: true
    })
  }

  /**
   * Register a transient (new instance each time)
   */
  registerTransient<T>(token: string | symbol, factory: Factory<T>): void {
    this.registrations.set(token, {
      factory,
      singleton: false
    })
  }

  /**
   * Register a class with automatic dependency resolution
   * Note: Currently disabled due to reflect-metadata dependency
   */
  // registerClass<T>(token: string | symbol, constructor: Constructor<T>, singleton = false): void {
  //   const factory = () => {
  //     const paramTypes = Reflect.getMetadata('design:paramtypes', constructor) || []
  //     const dependencies = paramTypes.map((type: any) => this.resolve(type))
  //     return new constructor(...dependencies)
  //   }
  //   
  //   this.registrations.set(token, {
  //     factory,
  //     singleton
  //   })
  // }

  /**
   * Resolve a dependency
   */
  async resolve<T>(token: string | symbol): Promise<T> {
    const registration = this.registrations.get(token)
    
    if (!registration) {
      throw new Error(`No registration found for token: ${String(token)}`)
    }

    if (registration.singleton) {
      if (!registration.instance) {
        registration.instance = await registration.factory()
      }
      return registration.instance
    }

    return await registration.factory()
  }

  /**
   * Clear all registrations (useful for testing)
   */
  clear(): void {
    this.registrations.clear()
  }
}

// Global container instance
export const container = new DIContainer()

// Service tokens
export const ServiceTokens = {
  // Core Services
  AIService: Symbol('AIService'),
  CameraService: Symbol('CameraService'),
  DatabaseService: Symbol('DatabaseService'),
  
  // Domain Services
  CardIdentificationService: Symbol('CardIdentificationService'),
  MarketDataService: Symbol('MarketDataService'),
  CardDatabaseService: Symbol('CardDatabaseService'),
  SubscriptionService: Symbol('SubscriptionService'),
  
  // Repositories
  ScanRepository: Symbol('ScanRepository'),
  TransactionRepository: Symbol('TransactionRepository'),
  CardRepository: Symbol('CardRepository'),
  MarketDataRepository: Symbol('MarketDataRepository'),
  UserRepository: Symbol('UserRepository'),
  
  // Infrastructure
  Logger: Symbol('Logger'),
  ConfigService: Symbol('ConfigService'),
  CacheManager: Symbol('CacheManager'),
  EventBus: Symbol('EventBus')
} as const

// Decorator for dependency injection
// Note: Currently disabled since we removed @Injectable usage
// export function Injectable(token?: string | symbol) {
//   return function (target: any) {
//     if (token) {
//       container.registerClass(token, target, true)
//     }
//     return target
//   }
// }

// Decorator for injecting dependencies
// Note: Currently disabled due to reflect-metadata dependency
// export function Inject(token: string | symbol) {
//   return function (target: any, propertyKey: string | symbol, parameterIndex: number) {
//     const existingTokens = Reflect.getMetadata('custom:inject_tokens', target) || []
//     existingTokens[parameterIndex] = token
//     Reflect.defineMetadata('custom:inject_tokens', existingTokens, target)
//   }
// }