/**
 * Scan Repository Implementation - Grace Hopper: Clean, testable data access
 */

import Dexie from 'dexie'
import { IScanRepository } from '../interfaces/repositories'
import { 
  ScanResult, 
  Card, 
  Grade, 
  DamageAssessment, 
  AuthenticityResult, 
  ConfidenceScore, 
  ScanImages,
  CardAttributes,
  CenteringScore,
  Damage
} from '../domain/models'

interface ScanRecord {
  id: string
  userId?: string
  timestamp: number
  cardData: any
  gradeData: any
  damageData: any
  authenticityData: any
  confidenceData: any
  images: any
  processingTime: number
}

export class ScanRepository implements IScanRepository {
  private db: Dexie
  private scans: Dexie.Table<ScanRecord, string>

  constructor() {
    this.db = new Dexie('VeriCardScans')
    
    this.db.version(1).stores({
      scans: 'id, userId, timestamp, [userId+timestamp]'
    })
    
    this.scans = this.db.table('scans')
  }

  async findById(id: string): Promise<ScanResult | null> {
    const record = await this.scans.get(id)
    return record ? this.mapToDomain(record) : null
  }

  async findAll(): Promise<ScanResult[]> {
    const records = await this.scans.toArray()
    return records.map(r => this.mapToDomain(r))
  }

  async save(entity: ScanResult): Promise<ScanResult> {
    const record = this.mapToRecord(entity)
    await this.scans.put(record)
    return entity
  }

  async delete(id: string): Promise<void> {
    await this.scans.delete(id)
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.scans.where('id').equals(id).count()
    return count > 0
  }

  async findByUserId(userId: string, limit: number = 50): Promise<ScanResult[]> {
    const records = await this.scans
      .where('userId')
      .equals(userId)
      .reverse()
      .limit(limit)
      .toArray()
    
    return records.map(r => this.mapToDomain(r))
  }

  async findByCard(card: Card): Promise<ScanResult[]> {
    // Search by card properties
    const records = await this.scans
      .filter(scan => {
        const scanCard = scan.cardData
        return scanCard && 
               scanCard.player === card.player &&
               scanCard.year === card.year &&
               scanCard.set === card.set &&
               scanCard.cardNumber === card.cardNumber
      })
      .toArray()
    
    return records.map(r => this.mapToDomain(r))
  }

  async findByDateRange(start: Date, end: Date): Promise<ScanResult[]> {
    const records = await this.scans
      .where('timestamp')
      .between(start.getTime(), end.getTime())
      .toArray()
    
    return records.map(r => this.mapToDomain(r))
  }

  async countByUser(userId: string): Promise<number> {
    return await this.scans
      .where('userId')
      .equals(userId)
      .count()
  }

  async getRecentScans(limit: number): Promise<ScanResult[]> {
    const records = await this.scans
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray()
    
    return records.map(r => this.mapToDomain(r))
  }

  // Mapping functions
  private mapToDomain(record: ScanRecord): ScanResult {
    const card = record.cardData ? new Card(
      record.cardData.id,
      record.cardData.player,
      record.cardData.year,
      record.cardData.manufacturer,
      record.cardData.set,
      record.cardData.cardNumber,
      record.cardData.subset,
      record.cardData.variant,
      new CardAttributes(
        record.cardData.attributes?.isRookie || false,
        record.cardData.attributes?.isAutograph || false,
        record.cardData.attributes?.isPatch || false,
        record.cardData.attributes?.isRefractor || false,
        record.cardData.attributes?.isParallel || false,
        record.cardData.attributes?.serialNumber,
        record.cardData.attributes?.printRun
      ),
      record.cardData.metadata || {}
    ) : null

    const grade = new Grade(
      record.gradeData.numeric,
      new CenteringScore(
        record.gradeData.centering.leftRight,
        record.gradeData.centering.topBottom
      ),
      record.gradeData.corners,
      record.gradeData.edges,
      record.gradeData.surface
    )

    const damageAssessment = new DamageAssessment(
      record.damageData.damages.map((d: any) => 
        new Damage(d.type, d.severity, d.location, d.description)
      ),
      record.damageData.overallCondition
    )

    const authenticity = new AuthenticityResult(
      record.authenticityData.isAuthentic,
      record.authenticityData.confidence,
      record.authenticityData.indicators,
      record.authenticityData.warnings
    )

    const confidence = new ConfidenceScore(
      record.confidenceData.overall,
      record.confidenceData.cardIdentification,
      record.confidenceData.gradeAccuracy,
      record.confidenceData.damageDetection,
      record.confidenceData.authenticityCheck
    )

    const images = new ScanImages(
      record.images.front,
      record.images.back,
      record.images.topEdge,
      record.images.bottomEdge,
      record.images.leftEdge,
      record.images.rightEdge
    )

    return new ScanResult(
      record.id,
      new Date(record.timestamp),
      card,
      grade,
      damageAssessment,
      authenticity,
      confidence,
      images,
      record.processingTime
    )
  }

  private mapToRecord(entity: ScanResult): ScanRecord {
    return {
      id: entity.scanId,
      userId: undefined, // Would come from auth context
      timestamp: entity.timestamp.getTime(),
      cardData: entity.card ? {
        id: entity.card.id,
        player: entity.card.player,
        year: entity.card.year,
        manufacturer: entity.card.manufacturer,
        set: entity.card.set,
        cardNumber: entity.card.cardNumber,
        subset: entity.card.subset,
        variant: entity.card.variant,
        attributes: {
          isRookie: entity.card.attributes.isRookie,
          isAutograph: entity.card.attributes.isAutograph,
          isPatch: entity.card.attributes.isPatch,
          isRefractor: entity.card.attributes.isRefractor,
          isParallel: entity.card.attributes.isParallel,
          serialNumber: entity.card.attributes.serialNumber,
          printRun: entity.card.attributes.printRun
        },
        metadata: entity.card.metadata
      } : null,
      gradeData: {
        numeric: entity.grade.numeric,
        centering: {
          leftRight: entity.grade.centering.leftRight,
          topBottom: entity.grade.centering.topBottom
        },
        corners: entity.grade.corners,
        edges: entity.grade.edges,
        surface: entity.grade.surface
      },
      damageData: {
        damages: entity.damageAssessment.damages.map(d => ({
          type: d.type,
          severity: d.severity,
          location: d.location,
          description: d.description
        })),
        overallCondition: entity.damageAssessment.overallCondition
      },
      authenticityData: {
        isAuthentic: entity.authenticity.isAuthentic,
        confidence: entity.authenticity.confidence,
        indicators: entity.authenticity.indicators,
        warnings: entity.authenticity.warnings
      },
      confidenceData: {
        overall: entity.confidence.overall,
        cardIdentification: entity.confidence.cardIdentification,
        gradeAccuracy: entity.confidence.gradeAccuracy,
        damageDetection: entity.confidence.damageDetection,
        authenticityCheck: entity.confidence.authenticityCheck
      },
      images: {
        front: entity.images.front,
        back: entity.images.back,
        topEdge: entity.images.topEdge,
        bottomEdge: entity.images.bottomEdge,
        leftEdge: entity.images.leftEdge,
        rightEdge: entity.images.rightEdge
      },
      processingTime: entity.processingTime
    }
  }

  // Cleanup method
  async clear(): Promise<void> {
    await this.scans.clear()
  }
}