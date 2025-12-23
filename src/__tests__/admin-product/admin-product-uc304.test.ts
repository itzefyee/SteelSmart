/**
 * UC304: Delete Product (Admin)
 * Tests the admin functionality of deleting products using product ID as key
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProductService } from '@/services/admin/product.service';
import { NotFoundError } from '@/lib/errors/app-errors';

// Mock the repository
const mockRepositoryInstance = {
  findById: vi.fn(),
  delete: vi.fn(),
};

vi.mock('@/repositories/admin/product.repository', () => ({
  ProductRepository: class MockProductRepository {
    findById = mockRepositoryInstance.findById;
    delete = mockRepositoryInstance.delete;
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

describe('UC304: Delete Product (Admin)', () => {
  let productService: ProductService;

  beforeEach(() => {
    vi.clearAllMocks();
    productService = new ProductService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TC_AP_UC304_001: delete product successfully', async () => {
    mockRepositoryInstance.findById.mockResolvedValue(existingProduct);
    mockRepositoryInstance.delete.mockResolvedValue(undefined);

    await productService.delete('052df8db-b0a1-4c2e-8fc5-28297362801d');

    expect(mockRepositoryInstance.findById).toHaveBeenCalledWith('052df8db-b0a1-4c2e-8fc5-28297362801d');
    expect(mockRepositoryInstance.delete).toHaveBeenCalledWith('052df8db-b0a1-4c2e-8fc5-28297362801d');
  });
});