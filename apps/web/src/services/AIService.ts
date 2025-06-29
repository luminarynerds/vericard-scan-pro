// COST: $0.0001/scan (TensorFlow.js local processing)
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { cardIdentificationService, CardDetails } from './CardIdentificationService';
import { marketDataService } from './MarketDataService';

export interface ScanResult {
  confidence: number;
  detections: Detection[];
  processTime: number;
  damageAnalysis?: DamageAnalysis;
}

export interface Detection {
  class: string;
  score: number;
  bbox: [number, number, number, number];
}

export interface DamageAnalysis {
  hasScratches: boolean;
  hasCornerWear: boolean;
  hasEdgeDamage: boolean;
  centeringScore: number;
  overallGrade: number;
}

export class AIService {
  private model: cocoSsd.ObjectDetection | null = null;
  private isModelLoading = false;

  async initialize(): Promise<void> {
    if (this.model || this.isModelLoading) return;
    
    this.isModelLoading = true;
    try {
      // Load COCO-SSD for basic object detection
      // In production, would load custom card detection model
      this.model = await cocoSsd.load();
      console.log('AI model loaded successfully');
    } catch (error) {
      console.error('Failed to load AI model:', error);
      throw error;
    } finally {
      this.isModelLoading = false;
    }
  }

  async analyzeCard(imageData: ImageData): Promise<ScanResult> {
    const startTime = performance.now();
    
    if (!this.model) {
      await this.initialize();
    }

    try {
      // Convert ImageData to tensor
      const imageTensor = tf.browser.fromPixels(imageData);
      
      // Run detection
      const predictions = await this.model!.detect(imageTensor as any);
      
      // Clean up tensor to prevent memory leak
      imageTensor.dispose();
      
      // Calculate confidence based on detections
      const confidence = predictions.length > 0 
        ? Math.max(...predictions.map(p => p.score))
        : 0;

      // Simulate damage analysis (would use specialized model in production)
      const damageAnalysis = this.simulateDamageAnalysis(imageData, predictions);

      const processTime = performance.now() - startTime;

      return {
        confidence,
        detections: predictions.map(p => ({
          class: p.class,
          score: p.score,
          bbox: p.bbox as [number, number, number, number]
        })),
        processTime,
        damageAnalysis
      };
    } catch (error) {
      console.error('AI analysis failed:', error);
      throw error;
    }
  }

  private simulateDamageAnalysis(
    imageData: ImageData, 
    detections: cocoSsd.DetectedObject[]
  ): DamageAnalysis {
    // This is a placeholder - real implementation would:
    // 1. Use specialized model trained on card damage
    // 2. Analyze edge pixels for wear
    // 3. Detect surface scratches using contrast analysis
    // 4. Calculate centering based on border detection
    
    const randomScore = () => Math.random();
    
    return {
      hasScratches: randomScore() > 0.7,
      hasCornerWear: randomScore() > 0.8,
      hasEdgeDamage: randomScore() > 0.75,
      centeringScore: 50 + Math.floor(randomScore() * 50), // 50-100
      overallGrade: Math.floor(5 + randomScore() * 5) // 5-10
    };
  }

  async processWithCloudFallback(
    imageData: ImageData,
    cardValue: number
  ): Promise<ScanResult> {
    const localResult = await this.analyzeCard(imageData);
    
    // Use cloud processing for high-value cards or low confidence
    if (localResult.confidence < 0.85 || cardValue > 100) {
      // In production, would call cloud API here
      console.log('Would use cloud processing for high-value/low-confidence card');
      // return await this.cloudAPI.analyze(imageData);
    }
    
    return localResult;
  }

  async processCard(captures: Record<string, string>): Promise<{
    grade: number;
    confidence: number;
    damages?: Array<{type: string; severity: string; location: string}>;
    authentic: boolean;
    estimatedValue?: number;
    cardDetails?: CardDetails;
    captures?: Record<string, string>;
  }> {
    // Convert base64 images to ImageData and analyze each
    const frontImage = captures['front'];
    if (!frontImage) {
      throw new Error('Front image capture is required');
    }

    // Convert base64 to ImageData
    const imageData = await this.base64ToImageData(frontImage);
    
    // Analyze the front image (most important for card identification)
    const scanResult = await this.analyzeCard(imageData);
    
    // Identify the card using the dedicated service
    const cardDetails = await cardIdentificationService.identifyCard(captures);
    
    // Convert damage analysis to expected format
    const damages = [];
    if (scanResult.damageAnalysis) {
      if (scanResult.damageAnalysis.hasScratches) {
        damages.push({ type: 'Scratch', severity: 'Minor', location: 'Surface' });
      }
      if (scanResult.damageAnalysis.hasCornerWear) {
        damages.push({ type: 'Corner Wear', severity: 'Moderate', location: 'Corners' });
      }
      if (scanResult.damageAnalysis.hasEdgeDamage) {
        damages.push({ type: 'Edge Damage', severity: 'Minor', location: 'Edges' });
      }
    }
    
    // Get real market data for accurate pricing
    const grade = scanResult.damageAnalysis?.overallGrade || 7;
    const marketData = await marketDataService.getMarketData(cardDetails, grade);
    const estimatedValue = marketData.averagePrice || 0;
    
    return {
      grade: scanResult.damageAnalysis?.overallGrade || 7,
      confidence: Math.round(scanResult.confidence * 100),
      damages: damages.length > 0 ? damages : undefined,
      authentic: scanResult.confidence > 0.7, // Simple threshold for demo
      estimatedValue,
      cardDetails,
      captures // Include the original images for display
    };
  }

  private async base64ToImageData(base64: string): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(ctx.getImageData(0, 0, img.width, img.height));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = base64;
    });
  }

  private calculateEstimatedValue(grade: number): number {
    // Mock calculation - in production would query market data
    const baseValues: Record<number, number> = {
      10: 1000,
      9: 500,
      8: 200,
      7: 100,
      6: 50,
      5: 25
    };
    return baseValues[grade] || 10;
  }

  private getGradeMultiplier(grade: number): number {
    // Multipliers based on condition grade
    const multipliers: Record<number, number> = {
      10: 5.0,    // Gem Mint
      9: 2.5,     // Mint
      8: 1.5,     // Near Mint-Mint
      7: 1.0,     // Near Mint
      6: 0.5,     // Excellent-Mint
      5: 0.25     // Excellent
    };
    return multipliers[grade] || 0.1;
  }

  // Memory management
  dispose(): void {
    if (this.model) {
      // COCO-SSD doesn't have dispose method, but custom models would
      this.model = null;
    }
  }
}

// Singleton instance
export const aiService = new AIService();