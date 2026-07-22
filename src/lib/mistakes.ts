export interface MistakeRecord {
  id: string;
  lessonTitle: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  type: 'mcq' | 'fill' | 'essay';
  timestamp: number;
}

const STORAGE_KEY = "nafath.mistakes";

export function getMistakes(): MistakeRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordMistake(mistake: Omit<MistakeRecord, "id" | "timestamp">) {
  if (typeof window === "undefined") return;
  const list = getMistakes();
  const newRecord: MistakeRecord = {
    ...mistake,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: Date.now(),
  };
  const updated = [newRecord, ...list];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function clearMistakes() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function removeMistake(id: string) {
  if (typeof window === "undefined") return;
  const list = getMistakes().filter((m) => m.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
