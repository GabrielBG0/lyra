import { useEffect, useRef, useState, type MutableRefObject } from "react";
import type { ReactNode } from "react";
import type { FindMatch, Section, SectionType } from "../../lib/types";
import { useEditorStore } from "../../stores/editorStore";
import SectionHeader from "./SectionHeader";
import CommentPanel from "../comments/CommentPanel";
import AddSection from "./AddSection";
import TextareaContextMenu from "./TextareaContextMenu";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SectionBlockProps {
  section: Section;
  isFirst: boolean;
  lyricFont: string;
  commentCount: number;
  onInsertBefore: (type: SectionType, name: string) => void;
  onDelete: (id: string) => void;
  onTurnInto?: (
    sectionId: string,
    selStart: number,
    selEnd: number,
    type: SectionType,
    name: string,
  ) => void;
  readOnly?: boolean;
  zenMode?: boolean;
  textareaRefCallback?: (el: HTMLTextAreaElement | null) => void;
  onNavigatePrev?: (column?: number) => void;
  onNavigateNext?: (column?: number) => void;
}

interface ContextMenuState {
  x: number;
  y: number;
  selStart: number;
  selEnd: number;
}

function renderHighlightedContent(
  content: string,
  matches: FindMatch[],
  activeMatch: FindMatch | undefined,
) {
  const nodes: ReactNode[] = [];
  let pos = 0;
  for (const match of matches) {
    if (match.start > pos) {
      nodes.push(content.slice(pos, match.start));
    }
    const isActive = match === activeMatch;
    nodes.push(
      <mark
        key={`${match.sectionId}-${match.matchIndex}`}
        style={{
          background: isActive
            ? "oklch(0.72 0.10 55 / 0.55)"
            : "oklch(0.72 0.10 55 / 0.25)",
          color: "transparent",
          borderRadius: 2,
          outline: isActive ? "1px solid oklch(0.72 0.10 55 / 0.8)" : undefined,
        }}
      >
        {content.slice(match.start, match.end)}
      </mark>,
    );
    pos = match.end;
  }
  if (pos < content.length) {
    nodes.push(content.slice(pos));
  }
  return nodes;
}

