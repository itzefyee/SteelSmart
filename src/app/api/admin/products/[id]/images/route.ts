import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    
    // First, get the product to retrieve the SKU
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('sku, images')
      .eq('id', id)
      .single();
    
    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    const productSku = product.sku || id; // Fallback to ID if no SKU
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `products/${productSku}/${file.name}`;
      
      // Convert File to ArrayBuffer for server-side upload
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, buffer, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });
      
      if (error) {
        throw new Error(`Failed to upload image ${i + 1}: ${error.message}`);
      }
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);
      
      uploadedUrls.push(publicUrl);
    }

    // Combine existing images with new uploaded images
    const existingImages = product.images || [];
    const allImages = [...existingImages, ...uploadedUrls];
    
    // Update the product with the new image URLs
    const { error: updateError } = await supabase
      .from('products')
      .update({ images: allImages })
      .eq('id', id);
    
    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update product with image URLs' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      allImages: allImages
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to upload images' },
      { status: 500 }
    );
  }
}