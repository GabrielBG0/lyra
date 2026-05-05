// Intercepts the native window close event and saves any dirty song first.

import { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { tauriApi } from "../lib/tauri";
import { useEditorStore } from "../stores/editorStore";

export function useCloseGuard() {
  useEffect(() => {
    const win = getCurrentWindow();

    const unlisten = win.onCloseRequested(async (event) => {
      event.preventDefault();

      const { isDirty, filePath, metadata, sections, markClean } =
        useEditorStore.getState();

      if (isDirty && filePath && metadata) {
        await tauriApi.song.save(filePath, metadata, sections);
        markClean();
      }

      await win.destroy();
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);
}
