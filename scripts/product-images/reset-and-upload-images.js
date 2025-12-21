/**
 * Reset and Upload Product Images
 * 
 * Run with: node scripts/reset-and-upload-images.js
 * 
 * This script:
 * 1. Deletes all existing images from Supabase
 * 2. Uploads all images with new structure: products/{product-id}/preview.png
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
  'iso-front-top-right': 100,
  'iso-front-top-left': 95,
  'iso-front-bottom-right': 90,
  'iso-front-bottom-left': 85,
  'iso-back-top-right': 80,
  'iso-back-top-left': 75,
  'iso-back-bottom-right': 70,
  'iso-back-bottom-left': 65,
  'front': 50,
  'back': 45,
  'top': 40,
  'bottom': 35,
  'left': 30,
  'right': 25,
};

function getViewType(fileName) {
  const match = fileName.match(/_([^_]+)_view\.(png|jpg|jpeg)$/i);
  return match ? match[1] : 'unknown';
}

function isPerspectiveView(viewType) {
  return viewType.startsWith('iso-');
}

function getViewPriority(viewType) {
  return VIEW_PRIORITY[viewType] || 0;
}

/**
 * Step 1: Delete all existing images
 */
async function deleteAllImages() {
  console.log('\n🗑️  STEP 1: Deleting existing images...');
  console.log('─'.repeat(80));

  try {
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (listError) {
      console.error('❌ Error listing files:', listError);
      throw listError;
    }

    if (!files || files.length === 0) {
      console.log('✅ No existing files found. Skipping deletion.');
      return;
    }

    console.log(`📊 Found ${files.length} folders to delete`);

    let totalDeleted = 0;

    for (const item of files) {
      if (item.name === '.emptyFolderPlaceholder') continue;

      const { data: folderFiles, error: folderListError } = await supabase.storage
        .from(BUCKET_NAME)
        .list(item.name, {
          limit: 1000
        });

      if (folderListError) {
        console.error(`  ❌ Error listing files in ${item.name}:`, folderListError);
        continue;
      }

      if (folderFiles && folderFiles.length > 0) {
        const filePaths = folderFiles.map(file => `${item.name}/${file.name}`);

        const { error: deleteError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove(filePaths);

        if (!deleteError) {
          totalDeleted += filePaths.length;
          process.stdout.write('.');
        }
      }
    }

    console.log(`\n✅ Deleted ${totalDeleted} files`);

  } catch (error) {
    console.error('\n❌ Deletion failed:', error);
    throw error;
  }
}

/**
 * Step 2: Scan product images
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
        imageFiles.sort((a, b) => {
          if (a.isPerspective !== b.isPerspective) {
            return a.isPerspective ? -1 : 1;
          }
          return b.priority - a.priority;
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
 * Step 3: Upload image with new structure
 */
async function uploadImage(image, isPreview = false) {
  try {
    const fileBuffer = await fs.readFile(image.filePath);
    
    let fileName;
    if (isPreview) {
      fileName = 'preview.png';
    } else {
      const ext = image.fileName.endsWith('.png') ? 'png' : 'jpg';
      fileName = `${image.viewType}.${ext}`;
    }
    
    const storagePath = `products/${image.productId}/${fileName}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType: image.fileName.endsWith('.png') ? 'image/png' : 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error(`  ❌ Failed to upload ${fileName}:`, error.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error(`  ❌ Error uploading:`, error);
    return null;
  }
}

/**
 * Step 4: Upload all images
 */
async function uploadAllImages() {
  console.log('\n📤 STEP 2: Uploading images with new structure...');
  console.log('─'.repeat(80));

  const productImages = await scanProductImages();
  console.log(`📊 Found ${productImages.size} products\n`);

  const results = [];

  for (const [productId, images] of productImages.entries()) {
    console.log(`📸 ${productId} (${images.length} images)`);

    const perspectiveImages = [];
    const orthographicImages = [];
    let previewImage = null;

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const isPreview = (i === 0);

      const url = await uploadImage(image, isPreview);

      if (url) {
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

    console.log(`   ✅ ${perspectiveImages.length} perspective + ${orthographicImages.length} orthographic\n`);
  }

  // Save results
  const outputPath = path.join(__dirname, '..', 'product-images-upload-results.json');
  fsSync.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log('─'.repeat(80));
  console.log(`✅ Uploaded ${results.length} products`);
  console.log(`💾 Results saved to: product-images-upload-results.json`);

  return results;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Reset and Upload Product Images');
  console.log('='.repeat(80));
  console.log('New structure: product-images/products/{product-id}/preview.png');
  console.log('='.repeat(80));

  try {
    // Step 1: Delete existing images
    await deleteAllImages();

    // Step 2: Upload with new structure
    await uploadAllImages();

    console.log('\n🎉 Complete! Images uploaded with new structure.');
    console.log('\n📝 Next steps:');
    console.log('   1. Check product-images-upload-results.json');
    console.log('   2. Update database with preview URLs');
    console.log('   3. Verify in Supabase dashboard');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  }
}

main();
