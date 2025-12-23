/**
 * UC103: Filter Products
 * Tests the functionality of filtering products by category, material, price, and stock status
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProductService } from '@/services/product.service';
import { ProductRepository } from '@/repositories/product.repository';

// Mock the cache
vi.mock('@/lib/cache/redis-cache', () => ({
  getCached: vi.fn(async (_key: string, fetcher: () => Promise<any>) => fetcher()),
}));

// Mock the repository
const mockRepositoryInstance = {
  findWithFilters: vi.fn(),
};

vi.mock('@/repositories/product.repository', () => ({
  ProductRepository: class MockProductRepository {
    findWithFilters = mockRepositoryInstance.findWithFilters;
  }
}));

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

// Additional mock products for filtering tests
const mockProducts = [
  mockProduct,
  {
    ...mockProduct,
    id: '052df8db-b0a1-4c2e-8fc5-28297362802d',
    sku: 'steel-beam-001',
    name: 'Structural Steel I-Beam',
    category: 'structural',
    material: 'Carbon Steel',
    price: 150.00,
    in_stock: false,
    material_family: 'steel'
  },
  {
    ...mockProduct,
    id: '052df8db-b0a1-4c2e-8fc5-28297362803d',
    sku: 'hex-bolt-001',
    name: 'Stainless Steel Hex Bolt M8',
    category: 'fasteners',
    material: 'Stainless Steel',
    price: 5.99,
    in_stock: true,
    material_family: 'steel'
  }
];

describe('UC103: Filter Products', () => {
  let productService: ProductService;

  beforeEach(() => {
    vi.clearAllMocks();
    const mockRepository = new ProductRepository({} as any);
    productService = new ProductService(mockRepository);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TC_UP_UC103_001: filter products by multiple criteria', async () => {
    const multiFilterResult = { 
      products: [mockProducts[0]], 
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1, hasMore: false }
    };
    mockRepositoryInstance.findWithFilters.mockResolvedValue(multiFilterResult);

    const result = await productService.getProducts(
      { 
        category: 'robotic',
        minPrice: 50,
        inStock: true
      },
      { page: 1, limit: 20 }
    );

    expect(result.products).toHaveLength(1);
    expect(result.products[0].category).toBe('robotic');
    expect(result.products[0].price).toBeGreaterThanOrEqual(50);
    expect(result.products[0].in_stock).toBe(true);
    expect(mockRepositoryInstance.findWithFilters).toHaveBeenCalledWith(
      { 
        category: 'robotic',
        minPrice: 50,
        inStock: true
      },
      { page: 1, limit: 20 }
    );
  });

  it('TC_UP_UC103_002: return empty array when no products match filter criteria', async () => {
    const emptyFilterResult = { 
      products: [], 
      pagination: { total: 0, page: 1, limit: 20, totalPages: 0, hasMore: false }
    };
    mockRepositoryInstance.findWithFilters.mockResolvedValue(emptyFilterResult);

    const result = await productService.getProducts(
      { category: 'nonexistent-category' },
      { page: 1, limit: 20 }
    );

    expect(result.products).toEqual([]);
    expect(result.pagination.total).toBe(0);
    expect(mockRepositoryInstance.findWithFilters).toHaveBeenCalledWith(
      { category: 'nonexistent-category' },
      { page: 1, limit: 20 }
    );
  });
});