'use client';

import React from 'react';

export type StageStatus = 'pending' | 'active' | 'success' | 'error';

export interface StagedProgressItem {
  id: string;
  label: string;
  status: StageStatus;
  message?: string;
}

interface StagedProgressProps {
  title?: string;
  subtitle?: string;
  stages: StagedProgressItem[];
  className?: string;
}

const statusConfig: Record<StageStatus, { badge: string; text: string; icon: React.ReactNode }> = {
  pending: {
    badge: 'bg-gray-100 text-gray-600 border-gray-200',
    text: 'Pending',
    icon: (
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
      </svg>
    )
  },
  active: {
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    text: 'In Progress',
    icon: (
      <svg className="w-4 h-4 text-blue-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8" />
      </svg>
    )
  },
  success: {
    badge: 'bg-green-100 text-green-700 border-green-200',
    text: 'Complete',
    icon: (
      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    )
  },
  error: {
    badge: 'bg-red-100 text-red-700 border-red-200',
    text: 'Failed',
    icon: (
      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
};

export const StagedProgress: React.FC<StagedProgressProps> = ({
  title,
  subtitle,
  stages,
  className = ''
}) => {
  if (!stages || stages.length === 0) {
    return null;
  }

  return (
    <div className={`rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-sm ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <p className="text-sm font-semibold text-gray-900">{title}</p>}
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      )}
      <div className="space-y-3">
        {stages.map((stage, index) => {
          const config = statusConfig[stage.status];
          return (
            <div key={stage.id}>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 border border-gray-200 flex-shrink-0">
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900">{stage.label}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${config.badge}`}>
                      {config.text}
                    </span>
                  </div>
                  {stage.message && (
                    <p className="text-xs text-gray-500 mt-1">{stage.message}</p>
                  )}
                </div>
              </div>
              {index < stages.length - 1 && (
                <div className="ml-4 mt-3 border-l border-dashed border-gray-200 h-4" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StagedProgress;




