// Sample data for CAD Drawing Generator
export const sampleDrawings = [
  { 
    id: 1, 
    name: "Steel Beam", 
    description: "I-beam 200mm x 100mm x 10mm",
    preview: "/images/steel-beam-cad-preview.svg", 
    dxf: "/sample-drawings/steel-beam-drawing.pdf",
    category: "structural"
  },
  { 
    id: 2, 
    name: "Steel Plate", 
    description: "Rectangular plate 300mm x 200mm x 15mm",
    preview: "/images/sample-cad-preview.svg", 
    dxf: "/sample-drawings/bracket-drawing.pdf",
    category: "structural"
  },
  { 
    id: 3, 
    name: "Mounting Bracket", 
    description: "L-bracket 150mm x 100mm with 4 holes",
    preview: "/images/bracket-cad-preview.svg", 
    dxf: "/sample-drawings/bracket-drawing.pdf",
    category: "custom"
  },
  { 
    id: 4, 
    name: "Servo Motor Mount", 
    description: "Custom servo motor mounting bracket",
    preview: "/images/fastener-cad-preview.svg", 
    dxf: "/sample-drawings/servo-motor-drawing.pdf",
    category: "robotic"
  }
];

// Sample templates for CAD Generator
export const cadTemplates = [
  {
    id: 1,
    name: "I-Beam",
    category: "structural",
    description: "Standard I-beam with customizable dimensions",
    preview: "/images/steel-beam-cad-preview.svg",
    parameters: {
      height: { label: "Height", value: "200", unit: "mm", min: 100, max: 500 },
      width: { label: "Flange Width", value: "100", unit: "mm", min: 50, max: 300 },
      webThickness: { label: "Web Thickness", value: "8", unit: "mm", min: 5, max: 20 },
      flangeThickness: { label: "Flange Thickness", value: "12", unit: "mm", min: 8, max: 25 },
      length: { label: "Length", value: "1000", unit: "mm", min: 500, max: 6000 },
      material: { label: "Material", value: "SS304", options: ["SS304", "SS316", "Carbon Steel", "Aluminum"] }
    }
  },
  {
    id: 2,
    name: "Rectangular Plate",
    category: "structural", 
    description: "Flat plate with optional holes",
    preview: "/images/sample-cad-preview.svg",
    parameters: {
      length: { label: "Length", value: "300", unit: "mm", min: 100, max: 2000 },
      width: { label: "Width", value: "200", unit: "mm", min: 50, max: 1000 },
      thickness: { label: "Thickness", value: "10", unit: "mm", min: 3, max: 50 },
      holeCount: { label: "Number of Holes", value: "4", unit: "", min: 0, max: 20 },
      holeDiameter: { label: "Hole Diameter", value: "8", unit: "mm", min: 3, max: 25 },
      material: { label: "Material", value: "SS304", options: ["SS304", "SS316", "Carbon Steel", "Aluminum"] }
    }
  },
  {
    id: 3,
    name: "L-Bracket",
    category: "custom",
    description: "Right-angle bracket with mounting holes",
    preview: "/images/bracket-cad-preview.svg",
    parameters: {
      height: { label: "Height", value: "150", unit: "mm", min: 50, max: 500 },
      width: { label: "Width", value: "100", unit: "mm", min: 50, max: 300 },
      thickness: { label: "Thickness", value: "5", unit: "mm", min: 2, max: 20 },
      holeCount: { label: "Mounting Holes", value: "4", unit: "", min: 2, max: 12 },
      holeDiameter: { label: "Hole Diameter", value: "6", unit: "mm", min: 3, max: 15 },
      bendRadius: { label: "Bend Radius", value: "5", unit: "mm", min: 2, max: 15 },
      material: { label: "Material", value: "Aluminum", options: ["Aluminum", "SS304", "Carbon Steel"] }
    }
  },
  {
    id: 4,
    name: "Servo Mount",
    category: "robotic",
    description: "Servo motor mounting bracket",
    preview: "/images/fastener-cad-preview.svg",
    parameters: {
      servoType: { label: "Servo Type", value: "SG90", options: ["SG90", "MG996R", "DS3218", "Custom"] },
      mountingHoles: { label: "Mounting Holes", value: "4", unit: "", min: 2, max: 8 },
      thickness: { label: "Bracket Thickness", value: "3", unit: "mm", min: 2, max: 10 },
      height: { label: "Mount Height", value: "25", unit: "mm", min: 15, max: 50 },
      cableManagement: { label: "Cable Management", value: "true", options: ["true", "false"] },
      material: { label: "Material", value: "Aluminum", options: ["Aluminum", "ABS Plastic", "Carbon Fiber"] }
    }
  }
];

