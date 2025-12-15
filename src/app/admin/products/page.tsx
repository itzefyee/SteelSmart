import React, { Suspense } from 'react';
import AdminProductsContent from '@/components/admin/products/AdminProductsContent';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function AdminProductsFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<AdminProductsFallback />}>
      <AdminProductsContent />
    </Suspense>
  );
}
