import { useRef, useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Upload, PenLine, X, FileJson, Sparkles, ScrollText, Leaf, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { defaultLesson, khulLesson, parseLessonJson, type Lesson } from "@/lib/lesson-data";
import { saveToLibrary } from "@/lib/lesson-library";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getCurriculum, type Subject } from "@/lib/curriculum";

type Mode = "choice" | "json" | "subject_selection";

export function RestoreDialog({
  open,
  onOpenChange,
  onLoad,
  subjectId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onLoad: (lesson: Lesson) => void;
  subjectId?: string;
}) {
  const [mode, setMode] = useState<Mode>("choice");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const reset = () => {
    setMode("choice");
    setText("");
    setError(null);
  };

  const close = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const tryLoad = (raw: string) => {
    try {
      const lesson = parseLessonJson(raw);
      saveToLibrary(lesson);
      setError(null);
      onLoad(lesson);
      close(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "صيغة JSON غير صالحة");
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => tryLoad(String(reader.result));
    reader.readAsText(file);
  };

  // If subjectId is provided, skip subject selection and go directly to JSON mode
  useEffect(() => {
    if (subjectId && open) {
      setMode("json");
    }
  }, [subjectId, open]);

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        dir="rtl"
        className="max-w-lg gap-0 overflow-hidden rounded-[1.5rem] border-0 bg-zen-surface p-0 shadow-[var(--shadow-deep)]"
      >
        <DialogTitle className="sr-only">استرداد درس</DialogTitle>

        <div className="flex items-center justify-between px-7 pt-6 pb-2">
          <h2 className="text-[22px] font-semibold tracking-tight text-zen-on-surface">
            {mode === "choice" ? "استرداد درس" : "رفع كود JSON"}
          </h2>
          <button
            onClick={() => close(false)}
            className="rounded-full p-2 text-zen-on-surface-variant transition hover:bg-zen-surface-low cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {mode === "choice" && (
          <div className="space-y-4 px-7 pt-4 pb-8">
            <p className="text-sm leading-relaxed text-zen-on-surface-variant">
              اختر طريقة بدء الدرس أو اختر أحد القوالب الافتراضية
            </p>

            <button
              onClick={() => {
                setMode("subject_selection");
              }}
              className="group flex w-full items-center gap-5 rounded-[1rem] border border-zen-primary/40 bg-zen-surface-low p-5 text-right transition hover:-translate-y-0.5 hover:border-zen-primary hover:shadow-md cursor-pointer"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zen-primary text-white shadow-xs">
                <Upload className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-[16px] font-extrabold text-zen-on-surface">استيراد كود JSON عبر 3 خطوات 🚀</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-zen-on-surface-variant font-medium">
                  انتقل لوصول سريع لنظام استيراد الشرح والخريطة والـ MCQs
                </p>
              </div>
            </button>

            <div className="flex items-center gap-3 pt-2 text-[11px] text-zen-on-surface-variant/70">
              <span className="h-px flex-1 bg-zen-surface-container" />
              أو اختر من القوالب الافتراضية
              <span className="h-px flex-1 bg-zen-surface-container" />
            </div>

            {/* Default Templates Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  onLoad(defaultLesson);
                  close(false);
                }}
                className="flex items-center justify-center gap-2 rounded-2xl border border-zen-primary/20 bg-zen-surface-low p-3.5 text-xs font-bold text-zen-primary transition hover:bg-zen-primary hover:text-white cursor-pointer shadow-sm"
              >
                <Leaf className="h-4 w-4" />
                قالب البناء الضوئي 🌿
              </button>

              <button
                onClick={() => {
                  onLoad(khulLesson);
                  close(false);
                }}
                className="flex items-center justify-center gap-2 rounded-2xl border border-amber-300/40 bg-amber-50 p-3.5 text-xs font-bold text-amber-900 transition hover:bg-amber-700 hover:text-white cursor-pointer shadow-sm"
              >
                <ScrollText className="h-4 w-4 text-amber-700" />
                قالب فقه الخُلع 📜
              </button>
            </div>
          </div>
        )}

        {mode === "subject_selection" && (
          <div className="space-y-4 px-7 pt-4 pb-8">
            <p className="text-sm leading-relaxed text-zen-on-surface-variant">
              اختر المادة التي تريد إضافة الدرس إليها
            </p>

            <div className="space-y-3">
              {getCurriculum().subjects.map((subject) => (
                <button
                  key={subject.id}
                  onClick={() => {
                    close(false);
                    window.location.href = `/teacher?import=true&subject=${subject.id}`;
                  }}
                  className="group flex w-full items-center gap-5 rounded-[1rem] border border-zen-primary/40 bg-zen-surface-low p-4 text-right transition hover:-translate-y-0.5 hover:border-zen-primary hover:shadow-md cursor-pointer"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zen-primary text-white shadow-xs">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[15px] font-extrabold text-zen-on-surface">{subject.name}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-zen-on-surface-variant font-medium">
                      {subject.category}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setMode("choice")}
              className="mx-auto block text-xs font-semibold text-zen-on-surface-variant hover:text-zen-on-surface cursor-pointer"
            >
              ← رجوع للخيارات
            </button>
          </div>
        )}

        {mode === "json" && (
          <div className="space-y-4 px-7 pb-8 pt-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="الصق محتوى الدرس بصيغة JSON هنا..."
              rows={9}
              dir="ltr"
              className="rounded-2xl border-zen-surface-container bg-white font-mono text-[13px] leading-relaxed shadow-none focus-visible:ring-zen-primary"
            />
            {error && <p className="text-center text-sm text-destructive">{error}</p>}

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={() => text.trim() && tryLoad(text)}
                disabled={!text.trim()}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-zen-primary px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90",
                  "disabled:opacity-40 cursor-pointer",
                )}
              >
                <FileJson className="h-4 w-4" />
                تحميل من النص
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-zen-surface-container bg-white px-6 py-3 text-sm font-semibold text-zen-on-surface transition hover:border-zen-primary-container cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                رفع ملف
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>

            <button
              onClick={() => setMode("choice")}
              className="mx-auto block text-xs font-semibold text-zen-on-surface-variant hover:text-zen-on-surface cursor-pointer"
            >
              ← رجوع للخيارات
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
