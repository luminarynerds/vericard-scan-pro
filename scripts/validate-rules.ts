#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  passed: boolean;
  issues: string[];
  metrics: {
    hasTests: boolean;
    hasWorkingCode: boolean;
    hasMeasurements: boolean;
  };
}

/**
 * Simplified validation based on Linus's review:
 * "The only validation you need is: Does it work? Is it fast enough? Can you maintain it?"
 */
class SimplifiedValidator {
  private issues: string[] = [];

  async validate(): Promise<ValidationResult> {
    console.log('🐧 Running Linus-approved validation...\n');

    const hasTests = await this.checkTests();
    const hasWorkingCode = await this.checkWorkingCode();
    const hasMeasurements = await this.checkMeasurements();

    const passed = this.issues.length === 0;

    return {
      passed,
      issues: this.issues,
      metrics: {
        hasTests,
        hasWorkingCode,
        hasMeasurements
      }
    };
  }

  private async checkTests(): Promise<boolean> {
    console.log('1️⃣  Checking for tests...');
    
    const testFiles = this.findFiles('**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts');
    
    if (testFiles.length === 0) {
      this.issues.push('❌ No tests found. If it\'s not tested, it\'s broken.');
      return false;
    }
    
    console.log(`   ✓ Found ${testFiles.length} test files`);
    
    // Check if tests actually run
    const jestConfig = path.join(__dirname, '../apps/web/jest.config.js');
    if (!fs.existsSync(jestConfig)) {
      this.issues.push('❌ No Jest config. Tests need to actually run.');
      return false;
    }
    
    return true;
  }

  private async checkWorkingCode(): Promise<boolean> {
    console.log('2️⃣  Checking for working code...');
    
    // Check if main services exist and have actual implementations
    const services = [
      'apps/web/src/services/AIService.ts',
      'apps/web/src/services/CameraService.ts',
      'apps/web/src/services/DatabaseService.ts'
    ];
    
    let hasImplementations = 0;
    
    for (const service of services) {
      const fullPath = path.join(__dirname, '..', service);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Check for actual implementation, not just interfaces
        if (content.includes('export class') || content.includes('export function')) {
          hasImplementations++;
          console.log(`   ✓ ${path.basename(service)} has implementation`);
        } else {
          console.log(`   ⚠️  ${path.basename(service)} looks like just interfaces`);
        }
      }
    }
    
    if (hasImplementations === 0) {
      this.issues.push('❌ No actual implementations found. Architecture without code is worthless.');
      return false;
    }
    
    return true;
  }

  private async checkMeasurements(): Promise<boolean> {
    console.log('3️⃣  Checking for measurements...');
    
    const codeFiles = this.findFiles('**/*.ts', '**/*.tsx');
    let hasMeasurements = false;
    let hasRealCosts = false;
    
    for (const file of codeFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for performance measurements
      if (content.includes('performance.now()') || 
          content.includes('console.time') ||
          content.includes('measure')) {
        hasMeasurements = true;
      }
      
      // Check for real cost tracking (not just comments)
      if (content.includes('// COST:') && 
          (content.includes('performance.now()') || content.includes('calculateActualCost'))) {
        hasRealCosts = true;
      }
    }
    
    if (!hasMeasurements) {
      console.log('   ⚠️  No performance measurements found');
      console.log('      Add performance.now() to measure actual execution time');
    } else {
      console.log('   ✓ Found performance measurements');
    }
    
    if (!hasRealCosts) {
      console.log('   ⚠️  Cost annotations without measurements are fantasy');
    } else {
      console.log('   ✓ Found cost tracking with measurements');
    }
    
    return hasMeasurements;
  }

  private findFiles(...patterns: string[]): string[] {
    const files: string[] = [];
    const baseDir = path.join(__dirname, '..');
    
    // Simple file finder (in production, use glob)
    const searchDir = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.includes('node_modules') && !item.startsWith('.')) {
          searchDir(fullPath);
        } else if (stat.isFile()) {
          for (const pattern of patterns) {
            const ext = pattern.replace('**/*', '');
            if (item.endsWith(ext)) {
              files.push(fullPath);
              break;
            }
          }
        }
      }
    };
    
    searchDir(baseDir);
    return files;
  }
}

// Run validation
async function main() {
  const validator = new SimplifiedValidator();
  const result = await validator.validate();

  console.log('\n' + '='.repeat(60) + '\n');

  if (result.passed) {
    console.log('✅ PASSED - Your code meets basic standards\n');
  } else {
    console.log('❌ FAILED - Fix these issues:\n');
    result.issues.forEach(issue => console.log(`  ${issue}`));
  }

  console.log('\n📊 Metrics:');
  console.log(`  - Has tests: ${result.metrics.hasTests ? '✓' : '✗'}`);
  console.log(`  - Has working code: ${result.metrics.hasWorkingCode ? '✓' : '✗'}`);
  console.log(`  - Has measurements: ${result.metrics.hasMeasurements ? '✓' : '✗'}`);

  console.log('\n💡 Remember Linus\'s rules:');
  console.log('  1. Make it work');
  console.log('  2. Make it correct');
  console.log('  3. Make it fast (in that order)');
  console.log('  4. Measure everything\n');

  console.log('='.repeat(60));

  process.exit(result.passed ? 0 : 1);
}

main().catch(console.error);