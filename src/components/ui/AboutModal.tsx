import { useEffect } from "react";
import LyraLogo from "./LyraLogo";
import { Icons } from "./Icon";
import pkg from "../../../package.json";

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AboutModal({ open, onClose }: AboutModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "oklch(0.08 0.006 60 / 0.75)",
        backdropFilter: "blur(4px)",
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full mx-4 rounded-xl border border-border overflow-hidden"
        style={{
          maxWidth: "22rem",
          background: "oklch(0.205 0.012 60)",
          boxShadow:
            "0 24px 64px oklch(0.06 0.005 60 / 0.8), 0 0 0 1px oklch(0.32 0.012 60 / 0.4)",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(0.72 0.10 55 / 0.6), transparent)",
          }}
        />

        <button
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded flex items-center justify-center text-faint hover:text-secondary hover:bg-elev transition-colors border-none bg-transparent cursor-pointer z-10"
          onClick={onClose}
          aria-label="Close"
        >
          <Icons.X size={15} />
        </button>

        <div className="px-7 pt-8 pb-7 flex flex-col items-center text-center">
          {/* Faint logo */}
          <div style={{ opacity: 0.18, marginBottom: "1.25rem" }}>
            <LyraLogo size={64} glow={false} />
          </div>

          {/* Name + beta badge */}
          <div className="flex items-center gap-2 mb-3">
            <h2
              className="text-primary font-semibold"
              style={{ fontSize: 20, letterSpacing: "-0.02em" }}
            >
              Lyra
            </h2>
            <span
              className="text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded"
              style={{
                background: "oklch(0.72 0.10 55 / 0.15)",
                color: "oklch(0.72 0.10 55)",
                border: "1px solid oklch(0.72 0.10 55 / 0.3)",
                letterSpacing: "0.12em",
              }}
            >
              beta
            </span>
          </div>

          {/* Description */}
          <p
            className="text-secondary mb-5"
            style={{ fontSize: 13, lineHeight: 1.6, maxWidth: "16rem" }}
          >
            A songwriter's writing environment. Compose, organize, and version
            your lyrics with care.
          </p>

          {/* Version */}
          <span className="text-faint font-mono" style={{ fontSize: 11.5 }}>
            Version {pkg.version}
          </span>
        </div>
      </div>
    </div>
  );
}
