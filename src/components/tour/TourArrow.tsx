import type { TourStep } from "../../lib/tourSteps";

const OUTER = 8;
const INNER = 7;

const ALIGN_H: Record<
  NonNullable<TourStep["arrowAlign"]>,
  React.CSSProperties
> = {
  start: { left: 20, transform: "none" },
  center: { left: "50%", transform: "translateX(-50%)" },
  end: { right: 20, left: "auto", transform: "none" },
};

const ALIGN_V: Record<
  NonNullable<TourStep["arrowAlign"]>,
  React.CSSProperties
> = {
  start: { top: 20, transform: "none" },
  center: { top: "50%", transform: "translateY(-50%)" },
  end: { bottom: 20, top: "auto", transform: "none" },
};

export default function TourArrow({
  placement,
  arrowAlign = "center",
}: {
  placement: TourStep["placement"];
  arrowAlign?: TourStep["arrowAlign"];
}) {
  const T = "transparent";
  const border = "var(--color-border)";
  const fill = "var(--color-panel)";

  const base: React.CSSProperties = {
    position: "absolute",
    width: 0,
    height: 0,
  };
  const h = ALIGN_H[arrowAlign ?? "center"];
  const v = ALIGN_V[arrowAlign ?? "center"];

  if (placement === "right") {
    return (
      <>
        <div
          style={{
            ...base,
            left: -OUTER,
            ...v,
            borderTop: `${OUTER}px solid ${T}`,
            borderBottom: `${OUTER}px solid ${T}`,
            borderRight: `${OUTER}px solid ${border}`,
          }}
        />
        <div
          style={{
            ...base,
            left: -(INNER - 1),
            ...v,
            borderTop: `${INNER}px solid ${T}`,
            borderBottom: `${INNER}px solid ${T}`,
            borderRight: `${INNER}px solid ${fill}`,
          }}
        />
      </>
    );
  }
  if (placement === "left") {
    return (
      <>
        <div
          style={{
            ...base,
            right: -OUTER,
            ...v,
            borderTop: `${OUTER}px solid ${T}`,
            borderBottom: `${OUTER}px solid ${T}`,
            borderLeft: `${OUTER}px solid ${border}`,
          }}
        />
        <div
          style={{
            ...base,
            right: -(INNER - 1),
            ...v,
            borderTop: `${INNER}px solid ${T}`,
            borderBottom: `${INNER}px solid ${T}`,
            borderLeft: `${INNER}px solid ${fill}`,
          }}
        />
      </>
    );
  }
  if (placement === "bottom") {
    return (
      <>
        <div
          style={{
            ...base,
            top: -OUTER,
            ...h,
            borderLeft: `${OUTER}px solid ${T}`,
            borderRight: `${OUTER}px solid ${T}`,
            borderBottom: `${OUTER}px solid ${border}`,
          }}
        />
        <div
          style={{
            ...base,
            top: -(INNER - 1),
            ...h,
            borderLeft: `${INNER}px solid ${T}`,
            borderRight: `${INNER}px solid ${T}`,
            borderBottom: `${INNER}px solid ${fill}`,
          }}
        />
      </>
    );
  }
  // placement === 'top'
  return (
    <>
      <div
        style={{
          ...base,
          bottom: -OUTER,
          ...h,
          borderLeft: `${OUTER}px solid ${T}`,
          borderRight: `${OUTER}px solid ${T}`,
          borderTop: `${OUTER}px solid ${border}`,
        }}
      />
      <div
        style={{
          ...base,
          bottom: -(INNER - 1),
          ...h,
          borderLeft: `${INNER}px solid ${T}`,
          borderRight: `${INNER}px solid ${T}`,
          borderTop: `${INNER}px solid ${fill}`,
        }}
      />
    </>
  );
}
