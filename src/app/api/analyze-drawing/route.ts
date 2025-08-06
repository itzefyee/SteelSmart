import { NextRequest, NextResponse } from 'next/server';
import { APIResponse, DrawingAnalysis, Product } from '@/types';
import { productMatcher } from '@/lib/product-matcher';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    // Validate file type and size
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Invalid file type. Please upload PDF, PNG, or JPG files.'
      }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'File size exceeds 10MB limit.'
      }, { status: 400 });
    }

    // Mock Claude API response with realistic specifications based on file type
    let mockAnalysis: DrawingAnalysis;
    
    if (file.name.includes('bracket')) {
      mockAnalysis = {
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
    } else if (file.name.includes('steel-beam')) {
      mockAnalysis = {
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
      mockAnalysis = {
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

    // Use product matcher to find relevant products
    const recommendations = productMatcher.findMatchingProducts(mockAnalysis);
    
    // Set total count before limiting
    mockAnalysis.totalRecommendations = recommendations.length;
    
    // Get actual product data for recommendations (limit to 3 for display)
    const productsData = await import('@/data/products.json');
    mockAnalysis.recommendedProducts = recommendations.slice(0, 3).map(rec => {
      const product = productsData.products.find(p => p.id === rec.productId);
      return product;
    }).filter(Boolean) as Product[];

    return NextResponse.json<APIResponse<DrawingAnalysis>>({
      success: true,
      data: mockAnalysis,
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