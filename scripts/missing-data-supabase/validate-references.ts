#!/usr/bin/env tsx
/**
 * Cross-Reference Validator
 * 
 * Validates data consistency across related tables.
 * This is Phase 5 of the Zero-Null enrichment strategy.
 * 
 * Checks:
 * 1. All product_specs.product_id exist in products.id
 * 2. All products.category exist in categories.id
 * 3. All products.component_type_id exist in component_taxonomy.id
 * 4. All products.material_family exist in material_synonyms.family
 * 
 * Usage:
 *   npx tsx scripts/missing-data-supabase/validate-references.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

console.log('🔗 Cross-Reference Validator');
console.log('===========================\n');

interface ValidationResult {
  check: string;
  passed: boolean;
  issues: string[];
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

  const results: ValidationResult[] = [];

  // Check 1: product_specs → products
  console.log('1️⃣  Validating product_specs.product_id references...');
  results.push(await validateProductSpecs(supabase));
  console.log('');

  // Check 2: products → categories
  console.log('2️⃣  Validating products.category references...');
  results.push(await validateCategories(supabase));
  console.log('');

  // Check 3: products → component_taxonomy
  console.log('3️⃣  Validating products.component_type_id references...');
  results.push(await validateComponentTypes(supabase));
  console.log('');

  // Check 4: products → material_synonyms
  console.log('4️⃣  Validating products.material_family references...');
  results.push(await validateMaterialFamilies(supabase));
  console.log('');

  // Summary
  console.log('📈 Validation Summary');
  console.log('====================');
  
  const totalChecks = results.length;
  const passedChecks = results.filter(r => r.passed).length;
  const failedChecks = totalChecks - passedChecks;

  console.log(`Total checks: ${totalChecks}`);
  console.log(`✓ Passed: ${passedChecks}`);
  console.log(`❌ Failed: ${failedChecks}`);
  console.log('');

  results.forEach((result, index) => {
    const icon = result.passed ? '✓' : '❌';
    console.log(`${icon} ${index + 1}. ${result.check}`);
    
    if (!result.passed && result.issues.length > 0) {
      result.issues.forEach(issue => {
        console.log(`     - ${issue}`);
      });
    }
  });

  if (failedChecks > 0) {
    console.log('\n⚠️  Some validation checks failed. Please review and fix the issues.');
    process.exit(1);
  } else {
    console.log('\n✅ All validation checks passed!');
  }
}

async function validateProductSpecs(supabase: any): Promise<ValidationResult> {
  const { data: specs } = await supabase
    .from('product_specs')
    .select('product_id');

  const { data: products } = await supabase
    .from('products')
    .select('id');

  const productIds = new Set(products?.map((p: any) => p.id) || []);
  const issues: string[] = [];

  specs?.forEach((spec: any) => {
    if (!productIds.has(spec.product_id)) {
      issues.push(`product_specs references non-existent product: ${spec.product_id}`);
    }
  });

  return {
    check: 'product_specs.product_id → products.id',
    passed: issues.length === 0,
    issues,
  };
}

async function validateCategories(supabase: any): Promise<ValidationResult> {
  const { data: products } = await supabase
    .from('products')
    .select('id, name, category');

  const { data: categories } = await supabase
    .from('categories')
    .select('id');

  const categoryIds = new Set(categories?.map((c: any) => c.id) || []);
  const issues: string[] = [];

  products?.forEach((product: any) => {
    if (product.category && !categoryIds.has(product.category)) {
      issues.push(`Product "${product.name}" has invalid category: ${product.category}`);
    }
  });

  return {
    check: 'products.category → categories.id',
    passed: issues.length === 0,
    issues,
  };
}

async function validateComponentTypes(supabase: any): Promise<ValidationResult> {
  const { data: products } = await supabase
    .from('products')
    .select('id, name, component_type_id');

  const { data: componentTypes } = await supabase
    .from('component_taxonomy')
    .select('id');

  const componentTypeIds = new Set(componentTypes?.map((c: any) => c.id) || []);
  const issues: string[] = [];

  products?.forEach((product: any) => {
    if (product.component_type_id && !componentTypeIds.has(product.component_type_id)) {
      issues.push(`Product "${product.name}" has invalid component_type_id: ${product.component_type_id}`);
    }
    if (!product.component_type_id) {
      issues.push(`Product "${product.name}" is missing component_type_id`);
    }
  });

  return {
    check: 'products.component_type_id → component_taxonomy.id',
    passed: issues.length === 0,
    issues,
  };
}

async function validateMaterialFamilies(supabase: any): Promise<ValidationResult> {
  const { data: products } = await supabase
    .from('products')
    .select('id, name, material_family');

  const { data: materialSynonyms } = await supabase
    .from('material_synonyms')
    .select('family');

  const materialFamilies = new Set(materialSynonyms?.map((m: any) => m.family) || []);
  const issues: string[] = [];

  products?.forEach((product: any) => {
    if (product.material_family && !materialFamilies.has(product.material_family)) {
      issues.push(`Product "${product.name}" has invalid material_family: ${product.material_family}`);
    }
    if (!product.material_family) {
      issues.push(`Product "${product.name}" is missing material_family`);
    }
  });

  return {
    check: 'products.material_family → material_synonyms.family',
    passed: issues.length === 0,
    issues,
  };
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
