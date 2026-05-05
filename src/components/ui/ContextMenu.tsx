import { useEffect, useRef } from "react";

interface ContextMenuItem {
  label: string;
  danger?: boolean;
  onClick: () => void;
}

interface ContextMenuProps {
  position: { x: number; y: number } | null;
  items: ContextMenuItem[];
  onClose: () => void;
}

export default function ContextMenu({
  position,
  items,
  onClose,
}: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!position) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [position, onClose]);

  if (!position) return null;

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-44 menu-popover"
      style={{ left: position.x, top: position.y }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          className={`${item.danger ? "menu-item-danger text-brand-rose" : "menu-item text-secondary hover:text-primary"} w-full text-left text-sm px-3 py-1.5 rounded hover:bg-panel border-none bg-transparent cursor-pointer`}
          onClick={() => {
            item.onClick();
            onClose();
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
