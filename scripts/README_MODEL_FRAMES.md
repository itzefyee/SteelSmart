# 3D Model Frames Generation Guide

This directory contains scripts for generating and managing rotating 3D model frames for the hero section.

## Quick Start

### 1. Generate Placeholder SVG Frames (Recommended for Development)

```bash
npm run generate-frames
```

This creates 36 SVG wireframe frames of a brake rotor in `/public/model-frames/brake-rotor/`.

**Pros:**
- ✅ Instant generation (< 5 seconds)
- ✅ Small file size (~2-3KB per frame)
- ✅ Scalable vector graphics
- ✅ No external dependencies
- ✅ Works immediately in development

**Cons:**
- ⚠️ Simplified wireframe representation
- ⚠️ Not photorealistic

### 2. Generate High-Quality 3D Renders (Optional)

For production-quality photorealistic renders, use one of these methods:

#### Option A: Using Blender (Recommended)

**Prerequisites:**
- Install Blender: https://www.blender.org/download/
- Or via winget: `winget install BlenderFoundation.Blender`

**Steps:**
1. Convert STEP to STL format (Blender doesn't support STEP natively)
2. Run the Python script generation:
   ```bash
   python scripts/generate_model_frames.py \
     --input public/sample-drawings/model.stl \
     --output public/model-frames/brake-rotor \
     --frames 36 \
     --size 1024
   ```
3. Execute the generated Blender script:
   ```bash
   blender --background --python public/model-frames/brake-rotor/render_script.py
   ```

#### Option B: Using FreeCAD

**Prerequisites:**
- Install FreeCAD: https://www.freecad.org/downloads.php

**Steps:**
1. Run the script with FreeCAD option:
   ```bash
   python scripts/generate_model_frames.py \
     --input public/sample-drawings/A_320mm_vented_brake_rotor_wit.step \
     --output public/model-frames/brake-rotor \
     --frames 36 \
     --use-freecad
   ```
2. Execute with FreeCAD:
   ```bash
   freecadcmd public/model-frames/brake-rotor/render_script.py
   ```

#### Option C: Online Conversion Services

1. Upload your STEP file to:
   - CAD Exchanger: https://cadexchanger.com/
   - AnyConv: https://anyconv.com/step-to-obj-converter/
   - Aspose: https://products.aspose.app/3d/conversion/step-to-obj

2. Download as OBJ or STL

3. Use Blender to render frames

### 3. Upload to Supabase CDN (Optional)

For better performance and CDN delivery:

**Prerequisites:**
- Set up Supabase project
- Add credentials to `.env.local`:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your-project-url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  ```

**Steps:**

1. Run the SQL setup script in Supabase SQL Editor:
   ```bash
   # Copy contents of scripts/setup_supabase_storage.sql
   # Paste into Supabase Dashboard > SQL Editor > New Query > Execute
   ```

2. Upload frames:
   ```bash
   npm run upload-frames
   ```

3. Update your component to use Supabase:
   ```tsx
   <RotatingModel3D useSupabase={true} />
   ```

## File Structure

```
public/model-frames/
└── brake-rotor/
    ├── brake-rotor-000.svg  (or .png)
    ├── brake-rotor-001.svg
    ├── brake-rotor-002.svg
    └── ... (36 frames total)
```

## Component Usage

### Basic Usage (Local Files)

```tsx
import RotatingModel3D from '@/components/hero/RotatingModel3D';

<RotatingModel3D />
```

### With Custom Options

```tsx
<RotatingModel3D
  modelName="brake-rotor"
  totalFrames={36}
  frameRate={100}
  useSupabase={false}
/>
```

### Using Supabase CDN

```tsx
<RotatingModel3D
  modelName="brake-rotor"
  totalFrames={36}
  frameRate={100}
  useSupabase={true}
/>
```

## Performance Tips

1. **SVG vs PNG:**
   - SVG: Smaller file size, scalable, but may be slower to render many frames
   - PNG: Faster rendering, better for complex models, larger file size

2. **Frame Count:**
   - 36 frames = 10° per frame (smooth for web)
   - 24 frames = 15° per frame (faster loading)
   - 60 frames = 6° per frame (ultra-smooth, larger size)

3. **Optimization:**
   - Compress PNGs with TinyPNG or ImageOptim
   - Use WebP format for modern browsers
   - Enable CDN caching via Supabase

4. **Preloading:**
   - Component preloads all frames before animating
   - Shows loading spinner during preload
   - Consider lazy loading for below-the-fold content

## Converting SVG to PNG

If you want to convert the generated SVGs to PNGs:

### Using ImageMagick

```bash
cd public/model-frames/brake-rotor
for file in *.svg; do
  magick "$file" -resize 1024x1024 "${file%.svg}.png"
done
```

### Using Node.js (sharp)

```bash
npm install sharp
node scripts/convert_svg_to_png.js
```

## Troubleshooting

### Issue: Frames not loading

**Solution:**
- Check browser console for 404 errors
- Verify files exist in `/public/model-frames/brake-rotor/`
- Check file naming (must be `brake-rotor-000.svg` format)

### Issue: Animation is jerky

**Solution:**
- Reduce `frameRate` prop (increase ms per frame)
- Ensure all frames are preloaded (check loading state)
- Reduce frame count for faster loading

### Issue: Supabase upload fails

**Solution:**
- Verify Supabase credentials in `.env.local`
- Check bucket exists and is public
- Verify storage policies allow public read access
- Check file size limits (default 5MB per file)

## Advanced Customization

### Custom Model

To add a different 3D model:

1. Generate frames with custom name:
   ```bash
   # Modify generate_placeholder_frames.js
   # Change MODEL_NAME and OUTPUT_DIR
   ```

2. Use in component:
   ```tsx
   <RotatingModel3D modelName="custom-part" />
   ```

### Custom Wireframe Style

Edit `scripts/generate_placeholder_frames.js`:
- Modify SVG generation function
- Change colors, stroke widths, patterns
- Add custom geometry

## Resources

- **Blender Documentation:** https://docs.blender.org/manual/en/latest/
- **FreeCAD Documentation:** https://wiki.freecad.org/
- **Three.js (for WebGL rendering):** https://threejs.org/
- **Supabase Storage:** https://supabase.com/docs/guides/storage

## Support

For issues or questions:
1. Check this README
2. Review component source code
3. Check browser console for errors
4. Verify file paths and environment variables










