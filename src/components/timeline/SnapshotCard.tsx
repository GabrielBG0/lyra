import { useState } from "react";
import type { SnapshotHeader } from "../../lib/types";
import LyraLogo from "../ui/LyraLogo";
import ContextMenu from "../ui/ContextMenu";
import { useSnapshot } from "../../hooks/useSnapshot";
import { useDiff } from "../../hooks/useDiff";

interface SnapshotCardProps {
  header: SnapshotHeader;
  index: number;
  isPreview?: boolean;
  isShiftSelected?: boolean;
  onClick: (id: string, shiftHeld: boolean) => void;
}

interface NowCardProps {
  onClick?: () => void;
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  if (diff < 0 || Number.isNaN(diff)) return "just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? "just now" : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

export function NowCard({ onClick }: NowCardProps) {
  return (
    <div
      className="shrink-0 w-42.5 p-2.5 bg-surface border rounded-lg flex flex-col gap-1.5 relative cursor-pointer"
      style={{
        background:
          "linear-gradient(155deg, oklch(0.72 0.10 55 / 0.12), transparent 80%), oklch(0.175 0.010 60)",
        borderColor: "oklch(0.72 0.10 55 / 0.4)",
      }}
      onClick={onClick}
    >
      <div
        className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-0.5 rounded-full bg-accent"
        style={{ height: "70%", boxShadow: "0 0 8px oklch(0.72 0.10 55)" }}
      />
      <div className="flex items-center justify-between">
        <LyraLogo size={16} />
        <span className="text-[13px] font-bold text-accent tracking-wide">
          Now
        </span>
      </div>
      <div className="text-[12px] text-primary">Live draft</div>
    </div>
  );
}

export default function SnapshotCard({ header, index, isPreview, isShiftSelected, onClick }: SnapshotCardProps) {
  const label = `#${index + 1}`;
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const { restoreSnapshot } = useSnapshot();
  const { diffWorkingVsSnapshot } = useDiff();

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  const menuItems = [
    {
      label: "Restore this take",
      onClick: () => restoreSnapshot(header.id),
    },
    {
      label: "Compare with current",
      onClick: () => diffWorkingVsSnapshot(header.id),
    },
    {
      label: "Delete take",
      danger: true,
      onClick: () => {
        // TODO: implement delete_snapshot Rust command
        console.warn("Delete snapshot not yet implemented");
      },
    },
  ];

  return (
    <>
      <div
        className={`shrink-0 w-42.5 p-2.5 bg-surface rounded-lg flex flex-col gap-1.5 cursor-pointer transition-all ${
          isPreview
            ? "border border-accent bg-accent-soft"
            : isShiftSelected
            ? "border border-dashed border-accent"
            : "border border-border-soft hover:border-accent hover:bg-elev"
        }`}
        onClick={(e) => onClick(header.id, e.shiftKey)}
        onContextMenu={handleContextMenu}
      >
        {isShiftSelected && (
          <div className="text-2xs text-accent font-semibold uppercase tracking-wide">compare from</div>
        )}
        <div className="flex items-start justify-between gap-2">
          <div
            className={`text-[12px] font-semibold leading-snug min-h-7.5 flex-1 overflow-hidden ${header.note ? "text-primary" : "text-faint italic"}`}
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {header.note ?? "Untitled take"}
          </div>
          <span className="text-[10.5px] text-faint shrink-0">
            {timeAgo(header.created_at)}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xs text-faint uppercase tracking-wide font-medium">
            {header.section_count} section{header.section_count !== 1 ? "s" : ""}
          </span>
          <span className="text-[10.5px] text-faint">{label}</span>
        </div>
      </div>
      <ContextMenu
        position={menuPos}
        items={menuItems}
        onClose={() => setMenuPos(null)}
      />
    </>
  );
}
