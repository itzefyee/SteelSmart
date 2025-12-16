/**
 * Verify Products Table Schema
 * 
 * This script checks the products table structure to ensure compatibility
 * with the user_product_interactions foreign key constraint.
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySchema() {
  console.log('🔍 Verifying Products Table Schema');
  console.log('=====================================\n');

  try {
    // Query to check products table structure
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'products'
        ORDER BY ordinal_position;
      `
    });

    if (error) {
      // Fallback: Try direct query
      console.log('⚠️  RPC method not available, trying direct query...\n');
      
      const { data: products, error: queryError } = await supabase
        .from('products')
        .select('*')
        .limit(1);

      if (queryError) {
        throw queryError;
      }

      if (products && products.length > 0) {
        const sample = products[0];
        console.log('✓ Products table exists');
        console.log('\n📋 Sample Product:');
        console.log(JSON.stringify(sample, null, 2));
        
        console.log('\n🔑 ID Column Info:');
        console.log(`  Type: ${typeof sample.id}`);
        console.log(`  Value: ${sample.id}`);
        console.log(`  Length: ${sample.id?.length || 'N/A'}`);
        
        // Check if it looks like UUID or VARCHAR
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sample.id);
        console.log(`  Format: ${isUUID ? 'UUID' : 'VARCHAR/String'}`);
        
        if (!isUUID) {
          console.log('\n✅ ID column appears to be VARCHAR - compatible with migration');
        } else {
          console.log('\n⚠️  ID column appears to be UUID - migration may need adjustment');
        }
      }
    } else {
      console.log('✓ Products table schema:\n');
      console.table(data);
      
      const idColumn = data?.find((col: any) => col.column_name === 'id');
      if (idColumn) {
        console.log('\n🔑 ID Column Details:');
        console.log(`  Type: ${idColumn.data_type}`);
        console.log(`  Max Length: ${idColumn.character_maximum_length || 'N/A'}`);
        console.log(`  Nullable: ${idColumn.is_nullable}`);
        console.log(`  Default: ${idColumn.column_default || 'None'}`);
        
        if (idColumn.data_type === 'character varying') {
          console.log('\n✅ ID column is VARCHAR - compatible with migration');
        } else if (idColumn.data_type === 'uuid') {
          console.log('\n⚠️  ID column is UUID - migration needs adjustment');
          console.log('\n📝 To fix: Change product_id in migration from VARCHAR(255) to UUID');
        }
      }
    }

    // Check if user_product_interactions already exists
    console.log('\n\n🔍 Checking for existing user_product_interactions table...');
    const { data: interactions, error: intError } = await supabase
      .from('user_product_interactions')
      .select('id')
      .limit(1);

    if (intError) {
      if (intError.message.includes('does not exist')) {
        console.log('✓ Table does not exist yet - ready for migration');
      } else {
        console.log('⚠️  Error checking table:', intError.message);
      }
    } else {
      console.log('⚠️  Table already exists - migration may fail');
      console.log('   Consider dropping it first or using the v2 migration');
    }

  } catch (err: any) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

verifySchema();
