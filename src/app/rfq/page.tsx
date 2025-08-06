import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RFQForm from '@/components/RFQForm';
import FeatureIcon from '@/components/FeatureIcon';

export default function RFQPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Request for Quote</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get competitive quotes for your steel and metal part requirements. Our team will review your specifications and provide a detailed quote within 24 hours.
            </p>
          </div>
          
          <RFQForm />
          
          {/* Help Section */}
          <div className="mt-12 bg-white rounded-lg shadow border p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <FeatureIcon type="response" className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast Response</h3>
                <p className="text-gray-600 text-sm">We respond to all RFQs within 24 hours with detailed quotes and recommendations.</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <FeatureIcon type="quality" className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Quality Assured</h3>
                <p className="text-gray-600 text-sm">All our products meet industry standards with certified materials and rigorous testing.</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <FeatureIcon type="support" className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Expert Support</h3>
                <p className="text-gray-600 text-sm">Our technical team provides guidance on material selection and design optimization.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}