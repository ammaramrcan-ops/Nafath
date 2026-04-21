import { useRef, useState } from "react";
import { Upload, Sparkles, FileJson } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { defaultLesson, parseLessonJson, type Lesson } from "@/lib/lesson-data";

export function HomeUpload({ onLoad }: { onLoad: (lesson: Lesson) => void }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const tryLoad = (raw: string) => {
    try {
      const lesson = parseLessonJson(raw);
      setError(null);
      onLoad(lesson);
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
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">نفاذ</h1>
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='الصق محتوى الدرس بصيغة JSON هنا...'
        rows={10}
        dir="ltr"
        className="rounded-2xl border-border/70 bg-card font-mono text-sm leading-relaxed shadow-sm focus-visible:ring-brand"
      />

      {error && (
        <p className="mt-3 text-center text-sm text-destructive">{error}</p>
      )}

      <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={() => text.trim() && tryLoad(text)}
          disabled={!text.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-8 py-3 text-base font-semibold text-brand-foreground shadow-[var(--shadow-soft)] transition hover:bg-brand/90 disabled:opacity-40"
        >
          <FileJson className="h-5 w-5" />
          تحميل من النص
        </button>

        <button
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-border bg-background px-8 py-3 text-base font-semibold text-foreground transition hover:border-brand/50"
        >
          <Upload className="h-5 w-5" />
          رفع ملف JSON
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

      <div className="my-8 flex items-center gap-3 text-xs text-foreground/40">
        <span className="h-px flex-1 bg-border" />
        أو
        <span className="h-px flex-1 bg-border" />
      </div>

      <button
        onClick={() => onLoad(defaultLesson)}
        className="inline-flex items-center justify-center gap-2 self-center rounded-full bg-brand-soft px-8 py-3 text-base font-semibold text-foreground transition hover:bg-brand-soft/70"
      >
        <Sparkles className="h-5 w-5 text-brand" />
        تجربة القالب الافتراضي
      </button>
    </div>
  );
}
