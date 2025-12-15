'use client';

import React from 'react';

export interface TemplateCardButtonProps {
  title: string;
  description: string;
  badge?: string;
  onClick: () => void;
  isActive?: boolean;
  previewSrc?: string;
  children?: React.ReactNode;
  accentColor?: 'blue' | 'yellow';
  extraBadges?: React.ReactNode;
}

const TemplateCardButton: React.FC<TemplateCardButtonProps> = React.memo(({
  title,
  description,
  badge,
  onClick,
  isActive = false,
  previewSrc,
  children,
  accentColor = 'blue',
  extraBadges,
}) => {
  const accent =
    accentColor === 'yellow'
      ? {
          baseBorder: 'border-amber-200',
          hoverBorder: 'hover:border-amber-400',
          activeBorder: 'border-amber-500',
          activeRing: 'ring-amber-300',
          activeBg: 'bg-gradient-to-br from-white via-amber-50 to-amber-100',
          checkBg: 'bg-amber-500',
        }
      : {
          baseBorder: 'border-transparent',
          hoverBorder: 'hover:border-primary/40',
          activeBorder: 'border-primary/40',
          activeRing: 'ring-primary/40',
          activeBg: 'bg-gradient-to-br from-white via-primary/5 to-primary/10',
          checkBg: 'bg-primary',
        };

  const activeClasses = isActive
    ? `${accent.activeBg} ${accent.activeBorder} ring-2 ${accent.activeRing} shadow-lg scale-[1.01]`
    : `${accent.baseBorder} ${accent.hoverBorder}`;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={`relative text-left p-4 glass-card group hover:shadow-md transition-all border ${activeClasses}`}
    >
      {isActive && (
        <span className={`absolute top-3 right-3 inline-flex h-5 w-5 items-center justify-center rounded-full text-white shadow ${accent.checkBg}`}>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}
      <div className="flex items-start gap-4">
        {previewSrc && (
          <div className="flex-shrink-0 w-45 h-36 rounded-lg border border-gray-200 bg-gradient-to-br from-white via-gray-50 to-slate-100 overflow-hidden flex items-center justify-center">
            <img
              src={previewSrc}
              alt={title}
              className="w-full h-full object-contain"
            />
          </div>
        )}
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-gray-900 text-base">{title}</h4>
            <div className="flex items-center gap-2">
              {extraBadges}
              {badge && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                  {badge}
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
          {children}
        </div>
      </div>
    </button>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.isActive === nextProps.isActive &&
    prevProps.title === nextProps.title &&
    prevProps.description === nextProps.description &&
    prevProps.badge === nextProps.badge &&
    prevProps.accentColor === nextProps.accentColor &&
    prevProps.previewSrc === nextProps.previewSrc &&
    prevProps.onClick === nextProps.onClick &&
    prevProps.extraBadges === nextProps.extraBadges &&
    prevProps.children === nextProps.children
  );
});

TemplateCardButton.displayName = 'TemplateCardButton';

export default TemplateCardButton;
