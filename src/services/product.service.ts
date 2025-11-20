import { Tables } from '@/lib/database.types';

/**
 * Product type from database
 */
export type Product = Tables<'products'>;

/**
 * Filters for product queries
 */
export interface ProductFilters {
  category?: string;
  material?: string;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

/**
 * Pagination metadata
 */
export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Response structure for product list queries
 */
export interface ProductResponse {
  products: Product[];
  pagination: PaginationMetadata;
}

/**
 * ProductService handles all product-related API calls
 * This service layer separates business logic from React components
 * and provides a clean interface for React Query hooks
 */
export class ProductService {
  private static readonly BASE_URL = '/api/products';

  /**
   * Fetches a list of products with optional filters and pagination
   * 
   * @param filters - Optional filters to apply to the product query
   * @param page - Page number (default: 1)
   * @param limit - Number of items per page (default: 20)
   * @returns Promise resolving to ProductResponse with products and pagination
   * @throws Error if the API request fails
   */
  static async getProducts(
    filters: ProductFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<ProductResponse> {
    try {
      // Build URL search parameters from filters
      const params = new URLSearchParams();
      
      // Add pagination parameters
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      // Add filter parameters if provided
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
      
      // Make API request
      const url = `${this.BASE_URL}?${params.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch products: ${response.statusText}${
            errorData.details ? ` - ${errorData.details}` : ''
          }`
        );
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      // Re-throw with descriptive error message
      if (error instanceof Error) {
        throw new Error(`ProductService.getProducts failed: ${error.message}`);
      }
      throw new Error('ProductService.getProducts failed: Unknown error');
    }
  }

  /**
   * Fetches a single product by ID
   * 
   * @param id - The product ID to fetch
   * @returns Promise resolving to a single Product
   * @throws Error if the API request fails or product is not found
   */
  static async getProduct(id: string): Promise<Product> {
    try {
      // Use the same endpoint with id filter
      const params = new URLSearchParams();
      params.append('id', id);
      
      const url = `${this.BASE_URL}?${params.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch product: ${response.statusText}${
            errorData.details ? ` - ${errorData.details}` : ''
          }`
        );
      }
      
      const data: ProductResponse = await response.json();
      
      // Extract the single product from the response
      if (!data.products || data.products.length === 0) {
        throw new Error(`Product with ID ${id} not found`);
      }
      
      return data.products[0];
    } catch (error) {
      // Re-throw with descriptive error message
      if (error instanceof Error) {
        throw new Error(`ProductService.getProduct failed: ${error.message}`);
      }
      throw new Error('ProductService.getProduct failed: Unknown error');
    }
  }
}
