import { useEffect, useState, useCallback } from "react";

export type Stage =
  | "story"
  | "baladi_terms"
  | "examples"
  | "original"
  | "mental"
  | "funny"
  | "mindmap"
  | "quizzes_mcq"
  | "quizzes_fill"
  | "quizzes_essay"
  | "flashcards"
  | "zaitouna"
  | "paper_summary";

export const STAGE_LABELS: Record<Stage, string> = {
  story: "قصة",
  baladi_terms: "نقط خلي بالك منها 💡",
  examples: "أمثلة توضيحية",
  original: "النص الأصلي",
  mental: "رابط ذهني",
  funny: "رابط فكاهي",
  mindmap: "الخريطة الذهنية",
  quizzes_mcq: "اختبار (اختيار من متعدد)",
  quizzes_fill: "اختبار (أكمل الفراغ)",
  quizzes_essay: "اختبار (سؤال مقالي)",
  flashcards: "بطاقات الاستذكار (Flashcards) 🎴",
  zaitouna: "الزتونة (ملخص الفقرة)",
  paper_summary: "التلخيص اليدوي في الكراسة 📝",
};

export const DEFAULT_STAGE_ORDER: Stage[] = [
  "story",
  "baladi_terms",
  "examples",
  "original",
  "mental",
  "funny",
  "mindmap",
  "quizzes_mcq",
  "quizzes_fill",
  "quizzes_essay",
  "flashcards",
  "zaitouna",
  "paper_summary",
];

export type Settings = {
  stageOrder: Stage[];
  devModeEnabled: boolean;
};

const STORAGE_KEY = "metakayef.settings.v1";

const defaultSettings: Settings = {
  stageOrder: DEFAULT_STAGE_ORDER,
  devModeEnabled: false,
};

export function isLocalhost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host.startsWith("192.168.") ||
    host.endsWith(".local") ||
    window.location.port === "8080" ||
    window.location.port === "5173"
  );
}

function sanitize(order: unknown): Stage[] {
  if (!Array.isArray(order)) return DEFAULT_STAGE_ORDER;
  const valid = order.filter(
    (k): k is Stage => typeof k === "string" && (DEFAULT_STAGE_ORDER as string[]).includes(k),
  );
  // Ensure every stage is included exactly once
  const missing = DEFAULT_STAGE_ORDER.filter((k) => !valid.includes(k));
  return [...valid, ...missing];
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);
    return {
      stageOrder: sanitize(parsed?.stageOrder),
      devModeEnabled: Boolean(parsed?.devModeEnabled),
    };
  } catch {
    return defaultSettings;
  }
}

function saveSettings(s: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // localStorage might fail in rare environments
  }
}

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(loadSettings);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setSettingsState(loadSettings());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const updateStageOrder = useCallback((newOrder: Stage[]) => {
    const sanitized = sanitize(newOrder);
    setSettingsState((prev) => {
      const next = { ...prev, stageOrder: sanitized };
      saveSettings(next);
      return next;
    });
  }, []);

  const resetStageOrder = useCallback(() => {
    setSettingsState((prev) => {
      const next = { ...prev, stageOrder: DEFAULT_STAGE_ORDER };
      saveSettings(next);
      return next;
    });
  }, []);

  const updateDevMode = useCallback((enabled: boolean) => {
    setSettingsState((prev) => {
      const next = { ...prev, devModeEnabled: enabled };
      saveSettings(next);
      return next;
    });
  }, []);

  const isLocal = isLocalhost();
  const isDevModeActive = isLocal && settings.devModeEnabled;

  return {
    settings,
    isLocalhost: isLocal,
    devModeActive: isDevModeActive,
    updateStageOrder,
    resetStageOrder,
    updateDevMode,
  };
}
