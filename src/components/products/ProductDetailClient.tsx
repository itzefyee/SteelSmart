'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/products/ProductCard';
import ProductRecommendations from '@/components/products/ProductRecommendations';
import ProductImagePlaceholder from '@/components/products/ProductImagePlaceholder';
import type { Product } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';

interface ProductDetailClientProps {
    product: Product;
    relatedProducts: Product[];
}

const ProductDetailClient: React.FC<ProductDetailClientProps> = ({
    product,
    relatedProducts
}) => {
    const [selectedImage, setSelectedImage] = useState(0);

    return (
        <main className="catalog-shell">
            {/* Background Patterns */}
            <div className="catalog-grid-pattern" aria-hidden="true"></div>
            <div className="catalog-wire-pattern" aria-hidden="true"></div>
            <div className="catalog-particle-layer" aria-hidden="true"></div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-slate-100">
                {/* Breadcrumb */}
                <nav className="mb-8">
                    <ol className="flex items-center space-x-2 text-sm text-blue-200">
                        <li>
                            <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        </li>
                        <li className="text-slate-400">/</li>
                        <li>
                            <Link href="/catalog" className="hover:text-white transition-colors">Catalog</Link>
                        </li>
                        <li className="text-slate-400">/</li>
                        <li className="text-white font-medium">{product.name}</li>
                    </ol>
                </nav>

                {/* Main Product Container with Liquid Glass */}
                <div className="catalog-glass-container p-8 mb-12 bg-white/95 text-slate-900 shadow-[0_35px_120px_rgba(15,23,42,0.45)]">
                    <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
                        {/* Product Images */}
                        <div className="space-y-4">
                            <div className="product-glass-card p-6">
                                <div className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/60">
                                    <ProductImagePlaceholder product={product} className="w-full h-full object-cover" />
                                </div>
                            </div>

                            {/* Image thumbnails */}
                            <div className="flex space-x-2">
                                {[...Array(3)].map((_, index) => (
                                    <button
                                        key={index}
                                        className={`w-20 h-20 rounded-lg border-2 transition-all backdrop-blur-sm ${selectedImage === index
                                            ? 'border-blue-400 bg-blue-500/20'
                                            : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                                            }`}
                                        onClick={() => setSelectedImage(index)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Product Information */}
                        <div className="relative z-10 space-y-6 text-slate-900 lg:sticky lg:top-6">
                            {/* Category Badge & Stock Status */}
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border border-blue-200 bg-blue-50 text-blue-700">
                                    {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                                </span>
                                <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
                                    <div className={`w-2.5 h-2.5 rounded-full mr-2 ${product.in_stock ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                                    <span className="text-sm text-slate-600">
                                        {product.in_stock ? 'In Stock' : 'Out of Stock'}
                                        {product.lead_time && ` • ${product.lead_time}`}
                                    </span>
                                </div>
                            </div>

                            {/* Product Name and Price */}
                            <div>
                                <h1 className="mb-2 text-4xl font-bold text-slate-900">{product.name}</h1>
                                <div className="text-4xl font-bold text-blue-700 mb-4">
                                    {formatPrice(product.price)}
                                </div>
                                <p className="text-base leading-relaxed text-slate-600">{product.description}</p>
                            </div>

                            {/* Key Specifications */}
                            <div className="product-glass-card p-6 bg-white/95 text-slate-900">
                                <h3 className="mb-4 text-lg font-semibold text-slate-900">Key Specifications</h3>
                                <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                                    {typeof product.specifications === 'object' && product.specifications !== null && 'dimensions' in product.specifications && (
                                        <div>
                                            <dt className="font-medium text-slate-500">Dimensions</dt>
                                            <dd className="font-semibold text-slate-900">{(product.specifications as any).dimensions}</dd>
                                        </div>
                                    )}
                                    {typeof product.specifications === 'object' && product.specifications !== null && 'weight' in product.specifications && (
                                        <div>
                                            <dt className="font-medium text-slate-500">Weight</dt>
                                            <dd className="font-semibold text-slate-900">{(product.specifications as any).weight}</dd>
                                        </div>
                                    )}
                                    {product.material && (
                                        <div>
                                            <dt className="font-medium text-slate-500">Material</dt>
                                            <dd className="font-semibold text-slate-900">{product.material}</dd>
                                        </div>
                                    )}
                                    {typeof product.specifications === 'object' && product.specifications !== null && 'loadCapacity' in product.specifications && (
                                        <div>
                                            <dt className="font-medium text-slate-500">Load Capacity</dt>
                                            <dd className="font-semibold text-slate-900">{(product.specifications as any).loadCapacity}</dd>
                                        </div>
                                    )}
                                    {typeof product.specifications === 'object' && product.specifications !== null && 'tolerance' in product.specifications && (
                                        <div>
                                            <dt className="font-medium text-slate-500">Tolerance</dt>
                                            <dd className="font-semibold text-slate-900">{(product.specifications as any).tolerance}</dd>
                                        </div>
                                    )}
                                    {typeof product.specifications === 'object' && product.specifications !== null && 'operatingTemp' in product.specifications && (
                                        <div>
                                            <dt className="font-medium text-slate-500">Operating Temperature</dt>
                                            <dd className="font-semibold text-slate-900">{(product.specifications as any).operatingTemp}</dd>
                                        </div>
                                    )}
                                </dl>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link href="/rfq" className="flex-1">
                                    <button className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30">
                                        Request Quote
                                    </button>
                                </Link>
                                <Link
                                    href={`/cad-generator?prompt=${encodeURIComponent(`Generate a technical drawing for ${product.name}. Material: ${product.material || 'steel'}. ${typeof product.specifications === 'object' && product.specifications !== null && 'dimensions' in product.specifications ? `Dimensions: ${(product.specifications as any).dimensions}` : ''}`)}`}
                                    className="flex-1"
                                >
                                    <button className="w-full flex items-center justify-center space-x-2 rounded-xl border-2 border-slate-200 bg-white/90 py-4 px-6 font-semibold text-slate-900 transition-all hover:border-blue-200 hover:bg-blue-50">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                                        </svg>
                                        <span>Generate Drawing</span>
                                    </button>
                                </Link>
                            </div>

                            {/* Contact Information */}
                            <div className="product-glass-card bg-white/95 p-6 text-slate-900">
                                <h4 className="mb-2 text-lg font-medium">Need Help?</h4>
                                <p className="mb-3 text-sm text-slate-600">
                                    Our technical experts are here to help you find the right solution.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-2 text-sm">
                                    <a href="mailto:info@metalyze.com" className="text-blue-600 transition-colors hover:text-blue-500">
                                        info@metalyze.com
                                    </a>
                                    <span className="hidden text-slate-400 sm:inline">•</span>
                                    <a href="tel:+1-555-0123" className="text-blue-600 transition-colors hover:text-blue-500">
                                        +1 (555) 012-3456
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Technical Details */}
                <div className="catalog-glass-container p-8 mb-12 bg-white/95 text-slate-900">
                    <h2 className="mb-6 text-3xl font-bold text-slate-900">Technical Details</h2>
                    <div className="prose max-w-none">
                        <p className="text-lg leading-relaxed text-slate-600">
                            {product.technical_details}
                        </p>
                    </div>

                    {/* Compatibility */}
                    {product.compatible_with && product.compatible_with.length > 0 && (
                        <div className="mt-8 border-t border-slate-200 pt-8">
                            <h3 className="mb-4 text-xl font-semibold text-slate-900">Compatible Products</h3>
                            <div className="flex flex-wrap gap-2">
                                {product.compatible_with.map((compatibleId) => (
                                    <span
                                        key={compatibleId}
                                        className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700"
                                    >
                                        {compatibleId}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* AI Recommendations */}
                <div className="mb-12">
                    <ProductRecommendations productId={product.id} />
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div>
                        <h2 className="text-3xl font-semibold text-white mb-8">Similar Products</h2>
                        <div className="catalog-glass-container p-6 bg-white/95">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {relatedProducts.map((relatedProduct) => (
                                    <ProductCard key={relatedProduct.id} product={relatedProduct} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
};

export default ProductDetailClient;
