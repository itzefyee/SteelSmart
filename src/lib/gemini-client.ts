// OpenRouter API client for drawing analysis (using Mistral Devstral - Free)
// Previously used Google Gemini, now migrated to OpenRouter for better availability

export const GEMINI_ANALYSIS_PROMPT_BASE = `
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
- Try to match against products in our catalog (see list below)
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
4. Match against our catalog products (see below)

Never leave productName as null. Always provide your best identification.`;

export const GEMINI_ANALYSIS_PROMPT = GEMINI_ANALYSIS_PROMPT_BASE;

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
  private apiKey: string;
  private appUrl: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    this.model = process.env.OPENROUTER_MODEL || 'openrouter/free';
  }

  async analyzeDrawing(
    fileBuffer: Buffer,
    mimeType: string,
    filename?: string,
    cadModelData?: any
  ): Promise<GeminiAnalysisResponse> {
    console.log('========================================');
    console.log('🚀 [GeminiClient] analyzeDrawing() called');
    console.log('========================================');
    console.log(`API Key configured: ${!!this.apiKey}`);
    console.log(`API Key length: ${this.apiKey?.length || 0}`);
    
    if (!this.apiKey) {
      console.error('[GeminiClient] ERROR: No API key configured!');
      throw new Error('OpenRouter API key not configured. Set OPENROUTER_API_KEY in .env.local');
    }
    
    console.log('[GeminiClient] API key OK, proceeding...');

    try {
      // Convert file to base64
      const base64Data = fileBuffer.toString('base64');

      console.log(`[GeminiClient] File buffer size: ${fileBuffer.length} bytes`);
      console.log(`[GeminiClient] Filename: ${filename}`);
      console.log(`[GeminiClient] MIME type: ${mimeType}`);

      // Check if this is a sample file (very small size indicates placeholder)
      if (fileBuffer.length < 100) {
        console.log(`[GeminiClient] File too small (${fileBuffer.length} bytes), using sample analysis`);
        // For sample files, use default mock analysis for better demo results
        return this.getSampleAnalysis(filename, cadModelData);
      }

      console.log(`[GeminiClient] File size OK, proceeding with OpenRouter API call...`);

      // Build enhanced prompt with catalog products and CAD data
      let promptText = GEMINI_ANALYSIS_PROMPT_BASE;
      
      // Add catalog context
      promptText += await this.buildCatalogContext();
      
      // Add CAD data context if available
      if (cadModelData) {
        promptText += this.buildCADDataContext(cadModelData);
      }
      
      // Add response format instructions
      promptText += this.getResponseFormatInstructions();

      console.log('========================================');
      console.log('🤖 Analyzing drawing with OpenRouter API');
      console.log('========================================');
      console.log(`File: ${filename}`);
      console.log(`Size: ${fileBuffer.length} bytes`);
      console.log(`Type: ${mimeType}`);
      console.log(`Model: ${this.model}`);
      console.log(`Catalog products included: YES`);
      console.log(`CAD model data included: ${cadModelData ? 'YES' : 'NO'}`);
      console.log('========================================');

      // Prepare image URL for OpenRouter (data URL format). This request is
      // intentionally text-only so it works with the auto-routed free model.
      // const imageDataUrl = `data:${mimeType};base64,${base64Data}`;

      // Add file metadata to prompt since we can't send the image
      promptText += `\n\n## File Information\n`;
      promptText += `- Filename: ${filename}\n`;
      promptText += `- File type: ${mimeType}\n`;
      promptText += `- File size: ${fileBuffer.length} bytes\n`;
      
      if (cadModelData) {
        promptText += `\n**Note:** This analysis is based on parsed 3D CAD model data (see above). `;
        promptText += `Use the extracted dimensions, hole analysis, and geometry information to identify the product.`;
      } else {
        promptText += `\n**Note:** Analyze based on the filename and any available context. `;
        promptText += `Try to match against the catalog products listed above.`;
      }

      // Call OpenRouter API with text-only model
      console.log('[OpenRouter] Sending request...');
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': this.appUrl,
          'X-Title': 'SteelSmart CAD Analyzer',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a technical expert analyzing engineering drawings and CAD data. Always respond with valid JSON only, no additional text.'
            },
            {
              role: 'user',
              content: promptText // Text only - no image
            }
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[OpenRouter] API Error:', response.status, errorText);
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      console.log('[OpenRouter] Response received successfully');
      const data = await response.json();
      const text = data.choices[0].message.content;
      console.log('[OpenRouter] Raw response length:', text.length, 'characters');

      // Parse the JSON response
      try {
        // Clean up the response text (remove markdown code blocks if present)
        let cleanedText = text.trim();
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/```\n?/g, '');
        }
        cleanedText = cleanedText.trim();

        const analysisResult = JSON.parse(cleanedText);
        
        // Validate the response structure
        if (!analysisResult.extractedSpecs || typeof analysisResult.confidence !== 'number') {
          throw new Error('Invalid response structure from OpenRouter API');
        }

        // Ensure productName is never null - use componentType as fallback
        if (!analysisResult.extractedSpecs.productName) {
          analysisResult.extractedSpecs.productName = 
            analysisResult.extractedSpecs.componentType || 
            'Unknown Component';
        }

        console.log(`✓ Analysis completed. Product: ${analysisResult.extractedSpecs.productName}, Confidence: ${Math.round(analysisResult.confidence * 100)}%`);

        return analysisResult;
        
      } catch (parseError) {
        console.error('Error parsing OpenRouter response:', parseError);
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
      console.error('Error calling OpenRouter API:', error);
      throw new Error(`Failed to analyze drawing with OpenRouter API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async isConfigured(): Promise<boolean> {
    return !!this.apiKey;
  }

  private async buildCatalogContext(): Promise<string> {
    try {
      // Dynamically import to avoid circular dependencies
      const { getSupabaseServer } = await import('./supabase-server');
      const supabase = await getSupabaseServer();
      
      // Fetch all product names from catalog
      const { data: products, error } = await supabase
        .from('products')
        .select('name, category')
        .order('category', { ascending: true });
      
      if (error || !products || products.length === 0) {
        console.warn('Could not fetch product catalog for AI context');
        return '';
      }
      
      // Group products by category
      const byCategory: Record<string, string[]> = {};
      products.forEach(p => {
        if (!byCategory[p.category]) {
          byCategory[p.category] = [];
        }
        byCategory[p.category].push(p.name);
      });
      
      let context = '\n\n## 📦 Available Products in Our Catalog\n\n';
      context += 'When identifying the product name, try to match against these products in our catalog:\n\n';
      
      Object.entries(byCategory).forEach(([category, names]) => {
        context += `**${category.charAt(0).toUpperCase() + category.slice(1)}** (${names.length} products):\n`;
        names.forEach(name => {
          context += `  • ${name}\n`;
        });
        context += '\n';
      });
      
      context += '**Matching Guidelines:**\n';
      context += '- If the drawing closely matches a catalog product, use that exact product name\n';
      context += '- If it\'s similar but not exact, use the closest match and note differences in reasoning\n';
      context += '- If no match exists, use a descriptive name based on the component type\n';
      context += '- Prioritize catalog matches to help users find existing products\n\n';
      
      return context;
    } catch (error) {
      console.error('Error building catalog context:', error);
      return '';
    }
  }

  private getResponseFormatInstructions(): string {
    return `

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
