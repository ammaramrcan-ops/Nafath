// Curriculum: Subjects → Units → Lessons (lessons stored in lesson-library by id)
// Persisted to localStorage. Lessons not assigned to any unit live in "uncategorized".

const KEY = "nafath.curriculum.v1";

export type Unit = {
  id: string;
  name: string;
  createdAt: string;
  lessonIds: string[]; // ids referencing SavedLesson.id
};

export type Subject = {
  id: string;
  name: string;
  emoji?: string;
  createdAt: string;
  units: Unit[];
};

export type Curriculum = {
  subjects: Subject[];
};

function read(): Curriculum {
  if (typeof window === "undefined") return { subjects: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { subjects: [] };
    const parsed = JSON.parse(raw) as Curriculum;
    return { subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [] };
  } catch {
    return { subjects: [] };
  }
}

function write(c: Curriculum) {
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* ignore */
  }
}

export function getCurriculum(): Curriculum {
  return read();
}

export function getSubject(subjectId: string): Subject | undefined {
  return read().subjects.find((s) => s.id === subjectId);
}

export function getUnit(subjectId: string, unitId: string): Unit | undefined {
  return getSubject(subjectId)?.units.find((u) => u.id === unitId);
}

export function addSubject(name: string, emoji?: string): Subject {
  const c = read();
  const subject: Subject = {
    id: `sub-${Date.now()}`,
    name: name.trim() || "مادة جديدة",
    emoji,
    createdAt: new Date().toISOString(),
    units: [],
  };
  c.subjects.unshift(subject);
  write(c);
  return subject;
}

export function deleteSubject(subjectId: string) {
  const c = read();
  c.subjects = c.subjects.filter((s) => s.id !== subjectId);
  write(c);
}

export function renameSubject(subjectId: string, name: string) {
  const c = read();
  const s = c.subjects.find((s) => s.id === subjectId);
  if (s) {
    s.name = name.trim() || s.name;
    write(c);
  }
}

export function addUnit(subjectId: string, name: string): Unit | null {
  const c = read();
  const s = c.subjects.find((s) => s.id === subjectId);
  if (!s) return null;
  const unit: Unit = {
    id: `unit-${Date.now()}`,
    name: name.trim() || "وحدة جديدة",
    createdAt: new Date().toISOString(),
    lessonIds: [],
  };
  s.units.unshift(unit);
  write(c);
  return unit;
}

export function deleteUnit(subjectId: string, unitId: string) {
  const c = read();
  const s = c.subjects.find((s) => s.id === subjectId);
  if (!s) return;
  s.units = s.units.filter((u) => u.id !== unitId);
  write(c);
}

export function renameUnit(subjectId: string, unitId: string, name: string) {
  const c = read();
  const u = c.subjects.find((s) => s.id === subjectId)?.units.find((u) => u.id === unitId);
  if (u) {
    u.name = name.trim() || u.name;
    write(c);
  }
}

export function addLessonToUnit(subjectId: string, unitId: string, lessonId: string) {
  const c = read();
  const u = c.subjects.find((s) => s.id === subjectId)?.units.find((u) => u.id === unitId);
  if (u && !u.lessonIds.includes(lessonId)) {
    u.lessonIds.push(lessonId);
    write(c);
  }
}

export function removeLessonFromUnit(subjectId: string, unitId: string, lessonId: string) {
  const c = read();
  const u = c.subjects.find((s) => s.id === subjectId)?.units.find((u) => u.id === unitId);
  if (u) {
    u.lessonIds = u.lessonIds.filter((id) => id !== lessonId);
    write(c);
  }
}

/** Returns set of all lesson ids that belong to some unit. */
export function getAssignedLessonIds(): Set<string> {
  const ids = new Set<string>();
  for (const s of read().subjects) {
    for (const u of s.units) {
      for (const id of u.lessonIds) ids.add(id);
    }
  }
  return ids;
}
