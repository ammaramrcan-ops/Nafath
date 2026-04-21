import { useEffect, useState, useCallback } from "react";

export type Stage = "short" | "examples" | "original" | "mental" | "mindmap";

export const STAGE_LABELS: Record<Stage, string> = {
  short: "الجملة المبسطة",
  examples: "أمثلة توضيحية / القصة",
  original: "النص الأصلي",
  mental: "رابط ذهني",
  mindmap: "الخريطة الذهنية",
};

export const DEFAULT_STAGE_ORDER: Stage[] = [
  "short",
  "examples",
  "original",
  "mental",
  "mindmap",
];

export type Settings = {
  stageOrder: Stage[];
};

const STORAGE_KEY = "metakayef.settings.v1";

const defaultSettings: Settings = {
  stageOrder: DEFAULT_STAGE_ORDER,
};

function sanitize(order: unknown): Stage[] {
  if (!Array.isArray(order)) return DEFAULT_STAGE_ORDER;
  const valid = order.filter(
    (k): k is Stage =>
      typeof k === "string" && (DEFAULT_STAGE_ORDER as string[]).includes(k),
  );
  // Ensure every stage is included exactly once
  const missing = DEFAULT_STAGE_ORDER.filter((s) => !valid.includes(s));
  return [...valid, ...missing];
}

function readStorage(): Settings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);
    return { stageOrder: sanitize(parsed?.stageOrder) };
  } catch {
    return defaultSettings;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSettings(readStorage());
    setHydrated(true);
  }, []);

  const update = useCallback((next: Partial<Settings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...next };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {
        /* ignore */
      }
      return merged;
    });
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setSettings(defaultSettings);
  }, []);

  return { settings, update, reset, hydrated };
}
