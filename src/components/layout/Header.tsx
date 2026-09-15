'use client';

import React, { useId, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/auth/AuthProvider';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCadToolsOpen, setIsCadToolsOpen] = useState(false);
  const cadToolsMenuId = useId();
  const { user, loading } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/images/logo.svg" alt="SteelSmart" width={120} height={44} className="h-11 w-auto" priority />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav aria-label="Primary navigation" className="hidden md:flex items-center space-x-8">
            <Link href="/catalog" className="text-gray-700 hover:text-primary transition-colors">
              Catalog
            </Link>
            <div
              className="relative"
              onMouseEnter={() => setIsCadToolsOpen(true)}
              onMouseLeave={() => setIsCadToolsOpen(false)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setIsCadToolsOpen(false);
              }}
            >
              <button
                type="button"
                aria-expanded={isCadToolsOpen}
                aria-controls={cadToolsMenuId}
                aria-haspopup="menu"
                onClick={() => setIsCadToolsOpen((open) => !open)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setIsCadToolsOpen(false);
                  if (event.key === 'ArrowDown') setIsCadToolsOpen(true);
                }}
                className="text-gray-700 hover:text-primary transition-colors flex items-center"
              >
                AI CAD Tools
                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className={`absolute top-full left-0 w-64 pt-2 z-50 ${
                  isCadToolsOpen ? 'block' : 'hidden'
                }`}
              >
                <div id={cadToolsMenuId} role="menu" className="rounded-md border bg-white py-2 shadow-md">
                  <Link role="menuitem" href="/cad-generator" onClick={() => setIsCadToolsOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                    <svg className="w-4 h-4 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                    CAD Generator
                  </Link>
                  <Link role="menuitem" href="/cad-analyzer" onClick={() => setIsCadToolsOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                    <svg className="w-4 h-4 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    CAD Analyzer
                  </Link>
                  <Link role="menuitem" href="/product-recommender" onClick={() => setIsCadToolsOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                    <svg className="w-4 h-4 mr-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Product Recommender
                  </Link>
                </div>
              </div>
            </div>
            <Link href="/rfq" className="text-gray-700 hover:text-primary transition-colors">
              Request Quote
            </Link>
            
            {/* Account Button - Shows username if logged in, "Account" if not */}
            {loading ? (
              <div className="flex items-center">
                <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
              </div>
            ) : (
              <Link 
                href="/account"
                className="text-gray-700 hover:text-primary transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {user ? (user.email?.split('@')[0] || 'Account') : 'Account'}
              </Link>
            )}
            
            {/* TARUMT Logo */}
            <div className="flex items-center ml-6 pl-6 border-l border-gray-200">
              <Image 
                src="/images/tarumt-logo-767.png" 
                alt="TARUMT" 
                width={100}
                height={32}
                className="h-8 w-auto"
              />
            </div>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-primary focus:outline-none"
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav id="mobile-navigation" aria-label="Mobile navigation" className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-2">
              <Link href="/catalog" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                Catalog
              </Link>
              <div className="px-4 py-2">
                <p className="text-sm font-medium text-gray-900 mb-2">AI CAD Tools</p>
                <div className="ml-2 space-y-1">
                  <Link href="/cad-generator" className="block py-1 text-sm text-gray-700 flex items-center">
                    <svg className="w-3 h-3 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                    CAD Generator
                  </Link>
                  <Link href="/cad-analyzer" className="block py-1 text-sm text-gray-700 flex items-center">
                    <svg className="w-3 h-3 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    CAD Analyzer
                  </Link>
                  <Link href="/product-recommender" className="block py-1 text-sm text-gray-700 flex items-center">
                    <svg className="w-3 h-3 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Product Recommender
                  </Link>
                </div>
              </div>
              <Link href="/rfq" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                Request Quote
              </Link>
              
              {/* Mobile Account Button */}
              <div className="border-t border-gray-100 mt-2 pt-2">
                {loading ? (
                  <div className="px-4 py-2">
                    <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                ) : (
                  <Link 
                    href="/account"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {user ? (user.email?.split('@')[0] || 'Account') : 'Account'}
                  </Link>
                )}
              </div>
              
              {/* TARUMT Logo - Mobile */}
              <div className="flex items-center justify-center px-4 py-4 border-t border-gray-100 mt-2">
                <Image 
                  src="/images/tarumt-logo-767.png" 
                  alt="TARUMT" 
                  width={75}
                  height={24}
                  className="h-6 w-auto"
                />
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
