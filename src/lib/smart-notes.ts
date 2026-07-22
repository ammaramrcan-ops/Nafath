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
  const existing = getLessonNotes(lessonTitle);
  const updated = existing.filter((n) => n.id !== noteId);
  try {
    const key = `nafath_smart_notes_${lessonTitle.trim()}`;
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    /* ignore */
  }
  return updated;
}
