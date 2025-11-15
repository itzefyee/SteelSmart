/**
 * Product Migration Script
 *
 * This script migrates product data from the static JSON file to Supabase database.
 *
 * Usage:
 *   1. Ensure .env.local has SUPABASE credentials
 *   2. Run: npx tsx scripts/migrate-products.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateProducts() {
  console.log('🚀 Starting product migration...\n');

  try {
    // Read products from JSON file
    const productsFilePath = path.join(process.cwd(), 'src/data/products.json');
    const productsJson = fs.readFileSync(productsFilePath, 'utf-8');
    const productsData = JSON.parse(productsJson);

    if (!productsData.products || !Array.isArray(productsData.products)) {
      throw new Error('Invalid products.json format');
    }

    const products = productsData.products;
    console.log(`📦 Found ${products.length} products to migrate\n`);

    // Check if products already exist
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (count && count > 0) {
      console.log(`⚠️  Warning: ${count} products already exist in database`);
      console.log('   This will INSERT new products (duplicates may occur if IDs conflict)');
      console.log('   To replace existing data, delete all products first.\n');
    }

    // Migrate products in batches
    const batchSize = 10;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);

      console.log(`Migrating products ${i + 1} to ${Math.min(i + batchSize, products.length)}...`);

      const { data, error } = await supabase
        .from('products')
        .insert(batch)
        .select();

      if (error) {
        console.error(`   ❌ Error: ${error.message}`);
        errorCount += batch.length;
      } else {
        console.log(`   ✅ Successfully migrated ${batch.length} products`);
        successCount += batch.length;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Success: ${successCount} products`);
    console.log(`   ❌ Failed: ${errorCount} products`);

    if (successCount > 0) {
      console.log('\n✨ Product migration completed successfully!');
      console.log('   You can now query products from the Supabase database.\n');
    } else {
      console.log('\n⚠️  No products were migrated. Check errors above.\n');
      process.exit(1);
    }

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Verify database connection
async function verifyConnection() {
  console.log('🔍 Verifying Supabase connection...');

  const { data, error } = await supabase
    .from('products')
    .select('id')
    .limit(1);

  if (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('   Make sure you have run the schema migration first!');
    process.exit(1);
  }

  console.log('✅ Connected to Supabase\n');
}

// Main execution
async function main() {
  await verifyConnection();
  await migrateProducts();
}

main();
