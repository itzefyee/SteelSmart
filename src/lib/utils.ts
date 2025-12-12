// Utility functions for SteelSmart application
import { Product } from '@/types';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const isValidFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

export const isValidFileSize = (file: File, maxSizeInMB: number): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};

// Product filtering utilities
export const filterProductsBySearch = (products: Product[], query: string) => {
  if (!query) return products;
  const lowercaseQuery = query.toLowerCase();
  return products.filter(product => 
    product.name.toLowerCase().includes(lowercaseQuery) ||
    (product.description && product.description.toLowerCase().includes(lowercaseQuery)) ||
    (product.technical_details && product.technical_details.toLowerCase().includes(lowercaseQuery))
  );
};

export const filterProductsByPriceRange = (products: Product[], range: [number, number]) => {
  const [min, max] = range;
  return products.filter(product => product.price >= min && product.price <= max);
};

export const sortProducts = (products: Product[], sortBy: string) => {
  switch (sortBy) {
    case 'price-asc':
      return [...products].sort((a, b) => a.price - b.price);
    case 'price-desc':
      return [...products].sort((a, b) => b.price - a.price);
    case 'name-asc':
      return [...products].sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc':
      return [...products].sort((a, b) => b.name.localeCompare(a.name));
    default:
      return products;
  }
};