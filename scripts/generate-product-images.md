# Product Images Generation Guide

This guide explains how to generate product images from the STEP files in `public/products-models/` and upload them to Supabase for use in the product catalog.

## Overview

The product catalog currently shows placeholder SVG images. To display actual product photos, you need to:

1. **Generate images** from STEP files using Blender or the CAD 2D View Extractor
2. **Organize images** in the `public/products-images/` directory
3. **Upload images** to Supabase Storage
4. **Update product records** in the database

## Current Product STEP Files

Located in `public/products-models/`:
- compact-servo-90mm-aluminum.step
- custom-aluminum-6061-t6.step
- electric-linear-300mm-ss.step
- flat-washer-12mm-stainless.step
- flexible-shaft-30mm-aluminum.step
- heavy-duty-servo-150mm-cast.step
- hex-bolt-12mm-alloy.step
- hex-nut-12mm-alloy.step
- high-torque-servo-120mm-aluminum.step
- i-beam-steel-200mm-grade.step
- industrial-pressure-50mm-ss.step
- rotary-encoder-58mm-aluminum.step
- socket-head-8mm-alloy.step
- steel-angle-50mm-grade.step
- steel-beam-120mm-grade.step
- steel-plate-2000mm-grade.step
- universal-servo-140mm-steel.step

## Method 1: Using the CAD Analyzer (Easiest)

The CAD Drawing Analyzer in the app can generate both orthographic and perspective views:

1. **Navigate to CAD Analyzer**: `/cad-analyzer`
2. **Upload each STEP file** from `products-models/`
3. **Click "Extract 2D Views"** to generate 6 orthographic views
4. **Click "Generate Perspective Views"** to generate 6 perspective views
5. **Download all views** and organize them by product

### Recommended Views for Products:
- **Preview Image**: `iso-front-top-right` (best angle)
- **Additional Views**: All perspective views for 360° product visualization

### Organize Downloaded Images:
```
public/products-images/
  ├── compact-servo-90mm-aluminum/
  │   ├── compact-servo-90mm-aluminum_iso-front-top-right_view.png (use as preview)
  │   ├── compact-servo-90mm-aluminum_iso-front-top-left_view.png
  │   ├── compact-servo-90mm-aluminum_iso-front-bottom-right_view.png
  │   └── ... (other views)
  ├── electric-linear-300mm-ss/
  │   └── ... (similar structure)
  └── ... (repeat for all products)
```

## Method 2: Using Blender (Production Quality)

For photorealistic renders with custom lighting:

### Prerequisites:
```bash
# Install Blender
winget install BlenderFoundation.Blender
# or download from https://www.blender.org/download/
```

### Steps:

1. **Convert STEP to STL** (Blender doesn't support STEP directly)
   - Use FreeCAD or online converter like https://cadexchanger.com/
   - Save STL files to `public/products-models/`

2. **Generate Blender script** for each product:
```bash
python scripts/generate_model_frames.py \
  --input public/products-models/compact-servo-90mm-aluminum.stl \
  --output public/products-images/compact-servo-90mm-aluminum \
  --frames 12 \
  --size 1024
```

3. **Render with Blender**:
```bash
blender --background --python public/products-images/compact-servo-90mm-aluminum/render_script.py
```

4. **Repeat for all products**

## Image Naming Convention

The upload script expects this naming format:
```
{product-id}_{view-type}_view.{ext}
```

Examples:
- `compact-servo-90mm-aluminum_iso-front-top-right_view.png`
- `electric-linear-300mm-ss_front_view.png`

## Upload to Supabase

Once images are organized in `public/products-images/`:

```bash
# Upload all images to Supabase Storage
npm run upload-product-images

# Or use the TypeScript version
npx tsx scripts/upload-product-images.ts
```

This script will:
- Scan `public/products-images/` for organized folders
- Prioritize perspective views over orthographic views
- Select the best perspective view as the preview image
- Upload to the `product-images` bucket in Supabase
- Return public URLs for each image

## Update Product Records

After uploading, you need to update the product records in Supabase with the image URLs.

### Manual Update (Supabase Dashboard):
1. Go to Supabase Dashboard → Table Editor → `products`
2. For each product, update the `images` field (JSONB array):
```json
[
  "https://your-project.supabase.co/storage/v1/object/public/product-images/compact-servo-90mm-aluminum/iso-front-top-right.png",
  "https://your-project.supabase.co/storage/v1/object/public/product-images/compact-servo-90mm-aluminum/iso-front-top-left.png"
]
```

### Automated Update (Script - TODO):
A migration script could be created to automatically update all product records based on the upload results in `product-images-upload-results.json`.

## Verification

After updating:
1. **Visit the Catalog**: `/catalog`
2. **Check Product Cards**: Images should display instead of placeholder SVGs
3. **Open Product Details**: All uploaded views should be visible in the gallery

## Troubleshooting

### Images not displaying:
- Verify the `product-images` bucket is public in Supabase
- Check the `images` array in the product record has valid URLs
- Ensure CORS is enabled for the Supabase Storage bucket

### Upload fails:
- Check `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Verify the service role key has storage permissions
- Check bucket exists in Supabase Storage

### No images in products-images/:
- Use Method 1 (CAD Analyzer) to manually generate and download views
- Or use Method 2 (Blender) for batch rendering

## Quick Start Checklist

- [ ] Create `public/products-images/` directory
- [ ] Generate images using CAD Analyzer or Blender
- [ ] Organize images in product-specific folders with correct naming
- [ ] Run upload script: `npm run upload-product-images`
- [ ] Update product records in Supabase with image URLs
- [ ] Verify images display in the catalog

## Alternative: Use Existing Sample Images

As a temporary solution, you can reuse the sample images in `public/images/products/`:
- servo-motor-001.jpg
- linear-actuator-001.jpg  
- steel-beam-001.jpg

Just update the product records to point to these files, but note they are generic samples.




