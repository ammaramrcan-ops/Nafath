import { Clock, BookOpen, Layers, ArrowLeft } from "lucide-react";
import type { Lesson } from "@/lib/lesson-data";

export function WelcomeScreen({ lesson, onStart }: { lesson: Lesson; onStart: () => void }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-[640px] flex-col items-center justify-center px-6 py-20 text-center">
      <p className="mb-4 text-[13px] font-medium tracking-wide text-zen-on-surface-variant">
        ابدأ رحلتك
      </p>
      <h1 className="text-[40px] font-medium leading-[1.2] text-zen-on-surface">
        {lesson.title}
      </h1>

      <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[14px] text-zen-on-surface-variant">
        <span className="inline-flex items-center gap-2">
          <Clock className="h-4 w-4" strokeWidth={1.75} />
          {lesson.estimatedTime}
        </span>
        <span className="inline-flex items-center gap-2">
          <BookOpen className="h-4 w-4" strokeWidth={1.75} />
          {lesson.size}
        </span>
      </div>

      {lesson.topics.length > 0 && (
        <div className="mt-16 w-full max-w-md">
          <p className="mb-5 inline-flex items-center justify-center gap-2 text-[13px] font-medium tracking-wide text-zen-on-surface-variant">
            <Layers className="h-3.5 w-3.5" strokeWidth={1.75} />
            مواضيع الدرس
          </p>
          <ul className="space-y-3 text-[15px] font-light leading-relaxed text-zen-on-surface">
            {lesson.topics.map((t, i) => (
              <li key={t} className="flex items-start justify-center gap-3">
                <span className="text-zen-on-surface-variant/60">٠{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={onStart}
        className="mt-16 inline-flex items-center gap-2 rounded-full bg-zen-primary px-12 py-4 text-[15px] font-medium text-white shadow-[var(--shadow-fab)] transition hover:opacity-90"
      >
        ابدأ الدرس الآن
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}
