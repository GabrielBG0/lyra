import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { SectionType } from "../../lib/types";
import { Icons } from "../ui/Icon";
import { useUIStore } from "../../stores/uiStore";

const SECTION_TYPES: { type: SectionType; label: string }[] = [
  { type: "intro", label: "Intro" },
  { type: "verse", label: "Verse" },
  { type: "pre-chorus", label: "Pre-Chorus" },
  { type: "chorus", label: "Chorus" },
  { type: "bridge", label: "Bridge" },
  { type: "outro", label: "Outro" },
  { type: "custom", label: "Custom" },
];

interface AddSectionProps {
  onAdd: (type: SectionType, name: string) => void;
  inline?: boolean;
}

export default function AddSection({ onAdd, inline = false }: AddSectionProps) {
  const { selectNameOnFocus } = useUIStore();
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<SectionType>("verse");
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      const defaultName =
        SECTION_TYPES.find((t) => t.type === selectedType)?.label ?? "";
      setName(defaultName);
    }
  }, [open, selectedType]);

  useEffect(() => {
    if (inline) return;
    const handler = () => setOpen(true);
    window.addEventListener("add-section:open", handler);
    return () => window.removeEventListener("add-section:open", handler);
  }, [inline]);

  const handleAdd = () => {
    const finalName =
      name.trim() ||
      (SECTION_TYPES.find((t) => t.type === selectedType)?.label ?? "Section");
    onAdd(selectedType, finalName);
    setOpen(false);
    setName("");
  };

  if (inline) {
    const handleOpen = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPopoverPos({
          top: rect.bottom + 4,
          left: rect.left + rect.width / 2,
        });
      }
      setOpen(true);
    };

    return (
      <div className="relative flex items-center justify-center">
        <button
          ref={buttonRef}
          className="w-6 h-6 rounded-full bg-surface border border-border text-muted hover:text-accent hover:border-accent flex items-center justify-center transition-all cursor-pointer"
          onClick={handleOpen}
          title="Insert section here"
        >
          <span className="text-[17px] leading-[0] select-none">+</span>
        </button>
        {open &&
          createPortal(
            <>
              <div
                className="fixed inset-0 z-40"
                onMouseDown={() => setOpen(false)}
              />
              <div
                style={{
                  position: "fixed",
                  top: popoverPos.top,
                  left: popoverPos.left,
                  transform: "translateX(-50%)",
                }}
                className="z-50 bg-elev border border-border rounded-lg p-3 shadow-2xl min-w-55"
              >
                <TypeAndNamePicker
                  selectedType={selectedType}
                  name={name}
                  selectNameOnFocus={selectNameOnFocus}
                  onTypeChange={(t) => {
                    setSelectedType(t);
                    setName(
                      SECTION_TYPES.find((s) => s.type === t)?.label ?? "",
                    );
                  }}
                  onNameChange={setName}
                  onSubmit={handleAdd}
                  inputRef={inputRef}
                  onCancel={() => setOpen(false)}
                />
              </div>
            </>,
            document.body,
          )}
      </div>
    );
  }

  return (
    <div className="mt-9 flex justify-center relative">
      {!open ? (
        <button
          className="flex items-center gap-2 px-3.5 py-2.5 text-faint hover:text-accent transition-colors text-[11px] font-semibold tracking-[0.14em] uppercase font-ui border-none bg-transparent cursor-pointer"
          onClick={() => setOpen(true)}
        >
          <Icons.Plus size={14} />
          Add section
        </button>
      ) : (
        <div className="bg-elev border border-border rounded-lg p-3 shadow-xl min-w-60">
          <TypeAndNamePicker
            selectedType={selectedType}
            name={name}
            selectNameOnFocus={selectNameOnFocus}
            onTypeChange={(t) => {
              setSelectedType(t);
              setName(SECTION_TYPES.find((s) => s.type === t)?.label ?? "");
            }}
            onNameChange={setName}
            onSubmit={handleAdd}
            inputRef={inputRef}
            onCancel={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

function TypeAndNamePicker({
  selectedType,
  name,
  selectNameOnFocus,
  onTypeChange,
  onNameChange,
  onSubmit,
  inputRef,
  onCancel,
}: {
  selectedType: SectionType;
  name: string;
  selectNameOnFocus: boolean;
  onTypeChange: (t: SectionType) => void;
  onNameChange: (n: string) => void;
  onSubmit: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1">
        {SECTION_TYPES.map(({ type, label }) => (
          <button
            key={type}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors border cursor-pointer ${
              selectedType === type
                ? "bg-accent-soft border-accent text-accent"
                : "bg-surface border-border-soft text-muted hover:text-secondary hover:border-border"
            }`}
            onClick={() => onTypeChange(type)}
          >
            {label}
          </button>
        ))}
      </div>
      <input
        ref={inputRef}
        className="w-full bg-bg border border-border-soft rounded px-2 py-1.5 text-primary text-sm outline-none focus:border-accent font-ui"
        placeholder="Section name…"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        onFocus={(e) => { if (selectNameOnFocus) e.target.select(); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit();
          if (e.key === "Escape") onCancel();
        }}
      />
      <div className="flex gap-1.5 justify-end">
        <button
          className="px-2 py-1 text-xs text-muted hover:text-secondary border-none bg-transparent cursor-pointer"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="px-2.5 py-1 bg-accent text-bg rounded text-xs font-semibold cursor-pointer border-none"
          onClick={onSubmit}
        >
          Add
        </button>
      </div>
    </div>
  );
}
