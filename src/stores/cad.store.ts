import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

/**
 * CAD Store Interface
 * Manages client-side state for CAD generator preferences and history
 */
interface CADStore {
  // State
  selectedFormat: 'step' | 'stl' | 'obj' | 'gltf';
  selectedUnits: 'mm' | 'cm' | 'm' | 'in' | 'ft';
  selectedCategory: string;
  recentPrompts: string[];

  // Actions
  setFormat: (format: CADStore['selectedFormat']) => void;
  setUnits: (units: CADStore['selectedUnits']) => void;
  setCategory: (category: string) => void;
  addRecentPrompt: (prompt: string) => void;
  clearRecentPrompts: () => void;
}

/**
 * CAD Zustand Store
 * 
 * Persists user preferences for CAD generation including:
 * - Selected output format (STEP, STL, OBJ, GLTF)
 * - Selected units (mm, cm, m, in, ft)
 * - Recent prompts (up to 10 items, deduplicated)
 * 
 * Persistence Strategy:
 * - selectedFormat: Persisted to localStorage
 * - selectedUnits: Persisted to localStorage
 * - recentPrompts: Persisted to localStorage
 * - selectedCategory: Session-only (not persisted)
 */
export const useCADStore = create<CADStore>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        selectedFormat: 'step',
        selectedUnits: 'mm',
        selectedCategory: '',
        recentPrompts: [],

        // Actions
        setFormat: (format) => set({ selectedFormat: format }),

        setUnits: (units) => set({ selectedUnits: units }),

        setCategory: (category) => set({ selectedCategory: category }),

        /**
         * Add a prompt to recent prompts list
         * - Deduplicates: removes existing occurrence before adding to front
         * - Limits to 10 items maximum
         * - Most recent prompt appears first
         */
        addRecentPrompt: (prompt) =>
          set((state) => {
            // Remove the prompt if it already exists (deduplicate)
            const filtered = state.recentPrompts.filter((p) => p !== prompt);
            
            // Add to front and limit to 10 items
            const updated = [prompt, ...filtered].slice(0, 10);
            
            return { recentPrompts: updated };
          }),

        clearRecentPrompts: () => set({ recentPrompts: [] }),
      }),
      {
        name: 'cad-store',
        // Only persist selectedFormat, selectedUnits, and recentPrompts
        // selectedCategory is session-only
        partialize: (state) => ({
          selectedFormat: state.selectedFormat,
          selectedUnits: state.selectedUnits,
          recentPrompts: state.recentPrompts,
        }),
      }
    ),
    {
      name: 'CADStore',
    }
  )
);
