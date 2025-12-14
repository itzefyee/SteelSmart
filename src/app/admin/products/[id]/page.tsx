'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { ArrowLeft, Edit, Trash2, Package, Tag, Warehouse } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import type { Product } from '@/types';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  const id = params?.id as string;

  const images = product?.images || [];

  const loadProduct = async (productId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}`);
      const data = await response.json();
      
      if (data.data) {
        setProduct(data.data);
      } else {
        addToast({
          title: 'Error',
          description: 'Failed to load product',
          type: 'error',
        });
      }
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to load product',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadProduct(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handlePreviousImage = () => {
    setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

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
  }, [product, images.length, selectedImage]);

  const handleDelete = async () => {
    if (!id) return;

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        addToast({
          title: 'Product Deleted',
          description: 'Product has been deleted successfully',
          type: 'success',
        });
        router.push('/admin/products');
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to delete product',
        type: 'error',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">Loading product...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
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

  const getStockBadgeVariant = (inStock: boolean) => {
    return inStock ? 'default' : 'destructive';
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'Robotic':
        return 'default';
      case 'Custom':
        return 'secondary';
      case 'Fasteners':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            <p className="text-muted-foreground">{product.category}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/products/${product.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Product
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
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
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Product Images</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-6 space-y-4">
            {images.length > 0 ? (
              <>
                {/* Main Image Display */}
                <div className="relative group">
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
                    <Image
                      src={images[selectedImage]}
                      alt={`${product.name} - View ${selectedImage + 1}`}
                      fill
                      className="object-contain"
                    />
                  </div>

                {/* Navigation Arrows - Only show if multiple images */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={handlePreviousImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-800 p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                      aria-label="Previous image"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-800 p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                      aria-label="Next image"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                  {/* Image Counter */}
                  {images.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-slate-900/75 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {selectedImage + 1} / {images.length}
                    </div>
                  )}
                </div>

                {/* Image Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 transition-all overflow-hidden relative ${
                          selectedImage === index
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedImage(index)}
                      >
                        <div className="w-full h-full bg-muted">
                          <Image src={image} alt={`Thumbnail ${index + 1}`} fill className="object-contain" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No images available for this product
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6 flex flex-col">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {product.category && (
                  <Badge variant={getCategoryBadgeVariant(product.category)}>{product.category}</Badge>
                )}
                <Badge variant={getStockBadgeVariant((product as any).in_stock !== false)}>
                  {(product as any).in_stock !== false ? 'In Stock' : 'Out of Stock'}
                </Badge>
              </div>
              <div className="text-3xl font-bold text-primary">${product.price.toFixed(2)}</div>
              <p className="text-muted-foreground">{product.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="h-5 w-5" />
                Inventory Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Stock Status:</span>
                <span className="font-medium">
                  {(product as any).in_stock !== false ? 'Available' : 'Out of Stock'}
                </span>
              </div>
              {(product as any).stock_quantity !== undefined && (
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span className="font-medium">{(product as any).stock_quantity}</span>
                </div>
              )}
              <Separator />
              {product.created_at && (
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span className="font-medium">{new Date(product.created_at).toLocaleDateString()}</span>
                </div>
              )}
              {product.updated_at && (
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span className="font-medium">{new Date(product.updated_at).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Specifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(product.specifications).map(
                ([key, value]) =>
                  value && (
                    <div key={key} className="space-y-1">
                      <div className="text-sm font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </div>
                      <div className="text-sm text-muted-foreground">{String(value)}</div>
                    </div>
                  )
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
