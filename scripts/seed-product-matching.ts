/**
 * Product Matching Seed Script
 *
 * Populates component taxonomy, material synonyms, and structured specs
 * using existing product catalog data.
 *
 * Usage:
 *   1. Ensure .env.local contains NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *   2. Run: npx tsx scripts/seed-product-matching.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ProductRecord {
  id: string;
  name: string;
  material: string | null;
  category: string;
  specifications: Record<string, any>;
}

interface StructuredSpecPayload {
  product_id: string;
  width_mm?: number | null;
  height_mm?: number | null;
  depth_mm?: number | null;
  diameter_mm?: number | null;
  thickness_mm?: number | null;
  length_mm?: number | null;
  load_min_kn?: number | null;
  load_max_kn?: number | null;
  weight_kg?: number | null;
  metadata?: Record<string, any> | null;
}

const FALLBACK_PRODUCTS_PATH = path.join(process.cwd(), 'src/data/products.json');

const MATERIAL_HINTS: Record<string, string> = {
  'servo': 'aluminum',
  'actuator': 'stainless',
  'beam': 'steel',
  'plate': 'steel',
  'frame': 'steel',
  'bolt': 'alloy steel',
  'nut': 'alloy steel',
  'washer': 'alloy steel'
};

async function seedTaxonomyAndSynonyms() {
  console.log('\n📚 Ensuring taxonomy and material synonym seed data exists...');
  const taxonomySeedPath = path.join(
    process.cwd(),
    'supabase',
    'seeds',
    '20250205000000_product_matching_seed.sql'
  );

  if (!fs.existsSync(taxonomySeedPath)) {
    console.log('   ⚠️ Seed SQL file not found, skipping direct SQL execution.');
    console.log('      Run supabase db push or apply the seed manually.');
    return;
  }

  console.log('   ✅ Seed SQL file detected. Apply it via Supabase CLI:');
  console.log('      supabase db remote commit --file supabase/seeds/20250205000000_product_matching_seed.sql');
}

async function fetchProducts(): Promise<ProductRecord[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, material, category, specifications')
    .limit(500);

  if (error) {
    console.error('❌ Failed to load products from Supabase:', error.message);
    console.log('   Attempting to fall back to src/data/products.json...');
    return readProductsFromJson();
  }

  if (!data || data.length === 0) {
    console.log('   ⚠️ No products found in Supabase, falling back to products.json');
    return readProductsFromJson();
  }

  return data as ProductRecord[];
}

function readProductsFromJson(): ProductRecord[] {
  if (!fs.existsSync(FALLBACK_PRODUCTS_PATH)) {
    console.error('❌ No product data available');
    process.exit(1);
  }

  const productsJson = fs.readFileSync(FALLBACK_PRODUCTS_PATH, 'utf-8');
  const productsData = JSON.parse(productsJson);
  const products = productsData.products || [];

  return products.map((product: any) => ({
    id: product.id,
    name: product.name,
    material: product.material,
    category: product.category,
    specifications: product.specifications ?? {}
  }));
}

function convertToMillimeters(value: number, unit?: string): number {
  if (!unit) return value;
  const normalized = unit.toLowerCase();
  if (normalized.startsWith('mm')) return value;
  if (normalized.startsWith('cm')) return value * 10;
  if (normalized.startsWith('m')) return value * 1000;
  if (normalized.includes('in') || normalized === '"' || normalized.includes('inch')) return value * 25.4;
  if (normalized.includes('ft')) return value * 304.8;
  return value;
}

function extractDimensionDetails(text?: string): Partial<StructuredSpecPayload> {
  if (!text || typeof text !== 'string') {
    return {};
  }

  const result: Partial<StructuredSpecPayload> = {};
  const fallback: number[] = [];

  const dimensionRegex = /(\d+(\.\d+)?)\s*(mm|millimeters?|cm|centimeters?|m|meters?|in|inch|["]|ft)/gi;
  const matches = text.matchAll(dimensionRegex);

  for (const match of matches) {
    const value = parseFloat(match[1] ?? '0');
    const unit = match[3];
    if (!value) continue;

    const absolute = convertToMillimeters(value, unit);
    const index = match.index ?? 0;
    const context = text.slice(Math.max(0, index - 20), Math.min(text.length, index + 20)).toLowerCase();

    if (context.includes('diameter') || context.includes('ø')) {
      result.diameter_mm = absolute;
    } else if (context.includes('thickness') || context.includes('flange')) {
      result.thickness_mm = absolute;
    } else if (context.includes('length')) {
      result.length_mm = absolute;
    } else if (context.includes('height')) {
      result.height_mm = absolute;
    } else if (context.includes('width')) {
      result.width_mm = absolute;
    } else if (context.includes('depth')) {
      result.depth_mm = absolute;
    } else {
      fallback.push(absolute);
    }
  }

  const sequentialAssignments: Array<keyof StructuredSpecPayload> = ['width_mm', 'height_mm', 'depth_mm'];
  fallback.slice(0, sequentialAssignments.length).forEach((value, idx) => {
    const key = sequentialAssignments[idx];
    if (result[key] == null) {
      (result as Record<string, number | undefined>)[key as string] = value;
    }
  });

  return result;
}

function convertLoadToKN(value: number, unit: string): number | null {
  const normalized = unit.toLowerCase();

  if (normalized.includes('kn')) {
    return value;
  }
  if (normalized === 'n' || normalized === 'newton' || normalized === 'newtons') {
    return value / 1000;
  }
  if (normalized.includes('kg')) {
    return (value * 9.80665) / 1000;
  }
  if (normalized.includes('ton')) {
    return value * 9.80665;
  }

  return null;
}

function extractLoadDetails(text?: string): { min?: number; max?: number } {
  if (!text || typeof text !== 'string') {
    return {};
  }

  const loadRegex = /(\d+(\.\d+)?)\s*(k?n|newton|newtons|kn|kg|ton|tons|mpa)/gi;
  const matches = text.matchAll(loadRegex);
  const loads: number[] = [];

  for (const match of matches) {
    const value = parseFloat(match[1] ?? '0');
    const unit = match[3] ?? '';
    if (!value) continue;

    const converted = convertLoadToKN(value, unit);
    if (converted) {
      loads.push(converted);
    }
  }

  if (!loads.length) {
    return {};
  }

  return {
    min: Math.min(...loads),
    max: Math.max(...loads)
  };
}

function extractWeight(text?: string): number | null {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const match = text.match(/(\d+(\.\d+)?)\s*(kg|kilograms?)/i);
  if (!match) {
    return null;
  }

  return parseFloat(match[1]);
}

function guessMaterialFamily(product: ProductRecord): string | undefined {
  if (product.material) {
    return product.material.toLowerCase();
  }

  const key = Object.keys(MATERIAL_HINTS).find(hint =>
    product.name.toLowerCase().includes(hint) ||
    product.category.toLowerCase().includes(hint)
  );

  return key ? MATERIAL_HINTS[key] : undefined;
}

function buildStructuredPayload(product: ProductRecord): StructuredSpecPayload {
  const specs = product.specifications || {};
  const dimensionDetails = extractDimensionDetails(specs.dimensions);
  const loadDetails = extractLoadDetails(specs.loadCapacity);
  const weight = extractWeight(specs.weight);

  return {
    product_id: product.id,
    ...dimensionDetails,
    load_min_kn: loadDetails.min ?? null,
    load_max_kn: loadDetails.max ?? null,
    weight_kg: weight ?? null,
    metadata: {
      tolerance: specs.tolerance,
      operatingTemp: specs.operatingTemp,
      materialHint: guessMaterialFamily(product)
    }
  };
}

async function seedProductSpecs() {
  console.log('\n📏 Seeding structured product specifications...');
  const products = await fetchProducts();

  if (!products.length) {
    console.error('❌ No products available to process.');
    process.exit(1);
  }

  const payload = products.map(buildStructuredPayload);
  const batchSize = 50;
  let success = 0;

  for (let i = 0; i < payload.length; i += batchSize) {
    const batch = payload.slice(i, i + batchSize);
    const { error } = await supabase
      .from('product_specs')
      .upsert(batch, { onConflict: 'product_id' });

    if (error) {
      console.error(`   ❌ Failed upserting batch ${i + 1}:`, error.message);
    } else {
      success += batch.length;
      console.log(`   ✅ Upserted ${success}/${payload.length} specs`);
    }
  }

  console.log(`   🎉 Structured specs ready for ${success} products`);
}

async function main() {
  await seedTaxonomyAndSynonyms();
  await seedProductSpecs();
  console.log('\nDone! Apply additional seeds for embeddings or drawing specs as needed.');
}

main().catch(error => {
  console.error('❌ Seed script failed:', error);
  process.exit(1);
});

