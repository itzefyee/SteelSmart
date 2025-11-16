'use client';

import React from 'react';
import Link from 'next/link';
import { useCategories } from '@/hooks';

const CategoryShowcase: React.FC = () => {
  const { categories, loading } = useCategories();

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'robotic':
        return (
          <div className="w-16 h-10 bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg relative">
            <div className="absolute top-1 left-1 w-2 h-2 bg-red-500 rounded-full"></div>
            <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-6 bg-gray-700 rounded-r"></div>
          </div>
        );
      case 'structural':
        return (
          <div className="w-20 h-8 relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-gray-500 to-gray-700 rounded-sm"></div>
            <div className="absolute top-1.5 left-1/2 transform -translate-x-1/2 w-1 h-5 bg-gradient-to-r from-gray-600 to-gray-800"></div>
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-gray-500 to-gray-700 rounded-sm"></div>
          </div>
        );
      case 'fasteners':
        return (
          <div className="flex space-x-2">
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 bg-gradient-to-br from-yellow-600 to-orange-700 transform rotate-45 mb-1"></div>
              <div className="w-1 h-6 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-sm"></div>
            </div>
            <div className="w-3 h-3 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full relative">
              <div className="absolute inset-0.5 w-2 h-2 bg-gray-800 rounded-full"></div>
            </div>
          </div>
        );
      case 'custom':
        return (
          <div className="w-16 h-12 relative">
            <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-sm"></div>
            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-purple-600 to-indigo-700 rounded-sm"></div>
            <div className="absolute top-1 left-1 w-1 h-1 bg-gray-800 rounded-full"></div>
            <div className="absolute bottom-1 left-4 w-1 h-1 bg-gray-800 rounded-full"></div>
          </div>
        );
      default:
        return null;
    }
  };

  const getCategoryGradient = (categoryId: string) => {
    switch (categoryId) {
      case 'robotic':
        return 'from-blue-50 to-blue-100';
      case 'structural':
        return 'from-amber-50 to-amber-100';
      case 'fasteners':
        return 'from-yellow-50 to-yellow-100';
      case 'custom':
        return 'from-purple-50 to-purple-100';
      default:
        return 'from-gray-50 to-gray-100';
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Explore Our Product Categories</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From precision robotics to heavy-duty structural components, discover our comprehensive range of industrial products.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="w-full h-32 bg-gray-200 rounded-lg mb-4 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Explore Our Product Categories</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            From precision robotics to heavy-duty structural components, discover our comprehensive range of industrial products.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((category) => (
            <Link 
              key={category.id}
              href={`/catalog?category=${category.id}`} 
              className="group cursor-pointer bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className={`w-full h-32 bg-gradient-to-br ${getCategoryGradient(category.id)} rounded-lg mb-4 flex items-center justify-center`}>
                {getCategoryIcon(category.id)}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                {category.name}
              </h3>
              <p className="text-gray-600 text-sm">
                {category.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryShowcase;
