// Claude API client for drawing analysis
// This will be implemented when Claude API integration is added

export const CLAUDE_ANALYSIS_PROMPT = `
You are a technical expert analyzing engineering drawings and technical specifications.

Analyze the uploaded technical drawing/document and extract:

1. **Dimensions & Measurements**: Any specified dimensions, sizes, or measurements
2. **Material Requirements**: Specified materials or material properties  
3. **Load/Stress Requirements**: Weight capacity, force ratings, or stress specifications
4. **Component Type**: What type of component this appears to be (structural, mechanical, robotic, etc.)
5. **Tolerances**: Any precision or tolerance requirements mentioned
6. **Connection Methods**: How this component connects to others (bolts, welds, etc.)

Respond ONLY with valid JSON in this exact format:
{
  "extractedSpecs": {
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

Be specific about measurements and technical details. If information is unclear or missing, set those fields to null.
`;

interface ClaudeAnalysisResponse {
  extractedSpecs: {
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

export class ClaudeClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY || '';
    this.baseUrl = 'https://api.anthropic.com/v1';
  }

  async analyzeDrawing(fileBuffer: Buffer, mimeType: string): Promise<ClaudeAnalysisResponse> {
    if (!this.apiKey) {
      throw new Error('Claude API key not configured');
    }

    try {
      // Convert file to base64
      const base64Data = fileBuffer.toString('base64');
      
      // This is a placeholder implementation
      // Actual Claude API integration would go here
      console.log('Analyzing drawing with Claude API (placeholder)');
      
      // For now, return a mock response
      return {
        extractedSpecs: {
          dimensions: "120mm x 80mm x 65mm",
          material: "Aluminum",
          loadRequirements: "50 Nm torque",
          componentType: "servo motor",
          tolerance: "±0.02mm"
        },
        confidence: 0.85,
        reasoning: "Based on the visible dimensions and technical specifications, this appears to be a servo motor mounting configuration with specific torque requirements.",
        suggestedCategories: ["robotic", "custom"]
      };

    } catch (error) {
      console.error('Error calling Claude API:', error);
      throw new Error('Failed to analyze drawing with Claude API');
    }
  }

  async isConfigured(): Promise<boolean> {
    return !!this.apiKey;
  }
}

export const claudeClient = new ClaudeClient();