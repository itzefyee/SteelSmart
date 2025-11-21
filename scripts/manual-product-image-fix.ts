/**
 * Manual Product Image Fix
 * 
 * This script manually maps specific products to their correct image folders
 * based on the product names you provided.
 * 
 * Run with: npx tsx scripts/manual-product-image-fix.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Manual mappings for products with missing images
 * Format: { "Product Name (as it appears in DB)": "folder-name-in-storage" }
 */
const manualMappings: Record<string, string> = {
  // Products you mentioned:
  'Universal Servo Motor Mount': 'universal-servo-140mm-steel',
  'Steel Channel 100x50x6mm': 'steel-angle-50mm-grade',  // Use steel angle as fallback
  'Steel Beam Connection Bracket': 'i-beam-steel-200mm-grade',  // Use i-beam as similar
  'Rotary Encoder 1024 PPR': 'rotary-encoder-58mm-aluminum',
  'Custom Aluminum Mounting Bracket': 'custom-aluminum-6061-t6',
};

/**
 * List all available folders in storage
 */
async function listAvailableFolders(): Promise<string[]> {
  const { data: folders, error } = await supabase.storage
    .from('product-images')
    .list('products', {
      limit: 100,
      sortBy: { column: 'name', order: 'asc' }
    });

  if (error) {
    console.error('❌ Error listing folders:', error);
    return [];
  }

  return folders
    .filter(f => f.name !== '.emptyFolderPlaceholder')
    .map(f => f.name);
}

/**
 * Get all products from database
 */
async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, images')
    .order('name');

  if (error) {
    console.error('❌ Error fetching products:', error);
    return [];
  }

  return data;
}

/**
 * Get all image URLs for a folder
 */
async function getImageUrls(folderName: string): Promise<string[]> {
  const { data: files, error } = await supabase.storage
    .from('product-images')
    .list(`products/${folderName}`, {
      limit: 100,
      sortBy: { column: 'name', order: 'asc' }
    });

  if (error || !files) return [];

  // Priority order
  const viewPriority: Record<string, number> = {
    'preview.png': 1000,
    'iso-front-top-right.png': 100,
    'iso-front-top-left.png': 95,
    'iso-front-bottom-right.png': 90,
    'iso-front-bottom-left.png': 85,
    'iso-back-top-right.png': 80,
    'iso-back-bottom-left.png': 75,
    'front.png': 50,
    'back.png': 45,
    'top.png': 40,
    'bottom.png': 35,
    'left.png': 30,
    'right.png': 25,
  };

  const sortedFiles = files
    .filter(file => file.name.endsWith('.png') || file.name.endsWith('.jpg'))
    .sort((a, b) => {
      const aPriority = viewPriority[a.name] || 0;
      const bPriority = viewPriority[b.name] || 0;
      return bPriority - aPriority;
    });

  return sortedFiles.map(file => {
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(`products/${folderName}/${file.name}`);
    return data.publicUrl;
  });
}

/**
 * Main execution
 */
async function main() {
  console.log('🔧 Manual Product Image Fix');
  console.log('='.repeat(80));
  console.log('');

  // List available folders
  console.log('📂 Available image folders in Supabase Storage:');
  const folders = await listAvailableFolders();
  folders.forEach((folder, idx) => {
    console.log(`   ${idx + 1}. ${folder}`);
  });
  console.log('');

  // Get all products
  console.log('📦 Fetching products from database...');
  const products = await getProducts();
  console.log(`   Found ${products.length} products`);
  console.log('');

  // Find and fix products
  console.log('🔍 Looking for products to fix...');
  console.log('='.repeat(80));

  let fixedCount = 0;
  let notFoundCount = 0;

  for (const product of products) {
    const hasImages = product.images && product.images.length > 0;

    // Check if this product needs fixing
    const folderName = manualMappings[product.name];
    
    if (folderName) {
      console.log(`\n📦 ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Currently has images: ${hasImages ? 'Yes' : 'No'}`);
      console.log(`   Mapping to folder: ${folderName}`);

      // Check if folder exists
      if (!folders.includes(folderName)) {
        console.log(`   ❌ Folder "${folderName}" not found in storage!`);
        console.log(`   💡 Available similar folders:`);
        const similar = folders.filter(f => 
          f.toLowerCase().includes(folderName.split('-')[0].toLowerCase()) ||
          folderName.toLowerCase().includes(f.split('-')[0].toLowerCase())
        );
        similar.forEach(f => console.log(`      - ${f}`));
        notFoundCount++;
        continue;
      }

      // Get images
      const imageUrls = await getImageUrls(folderName);
      
      if (imageUrls.length === 0) {
        console.log(`   ⚠️  No images found in folder "${folderName}"`);
        notFoundCount++;
        continue;
      }

      console.log(`   📸 Found ${imageUrls.length} images`);

      // Update product
      const { error } = await supabase
        .from('products')
        .update({ images: imageUrls })
        .eq('id', product.id);

      if (error) {
        console.log(`   ❌ Failed to update: ${error.message}`);
      } else {
        console.log(`   ✅ Updated successfully!`);
        fixedCount++;
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Fixed: ${fixedCount}`);
  console.log(`❌ Not found/failed: ${notFoundCount}`);
  console.log(`📋 Total in mapping: ${Object.keys(manualMappings).length}`);
  console.log('');

  if (notFoundCount > 0) {
    console.log('⚠️  Some products could not be fixed.');
    console.log('   Please check the folder names above and update the mapping.');
    console.log('   Available folders are listed at the top of this output.');
  }

  if (fixedCount > 0) {
    console.log('✨ Products updated! Visit /catalog to verify.');
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});




