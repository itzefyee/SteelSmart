/**
 * UI State Store (Zustand)
 * 
 * Manages client-side UI state with localStorage persistence.
 * This store handles UI preferences and transient state that doesn't
 * belong in React Query (which is for server state).
 * 
 * State Categories:
 * - Theme preferences
 * - Sidebar/navigation state
 * - Modal visibility
 * - Toast notifications
 * - User preferences
 * 
 * Persistence:
 * - Automatically syncs to localStorage
 * - Survives page refreshes
 * - Per-user preferences
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Theme options
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Toast notification
 */
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

/**
 * UI State Interface
 */
interface UIState {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
  
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  
  // Modals
  activeModal: string | null;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  
  // Toasts
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // User Preferences
  preferences: {
    compactMode: boolean;
    showTutorials: boolean;
    autoSaveEnabled: boolean;
  };
  updatePreferences: (preferences: Partial<UIState['preferences']>) => void;
  
  // Recent Searches
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

/**
 * UI Store
 * 
 * Manages all client-side UI state with localStorage persistence.
 * 
 * @example
 * ```tsx
 * function Header() {
 *   const { theme, setTheme, sidebarOpen, toggleSidebar } = useUIStore();
 *   
 *   return (
 *     <header>
 *       <button onClick={toggleSidebar}>
 *         {sidebarOpen ? 'Close' : 'Open'} Menu
 *       </button>
 *       <select value={theme} onChange={(e) => setTheme(e.target.value)}>
 *         <option value="light">Light</option>
 *         <option value="dark">Dark</option>
 *         <option value="system">System</option>
 *       </select>
 *     </header>
 *   );
 * }
 * ```
 */
export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Theme
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      
      // Sidebar
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      // Modals
      activeModal: null,
      openModal: (modalId) => set({ activeModal: modalId }),
      closeModal: () => set({ activeModal: null }),
      
      // Toasts (not persisted)
      toasts: [],
      addToast: (toast) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        const newToast: Toast = { ...toast, id };
        
        set((state) => ({
          toasts: [...state.toasts, newToast],
        }));
        
        // Auto-remove after duration (default 5 seconds)
        const duration = toast.duration ?? 5000;
        if (duration > 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, duration);
        }
      },
      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      },
      clearToasts: () => set({ toasts: [] }),
      
      // User Preferences
      preferences: {
        compactMode: false,
        showTutorials: true,
        autoSaveEnabled: true,
      },
      updatePreferences: (newPreferences) => {
        set((state) => ({
          preferences: { ...state.preferences, ...newPreferences },
        }));
      },
      
      // Recent Searches
      recentSearches: [],
      addRecentSearch: (query) => {
        const trimmed = query.trim();
        if (!trimmed) return;
        
        set((state) => {
          // Remove duplicates and add to front
          const filtered = state.recentSearches.filter((s) => s !== trimmed);
          // Keep only last 10 searches
          return {
            recentSearches: [trimmed, ...filtered].slice(0, 10),
          };
        });
      },
      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: 'metalyze-ui-storage',
      storage: createJSONStorage(() => localStorage),
      // Don't persist toasts (they're transient)
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        preferences: state.preferences,
        recentSearches: state.recentSearches,
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
 * function ThemeToggle() {
 *   // Only re-renders when theme changes
 *   const theme = useUIStore(selectTheme);
 *   const setTheme = useUIStore(selectSetTheme);
 *   
 *   return (
 *     <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
 *       Toggle Theme
 *     </button>
 *   );
 * }
 * ```
 */
export const selectTheme = (state: UIState) => state.theme;
export const selectSetTheme = (state: UIState) => state.setTheme;
export const selectSidebarOpen = (state: UIState) => state.sidebarOpen;
export const selectToggleSidebar = (state: UIState) => state.toggleSidebar;
export const selectActiveModal = (state: UIState) => state.activeModal;
export const selectOpenModal = (state: UIState) => state.openModal;
export const selectCloseModal = (state: UIState) => state.closeModal;
export const selectToasts = (state: UIState) => state.toasts;
export const selectAddToast = (state: UIState) => state.addToast;
export const selectPreferences = (state: UIState) => state.preferences;
export const selectRecentSearches = (state: UIState) => state.recentSearches;
