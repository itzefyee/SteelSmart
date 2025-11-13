/* eslint-disable @typescript-eslint/no-explicit-any */
// OpenCascade.js doesn't provide TypeScript types, so we need to use 'any' for its APIs

import { ManufacturingAnalyzer } from './cad-manufacturing-analyzer';

export interface HoleInfo {
  center: { x: number; y: number; z: number };
  diameter: number;
  radius: number;
  axis: { x: number; y: number; z: number };
  isStandardSize: boolean;
}

export interface HoleAnalysis {
  holes: HoleInfo[];
  count: number;
  edgeDistances: EdgeDistanceInfo[];
  spacingViolations: SpacingViolation[];
  nonStandardSizes: NonStandardSize[];
}

export interface EdgeDistanceInfo {
  holeIndex: number;
  holeDiameter: number;
  minEdgeDistance: number;
  distances: {
    toXMin: number;
    toXMax: number;
    toYMin: number;
    toYMax: number;
    toZMin: number;
    toZMax: number;
  };
  compliance: {
    rolled: boolean;
    sheared: boolean;
    requiredRolled: number;
    requiredSheared: number;
    margin: number;
    standard: string;
  };
  closestEdge: string;
}

export interface SpacingViolation {
  hole1: number;
  hole2: number;
  actual: number;
  minimum: number;
  preferred: number;
  violation: string;
  standard: string;
}

export interface NonStandardSize {
  holeIndex: number;
  actual: number;
  nearest: number;
  requiresSpecialTooling: boolean;
}

export interface ThicknessAnalysis {
  estimatedThickness: number;
  minDimension: number;
  samples: number[];
  isStandardGauge: boolean;
  minWeldSize: number;
  maxWeldSize: number;
  requiresPreheat: boolean;
}

export interface EdgeInfo {
  type: 'straight' | 'circular';
  length?: number;
  direction?: { x: number; y: number; z: number };
  radius?: number;
  isSharpCorner?: boolean;
  isFillet?: boolean;
}

export interface SharpCorner {
  radius: number;
  location: { x: number; y: number; z: number };
  warning: string;
}

export interface EdgeAnalysis {
  edges: EdgeInfo[];
  totalEdges: number;
  sharpCorners: SharpCorner[];
  warnings: string[];
}

export interface WeldJoint {
  type: string;
  angle: number;
  accessible: boolean;
  minIncludedAngle: number;
  meetsAWSRequirement: boolean;
  clearanceRequired: number;
  sharedEdgeLength: number;
}

export interface WeldRecommendation {
  jointIndex: number;
  issue: string;
  recommendation: string;
  standard: string;
}

export interface WeldJointAnalysis {
  joints: WeldJoint[];
  totalJoints: number;
  accessibilityIssues: number;
  recommendations: WeldRecommendation[];
}

export interface BendInfo {
  index: number;
  radius: number;
  minRequired: number;
  compliant: boolean;
  material: string;
  thickness: number;
  margin: number;
  warning: string | null;
}

export interface BendAnalysis {
  bends: BendInfo[];
  totalBends: number;
  violations: number;
  materialGrade: string;
  minBendRadius: number;
}

export interface BoundingBoxWithTolerance {
  length: number;
  width: number;
  height: number;
  bounds: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  tolerance: number;
}

export interface CADModelData {
  vertices: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
  faces: number;
  edges: number;
  vertices_count: number;
  boundingBox: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  volume?: number;
  surfaceArea?: number;
  parts: CADPart[];
  // Manufacturing analysis data
  boundingBoxWithTolerance?: BoundingBoxWithTolerance;
  holeAnalysis?: HoleAnalysis;
  thicknessAnalysis?: ThicknessAnalysis;
  edgeAnalysis?: EdgeAnalysis;
  weldJointAnalysis?: WeldJointAnalysis;
  bendAnalysis?: BendAnalysis;
}

export interface CADPart {
  id: string;
  name: string;
  type: 'solid' | 'face' | 'edge' | 'vertex';
  volume?: number;
  surfaceArea?: number;
  mass?: number;
  centerOfMass?: { x: number; y: number; z: number };
  boundingBox: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
}

export class CADParser {
  private oc: any = null;
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Ensure we're in browser environment
    if (typeof window === 'undefined') {
      throw new Error('CAD parser can only be used in browser environment');
    }
    
