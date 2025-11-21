/**
 * Auto-Match Products to Storage Folders
 * 
 * This script automatically matches product IDs to their Supabase Storage folders
 * and updates the product records with image URLs.
 * 
 * Run with: npx tsx scripts/auto-match-products.ts
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

interface Product {
  id: string;
  name: string;
  images: string[] | null;
}

interface StorageFolder {
  name: string;
  imageCount: number;
  previewUrl: string | null;
}

/**
 * Get all products from database
 */
async function getAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, images')
    .order('name');

  if (error) {
    console.error('❌ Error fetching products:', error);
    return [];
  }

  return data as Product[];
}

/**
 * Get all product folders from storage
 */
async function getAllStorageFolders(): Promise<StorageFolder[]> {
  const { data: folders, error } = await supabase.storage
    .from('product-images')
    .list('products', {
      limit: 100,
      sortBy: { column: 'name', order: 'asc' }
    });

  if (error) {
    console.error('❌ Error listing storage folders:', error);
    return [];
  }

  const storageFolders: StorageFolder[] = [];

  for (const folder of folders) {
    if (folder.name === '.emptyFolderPlaceholder') continue;

    // Count images in this folder
    const { data: files } = await supabase.storage
      .from('product-images')
      .list(`products/${folder.name}`);

    const imageFiles = files?.filter(f => 
      f.name.endsWith('.png') || f.name.endsWith('.jpg')
    ) || [];

    // Get preview image URL if it exists
    let previewUrl: string | null = null;
    const previewFile = imageFiles.find(f => f.name === 'preview.png');
    if (previewFile) {
      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(`products/${folder.name}/preview.png`);
      previewUrl = data.publicUrl;
    }

    storageFolders.push({
      name: folder.name,
      imageCount: imageFiles.length,
      previewUrl
    });
  }

  return storageFolders;
}

/**
 * Calculate similarity between two strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Check for direct substring matches
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;

  // Count matching words
  const words1 = str1.toLowerCase().split(/[\s-_]+/);
  const words2 = str2.toLowerCase().split(/[\s-_]+/);
  
  let matchCount = 0;
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2 && word1.length > 2) {
        matchCount++;
      }
    }
  }

  return matchCount / Math.max(words1.length, words2.length);
}

/**
 * Find best matching folder for a product
 */
function findBestMatch(product: Product, folders: StorageFolder[]): StorageFolder | null {
  let bestMatch: StorageFolder | null = null;
  let bestScore = 0;

  for (const folder of folders) {
    const score = calculateSimilarity(product.name, folder.name);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = folder;
    }
  }

  // Only return if confidence is high enough
  return bestScore > 0.3 ? bestMatch : null;
}

/**
 * Get all image URLs for a product folder
 */
async function getProductImageUrls(folderName: string): Promise<string[]> {
  const { data: files, error } = await supabase.storage
    .from('product-images')
    .list(`products/${folderName}`, {
      limit: 100,
      sortBy: { column: 'name', order: 'asc' }
    });

  if (error || !files) return [];

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
  console.log('🔄 Auto-Matching Products to Storage Folders');
  console.log('='.repeat(80));
  console.log('');

  // Fetch data
  console.log('📦 Fetching products from database...');
  const products = await getAllProducts();
  console.log(`   Found ${products.length} products`);

  console.log('📂 Fetching folders from storage...');
  const folders = await getAllStorageFolders();
  console.log(`   Found ${folders.length} folders with images`);
  console.log('');

  // Match and update
  console.log('🔍 Matching products to folders...');
  console.log('='.repeat(80));

  let successCount = 0;
  let skipCount = 0;
  const matches: Array<{ product: string; folder: string; confidence: string }> = [];

  for (const product of products) {
    const hasImages = product.images && product.images.length > 0;
    
    console.log(`\n📦 ${product.name} (${product.id})`);
    
    if (hasImages) {
      console.log(`   ✅ Already has ${product.images!.length} images - skipping`);
      skipCount++;
      continue;
    }

    const match = findBestMatch(product, folders);

    if (match) {
      const similarity = calculateSimilarity(product.name, match.name);
      const confidence = similarity > 0.7 ? 'HIGH' : similarity > 0.5 ? 'MEDIUM' : 'LOW';
      
      console.log(`   🎯 Best match: ${match.name} (${confidence} confidence)`);
      console.log(`   📸 ${match.imageCount} images available`);

      // Get and update images
      const imageUrls = await getProductImageUrls(match.name);
      
      if (imageUrls.length > 0) {
        const { error } = await supabase
          .from('products')
          .update({ images: imageUrls })
          .eq('id', product.id);

        if (!error) {
          console.log(`   ✅ Updated with ${imageUrls.length} images`);
          successCount++;
          matches.push({
            product: `${product.name} (${product.id})`,
            folder: match.name,
            confidence
          });
        } else {
          console.log(`   ❌ Update failed: ${error.message}`);
        }
      }
    } else {
      console.log(`   ⚠️  No good match found`);
      skipCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Updated: ${successCount}`);
  console.log(`⏭️  Skipped: ${skipCount}`);
  console.log(`📦 Total: ${products.length}`);
  console.log('');

  if (matches.length > 0) {
    console.log('🎯 Matches made:');
    for (const match of matches) {
      console.log(`   ${match.product}`);
      console.log(`      → ${match.folder} [${match.confidence}]`);
    }
  }

  console.log('');
  console.log('✨ Done! Visit /catalog to see the results.');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});





