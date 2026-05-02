import { useEditorStore } from "../../stores/editorStore";
import { useSnapshot } from "../../hooks/useSnapshot";
import { Icons } from "../ui/Icon";

interface SnapshotPreviewBannerProps {
  snapshotId: string;
}

export default function SnapshotPreviewBanner({ snapshotId }: SnapshotPreviewBannerProps) {
  const { loadedSnapshots, exitPreview } = useEditorStore();
  const { restoreSnapshot } = useSnapshot();

  const snapshot = loadedSnapshots[snapshotId];

  const handleRestore = async () => {
    await restoreSnapshot(snapshotId);
    exitPreview();
  };

  const formattedDate = snapshot
    ? new Date(snapshot.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })
    : null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-panel border-b border-border-soft border-t border-t-status-demo/40 text-sm text-primary">
      <Icons.Eye size={14} className="text-muted shrink-0" />
      <span className="text-secondary">Viewing take</span>
      {snapshot ? (
        <>
          <span className="font-medium text-primary">{snapshot.note ?? 'Untitled'}</span>
          <span className="text-muted">·</span>
          <span className="text-muted text-xs">{formattedDate}</span>
        </>
      ) : (
        <Icons.Loader size={13} className="animate-spin text-muted" />
      )}
      <div className="flex-1" />
      <button
        className="flex items-center gap-1 px-2.5 py-1 bg-elev border border-border-soft rounded text-secondary hover:bg-panel text-xs cursor-pointer"
        onClick={handleRestore}
      >
        Restore
      </button>
      <button
        className="flex items-center gap-1 text-muted hover:text-primary text-xs cursor-pointer border-none bg-transparent"
        onClick={exitPreview}
      >
        <Icons.X size={12} />
        Exit
      </button>
    </div>
  );
}
