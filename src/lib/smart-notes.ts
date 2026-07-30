export type SmartNote = {
  id: string;
  lessonTitle: string;
  blockTitle?: string;
  questionText?: string;
  note: string;
  tag?: string;
  createdAt: number;
};

export function getLessonNotes(lessonTitle: string): SmartNote[] {
  if (typeof window === "undefined") return [];
  try {
    const key = `nafath_smart_notes_${lessonTitle.trim()}`;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as SmartNote[]) : [];
  } catch {
    return [];
  }
}

export function saveSmartNote(note: Omit<SmartNote, "id" | "createdAt">): SmartNote {
  if (typeof window === "undefined") {
    return {
      ...note,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
  }
  const existing = getLessonNotes(note.lessonTitle);
  const newNote: SmartNote = {
    ...note,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };

  const updated = [newNote, ...existing];
  try {
    const key = `nafath_smart_notes_${note.lessonTitle.trim()}`;
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    /* ignore */
  }
  return newNote;
}

function cleanNoteFromStorageKey(k: string, targetId: string) {
  if (!k.startsWith("nafath_smart_notes_")) return;
  const raw = localStorage.getItem(k);
  if (!raw) return;
  try {
    const arr: SmartNote[] = JSON.parse(raw);
    if (Array.isArray(arr) && arr.some((n) => String(n.id).trim() === targetId)) {
      const cleaned = arr.filter((n) => String(n.id).trim() !== targetId);
      localStorage.setItem(k, JSON.stringify(cleaned));
    }
  } catch {
    /* ignore */
  }
}

export function deleteSmartNote(lessonTitle: string, noteId: string): SmartNote[] {
  const targetId = String(noteId).trim();
  const key = `nafath_smart_notes_${lessonTitle.trim()}`;

  const existing = getLessonNotes(lessonTitle);
  const updated = existing.filter((n) => String(n.id).trim() !== targetId);
  try {
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    /* ignore */
  }

  if (typeof window !== "undefined") {
    try {
      const len = localStorage.length;
      for (let i = 0; i < len; i++) {
        const k = localStorage.key(i);
        if (k) cleanNoteFromStorageKey(k, targetId);
      }
    } catch {
      /* ignore */
    }
  }

  return updated;
}

export function clearAllLessonNotes(lessonTitle: string): SmartNote[] {
  try {
    if (typeof window !== "undefined") {
      const key = `nafath_smart_notes_${lessonTitle.trim()}`;
      localStorage.removeItem(key);

      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (
          k &&
          k.startsWith("nafath_smart_notes_") &&
          (k.includes(lessonTitle.trim()) ||
            lessonTitle.trim().includes(k.replace("nafath_smart_notes_", "")))
        ) {
          localStorage.removeItem(k);
        }
      }
    }
  } catch {
    /* ignore */
  }
  return [];
}
