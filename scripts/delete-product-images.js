/**
 * Delete Product Images from Supabase
 * 
 * Run with: node scripts/delete-product-images.js
 * 
 * This script deletes all uploaded product images from Supabase storage
 */

const { createClient } = require('@supabase/supabase-js');
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

/**
 * Delete all files in the bucket
 */
async function deleteAllImages() {
  console.log('🗑️  Deleting Product Images from Supabase');
  console.log('='.repeat(80));

  try {
    // List all files in the bucket
    console.log(`\n📋 Listing all files in bucket "${BUCKET_NAME}"...`);
    
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
      console.log('✅ No files found in bucket. Nothing to delete.');
      return;
    }

    console.log(`📊 Found ${files.length} folders/files`);

    let totalDeleted = 0;

    // Delete each folder
    for (const item of files) {
      if (item.name === '.emptyFolderPlaceholder') continue;

      console.log(`\n🗑️  Deleting folder: ${item.name}`);

      // List all files in this folder
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
        // Build array of file paths to delete
        const filePaths = folderFiles.map(file => `${item.name}/${file.name}`);

        console.log(`  📁 Deleting ${filePaths.length} files...`);

        // Delete all files in this folder
        const { error: deleteError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove(filePaths);

        if (deleteError) {
          console.error(`  ❌ Error deleting files:`, deleteError);
        } else {
          console.log(`  ✅ Deleted ${filePaths.length} files`);
          totalDeleted += filePaths.length;
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`✅ Deletion complete! Total files deleted: ${totalDeleted}`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ Deletion failed:', error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    await deleteAllImages();
    console.log('\n🎉 All product images deleted successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
