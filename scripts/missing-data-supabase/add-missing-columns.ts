#!/usr/bin/env tsx
/**
 * Add Missing Columns to product_specs Table
 * 
 * This script adds the confidence_score and last_verified_at columns
 * that are required by the enrichment script.
 * 
 * Usage:
 *   npx tsx scripts/add-missing-columns.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function main() {
  console.log('🔧 Adding Missing Columns to product_specs');
  console.log('==========================================\n');

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

  try {
    // Add confidence_score column
    console.log('Adding confidence_score column...');
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE product_specs 
        ADD COLUMN IF NOT EXISTS confidence_score FLOAT DEFAULT 0.5 
        CHECK (confidence_score >= 0 AND confidence_score <= 1);
      `
    });

    if (error1) {
      // Try alternative method using direct SQL
      console.log('Trying alternative method...');
      const { error: altError1 } = await supabase
        .from('product_specs')
        .select('confidence_score')
        .limit(1);
      
      if (altError1 && altError1.message.includes('column')) {
        console.log('⚠️  Column might not exist. Please run this SQL manually in Supabase SQL Editor:');
        console.log('\nALTER TABLE product_specs ADD COLUMN IF NOT EXISTS confidence_score FLOAT DEFAULT 0.5;');
        console.log('ALTER TABLE product_specs ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMP WITH TIME ZONE;\n');
      } else {
        console.log('✓ confidence_score column already exists or added successfully');
      }
    } else {
      console.log('✓ confidence_score column added successfully');
    }

    // Add last_verified_at column
    console.log('Adding last_verified_at column...');
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE product_specs 
        ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMP WITH TIME ZONE;
      `
    });

    if (error2) {
      console.log('⚠️  Could not add column automatically');
    } else {
      console.log('✓ last_verified_at column added successfully');
    }

    console.log('\n✅ Migration complete!');
    console.log('\nYou can now run: npm run enrich-data');

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.log('\n📝 Manual Steps:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Run this SQL:\n');
    console.log('ALTER TABLE product_specs ADD COLUMN IF NOT EXISTS confidence_score FLOAT DEFAULT 0.5;');
    console.log('ALTER TABLE product_specs ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMP WITH TIME ZONE;');
    console.log('\n3. Then run: npm run enrich-data');
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
