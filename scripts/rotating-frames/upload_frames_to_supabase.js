#!/usr/bin/env node
/**
 * Upload generated model frames to Supabase Storage
 * This script uploads all frames from the public directory to Supabase for CDN delivery
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || (!supabaseKey && !serviceRoleKey)) {
  console.error('❌ Error: Missing Supabase credentials in .env.local');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey ?? supabaseKey, {
  auth: { persistSession: false },
});
const usingServiceRole = Boolean(serviceRoleKey);

const FRAMES_DIR = path.join(__dirname, '../public/model-frames/brake-rotor');
const BUCKET_NAME = 'model-frames';
const MODEL_NAME = 'brake-rotor';

async function uploadFrames() {
  console.log('🚀 Starting upload to Supabase Storage...\n');
  if (!usingServiceRole) {
    console.warn('⚠️  Using anon key. Uploads may fail unless storage policies allow public writes.');
    console.warn('   Set SUPABASE_SERVICE_ROLE_KEY in .env.local for admin uploads.\n');
  }
  
  console.log(`ℹ️  Make sure the "${BUCKET_NAME}" bucket already exists (Storage > Create bucket > Public).`);
  
  // Read PNG/SVG files
  const files = fs.readdirSync(FRAMES_DIR).filter((f) => /\.(png|svg)$/i.test(f));
  
  if (files.length === 0) {
    console.error('❌ No SVG files found in', FRAMES_DIR);
    console.log('💡 Run: npm run generate-frames first');
    return;
  }
  
  console.log(`📁 Found ${files.length} frames to upload\n`);
  
  let uploaded = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const file of files) {
    const filePath = path.join(FRAMES_DIR, file);
    const fileContent = fs.readFileSync(filePath);
    const storagePath = `${MODEL_NAME}/${file}`;
    const ext = path.extname(file).toLowerCase();
    const contentType = ext === '.png' ? 'image/png' : 'image/svg+xml';
    
    // Check if file already exists
    const { data: existingFile } = await supabase.storage
      .from(BUCKET_NAME)
      .list(MODEL_NAME, { search: file });
    
    if (existingFile && existingFile.length > 0) {
      // Update existing file
      const { error: updateError } = await supabase.storage
        .from(BUCKET_NAME)
        .update(storagePath, fileContent, {
          contentType,
          upsert: true,
        });
      
      if (updateError) {
        console.error(`❌ Error updating ${file}:`, updateError.message);
        errors++;
      } else {
        console.log(`♻️  Updated: ${file}`);
        uploaded++;
      }
    } else {
      // Upload new file
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, fileContent, {
          contentType,
          upsert: true,
        });
      
      if (uploadError) {
        console.error(`❌ Error uploading ${file}:`, uploadError.message);
        errors++;
      } else {
        console.log(`✅ Uploaded: ${file}`);
        uploaded++;
      }
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Upload Summary:`);
  console.log(`   ✅ Uploaded: ${uploaded}`);
  console.log(`   ⏭️  Skipped:  ${skipped}`);
  console.log(`   ❌ Errors:   ${errors}`);
  console.log('='.repeat(50));
  
  if (uploaded > 0) {
    console.log('\n🎉 Frames are now available via CDN!');
    console.log(`\n🔗 Public URL format:`);
    console.log(`   ${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${MODEL_NAME}/brake-rotor-000.png`);
    console.log('\n💡 To use Supabase storage in your component:');
    console.log('   <RotatingModel3D useSupabase={true} />');
  }
}

uploadFrames().catch(console.error);


