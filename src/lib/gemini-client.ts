// Google Gemini API client for drawing analysis
import { GoogleGenerativeAI } from '@google/generative-ai';

export const GEMINI_ANALYSIS_PROMPT = `
You are a technical expert analyzing engineering drawings and technical specifications.

Analyze the uploaded technical drawing/document and extract:

1. **Product Name**: The specific product name or identifier (e.g., "I-Beam Steel", "Servo Motor", "Hex Bolt M12")
2. **Dimensions & Measurements**: Any specified dimensions, sizes, or measurements
3. **Material Requirements**: Specified materials or material properties  
4. **Load/Stress Requirements**: Weight capacity, force ratings, or stress specifications
5. **Component Type**: What type of component this appears to be (structural, mechanical, robotic, etc.)
6. **Tolerances**: Any precision or tolerance requirements mentioned
7. **Connection Methods**: How this component connects to others (bolts, welds, etc.)

**IMPORTANT for Product Name**:
- Be as specific as possible (e.g., "I-Beam Steel" not just "beam")
- Include size/grade if visible (e.g., "Hex Bolt M12" not just "bolt")
- Use industry-standard terminology
- If the drawing has a title or part name, use that
- Examples of good product names:
  * "I-Beam Steel" (not "structural beam")
  * "Servo Motor" (not "motor")
  * "Brake Rotor" (not "rotor")
  * "Mounting Bracket" (not "bracket")
  * "Hex Bolt M12" (not "fastener")

CRITICAL: You MUST always provide a productName. If the exact product name is not visible in the drawing, infer it from:
1. The component type and shape (e.g., "Brake Rotor", "Mounting Bracket", "Steel Beam")
2. The visible features (e.g., if you see holes and flanges, it might be a "Flange Plate")
3. The dimensions and material (e.g., "Steel I-Beam 200mm")

Never leave productName as null. Always provide your best identification.

Respond ONLY with valid JSON in this exact format:
{
  "extractedSpecs": {
    "productName": "REQUIRED: specific product name (never null)",
    "dimensions": "extracted dimensions or null",
    "material": "material type or null", 
    "loadRequirements": "load/capacity info or null",
    "componentType": "component category or null",
    "tolerance": "precision requirements or null"
  },
  "confidence": 0.85,
  "reasoning": "Brief explanation of what was identified and extraction confidence",
  "suggestedCategories": ["category1", "category2"]
}

Be specific about measurements and technical details. If information is unclear or missing, set those fields to null (except productName which is always required).
`;

interface GeminiAnalysisResponse {
  extractedSpecs: {
    productName?: string | null;
    dimensions?: string | null;
    material?: string | null;
    loadRequirements?: string | null;
    componentType?: string | null;
    tolerance?: string | null;
  };
  confidence: number;
  reasoning: string;
  suggestedCategories: string[];
}

