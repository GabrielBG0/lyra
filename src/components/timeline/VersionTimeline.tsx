import { useState, useEffect, useRef } from "react";
import { useEditorStore } from "../../stores/editorStore";
import { useSnapshot } from "../../hooks/useSnapshot";
import { useDiff } from "../../hooks/useDiff";
import { useUIStore } from "../../stores/uiStore";
import { Icons } from "../ui/Icon";
import SnapshotCard, { NowCard } from "./SnapshotCard";

const NUDGE_MIN_CHANGES = 10;
const NUDGE_MIN_ELAPSED_MS = 5 * 60 * 1000;

export default function VersionTimeline() {
  const { historyBarExpanded: expanded, toggleHistoryBar } = useUIStore();
  const [shiftSelectedId, setShiftSelectedId] = useState<string | null>(null);
  const { snapshotHeaders, previewSnapshotId, exitPreview, diffTargetB } = useEditorStore();
  const filePath = useEditorStore((s) => s.filePath);

  const { createSnapshot } = useSnapshot();
  const { diffTwoSnapshots, diffWorkingVsSnapshot, clearDiff } = useDiff();
  const { openSnapshotModal } = useUIStore();
  const latestSnap = snapshotHeaders[0];

  const { nudgeDismissed, setNudgeDismissed } = useUIStore();
  const [showNudge, setShowNudge] = useState(false);
  const changeCount = useRef(0);
  const songOpenTime = useRef<number>(Date.now());

  // Reset tracking when a different song is opened
  useEffect(() => {
    if (filePath === null) return;
    songOpenTime.current = Date.now();
    changeCount.current = 0;
    setShowNudge(false);
  }, [filePath]);

  // Count content changes; reset when a new take is saved
  useEffect(() => {
    return useEditorStore.subscribe((state, prevState) => {
      if (state.snapshotHeaders.length > prevState.snapshotHeaders.length) {
        changeCount.current = 0;
        setShowNudge(false);
        return;
      }
      if (
        state.filePath !== null &&
        state.filePath === prevState.filePath &&
        (state.sections !== prevState.sections || state.metadata !== prevState.metadata)
      ) {
        changeCount.current++;
      }
    });
  }, []);

  // Evaluate nudge trigger conditions on an interval and when key deps change
  useEffect(() => {
    const evaluate = () => {
      if (expanded || nudgeDismissed) {
        setShowNudge(false);
        return;
      }
      const referenceTime =
        snapshotHeaders.length > 0
          ? new Date(snapshotHeaders[0].created_at).getTime()
          : songOpenTime.current;
      if (
        changeCount.current >= NUDGE_MIN_CHANGES &&
        Date.now() - referenceTime >= NUDGE_MIN_ELAPSED_MS
      ) {
        setShowNudge(true);
      }
    };

    evaluate();
    const id = setInterval(evaluate, 30_000);
    return () => clearInterval(id);
  }, [expanded, nudgeDismissed, snapshotHeaders]);

  const handleCardClick = async (headerId: string, shiftHeld: boolean) => {
    if (shiftHeld && shiftSelectedId) {
      await diffTwoSnapshots(shiftSelectedId, headerId);
      setShiftSelectedId(null);
      return;
    }
    if (shiftHeld) {
      setShiftSelectedId(headerId);
      return;
    }
    setShiftSelectedId(null);
    await diffWorkingVsSnapshot(headerId);
  };

  const handleNowCardClick = async () => {
    if (shiftSelectedId) {
      await diffWorkingVsSnapshot(shiftSelectedId);
      setShiftSelectedId(null);
      return;
    }
    exitPreview();
    clearDiff();
  };

  const isNudgeVisible = showNudge && !expanded && !nudgeDismissed;

  return (
    <div
      className="border-t border-border-soft bg-panel shrink-0 transition-all"
      style={{ height: expanded ? 160 : 42 }}
    >
      {/* Header row */}
      <div className="h-10.5 flex items-center px-4 gap-3.5">
        <button
          className="flex items-center gap-1.5 bg-transparent border-none text-secondary font-medium font-ui cursor-pointer px-2 py-1 rounded-md hover:bg-elev hover:text-primary transition-colors"
          style={{ fontSize: 12 }}
          onClick={toggleHistoryBar}
        >
          <Icons.History size={13} />
          <span>History</span>
          <span className="text-faint text-[10.5px] ml-0.5 px-1.5 py-px bg-elev rounded-full">
            {snapshotHeaders.length} take
            {snapshotHeaders.length !== 1 ? "s" : ""}
          </span>
          {expanded ? (
            <Icons.ChevronDown size={12} />
          ) : (
            <Icons.ChevronUp size={12} />
          )}
        </button>

        {isNudgeVisible && (
          <>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span
                className="text-secondary font-ui shrink-0"
                style={{ fontSize: 11.5 }}
              >
                You've been writing for a while, save a take?
              </span>
              <button
                className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-accent/70 text-bg font-semibold rounded font-ui cursor-pointer border-none hover:bg-accent/90 transition-all"
                style={{ fontSize: 11 }}
                onClick={() => openSnapshotModal((note) => createSnapshot(note))}
              >
                <Icons.Pin size={11} />
                Save take
              </button>
            </div>
            <button
              className="shrink-0 flex items-center justify-center w-5 h-5 bg-transparent border-none rounded cursor-pointer transition-colors"
              style={{ color: "oklch(0.52 0.10 20)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.45 0.15 20)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.52 0.10 20)")}
              onClick={() => setNudgeDismissed(true)}
              aria-label="Dismiss"
            >
              <Icons.X size={12} />
            </button>
          </>
        )}

        {!isNudgeVisible && !expanded && latestSnap && (
          <div
            className="flex items-center gap-2.5 flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-muted"
            style={{ fontSize: 11.5 }}
          >
            <span
              className="w-1.75 h-1.75 rounded-full bg-accent shrink-0"
              style={{ boxShadow: "0 0 8px oklch(0.72 0.10 55)" }}
            />
            <span>
              Latest: {latestSnap.note ?? "take"} ·{" "}
              {new Date(latestSnap.created_at).toLocaleDateString()}
            </span>
            <div className="ml-auto flex gap-1 pr-1.5">
              {snapshotHeaders.slice(0, 5).map((s) => (
                <span
                  key={s.id}
                  className="w-1 h-1 rounded-full bg-faint opacity-60"
                />
              ))}
            </div>
          </div>
        )}

        {!isNudgeVisible && !expanded && !latestSnap && (
          <button
            className="flex-1 text-xs bg-transparent border-none p-0 cursor-pointer text-left font-ui text-accent hover:opacity-80 transition-opacity"
            onClick={() => openSnapshotModal((note) => createSnapshot(note))}
          >
            No takes yet, save one to track changes.
          </button>
        )}

        {expanded && (
          <div className="ml-auto">
            <button
              className="flex items-center gap-1 px-2 py-1 bg-transparent border border-border-soft rounded text-secondary hover:bg-elev transition-colors font-ui cursor-pointer"
              style={{ fontSize: 11 }}
              onClick={() => openSnapshotModal((note) => createSnapshot(note))}
            >
              <Icons.Pin size={12} />
              Save a take
            </button>
          </div>
        )}
      </div>

      {/* Expanded strip */}
      {expanded && (
        <div className="flex gap-2.5 px-4 pb-3.5 overflow-x-auto">
          <NowCard onClick={handleNowCardClick} />
          {snapshotHeaders.map((header, i) => (
            <SnapshotCard
              key={header.id}
              header={header}
              index={snapshotHeaders.length - 1 - i}
              isPreview={previewSnapshotId === header.id || diffTargetB === header.id}
              isShiftSelected={shiftSelectedId === header.id}
              onClick={handleCardClick}
            />
          ))}
          {snapshotHeaders.length === 0 && (
            <div
              className="shrink-0 w-42.5 p-2.5 rounded-lg flex items-center justify-center cursor-pointer opacity-50 hover:opacity-75 transition-opacity"
              style={{ border: "1.5px dashed oklch(0.55 0.08 55 / 0.4)", minHeight: 80 }}
              onClick={() => openSnapshotModal((note) => createSnapshot(note))}
            >
              <span className="text-xs text-faint">Save your first take</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
