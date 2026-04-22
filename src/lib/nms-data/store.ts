// =============================================================================
// Mesh Rider Fleet NMS — Global State Store (Zustand)
// Task ID: 2-a | Client-side navigation, selection, and filter state
// =============================================================================

import { create } from 'zustand';

export type NMSView =
  | 'fleet'
  | 'topology'
  | 'radio'
  | 'ota'
  | 'spectrum'
  | 'alerts'
  | 'audit'
  | 'access';

interface NMSState {
  // Navigation
  currentView: NMSView;
  sidebarCollapsed: boolean;

  // Selection
  selectedRadioId: number | null;

  // Tenant filter
  selectedTenant: string;

  // Filters
  siteFilter: string;
  stateFilter: string;
  searchQuery: string;

  // Actions — Navigation
  setView: (view: NMSView) => void;
  toggleSidebar: () => void;

  // Actions — Selection
  selectRadio: (id: number | null) => void;

  // Actions — Filters
  setTenant: (id: string) => void;
  setSiteFilter: (site: string) => void;
  setStateFilter: (state: string) => void;
  setSearchQuery: (query: string) => void;
}

export const useNMSStore = create<NMSState>((set) => ({
  // Initial state
  currentView: 'fleet',
  sidebarCollapsed: false,
  selectedRadioId: null,
  selectedTenant: 'all',
  siteFilter: 'all',
  stateFilter: 'all',
  searchQuery: '',

  // Navigation actions
  setView: (view) => set({ currentView: view }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  // Selection actions
  selectRadio: (id) => set({ selectedRadioId: id, currentView: id !== null ? 'radio' : 'fleet' }),

  // Filter actions
  setTenant: (id) => set({ selectedTenant: id }),
  setSiteFilter: (site) => set({ siteFilter: site }),
  setStateFilter: (state) => set({ stateFilter: state }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
