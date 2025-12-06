import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/services/product.service';
import { handleApiError } from '@/lib/api/error-handler';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const inStock = searchParams.get('inStock') === 'true' ? true : undefined;

    const service = new ProductService();
    const products = await service.getAll({ category, search, inStock });

    return NextResponse.json({ data: products });
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