// Sample data for Product Recommender
export const sampleRecommendations = [
  { 
    id: 1, 
    name: "Steel Beam A", 
    material: "SS304", 
    price: 50, 
    compatibility: 95,
    description: "High-grade stainless steel I-beam",
    supplier: "SteelCorp Ltd",
    leadTime: "5-7 days"
  },
  { 
    id: 2, 
    name: "Aluminum Beam X", 
    material: "Aluminum 6061", 
    price: 40, 
    compatibility: 85,
    description: "Lightweight aluminum alternative",
    supplier: "AlumTech Inc",
    leadTime: "3-5 days"
  },
  { 
    id: 3, 
    name: "Carbon Steel Beam", 
    material: "AISI 1045", 
    price: 35, 
    compatibility: 90,
    description: "Standard carbon steel beam",
    supplier: "MetalWorks Co",
    leadTime: "7-10 days"
  }
];

// Sample data for RFQ Module
export const sampleRFQs = [
  { 
    id: 1, 
    drawing: "Steel Beam", 
    quantity: 10, 
    status: "Submitted",
    submittedDate: "2024-01-15",
    expectedDelivery: "2024-02-01",
    priority: "Medium"
  },
  { 
    id: 2, 
    drawing: "Steel Plate", 
    quantity: 5, 
    status: "Approved",
    submittedDate: "2024-01-10",
    expectedDelivery: "2024-01-25",
    priority: "High"
  },
  { 
    id: 3, 
    drawing: "Mounting Bracket", 
    quantity: 25, 
    status: "In Review",
    submittedDate: "2024-01-18",
    expectedDelivery: "2024-02-10",
    priority: "Low"
  }
];

// Sample manufacturability validation results for CAD Analyzer
export const sampleManufacturabilityResults = [
  {
    id: 1,
    check: "Wall Thickness",
    status: "Valid",
    value: "15mm",
    requirement: "Min 10mm",
    message: "Thickness meets manufacturing requirements",
    suggestion: "Current thickness is optimal for strength and manufacturability"
  },
  {
    id: 2,
    check: "Hole Diameter",
    status: "Warning",
    value: "3mm",
    requirement: "Min 5mm recommended",
    message: "Small holes may be difficult to manufacture accurately",
    suggestion: "Increase hole diameter to 5mm or use specialized drilling equipment"
  },
  {
    id: 3,
    check: "Bend Radius",
    status: "Invalid",
    value: "2mm",
    requirement: "Min 5mm for 10mm thickness",
    message: "Bend radius too small for material thickness",
    suggestion: "Increase bend radius to 5mm to prevent cracking during forming"
  },
  {
    id: 4,
    check: "Surface Finish",
    status: "Valid",
    value: "Ra 3.2μm",
    requirement: "Ra ≤ 6.3μm",
    message: "Surface finish is achievable with standard machining",
    suggestion: "Current specification is optimal for cost and quality"
  },
  {
    id: 5,
    check: "Tolerance Requirements",
    status: "Warning",
    value: "±0.1mm",
    requirement: "±0.2mm standard",
    message: "Tight tolerances will increase manufacturing cost",
    suggestion: "Consider relaxing tolerance to ±0.2mm where possible to reduce cost"
  }
];

