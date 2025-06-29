/**
 * Tests for refactored services
 */

import { container, ServiceTokens } from '@/lib/di/container'
import { initializeContainer } from '@/lib/di/initialize'
import { VisionPipeline } from '@/lib/vision/VisionPipeline'
import { Logger } from '@/lib/services/Logger'
import { FeatureFlagService } from '@/lib/features/FeatureFlags'

describe('Refactored Services', () => {
  beforeAll(async () => {
    await initializeContainer()
  })

  afterAll(() => {
    container.clear()
  })

  describe('DI Container', () => {
    it('should resolve logger service', async () => {
      const logger = await container.resolve(ServiceTokens.Logger)
      expect(logger).toBeDefined()
      expect(logger).toBeInstanceOf(Logger)
    })

    it('should resolve feature flag service', async () => {
      const featureFlags = await container.resolve(ServiceTokens.ConfigService)
      expect(featureFlags).toBeDefined()
      expect(featureFlags).toBeInstanceOf(FeatureFlagService)
    })

    it('should return same instance for singletons', async () => {
      const logger1 = await container.resolve(ServiceTokens.Logger)
      const logger2 = await container.resolve(ServiceTokens.Logger)
      expect(logger1).toBe(logger2)
    })
  })

  describe('Vision Pipeline', () => {
    let visionPipeline: VisionPipeline

    beforeEach(() => {
      const logger = new Logger()
      visionPipeline = new VisionPipeline(logger)
    })

    afterEach(() => {
      visionPipeline.dispose()
    })

    it('should initialize successfully', async () => {
      await expect(visionPipeline.initialize()).resolves.not.toThrow()
    })

    it('should process image data', async () => {
      await visionPipeline.initialize()
      
      // Create mock image data
      const canvas = document.createElement('canvas')
      canvas.width = 100
      canvas.height = 100
      const ctx = canvas.getContext('2d')!
      const imageData = ctx.createImageData(100, 100)
      
      const result = await visionPipeline.process(imageData)
      
      expect(result).toBeDefined()
      expect(result.overallConfidence).toBeGreaterThan(0)
      expect(result.processingTime).toBeGreaterThan(0)
    })
  })

  describe('Feature Flags', () => {
    let featureFlags: FeatureFlagService

    beforeEach(() => {
      featureFlags = new FeatureFlagService()
    })

    it('should return feature flag status', async () => {
      const isEnabled = await featureFlags.getFeatureFlag('multiAngleScanning')
      expect(typeof isEnabled).toBe('boolean')
    })

    it('should return enabled features list', async () => {
      const features = await featureFlags.getEnabledFeatures()
      expect(Array.isArray(features)).toBe(true)
      expect(features.length).toBeGreaterThan(0)
    })

    it('should handle rollout percentages', async () => {
      // Set a specific user ID for consistent testing
      featureFlags.setUserId('test-user-123')
      
      // Check a feature with rollout percentage
      const isEnabled = await featureFlags.getFeatureFlag('advancedGrading')
      expect(typeof isEnabled).toBe('boolean')
    })
  })

  describe('Error Handling', () => {
    it('should create specific error types', async () => {
      const { ValidationError, NotFoundError } = await import('@/lib/errors')
      
      const validationError = new ValidationError('Invalid input', 'email')
      expect(validationError.code).toBe('VALIDATION_ERROR')
      expect(validationError.statusCode).toBe(400)
      
      const notFoundError = new NotFoundError('Card', '123')
      expect(notFoundError.code).toBe('NOT_FOUND')
      expect(notFoundError.statusCode).toBe(404)
    })

    it('should retry failed operations', async () => {
      const { retry } = await import('@/lib/errors')
      
      let attempts = 0
      const operation = async () => {
        attempts++
        if (attempts < 3) {
          throw new Error('Temporary failure')
        }
        return 'success'
      }
      
      const result = await retry(operation, { attempts: 3, delay: 10 })
      expect(result).toBe('success')
      expect(attempts).toBe(3)
    })
  })

  describe('Repository Pattern', () => {
    it('should save and retrieve scan data', async () => {
      const scanRepo = await container.resolve(ServiceTokens.ScanRepository)
      
      // Create mock scan result
      const { ScanResult, Card, Grade, CenteringScore, DamageAssessment, AuthenticityResult, ConfidenceScore, ScanImages } = await import('@/lib/domain/models')
      
      const scanResult = new ScanResult(
        'test-scan-123',
        new Date(),
        null,
        new Grade(8, new CenteringScore(50, 50), 8, 8, 8),
        new DamageAssessment([], 'near-mint'),
        new AuthenticityResult(true, 0.95, []),
        new ConfidenceScore(90, 85, 88, 92, 95),
        new ScanImages('data:image/jpeg;base64,test'),
        150
      )
      
      const saved = await scanRepo.save(scanResult)
      expect(saved).toBeDefined()
      
      const retrieved = await scanRepo.findById('test-scan-123')
      expect(retrieved).toBeDefined()
      expect(retrieved?.scanId).toBe('test-scan-123')
    })
  })
})