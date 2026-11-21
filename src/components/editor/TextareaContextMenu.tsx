import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import type { SectionType } from "../../lib/types";
import { SECTION_TYPES } from "./AddSection";

interface TextareaContextMenuProps {
  x: number;
  y: number;
  hasSelection: boolean;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onSelectAll: () => void;
  onTurnInto: (type: SectionType, name: string) => void;
  onClose: () => void;
}

export default function TextareaContextMenu({
  x,
  y,
  hasSelection,
  onCut,
  onCopy,
  onPaste,
  onSelectAll,
  onTurnInto,
  onClose,
}: TextareaContextMenuProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedType, setSelectedType] = useState<SectionType>("verse");
  const [name, setName] = useState("Verse");
  const menuRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (x + rect.width > vw)
      el.style.left = `${Math.max(0, vw - rect.width - 8)}px`;
    if (y + rect.height > vh)
      el.style.top = `${Math.max(0, vh - rect.height - 8)}px`;
  }, [x, y, showPicker]);

  useEffect(() => {
    if (showPicker) {
      setTimeout(() => nameInputRef.current?.focus(), 0);
    }
  }, [showPicker]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [onClose]);

  const handleTypeChange = (type: SectionType) => {
    setSelectedType(type);
    setName(SECTION_TYPES.find((t) => t.type === type)?.label ?? "");
  };

  const handleSubmit = () => {
    const finalName =
      name.trim() ||
      (SECTION_TYPES.find((t) => t.type === selectedType)?.label ?? "Section");
    onTurnInto(selectedType, finalName);
    onClose();
  };

  return createPortal(
    <div
      ref={menuRef}
      style={{ position: "fixed", top: y, left: x }}
      className="z-50 bg-elev border border-border rounded-lg shadow-2xl overflow-hidden"
      onContextMenu={(e) => e.preventDefault()}
    >
      {!showPicker ? (
        <div className="p-1 min-w-44">
          <MenuItem
            label="Cut"
            disabled={!hasSelection}
            onClick={() => {
              onCut();
              onClose();
            }}
          />
          <MenuItem
            label="Copy"
            disabled={!hasSelection}
            onClick={() => {
              onCopy();
              onClose();
            }}
          />
          <MenuItem
            label="Paste"
            onClick={() => {
              onPaste();
              onClose();
            }}
          />
          <MenuItem
            label="Select All"
            onClick={() => {
              onSelectAll();
              onClose();
            }}
          />
          <div className="my-1 border-t border-border-soft" />
          <MenuItem
            label="Turn into"
            disabled={!hasSelection}
            hasSubmenu
            onClick={hasSelection ? () => setShowPicker(true) : undefined}
          />
        </div>
      ) : (
        <div className="p-2.5 min-w-52">
          <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted mb-2">
            Turn into
          </div>
          <div className="flex flex-wrap gap-1 mb-2.5">
            {SECTION_TYPES.map(({ type, label }) => (
              <button
                key={type}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors border cursor-pointer ${
                  selectedType === type
                    ? "bg-accent-soft border-accent text-accent"
                    : "bg-surface border-border-soft text-muted hover:text-secondary hover:border-border"
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleTypeChange(type);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            ref={nameInputRef}
            className="w-full bg-bg border border-border-soft rounded px-2 py-1.5 text-primary text-sm outline-none focus:border-accent font-ui mb-2"
            placeholder="Section name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
              if (e.key === "Escape") onClose();
            }}
          />
          <div className="flex gap-1.5 justify-end">
            <button
              className="px-2 py-1 text-xs text-muted hover:text-secondary border-none bg-transparent cursor-pointer"
              onMouseDown={(e) => {
                e.preventDefault();
                onClose();
              }}
            >
              Cancel
            </button>
            <button
              className="px-2.5 py-1 bg-accent text-bg rounded text-xs font-semibold cursor-pointer border-none"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              Turn into
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}

function MenuItem({
  label,
  disabled,
  hasSubmenu,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  hasSubmenu?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={`w-full text-left flex items-center justify-between px-2 py-1.5 rounded text-sm transition-colors border-none bg-transparent ${
        disabled
          ? "text-muted opacity-40 cursor-not-allowed"
          : "text-secondary hover:text-primary hover:bg-surface cursor-pointer"
      }`}
      disabled={disabled}
      onClick={onClick}
    >
      <span>{label}</span>
      {hasSubmenu && (
        <span className="text-muted text-base leading-none ml-2">›</span>
      )}
    </button>
  );
}
