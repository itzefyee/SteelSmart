'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
import { Edit, Trash2, Eye, Search, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/types';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      if (data.data) {
        setProducts(data.data);
      }
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to load products',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setProducts(products.filter((p) => p.id !== productId));
        addToast({
          title: 'Product Deleted',
          description: 'Product has been deleted successfully',
          type: 'success',
        });
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Management</h1>
          <p className="text-muted-foreground">Manage your product catalog and inventory</p>
        </div>
        <Link href="/admin/products/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {filteredProducts.length} of {products.length} products
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading products...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden flex flex-col">
              <CardHeader className="pb-3">
                {product.images && product.images.length > 0 && (
                  <div className="h-60 bg-muted rounded-lg mb-3 overflow-hidden relative">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                )}
                <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                  {product.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 flex-1">
                <div className="flex gap-2 flex-wrap">
                  {product.category && <Badge>{product.category}</Badge>}
                  <Badge variant={(product as any).in_stock !== false ? 'default' : 'destructive'}>
                    {(product as any).in_stock !== false ? 'In Stock' : 'Out of Stock'}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-primary">${product.price.toFixed(2)}</div>
              </CardContent>
              <CardFooter className="flex gap-2 pt-3 mt-auto">
                <Link href={`/admin/products/${product.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </Link>
                <Link href={`/admin/products/${product.id}/edit`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4" />
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
                        onClick={() => handleDelete(product.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredProducts.length === 0 && (
        <Card className="p-8 text-center">
          <CardContent>
            <div className="text-muted-foreground">
              No products found matching your search criteria.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