export class GeminiClient {
  private genAI: GoogleGenerativeAI | null = null;
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_BACKUP_API_KEY ||'';
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }
  }

  async analyzeDrawing(
    fileBuffer: Buffer,
    mimeType: string,
    filename?: string,
    cadModelData?: any
  ): Promise<GeminiAnalysisResponse> {
    if (!this.apiKey || !this.model) {
      throw new Error('Gemini API key not configured or model not initialized');
    }

    try {
      // Convert file to base64 for Gemini
      const base64Data = fileBuffer.toString('base64');

      // Check if this is a sample file (very small size indicates placeholder)
      if (fileBuffer.length < 100) {
        // For sample files, use default mock analysis for better demo results
        return this.getSampleAnalysis(filename, cadModelData);
      }

      // For real files, prepare the image part for Gemini
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      };

      // Build enhanced prompt with CAD data if available
      let promptText = GEMINI_ANALYSIS_PROMPT;
      if (cadModelData) {
        promptText += this.buildCADDataContext(cadModelData);
      }

      console.log('Analyzing drawing with Gemini API (with image and CAD data)...');

      // Call Gemini API with the image and prompt
      const result = await this.model.generateContent([
        promptText,
        imagePart
      ]);

      const response = await result.response;
      const text = response.text();
      

      // Parse the JSON response
      try {
        // Clean up the response text (remove markdown code blocks if present)
        const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const analysisResult = JSON.parse(cleanedText);
        
        // Validate the response structure
        if (!analysisResult.extractedSpecs || typeof analysisResult.confidence !== 'number') {
          throw new Error('Invalid response structure from Gemini API');
        }

        // Ensure productName is never null - use componentType as fallback
        if (!analysisResult.extractedSpecs.productName) {
          analysisResult.extractedSpecs.productName = 
            analysisResult.extractedSpecs.componentType || 
            'Unknown Component';
        }

        return analysisResult;
        
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
        console.error('Raw response text:', text);
        
        // Fallback: return a structured response based on the raw text
        return {
          extractedSpecs: {
            productName: "Unknown Component",
            dimensions: null,
            material: null,
            loadRequirements: null,
            componentType: "unknown",
            tolerance: null
          },
          confidence: 0.5,
          reasoning: "Failed to parse structured response from AI analysis. Raw response: " + text.substring(0, 200),
          suggestedCategories: ["custom"]
        };
      }

    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new Error(`Failed to analyze drawing with Gemini API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async isConfigured(): Promise<boolean> {
    return !!(this.apiKey && this.model);
  }

  private buildCADDataContext(cadModelData: any): string {
    let context = '\n\n## Additional 3D CAD Model Data Extracted:\n\n';

    if (cadModelData.boundingBox) {
      const bbox = cadModelData.boundingBox;
      context += `**Bounding Box Dimensions**:\n`;
      if (bbox.length != null) {
        context += `- Length: ${bbox.length.toFixed(2)}" (${(bbox.length * 25.4).toFixed(1)}mm)\n`;
      }
      if (bbox.width != null) {
        context += `- Width: ${bbox.width.toFixed(2)}" (${(bbox.width * 25.4).toFixed(1)}mm)\n`;
      }
      if (bbox.height != null) {
        context += `- Height: ${bbox.height.toFixed(2)}" (${(bbox.height * 25.4).toFixed(1)}mm)\n`;
      }
      if (bbox.volume != null) {
        context += `- Volume: ${bbox.volume.toFixed(2)} cubic inches\n\n`;
      }
    }

    if (cadModelData.boundingBoxWithTolerance) {
      const bbox = cadModelData.boundingBoxWithTolerance;
      if (bbox.tolerance != null) {
        context += `**AISC 303 Tolerance**: ±${bbox.tolerance.toFixed(3)}"\n\n`;
      }
    }

    if (cadModelData.faceCount) {
      context += `**Geometry Complexity**:\n`;
      context += `- Total Faces: ${cadModelData.faceCount}\n`;
      if (cadModelData.edgeCount) context += `- Total Edges: ${cadModelData.edgeCount}\n`;
      if (cadModelData.vertexCount) context += `- Total Vertices: ${cadModelData.vertexCount}\n\n`;
    }

    if (cadModelData.holeAnalysis && cadModelData.holeAnalysis.count > 0) {
      const holes = cadModelData.holeAnalysis;
      context += `**Hole Analysis** (${holes.count} holes detected):\n`;
      if (holes.holes && Array.isArray(holes.holes)) {
        holes.holes.forEach((hole: any, idx: number) => {
          if (hole.diameter != null) {
            context += `- Hole #${idx + 1}: Diameter ${hole.diameter.toFixed(4)}" ${hole.isStandardSize ? '(standard)' : '(non-standard)'}\n`;
          }
        });
      }
      if (holes.nonStandardSizes && holes.nonStandardSizes.length > 0) {
        context += `- ${holes.nonStandardSizes.length} non-standard drill sizes detected\n`;
      }
      if (holes.spacingViolations && holes.spacingViolations.length > 0) {
        context += `- ${holes.spacingViolations.length} AISC 360 spacing violations\n`;
      }
      context += '\n';
    }

    if (cadModelData.thicknessAnalysis) {
      const thickness = cadModelData.thicknessAnalysis;
      if (thickness.estimatedThickness != null) {
        context += `**Material Thickness**: ${thickness.estimatedThickness.toFixed(3)}"\n`;
      }
      if (thickness.isStandardGauge != null) {
        context += `- Standard Gauge: ${thickness.isStandardGauge ? 'Yes' : 'No'}\n`;
      }
      if (thickness.minWeldSize != null) {
        context += `- Min Weld Size (AISC 360): ${thickness.minWeldSize.toFixed(3)}"\n`;
      }
      if (thickness.requiresPreheat != null) {
        context += `- Preheat Required (AWS D1.1): ${thickness.requiresPreheat ? 'Yes' : 'No'}\n\n`;
      }
    }

    if (cadModelData.edgeAnalysis) {
      const edges = cadModelData.edgeAnalysis;
      if (edges.totalEdges != null) {
        context += `**Edge Analysis**: ${edges.totalEdges} edges\n`;
      }
      if (edges.sharpCorners && edges.sharpCorners.length > 0) {
        context += `- ${edges.sharpCorners.length} sharp corners detected (< 1/8" radius)\n\n`;
      }
    }

    if (cadModelData.weldJointAnalysis && cadModelData.weldJointAnalysis.totalJoints > 0) {
      const welds = cadModelData.weldJointAnalysis;
      context += `**Weld Joint Analysis**: ${welds.totalJoints} potential weld joints\n`;
      context += `- Accessibility Issues: ${welds.accessibilityIssues}\n`;
      const compliantJoints = welds.joints.filter((j: any) => j.meetsAWSRequirement).length;
      context += `- AWS D1.1 Compliant: ${compliantJoints}/${welds.totalJoints}\n\n`;
    }

    if (cadModelData.bendAnalysis && cadModelData.bendAnalysis.totalBends > 0) {
      const bends = cadModelData.bendAnalysis;
      context += `**Bend Analysis**: ${bends.totalBends} bends detected\n`;
      context += `- Material Grade: ${bends.materialGrade}\n`;
      context += `- Min Bend Radius: ${bends.minBendRadius.toFixed(3)}"\n`;
      context += `- Violations: ${bends.violations}\n\n`;
    }

    context += '\n**Use this extracted CAD data to provide more accurate dimensions, material thickness, and manufacturing specifications in your analysis.**\n';

    return context;
  }

  private getSampleAnalysis(filename?: string, cadModelData?: any): GeminiAnalysisResponse {
    // If we have CAD model data, use it to build a more accurate analysis
    if (cadModelData) {
      const dimensions = cadModelData.boundingBox
        ? `${(cadModelData.boundingBox.length * 25.4).toFixed(1)}mm x ${(cadModelData.boundingBox.width * 25.4).toFixed(1)}mm x ${(cadModelData.boundingBox.height * 25.4).toFixed(1)}mm`
        : null;

      const material = cadModelData.thicknessAnalysis
        ? `Steel (${cadModelData.thicknessAnalysis.estimatedThickness.toFixed(3)}" thick)`
        : null;

      const componentType = cadModelData.holeAnalysis?.count > 0
        ? 'mounting bracket or structural component'
        : 'structural component';

      const tolerance = cadModelData.boundingBoxWithTolerance
        ? `±${cadModelData.boundingBoxWithTolerance.tolerance.toFixed(3)}"`
        : null;

      return {
        extractedSpecs: {
          productName: componentType, // Use componentType as productName
          dimensions,
          material,
          loadRequirements: null,
          componentType,
          tolerance
        },
        confidence: 0.92,
        reasoning: `Analysis based on parsed 3D CAD model data. Detected ${cadModelData.faceCount || 0} faces, ${cadModelData.holeAnalysis?.count || 0} holes, and ${cadModelData.weldJointAnalysis?.totalJoints || 0} potential weld joints.`,
        suggestedCategories: ['structural', 'custom']
      };
    }

    // Original sample analysis (fallback)
    if (filename?.includes('bracket')) {
      return {
        extractedSpecs: {
          productName: "Mounting Bracket",
          dimensions: "140mm x 90mm x 20mm",
          material: "Steel",
          loadRequirements: "500N static load",
          componentType: "mounting bracket",
          tolerance: "±0.1mm"
        },
        confidence: 0.89,
        reasoning: "Drawing shows a mounting bracket with multiple bolt holes and load specifications. Identified as universal servo motor mounting bracket based on hole pattern and dimensions.",
        suggestedCategories: ["custom", "fasteners"]
      };
    } else if (filename?.includes('steel-beam')) {
      return {
        extractedSpecs: {
          productName: "Steel Beam",
          dimensions: "200mm x 100mm x 6m length",
          material: "Grade S355 Steel",
          loadRequirements: "355 MPa yield strength",
          componentType: "structural beam",
          tolerance: "±2mm"
        },
        confidence: 0.95,
        reasoning: "Technical drawing shows I-beam cross-section with standard IPE 200 dimensions. High confidence match for structural steel beam based on dimensional analysis.",
        suggestedCategories: ["structural", "custom"]
      };
    } else {
      // Default servo motor analysis
      return {
        extractedSpecs: {
          productName: "Servo Motor",
          dimensions: "120mm x 80mm x 65mm",
          material: "Aluminum",
          loadRequirements: "50 Nm torque",
          componentType: "servo motor",
          tolerance: "±0.02mm"
        },
        confidence: 0.85,
        reasoning: "Based on the dimensions and technical specifications visible in the drawing, this appears to be a servo motor mounting configuration with high torque requirements.",
        suggestedCategories: ["robotic", "custom"]
      };
    }
  }
}

export const geminiClient = new GeminiClient();