import { create } from "zustand";

interface UIStore {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  historyBarExpanded: boolean;
  toggleHistoryBar: () => void;
  setHistoryBarExpanded: (v: boolean) => void;
  nudgeDismissed: boolean;
  setNudgeDismissed: (v: boolean) => void;
  selectNameOnFocus: boolean;
  setSelectNameOnFocus: (v: boolean) => void;
  newSongModalOpen: boolean;
  openNewSongModal: () => void;
  closeNewSongModal: () => void;
  snapshotModalOpen: boolean;
  snapshotModalOnSubmit: ((note: string | null) => void) | null;
  openSnapshotModal: (onSubmit: (note: string | null) => void) => void;
  closeSnapshotModal: () => void;
  shortcutsModalOpen: boolean;
  openShortcutsModal: () => void;
  closeShortcutsModal: () => void;
  deleteSongModal: { path: string; title: string } | null;
  openDeleteSongModal: (path: string, title: string) => void;
  closeDeleteSongModal: () => void;
  aboutModalOpen: boolean;
  openAboutModal: () => void;
  closeAboutModal: () => void;
  vaultOptionsModalOpen: boolean;
  openVaultOptionsModal: () => void;
  closeVaultOptionsModal: () => void;
  preferencesModalOpen: boolean;
  openPreferencesModal: () => void;
  closePreferencesModal: () => void;
  findPanelOpen: boolean;
  findReplaceMode: boolean;
  openFindPanel: (withReplace?: boolean) => void;
  closeFindPanel: () => void;
  toggleFindReplace: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  historyBarExpanded: false,
  toggleHistoryBar: () =>
    set((s) => ({ historyBarExpanded: !s.historyBarExpanded })),
  setHistoryBarExpanded: (v) => set({ historyBarExpanded: v }),
  nudgeDismissed: false,
  setNudgeDismissed: (v) => set({ nudgeDismissed: v }),
  selectNameOnFocus: true,
  setSelectNameOnFocus: (v) => set({ selectNameOnFocus: v }),
  newSongModalOpen: false,
  openNewSongModal: () => set({ newSongModalOpen: true }),
  closeNewSongModal: () => set({ newSongModalOpen: false }),
  snapshotModalOpen: false,
  snapshotModalOnSubmit: null,
  openSnapshotModal: (onSubmit) =>
    set({ snapshotModalOpen: true, snapshotModalOnSubmit: onSubmit }),
  closeSnapshotModal: () =>
    set({ snapshotModalOpen: false, snapshotModalOnSubmit: null }),
  shortcutsModalOpen: false,
  openShortcutsModal: () => set({ shortcutsModalOpen: true }),
  closeShortcutsModal: () => set({ shortcutsModalOpen: false }),
  deleteSongModal: null,
  openDeleteSongModal: (path, title) =>
    set({ deleteSongModal: { path, title } }),
  closeDeleteSongModal: () => set({ deleteSongModal: null }),
  aboutModalOpen: false,
  openAboutModal: () => set({ aboutModalOpen: true }),
  closeAboutModal: () => set({ aboutModalOpen: false }),
  vaultOptionsModalOpen: false,
  openVaultOptionsModal: () => set({ vaultOptionsModalOpen: true }),
  closeVaultOptionsModal: () => set({ vaultOptionsModalOpen: false }),
  preferencesModalOpen: false,
  openPreferencesModal: () => set({ preferencesModalOpen: true }),
  closePreferencesModal: () => set({ preferencesModalOpen: false }),
  findPanelOpen: false,
  findReplaceMode: false,
  openFindPanel: (withReplace = false) =>
    set({ findPanelOpen: true, findReplaceMode: withReplace }),
  closeFindPanel: () => set({ findPanelOpen: false, findReplaceMode: false }),
  toggleFindReplace: () =>
    set((s) => ({ findReplaceMode: !s.findReplaceMode, findPanelOpen: true })),
}));
