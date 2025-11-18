'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/products/ProductCard';
import ProductFilter from '@/components/products/ProductFilter';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { FilterOptions } from '@/types';
import { useProducts, useCategories } from '@/hooks';
import { 
  filterProductsBySearch, 
  filterProductsByPriceRange,
  sortProducts 
} from '@/lib/utils';

export default function CatalogContent() {
  const searchParams = useSearchParams();
  const [sortBy, setSortBy] = useState('name-asc');
  
  const [filters, setFilters] = useState<FilterOptions>({
    categories: searchParams?.get('category') ? [searchParams.get('category')!] : [],
    materials: [],
    priceRange: [0, 10000],
    inStockOnly: false,
    searchQuery: ''
  });

  // Fetch categories from Supabase
  const { categories: categoriesData, loading: categoriesLoading } = useCategories();

  // Fetch products from Supabase
  const { products, loading: productsLoading } = useProducts({
    autoFetch: true,
  });

  const loading = productsLoading || categoriesLoading;

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Apply category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(product => 
        filters.categories.includes(product.category)
      );
    }

    // Apply material filter
    if (filters.materials.length > 0) {
      filtered = filtered.filter(product =>
        product.material && filters.materials.some(material =>
          product.material!.toLowerCase().includes(material.toLowerCase())
        )
      );
    }

    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query)) ||
        (product.technical_details && product.technical_details.toLowerCase().includes(query))
      );
    }

    // Apply price range filter
    filtered = filtered.filter(product => 
      product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1]
    );

    // Apply in-stock filter
    if (filters.inStockOnly) {
      filtered = filtered.filter(product => product.in_stock);
    }

    // Sort products
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        default:
          return 0;
      }
    });

    return sorted;
  }, [products, filters, sortBy]);

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      categories: [],
      materials: [],
      priceRange: [0, 10000],
      inStockOnly: false,
      searchQuery: ''
    });
  };

  // Get unique categories and materials for filter options
  const availableCategories = useMemo(() => {
    return categoriesData.map(cat => ({
      id: cat.id,
      name: cat.name
    }));
  }, [categoriesData]);

  const availableMaterials = useMemo(() => {
    const materials = [...new Set(products.map(p => p.material).filter((m): m is string => m !== null && m !== undefined))];
    return materials.sort();
  }, [products]);

  const priceRange: [number, number] = useMemo(() => {
    if (products.length === 0) return [0, 10000];
    const prices = products.map(p => p.price);
    return [Math.min(...prices), Math.max(...prices)];
  }, [products]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <main className="catalog-shell">
      <div className="catalog-grid-pattern" aria-hidden="true"></div>
      <div className="catalog-wire-pattern" aria-hidden="true"></div>
      <div className="catalog-particle-layer" aria-hidden="true"></div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-200 mb-2">Metalyze Inventory</p>
          <h1 className="text-3xl font-semibold text-white mb-4">
            Product Catalog
          </h1>
          <p className="text-lg text-slate-300 max-w-3xl">
            Discover our comprehensive selection of robotic components, structural steel, and custom fabricated parts.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:items-stretch">
          {/* Sidebar Filters - Separate Glass Container */}
          <div className="lg:w-1/4 w-full">
            <div className="catalog-glass-container p-4">
              <ProductFilter
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
                categories={availableCategories}
                materials={availableMaterials}
                priceRange={priceRange}
              />
            </div>
          </div>

          {/* Main Content - Separate Glass Container */}
          <div className="lg:w-3/4 w-full">
            <div className="catalog-glass-container h-full p-8">
              {/* Sort and Results Count */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="text-sm font-medium text-white">
                  Showing <span className="text-blue-300 font-bold">{filteredAndSortedProducts.length}</span> of {products.length} products
                </div>
                
                <div className="flex items-center space-x-2">
                  <label htmlFor="sort" className="text-sm font-medium text-white">
                    Sort by:
                  </label>
                  <select
                    id="sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-white/20 bg-white/5 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm font-medium"
                  >
                    <option value="name-asc" className="bg-slate-800">Name (A-Z)</option>
                    <option value="name-desc" className="bg-slate-800">Name (Z-A)</option>
                    <option value="price-asc" className="bg-slate-800">Price (Low to High)</option>
                    <option value="price-desc" className="bg-slate-800">Price (High to Low)</option>
                  </select>
                </div>
              </div>

              {/* Products Grid */}
              {filteredAndSortedProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredAndSortedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
                  <div className="text-slate-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No products found</h3>
                  <p className="text-slate-300 mb-4">
                    Try adjusting your filters or search terms to find what you&apos;re looking for.
                  </p>
                  <button
                    onClick={handleClearFilters}
                    className="inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-md text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-0"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}