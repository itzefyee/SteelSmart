/* eslint-disable @typescript-eslint/no-explicit-any */
// Manufacturing-Critical Information Extraction for 3D Models
// Based on AISC, AWS, and ASTM standards

import type {
  HoleInfo,
  HoleAnalysis,
  EdgeDistanceInfo,
  SpacingViolation,
  NonStandardSize,
  ThicknessAnalysis,
  EdgeInfo,
  EdgeAnalysis,
  SharpCorner,
  WeldJoint,
  WeldJointAnalysis,
  WeldRecommendation,
  BendInfo,
  BendAnalysis,
  BoundingBoxWithTolerance,
} from './cad-parser';

/**
 * Manufacturing Analyzer for CAD Models
 * Extracts manufacturing-critical information using OpenCascade.js
 */
export class ManufacturingAnalyzer {
  private oc: any;

  constructor(ocInstance: any) {
    this.oc = ocInstance;
  }

  /**
   * Extract bounding box dimensions with AISC 303 tolerance
   */
  getBoundingBox(shape: any): BoundingBoxWithTolerance {
    const bbox = new this.oc.Bnd_Box_1();
    this.oc.BRepBndLib.Add(shape, bbox, false);

    const xMin = { current: 0 }, yMin = { current: 0 }, zMin = { current: 0 };
    const xMax = { current: 0 }, yMax = { current: 0 }, zMax = { current: 0 };

    bbox.Get(xMin, yMin, zMin, xMax, yMax, zMax);

    const dimensions = {
      length: xMax.current - xMin.current,
      width: yMax.current - yMin.current,
      height: zMax.current - zMin.current,
      bounds: {
        min: { x: xMin.current, y: yMin.current, z: zMin.current },
        max: { x: xMax.current, y: yMax.current, z: zMax.current },
      },
      tolerance: this.calculateAISCTolerance(
        Math.max(
          xMax.current - xMin.current,
          yMax.current - yMin.current,
          zMax.current - zMin.current
        )
      ),
    };

    bbox.delete();
    return dimensions;
  }

  /**
   * Calculate AISC 303 tolerance
   */
  private calculateAISCTolerance(length: number): number {
    // AISC 303 Section 6: ±1/8" for ≤10 ft, then ±1/8" per 10 ft
    if (length <= 120) return 0.125;
    return length / 960; // 1/8" per 10 ft
  }

  /**
   * Detect and analyze holes (cylindrical faces)
   */
  detectHoles(shape: any): HoleAnalysis {
    const holes: HoleInfo[] = [];
    const cylindricalFaces: any[] = [];
    
    const faceExplorer = new this.oc.TopExp_Explorer_2(
      shape,
      this.oc.TopAbs_ShapeEnum.TopAbs_FACE,
      this.oc.TopAbs_ShapeEnum.TopAbs_SHAPE
    );

    // First pass: collect all cylindrical faces
    while (faceExplorer.More()) {
      const face = this.oc.TopoDS.Face_1(faceExplorer.Current());
      const surface = this.oc.BRep_Tool.Surface_2(face);

      // Check if surface is cylindrical by attempting to downcast
      try {
        // Try multiple methods to detect cylindrical surfaces
        const typeName = surface.get_type_name ? surface.get_type_name() : null;
        
        // Method 1: Check type name
        const isCylindricalByName = 
          typeName === 'Geom_CylindricalSurface' ||
          typeName === 'Handle(Geom_CylindricalSurface)';
        
        // Method 2: Check if it has Axis and Radius methods
        const hasAxisAndRadius = 
          typeof surface.Axis === 'function' && 
          typeof surface.Radius === 'function';
        
        // Method 3: Try to cast to cylindrical surface
        let isCylindrical = isCylindricalByName || hasAxisAndRadius;
        
        // Additional check: try to access cylinder properties
        if (!isCylindrical && surface.DynamicType) {
          const dynType = surface.DynamicType();
          if (dynType && dynType.Name) {
            const name = dynType.Name();
            isCylindrical = name.includes('Cylindrical');
          }
        }

        if (isCylindrical) {
          try {
            const axis = surface.Axis();
            const radius = surface.Radius();
            const location = axis.Location();
            
            // Validate that we got valid values
            if (radius > 0 && radius < 1000) { // Sanity check
              const holeInfo = {
                center: {
                  x: location.X(),
                  y: location.Y(),
                  z: location.Z(),
                },
                diameter: radius * 2,
                radius: radius,
                axis: {
                  x: axis.Direction().X(),
                  y: axis.Direction().Y(),
                  z: axis.Direction().Z(),
                },
                isStandardSize: this.checkStandardDrillSize(radius * 2),
              };
              
              // Check if this is likely a hole (not an external cylinder)
              // Holes typically have their axis perpendicular to the main surface
              const axisZ = Math.abs(holeInfo.axis.z);
              const isLikelyHole = axisZ > 0.7 || axisZ < 0.3; // Either vertical or horizontal
              
              if (isLikelyHole) {
                holes.push(holeInfo);
                cylindricalFaces.push(face);
              }
            }
          } catch (propError) {
            console.warn('Could not extract cylinder properties:', propError);
          }
        }
      } catch (error) {
        // Not a cylindrical surface or error accessing properties, skip
        // This is expected for non-cylindrical faces
      }

      faceExplorer.Next();
    }

    faceExplorer.delete();
    
    console.log(`Detected ${holes.length} potential holes from ${cylindricalFaces.length} cylindrical faces`);

    // Analyze hole relationships
    return this.analyzeHoles(holes, shape);
  }

