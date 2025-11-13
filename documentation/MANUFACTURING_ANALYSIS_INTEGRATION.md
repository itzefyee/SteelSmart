# Manufacturing Analysis Integration

## Overview

The CAD Parser now includes comprehensive manufacturing-critical information extraction capabilities. When a 3D model is parsed (STEP, STL, etc.), the system automatically analyzes manufacturing features and compliance with industry standards (AISC, AWS, ASTM).

## Architecture

```
CAD File → CAD Parser → Manufacturing Analyzer → CAD Model Data
                                                         ↓
                                              Compliance Checker
                                                         ↓
                                              Compliance Report
```

## Features Extracted

### 1. Bounding Box with AISC 303 Tolerances
- Length, width, height dimensions
- Min/max coordinates
- Manufacturing tolerances per AISC 303 Section 6
- ±1/8" for ≤10 ft, then ±1/8" per 10 ft

### 2. Hole Detection & Analysis
- **Cylindrical face detection** - Identifies all holes in the model
- **Standard drill size checking** - Compares against common fractional sizes
- **Edge distance compliance** - AISC 360 Table J3.4
  - Rolled edges: 1.25 × diameter
  - Sheared edges: 1.75 × diameter
- **Hole spacing** - AISC 360 Section J3.3
  - Minimum: 2⅔ × diameter
  - Preferred: 3 × diameter
- **Non-standard size warnings** - Flags holes requiring special tooling

