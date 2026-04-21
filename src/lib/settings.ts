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

/**
 * مدد الفواصل الذهنية بين الأقسام (بالثواني).
 * المفتاح هو "stageBefore→stageAfter" مثلاً "short→examples".
 * القيمة 0 تعني لا يوجد فاصل.
 */
export type StagePauseDurations = Record<string, number>;

/** مفاتيح الفواصل الافتراضية */
export function buildPauseKey(from: Stage, to: Stage): string {
  return `${from}→${to}`;
}

/** بناء قاموس الفواصل الافتراضية من ترتيب الأقسام */
export function buildDefaultPauses(order: Stage[]): StagePauseDurations {
  const result: StagePauseDurations = {};
  for (let i = 0; i < order.length - 1; i++) {
    result[buildPauseKey(order[i], order[i + 1])] = 0;
  }
  return result;
}

export type Settings = {
  stageOrder: Stage[];
  /** مدة الفاصل الذهني بين كل قسمين (بالثواني، 0 = بدون فاصل) */
  stagePauseDurations: StagePauseDurations;
};

const STORAGE_KEY = "metakayef.settings.v1";

export function getDefaultSettings(order = DEFAULT_STAGE_ORDER): Settings {
  return {
    stageOrder: order,
    stagePauseDurations: buildDefaultPauses(order),
  };
}

const defaultSettings: Settings = getDefaultSettings();

function sanitize(order: unknown): Stage[] {
  if (!Array.isArray(order)) return DEFAULT_STAGE_ORDER;
  const valid = order.filter(
    (k): k is Stage =>
      typeof k === "string" && (DEFAULT_STAGE_ORDER as string[]).includes(k),
  );
  const missing = DEFAULT_STAGE_ORDER.filter((s) => !valid.includes(s));
  return [...valid, ...missing];
}

function sanitizePauses(
  raw: unknown,
  order: Stage[],
): StagePauseDurations {
  const defaults = buildDefaultPauses(order);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return defaults;
  const result: StagePauseDurations = { ...defaults };
  for (const key of Object.keys(defaults)) {
    const val = (raw as Record<string, unknown>)[key];
    if (typeof val === "number" && val >= 0 && val <= 120) {
      result[key] = val;
    }
  }
  return result;
}

function readStorage(): Settings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);
    const order = sanitize(parsed?.stageOrder);
    return {
      stageOrder: order,
      stagePauseDurations: sanitizePauses(parsed?.stagePauseDurations, order),
    };
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