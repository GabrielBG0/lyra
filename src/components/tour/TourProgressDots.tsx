interface TourProgressDotsProps {
  total: number;
  current: number;
}

export default function TourProgressDots({
  total,
  current,
}: TourProgressDotsProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        justifyContent: "center",
      }}
    >
      {Array.from({ length: total }, (_, i) => {
        const isCompleted = i < current;
        const isCurrent = i === current;

        return (
          <div
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              flexShrink: 0,
              transition: "all 0.2s",
              ...(isCurrent
                ? { background: "var(--color-accent)", transform: "scale(1.3)" }
                : isCompleted
                  ? { background: "var(--color-muted)" }
                  : {
                      background: "transparent",
                      border: "1.5px solid var(--color-border)",
                    }),
            }}
          />
        );
      })}
    </div>
  );
}
