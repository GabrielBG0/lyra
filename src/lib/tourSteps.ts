import { useUIStore } from "../stores/uiStore";

export interface TourStep {
  id: string;
  target: string;
  title: string;
  body: string;
  placement: "top" | "bottom" | "left" | "right";
  centered?: boolean;
  offsetX?: number;
  offsetY?: number;
  arrowAlign?: "start" | "center" | "end";
  action?: () => void;
}

export const tourSteps: TourStep[] = [
  {
    id: "welcome",
    target: '[data-tour="app-shell"]',
    title: "Welcome to Lyra",
    body: "Lyra helps you write, version, and compare your lyrics. This quick tour will show you around.",
    placement: "bottom",
    centered: true,
    action: () => {
      const { setSidebarCollapsed, setHistoryBarExpanded } =
        useUIStore.getState();
      setSidebarCollapsed(false);
      setHistoryBarExpanded(true);
    },
  },
  {
    id: "sidebar",
    target: '[data-tour="sidebar"]',
    title: "Your song library",
    body: "All your songs live here. Click any song to open it in the editor.",
    placement: "right",
    action: () => useUIStore.getState().setSidebarCollapsed(false),
  },
  {
    id: "new-song",
    target: '[data-tour="new-song-button"]',
    title: "Create a song",
    body: "Click here to create a new song. Give it a title and start writing.",
    placement: "right",
    action: () => useUIStore.getState().setSidebarCollapsed(false),
  },
  {
    id: "search",
    target: '[data-tour="song-search"]',
    title: "Find your songs",
    body: "Filter your songs by title, genre, mood, or language as your library grows.",
    placement: "right",
    action: () => useUIStore.getState().setSidebarCollapsed(false),
  },
  {
    id: "editor",
    target: '[data-tour="editor-panel"]',
    title: "Write your lyrics",
    body: "This is where you write. Each section of your song gets its own block.",
    placement: "bottom",
    offsetX: 80,
    action: () => useUIStore.getState().setSidebarCollapsed(true),
  },
  {
    id: "metadata-bar",
    target: '[data-tour="metadata-bar"]',
    title: "Song details",
    body: "Set the key, BPM, status, and tags for your song here. Changes are saved with the song.",
    placement: "bottom",
  },
  {
    id: "section-editor",
    target: '[data-tour="section-editor"]',
    title: "Sections",
    body: "Add, reorder, and rename sections using the controls on each block. Drag to rearrange.",
    placement: "top",
  },
  {
    id: "snapshot-button",
    target: '[data-tour="snapshot-button"]',
    title: "Save a version",
    body: "Take a snapshot to save a version of your song at this moment. Write as many as you like.",
    placement: "bottom",
    arrowAlign: "end",
  },
  {
    id: "timeline",
    target: '[data-tour="version-timeline"]',
    title: "Your version history",
    body: "Every snapshot appears here. Click one to preview it, or compare two versions side by side.",
    placement: "top",
    action: () => useUIStore.getState().setHistoryBarExpanded(true),
  },
  {
    id: "done",
    target: '[data-tour="app-shell"]',
    title: "You are ready",
    body: "That is everything. Your work saves automatically, and your history is always here when you need it.",
    placement: "bottom",
    centered: true,
    action: () => {
      const { setSidebarCollapsed, setHistoryBarExpanded } =
        useUIStore.getState();
      setSidebarCollapsed(false);
      setHistoryBarExpanded(true);
    },
  },
];
