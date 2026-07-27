import { type Stage } from "@/lib/settings";

export type Subject = {
  id: string;
  nameArabic: string;
  nameEnglish: string;
  levelStageOrders: {
    1: Stage[];
    2: Stage[];
    3: Stage[];
  };
  levelDisabledStages: {
    1: Stage[];
    2: Stage[];
    3: Stage[];
  };
};

const DEFAULT_STAGE_ORDERS = {
  1: ["story", "baladi_terms", "paper_summary", "mindmap", "quizzes_mcq"] as Stage[],
  2: [
    "examples",
    "original",
    "mental",
    "mindmap",
    "quizzes_fill",
    "quizzes_essay",
    "flashcards",
    "zaitouna",
  ] as Stage[],
  3: ["original", "mental", "funny", "mindmap", "quizzes_essay", "zaitouna"] as Stage[],
};

const DEFAULT_DISABLED_STAGES = {
  1: [] as Stage[],
  2: [] as Stage[],
  3: [] as Stage[],
};

const DEFAULT_SUBJECTS: Subject[] = [
  {
    id: "fiqh",
    nameArabic: "الفقه",
    nameEnglish: "Fiqh",
    levelStageOrders: DEFAULT_STAGE_ORDERS,
    levelDisabledStages: DEFAULT_DISABLED_STAGES,
  },
];

const STORAGE_KEY = "nafath.subjects";

function loadSubjectsFromStorage(): Subject[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load subjects from storage:", e);
  }
  return DEFAULT_SUBJECTS;
}

export const SUBJECTS: Subject[] = loadSubjectsFromStorage();

export function saveSubjectsToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SUBJECTS));
  } catch (e) {
    console.error("Failed to save subjects to storage:", e);
  }
}

export function getSubjectById(id: string): Subject | undefined {
  return SUBJECTS.find((subject) => subject.id === id);
}

export function updateSubjectStages(id: string, level: 1 | 2 | 3, stages: Stage[]): boolean {
  const subject = getSubjectById(id);
  if (!subject) return false;

  subject.levelStageOrders[level] = stages;
  saveSubjectsToStorage();
  return true;
}

export function updateSubjectDisabledStages(
  id: string,
  level: 1 | 2 | 3,
  disabledStages: Stage[],
): boolean {
  const subject = getSubjectById(id);
  if (!subject) return false;

  subject.levelDisabledStages[level] = disabledStages;
  saveSubjectsToStorage();
  return true;
}
