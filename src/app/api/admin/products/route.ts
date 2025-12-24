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

    // Return with moderate caching for admin data
    return NextResponse.json({ data: products }, {
      headers: {
        'Cache-Control': 'private, s-maxage=120, stale-while-revalidate=300', // 2 min cache, 5 min stale
      },
    });
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
