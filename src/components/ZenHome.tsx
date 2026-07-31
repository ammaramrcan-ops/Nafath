import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Settings,
  BookOpen,
  Plus,
  Trash2,
  Pencil,
  Tag,
  Clock,
  FolderOpen,
  FileText,
  CheckSquare,
  Brain,
  ChevronLeft,
  BookMarked,
  Trash,
  Check,
  Target,
  Flame,
} from "lucide-react";
import { getLibrary, deleteFromLibrary, type SavedLesson } from "@/lib/lesson-library";
import { type Lesson } from "@/lib/lesson-data";
import { getCurriculum, type Subject } from "@/lib/curriculum";
import { getDailyStreak, getStoredSmartCards, trackDailyVisit, getRealAccuracy } from "@/lib/spaced-repetition";
import { SettingsDialog } from "@/components/SettingsDialog";
import { RestoreDialog } from "@/components/RestoreDialog";
import { CategorizeLessonModal } from "@/components/CategorizeLessonModal";
import { GoogleAuthModal, getStoredUser, type UserProfile } from "@/components/GoogleAuthModal";
import { Input } from "@/components/ui/input";

const CURRICULUM_KEY = "nafath.curriculumTracker";
const TASKS_KEY = "nafath.daily_tasks";

export interface DailyTask {
  id: string;
  title: string;
  subjectName: string;
  completed: boolean;
}

const DEFAULT_TASKS: DailyTask[] = [
  { id: "t1", title: "مراجعة أحكام الزكاة", subjectName: "الفقه الإسلامي", completed: true },
  { id: "t2", title: "درس الخلع والطلاق", subjectName: "مادة الفقه", completed: false },
  { id: "t3", title: "حل اختبار التجويد", subjectName: "القرآن وعلومه", completed: false },
];

function getStoredTasks(): DailyTask[] {
  if (typeof window === "undefined") return DEFAULT_TASKS;
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) {
      localStorage.setItem(TASKS_KEY, JSON.stringify(DEFAULT_TASKS));
      return DEFAULT_TASKS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_TASKS;
  }
}

function saveStoredTasks(tasks: DailyTask[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch {}
}

interface TrackedLesson {
  id: string;
  title: string;
  done: boolean;
}
interface TrackedSubject {
  id: string;
  name: string;
  lessons: TrackedLesson[];
}

function loadCurriculumProgress(): { percent: number; done: number; total: number } {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(CURRICULUM_KEY) : null;
    if (!raw) {
      const lib = typeof window !== "undefined" ? getLibrary() : [];
      const libTotal = lib.length;
      return { percent: libTotal > 0 ? 100 : 0, done: libTotal, total: libTotal };
    }
    const subjects: TrackedSubject[] = JSON.parse(raw);
    const total = subjects.reduce((a, s) => a + s.lessons.length, 0);
    const done = subjects.reduce((a, s) => a + s.lessons.filter((l) => l.done).length, 0);
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { percent, done, total };
  } catch {
    return { percent: 0, done: 0, total: 0 };
  }
}

function loadUserStats(): { accuracy: number; streak: number } {
  try {
    // Track today's visit and get real streak
    const streak = trackDailyVisit();
    // Compute accuracy from ease factors of reviewed cards
    const accuracy = getRealAccuracy();
    return { accuracy, streak };
  } catch {
    return { accuracy: 0, streak: 0 };
  }
}