export default function SectionBlock({
  section,
  isFirst,
  lyricFont,
  commentCount,
  onInsertBefore,
  onDelete,
  onTurnInto,
  readOnly,
  zenMode,
  textareaRefCallback,
  onNavigatePrev,
  onNavigateNext,
}: SectionBlockProps) {
  const { updateSection, setFocusedSection, findMatches, findActiveIndex } =
    useEditorStore();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const pendingCursorPos = useRef<number | null>(null);

  const sectionMatches = findMatches.filter((m) => m.sectionId === section.id);
  const activeMatch = findMatches[findActiveIndex];
  const activeMatchForSection =
    activeMatch?.sectionId === section.id ? activeMatch : undefined;

  useEffect(() => {
    if (activeMatchForSection) {
      rootRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [findActiveIndex]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.id,
    disabled: readOnly || !!zenMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const resize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  useEffect(resize, [section.content]);

  useEffect(() => {
    if (pendingCursorPos.current !== null) {
      const pos = pendingCursorPos.current;
      pendingCursorPos.current = null;
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(pos, pos);
      });
    }
  }, [section.content]);

  const handleContextMenuCut = async () => {
    if (!contextMenu) return;
    const { selStart, selEnd } = contextMenu;
    await navigator.clipboard.writeText(
      section.content.slice(selStart, selEnd),
    );
    const newContent =
      section.content.slice(0, selStart) + section.content.slice(selEnd);
    updateSection(section.id, newContent);
    pendingCursorPos.current = selStart;
  };

  const handleContextMenuCopy = async () => {
    if (!contextMenu) return;
    const { selStart, selEnd } = contextMenu;
    await navigator.clipboard.writeText(
      section.content.slice(selStart, selEnd),
    );
  };

  const handleContextMenuPaste = async () => {
    if (!contextMenu) return;
    const { selStart, selEnd } = contextMenu;
    try {
      const text = await navigator.clipboard.readText();
      const newContent =
        section.content.slice(0, selStart) +
        text +
        section.content.slice(selEnd);
      updateSection(section.id, newContent);
      pendingCursorPos.current = selStart + text.length;
    } catch {
      // Clipboard read not permitted
    }
  };

  const handleContextMenuSelectAll = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.select();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (readOnly || e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
    const el = e.currentTarget;
    const { value, selectionStart, selectionEnd } = el;
    if (e.key === "ArrowUp") {
      if (value.slice(0, selectionStart ?? 0).indexOf("\n") === -1) {
        e.preventDefault();
        // On the first line so column equals selectionStart directly
        onNavigatePrev?.(selectionStart ?? 0);
      }
    } else if (e.key === "ArrowDown") {
      if (value.slice(selectionStart ?? 0).indexOf("\n") === -1) {
        e.preventDefault();
        const textBeforeCursor = value.slice(0, selectionStart ?? 0);
        const lastNl = textBeforeCursor.lastIndexOf("\n");
        const column =
          lastNl === -1
            ? (selectionStart ?? 0)
            : (selectionStart ?? 0) - lastNl - 1;
        onNavigateNext?.(column);
      }
    } else if (e.key === "ArrowLeft") {
      if (selectionStart === selectionEnd && selectionStart === 0) {
        e.preventDefault();
        onNavigatePrev?.();
      }
    } else if (e.key === "ArrowRight") {
      if (selectionStart === selectionEnd && selectionStart === value.length) {
        e.preventDefault();
        onNavigateNext?.();
      }
    }
  };

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        (rootRef as MutableRefObject<HTMLDivElement | null>).current = el;
      }}
      style={style}
      className={`group relative${zenMode ? " py-6" : ""}`}
      onFocus={() => setFocusedSection(section.id)}
    >
      {/* Divider with insert affordance */}
      {!isFirst && !readOnly && !zenMode && (
        <div className="group/divider relative h-7 flex items-center cursor-default">
          <div className="absolute inset-x-0 top-1/2 h-px bg-border-soft opacity-55 group-hover/divider:bg-accent group-hover/divider:opacity-35 transition-all" />
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 opacity-0 group-hover/divider:opacity-100 transition-opacity">
            <AddSection onAdd={onInsertBefore} inline />
          </div>
        </div>
      )}
      {!isFirst && readOnly && !zenMode && (
        <div className="h-7 flex items-center">
          <div className="absolute inset-x-0 top-1/2 h-px bg-border-soft opacity-30" />
        </div>
      )}

      {/* Section header */}
      {!zenMode && (
        <SectionHeader
          sectionType={section.section_type}
          name={section.name}
          commentCount={commentCount}
          commentsOpen={commentsOpen}
          onToggleComments={() => setCommentsOpen((o) => !o)}
          onDelete={() => onDelete(section.id)}
          readOnly={readOnly}
          dragListeners={listeners}
          dragAttributes={attributes}
        />
      )}

      {/* Lyric textarea */}
      <div className="pb-2">
        <div className="relative">
          {sectionMatches.length > 0 && (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                overflow: "hidden",
                fontFamily: lyricFont,
                fontSize: "16px",
                lineHeight: "1.85",
                letterSpacing: "0.002em",
                fontVariantLigatures: "common-ligatures",
                padding: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                color: "transparent",
                zIndex: 0,
              }}
            >
              {renderHighlightedContent(
                section.content,
                sectionMatches,
                activeMatchForSection,
              )}
            </div>
          )}
          <textarea
            ref={(el) => {
              textareaRef.current = el;
              textareaRefCallback?.(el);
            }}
            className="lyric-textarea"
            style={{ fontFamily: lyricFont, position: "relative", zIndex: 1 }}
            value={section.content}
            onChange={(e) => {
              if (readOnly) return;
              updateSection(section.id, e.target.value);
              resize();
            }}
            onInput={resize}
            onKeyDown={handleKeyDown}
            onContextMenu={(e) => {
              if (readOnly) return;
              e.preventDefault();
              const el = e.currentTarget;
              setContextMenu({
                x: e.clientX,
                y: e.clientY,
                selStart: el.selectionStart ?? 0,
                selEnd: el.selectionEnd ?? 0,
              });
            }}
            spellCheck={true}
            autoCorrect="off"
            autoCapitalize="off"
            placeholder={readOnly ? "" : `Write ${section.name.toLowerCase()}…`}
            disabled={readOnly}
          />
          {contextMenu && (
            <TextareaContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              hasSelection={contextMenu.selStart !== contextMenu.selEnd}
              onCut={handleContextMenuCut}
              onCopy={handleContextMenuCopy}
              onPaste={handleContextMenuPaste}
              onSelectAll={handleContextMenuSelectAll}
              onTurnInto={(type, name) => {
                onTurnInto?.(
                  section.id,
                  contextMenu.selStart,
                  contextMenu.selEnd,
                  type,
                  name,
                );
              }}
              onClose={() => setContextMenu(null)}
            />
          )}
        </div>
      </div>

      {/* Comments panel */}
      {!zenMode && commentsOpen && <CommentPanel sectionId={section.id} />}
    </div>
  );
}
