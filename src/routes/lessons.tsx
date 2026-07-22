import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Search, BookOpen, Trash2, Plus, ArrowRight } from "lucide-react";
import { getLibrary, deleteFromLibrary, type SavedLesson } from "@/lib/lesson-library";
import { type Lesson } from "@/lib/lesson-data";
import { RestoreDialog } from "@/components/RestoreDialog";

export const Route = createFileRoute("/lessons")({
  component: LessonsPage,
  head: () => ({
    meta: [
      { title: "الدروس الكاملة — نفاذ" },
      { name: "description", content: "تصفح والتحكم في جميع الدروس الخاصة بك." },
    ],
  }),
});

function LessonsPage() {
  const [library, setLibrary] = useState<SavedLesson[]>([]);
  const [search, setSearch] = useState("");
  const [restoreOpen, setRestoreOpen] = useState(false);
  const navigate = useNavigate();

  const refresh = () => {
    setLibrary(getLibrary());
  };

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const handleOpenLesson = (lesson: Lesson) => {
    try {
      localStorage.setItem("nafath.openLesson", JSON.stringify(lesson));
      navigate({ to: "/" });
    } catch (err) {
      console.error("Failed to open lesson:", err);
    }
  };

  const filtered = library.filter((l) =>
    l.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-zen-surface text-zen-on-surface antialiased">
      {/* Top Header */}
      <header className="fixed inset-x-0 top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zen-surface-container/60">
        <div className="relative mx-auto flex w-full max-w-[800px] items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-full p-2 text-zen-on-surface-variant transition hover:bg-zen-surface-low"
            aria-label="الرئيسية"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
            <span className="text-xs font-medium">الرئيسية</span>
          </Link>

          <h1 className="text-lg font-bold text-zen-on-surface">جميع الدروس ({library.length})</h1>

          <button
            onClick={() => setRestoreOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-zen-primary px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            استرداد درس
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative mx-auto min-h-screen w-full max-w-[800px] px-6 pb-24 pt-24">
        {/* Search Bar */}
        <div className="mb-8 relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zen-on-surface-variant/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن درس في المكتبة..."
            className="w-full rounded-2xl border border-white bg-white px-11 py-3.5 text-sm text-zen-on-surface placeholder:text-zen-on-surface-variant/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-zen-primary/40"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-md mb-4 text-zen-on-surface-variant/40">
              <BookOpen className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-zen-on-surface">لا توجد دروس مطابقة</h3>
            <p className="text-xs text-zen-on-surface-variant mt-1">
              قم باسترداد درس جديد أو جرب البحث بكلمة أخرى.
            </p>
            <button
              onClick={() => setRestoreOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-zen-primary px-6 py-2.5 text-xs font-semibold text-white"
            >
              <Plus className="h-4 w-4" /> استرداد درس جديد
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {filtered.map((saved) => (
              <div
                key={saved.id}
                className="group relative flex flex-col justify-between rounded-3xl border border-white bg-white p-6 shadow-sm transition hover:shadow-md hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="rounded-full bg-zen-surface-low px-3 py-1 text-xs font-medium text-zen-primary">
                    درس متكامل
                  </span>
                  <button
                    onClick={() => {
                      deleteFromLibrary(saved.id);
                      refresh();
                    }}
                    className="text-zen-on-surface-variant/40 hover:text-red-500 transition p-1"
                    title="حذف الدرس"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2 mb-6">
                  <h3 className="text-lg font-bold text-zen-on-surface line-clamp-2 leading-snug">
                    {saved.title}
                  </h3>
                  {saved.data.topics && saved.data.topics.length > 0 && (
                    <p className="text-xs text-zen-on-surface-variant line-clamp-1">
                      {saved.data.topics.join(" • ")}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleOpenLesson(saved.data)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-zen-surface-low py-3 text-xs font-semibold text-zen-primary group-hover:bg-zen-primary group-hover:text-white transition cursor-pointer"
                >
                  <span>بدء دراسة الدرس</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <RestoreDialog open={restoreOpen} onOpenChange={setRestoreOpen} onLoad={handleOpenLesson} />
    </div>
  );
}
