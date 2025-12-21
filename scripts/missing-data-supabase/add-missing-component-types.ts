#!/usr/bin/env tsx
/**
 * Add Missing Component Types
 * 
 * Adds missing component types to component_taxonomy table for products
 * that couldn't be mapped automatically.
 * 
 * Missing types:
 * - Socket Head Cap Screw (fasteners)
 * - Steel Angle (structural)
 * - Surgical Drill Guide (custom)
 * 
 * Usage:
 *   npx tsx scripts/missing-data-supabase/add-missing-component-types.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

console.log('🔧 Adding Missing Component Types');
console.log('=================================\n');

interface ComponentType {
  canonical_name: string;
  category: string;
  description: string;
  keywords: string[];
}

const missingTypes: ComponentType[] = [
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
      console.log(`  ⚠️  Already exists - skipping`);
      existingCount++;
      continue;
    }

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

    console.log('');
  }

  // Summary
  console.log('📈 Summary');
  console.log('==========');
  console.log(`Total types: ${missingTypes.length}`);
  console.log(`✓ Added: ${addedCount}`);
  console.log(`⚠️  Already existed: ${existingCount}`);

  if (addedCount > 0) {
    console.log('\n✅ Component types added successfully!');
    console.log('   Run: npm run enrich:component-types');
  } else {
    console.log('\n✓ All component types already exist');
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
