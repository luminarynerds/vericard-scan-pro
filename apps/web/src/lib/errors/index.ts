/**
 * Error Handling - Grace Hopper: Comprehensive error types and utilities
 */

// Base error class with additional context
export class VeriCardError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly context?: any,
    public readonly isOperational: boolean = true
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      stack: this.stack
    }
  }
}

// Specific error types
export class ValidationError extends VeriCardError {
  constructor(message: string, field?: string, value?: any) {
    super(message, 'VALIDATION_ERROR', 400, { field, value })
  }
}

export class AuthenticationError extends VeriCardError {
  constructor(message = 'Authentication required') {
    super(message, 'AUTH_ERROR', 401)
  }
}

export class AuthorizationError extends VeriCardError {
  constructor(message = 'Insufficient permissions') {
    super(message, 'AUTHZ_ERROR', 403)
  }
}

export class NotFoundError extends VeriCardError {
  constructor(resource: string, id?: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404, { resource, id })
  }
}

export class RateLimitError extends VeriCardError {
  constructor(limit: number, window: string) {
    super(`Rate limit exceeded: ${limit} requests per ${window}`, 'RATE_LIMIT', 429, { limit, window })
  }
}

export class ExternalServiceError extends VeriCardError {
  constructor(service: string, originalError?: Error) {
    super(`External service error: ${service}`, 'EXTERNAL_SERVICE_ERROR', 503, {
      service,
      originalError: originalError?.message
    })
  }
}

export class ModelLoadError extends VeriCardError {
  constructor(modelName: string, reason?: string) {
    super(`Failed to load AI model: ${modelName}`, 'MODEL_LOAD_ERROR', 500, {
      modelName,
      reason
    })
  }
}

export class ScanProcessingError extends VeriCardError {
  constructor(step: string, reason?: string) {
    super(`Scan processing failed at ${step}`, 'SCAN_PROCESSING_ERROR', 500, {
      step,
      reason
    })
  }
}

export class SubscriptionError extends VeriCardError {
  constructor(message: string, requiredPlan?: string) {
    super(message, 'SUBSCRIPTION_ERROR', 402, { requiredPlan })
  }
}

// Error handler utility
export class ErrorHandler {
  static handle(error: Error): VeriCardError {
    // Already a VeriCard error
    if (error instanceof VeriCardError) {
      return error
    }

    // Network errors
    if (error.message.includes('fetch')) {
      return new ExternalServiceError('network', error)
    }

    // TensorFlow errors
    if (error.message.includes('tensor') || error.message.includes('tf.')) {
      return new ModelLoadError('tensorflow', error.message)
    }

    // Generic error
    return new VeriCardError(
      error.message || 'An unexpected error occurred',
      'UNKNOWN_ERROR',
      500,
      { originalError: error.name },
      false
    )
  }

  static isOperational(error: Error): boolean {
    if (error instanceof VeriCardError) {
      return error.isOperational
    }
    return false
  }

  static serialize(error: Error): any {
    if (error instanceof VeriCardError) {
      return error.toJSON()
    }

    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  }
}

// Async error wrapper
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      throw ErrorHandler.handle(error as Error)
    }
  }) as T
}

// Result type for functional error handling
export type Result<T, E = Error> = 
  | { ok: true; value: T }
  | { ok: false; error: E }

export function ok<T>(value: T): Result<T, any> {
  return { ok: true, value }
}

export function err<E = Error>(error: E): Result<never, E> {
  return { ok: false, error }
}

// Try-catch wrapper returning Result
export async function tryAsync<T>(
  fn: () => Promise<T>
): Promise<Result<T, VeriCardError>> {
  try {
    const value = await fn()
    return ok(value)
  } catch (error) {
    return err(ErrorHandler.handle(error as Error))
  }
}

// Retry logic with exponential backoff
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    attempts?: number
    delay?: number
    maxDelay?: number
    factor?: number
    onRetry?: (error: Error, attempt: number) => void
  } = {}
): Promise<T> {
  const {
    attempts = 3,
    delay = 1000,
    maxDelay = 30000,
    factor = 2,
    onRetry
  } = options

  let lastError: Error
  
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === attempts) {
        throw error
      }

      const waitTime = Math.min(delay * Math.pow(factor, attempt - 1), maxDelay)
      
      if (onRetry) {
        onRetry(lastError, attempt)
      }

      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  throw lastError!
}

// Circuit breaker pattern
export class CircuitBreaker {
  private failures = 0
  private lastFailTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailTime < this.timeout) {
        throw new VeriCardError(
          'Circuit breaker is open',
          'CIRCUIT_BREAKER_OPEN',
          503
        )
      }
      this.state = 'half-open'
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failures = 0
    this.state = 'closed'
  }

  private onFailure(): void {
    this.failures++
    this.lastFailTime = Date.now()

    if (this.failures >= this.threshold) {
      this.state = 'open'
    }
  }

  get isOpen(): boolean {
    return this.state === 'open'
  }
}