#!/usr/bin/env tsx
/**
 * Fix Schema Issues
 * 
 * This script fixes the schema issues found during enrichment:
 * 1. Adds missing columns (dimension_note, load_capacity_note)
 * 2. Adds missing component types to taxonomy
 * 
 * Usage:
 *   npx tsx scripts/missing-data-supabase/fix-schema-issues.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

console.log('🔧 Fixing Schema Issues');
console.log('======================\n');

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

  // Step 1: Add missing columns
  console.log('Step 1: Adding missing columns to product_specs');
  console.log('================================================\n');

  const columns = [
    { name: 'dimension_note', type: 'TEXT' },
    { name: 'load_capacity_note', type: 'TEXT' },
    { name: 'material_note', type: 'TEXT' },
  ];

  for (const column of columns) {
    console.log(`Checking column: ${column.name}`);

    // Try to select the column to see if it exists
    const { error } = await supabase
      .from('product_specs')
      .select(column.name)
      .limit(1);

    if (error && error.message.includes('column')) {
      console.log(`  ⚠️  Column doesn't exist - needs to be added`);
      console.log(`  📝 Please run this SQL in Supabase SQL Editor:`);
      console.log(`     ALTER TABLE product_specs ADD COLUMN ${column.name} ${column.type};`);
    } else {
      console.log(`  ✓ Column exists`);
    }

    console.log('');
  }

  // Step 2: Add missing component types
  console.log('Step 2: Adding missing component types');
  console.log('======================================\n');

  const missingTypes = [
    {
      canonical_name: 'Socket Head Cap Screw',
      category: 'fasteners',
      description: 'Socket head cap screw with internal hex drive',
      keywords: ['socket', 'cap screw', 'allen', 'hex socket', 'shcs'],
    },
    {
      canonical_name: 'Steel Angle',
      category: 'structural',
      description: 'L-shaped structural steel angle iron',
      keywords: ['angle', 'angle iron', 'l-beam', 'corner'],
    },
    {
      canonical_name: 'Surgical Drill Guide',
      category: 'custom',
      description: 'Medical/surgical drill guide for precision drilling',
      keywords: ['surgical', 'drill guide', 'medical', 'guide'],
    },
  ];

  let addedCount = 0;
  let existingCount = 0;

  for (const type of missingTypes) {
    console.log(`Processing: ${type.canonical_name}`);

    // Check if already exists
    const { data: existing } = await supabase
      .from('component_taxonomy')
      .select('id')
      .eq('canonical_name', type.canonical_name)
      .single();

    if (existing) {
      console.log(`  ✓ Already exists`);
      existingCount++;
    } else {
      // Insert new component type
      const { error } = await supabase
        .from('component_taxonomy')
        .insert({
          canonical_name: type.canonical_name,
          category: type.category,
          description: type.description,
          keywords: type.keywords,
        });

      if (error) {
        console.error(`  ❌ Failed to add: ${error.message}`);
      } else {
        console.log(`  ✓ Added successfully`);
        addedCount++;
      }
    }

    console.log('');
  }

  // Summary
  console.log('📈 Summary');
  console.log('==========');
  console.log(`Component types added: ${addedCount}`);
  console.log(`Component types existing: ${existingCount}`);
  console.log('');

  // Check if migration file exists
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', 'add_note_columns.sql');
  if (fs.existsSync(migrationPath)) {
    console.log('📝 Migration File Available');
    console.log('===========================');
    console.log('A migration file has been created at:');
    console.log(`  ${migrationPath}`);
    console.log('');
    console.log('To apply it:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Copy and paste the contents of add_note_columns.sql');
    console.log('3. Run the SQL');
    console.log('');
  }

  // Next steps
  console.log('✅ Next Steps');
  console.log('=============');
  console.log('1. Apply the SQL migration for missing columns (see above)');
  console.log('2. Run: npm run enrich-all');
  console.log('3. Verify: npm run audit-data');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
