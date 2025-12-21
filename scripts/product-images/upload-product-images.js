/**
 * Upload Product Images to Supabase
 * 
 * Run with: node scripts/upload-product-images.js
 * 
 * This script uploads all product images from public/products-images to Supabase storage
 * - Prioritizes perspective (iso) views over orthographic views
 * - Selects the best perspective view as preview image
 * - Uses structure: product-images/products/{product-id}/preview.png
 * - Uploads all views with descriptive names
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET_NAME = 'product-images';
const PRODUCTS_IMAGES_DIR = path.join(__dirname, '..', 'public', 'products-images');

// View priority (higher = better for preview)
const VIEW_PRIORITY = {
  // Perspective views (best for preview)
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

/**
 * Get view type from filename
 */
function getViewType(fileName) {
  const match = fileName.match(/_([^_]+)_view\.(png|jpg|jpeg)$/i);
  return match ? match[1] : 'unknown';
}

/**
 * Check if view is perspective (iso) or orthographic
 */
function isPerspectiveView(viewType) {
  return viewType.startsWith('iso-');
}

/**
 * Get priority score for view
 */
function getViewPriority(viewType) {
  return VIEW_PRIORITY[viewType] || 0;
}

/**
 * Scan all product image folders
 */
async function scanProductImages() {
  const productImages = new Map();

  try {
    const productFolders = await fs.readdir(PRODUCTS_IMAGES_DIR);

    for (const folder of productFolders) {
      const folderPath = path.join(PRODUCTS_IMAGES_DIR, folder);
      const folderStat = await fs.stat(folderPath);

      if (!folderStat.isDirectory()) continue;

      const files = await fs.readdir(folderPath);
      const imageFiles = [];

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
async function ensureBucketExists() {
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
 * Upload a single image file with new naming structure
 */
async function uploadImage(image, isPreview = false) {
  try {
    const fileBuffer = await fs.readFile(image.filePath);
    
    // New structure: products/{product-id}/{filename}
    // Preview image: products/{product-id}/preview.png
    // Other images: products/{product-id}/{view-type}.png
    let fileName;
    if (isPreview) {
      fileName = 'preview.png';
    } else {
      // Use view type as filename (e.g., "iso-front-top-left.png", "front.png")
      const ext = image.fileName.endsWith('.png') ? 'png' : 'jpg';
      fileName = `${image.viewType}.${ext}`;
    }
    
    const storagePath = `products/${image.productId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType: image.fileName.endsWith('.png') ? 'image/png' : 'image/jpeg',
        upsert: true, // Overwrite if exists
      });

    if (error) {
      console.error(`  ❌ Failed to upload ${fileName}:`, error.message);
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
async function uploadAllImages() {
  console.log('\n🔍 Scanning product images...');
  const productImages = await scanProductImages();

  console.log(`\n📊 Found ${productImages.size} products with images`);

  const results = [];

  for (const [productId, images] of productImages.entries()) {
    console.log(`\n📸 Uploading images for: ${productId}`);
    console.log(`   Total images: ${images.length}`);

    const perspectiveImages = [];
    const orthographicImages = [];
    let previewImage = null;

    // Upload all images
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const isPreview = (i === 0); // First image (highest priority) is preview
      const viewLabel = image.isPerspective ? '🎨 Perspective' : '📐 Orthographic';
      
      if (isPreview) {
        process.stdout.write(`   ${viewLabel} - ${image.viewType} (PREVIEW)... `);
      } else {
        process.stdout.write(`   ${viewLabel} - ${image.viewType}... `);
      }

      const url = await uploadImage(image, isPreview);

      if (url) {
        console.log('✅');

        if (isPreview) {
          previewImage = url;
          console.log(`   ⭐ Preview: products/${image.productId}/preview.png`);
        }

        if (image.isPerspective) {
          perspectiveImages.push(url);
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
  const outputPath = path.join(__dirname, '..', 'product-images-upload-results.json');
  fsSync.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${outputPath}`);

  console.log('\n✅ All images uploaded successfully!');
  
  return results;
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
    const results = await uploadAllImages();

    console.log('\n🎉 Upload complete!');
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Check product-images-upload-results.json for all URLs`);
    console.log(`   2. Update your database with the preview image URLs`);
    console.log(`   3. Verify images are accessible in Supabase dashboard`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Upload failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
