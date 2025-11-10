import { CADModelData, CADPart } from './cad-parser';

/**
 * Utility functions for CAD model analysis
 */

export interface ModelAnalysis {
  totalVolume: number;
  totalSurfaceArea: number;
  boundingBoxDimensions: {
    width: number;
    height: number;
    depth: number;
  };
  centerOfMass?: {
    x: number;
    y: number;
    z: number;
  };
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedWeight?: number; // in grams, assumes steel density
}

/**
 * Calculate bounding box dimensions
 */
export function calculateDimensions(modelData: CADModelData): {
  width: number;
  height: number;
  depth: number;
} {
  const { boundingBox } = modelData;
  return {
    width: boundingBox.max.x - boundingBox.min.x,
    height: boundingBox.max.y - boundingBox.min.y,
    depth: boundingBox.max.z - boundingBox.min.z,
  };
}

/**
 * Estimate model complexity based on geometry
 */
export function estimateComplexity(modelData: CADModelData): 'simple' | 'moderate' | 'complex' {
  const { faces, edges, vertices_count, parts } = modelData;
  
  // Calculate complexity score
  const geometryScore = faces * 0.3 + edges * 0.2 + vertices_count * 0.1;
  const partsScore = parts.length * 100;
  const totalScore = geometryScore + partsScore;

  if (totalScore < 500) return 'simple';
  if (totalScore < 2000) return 'moderate';
  return 'complex';
}

/**
 * Calculate center of mass (simplified, assumes uniform density)
 */
export function calculateCenterOfMass(modelData: CADModelData): {
  x: number;
  y: number;
  z: number;
} {
  const { vertices } = modelData;
  let sumX = 0, sumY = 0, sumZ = 0;
  const count = vertices.length / 3;

  for (let i = 0; i < vertices.length; i += 3) {
    sumX += vertices[i];
    sumY += vertices[i + 1];
    sumZ += vertices[i + 2];
  }

  return {
    x: sumX / count,
    y: sumY / count,
    z: sumZ / count,
  };
}

/**
 * Estimate weight assuming steel material (density: 7850 kg/m³ = 0.007850 g/mm³)
 */
export function estimateWeight(volume: number, material: 'steel' | 'aluminum' | 'plastic' = 'steel'): number {
  const densities = {
    steel: 0.007850,      // g/mm³
    aluminum: 0.002700,   // g/mm³
    plastic: 0.001200,    // g/mm³ (average for ABS)
  };

  return volume * densities[material];
}

/**
 * Perform comprehensive analysis of a CAD model
 */
export function analyzeModel(modelData: CADModelData, material: 'steel' | 'aluminum' | 'plastic' = 'steel'): ModelAnalysis {
  const dimensions = calculateDimensions(modelData);
  const complexity = estimateComplexity(modelData);
  const centerOfMass = calculateCenterOfMass(modelData);

  const analysis: ModelAnalysis = {
    totalVolume: modelData.volume || 0,
    totalSurfaceArea: modelData.surfaceArea || 0,
    boundingBoxDimensions: dimensions,
    complexity,
    centerOfMass,
  };

  // Add weight estimate if volume is available
  if (modelData.volume && modelData.volume > 0) {
    analysis.estimatedWeight = estimateWeight(modelData.volume, material);
  }

  return analysis;
}

/**
 * Format dimensions for display
 */
export function formatDimensions(dimensions: { width: number; height: number; depth: number }): string {
  return `${dimensions.width.toFixed(1)}mm × ${dimensions.height.toFixed(1)}mm × ${dimensions.depth.toFixed(1)}mm`;
}

/**
 * Format volume for display
 */
export function formatVolume(volume: number): string {
  if (volume < 1000) {
    return `${volume.toFixed(2)} mm³`;
  } else if (volume < 1000000) {
    return `${(volume / 1000).toFixed(2)} cm³`;
  } else {
    return `${(volume / 1000000).toFixed(2)} L`;
  }
}

/**
 * Format surface area for display
 */
export function formatSurfaceArea(area: number): string {
  if (area < 100) {
    return `${area.toFixed(2)} mm²`;
  } else if (area < 1000000) {
    return `${(area / 100).toFixed(2)} cm²`;
  } else {
    return `${(area / 1000000).toFixed(2)} m²`;
  }
}

/**
 * Format weight for display
 */
