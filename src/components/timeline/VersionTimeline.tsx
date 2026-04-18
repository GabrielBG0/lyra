import { useState } from "react";
import { useEditorStore } from "../../stores/editorStore";
import { useSnapshot } from "../../hooks/useSnapshot";
import { Icons } from "../ui/Icon";
import SnapshotCard, { NowCard } from "./SnapshotCard";

export default function VersionTimeline() {
  const [expanded, setExpanded] = useState(false);
  const { snapshotHeaders } = useEditorStore();

  const { createSnapshot } = useSnapshot();
  const latestSnap = snapshotHeaders[0];

  return (
    <div
      className="border-t border-border-soft bg-panel shrink-0 transition-all"
      style={{ height: expanded ? 184 : 42 }}
    >
      {/* Header row */}
      <div className="h-10.5 flex items-center px-4 gap-3.5">
        <button
          className="flex items-center gap-1.5 bg-transparent border-none text-secondary font-medium font-ui cursor-pointer px-2 py-1 rounded-md hover:bg-elev hover:text-primary transition-colors"
          style={{ fontSize: 12 }}
          onClick={() => setExpanded((e) => !e)}
        >
          <Icons.History size={13} />
          <span>History</span>
          <span className="text-faint text-[10.5px] ml-0.5 px-1.5 py-px bg-elev rounded-full">
            {snapshotHeaders.length} snapshot
            {snapshotHeaders.length !== 1 ? "s" : ""}
          </span>
          {expanded ? (
            <Icons.ChevronDown size={12} />
          ) : (
            <Icons.ChevronUp size={12} />
          )}
        </button>

        {!expanded && latestSnap && (
          <div
            className="flex items-center gap-2.5 flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-muted"
            style={{ fontSize: 11.5 }}
          >
            <span
              className="w-1.75 h-1.75 rounded-full bg-accent shrink-0"
              style={{ boxShadow: "0 0 8px oklch(0.72 0.10 55)" }}
            />
            <span>
              Latest: {latestSnap.note ?? "snapshot"} ·{" "}
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

        {!expanded && !latestSnap && (
          <div className="flex-1 text-faint text-xs">
            No snapshots yet — save a version to track changes.
          </div>
        )}

        {expanded && (
          <div className="ml-auto">
            <button
              className="flex items-center gap-1 px-2 py-1 bg-transparent border border-border-soft rounded text-secondary hover:bg-elev transition-colors font-ui cursor-pointer"
              style={{ fontSize: 11 }}
              onClick={() => {
                const note = window.prompt("Snapshot note (optional):");
                createSnapshot(note ?? null);
              }}
            >
              <Icons.Camera size={12} />
              Snapshot
            </button>
          </div>
        )}
      </div>

      {/* Expanded strip */}
      {expanded && (
        <div className="flex gap-2.5 px-4 pb-3.5 overflow-x-auto">
          <NowCard />
          {snapshotHeaders.map((header, i) => (
            <SnapshotCard
              key={header.id}
              header={header}
              index={snapshotHeaders.length - 1 - i}
            />
          ))}
          {snapshotHeaders.length === 0 && (
            <div className="flex items-center text-faint text-xs pl-2">
              No snapshots yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}
