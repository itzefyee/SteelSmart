// Custom hooks for SteelSmart application
export { useFileUpload } from './useFileUpload';
export { useCADGeneration } from './useCADGeneration';
export { 
  useAnalyzeDrawing, 
  useAnalysisHistory, 
  useAnalysisById, 
  useDeleteAnalysis,
  prefetchAnalysisHistory 
} from './useCADAnalysis';
export { useCategories } from './useCategories';
export { useProducts, useProduct } from './useProducts';

export type { FileUploadOptions, FileUploadState } from './useFileUpload';
export type { UseCADGenerationOptions } from './useCADGeneration';
export type { UseCategoriesState } from './useCategories';
export type { UseProductsOptions, ProductFilters } from './useProducts';
