import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import type { SectionType } from "../../lib/types";
import { Icons } from "../ui/Icon";

interface SectionHeaderProps {
  sectionType: SectionType;
  name: string;
  commentCount: number;
  commentsOpen: boolean;
  onToggleComments: () => void;
  onDelete: () => void;
  readOnly?: boolean;
  dragListeners?: SyntheticListenerMap;
  dragAttributes?: DraggableAttributes;
}

const TYPE_LABEL: Record<SectionType, string> = {
  intro: "INTRO",
  verse: "VERSE",
  "pre-chorus": "PRE-CHORUS",
  chorus: "CHORUS",
  bridge: "BRIDGE",
  outro: "OUTRO",
  custom: "CUSTOM",
};

function typeColor(t: SectionType): string {
  if (t === "chorus") return "text-accent";
  if (t === "bridge") return "text-brand-rose";
  return "text-secondary";
}

function typeDotColor(t: SectionType): string {
  if (t === "chorus") return "bg-accent";
  if (t === "bridge") return "bg-brand-rose";
  return "bg-faint";
}

export default function SectionHeader({
  sectionType,
  name,
  commentCount,
  commentsOpen,
  onToggleComments,
  onDelete,
  readOnly,
  dragListeners,
  dragAttributes,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center py-1.5 min-h-5.5">
      {/* Type tab */}
      <div className="flex items-baseline gap-1.5 text-2xs font-semibold tracking-[0.14em] uppercase select-none font-ui">
        <span className={`flex items-center gap-1.5 ${typeColor(sectionType)}`}>
          <span
            className={`inline-block w-1 h-1 rounded-full ${typeDotColor(sectionType)}`}
          />
          {TYPE_LABEL[sectionType]}
        </span>
        <span className="text-faint opacity-60">·</span>
        <span className="text-faint font-medium tracking-[0.08em] normal-case">
          {name}
        </span>
      </div>

      {/* Tools — fade in on section hover (handled by parent group) */}
      {!readOnly && (
        <div className="ml-auto flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="w-5.5 h-5.5 flex items-center justify-center rounded text-faint hover:bg-elev hover:text-secondary transition-colors border-none bg-transparent cursor-grab active:cursor-grabbing"
            title="Drag to reorder"
            {...dragListeners}
            {...dragAttributes}
          >
            <Icons.Grip size={13} />
          </button>
          <button
            className={`relative w-5.5 h-5.5 flex items-center justify-center rounded transition-colors border-none bg-transparent cursor-pointer ${
              commentsOpen || commentCount > 0
                ? "text-accent opacity-100"
                : "text-faint hover:bg-elev hover:text-secondary"
            }`}
            title="Comments"
            onClick={onToggleComments}
          >
            <Icons.MessageSquare size={13} />
            {commentCount > 0 && (
              <span className="absolute top-0.5 right-0 text-[8.5px] font-bold px-0.5 leading-2.5 bg-accent text-bg rounded min-w-2.5 text-center">
                {commentCount}
              </span>
            )}
          </button>
          <div className="relative group/more">
            <button
              className="w-5.5 h-5.5 flex items-center justify-center rounded text-faint hover:bg-elev hover:text-secondary transition-colors border-none bg-transparent cursor-pointer"
              title="More"
            >
              <Icons.MoreHorizontal size={13} />
            </button>
            <div className="absolute right-0 top-full mt-0.5 hidden group-hover/more:block bg-elev border border-border rounded-lg p-1 min-w-30 z-10 shadow-xl">
              <button
                className="w-full text-left px-2.5 py-1.5 text-[12px] text-brand-rose hover:bg-accent-soft/20 rounded cursor-pointer border-none bg-transparent transition-colors"
                onClick={onDelete}
              >
                Delete section
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
