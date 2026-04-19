import { create } from 'zustand'

interface UIStore {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
  newSongModalOpen: boolean
  openNewSongModal: () => void
  closeNewSongModal: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  newSongModalOpen: false,
  openNewSongModal: () => set({ newSongModalOpen: true }),
  closeNewSongModal: () => set({ newSongModalOpen: false }),
}))
