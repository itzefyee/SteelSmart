/**
 * CAD State Store (Zustand)
 * 
 * Manages CAD-specific UI state with localStorage persistence.
 * This store handles CAD format preferences, recent analyses,
 * and generation history that should persist across sessions.
 * 
 * State Categories:
 * - Format selection (STEP, STL, OBJ, etc.)
 * - Recent analyses (quick access)
 * - Generation history (quick access)
 * - CAD viewer preferences
 * - Export settings
 * 
 * Persistence:
 * - Automatically syncs to localStorage
 * - Survives page refreshes
 * - Per-user preferences
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Supported CAD export formats
 */
export type CADFormat = 'step' | 'stl' | 'obj' | 'dxf' | 'gltf' | 'glb';

/**
 * Recent analysis item (lightweight reference)
 */
export interface RecentAnalysis {
  id: string;
  fileName: string;
  timestamp: number;
  confidence: number;
  specs: {
    material?: string;
    dimensions?: string;
    componentType?: string;
  };
}

/**
 * Recent generation item (lightweight reference)
 */
export interface RecentGeneration {
  id: string;
  prompt: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  formats: CADFormat[];
}

/**
 * CAD viewer preferences
 */
export interface ViewerPreferences {
  showGrid: boolean;
  showAxes: boolean;
  backgroundColor: string;
  wireframeMode: boolean;
  autoRotate: boolean;
}

/**
 * Export settings
 */
export interface ExportSettings {
  defaultFormat: CADFormat;
  includeMetadata: boolean;
  optimizeForSize: boolean;
  unit: 'mm' | 'cm' | 'in';
}

/**
 * CAD State Interface
 */
interface CADState {
  // Format Selection
  selectedFormat: CADFormat;
  setSelectedFormat: (format: CADFormat) => void;
  
  // Recent Analyses (max 20)
  recentAnalyses: RecentAnalysis[];
  addRecentAnalysis: (analysis: RecentAnalysis) => void;
  removeRecentAnalysis: (id: string) => void;
  clearRecentAnalyses: () => void;
  
  // Recent Generations (max 20)
  recentGenerations: RecentGeneration[];
  addRecentGeneration: (generation: RecentGeneration) => void;
  updateGenerationStatus: (id: string, status: RecentGeneration['status']) => void;
  removeRecentGeneration: (id: string) => void;
  clearRecentGenerations: () => void;
  
  // Viewer Preferences
  viewerPreferences: ViewerPreferences;
  updateViewerPreferences: (preferences: Partial<ViewerPreferences>) => void;
  resetViewerPreferences: () => void;
  
  // Export Settings
  exportSettings: ExportSettings;
  updateExportSettings: (settings: Partial<ExportSettings>) => void;
  resetExportSettings: () => void;
  
  // Active CAD Model (transient, not persisted)
  activeModelId: string | null;
  setActiveModelId: (id: string | null) => void;
}

/**
 * Default viewer preferences
 */
const defaultViewerPreferences: ViewerPreferences = {
  showGrid: true,
  showAxes: true,
  backgroundColor: '#f8fafc',
  wireframeMode: false,
  autoRotate: false,
};

/**
 * Default export settings
 */
const defaultExportSettings: ExportSettings = {
  defaultFormat: 'step',
  includeMetadata: true,
  optimizeForSize: false,
  unit: 'mm',
};

/**
 * CAD Store
 * 
 * Manages all CAD-specific UI state with localStorage persistence.
 * 
 * @example
 * ```tsx
 * function CADFormatSelector() {
 *   const { selectedFormat, setSelectedFormat } = useCADStore();
 *   
 *   return (
 *     <select 
 *       value={selectedFormat} 
 *       onChange={(e) => setSelectedFormat(e.target.value as CADFormat)}
 *     >
 *       <option value="step">STEP</option>
 *       <option value="stl">STL</option>
 *       <option value="obj">OBJ</option>
 *     </select>
 *   );
 * }
 * ```
 */
