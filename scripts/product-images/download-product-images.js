// Node.js script to download product images from Supabase and update products.json
// Run with: node scripts/download-product-images.js

const fs = require('fs');
const path = require('path');
const https = require('https');

const PRODUCTS_JSON_PATH = 'src/data/products.json';
const TARGET_DIR = 'public/images/products';

// Create target directory if it doesn't exist
if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
  console.log(`✓ Created directory: ${TARGET_DIR}`);
}

// Download file from URL
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete partial file
      reject(err);
    });
  });
}

// Main function
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('Downloading product images...');
  console.log('='.repeat(60) + '\n');

  // Read products.json
  const productsData = JSON.parse(fs.readFileSync(PRODUCTS_JSON_PATH, 'utf8'));
  
  let downloadedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const product of productsData.products) {
    const productId = product.id;
    const productName = product.name.replace(/[\\/:*?"<>|]/g, '-'); // Sanitize
    
    console.log(`\nProcessing: ${productName} (${productId})`);
    
    const newImagePaths = [];
    
    for (let i = 0; i < product.images.length; i++) {
      const imageUrl = product.images[i];
      
      try {
        // Extract filename from URL
        const urlParts = imageUrl.split('/');
        const originalFilename = urlParts[urlParts.length - 1];
        
        // Create clean filename
        let filename;
        if (i === 0) {
          filename = `${productId}.png`;
        } else {
          const ext = path.extname(originalFilename);
          const base = path.basename(originalFilename, ext);
          filename = `${productId}-${base}${ext}`;
        }
        
        const localPath = path.join(TARGET_DIR, filename);
        
        // Check if file already exists
        if (fs.existsSync(localPath)) {
          console.log(`  ✓ Already exists: ${filename}`);
          skippedCount++;
        } else {
          // Download the image
          console.log(`  ↓ Downloading: ${filename}`);
          await downloadFile(imageUrl, localPath);
          console.log(`  ✓ Downloaded: ${filename}`);
          downloadedCount++;
        }
        
        // Add new path
        newImagePaths.push(`/images/products/${filename}`);
        
      } catch (error) {
        console.error(`  ✗ Error downloading ${imageUrl}: ${error.message}`);
        errorCount++;
        // Keep original URL if download fails
        newImagePaths.push(imageUrl);
      }
    }
    
    // Update product's images array
    product.images = newImagePaths;
  }

  // Save updated products.json
  console.log('\n' + '='.repeat(60));
  console.log('Updating products.json...');
  
  fs.writeFileSync(
    PRODUCTS_JSON_PATH,
    JSON.stringify(productsData, null, 2),
    'utf8'
  );
  
  console.log('✓ products.json updated successfully!');

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Downloaded: ${downloadedCount} images`);
  console.log(`Skipped (already exists): ${skippedCount} images`);
  console.log(`Errors: ${errorCount} images`);
  console.log('='.repeat(60));

  if (errorCount === 0) {
    console.log('\n✓ All images downloaded successfully!');
  } else {
    console.log('\n⚠ Some images failed to download. Check the errors above.');
  }

  console.log(`\nImages saved to: ${TARGET_DIR}`);
  console.log(`Updated file: ${PRODUCTS_JSON_PATH}`);
}

// Run the script
main().catch((error) => {
  console.error('\n✗ Script failed:', error);
  process.exit(1);
});
