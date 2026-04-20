import { Clock, BookOpen, Layers, ArrowLeft } from "lucide-react";
import type { Lesson } from "@/lib/lesson-data";

export function WelcomeScreen({ lesson, onStart }: { lesson: Lesson; onStart: () => void }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">{lesson.title}</h1>

      <div className="mt-10 space-y-4 text-base text-foreground/70">
        <p className="flex items-center justify-center gap-2">
          <Clock className="h-5 w-5 text-brand" />
          الوقت المقدر: {lesson.estimatedTime}
        </p>
        <p className="flex items-center justify-center gap-2">
          <BookOpen className="h-5 w-5 text-brand" />
          الحجم: {lesson.size}
        </p>
      </div>

      <div className="mt-10 w-full">
        <p className="mb-3 flex items-center justify-center gap-2 text-sm text-foreground/50">
          <Layers className="h-4 w-4" />
          مواضيع الدرس
        </p>
        <ul className="space-y-2 text-foreground/80">
          {lesson.topics.map((t, i) => (
            <li key={t} className="text-base">
              {i + 1}. {t}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onStart}
        className="mt-12 inline-flex items-center gap-2 rounded-full bg-brand px-10 py-4 text-lg text-brand-foreground shadow-[var(--shadow-soft)] hover:bg-brand/90"
      >
        ابدأ الدرس الآن
        <ArrowLeft className="h-5 w-5" />
      </button>
    </div>
  );
}
