import { getSupabaseServer } from '@/lib/supabase-server';
import type { Product } from '@/types';
import type { TablesInsert, TablesUpdate } from '@/lib/database.types';

export interface ProductFilters {
  category?: string;
  search?: string;
  inStock?: boolean;
}

export type CreateProductInput = Omit<TablesInsert<'products'>, 'created_at' | 'updated_at' | 'search_vector'>;
export type UpdateProductInput = Omit<TablesUpdate<'products'>, 'id' | 'created_at' | 'updated_at' | 'search_vector'>;

export class ProductRepository {
  async findAll(filters?: ProductFilters): Promise<Product[]> {
    const supabase = await getSupabaseServer();
    
    let query = supabase.from('products').select('*');
    
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }
    
    if (filters?.inStock !== undefined) {
      query = query.eq('in_stock', filters.inStock);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to fetch products: ${error.message}`);
    return data || [];
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
