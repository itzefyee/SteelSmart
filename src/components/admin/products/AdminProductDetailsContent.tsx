'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { useAdminProduct, useDeleteAdminProduct } from '@/hooks/admin/useAdminProducts';
import { useQueryClient } from '@tanstack/react-query';

interface AdminProductDetailsContentProps {
  productId: string;
}

export function AdminProductDetailsContent({ productId }: AdminProductDetailsContentProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState(0);

  // Use React Query hook for data fetching
  const { data: product, isLoading, error } = useAdminProduct(productId);

  const deleteProductMutation = useDeleteAdminProduct();

  const images = product?.images || [];

  const handlePreviousImage = useCallback(() => {
    setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNextImage = useCallback(() => {
    setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  // Keyboard navigation for image slider
  useEffect(() => {
    if (!product || images.length <= 1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePreviousImage();
      } else if (e.key === 'ArrowRight') {
        handleNextImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product, images.length, handlePreviousImage, handleNextImage]);

  const handleDelete = async () => {
    if (!productId) return;

    try {
      await deleteProductMutation.mutateAsync(productId);
      
      addToast({
        title: 'Product Deleted',
        description: 'Product has been deleted successfully',
        type: 'success',
      });
      router.push('/admin/products');
    } catch (error: any) {
      addToast({
        title: 'Error',
        description: error.message || 'Failed to delete product',
        type: 'error',
      });
    }
  };

  // Show error state if there's an error
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">Failed to load product</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show not found state if no product and not loading
  if (!isLoading && !product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">Product not found</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If still loading and no cached data, show minimal loading (this should rarely happen due to caching)
  if (isLoading && !product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
        </div>
        {/* Minimal loading - should rarely show due to React Query caching */}
        <div className="min-h-[200px] flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  // At this point, product should be available (either from cache or fresh fetch)
  if (!product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">Product not found</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Back Button - Close to Sidebar */}
      <div className="p-6 pb-0">
        <Link href="/admin/products">
          <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </Link>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Action Buttons - Right Aligned */}
        <div className="flex justify-end gap-2">
          <Link href={`/admin/products/${product.id}/edit`}>
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <Edit className="h-4 w-4 mr-2" />
              Edit Product
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Product</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{product.name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Main Product Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Side - Product Image */}
          <div className="space-y-4">
            {/* Main Product Image */}
            <div className="bg-gray-50 rounded-3xl p-8 shadow-lg border border-gray-200">
              {images.length > 0 ? (
                <div className="relative group">
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50">
                    <Image
                      src={images[selectedImage]}
                      alt={`${product.name} - View ${selectedImage + 1}`}
                      fill
                      className="object-contain p-4"
                    />
                  </div>

                  {/* Image Counter */}
                  {images.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-black/75 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {selectedImage + 1} / {images.length}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-square rounded-2xl bg-gray-100 flex items-center justify-center">
                  <div className="text-gray-400 text-lg">No Image Available</div>
                </div>
              )}
            </div>

            {/* Image Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl border-2 transition-all overflow-hidden relative bg-gray-50 ${
                      selectedImage === index
                        ? 'border-blue-500 ring-2 ring-blue-500/30'
                        : 'border-gray-200 hover:border-blue-400/50'
                    }`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <Image src={image} alt={`Thumbnail ${index + 1}`} fill className="object-contain p-2" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Side - Product Information */}
          <div className="space-y-6">
            {/* Category, Material and Stock Status */}
            <div className="flex items-center gap-4">
              {product.category && (
                <Badge className="bg-gray-100 text-gray-700 border-gray-200 rounded-full px-4 py-2 text-sm font-medium">
                  {product.category}
                </Badge>
              )}
              {(product as any).material && (
                <Badge className="bg-gray-100 text-gray-700 border-gray-200 rounded-full px-4 py-2 text-sm font-medium">
                  {(product as any).material}
                </Badge>
              )}
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${(product as any).in_stock !== false ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {(product as any).in_stock !== false ? 'In Stock' : 'Out of Stock'}
                  {(product as any).in_stock !== false && (product as any).lead_time && ` • ${(product as any).lead_time}`}
                </span>
              </div>
            </div>

            {/* Product Title */}
            <h1 className="text-4xl font-bold leading-tight text-gray-900">{product.name}</h1>

            {/* Price */}
            <div className="text-4xl font-bold text-blue-600">${product.price.toFixed(2)}</div>

            {/* Description */}
            <p className="text-gray-600 text-lg leading-relaxed">{product.description}</p>

            {/* Technical Details Section */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <h3 className="text-xl font-semibold mb-4">Technical Details</h3>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(product.specifications).map(
                    ([key, value]) =>
                      value && (
                        <div key={key} className="space-y-2">
                          <div className="text-blue-600 text-sm font-medium capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                          <div className="font-semibold">{String(value)}</div>
                        </div>
                      )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}