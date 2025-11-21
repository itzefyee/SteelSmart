/**
 * List Product Images in Supabase Storage
 * 
 * This script lists all product images currently in Supabase Storage
 * to help map product IDs to their image folders.
 * 
 * Run with: npx tsx scripts/list-storage-images.ts
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

async function listProductFolders() {
  console.log('📂 Listing product image folders in Supabase Storage...');
  console.log('='.repeat(80));
  console.log('');

  try {
    const { data: folders, error } = await supabase.storage
      .from('product-images')
      .list('products', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    if (!folders || folders.length === 0) {
      console.log('⚠️  No product folders found in storage');
      console.log('   Run the upload script first: npm run upload-product-images');
      return;
    }

    console.log(`✅ Found ${folders.length} product folders:\n`);

    for (const folder of folders) {
      if (folder.name === '.emptyFolderPlaceholder') continue;

      console.log(`📁 ${folder.name}`);
      
      // List files in this folder
      const { data: files } = await supabase.storage
        .from('product-images')
        .list(`products/${folder.name}`, {
          limit: 100
        });

      if (files && files.length > 0) {
        const imageFiles = files.filter(f => 
          f.name.endsWith('.png') || f.name.endsWith('.jpg')
        );
        
        console.log(`   📸 ${imageFiles.length} images:`);
        
        // Show preview image first if it exists
        const previewFile = imageFiles.find(f => f.name === 'preview.png');
        if (previewFile) {
          const { data } = supabase.storage
            .from('product-images')
            .getPublicUrl(`products/${folder.name}/${previewFile.name}`);
          console.log(`      ⭐ preview.png`);
        }
        
        // Show perspective views
        const perspectiveFiles = imageFiles.filter(f => 
          f.name.startsWith('iso-') && f.name !== 'preview.png'
        );
        if (perspectiveFiles.length > 0) {
          console.log(`      🎨 ${perspectiveFiles.length} perspective views`);
          perspectiveFiles.forEach(f => {
            console.log(`         - ${f.name}`);
          });
        }
        
        // Show orthographic views
        const orthoFiles = imageFiles.filter(f => 
          !f.name.startsWith('iso-') && f.name !== 'preview.png'
        );
        if (orthoFiles.length > 0) {
          console.log(`      📐 ${orthoFiles.length} orthographic views`);
          orthoFiles.forEach(f => {
            console.log(`         - ${f.name}`);
          });
        }
      }
      console.log('');
    }

    console.log('='.repeat(80));
    console.log('💡 Next steps:');
    console.log('   1. Review the folder names above');
    console.log('   2. Update productImageMapping in update-product-image-urls.ts');
    console.log('   3. Run: npx tsx scripts/update-product-image-urls.ts');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

listProductFolders();




