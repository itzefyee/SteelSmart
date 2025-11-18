'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/products/ProductCard';
import ProductRecommendations from '@/components/products/ProductRecommendations';
import Button from '@/components/ui/Button';
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

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                <div className="catalog-glass-container p-8 mb-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
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
                        <div className="space-y-6 relative z-10">
                            {/* Category Badge & Stock Status */}
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-400/15 text-blue-100 border border-blue-300/40">
                                    {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                                </span>
                                <div className="flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10">
                                    <div className={`w-2.5 h-2.5 rounded-full mr-2 ${product.in_stock ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                                    <span className="text-sm text-slate-200">
                                        {product.in_stock ? 'In Stock' : 'Out of Stock'}
                                        {product.lead_time && ` • ${product.lead_time}`}
                                    </span>
                                </div>
                            </div>

                            {/* Product Name and Price */}
                            <div>
                                <h1 className="text-4xl font-bold text-white mb-4">{product.name}</h1>
                                <div className="text-5xl font-bold text-blue-300 mb-3">
                                    {formatPrice(product.price)}
                                </div>
                                <p className="text-lg text-slate-200 leading-relaxed">{product.description}</p>
                            </div>

                            {/* Key Specifications */}
                            <div className="product-glass-card p-6">
                                <h3 className="font-semibold text-white text-lg mb-4">Key Specifications</h3>
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                    {typeof product.specifications === 'object' && product.specifications !== null && 'dimensions' in product.specifications && (
                                        <div>
                                            <dt className="font-medium text-slate-300">Dimensions</dt>
                                            <dd className="text-white font-semibold">{(product.specifications as any).dimensions}</dd>
                                        </div>
                                    )}
                                    {typeof product.specifications === 'object' && product.specifications !== null && 'weight' in product.specifications && (
                                        <div>
                                            <dt className="font-medium text-slate-300">Weight</dt>
                                            <dd className="text-white font-semibold">{(product.specifications as any).weight}</dd>
                                        </div>
                                    )}
                                    {product.material && (
                                        <div>
                                            <dt className="font-medium text-slate-300">Material</dt>
                                            <dd className="text-white font-semibold">{product.material}</dd>
                                        </div>
                                    )}
                                    {typeof product.specifications === 'object' && product.specifications !== null && 'loadCapacity' in product.specifications && (
                                        <div>
                                            <dt className="font-medium text-slate-300">Load Capacity</dt>
                                            <dd className="text-white font-semibold">{(product.specifications as any).loadCapacity}</dd>
                                        </div>
                                    )}
                                    {typeof product.specifications === 'object' && product.specifications !== null && 'tolerance' in product.specifications && (
                                        <div>
                                            <dt className="font-medium text-slate-300">Tolerance</dt>
                                            <dd className="text-white font-semibold">{(product.specifications as any).tolerance}</dd>
                                        </div>
                                    )}
                                    {typeof product.specifications === 'object' && product.specifications !== null && 'operatingTemp' in product.specifications && (
                                        <div>
                                            <dt className="font-medium text-slate-300">Operating Temperature</dt>
                                            <dd className="text-white font-semibold">{(product.specifications as any).operatingTemp}</dd>
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
                                    <button className="w-full py-4 px-6 border-2 border-white/20 text-white font-semibold rounded-xl hover:bg-white/10 transition-all backdrop-blur-sm flex items-center justify-center space-x-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                                        </svg>
                                        <span>Generate Drawing</span>
                                    </button>
                                </Link>
                            </div>

                            {/* Contact Information */}
                            <div className="product-glass-card p-6">
                                <h4 className="font-medium text-white text-lg mb-2">Need Help?</h4>
                                <p className="text-slate-200 text-sm mb-3">
                                    Our technical experts are here to help you find the right solution.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-2 text-sm">
                                    <a href="mailto:info@metalyze.com" className="text-blue-300 hover:text-blue-200 transition-colors">
                                        info@metalyze.com
                                    </a>
                                    <span className="hidden sm:inline text-slate-400">•</span>
                                    <a href="tel:+1-555-0123" className="text-blue-300 hover:text-blue-200 transition-colors">
                                        +1 (555) 012-3456
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Technical Details */}
                <div className="catalog-glass-container p-8 mb-12">
                    <h2 className="text-3xl font-bold text-white mb-6">Technical Details</h2>
                    <div className="prose max-w-none">
                        <p className="text-slate-200 text-lg leading-relaxed">
                            {product.technical_details}
                        </p>
                    </div>

                    {/* Compatibility */}
                    {product.compatible_with && product.compatible_with.length > 0 && (
                        <div className="mt-8 pt-8 border-t border-white/10">
                            <h3 className="text-xl font-semibold text-white mb-4">Compatible Products</h3>
                            <div className="flex flex-wrap gap-2">
                                {product.compatible_with.map((compatibleId) => (
                                    <span
                                        key={compatibleId}
                                        className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-blue-500/10 text-blue-100 border border-blue-300/30"
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
                        <div className="catalog-glass-container p-6">
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
