import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/types';

describe('ProductCard Component', () => {
  const mockProduct: Product = {
    id: '1',
    name: 'Steel Beam I-100',
    price: 150,
    category: 'Structural',
    description: 'High-quality structural steel beam',
    technicalDetails: 'Load capacity: 1000kg, Length: 6m',
    image: '/images/beam.jpg',
    inStock: true,
    manufacturer: 'SteelCorp',
    leadTime: '5-7 days',
  } as Product;

  it('should render product name', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Steel Beam I-100')).toBeInTheDocument();
  });

  it('should render formatted price', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('$150.00')).toBeInTheDocument();
  });

  it('should render category', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Structural')).toBeInTheDocument();
  });

  it('should render in stock status when available', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('In Stock')).toBeInTheDocument();
  });

  it('should render out of stock status when unavailable', () => {
    const outOfStockProduct = { ...mockProduct, inStock: false };
    render(<ProductCard product={outOfStockProduct} />);
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });
});
