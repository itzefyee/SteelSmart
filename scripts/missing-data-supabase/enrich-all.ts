#!/usr/bin/env tsx
/**
 * Master Data Enrichment Script
 * 
 * Runs all enrichment phases in sequence to achieve 100% data completeness.
 * 
 * Phases:
 * 1. Component Type Mapping
 * 2. Load Capacity Calculation
 * 3. Dimension Completion
 * 4. Material Validation
 * 5. Cross-Reference Validation
 * 
 * Usage:
 *   npx tsx scripts/missing-data-supabase/enrich-all.ts [--dry-run] [--skip-phase=1,2]
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';

dotenv.config({ path: '.env.local' });

const dryRun = process.argv.includes('--dry-run');
const skipPhases = process.argv
  .find(arg => arg.startsWith('--skip-phase='))
  ?.split('=')[1]
  ?.split(',')
  .map(Number) || [];

console.log('🚀 Master Data Enrichment');
console.log('========================');
console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
if (skipPhases.length > 0) {
  console.log(`Skipping phases: ${skipPhases.join(', ')}`);
}
console.log('');

interface PhaseResult {
  phase: number;
  name: string;
  success: boolean;
  message: string;
  duration: number;
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('✓ Connected to Supabase\n');

  // Run initial audit
  console.log('📊 Initial Data Audit');
  console.log('====================\n');
  await runAudit();
  console.log('');

  const results: PhaseResult[] = [];

  // Phase 1: Component Type Mapping
  if (!skipPhases.includes(1)) {
    results.push(await runPhase(
      1,
      'Component Type Mapping',
      'map-component-types.ts'
    ));
  }

  // Phase 2: Load Capacity Calculation
  if (!skipPhases.includes(2)) {
    results.push(await runPhase(
      2,
      'Load Capacity Calculation',
      'calculate-load-capacity.ts'
    ));
  }

  // Phase 3: Dimension Completion
  if (!skipPhases.includes(3)) {
    results.push(await runPhase(
      3,
      'Dimension Completion',
      'fill-dimensions.ts'
    ));
  }

  // Phase 4: Material Validation
  if (!skipPhases.includes(4)) {
    results.push(await runPhase(
      4,
      'Material Validation',
      'validate-materials.ts'
    ));
  }

  // Phase 5: Cross-Reference Validation
  if (!skipPhases.includes(5)) {
    results.push(await runPhase(
      5,
      'Cross-Reference Validation',
      'validate-references.ts'
    ));
  }

  // Run final audit
  console.log('\n📊 Final Data Audit');
  console.log('==================\n');
  await runAudit();
  console.log('');

  // Summary
  console.log('📈 Enrichment Summary');
  console.log('====================');
  
  const totalPhases = results.length;
  const successfulPhases = results.filter(r => r.success).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`Total phases: ${totalPhases}`);
  console.log(`✓ Successful: ${successfulPhases}`);
  console.log(`❌ Failed: ${totalPhases - successfulPhases}`);
  console.log(`⏱️  Total duration: ${(totalDuration / 1000).toFixed(1)}s`);
  console.log('');

  results.forEach(result => {
    const icon = result.success ? '✓' : '❌';
    console.log(`${icon} Phase ${result.phase}: ${result.name}`);
    console.log(`  ${result.message}`);
    console.log(`  Duration: ${(result.duration / 1000).toFixed(1)}s`);
  });

  if (dryRun) {
    console.log('\nℹ️  This was a DRY RUN - no changes were made');
    console.log('   Run without --dry-run to apply changes');
  }

  // Exit with error if any phase failed
  if (successfulPhases < totalPhases) {
    process.exit(1);
  }
}

async function runPhase(
  phase: number,
  name: string,
  scriptName: string
): Promise<PhaseResult> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Phase ${phase}: ${name}`);
  console.log('='.repeat(60));
  console.log('');

  const startTime = Date.now();

  try {
    const dryRunFlag = dryRun ? '--dry-run' : '';
    const command = `npx tsx scripts/missing-data-supabase/${scriptName} ${dryRunFlag}`;
    
    execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    const duration = Date.now() - startTime;

    return {
      phase,
      name,
      success: true,
      message: 'Completed successfully',
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    return {
      phase,
      name,
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      duration,
    };
  }
}

async function runAudit(): Promise<void> {
  try {
    execSync('npx tsx scripts/missing-data-supabase/audit-product-data.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  } catch (error) {
    console.error('⚠️  Audit failed:', error);
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