    try {
      // Dynamically import OpenCascade.js - only works client-side
      const initOpenCascade = (await import('opencascade.js')).default;
      this.oc = await initOpenCascade();
      this.initialized = true;
      console.log('OpenCascade.js initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OpenCascade.js:', error);
      throw new Error('Failed to initialize CAD parser');
    }
  }

  async parseSTEP(fileContent: ArrayBuffer): Promise<CADModelData> {
    if (!this.oc) throw new Error('OpenCascade not initialized');

    const filename = 'model.step';
    let reader: any = null;
    let shape: any = null;

    try {
      // Write file to virtual filesystem
      console.log(`Writing STEP file to virtual filesystem: ${fileContent.byteLength} bytes`);
      const fileData = new Uint8Array(fileContent);
      this.oc.FS.writeFile(filename, fileData);
      console.log('STEP file written successfully');

      // Read STEP file
      console.log('Creating STEP reader...');
      reader = new this.oc.STEPControl_Reader_1();
      console.log('Reading STEP file...');
      const status = reader.ReadFile(filename);
      
      console.log('STEP ReadFile status:', status);
      console.log('Expected status (IFSelect_RetDone):', this.oc.IFSelect_ReturnStatus.IFSelect_RetDone);

      if (status !== this.oc.IFSelect_ReturnStatus.IFSelect_RetDone) {
        // Get more details about the failure
        const statusNames = Object.keys(this.oc.IFSelect_ReturnStatus);
        const statusName = statusNames.find((key: string) => 
          this.oc.IFSelect_ReturnStatus[key] === status
        ) || 'Unknown';
        
        console.error('STEP ReadFile failed:', {
          status,
          statusName,
          fileSize: fileContent.byteLength
        });
        
        // Check if file was written correctly
        const writtenData = this.oc.FS.readFile(filename);
        console.log('File verification - written size:', writtenData.length);
        console.log('File verification - first 200 bytes:', 
          new TextDecoder('utf-8', { fatal: false }).decode(writtenData.slice(0, 200))
        );
        
        throw new Error(`Failed to read STEP file. Status: ${statusName} (${status}). The file may be corrupted or incomplete.`);
      }

      console.log('STEP file read successfully, transferring roots...');
      reader.TransferRoots(new this.oc.Message_ProgressRange_1());
      
      // Check number of roots transferred
      const nbRoots = reader.NbRootsForTransfer();
      console.log(`Number of roots for transfer: ${nbRoots}`);
      
      if (nbRoots === 0) {
        throw new Error('No geometric data found in STEP file. The file may be empty or contain only metadata.');
      }

      console.log('Getting shape from STEP reader...');
      shape = reader.OneShape();
      
      if (!shape || shape.IsNull()) {
        throw new Error('STEP file contains no valid geometric shape. The file may be incomplete or contain only non-geometric data.');
      }

      console.log('Shape extracted successfully, extracting geometry...');
      // Extract geometry data
      const modelData = this.extractGeometry(shape);
      console.log('Geometry extraction completed:', {
        vertices: modelData.vertices_count,
        faces: modelData.faces,
        edges: modelData.edges
      });

      // Cleanup
      this.oc.FS.unlink(filename);
      if (shape) shape.delete();
      if (reader) reader.delete();

      return modelData;
    } catch (error: any) {
      console.error('Error parsing STEP file:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        fileSize: fileContent.byteLength
      });
      
      // Cleanup on error
      try {
        if (this.oc) {
          try { this.oc.FS.unlink(filename); } catch {}
          if (shape) try { shape.delete(); } catch {}
          if (reader) try { reader.delete(); } catch {}
        }
      } catch (cleanupError) {
        console.warn('Error during cleanup:', cleanupError);
      }
      
      throw new Error(`STEP parsing failed: ${error.message}`);
    }
  }

  async parseSTL(fileContent: ArrayBuffer): Promise<CADModelData> {
    if (!this.oc) throw new Error('OpenCascade not initialized');

    try {
      const filename = 'model.stl';
      const fileData = new Uint8Array(fileContent);
      this.oc.FS.writeFile(filename, fileData);

      // Read STL file using RWStl which returns triangulation directly
      const path = new this.oc.OSD_Path_1(filename);
      const triangulation = this.oc.RWStl.ReadFile_1(path, new this.oc.Message_ProgressRange_1());
      
      if (triangulation.IsNull()) {
        path.delete();
        throw new Error('Failed to read STL file or file is empty');
      }

      // Convert triangulation to our geometry format
      const modelData = this.extractGeometryFromTriangulation(triangulation);

      // Cleanup
      this.oc.FS.unlink(filename);
      triangulation.delete();
      path.delete();

      return modelData;
    } catch (error: any) {
      console.error('Error parsing STL file:', error);
      throw new Error(`STL parsing failed: ${error.message}`);
    }
  }

  private extractGeometryFromTriangulation(triangulation: any): CADModelData {
    if (!this.oc) throw new Error('OpenCascade not initialized');

    try {
      const vertices: number[] = [];
      const normals: number[] = [];
      const indices: number[] = [];

      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

      const nodeCount = triangulation.NbNodes();
      const triCount = triangulation.NbTriangles();

      // Extract vertices
      for (let i = 1; i <= nodeCount; i++) {
        const node = triangulation.Node(i);
        const x = node.X();
        const y = node.Y();
        const z = node.Z();
        
        vertices.push(x, y, z);
        
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        minZ = Math.min(minZ, z);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        maxZ = Math.max(maxZ, z);
      }

      // Extract triangles (faces)
      for (let i = 1; i <= triCount; i++) {
        const triangle = triangulation.Triangle(i);
        const i1 = triangle.Value(1);
        const i2 = triangle.Value(2);
        const i3 = triangle.Value(3);
        
        indices.push(i1 - 1, i2 - 1, i3 - 1); // Convert to 0-based indexing
      }

      // Calculate normals
      normals.length = vertices.length;
      normals.fill(0);

      for (let i = 0; i < indices.length; i += 3) {
        const i1 = indices[i] * 3;
        const i2 = indices[i + 1] * 3;
        const i3 = indices[i + 2] * 3;

        const v1x = vertices[i1], v1y = vertices[i1 + 1], v1z = vertices[i1 + 2];
        const v2x = vertices[i2], v2y = vertices[i2 + 1], v2z = vertices[i2 + 2];
        const v3x = vertices[i3], v3y = vertices[i3 + 1], v3z = vertices[i3 + 2];

        const ux = v2x - v1x, uy = v2y - v1y, uz = v2z - v1z;
        const vx = v3x - v1x, vy = v3y - v1y, vz = v3z - v1z;

        const nx = uy * vz - uz * vy;
        const ny = uz * vx - ux * vz;
        const nz = ux * vy - uy * vx;

        normals[i1] += nx; normals[i1 + 1] += ny; normals[i1 + 2] += nz;
        normals[i2] += nx; normals[i2 + 1] += ny; normals[i2 + 2] += nz;
        normals[i3] += nx; normals[i3 + 1] += ny; normals[i3 + 2] += nz;
      }

      // Normalize normals
      for (let i = 0; i < normals.length; i += 3) {
        const length = Math.sqrt(normals[i] ** 2 + normals[i + 1] ** 2 + normals[i + 2] ** 2);
        if (length > 0) {
          normals[i] /= length;
          normals[i + 1] /= length;
          normals[i + 2] /= length;
        }
      }

      return {
        vertices: new Float32Array(vertices),
        normals: new Float32Array(normals),
        indices: new Uint32Array(indices),
        faces: triCount,
        edges: 0,
        vertices_count: nodeCount,
        boundingBox: {
          min: { x: minX, y: minY, z: minZ },
          max: { x: maxX, y: maxY, z: maxZ },
        },
        parts: [{
          id: 'stl-main',
          name: 'STL Mesh',
          type: 'solid',
          boundingBox: {
            min: { x: minX, y: minY, z: minZ },
            max: { x: maxX, y: maxY, z: maxZ },
          },
        }],
      };
    } catch (error: any) {
      console.error('Error extracting geometry from triangulation:', error);
      throw new Error(`Triangulation extraction failed: ${error.message}`);
    }
  }

  async parseOBJ(fileContent: ArrayBuffer): Promise<CADModelData> {
    // OBJ parsing - manual parsing since OpenCascade doesn't have native OBJ support
    try {
      const text = new TextDecoder().decode(fileContent);
      const lines = text.split('\n');

      const vertices: number[] = [];
      const normals: number[] = [];
      const indices: number[] = [];

      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        
        if (parts[0] === 'v') {
          // Vertex
          const x = parseFloat(parts[1]);
          const y = parseFloat(parts[2]);
          const z = parseFloat(parts[3]);
          vertices.push(x, y, z);
          
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          minZ = Math.min(minZ, z);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
          maxZ = Math.max(maxZ, z);
        } else if (parts[0] === 'vn') {
          // Normal
          normals.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
        } else if (parts[0] === 'f') {
          // Face (triangulate if needed)
          const faceIndices: number[] = [];
          for (let i = 1; i < parts.length; i++) {
            const vertexData = parts[i].split('/');
            faceIndices.push(parseInt(vertexData[0]) - 1); // OBJ indices are 1-based
          }
          
          // Triangulate polygon faces
          for (let i = 1; i < faceIndices.length - 1; i++) {
            indices.push(faceIndices[0], faceIndices[i], faceIndices[i + 1]);
          }
        }
      }

      // Generate normals if not present
      if (normals.length === 0) {
        normals.length = vertices.length;
        normals.fill(0);
        
        // Calculate face normals
        for (let i = 0; i < indices.length; i += 3) {
          const i1 = indices[i] * 3;
          const i2 = indices[i + 1] * 3;
          const i3 = indices[i + 2] * 3;

          const v1x = vertices[i1], v1y = vertices[i1 + 1], v1z = vertices[i1 + 2];
          const v2x = vertices[i2], v2y = vertices[i2 + 1], v2z = vertices[i2 + 2];
          const v3x = vertices[i3], v3y = vertices[i3 + 1], v3z = vertices[i3 + 2];

          const ux = v2x - v1x, uy = v2y - v1y, uz = v2z - v1z;
          const vx = v3x - v1x, vy = v3y - v1y, vz = v3z - v1z;

          const nx = uy * vz - uz * vy;
          const ny = uz * vx - ux * vz;
          const nz = ux * vy - uy * vx;

          normals[i1] += nx; normals[i1 + 1] += ny; normals[i1 + 2] += nz;
          normals[i2] += nx; normals[i2 + 1] += ny; normals[i2 + 2] += nz;
          normals[i3] += nx; normals[i3 + 1] += ny; normals[i3 + 2] += nz;
        }

        // Normalize
        for (let i = 0; i < normals.length; i += 3) {
          const length = Math.sqrt(normals[i] ** 2 + normals[i + 1] ** 2 + normals[i + 2] ** 2);
          if (length > 0) {
            normals[i] /= length;
            normals[i + 1] /= length;
            normals[i + 2] /= length;
          }
        }
      }

      return {
        vertices: new Float32Array(vertices),
        normals: new Float32Array(normals),
        indices: new Uint32Array(indices),
        faces: indices.length / 3,
        edges: 0,
        vertices_count: vertices.length / 3,
        boundingBox: {
          min: { x: minX, y: minY, z: minZ },
          max: { x: maxX, y: maxY, z: maxZ },
        },
        parts: [{
          id: 'obj-main',
          name: 'Main Object',
          type: 'solid',
          boundingBox: {
            min: { x: minX, y: minY, z: minZ },
            max: { x: maxX, y: maxY, z: maxZ },
          },
        }],
      };
    } catch (error: any) {
      console.error('Error parsing OBJ file:', error);
      throw new Error(`OBJ parsing failed: ${error.message}`);
    }
  }

  async parseDXF(fileContent: ArrayBuffer): Promise<CADModelData> {
    // DXF is 2D - we'll create a simple extruded representation
    try {
      const text = new TextDecoder().decode(fileContent);
      
      // Simple DXF parsing - look for LINE and POLYLINE entities
      const lines = text.split('\n');
      const vertices: number[] = [];
      const indices: number[] = [];

      let minX = Infinity, minY = Infinity;
      let maxX = -Infinity, maxY = -Infinity;

      let isInEntitiesSection = false;
      let currentX: number | null = null;
      let currentY: number | null = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line === 'ENTITIES') {
          isInEntitiesSection = true;
          continue;
        }
        if (line === 'ENDSEC' && isInEntitiesSection) {
          break;
        }

        if (isInEntitiesSection) {
          // Look for coordinate codes
          if (line === '10' || line === '20') {
            const value = parseFloat(lines[i + 1]?.trim() || '0');
            if (line === '10') {
              currentX = value;
              minX = Math.min(minX, value);
              maxX = Math.max(maxX, value);
            } else if (line === '20' && currentX !== null) {
              currentY = value;
              minY = Math.min(minY, value);
              maxY = Math.max(maxY, value);
              
              // Add 3D vertex (extrude in Z)
              vertices.push(currentX, currentY, 0);
              vertices.push(currentX, currentY, 10); // Extrude 10 units
              currentX = null;
              currentY = null;
            }
          }
        }
      }

      // Create indices for lines
      for (let i = 0; i < vertices.length / 3 - 1; i++) {
        indices.push(i, i + 1, i);
      }

      const normals = new Float32Array(vertices.length);
      for (let i = 2; i < normals.length; i += 3) {
        normals[i] = 1; // Normal pointing up
      }

      return {
        vertices: new Float32Array(vertices),
        normals: normals,
        indices: new Uint32Array(indices),
        faces: 0,
        edges: indices.length / 2,
        vertices_count: vertices.length / 3,
        boundingBox: {
          min: { x: minX, y: minY, z: 0 },
          max: { x: maxX, y: maxY, z: 10 },
        },
        parts: [{
          id: 'dxf-main',
          name: 'DXF Drawing',
          type: 'edge',
          boundingBox: {
            min: { x: minX, y: minY, z: 0 },
            max: { x: maxX, y: maxY, z: 10 },
          },
        }],
      };
    } catch (error: any) {
      console.error('Error parsing DXF file:', error);
      throw new Error(`DXF parsing failed: ${error.message}`);
    }
  }

  private extractGeometry(shape: any): CADModelData {
    if (!this.oc) throw new Error('OpenCascade not initialized');

    try {
      // Triangulate the shape
      const triangulation = new this.oc.BRepMesh_IncrementalMesh_2(
        shape, 
        0.1, // deflection
        false, 
        0.5, 
        true
      );
      // Perform triangulation with progress range
      triangulation.Perform(new this.oc.Message_ProgressRange_1());

      const vertices: number[] = [];
      const normals: number[] = [];
      const indices: number[] = [];
      const parts: CADPart[] = [];

      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

      // Get bounding box
      const bbox = new this.oc.Bnd_Box_1();
      this.oc.BRepBndLib.Add(shape, bbox, false);
      
      const bboxMin = bbox.CornerMin();
      const bboxMax = bbox.CornerMax();
      
      minX = bboxMin.X();
      minY = bboxMin.Y();
      minZ = bboxMin.Z();
      maxX = bboxMax.X();
      maxY = bboxMax.Y();
      maxZ = bboxMax.Z();

      // Extract faces
      const faceExp = new this.oc.TopExp_Explorer_2(
        shape,
        this.oc.TopAbs_ShapeEnum.TopAbs_FACE,
        this.oc.TopAbs_ShapeEnum.TopAbs_SHAPE
      );

      let faceCount = 0;
      let edgeCount = 0;

      while (faceExp.More()) {
        const face = this.oc.TopoDS.Face_1(faceExp.Current());
        const location = new this.oc.TopLoc_Location_1();
        const triangles = this.oc.BRep_Tool.Triangulation(face, location, 0);

        if (!triangles.IsNull()) {
          const transform = location.Transformation();
          const nodeCount = triangles.get().NbNodes();
          const triCount = triangles.get().NbTriangles();

          const vertexOffset = vertices.length / 3;

          // Extract vertices
          for (let i = 1; i <= nodeCount; i++) {
            const node = triangles.get().Node(i);
            const transformed = node.Transformed(transform);
            vertices.push(transformed.X(), transformed.Y(), transformed.Z());
            normals.push(0, 0, 1); // Placeholder normal
          }

          // Extract triangles
          for (let i = 1; i <= triCount; i++) {
            const triangle = triangles.get().Triangle(i);
            const [i1, i2, i3] = [triangle.Value(1), triangle.Value(2), triangle.Value(3)];
            indices.push(
              vertexOffset + i1 - 1,
              vertexOffset + i2 - 1,
              vertexOffset + i3 - 1
            );
          }

          faceCount++;
        }

        faceExp.Next();
      }

      // Count edges
      const edgeExp = new this.oc.TopExp_Explorer_2(
        shape,
        this.oc.TopAbs_ShapeEnum.TopAbs_EDGE,
        this.oc.TopAbs_ShapeEnum.TopAbs_SHAPE
      );

      while (edgeExp.More()) {
        edgeCount++;
        edgeExp.Next();
      }

      // Calculate volume and surface area
      const props = new this.oc.GProp_GProps_1();
      this.oc.BRepGProp.VolumeProperties_1(shape, props, false, false, false);
      const volume = props.Mass();
      
      const surfaceProps = new this.oc.GProp_GProps_1();
      this.oc.BRepGProp.SurfaceProperties_1(shape, surfaceProps, false, false);
      const surfaceArea = surfaceProps.Mass();

      // Create main part
      parts.push({
        id: 'main',
        name: 'Main Body',
        type: 'solid',
        volume,
        surfaceArea,
        boundingBox: {
          min: { x: minX, y: minY, z: minZ },
          max: { x: maxX, y: maxY, z: maxZ },
        },
      });

      // Perform manufacturing analysis
      console.log('Performing manufacturing analysis...');
      const manufacturingAnalyzer = new ManufacturingAnalyzer(this.oc);
      let manufacturingData;

      try {
        manufacturingData = manufacturingAnalyzer.analyzeManufacturing(shape, 'A36');
        console.log('Manufacturing analysis completed:', {
          holes: manufacturingData.holeAnalysis.count,
          edges: manufacturingData.edgeAnalysis.totalEdges,
          thickness: manufacturingData.thicknessAnalysis.estimatedThickness,
        });
      } catch (error: any) {
        console.warn('Manufacturing analysis failed:', error.message);
        manufacturingData = null;
      }

      // Cleanup
      triangulation.delete();
      faceExp.delete();
      edgeExp.delete();
      bbox.delete();
      props.delete();
      surfaceProps.delete();

      return {
        vertices: new Float32Array(vertices),
        normals: new Float32Array(normals),
        indices: new Uint32Array(indices),
        faces: faceCount,
        edges: edgeCount,
        vertices_count: vertices.length / 3,
        boundingBox: {
          min: { x: minX, y: minY, z: minZ },
          max: { x: maxX, y: maxY, z: maxZ },
        },
        volume,
        surfaceArea,
        parts,
        // Add manufacturing analysis data
        boundingBoxWithTolerance: manufacturingData?.boundingBoxWithTolerance,
        holeAnalysis: manufacturingData?.holeAnalysis,
        thicknessAnalysis: manufacturingData?.thicknessAnalysis,
        edgeAnalysis: manufacturingData?.edgeAnalysis,
        weldJointAnalysis: manufacturingData?.weldJointAnalysis,
        bendAnalysis: manufacturingData?.bendAnalysis,
      };
    } catch (error: any) {
      console.error('Error extracting geometry:', error);
      throw new Error(`Geometry extraction failed: ${error.message}`);
    }
  }

  async parseGLTF(fileContent: ArrayBuffer): Promise<CADModelData> {
    // glTF parsing using Three.js (OpenCascade doesn't support glTF natively)
    // Ensure we're in browser environment
    if (typeof window === 'undefined') {
      throw new Error('glTF parsing requires browser environment');
    }

    try {
      // Dynamically import Three.js GLTFLoader
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
      const loader = new GLTFLoader();

      // Convert ArrayBuffer to blob URL for loading
      const blob = new Blob([fileContent], { type: 'model/gltf+json' });
      const url = URL.createObjectURL(blob);

      console.log('Loading glTF file...');
      
      // Load the glTF model
      const gltf = await new Promise<any>((resolve, reject) => {
        loader.load(
          url,
          (gltf) => resolve(gltf),
          undefined,
          (error) => reject(error)
        );
      });

      // Clean up blob URL
      URL.revokeObjectURL(url);

      console.log('glTF loaded successfully, extracting geometry...');

      // Extract geometry from all meshes in the scene
      const vertices: number[] = [];
      const normals: number[] = [];
      const indices: number[] = [];
      const parts: CADPart[] = [];

      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
      let vertexOffset = 0;
      let partIndex = 0;

      // Traverse the scene to find all meshes
      gltf.scene.traverse((object: any) => {
        if (object.isMesh && object.geometry) {
          const geometry = object.geometry;
          const meshName = object.name || `Mesh_${partIndex}`;

          // Get position attribute
          const positionAttribute = geometry.getAttribute('position');
          const normalAttribute = geometry.getAttribute('normal');
          const indexAttribute = geometry.index;

          if (!positionAttribute) {
            console.warn(`Mesh ${meshName} has no position attribute, skipping`);
            return;
          }

          // Extract vertices
          const meshVertices: number[] = [];
          const meshNormals: number[] = [];
          const meshIndices: number[] = [];

          for (let i = 0; i < positionAttribute.count; i++) {
            const x = positionAttribute.getX(i);
            const y = positionAttribute.getY(i);
            const z = positionAttribute.getZ(i);

            meshVertices.push(x, y, z);
            vertices.push(x, y, z);

            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            minZ = Math.min(minZ, z);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
            maxZ = Math.max(maxZ, z);

            // Extract normals if available
            if (normalAttribute) {
              const nx = normalAttribute.getX(i);
              const ny = normalAttribute.getY(i);
              const nz = normalAttribute.getZ(i);
              meshNormals.push(nx, ny, nz);
              normals.push(nx, ny, nz);
            } else {
              meshNormals.push(0, 0, 1);
              normals.push(0, 0, 1);
            }
          }

          // Extract indices
          if (indexAttribute) {
            for (let i = 0; i < indexAttribute.count; i++) {
              const index = indexAttribute.getX(i);
              meshIndices.push(vertexOffset + index);
              indices.push(vertexOffset + index);
            }
          } else {
            // No indices, create them sequentially
            for (let i = 0; i < positionAttribute.count; i++) {
              meshIndices.push(vertexOffset + i);
              indices.push(vertexOffset + i);
            }
          }

          // Calculate bounding box for this part
          const partMinX = Math.min(...meshVertices.filter((_, i) => i % 3 === 0));
          const partMinY = Math.min(...meshVertices.filter((_, i) => i % 3 === 1));
          const partMinZ = Math.min(...meshVertices.filter((_, i) => i % 3 === 2));
          const partMaxX = Math.max(...meshVertices.filter((_, i) => i % 3 === 0));
          const partMaxY = Math.max(...meshVertices.filter((_, i) => i % 3 === 1));
          const partMaxZ = Math.max(...meshVertices.filter((_, i) => i % 3 === 2));

          // Calculate approximate volume (bounding box volume)
          const partVolume = (partMaxX - partMinX) * (partMaxY - partMinY) * (partMaxZ - partMinZ);

          parts.push({
            id: `gltf-part-${partIndex}`,
            name: meshName,
            type: 'solid',
            volume: partVolume,
            boundingBox: {
              min: { x: partMinX, y: partMinY, z: partMinZ },
              max: { x: partMaxX, y: partMaxY, z: partMaxZ },
            },
          });

          vertexOffset += positionAttribute.count;
          partIndex++;
        }
      });

      // Generate normals if not present
      if (normals.length === 0 || normals.every(n => n === 0)) {
        normals.length = vertices.length;
        normals.fill(0);

        // Calculate face normals
        for (let i = 0; i < indices.length; i += 3) {
          const i1 = indices[i] * 3;
          const i2 = indices[i + 1] * 3;
          const i3 = indices[i + 2] * 3;

          const v1x = vertices[i1], v1y = vertices[i1 + 1], v1z = vertices[i1 + 2];
          const v2x = vertices[i2], v2y = vertices[i2 + 1], v2z = vertices[i2 + 2];
          const v3x = vertices[i3], v3y = vertices[i3 + 1], v3z = vertices[i3 + 2];

          const ux = v2x - v1x, uy = v2y - v1y, uz = v2z - v1z;
          const vx = v3x - v1x, vy = v3y - v1y, vz = v3z - v1z;

          const nx = uy * vz - uz * vy;
          const ny = uz * vx - ux * vz;
          const nz = ux * vy - uy * vx;

          normals[i1] += nx; normals[i1 + 1] += ny; normals[i1 + 2] += nz;
          normals[i2] += nx; normals[i2 + 1] += ny; normals[i2 + 2] += nz;
          normals[i3] += nx; normals[i3 + 1] += ny; normals[i3 + 2] += nz;
        }

        // Normalize normals
        for (let i = 0; i < normals.length; i += 3) {
          const length = Math.sqrt(normals[i] ** 2 + normals[i + 1] ** 2 + normals[i + 2] ** 2);
          if (length > 0) {
            normals[i] /= length;
            normals[i + 1] /= length;
            normals[i + 2] /= length;
          }
        }
      }

      // Calculate total volume (sum of part volumes)
      const totalVolume = parts.reduce((sum, part) => sum + (part.volume || 0), 0);

      // Calculate approximate surface area (sum of bounding box surface areas)
      const totalSurfaceArea = parts.reduce((sum, part) => {
        const bbox = part.boundingBox;
        const width = bbox.max.x - bbox.min.x;
        const height = bbox.max.y - bbox.min.y;
        const depth = bbox.max.z - bbox.min.z;
        return sum + 2 * (width * height + width * depth + height * depth);
      }, 0);

      const faceCount = indices.length / 3;

      console.log('glTF parsing completed:', {
        vertices: vertices.length / 3,
        faces: faceCount,
        parts: parts.length
      });

      return {
        vertices: new Float32Array(vertices),
        normals: new Float32Array(normals),
        indices: new Uint32Array(indices),
        faces: faceCount,
        edges: 0, // glTF doesn't explicitly define edges
        vertices_count: vertices.length / 3,
        boundingBox: {
          min: { x: minX, y: minY, z: minZ },
          max: { x: maxX, y: maxY, z: maxZ },
        },
        volume: totalVolume,
        surfaceArea: totalSurfaceArea,
        parts,
      };
    } catch (error: any) {
      console.error('Error parsing glTF file:', error);
      throw new Error(`glTF parsing failed: ${error.message}`);
    }
  }

  private detectFileFormat(arrayBuffer: ArrayBuffer, declaredExtension?: string): string {
    // Convert first 1KB to text to check for magic strings/headers
    const bytes = new Uint8Array(arrayBuffer.slice(0, 1024));
    const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    
    // STEP files start with ISO-10303-21 header
    if (text.includes('ISO-10303-21') || text.includes('HEADER;')) {
      return 'step';
    }
    
    // glTF JSON files start with { "asset": { "version": ... } }
    if (text.trim().startsWith('{') && (text.includes('"asset"') || text.includes('"accessors"') || text.includes('"buffers"'))) {
      return 'gltf';
    }
    
    // glTF binary files (GLB) start with "glTF" magic string
    if (arrayBuffer.byteLength >= 4) {
      const view = new DataView(arrayBuffer);
      const magic = view.getUint32(0, true);
      if (magic === 0x46546C67) { // "glTF" in little-endian
        return 'gltf';
      }
    }
    
    // STL ASCII starts with "solid"
    if (text.trim().startsWith('solid ')) {
      return 'stl';
    }
    
    // STL binary has specific header format (80 bytes header + 4 bytes triangle count)
    if (arrayBuffer.byteLength > 84) {
      const view = new DataView(arrayBuffer);
      const triangleCount = view.getUint32(80, true);
      const expectedSize = 80 + 4 + (triangleCount * 50);
      if (Math.abs(arrayBuffer.byteLength - expectedSize) < 100) {
        return 'stl';
      }
    }
    
    // OBJ files contain "v ", "vn ", "f " etc.
    if (text.includes('\nv ') || text.includes('\nvn ') || text.includes('\nf ')) {
      return 'obj';
    }
    
    // DXF files start with section markers
    if (text.includes('0\nSECTION') || text.includes('999\nDXF')) {
      return 'dxf';
    }
    
    // Fallback to declared extension if no format detected
    console.warn(`Could not detect file format from content. First 100 chars: ${text.substring(0, 100)}`);
    return declaredExtension || 'unknown';
  }

  async parseFile(file: File): Promise<CADModelData> {
    await this.initialize();

    const declaredExtension = file.name.split('.').pop()?.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    
    // Validate file has content
    if (arrayBuffer.byteLength === 0) {
      throw new Error('File is empty');
    }
    
    // Detect actual format from content
    const detectedFormat = this.detectFileFormat(arrayBuffer, declaredExtension);
    
    console.log(`File: ${file.name}, Declared: ${declaredExtension}, Detected: ${detectedFormat}, Size: ${arrayBuffer.byteLength} bytes`);
    
    // Log first few bytes for debugging
    const preview = new Uint8Array(arrayBuffer.slice(0, 100));
    const previewText = new TextDecoder('utf-8', { fatal: false }).decode(preview);
    console.log('File content preview:', previewText.substring(0, 200));

    switch (detectedFormat) {
      case 'step':
      case 'stp':
        return this.parseSTEP(arrayBuffer);
      case 'stl':
        return this.parseSTL(arrayBuffer);
      case 'obj':
        return this.parseOBJ(arrayBuffer);
      case 'dxf':
        return this.parseDXF(arrayBuffer);
      case 'gltf':
      case 'glb':
        return this.parseGLTF(arrayBuffer);
      default:
        throw new Error(`Unsupported or unrecognized file format. Declared: ${declaredExtension}, Detected: ${detectedFormat}. File may be corrupted or in an unsupported format.`);
    }
  }

  dispose(): void {
    this.oc = null;
    this.initialized = false;
  }
}

// Singleton instance
let parserInstance: CADParser | null = null;

export function getCADParser(): CADParser {
  // Ensure we're in browser environment
  if (typeof window === 'undefined') {
    throw new Error('CAD parser can only be used in browser environment');
  }
  
  if (!parserInstance) {
    parserInstance = new CADParser();
  }
  return parserInstance;
}

