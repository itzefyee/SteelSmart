#!/usr/bin/env tsx
/**
 * Dimension Filler
 * 
 * Fills missing dimensions for products with reasonable defaults or marks as custom.
 * This is Phase 3 of the Zero-Null enrichment strategy.
 * 
 * Usage:
 *   npx tsx scripts/missing-data-supabase/fill-dimensions.ts [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const dryRun = process.argv.includes('--dry-run');

console.log('📏 Dimension Filler');
console.log('==================');
console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

interface ProductWithSpecs {
  id: string;
  name: string;
  category: string;
  product_specs?: {
    width_mm?: number;
    height_mm?: number;
    depth_mm?: number;
    diameter_mm?: number;
    length_mm?: number;
    thickness_mm?: number;
  };
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

  // Fetch all products with their specs
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      category,
      product_specs (
        width_mm,
        height_mm,
        depth_mm,
        diameter_mm,
        length_mm,
        thickness_mm
      )
    `);

  if (error) {
    console.error('❌ Failed to fetch products:', error.message);
    process.exit(1);
  }

  // Filter products with missing dimensions
  const productsNeedingDimensions = (products as any[]).filter(p => {
    const specs = Array.isArray(p.product_specs) ? p.product_specs[0] : p.product_specs;
    
    if (!specs) return true;

    // Check if all dimension fields are null
    const hasDimensions = specs.width_mm || specs.height_mm || specs.depth_mm ||
                         specs.diameter_mm || specs.length_mm || specs.thickness_mm;
    
    return !hasDimensions;
  });

  if (productsNeedingDimensions.length === 0) {
    console.log('✓ All products have dimensions!');
    return;
  }

  console.log(`Found ${productsNeedingDimensions.length} products needing dimensions\n`);

  let successCount = 0;
  let customCount = 0;

  for (const product of productsNeedingDimensions) {
    const specs = Array.isArray(product.product_specs) 
      ? product.product_specs[0] 
      : product.product_specs;

    console.log(`Processing: ${product.name}`);

    const dimensions = estimateDimensions(product);

    if (dimensions.isCustom) {
      console.log(`  ⚠️  Marked as custom - dimensions vary by order`);
      customCount++;

      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('product_specs')
          .upsert({
            product_id: product.id,
            ...specs,
            dimension_note: dimensions.note,
          }, {
            onConflict: 'product_id'
          });

        if (updateError) {
          console.error(`  ❌ Update failed: ${updateError.message}`);
        } else {
          successCount++;
        }
      } else {
        successCount++;
      }
    } else {
      console.log(`  ✓ Estimated dimensions: ${JSON.stringify(dimensions.dimensions)}`);

      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('product_specs')
          .upsert({
            product_id: product.id,
            ...specs,
            ...dimensions.dimensions,
            dimension_note: dimensions.note,
          }, {
            onConflict: 'product_id'
          });

        if (updateError) {
          console.error(`  ❌ Update failed: ${updateError.message}`);
        } else {
          successCount++;
        }
      } else {
        successCount++;
      }
    }

    console.log('');
  }

  // Summary
  console.log('📈 Dimension Filling Summary');
  console.log('===========================');
  console.log(`Total products: ${productsNeedingDimensions.length}`);
  console.log(`✓ Filled: ${successCount}`);
  console.log(`⚠️  Marked as custom: ${customCount}`);

  if (dryRun) {
    console.log('\nℹ️  This was a DRY RUN - no changes were made');
  }
}

/**
 * Estimate dimensions based on product type and name
 */
function estimateDimensions(
  product: ProductWithSpecs
): {
  dimensions?: Record<string, number>;
  note: string;
  isCustom: boolean;
} {
  const nameLower = product.name.toLowerCase();
  const category = product.category;

  // Custom parts - mark as custom
  if (category === 'custom' || nameLower.includes('custom')) {
    return {
      note: 'Custom dimensions - specify requirements in RFQ',
      isCustom: true,
    };
  }

  // Try to extract dimensions from name
  const extractedDims = extractDimensionsFromName(nameLower);
  if (extractedDims) {
    return {
      dimensions: extractedDims,
      note: 'Dimensions extracted from product name',
      isCustom: false,
    };
  }

  // Provide typical dimensions based on product type
  const typicalDims = getTypicalDimensions(nameLower, category);
  if (typicalDims) {
    return {
      dimensions: typicalDims,
      note: 'Typical dimensions - actual may vary',
      isCustom: false,
    };
  }

  // Fall back to custom
  return {
    note: 'Dimensions not specified - contact supplier',
    isCustom: true,
  };
}

/**
 * Extract dimensions from product name
 */
function extractDimensionsFromName(name: string): Record<string, number> | null {
  const dimensions: Record<string, number> = {};

  // Pattern: 50x50x5mm or 100x50x6mm
  const crossSectionMatch = name.match(/(\d+)x(\d+)x(\d+)\s*mm/);
  if (crossSectionMatch) {
    dimensions.width_mm = parseInt(crossSectionMatch[1]);
    dimensions.height_mm = parseInt(crossSectionMatch[2]);
    dimensions.thickness_mm = parseInt(crossSectionMatch[3]);
    return dimensions;
  }

  // Pattern: M12x80 (bolt size x length)
  const boltMatch = name.match(/m(\d+)x(\d+)/i);
  if (boltMatch) {
    dimensions.diameter_mm = parseInt(boltMatch[1]);
    dimensions.length_mm = parseInt(boltMatch[2]);
    return dimensions;
  }

  // Pattern: 10mm thickness
  const thicknessMatch = name.match(/(\d+)\s*mm\s+thick/i);
  if (thicknessMatch) {
    dimensions.thickness_mm = parseInt(thicknessMatch[1]);
  }

  // Pattern: diameter 68mm
  const diameterMatch = name.match(/diameter\s+(\d+)\s*mm/i);
  if (diameterMatch) {
    dimensions.diameter_mm = parseInt(diameterMatch[1]);
  }

  return Object.keys(dimensions).length > 0 ? dimensions : null;
}

/**
 * Get typical dimensions for common product types
 */
function getTypicalDimensions(name: string, category: string): Record<string, number> | null {
  // Mounting brackets
  if (name.includes('bracket') || name.includes('mount')) {
    return {
      width_mm: 100,
      height_mm: 50,
      depth_mm: 20,
      thickness_mm: 3,
    };
  }

  // Motors
  if (name.includes('motor')) {
    return {
      diameter_mm: 60,
      length_mm: 80,
    };
  }

  // Actuators
  if (name.includes('actuator')) {
    return {
      width_mm: 50,
      height_mm: 50,
      length_mm: 200,
    };
  }

  // Encoders/Sensors
  if (name.includes('encoder') || name.includes('sensor')) {
    return {
      diameter_mm: 35,
      length_mm: 50,
    };
  }

  // Couplings
  if (name.includes('coupling')) {
    return {
      diameter_mm: 25,
      length_mm: 30,
    };
  }

  return null;
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
