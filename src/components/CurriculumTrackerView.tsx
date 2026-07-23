import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  GraduationCap,
  TrendingUp,
  Edit3,
  Save,
  X,
  Settings2,
  Sparkles,
  RotateCcw,
} from "lucide-react";

import {
  getCurriculum,
  addSubject as addCurriculumSubject,
  deleteSubject as deleteCurriculumSubject,
} from "@/lib/curriculum";
import { getLibrary } from "@/lib/lesson-library";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TrackedLesson {
  id: string;
  title: string;
  done: boolean;
}

interface TrackedSubject {
  id: string;
  name: string;
  color: string;
  icon: string;
  lessons: TrackedLesson[];
  expanded: boolean;
}

const STORAGE_KEY = "nafath.curriculumTracker";
const SUBJECT_COLORS = [
  "#9d4300", "#8127cf", "#0b6e4f", "#1a56db", "#c0392b",
  "#d35400", "#16a085", "#8e44ad",
];
const SUBJECT_ICONS = ["📖", "🔬", "🧠", "📐", "🌿", "⚖️", "🕌", "📜"];

function loadData(): TrackedSubject[] {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const savedTracked: TrackedSubject[] = raw ? JSON.parse(raw) : [];

    const curriculumSubjects = typeof window !== "undefined" ? getCurriculum().subjects : [];
    const libraryLessons = typeof window !== "undefined" ? getLibrary() : [];

    const result: TrackedSubject[] = [];
    const processedSubjectIds = new Set<string>();

    curriculumSubjects.forEach((sub, index) => {
      processedSubjectIds.add(sub.id);

      const matchingSaved = savedTracked.find(
        (t) => t.id === sub.id || t.name.trim() === sub.name.trim()
      );

      const existingLessons = matchingSaved?.lessons || [];
      const lessonTitlesSet = new Set(existingLessons.map((l) => l.title.trim()));
      const mergedLessons: TrackedLesson[] = [...existingLessons];

      sub.units.forEach((unit) => {
        if (!lessonTitlesSet.has(unit.name.trim())) {
          lessonTitlesSet.add(unit.name.trim());
          mergedLessons.push({
            id: unit.id || uid(),
            title: unit.name,
            done: false,
          });
        }
      });

      libraryLessons.forEach((libLesson) => {
        const isMatch =
          libLesson.subjectId === sub.id ||
          (sub.name.includes("فقه") && libLesson.subjectId === "fiqh") ||
          (sub.name.includes("فقه") && libLesson.title.includes("خُلع")) ||
          sub.units.some((u) => u.lessonIds.includes(libLesson.id));

        if (isMatch && !lessonTitlesSet.has(libLesson.title.trim())) {
          lessonTitlesSet.add(libLesson.title.trim());
          mergedLessons.push({
            id: libLesson.id || uid(),
            title: libLesson.title,
            done: false,
          });
        }
      });

      result.push({
        id: sub.id,
        name: sub.name,
        color: matchingSaved?.color || SUBJECT_COLORS[index % SUBJECT_COLORS.length],
        icon: sub.emoji || matchingSaved?.icon || SUBJECT_ICONS[index % SUBJECT_ICONS.length],
        lessons: mergedLessons,
        expanded: matchingSaved?.expanded ?? true,
      });
    });

    savedTracked.forEach((saved) => {
      if (!processedSubjectIds.has(saved.id) && !result.some((r) => r.name.trim() === saved.name.trim())) {
        result.push(saved);
        try {
          addCurriculumSubject(saved.name, "عامة", undefined, saved.icon);
        } catch {}
      }
    });

    return result;
  } catch {
    return [];
  }
}

