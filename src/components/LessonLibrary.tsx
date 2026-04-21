import { useState, useEffect, useRef } from "react";
import { BookOpen, Trash2, Play, Upload, Clock, Pencil } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import {
  getLibrary,
  deleteFromLibrary,
  saveToLibrary,
  type SavedLesson,
} from "@/lib/lesson-library";
import { parseLessonJson, type Lesson } from "@/lib/lesson-data";
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ar-EG", { day: "numeric", month: "short", year: "numeric" });
}

export function LessonLibrary({ onOpen }: { onOpen: (lesson: Lesson) => void }) {
  const [library, setLibrary] = useState<SavedLesson[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const refresh = () => setLibrary(getLibrary());

  useEffect(() => {
    refresh();
    // Re-read whenever tab becomes visible (user just came back from teacher)
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const handleDelete = (id: string) => {
    deleteFromLibrary(id);
    refresh();
  };

  const handleEdit = (lesson: Lesson) => {
    try {
      localStorage.setItem("teacher.lesson.draft", JSON.stringify(lesson));
      navigate({ to: "/teacher" });
    } catch {
      console.error("Failed to save draft and navigate");
    }
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const lesson = parseLessonJson(String(reader.result));
        saveToLibrary(lesson);
        setImportError(null);
        refresh();
      } catch {
        setImportError("ملف JSON غير صالح");
      }
    };
    reader.readAsText(file);
  };

  if (library.length === 0) {
    return (
      <div className="mt-10 rounded-3xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">
        <BookOpen className="mx-auto mb-3 h-8 w-8 text-foreground/25" />
        <p className="text-sm font-semibold text-foreground/40">لا توجد دروس محفوظة بعد</p>
        <p className="mt-1 text-xs text-foreground/30">
          احفظ درساً من واجهة المعلم أو استورد ملف JSON
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground/70 hover:border-brand/50"
          >
            <Upload className="h-3.5 w-3.5" /> استيراد JSON
          </button>
        </div>
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
        {importError && <p className="mt-2 text-xs text-destructive">{importError}</p>}
      </div>
    );
  }

  return (
    <div className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-extrabold text-foreground">
          <BookOpen className="h-5 w-5 text-brand" />
          مكتبة الدروس
          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand">
            {library.length}
          </span>
        </h2>
        <button
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground/70 hover:border-brand/50"
        >
          <Upload className="h-3.5 w-3.5" /> استيراد JSON
        </button>
      </div>

      {importError && (
        <p className="mb-3 rounded-xl bg-destructive/10 px-4 py-2 text-xs text-destructive">{importError}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {library.map((saved) => (
          <div
            key={saved.id}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card transition hover:border-brand/40 hover:shadow-sm"
          >
            <div className="p-4">
              <p className="truncate font-bold text-foreground">{saved.title}</p>
              <div className="mt-1.5 flex items-center gap-3 text-xs text-foreground/50">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {saved.blocks} {saved.blocks === 1 ? "فقرة" : "فقرات"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(saved.savedAt)}
                </span>
              </div>
            </div>
            <div className="flex border-t border-border/60">
              <button
                onClick={() => onOpen(saved.data)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold",
                  "text-brand transition hover:bg-brand-soft",
                )}
              >
                <Play className="h-3.5 w-3.5" /> ابدأ الدرس
              </button>
              <div className="w-px bg-border/60" />
              <button
                onClick={() => handleEdit(saved.data)}
                className="flex items-center justify-center gap-1 px-4 py-2.5 text-xs font-semibold text-foreground/70 transition hover:bg-muted hover:text-foreground"
                title="تعديل في واجهة المعلم"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <div className="w-px bg-border/60" />
              <button
                onClick={() => handleDelete(saved.id)}
                className="flex items-center justify-center gap-1 px-4 py-2.5 text-xs font-semibold text-destructive transition hover:bg-destructive/5"
                title="حذف"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

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
    </div>
  );
}
