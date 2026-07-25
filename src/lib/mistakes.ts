export interface MistakeRecord {
  id: string;
  subjectId?: string;
  lessonTitle: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  type: 'mcq' | 'fill' | 'essay';
  timestamp: number;
}

const STORAGE_KEY = "nafath.mistakes";

export function getMistakes(subjectId?: string): MistakeRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const allMistakes = raw ? JSON.parse(raw) : [];
    if (subjectId) {
      return allMistakes.filter((m: MistakeRecord) => m.subjectId === subjectId);
    }
    return allMistakes;
  } catch {
    return [];
  }
}

export function recordMistake(mistake: Omit<MistakeRecord, "id" | "timestamp">) {
  if (typeof window === "undefined") return;
  const list = getMistakes();
  const newRecord: MistakeRecord = {
    ...mistake,
    id: crypto.randomUUID(),
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