  /**
   * Check if diameter matches standard drill size
   */
  private checkStandardDrillSize(diameter: number): boolean {
    const standardSizes = [
      0.25, 0.3125, 0.375, 0.4375, 0.5, 0.5625, 0.625, 0.75, 0.875, 1.0,
    ];

    return standardSizes.some((size) => Math.abs(size - diameter) < 0.001);
  }

  /**
   * Analyze hole relationships
   */
  private analyzeHoles(holes: HoleInfo[], shape: any): HoleAnalysis {
    const bbox = this.getBoundingBox(shape);
    const edgeDistances: EdgeDistanceInfo[] = [];
    const spacingViolations: SpacingViolation[] = [];
    const nonStandardSizes: NonStandardSize[] = [];

    holes.forEach((hole, i) => {
      // Check for non-standard sizes
      if (!hole.isStandardSize) {
        const nearest = this.findNearestStandardSize(hole.diameter);
        nonStandardSizes.push({
          holeIndex: i,
          actual: hole.diameter,
          nearest: nearest,
          requiresSpecialTooling: true,
        });
      }

      // Calculate edge distances
      const distances = {
        toXMin: hole.center.x - bbox.bounds.min.x,
        toXMax: bbox.bounds.max.x - hole.center.x,
        toYMin: hole.center.y - bbox.bounds.min.y,
        toYMax: bbox.bounds.max.y - hole.center.y,
        toZMin: hole.center.z - bbox.bounds.min.z,
        toZMax: bbox.bounds.max.z - hole.center.z,
      };

      const minEdgeDistance = Math.min(...Object.values(distances));

      // AISC 360 Table J3.4
      const requiredRolled = hole.diameter * 1.25;
      const requiredSheared = hole.diameter * 1.75;

      const closestEdge = Object.entries(distances).reduce((a, b) =>
        a[1] < b[1] ? a : b
      )[0];

      edgeDistances.push({
        holeIndex: i,
        holeDiameter: hole.diameter,
        minEdgeDistance: minEdgeDistance,
        distances: distances,
        compliance: {
          rolled: minEdgeDistance >= requiredRolled,
          sheared: minEdgeDistance >= requiredSheared,
          requiredRolled: requiredRolled,
          requiredSheared: requiredSheared,
          margin: minEdgeDistance - requiredSheared,
          standard: 'AISC 360 Table J3.4',
        },
        closestEdge: closestEdge,
      });

      // Check spacing to other holes (AISC 360 J3.3)
      holes.forEach((other, j) => {
        if (i < j) {
          const distance = this.calculateDistance(hole.center, other.center);
          const minSpacing = Math.max(hole.diameter, other.diameter) * 2.67; // AISC minimum
          const preferredSpacing = Math.max(hole.diameter, other.diameter) * 3.0;

          if (distance < minSpacing) {
            spacingViolations.push({
              hole1: i,
              hole2: j,
              actual: distance,
              minimum: minSpacing,
              preferred: preferredSpacing,
              violation: 'CRITICAL',
              standard: 'AISC 360 J3.3',
            });
          }
        }
      });
    });

    return {
      holes: holes,
      count: holes.length,
      edgeDistances: edgeDistances,
      spacingViolations: spacingViolations,
      nonStandardSizes: nonStandardSizes,
    };
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(
    point1: { x: number; y: number; z: number },
    point2: { x: number; y: number; z: number }
  ): number {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) +
        Math.pow(point2.y - point1.y, 2) +
        Math.pow(point2.z - point1.z, 2)
    );
  }

  /**
   * Find nearest standard drill size
   */
  private findNearestStandardSize(diameter: number): number {
    const sizes = [0.25, 0.3125, 0.375, 0.4375, 0.5, 0.5625, 0.625, 0.75, 0.875, 1.0];
    return sizes.reduce((prev, curr) =>
      Math.abs(curr - diameter) < Math.abs(prev - diameter) ? curr : prev
    );
  }

  /**
   * Extract material thickness from solid
   */
  getMaterialThickness(shape: any): ThicknessAnalysis {
    // Method 1: For solid parts, analyze smallest dimension
    const bbox = this.getBoundingBox(shape);
    const minDimension = Math.min(bbox.length, bbox.width, bbox.height);

    // Method 2: Sample thickness at multiple points
    const sampledThicknesses = this.sampleThickness(shape);

    let avgThickness =
      sampledThicknesses.length > 0
        ? sampledThicknesses.reduce((a, b) => a + b) / sampledThicknesses.length
        : minDimension;

    // CRITICAL FIX: Validate thickness is reasonable for sheet metal
    // Thickness should be the smallest dimension and typically < 2" for fabricated parts
    if (avgThickness > 2.0 || avgThickness > minDimension * 2) {
      console.warn(
        `Suspicious thickness detected: ${avgThickness.toFixed(3)}". ` +
        `Using smallest bounding box dimension: ${minDimension.toFixed(3)}"`
      );
      avgThickness = minDimension;
    }

    // Additional validation: For plate/sheet metal, thickness should be much smaller than other dimensions
    const maxDimension = Math.max(bbox.length, bbox.width, bbox.height);
    if (avgThickness > maxDimension * 0.5) {
      console.warn(
        `Thickness ${avgThickness.toFixed(3)}" is too large relative to max dimension ${maxDimension.toFixed(3)}". ` +
        `Likely a measurement error. Using smallest dimension.`
      );
      avgThickness = minDimension;
    }

    // Final sanity check: Thickness should be within typical fabrication range
    if (avgThickness < 0.0625) {
      console.warn(`Thickness ${avgThickness.toFixed(4)}" is very thin (< 1/16"). Verify measurement.`);
    } else if (avgThickness > 3.0) {
      console.warn(`Thickness ${avgThickness.toFixed(3)}" exceeds typical plate thickness (> 3"). Verify measurement.`);
    }

    return {
      estimatedThickness: avgThickness,
      minDimension: minDimension,
      samples: sampledThicknesses,
      isStandardGauge: this.checkStandardThickness(avgThickness),
      minWeldSize: this.calculateMinWeldSize(avgThickness),
      maxWeldSize: Math.max(avgThickness - 0.0625, 0.0625), // Ensure positive value
      requiresPreheat: avgThickness > 1.0,
    };
  }

  /**
   * Sample thickness at multiple points
   * IMPROVED: Better algorithm for complex geometries like U-channels, brackets, etc.
   */
  private sampleThickness(shape: any): number[] {
    const thicknesses: number[] = [];
    const props = new this.oc.GProp_GProps_1();

    try {
      // Get volume and surface area
      this.oc.BRepGProp.VolumeProperties_1(shape, props, 1e-6);
      const volume = props.Mass();

      this.oc.BRepGProp.SurfaceProperties_1(shape, props);
      const surfaceArea = props.Mass();

      // Method 1: Volume/Surface Area estimation (works for simple plates)
      if (surfaceArea > 0 && volume > 0) {
        const estimatedThickness = (volume / surfaceArea) * 2;
        
        // Only use this if it seems reasonable (< 2")
        if (estimatedThickness < 2.0) {
          thicknesses.push(estimatedThickness);
        }
      }

      // Method 2: Analyze face pairs to find parallel faces (better for complex shapes)
      const faceThicknesses = this.measureFaceToFaceThickness(shape);
      if (faceThicknesses.length > 0) {
        thicknesses.push(...faceThicknesses);
      }

    } catch (error) {
      console.warn('Error sampling thickness:', error);
    } finally {
      props.delete();
    }

    return thicknesses;
  }

  /**
   * Measure thickness by finding parallel faces and calculating distance
   * This works better for U-channels, brackets, and complex geometries
   */
  private measureFaceToFaceThickness(shape: any): number[] {
    const thicknesses: number[] = [];
    
    try {
      const faceExplorer = new this.oc.TopExp_Explorer_2(
        shape,
        this.oc.TopAbs_ShapeEnum.TopAbs_FACE,
        this.oc.TopAbs_ShapeEnum.TopAbs_SHAPE
      );

      const faces: any[] = [];
      while (faceExplorer.More()) {
        faces.push(this.oc.TopoDS.Face_1(faceExplorer.Current()));
        faceExplorer.Next();
      }
      faceExplorer.delete();

      // Find pairs of parallel faces
      for (let i = 0; i < faces.length && i < 20; i++) { // Limit to first 20 faces for performance
        const normal1 = this.getFaceNormal(faces[i]);
        const center1 = this.getFaceCenter(faces[i]);

        for (let j = i + 1; j < faces.length && j < 20; j++) {
          const normal2 = this.getFaceNormal(faces[j]);
          const center2 = this.getFaceCenter(faces[j]);

          // Check if faces are parallel (normals are opposite)
          const dotProduct = normal1.x * normal2.x + normal1.y * normal2.y + normal1.z * normal2.z;
          
          if (Math.abs(dotProduct + 1.0) < 0.1) { // Normals point opposite directions
            // Calculate distance between face centers
            const distance = Math.sqrt(
              Math.pow(center2.x - center1.x, 2) +
              Math.pow(center2.y - center1.y, 2) +
              Math.pow(center2.z - center1.z, 2)
            );

            // Only consider reasonable thicknesses (0.0625" to 2")
            if (distance >= 0.0625 && distance <= 2.0) {
              thicknesses.push(distance);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Error measuring face-to-face thickness:', error);
    }

    return thicknesses;
  }

  /**
   * Get approximate center of a face
   */
  private getFaceCenter(face: any): { x: number; y: number; z: number } {
    try {
      const props = new this.oc.GProp_GProps_1();
      this.oc.BRepGProp.SurfaceProperties_1(face, props);
      const centerOfMass = props.CentreOfMass();
      
      const result = {
        x: centerOfMass.X(),
        y: centerOfMass.Y(),
        z: centerOfMass.Z(),
      };
      
      props.delete();
      return result;
    } catch (e) {
      return { x: 0, y: 0, z: 0 };
    }
  }

  /**
   * Check if thickness matches standard gauge
   */
  private checkStandardThickness(thickness: number): boolean {
    const standardGauges = [
      0.0625, 0.078125, 0.09375, 0.109375, 0.125, 0.140625, 0.15625, 0.1875, 0.25,
      0.3125, 0.375, 0.5, 0.625, 0.75, 1.0,
    ];

    return standardGauges.some((gauge) => Math.abs(gauge - thickness) < 0.005);
  }

  /**
   * Calculate minimum weld size (AISC 360 Table J2.4)
   */
  private calculateMinWeldSize(thickness: number): number {
    if (thickness <= 0.25) return 0.125;
    if (thickness <= 0.5) return 0.1875;
    if (thickness <= 0.75) return 0.25;
    return 0.3125;
  }

  /**
   * Analyze edges and corners for manufacturability
   */
  analyzeEdges(shape: any): EdgeAnalysis {
    const edges: EdgeInfo[] = [];
    const sharpCorners: SharpCorner[] = [];
    const edgeExplorer = new this.oc.TopExp_Explorer_2(
      shape,
      this.oc.TopAbs_ShapeEnum.TopAbs_EDGE,
      this.oc.TopAbs_ShapeEnum.TopAbs_SHAPE
    );

    while (edgeExplorer.More()) {
      const edge = this.oc.TopoDS.Edge_1(edgeExplorer.Current());

      // Get edge curve
      const curveHandle = this.oc.BRep_Tool.Curve_2(edge, { current: 0 }, { current: 0 });

      if (!curveHandle.IsNull()) {
        const curve = curveHandle.get();

        try {
          // Check if edge is straight or curved using robust type checking
          const typeName = curve.get_type_name ? curve.get_type_name() : null;

          // Check for line type (straight edge)
          const isLine =
            typeName === 'Geom_Line' ||
            (typeof curve.Direction === 'function' && typeof curve.Location === 'function' && !curve.Radius);

          // Check for circle type (curved edge/fillet)
          const isCircle =
            typeName === 'Geom_Circle' ||
            (typeof curve.Radius === 'function' && typeof curve.Location === 'function');

          if (isLine) {
            // Straight edge
            const direction = curve.Direction();

            edges.push({
              type: 'straight',
              length: this.calculateEdgeLength(edge),
              direction: {
                x: direction.X(),
                y: direction.Y(),
                z: direction.Z(),
              },
            });
          } else if (isCircle) {
            // Circular edge (fillet or round)
            const radius = curve.Radius();

            edges.push({
              type: 'circular',
              radius: radius,
              length: this.calculateEdgeLength(edge),
              isSharpCorner: radius < 0.125, // < 1/8" is considered sharp
              isFillet: radius >= 0.125,
            });

            if (radius < 0.125) {
              sharpCorners.push({
                radius: radius,
                location: {
                  x: curve.Location().X(),
                  y: curve.Location().Y(),
                  z: curve.Location().Z(),
                },
                warning:
                  'Sharp internal corner detected. Consider fillet radius ≥ 1/8"',
              });
            }
          }
        } catch (error) {
          // Unable to determine edge type, skip
        }
      }

      edgeExplorer.Next();
    }

    edgeExplorer.delete();

    return {
      edges: edges,
      totalEdges: edges.length,
      sharpCorners: sharpCorners,
      warnings:
        sharpCorners.length > 0
          ? [
              'Sharp corners detected - may cause stress concentrations and manufacturing difficulties',
            ]
          : [],
    };
  }

  /**
   * Calculate edge length
   */
  private calculateEdgeLength(edge: any): number {
    try {
      const props = new this.oc.GProp_GProps_1();
      // BRepGProp.LinearProperties requires 4 arguments: shape, props, skipShared, useTriangulation
      this.oc.BRepGProp.LinearProperties(edge, props, false, false);
      const length = props.Mass(); // In OpenCascade, Mass() returns length for 1D entities
      props.delete();
      return length;
    } catch (error) {
      // Fallback: try to calculate length using curve parameters
      try {
        const curveHandle = this.oc.BRep_Tool.Curve_2(edge, { current: 0 }, { current: 0 });
        if (!curveHandle.IsNull()) {
          const adaptor = new this.oc.BRepAdaptor_Curve_2(edge);
          const length = this.oc.GCPnts_AbscissaPoint.Length_2(
            adaptor,
            adaptor.FirstParameter(),
            adaptor.LastParameter()
          );
          adaptor.delete();
          return length;
        }
      } catch (fallbackError) {
        console.warn('Unable to calculate edge length:', fallbackError);
      }
      return 0; // Return 0 if we can't calculate the length
    }
  }

  /**
   * Detect potential weld joints and analyze accessibility
   * IMPROVED: Filter out insignificant joints and focus on actual weld seams
   */
  analyzeWeldJoints(shape: any): WeldJointAnalysis {
    const joints: WeldJoint[] = [];
    const faceExplorer = new this.oc.TopExp_Explorer_2(
      shape,
      this.oc.TopAbs_ShapeEnum.TopAbs_FACE,
      this.oc.TopAbs_ShapeEnum.TopAbs_SHAPE
    );

    const faces: any[] = [];
    while (faceExplorer.More()) {
      faces.push(this.oc.TopoDS.Face_1(faceExplorer.Current()));
      faceExplorer.Next();
    }

    faceExplorer.delete();

    // IMPROVED: Only analyze significant faces (larger than 1 sq in)
    // This filters out small triangulated faces from meshing
    const significantFaces = faces.filter((face) => {
      try {
        const props = new this.oc.GProp_GProps_1();
        this.oc.BRepGProp.SurfaceProperties_1(face, props);
        const area = props.Mass();
        props.delete();
        return area > 1.0; // Only faces larger than 1 sq in
      } catch {
        return false;
      }
    });

    console.log(`Analyzing weld joints: ${significantFaces.length} significant faces (filtered from ${faces.length} total)`);

    // Analyze face adjacency only for significant faces
    for (let i = 0; i < significantFaces.length; i++) {
      for (let j = i + 1; j < significantFaces.length; j++) {
        const adjacency = this.checkFaceAdjacency(significantFaces[i], significantFaces[j]);

        if (adjacency.isAdjacent && adjacency.sharedEdge) {
          // Calculate shared edge length
          const edgeLength = this.calculateEdgeLength(adjacency.sharedEdge);
          
          // Only consider joints with significant edge length (> 0.5")
          if (edgeLength > 0.5) {
            const joint = this.analyzeJointType(significantFaces[i], significantFaces[j], adjacency);
            
            // Only add joints that represent actual weld seams
            // Filter out joints between coplanar faces (angle ~180°)
            if (Math.abs(joint.angle - 180) > 5) {
              joints.push(joint);
            }
          }
        }
      }
    }

    console.log(`Detected ${joints.length} potential weld joints`);

    return {
      joints: joints,
      totalJoints: joints.length,
      accessibilityIssues: joints.filter((j) => !j.accessible).length,
      recommendations: this.generateWeldRecommendations(joints),
    };
  }

  /**
   * Check if two faces are adjacent (share an edge)
   */
  private checkFaceAdjacency(face1: any, face2: any): { isAdjacent: boolean; sharedEdge?: any } {
    const edgeExplorer1 = new this.oc.TopExp_Explorer_2(
      face1,
      this.oc.TopAbs_ShapeEnum.TopAbs_EDGE,
      this.oc.TopAbs_ShapeEnum.TopAbs_SHAPE
    );

    const edges1: any[] = [];
    while (edgeExplorer1.More()) {
      edges1.push(edgeExplorer1.Current());
      edgeExplorer1.Next();
    }
    edgeExplorer1.delete();

    const edgeExplorer2 = new this.oc.TopExp_Explorer_2(
      face2,
      this.oc.TopAbs_ShapeEnum.TopAbs_EDGE,
      this.oc.TopAbs_ShapeEnum.TopAbs_SHAPE
    );

    while (edgeExplorer2.More()) {
      const edge2 = edgeExplorer2.Current();

      for (const edge1 of edges1) {
        if (edge1.IsSame(edge2)) {
          edgeExplorer2.delete();
          return {
            isAdjacent: true,
            sharedEdge: edge1,
          };
        }
      }

      edgeExplorer2.Next();
    }

    edgeExplorer2.delete();
    return { isAdjacent: false };
  }

  /**
   * Analyze joint type based on face normals
   */
  private analyzeJointType(face1: any, face2: any, adjacency: any): WeldJoint {
    // Get face normals
    const normal1 = this.getFaceNormal(face1);
    const normal2 = this.getFaceNormal(face2);

    // Calculate angle between faces
    const dotProduct = normal1.x * normal2.x + normal1.y * normal2.y + normal1.z * normal2.z;

    const angle = Math.acos(Math.max(-1, Math.min(1, dotProduct))) * (180 / Math.PI);

    let jointType = 'unknown';
    let accessible = true;
    const minClearance = 3.0; // inches

    if (Math.abs(angle - 90) < 5) {
      jointType = 'T-joint';
      accessible = true; // Usually accessible
    } else if (Math.abs(angle - 180) < 5) {
      jointType = 'butt-joint';
      accessible = true;
    } else if (angle < 60) {
      jointType = 'acute-corner';
      accessible = false; // Difficult to weld
    } else {
      jointType = 'corner-joint';
      accessible = angle >= 60; // AWS D1.1 minimum 60° for V-groove
    }

    return {
      type: jointType,
      angle: angle,
      accessible: accessible,
      minIncludedAngle: 60, // AWS D1.1 requirement
      meetsAWSRequirement: angle >= 60,
      clearanceRequired: minClearance,
      sharedEdgeLength: adjacency.sharedEdge
        ? this.calculateEdgeLength(adjacency.sharedEdge)
        : 0,
    };
  }

  /**
   * Get face normal vector
   * FIXED: Properly calculate normal from tangent vectors
   */
  private getFaceNormal(face: any): { x: number; y: number; z: number } {
    try {
      const surface = this.oc.BRep_Tool.Surface_2(face);

      // Get approximate center of face
      const u = (surface.FirstUParameter() + surface.LastUParameter()) / 2;
      const v = (surface.FirstVParameter() + surface.LastVParameter()) / 2;

      const point = new this.oc.gp_Pnt_1();
      const tangentU = new this.oc.gp_Vec_1();
      const tangentV = new this.oc.gp_Vec_1();

      // D1 computes first derivatives (tangent vectors)
      surface.D1(u, v, point, tangentU, tangentV);

      // Calculate normal as cross product: tangentU × tangentV
      const ux = tangentU.X(), uy = tangentU.Y(), uz = tangentU.Z();
      const vx = tangentV.X(), vy = tangentV.Y(), vz = tangentV.Z();

      let nx = uy * vz - uz * vy;
      let ny = uz * vx - ux * vz;
      let nz = ux * vy - uy * vx;

      // Normalize the normal vector
      const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (length > 0) {
        nx /= length;
        ny /= length;
        nz /= length;
      }

      const result = { x: nx, y: ny, z: nz };

      point.delete();
      tangentU.delete();
      tangentV.delete();

      return result;
    } catch (e) {
      console.warn('Error calculating face normal:', e);
      return { x: 0, y: 0, z: 1 }; // Default normal
    }
  }

  /**
   * Generate weld recommendations
   */
  private generateWeldRecommendations(joints: WeldJoint[]): WeldRecommendation[] {
    const recommendations: WeldRecommendation[] = [];

    joints.forEach((joint, index) => {
      if (!joint.accessible) {
        recommendations.push({
          jointIndex: index,
          issue: 'Limited weld accessibility',
          recommendation:
            'Consider redesign or special fixturing. May require robotic welding.',
          standard: 'AWS D1.1 accessibility requirements',
        });
      }

      if (!joint.meetsAWSRequirement) {
        recommendations.push({
          jointIndex: index,
          issue: `Included angle ${joint.angle.toFixed(1)}° < minimum 60°`,
          recommendation:
            'Increase groove angle to meet AWS D1.1 prequalified joint requirements',
          standard: 'AWS D1.1 Section 3',
        });
      }
    });

    return recommendations;
  }

  /**
   * Detect bends and check minimum bend radius
   */
  analyzeBends(shape: any, materialGrade: string = 'A36'): BendAnalysis {
    const bends: BendInfo[] = [];
    const bendMultipliers: Record<string, number> = {
      A36: 1.5,
      A572: 2.0,
      A588: 2.5,
      A992: 1.5,
    };

    const thickness = this.getMaterialThickness(shape).estimatedThickness;
    const minBendRadius = thickness * (bendMultipliers[materialGrade] || 2.0);

    // Detect curved edges that might be bends
    const edgeAnalysis = this.analyzeEdges(shape);

    edgeAnalysis.edges.forEach((edge, index) => {
      if (edge.type === 'circular' && edge.radius && edge.radius > 0) {
        const compliant = edge.radius >= minBendRadius;

        bends.push({
          index: index,
          radius: edge.radius,
          minRequired: minBendRadius,
          compliant: compliant,
          material: materialGrade,
          thickness: thickness,
          margin: edge.radius - minBendRadius,
          warning: !compliant
            ? `Bend radius ${edge.radius.toFixed(3)}" < minimum ${minBendRadius.toFixed(
                3
              )}" for ${materialGrade}`
            : null,
        });
      }
    });

    return {
      bends: bends,
      totalBends: bends.length,
      violations: bends.filter((b) => !b.compliant).length,
      materialGrade: materialGrade,
      minBendRadius: minBendRadius,
    };
  }

  /**
   * Perform comprehensive manufacturing analysis
   */
  analyzeManufacturing(
    shape: any,
    materialGrade: string = 'A36'
  ): {
    boundingBoxWithTolerance: BoundingBoxWithTolerance;
    holeAnalysis: HoleAnalysis;
    thicknessAnalysis: ThicknessAnalysis;
    edgeAnalysis: EdgeAnalysis;
    weldJointAnalysis: WeldJointAnalysis;
    bendAnalysis: BendAnalysis;
  } {
    return {
      boundingBoxWithTolerance: this.getBoundingBox(shape),
      holeAnalysis: this.detectHoles(shape),
      thicknessAnalysis: this.getMaterialThickness(shape),
      edgeAnalysis: this.analyzeEdges(shape),
      weldJointAnalysis: this.analyzeWeldJoints(shape),
      bendAnalysis: this.analyzeBends(shape, materialGrade),
    };
  }
}

export default ManufacturingAnalyzer;
