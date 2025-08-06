import React, { useState } from 'react';
import ProductImagePlaceholder from '@/components/ProductImagePlaceholder';
import { Product } from '@/types';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  product: Product;
  className?: string;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ 
  src, 
  alt, 
  product, 
  className = '' 
}) => {
  const [hasError, setHasError] = useState(false);
  
  if (hasError) {
    return <ProductImagePlaceholder product={product} className={className} />;
  }
  
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      onLoad={() => setHasError(false)}
    />
  );
};

export default ImageWithFallback;