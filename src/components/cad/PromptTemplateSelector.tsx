'use client';

import React from 'react';
import { MLPromptTemplate } from '@/data/sample-data';

interface PromptTemplateSelectorProps {
  templates: MLPromptTemplate[];
  selectedTemplateId: string | null;
  onSelectTemplate: (template: MLPromptTemplate) => void;
  isLoading?: boolean;
}

const PromptTemplateSelector: React.FC<PromptTemplateSelectorProps> = ({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  isLoading = false,
}) => {
  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'structural':
        return 'bg-gray-100 text-gray-800';
      case 'medical':
        return 'bg-green-100 text-green-800';
      case 'automotive':
        return 'bg-red-100 text-red-800';
      case 'robotic':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-purple-100 text-purple-800';
    }
  };

  // Empty state
  if (!isLoading && templates.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-gray-600 mb-2">No templates available</p>
        <p className="text-sm text-gray-500">
          Templates will appear here once they are loaded
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse"
          >
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 mb-3"></div>
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => {
        const isSelected = selectedTemplateId === template.id;
        
        return (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template)}
            className={`
              bg-white rounded-lg border-2 p-4 text-left transition-all
              hover:shadow-md hover:border-primary/50
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
              ${
                isSelected
                  ? 'border-primary shadow-md ring-2 ring-primary ring-offset-2'
                  : 'border-gray-200'
              }
            `}
            aria-pressed={isSelected}
            aria-label={`Select template: ${template.title}`}
          >
            {/* Template Title */}
            <h3 className="font-semibold text-gray-900 mb-2 text-base">
              {template.title}
            </h3>

            {/* Template Description */}
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {template.description}
            </p>

            {/* Category Badge and Tags */}
            <div className="flex flex-wrap gap-2 items-center">
              {/* Category Badge */}
              {template.category && (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
                    template.category
                  )}`}
                >
                  {template.category.charAt(0).toUpperCase() +
                    template.category.slice(1)}
                </span>
              )}

              {/* Tags */}
              {template.tags && template.tags.length > 0 && (
                <>
                  {template.tags.slice(0, 2).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                  {template.tags.length > 2 && (
                    <span className="text-xs text-gray-500">
                      +{template.tags.length - 2} more
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Selection Indicator */}
            {isSelected && (
              <div className="mt-3 flex items-center text-primary text-sm font-medium">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Selected
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default PromptTemplateSelector;
