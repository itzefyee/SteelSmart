/**
 * UC303: Edit Product (Admin)
 * Tests the admin functionality of updating existing products
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProductService } from '@/services/admin/product.service';
import { NotFoundError, ValidationError } from '@/lib/errors/app-errors';

// Mock the repository
const mockRepositoryInstance = {
  findById: vi.fn(),
  update: vi.fn(),
};

vi.mock('@/repositories/admin/product.repository', () => ({
  ProductRepository: class MockProductRepository {
    findById = mockRepositoryInstance.findById;
    update = mockRepositoryInstance.update;
  }
}));

vi.mock('@/lib/supabase-server', () => ({
  getSupabaseServer: vi.fn(async () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'admin-123' } },
        error: null
      })
    }
  }))
}));

// Mock the audit log service
vi.mock('@/services/admin/audit/audit-log.service', () => ({
  AuditLogService: {
    logProduct: vi.fn().mockResolvedValue(undefined)
  }
}));

const existingProduct = {
  id: '052df8db-b0a1-4c2e-8fc5-28297362801d',
  sku: 'pressure-sensor-001',
  name: 'Industrial Pressure Sensor 0-100 Bar',
  category: 'robotic',
  material: 'Stainless Steel',
  material_family: 'steel',
  component_type_id: '00000000-0000-4000-8000-00000000010c',
  price: 89.95,
  description: 'High-accuracy pressure sensor for industrial automation and control systems.',
  technical_details: '4-20mA output, M12 connector, IP67 rated, CE certified',
  specifications: {
    weight: '0.12 kg',
    tolerance: '±0.25% FS',
    dimensions: '50mm x 25mm x 15mm',
    loadCapacity: '100 bar maximum',
    operatingTemp: '-40°C to +125°C'
  },
  images: [
    'https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/preview.png'
  ],
  compatible_with: ['linear-actuator-001', 'control-module-001'],
  in_stock: true,
  lead_time: '3-5 business days',
  created_at: '2025-11-17T03:10:39.121284+00:00',
  updated_at: '2025-12-23T10:19:54.486863+00:00'
};

describe('UC303: Edit Product (Admin)', () => {
  let productService: ProductService;

  beforeEach(() => {
    vi.clearAllMocks();
    productService = new ProductService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TC_AP_UC303_001: update product successfully', async () => {
    const updateData = {
      name: 'Updated Industrial Pressure Sensor 0-150 Bar',
      sku: 'pressure-sensor-002',
      price: 99.95,
      description: 'Updated high-accuracy pressure sensor for industrial automation.'
    };

    const updatedProduct = {
      ...existingProduct,
      ...updateData,
      updated_at: '2025-12-23T11:00:00.000000+00:00'
    };

    mockRepositoryInstance.findById.mockResolvedValue(existingProduct);
    mockRepositoryInstance.update.mockResolvedValue(updatedProduct);

    const result = await productService.update('052df8db-b0a1-4c2e-8fc5-28297362801d', updateData);

    expect(result).toEqual(updatedProduct);
    expect(mockRepositoryInstance.findById).toHaveBeenCalledWith('052df8db-b0a1-4c2e-8fc5-28297362801d');
    expect(mockRepositoryInstance.update).toHaveBeenCalledWith('052df8db-b0a1-4c2e-8fc5-28297362801d', updateData);
  });

  it('TC_AP_UC303_002: reject update with invalid price validation', async () => {
    mockRepositoryInstance.findById.mockResolvedValue(existingProduct);

    // Test negative price - should throw ValidationError
    await expect(productService.update('052df8db-b0a1-4c2e-8fc5-28297362801d', { price: -10 }))
      .rejects.toThrow(ValidationError);
  });

  it('TC_AP_UC303_003: throw NotFoundError for non-existent product', async () => {
    mockRepositoryInstance.findById.mockResolvedValue(null);

    await expect(productService.update('non-existent-id', { name: 'Updated Name' }))
      .rejects.toThrow(NotFoundError);
  });
});