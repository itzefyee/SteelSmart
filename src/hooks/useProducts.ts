import { useState, useEffect, useCallback } from 'react';
import type { Product } from '@/lib/supabase';

export interface ProductFilters {
  category?: string;
  material?: string;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export interface ProductPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface UseProductsOptions {
  filters?: ProductFilters;
  page?: number;
  limit?: number;
  autoFetch?: boolean;
}

export interface UseProductsState {
  products: Product[];
  loading: boolean;
  error: Error | null;
  pagination: ProductPagination | null;
  refetch: () => Promise<void>;
  setFilters: (filters: ProductFilters) => void;
  setPage: (page: number) => void;
}

/**
 * Custom hook to fetch products from the API with filters and pagination
 * Implements caching, error handling, and filter management
 */
export function useProducts(options: UseProductsOptions = {}): UseProductsState {
  const {
    filters: initialFilters = {},
    page: initialPage = 1,
    limit = 20,
    autoFetch = true,
  } = options;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState<ProductPagination | null>(null);
  const [filters, setFilters] = useState<ProductFilters>(initialFilters);
  const [page, setPage] = useState(initialPage);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      if (filters.category) {
        params.append('category', filters.category);
      }
      if (filters.material) {
        params.append('material', filters.material);
      }
      if (filters.inStock !== undefined) {
        params.append('inStock', filters.inStock.toString());
      }
      if (filters.minPrice !== undefined) {
        params.append('minPrice', filters.minPrice.toString());
      }
      if (filters.maxPrice !== undefined) {
        params.append('maxPrice', filters.maxPrice.toString());
      }
      if (filters.search) {
        params.append('search', filters.search);
      }

      const response = await fetch(`/api/products?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch products: ${response.statusText}`);
      }

      const data = await response.json();
      setProducts(data.products || []);
      setPagination(data.pagination || null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit]);

  useEffect(() => {
    if (autoFetch) {
      fetchProducts();
    }
  }, [fetchProducts, autoFetch]);

  const handleSetFilters = useCallback((newFilters: ProductFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  }, []);

  return {
    products,
    loading,
    error,
    pagination,
    refetch: fetchProducts,
    setFilters: handleSetFilters,
    setPage,
  };
}
