'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { ArrowLeft, Edit, Trash2, Package, Tag, Warehouse, FileText, Wrench, Mail, Phone } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import type { Product } from '@/types';

interface AdminProductDetailsContentProps {
  productId: string;
}

export function AdminProductDetailsContent({ productId }: AdminProductDetailsContentProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  const images = product?.images || [];

  const loadProduct = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/products/${id}`);
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
    if (productId) {
      loadProduct(productId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

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
    if (!productId) return;

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
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
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <Link href="/admin" className="hover:text-gray-900 transition-colors">Admin</Link>
          <span>/</span>
          <Link href="/admin/products" className="hover:text-gray-900 transition-colors">Products</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{product.name}</span>
        </nav>

        {/* Admin Actions Bar */}
        <div className="flex items-center justify-between">
          <Link href="/admin/products">
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
          <div className="flex gap-2">
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
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
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
            {/* Category and Stock Status */}
            <div className="flex items-center gap-4">
              {product.category && (
                <Badge className="bg-gray-100 text-gray-700 border-gray-200 rounded-full px-4 py-2 text-sm font-medium">
                  {product.category}
                </Badge>
              )}
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${(product as any).in_stock !== false ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {(product as any).in_stock !== false ? 'In Stock' : 'Out of Stock'}
                  {(product as any).in_stock !== false && ' • 4-6 business days'}
                </span>
              </div>
            </div>

            {/* Product Title */}
            <h1 className="text-4xl font-bold leading-tight text-gray-900">{product.name}</h1>

            {/* Price */}
            <div className="text-4xl font-bold text-blue-600">${product.price.toFixed(2)}</div>

            {/* Description */}
            <p className="text-gray-600 text-lg leading-relaxed">{product.description}</p>

            {/* Key Specifications */}
            <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-4">Key Specifications</h3>
              <div className="grid grid-cols-2 gap-4">
                {(product as any).dimensions && (
                  <div>
                    <div className="text-blue-200 text-sm">Dimensions</div>
                    <div className="font-semibold">{(product as any).dimensions}</div>
                  </div>
                )}
                {(product as any).material && (
                  <div>
                    <div className="text-blue-200 text-sm">Material</div>
                    <div className="font-semibold">{(product as any).material}</div>
                  </div>
                )}
                {(product as any).weight && (
                  <div>
                    <div className="text-blue-200 text-sm">Weight</div>
                    <div className="font-semibold">{(product as any).weight}</div>
                  </div>
                )}
                {(product as any).tolerance && (
                  <div>
                    <div className="text-blue-200 text-sm">Tolerance</div>
                    <div className="font-semibold">{(product as any).tolerance}</div>
                  </div>
                )}
                {(product as any).load_capacity && (
                  <div>
                    <div className="text-blue-200 text-sm">Load Capacity</div>
                    <div className="font-semibold">{(product as any).load_capacity}</div>
                  </div>
                )}
                {(product as any).operating_temperature && (
                  <div>
                    <div className="text-blue-200 text-sm">Operating Temperature</div>
                    <div className="font-semibold">{(product as any).operating_temperature}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl py-3 text-lg font-semibold">
                Request Quote
              </Button>
              <Button variant="outline" className="bg-white text-blue-700 border-0 rounded-2xl px-6 py-3 font-semibold hover:bg-gray-50">
                <Wrench className="h-5 w-5 mr-2" />
                Generate Drawing
              </Button>
            </div>

            {/* Help Section */}
            <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-2">Need Help?</h3>
              <p className="text-blue-100 text-sm mb-4">Our technical experts are here to help you find the right solution.</p>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="text-blue-300">steelsmart.cad@gmail.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span className="text-blue-300">+1 (555) 012-3456</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Details Section */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="bg-white/10 rounded-3xl p-8 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-6">Technical Details</h2>
            <p className="text-blue-100 mb-6">
              {product.description || 'Detailed technical specifications and manufacturing information for this product.'}
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(product.specifications).map(
                ([key, value]) =>
                  value && (
                    <div key={key} className="space-y-2">
                      <div className="text-blue-200 text-sm font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="font-semibold">{String(value)}</div>
                    </div>
                  )
              )}
            </div>
          </div>
        )}

        {/* Compatible Products Section */}
        <div className="bg-white/10 rounded-3xl p-8 backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-6">Compatible Products</h2>
          <div className="flex gap-3 flex-wrap">
            {/* Mock compatible products - replace with actual data */}
            <Badge className="bg-white/20 text-white border-white/30 rounded-full px-4 py-2">
              hex-bolt-m12
            </Badge>
            <Badge className="bg-white/20 text-white border-white/30 rounded-full px-4 py-2">
              hex-nut-m12
            </Badge>
            <Badge className="bg-white/20 text-white border-white/30 rounded-full px-4 py-2">
              washer-m12
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}