# 📐 Generate 2D Views from 3D CAD Files

## Overview

Yes! You can extract 2D orthographic views (top, front, side, bottom, left, right) from 3D STEP files. This is useful for:
- Manufacturing drawings
- Quality inspection
- Documentation
- AI analysis (send multiple angles to Gemini)

---

## 🎨 Approach 1: Using Three.js (Client-Side) ⭐ RECOMMENDED

### How It Works
1. Parse STEP file with OpenCascade.js
2. Load geometry into Three.js scene
3. Position camera at different angles
4. Render to canvas
5. Export as PNG/JPG images

### Implementation

**Create**: `Metalyze/src/lib/cad-view-generator.ts`

```typescript
import * as THREE from 'three';
import { CADModelData } from './cad-parser';

export interface ViewOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  showGrid?: boolean;
  showAxes?: boolean;
}

export interface GeneratedView {
  name: string;
  dataUrl: string; // base64 PNG
  blob: Blob;
}

export class CADViewGenerator {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private mesh: THREE.Mesh | null = null;

  constructor(private options: ViewOptions = {}) {
    const width = options.width || 800;
    const height = options.height || 600;

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(
      options.backgroundColor || '#ffffff'
    );

    // Create orthographic camera
    const aspect = width / height;
    const frustumSize = 10;
    this.camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000
    );

    // Create renderer (offscreen)
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true, // Required for toDataURL
    });
    this.renderer.setSize(width, height);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    this.scene.add(directionalLight);

    // Optional: Add grid
    if (options.showGrid) {
      const gridHelper = new THREE.GridHelper(20, 20);
      this.scene.add(gridHelper);
    }

    // Optional: Add axes
    if (options.showAxes) {
      const axesHelper = new THREE.AxesHelper(5);
      this.scene.add(axesHelper);
    }
  }

  /**
   * Load CAD model data into the scene
   */
  loadModel(modelData: CADModelData): void {
    // Remove existing mesh
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      if (Array.isArray(this.mesh.material)) {
        this.mesh.material.forEach((m) => m.dispose());
      } else {
        this.mesh.material.dispose();
      }
    }

    // Create geometry from CAD data
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(modelData.vertices, 3)
    );
    geometry.setAttribute(
      'normal',
      new THREE.BufferAttribute(modelData.normals, 3)
    );
    geometry.setIndex(new THREE.BufferAttribute(modelData.indices, 1));

    // Create material
    const material = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.5,
      roughness: 0.5,
      side: THREE.DoubleSide,
    });

    // Create mesh
    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);

    // Center and fit model
    this.fitCameraToModel();
  }

  /**
   * Fit camera to show entire model
   */
  private fitCameraToModel(): void {
    if (!this.mesh) return;

    // Calculate bounding box
    const box = new THREE.Box3().setFromObject(this.mesh);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Center model
    this.mesh.position.sub(center);

    // Adjust camera frustum to fit model
    const maxDim = Math.max(size.x, size.y, size.z);
    const aspect = this.renderer.domElement.width / this.renderer.domElement.height;
    
    this.camera.left = (-maxDim * aspect) / 2;
    this.camera.right = (maxDim * aspect) / 2;
    this.camera.top = maxDim / 2;
    this.camera.bottom = -maxDim / 2;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Generate view from specific angle
   */
  private generateView(
    name: string,
    cameraPosition: THREE.Vector3,
    cameraUp: THREE.Vector3
  ): GeneratedView {
    // Position camera
    this.camera.position.copy(cameraPosition);
    this.camera.up.copy(cameraUp);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();

    // Render
    this.renderer.render(this.scene, this.camera);

    // Get image data
    const dataUrl = this.renderer.domElement.toDataURL('image/png');

    // Convert to blob
    const base64Data = dataUrl.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    return { name, dataUrl, blob };
  }

  /**
   * Generate all standard orthographic views
   */
  generateAllViews(): GeneratedView[] {
    const views: GeneratedView[] = [];
    const distance = 20; // Camera distance from origin

    // Top view (looking down -Y axis)
    views.push(
      this.generateView(
        'top',
        new THREE.Vector3(0, distance, 0),
        new THREE.Vector3(0, 0, -1)
      )
    );

    // Bottom view (looking up +Y axis)
    views.push(
      this.generateView(
        'bottom',
        new THREE.Vector3(0, -distance, 0),
        new THREE.Vector3(0, 0, 1)
      )
    );

    // Front view (looking from +Z axis)
    views.push(
      this.generateView(
        'front',
        new THREE.Vector3(0, 0, distance),
        new THREE.Vector3(0, 1, 0)
      )
    );

    // Back view (looking from -Z axis)
    views.push(
      this.generateView(
        'back',
        new THREE.Vector3(0, 0, -distance),
        new THREE.Vector3(0, 1, 0)
      )
    );

    // Right view (looking from +X axis)
    views.push(
      this.generateView(
        'right',
        new THREE.Vector3(distance, 0, 0),
        new THREE.Vector3(0, 1, 0)
      )
    );

    // Left view (looking from -X axis)
    views.push(
      this.generateView(
        'left',
        new THREE.Vector3(-distance, 0, 0),
        new THREE.Vector3(0, 1, 0)
      )
    );

    return views;
  }

  /**
   * Generate specific views (e.g., only top, front, right)
   */
  generateViews(viewNames: string[]): GeneratedView[] {
    const allViews = this.generateAllViews();
    return allViews.filter((view) => viewNames.includes(view.name));
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      if (Array.isArray(this.mesh.material)) {
        this.mesh.material.forEach((m) => m.dispose());
      } else {
        this.mesh.material.dispose();
      }
    }
    this.renderer.dispose();
  }
}
```