function saveData(data: TrackedSubject[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function CurriculumTrackerView() {
  const [subjects, setSubjects] = useState<TrackedSubject[]>(loadData);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [quickTaskSubjectId, setQuickTaskSubjectId] = useState("");
  const [quickTaskTitle, setQuickTaskTitle] = useState("");

  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectColor, setNewSubjectColor] = useState(SUBJECT_COLORS[0]);
  const [newSubjectIcon, setNewSubjectIcon] = useState(SUBJECT_ICONS[0]);

  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editingSubjectName, setEditingSubjectName] = useState("");

  const [addingLessonForId, setAddingLessonForId] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState("");

  useEffect(() => {
    setSubjects(loadData());
  }, []);

  function persist(updated: TrackedSubject[]) {
    setSubjects(updated);
    saveData(updated);
  }

  // ── Overall stats ──
  const totalLessons = subjects.reduce((a, s) => a + s.lessons.length, 0);
  const doneLessons = subjects.reduce((a, s) => a + s.lessons.filter((l) => l.done).length, 0);
  const overallPercent = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;

  // ── Settings & Task Actions ──
  function clearCompletedLessons() {
    persist(
      subjects.map((s) => ({
        ...s,
        lessons: s.lessons.filter((l) => !l.done),
      }))
    );
  }

  function addQuickTask() {
    if (!quickTaskTitle.trim()) return;
    const targetSubId = quickTaskSubjectId || subjects[0]?.id;
    if (!targetSubId) return;

    const lesson: TrackedLesson = { id: uid(), title: quickTaskTitle.trim(), done: false };
    persist(
      subjects.map((s) =>
        s.id === targetSubId ? { ...s, lessons: [...s.lessons, lesson], expanded: true } : s
      )
    );
    setQuickTaskTitle("");
  }

  // ── Subject actions ──
  function addSubject() {
    if (!newSubjectName.trim()) return;
    let newId = uid();
    try {
      const added = addCurriculumSubject(newSubjectName.trim(), "عامة", undefined, newSubjectIcon);
      newId = added.id;
    } catch {}

    const s: TrackedSubject = {
      id: newId,
      name: newSubjectName.trim(),
      color: newSubjectColor,
      icon: newSubjectIcon,
      lessons: [],
      expanded: true,
    };
    persist([...subjects, s]);
    setNewSubjectName("");
    setShowAddSubject(false);
  }

  function deleteSubject(id: string) {
    try {
      deleteCurriculumSubject(id);
    } catch {}
    persist(subjects.filter((s) => s.id !== id));
  }

  function toggleExpand(id: string) {
    persist(subjects.map((s) => (s.id === id ? { ...s, expanded: !s.expanded } : s)));
  }

  function startEditSubject(s: TrackedSubject) {
    setEditingSubjectId(s.id);
    setEditingSubjectName(s.name);
  }

  function saveEditSubject(id: string) {
    if (!editingSubjectName.trim()) return;
    persist(subjects.map((s) => (s.id === id ? { ...s, name: editingSubjectName.trim() } : s)));
    setEditingSubjectId(null);
  }

  // ── Lesson actions ──
  function addLesson(subjectId: string) {
    if (!newLessonTitle.trim()) return;
    const lesson: TrackedLesson = { id: uid(), title: newLessonTitle.trim(), done: false };
    persist(
      subjects.map((s) =>
        s.id === subjectId ? { ...s, lessons: [...s.lessons, lesson] } : s
      )
    );
    setNewLessonTitle("");
    setAddingLessonForId(null);
  }

  function toggleLesson(subjectId: string, lessonId: string) {
    persist(
      subjects.map((s) =>
        s.id === subjectId
          ? {
              ...s,
              lessons: s.lessons.map((l) =>
                l.id === lessonId ? { ...l, done: !l.done } : l
              ),
            }
          : s
      )
    );
  }

  function deleteLesson(subjectId: string, lessonId: string) {
    persist(
      subjects.map((s) =>
        s.id === subjectId
          ? { ...s, lessons: s.lessons.filter((l) => l.id !== lessonId) }
          : s
      )
    );
  }

  return (
    <div className="mx-auto w-full max-w-[900px] px-6 py-10 space-y-10" dir="rtl">
      {/* ── Header ── */}
      <section className="flex items-start justify-between gap-4 text-right">
        <div className="space-y-3 cursor-pointer group" onClick={() => setShowSettingsModal(true)}>
          <div>
            <span className="px-4 py-1.5 rounded-full bg-[#ffdbca]/40 text-[#9d4300] font-extrabold text-xs group-hover:bg-[#ffdbca]/70 transition">
              متابعة الإنجاز والمهام ⚙️ (انقر لفتح الإعدادات)
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0b1c30] group-hover:text-[#9d4300] transition">
            تتبع المنهج والدروس 📚
          </h1>
          <p className="text-sm text-[#584237]/80 leading-relaxed max-w-xl">
            أضف مواد دراستك ومهامك اليومية، وتابع إنجازك درساً درساً حتى إتمام المنهج كاملاً.
          </p>
        </div>

        <button
          onClick={() => setShowSettingsModal(true)}
          className="p-3 bg-white border border-[#e0c0b1]/50 rounded-2xl hover:bg-[#eff4ff] text-[#9d4300] transition cursor-pointer shadow-xs flex items-center gap-2 text-xs font-extrabold shrink-0"
          title="إعدادات وتنظيم المهام"
        >
          <Settings2 className="h-5 w-5 text-[#9d4300]" />
          <span className="hidden sm:inline-block">إعدادات المهام ⚙️</span>
        </button>
      </section>

      {/* ── Settings Gear Modal ── */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] border border-[#e0c0b1]/50 p-6 sm:p-8 max-w-lg w-full max-h-[88vh] overflow-y-auto shadow-2xl space-y-6 text-right"
              dir="rtl"
            >
              <div className="flex items-center justify-between border-b border-[#e0c0b1]/30 pb-4 sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2.5 text-[#0b1c30] font-extrabold text-lg">
                  <Settings2 className="h-5 w-5 text-[#9d4300]" />
                  <span>إعدادات وتنظيم المهام والدروس ⚙️</span>
                </div>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="p-2 rounded-xl text-[#584237] hover:bg-[#eff4ff] transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* 1. Quick Task Add Form */}
              <div className="space-y-3 bg-[#eff4ff]/60 p-5 rounded-2xl border border-[#e0c0b1]/30">
                <span className="text-xs font-extrabold text-[#9d4300] block">⚡ إضافة مهمة/درس سريع مخصص</span>
                <div className="space-y-2">
                  <select
                    value={quickTaskSubjectId || (subjects[0]?.id ?? "")}
                    onChange={(e) => setQuickTaskSubjectId(e.target.value)}
                    className="w-full border border-[#e0c0b1]/60 rounded-xl px-3 py-2 text-xs font-bold text-[#0b1c30] bg-white focus:outline-none"
                  >
                    {subjects.length === 0 ? (
                      <option value="">لا توجد مواد — أضف مادة أولاً بالأسفل</option>
                    ) : (
                      subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.icon} {s.name}
                        </option>
                      ))
                    )}
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="اسم المهمة أو الدرس الجديد..."
                      value={quickTaskTitle}
                      onChange={(e) => setQuickTaskTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addQuickTask()}
                      className="flex-1 border border-[#e0c0b1]/60 rounded-xl px-4 py-2 text-xs font-bold text-[#0b1c30] bg-white focus:outline-none"
                    />
                    <button
                      onClick={addQuickTask}
                      disabled={!quickTaskTitle.trim() || subjects.length === 0}
                      className="px-4 py-2 bg-[#9d4300] text-white rounded-xl text-xs font-extrabold hover:bg-[#833800] disabled:opacity-40 transition cursor-pointer"
                    >
                      إضافة المهمة
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Add New Subject Form */}
              <div className="space-y-3 bg-amber-50/60 p-5 rounded-2xl border border-amber-200/60">
                <span className="text-xs font-extrabold text-amber-950 block">➕ إضافة مادة دراسية جديدة</span>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="اسم المادة الدراسية (مثل: التاريخ، الأحياء...)"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    className="w-full border border-amber-200 rounded-xl px-4 py-2 text-xs font-bold text-[#0b1c30] bg-white focus:outline-none"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                      {SUBJECT_ICONS.map((ico) => (
                        <button
                          key={ico}
                          type="button"
                          onClick={() => setNewSubjectIcon(ico)}
                          className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition cursor-pointer ${
                            newSubjectIcon === ico ? "bg-amber-200 border border-amber-400 scale-110" : "bg-white border border-slate-200"
                          }`}
                        >
                          {ico}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addSubject}
                      disabled={!newSubjectName.trim()}
                      className="px-4 py-2 bg-amber-800 text-white rounded-xl text-xs font-extrabold hover:bg-amber-900 disabled:opacity-40 transition cursor-pointer"
                    >
                      إضافة المادة
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. List of Subjects and Tasks with Individual Deletion */}
              <div className="space-y-3">
                <span className="text-xs font-extrabold text-[#0b1c30] block">📋 قائمة المواد والمهام الحالية (تعديل وإزالة)</span>
                {subjects.length === 0 ? (
                  <div className="p-4 text-center text-xs font-bold text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                    لا توجد مواد مضافة حالياً.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {subjects.map((s) => (
                      <div key={s.id} className="rounded-2xl border border-slate-200 p-3.5 bg-white space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{s.icon}</span>
                            <span className="text-xs font-extrabold text-[#0b1c30]">{s.name}</span>
                            <span className="text-[10px] font-bold text-slate-400">({s.lessons.length} درس)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteSubject(s.id)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="حذف المادة بالكامل"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Lessons list */}
                        {s.lessons.length > 0 && (
                          <div className="space-y-1 pt-1 border-t border-slate-100 pr-2">
                            {s.lessons.map((l) => (
                              <div key={l.id} className="flex items-center justify-between text-[11px] font-bold py-1 px-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700">
                                <span className={l.done ? "line-through text-slate-400" : ""}>{l.title}</span>
                                <button
                                  type="button"
                                  onClick={() => deleteLesson(s.id, l.id)}
                                  className="p-1 text-rose-500 hover:bg-rose-100 rounded-md transition cursor-pointer"
                                  title="حذف هذه المهمة"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Clear Completed Tasks */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <button
                  onClick={clearCompletedLessons}
                  disabled={doneLessons === 0}
                  className="w-full py-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-extrabold hover:bg-amber-100 disabled:opacity-40 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4 text-amber-700" />
                  <span>تنظيف والمسح السريع للدروس المنجزة ({doneLessons})</span>
                </button>
              </div>

              {/* Close Button */}
              <div className="pt-2">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-full py-3 bg-[#0b1c30] text-white rounded-2xl text-xs font-extrabold hover:bg-[#213145] transition cursor-pointer"
                >
                  حفظ وإغلاق الإعدادات
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Overall progress ── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="sm:col-span-1 bg-white border border-[#e0c0b1]/40 rounded-[2rem] p-6 flex flex-col items-center justify-center text-center shadow-xs">
          <div className="relative w-28 h-28 mb-3">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-[#eff4ff]"
                strokeDasharray="100, 100"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[#9d4300] transition-all duration-700 ease-out"
                strokeDasharray={`${overallPercent}, 100`}
                strokeLinecap="round"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-extrabold text-[#0b1c30]">
              {overallPercent}%
            </span>
          </div>
          <p className="text-xs font-bold text-[#584237]/80">التقدم الكلي</p>
        </div>

        <div className="bg-[#eff4ff] rounded-[2rem] p-6 flex flex-col justify-between shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#9d4300]/10 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-[#9d4300]" />
            </div>
            <span className="text-xs font-bold text-[#584237]/80">المواد المضافة</span>
          </div>
          <span className="text-4xl font-extrabold text-[#0b1c30]">{subjects.length}</span>
          <span className="text-xs font-semibold text-[#584237]/70 mt-1">مادة دراسية</span>
        </div>

        <div className="bg-white border border-[#e0c0b1]/40 rounded-[2rem] p-6 flex flex-col justify-between shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-[#584237]/80">الدروس المنجزة</span>
          </div>
          <span className="text-4xl font-extrabold text-emerald-600">
            {doneLessons}
            <span className="text-lg text-[#584237]/50 font-bold"> / {totalLessons}</span>
          </span>
          <span className="text-xs font-semibold text-[#584237]/70 mt-1">درس مكتمل</span>
        </div>
      </section>

      {/* ── Subjects list ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-[#0b1c30]">المواد الدراسية</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 bg-[#eff4ff] text-[#9d4300] hover:bg-[#dce9ff] rounded-full transition cursor-pointer shadow-xs border border-[#e0c0b1]/30"
              title="إعدادات المهام ⚙️"
            >
              <Settings2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowAddSubject(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#9d4300] text-white rounded-full text-xs font-extrabold hover:bg-[#833800] transition cursor-pointer shadow-md"
            >
              <Plus className="h-4 w-4" />
              إضافة مادة
            </button>
          </div>
        </div>

        {/* Add Subject Form */}
        <AnimatePresence>
          {showAddSubject && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white border border-[#e0c0b1]/60 rounded-[2rem] p-6 space-y-4 shadow-md"
            >
              <h3 className="font-extrabold text-[#0b1c30]">إضافة مادة جديدة</h3>
              <input
                type="text"
                placeholder="اسم المادة (مثل: الفقه الإسلامي)"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSubject()}
                className="w-full border border-[#e0c0b1]/60 rounded-2xl px-4 py-3 text-sm font-semibold text-[#0b1c30] focus:outline-none focus:border-[#9d4300] bg-[#f8f9ff]"
                autoFocus
              />
              <div className="flex flex-wrap gap-3">
                <div className="flex gap-2 flex-wrap">
                  {SUBJECT_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewSubjectColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition cursor-pointer ${newSubjectColor === c ? "border-[#0b1c30] scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {SUBJECT_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setNewSubjectIcon(icon)}
                      className={`w-8 h-8 rounded-xl text-base flex items-center justify-center transition cursor-pointer ${newSubjectIcon === icon ? "bg-[#eff4ff] scale-110 ring-2 ring-[#9d4300]" : "hover:bg-[#eff4ff]"}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={addSubject}
                  className="flex-1 py-3 bg-[#9d4300] text-white rounded-2xl font-extrabold text-sm hover:bg-[#833800] transition cursor-pointer"
                >
                  إضافة
                </button>
                <button
                  onClick={() => { setShowAddSubject(false); setNewSubjectName(""); }}
                  className="px-6 py-3 border border-[#e0c0b1]/60 text-[#584237] rounded-2xl font-bold text-sm hover:bg-[#eff4ff] transition cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {subjects.length === 0 && !showAddSubject && (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-[#e0c0b1]/60 rounded-[2rem] bg-white/70 text-center">
            <BookOpen className="w-14 h-14 text-[#9d4300]/40 mb-4" />
            <p className="text-lg font-bold text-[#0b1c30]">لم تُضف أي مواد بعد</p>
            <p className="text-sm text-[#584237]/70 mt-1">ابدأ بإضافة مادتك الأولى لتتبع تقدمك</p>
          </div>
        )}

        <div className="space-y-4">
          {subjects.map((subject) => {
            const subjectDone = subject.lessons.filter((l) => l.done).length;
            const subjectTotal = subject.lessons.length;
            const subjectPercent = subjectTotal > 0 ? Math.round((subjectDone / subjectTotal) * 100) : 0;

            return (
              <motion.div
                key={subject.id}
                layout
                className="bg-white border border-[#e0c0b1]/40 rounded-[2rem] shadow-xs overflow-hidden"
              >
                {/* Subject header */}
                <div className="flex items-center justify-between p-5 gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                      style={{ backgroundColor: subject.color + "22" }}
                    >
                      {subject.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingSubjectId === subject.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingSubjectName}
                            onChange={(e) => setEditingSubjectName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && saveEditSubject(subject.id)}
                            className="border border-[#e0c0b1] rounded-xl px-3 py-1 text-sm font-bold focus:outline-none focus:border-[#9d4300] bg-[#f8f9ff]"
                            autoFocus
                          />
                          <button onClick={() => saveEditSubject(subject.id)} className="text-emerald-600 cursor-pointer"><Save className="h-4 w-4" /></button>
                          <button onClick={() => setEditingSubjectId(null)} className="text-[#584237] cursor-pointer"><X className="h-4 w-4" /></button>
                        </div>
                      ) : (
                        <p
                          onClick={() => {
                            setQuickTaskSubjectId(subject.id);
                            setShowSettingsModal(true);
                          }}
                          className="font-extrabold text-[#0b1c30] truncate hover:text-[#9d4300] transition cursor-pointer"
                          title="انقر لإضافة دروس/مهام أو تعديل الإعدادات ⚙️"
                        >
                          {subject.name}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex-1 bg-[#eff4ff] rounded-full h-1.5 max-w-[140px]">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${subjectPercent}%`, backgroundColor: subject.color }}
                          />
                        </div>
                        <span className="text-xs font-bold text-[#584237]/70">
                          {subjectDone}/{subjectTotal} درس
                        </span>
                        <span
                          className="text-xs font-extrabold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: subject.color + "22", color: subject.color }}
                        >
                          {subjectPercent}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setQuickTaskSubjectId(subject.id);
                        setShowSettingsModal(true);
                      }}
                      className="p-2 text-[#9d4300] hover:bg-[#eff4ff] rounded-xl transition cursor-pointer"
                      title="إعدادات المادة والدروس ⚙️"
                    >
                      <Settings2 className="h-4 w-4 text-[#9d4300]" />
                    </button>
                    <button
                      onClick={() => startEditSubject(subject)}
                      className="p-2 text-[#584237] hover:text-[#9d4300] hover:bg-[#eff4ff] rounded-xl transition cursor-pointer"
                      title="تعديل المادة"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteSubject(subject.id)}
                      className="p-2 text-[#584237] hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                      title="حذف المادة"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleExpand(subject.id)}
                      className="p-2 text-[#584237] hover:bg-[#eff4ff] rounded-xl transition cursor-pointer"
                    >
                      {subject.expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Lessons list */}
                <AnimatePresence>
                  {subject.expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-2 border-t border-[#e0c0b1]/30 pt-4">
                        {subject.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-[#f8f9ff] transition group"
                          >
                            <button
                              onClick={() => toggleLesson(subject.id, lesson.id)}
                              className="shrink-0 cursor-pointer"
                            >
                              {lesson.done ? (
                                <CheckCircle2 className="h-5 w-5" style={{ color: subject.color }} />
                              ) : (
                                <Circle className="h-5 w-5 text-[#e0c0b1]" />
                              )}
                            </button>
                            <span
                              className={`flex-1 text-sm font-semibold text-[#0b1c30] ${lesson.done ? "line-through opacity-50" : ""}`}
                            >
                              {lesson.title}
                            </span>
                            <button
                              onClick={() => deleteLesson(subject.id, lesson.id)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-[#584237] hover:text-red-600 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}

                        {/* Add Lesson */}
                        {addingLessonForId === subject.id ? (
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              type="text"
                              placeholder="عنوان الدرس"
                              value={newLessonTitle}
                              onChange={(e) => setNewLessonTitle(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && addLesson(subject.id)}
                              className="flex-1 border border-[#e0c0b1]/60 rounded-2xl px-4 py-2 text-sm font-semibold focus:outline-none focus:border-[#9d4300] bg-[#f8f9ff]"
                              autoFocus
                            />
                            <button
                              onClick={() => addLesson(subject.id)}
                              className="px-4 py-2 bg-[#9d4300] text-white rounded-2xl text-xs font-extrabold hover:bg-[#833800] transition cursor-pointer"
                            >
                              إضافة
                            </button>
                            <button
                              onClick={() => { setAddingLessonForId(null); setNewLessonTitle(""); }}
                              className="px-3 py-2 border border-[#e0c0b1]/60 text-[#584237] rounded-2xl text-xs font-bold hover:bg-[#eff4ff] transition cursor-pointer"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddingLessonForId(subject.id)}
                            className="flex items-center gap-2 mt-2 px-4 py-2 text-xs font-bold text-[#9d4300] hover:bg-[#eff4ff] rounded-2xl transition cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            إضافة درس
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
