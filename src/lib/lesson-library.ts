import { type Lesson, normalizeLesson, khulLesson } from "@/lib/lesson-data";

export type SavedLesson = {
  id: string;
  title: string;
  savedAt: string; // ISO string
  blocks: number;
  data: Lesson;
  subjectId?: string; // Optional assigned subject category
};

const LIBRARY_KEY = "nafath.lesson.library.v1";

function readLibrary(): SavedLesson[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    let parsed: SavedLesson[] = raw ? JSON.parse(raw) : [];

    // Ensure khulLesson is always present in library
    const hasKhul = parsed.some(
      (entry) => entry.title === khulLesson.title || entry.id === "lesson-khul"
    );

    if (!hasKhul) {
      const khulEntry: SavedLesson = {
        id: "lesson-khul",
        title: khulLesson.title,
        savedAt: new Date().toISOString(),
        blocks: khulLesson.blocks.length,
        data: khulLesson,
        subjectId: "fiqh",
      };
      parsed = [khulEntry, ...parsed];
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(parsed));
    }

    return parsed.map((entry) => ({
      ...entry,
      data: normalizeLesson(entry.data),
    }));
  } catch {
    return [
      {
        id: "lesson-khul",
        title: khulLesson.title,
        savedAt: new Date().toISOString(),
        blocks: khulLesson.blocks.length,
        data: khulLesson,
        subjectId: "fiqh",
      },
    ];
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

export function updateLessonSubject(lessonId: string, subjectId: string) {
  const lib = readLibrary();
  const updated = lib.map((l) => (l.id === lessonId ? { ...l, subjectId } : l));
  writeLibrary(updated);
}

export function deleteFromLibrary(id: string) {
  const lib = readLibrary().filter((l) => l.id !== id);
  writeLibrary(lib);
}
