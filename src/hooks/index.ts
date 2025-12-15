// Re-export all hooks for easier importing
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


// Admin hooks
export { useAdminProducts, useAdminProduct, useCreateAdminProduct, useUpdateAdminProduct, useDeleteAdminProduct } from './admin/useAdminProducts';
export { useAdminDashboard } from './admin/useAdminDashboard';