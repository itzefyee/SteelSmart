# Product Images Fix Guide

## For Products Missing Images

Some products are not showing images because their product names don't exactly match the folder names in Supabase Storage.

### Products That Need Manual Fixing:

1. **Universal Servo Motor Mount**
2. **Steel Channel 100x50x6mm**
3. **Steel Beam Connection Bracket**
4. **Rotary Encoder 1024 PPR**
5. **Custom Aluminum Mounting Bracket**

---

## Quick Fix (Automated)

Run this command to automatically fix the mappings:

```bash
npm run fix-product-images
```

This script will:
1. Show you all available image folders in Supabase Storage
2. Map the products above to the correct folders
3. Update the database with the correct image URLs
4. Show you a summary of what was fixed

---

## Manual Fix (If Automated Fails)

### Step 1: Check Available Folders

Run this to see what image folders you have:

```bash
npm run list-storage-images
```

You should see folders like:
- `compact-servo-90mm-aluminum`
- `custom-aluminum-6061-t6`
- `electric-linear-300mm-ss`
- `rotary-encoder-58mm-aluminum`
- `steel-angle-50mm-grade`
- `universal-servo-140mm-steel`
- etc.

### Step 2: Find Your Product IDs

Go to Supabase Dashboard → Table Editor → `products` table

Search for the product names and note their `id` values.

### Step 3: Update Manually in Supabase

For each product, run this SQL in Supabase SQL Editor:

```sql
-- Example: Update Universal Servo Motor Mount
UPDATE products
SET images = (
  SELECT array_agg(
    'https://your-project.supabase.co/storage/v1/object/public/product-images/products/universal-servo-140mm-steel/' || name
    ORDER BY name
  )
  FROM (
    SELECT unnest(ARRAY[
      'preview.png',
      'iso-front-top-right.png',
      'iso-front-top-left.png',
      'iso-front-bottom-right.png',
      'iso-front-bottom-left.png',
      'iso-back-top-right.png',
      'iso-back-bottom-left.png',
      'front.png',
      'back.png',
      'left.png',
      'right.png',
      'top.png',
      'bottom.png'
    ]) AS name
  ) AS image_names
)
WHERE name = 'Universal Servo Motor Mount';
```

Replace:
- `your-project.supabase.co` with your actual Supabase URL
- `universal-servo-140mm-steel` with the correct folder name
- `'Universal Servo Motor Mount'` with the actual product name

---

## Recommended Folder Mappings

Based on your product names, here are the suggested mappings:

| Product Name | → | Folder Name |
|-------------|---|-------------|
| Universal Servo Motor Mount | → | `universal-servo-140mm-steel` |
| Steel Channel 100x50x6mm | → | `steel-angle-50mm-grade` |
| Steel Beam Connection Bracket | → | `i-beam-steel-200mm-grade` or create new folder |
| Rotary Encoder 1024 PPR | → | `rotary-encoder-58mm-aluminum` |
| Custom Aluminum Mounting Bracket | → | `custom-aluminum-6061-t6` |

**Note:** If the product doesn't have an exact match, use a similar product's images as a placeholder, or generate new images for it using the CAD Analyzer.

---

## Generate Missing Images (Recommended)

If a product truly has no matching folder, you can generate images for it:

### Option 1: Using CAD Analyzer

1. Go to `/cad-analyzer`
2. Upload the product's STEP file from `public/products-models/`
3. Click "Extract 2D Views"
4. Click "Generate Perspective Views"
5. Download all views
6. Create folder: `public/products-images/{product-folder-name}/`
7. Save images with correct names (see naming convention below)
8. Run: `npm run upload-product-images`

### Image Naming Convention

Images must be named exactly as follows:
```
{product-id}_preview.png                    (main preview)
{product-id}_iso-front-top-right.png       (perspective views)
{product-id}_iso-front-top-left.png
{product-id}_iso-front-bottom-right.png
{product-id}_iso-front-bottom-left.png
{product-id}_iso-back-top-right.png
{product-id}_iso-back-bottom-left.png
{product-id}_front.png                      (orthographic views)
{product-id}_back.png
{product-id}_left.png
{product-id}_right.png
{product-id}_top.png
{product-id}_bottom.png
```

---

## Verification

After fixing, verify the changes:

1. Visit `/catalog`
2. Find the product
3. Click "View Details"
4. Check if images are displaying
5. Try the image gallery navigation (arrows and thumbnails)

---

## Troubleshooting

### Images still not showing?

1. **Check the product record:**
   ```sql
   SELECT id, name, images FROM products WHERE name = 'Your Product Name';
   ```
   Make sure the `images` array has valid URLs.

2. **Check bucket is public:**
   Supabase Dashboard → Storage → `product-images` → Settings → Make sure "Public bucket" is ON

3. **Test the URL directly:**
   Copy an image URL from the `images` array and paste it in your browser. If it doesn't load, the file might not exist.

4. **Check folder name:**
   Supabase Dashboard → Storage → `product-images` → `products/` → Look for the folder

### Product name doesn't match any folder?

Either:
- **Rename the folder** in Supabase Storage to match the product name (easier)
- **Generate new images** for that product (recommended for production)
- **Use a similar product's images** as a temporary placeholder

---

## Quick Reference Commands

```bash
# See what folders exist
npm run list-storage-images

# Auto-fix known issues
npm run fix-product-images

# Match all products automatically
npm run auto-match-products

# Upload new images
npm run upload-product-images
```

---

## Example: Complete Fix for One Product

Let's fix "Universal Servo Motor Mount":

```bash
# 1. Check what folders we have
npm run list-storage-images

# Output shows: universal-servo-140mm-steel (perfect match!)

# 2. Run the fix script
npm run fix-product-images

# 3. Verify
# Visit: http://localhost:3000/catalog
# Search for "Universal Servo Motor Mount"
# Click "View Details"
# ✅ Images should now display!
```

That's it! The fix script handles everything automatically. 🎉

