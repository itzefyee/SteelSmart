// TypeScript type definitions for SteelSmart AI Marketplace

export interface Product {
  id: string;
  name: string;
  category: 'robotic' | 'structural' | 'fasteners' | 'custom';
  material: string;
  specifications: {
    dimensions: string;
    weight: string;
    loadCapacity?: string;
    tolerance?: string;
    operatingTemp?: string;
  };
  price: number;
  images: string[];
  description: string;
  technicalDetails: string;
  compatibleWith: string[]; // Product IDs for recommendations
  inStock: boolean;
  leadTime: string;
}

export interface DrawingAnalysis {
  extractedSpecs: {
    dimensions?: string;
    material?: string;
    loadRequirements?: string;
    componentType?: string;
    tolerance?: string;
  };
  recommendedProducts: Product[];
  totalRecommendations: number; // Total number of products found before limiting
  confidence: number;
  reasoning: string;
  analysisId: string;
}

export interface RFQFormData {
  contactInfo: {
    name: string;
    email: string;
    company: string;
    phone?: string;
  };
  requirements: {
    projectDescription: string;
    quantity: number;
    material?: string;
    specifications: string;
    deadline: string;
    budget?: string;
  };
  files: File[];
}

export interface FilterOptions {
  categories: string[];
  materials: string[];
  priceRange: [number, number];
  inStockOnly: boolean;
  searchQuery: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface FileUploadState {
  file: File | null;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface RecommendationScore {
  productId: string;
  score: number;
  reasoning: string;
  matchedSpecs: string[];
}

// Form validation types
export interface ValidationErrors {
  [key: string]: string | undefined;
}

export interface FormField {
  name: string;
  value: string;
  error?: string;
  touched?: boolean;
}

// Component props interfaces
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface InputProps {
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'password' | 'textarea';
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}