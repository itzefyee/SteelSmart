import React, { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CatalogContent from '@/components/CatalogContent';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function CatalogFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export default function CatalogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Suspense fallback={<CatalogFallback />}>
        <CatalogContent />
      </Suspense>
      <Footer />
    </div>
  );
}