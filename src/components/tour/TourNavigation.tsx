import { useTourStore } from "../../stores/tourStore";
import { tourSteps } from "../../lib/tourSteps";
import TourProgressDots from "./TourProgressDots";

export default function TourNavigation() {
  const { currentStep, next, back, dismiss } = useTourStore();
  const isFirst = currentStep === 0;
  const isLast = currentStep === tourSteps.length - 1;

  return (
    <div style={{ marginTop: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={back}
          tabIndex={isFirst ? -1 : 0}
          aria-hidden={isFirst}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--color-secondary)",
            fontFamily: "var(--font-ui)",
            fontSize: 12.5,
            cursor: isFirst ? "default" : "pointer",
            padding: "4px 0",
            opacity: isFirst ? 0 : 1,
            pointerEvents: isFirst ? "none" : "auto",
            transition: "opacity 0.15s",
          }}
        >
          Back
        </button>

        <TourProgressDots total={tourSteps.length} current={currentStep} />

        <button
          onClick={next}
          style={{
            background: "var(--color-accent)",
            border: "none",
            color: "var(--color-bg)",
            fontFamily: "var(--font-ui)",
            fontSize: 12.5,
            fontWeight: 600,
            cursor: "pointer",
            padding: "5px 14px",
            borderRadius: 6,
            transition: "filter 0.15s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.filter = "brightness(1.1)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.filter = "")}
        >
          {isLast ? "Done" : "Next"}
        </button>
      </div>

      {!isLast && (
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <button
            onClick={dismiss}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--color-faint)",
              fontFamily: "var(--font-ui)",
              fontSize: 11.5,
              cursor: "pointer",
              padding: 0,
              textDecoration: "underline",
              textDecorationColor: "var(--color-faint)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--color-muted)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--color-faint)")
            }
          >
            Skip tour
          </button>
        </div>
      )}
    </div>
  );
}