export function ZenHome({ onOpenLesson }: { onOpenLesson: (lesson: Lesson) => void }) {
  // Synchronous State Initialization (No FOUC / No Dummy Data Flicker on Refresh)
  const [library, setLibrary] = useState<SavedLesson[]>(() =>
    typeof window !== "undefined" ? getLibrary() : [],
  );
  const [subjects, setSubjects] = useState<Subject[]>(() =>
    typeof window !== "undefined" ? getCurriculum().subjects : [],
  );
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>(() => getStoredTasks());
  const [curriculumStats, setCurriculumStats] = useState(() => loadCurriculumProgress());
  const [userStats, setUserStats] = useState(() => loadUserStats());

  const [mounted, setMounted] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [googleAuthOpen, setGoogleAuthOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => getStoredUser());
  const [categorizeModalOpen, setCategorizeModalOpen] = useState(false);
  const [selectedLessonForCat, setSelectedLessonForCat] = useState<SavedLesson | null>(null);

  // New Task Input State
  const [showAddTaskInput, setShowAddTaskInput] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const navigate = useNavigate();

  const refresh = () => {
    setLibrary(getLibrary());
    setSubjects(getCurriculum().subjects);
    setDailyTasks(getStoredTasks());
    setCurriculumStats(loadCurriculumProgress());
    setUserStats(loadUserStats());
  };

  useEffect(() => {
    setMounted(true);
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // Task Actions
  const handleToggleTask = (taskId: string) => {
    const updated = dailyTasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
    setDailyTasks(updated);
    saveStoredTasks(updated);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = dailyTasks.filter((t) => t.id !== taskId);
    setDailyTasks(updated);
    saveStoredTasks(updated);
  };

  const handleCreateNewTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: DailyTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      subjectName: "مهمة جديدة",
      completed: false,
    };
    const updated = [...dailyTasks, newTask];
    setDailyTasks(updated);
    saveStoredTasks(updated);
    setNewTaskTitle("");
    setShowAddTaskInput(false);
  };

  const totalSubjectsCount = subjects.length;

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-[#f8f9ff] text-[#1e293b] antialiased flex flex-col font-sans">
      {/* Top Navigation Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 px-8 py-4">
        <div className="w-full max-w-[96vw] mx-auto flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 text-primary rounded-xl flex items-center justify-center border border-orange-100">
              <BookOpen className="h-6 w-6 text-[#f97316]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">نفاذ</h1>
          </div>

          {/* User Profile / Settings */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setGoogleAuthOpen(true)}
              className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer"
              title="تسجيل الدخول / الحساب"
            >
              <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-sm flex items-center justify-center">
                {userProfile ? (
                  <img src={userProfile.avatar} alt={userProfile.name} className="w-full h-full object-cover" />
                ) : (
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCuJ4VaRu-r3qfzjqr6UdI8gYLnUgwMUWNQ5ZSirq-AO-1bZX0eU9fkUpTmxi3UXMAtUpLUr8y_KG2a_7HPD2dKXAia5f2L836VZQ7APbdHb4SuXM6xFkRx0kBTz3cwe5Vw5y0V3Pr-NyzTK1KCogZ7dnIvUMG1geHaZuKQsz2v4lTW0g7-l1YMQX2fb3OnaqPy04sGJABg6BbgNY0ndX4oDLUIkzytUobfrKtmBNEc3o52YG1R450"
                    alt="User Avatar"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </button>

            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition cursor-pointer"
              title="الإعدادات"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow w-full max-w-[96vw] mx-auto px-6 md:px-10 py-8 pb-16">
        <div className="grid grid-cols-12 gap-8 items-start">
          
          {/* RIGHT COLUMN: Main Content (Progress, Active Subjects, Saved Lessons) -> col-span-12 lg:col-span-8 */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            
            {/* 1. Progress Summary Banner */}
            <section className="bg-white border border-gray-200/60 rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xs hover:shadow-md transition-all">
              <button
                onClick={() => navigate({ to: "/curriculum-tracker" })}
                className="px-6 py-3 bg-[#1e293b] hover:bg-[#0f172a] text-white rounded-lg text-sm font-bold transition-all shrink-0 cursor-pointer shadow-sm order-2 md:order-1"
              >
                عرض الجدول التفصيلي
              </button>

              <div className="flex-grow text-center md:text-right order-1 md:order-2 space-y-1">
                <h2 className="text-2xl font-bold text-gray-900">إنجاز المنهج الدراسي</h2>
                <p className="text-sm text-gray-500 font-medium">
                  {curriculumStats.total > 0
                    ? `لقد أتممت ${curriculumStats.done} درساً من أصل ${curriculumStats.total} في خطتك الحالية. أنت تسير بوتيرة رائعة!`
                    : "قم بإضافة دروسك وموادك في متتبع المنهج لتحديد نسبة إنجازك الفعلي أولاً بأول."}
                </p>
              </div>

              {/* Dynamic Circular Progress Ring */}
              <div className="relative w-24 h-24 shrink-0 order-3">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="text-[#f97316]"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray={`${curriculumStats.percent}, 100`}
                    strokeLinecap="round"
                    strokeWidth="3"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-gray-900">{curriculumStats.percent}%</span>
                </div>
              </div>
            </section>

            {/* 2. Active Subjects Grid */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">المواد الدراسية النشطة</h2>
                <button
                  onClick={() => navigate({ to: "/subjects" })}
                  className="text-primary text-sm font-medium hover:underline cursor-pointer text-[#f97316]"
                >
                  عرض الكل ({totalSubjectsCount > 0 ? totalSubjectsCount : 3})
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {subjects.length > 0 ? (
                  subjects.slice(0, 4).map((sub) => {
                    const category = sub.category || "العلوم الشرعية";
                    const lessonCount = library.filter((l) => l.subjectId === sub.id).length;
                    return (
                      <div
                        key={sub.id}
                        onClick={() =>
                          navigate({ to: "/subjects/$subjectId", params: { subjectId: sub.id } })
                        }
                        className="bg-white border border-gray-200/60 rounded-xl p-6 hover:shadow-md transition-all cursor-pointer group space-y-4"
                      >
                        <div className="flex justify-between items-start">
                          <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2.5 py-1 rounded">
                            {category}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
                          {sub.name}
                        </h3>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-sm">
                          <span className="w-2 h-2 bg-[#f97316] rounded-full animate-pulse" />
                          <span className="flex-grow text-xs font-medium text-gray-700">
                            {lessonCount > 0 ? `الدروس المسجلة: ${lessonCount} درس` : "مادة دراسية نشطة"}
                          </span>
                          <button className="text-[#f97316] font-bold text-xs hover:underline cursor-pointer">
                            عرض المادة ➔
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : mounted ? (
                  <div className="col-span-2 p-6 bg-white rounded-xl border border-dashed border-gray-200 text-center">
                    <p className="text-sm text-gray-400 font-medium">لا توجد مواد دراسية مضافة بعد.</p>
                    <button
                      onClick={() => navigate({ to: "/subjects" })}
                      className="mt-3 text-xs text-[#f97316] font-bold hover:underline cursor-pointer"
                    >
                      إضافة مادة دراسية الآن ➔
                    </button>
                  </div>
                ) : null}
              </div>
            </section>

            {/* 3. Saved Lessons Section */}
            <section className="bg-white border border-gray-200/60 rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <BookMarked className="h-5 w-5 text-[#f97316]" />
                  <span>الدروس المحفوظة</span>
                </h2>
                <button
                  onClick={() => setRestoreOpen(true)}
                  className="text-xs text-[#f97316] hover:underline font-bold cursor-pointer"
                >
                  + استرداد درس
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {library.length > 0 ? (
                  library.map((saved) => (
                    <div
                      key={saved.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex flex-col justify-between space-y-3 group hover:border-[#f97316]/50 transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] bg-white px-2 py-0.5 rounded shadow-2xs border border-gray-100 font-medium">
                          {saved.subjectId || "درس عام"}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFromLibrary(saved.id);
                            refresh();
                          }}
                          className="text-gray-400 hover:text-red-500 cursor-pointer"
                          title="حذف الدرس"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>

                      <div onClick={() => onOpenLesson(saved.data)} className="cursor-pointer space-y-1">
                        <p className="font-bold text-sm text-gray-900 group-hover:text-[#f97316] transition-colors">
                          {saved.title}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between col-span-2">
                    <p className="text-sm font-medium text-gray-500">لا توجد دروس محفوظة حالياً. انقر على "+ استرداد درس" لإضافة أي درس جديد.</p>
                    <button
                      onClick={() => setRestoreOpen(true)}
                      className="text-xs text-[#f97316] font-bold hover:underline cursor-pointer shrink-0"
                    >
                      استرداد درس الآن
                    </button>
                  </div>
                )}
              </div>
            </section>

          </div>

          {/* LEFT COLUMN: Sidebar (Daily Tasks, Flashcards, Performance Stats) -> col-span-12 lg:col-span-4 */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            
            {/* 1. Daily Tasks Section with Delete Buttons & Persistent Creation */}
            <section className="bg-white border border-gray-200/60 rounded-xl p-6 space-y-6 shadow-2xs">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                  <CheckSquare className="h-5 w-5 text-[#f97316]" />
                  <span>مهام ودروس اليوم</span>
                </h2>
                <span className="text-xs bg-orange-50 text-[#f97316] px-2.5 py-1 rounded font-bold">
                  {dailyTasks.filter((t) => t.completed).length} / {dailyTasks.length} مكتملة
                </span>
              </div>

              <div className="space-y-3">
                {dailyTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-3 p-3 bg-gray-50/80 rounded-lg border border-gray-100 hover:border-orange-200 transition-all group"
                  >
                    <label className="flex items-center gap-3 cursor-pointer flex-grow min-w-0">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleTask(task.id)}
                        className="w-5 h-5 rounded text-[#f97316] focus:ring-[#f97316] border-gray-300 cursor-pointer shrink-0"
                      />
                      <div className="truncate">
                        <p
                          className={`text-sm font-medium truncate ${
                            task.completed ? "text-gray-400 line-through" : "text-gray-900"
                          }`}
                        >
                          {task.title}
                        </p>
                        <p className="text-[10px] text-gray-400">{task.subjectName}</p>
                      </div>
                    </label>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-gray-400 hover:text-red-500 opacity-60 group-hover:opacity-100 transition cursor-pointer p-1"
                      title="حذف المهمة"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Task Inline Input */}
              {showAddTaskInput ? (
                <div className="pt-2 flex items-center gap-2">
                  <Input
                    placeholder="أدخل عنوان المهمة الجديدة..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateNewTask()}
                    className="rounded-lg text-xs"
                    autoFocus
                  />
                  <button
                    onClick={handleCreateNewTask}
                    className="bg-[#f97316] text-white px-3.5 py-2 rounded-lg text-xs font-bold hover:bg-[#ea580c] transition cursor-pointer shrink-0 shadow-xs"
                  >
                    حفظ
                  </button>
                  <button
                    onClick={() => setShowAddTaskInput(false)}
                    className="text-gray-400 hover:text-gray-600 text-xs px-2 cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddTaskInput(true)}
                  className="w-full mt-2 py-2.5 text-sm text-[#f97316] font-bold border border-dashed border-orange-300 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة مهمة جديدة</span>
                </button>
              )}
            </section>

            {/* 2. Flashcards Quick Access Card (Exact Compact Image 1 Match) */}
            <section
              onClick={() => navigate({ to: "/spaced-repetition" })}
              className="bg-[#f97316] rounded-xl overflow-hidden relative group cursor-pointer p-6 text-white shadow-md hover:shadow-lg transition-all"
            >
              <div className="relative z-10 space-y-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">فلاش كارد المراجعة</h3>
                  <p className="text-orange-100 text-sm">اختبر معلوماتك في 5 دقائق ذكية</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate({ to: "/spaced-repetition" });
                  }}
                  className="bg-white text-[#f97316] px-4 py-2 rounded-lg text-sm font-bold shadow-sm group-hover:scale-105 transition-transform cursor-pointer"
                >
                  ابدأ المراجعة الآن ←
                </button>
              </div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            </section>

              {/* 3. Performance Stats - Real Dynamic Data */}
              <section className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200/60 p-4 rounded-xl text-center shadow-2xs">
                  <p className="text-gray-500 text-xs mb-1 font-medium">دقة الإجابات</p>
                  <p className={`text-2xl font-bold ${userStats.accuracy > 0 ? "text-green-600" : "text-gray-400"}`}>
                    {userStats.accuracy > 0 ? `${userStats.accuracy}%` : "—"}
                  </p>
                  {userStats.accuracy === 0 && (
                    <p className="text-[10px] text-gray-400 mt-1">راجع بطاقات أولاً</p>
                  )}
                </div>
                <div className="bg-white border border-gray-200/60 p-4 rounded-xl text-center shadow-2xs">
                  <p className="text-gray-500 text-xs mb-1 font-medium">أيام الالتزام</p>
                  <p className={`text-2xl font-bold ${userStats.streak > 0 ? "text-blue-600" : "text-gray-400"}`}>
                    {userStats.streak > 0 ? userStats.streak : "—"}
                  </p>
                  {userStats.streak === 0 && (
                    <p className="text-[10px] text-gray-400 mt-1">يوم 1 يبدأ اليوم</p>
                  )}
                </div>
              </section>

          </div>

        </div>
      </main>

      {/* Modals */}
      <GoogleAuthModal open={googleAuthOpen} onOpenChange={setGoogleAuthOpen} onUserChanged={setUserProfile} />
      <RestoreDialog open={restoreOpen} onOpenChange={setRestoreOpen} onLoad={onOpenLesson} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      {selectedLessonForCat && (
        <CategorizeLessonModal
          open={categorizeModalOpen}
          onOpenChange={setCategorizeModalOpen}
          lesson={selectedLessonForCat}
          onUpdated={() => refresh()}
        />
      )}
    </div>
  );
}
