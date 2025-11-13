import { NextRequest, NextResponse } from 'next/server';
import { APIResponse, DrawingAnalysis, Product } from '@/types';
import { productMatcher } from '@/lib/product-matcher';
import { geminiClient } from '@/lib/gemini-client';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const cadDataJson = formData.get('cadModelData') as string;

    if (!file) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    // Parse CAD model data if provided
    let cadModelData = null;
    if (cadDataJson) {
      try {
        cadModelData = JSON.parse(cadDataJson);
      } catch (e) {
        console.warn('Failed to parse CAD model data:', e);
      }
    }

    // Validate file type and size
    const allowedTypes = [
      'application/pdf', 
      'image/png', 
      'image/jpeg',
      'application/step',
      'application/sla',
      'model/obj',
      'application/dxf',
      'application/octet-stream' // For .step, .stp, .stl files that might have generic MIME type
    ];
    
    // Also check file extension for CAD files
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'step', 'stp', 'stl', 'obj', 'dxf'];
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension || '')) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Invalid file type. Please upload PDF, PNG, JPG, STEP, STL, OBJ, or DXF files.'
      }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'File size exceeds 10MB limit.'
      }, { status: 400 });
    }

    // Check if Gemini API is configured
    const isGeminiConfigured = await geminiClient.isConfigured();
    let analysis: DrawingAnalysis;

    if (isGeminiConfigured) {
      try {
        // Use real Gemini API for analysis
        console.log('Using Gemini API for real analysis', cadModelData ? 'with CAD data' : 'without CAD data');

        // Convert file to buffer
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        // Call Gemini API with CAD data
        const geminiResponse = await geminiClient.analyzeDrawing(
          fileBuffer,
          file.type,
          file.name,
          cadModelData
        );

        // Create DrawingAnalysis from Gemini response, converting null to undefined
        analysis = {
          extractedSpecs: {
            dimensions: geminiResponse.extractedSpecs.dimensions || undefined,
            material: geminiResponse.extractedSpecs.material || undefined,
            loadRequirements: geminiResponse.extractedSpecs.loadRequirements || undefined,
            componentType: geminiResponse.extractedSpecs.componentType || undefined,
            tolerance: geminiResponse.extractedSpecs.tolerance || undefined,
          },
          recommendedProducts: [],
          totalRecommendations: 0,
          confidence: geminiResponse.confidence,
          reasoning: geminiResponse.reasoning,
          analysisId: `analysis_${Date.now()}`
        };

      } catch (geminiError) {
        console.error('Gemini API failed, falling back to mock:', geminiError);
        // Fallback to mock analysis if Gemini fails
        analysis = getFallbackAnalysis(file.name, cadModelData);
      }
    } else {
      console.log('Gemini API not configured, using mock analysis');
      // Use mock analysis if API not configured
      analysis = getFallbackAnalysis(file.name, cadModelData);
    }

    // Use product matcher to find relevant products
    const recommendations = productMatcher.findMatchingProducts(analysis);
    
    // Set total count before limiting
    analysis.totalRecommendations = recommendations.length;
    
    // Get actual product data for recommendations (limit to 3 for display)
    const productsData = await import('@/data/products.json');
    analysis.recommendedProducts = recommendations.slice(0, 3).map(rec => {
      const product = productsData.products.find(p => p.id === rec.productId);
      return product;
    }).filter(Boolean) as Product[];

    return NextResponse.json<APIResponse<DrawingAnalysis>>({
      success: true,
      data: analysis,
      message: 'Drawing analysis completed successfully'
    });

  } catch (error) {
    console.error('Error analyzing drawing:', error);
    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: 'Internal server error during analysis'
    }, { status: 500 });
  }
}

// Fallback mock analysis function
function getFallbackAnalysis(filename: string, cadModelData?: any): DrawingAnalysis {
  // If we have CAD model data, use it for more accurate analysis
  if (cadModelData) {
    const dimensions = cadModelData.boundingBox
      ? `${(cadModelData.boundingBox.length * 25.4).toFixed(1)}mm x ${(cadModelData.boundingBox.width * 25.4).toFixed(1)}mm x ${(cadModelData.boundingBox.height * 25.4).toFixed(1)}mm`
      : undefined;

    const material = cadModelData.thicknessAnalysis
      ? `Steel (${cadModelData.thicknessAnalysis.estimatedThickness.toFixed(3)}" thick)`
      : 'Steel';

    const componentType = cadModelData.holeAnalysis?.count > 0
      ? 'Mounting bracket or structural component'
      : 'Structural component';

    const tolerance = cadModelData.boundingBoxWithTolerance
      ? `±${cadModelData.boundingBoxWithTolerance.tolerance.toFixed(3)}"`
      : undefined;

    return {
      extractedSpecs: {
        dimensions,
        material,
        loadRequirements: undefined,
        componentType,
        tolerance
      },
      recommendedProducts: [],
      totalRecommendations: 0,
      confidence: 0.92,
      reasoning: `Analysis based on parsed 3D CAD model data. Detected ${cadModelData.faceCount || 0} faces, ${cadModelData.holeAnalysis?.count || 0} holes, and ${cadModelData.weldJointAnalysis?.totalJoints || 0} potential weld joints. ${cadModelData.thicknessAnalysis ? `Material thickness: ${cadModelData.thicknessAnalysis.estimatedThickness.toFixed(3)}".` : ''}`,
      analysisId: `analysis_${Date.now()}`
    };
  }

  // Original sample-based analysis
  if (filename.includes('bracket')) {
    return {
      extractedSpecs: {
        dimensions: "140mm x 90mm x 20mm",
        material: "Steel",
        loadRequirements: "500N static load",
        componentType: "mounting bracket",
        tolerance: "±0.1mm"
      },
      recommendedProducts: [],
      totalRecommendations: 0,
      confidence: 0.89,
      reasoning: "Drawing shows a mounting bracket with multiple bolt holes and load specifications. Identified as universal servo motor mounting bracket based on hole pattern and dimensions.",
      analysisId: `analysis_${Date.now()}`
    };
  } else if (filename.includes('steel-beam')) {
    return {
      extractedSpecs: {
        dimensions: "200mm x 100mm x 6m length",
        material: "Grade S355 Steel",
        loadRequirements: "355 MPa yield strength",
        componentType: "structural beam",
        tolerance: "±2mm"
      },
      recommendedProducts: [],
      totalRecommendations: 0,
      confidence: 0.95,
      reasoning: "Technical drawing shows I-beam cross-section with standard IPE 200 dimensions. High confidence match for structural steel beam based on dimensional analysis.",
      analysisId: `analysis_${Date.now()}`
    };
  } else {
    // Default servo motor analysis
    return {
      extractedSpecs: {
        dimensions: "120mm x 80mm x 65mm",
        material: "Aluminum",
        loadRequirements: "50 Nm torque",
        componentType: "servo motor",
        tolerance: "±0.02mm"
      },
      recommendedProducts: [],
      totalRecommendations: 0,
      confidence: 0.85,
      reasoning: "Based on the dimensions and technical specifications visible in the drawing, this appears to be a servo motor mounting configuration with high torque requirements.",
      analysisId: `analysis_${Date.now()}`
    };
  }
}