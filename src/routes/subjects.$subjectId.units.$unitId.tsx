import { useState, useEffect, useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Plus, BookOpen, Trash2, Upload, Play } from "lucide-react";
import {
  getSubject,
  getUnit,
  addLessonToUnit,
  removeLessonFromUnit,
  type Subject,
  type Unit,
} from "@/lib/curriculum";
import { getLibrary, saveToLibrary, type SavedLesson } from "@/lib/lesson-library";
import { parseLessonJson } from "@/lib/lesson-data";

export const Route = createFileRoute("/subjects/$subjectId/units/$unitId")({
  component: UnitPage,
});

function UnitPage() {
  const { subjectId, unitId } = Route.useParams();
  const [subject, setSubject] = useState<Subject | undefined>();
  const [unit, setUnit] = useState<Unit | undefined>();
  const [library, setLibrary] = useState<SavedLesson[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const refresh = () => {
    setSubject(getSubject(subjectId));
    setUnit(getUnit(subjectId, unitId));
    setLibrary(getLibrary());
  };

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [subjectId, unitId]);

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const lesson = parseLessonJson(String(reader.result));
        const id = saveToLibrary(lesson);
        addLessonToUnit(subjectId, unitId, id);
        setImportError(null);
        refresh();
      } catch {
        setImportError("ملف JSON غير صالح");
      }
    };
    reader.readAsText(file);
  };

  const handleNewLesson = () => {
    // Open teacher with a fresh draft, return here later via library link
    try {
      localStorage.removeItem("teacher.lesson.draft");
      localStorage.setItem("teacher.return.unit", JSON.stringify({ subjectId, unitId }));
    } catch {
      /* ignore */
    }
    navigate({ to: "/teacher" });
  };

  if (!subject || !unit) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-zen-surface">
        <div className="text-center">
          <p className="text-zen-on-surface-variant">الوحدة غير موجودة</p>
          <Link to="/subjects" className="mt-4 inline-block text-zen-primary">
            ← العودة للمواد
          </Link>
        </div>
      </div>
    );
  }

  const lessons = library.filter((l) => unit.lessonIds.includes(l.id));

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-zen-surface text-zen-on-surface antialiased">
      <header className="fixed inset-x-0 top-0 z-40 bg-white/80 backdrop-blur-md">
        <div className="relative mx-auto flex w-full max-w-[640px] items-center justify-between px-6 py-5 sm:px-8">
          <Link
            to="/subjects/$subjectId"
            params={{ subjectId }}
            className="flex items-center gap-1 rounded-full p-2 text-zen-on-surface-variant transition hover:bg-zen-surface-low"
            aria-label="رجوع"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
          </Link>
          <div className="absolute left-1/2 -translate-x-1/2 text-[17px] font-medium text-zen-on-surface line-clamp-1">
            {unit.name}
          </div>
          <div className="w-9" />
        </div>
      </header>

      <main className="relative mx-auto min-h-screen w-full max-w-[640px] px-6 pb-24 pt-28 sm:pt-32">
        <div className="mb-6 text-[13px] font-medium text-zen-on-surface-variant">
          <Link to="/subjects" className="hover:text-zen-primary">المواد</Link>
          <span className="mx-2">/</span>
          <Link to="/subjects/$subjectId" params={{ subjectId }} className="hover:text-zen-primary">
            {subject.name}
          </Link>
          <span className="mx-2">/</span>
          <span>{unit.name}</span>
        </div>

        {/* Action buttons */}
        <div className="mb-8 grid grid-cols-2 gap-3">
          <button
            onClick={handleNewLesson}
            className="flex items-center justify-center gap-2 rounded-2xl bg-zen-primary px-5 py-4 text-[14px] font-medium text-white shadow-[var(--shadow-deep)] transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" strokeWidth={2.25} />
            درس جديد
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-2xl border border-zen-surface-container bg-white px-5 py-4 text-[14px] font-medium text-zen-on-surface shadow-sm transition hover:border-zen-primary"
          >
            <Upload className="h-4 w-4" strokeWidth={2} />
            استيراد قالب
          </button>
        </div>

        {importError && (
          <p className="mb-4 rounded-xl bg-destructive/10 px-4 py-2 text-[13px] text-destructive">
            {importError}
          </p>
        )}

        {lessons.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-zen-surface-container bg-white/40 p-10 text-center">
            <BookOpen className="mx-auto mb-3 h-7 w-7 text-zen-on-surface-variant/40" strokeWidth={1.5} />
            <p className="text-[14px] font-medium text-zen-on-surface-variant">
              لا توجد دروس في هذه الوحدة بعد
            </p>
            <p className="mt-1 text-[12px] text-zen-on-surface-variant/70">
              أنشئ درسًا جديدًا أو استورد قالب JSON
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {lessons.map((l) => (
              <div
                key={l.id}
                className="group relative rounded-2xl border border-white bg-white p-6 shadow-[var(--shadow-deep)] transition hover:-translate-y-0.5"
              >
                <button
                  onClick={() => {
                    if (confirm(`إزالة "${l.title}" من هذه الوحدة؟`)) {
                      removeLessonFromUnit(subjectId, unitId, l.id);
                      refresh();
                    }
                  }}
                  className="absolute left-3 top-3 rounded-full p-1.5 text-zen-on-surface-variant/40 opacity-0 transition group-hover:opacity-100 hover:bg-zen-surface-low hover:text-destructive"
                  aria-label="إزالة"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <span className="mb-3 inline-block rounded-full bg-zen-surface-low px-3 py-1 text-[12px] font-medium text-zen-primary">
                  درس
                </span>
                <h3 className="mb-5 text-[17px] font-medium text-zen-on-surface line-clamp-2">
                  {l.title}
                </h3>
                <button
                  onClick={() => {
                    try {
                      localStorage.setItem("nafath.openLesson", JSON.stringify(l.data));
                    } catch {
                      /* ignore */
                    }
                    navigate({ to: "/" });
                  }}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zen-primary transition hover:opacity-70"
                >
                  <Play className="h-3.5 w-3.5" /> ابدأ الدرس
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImportFile(f);
            e.target.value = "";
          }}
        />
      </main>
    </div>
  );
}
