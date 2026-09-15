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
    const requestedPage = Number.parseInt(searchParams.get('page') || '1', 10);
    const requestedLimit = Number.parseInt(searchParams.get('limit') || '20', 10);
    const page = Number.isFinite(requestedPage) ? Math.max(requestedPage, 1) : 1;
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 100)
      : 20;

    const service = new ProductService();
    if (searchParams.get('summary') === 'true') {
      const statistics = await service.getInventoryStatistics();
      return NextResponse.json({ data: statistics });
    }

    const result = await service.getAll({ category, search, inStock }, page, limit);

    // Return with moderate caching for admin data
    return NextResponse.json({
      data: result.products,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: result.total > 0 ? Math.ceil(result.total / limit) : 0,
      },
    }, {
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
