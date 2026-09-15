# CAD 3D File Support - Quick Start Guide

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

This will install the newly added packages:
- `opencascade.js@beta`
- `three`
- `@types/three`

### 2. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 📁 Where to Test

### Option 1: Demo Page (Recommended for Testing)

Visit: `http://localhost:3000/cad-preview-demo`

**What you'll see:**
- Beautiful upload interface with drag & drop
- Support for STEP, STL, OBJ, DXF files
- Interactive 3D model viewer
- Real-time statistics
- Parts information display
- Full feature showcase

**How to use:**
1. Drag a CAD file onto the upload area OR click to browse
2. Wait for the file to parse (may take a few seconds)
3. Interact with the 3D model:
   - **Left-click + drag** to rotate
   - **Right-click + drag** to pan
   - **Scroll** to zoom
4. Use control buttons (Reset View, Toggle Wireframe, Fullscreen)
5. View statistics and parts information below

### Option 2: CAD Analyzer (Production Integration)

Visit: `http://localhost:3000/cad-analyzer`

**What's new:**
- Now accepts STEP, STL, OBJ, DXF files in addition to PDF/PNG/JPG
- Shows 3D preview when uploading CAD files
- Integrates with existing analysis workflow

**How to use:**
1. Upload a CAD file (STEP, STL, OBJ, or DXF)
2. Click "Analyze Drawing"
3. View the 3D preview in the Analysis tab
4. See extracted specifications and recommendations

### Option 3: CAD Analyzer (Home Page Widget)

Visit: `http://localhost:3000`

Scroll to the CAD Analyzer section on the home page.
- Same functionality as CAD Analyzer
- Compact interface
- Redirects to full page on analysis

## 🧪 Test Files

### Where to Get Test Files

