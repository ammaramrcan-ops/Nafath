import { type Lesson } from "@/lib/lesson-data";

export type SavedLesson = {
  id: string;
  title: string;
  savedAt: string; // ISO string
  blocks: number;
  data: Lesson;
};

const LIBRARY_KEY = "nafath.lesson.library.v1";

function readLibrary(): SavedLesson[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedLesson[];
  } catch {
    return [];
  }
}

function writeLibrary(lib: SavedLesson[]) {
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(lib));
  } catch {
    /* ignore */
  }
}

export function getLibrary(): SavedLesson[] {
  return readLibrary();
}

export function saveToLibrary(lesson: Lesson): string {
  const lib = readLibrary();
  const id = `lesson-${Date.now()}`;
  const entry: SavedLesson = {
    id,
    title: lesson.title || "درس بدون عنوان",
    savedAt: new Date().toISOString(),
    blocks: lesson.blocks.length,
    data: lesson,
  };
  // Update if same title already exists, else prepend
  const existingIdx = lib.findIndex((l) => l.title === entry.title);
  if (existingIdx >= 0) {
    lib[existingIdx] = { ...entry, id: lib[existingIdx].id };
    writeLibrary(lib);
    return lib[existingIdx].id;
  }
  writeLibrary([entry, ...lib]);
  return id;
}

export function deleteFromLibrary(id: string) {
  const lib = readLibrary().filter((l) => l.id !== id);
  writeLibrary(lib);
}

