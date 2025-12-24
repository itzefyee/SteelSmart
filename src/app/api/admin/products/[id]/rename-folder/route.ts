import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { oldSku, newSku } = await request.json();
    
    if (!oldSku || !newSku || oldSku === newSku) {
      return NextResponse.json({
        success: true,
        message: 'No folder rename needed'
      });
    }

    const supabase = getSupabaseAdmin();
    
    // Get current product to check existing images
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('images')
      .eq('id', id)
      .single();
    
    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    const existingImages = product.images || [];
    
    if (existingImages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No images to move'
      });
    }
    
    const newImageUrls: string[] = [];
    
    // Move each image from old folder to new folder
    for (const imageUrl of existingImages) {
      try {
        // Extract the file name from the URL
        const urlParts = imageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        
        const oldPath = `products/${oldSku}/${fileName}`;
        const newPath = `products/${newSku}/${fileName}`;
        
        // Download the file from old location
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('product-images')
          .download(oldPath);
        
        if (downloadError) {
          continue;
        }
        
        // Upload to new location
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(newPath, fileData, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (uploadError) {
          continue;
        }
        
        // Delete from old location
        const { error: deleteError } = await supabase.storage
          .from('product-images')
          .remove([oldPath]);
        
        // Generate new public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(newPath);
        
        newImageUrls.push(publicUrl);
        
      } catch (error) {
        // Continue with other images if one fails
      }
    }
    
    // Update product with new image URLs
    if (newImageUrls.length > 0) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ images: newImageUrls })
        .eq('id', id);
      
      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update product with new image URLs' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({
      success: true,
      movedImages: newImageUrls.length,
      newImageUrls
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to rename folder' },
      { status: 500 }
    );
  }
}