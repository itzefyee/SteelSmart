import { ProductRepository, type ProductFilters, type CreateProductInput, type UpdateProductInput } from '@/repositories/admin/product.repository';
import type { Product } from '@/types';
import { NotFoundError } from '@/lib/errors/app-errors';
import { validateRequired, validatePositiveNumber } from '@/lib/validation-utils';
import { AuditLogService } from '@/services/admin/audit/audit-log.service';
import { getSupabaseServer } from '@/lib/supabase-server';

// Singleton pattern for repository to reuse connections
let repositoryInstance: ProductRepository | null = null;

export class ProductService {
  private repository: ProductRepository;

  constructor() {
    // Reuse repository instance to avoid creating multiple connections
    if (!repositoryInstance) {
      repositoryInstance = new ProductRepository();
    }
    this.repository = repositoryInstance;
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
    // Service Layer: Business Rule Validation
    validateRequired(input.name, 'Name');
    validatePositiveNumber(input.price, 'Price');
    validateRequired(input.category, 'Category');
    
    // Generate a unique ID for the product
    const productId = crypto.randomUUID();
    
    try {
      // Handover to Repository Layer
      const product = await this.repository.create({
        ...input,
        id: productId,
      });

      // Get current user for audit logging (non-blocking)
      try {
        const supabase = await getSupabaseServer();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Audit log: Product creation success
          await AuditLogService.logProduct(
            user.id,
            'CREATE',
            { id: product.id, name: product.name }
          );
        }
      } catch (auditError) {
        // Log audit error but don't fail the product creation
        console.error('Failed to create audit log for product creation:', auditError);
      }

      return product;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    // Check if exists
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError('Product');
    }
    
    // Validate
    if (input.price !== undefined && input.price !== null) {
      validatePositiveNumber(input.price, 'Price');
    }
    
    try {
      const product = await this.repository.update(id, input);

      // Get current user for audit logging (non-blocking)
      try {
        const supabase = await getSupabaseServer();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Audit log: Product update success
          await AuditLogService.logProduct(
            user.id,
            'UPDATE',
            { id: product.id, name: product.name }
          );
        }
      } catch (auditError) {
        // Log audit error but don't fail the product update
        console.error('Failed to create audit log for product update:', auditError);
      }

      return product;
    } catch (error) {
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    // Check if exists
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError('Product');
    }
    
    try {
      await this.repository.delete(id);

      // Get current user for audit logging (non-blocking)
      try {
        const supabase = await getSupabaseServer();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Audit log: Product deletion success
          await AuditLogService.logProduct(
            user.id,
            'DELETE',
            { id: existing.id, name: existing.name }
          );
        }
      } catch (auditError) {
        // Log audit error but don't fail the product deletion
        console.error('Failed to create audit log for product deletion:', auditError);
      }
    } catch (error) {
      throw error;
    }
  }
}
