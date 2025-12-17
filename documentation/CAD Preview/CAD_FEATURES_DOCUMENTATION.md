# CAD Drawing Analyzer - 3D File Support Documentation

## Overview

The CAD Drawing Analyzer now supports advanced 3D CAD file formats with real-time 3D preview and comprehensive model data extraction. This feature is powered by **OpenCascade.js** for CAD parsing and **Three.js** for 3D rendering.

## Supported File Formats

### 1. STEP (.step, .stp)
- **Full Name**: Standard for the Exchange of Product Data (ISO 10303)
- **Best For**: Parametric CAD models with full geometry and metadata
- **Features Supported**:
  - Complete 3D geometry extraction
  - Face, edge, and vertex parsing
  - Volume and surface area calculation
  - Bounding box computation
  - Multi-part assembly support

### 2. STL (.stl)
- **Full Name**: Stereolithography
- **Best For**: 3D printing and mesh-based models
- **Features Supported**:
  - Triangle mesh parsing
  - Binary and ASCII formats
  - Geometry extraction
  - Bounding box computation
  - Surface mesh visualization

### 3. OBJ (.obj)
- **Full Name**: Wavefront OBJ
- **Best For**: 3D models with texture coordinates
- **Features Supported**:
  - Vertex and face parsing
  - Normal vector extraction
  - Polygon triangulation
  - Bounding box computation
  - Multi-object support

### 4. DXF (.dxf)
- **Full Name**: AutoCAD Drawing Exchange Format
- **Best For**: 2D technical drawings
- **Features Supported**:
  - Line and polyline extraction
  - 2D to 3D extrusion
  - Entity parsing
  - Coordinate extraction
  - Layer support

## Installation & Setup

### Prerequisites

```bash
npm install opencascade.js@beta three @types/three
```

### Configuration

The Next.js configuration has been updated to support WebAssembly modules:

```javascript
// next.config.js
webpack: (config, { isServer }) => {
  config.experiments = {
    ...config.experiments,
    asyncWebAssembly: true,
    layers: true,
  };
  
  config.module.rules.push({
    test: /\.wasm$/,
    type: 'webassembly/async',
  });

  return config;
}
```

## Usage

### Basic File Upload

```typescript
import CADPreview3D from '@/components/CADPreview3D';

function MyComponent() {
  const [file, setFile] = useState<File | null>(null);

  return (
    <div>
      <input 
        type="file" 
        accept=".step,.stp,.stl,.obj,.dxf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      
      {file && <CADPreview3D file={file} showStats={true} />}
    </div>
  );
}
```

### Parsing CAD Files

```typescript
import { getCADParser, CADModelData } from '@/lib/cad-parser';

async function parseCADFile(file: File): Promise<CADModelData> {
  const parser = getCADParser();
  await parser.initialize(); // Initialize OpenCascade.js
  
  const modelData = await parser.parseFile(file);
  
  return modelData;
}
```

### Analyzing Model Data

```typescript
import { analyzeModel, extractSpecs } from '@/lib/cad-analyzer-utils';

const modelData = await parseCADFile(file);

// Get comprehensive analysis
const analysis = analyzeModel(modelData, 'steel');

console.log('Volume:', analysis.totalVolume);
console.log('Surface Area:', analysis.totalSurfaceArea);
console.log('Dimensions:', analysis.boundingBoxDimensions);
console.log('Complexity:', analysis.complexity);
console.log('Estimated Weight:', analysis.estimatedWeight);

// Extract specifications
const specs = extractSpecs(modelData, 'Steel');
console.log(specs);
// {
//   dimensions: "200mm × 100mm × 50mm",
//   material: "Steel",
//   complexity: "Moderate",
//   parts: "3",
//   volume: "1000000 mm³",
//   estimatedWeight: "7.85 kg"
// }
```

## Components

### CADPreview3D

Enhanced 3D preview component with Three.js rendering.

