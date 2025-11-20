'use client';

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import RFQForm from '@/components/rfq/RFQForm';
import RFQTracking from '@/components/rfq/RFQTracking';
import FeatureIcon from '@/components/FeatureIcon';
import PageHero from '@/components/layout/PageHero';
import WireframeIconLayer from '@/components/layout/WireframeIconLayer';

export default function RFQPage() {
  const [activeTab, setActiveTab] = useState<'form' | 'tracking'>('form');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 home-wavy-bg relative overflow-hidden">
        <WireframeIconLayer />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-10">
            <PageHero
              align="left"
              eyebrow="Sourcing Desk"
              eyebrowPlacement="inline-after"
              title="Request for Quote"
              description="Send CAD, quantities, and delivery targets; vetted partners reply with pricing and lead times inside a day."
              theme="light"
              highlightPlacement="side"
              highlights={[
                { label: 'Avg Reply', value: '<24h' },
                { label: 'Vendors', value: '120+' },
                { label: 'Processes', value: '8 Core' },
                { label: 'Regions', value: '4 Zones' },
              ]}
            />
          </div>
          
          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex justify-center space-x-8">
                <button
                  onClick={() => setActiveTab('form')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'form'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Create New RFQ
                </button>
                <button
                  onClick={() => setActiveTab('tracking')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'tracking'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Track Existing RFQs
                </button>
              </nav>
            </div>
          </div>
          
          {/* Tab Content */}
          {activeTab === 'form' ? <RFQForm /> : <RFQTracking />}
          
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