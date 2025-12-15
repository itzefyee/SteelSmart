import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { Tables } from '@/lib/database.types';

// Reuse the Product type used on the client
export type Product = Tables<'products'>;

export interface ProductFilters {
  category?: string;
  material?: string;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export interface ProductQueryOptions {
  page?: number;
  limit?: number;
  ids?: string[];
}

export interface ProductPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ProductListResult {
  products: Product[];
  pagination: ProductPagination;
}

export class ProductRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findById(id: string): Promise<Product | null> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // PGRST116 = row not found
      if ((error as any).code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data as Product;
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) {
      return [];
    }

    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .in('id', ids);

    if (error) {
      throw error;
    }

    return (data || []) as Product[];
  }

  async findWithFilters(
    filters: ProductFilters = {},
    options: ProductQueryOptions = {},
  ): Promise<ProductListResult> {
    const {
      page = 1,
      limit = 20,
      ids = [],
    } = options;

    let query = this.supabase
      .from('products')
      .select('*', { count: 'exact' });

    if (ids.length > 0) {
      query = query.in('id', ids);
    }

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.material) {
      query = query.ilike('material', `%${filters.material}%`);
    }

    if (typeof filters.inStock === 'boolean') {
      query = query.eq('in_stock', filters.inStock);
    }

    if (typeof filters.minPrice === 'number') {
      query = query.gte('price', filters.minPrice);
    }

    if (typeof filters.maxPrice === 'number') {
      query = query.lte('price', filters.maxPrice);
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (ids.length === 0) {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
    }

    query = query.order('name', { ascending: true });

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    const total = count || 0;
    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

    return {
      products: (data || []) as Product[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  async updateProduct(
    id: string,
    update: Partial<Product>,
  ): Promise<Product | null> {
    const { data, error } = await this.supabase
      .from('products')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if ((error as any).code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data as Product;
  }

  async deleteProduct(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }
}


