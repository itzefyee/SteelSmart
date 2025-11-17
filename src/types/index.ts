// TypeScript type definitions for Metalyze AI Marketplace

// Import and re-export Product type from Supabase for consistency
import type { Product as SupabaseProduct } from '@/lib/supabase';
export type Product = SupabaseProduct;

// Legacy Product interface for backward compatibility
export interface LegacyProduct {
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
  recommendedProducts: Product[]; // Using Supabase Product type
  totalRecommendations: number; // Total number of products found before limiting
  confidence: number;
  reasoning: string;
  analysisId: string;
  alternativeSuggestions?: {
    alternatives: Array<{
      name: string;
      description: string;
      category: string;
      material?: string;
      specifications: {
        dimensions?: string;
        loadCapacity?: string;
        standards?: string[];
        partNumber?: string;
      };
      source: string;
      confidence: number;
      reasoning: string;
      supplierInfo?: {
        suggestedSuppliers: string[];
        estimatedPrice?: string;
        leadTime?: string;
      };
      standards?: Array<{
        code: string;
        name: string;
        section?: string;
      }>;
    }>;
    reasoning: string;
    suggestedAction: string;
    estimatedCost?: string;
    leadTime?: string;
  };
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

export interface UserProfile {
  id: string;
  company: string | null;
  phone: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserMetadata {
  company?: string;
  phone?: string;
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