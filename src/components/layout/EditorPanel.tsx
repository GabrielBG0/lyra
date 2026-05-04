import { useEditorStore } from "../../stores/editorStore";
import MetadataBar from "../editor/MetadataBar";
import SectionEditor from "../editor/SectionEditor";
import VersionTimeline from "../timeline/VersionTimeline";
import LyraLogo from "../ui/LyraLogo";
import { Icons } from "../ui/Icon";
import EditorErrorBoundary from "./EditorErrorBoundary";
import DiffBanner from "../diff/DiffBanner";
import DiffSection from "../diff/DiffSection";
import SnapshotPreviewBanner from "../timeline/SnapshotPreviewBanner";
import FindPanel from "../editor/FindPanel";

interface EditorPanelProps {
  lyricFont: string;
  onNewSong: () => void;
}

export default function EditorPanel({
  lyricFont,
  onNewSong,
}: EditorPanelProps) {
  const { metadata, previewSnapshotId, loadedSnapshots, diffResult } = useEditorStore();

  if (!metadata) {
    return (
      <div data-tour="editor-panel" className="flex-1 flex flex-col items-center justify-center gap-3.5 bg-bg">
        <LyraLogo size={72} dim />
        <div className="text-base font-medium text-primary">
          No song selected
        </div>
        <div className="text-sm text-muted text-center max-w-65 leading-relaxed">
          Pick a song from the sidebar, or start a new one.
        </div>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-bg font-semibold text-sm rounded-md hover:brightness-110 transition-all cursor-pointer border-none"
          onClick={onNewSong}
        >
          <Icons.Plus size={13} />
          New song
        </button>
      </div>
    );
  }

  const previewSnapshot = previewSnapshotId ? loadedSnapshots[previewSnapshotId] : null;

  return (
    <div data-tour="editor-panel" className="flex-1 flex flex-col min-h-0 bg-bg">
      <MetadataBar />
      <div className="flex-1 flex flex-col min-h-0 relative">
        <FindPanel />
        {diffResult !== null && <DiffBanner />}
        {previewSnapshotId && !diffResult && (
          <SnapshotPreviewBanner snapshotId={previewSnapshotId} />
        )}
        <EditorErrorBoundary>
          <div className="flex-1 overflow-y-auto">
            {diffResult !== null ? (
              <div className="w-[85%] mx-auto px-14 py-3.5 pb-16">
                {diffResult.map((d) => (
                  <DiffSection key={d.section_id} diff={d} />
                ))}
              </div>
            ) : (
              <SectionEditor
                lyricFont={lyricFont}
                readOnly={previewSnapshotId !== null}
                previewSections={previewSnapshot?.sections ?? null}
              />
            )}
          </div>
        </EditorErrorBoundary>
        <VersionTimeline />
      </div>
    </div>
  );
}
