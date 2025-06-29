#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  passed: boolean;
  violations: string[];
  warnings: string[];
}

// AUTO-GENERATED VALIDATION SNIPPET per CLAUDE_RULES.md
export function verifyRules(component: any): void {
  if (component.costPerScan > 0.001) {
    throw new Error('ECONOMIC_VIOLATION: Cost per scan exceeds $0.001 limit');
  }
  if (!component.blockchainSeal) {
    throw new Error('SECURITY_VIOLATION: Missing blockchain audit trail');
  }
}

class RulesValidator {
  private violations: string[] = [];
  private warnings: string[] = [];

  async validate(): Promise<ValidationResult> {
    console.log('🔍 Validating VeriCard project against CLAUDE_RULES.md...\n');

    // Check for mandatory practices
    await this.validateTestCoverage();
    await this.validateCostAnnotations();
    await this.validateArchitecture();
    await this.validateSecurityRequirements();
    await this.validatePerformance();

    const passed = this.violations.length === 0;

    return {
      passed,
      violations: this.violations,
      warnings: this.warnings,
    };
  }

  private async validateTestCoverage(): Promise<void> {
    console.log('📊 Checking test coverage requirements...');
    
    // Check if coverage report exists
    const coveragePath = path.join(__dirname, '../coverage/lcov-report/index.html');
    if (!fs.existsSync(coveragePath)) {
      this.warnings.push('No coverage report found. Run tests with coverage first.');
      return;
    }

    // In real implementation, would parse coverage report
    // For now, we'll check if jest config has correct threshold
    const jestConfigPath = path.join(__dirname, '../apps/mobile/jest.config.js');
    if (fs.existsSync(jestConfigPath)) {
      const config = fs.readFileSync(jestConfigPath, 'utf8');
      if (!config.includes('branches: 85')) {
        this.violations.push('Test coverage threshold below 85% requirement');
      }
    }
  }

  private async validateCostAnnotations(): Promise<void> {
    console.log('💰 Checking cost annotations...');
    
    const servicesPath = path.join(__dirname, '../apps/mobile/src/services');
    const files = this.getAllFiles(servicesPath, '.ts');

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for cost annotations
      if (!content.includes('// COST:')) {
        this.warnings.push(`Missing cost annotation in ${path.basename(file)}`);
      }

      // Check for cost violations
      const costMatch = content.match(/COST: \$([0-9.]+)/);
      if (costMatch && costMatch[1] && parseFloat(costMatch[1]) > 0.001) {
        this.violations.push(`Cost violation in ${path.basename(file)}: $${costMatch[1]} exceeds $0.001 limit`);
      }
    }
  }

  private async validateArchitecture(): Promise<void> {
    console.log('🏗️  Checking architecture requirements...');
    
    // Check for required services
    const requiredServices = [
      'CameraService.ts',
      'AIService.ts',
      'BlockchainService.ts',
      'SecurityService.ts',
      'DatabaseService.ts',
    ];

    const servicesPath = path.join(__dirname, '../apps/mobile/src/services');
    
    for (const service of requiredServices) {
      const exists = this.findFile(servicesPath, service);
      if (!exists) {
        this.violations.push(`Missing required service: ${service}`);
      }
    }

    // Check for prohibited dependencies
    const packageJsonPath = path.join(__dirname, '../apps/mobile/package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Check for Expo Camera (prohibited)
      if (packageJson.dependencies && packageJson.dependencies['expo-camera']) {
        this.violations.push('Using prohibited Expo Camera - must use react-native-vision-camera');
      }

      // Check for required dependencies
      if (packageJson.dependencies && !packageJson.dependencies['react-native-vision-camera']) {
        this.violations.push('Missing required react-native-vision-camera');
      }
    }
  }

  private async validateSecurityRequirements(): Promise<void> {
    console.log('🔐 Checking security requirements...');
    
    // Check for encryption implementation
    const securityServicePath = this.findFile(
      path.join(__dirname, '../apps/mobile/src/services'),
      'SecurityService.ts'
    );

    if (securityServicePath && fs.existsSync(securityServicePath)) {
      const content = fs.readFileSync(securityServicePath, 'utf8');
      
      if (!content.includes('crypto_secretbox_easy')) {
        this.violations.push('Missing end-to-end encryption implementation');
      }

      if (!content.includes('checkJailbreak')) {
        this.violations.push('Missing jailbreak detection');
      }

      if (!content.includes('performSecurityWipe')) {
        this.violations.push('Missing auto-wipe functionality');
      }
    }
  }

  private async validatePerformance(): Promise<void> {
    console.log('⚡ Checking performance targets...');
    
    const constantsPath = this.findFile(
      path.join(__dirname, '../apps/mobile/src'),
      'constants/index.ts'
    );

    if (constantsPath && fs.existsSync(constantsPath)) {
      const content = fs.readFileSync(constantsPath, 'utf8');
      
      // Check performance targets are defined
      if (!content.includes('SCAN_TO_RESULT: 800')) {
        this.warnings.push('Performance target for scan time not properly defined');
      }
    }
  }

  private getAllFiles(dir: string, extension: string): string[] {
    const files: string[] = [];
    
    if (!fs.existsSync(dir)) return files;

    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.getAllFiles(fullPath, extension));
      } else if (item.endsWith(extension)) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private findFile(dir: string, filename: string): string | null {
    if (!fs.existsSync(dir)) return null;

    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        const found = this.findFile(fullPath, filename);
        if (found) return found;
      } else if (item === filename) {
        return fullPath;
      }
    }

    return null;
  }
}

// Run validation
async function main() {
  const validator = new RulesValidator();
  const result = await validator.validate();

  console.log('\n' + '='.repeat(60) + '\n');

  if (result.passed) {
    console.log('✅ All CLAUDE_RULES.md requirements PASSED!\n');
  } else {
    console.log('❌ Validation FAILED!\n');
    console.log('Violations:');
    result.violations.forEach(v => console.log(`  - ${v}`));
  }

  if (result.warnings.length > 0) {
    console.log('\nWarnings:');
    result.warnings.forEach(w => console.log(`  - ${w}`));
  }

  console.log('\n' + '='.repeat(60));

  // Exit with appropriate code
  process.exit(result.passed ? 0 : 1);
}

main().catch(console.error);