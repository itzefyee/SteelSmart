import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/services/product.service';
import { handleApiError } from '@/lib/api/error-handler';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = new ProductService();
    const product = await service.getById(id);

    return NextResponse.json({ data: product });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const service = new ProductService();
    const product = await service.update(id, body);

    return NextResponse.json({
      data: product,
      message: 'Product updated successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = new ProductService();
    await service.delete(id);

    return NextResponse.json({
      message: 'Product deleted successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
