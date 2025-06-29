import { AIService } from '../AIService';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

// Mock TensorFlow and COCO-SSD
jest.mock('@tensorflow/tfjs');
jest.mock('@tensorflow-models/coco-ssd');

describe('AIService', () => {
  let aiService: AIService;
  let mockModel: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock model
    mockModel = {
      detect: jest.fn()
    };
    
    // Mock cocoSsd.load to return our mock model
    (cocoSsd.load as jest.Mock).mockResolvedValue(mockModel);
    
    // Mock tf.browser.fromPixels
    const mockTensor = {
      dispose: jest.fn()
    };
    (tf.browser.fromPixels as jest.Mock).mockReturnValue(mockTensor);
    
    // Create fresh instance for each test
    aiService = new AIService();
  });

  describe('initialize', () => {
    it('should load the model successfully', async () => {
      await aiService.initialize();
      
      expect(cocoSsd.load).toHaveBeenCalledTimes(1);
    });

    it('should not reload model if already initialized', async () => {
      await aiService.initialize();
      await aiService.initialize();
      
      expect(cocoSsd.load).toHaveBeenCalledTimes(1);
    });

    it('should handle model loading errors', async () => {
      (cocoSsd.load as jest.Mock).mockRejectedValue(new Error('Load failed'));
      
      await expect(aiService.initialize()).rejects.toThrow('Load failed');
    });
  });

  describe('analyzeCard', () => {
    const mockImageData = {
      data: new Uint8ClampedArray(100),
      width: 10,
      height: 10
    } as ImageData;

    beforeEach(() => {
      mockModel.detect.mockResolvedValue([
        {
          class: 'card',
          score: 0.95,
          bbox: [10, 20, 100, 150]
        }
      ]);
    });

    it('should analyze card and return results', async () => {
      const result = await aiService.analyzeCard(mockImageData);
      
      expect(result).toMatchObject({
        confidence: 0.95,
        detections: [{
          class: 'card',
          score: 0.95,
          bbox: [10, 20, 100, 150]
        }],
        processTime: expect.any(Number),
        damageAnalysis: expect.objectContaining({
          hasScratches: expect.any(Boolean),
          hasCornerWear: expect.any(Boolean),
          hasEdgeDamage: expect.any(Boolean),
          centeringScore: expect.any(Number),
          overallGrade: expect.any(Number)
        })
      });
    });

    it('should auto-initialize if model not loaded', async () => {
      await aiService.analyzeCard(mockImageData);
      
      expect(cocoSsd.load).toHaveBeenCalledTimes(1);
    });

    it('should dispose tensor after analysis', async () => {
      const mockTensor = {
        dispose: jest.fn()
      };
      (tf.browser.fromPixels as jest.Mock).mockReturnValue(mockTensor);
      
      await aiService.analyzeCard(mockImageData);
      
      expect(mockTensor.dispose).toHaveBeenCalledTimes(1);
    });

    it('should handle detection errors', async () => {
      mockModel.detect.mockRejectedValue(new Error('Detection failed'));
      
      await expect(aiService.analyzeCard(mockImageData)).rejects.toThrow('Detection failed');
    });

    it('should return 0 confidence when no detections', async () => {
      mockModel.detect.mockResolvedValue([]);
      
      const result = await aiService.analyzeCard(mockImageData);
      
      expect(result.confidence).toBe(0);
    });
  });

  describe('processWithCloudFallback', () => {
    const mockImageData = {
      data: new Uint8ClampedArray(100),
      width: 10,
      height: 10
    } as ImageData;

    beforeEach(() => {
      mockModel.detect.mockResolvedValue([
        {
          class: 'card',
          score: 0.90,
          bbox: [10, 20, 100, 150]
        }
      ]);
    });

    it('should use local processing for high confidence, low value cards', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const result = await aiService.processWithCloudFallback(mockImageData, 50);
      
      expect(result.confidence).toBe(0.90);
      expect(consoleSpy).not.toHaveBeenCalledWith(
        'Would use cloud processing for high-value/low-confidence card'
      );
      
      consoleSpy.mockRestore();
    });

    it('should indicate cloud processing for low confidence', async () => {
      mockModel.detect.mockResolvedValue([
        {
          class: 'card',
          score: 0.80,
          bbox: [10, 20, 100, 150]
        }
      ]);
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await aiService.processWithCloudFallback(mockImageData, 50);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Would use cloud processing for high-value/low-confidence card'
      );
      
      consoleSpy.mockRestore();
    });

    it('should indicate cloud processing for high value cards', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await aiService.processWithCloudFallback(mockImageData, 150);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Would use cloud processing for high-value/low-confidence card'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('dispose', () => {
    it('should clean up resources', async () => {
      await aiService.initialize();
      aiService.dispose();
      
      // After dispose, model should be null and reinitialize should work
      await aiService.initialize();
      expect(cocoSsd.load).toHaveBeenCalledTimes(2);
    });
  });
});