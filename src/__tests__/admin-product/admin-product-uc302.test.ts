/**
 * UC302: Create Product (Admin)
 * Tests the admin functionality of creating new products
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProductService } from '@/services/admin/product.service';
import { ValidationError } from '@/lib/errors/app-errors';
import type { CreateProductInput } from '@/repositories/admin/product.repository';

// Mock the repository
const mockRepositoryInstance = {
  create: vi.fn(),
};

vi.mock('@/repositories/admin/product.repository', () => ({
  ProductRepository: class MockProductRepository {
    create = mockRepositoryInstance.create;
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

// Input type that matches what the service expects (includes id as required by CreateProductInput)
const validProductInput: CreateProductInput = {
  id: '052df8db-b0a1-4c2e-8fc5-28297362802d', // Service will override this
  sku: 'pressure-sensor-001',
  name: 'Industrial Pressure Sensor 0-200 Bar',
  category: 'robotic',
  material: 'Stainless Steel',
  material_family: 'steel',
  component_type_id: '00000000-0000-4000-8000-00000000010c',
  price: 129.95,
  description: 'High-accuracy pressure sensor for industrial automation and control systems.',
  technical_details: '4-20mA output, M12 connector, IP67 rated, CE certified',
  specifications: {
    weight: '0.15 kg',
    tolerance: '±0.25% FS',
    dimensions: '55mm x 30mm x 18mm',
    loadCapacity: '200 bar maximum',
    operatingTemp: '-40°C to +125°C'
  },
  images: [
    'https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-002/preview.png'
  ],
  compatible_with: ['linear-actuator-001', 'control-module-001'],
  in_stock: true,
  lead_time: '3-5 business days'
};

const createdProduct = {
  ...validProductInput,
  created_at: '2025-12-23T10:19:54.486863+00:00',
  updated_at: '2025-12-23T10:19:54.486863+00:00'
};

describe('UC302: Create Product (Admin)', () => {
  let productService: ProductService;

  beforeEach(() => {
    vi.clearAllMocks();
    productService = new ProductService();
    
    // Mock crypto.randomUUID
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => '052df8db-b0a1-4c2e-8fc5-28297362802d')
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('TC_AP_UC302_001: create product successfully', async () => {
    mockRepositoryInstance.create.mockResolvedValue(createdProduct);

    const result = await productService.create(validProductInput);

    expect(result).toEqual(createdProduct);
    expect(mockRepositoryInstance.create).toHaveBeenCalledWith({
      ...validProductInput,
      id: '052df8db-b0a1-4c2e-8fc5-28297362802d'
    });
  });

  it('TC_AP_UC302_002: reject creation with invalid input data', async () => {
    const invalidInputs = [
      { ...validProductInput, name: '' }, // Empty name (validateRequired)
      { ...validProductInput, price: -10 }, // Negative price (validatePositiveNumber)
      { ...validProductInput, category: '' }, // Empty category (validateRequired)
    ];

    for (const invalidInput of invalidInputs) {
      await expect(productService.create(invalidInput))
        .rejects.toThrow(ValidationError);
    }
  });
});