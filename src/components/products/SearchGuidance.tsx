'use client';

import { AlertCircle, Lightbulb, Search } from 'lucide-react';
import { useState } from 'react';

interface SearchGuidanceProps {
  searchResults: any[];
  searchSpecs: {
    material?: string;
    category?: string;
    dimensions?: string;
    loadCapacity?: string;
    query?: string;
  };
  onSuggestionClick?: (specs: any) => void;
}

export function SearchGuidance({ searchResults, searchSpecs, onSuggestionClick }: SearchGuidanceProps) {
  const [showGuidance, setShowGuidance] = useState(true);
  
  // Check if results are poor quality
  const hasLowConfidence = searchResults.length > 0 && 
    searchResults.every(r => r.confidence && r.confidence < 0.7);
  const hasNoResults = searchResults.length === 0;
  const hasVeryFewResults = searchResults.length > 0 && searchResults.length < 3;
  
  const shouldShowGuidance = hasLowConfidence || hasNoResults || hasVeryFewResults;
  
  if (!shouldShowGuidance || !showGuidance) {
    return null;
  }

  // Generate suggestions based on what's missing
  const suggestions = generateSearchSuggestions(searchSpecs);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-blue-900">
              {hasNoResults ? 'No Results Found' : 'Improve Your Results'}
            </h3>
            <button
              onClick={() => setShowGuidance(false)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Dismiss
            </button>
          </div>
          
          <p className="text-sm text-blue-800 mb-3">
            {hasNoResults 
              ? 'We couldn\'t find any products matching your criteria. Try these suggestions:'
              : 'We found some matches, but data is limited. Try these to get better results:'}
          </p>
          
          <ul className="text-sm text-blue-700 space-y-2">
            {!searchSpecs.material && (
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Specify a material (e.g., "Steel", "Aluminum", "Stainless Steel")</span>
              </li>
            )}
            {!searchSpecs.category && (
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Select a category to narrow results</span>
              </li>
            )}
            {!searchSpecs.dimensions && (
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Add approximate dimensions if known (e.g., "200x100mm")</span>
              </li>
            )}
            {searchSpecs.material && searchSpecs.category && (
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Try broader search terms or different material variations</span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Use the AI Alternatives tab for more options</span>
            </li>
          </ul>

          {suggestions.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-blue-900 mb-2">Quick suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => onSuggestionClick?.(suggestion.specs)}
                    className="px-3 py-1.5 bg-white hover:bg-blue-100 border border-blue-300 rounded-md text-sm text-blue-700 transition-colors"
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function generateSearchSuggestions(originalSearch: any) {
  const suggestions: Array<{ label: string; specs: any }> = [];

  // Broader material search
  if (originalSearch.material) {
    const materialFamily = getMaterialFamily(originalSearch.material);
    if (materialFamily !== originalSearch.material) {
      suggestions.push({
        label: `All ${materialFamily} products`,
        specs: { ...originalSearch, material: materialFamily },
      });
    }
  }

  // Category-only search
  if (originalSearch.category && originalSearch.category !== 'all') {
    suggestions.push({
      label: `All ${originalSearch.category}`,
      specs: { category: originalSearch.category },
    });
  }

  // Remove dimension constraints
  if (originalSearch.dimensions) {
    suggestions.push({
      label: 'Without dimension filter',
      specs: { ...originalSearch, dimensions: undefined },
    });
  }

  // Popular materials if no material specified
  if (!originalSearch.material) {
    ['Steel', 'Aluminum', 'Stainless Steel'].forEach(material => {
      suggestions.push({
        label: material,
        specs: { ...originalSearch, material },
      });
    });
  }

  return suggestions.slice(0, 5); // Limit to 5 suggestions
}

function getMaterialFamily(material: string): string {
  const normalized = material.toLowerCase();
  
  if (normalized.includes('steel') || normalized.includes('stainless')) {
    return 'Steel';
  }
  if (normalized.includes('aluminum') || normalized.includes('aluminium')) {
    return 'Aluminum';
  }
  if (normalized.includes('brass')) {
    return 'Brass';
  }
  if (normalized.includes('copper')) {
    return 'Copper';
  }
  
  return material;
}

// Alternative search suggestions component
export function AlternativeSearches({ originalSearch, onSearch }: {
  originalSearch: any;
  onSearch: (specs: any) => void;
}) {
  const suggestions = generateAlternativeSearches(originalSearch);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <Search className="w-4 h-4 text-gray-600" />
        <h4 className="text-sm font-semibold text-gray-700">Try these searches:</h4>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSearch(suggestion.specs)}
            className="px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-700 transition-colors"
          >
            {suggestion.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function generateAlternativeSearches(originalSearch: any) {
  const alternatives: Array<{ label: string; specs: any }> = [];

  // Similar materials
  if (originalSearch.material) {
    const similarMaterials = getSimilarMaterials(originalSearch.material);
    similarMaterials.forEach(material => {
      alternatives.push({
        label: material,
        specs: { ...originalSearch, material },
      });
    });
  }

  // Related categories
  if (originalSearch.category) {
    const relatedCategories = getRelatedCategories(originalSearch.category);
    relatedCategories.forEach(category => {
      alternatives.push({
        label: `${category} products`,
        specs: { ...originalSearch, category },
      });
    });
  }

  // Relaxed dimensions
  if (originalSearch.dimensions) {
    alternatives.push({
      label: 'Similar sizes',
      specs: { ...originalSearch, dimensions: relaxDimensions(originalSearch.dimensions) },
    });
  }

  return alternatives.slice(0, 6);
}

function getSimilarMaterials(material: string): string[] {
  const normalized = material.toLowerCase();
  
  if (normalized.includes('steel')) {
    return ['Stainless Steel', 'Carbon Steel', 'Galvanized Steel'];
  }
  if (normalized.includes('aluminum')) {
    return ['Aluminum Alloy', 'Anodized Aluminum'];
  }
  
  return [];
}

function getRelatedCategories(category: string): string[] {
  const categoryMap: Record<string, string[]> = {
    'robotic': ['structural', 'fasteners'],
    'structural': ['robotic', 'custom'],
    'fasteners': ['structural', 'custom'],
    'custom': ['structural', 'robotic'],
  };
  
  return categoryMap[category] || [];
}

function relaxDimensions(dimensions: string): string {
  // Extract numbers and add ±10% tolerance
  const numbers = dimensions.match(/\d+/g);
  if (!numbers) return dimensions;
  
  return numbers.map(n => {
    const num = parseInt(n);
    const tolerance = Math.round(num * 0.1);
    return `${num - tolerance}-${num + tolerance}`;
  }).join('x');
}
