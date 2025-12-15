// Re-export all hooks for easier importing
export { useDebounce } from './useDebounce';
export { useProducts, useProduct } from './useProducts';
export { useCategories } from './useCategories';
export { useFileUpload } from './useFileUpload';
export { useCADAnalysis } from './useCADAnalysis';
export { useCADGeneration } from './useCADGeneration';

// Admin hooks
export { useAdminProducts, useAdminProduct, useCreateAdminProduct, useUpdateAdminProduct, useDeleteAdminProduct } from './admin/useAdminProducts';
export { useAdminDashboard } from './admin/useAdminDashboard';