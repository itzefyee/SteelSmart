import { NextRequest, NextResponse } from 'next/server';
import { geminiClient } from '@/lib/gemini-client';

const MULTI_VIEW_ANALYSIS_PROMPT = `
You are a technical expert analyzing engineering drawings from multiple orthographic views.

You are being provided with 6 orthographic views of a 3D CAD model:
1. Top view (looking down)
2. Bottom view (looking up)
3. Front view
4. Back view
5. Right side view
6. Left side view

Analyze ALL views together to extract comprehensive technical specifications:

1. **Dimensions & Measurements**: Extract length, width, height from different views
   - Top view shows length × width
   - Front view shows height × depth
   - Side views confirm measurements
   
2. **Material Requirements**: Identify material type and thickness
   
3. **Features Detected**: 
   - Holes (count, diameter, pattern)
   - Cutouts or slots
   - Mounting points
   - Chamfers or fillets
   
4. **Component Type**: Classify the component (bracket, plate, beam, housing, etc.)

5. **Tolerances**: Any precision requirements

6. **Manufacturing Considerations**:
   - Machining requirements
   - Welding points
   - Bend locations
   - Assembly features

Respond ONLY with valid JSON in this exact format:
{
  "extractedSpecs": {
    "dimensions": "length × width × height with units",
    "material": "material type and thickness",
    "loadRequirements": "load capacity if determinable or null",
    "componentType": "specific component category",
    "tolerance": "precision requirements or null",
    "features": {
      "holes": "count and description",
      "cutouts": "description or null",
      "mountingPoints": "count and location or null"
    }
  },
  "confidence": 0.95,
  "reasoning": "Detailed explanation of what was identified from each view and how views were cross-referenced for accuracy",
  "viewAnalysis": {
    "topView": "what was identified from top view",
    "frontView": "what was identified from front view",
    "sideView": "what was identified from side views"
  },
  "suggestedCategories": ["category1", "category2"],
  "manufacturingNotes": "manufacturing considerations based on all views"
}

Be specific and cross-reference measurements between views for accuracy. Use multiple views to detect hidden features.
`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract all view images
    const views: { name: string; buffer: Buffer; mimeType: string }[] = [];
    
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('view_') && value instanceof File) {
        const viewName = key.replace('view_', '');
        const buffer = Buffer.from(await value.arrayBuffer());
        
        views.push({
          name: viewName,
          buffer,
          mimeType: value.type || 'image/png',
        });
      }
    }

    if (views.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No views provided' },
        { status: 400 }
      );
    }

    console.log(`Analyzing ${views.length} views with Gemini AI...`);

    // Check if Gemini is configured
    const isConfigured = await geminiClient.isConfigured();
    if (!isConfigured) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Gemini API not configured. Set GEMINI_API_KEY in environment variables.' 
        },
        { status: 500 }
      );
    }

    // Prepare all images for Gemini
    const imageParts = views.map(view => ({
      inlineData: {
        data: view.buffer.toString('base64'),
        mimeType: view.mimeType,
      }
    }));

    // Add labels for each view
    const viewLabels = views.map(view => 
      `**${view.name.toUpperCase()} VIEW**`
    ).join('\n');

    const fullPrompt = `${MULTI_VIEW_ANALYSIS_PROMPT}\n\n${viewLabels}\n\nAnalyze the following ${views.length} orthographic views:`;

    // Call Gemini with all images
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      fullPrompt,
      ...imageParts
    ]);

    const response = await result.response;
    const text = response.text();

    console.log('Gemini multi-view analysis response received');

    // Parse JSON response
    try {
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const analysisResult = JSON.parse(cleanedText);

      // Validate structure
      if (!analysisResult.extractedSpecs || typeof analysisResult.confidence !== 'number') {
        throw new Error('Invalid response structure');
      }

      return NextResponse.json({
        success: true,
        data: {
          ...analysisResult,
          viewCount: views.length,
          analyzedViews: views.map(v => v.name),
        },
      });

    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.error('Raw response:', text);

      // Fallback response
      return NextResponse.json({
        success: true,
        data: {
          extractedSpecs: {
            dimensions: null,
            material: null,
            loadRequirements: null,
            componentType: "unknown",
            tolerance: null,
          },
          confidence: 0.5,
          reasoning: `Multi-view analysis completed but response parsing failed. Analyzed ${views.length} views. Raw response: ${text.substring(0, 200)}...`,
          suggestedCategories: ["custom"],
          viewCount: views.length,
        },
      });
    }

  } catch (error) {
    console.error('Multi-view analysis error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Analysis failed' 
      },
      { status: 500 }
    );
  }
}
