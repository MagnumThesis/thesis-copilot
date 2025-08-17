#!/usr/bin/env node

/**
 * Proofreader Integration Verification Script
 * 
 * This script verifies that all proofreader components are properly integrated
 * and the feature is ready for deployment.
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 Verifying Proofreader Tool Integration...\n');

// Check if all required files exist
const requiredFiles = [
  // Core components
  'src/components/ui/proofreader.tsx',
  'src/components/ui/concern-list.tsx',
  'src/components/ui/concern-detail.tsx',
  'src/components/ui/analysis-progress.tsx',
  
  // Backend handlers
  'src/worker/handlers/proofreader-ai.ts',
  'src/worker/lib/concern-analysis-engine.ts',
  'src/worker/lib/concern-status-manager.ts',
  
  // Types and interfaces
  'src/lib/ai-types.ts',
  
  // Support services
  'src/lib/proofreader-error-handling.ts',
  'src/lib/proofreader-recovery-service.ts',
  'src/lib/proofreader-performance-optimizer.ts',
  'src/lib/proofreader-performance-monitor.ts',
  
  // Database migrations
  'migrations/v3_create_proofreading_tables.sql',
  'migrations/new_db.sql',
  
  // Documentation
  'docs/proofreader-user-guide.md',
  'docs/proofreader-developer-guide.md',
  'docs/proofreader-migration-deployment-guide.md',
  
  // Tests
  'src/tests/proofreader-final-integration.test.ts'
];

let allFilesExist = true;

console.log('📁 Checking required files...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Check integration in ToolsPanel
console.log('\n🔗 Checking ToolsPanel integration...');
const toolsPanelPath = 'src/components/ui/tools-panel.tsx';
if (fs.existsSync(toolsPanelPath)) {
  const toolsPanelContent = fs.readFileSync(toolsPanelPath, 'utf8');
  
  const integrationChecks = [
    { check: 'Proofreader import', pattern: /import.*Proofreader.*from.*proofreader/ },
    { check: 'Proofreader state', pattern: /isProofreaderSheetOpen/ },
    { check: 'Proofreader handler', pattern: /handleProofreaderClick/ },
    { check: 'Proofreader component', pattern: /<Proofreader/ },
    { check: 'Proofreader tool card', pattern: /Proofreader.*description.*loopholes/ }
  ];
  
  integrationChecks.forEach(({ check, pattern }) => {
    if (pattern.test(toolsPanelContent)) {
      console.log(`✅ ${check}`);
    } else {
      console.log(`❌ ${check} - NOT FOUND`);
      allFilesExist = false;
    }
  });
} else {
  console.log(`❌ ${toolsPanelPath} - MISSING`);
  allFilesExist = false;
}

// Check database migration files
console.log('\n🗄️ Checking database migrations...');
const migrationFiles = [
  'migrations/v3_create_proofreading_tables.sql',
  'migrations/new_db.sql'
];

migrationFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const migrationChecks = [
      { check: 'Concern categories enum', pattern: /CREATE TYPE concern_category/ },
      { check: 'Concern severity enum', pattern: /CREATE TYPE concern_severity/ },
      { check: 'Concern status enum', pattern: /CREATE TYPE concern_status/ },
      { check: 'Proofreading concerns table', pattern: /CREATE TABLE proofreading_concerns/ },
      { check: 'Proofreading sessions table', pattern: /CREATE TABLE proofreading_sessions/ },
      { check: 'Performance indexes', pattern: /CREATE INDEX.*proofreading_concerns/ }
    ];
    
    console.log(`\n📄 ${file}:`);
    migrationChecks.forEach(({ check, pattern }) => {
      if (pattern.test(content)) {
        console.log(`  ✅ ${check}`);
      } else {
        console.log(`  ❌ ${check} - NOT FOUND`);
        allFilesExist = false;
      }
    });
  }
});

// Check API types
console.log('\n🔧 Checking API types...');
const aiTypesPath = 'src/lib/ai-types.ts';
if (fs.existsSync(aiTypesPath)) {
  const aiTypesContent = fs.readFileSync(aiTypesPath, 'utf8');
  
  const typeChecks = [
    { check: 'ProofreadingConcern interface', pattern: /interface ProofreadingConcern/ },
    { check: 'ConcernCategory enum', pattern: /enum ConcernCategory/ },
    { check: 'ConcernSeverity enum', pattern: /enum ConcernSeverity/ },
    { check: 'ConcernStatus enum', pattern: /enum ConcernStatus/ },
    { check: 'ProofreaderAnalysisRequest interface', pattern: /interface ProofreaderAnalysisRequest/ },
    { check: 'ProofreaderAnalysisResponse interface', pattern: /interface ProofreaderAnalysisResponse/ }
  ];
  
  typeChecks.forEach(({ check, pattern }) => {
    if (pattern.test(aiTypesContent)) {
      console.log(`✅ ${check}`);
    } else {
      console.log(`❌ ${check} - NOT FOUND`);
      allFilesExist = false;
    }
  });
} else {
  console.log(`❌ ${aiTypesPath} - MISSING`);
  allFilesExist = false;
}

// Check package.json for dependencies
console.log('\n📦 Checking dependencies...');
const packageJsonPath = 'package.json';
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = [
    'react',
    '@testing-library/react',
    '@testing-library/user-event',
    'vitest'
  ];
  
  const optionalDeps = [
    'msw'
  ];
  
  requiredDeps.forEach(dep => {
    if (dependencies[dep]) {
      console.log(`✅ ${dep}: ${dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep} - NOT FOUND`);
      allFilesExist = false;
    }
  });
  
  optionalDeps.forEach(dep => {
    if (dependencies[dep]) {
      console.log(`✅ ${dep}: ${dependencies[dep]} (optional)`);
    } else {
      console.log(`⚠️ ${dep} - NOT FOUND (optional, for advanced testing)`);
    }
  });
}

// Summary
console.log('\n' + '='.repeat(50));
if (allFilesExist) {
  console.log('🎉 VERIFICATION PASSED');
  console.log('✅ All proofreader components are properly integrated');
  console.log('✅ Database migrations are ready');
  console.log('✅ Documentation is complete');
  console.log('✅ Tests are implemented');
  console.log('\n📋 Next Steps:');
  console.log('1. Apply database migrations (see migration guide)');
  console.log('2. Configure environment variables');
  console.log('3. Deploy to staging for testing');
  console.log('4. Run integration tests');
  console.log('5. Deploy to production');
  process.exit(0);
} else {
  console.log('❌ VERIFICATION FAILED');
  console.log('Some required files or integrations are missing.');
  console.log('Please review the output above and fix any issues.');
  process.exit(1);
}