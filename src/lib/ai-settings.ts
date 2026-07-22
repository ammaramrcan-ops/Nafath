import { useState, useEffect, useCallback } from "react";

export type AiProvider = "nvidia_nim" | "openai" | "google_gemini" | "anthropic" | "custom";

export type AiSettings = {
  provider: AiProvider;
  apiKey: string;
  modelName: string;
  baseUrl: string;
  promptCopiedCount: number;
};

const STORAGE_KEY = "nafath_ai_settings_v1";

const defaultAiSettings: AiSettings = {
  provider: "nvidia_nim",
  apiKey: "",
  modelName: "meta/llama-3.1-70b-instruct",
  baseUrl: "https://integrate.api.nvidia.com/v1",
  promptCopiedCount: 0,
};

export function loadAiSettings(): AiSettings {
  if (typeof window === "undefined") return defaultAiSettings;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultAiSettings;
    const parsed = JSON.parse(raw);
    return {
      provider: parsed?.provider || "nvidia_nim",
      apiKey: parsed?.apiKey || "",
      modelName: parsed?.modelName || "meta/llama-3.1-70b-instruct",
      baseUrl: parsed?.baseUrl || "https://integrate.api.nvidia.com/v1",
      promptCopiedCount: parsed?.promptCopiedCount || 0,
    };
  } catch {
    return defaultAiSettings;
  }
}

export function saveAiSettings(settings: AiSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

export function useAiSettings() {
  const [aiSettings, setAiSettingsState] = useState<AiSettings>(loadAiSettings);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setAiSettingsState(loadAiSettings());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const updateAiSettings = useCallback((newSettings: Partial<AiSettings>) => {
    setAiSettingsState((prev) => {
      const next = { ...prev, ...newSettings };
      saveAiSettings(next);
      return next;
    });
  }, []);

  return {
    aiSettings,
    updateAiSettings,
  };
}