### 3. Material Thickness Analysis
- Estimated thickness from volume/surface area ratio
- Standard gauge checking
- Minimum weld size calculation (AISC 360 Table J2.4)
- Maximum weld size calculation
- Preheat requirement flag (thickness > 1")

### 4. Edge Analysis
- Straight edge detection with direction vectors
- Circular edge detection (fillets, rounds)
- Sharp corner warnings (radius < 1/8")
- Stress concentration risk assessment
- Manufacturing difficulty warnings

### 5. Weld Joint Analysis
- Adjacent face detection
- Joint type classification:
  - T-joint (90° angle)
  - Butt-joint (180° angle)
  - Corner-joint
  - Acute-corner (< 60°, difficult to weld)
- Weld accessibility assessment
- AWS D1.1 compliance checking (60° minimum included angle)
- Clearance requirements (3" minimum for torch access)

### 6. Bend Analysis
- Curved edge detection for potential bends
- Minimum bend radius calculation by material grade:
  - A36: 1.5 × thickness
  - A572: 2.0 × thickness
  - A588: 2.5 × thickness
  - A992: 1.5 × thickness
- Bend compliance checking
- Formability warnings

## Usage Examples

### Basic Usage - Parse a CAD File

```typescript
import { getCADParser } from '@/lib/cad-parser';

// Parse a STEP file
const parser = getCADParser();
await parser.initialize();

const file = /* File object from upload */;
const cadModel = await parser.parseFile(file);

// Access manufacturing analysis data
console.log('Holes detected:', cadModel.holeAnalysis?.count);
console.log('Estimated thickness:', cadModel.thicknessAnalysis?.estimatedThickness);
console.log('Edge analysis:', cadModel.edgeAnalysis?.warnings);
console.log('Weld joints:', cadModel.weldJointAnalysis?.totalJoints);
console.log('Bend violations:', cadModel.bendAnalysis?.violations);
```

### Integration with Compliance Checker

```typescript
import { ComplianceChecker } from '@/lib/compliance-checker';
import { getCADParser } from '@/lib/cad-parser';

// Parse the model
const parser = getCADParser();
await parser.initialize();
const cadModel = await parser.parseFile(file);

// Run compliance checking
const checker = ComplianceChecker.fromCADModel(cadModel, {
  materialGrade: 'A36',
  edgeType: 'sheared',
  ambientTemp: 50, // °F
  weldType: 'fillet'
});

const results = checker.checkAll();
const report = checker.generateReport();

console.log('Compliance Status:', report.summary.overallStatus);
console.log('Score:', report.summary.complianceScore);
console.log('Violations:', report.violations);
console.log('Warnings:', report.warnings);
```

### Detailed Analysis Results

```typescript
// Bounding box with tolerances
const bbox = cadModel.boundingBoxWithTolerance;
console.log(`Dimensions: ${bbox.length}" × ${bbox.width}" × ${bbox.height}"`);
console.log(`Tolerance: ±${bbox.tolerance}"`);

// Hole analysis
const holes = cadModel.holeAnalysis;
holes?.holes.forEach((hole, i) => {
  console.log(`Hole #${i + 1}:`);
  console.log(`  Center: (${hole.center.x}, ${hole.center.y}, ${hole.center.z})`);
  console.log(`  Diameter: ${hole.diameter}"`);
  console.log(`  Standard size: ${hole.isStandardSize}`);
});

// Edge distance violations
holes?.edgeDistances.forEach((ed) => {
  console.log(`Hole #${ed.holeIndex + 1} edge distance: ${ed.minEdgeDistance}"`);
  console.log(`  Rolled edge compliant: ${ed.compliance.rolled}`);
  console.log(`  Sheared edge compliant: ${ed.compliance.sheared}`);
});

// Spacing violations
holes?.spacingViolations.forEach((sv) => {
  console.log(`Spacing violation between holes #${sv.hole1 + 1} and #${sv.hole2 + 1}`);
  console.log(`  Actual: ${sv.actual}", Required: ${sv.minimum}"`);
});

// Thickness analysis
const thickness = cadModel.thicknessAnalysis;
console.log(`Estimated thickness: ${thickness?.estimatedThickness}"`);
console.log(`Standard gauge: ${thickness?.isStandardGauge}`);
console.log(`Min weld size: ${thickness?.minWeldSize}"`);
console.log(`Requires preheat: ${thickness?.requiresPreheat}`);

// Weld joint analysis
const welds = cadModel.weldJointAnalysis;
welds?.joints.forEach((joint, i) => {
  console.log(`Joint #${i + 1}:`);
  console.log(`  Type: ${joint.type}`);
  console.log(`  Angle: ${joint.angle}°`);
  console.log(`  Accessible: ${joint.accessible}`);
  console.log(`  AWS compliant: ${joint.meetsAWSRequirement}`);
});

// Bend analysis
const bends = cadModel.bendAnalysis;
console.log(`Total bends: ${bends?.totalBends}`);
console.log(`Violations: ${bends?.violations}`);
console.log(`Min bend radius for ${bends?.materialGrade}: ${bends?.minBendRadius}"`);
```

## Standards Referenced

### AISC (American Institute of Steel Construction)
- **AISC 303** - Code of Standard Practice
  - Section 6: Dimensional Tolerances
- **AISC 360** - Specification for Structural Steel Buildings
  - Table J3.4: Minimum Edge Distance
  - Section J3.3: Minimum Spacing of Bolts
  - Table J2.4: Minimum Fillet Weld Size

### AWS (American Welding Society)
- **AWS D1.1** - Structural Welding Code - Steel
  - Section 3: Prequalified Joint Details
  - Table 3.2: Preheat and Interpass Temperature
  - Accessibility requirements
  - Minimum included angle (60°)

### ASTM (American Society for Testing and Materials)
- **ASTM A36** - Standard Specification for Carbon Structural Steel
- **ASTM A572** - High-Strength Low-Alloy Columbium-Vanadium Steel
- **ASTM A588** - High-Strength Low-Alloy Structural Steel
- **ASTM A992** - Structural Steel Shapes

## Data Structures

### CADModelData (Extended)

```typescript
interface CADModelData {
  // Standard geometry data
  vertices: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
  faces: number;
  edges: number;
  vertices_count: number;
  boundingBox: BoundingBox;
  volume?: number;
  surfaceArea?: number;
  parts: CADPart[];

  // Manufacturing analysis data (NEW)
  boundingBoxWithTolerance?: BoundingBoxWithTolerance;
  holeAnalysis?: HoleAnalysis;
  thicknessAnalysis?: ThicknessAnalysis;
  edgeAnalysis?: EdgeAnalysis;
  weldJointAnalysis?: WeldJointAnalysis;
  bendAnalysis?: BendAnalysis;
}
```

### HoleAnalysis

```typescript
interface HoleAnalysis {
  holes: HoleInfo[];
  count: number;
  edgeDistances: EdgeDistanceInfo[];
  spacingViolations: SpacingViolation[];
  nonStandardSizes: NonStandardSize[];
}
```

### ThicknessAnalysis

```typescript
interface ThicknessAnalysis {
  estimatedThickness: number;
  minDimension: number;
  samples: number[];
  isStandardGauge: boolean;
  minWeldSize: number;
  maxWeldSize: number;
  requiresPreheat: boolean;
}
```

### EdgeAnalysis

```typescript
interface EdgeAnalysis {
  edges: EdgeInfo[];
  totalEdges: number;
  sharpCorners: SharpCorner[];
  warnings: string[];
}
```

### WeldJointAnalysis

```typescript
interface WeldJointAnalysis {
  joints: WeldJoint[];
  totalJoints: number;
  accessibilityIssues: number;
  recommendations: WeldRecommendation[];
}
```

### BendAnalysis

```typescript
interface BendAnalysis {
  bends: BendInfo[];
  totalBends: number;
  violations: number;
  materialGrade: string;
  minBendRadius: number;
}
```

## Performance Considerations

- Manufacturing analysis adds ~500ms-2s to parse time depending on model complexity
- Analysis is performed asynchronously with error handling
- If analysis fails, model parsing continues (manufacturing data will be undefined)
- Large models (>10,000 faces) may take longer to analyze

## Error Handling

```typescript
try {
  const cadModel = await parser.parseFile(file);

  if (cadModel.holeAnalysis) {
    // Analysis succeeded
    console.log('Manufacturing analysis complete');
  } else {
    // Analysis failed or not applicable
    console.warn('Manufacturing analysis unavailable');
  }
} catch (error) {
  console.error('Failed to parse file:', error);
}
```

## Limitations

1. **Hole detection** works best with STEP files containing explicit cylindrical surfaces
2. **STL files** (mesh-based) may not detect holes accurately as they lack explicit surface definitions
3. **Thickness estimation** assumes uniform thickness; complex shapes may have inaccurate estimates
4. **Weld joint detection** requires adjacent face analysis; may miss some joint types
5. **Material properties** must be specified; defaults to A36 steel

## Future Enhancements

- [ ] Multi-material support
- [ ] Custom tolerance specifications
- [ ] Export compliance reports to PDF
- [ ] Integration with CAD preview UI
- [ ] Real-time visualization of violations
- [ ] Support for metric units
- [ ] Database of common manufacturing processes
- [ ] Cost estimation based on manufacturing complexity

## Contributing

When extending the manufacturing analysis:

1. Add new analysis types to `ManufacturingAnalyzer` class
2. Extend `CADModelData` interface with new data structures
3. Update compliance checker to use new data
4. Add standards references to `standards-database.ts`
5. Document the new feature in this file

## References

- AISC Steel Construction Manual (15th Edition)
- AWS D1.1 Structural Welding Code - Steel (2020)
- ASTM Standards (www.astm.org)
- OpenCascade.js Documentation