export function formatWeight(weight: number): string {
  if (weight < 1000) {
    return `${weight.toFixed(2)} g`;
  } else {
    return `${(weight / 1000).toFixed(2)} kg`;
  }
}

/**
 * Extract technical specifications from model data
 */
export function extractSpecs(modelData: CADModelData, material: string = 'Steel'): Record<string, string> {
  const dimensions = calculateDimensions(modelData);
  const analysis = analyzeModel(modelData);

  const specs: Record<string, string> = {
    dimensions: formatDimensions(dimensions),
    material: material,
    complexity: analysis.complexity.charAt(0).toUpperCase() + analysis.complexity.slice(1),
    parts: modelData.parts.length.toString(),
    vertices: modelData.vertices_count.toLocaleString(),
    faces: modelData.faces.toLocaleString(),
  };

  if (modelData.volume) {
    specs.volume = formatVolume(modelData.volume);
  }

  if (modelData.surfaceArea) {
    specs.surfaceArea = formatSurfaceArea(modelData.surfaceArea);
  }

  if (analysis.estimatedWeight) {
    specs.estimatedWeight = formatWeight(analysis.estimatedWeight);
  }

  return specs;
}

/**
 * Check if a file is a 3D CAD format
 */
export function is3DCADFile(filename: string): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  return ['step', 'stp', 'stl', 'obj', 'dxf'].includes(extension || '');
}

/**
 * Get file format display name
 */
export function getFileFormatName(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  const formats: Record<string, string> = {
    'step': 'STEP (ISO 10303)',
    'stp': 'STEP (ISO 10303)',
    'stl': 'STL (Stereolithography)',
    'obj': 'OBJ (Wavefront)',
    'dxf': 'DXF (AutoCAD)',
  };
  return formats[extension || ''] || extension?.toUpperCase() || 'Unknown';
}

/**
 * Validate CAD file before processing
 */
export function validateCADFile(file: File): { valid: boolean; error?: string } {
  // Check file size (max 50MB)
  if (file.size > 50 * 1024 * 1024) {
    return {
      valid: false,
      error: 'File size exceeds 50MB limit',
    };
  }

  // Check file extension
  if (!is3DCADFile(file.name)) {
    return {
      valid: false,
      error: 'Unsupported file format. Please use STEP, STL, OBJ, or DXF files.',
    };
  }

  return { valid: true };
}

/**
 * Generate a summary report for a CAD model
 */
export function generateModelSummary(modelData: CADModelData, filename: string, material: string = 'Steel'): string {
  const analysis = analyzeModel(modelData, material as any);
  const dimensions = calculateDimensions(modelData);

  let summary = `CAD Model Analysis Report\n`;
  summary += `=========================\n\n`;
  summary += `File: ${filename}\n`;
  summary += `Format: ${getFileFormatName(filename)}\n\n`;
  
  summary += `Geometry:\n`;
  summary += `  - Vertices: ${modelData.vertices_count.toLocaleString()}\n`;
  summary += `  - Faces: ${modelData.faces.toLocaleString()}\n`;
  summary += `  - Edges: ${modelData.edges.toLocaleString()}\n`;
  summary += `  - Parts: ${modelData.parts.length}\n\n`;
  
  summary += `Dimensions:\n`;
  summary += `  - Width: ${dimensions.width.toFixed(2)} mm\n`;
  summary += `  - Height: ${dimensions.height.toFixed(2)} mm\n`;
  summary += `  - Depth: ${dimensions.depth.toFixed(2)} mm\n\n`;
  
  if (modelData.volume) {
    summary += `Volume: ${formatVolume(modelData.volume)}\n`;
  }
  
  if (modelData.surfaceArea) {
    summary += `Surface Area: ${formatSurfaceArea(modelData.surfaceArea)}\n`;
  }
  
  if (analysis.estimatedWeight) {
    summary += `Estimated Weight (${material}): ${formatWeight(analysis.estimatedWeight)}\n`;
  }
  
  summary += `\nComplexity: ${analysis.complexity}\n`;
  
  if (modelData.parts.length > 0) {
    summary += `\nParts:\n`;
    modelData.parts.forEach((part, index) => {
      summary += `  ${index + 1}. ${part.name} (${part.type})\n`;
      if (part.volume) {
        summary += `     Volume: ${formatVolume(part.volume)}\n`;
      }
    });
  }

  return summary;
}


