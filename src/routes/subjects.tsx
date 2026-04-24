import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Plus, BookOpen, Trash2, FolderOpen } from "lucide-react";
import {
  getCurriculum,
  addSubject,
  deleteSubject,
  type Subject,
} from "@/lib/curriculum";
import { getLibrary, type SavedLesson } from "@/lib/lesson-library";
import { getAssignedLessonIds } from "@/lib/curriculum";
import { PromptDialog } from "@/components/PromptDialog";

export const Route = createFileRoute("/subjects")({
  component: SubjectsPage,
  head: () => ({
    meta: [
      { title: "المواد — نفاذ" },
      { name: "description", content: "تنظيم الدروس في مواد ووحدات." },
    ],
  }),
});

function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [library, setLibrary] = useState<SavedLesson[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const navigate = useNavigate();

  const refresh = () => {
    setSubjects(getCurriculum().subjects);
    setLibrary(getLibrary());
  };

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const assigned = getAssignedLessonIds();
  const uncategorized = library.filter((l) => !assigned.has(l.id));

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-zen-surface text-zen-on-surface antialiased">
      {/* Top bar */}
      <header className="fixed inset-x-0 top-0 z-40 bg-white/80 backdrop-blur-md">
        <div className="relative mx-auto flex w-full max-w-[640px] items-center justify-between px-6 py-5 sm:px-8">
          <Link
            to="/"
            className="flex items-center gap-1 rounded-full p-2 text-zen-on-surface-variant transition hover:bg-zen-surface-low"
            aria-label="رجوع"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
          </Link>
          <div className="absolute left-1/2 -translate-x-1/2 text-[17px] font-medium text-zen-on-surface">
            المواد
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-zen-primary px-4 py-2 text-[13px] font-medium text-white transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            مادة
          </button>
        </div>
      </header>

      <main className="relative mx-auto min-h-screen w-full max-w-[640px] px-6 pb-24 pt-28 sm:pt-32">
        {subjects.length === 0 && uncategorized.length === 0 ? (
          <div className="mt-20 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[var(--shadow-deep)]">
              <FolderOpen className="h-7 w-7 text-zen-on-surface-variant/50" strokeWidth={1.5} />
            </div>
            <p className="text-[15px] font-medium text-zen-on-surface-variant">لا توجد مواد بعد</p>
            <p className="mt-1 text-[13px] text-zen-on-surface-variant/70">
              أضف أول مادة لتبدأ تنظيم دروسك
            </p>
            <button
              onClick={() => setAddOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-zen-primary px-5 py-2.5 text-[13px] font-medium text-white"
            >
              <Plus className="h-4 w-4" /> إضافة مادة
            </button>
          </div>
        ) : (
          <>
            {subjects.length > 0 && (
              <section className="mb-10">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {subjects.map((s) => {
                    const lessonsCount = s.units.reduce((acc, u) => acc + u.lessonIds.length, 0);
                    return (
                      <div
                        key={s.id}
                        className="group relative rounded-2xl border border-white bg-white p-6 shadow-[var(--shadow-deep)] transition hover:-translate-y-0.5"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`حذف مادة "${s.name}" وجميع وحداتها؟`)) {
                              deleteSubject(s.id);
                              refresh();
                            }
                          }}
                          className="absolute left-3 top-3 rounded-full p-1.5 text-zen-on-surface-variant/40 opacity-0 transition group-hover:opacity-100 hover:bg-zen-surface-low hover:text-destructive"
                          aria-label="حذف"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            navigate({ to: "/subjects/$subjectId", params: { subjectId: s.id } })
                          }
                          className="block w-full text-right"
                        >
                          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zen-surface-container text-zen-primary">
                            <BookOpen className="h-5 w-5" strokeWidth={1.75} />
                          </div>
                          <h3 className="text-[18px] font-medium text-zen-on-surface line-clamp-1">
                            {s.name}
                          </h3>
                          <p className="mt-1 text-[12px] font-medium text-zen-on-surface-variant">
                            {s.units.length} وحدة · {lessonsCount} درس
                          </p>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {uncategorized.length > 0 && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-[16px] font-medium text-zen-on-surface-variant">
                    غير مصنّف
                  </h2>
                  <span className="text-[12px] font-medium text-zen-on-surface-variant/60">
                    {uncategorized.length} درس
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {uncategorized.map((l) => (
                    <div
                      key={l.id}
                      className="rounded-2xl border border-dashed border-zen-surface-container bg-white/60 p-5 shadow-sm"
                    >
                      <span className="mb-2 inline-block rounded-full bg-zen-surface-low px-2.5 py-0.5 text-[11px] font-medium text-zen-on-surface-variant">
                        درس
                      </span>
                      <h4 className="text-[15px] font-medium text-zen-on-surface line-clamp-2">
                        {l.title}
                      </h4>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <PromptDialog
        open={addOpen}
        title="مادة جديدة"
        placeholder="مثال: الأحياء"
        confirmLabel="إضافة"
        onConfirm={(name) => {
          addSubject(name);
          setAddOpen(false);
          refresh();
        }}
        onClose={() => setAddOpen(false)}
      />
    </div>
  );
}
