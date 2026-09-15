import { getSupabaseServer } from '@/lib/supabase-server';
import type { Product } from '@/types';
import type { TablesInsert, TablesUpdate } from '@/lib/database.types';

export interface ProductFilters {
  category?: string;
  search?: string;
  inStock?: boolean;
}

export interface ProductPage {
  products: Product[];
  total: number;
}

export interface ProductInventoryStatistics {
  total: number;
  inStock: number;
}

export type CreateProductInput = Omit<TablesInsert<'products'>, 'created_at' | 'updated_at' | 'search_vector'>;
export type UpdateProductInput = Omit<TablesUpdate<'products'>, 'id' | 'created_at' | 'updated_at' | 'search_vector'>;

export class ProductRepository {
  async findAll(
    filters?: ProductFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<ProductPage> {
    const supabase = await getSupabaseServer();
    
    let query = supabase.from('products').select('*', { count: 'exact' });
    
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }
    
    if (filters?.inStock !== undefined) {
      query = query.eq('in_stock', filters.inStock);
    }
    
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) throw new Error(`Failed to fetch products: ${error.message}`);
    return { products: data || [], total: count || 0 };
  }

  async getInventoryStatistics(): Promise<ProductInventoryStatistics> {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase.rpc('get_product_inventory_statistics');

    if (error) throw new Error(`Failed to fetch inventory statistics: ${error.message}`);
    const statistics = data?.[0];
    return {
      total: Number(statistics?.total) || 0,
      inStock: Number(statistics?.in_stock) || 0,
    };
  }

  async findById(id: string): Promise<Product | null> {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch product: ${error.message}`);
    }
    
    return data;
  }

  async create(input: CreateProductInput): Promise<Product> {
    const supabase = await getSupabaseServer();
    
    const { data, error } = await supabase
      .from('products')
      .insert(input)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create product: ${error.message}`);
    return data;
  }

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from('products')
      .update(input)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update product: ${error.message}`);
    return data;
  }

  async delete(id: string): Promise<void> {
    const supabase = await getSupabaseServer();
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Failed to delete product: ${error.message}`);
  }
}
