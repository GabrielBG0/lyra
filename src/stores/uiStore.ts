import { create } from 'zustand'

interface UIStore {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
  newSongModalOpen: boolean
  openNewSongModal: () => void
  closeNewSongModal: () => void
  snapshotModalOpen: boolean
  snapshotModalOnSubmit: ((note: string | null) => void) | null
  openSnapshotModal: (onSubmit: (note: string | null) => void) => void
  closeSnapshotModal: () => void
  shortcutsModalOpen: boolean
  openShortcutsModal: () => void
  closeShortcutsModal: () => void
  deleteSongModal: { path: string; title: string } | null
  openDeleteSongModal: (path: string, title: string) => void
  closeDeleteSongModal: () => void
  aboutModalOpen: boolean
  openAboutModal: () => void
  closeAboutModal: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  newSongModalOpen: false,
  openNewSongModal: () => set({ newSongModalOpen: true }),
  closeNewSongModal: () => set({ newSongModalOpen: false }),
  snapshotModalOpen: false,
  snapshotModalOnSubmit: null,
  openSnapshotModal: (onSubmit) => set({ snapshotModalOpen: true, snapshotModalOnSubmit: onSubmit }),
  closeSnapshotModal: () => set({ snapshotModalOpen: false, snapshotModalOnSubmit: null }),
  shortcutsModalOpen: false,
  openShortcutsModal: () => set({ shortcutsModalOpen: true }),
  closeShortcutsModal: () => set({ shortcutsModalOpen: false }),
  deleteSongModal: null,
  openDeleteSongModal: (path, title) => set({ deleteSongModal: { path, title } }),
  closeDeleteSongModal: () => set({ deleteSongModal: null }),
  aboutModalOpen: false,
  openAboutModal: () => set({ aboutModalOpen: true }),
  closeAboutModal: () => set({ aboutModalOpen: false }),
}))
