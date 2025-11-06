import { file } from '@kittycad/lib';

// Material densities in kg/m³
export const MATERIAL_DENSITIES = {
  steel_mild: 7850,
  steel_stainless: 8000,
  aluminum: 2700,
  brass: 8500,
  copper: 8960,
  titanium: 4500,
  iron: 7870,
  carbon_steel: 7850
} as const;

export type MaterialType = keyof typeof MATERIAL_DENSITIES;
export type FileFormat = 'obj' | 'stl' | 'step';
export type Unit = 'm' | 'cm' | 'mm' | 'in' | 'ft';

// Helper function to detect file format from filename
export function getFileFormat(filename: string): FileFormat {
  const ext = filename.toLowerCase().split('.').pop();
  switch (ext) {
    case 'obj': return 'obj';
    case 'stl': return 'stl';
    case 'step':
    case 'stp': return 'step';
    default: throw new Error(`Unsupported format: ${ext}`);
  }
}

// Convert file between formats
export async function convertFile(
  fileContent: string, // base64 encoded
  sourceFormat: FileFormat,
  targetFormat: FileFormat
) {
  if (sourceFormat === targetFormat) {
    return { [targetFormat]: fileContent };
  }

  const result = await file.create_file_conversion({
    output_format: targetFormat,
    src_format: sourceFormat,
    body: fileContent
  });

  if ('error_code' in result) {
    throw new Error((result as any).message || 'File conversion failed');
  }

  return result.outputs;
}

// Calculate mass of a 3D model
export async function calculateMass(
  fileContent: string, // base64 encoded
  sourceFormat: FileFormat,
  material: MaterialType = 'steel_mild',
  outputUnit: 'g' | 'kg' | 'lb' = 'kg'
) {
  const result = await file.create_file_mass({
    material_density: MATERIAL_DENSITIES[material],
    material_density_unit: 'kg:m3',
    output_unit: outputUnit,
    src_format: sourceFormat,
    body: fileContent
  });

  if ('error_code' in result) {
    throw new Error((result as any).message || 'Mass calculation failed');
  }

  return result.mass;
}

// Calculate volume of a 3D model
export async function calculateVolume(
  fileContent: string, // base64 encoded
  sourceFormat: FileFormat,
  outputUnit: 'm3' | 'cm3' = 'cm3'
) {
  const result = await file.create_file_volume({
    output_unit: outputUnit,
    src_format: sourceFormat,
    body: fileContent
  });

  if ('error_code' in result) {
    throw new Error((result as any).message || 'Volume calculation failed');
  }

  return result.volume;
}

// Calculate surface area of a 3D model
export async function calculateSurfaceArea(
  fileContent: string, // base64 encoded
  sourceFormat: FileFormat,
  outputUnit: 'm2' | 'cm2' | 'mm2' = 'cm2'
) {
  const result = await file.create_file_surface_area({
    output_unit: outputUnit,
    src_format: sourceFormat,
    body: fileContent
  });

  if ('error_code' in result) {
    throw new Error((result as any).message || 'Surface area calculation failed');
  }

  return result.surface_area;
}

// Get center of mass of a 3D model
export async function getCenterOfMass(
  fileContent: string, // base64 encoded
  sourceFormat: FileFormat,
  outputUnit: Unit = 'mm'
) {
  const result = await file.create_file_center_of_mass({
    output_unit: outputUnit,
    src_format: sourceFormat,
    body: fileContent
  });

  if ('error_code' in result) {
    throw new Error((result as any).message || 'Center of mass calculation failed');
  }

  return result.center_of_mass;
}

// Analyze a 3D model - get all properties at once
export async function analyzeModel(
  fileContent: string, // base64 encoded
  sourceFormat: FileFormat,
  material: MaterialType = 'steel_mild'
) {
  try {
    const [mass, volume, surfaceArea, centerOfMass] = await Promise.allSettled([
      calculateMass(fileContent, sourceFormat, material),
      calculateVolume(fileContent, sourceFormat),
      calculateSurfaceArea(fileContent, sourceFormat),
      getCenterOfMass(fileContent, sourceFormat)
    ]);

    return {
      mass: mass.status === 'fulfilled' ? mass.value : null,
      volume: volume.status === 'fulfilled' ? volume.value : null,
      surface_area: surfaceArea.status === 'fulfilled' ? surfaceArea.value : null,
      center_of_mass: centerOfMass.status === 'fulfilled' ? centerOfMass.value : null,
      material,
      density: MATERIAL_DENSITIES[material]
    };
  } catch (error) {
    console.error('Model analysis failed:', error);
    throw error;
  }
}
