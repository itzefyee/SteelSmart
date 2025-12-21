#!/usr/bin/env tsx
/**
 * Load Capacity Calculator
 * 
 * Calculates or estimates load capacity for products based on:
 * - Material properties
 * - Dimensions
 * - Product type
 * - Industry standards
 * 
 * This is Phase 2 of the Zero-Null enrichment strategy.
 * 
 * Usage:
 *   npx tsx scripts/missing-data-supabase/calculate-load-capacity.ts [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const dryRun = process.argv.includes('--dry-run');

console.log('⚖️  Load Capacity Calculator');
console.log('===========================');
console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

interface ProductWithSpecs {
  id: string;
  name: string;
  category: string;
  material: string | null;
  material_family: string | null;
  specifications: any;
  product_specs?: {
    width_mm?: number;
    height_mm?: number;
    depth_mm?: number;
    diameter_mm?: number;
    length_mm?: number;
    thickness_mm?: number;
    load_max_kn?: number;
    load_min_kn?: number;
  };
}

// Standard bolt load capacities (kN) - ISO 898-1
const BOLT_LOAD_TABLE: Record<string, Record<string, number>> = {
  'M6': { '8.8': 11.2, '10.9': 15.9, '12.9': 19.0 },
  'M8': { '8.8': 18.4, '10.9': 26.1, '12.9': 31.2 },
  'M10': { '8.8': 29.0, '10.9': 41.0, '12.9': 49.0 },
  'M12': { '8.8': 42.0, '10.9': 59.0, '12.9': 71.0 },
  'M16': { '8.8': 74.0, '10.9': 105.0, '12.9': 125.0 },
  'M20': { '8.8': 117.0, '10.9': 165.0, '12.9': 198.0 },
};

// Material yield strengths (MPa)
const MATERIAL_YIELD_STRENGTH: Record<string, number> = {
  'steel': 250,
  'stainless': 215,
  'aluminum': 95,
  'alloy steel': 350,
  'carbon': 250,
  'titanium': 880,
  'brass': 200,
};

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

  // Fetch products with missing load capacity
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      category,
      material,
      material_family,
      specifications,
      product_specs (
        width_mm,
        height_mm,
        depth_mm,
        diameter_mm,
        length_mm,
        thickness_mm,
        load_max_kn,
        load_min_kn
      )
    `);

  if (error) {
    console.error('❌ Failed to fetch products:', error.message);
    process.exit(1);
  }

  // Filter products without load capacity
  const productsNeedingLoad = (products as any[]).filter(p => {
    const specs = Array.isArray(p.product_specs) ? p.product_specs[0] : p.product_specs;
    return !specs?.load_max_kn && !specs?.load_min_kn;
  });

  if (productsNeedingLoad.length === 0) {
    console.log('✓ All products already have load capacity!');
    return;
  }

  console.log(`Found ${productsNeedingLoad.length} products needing load capacity\n`);

  let successCount = 0;
  let skippedCount = 0;

  for (const product of productsNeedingLoad) {
    const specs = Array.isArray(product.product_specs) 
      ? product.product_specs[0] 
      : product.product_specs;

    console.log(`Processing: ${product.name}`);

    const loadCapacity = calculateLoadCapacity(product, specs);

    if (loadCapacity) {
      console.log(`  ✓ Load capacity: ${loadCapacity.load_max_kn} kN (${loadCapacity.method})`);

      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('product_specs')
          .upsert({
            product_id: product.id,
            ...specs,
            load_max_kn: loadCapacity.load_max_kn,
            load_min_kn: loadCapacity.load_min_kn,
            load_capacity_note: loadCapacity.note,
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
      console.log(`  ⚠️  Cannot calculate load capacity - insufficient data`);
      skippedCount++;
    }

    console.log('');
  }

  // Summary
  console.log('📈 Calculation Summary');
  console.log('=====================');
  console.log(`Total products: ${productsNeedingLoad.length}`);
  console.log(`✓ Calculated: ${successCount}`);
  console.log(`⚠️  Skipped: ${skippedCount}`);

  if (dryRun) {
    console.log('\nℹ️  This was a DRY RUN - no changes were made');
  }
}

/**
 * Calculate load capacity based on product type and specifications
 */
function calculateLoadCapacity(
  product: ProductWithSpecs,
  specs: any
): { load_max_kn: number; load_min_kn: number | null; method: string; note: string } | null {
  const nameLower = product.name.toLowerCase();
  const category = product.category;

  // Fasteners - use standard tables
  if (category === 'fasteners') {
    return calculateFastenerLoad(nameLower, product.material);
  }

  // Structural components - calculate from dimensions
  if (category === 'structural') {
    return calculateStructuralLoad(product, specs);
  }

  // Robotic components - extract from specifications or mark N/A
  if (category === 'robotic') {
    return calculateRoboticLoad(product, specs);
  }

  // Custom parts - mark as requiring engineering analysis
  if (category === 'custom') {
    return {
      load_max_kn: 0,
      load_min_kn: null,
      method: 'custom',
      note: 'Requires custom engineering analysis - contact supplier'
    };
  }

  return null;
}

