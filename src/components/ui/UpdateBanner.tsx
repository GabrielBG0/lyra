import { openUrl } from "@tauri-apps/plugin-opener";
import { Icons } from "./Icon";

interface UpdateBannerProps {
  version: string;
  releaseUrl: string;
  onDismiss: () => void;
}

export default function UpdateBanner({
  version,
  releaseUrl,
  onDismiss,
}: UpdateBannerProps) {
  const handleOpen = () => openUrl(releaseUrl).catch(console.error);

  return (
    <div
      className="flex items-center justify-between px-3 shrink-0"
      style={{
        height: "1.75rem",
        background: "oklch(0.72 0.10 55 / 0.07)",
        borderBottom: "1px solid oklch(0.72 0.10 55 / 0.18)",
        fontSize: 12,
      }}
    >
      <span className="text-secondary">
        Lyra {version} is available.{" "}
        <button
          onClick={handleOpen}
          className="text-accent hover:underline cursor-pointer bg-transparent border-none p-0"
          style={{ fontSize: "inherit" }}
        >
          Download it here.
        </button>
      </span>
      <button
        onClick={onDismiss}
        className="flex items-center justify-center w-5 h-5 rounded text-faint hover:text-secondary hover:bg-elev transition-colors border-none bg-transparent cursor-pointer"
        aria-label="Dismiss"
      >
        <Icons.X size={11} />
      </button>
    </div>
  );
}
