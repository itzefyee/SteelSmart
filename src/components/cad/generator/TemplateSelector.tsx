'use client';

import React, { useMemo } from 'react';
import { cadTemplates } from '@/data/sample-data';
import { Button } from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import TemplateCardButton from './TemplateCardButton';

interface TemplateSelectorProps {
  selectedTemplate: number | null;
  onTemplateSelect: (templateId: number) => void;
  onGenerate: () => void;
  isPending: boolean;
}

const slugifyTemplateName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');

const TemplateSelector: React.FC<TemplateSelectorProps> = React.memo(({
  selectedTemplate,
  onTemplateSelect,
  onGenerate,
  isPending,
}) => {
  const brakeRotorTemplateBadges = useMemo(() => (
    <div className="flex items-center gap-2 text-[11px] text-amber-700">
      <span className="inline-flex items-center px-1.5 py-0.25 rounded-full border border-gray-300 hover:border-amber-400 bg-gray-50 hover:bg-amber-50">
        $$
      </span>
      <span className="inline-flex items-center px-1.5 py-0.25 rounded-full border border-gray-300 hover:border-amber-400 bg-gray-50 hover:bg-amber-50 uppercase tracking-wide">
        Complex
      </span>
    </div>
  ), []);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Choose a template
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cadTemplates.map((template) => {
            const paramEntries = Object.entries(template.parameters);
            const isBrakeRotorTemplate = template.id === 4;
            const slug = slugifyTemplateName(template.name);
            return (
              <div key={template.id} id={`template-card-${slug}`}>
                <TemplateCardButton
                  title={template.name}
                  description={template.description}
                  badge={template.category}
                  previewSrc={template.preview}
                  onClick={() => onTemplateSelect(template.id)}
                  isActive={selectedTemplate === template.id}
                  accentColor={isBrakeRotorTemplate ? 'yellow' : 'blue'}
                  extraBadges={isBrakeRotorTemplate ? brakeRotorTemplateBadges : undefined}
                >
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
                    {paramEntries.slice(0, 4).map(([key, param]) => (
                      <div key={key}>
                        <span className="font-semibold text-gray-700">{param.label}:</span>{' '}
                        <span className="text-gray-900">
                          {param.value}
                          {param.unit}
                        </span>
                      </div>
                    ))}
                    {paramEntries.length > 4 && (
                      <div className="col-span-2 text-xs text-gray-500">
                        +{paramEntries.length - 4} more parameters
                      </div>
                    )}
                  </div>
                </TemplateCardButton>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex justify-center">
        <Button 
          onClick={onGenerate}
          disabled={selectedTemplate === null || isPending}
          className="px-8"
        >
          {isPending ? <LoadingSpinner size="sm" /> : 'Generate from Template'}
        </Button>
      </div>
    </div>
  );
});

TemplateSelector.displayName = 'TemplateSelector';

export default TemplateSelector;
