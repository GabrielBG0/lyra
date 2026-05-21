import { useEffect } from "react";
import pkg from "../../package.json";
import type { UpdateInfo } from "../lib/types";
import { useUIStore } from "../stores/uiStore";

export type { UpdateInfo };

function parseVersion(v: string): [number, number, number, number] {
  const clean = v.replace(/^v/, "");
  const [base, pre] = clean.split("-");
  const parts = base.split(".").map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0, pre ? parseInt(pre, 10) || 0 : 0];
}

function isNewer(candidate: string, current: string): boolean {
  const c = parseVersion(candidate);
  const k = parseVersion(current);
  for (let i = 0; i < 4; i++) {
    if (c[i] > k[i]) return true;
    if (c[i] < k[i]) return false;
  }
  return false;
}

export async function checkForUpdates(signal?: AbortSignal): Promise<UpdateInfo | null> {
  const r = await fetch("https://api.github.com/repos/GabrielBG0/lyra/releases/latest", {
    signal,
    headers: { Accept: "application/vnd.github+json" },
  });
  const data = await r.json();
  const tag: string = data.tag_name ?? "";
  const url: string = data.html_url ?? "";
  if (tag && url && isNewer(tag, pkg.version)) {
    return { version: tag.replace(/^v/, ""), releaseUrl: url };
  }
  return null;
}

export function useUpdateCheck() {
  useEffect(() => {
    const controller = new AbortController();
    checkForUpdates(controller.signal)
      .then((info) => {
        if (info) useUIStore.getState().setUpdateAvailable(info);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
}
