interface CardAnalysis {
  grade: number
  confidence: number
  authentic: boolean
  damages: Array<{
    type: string
    severity: 'minor' | 'moderate' | 'severe'
    location: string
  }>
  estimatedValue?: number
  centering: {
    horizontal: number
    vertical: number
  }
}

export class AIService {
  private static readonly PROCESSING_DELAY = 800 // Simulate 0.8s processing

  static async processCard(captures: Record<string, string>): Promise<CardAnalysis> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, this.PROCESSING_DELAY))

    // Mock AI analysis based on captures
    const hasAllCaptures = ['front', 'back', 'edge-top', 'edge-bottom', 'edge-left', 'edge-right']
      .every(key => captures[key])

    if (!hasAllCaptures) {
      throw new Error('Missing required captures')
    }

    // Simulate damage detection
    const damages = this.detectDamages(captures)
    const grade = this.calculateGrade(damages)
    const confidence = this.calculateConfidence(captures)

    return {
      grade,
      confidence,
      authentic: Math.random() > 0.1, // 90% authentic rate for demo
      damages,
      estimatedValue: this.estimateValue(grade),
      centering: {
        horizontal: 48 + Math.random() * 4,
        vertical: 49 + Math.random() * 2
      }
    }
  }

  private static detectDamages(captures: Record<string, string>): CardAnalysis['damages'] {
    const possibleDamages = [
      { type: 'Surface Scratch', severity: 'minor' as const, location: 'Front Center' },
      { type: 'Corner Wear', severity: 'minor' as const, location: 'Top Right' },
      { type: 'Edge Whitening', severity: 'moderate' as const, location: 'Left Edge' },
      { type: 'Print Defect', severity: 'minor' as const, location: 'Back Lower' },
    ]

    // Randomly select 0-2 damages for demo
    const numDamages = Math.floor(Math.random() * 3)
    const selectedDamages: CardAnalysis['damages'] = []

    for (let i = 0; i < numDamages; i++) {
      const damage = possibleDamages[Math.floor(Math.random() * possibleDamages.length)]
      if (!selectedDamages.find(d => d.type === damage.type)) {
        selectedDamages.push(damage)
      }
    }

    return selectedDamages
  }

  private static calculateGrade(damages: CardAnalysis['damages']): number {
    let grade = 10

    damages.forEach(damage => {
      switch (damage.severity) {
        case 'minor':
          grade -= 0.5
          break
        case 'moderate':
          grade -= 1
          break
        case 'severe':
          grade -= 2
          break
      }
    })

    // Add some randomness for realism
    grade -= Math.random() * 0.5

    return Math.max(1, Math.round(grade * 10) / 10)
  }

  private static calculateConfidence(captures: Record<string, string>): number {
    // Base confidence on number of captures and simulated quality
    const baseConfidence = 85
    const qualityBonus = Math.random() * 10
    
    return Math.min(99, Math.round(baseConfidence + qualityBonus))
  }

  private static estimateValue(grade: number): number {
    // Mock value estimation based on grade
    const baseValues: Record<number, number> = {
      10: 5000,
      9: 2000,
      8: 800,
      7: 400,
      6: 200,
      5: 100,
      4: 50,
      3: 25,
      2: 10,
      1: 5
    }

    const gradeKey = Math.floor(grade)
    const baseValue = baseValues[gradeKey] || 5
    
    // Add some variance
    const variance = 0.8 + Math.random() * 0.4
    
    return Math.round(baseValue * variance)
  }

  static async detectUVDamage(imageData: ImageData): Promise<boolean> {
    // Simulate UV damage detection
    // In real implementation, this would analyze the blue channel intensity
    await new Promise(resolve => setTimeout(resolve, 200))
    
    return Math.random() > 0.8 // 20% chance of UV damage
  }
}