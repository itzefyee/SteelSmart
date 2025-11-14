import { describe, it, expect } from 'vitest';
import {
  formatPrice,
  validateEmail,
  formatFileSize,
  isValidFileType,
  isValidFileSize,
  filterProductsBySearch,
  filterProductsByPriceRange,
  sortProducts,
} from '@/lib/utils';
import type { Product } from '@/types';

describe('Utils - Price Formatting', () => {
  it('should format price correctly', () => {
    expect(formatPrice(1000)).toBe('$1,000.00');
    expect(formatPrice(99.99)).toBe('$99.99');
    expect(formatPrice(0)).toBe('$0.00');
  });
});

describe('Utils - Email Validation', () => {
  it('should validate correct email addresses', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name+tag@example.co.uk')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('invalid@')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('invalid@example')).toBe(false);
  });
});

describe('Utils - File Size Formatting', () => {
  it('should format file sizes correctly', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
  });
});

describe('Utils - File Validation', () => {
  it('should validate file types', () => {
    const pdfFile = new File([''], 'test.pdf', { type: 'application/pdf' });
    const jpgFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const txtFile = new File([''], 'test.txt', { type: 'text/plain' });

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    expect(isValidFileType(pdfFile, allowedTypes)).toBe(true);
    expect(isValidFileType(jpgFile, allowedTypes)).toBe(true);
    expect(isValidFileType(txtFile, allowedTypes)).toBe(false);
  });

  it('should validate file sizes', () => {
    const smallFile = new File(['x'.repeat(1024)], 'small.txt'); // 1KB
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.txt'); // 11MB

    expect(isValidFileSize(smallFile, 10)).toBe(true);
    expect(isValidFileSize(largeFile, 10)).toBe(false);
  });
});

describe('Utils - Product Filtering', () => {
  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'Steel Beam',
      price: 150,
      category: 'Structural',
      description: 'High-quality steel beam',
      technicalDetails: 'Load capacity 1000kg',
      image: '/images/beam.jpg',
      inStock: true,
    },
    {
      id: '2',
      name: 'Servo Motor',
      price: 75,
      category: 'Robotic',
      description: 'Precision servo motor',
      technicalDetails: 'Torque 5Nm',
      image: '/images/motor.jpg',
      inStock: true,
    },
  ] as Product[];

  it('should filter products by search query', () => {
    const result = filterProductsBySearch(mockProducts, 'steel');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Steel Beam');
  });

  it('should return all products with empty query', () => {
    const result = filterProductsBySearch(mockProducts, '');
    expect(result).toHaveLength(2);
  });

  it('should filter products by price range', () => {
    const result = filterProductsByPriceRange(mockProducts, [0, 100]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Servo Motor');
  });

  it('should sort products by price ascending', () => {
    const result = sortProducts(mockProducts, 'price-asc');
    expect(result[0].price).toBe(75);
    expect(result[1].price).toBe(150);
  });

  it('should sort products by price descending', () => {
    const result = sortProducts(mockProducts, 'price-desc');
    expect(result[0].price).toBe(150);
    expect(result[1].price).toBe(75);
  });
});
