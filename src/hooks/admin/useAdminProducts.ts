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
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache data
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });
}

export function useAdminProduct(id: string) {
  return useQuery({
    queryKey: adminProductsKeys.detail(id),
    queryFn: () => adminProductsApi.getById(id),
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache data
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gains focus
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
    onSuccess: () => {
      // Clear cache and trigger background refetch
      queryClient.removeQueries({ queryKey: adminProductsKeys.all });
      queryClient.refetchQueries({ queryKey: adminProductsKeys.all });
    },
  });
}

export function useDeleteAdminProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminProductsApi.delete,
    onSuccess: () => {
      // Clear all admin product queries from cache immediately
      queryClient.removeQueries({ queryKey: adminProductsKeys.all });
      
      // Trigger background refetch without waiting
      queryClient.refetchQueries({ 
        queryKey: adminProductsKeys.all,
        type: 'active'
      });
    },
  });
}