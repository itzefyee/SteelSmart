/**
 * Sample Data for SteelSmart Application
 * 
 * This file contains static data for:
 * - CAD Generator templates (cadTemplates, mlPromptTemplates)
 * - Product Recommender demo data (sampleDrawings, sampleRecommendations)
 * 
 * Note: Actual product catalog data is stored in Supabase.
 * This file is for UI templates and demo functionality only.
 */

// Sample drawings for Product Recommender demo
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

// CAD Generator templates with parameters
export const cadTemplates = [
  {
    id: 1,
    name: "I-Beam",
    category: "structural",
    description: "Standard structural I-beam with specified dimensions",
    preview: "https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/steel-beam-001/preview.png",
    parameters: {
      length: { label: "Length", value: "12", unit: "in", min: 5, max: 100 },
      height: { label: "Height", value: "4", unit: "in", min: 1, max: 20 },
      flangeWidth: { label: "Flange Width", value: "2.66", unit: "in", min: 1, max: 10 },
      flangeThickness: { label: "Flange Thickness", value: "0.29", unit: "in", min: 0.1, max: 1 },
      webThickness: { label: "Web Thickness", value: "0.19", unit: "in", min: 0.1, max: 1 },
      rootRadius: { label: "Root Radius", value: "0.46", unit: "in", min: 0.1, max: 1 },
      material: { label: "Material", value: "Steel", options: ["Steel", "Aluminum", "Carbon Fiber"] }
    }
  },
  {
    id: 2,
    name: "Drill Guide",
    category: "medical", 
    description: "Surgical drill guide with multiple bit sizes and rotating grips",
    preview: "https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/surgical_drill_guide/preview.png",
    parameters: {
      handleLength: { label: "Handle Length", value: "150", unit: "mm", min: 50, max: 300 },
      bitSize1: { label: "Bit Size 1", value: "2", unit: "mm", min: 1, max: 10 },
      bitSize2: { label: "Bit Size 2", value: "3.2", unit: "mm", min: 1, max: 10 },
      gripType: { label: "Grip Type", value: "Rotating", options: ["Rotating", "Fixed", "Ergonomic"] },
      material: { label: "Material", value: "Surgical Steel", options: ["Surgical Steel", "Titanium", "PEEK"] }
    }
  },
  {
    id: 3,
    name: "Gallows Frame",
    category: "structural",
    description: "Large structural frame with brackets and angle iron construction",
    preview: "https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/gallows_frame/preview.png",
    parameters: {
      height: { label: "Height", value: "2400", unit: "mm", min: 1000, max: 5000 },
      width: { label: "Width", value: "1250", unit: "mm", min: 500, max: 3000 },
      depth: { label: "Depth", value: "450", unit: "mm", min: 200, max: 1000 },
      bracketCount: { label: "Brackets", value: "6", unit: "", min: 2, max: 20 },
      profileType: { label: "Profile", value: "Angle Iron", options: ["Angle Iron", "Box Section", "C-Channel"] },
      material: { label: "Material", value: "Steel", options: ["Steel", "Galvanized Steel"] }
    }
  },
  {
    id: 4,
    name: "Brake Rotor",
    category: "automotive",
    description: "Vented automotive brake rotor with bolt pattern",
    preview: "https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/brake_rotor/preview.png",
    parameters: {
      diameter: { label: "Rotor Diameter", value: "320", unit: "mm", min: 200, max: 450 },
      holeCount: { label: "Bolt Holes", value: "5", unit: "", min: 3, max: 8 },
      holeType: { label: "Hole Type", value: "M12", options: ["M10", "M12", "M14"] },
      pcd: { label: "PCD", value: "114.3", unit: "mm", min: 90, max: 150 },
      type: { label: "Type", value: "Vented", options: ["Vented", "Solid", "Slotted"] },
      material: { label: "Material", value: "Cast Iron", options: ["Cast Iron", "Carbon Ceramic", "Steel"] }
    }
  }
];

// ML Prompt Templates for text-to-CAD generation
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
    id: "template-1",
    title: "I-Beam",
    description: "Standard structural I-beam with specified dimensions",
    prompt: "I-beam, 12 in long, 4 in high, 2.66 x 0.29 in flange, 0.19 in web, 0.46 in root radius",
    category: "structural",
    tags: ["beam", "structural", "i-beam", "steel"]
  },
  {
    id: "template-2",
    title: "Drill Guide",
    description: "Surgical drill guide with multiple bit sizes and rotating grips",
    prompt: "Surgical drill guide, 150 mm handle, Ø2 & Ø3.2 mm bits, twin bit mounts with rotating grips",
    category: "medical",
    tags: ["surgical", "drill", "guide", "medical", "precision"]
  },
  {
    id: "template-3",
    title: "Gallows Frame",
    description: "Large structural frame with brackets and angle iron construction",
    prompt: "Gallows frame, 2400x1250x450 mm, 6 brackets, angle iron",
    category: "structural",
    tags: ["frame", "structural", "brackets", "angle-iron", "large-scale"]
  },
  {
    id: "template-4",
    title: "Brake Rotor",
    description: "Vented automotive brake rotor with bolt pattern",
    prompt: "A 320mm vented brake rotor with 5 M12 holes on 114.3mm PCD",
    category: "automotive",
    tags: ["brake", "rotor", "automotive", "vented", "disc"]
  }
];

// Product Recommender demo data
export const sampleRecommendations = [
  { 
    id: 1, 
    name: "Standard I-Beam", 
    material: "Steel", 
    price: 150, 
    compatibility: 95, 
    description: "Standard structural I-beam with specified dimensions", 
    supplier: "SteelCorp Ltd", 
    leadTime: "5-7 days" 
  },
  { 
    id: 2, 
    name: "Surgical Drill Guide", 
    material: "Surgical Steel", 
    price: 320, 
    compatibility: 88, 
    description: "Surgical drill guide with multiple bit sizes and rotating grips", 
    supplier: "MedTech Solutions", 
    leadTime: "3-5 days" 
  },
  { 
    id: 3, 
    name: "Gallows Frame", 
    material: "Galvanized Steel", 
    price: 450, 
    compatibility: 92, 
    description: "Large structural frame with brackets and angle iron construction", 
    supplier: "BuildRight Industries", 
    leadTime: "7-10 days" 
  }
];
