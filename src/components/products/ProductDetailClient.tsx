'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
    // Track selected image for each related product by product ID
    const [relatedSelectedImages, setRelatedSelectedImages] = useState<Record<string, number>>({});
    
    // Get all images or use a placeholder
    const images = product.images && product.images.length > 0 ? product.images : [null];
    
    const handlePreviousImage = () => {
        setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };
    
    const handleNextImage = () => {
        setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    return (
        <main className="flex-1 relative">
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-20 text-slate-100">
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
                        {/* Product Images Gallery */}
                        <div className="space-y-4">
                            {/* Main Image Display */}
                            <div className="product-glass-card p-4">
                                <div className="relative group">
                                    {/* Reduced aspect ratio for smaller main image */}
                                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
                                        {images[selectedImage] ? (
                                            <Image 
                                                src={images[selectedImage]} 
                                                alt={`${product.name} - View ${selectedImage + 1}`}
                                                fill
                                                className="object-contain"
                                                sizes="(max-width: 768px) 100vw, 50vw"
                                            />
                                        ) : (
                                            <ProductImagePlaceholder product={product} className="w-full h-full" />
                                        )}
                                    </div>
                                    
                                    {/* Navigation Arrows - Only show if multiple images */}
                                    {images.length > 1 && (
                                        <>
                                            <button
                                                onClick={handlePreviousImage}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-800 p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                                                aria-label="Previous image"
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={handleNextImage}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-800 p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                                                aria-label="Next image"
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </>
                                    )}
                                    
                                    {/* Image Counter */}
                                    {images.length > 1 && (
                                        <div className="absolute bottom-3 right-3 bg-slate-900/75 text-white px-3 py-1 rounded-full text-sm font-medium">
                                            {selectedImage + 1} / {images.length}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Image Thumbnails */}
                            {images.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                                    {images.map((image, index) => (
                                        <button
                                            key={index}
                                            className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 transition-all overflow-hidden ${
                                                selectedImage === index
                                                    ? 'border-blue-500 ring-2 ring-blue-200'
                                                    : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                            onClick={() => setSelectedImage(index)}
                                        >
                                            <div className="relative w-full h-full bg-gradient-to-br from-slate-50 to-slate-100">
                                                {image ? (
                                                    <Image 
                                                        src={image} 
                                                        alt={`Thumbnail ${index + 1}`}
                                                        fill
                                                        className="object-contain"
                                                        sizes="80px"
                                                    />
                                                ) : (
                                                    <ProductImagePlaceholder product={product} className="w-full h-full" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
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
                                <h1 className="mb-2 text-4xl font-bold text-white">{product.name}</h1>
                                <div className="text-4xl font-bold text-sky-100 mb-4">
                                    {formatPrice(product.price)}
                                </div>
                                <p className="text-base leading-relaxed text-slate-200">{product.description}</p>
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
                                <button 
                                    onClick={() => {
                                        sessionStorage.setItem('productForRFQ', JSON.stringify({
                                            productName: product.name,
                                            productId: product.id,
                                            material: product.material,
                                            specifications: product.specifications,
                                            price: product.price,
                                            category: product.category,
                                            description: product.description
                                        }));
                                        window.location.href = '/rfq?fromProduct=true';
                                    }}
                                    className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-400 to-blue-500 text-white font-semibold rounded-xl hover:from-blue-500 hover:to-blue-600 transition-all shadow-lg shadow-blue-400/30"
                                >
                                    Request Quote
                                </button>
                                <Link
                                    href={`/cad-generator?prompt=${encodeURIComponent(`Generate a technical drawing for ${product.name}. Material: ${product.material || 'steel'}. ${typeof product.specifications === 'object' && product.specifications !== null && 'dimensions' in product.specifications ? `Dimensions: ${(product.specifications as any).dimensions}` : ''}`)}`}
                                    className="flex-1"
                                >
                                    <button className="w-full flex items-center justify-center space-x-2 rounded-xl border-2 border-slate-200 bg-white/90 py-4 px-6 font-semibold text-slate-900 transition-all hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
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
                                    <a href="mailto:steelsmart.cad@gmail.com" className="text-blue-600 transition-colors hover:text-blue-500">
                                        steelsmart.cad@gmail.com
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
                    <h2 className="mb-3 text-3xl font-bold text-white">Technical Details</h2>
                    <div className="prose max-w-none">
                        <p className="text-lg leading-relaxed text-slate-200">
                            {product.technical_details}
                        </p>
                    </div>

                    {/* Compatibility */}
                    {product.compatible_with && product.compatible_with.length > 0 && (
                        <div className="mt-6 border-t border-slate-200 pt-6">
                            <h3 className="mb-4 text-xl font-semibold text-white">Compatible Products</h3>
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
            </div>
        </main>
    );
};

export default ProductDetailClient;