export const useCADStore = create<CADState>()(
  persist(
    (set) => ({
      // Format Selection
      selectedFormat: 'step',
      setSelectedFormat: (format) => set({ selectedFormat: format }),
      
      // Recent Analyses
      recentAnalyses: [],
      addRecentAnalysis: (analysis) => {
        set((state) => {
          // Remove duplicates and add to front
          const filtered = state.recentAnalyses.filter((a) => a.id !== analysis.id);
          // Keep only last 20 analyses
          return {
            recentAnalyses: [analysis, ...filtered].slice(0, 20),
          };
        });
      },
      removeRecentAnalysis: (id) => {
        set((state) => ({
          recentAnalyses: state.recentAnalyses.filter((a) => a.id !== id),
        }));
      },
      clearRecentAnalyses: () => set({ recentAnalyses: [] }),
      
      // Recent Generations
      recentGenerations: [],
      addRecentGeneration: (generation) => {
        set((state) => {
          // Remove duplicates and add to front
          const filtered = state.recentGenerations.filter((g) => g.id !== generation.id);
          // Keep only last 20 generations
          return {
            recentGenerations: [generation, ...filtered].slice(0, 20),
          };
        });
      },
      updateGenerationStatus: (id, status) => {
        set((state) => ({
          recentGenerations: state.recentGenerations.map((g) =>
            g.id === id ? { ...g, status } : g
          ),
        }));
      },
      removeRecentGeneration: (id) => {
        set((state) => ({
          recentGenerations: state.recentGenerations.filter((g) => g.id !== id),
        }));
      },
      clearRecentGenerations: () => set({ recentGenerations: [] }),
      
      // Viewer Preferences
      viewerPreferences: defaultViewerPreferences,
      updateViewerPreferences: (preferences) => {
        set((state) => ({
          viewerPreferences: { ...state.viewerPreferences, ...preferences },
        }));
      },
      resetViewerPreferences: () => set({ viewerPreferences: defaultViewerPreferences }),
      
      // Export Settings
      exportSettings: defaultExportSettings,
      updateExportSettings: (settings) => {
        set((state) => ({
          exportSettings: { ...state.exportSettings, ...settings },
        }));
      },
      resetExportSettings: () => set({ exportSettings: defaultExportSettings }),
      
      // Active Model (not persisted)
      activeModelId: null,
      setActiveModelId: (id) => set({ activeModelId: id }),
    }),
    {
      name: 'metalyze-cad-storage',
      storage: createJSONStorage(() => localStorage),
      // Don't persist activeModelId (it's transient)
      partialize: (state) => ({
        selectedFormat: state.selectedFormat,
        recentAnalyses: state.recentAnalyses,
        recentGenerations: state.recentGenerations,
        viewerPreferences: state.viewerPreferences,
        exportSettings: state.exportSettings,
      }),
    }
  )
);

/**
 * Selectors for optimized re-renders
 * 
 * Use these to subscribe to specific parts of the store
 * instead of the entire store.
 * 
 * @example
 * ```tsx
 * function FormatBadge() {
 *   // Only re-renders when selectedFormat changes
 *   const format = useCADStore(selectSelectedFormat);
 *   
 *   return <span className="badge">{format.toUpperCase()}</span>;
 * }
 * ```
 */
export const selectSelectedFormat = (state: CADState) => state.selectedFormat;
export const selectSetSelectedFormat = (state: CADState) => state.setSelectedFormat;
export const selectRecentAnalyses = (state: CADState) => state.recentAnalyses;
export const selectAddRecentAnalysis = (state: CADState) => state.addRecentAnalysis;
export const selectRecentGenerations = (state: CADState) => state.recentGenerations;
export const selectAddRecentGeneration = (state: CADState) => state.addRecentGeneration;
export const selectViewerPreferences = (state: CADState) => state.viewerPreferences;
export const selectUpdateViewerPreferences = (state: CADState) => state.updateViewerPreferences;
export const selectExportSettings = (state: CADState) => state.exportSettings;
export const selectUpdateExportSettings = (state: CADState) => state.updateExportSettings;
export const selectActiveModelId = (state: CADState) => state.activeModelId;
export const selectSetActiveModelId = (state: CADState) => state.setActiveModelId;
