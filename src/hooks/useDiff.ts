// Diff loading: resolves snapshot content, calls the diff command, updates store.
// 'now' is a sentinel for the live working copy.

import { tauriApi } from "../lib/tauri";
import { useEditorStore } from "../stores/editorStore";

export function useDiff() {
  const {
    filePath,
    sections,
    loadedSnapshots,
    cacheSnapshot,
    setDiff,
    clearDiff,
  } = useEditorStore();

  const ensureLoaded = async (snapshotId: string) => {
    if (loadedSnapshots[snapshotId]) return;

    if (!filePath) return;
    const snapshot = await tauriApi.snapshot.load(filePath, snapshotId);
    cacheSnapshot(snapshotId, snapshot);
  };

  const diffTwoSnapshots = async (snapshotIdA: string, snapshotIdB: string) => {
    if (!filePath) return;

    await Promise.all([ensureLoaded(snapshotIdA), ensureLoaded(snapshotIdB)]);

    const result = await tauriApi.diff.diffSnapshots(
      filePath,
      snapshotIdA,
      snapshotIdB,
    );
    setDiff(result, snapshotIdA, snapshotIdB);
    return result;
  };

  const diffWorkingVsSnapshot = async (snapshotId: string) => {
    if (!filePath) return;

    await ensureLoaded(snapshotId);
    const result = await tauriApi.diff.diffWorkingVsSnapshot(
      filePath,
      snapshotId,
      sections,
    );
    setDiff(result, "now", snapshotId);
    return result;
  };

  return { diffTwoSnapshots, diffWorkingVsSnapshot, clearDiff };
}
