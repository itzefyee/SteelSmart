import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/services/admin/product.service';
import { handleApiError } from '@/lib/api/error-handler';

// Disable caching for fresh data
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const inStock = searchParams.get('inStock') === 'true' ? true : undefined;

    const service = new ProductService();
    const products = await service.getAll({ category, search, inStock });

    // Return fresh data without caching
    const response = NextResponse.json({ data: products });
    
    // Disable caching to ensure fresh data
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('API POST /api/admin/products - Starting');
    const body = await request.json();
    console.log('API POST - Request body:', body);
    
    const service = new ProductService();
    console.log('API POST - Service created');
    
    const product = await service.create(body);
    console.log('API POST - Product created:', product);

    return NextResponse.json(
      { data: product, message: 'Product created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('API POST - Error:', error);
    return handleApiError(error);
  }
}