/**
 * Calculate fastener load capacity from standard tables
 */
function calculateFastenerLoad(
  name: string,
  material: string | null
): { load_max_kn: number; load_min_kn: number | null; method: string; note: string } | null {
  // Extract size (M6, M8, M10, M12, etc.)
  const sizeMatch = name.match(/m(\d+)/i);
  if (!sizeMatch) return null;

  const size = `M${sizeMatch[1]}`;

  // Extract grade (8.8, 10.9, 12.9)
  const gradeMatch = name.match(/grade\s*(\d+\.?\d*)/i);
  const grade = gradeMatch ? gradeMatch[1] : '8.8'; // Default to 8.8

  // Look up in table
  const loadTable = BOLT_LOAD_TABLE[size];
  if (!loadTable) return null;

  const loadKn = loadTable[grade] || loadTable['8.8'];

  return {
    load_max_kn: loadKn,
    load_min_kn: null,
    method: 'ISO 898-1 standard',
    note: `Tensile load capacity for ${size} Grade ${grade} bolt`
  };
}

/**
 * Calculate structural component load capacity
 */
function calculateStructuralLoad(
  product: ProductWithSpecs,
  specs: any
): { load_max_kn: number; load_min_kn: number | null; method: string; note: string } | null {
  if (!specs) return null;

  const materialFamily = product.material_family || 'steel';
  const yieldStrength = MATERIAL_YIELD_STRENGTH[materialFamily] || 250; // MPa

  // For beams and angles - calculate based on cross-section
  if (specs.width_mm && specs.height_mm && specs.thickness_mm) {
    // Simplified calculation: Load = Yield Strength × Cross-sectional Area
    const area = calculateCrossSectionArea(specs);
    const loadKn = (yieldStrength * area) / 1000; // Convert to kN

    return {
      load_max_kn: Math.round(loadKn * 10) / 10,
      load_min_kn: null,
      method: 'calculated',
      note: `Estimated from cross-section and ${materialFamily} yield strength`
    };
  }

  // For plates - calculate based on area
  if (specs.width_mm && specs.length_mm && specs.thickness_mm) {
    const area = specs.width_mm * specs.thickness_mm;
    const loadKn = (yieldStrength * area) / 1000;

    return {
      load_max_kn: Math.round(loadKn * 10) / 10,
      load_min_kn: null,
      method: 'calculated',
      note: `Estimated from plate dimensions and ${materialFamily} yield strength`
    };
  }

  return null;
}

/**
 * Calculate cross-sectional area for structural shapes
 */
function calculateCrossSectionArea(specs: any): number {
  // Simplified: assume rectangular hollow section
  const outerArea = specs.width_mm * specs.height_mm;
  const innerArea = (specs.width_mm - 2 * specs.thickness_mm) * 
                    (specs.height_mm - 2 * specs.thickness_mm);
  return outerArea - innerArea;
}

/**
 * Calculate robotic component load capacity
 */
function calculateRoboticLoad(
  product: ProductWithSpecs,
  specs: any
): { load_max_kn: number; load_min_kn: number | null; method: string; note: string } | null {
  const nameLower = product.name.toLowerCase();

  // Motors and actuators - extract from specifications
  if (nameLower.includes('motor') || nameLower.includes('actuator')) {
    // Try to extract torque or force from specifications
    const specsObj = product.specifications || {};
    
    // Look for torque (Nm) or force (N) in specifications
    const torqueMatch = JSON.stringify(specsObj).match(/(\d+\.?\d*)\s*Nm/i);
    const forceMatch = JSON.stringify(specsObj).match(/(\d+\.?\d*)\s*N/i);

    if (forceMatch) {
      const forceN = parseFloat(forceMatch[1]);
      return {
        load_max_kn: forceN / 1000,
        load_min_kn: null,
        method: 'extracted',
        note: 'Force capacity extracted from specifications'
      };
    }

    if (torqueMatch) {
      const torqueNm = parseFloat(torqueMatch[1]);
      // Rough estimate: assume 0.1m moment arm
      const forceN = torqueNm / 0.1;
      return {
        load_max_kn: forceN / 1000,
        load_min_kn: null,
        method: 'estimated',
        note: 'Estimated from torque specification'
      };
    }
  }

  // Sensors, encoders - not applicable
  if (nameLower.includes('encoder') || nameLower.includes('sensor')) {
    return {
      load_max_kn: 0,
      load_min_kn: null,
      method: 'n/a',
      note: 'Load capacity not applicable for sensors/encoders'
    };
  }

  return null;
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
