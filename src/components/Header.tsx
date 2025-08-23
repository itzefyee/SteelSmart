'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img src="/images/logo.svg" alt="SteelSmart" className="h-10 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/catalog" className="text-gray-700 hover:text-primary transition-colors">
              Catalog
            </Link>
            <div className="relative group">
              <button className="text-gray-700 hover:text-primary transition-colors flex items-center">
                Categories
                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  <Link href="/catalog?category=robotic" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Robotic Components
                  </Link>
                  <Link href="/catalog?category=structural" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Structural Steel
                  </Link>
                  <Link href="/catalog?category=fasteners" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Fasteners
                  </Link>
                  <Link href="/catalog?category=custom" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Custom Parts
                  </Link>
                </div>
              </div>
            </div>
            <Link href="/cad-analyzer" className="text-gray-700 hover:text-primary transition-colors">
              CAD Analyzer
            </Link>
            <Link href="/rfq" className="text-gray-700 hover:text-primary transition-colors">
              Request Quote
            </Link>
            <div className="flex items-center gap-3">
              <img
                src="/images/tarumt-logo-767.png"
                alt="TARUMT Logo"
                className="h-8 w-auto"
              />
            </div>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-primary focus:outline-none"
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
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-2">
              <Link href="/catalog" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                Catalog
              </Link>
              <div className="px-4 py-2">
                <p className="text-sm font-medium text-gray-900 mb-2">Categories</p>
                <div className="ml-2 space-y-1">
                  <Link href="/catalog?category=robotic" className="block py-1 text-sm text-gray-700">
                    Robotic Components
                  </Link>
                  <Link href="/catalog?category=structural" className="block py-1 text-sm text-gray-700">
                    Structural Steel
                  </Link>
                  <Link href="/catalog?category=fasteners" className="block py-1 text-sm text-gray-700">
                    Fasteners
                  </Link>
                  <Link href="/catalog?category=custom" className="block py-1 text-sm text-gray-700">
                    Custom Parts
                  </Link>
                </div>
              </div>
              <Link href="/cad-analyzer" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                CAD Analyzer
              </Link>
              <Link href="/rfq" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                Request Quote
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;