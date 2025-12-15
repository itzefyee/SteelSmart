import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/services/admin/product.service';
import { handleApiError } from '@/lib/api/error-handler';

// Add caching headers for better performance
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const inStock = searchParams.get('inStock') === 'true' ? true : undefined;

    const service = new ProductService();
    const products = await service.getAll({ category, search, inStock });

    // Add cache headers for better performance
    const response = NextResponse.json({ data: products });
    
    // Cache for 1 minute, but allow stale content for 5 minutes while revalidating
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300'
    );
    
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const service = new ProductService();
    const product = await service.create(body);

    return NextResponse.json(
      { data: product, message: 'Product created successfully' },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
