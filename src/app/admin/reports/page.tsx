import React, { Suspense } from 'react';
import AdminReportsContent from '@/components/admin/reports/AdminReportsContent';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function AdminReportsFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<AdminReportsFallback />}>
      <AdminReportsContent />
    </Suspense>
  );
}
