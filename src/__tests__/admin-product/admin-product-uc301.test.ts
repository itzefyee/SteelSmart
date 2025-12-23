/**
 * UC301: View Product Details (Admin)
 * Tests the admin functionality of viewing detailed product information
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProductService } from '@/services/admin/product.service';
import { NotFoundError } from '@/lib/errors/app-errors';

// Mock the repository
const mockRepositoryInstance = {
  findById: vi.fn(),
};

vi.mock('@/repositories/admin/product.repository', () => ({
  ProductRepository: class MockProductRepository {
    findById = mockRepositoryInstance.findById;
  }
}));

// Mock validation utils
vi.mock('@/lib/validation-utils', () => ({
  validateRequired: vi.fn(),
  validatePositiveNumber: vi.fn(),
}));

// Mock audit service
vi.mock('@/services/admin/audit/audit-log.service', () => ({
  AuditLogService: {
    logProduct: vi.fn(),
  },
}));

// Mock supabase server
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

const mockProduct = {
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
    'https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/preview.png',
    'https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/iso-front-top-left.png',
    'https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/iso-front-bottom-right.png',
    'https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/iso-front-bottom-left.png',
    'https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/iso-back-top-right.png',
    'https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/iso-back-bottom-left.png',
    'https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/front.png',
    'https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/back.png',
    'https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/top.png',
    'https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/bottom.png',
    'https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/left.png',
    'https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/right.png'
  ],
  compatible_with: ['linear-actuator-001', 'control-module-001'],
  in_stock: true,
  lead_time: '3-5 business days',
  created_at: '2025-11-17T03:10:39.121284+00:00',
  updated_at: '2025-12-23T10:19:54.486863+00:00'
};

describe('UC301: View Product Details (Admin)', () => {
  let productService: ProductService;

  beforeEach(() => {
    vi.clearAllMocks();
    productService = new ProductService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TC_AP_UC301_001: retrieve product details successfully', async () => {
    mockRepositoryInstance.findById.mockResolvedValue(mockProduct);

    const result = await productService.getById('052df8db-b0a1-4c2e-8fc5-28297362801d');

    expect(result).toEqual(mockProduct);
    expect(mockRepositoryInstance.findById).toHaveBeenCalledWith('052df8db-b0a1-4c2e-8fc5-28297362801d');
  });

  it('TC_AP_UC301_002: throw NotFoundError for non-existent product ID', async () => {
    mockRepositoryInstance.findById.mockResolvedValue(null);

    await expect(productService.getById('non-existent-id'))
      .rejects.toThrow(NotFoundError);
  });
});