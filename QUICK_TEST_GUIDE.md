# 🚀 Quick Test Guide - 2D View Extraction

## ⚡ 5-Minute Test

### Step 1: Start the Dev Server
```bash
cd Metalyze
npm run dev
```

### Step 2: Navigate to CAD Analyzer
Open browser: `http://localhost:3000/cad-analyzer`

### Step 3: Upload a CAD File
- Click the upload area or drag & drop
- Choose a STEP file (`.step` or `.stp`)
- Or use one of the sample drawings

### Step 4: Wait for 3D Preview
- The 3D model will load automatically
- You'll see the rotating 3D preview

### Step 5: Find the 2D View Extraction Section
- Scroll down below the 3D preview
- You'll see a new section: **"2D View Extraction"**

### Step 6: Extract Views
- Click the **"Extract 2D Views"** button
- Wait 2-3 seconds
- 6 views will appear in a grid

### Step 7: Download Views
- Click "Download PNG" on any view
- Or click "Download All Views" for all 6

---

## 📍 Where to Find It

```
CAD Drawing Analyzer Page
├── Upload Section (left column)
│   └── Drop zone + Analyze button
│
└── Results Section (right column)
    ├── Tab Navigation (Analysis | Manufacturability | Specifications | Report)
    │
    └── Analysis Tab Content
        ├── 3D Model Preview ← Already exists
        │   └── Interactive 3D viewer
        │
        ├── 2D View Extraction ← NEW FEATURE! 🎉
        │   ├── "Extract 2D Views" button
        │   └── Grid of 6 views (after generation)
        │       ├── Top view
        │       ├── Bottom view
        │       ├── Front view
        │       ├── Back view
        │       ├── Right view
        │       └── Left view
        │
        └── Manufacturing Analysis ← Already exists
            └── Run analysis button
```

---

## ✅ What You Should See

### Before Extraction:
```
┌─────────────────────────────────────────┐
│  2D View Extraction                     │
│  Extract 2D orthographic views from     │
│  your 3D CAD model.                     │
│                                         │
│  [Extract 2D Views]                     │
│                                         │
│  Upload a 3D CAD file (STEP, STL, OBJ) │
│  to enable view extraction              │
└─────────────────────────────────────────┘
```

### During Extraction:
```
┌─────────────────────────────────────────┐
│  2D View Extraction                     │
│                                         │
│  [Generating Views...] ⏳               │
└─────────────────────────────────────────┘
```

### After Extraction:
```
┌─────────────────────────────────────────┐
│  [Download All] [Regenerate] [Clear]    │
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ Top     │ │ Front   │ │ Right   │  │
│  │ [image] │ │ [image] │ │ [image] │  │
│  │Download │ │Download │ │Download │  │
│  └─────────┘ └─────────┘ └─────────┘  │
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ Bottom  │ │ Back    │ │ Left    │  │
│  │ [image] │ │ [image] │ │ [image] │  │
│  │Download │ │Download │ │Download │  │
│  └─────────┘ └─────────┘ └─────────┘  │
│                                         │
│  ℹ️ Generated 6 orthographic views     │
│  These 2D views can be used for        │
│  manufacturing drawings, documentation, │
│  or AI analysis.                        │
└─────────────────────────────────────────┘
```

---

## 🎯 Expected Behavior

### ✅ Should Work:
- STEP files (.step, .stp)
- STL files (.stl)
- OBJ files (.obj)
- DXF files (.dxf)
- glTF files (.gltf, .glb)

### ❌ Should NOT Show:
- PDF files (not 3D)
- PNG/JPG images (not 3D)

---

## 🐛 Troubleshooting

### Issue: Button is disabled
**Solution**: Make sure a 3D CAD file is uploaded and the 3D preview has loaded

### Issue: "No CAD model data available" error
**Solution**: Wait for the 3D preview to finish parsing the model

### Issue: Views look blank/white
**Solution**: The model might be too small or too large. Try a different file.

### Issue: Generation takes too long
**Solution**: Large models (>10MB) may take 5-10 seconds. Be patient.

### Issue: Download doesn't work
**Solution**: Check browser popup blocker settings

---

## 📸 Screenshot Locations

After generation, you'll have 6 PNG files:
- `model_top_view.png`
- `model_bottom_view.png`
- `model_front_view.png`
- `model_back_view.png`
- `model_right_view.png`
- `model_left_view.png`

Each file is 800x600 pixels, ~100-500KB depending on model complexity.

---

## 🎉 Success Criteria

You've successfully tested the feature when:
- ✅ Upload a STEP file
- ✅ See the 2D View Extraction section
- ✅ Click "Extract 2D Views"
- ✅ See 6 views generated
- ✅ Download at least one view
- ✅ Verify the PNG file opens correctly

---

## 💡 Tips

1. **Use Sample Drawings**: Click one of the sample drawings (Servo Motor, Bracket, I-Beam) for quick testing
2. **Try Different Files**: Test with STEP, STL, and OBJ to see different results
3. **Check Mobile**: Resize browser window to see responsive grid (3 cols → 2 cols → 1 col)
4. **Compare Views**: Open multiple views side-by-side to see different angles

---

**Happy Testing! 🚀**