---

## 🔧 Usage Example

### In CAD Analyzer Component

**Update**: `Metalyze/src/app/cad-analyzer/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { CADParser } from '@/lib/cad-parser';
import { CADViewGenerator, GeneratedView } from '@/lib/cad-view-generator';

export default function CADAnalyzerPage() {
  const [views, setViews] = useState<GeneratedView[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (file: File) => {
    setLoading(true);

    try {
      // 1. Parse STEP file
      const parser = new CADParser();
      await parser.initialize();

      const fileBuffer = await file.arrayBuffer();
      const modelData = await parser.parseSTEP(fileBuffer);

      // 2. Generate 2D views
      const viewGenerator = new CADViewGenerator({
        width: 800,
        height: 600,
        backgroundColor: '#f5f5f5',
        showGrid: true,
      });

      viewGenerator.loadModel(modelData);

      // Generate all 6 views (or specific ones)
      const generatedViews = viewGenerator.generateAllViews();
      // OR: const generatedViews = viewGenerator.generateViews(['top', 'front', 'right']);

      setViews(generatedViews);

      // 3. Optional: Send views to Gemini AI for analysis
      await analyzeWithMultipleViews(generatedViews);

      // Cleanup
      viewGenerator.dispose();
    } catch (error) {
      console.error('Error generating views:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeWithMultipleViews = async (views: GeneratedView[]) => {
    // Send all views to Gemini for comprehensive analysis
    const formData = new FormData();
    
    views.forEach((view) => {
      formData.append(`view_${view.name}`, view.blob, `${view.name}.png`);
    });

    const response = await fetch('/api/analyze-drawing-multiview', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    console.log('Multi-view analysis:', result);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">CAD Analyzer</h1>

      <input
        type="file"
        accept=".step,.stp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
      />

      {loading && <p>Generating views...</p>}

      {/* Display generated views */}
      <div className="grid grid-cols-3 gap-4 mt-8">
        {views.map((view) => (
          <div key={view.name} className="border p-4">
            <h3 className="font-bold mb-2 capitalize">{view.name} View</h3>
            <img src={view.dataUrl} alt={`${view.name} view`} className="w-full" />
            <a
              href={view.dataUrl}
              download={`${view.name}-view.png`}
              className="text-blue-600 text-sm mt-2 inline-block"
            >
              Download
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🤖 Approach 2: Send Multiple Views to Gemini AI

### Enhanced Analysis with Multiple Angles

**Create**: `Metalyze/src/app/api/analyze-drawing-multiview/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { geminiClient } from '@/lib/gemini-client';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Get all view images
    const views: { name: string; buffer: Buffer; type: string }[] = [];
    
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('view_') && value instanceof File) {
        const viewName = key.replace('view_', '');
        const buffer = Buffer.from(await value.arrayBuffer());
        
        views.push({
          name: viewName,
          buffer,
          type: value.type,
        });
      }
    }

    if (views.length === 0) {
      return NextResponse.json(
        { error: 'No views provided' },
        { status: 400 }
      );
    }

    // Analyze each view with Gemini
    const analyses = await Promise.all(
      views.map(async (view) => {
        const analysis = await geminiClient.analyzeDrawing(
          view.buffer,
          view.type,
          `${view.name}-view.png`
        );
        return { view: view.name, analysis };
      })
    );

    // Combine insights from all views
    const combinedAnalysis = {
      views: analyses,
      summary: {
        dimensions: extractDimensions(analyses),
        features: extractFeatures(analyses),
        confidence: calculateAverageConfidence(analyses),
      },
    };

    return NextResponse.json({
      success: true,
      data: combinedAnalysis,
    });
  } catch (error) {
    console.error('Multi-view analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}

function extractDimensions(analyses: any[]) {
  // Combine dimension data from all views
  const dimensions: any = {};
  
  analyses.forEach(({ view, analysis }) => {
    if (analysis.extractedSpecs?.dimensions) {
      dimensions[view] = analysis.extractedSpecs.dimensions;
    }
  });
  
  return dimensions;
}

function extractFeatures(analyses: any[]) {
  // Extract unique features from all views
  const features = new Set<string>();
  
  analyses.forEach(({ analysis }) => {
    if (analysis.extractedSpecs?.componentType) {
      features.add(analysis.extractedSpecs.componentType);
    }
  });
  
  return Array.from(features);
}

function calculateAverageConfidence(analyses: any[]) {
  const confidences = analyses
    .map(({ analysis }) => analysis.confidence)
    .filter((c) => typeof c === 'number');
  
  return confidences.length > 0
    ? confidences.reduce((a, b) => a + b, 0) / confidences.length
    : 0;
}
```

---

## 📊 Benefits of Multi-View Analysis

### 1. **Better Dimension Extraction**
- Top view → Length & Width
- Front view → Height & Depth
- Side view → Thickness & Profile

### 2. **Feature Detection**
- Holes visible from different angles
- Hidden features revealed
- Complex geometries understood

### 3. **Higher AI Confidence**
- Multiple perspectives = more data
- Cross-validation between views
- Reduced ambiguity

### 4. **Manufacturing Insights**
- Identify machining requirements
- Detect undercuts and draft angles
- Plan tooling access

---

## 🎯 Quick Implementation Checklist

### Phase 1: Basic View Generation
- [ ] Install Three.js: `npm install three`
- [ ] Create `cad-view-generator.ts`
- [ ] Test with sample STEP file
- [ ] Generate 6 orthographic views

### Phase 2: UI Integration
- [ ] Add "Generate Views" button to CAD analyzer
- [ ] Display views in grid layout
- [ ] Add download buttons for each view

### Phase 3: AI Integration
- [ ] Create multi-view analysis API route
- [ ] Send all views to Gemini
- [ ] Combine analysis results
- [ ] Display comprehensive report

---

## 🔍 Alternative: Server-Side Rendering

If you need server-side rendering (e.g., for API-only usage), you can use:

### Option A: Headless Three.js with node-canvas
```bash
npm install canvas three
```

### Option B: Puppeteer for screenshot
```bash
npm install puppeteer
```

### Option C: ImageMagick/GraphicsMagick
Use external tools to render views from STEP files.

---

## 📝 Example Output

```
Generated Views:
├── top.png      (800x600) - Looking down
├── bottom.png   (800x600) - Looking up
├── front.png    (800x600) - Front elevation
├── back.png     (800x600) - Back elevation
├── right.png    (800x600) - Right side
└── left.png     (800x600) - Left side
```

---

## 🚀 Next Steps

1. **Start with client-side** (Three.js approach) - easier to implement
2. **Test with your STEP files** - verify quality
3. **Integrate with Gemini** - send multiple views for analysis
4. **Add to your task list** - this could be a Phase 4 feature!

---

**This feature would significantly improve CAD analysis accuracy! 🎯**
