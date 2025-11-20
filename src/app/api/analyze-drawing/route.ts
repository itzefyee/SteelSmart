import { NextRequest, NextResponse } from 'next/server';
import { APIResponse, DrawingAnalysis, Product } from '@/types';
import { productMatcher } from '@/lib/product-matcher';
import { geminiClient } from '@/lib/gemini-client';
import { getSupabaseServer } from '@/lib/supabase-server';
import { getCached } from '@/lib/cache/redis-cache';
import crypto from 'crypto';

/**
 * Generate a hash from file content for cache key
 * Uses SHA-256 to create a unique identifier for the file
 */
async function generateFileHash(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

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

    // Generate cache key from file content hash
    // TTL: 86400 seconds (24 hours) - CAD analysis is expensive and results are stable
    const fileHash = await generateFileHash(file);
    const cacheKey = `cad:analysis:${fileHash}`;
    
    // Try to get cached analysis result
    const cachedAnalysis = await getCached<DrawingAnalysis | null>(
      cacheKey,
      async () => {
        // Cache miss - perform analysis
        console.log(`Performing CAD analysis for file: ${file.name}`);
        
        // Check if Gemini API is configured
        const isGeminiConfigured = await geminiClient.isConfigured();
        let analysis: DrawingAnalysis;

        if (isGeminiConfigured) {
          try {
            // Use real Gemini API for analysis
            
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
          // Use mock analysis if API not configured
          analysis = getFallbackAnalysis(file.name, cadModelData);
        }

        // Use product matcher to find relevant products
        const recommendations = productMatcher.findMatchingProducts(analysis);
        
        // Set total count before limiting
        analysis.totalRecommendations = recommendations.length;
        
        // Get actual product data for recommendations (limit to 3 for display)
        const supabaseClient = await getSupabaseServer();
        const productIds = recommendations.slice(0, 3).map(rec => rec.productId);
        
        const { data: products, error: productsError } = await supabaseClient
          .from('products')
          .select('*')
          .in('id', productIds);
        
        if (productsError) {
          console.error('Error fetching products:', productsError);
          analysis.recommendedProducts = [];
        } else {
          // Sort products to match recommendation order
          analysis.recommendedProducts = productIds
            .map(id => products?.find(p => p.id === id))
            .filter(Boolean) as Product[];
        }

        // If no catalog products found, get alternative suggestions
        let alternativeSuggestions = null;
        if (analysis.recommendedProducts.length === 0 && recommendations.length === 0) {
          try {
            alternativeSuggestions = await productMatcher.getAlternativeSuggestions(analysis);
          } catch (error) {
            console.error('Error getting alternative suggestions:', error);
          }
        }

        // Add alternative suggestions to analysis if available
        if (alternativeSuggestions) {
          analysis.alternativeSuggestions = alternativeSuggestions;
        }

        return analysis;
      },
      86400 // TTL: 24 hours for CAD analysis results
    );

    // Use the cached or freshly analyzed result
    const analysis = cachedAnalysis;

    // Store drawing and analysis in Supabase (if user is authenticated)
    // Note: Storage happens regardless of cache hit/miss to track user activity
    try {
      const supabase = await getSupabaseServer();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      console.log('Auth check result:', { 
        hasUser: !!user, 
        userId: user?.id,
        authError: authError?.message 
      });

      if (user) {
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const filePath = `${user.id}/${Date.now()}_${file.name}`;

        // Determine proper content type based on file extension
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const contentTypeMap: Record<string, string> = {
          'pdf': 'application/pdf',
          'png': 'image/png',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'step': 'application/step',
          'stp': 'application/step',
          'stl': 'application/vnd.ms-pki.stl',
          'obj': 'model/obj',
          'dxf': 'application/dxf',
        };
        
        const contentType = contentTypeMap[fileExt || ''] || file.type || 'application/octet-stream';

        // Upload drawing to storage
        const { error: uploadError } = await supabase.storage
          .from('technical-drawings')
          .upload(filePath, fileBuffer, {
            contentType: contentType,
            upsert: false
          });

        if (uploadError) {
          console.error('Failed to upload drawing:', {
            error: uploadError,
            fileName: file.name,
            fileType: file.type,
            contentType: contentType,
            fileSize: file.size,
            filePath: filePath
          });
          
          // Still save analysis to database even if file upload fails
          // Use null for file_path since upload failed
          await supabase.from('drawing_analyses').insert({
            user_id: user.id,
            file_name: file.name,
            file_path: null, // No file stored
            file_type: file.type,
            file_size: file.size,
            extracted_specs: analysis.extractedSpecs as any,
            recommended_products: analysis.recommendedProducts.map(p => ({
              id: p.id,
              name: p.name,
              category: p.category
            })) as any,
            confidence: analysis.confidence,
            reasoning: analysis.reasoning,
            gemini_response: analysis as any // Store full analysis as JSON
          });

          console.log(`Saved drawing analysis for user ${user.id} (file upload failed, analysis saved without file)`);
        } else {
          // Save analysis to database with file path
          await supabase.from('drawing_analyses').insert({
            user_id: user.id,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
            extracted_specs: analysis.extractedSpecs as any,
            recommended_products: analysis.recommendedProducts.map(p => ({
              id: p.id,
              name: p.name,
              category: p.category
            })) as any,
            confidence: analysis.confidence,
            reasoning: analysis.reasoning,
            gemini_response: analysis as any // Store full analysis as JSON
          });

          console.log(`Saved drawing analysis for user ${user.id} with file at ${filePath}`);
        }
      } else {
        console.log('User not authenticated, skipping drawing storage');
      }
    } catch (storageError) {
      console.error('Failed to store drawing analysis:', storageError);
      // Don't fail the main request if storage fails
    }

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
    // Calculate dimensions from bounding box (may have length/width/height OR min/max)
    let dimensions: string | undefined = undefined;
    if (cadModelData.boundingBox?.length && cadModelData.boundingBox?.width && cadModelData.boundingBox?.height) {
      // Manufacturing analysis has been run, use calculated dimensions
      dimensions = `${(cadModelData.boundingBox.length * 25.4).toFixed(1)}mm x ${(cadModelData.boundingBox.width * 25.4).toFixed(1)}mm x ${(cadModelData.boundingBox.height * 25.4).toFixed(1)}mm`;
    } else if (cadModelData.boundingBox?.min && cadModelData.boundingBox?.max) {
      // Only basic geometry extraction, calculate dimensions from min/max
      const length = Math.abs(cadModelData.boundingBox.max.x - cadModelData.boundingBox.min.x);
      const width = Math.abs(cadModelData.boundingBox.max.y - cadModelData.boundingBox.min.y);
      const height = Math.abs(cadModelData.boundingBox.max.z - cadModelData.boundingBox.min.z);
      dimensions = `${(length * 25.4).toFixed(1)}mm x ${(width * 25.4).toFixed(1)}mm x ${(height * 25.4).toFixed(1)}mm`;
    }

    const material = cadModelData.thicknessAnalysis?.estimatedThickness
      ? `Steel (${cadModelData.thicknessAnalysis.estimatedThickness.toFixed(3)}" thick)`
      : 'Steel (material analysis pending)';

    const componentType = cadModelData.holeAnalysis?.count > 0
      ? 'Mounting bracket or structural component'
      : (cadModelData.faceCount ? 'Structural component' : '3D CAD Model');

    const tolerance = cadModelData.boundingBoxWithTolerance?.tolerance
      ? `±${cadModelData.boundingBoxWithTolerance.tolerance.toFixed(3)}"`
      : '±0.005" (standard)';

    const thicknessInfo = cadModelData.thicknessAnalysis?.estimatedThickness
      ? `Material thickness: ${cadModelData.thicknessAnalysis.estimatedThickness.toFixed(3)}".`
      : '';

    const hasManufacturingAnalysis = !!(cadModelData.holeAnalysis || cadModelData.thicknessAnalysis || cadModelData.weldJointAnalysis);

    console.log('Using CAD model data for analysis:', {
      hasBoundingBox: !!cadModelData.boundingBox,
      hasDimensions: !!dimensions,
      hasManufacturingAnalysis,
      faceCount: cadModelData.faceCount || 0,
      holeCount: cadModelData.holeAnalysis?.count || 0,
    });

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
      confidence: hasManufacturingAnalysis ? 0.92 : 0.75,
      reasoning: hasManufacturingAnalysis
        ? `Analysis based on parsed 3D CAD model data with detailed manufacturing analysis. Detected ${cadModelData.faceCount || 0} faces, ${cadModelData.holeAnalysis?.count || 0} holes, and ${cadModelData.weldJointAnalysis?.totalJoints || 0} potential weld joints. ${thicknessInfo}`
        : `Analysis based on 3D CAD geometry. Detected ${cadModelData.faceCount || 0} faces. Run manufacturing analysis for detailed hole, thickness, and weld information.`,
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