1. **Download Sample CAD Files:**
   - [GrabCAD](https://grabcad.com/library) - Free CAD models
   - [Thingiverse](https://www.thingiverse.com/) - 3D printable models (STL)
   - [Free3D](https://free3d.com/) - Various 3D formats

2. **Create Your Own:**
   - Use FreeCAD, Fusion 360, or SolidWorks
   - Export as STEP, STL, OBJ, or DXF

### Recommended Test Files

**Simple Models (Good for First Test):**
- Small mechanical parts (< 1MB)
- Simple brackets or plates
- Basic geometric shapes

**Complex Models (Performance Testing):**
- Assemblies with multiple parts
- High-detail meshes (10,000+ faces)
- Large structural components

**Format-Specific Tests:**
- `.step` / `.stp` - Full parametric CAD models
- `.stl` - 3D printing meshes
- `.obj` - General 3D models
- `.dxf` - 2D technical drawings

## ✅ What to Test

### Basic Functionality
- [ ] Upload STEP file → Should show 3D preview
- [ ] Upload STL file → Should show mesh visualization
- [ ] Upload OBJ file → Should render correctly
- [ ] Upload DXF file → Should extrude 2D to 3D
- [ ] Drag & drop → Should accept file
- [ ] Invalid file → Should show error message
- [ ] Large file → Should show loading indicator

### 3D Viewer Controls
- [ ] Left-click + drag → Rotate model
- [ ] Right-click + drag → Pan view
- [ ] Scroll wheel → Zoom in/out
- [ ] Reset View button → Return to initial position
- [ ] Toggle Wireframe → Switch between modes
- [ ] Fullscreen button → Enter/exit fullscreen

### Statistics Display
- [ ] Vertices count shown
- [ ] Faces count shown
- [ ] Edges count shown
- [ ] Parts count shown
- [ ] Volume displayed (if available)
- [ ] Surface area displayed (if available)

### Parts Information
- [ ] Parts list displayed
- [ ] Each part shows type
- [ ] Volume per part (if available)
- [ ] Bounding box coordinates

### Error Handling
- [ ] File too large → Shows error
- [ ] Unsupported format → Shows error
- [ ] Corrupted file → Graceful failure
- [ ] Network error → Proper message

## 🔍 Debugging

### Enable Console Logging

Open browser DevTools (F12) and check console for:
- `OpenCascade.js initialized successfully` - Parser loaded
- `Using Gemini API` or `Using mock analysis` - API status
- Any error messages

### Common Issues & Solutions

**Issue:** "Failed to initialize OpenCascade"
```
Solution: Clear browser cache and reload
Alternative: Check browser WebAssembly support
```

**Issue:** "File parsing failed"
```
Solution: Try re-exporting from CAD software
Check: File might be corrupted or invalid
```

**Issue:** "3D preview is blank"
```
Solution: Check console for WebGL errors
Check: GPU acceleration enabled in browser
```

**Issue:** "Slow loading/rendering"
```
Solution: Try smaller file or simpler model
Check: Close other tabs to free memory
```

## 📊 Performance Testing

### File Size vs Load Time

Test with various file sizes:
- **< 1MB**: Should load instantly
- **1-5MB**: Should load within 2-3 seconds
- **5-10MB**: May take 5-8 seconds
- **> 10MB**: May need optimization

### Model Complexity

Test with different complexities:
- **Simple** (< 1,000 faces): Should be smooth 60 FPS
- **Moderate** (1,000-10,000 faces): Should maintain 60 FPS
- **Complex** (> 10,000 faces): May drop to 30 FPS

## 🎨 Visual Testing

### Check These Elements

**Upload Interface:**
- [ ] Drag & drop area visible
- [ ] Format badges displayed (STEP, STL, OBJ, DXF)
- [ ] File size limit shown
- [ ] Hover effects work

**3D Viewer:**
- [ ] Grid visible
- [ ] Axes helper shown
- [ ] Model centered
- [ ] Proper lighting
- [ ] Shadows rendered

**Statistics Panel:**
- [ ] Numbers formatted correctly
- [ ] Units displayed (mm³, mm², etc.)
- [ ] Background semi-transparent
- [ ] Readable text

**Control Buttons:**
- [ ] Icons visible
- [ ] Tooltips show on hover
- [ ] Buttons respond to clicks
- [ ] Visual feedback on hover

## 🌐 Browser Testing

Test in multiple browsers:

**Desktop:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Safari (if on Mac)

**Mobile:**
- [ ] Chrome Mobile
- [ ] Safari iOS
- [ ] Samsung Internet

## 📱 Responsive Testing

Test at different viewport sizes:
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

## 🔗 Integration Testing

### With Existing Features

**CAD Analyzer Integration:**
1. Upload CAD file
2. Analyze drawing
3. Check product recommendations
4. Verify specifications extracted

**RFQ Integration:**
1. Upload CAD file
2. Analyze drawing
3. Click "Request Quote"
4. Check if specs populate RFQ form

## 📝 Example Test Workflow

### Complete Test Run

```
1. Start dev server: npm run dev
2. Open browser: http://localhost:3000/cad-preview-demo
3. Open DevTools (F12) to monitor console
4. Download a test STEP file from GrabCAD
5. Drag file onto upload area
6. Wait for parsing (check console for progress)
7. Verify 3D model appears
8. Test rotation (left-click + drag)
9. Test zoom (scroll wheel)
10. Test pan (right-click + drag)
11. Click "Reset View" button
12. Toggle wireframe mode
13. Enter fullscreen
14. Exit fullscreen
15. Check statistics panel
16. Verify parts information
17. Click "Clear" button
18. Upload different format (STL)
19. Repeat interaction tests
20. Check console for any errors
```

## 🚨 Known Issues to Watch

1. **Large Files**: > 10MB may cause browser slowdown
2. **Complex Models**: > 50,000 faces may lag
3. **Mobile**: Performance limited on older devices
4. **DXF**: Only basic 2D entities supported
5. **Memory**: Very large models may need page refresh

## 💡 Tips for Best Testing Experience

1. **Use Chrome** for initial testing (best WebAssembly support)
2. **Start with small files** (< 5MB) to verify functionality
3. **Check console logs** for detailed debugging info
4. **Test incrementally** - one feature at a time
5. **Clear browser cache** if experiencing issues
6. **Use hardware acceleration** for smooth 3D rendering

## 📞 Getting Help

If you encounter issues:

1. **Check Documentation**
   - Read `CAD_FEATURES_DOCUMENTATION.md`
   - Review `CAD_IMPLEMENTATION_SUMMARY.md`

2. **Debug Steps**
   - Open browser console (F12)
   - Look for error messages
   - Check network tab for failed requests

3. **Common Solutions**
   - Clear browser cache
   - Restart dev server
   - Try different browser
   - Use smaller test file

## ✨ Next Steps

After testing:

1. **Try Your Own Files**: Upload CAD files from your projects
2. **Explore API**: Check `cad-parser.ts` and `cad-analyzer-utils.ts`
3. **Customize**: Modify `CADPreview3D.tsx` for your needs
4. **Integrate**: Add to your existing workflows
5. **Optimize**: Adjust settings for your use case

## 🎯 Success Criteria

Your implementation is working correctly when:
- ✅ All 4 file formats load without errors
- ✅ 3D preview renders smoothly
- ✅ All controls respond correctly
- ✅ Statistics display accurate data
- ✅ No console errors during normal operation
- ✅ Works across major browsers
- ✅ Integration with existing features works

---

**Happy Testing! 🎉**

For detailed documentation, see `CAD_FEATURES_DOCUMENTATION.md`



