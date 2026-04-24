import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Settings, Bell, BookOpen, ChevronLeft, LayoutGrid, Trash2, Plus, FolderOpen } from "lucide-react";
import { getLibrary, deleteFromLibrary, type SavedLesson } from "@/lib/lesson-library";
import { type Lesson } from "@/lib/lesson-data";
import { getCurriculum, getAssignedLessonIds, type Subject } from "@/lib/curriculum";
import { SettingsDialog } from "@/components/SettingsDialog";
import { RestoreDialog } from "@/components/RestoreDialog";

export function ZenHome({ onOpenLesson }: { onOpenLesson: (lesson: Lesson) => void }) {
  const [library, setLibrary] = useState<SavedLesson[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();

  const refresh = () => {
    setLibrary(getLibrary());
    setSubjects(getCurriculum().subjects);
  };

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const handleLoad = (lesson: Lesson) => {
    refresh();
    onOpenLesson(lesson);
  };

  const assigned = getAssignedLessonIds();
  const uncategorizedCount = library.filter((l) => !assigned.has(l.id)).length;
  const showAllLessons = library.length > 2;
  const showAllMaterials = subjects.length > 2;

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-zen-surface text-zen-on-surface antialiased">
      {/* Top App Bar */}
      <header className="fixed inset-x-0 top-0 z-40 bg-white/80 backdrop-blur-md">
        <div className="relative mx-auto flex w-full max-w-[640px] items-center justify-between px-6 py-5 sm:px-8">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center justify-center rounded-full p-2 text-zen-on-surface-variant transition hover:bg-zen-surface-low"
            aria-label="الإعدادات"
          >
            <Settings className="h-5 w-5" strokeWidth={1.75} />
          </button>

          <div className="absolute left-1/2 -translate-x-1/2 text-2xl font-semibold tracking-tight text-zen-on-surface">
            نفاذ
          </div>

          <button
            className="relative flex items-center justify-center rounded-full p-2 text-zen-on-surface-variant transition hover:bg-zen-surface-low"
            aria-label="الإشعارات"
          >
            <Bell className="h-5 w-5" strokeWidth={1.75} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-zen-primary" />
          </button>
        </div>
      </header>

      <main className="relative mx-auto min-h-screen w-full max-w-[640px] px-6 pb-40 pt-32 sm:pt-36">
        {/* Hero */}
        <div className="mb-16 text-center">
          <h1 className="text-[40px] font-medium leading-[1.2] text-zen-on-surface">أهلاً بك</h1>
        </div>

        {/* Lessons Section */}
        <section className="mb-20">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-[28px] font-medium leading-tight text-zen-on-surface">الدروس</h2>
            <div className="flex gap-5">
              <button
                onClick={() => setRestoreOpen(true)}
                className="text-[13px] font-medium tracking-wide text-zen-primary transition hover:opacity-70"
              >
                استرداد
              </button>
              {showAllLessons && (
                <button className="text-[13px] font-medium tracking-wide text-zen-primary transition hover:opacity-70">
                  عرض الكل
                </button>
              )}
            </div>
          </div>

          {library.length === 0 ? (
            <button
              onClick={() => setRestoreOpen(true)}
              className="flex h-52 w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zen-surface-container bg-white/40 p-8 text-zen-on-surface-variant transition hover:border-zen-primary-container hover:bg-white"
            >
              <BookOpen className="h-7 w-7 opacity-40" />
              <p className="text-sm font-medium">ابدأ باسترداد درسك الأول</p>
            </button>
          ) : (
            <div className="-mx-4 flex snap-x gap-6 overflow-x-auto px-4 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {library.map((saved) => (
                <div
                  key={saved.id}
                  className="group relative flex h-52 min-w-[280px] snap-start flex-col justify-between rounded-2xl border border-white bg-white p-8 shadow-[var(--shadow-deep)]"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFromLibrary(saved.id);
                      refresh();
                    }}
                    className="absolute left-3 top-3 rounded-full p-1.5 text-zen-on-surface-variant/40 opacity-0 transition group-hover:opacity-100 hover:bg-zen-surface-low hover:text-destructive"
                    aria-label="حذف"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onOpenLesson(saved.data)}
                    className="flex h-full flex-col justify-between text-right"
                  >
                    <div>
                      <span className="mb-5 inline-block rounded-full bg-zen-surface-low px-3 py-1 text-[13px] font-medium tracking-wide text-zen-primary">
                        درس
                      </span>
                      <h3 className="text-[22px] font-medium leading-snug text-zen-on-surface line-clamp-2">
                        {saved.title}
                      </h3>
                    </div>
                    <div className="h-1 w-12 rounded-full bg-zen-primary-container" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Materials Section */}
        <section className="mb-20">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-[28px] font-medium leading-tight text-zen-on-surface">المواد</h2>
            {showAllMaterials && (
              <button className="text-[13px] font-medium tracking-wide text-zen-primary transition hover:opacity-70">
                عرض الكل
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5">
            <div className="overflow-hidden rounded-2xl border border-white bg-white shadow-[var(--shadow-deep)]">
              <button
                onClick={() => setBiologyOpen((v) => !v)}
                className="flex w-full items-center justify-between px-8 py-7 text-right transition hover:bg-zen-surface-low/40"
              >
                <div className="flex items-center gap-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zen-surface-container text-zen-primary">
                    <BookOpen className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="text-[20px] font-medium text-zen-on-surface">الأحياء</h3>
                    <p className="mt-1 text-[13px] font-medium text-zen-on-surface-variant">
                      {library.length} درس
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-zen-on-surface-variant transition-transform ${biologyOpen ? "rotate-180" : ""}`}
                  strokeWidth={2}
                />
              </button>

              {biologyOpen && (
                <div className="border-t border-zen-surface-low px-3 py-3">
                  {library.length === 0 ? (
                    <p className="px-5 py-6 text-center text-[13px] font-medium text-zen-on-surface-variant">
                      لا توجد دروس بعد. اضغط «استرداد» لإضافة أول درس.
                    </p>
                  ) : (
                    <ul className="divide-y divide-zen-surface-low">
                      {library.map((saved) => (
                        <li key={saved.id}>
                          <button
                            onClick={() => onOpenLesson(saved.data)}
                            className="flex w-full items-center justify-between rounded-xl px-5 py-4 text-right transition hover:bg-zen-surface-low/60"
                          >
                            <span className="text-[15px] font-medium text-zen-on-surface">
                              {saved.title}
                            </span>
                            <ChevronLeft className="h-4 w-4 text-zen-on-surface-variant/60" strokeWidth={2} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Teacher entry — discreet */}
        <div className="mt-12 text-center">
          <button
            onClick={() => navigate({ to: "/teacher" })}
            className="text-[12px] font-medium text-zen-on-surface-variant/60 hover:text-zen-on-surface-variant"
          >
            واجهة المعلم
          </button>
        </div>
      </main>

      {/* FAB — الفصول (placeholder) */}
      <div className="pointer-events-none fixed bottom-8 left-1/2 z-40 flex w-full max-w-[640px] -translate-x-1/2 justify-end px-6 sm:px-8">
        <button
          disabled
          aria-label="الفصول (قريباً)"
          className="pointer-events-auto flex h-16 w-16 cursor-not-allowed flex-col items-center justify-center rounded-full bg-zen-primary text-white opacity-90 shadow-[var(--shadow-fab)] transition active:scale-95"
        >
          <LayoutGrid className="h-6 w-6" strokeWidth={1.75} />
          <span className="mt-0.5 text-[10px] font-medium">الفصول</span>
        </button>
      </div>

      <RestoreDialog open={restoreOpen} onOpenChange={setRestoreOpen} onLoad={handleLoad} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
