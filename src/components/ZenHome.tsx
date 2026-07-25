import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Settings,
  BookOpen,
  Plus,
  Trash2,
  Pencil,
  BarChart2,
  FolderOpen,
  Sparkles,
  Home,
  Brain,
  CheckSquare,
  Square,
  FileText,
  Clock,
  Tag,
  Play,
  X,
  ChevronLeft,
} from "lucide-react";
import { getLibrary, deleteFromLibrary, type SavedLesson } from "@/lib/lesson-library";
import { type Lesson } from "@/lib/lesson-data";
import { getCurriculum, type Subject } from "@/lib/curriculum";
import { getStoredSmartCards } from "@/lib/spaced-repetition";
import { SettingsDialog } from "@/components/SettingsDialog";
import { RestoreDialog } from "@/components/RestoreDialog";
import { CategorizeLessonModal } from "@/components/CategorizeLessonModal";
import { toast } from "sonner";

// ── Helpers ──────────────────────────────────────────────────────────────────
const CURRICULUM_KEY = "nafath.curriculumTracker";

interface TrackedLesson { id: string; title: string; done: boolean; }
interface TrackedSubject { id: string; name: string; lessons: TrackedLesson[]; }

function loadCurriculumProgress(): { percent: number; done: number; total: number } {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(CURRICULUM_KEY) : null;
    if (!raw) return { percent: 0, done: 0, total: 0 };
    const subjects: TrackedSubject[] = JSON.parse(raw);
    const total = subjects.reduce((a, s) => a + s.lessons.length, 0);
    const done  = subjects.reduce((a, s) => a + s.lessons.filter((l) => l.done).length, 0);
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { percent, done, total };
  } catch {
    return { percent: 0, done: 0, total: 0 };
  }
}

function loadFlashcardStats(): { reviewed: number; total: number; percent: number } {
  try {
    const cards = getStoredSmartCards();
    const total = cards.length;
    const reviewed = cards.filter(
      (c) => c.stats?.lastReviewDate && c.stats.lastReviewDate > 0
    ).length;
    const percent = total > 0 ? Math.round((reviewed / total) * 100) : 0;
    return { reviewed, total, percent };
  } catch {
    return { reviewed: 0, total: 0, percent: 0 };
  }
}

interface RealTaskItem {
  id: string;
  subjectId: string;
  title: string;
  completed: boolean;
  subjectName: string;
}

function loadRealTasks(): RealTaskItem[] {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(CURRICULUM_KEY) : null;
    if (!raw) return [];
    const subjects: TrackedSubject[] = JSON.parse(raw);
    const list: RealTaskItem[] = [];
    subjects.forEach((s) => {
      s.lessons.forEach((l) => {
        list.push({ id: l.id, subjectId: s.id, title: l.title, completed: l.done, subjectName: s.name });
      });
    });
    return list;
  } catch {
    return [];
  }
}

function toggleRealTask(subjectId: string, lessonId: string) {
  try {
    const raw = localStorage.getItem(CURRICULUM_KEY);
    if (!raw) return;
    const subjects: TrackedSubject[] = JSON.parse(raw);
    const updated = subjects.map((s) =>
      s.id === subjectId
        ? {
            ...s,
            lessons: s.lessons.map((l) => (l.id === lessonId ? { ...l, done: !l.done } : l)),
          }
        : s
    );
    localStorage.setItem(CURRICULUM_KEY, JSON.stringify(updated));
  } catch {}
}