**Props:**
- `file?: File` - CAD file to preview
- `modelData?: CADModelData` - Pre-parsed model data
- `className?: string` - Additional CSS classes
- `showStats?: boolean` - Show geometry statistics (default: true)

**Features:**
- Interactive 3D rotation (left-click + drag)
- Pan camera (right-click + drag)
- Zoom (scroll wheel)
- Fullscreen mode
- Wireframe toggle
- Real-time statistics display

**Example:**
```tsx
<CADPreview3D 
  file={cadFile}
  showStats={true}
  className="w-full h-96"
/>
```

### CADAnalyzer / CADAnalyzer

Updated file upload components with CAD format support.

**Supported Upload Formats:**
- PDF, PNG, JPG (existing)
- STEP (.step, .stp)
- STL (.stl)
- OBJ (.obj)
- DXF (.dxf)

**Max File Size:** 10MB (configurable)

## API Reference

### CADParser

Main class for parsing CAD files.

```typescript
class CADParser {
  // Initialize OpenCascade.js
  async initialize(): Promise<void>
  
  // Parse specific formats
  async parseSTEP(fileContent: ArrayBuffer): Promise<CADModelData>
  async parseSTL(fileContent: ArrayBuffer): Promise<CADModelData>
  async parseOBJ(fileContent: ArrayBuffer): Promise<CADModelData>
  async parseDXF(fileContent: ArrayBuffer): Promise<CADModelData>
  
  // Auto-detect format and parse
  async parseFile(file: File): Promise<CADModelData>
  
  // Cleanup resources
  dispose(): void
}

// Get singleton instance
const parser = getCADParser();
```

### CADModelData

```typescript
interface CADModelData {
  vertices: Float32Array;           // Vertex positions (x, y, z)
  normals: Float32Array;            // Normal vectors
  indices: Uint32Array;             // Triangle indices
  faces: number;                    // Number of faces
  edges: number;                    // Number of edges
  vertices_count: number;           // Number of vertices
  boundingBox: {                    // 3D bounding box
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  volume?: number;                  // Model volume (mm³)
  surfaceArea?: number;             // Surface area (mm²)
  parts: CADPart[];                // Model parts/components
}
```

### CADPart

```typescript
interface CADPart {
  id: string;                      // Unique identifier
  name: string;                    // Part name
  type: 'solid' | 'face' | 'edge' | 'vertex';
  volume?: number;                 // Part volume (mm³)
  surfaceArea?: number;            // Part surface area (mm²)
  mass?: number;                   // Part mass
  centerOfMass?: { x: number; y: number; z: number };
  boundingBox: {                   // Part bounding box
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
}
```

## Utility Functions

### Model Analysis

```typescript
import {
  calculateDimensions,
  estimateComplexity,
  calculateCenterOfMass,
  estimateWeight,
  analyzeModel,
} from '@/lib/cad-analyzer-utils';

// Calculate bounding box dimensions
const dimensions = calculateDimensions(modelData);
// { width: 200, height: 100, depth: 50 }

// Estimate complexity
const complexity = estimateComplexity(modelData);
// 'simple' | 'moderate' | 'complex'

// Calculate center of mass
const com = calculateCenterOfMass(modelData);
// { x: 100, y: 50, z: 25 }

// Estimate weight (with material)
const weight = estimateWeight(volume, 'steel');
// Weight in grams

// Comprehensive analysis
const analysis = analyzeModel(modelData, 'aluminum');
```

### Formatting Functions

```typescript
import {
  formatDimensions,
  formatVolume,
  formatSurfaceArea,
  formatWeight,
} from '@/lib/cad-analyzer-utils';

formatDimensions({ width: 200, height: 100, depth: 50 });
// "200.0mm × 100.0mm × 50.0mm"

formatVolume(1000000);
// "1.00 L"

formatSurfaceArea(50000);
// "500.00 cm²"

formatWeight(7850);
// "7.85 kg"
```

### Validation

