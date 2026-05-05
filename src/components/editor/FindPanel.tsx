import { useEffect, useRef } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useEditorStore } from "../../stores/editorStore";
import { Icons } from "../ui/Icon";

export default function FindPanel() {
  const { findPanelOpen, findReplaceMode, closeFindPanel, toggleFindReplace } =
    useUIStore();
  const {
    findQuery,
    findCaseSensitive,
    findWholeWord,
    findMatches,
    findActiveIndex,
    setFindQuery,
    setFindCaseSensitive,
    setFindWholeWord,
    findNext,
    findPrev,
    clearFind,
    replaceCurrent,
    replaceAll,
  } = useEditorStore();

  const findInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Focus input when panel opens
  useEffect(() => {
    if (findPanelOpen) {
      setTimeout(() => findInputRef.current?.focus(), 20);
    }
  }, [findPanelOpen]);

  // Listen for focus event from keyboard shortcut handler
  useEffect(() => {
    const handler = () => {
      findInputRef.current?.focus();
      findInputRef.current?.select();
    };
    window.addEventListener("find-panel:focus-input", handler);
    return () => window.removeEventListener("find-panel:focus-input", handler);
  }, []);

  const handleClose = () => {
    clearFind();
    closeFindPanel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        findPrev();
      } else {
        findNext();
      }
    } else if (e.key === "Tab" && findReplaceMode && !e.shiftKey) {
      e.preventDefault();
      replaceInputRef.current?.focus();
    }
  };

  const matchCount = findMatches.length;
  const hasQuery = findQuery.length > 0;

  return (
    <div
      className="absolute top-0 right-3 w-[420px] z-40"
      style={{
        transform: findPanelOpen ? "translateY(0)" : "translateY(-100%)",
        opacity: findPanelOpen ? 1 : 0,
        transition: "transform 180ms ease, opacity 180ms ease",
        pointerEvents: findPanelOpen ? "auto" : "none",
      }}
    >
      <div className="bg-panel border border-border rounded-b-xl shadow-lg">
        {/* Find row */}
        <div className="flex items-center gap-1 px-2 py-1.5">
          <Icons.Search size={13} className="text-muted shrink-0" />

          <input
            ref={findInputRef}
            type="text"
            value={findQuery}
            onChange={(e) => setFindQuery(e.target.value, findCaseSensitive)}
            onKeyDown={handleKeyDown}
            placeholder="Find…"
            className="flex-1 bg-transparent text-[12.5px] text-primary placeholder:text-muted outline-none min-w-0"
          />

          {/* Match counter */}
          {hasQuery && (
            <span className="text-[11px] text-muted shrink-0 tabular-nums">
              {matchCount === 0
                ? "No results"
                : `${findActiveIndex + 1} of ${matchCount}`}
            </span>
          )}

          {/* Case sensitive toggle */}
          <button
            onClick={() => setFindCaseSensitive(!findCaseSensitive)}
            title="Match case"
            className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
              findCaseSensitive
                ? "bg-accent-soft text-accent"
                : "text-muted hover:text-secondary hover:bg-elev"
            }`}
          >
            <Icons.CaseSensitive size={13} />
          </button>

          {/* Whole word toggle */}
          <button
            onClick={() => setFindWholeWord(!findWholeWord)}
            title="Match whole word"
            className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
              findWholeWord
                ? "bg-accent-soft text-accent"
                : "text-muted hover:text-secondary hover:bg-elev"
            }`}
          >
            <Icons.WholeWord size={13} />
          </button>

          {/* Prev */}
          <button
            onClick={findPrev}
            disabled={matchCount === 0}
            title="Find previous (Shift+Enter)"
            className="w-6 h-6 flex items-center justify-center rounded text-muted hover:text-secondary hover:bg-elev transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Icons.ChevronUp size={13} />
          </button>

          {/* Next */}
          <button
            onClick={findNext}
            disabled={matchCount === 0}
            title="Find next (Enter)"
            className="w-6 h-6 flex items-center justify-center rounded text-muted hover:text-secondary hover:bg-elev transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Icons.ChevronDown size={13} />
          </button>

          {/* Toggle replace */}
          <button
            onClick={toggleFindReplace}
            title="Toggle Replace"
            className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
              findReplaceMode
                ? "bg-accent-soft text-accent"
                : "text-muted hover:text-secondary hover:bg-elev"
            }`}
          >
            <Icons.Replace size={13} />
          </button>

          {/* Close */}
          <button
            onClick={handleClose}
            title="Close (Esc)"
            className="w-6 h-6 flex items-center justify-center rounded text-muted hover:text-secondary hover:bg-elev transition-colors"
          >
            <Icons.X size={13} />
          </button>
        </div>

        {/* Replace row — animated with grid rows */}
        <div
          style={{
            display: "grid",
            gridTemplateRows: findReplaceMode ? "1fr" : "0fr",
            transition: "grid-template-rows 160ms ease",
          }}
        >
          <div style={{ overflow: "hidden" }}>
            <div className="flex items-center gap-1 px-2 py-1.5 border-t border-border-soft">
              <Icons.Replace size={13} className="text-muted shrink-0" />

              <input
                ref={replaceInputRef}
                type="text"
                placeholder="Replace with…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    replaceCurrent(e.currentTarget.value);
                  } else if (e.key === "Escape") {
                    handleClose();
                  }
                }}
                className="flex-1 bg-transparent text-[12.5px] text-primary placeholder:text-muted outline-none min-w-0"
              />

              <button
                onClick={() =>
                  replaceInputRef.current &&
                  replaceCurrent(replaceInputRef.current.value)
                }
                disabled={matchCount === 0}
                className="px-2 py-0.5 text-[11px] text-secondary hover:text-primary hover:bg-elev rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Replace
              </button>

              <button
                onClick={() =>
                  replaceInputRef.current &&
                  replaceAll(replaceInputRef.current.value)
                }
                disabled={matchCount === 0}
                className="px-2 py-0.5 text-[11px] text-secondary hover:text-primary hover:bg-elev rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