// Sample specification verification results for CAD Analyzer
export const sampleSpecificationResults = [
  {
    id: 1,
    specification: "Material Grade",
    status: "Valid",
    value: "SS304",
    standard: "ASTM A240",
    verified: true,
    notes: "Material properties confirmed against standard specifications"
  },
  {
    id: 2,
    specification: "Dimensions",
    status: "Valid",
    value: "200x100x10mm",
    standard: "ISO 2768-m",
    verified: true,
    notes: "All dimensions within specified tolerances"
  },
  {
    id: 3,
    specification: "Hole Pattern",
    status: "Valid",
    value: "4x Ø6mm holes",
    standard: "ISO 4762",
    verified: true,
    notes: "Hole pattern matches standard bolt patterns"
  },
  {
    id: 4,
    specification: "Weld Requirements",
    status: "Missing",
    value: "Not specified",
    standard: "AWS D1.1",
    verified: false,
    notes: "Welding specifications not provided in drawing"
  },
  {
    id: 5,
    specification: "Heat Treatment",
    status: "Invalid",
    value: "Annealed at 900°C",
    standard: "ASTM A240",
    verified: false,
    notes: "Temperature exceeds recommended range for SS304 (1010-1120°C)"
  },
  {
    id: 6,
    specification: "Coating/Finish",
    status: "Valid",
    value: "Passivated",
    standard: "ASTM A967",
    verified: true,
    notes: "Passivation process appropriate for stainless steel"
  }
];

// Sample analysis report data
export const sampleAnalysisReport = {
  drawingName: "Steel Mounting Bracket",
  analyzedDate: "2024-01-20",
  overallStatus: "Partially Valid",
  manufacturability: 75,
  costEstimate: "$45-65 per unit",
  leadTime: "7-10 days",
  recommendations: [
    "Increase bend radius from 2mm to 5mm",
    "Consider using standard hole sizes (5mm, 8mm, 10mm)",
    "Material SS304 is optimal for this application"
  ],
  specifications: {
    material: "SS304 Stainless Steel",
    dimensions: "150mm x 100mm x 10mm",
    weight: "0.85kg",
    surfaceFinish: "Mill finish",
    tolerance: "±0.5mm"
  }
};

// Sample text generation results
export const sampleTextGenerations = [
  {
    input: "Generate a 10mm x 20mm steel beam with 4 holes",
    result: {
      drawingId: 1,
      description: "I-beam with 10mm web thickness, 20mm flange width, 4 mounting holes",
      preview: "/images/steel-beam-cad-preview.svg",
      parameters: {
        webThickness: "10mm",
        flangeWidth: "20mm",
        holes: 4,
        holeSize: "6mm",
        material: "SS304"
      }
    }
  },
  {
    input: "Create a mounting bracket for servo motor",
    result: {
      drawingId: 4,
      description: "L-bracket designed for standard servo motor mounting",
      preview: "/images/fastener-cad-preview.svg",
      parameters: {
        height: "50mm",
        width: "40mm",
        thickness: "5mm",
        servoType: "SG90",
        mountingHoles: 4
      }
    }
  }
];


// ML Prompt Templates
// Predefined templates for text-to-CAD generation
// Last updated: 2025-11-16T08:56:01.731Z

export interface MLPromptTemplate {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category?: string;
  tags?: string[];
  example_output?: string;
}

export const mlPromptTemplates: MLPromptTemplate[] = [
  {
    "id": "template-1",
    "title": "I-Beam",
    "description": "Standard structural I-beam with specified dimensions",
    "prompt": "I-beam, 12 in long, 4 in high, 2.66 x 0.29 in flange, 0.19 in web, 0.46 in root radius",
    "category": "structural",
    "tags": [
      "beam",
      "structural",
      "i-beam",
      "steel"
    ]
  },
  {
    "id": "template-2",
    "title": "Drill Guide",
    "description": "Surgical drill guide with multiple bit sizes and rotating grips",
    "prompt": "Surgical drill guide, 150 mm handle, Ø2 & Ø3.2 mm bits, twin bit mounts with rotating grips",
    "category": "medical",
    "tags": [
      "surgical",
      "drill",
      "guide",
      "medical",
      "precision"
    ]
  },
  {
    "id": "template-3",
    "title": "Gallows Frame",
    "description": "Large structural frame with brackets and angle iron construction",
    "prompt": "Gallows frame, 2400x1250x450 mm, 6 brackets, angle iron",
    "category": "structural",
    "tags": [
      "frame",
      "structural",
      "brackets",
      "angle-iron",
      "large-scale"
    ]
  },
  {
    "id": "template-4",
    "title": "Brake Rotor",
    "description": "Vented automotive brake rotor with bolt pattern",
    "prompt": "A 320mm vented brake rotor with 5 M12 holes on 114.3mm PCD",
    "category": "automotive",
    "tags": [
      "brake",
      "rotor",
      "automotive",
      "vented",
      "disc"
    ]
  }
];