```typescript
import { validateCADFile, is3DCADFile } from '@/lib/cad-analyzer-utils';

// Check if file is 3D CAD format
if (is3DCADFile(file.name)) {
  // Process file
}

// Validate file before processing
const validation = validateCADFile(file);
if (!validation.valid) {
  console.error(validation.error);
}
```

## Demo Page

Visit `/cad-preview-demo` to see the interactive demo with:
- File upload with drag & drop
- Real-time 3D preview
- Interactive controls (rotate, zoom, pan)
- Parts information display
- Model statistics
- Feature showcase

## 3D Controls

### Mouse Controls
- **Left Click + Drag**: Rotate model
- **Right Click + Drag**: Pan camera
- **Scroll Wheel**: Zoom in/out

### Buttons
- **Reset View**: Return to initial camera position
- **Toggle Wireframe**: Switch between solid and wireframe view
- **Fullscreen**: Enter/exit fullscreen mode

## Performance Considerations

### File Size Limits
- **Recommended**: < 10MB for smooth performance
- **Maximum**: 50MB (demo page)
- **Optimal**: < 5MB for instant loading

### Complexity Guidelines
- **Simple Models** (< 10,000 faces): Real-time rendering
- **Moderate Models** (10,000 - 50,000 faces): Smooth with minor delays
- **Complex Models** (> 50,000 faces): May experience loading delays

### Browser Support
- **Chrome/Edge**: Full support ✅
- **Firefox**: Full support ✅
- **Safari**: WebAssembly support required ✅
- **Mobile**: Limited support (iOS Safari, Chrome Android)

## Troubleshooting

### OpenCascade.js fails to load
**Issue**: WASM module not loading  
**Solution**: Ensure webpack configuration includes async WebAssembly support

### File parsing errors
**Issue**: "Failed to parse STEP file"  
**Solution**: 
- Verify file is valid STEP format
- Check file isn't corrupted
- Try exporting from CAD software with different settings

### Slow rendering
**Issue**: 3D preview is laggy  
**Solution**:
- Reduce model complexity in source CAD software
- Enable wireframe mode
- Use simpler STL export instead of STEP

### Memory issues
**Issue**: Browser crashes with large files  
**Solution**:
- Reduce file size before upload
- Close other browser tabs
- Use desktop CAD software for very large models

## Examples

### Complete Upload Flow

```typescript
import { useState } from 'react';
import { getCADParser } from '@/lib/cad-parser';
import { analyzeModel, generateModelSummary } from '@/lib/cad-analyzer-utils';
import CADPreview3D from '@/components/CADPreview3D';

function CADUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleFileUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setLoading(true);

    try {
      // Parse the file
      const parser = getCADParser();
      const modelData = await parser.parseFile(uploadedFile);

      // Analyze the model
      const modelAnalysis = analyzeModel(modelData, 'steel');
      setAnalysis(modelAnalysis);

      // Generate summary
      const summary = generateModelSummary(modelData, uploadedFile.name, 'Steel');
      console.log(summary);
    } catch (error) {
      console.error('Failed to process file:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".step,.stp,.stl,.obj,.dxf"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
      />

      {loading && <p>Processing...</p>}
      
      {file && !loading && (
        <>
          <CADPreview3D file={file} showStats={true} />
          
          {analysis && (
            <div>
              <h3>Analysis Results</h3>
              <p>Volume: {analysis.totalVolume.toFixed(2)} mm³</p>
              <p>Weight: {analysis.estimatedWeight?.toFixed(2)} g</p>
              <p>Complexity: {analysis.complexity}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

## Resources

- [OpenCascade.js Documentation](https://ocjs.org/docs/about)
- [Three.js Documentation](https://threejs.org/docs/)
- [STEP Format Specification](https://www.iso.org/standard/63141.html)
- [STL Format Guide](https://en.wikipedia.org/wiki/STL_(file_format))

## License

This implementation uses:
- OpenCascade.js (LGPL-2.1)
- Three.js (MIT)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the examples
3. Visit the demo page at `/cad-preview-demo`
4. Contact the development team

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Maintained By**: SteelSmart Development Team



