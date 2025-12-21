#!/usr/bin/env tsx
/**
 * Material Validator
 * 
 * Validates and corrects material_family against material_synonyms table.
 * This is Phase 4 of the Zero-Null enrichment strategy.
 * 
 * Usage:
 *   npx tsx scripts/missing-data-supabase/validate-materials.ts [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const dryRun = process.argv.includes('--dry-run');

console.log('🔬 Material Validator');
console.log('====================');
console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

interface MaterialSynonym {
  family: string;
  synonyms: string[];
}

interface Product {
  id: string;
  name: string;
  material: string | null;
  material_family: string | null;
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

  // Fetch material synonyms
  const { data: synonyms, error: synonymsError } = await supabase
    .from('material_synonyms')
    .select('family, synonyms');

  if (synonymsError) {
    console.error('❌ Failed to fetch material synonyms:', synonymsError.message);
    process.exit(1);
  }

  console.log(`✓ Loaded ${synonyms?.length || 0} material families\n`);

  // Fetch all products
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, material, material_family');

  if (productsError) {
    console.error('❌ Failed to fetch products:', productsError.message);
    process.exit(1);
  }

  console.log(`Found ${products?.length || 0} products to validate\n`);

  let correctedCount = 0;
  let validCount = 0;
  let unmatchedCount = 0;

  for (const product of products as Product[]) {
    console.log(`Validating: ${product.name}`);

    const validatedFamily = validateMaterialFamily(
      product,
      synonyms as MaterialSynonym[]
    );

    if (validatedFamily === product.material_family) {
      console.log(`  ✓ Material family is correct: ${validatedFamily}`);
      validCount++;
    } else if (validatedFamily) {
      console.log(`  ⚠️  Correcting: ${product.material_family} → ${validatedFamily}`);

      if (!dryRun) {
        const { error } = await supabase
          .from('products')
          .update({ material_family: validatedFamily })
          .eq('id', product.id);

        if (error) {
          console.error(`  ❌ Update failed: ${error.message}`);
        } else {
          correctedCount++;
        }
      } else {
        correctedCount++;
      }
    } else {
      console.log(`  ⚠️  No matching material family found`);
      unmatchedCount++;
    }

    console.log('');
  }

  // Summary
  console.log('📈 Validation Summary');
  console.log('====================');
  console.log(`Total products: ${products?.length || 0}`);
  console.log(`✓ Valid: ${validCount}`);
  console.log(`⚠️  Corrected: ${correctedCount}`);
  console.log(`❌ Unmatched: ${unmatchedCount}`);

  if (dryRun) {
    console.log('\nℹ️  This was a DRY RUN - no changes were made');
  }
}

/**
 * Validate material family against synonyms
 */
function validateMaterialFamily(
  product: Product,
  synonyms: MaterialSynonym[]
): string | null {
  if (!product.material) {
    return product.material_family || 'other';
  }

  const materialLower = product.material.toLowerCase();

  // Check if material matches any synonym
  for (const synonym of synonyms) {
    for (const syn of synonym.synonyms) {
      if (materialLower.includes(syn.toLowerCase())) {
        return synonym.family;
      }
    }
  }

  // Check if current material_family is valid
  const validFamilies = synonyms.map(s => s.family);
  if (product.material_family && validFamilies.includes(product.material_family)) {
    return product.material_family;
  }

  // Default to 'other'
  return 'other';
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
