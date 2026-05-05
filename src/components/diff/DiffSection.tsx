import type { DiffStatus, SectionDiff } from "../../lib/types";
import { useEditorStore } from "../../stores/editorStore";
import { useSnapshot } from "../../hooks/useSnapshot";
import DiffHunk from "./DiffHunk";

interface DiffSectionProps {
  diff: SectionDiff;
}

const BADGE: Record<DiffStatus, { label: string; className: string }> = {
  equal: { label: "unchanged", className: "text-muted bg-elev" },
  changed: {
    label: "changed",
    className: "text-status-demo bg-status-demo/10",
  },
  added: {
    label: "added",
    className: "text-status-finished bg-status-finished/10",
  },
  removed: { label: "removed", className: "text-rose-400 bg-rose-400/10" },
};

function DiffStatusBadge({ status }: { status: DiffStatus }) {
  const { label, className } = BADGE[status];
  return (
    <span
      className={`text-2xs font-semibold px-1.5 py-px rounded uppercase tracking-wide ${className}`}
    >
      {label}
    </span>
  );
}

export default function DiffSection({ diff }: DiffSectionProps) {
  const { diffTargetB } = useEditorStore();
  const { cherryPickSection } = useSnapshot();

  const handleCherryPick = async () => {
    if (!diffTargetB || diffTargetB === "now") return;
    await cherryPickSection(diffTargetB, diff.section_id);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`text-2xs font-semibold tracking-[0.14em] uppercase font-ui ${
              diff.status === "added"
                ? "text-status-finished"
                : diff.status === "removed"
                  ? "text-rose-400 line-through"
                  : "text-muted"
            }`}
          >
            {diff.name}
          </span>
          <DiffStatusBadge status={diff.status} />
        </div>
        {(diff.status === "changed" || diff.status === "added") &&
          diffTargetB &&
          diffTargetB !== "now" && (
            <button
              className="text-2xs px-2 py-0.5 border border-border-soft rounded text-secondary hover:text-primary hover:bg-elev cursor-pointer bg-transparent"
              onClick={handleCherryPick}
            >
              Use this section
            </button>
          )}
      </div>
      <pre className="font-lyrics text-primary leading-[1.85] whitespace-pre-wrap text-base">
        {diff.hunks.map((h, i) => (
          <DiffHunk key={i} hunk={h} />
        ))}
      </pre>
    </div>
  );
}
