#!/usr/bin/env tsx
/**
 * Component Type Mapper
 * 
 * Maps all products to component_taxonomy.id based on product name and category.
 * This is Phase 1 of the Zero-Null enrichment strategy.
 * 
 * Usage:
 *   npx tsx scripts/missing-data-supabase/map-component-types.ts [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const dryRun = process.argv.includes('--dry-run');

console.log('🗺️  Component Type Mapper');
console.log('========================');
console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

interface ComponentType {
  id: string;
  canonical_name: string;
  category: string;
  keywords: string[];
}

interface Product {
  id: string;
  name: string;
  category: string;
  component_type_id: string | null;
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

  // Fetch all component types
  const { data: componentTypes, error: typesError } = await supabase
    .from('component_taxonomy')
    .select('id, canonical_name, category, keywords');

  if (typesError) {
    console.error('❌ Failed to fetch component types:', typesError.message);
    process.exit(1);
  }

  console.log(`✓ Loaded ${componentTypes?.length || 0} component types\n`);

  // Fetch products without component_type_id
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, category, component_type_id')
    .is('component_type_id', null);

  if (productsError) {
    console.error('❌ Failed to fetch products:', productsError.message);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log('✓ All products already have component types!');
    return;
  }

  console.log(`Found ${products.length} products to map\n`);

  // Map each product
  let successCount = 0;
  let failCount = 0;
  const unmapped: Product[] = [];

  for (const product of products as Product[]) {
    console.log(`Processing: ${product.name}`);

    const componentType = findComponentType(
      product,
      componentTypes as ComponentType[]
    );

    if (componentType) {
      console.log(`  ✓ Mapped to: ${componentType.canonical_name}`);

      if (!dryRun) {
        const { error } = await supabase
          .from('products')
          .update({ component_type_id: componentType.id })
          .eq('id', product.id);

        if (error) {
          console.error(`  ❌ Update failed: ${error.message}`);
          failCount++;
        } else {
          successCount++;
        }
      } else {
        successCount++;
      }
    } else {
      console.log(`  ⚠️  No matching component type found`);
      unmapped.push(product);
      failCount++;
    }

    console.log('');
  }

  // Summary
  console.log('📈 Mapping Summary');
  console.log('=================');
  console.log(`Total products: ${products.length}`);
  console.log(`✓ Mapped: ${successCount}`);
  console.log(`❌ Unmapped: ${failCount}`);

  if (unmapped.length > 0) {
    console.log('\n⚠️  Unmapped Products:');
    unmapped.forEach(p => {
      console.log(`  - ${p.name} (${p.category})`);
    });
    console.log('\nThese products need manual component type assignment.');
  }

  if (dryRun) {
    console.log('\nℹ️  This was a DRY RUN - no changes were made');
  }
}

/**
 * Find matching component type for a product
 */
function findComponentType(
  product: Product,
  componentTypes: ComponentType[]
): ComponentType | null {
  const productNameLower = product.name.toLowerCase();
  const productCategory = product.category;

  // First, try exact keyword matching within same category
  for (const type of componentTypes) {
    if (type.category === productCategory) {
      for (const keyword of type.keywords) {
        if (productNameLower.includes(keyword.toLowerCase())) {
          return type;
        }
      }
    }
  }

  // Second, try canonical name matching within same category
  for (const type of componentTypes) {
    if (type.category === productCategory) {
      if (productNameLower.includes(type.canonical_name.toLowerCase())) {
        return type;
      }
    }
  }

  // Third, try keyword matching across all categories
  for (const type of componentTypes) {
    for (const keyword of type.keywords) {
      if (productNameLower.includes(keyword.toLowerCase())) {
        return type;
      }
    }
  }

  // Fourth, try canonical name matching across all categories
  for (const type of componentTypes) {
    if (productNameLower.includes(type.canonical_name.toLowerCase())) {
      return type;
    }
  }

  // No match found
  return null;
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
