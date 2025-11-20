# Product Images Quick Start Guide

## ✅ What's Already Done

Based on your screenshots, it looks like you've already:
1. ✅ Generated images from STEP files (visible in Supabase Storage)
2. ✅ Uploaded images to Supabase (in `products/` folders)

Great work! Now you just need to update the product database records.

## 📂 Current Image Structure in Supabase

Your images are stored in: `product-images/products/{product-name}/`

Each product folder contains:
- `preview.png` - Main product image
- `iso-*.png` - 6 perspective views (isometric angles)
- `front.png`, `back.png`, `left.png`, `right.png`, `top.png`, `bottom.png` - Orthographic views

## 🚀 Next Steps (3 minutes)

### Step 1: List Current Images

Run this to see all product folders in your Supabase Storage:

```bash
npm run list-storage-images
```

This will show you:
- All product folder names
- How many images each has
- Which views are available

### Step 2: Update the Mapping (if needed)

Open `scripts/update-product-image-urls.ts` and verify the `productImageMapping` object matches your product IDs and folder names.

Example - if you see a folder named `i-beam-steel-200mm-grade` in Step 1, make sure it's mapped:

```typescript
const productImageMapping: Record<string, string> = {
  'steel-beam-001': 'i-beam-steel-200mm-grade',  // ← product ID : folder name
  // ... other products
};
```

### Step 3: Update All Product Records

Run this to automatically update all products with their image URLs:

```bash
npm run update-product-images
```

This will:
- ✅ Fetch image URLs from Supabase Storage for each product
- ✅ Update the `images` field in your products table
- ✅ Show you a summary of what was updated

### Step 4: Verify

1. Start your dev server: `npm run dev`
2. Visit: `http://localhost:3000/catalog`
3. ✨ You should now see real product images instead of placeholders!

## 📋 Products with Images (from your screenshots)

Based on your Supabase Storage structure, you have images for these products:

**Robotic Components:**
- compact-servo-90mm-aluminum
- heavy-duty-servo-150mm-cast
- high-torque-servo-120mm-aluminum
- electric-linear-300mm-ss
- rotary-encoder-58mm-aluminum
- industrial-pressure-50mm-ss

**Structural Components:**
- i-beam-steel-200mm-grade
- steel-beam-120mm-grade
- steel-plate-2000mm-grade
- steel-angle-50mm-grade

**Fasteners:**
- hex-bolt-12mm-alloy
- hex-nut-12mm-alloy
- flat-washer-12mm-stainless
- socket-head-8mm-alloy

**Custom/Other:**
- connection-bracket-001
- coupling-002
- encoder-001
- custom-aluminum-6061-t6
- custom-bracket-001
- flexible-shaft-30mm-aluminum
- mounting-bracket-001
- pressure-sensor-001

Plus several servo-motor and linear-actuator variants!

## 🔧 Troubleshooting

### Images still not showing?

1. **Check the mapping**: Make sure product IDs match folder names in `update-product-image-urls.ts`
2. **Verify bucket is public**: Go to Supabase Dashboard → Storage → product-images → Make sure it's public
3. **Check product IDs**: Run this in Supabase SQL Editor:
   ```sql
   SELECT id, name, images FROM products LIMIT 10;
   ```
   Make sure the `id` values match what's in your mapping.

### Need to regenerate a product's images?

1. Go to `/cad-analyzer`
2. Upload the STEP file
3. Generate views
4. Download and re-upload to Supabase
5. Re-run: `npm run update-product-images`

## 📝 Quick Reference Commands

```bash
# See what images you have
npm run list-storage-images

# Update product database with image URLs
npm run update-product-images

# Upload new images to Supabase (if you generated more)
npm run upload-product-images
```

## 🎉 Success Checklist

- [ ] Ran `npm run list-storage-images` to see available images
- [ ] Verified product mapping in `update-product-image-urls.ts`
- [ ] Ran `npm run update-product-images` successfully
- [ ] Visited `/catalog` and saw real product images
- [ ] Clicked on a product to see all views in the detail page

That's it! Your product catalog should now have beautiful 3D-rendered images! 🚀

