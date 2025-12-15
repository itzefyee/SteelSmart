/**
 * Zustand Stores Index
 * 
 * Central export point for all Zustand stores.
 * Import stores from here for consistency.
 * 
 * @example
 * ```tsx
 * import { useUIStore, useCADStore } from '@/stores';
 * ```
 */

export { useUIStore, selectTheme, selectSidebarOpen, selectToasts } from './ui.store';
export type { Theme, Toast } from './ui.store';

export { useCADStore, selectSelectedFormat, selectRecentAnalyses } from './cad.store';
export type { CADFormat, RecentAnalysis, RecentGeneration, ViewerPreferences, ExportSettings } from './cad.store';
