#!/usr/bin/env tsx
/**
 * Product Data Audit Script
 * 
 * Analyzes the completeness of product data in Supabase
 * and generates a report showing what data is missing.
 * 
 * Usage:
 *   npx tsx scripts/audit-product-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface AuditStats {
  total: number;
  withSpecs: number;
  withoutSpecs: number;
  withMaterialFamily: number;
  withoutMaterialFamily: number;
  withComponentType: number;
  withoutComponentType: number;
  withDimensions: number;
  withoutDimensions: number;
  withLoadCapacity: number;
  withoutLoadCapacity: number;
  completeness: {
    complete: number;      // 80-100%
    mostlyComplete: number; // 60-79%
    partial: number;        // 40-59%
    minimal: number;        // 20-39%
    empty: number;          // 0-19%
  };
}

async function main() {
  console.log('📊 Product Data Audit');
  console.log('====================\n');

  // Validate environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  // Initialize Supabase client
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
      material,
      material_family,
      component_type_id,
      specifications,
      description,
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

  if (!products || products.length === 0) {
    console.log('⚠️  No products found in database');
    return;
  }

  console.log(`Analyzing ${products.length} products...\n`);

  // Calculate statistics
  const stats: AuditStats = {
    total: products.length,
    withSpecs: 0,
    withoutSpecs: 0,
    withMaterialFamily: 0,
    withoutMaterialFamily: 0,
    withComponentType: 0,
    withoutComponentType: 0,
    withDimensions: 0,
    withoutDimensions: 0,
    withLoadCapacity: 0,
    withoutLoadCapacity: 0,
    completeness: {
      complete: 0,
      mostlyComplete: 0,
      partial: 0,
      minimal: 0,
      empty: 0,
    },
  };

  const incompleteProducts: Array<{
    name: string;
    completeness: number;
    missing: string[];
  }> = [];

  products.forEach((product: any) => {
    const specs = product.product_specs;
    let completenessScore = 0;
    let totalFields = 7;
    const missing: string[] = [];

    // Check product_specs
    if (specs) {
      stats.withSpecs++;
      
      const hasDimensions = !!(
        specs.width_mm || specs.height_mm || specs.depth_mm ||
        specs.diameter_mm || specs.length_mm || specs.thickness_mm
      );
      
      const hasLoad = !!(specs.load_max_kn || specs.load_min_kn);
      
      if (hasDimensions) {
        stats.withDimensions++;
        completenessScore++;
      } else {
        missing.push('dimensions');
      }
      
      if (hasLoad) {
        stats.withLoadCapacity++;
        completenessScore++;
      } else {
        missing.push('load capacity');
      }
    } else {
      stats.withoutSpecs++;
      missing.push('product_specs table entry');
    }

    // Check material_family
    if (product.material_family) {
      stats.withMaterialFamily++;
      completenessScore++;
    } else {
      stats.withoutMaterialFamily++;
      missing.push('material_family');
    }

    // Check component_type_id
    if (product.component_type_id) {
      stats.withComponentType++;
      completenessScore++;
    } else {
      stats.withoutComponentType++;
      missing.push('component_type_id');
    }

    // Check basic fields
    if (product.material) completenessScore++;
    else missing.push('material');
    
    if (product.specifications) completenessScore++;
    else missing.push('specifications');
    
    if (product.description) completenessScore++;
    else missing.push('description');

    // Calculate completeness percentage
    const completenessPercent = (completenessScore / totalFields) * 100;

    if (completenessPercent >= 80) {
      stats.completeness.complete++;
    } else if (completenessPercent >= 60) {
      stats.completeness.mostlyComplete++;
    } else if (completenessPercent >= 40) {
      stats.completeness.partial++;
    } else if (completenessPercent >= 20) {
      stats.completeness.minimal++;
    } else {
      stats.completeness.empty++;
    }

    // Track incomplete products
    if (completenessPercent < 80) {
      incompleteProducts.push({
        name: product.name,
        completeness: completenessPercent,
        missing,
      });
    }
  });

  // Display results
  console.log('📈 Overall Statistics');
  console.log('====================');
  console.log(`Total Products: ${stats.total}`);
  console.log('');

  console.log('Structured Specs (product_specs table):');
  console.log(`  ✓ With specs: ${stats.withSpecs} (${percent(stats.withSpecs, stats.total)}%)`);
  console.log(`  ✗ Without specs: ${stats.withoutSpecs} (${percent(stats.withoutSpecs, stats.total)}%)`);
  console.log('');

  console.log('Dimensions:');
  console.log(`  ✓ With dimensions: ${stats.withDimensions} (${percent(stats.withDimensions, stats.total)}%)`);
  console.log(`  ✗ Without dimensions: ${stats.withoutDimensions} (${percent(stats.withoutDimensions, stats.total)}%)`);
  console.log('');

  console.log('Load Capacity:');
  console.log(`  ✓ With load data: ${stats.withLoadCapacity} (${percent(stats.withLoadCapacity, stats.total)}%)`);
  console.log(`  ✗ Without load data: ${stats.withoutLoadCapacity} (${percent(stats.withoutLoadCapacity, stats.total)}%)`);
  console.log('');

  console.log('Material Family:');
  console.log(`  ✓ With material_family: ${stats.withMaterialFamily} (${percent(stats.withMaterialFamily, stats.total)}%)`);
  console.log(`  ✗ Without material_family: ${stats.withoutMaterialFamily} (${percent(stats.withoutMaterialFamily, stats.total)}%)`);
  console.log('');

  console.log('Component Type:');
  console.log(`  ✓ With component_type_id: ${stats.withComponentType} (${percent(stats.withComponentType, stats.total)}%)`);
  console.log(`  ✗ Without component_type_id: ${stats.withoutComponentType} (${percent(stats.withoutComponentType, stats.total)}%)`);
  console.log('');

  console.log('📊 Data Completeness Distribution');
  console.log('=================================');
  console.log(`🟢 Complete (80-100%):       ${stats.completeness.complete} (${percent(stats.completeness.complete, stats.total)}%)`);
  console.log(`🟡 Mostly Complete (60-79%): ${stats.completeness.mostlyComplete} (${percent(stats.completeness.mostlyComplete, stats.total)}%)`);
  console.log(`🟠 Partial (40-59%):         ${stats.completeness.partial} (${percent(stats.completeness.partial, stats.total)}%)`);
  console.log(`🔴 Minimal (20-39%):         ${stats.completeness.minimal} (${percent(stats.completeness.minimal, stats.total)}%)`);
  console.log(`⚫ Empty (0-19%):            ${stats.completeness.empty} (${percent(stats.completeness.empty, stats.total)}%)`);
  console.log('');

  // Show top 10 incomplete products
  if (incompleteProducts.length > 0) {
    console.log('🔍 Top 10 Products Needing Enrichment');
    console.log('=====================================');
    
    incompleteProducts
      .sort((a, b) => a.completeness - b.completeness)
      .slice(0, 10)
      .forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   Completeness: ${product.completeness.toFixed(0)}%`);
        console.log(`   Missing: ${product.missing.join(', ')}`);
        console.log('');
      });
  }

  // Recommendations
  console.log('💡 Recommendations');
  console.log('==================');
  
  if (stats.withoutSpecs > 0) {
    console.log(`• Run enrichment script to fill ${stats.withoutSpecs} products without specs`);
    console.log('  Command: npx tsx scripts/enrich-product-data.ts --limit=50');
  }
  
  if (stats.withoutMaterialFamily > 0) {
    console.log(`• ${stats.withoutMaterialFamily} products missing material_family`);
  }
  
  if (stats.withoutComponentType > 0) {
    console.log(`• ${stats.withoutComponentType} products missing component_type_id`);
  }

  const overallCompleteness = (
    (stats.completeness.complete * 100 +
     stats.completeness.mostlyComplete * 80 +
     stats.completeness.partial * 50 +
     stats.completeness.minimal * 30 +
     stats.completeness.empty * 10) / stats.total
  );

  console.log('');
  console.log(`📊 Overall Data Quality Score: ${overallCompleteness.toFixed(1)}%`);
  
  if (overallCompleteness < 60) {
    console.log('   Status: ⚠️  Needs Improvement');
  } else if (overallCompleteness < 80) {
    console.log('   Status: 🟡 Fair');
  } else {
    console.log('   Status: ✅ Good');
  }
}

function percent(value: number, total: number): string {
  return ((value / total) * 100).toFixed(1);
}

// Run the script
main().catch(error => {
  console.error('');
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
