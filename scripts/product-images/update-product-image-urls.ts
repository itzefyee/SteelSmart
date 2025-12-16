/**
 * Update Product Image URLs in Supabase
 * 
 * This script updates the product records in Supabase with the correct image URLs
 * from the Supabase Storage bucket after images have been uploaded.
 * 
 * Run with: npx tsx scripts/update-product-image-urls.ts
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
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Mapping of product IDs to their STEP file names in products-models
// Based on actual Supabase Storage folder names
const productImageMapping: Record<string, string> = {
  // Robotic Components
  'servo-motor-001': 'high-torque-servo-120mm-aluminum',
  'servo-motor-002': 'heavy-duty-servo-150mm-cast',
  'servo-motor-003': 'compact-servo-90mm-aluminum',
  'linear-actuator-001': 'electric-linear-300mm-ss',
  'rotary-encoder-001': 'rotary-encoder-58mm-aluminum',
  
  // Structural Components
  'steel-beam-001': 'i-beam-steel-200mm-grade',
  'steel-beam-002': 'steel-beam-001',  // FIXED: actual folder name
  'steel-plate-001': 'steel-plate-2000mm-grade',
  'steel-angle-001': 'steel-angle-50mm-grade',
  
  // Fasteners
  'hex-bolt-m12': 'hex-bolt-12mm-alloy',
  'hex-nut-m12': 'hex-nut-12mm-alloy',
  'washer-m12': 'flat-washer-12mm-stainless',
  'socket-head-m8': 'socket-head-8mm-alloy',
  
  // Custom Components
  'mounting-bracket-001': 'universal-servo-140mm-steel',  // FIXED: based on available folders
  'custom-bracket-001': 'e0fe2ad1-2419-4b34-9277-e3346b119b57',  // FIXED: custom model ID
  'coupling-002': 'universal-servo-140mm-steel',  // FIXED: using available servo
  'encoder-001': 'rotary-encoder-58mm-aluminum',  // FIXED: reuse rotary encoder
  'pressure-sensor-001': 'industrial-pressure-50mm-ss',
  'position-sensor-001': 'industrial-pressure-50mm-ss',  // FIXED: reuse pressure sensor
  'flexible-coupling-001': 'flexible-shaft-30mm-aluminum',
  
  // Additional products
  'custom-aluminum-part': 'custom-aluminum-6061-t6',
};

/**
 * Get all image URLs for a product from Supabase Storage
 */
async function getProductImageUrls(productFolderName: string): Promise<string[]> {
  try {
    const { data: files, error } = await supabase.storage
      .from('product-images')
      .list(`products/${productFolderName}`, {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error(`  ❌ Error listing files for ${productFolderName}:`, error.message);
      return [];
    }

    if (!files || files.length === 0) {
      console.log(`  ⚠️  No images found for ${productFolderName}`);
      return [];
    }

    // Priority order for images (preview first, then perspective views, then orthographic)
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

    // Sort files by priority
    const sortedFiles = files
      .filter(file => file.name.endsWith('.png') || file.name.endsWith('.jpg'))
      .sort((a, b) => {
        const aPriority = viewPriority[a.name] || 0;
        const bPriority = viewPriority[b.name] || 0;
        return bPriority - aPriority;
      });

    // Get public URLs for all images
    const imageUrls = sortedFiles.map(file => {
      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(`products/${productFolderName}/${file.name}`);
      return data.publicUrl;
    });

    return imageUrls;
  } catch (error) {
    console.error(`  ❌ Error getting images for ${productFolderName}:`, error);
    return [];
  }
}

/**
 * Update a single product with new image URLs
 */
async function updateProductImages(productId: string, folderName: string): Promise<boolean> {
  try {
    // Get image URLs from storage
    const imageUrls = await getProductImageUrls(folderName);

    if (imageUrls.length === 0) {
      console.log(`  ⏭️  Skipping ${productId} - no images found`);
      return false;
    }

    // Update the product record
    const { error } = await supabase
      .from('products')
      .update({ images: imageUrls })
      .eq('id', productId);

    if (error) {
      console.error(`  ❌ Error updating ${productId}:`, error.message);
      return false;
    }

    console.log(`  ✅ Updated ${productId} with ${imageUrls.length} images`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error updating ${productId}:`, error);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔄 Product Image URLs Update Script');
  console.log('='.repeat(80));
  console.log('');

  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  console.log(`📦 Processing ${Object.keys(productImageMapping).length} products...`);
  console.log('');

  for (const [productId, folderName] of Object.entries(productImageMapping)) {
    console.log(`\n🔍 Processing: ${productId} → ${folderName}`);
    
    const success = await updateProductImages(productId, folderName);
    
    if (success) {
      successCount++;
    } else {
      const imageUrls = await getProductImageUrls(folderName);
      if (imageUrls.length === 0) {
        skipCount++;
      } else {
        failCount++;
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 UPDATE SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Successfully updated: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`⏭️  Skipped (no images): ${skipCount}`);
  console.log(`📦 Total processed: ${Object.keys(productImageMapping).length}`);
  console.log('');

  if (successCount > 0) {
    console.log('✨ Product images updated successfully!');
    console.log('🌐 Visit /catalog to see the updated images');
  }

  if (skipCount > 0) {
    console.log('\n⚠️  Some products have no images yet.');
    console.log('   Run the image generation script first:');
    console.log('   1. Generate images using CAD Analyzer or Blender');
    console.log('   2. Upload with: npm run upload-product-images');
    console.log('   3. Re-run this script');
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

