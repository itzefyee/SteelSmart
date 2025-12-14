import { ProductRepository, type ProductFilters } from '@/repositories/product.repository';
import { getSupabaseServerClient } from '@/lib/supabase';
import { getCached } from '@/lib/cache/redis-cache';

/**
 * Pagination options for product queries
 */
export interface ProductPaginationOptions {
  page: number;
  limit: number;
  ids?: string[];
}

/**
 * ProductService handles business logic for product operations
 * This is the server-side service layer that orchestrates:
 * - Validation
 * - Caching
 * - Business rules
 * - Data access via repositories
 */
export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  /**
   * Get products with filters, pagination, and caching
   * 
   * @param filters - Product filters (category, material, price, etc.)
   * @param options - Pagination options (page, limit, ids)
   * @returns Promise resolving to products and pagination metadata
   */
  async getProducts(
    filters: ProductFilters,
    options: ProductPaginationOptions
  ) {
    // Business logic: Validate filters
    this.validateFilters(filters);
    
    // Business logic: Validate pagination
    this.validatePagination(options);
    
    // Business logic: Generate cache key
    const cacheKey = this.generateCacheKey(filters, options);
    
    // Business logic: Fetch with caching
    return getCached(
      cacheKey,
      async () => {
        return this.repository.findWithFilters(filters, options);
      },
      300 // TTL: 5 minutes
    );
  }
  
  /**
   * Get a single product by ID
   * 
   * @param id - Product ID
   * @returns Promise resolving to a single product
   * @throws Error if product not found
   */
  async getProductById(id: string) {
    // Business logic: Validate ID
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid product ID');
    }
    
    const cacheKey = `product:${id}`;
    
    return getCached(
      cacheKey,
      async () => {
        const product = await this.repository.findById(id);
        
        if (!product) {
          throw new Error(`Product with ID ${id} not found`);
        }
        
        return product;
      },
      600 // TTL: 10 minutes (single products cached longer)
    );
  }
  
  /**
   * Business logic: Validate filters
   * Ensures filters meet business rules
   */
  private validateFilters(filters: ProductFilters): void {
    // Business rule: Price range validation
    if (filters.minPrice !== undefined && filters.minPrice < 0) {
      throw new Error('minPrice cannot be negative');
    }
    
    if (filters.maxPrice !== undefined && filters.maxPrice < 0) {
      throw new Error('maxPrice cannot be negative');
    }
    
    if (
      filters.minPrice !== undefined &&
      filters.maxPrice !== undefined &&
      filters.minPrice > filters.maxPrice
    ) {
      throw new Error('minPrice cannot be greater than maxPrice');
    }
    
    // Business rule: Search query length
    if (filters.search && filters.search.length > 100) {
      throw new Error('Search query too long (max 100 characters)');
    }
    
    // Business rule: Sanitize search input
    if (filters.search) {
      filters.search = filters.search.trim();
    }
  }
  
  /**
   * Business logic: Validate pagination options
   */
  private validatePagination(options: ProductPaginationOptions): void {
    if (options.page < 1) {
      throw new Error('Page number must be at least 1');
    }
    
    if (options.limit < 1 || options.limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }
  }
  
  /**
   * Business logic: Generate cache key from filters and options
   * Creates a unique, deterministic cache key for the query
   */
  private generateCacheKey(
    filters: ProductFilters,
    options: ProductPaginationOptions
  ): string {
    const parts: string[] = [];
    
    // Include IDs if present
    if (options.ids && options.ids.length > 0) {
      parts.push(`ids=${options.ids.sort().join(',')}`);
    }
    
    // Include filters
    if (filters.category) {
      parts.push(`category=${filters.category}`);
    }
    
    if (filters.material) {
      parts.push(`material=${filters.material}`);
    }
    
    if (typeof filters.inStock === 'boolean') {
      parts.push(`inStock=${filters.inStock}`);
    }
    
    if (typeof filters.minPrice === 'number') {
      parts.push(`minPrice=${filters.minPrice}`);
    }
    
    if (typeof filters.maxPrice === 'number') {
      parts.push(`maxPrice=${filters.maxPrice}`);
    }
    
    if (filters.search) {
      parts.push(`search=${filters.search}`);
    }
    
    // Include pagination
    parts.push(`page=${options.page}`);
    parts.push(`limit=${options.limit}`);
    
    return `products:${parts.join('&')}`;
  }
}
