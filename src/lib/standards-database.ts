// lib/standards-database.ts

/**
 * Simplified Steel Manufacturing Standards Reference
 * Based on publicly available summaries and common industry practices
 * NOT a replacement for official AISC/AWS/ASTM documents
 */

// Type definitions
export type EdgeType = 'rolled' | 'sheared';

export interface Point {
  x: number;
  y: number;
}

export interface Hole {
  center: Point;
  diameter?: number;
  radius?: number;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface Dimensions {
  width: number;
  height: number;
  area: number;
}

export interface Geometry {
  holes?: Hole[];
  bounds: Bounds;
  dimensions: Dimensions;
}

// AISC 360 Types
export interface EdgeDistanceRules {
  rolled_edges: {
    description: string;
    formula: (boltDiameter: number) => number;
    explanation: string;
  };
  sheared_edges: {
    description: string;
    formula: (boltDiameter: number) => number;
    explanation: string;
  };
}

export interface TypicalEdgeValues {
  rolled: number;
  sheared: number;
}

export interface J3_4_EdgeDistance {
  title: string;
  reference: string;
  rules: EdgeDistanceRules;
  typical_values: Record<string, TypicalEdgeValues>;
}

export interface SpacingRules {
  minimum_spacing: {
    description: string;
    formula: (boltDiameter: number) => number;
    explanation: string;
  };
  preferred_spacing: {
    description: string;
    formula: (boltDiameter: number) => number;
    explanation: string;
  };
}

export interface J3_3_Spacing {
  title: string;
  reference: string;
  rules: SpacingRules;
}

export interface WeldSizeRules {
  minimum_fillet: {
    description: string;
    getSize: (thicknessOfThinnerPart: number) => number;
    explanation: string;
  };
  maximum_fillet: {
    description: string;
    formula: (materialThickness: number) => number;
    explanation: string;
  };
}

export interface J2_4_WeldSize {
  title: string;
  reference: string;
  rules: WeldSizeRules;
}

export interface ToleranceRules {
  length_tolerance: {
    description: string;
    getTolerance: (length: number) => number;
    explanation: string;
  };
  straightness: {
    description: string;
    formula: (length: number) => number;
    explanation: string;
  };
  hole_diameter: {
    description: string;
    standard: number;
    explanation: string;
  };
}

export interface Tolerances {
  title: string;
  reference: string;
  rules: ToleranceRules;
}

export interface AISC_360_Sections {
  J3_4_edge_distance: J3_4_EdgeDistance;
  J3_3_spacing: J3_3_Spacing;
  J2_4_weld_size: J2_4_WeldSize;
  tolerances: Tolerances;
}

export interface AISC_360 {
  name: string;
  version: string;
  url: string;
  sections: AISC_360_Sections;
}

// AWS D1.1 Types
export interface PrequalifiedJoint {
  type: string;
  description: string;
  max_thickness?: number;
  root_opening?: string;
  groove_angle?: string;
  root_face?: string;
  use_case: string;
}

export interface PrequalifiedJoints {
  title: string;
  reference: string;
  types: PrequalifiedJoint[];
}

export interface PreheatCheckResult {
  required: boolean;
  min_temp: number;
  reason: string;
}

export interface PreheatRules {
  check_preheat: (
    materialThickness: number,
    ambientTemp: number,
    materialGrade?: string
  ) => PreheatCheckResult;
}

export interface PreheatRequirements {
  title: string;
  reference: string;
  rules: PreheatRules;
}

export interface WeldSymbol {
  symbol: string;
  description: string;
}

export interface WeldSymbols {
  title: string;
  reference: string;
  common_symbols: WeldSymbol[];
}

export interface AWS_D1_1_Sections {
  prequalified_joints: PrequalifiedJoints;
  preheat_requirements: PreheatRequirements;
  weld_symbols: WeldSymbols;
}

export interface AWS_D1_1 {
  name: string;
  version: string;
  url: string;
  sections: AWS_D1_1_Sections;
}

// ASTM Types
export interface MaterialProperties {
  yield_strength: number;
  tensile_strength: number;
  elongation?: number;
  carbon_max?: number;
  yield_to_tensile_ratio?: number;
  carbon_equivalent_max?: number;
}

export interface MaterialGrade {
  designation: string;
  title: string;
  properties: MaterialProperties;
  applications: string[];
  weldability: string;
  cost_rating?: string;
  availability: string;
  notes?: string;
  grades?: Record<string, { yield: number; tensile: number }>;
}

export interface ASTM_Materials {
  name: string;
  url: string;
  common_grades: Record<string, MaterialGrade>;
}

// Manufacturing Practices Types
export interface StandardDrillSizes {
  fractional: number[];
  most_common: number[];
  tolerance: number;
}

export interface ClearanceHoles {
  description: string;
  standard_holes: Record<string, number>;
}

export interface EdgeDistanceFabrication {
  minimum: (holeDiameter: number) => number;
  preferred: (holeDiameter: number) => number;
  explanation: string;
}

export interface Drilling {
  standard_drill_sizes: StandardDrillSizes;
  clearance_holes: ClearanceHoles;
  edge_distance_fabrication: EdgeDistanceFabrication;
}

export interface StandardPlateSize {
  width: number;
  length: number;
  description: string;
}

export interface KerfAllowance {
  plasma: number;
  laser: number;
  waterjet: number;
  explanation: string;
}

export interface Cutting {
  standard_plate_sizes: StandardPlateSize[];
  kerf_allowance: KerfAllowance;
  nesting_margin: number;
  min_cut_length: number;
}

export interface MinBendRadius {
  description: string;
  formula: (thickness: number, material?: string) => number;
  explanation: string;
}

export interface BendAllowance {
  description: string;
  formula: (angle: number, radius: number, thickness: number) => number;
}

export interface Bending {
  min_bend_radius: MinBendRadius;
  bend_allowance: BendAllowance;
}

export interface WeldingAccessibility {
  min_clearance: number;
  min_angle: number;
  explanation: string;
}

export interface DistortionControl {
  thin_material: number;
  recommendations: string[];
}

export interface Welding {
  typical_fillet_sizes: number[];
  accessibility: WeldingAccessibility;
  distortion_control: DistortionControl;
}

export interface SurfaceFinishProcess {
  name: string;
  roughness: string;
  description: string;
}

export interface SurfaceFinish {
  typical_processes: SurfaceFinishProcess[];
}

export interface ManufacturingPractices {
  name: string;
  drilling: Drilling;
  cutting: Cutting;
  bending: Bending;
  welding: Welding;
  surface_finish: SurfaceFinish;
}

// Main Database Type
export interface StandardsDatabase {
  AISC_360: AISC_360;
  AWS_D1_1: AWS_D1_1;
  ASTM_MATERIALS: ASTM_Materials;
  MANUFACTURING_PRACTICES: ManufacturingPractices;
}

export const STANDARDS_DATABASE: StandardsDatabase = {
  
  // AISC 360 - Structural Steel Buildings (Simplified)
  AISC_360: {
    name: "AISC 360 - Specification for Structural Steel Buildings",
    version: "2022 (Reference)",
    url: "https://www.aisc.org/publications/steel-construction-manual-resources/",
    
    sections: {
      // Table J3.4 - Minimum Edge Distance (simplified)
      J3_4_edge_distance: {
        title: "Minimum Edge Distance for Bolted Connections",
        reference: "AISC 360 Table J3.4",
        rules: {
          rolled_edges: {
            description: "For rolled edges or oxygen cut edges",
            formula: (boltDiameter: number) => boltDiameter * 1.25,
            explanation: "Minimum edge distance = 1.25 × bolt diameter"
          },
          sheared_edges: {
            description: "For sheared or sawn edges",
            formula: (boltDiameter: number) => boltDiameter * 1.75,
            explanation: "Minimum edge distance = 1.75 × bolt diameter"
          }
        },
        typical_values: {
          "1/4": { rolled: 0.3125, sheared: 0.4375 },
          "3/8": { rolled: 0.46875, sheared: 0.65625 },
          "1/2": { rolled: 0.625, sheared: 0.875 },
          "5/8": { rolled: 0.78125, sheared: 1.09375 },
          "3/4": { rolled: 0.9375, sheared: 1.3125 },
          "7/8": { rolled: 1.09375, sheared: 1.53125 },
          "1": { rolled: 1.25, sheared: 1.75 }
        }
      },
      
      // Section J3.3 - Minimum Spacing
      J3_3_spacing: {
        title: "Minimum Spacing of Bolts",
        reference: "AISC 360 Section J3.3",
        rules: {
          minimum_spacing: {
            description: "Minimum center-to-center spacing",
            formula: (boltDiameter: number) => boltDiameter * 2.67,
            explanation: "Minimum spacing = 2⅔ × bolt diameter"
          },
          preferred_spacing: {
            description: "Preferred center-to-center spacing",
            formula: (boltDiameter: number) => boltDiameter * 3,
            explanation: "Preferred spacing = 3 × bolt diameter"
          }
        }
      },
      
      // Table J2.4 - Minimum Fillet Weld Size
      J2_4_weld_size: {
        title: "Minimum Size of Fillet Welds",
        reference: "AISC 360 Table J2.4",
        rules: {
          minimum_fillet: {
            description: "Minimum fillet weld size based on material thickness",
            getSize: (thicknessOfThinnerPart: number): number => {
              if (thicknessOfThinnerPart <= 0.25) return 0.125;
              if (thicknessOfThinnerPart <= 0.5) return 0.1875;
              if (thicknessOfThinnerPart <= 0.75) return 0.25;
              return 0.3125;
            },
            explanation: "Thinner part ≤1/4\" → 1/8\" weld, ≤1/2\" → 3/16\" weld, ≤3/4\" → 1/4\" weld, else 5/16\" weld"
          },
          maximum_fillet: {
            description: "Maximum fillet weld size",
            formula: (materialThickness: number) => materialThickness - 0.0625,
            explanation: "Maximum size = material thickness - 1/16\""
          }
        }
      },
      
      // Section 6 - Tolerances (AISC 303)
      tolerances: {
        title: "Dimensional Tolerances",
        reference: "AISC 303 Section 6",
        rules: {
          length_tolerance: {
            description: "Length tolerance for members",
            getTolerance: (length: number): number => {
              if (length <= 120) return 0.125; // ±1/8" for ≤10 ft
              return length / 960; // ±1/8" per 10 ft
            },
            explanation: "±1/8\" for lengths ≤10 ft, then ±1/8\" per 10 ft"
          },
          straightness: {
            description: "Straightness tolerance",
            formula: (length: number) => length / 120,
            explanation: "1/8\" per 10 ft of length"
          },
          hole_diameter: {
            description: "Hole diameter tolerance",
            standard: 0.0625, // +1/16", -0
            explanation: "+1/16\", -0 for standard holes"
          }
        }
      }
    }
  },
  
  // AWS D1.1 - Structural Welding Code (Simplified)
  AWS_D1_1: {
    name: "AWS D1.1 - Structural Welding Code - Steel",
    version: "2020 (Reference)",
    url: "https://www.aws.org/standards/",
    
    sections: {
      prequalified_joints: {
        title: "Prequalified Weld Joint Details",
        reference: "AWS D1.1 Section 3",
        types: [
          {
            type: "Square Groove (B-L1a)",
            description: "Square butt joint",
            max_thickness: 0.25,
            root_opening: "0 to 1/8\"",
            use_case: "Thin plates, complete penetration"
          },
          {
            type: "Single-V Groove (B-L2a)",
            description: "V-groove butt joint",
            groove_angle: "60° minimum",
            root_face: "0 to 1/8\"",
            root_opening: "0 to 1/4\"",
            use_case: "Medium to thick plates"
          },
          {
            type: "Fillet Weld",
            description: "Standard fillet weld - leg size per AISC 360 Table J2.4, maximum leg size equals material thickness",
            use_case: "T-joints, lap joints, corner joints"
          }
        ]
      },
      
      preheat_requirements: {
        title: "Preheat and Interpass Temperature",
        reference: "AWS D1.1 Table 3.2",
        rules: {
          check_preheat: (materialThickness: number, ambientTemp: number, materialGrade?: string): PreheatCheckResult => {
            // Simplified preheat requirements
            if (ambientTemp < 32) {
              return {
                required: true,
                min_temp: 70,
                reason: "Ambient temperature below 32°F"
              };
            }
            
            if (materialThickness > 1.0) {
              const grades_requiring_preheat = ['A572', 'A992', 'A588'];
              if (materialGrade && grades_requiring_preheat.some(g => materialGrade.includes(g))) {
                return {
                  required: true,
                  min_temp: 150,
                  reason: `Material thickness > 1\" and grade ${materialGrade}`
                };
              }
            }
            
            if (materialThickness > 1.5) {
              return {
                required: true,
                min_temp: 200,
                reason: "Material thickness > 1.5\""
              };
            }
            
            return {
              required: false,
              min_temp: 0,
              reason: "No preheat required"
            };
          }
        }
      },
      
      weld_symbols: {
        title: "Standard Welding Symbols",
        reference: "AWS A2.4",
        common_symbols: [
          { symbol: "Fillet", description: "Fillet weld - triangular cross section" },
          { symbol: "Groove", description: "Groove weld - prepared joint edges" },
          { symbol: "Plug/Slot", description: "Plug or slot weld" },
          { symbol: "Spot", description: "Spot weld" },
          { symbol: "All Around", description: "Weld all around the joint" },
          { symbol: "Field Weld", description: "Weld to be performed in field (not shop)" }
        ]
      }
    }
  },
  
  // ASTM Material Standards (Simplified)
  ASTM_MATERIALS: {
    name: "ASTM Steel Material Standards",
    url: "https://www.astm.org/",
    
    common_grades: {
      A36: {
        designation: "ASTM A36",
        title: "Standard Specification for Carbon Structural Steel",
        properties: {
          yield_strength: 36000, // psi
          tensile_strength: 58000, // psi (minimum)
          elongation: 20, // % (minimum)
          carbon_max: 0.26 // %
        },
        applications: [
          "General structural purposes",
          "Plates, shapes, and bars",
          "Bridges and buildings",
          "Riveted, bolted, or welded construction"
        ],
        weldability: "Excellent",
        cost_rating: "Low",
        availability: "Excellent"
      },
      
      A572_Grade_50: {
        designation: "ASTM A572 Grade 50",
        title: "High-Strength Low-Alloy Columbium-Vanadium Steel",
        properties: {
          yield_strength: 50000, // psi
          tensile_strength: 65000, // psi (minimum)
          elongation: 18, // % (minimum)
          carbon_max: 0.23 // %
        },
        applications: [
          "Structural shapes and plates",
          "High-strength applications",
          "Bridges and buildings requiring higher strength"
        ],
        weldability: "Good",
        cost_rating: "Medium",
        availability: "Excellent"
      },
      
      A992: {
        designation: "ASTM A992",
        title: "Structural Steel Shapes",
        properties: {
          yield_strength: 50000, // psi (minimum)
          tensile_strength: 65000, // psi (minimum)
          yield_to_tensile_ratio: 0.85, // maximum
          carbon_max: 0.23, // %
          carbon_equivalent_max: 0.47 // %
        },
        applications: [
          "Wide-flange beams (W-shapes)",
          "I-beams for building construction",
          "Most common for modern structural steel frames"
        ],
        weldability: "Excellent",
        cost_rating: "Medium",
        availability: "Excellent",
        notes: "Preferred for seismic applications due to toughness"
      },
      
      A500: {
        designation: "ASTM A500",
        title: "Cold-Formed Welded and Seamless Carbon Steel Structural Tubing",
        properties: {
          yield_strength: 42000, // Grade B minimum
          tensile_strength: 58000, // Grade B minimum
          elongation: 23 // % (minimum for Grade B)
        },
        grades: {
          B: { yield: 42000, tensile: 58000 },
          C: { yield: 46000, tensile: 62000 }
        },
        applications: [
          "Hollow structural sections (HSS)",
          "Square and rectangular tubing",
          "Circular tubing"
        ],
        weldability: "Good",
        availability: "Excellent"
      }
    }
  },
  
  // Common Manufacturing Practices (Industry Standards)
  MANUFACTURING_PRACTICES: {
    name: "Common Steel Fabrication Practices",
    
    drilling: {
      standard_drill_sizes: {
        fractional: [
          0.0625, 0.078125, 0.09375, 0.109375, 0.125, 0.140625, 0.15625, 
          0.171875, 0.1875, 0.203125, 0.21875, 0.234375, 0.25, 0.265625,
          0.28125, 0.296875, 0.3125, 0.328125, 0.34375, 0.359375, 0.375,
          0.390625, 0.40625, 0.421875, 0.4375, 0.453125, 0.46875, 0.484375,
          0.5, 0.515625, 0.53125, 0.546875, 0.5625, 0.578125, 0.59375,
          0.609375, 0.625, 0.640625, 0.65625, 0.671875, 0.6875, 0.703125,
          0.71875, 0.734375, 0.75, 0.765625, 0.78125, 0.796875, 0.8125,
          0.828125, 0.84375, 0.859375, 0.875, 0.890625, 0.90625, 0.921875,
          0.9375, 0.953125, 0.96875, 0.984375, 1.0
        ],
        most_common: [0.25, 0.3125, 0.375, 0.4375, 0.5, 0.5625, 0.625, 0.75, 0.875, 1.0],
        tolerance: 0.005 // ±0.005" typical drilling tolerance
      },
      
      clearance_holes: {
        description: "Clearance hole sizes for standard bolts",
        standard_holes: {
          "1/4": 0.28125,  // 9/32" clearance for 1/4" bolt
          "5/16": 0.34375, // 11/32" clearance
          "3/8": 0.40625,  // 13/32" clearance
          "7/16": 0.46875, // 15/32" clearance
          "1/2": 0.53125,  // 17/32" clearance
          "5/8": 0.65625,  // 21/32" clearance
          "3/4": 0.8125,   // 13/16" clearance
          "7/8": 0.9375,   // 15/16" clearance
          "1": 1.0625      // 1-1/16" clearance
        }
      },
      
      edge_distance_fabrication: {
        minimum: (holeDiameter: number) => holeDiameter * 1.5,
        preferred: (holeDiameter: number) => holeDiameter * 2.0,
        explanation: "1.5× minimum for structural integrity, 2× preferred for ease of fabrication"
      }
    },
    
    cutting: {
      standard_plate_sizes: [
        { width: 48, length: 96, description: "4' × 8' standard sheet" },
        { width: 48, length: 120, description: "4' × 10' standard sheet" },
        { width: 60, length: 120, description: "5' × 10' standard sheet" },
        { width: 60, length: 144, description: "5' × 12' standard sheet" },
        { width: 72, length: 144, description: "6' × 12' standard sheet" }
      ],
      
      kerf_allowance: {
        plasma: 0.125, // 1/8" typical kerf for plasma cutting
        laser: 0.0625, // 1/16" typical kerf for laser cutting
        waterjet: 0.04, // ~0.04" typical kerf for waterjet
        explanation: "Material removed by cutting process"
      },
      
      nesting_margin: 0.5, // 1/2" margin for part nesting
      
      min_cut_length: 0.25 // Minimum 1/4" cut length for stability
    },
    
    bending: {
      min_bend_radius: {
        description: "Minimum inside bend radius to avoid cracking",
        formula: (thickness: number, material: string = 'A36'): number => {
          const multipliers: Record<string, number> = {
            'A36': 1.5,
            'A572': 2.0,
            'A588': 2.5,
            'A992': 1.5,
            'Stainless': 2.0
          };
          return thickness * (multipliers[material] || 2.0);
        },
        explanation: "Softer steels (A36) can bend tighter, harder steels need larger radius"
      },
      
      bend_allowance: {
        description: "Material stretch during bending",
        formula: (angle: number, radius: number, thickness: number): number => {
          // Simplified bend allowance calculation
          const k_factor = 0.33; // Common K-factor for steel
          return (angle / 90) * (radius + k_factor * thickness) * 1.5708;
        }
      }
    },
    
    welding: {
      typical_fillet_sizes: [0.125, 0.1875, 0.25, 0.3125, 0.375, 0.5],
      
      accessibility: {
        min_clearance: 3.0, // 3" minimum for welding torch access
        min_angle: 60, // 60° minimum included angle for V-groove
        explanation: "Welder needs space to access joint"
      },
      
      distortion_control: {
        thin_material: 0.125, // Materials ≤1/8" prone to warping
        recommendations: [
          "Use fixturing for thin materials",
          "Consider skip welding or back-step sequence",
          "Preheat thick materials to reduce thermal shock"
        ]
      }
    },
    
    surface_finish: {
      typical_processes: [
        { name: "As-Cut", roughness: "250-500 µin", description: "No additional finishing" },
        { name: "Ground", roughness: "32-125 µin", description: "Surface grinding" },
        { name: "Machined", roughness: "16-63 µin", description: "CNC machining" },
        { name: "Polished", roughness: "2-16 µin", description: "Polishing/buffing" }
      ]
    }
  }
};

// Helper function return types
export interface StandardReference {
  standard: string;
  section?: any;
  url: string;
}

export interface EdgeDistanceCompliance {
  compliant: boolean;
  required: number;
  actual: number;
  margin: number;
  reference: string;
  explanation: string;
}

export interface SpacingCompliance {
  compliant: boolean;
  meetsPreferred: boolean;
  minimum: number;
  preferred: number;
  actual: number;
  margin: number;
  reference: string;
  recommendation: string;
}

// Helper function to get standard reference
export function getStandardReference(standardCode: string, section?: string): StandardReference | null {
  const parts = standardCode.split('_');
  const standard = STANDARDS_DATABASE[parts[0] as keyof StandardsDatabase] as any;
  
  if (!standard) return null;
  
  if (section && standard.sections && standard.sections[section]) {
    return {
      standard: standard.name,
      section: standard.sections[section],
      url: standard.url
    };
  }
  
  return {
    standard: standard.name,
    url: standard.url
  };
}

// Helper function to check bolt edge distance compliance
export function checkEdgeDistanceCompliance(
  holeDiameter: number,
  edgeDistance: number,
  edgeType: EdgeType = 'rolled'
): EdgeDistanceCompliance {
  const aisc = STANDARDS_DATABASE.AISC_360.sections.J3_4_edge_distance;
  const minRequired = aisc.rules[`${edgeType}_edges`].formula(holeDiameter);
  
  const compliant = edgeDistance >= minRequired;
  
  return {
    compliant,
    required: minRequired,
    actual: edgeDistance,
    margin: edgeDistance - minRequired,
    reference: aisc.reference,
    explanation: aisc.rules[`${edgeType}_edges`].explanation
  };
}

// Helper function to check hole spacing compliance
export function checkSpacingCompliance(
  holeDiameter: number,
  spacing: number
): SpacingCompliance {
  const aisc = STANDARDS_DATABASE.AISC_360.sections.J3_3_spacing;
  const minRequired = aisc.rules.minimum_spacing.formula(holeDiameter);
  const preferred = aisc.rules.preferred_spacing.formula(holeDiameter);
  
  const compliant = spacing >= minRequired;
  const meetsPreferred = spacing >= preferred;
  
  return {
    compliant,
    meetsPreferred,
    minimum: minRequired,
    preferred,
    actual: spacing,
    margin: spacing - minRequired,
    reference: aisc.reference,
    recommendation: meetsPreferred ? 
      "Spacing meets preferred standard" : 
      "Consider increasing to preferred spacing for better performance"
  };
}

// Helper function to get material properties
export function getMaterialProperties(grade: string): MaterialGrade {
  const materials = STANDARDS_DATABASE.ASTM_MATERIALS.common_grades;
  
  // Normalize grade name
  const normalizedGrade = grade.replace(/[-\s]/g, '_').toUpperCase();
  
  return materials[normalizedGrade] || materials['A36']; // Default to A36
}

export default STANDARDS_DATABASE;




