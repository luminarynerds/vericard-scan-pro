// COST: $0.0001/scan (TensorFlow.js local processing)
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

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