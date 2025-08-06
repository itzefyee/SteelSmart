'use client';

import React from 'react';
import { FilterOptions } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface ProductFilterProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onClearFilters: () => void;
  categories: { id: string; name: string }[];
  materials: string[];
  priceRange: [number, number];
}

const ProductFilter: React.FC<ProductFilterProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  categories,
  materials,
  priceRange
}) => {
  const updateFilter = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const toggleCategory = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(id => id !== categoryId)
      : [...filters.categories, categoryId];
    updateFilter('categories', newCategories);
  };

  const toggleMaterial = (material: string) => {
    const newMaterials = filters.materials.includes(material)
      ? filters.materials.filter(m => m !== material)
      : [...filters.materials, material];
    updateFilter('materials', newMaterials);
  };

  const hasActiveFilters = 
    filters.categories.length > 0 ||
    filters.materials.length > 0 ||
    filters.priceRange[0] > priceRange[0] ||
    filters.priceRange[1] < priceRange[1] ||
    filters.inStockOnly ||
    filters.searchQuery.length > 0;

  return (
    <div className="bg-white rounded-lg shadow border p-6 sticky top-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
          >
            Clear All
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Products
          </label>
          <Input
            type="text"
            placeholder="Search by name or specifications..."
            value={filters.searchQuery}
            onChange={(value) => updateFilter('searchQuery', value)}
          />
        </div>

        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Categories
          </label>
          <div className="space-y-2">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  checked={filters.categories.includes(category.id)}
                  onChange={() => toggleCategory(category.id)}
                />
                <span className="ml-2 text-sm text-gray-700">
                  {category.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Materials */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Materials
          </label>
          <div className="space-y-2">
            {materials.map((material) => (
              <label key={material} className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  checked={filters.materials.includes(material)}
                  onChange={() => toggleMaterial(material)}
                />
                <span className="ml-2 text-sm text-gray-700">
                  {material}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Price Range
          </label>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min={priceRange[0]}
                max={priceRange[1]}
                value={filters.priceRange[0]}
                onChange={(e) => updateFilter('priceRange', [parseInt(e.target.value), filters.priceRange[1]])}
                className="w-full"
              />
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min={priceRange[0]}
                max={priceRange[1]}
                value={filters.priceRange[1]}
                onChange={(e) => updateFilter('priceRange', [filters.priceRange[0], parseInt(e.target.value)])}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>${filters.priceRange[0]}</span>
              <span>${filters.priceRange[1]}</span>
            </div>
          </div>
        </div>

        {/* In Stock Only */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary focus:ring-primary"
              checked={filters.inStockOnly}
              onChange={(e) => updateFilter('inStockOnly', e.target.checked)}
            />
            <span className="ml-2 text-sm text-gray-700">
              In stock only
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default ProductFilter;