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

  create: async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> => {
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
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAdminProduct(id: string) {
  return useQuery({
    queryKey: adminProductsKeys.detail(id),
    queryFn: () => adminProductsApi.getById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id,
  });
}

export function useCreateAdminProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminProductsApi.create,
    onSuccess: () => {
      // Invalidate and refetch products list
      queryClient.invalidateQueries({ queryKey: adminProductsKeys.lists() });
    },
  });
}

export function useUpdateAdminProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminProductsApi.update,
    onSuccess: (data) => {
      // Update the specific product in cache
      queryClient.setQueryData(adminProductsKeys.detail(data.id), data);
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: adminProductsKeys.lists() });
    },
  });
}

export function useDeleteAdminProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminProductsApi.delete,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: adminProductsKeys.detail(deletedId) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: adminProductsKeys.lists() });
    },
  });
}