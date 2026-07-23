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
  try {
    const key = `nafath_smart_notes_${lessonTitle.trim()}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSmartNote(note: Omit<SmartNote, "id" | "createdAt">): SmartNote {
  const existing = getLessonNotes(note.lessonTitle);
  const newNote: SmartNote = {
    ...note,
    id: `${Date.now()}-${Math.random()}`,
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

  try {
    if (typeof window !== "undefined") {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("nafath_smart_notes_")) {
          const raw = localStorage.getItem(k);
          if (raw) {
            const arr: SmartNote[] = JSON.parse(raw);
            if (Array.isArray(arr) && arr.some((n) => String(n.id).trim() === targetId)) {
              const cleaned = arr.filter((n) => String(n.id).trim() !== targetId);
              localStorage.setItem(k, JSON.stringify(cleaned));
            }
          }
        }
      }
    }
  } catch {
    /* ignore */
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
          (k.includes(lessonTitle.trim()) || lessonTitle.trim().includes(k.replace("nafath_smart_notes_", "")))
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
