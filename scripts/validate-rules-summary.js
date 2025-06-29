#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating VeriCard project against CLAUDE_RULES.md...\n');

const results = {
  passed: [],
  warnings: [],
  violations: []
};

// Check for required services
console.log('📊 Checking core services...');
const services = [
  'CameraService.ts',
  'UVFilterService.ts', 
  'AIService.ts',
  'DamageDetectionService.ts',
  'BlockchainService.ts',
  'SecurityService.ts',
  'TheftPreventionService.ts',
  'ReportGenerationService.ts',
  'CommissionCalculator.ts',
  'PerformanceOptimizer.ts'
];

services.forEach(service => {
  const exists = fs.existsSync(path.join(__dirname, '../apps/mobile/src/services', service)) ||
                 fs.existsSync(path.join(__dirname, '../apps/mobile/src/services/camera', service)) ||
                 fs.existsSync(path.join(__dirname, '../apps/mobile/src/services/ai', service)) ||
                 fs.existsSync(path.join(__dirname, '../apps/mobile/src/services/blockchain', service)) ||
                 fs.existsSync(path.join(__dirname, '../apps/mobile/src/services/security', service)) ||
                 fs.existsSync(path.join(__dirname, '../apps/mobile/src/services/theft', service)) ||
                 fs.existsSync(path.join(__dirname, '../apps/mobile/src/services/reports', service)) ||
                 fs.existsSync(path.join(__dirname, '../apps/mobile/src/services/commission', service)) ||
                 fs.existsSync(path.join(__dirname, '../apps/mobile/src/services/performance', service));
  
  if (exists) {
    results.passed.push(`✅ ${service} implemented`);
  } else {
    results.violations.push(`❌ Missing ${service}`);
  }
});

// Check package.json
console.log('\n💰 Checking dependencies...');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../apps/mobile/package.json'), 'utf8'));

if (packageJson.dependencies['react-native-vision-camera']) {
  results.passed.push('✅ Using react-native-vision-camera (NOT Expo Camera)');
} else {
  results.violations.push('❌ Missing react-native-vision-camera');
}

if (!packageJson.dependencies['expo-camera']) {
  results.passed.push('✅ Not using prohibited Expo Camera');
} else {
  results.violations.push('❌ Using prohibited Expo Camera');
}

// Check security features
console.log('\n🔐 Checking security requirements...');
const securityPath = path.join(__dirname, '../apps/mobile/src/services/security/SecurityService.ts');
if (fs.existsSync(securityPath)) {
  const content = fs.readFileSync(securityPath, 'utf8');
  
  if (content.includes('checkJailbreak')) {
    results.passed.push('✅ Jailbreak detection implemented');
  } else {
    results.violations.push('❌ Missing jailbreak detection');
  }
  
  if (content.includes('crypto_secretbox_easy')) {
    results.passed.push('✅ End-to-end encryption implemented');
  } else {
    results.violations.push('❌ Missing encryption');
  }
  
  if (content.includes('performSecurityWipe')) {
    results.passed.push('✅ Auto-wipe functionality implemented');
  } else {
    results.violations.push('❌ Missing auto-wipe');
  }
}

// Check performance targets
console.log('\n⚡ Checking performance targets...');
const constantsPath = path.join(__dirname, '../apps/mobile/src/constants/index.ts');
if (fs.existsSync(constantsPath)) {
  const content = fs.readFileSync(constantsPath, 'utf8');
  
  if (content.includes('SCAN_TO_RESULT: 800')) {
    results.passed.push('✅ Performance target set to <0.8s');
  } else {
    results.warnings.push('⚠️  Performance target not properly defined');
  }
}

// Check test coverage
console.log('\n🧪 Checking test coverage...');
const testFiles = [
  'AIService.test.ts',
  'DamageDetectionService.test.ts',
  'UVFilterService.test.ts',
  'TheftPreventionService.test.ts',
  'ReportGenerationService.test.ts',
  'CommissionCalculator.test.ts',
  'PerformanceOptimizer.test.ts'
];

let testCount = 0;
testFiles.forEach(test => {
  const exists = fs.existsSync(path.join(__dirname, '../apps/mobile/src/services/ai/__tests__', test)) ||
                 fs.existsSync(path.join(__dirname, '../apps/mobile/src/services/camera/__tests__', test)) ||
                 fs.existsSync(path.join(__dirname, '../apps/mobile/src/services/theft/__tests__', test)) ||
                 fs.existsSync(path.join(__dirname, '../apps/mobile/src/services/reports/__tests__', test)) ||
                 fs.existsSync(path.join(__dirname, '../apps/mobile/src/services/commission/__tests__', test)) ||
                 fs.existsSync(path.join(__dirname, '../apps/mobile/src/services/performance/__tests__', test));
  
  if (exists) testCount++;
});

if (testCount === testFiles.length) {
  results.passed.push(`✅ All ${testCount} test files created`);
} else {
  results.warnings.push(`⚠️  Only ${testCount}/${testFiles.length} test files found`);
}

// Phase 2 specific features
console.log('\n🚀 Checking Phase 2 features...');
const phase2Features = {
  'UV Filter': fs.existsSync(path.join(__dirname, '../apps/mobile/src/services/camera/UVFilterService.ts')),
  'Multi-angle capture': fs.existsSync(path.join(__dirname, '../apps/mobile/src/components/MultiAngleCapture.tsx')),
  'Damage detection': fs.existsSync(path.join(__dirname, '../apps/mobile/src/services/ai/DamageDetectionService.ts')),
  'Theft prevention': fs.existsSync(path.join(__dirname, '../apps/mobile/src/services/theft/TheftPreventionService.ts')),
  'PSA/eBay reports': fs.existsSync(path.join(__dirname, '../apps/mobile/src/services/reports/ReportGenerationService.ts')),
  'Commission calculator': fs.existsSync(path.join(__dirname, '../apps/mobile/src/services/commission/CommissionCalculator.ts'))
};

Object.entries(phase2Features).forEach(([feature, exists]) => {
  if (exists) {
    results.passed.push(`✅ ${feature} implemented`);
  } else {
    results.violations.push(`❌ Missing ${feature}`);
  }
});

// Summary
console.log('\n' + '='.repeat(60) + '\n');

if (results.violations.length === 0) {
  console.log('✅ All CLAUDE_RULES.md requirements PASSED!\n');
  console.log('Phase 2 Implementation Complete! 🎉\n');
} else {
  console.log('❌ Validation FAILED!\n');
  console.log('Violations:');
  results.violations.forEach(v => console.log(`  ${v}`));
}

if (results.warnings.length > 0) {
  console.log('\nWarnings:');
  results.warnings.forEach(w => console.log(`  ${w}`));
}

console.log('\nPassed checks:');
results.passed.forEach(p => console.log(`  ${p}`));

console.log('\n' + '='.repeat(60));
console.log('\n📈 Phase 2 Completion Status:');
console.log(`  ✅ Passed: ${results.passed.length}`);
console.log(`  ⚠️  Warnings: ${results.warnings.length}`);
console.log(`  ❌ Violations: ${results.violations.length}`);
console.log(`  📊 Success Rate: ${Math.round((results.passed.length / (results.passed.length + results.violations.length)) * 100)}%`);

process.exit(results.violations.length > 0 ? 1 : 0);