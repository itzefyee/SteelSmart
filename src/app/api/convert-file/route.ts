import { NextRequest, NextResponse } from 'next/server';
import { convertFile, getFileFormat, type FileFormat } from '@/lib/zoo-client';

interface FileConversionRequest {
  fileContent: string; // base64 encoded
  sourceFormat: FileFormat;
  targetFormat: FileFormat;
  filename?: string;
}

interface FileConversionResponse {
  success: boolean;
  data?: {
    convertedFile: string; // base64 encoded
    filename: string;
    format: FileFormat;
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<FileConversionResponse>> {
  try {
    // Check if API token is configured
    if (!process.env.ZOO_API_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'Zoo Dev API token not configured. Please set ZOO_API_TOKEN in your environment variables.'
      }, { status: 500 });
    }

    const body: FileConversionRequest = await request.json();
    const { fileContent, sourceFormat, targetFormat, filename = 'converted_model' } = body;

    if (!fileContent || !sourceFormat || !targetFormat) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: fileContent, sourceFormat, and targetFormat are required'
      }, { status: 400 });
    }

    // Validate formats
    const validFormats: FileFormat[] = ['obj', 'stl', 'step'];
    if (!validFormats.includes(sourceFormat) || !validFormats.includes(targetFormat)) {
      return NextResponse.json({
        success: false,
        error: `Invalid format. Supported formats: ${validFormats.join(', ')}`
      }, { status: 400 });
    }

    console.log(`Converting file from ${sourceFormat} to ${targetFormat}`);

    try {
      // Use Zoo Dev API for file conversion
      const result = await convertFile(fileContent, sourceFormat, targetFormat);
      
      // Get the converted file (should be only one output)
      const convertedFiles = Object.entries(result);
      if (convertedFiles.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No converted file received from Zoo Dev API'
        }, { status: 500 });
      }

      const [convertedFilename, convertedContent] = convertedFiles[0];
      
      return NextResponse.json({
        success: true,
        data: {
          convertedFile: convertedContent,
          filename: `${filename}.${targetFormat}`,
          format: targetFormat
        }
      });

    } catch (apiError: any) {
      console.error('Zoo Dev API conversion failed:', apiError);
      
      // Handle specific API errors
      if (apiError.message?.includes('rate limit')) {
        return NextResponse.json({
          success: false,
          error: 'Rate limit exceeded. Please try again in a few minutes.'
        }, { status: 429 });
      }
      
      if (apiError.message?.includes('authentication')) {
        return NextResponse.json({
          success: false,
          error: 'Authentication failed. Please check your API token.'
        }, { status: 401 });
      }

      return NextResponse.json({
        success: false,
        error: `File conversion failed: ${apiError.message || 'Unknown error'}`
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('File conversion error:', error);
    return NextResponse.json({
      success: false,
      error: `Server error: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
}

// Health check endpoint
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    service: 'File Conversion API',
    timestamp: new Date().toISOString(),
    zoo_api_configured: !!process.env.ZOO_API_TOKEN,
    supported_formats: ['obj', 'stl', 'step']
  });
}

