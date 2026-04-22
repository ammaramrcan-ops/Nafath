import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Upload, PenLine, X, FileJson, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { defaultLesson, parseLessonJson, type Lesson } from "@/lib/lesson-data";
import { saveToLibrary } from "@/lib/lesson-library";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Mode = "choice" | "json";

export function RestoreDialog({
  open,
  onOpenChange,
  onLoad,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onLoad: (lesson: Lesson) => void;
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
            className="rounded-full p-2 text-zen-on-surface-variant transition hover:bg-zen-surface-low"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {mode === "choice" && (
          <div className="space-y-4 px-7 pt-4 pb-8">
            <p className="text-sm leading-relaxed text-zen-on-surface-variant">
              اختر طريقة بدء الدرس
            </p>

            <button
              onClick={() => setMode("json")}
              className="group flex w-full items-center gap-5 rounded-[1rem] border border-zen-surface-container bg-white p-6 text-right transition hover:-translate-y-0.5 hover:border-zen-primary-container hover:shadow-[var(--shadow-deep)]"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-zen-surface-low text-zen-primary">
                <Upload className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-[17px] font-semibold text-zen-on-surface">رفع كود JSON</p>
                <p className="mt-1 text-[13px] leading-relaxed text-zen-on-surface-variant">
                  ألصق أو ارفع ملف يحتوي على بنية الدرس
                </p>
              </div>
            </button>

            <button
              onClick={() => {
                close(false);
                navigate({ to: "/teacher" });
              }}
              className="group flex w-full items-center gap-5 rounded-[1rem] border border-zen-surface-container bg-white p-6 text-right transition hover:-translate-y-0.5 hover:border-zen-primary-container hover:shadow-[var(--shadow-deep)]"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-zen-surface-low text-zen-primary">
                <PenLine className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-[17px] font-semibold text-zen-on-surface">تصميم درس من الصفر</p>
                <p className="mt-1 text-[13px] leading-relaxed text-zen-on-surface-variant">
                  ابنِ المحتوى بالكامل عبر واجهة المعلم
                </p>
              </div>
            </button>

            <div className="flex items-center gap-3 pt-2 text-[11px] text-zen-on-surface-variant/70">
              <span className="h-px flex-1 bg-zen-surface-container" />
              أو جرّب
              <span className="h-px flex-1 bg-zen-surface-container" />
            </div>

            <button
              onClick={() => {
                onLoad(defaultLesson);
                close(false);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-zen-surface-low py-3 text-sm font-semibold text-zen-primary transition hover:bg-zen-surface-container"
            >
              <Sparkles className="h-4 w-4" />
              القالب الافتراضي
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
                  "disabled:opacity-40",
                )}
              >
                <FileJson className="h-4 w-4" />
                تحميل من النص
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-zen-surface-container bg-white px-6 py-3 text-sm font-semibold text-zen-on-surface transition hover:border-zen-primary-container"
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
              className="mx-auto block text-xs font-semibold text-zen-on-surface-variant hover:text-zen-on-surface"
            >
              ← رجوع للخيارات
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
