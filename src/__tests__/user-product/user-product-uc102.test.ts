/**
 * UC102: Search Products
 * Tests the functionality of searching products by various criteria
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProductService } from '@/services/product.service';
import { ProductRepository } from '@/repositories/product.repository';

vi.mock('@/lib/cache/redis-cache', () => ({
  getCached: vi.fn(async (_key: string, fetcher: () => Promise<any>) => fetcher()),
}));

vi.mock('@/repositories/product.repository', () => {
  const mockRepository = {
    findWithFilters: vi.fn(),
  };
  return { ProductRepository: vi.fn(() => mockRepository) };
});

const mockProduct = {
  id: '052df8db-b0a1-4c2e-8fc5-28297362801d',
  sku: 'pressure-sensor-001',
  name: 'Industrial Pressure Sensor 0-100 Bar',
  category: 'robotic',
  material: 'Stainless Steel',
  specifications: {
    weight: '0.12 kg',
    tolerance: '±0.25% FS',
    dimensions: '50mm x 25mm x 15mm',
    loadCapacity: '100 bar maximum',
    operatingTemp: '-40°C to +125°C'
  },
  price: 89.95,
  images: [
    'https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/preview.png',
    'https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/iso-front-top-left.png'
  ],
  description: 'High-accuracy pressure sensor for industrial automation and control systems.',
  technical_details: '4-20mA output, M12 connector, IP67 rated, CE certified',
  compatible_with: ['linear-actuator-001', 'control-module-001'],
  in_stock: true,
  lead_time: '3-5 business days',
  created_at: '2025-11-17T03:10:39.121284Z',
  updated_at: '2025-12-23T10:19:54.486863Z',
  component_type_id: '00000000-0000-4000-8000-00000000010c',
  material_family: 'steel'
};

const mockSearchResult = {
  products: [mockProduct],
  pagination: {
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1
  }
};

describe('UC102: Search Products', () => {
  let productService: ProductService;
  let mockRepository: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = new (require('@/repositories/product.repository').ProductRepository)();
    productService = new ProductService(mockRepository);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TC_UP_UC102_001: search products by name successfully', async () => {
    mockRepository.findWithFilters.mockResolvedValue(mockSearchResult);

    const result = await productService.getProducts(
      { search: 'pressure' },
      { page: 1, limit: 20 }
    );

    expect(result.products).toHaveLength(1);
    expect(result.products[0].name).toContain('Pressure');
    expect(mockRepository.findWithFilters).toHaveBeenCalledWith(
      { search: 'pressure' },
      { page: 1, limit: 20 }
    );
  });

  it('TC_UP_UC102_002: return empty array when no products match search criteria', async () => {
    const emptySearchResult = { 
      products: [], 
      pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
    };
    mockRepository.findWithFilters.mockResolvedValue(emptySearchResult);

    const result = await productService.getProducts(
      { search: 'nonexistent-product' },
      { page: 1, limit: 20 }
    );

    expect(result.products).toEqual([]);
    expect(result.pagination.total).toBe(0);
    expect(mockRepository.findWithFilters).toHaveBeenCalledWith(
      { search: 'nonexistent-product' },
      { page: 1, limit: 20 }
    );
  });
});