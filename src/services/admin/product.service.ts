import { ProductRepository, type ProductFilters, type CreateProductInput, type UpdateProductInput } from '@/repositories/admin/product.repository';
import type { Product } from '@/types';
import { NotFoundError, ValidationError } from '@/lib/errors/app-errors';

export class ProductService {
  private repository: ProductRepository;

  constructor() {
    this.repository = new ProductRepository();
  }

  async getAll(filters?: ProductFilters): Promise<Product[]> {
    return this.repository.findAll(filters);
  }

  async getById(id: string): Promise<Product> {
    const product = await this.repository.findById(id);
    
    if (!product) {
      throw new NotFoundError('Product');
    }
    
    return product;
  }

  async create(input: CreateProductInput): Promise<Product> {
    // Validate
    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError('Name is required', { name: 'Name is required' });
    }
    
    if (!input.price || input.price < 0) {
      throw new ValidationError('Valid price is required', { price: 'Price must be positive' });
    }
    
    if (!input.category) {
      throw new ValidationError('Category is required', { category: 'Category is required' });
    }
    
    // Generate a unique ID for the product
    const productId = crypto.randomUUID();
    
    return this.repository.create({
      ...input,
      id: productId,
    });
  }

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    // Check if exists
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError('Product');
    }
    
    // Validate
    if (input.price !== undefined && input.price < 0) {
      throw new ValidationError('Price must be positive', { price: 'Price must be positive' });
    }
    
    return this.repository.update(id, input);
  }

  async delete(id: string): Promise<void> {
    // Check if exists
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError('Product');
    }
    
    await this.repository.delete(id);
  }
}
