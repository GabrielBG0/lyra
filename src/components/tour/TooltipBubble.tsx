import { useRef, useEffect, useState } from "react";
import type { TourStep } from "../../lib/tourSteps";
import TourArrow from "./TourArrow";
import TourNavigation from "./TourNavigation";

const BUBBLE_WIDTH = 280;
const GAP = 12;
const MARGIN = 16;

interface TooltipBubbleProps {
  step: TourStep;
  targetRect: DOMRect;
}

export default function TooltipBubble({
  step,
  targetRect,
}: TooltipBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    opacity: number;
  }>({
    top: 0,
    left: 0,
    opacity: 0,
  });

  useEffect(() => {
    setPos((p) => ({ ...p, opacity: 0 }));

    const frameId = requestAnimationFrame(() => {
      if (!bubbleRef.current) return;
      const bw = BUBBLE_WIDTH;
      const bh = bubbleRef.current.offsetHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      if (step.centered) {
        setPos({ top: vh / 2 - bh / 2, left: vw / 2 - bw / 2, opacity: 1 });
        return;
      }

      const {
        top: rt,
        bottom: rb,
        left: rl,
        right: rr,
        width: rw,
        height: rh,
      } = targetRect;

      let top = 0;
      let left = 0;

      switch (step.placement) {
        case "right":
          left = rr + GAP;
          top = rt + rh / 2 - bh / 2;
          break;
        case "left":
          left = rl - bw - GAP;
          top = rt + rh / 2 - bh / 2;
          break;
        case "bottom":
          top = rb + GAP;
          left = rl + rw / 2 - bw / 2;
          break;
        case "top":
          top = rt - bh - GAP;
          left = rl + rw / 2 - bw / 2;
          break;
      }

      top += step.offsetY ?? 0;
      left += step.offsetX ?? 0;

      top = Math.max(MARGIN, Math.min(top, vh - bh - MARGIN));
      left = Math.max(MARGIN, Math.min(left, vw - bw - MARGIN));

      setPos({ top, left, opacity: 1 });
    });

    return () => cancelAnimationFrame(frameId);
  }, [targetRect, step.id]);

  return (
    <div
      ref={bubbleRef}
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: BUBBLE_WIDTH,
        opacity: pos.opacity,
        transition: "opacity 0.18s ease",
        background: "var(--color-panel)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        padding: 20,
        fontFamily: "var(--font-ui)",
        zIndex: 9999,
      }}
    >
      {!step.centered && (
        <TourArrow placement={step.placement} arrowAlign={step.arrowAlign} />
      )}

      <div
        style={{ fontSize: 14, fontWeight: 600, color: "var(--color-primary)" }}
      >
        {step.title}
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--color-secondary)",
          lineHeight: 1.6,
          marginTop: 8,
        }}
      >
        {step.body}
      </div>

      <TourNavigation />
    </div>
  );
}
