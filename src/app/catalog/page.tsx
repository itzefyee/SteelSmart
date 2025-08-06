'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import ProductFilter from '@/components/ProductFilter';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Product, FilterOptions } from '@/types';
import { 
  filterProductsByCategory, 
  filterProductsBySearch, 
  filterProductsByPriceRange,
  sortProducts 
} from '@/lib/utils';

export default function CatalogPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('name-asc');
  
  const [filters, setFilters] = useState<FilterOptions>({
    categories: searchParams?.get('category') ? [searchParams.get('category')!] : [],
    materials: [],
    priceRange: [0, 1000],
    inStockOnly: false,
    searchQuery: ''
  });

  // Load products data
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await import('@/data/products.json');
        const products = response.products as Product[];
        setProducts(products);
        
        // Set initial price range based on actual data
        const prices = products.map((p: Product) => p.price);
        const minPrice = Math.floor(Math.min(...prices));
        const maxPrice = Math.ceil(Math.max(...prices));
        
        setFilters(prev => ({
          ...prev,
          priceRange: [minPrice, maxPrice]
        }));
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    // Apply category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(product => 
        filters.categories.includes(product.category)
      );
    }
    
    // Apply search filter
    if (filters.searchQuery) {
      filtered = filterProductsBySearch(filtered, filters.searchQuery);
    }
    
    // Apply material filter
    if (filters.materials.length > 0) {
      filtered = filtered.filter(product =>
        filters.materials.some(material => 
          product.material.toLowerCase().includes(material.toLowerCase())
        )
      );
    }
    
    // Apply price range filter
    filtered = filterProductsByPriceRange(filtered, filters.priceRange);
    
    // Apply stock filter
    if (filters.inStockOnly) {
      filtered = filtered.filter(product => product.inStock);
    }
    
    // Apply sorting
    return sortProducts(filtered, sortBy);
  }, [products, filters, sortBy]);

  // Get unique categories and materials for filters
  const categories = [
    { id: 'robotic', name: 'Robotic Components' },
    { id: 'structural', name: 'Structural Steel' },
    { id: 'fasteners', name: 'Fasteners' },
    { id: 'custom', name: 'Custom Parts' }
  ];

  const materials = useMemo(() => {
    const allMaterials = products.map(p => p.material);
    return Array.from(new Set(allMaterials)).sort();
  }, [products]);

  const priceRange: [number, number] = useMemo(() => {
    if (products.length === 0) return [0, 1000];
    const prices = products.map(p => p.price);
    return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))];
  }, [products]);

  const clearFilters = () => {
    setFilters({
      categories: [],
      materials: [],
      priceRange: priceRange,
      inStockOnly: false,
      searchQuery: ''
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mb-4" />
            <p className="text-gray-600">Loading products...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Product Catalog</h1>
            <p className="text-lg text-gray-600">
              Browse our comprehensive selection of metal and steel parts
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <ProductFilter
                filters={filters}
                onFiltersChange={setFilters}
                onClearFilters={clearFilters}
                categories={categories}
                materials={materials}
                priceRange={priceRange}
              />
            </div>

            {/* Products Grid */}
            <div className="lg:col-span-3">
              {/* Sort and Results Info */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="text-sm text-gray-600">
                  Showing {filteredProducts.length} of {products.length} products
                </div>
                
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-primary focus:border-primary"
                  >
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="price-asc">Price (Low to High)</option>
                    <option value="price-desc">Price (High to Low)</option>
                  </select>
                </div>
              </div>

              {/* Products Grid */}
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product}
                      showCompatibility={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow border">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your filters or search terms to find what you&apos;re looking for.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="text-primary hover:text-blue-700 font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}