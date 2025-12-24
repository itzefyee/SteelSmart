import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Product } from '@/types';

interface ProductFilters {
  category?: string;
  search?: string;
  inStock?: boolean;
}

// Admin Products API
const adminProductsApi = {
  getAll: async (filters?: ProductFilters): Promise<Product[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.set('category', filters.category);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.inStock !== undefined) params.set('inStock', filters.inStock.toString());
    
    const response = await fetch(`/api/admin/products?${params}`);
    if (!response.ok) throw new Error('Failed to fetch products');
    const data = await response.json();
    return data.data;
  },

  getById: async (id: string): Promise<Product> => {
    const response = await fetch(`/api/admin/products/${id}`);
    if (!response.ok) throw new Error('Failed to fetch product');
    const data = await response.json();
    return data.data;
  },

  create: async (product: any): Promise<Product> => {
    const response = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!response.ok) throw new Error('Failed to create product');
    const data = await response.json();
    return data.data;
  },

  update: async ({ id, ...product }: Partial<Product> & { id: string }): Promise<Product> => {
    const response = await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!response.ok) throw new Error('Failed to update product');
    const data = await response.json();
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete product');
  },
};

// Query Keys
export const adminProductsKeys = {
  all: ['admin', 'products'] as const,
  lists: () => [...adminProductsKeys.all, 'list'] as const,
  list: (filters?: ProductFilters) => [...adminProductsKeys.lists(), filters] as const,
  details: () => [...adminProductsKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminProductsKeys.details(), id] as const,
};

// Hooks
export function useAdminProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: adminProductsKeys.list(filters),
    queryFn: () => adminProductsApi.getAll(filters),
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't keep in cache
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on focus
  });
}

export function useAdminProduct(id: string, options?: { refetchOnMount?: boolean; staleTime?: number }) {
  return useQuery({
    queryKey: adminProductsKeys.detail(id),
    queryFn: () => adminProductsApi.getById(id),
    staleTime: options?.staleTime ?? (options?.refetchOnMount ? 0 : 2 * 60 * 1000), // No cache if refetchOnMount is true or staleTime is set
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnMount: options?.refetchOnMount ?? false, // Use option or default to false
    refetchOnWindowFocus: false, // Don't refetch on focus
    enabled: !!id,
  });
}

export function useCreateAdminProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminProductsApi.create,
    onSuccess: () => {
      // Clear cache and trigger background refetch
      queryClient.removeQueries({ queryKey: adminProductsKeys.all });
      queryClient.refetchQueries({ queryKey: adminProductsKeys.all });
    },
  });
}

export function useUpdateAdminProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminProductsApi.update,
    onSuccess: (updatedProduct) => {
      // Update specific product in cache
      queryClient.setQueryData(
        adminProductsKeys.detail(updatedProduct.id),
        updatedProduct
      );
      
      // Invalidate list queries to trigger background refetch
      queryClient.invalidateQueries({ 
        queryKey: adminProductsKeys.lists(),
        refetchType: 'none' // Don't refetch immediately
      });
      
      // Trigger background refetch after a short delay
      setTimeout(() => {
        queryClient.refetchQueries({ 
          queryKey: adminProductsKeys.lists(),
          type: 'active'
        });
      }, 100);
    },
  });
}

export function useDeleteAdminProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminProductsApi.delete,
    onSuccess: (_, deletedId) => {
      // Remove specific product from cache
      queryClient.removeQueries({ 
        queryKey: adminProductsKeys.detail(deletedId) 
      });
      
      // Invalidate list queries to trigger background refetch
      queryClient.invalidateQueries({ 
        queryKey: adminProductsKeys.lists(),
        refetchType: 'none' // Don't refetch immediately
      });
      
      // Trigger background refetch after a short delay
      setTimeout(() => {
        queryClient.refetchQueries({ 
          queryKey: adminProductsKeys.lists(),
          type: 'active'
        });
      }, 100);
    },
  });
}