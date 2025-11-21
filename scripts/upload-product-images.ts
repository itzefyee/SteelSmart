/**
 * Upload Product Images to Supabase
 * 
 * This script uploads all product images from public/products-images to Supabase storage
 * - Prioritizes perspective (iso) views over orthographic views
 * - Selects the best perspective view as preview image
 * - Maintains organized folder structure in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET_NAME = 'product-images';
const PRODUCTS_IMAGES_DIR = path.join(process.cwd(), 'public', 'product-images');

// View priority (higher = better for preview)
const VIEW_PRIORITY: Record<string, number> = {
  // Perspective views (best for preview)
  'preview': 1000,
  'iso-front-top-right': 100,  // Best angle - shows most features
  'iso-front-top-left': 95,
  'iso-front-bottom-right': 90,
  'iso-front-bottom-left': 85,
  'iso-back-top-right': 80,
  'iso-back-top-left': 75,
  'iso-back-bottom-right': 70,
  'iso-back-bottom-left': 65,
  
  // Orthographic views (less interesting for preview)
  'front': 50,
  'back': 45,
  'top': 40,
  'bottom': 35,
  'left': 30,
  'right': 25,
};

interface ImageFile {
  productId: string;
  fileName: string;
  filePath: string;
  viewType: string;
  isPerspective: boolean;
  priority: number;
}

/**
 * Get view type from filename
 */
function getViewType(fileName: string): string {
  const legacyMatch = fileName.match(/(?:_wit_)?(.+?)_view\.(png|jpg|jpeg)$/i);
  if (legacyMatch) {
    return legacyMatch[1].replace(/_/g, '-');
  }

  return path.parse(fileName).name;
}

/**
 * Check if view is perspective (iso) or orthographic
 */
function isPerspectiveView(viewType: string): boolean {
  return viewType.startsWith('iso-');
}

/**
 * Get priority score for view
 */
function getViewPriority(viewType: string): number {
  return VIEW_PRIORITY[viewType] || 0;
}

/**
 * Scan all product image folders
 */
async function scanProductImages(): Promise<Map<string, ImageFile[]>> {
  const productImages = new Map<string, ImageFile[]>();

  try {
    const productFolders = await readdir(PRODUCTS_IMAGES_DIR);

    for (const folder of productFolders) {
      const folderPath = path.join(PRODUCTS_IMAGES_DIR, folder);
      const folderStat = await stat(folderPath);

      if (!folderStat.isDirectory()) continue;

      const files = await readdir(folderPath);
      const imageFiles: ImageFile[] = [];

      for (const file of files) {
        if (!file.match(/\.(png|jpg|jpeg)$/i)) continue;

        const filePath = path.join(folderPath, file);
        const viewType = getViewType(file);
        const isPerspective = isPerspectiveView(viewType);
        const priority = getViewPriority(viewType);

        imageFiles.push({
          productId: folder,
          fileName: file,
          filePath,
          viewType,
          isPerspective,
          priority,
        });
      }

      if (imageFiles.length > 0) {
        // Sort by priority (perspective views first, then by priority score)
        imageFiles.sort((a, b) => {
          if (a.isPerspective !== b.isPerspective) {
            return a.isPerspective ? -1 : 1; // Perspective first
          }
          return b.priority - a.priority; // Higher priority first
        });

        productImages.set(folder, imageFiles);
      }
    }

    return productImages;
  } catch (error) {
    console.error('Error scanning product images:', error);
    throw error;
  }
}

/**
 * Ensure bucket exists
 */
async function ensureBucketExists(): Promise<void> {
  console.log(`\n📦 Checking if bucket "${BUCKET_NAME}" exists...`);

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('❌ Error listing buckets:', listError);
    throw listError;
  }

  const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

  if (!bucketExists) {
    console.log(`📦 Creating bucket "${BUCKET_NAME}"...`);
    
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg'],
    });

    if (createError) {
      console.error('❌ Error creating bucket:', createError);
      throw createError;
    }

    console.log('✅ Bucket created successfully');
  } else {
    console.log('✅ Bucket already exists');
  }
}

/**
 * Upload a single image file
 */
async function uploadImage(image: ImageFile): Promise<string | null> {
  try {
    const fileBuffer = await readFile(image.filePath);
    const storagePath = `products/${image.productId}/${image.fileName}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType: image.fileName.endsWith('.png') ? 'image/png' : 'image/jpeg',
        upsert: true, // Overwrite if exists
      });

    if (error) {
      console.error(`  ❌ Failed to upload ${image.fileName}:`, error.message);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error(`  ❌ Error uploading ${image.fileName}:`, error);
    return null;
  }
}

/**
 * Upload all images for all products
 */
async function uploadAllImages(): Promise<void> {
  console.log('\n🔍 Scanning product images...');
  const productImages = await scanProductImages();

  console.log(`\n📊 Found ${productImages.size} products with images`);

  const results: Array<{
    productId: string;
    previewImage: string | null;
    perspectiveImages: string[];
    orthographicImages: string[];
    totalImages: number;
  }> = [];

  for (const [productId, images] of productImages.entries()) {
    console.log(`\n📸 Uploading images for: ${productId}`);
    console.log(`   Total images: ${images.length}`);

    const perspectiveImages: string[] = [];
    const orthographicImages: string[] = [];
    let previewImage: string | null = null;

    // Upload all images
    for (const image of images) {
      const viewLabel = image.isPerspective ? '🎨 Perspective' : '📐 Orthographic';
      process.stdout.write(`   ${viewLabel} - ${image.viewType}... `);

      const url = await uploadImage(image);

      if (url) {
        console.log('✅');

      if (image.fileName === 'preview.png') {
        previewImage = url;
        console.log('   ⭐ Found explicit preview image');
      } else if (image.isPerspective) {
          perspectiveImages.push(url);
          // First perspective image is the preview
        if (!previewImage) {
            previewImage = url;
            console.log(`   ⭐ Set as preview image`);
          }
        } else {
          orthographicImages.push(url);
        }
      }
    }

    results.push({
      productId,
      previewImage,
      perspectiveImages,
      orthographicImages,
      totalImages: perspectiveImages.length + orthographicImages.length,
    });

    console.log(`   ✅ Uploaded ${perspectiveImages.length} perspective + ${orthographicImages.length} orthographic views`);
  }

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 UPLOAD SUMMARY');
  console.log('='.repeat(80));

  for (const result of results) {
    console.log(`\n${result.productId}:`);
    console.log(`  Total Images: ${result.totalImages}`);
    console.log(`  Perspective: ${result.perspectiveImages.length}`);
    console.log(`  Orthographic: ${result.orthographicImages.length}`);
    console.log(`  Preview: ${result.previewImage ? '✅' : '❌'}`);
  }

  // Save results to JSON file
  const outputPath = path.join(process.cwd(), 'product-images-upload-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${outputPath}`);

  console.log('\n✅ All images uploaded successfully!');
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Product Images Upload Script');
  console.log('='.repeat(80));

  try {
    // Step 1: Ensure bucket exists
    await ensureBucketExists();

    // Step 2: Upload all images
    await uploadAllImages();

    console.log('\n🎉 Upload complete!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Upload failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