export function ZenHome({ onOpenLesson }: { onOpenLesson: (lesson: Lesson) => void }) {
  const [library, setLibrary] = useState<SavedLesson[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [categorizeModalOpen, setCategorizeModalOpen] = useState(false);
  const [selectedLessonForCat, setSelectedLessonForCat] = useState<SavedLesson | null>(null);
  const [showFlashcardPicker, setShowFlashcardPicker] = useState(false);
  const [realTasks, setRealTasks] = useState<RealTaskItem[]>(() => loadRealTasks());

  const [curriculumStats, setCurriculumStats] = useState(() => loadCurriculumProgress());
  const [flashcardStats, setFlashcardStats]   = useState(() => loadFlashcardStats());

  const navigate = useNavigate();

  const refresh = () => {
    setLibrary(getLibrary());
    setSubjects(getCurriculum().subjects);
    setCurriculumStats(loadCurriculumProgress());
    setFlashcardStats(loadFlashcardStats());
    setRealTasks(loadRealTasks());
  };

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const handleToggleTask = (subjectId: string, lessonId: string) => {
    toggleRealTask(subjectId, lessonId);
    refresh();
  };

  const totalSubjectsCount = subjects.length;

  // Derived
  const circumference = 2 * Math.PI * 46; // r=46
  const curriculumOffset = circumference - (curriculumStats.percent / 100) * circumference;

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] antialiased flex flex-col items-center">
      {/* Top Header Bar */}
      <header className="flex justify-between items-center w-full px-8 md:px-16 h-20 fixed top-0 z-50 bg-[#f8f9ff]/85 backdrop-blur-md border-b border-[#e0c0b1]/30">
        <div className="flex items-center gap-10">
          <div
            onClick={() => navigate({ to: "/" })}
            className="text-3xl font-extrabold text-[#0b1c30] cursor-pointer tracking-tight"
          >
            نفاذ
          </div>
          <nav className="flex items-center gap-6 sm:gap-8">
            <button
              onClick={() => navigate({ to: "/" })}
              className="text-base font-bold text-[#0b1c30] cursor-pointer hover:text-[#9d4300] transition-colors"
            >
              الرئيسية
            </button>
            <button
              onClick={() => navigate({ to: "/subjects" })}
              className="text-base font-semibold text-[#584237] hover:text-[#9d4300] transition-colors cursor-pointer"
            >
              المواد
            </button>
            <button
              onClick={() => navigate({ to: "/interactive-exams" })}
              className="text-base font-semibold text-[#584237] hover:text-[#9d4300] transition-colors cursor-pointer"
            >
              الاختبارات
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-[#9d4300]">
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer text-[#584237] hover:text-[#9d4300]"
            aria-label="الإعدادات"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Canvas Container (Expanded Max Width for Generous Layout) */}
      <main className="w-full max-w-[85vw] mx-auto px-6 md:px-12 pt-28 pb-32 md:pb-20 flex-grow">
        {/* Welcome Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#0b1c30] mb-3 tracking-tight">أهلاً بك</h1>
          <p className="text-base md:text-lg text-[#584237]/80 font-medium">منصتك الذكية للتعلم التكيفي والمراجعة السريعة</p>
        </section>

        {/* Section 1: Active Subjects (Dynamic & Scaled Up) */}
        <section className="mb-14 w-full">
          <div className="flex justify-between items-center mb-6 border-b border-[#e0c0b1]/30 pb-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-[#9d4300]" />
              <h2 className="text-2xl font-bold text-[#0b1c30]">المواد الدراسية النشطة</h2>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate({ to: "/subjects" })}
                className="text-sm font-bold text-[#9d4300] bg-[#9d4300]/10 hover:bg-[#9d4300]/20 px-4 py-2 rounded-full transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                إضافة مادة
              </button>
              {totalSubjectsCount > 0 && (
                <button
                  onClick={() => navigate({ to: "/subjects" })}
                  className="text-sm font-bold text-[#9d4300] hover:underline cursor-pointer"
                >
                  عرض الكل ({totalSubjectsCount})
                </button>
              )}
            </div>
          </div>

          {subjects.length === 0 ? (
            <div
              onClick={() => navigate({ to: "/subjects" })}
              className="flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed border-[#e0c0b1]/60 bg-white/70 text-center cursor-pointer hover:border-[#9d4300] transition-colors"
            >
              <FolderOpen className="w-12 h-12 text-[#9d4300]/50 mb-3" />
              <p className="text-lg font-bold text-[#0b1c30]">لا توجد مواد دراسية مضافة حتى الآن</p>
              <p className="text-sm text-[#584237]/80 mt-1">اضغط هنا لإضافة مادتك الأولى وتنظيم دروسك</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subjects.slice(0, 3).map((sub) => {
                const lessonCount = library.filter((l) => l.subjectId === sub.id).length;
                return (
                  <div
                    key={sub.id}
                    onClick={() =>
                      navigate({ to: "/subjects/$subjectId", params: { subjectId: sub.id } })
                    }
                    className="bg-white rounded-2xl p-7 border border-[#e0c0b1]/40 hover:border-[#9d4300]/50 transition-all shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[140px]"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-sm font-bold text-[#584237] bg-[#eff4ff] px-3 py-1 rounded-full">{sub.name}</span>
                      <Sparkles className="w-5 h-5 text-[#9d4300]" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-[#0b1c30] line-clamp-1">{sub.name}</p>
                      <p className="text-sm text-[#584237]/80 mt-1.5 font-medium">
                        {lessonCount} درس
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 2: Saved Lessons & Restore (Dynamic & Scaled Up - Removed "عرض الكل") */}
        <section className="mb-14 w-full">
          <div className="flex justify-between items-center mb-6 border-b border-[#e0c0b1]/30 pb-4">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-[#9d4300]" />
              <h2 className="text-2xl font-bold text-[#0b1c30]">الدروس المحفوظة</h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setRestoreOpen(true)}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#9d4300] bg-[#9d4300]/10 hover:bg-[#9d4300]/20 px-4 py-2 rounded-full transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                استرداد درس
              </button>
            </div>
          </div>

          {library.length === 0 ? (
            <div
              onClick={() => setRestoreOpen(true)}
              className="flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed border-[#e0c0b1]/60 bg-white/70 text-center cursor-pointer hover:border-[#9d4300] transition-colors"
            >
              <FileText className="w-12 h-12 text-[#9d4300]/50 mb-3" />
              <p className="text-lg font-bold text-[#0b1c30]">لا توجد دروس محملة في مكتبتك</p>
              <p className="text-sm text-[#584237]/80 mt-1">اضغط على "استرداد درس" لرفع ملف درس وابدأ المراجعة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {library.slice(0, 3).map((saved) => (
                <div
                  key={saved.id}
                  className="group relative bg-white rounded-2xl p-7 border border-[#e0c0b1]/40 hover:border-[#9d4300]/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between min-h-[150px]"
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#eff4ff] text-[#9d4300]">
                      درس
                    </span>
                    <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLessonForCat(saved);
                          setCategorizeModalOpen(true);
                        }}
                        className="p-1.5 text-[#584237] hover:text-[#f97316] rounded-lg hover:bg-black/5 transition cursor-pointer"
                        title="تصنيف الدرس"
                      >
                        <Tag className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          try {
                            localStorage.setItem("teacher.lesson.draft", JSON.stringify(saved.data));
                            navigate({ to: "/teacher" });
                          } catch (err) {
                            console.error("Failed to save draft:", err);
                          }
                        }}
                        className="p-1.5 text-[#584237] hover:text-[#9d4300] rounded-lg hover:bg-black/5 transition cursor-pointer"
                        title="تعديل في وضع المعلم"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFromLibrary(saved.id);
                          refresh();
                        }}
                        className="p-1.5 text-[#584237] hover:text-red-600 rounded-lg hover:bg-black/5 transition cursor-pointer"
                        title="حذف الدرس"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div
                    onClick={() => onOpenLesson(saved.data)}
                    className="cursor-pointer"
                  >
                    <p className="text-lg font-bold text-[#0b1c30] line-clamp-2 leading-snug">{saved.title}</p>
                    <p className="text-xs font-semibold text-[#584237]/80 mt-3 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      انقر للبدء بالمراجعة
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 3: Performance Stats (Scaled Up) */}
        <section className="mb-14 w-full">
          <div className="flex justify-between items-center mb-6 border-b border-[#e0c0b1]/30 pb-4">
            <div className="flex items-center gap-3">
              <BarChart2 className="w-6 h-6 text-[#9d4300]" />
              <h2 className="text-2xl font-bold text-[#0b1c30]">إحصائيات الأداء</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Curriculum Progress — reads real data from curriculumTracker */}
            <button
              onClick={() => navigate({ to: "/curriculum-tracker" })}
              className="bg-[#eff4ff] rounded-2xl p-7 flex flex-col items-center text-center hover:bg-[#dce9ff] transition-colors cursor-pointer group relative"
            >
              <div className="w-full flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-[#584237] group-hover:text-[#9d4300] transition-colors">
                  التقدم والمهام 📚
                </span>
                <span
                  title="إعدادات المهام والدروس"
                  className="p-1.5 rounded-lg bg-white/70 hover:bg-white text-[#9d4300] shadow-2xs transition"
                >
                  <Settings className="w-4 h-4 text-[#9d4300]" />
                </span>
              </div>
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60" cy="60" r="46"
                    stroke="currentColor"
                    strokeWidth="9"
                    fill="transparent"
                    className="text-[#e0c0b1]/30"
                  />
                  <circle
                    cx="60" cy="60" r="46"
                    stroke="currentColor"
                    strokeWidth="9"
                    fill="transparent"
                    strokeDasharray={`${circumference}`}
                    strokeDashoffset={`${curriculumOffset}`}
                    className="text-[#9d4300] transition-all duration-700"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-2xl font-extrabold text-[#0b1c30]">
                  {curriculumStats.percent}%
                </span>
              </div>
              {curriculumStats.total > 0 && (
                <span className="mt-2 text-xs font-semibold text-[#584237]/70">
                  {curriculumStats.done} / {curriculumStats.total} درس
                </span>
              )}
              {curriculumStats.total === 0 && (
                <span className="mt-2 text-xs font-semibold text-[#584237]/60">أضف دروسك لتتبع تقدمك</span>
              )}
              <span className="mt-2 text-xs font-bold text-[#9d4300] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <ChevronLeft className="h-3 w-3" />
                فتح متتبع المنهج
              </span>
            </button>

            {/* Flashcard Stats — reads real data from spaced repetition */}
            <div
              onClick={() => {
                sessionStorage.removeItem("nafath.spacedRepetition.filterSubjectId");
                sessionStorage.removeItem("nafath.spacedRepetition.filterSubjectName");
                navigate({ to: "/spaced-repetition" });
              }}
              className="bg-[#eff4ff] rounded-2xl p-7 flex flex-col justify-between cursor-pointer hover:bg-[#dce9ff] transition-colors"
            >
              <span className="text-sm font-bold text-[#584237] mb-2">إحصائيات الفلاش كارد</span>
              <div className="flex items-end gap-2 my-3">
                <span className="text-4xl font-extrabold text-[#9d4300]">
                  {flashcardStats.reviewed}
                </span>
                <span className="text-sm font-semibold text-[#584237] mb-1">
                  / {flashcardStats.total} بطاقة تمت مراجعتها
                </span>
              </div>
              <div className="w-full bg-[#e0c0b1]/30 h-2.5 rounded-full mt-3">
                <div
                  className="bg-[#9d4300] h-full rounded-full transition-all duration-500"
                  style={{ width: `${flashcardStats.percent}%` }}
                />
              </div>
              {flashcardStats.total === 0 && (
                <p className="text-xs text-[#584237]/60 mt-2">لم تبدأ مراجعة الفلاش كارد بعد</p>
              )}
            </div>
          </div>
        </section>

        {/* Section 4: Tasks and Study Tools (Scaled Up) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Tasks Section (Left) - Synced with Real Curriculum Tracker Tasks */}
          <section className="md:col-span-5 bg-[#eff4ff] rounded-2xl p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5 border-b border-[#e0c0b1]/30 pb-3">
                <h3 className="text-xl font-bold text-[#0b1c30] flex items-center gap-2.5">
                  <CheckSquare className="w-6 h-6 text-[#9d4300]" />
                  مهمات ودروس اليوم 📋
                </h3>
                <button
                  onClick={() => navigate({ to: "/curriculum-tracker" })}
                  className="text-xs font-bold text-[#9d4300] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>إدارة ⚙️</span>
                </button>
              </div>

              {realTasks.length === 0 ? (
                <div className="text-center py-6 space-y-3">
                  <p className="text-sm font-bold text-[#584237]/80">لا توجد مهام مضافة حالياً</p>
                  <button
                    onClick={() => navigate({ to: "/curriculum-tracker" })}
                    className="px-4 py-2 bg-[#9d4300] text-white rounded-full text-xs font-extrabold hover:bg-[#833800] transition cursor-pointer shadow-xs"
                  >
                    ➕ أضف مهامك ودروسك الأولى
                  </button>
                </div>
              ) : (
                <ul className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-1">
                  {realTasks.map((task) => (
                    <li
                      key={task.id}
                      onClick={() => handleToggleTask(task.subjectId, task.id)}
                      className="flex items-center justify-between gap-3.5 cursor-pointer select-none p-3 rounded-2xl bg-white border border-[#e0c0b1]/30 hover:bg-[#dce9ff] transition-all shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <button className="text-[#9d4300] cursor-pointer">
                          {task.completed ? (
                            <CheckSquare className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <Square className="w-5 h-5 text-[#584237]/60" />
                          )}
                        </button>
                        <div className="text-right">
                          <span
                            className={`text-sm font-bold text-[#0b1c30] block ${
                              task.completed ? "line-through opacity-50" : ""
                            }`}
                          >
                            {task.title}
                          </span>
                          <span className="text-[10px] font-semibold text-[#9d4300] bg-[#ffdbca]/40 px-2 py-0.5 rounded-md">
                            {task.subjectName}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Study Tools Banner (Right) */}
          <section className="md:col-span-7 flex flex-col">
            <div className="bg-[#9d4300] text-white rounded-2xl p-8 flex flex-col justify-between h-full min-h-[200px] relative overflow-hidden shadow-sm">
              <div className="relative z-10">
                <h3 className="text-3xl font-extrabold mb-3 flex items-center gap-3">
                  <Brain className="w-8 h-8" />
                  فلاش كارد
                </h3>
                <p className="text-base opacity-95 leading-relaxed">اختبر معلوماتك السريعة الآن وحسّن مستوى استرجاعك للدروس</p>
              </div>
              <button
                onClick={() => setShowFlashcardPicker(true)}
                className="bg-white text-[#9d4300] w-max px-7 py-2.5 rounded-full text-sm font-extrabold mt-6 relative z-10 hover:bg-slate-100 transition-all cursor-pointer shadow-md"
              >
                ابدأ المراجعة
              </button>
              <Brain className="absolute -bottom-8 -left-8 w-44 h-44 opacity-10 text-white pointer-events-none" />
            </div>
          </section>
        </div>
      </main>

      {/* Bottom Navigation Bar (Mobile) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-18 bg-white border-t border-[#e0c0b1]/30 md:hidden shadow-lg">
        <button
          onClick={() => navigate({ to: "/" })}
          className="flex flex-col items-center justify-center text-[#9d4300]"
        >
          <Home className="w-6 h-6" />
          <span className="text-xs font-semibold mt-1">الرئيسية</span>
        </button>
        <button
          onClick={() => navigate({ to: "/lessons" })}
          className="flex flex-col items-center justify-center text-[#584237] hover:text-[#9d4300]"
        >
          <BookOpen className="w-6 h-6" />
          <span className="text-xs font-semibold mt-1">مكتبتي</span>
        </button>
        <button
          onClick={() => navigate({ to: "/spaced-repetition" })}
          className="flex flex-col items-center justify-center text-[#584237] hover:text-[#9d4300]"
        >
          <Brain className="w-6 h-6" />
          <span className="text-xs font-semibold mt-1">المراجعة</span>
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex flex-col items-center justify-center text-[#584237] hover:text-[#9d4300]"
        >
          <Settings className="w-6 h-6" />
          <span className="text-xs font-semibold mt-1">الإعدادات</span>
        </button>
      </nav>

      <RestoreDialog open={restoreOpen} onOpenChange={setRestoreOpen} onLoad={onOpenLesson} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <CategorizeLessonModal
        isOpen={categorizeModalOpen}
        onClose={() => setCategorizeModalOpen(false)}
        lesson={selectedLessonForCat}
        onUpdated={() => {
          refresh();
          setCategorizeModalOpen(false);
          setSelectedLessonForCat(null);
        }}
      />

      {/* Flashcard Subject Picker Modal */}
      <AnimatePresence>
        {showFlashcardPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowFlashcardPicker(false)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2rem] p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-extrabold text-[#0b1c30]">اختر مادة الفلاش كارد</h3>
                <button
                  onClick={() => setShowFlashcardPicker(false)}
                  className="p-2 rounded-xl hover:bg-[#eff4ff] transition cursor-pointer"
                >
                  <X className="h-4 w-4 text-[#584237]" />
                </button>
              </div>
              <div className="space-y-3">
                {library.length === 0 ? (
                  <div className="text-center py-8 text-sm text-[#584237]/70 font-semibold">
                    لا توجد دروس في المكتبة بعد
                  </div>
                ) : (
                  library.map((saved) => (
                    <button
                      key={saved.id}
                      onClick={() => {
                        setShowFlashcardPicker(false);
                        navigate({ to: "/spaced-repetition" });
                        // pass lesson id via sessionStorage for SpacedRepetition to pick up
                        try { sessionStorage.setItem("nafath.flashcard.startLessonId", saved.id); } catch {}
                      }}
                      className="w-full text-right p-4 rounded-2xl bg-[#f8f9ff] hover:bg-[#eff4ff] border border-[#e0c0b1]/40 hover:border-[#9d4300]/50 transition flex items-center gap-4 cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#ffdbca]/40 flex items-center justify-center text-[#9d4300]">
                        <Brain className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-[#0b1c30] text-sm">{saved.title}</p>
                        <p className="text-xs text-[#584237]/70 mt-0.5">{saved.blocks} كتلة تعليمية</p>
                      </div>
                    </button>
                  ))
                )}
                <button
                  onClick={() => {
                    setShowFlashcardPicker(false);
                    navigate({ to: "/spaced-repetition" });
                  }}
                  className="w-full text-center py-3 text-xs font-bold text-[#584237]/70 hover:text-[#9d4300] transition cursor-pointer"
                >
                  أو ابدأ جلسة المراجعة الكاملة ←
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
