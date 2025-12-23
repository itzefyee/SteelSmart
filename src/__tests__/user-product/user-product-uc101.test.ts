/**
 * UC101: View Product Details
 * Tests the functionality of viewing detailed product information
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProductService } from '@/services/product.service';
import { ProductRepository } from '@/repositories/product.repository';

vi.mock('@/lib/cache/redis-cache', () => ({
  getCached: vi.fn(async (_key: string, fetcher: () => Promise<any>) => fetcher()),
}));

vi.mock('@/repositories/product.repository', () => {
  const mockRepository = {
    findById: vi.fn(),
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
    'https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/iso-front-top-left.png',
    'https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/iso-front-bottom-right.png'
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

describe('UC101: View Product Details', () => {
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

  it('TC_UP_UC101_001: retrieve product details successfully for valid product ID', async () => {
    mockRepository.findById.mockResolvedValue(mockProduct);

    const result = await productService.getProductById('052df8db-b0a1-4c2e-8fc5-28297362801d');

    expect(result).toEqual(mockProduct);
    expect(mockRepository.findById).toHaveBeenCalledWith('052df8db-b0a1-4c2e-8fc5-28297362801d');
  });

  it('TC_UP_UC101_002: throw error for non-existent product ID', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(productService.getProductById('non-existent-id'))
      .rejects.toThrow('Product with ID non-existent-id not found');
  });
});