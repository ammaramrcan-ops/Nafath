import { useMemo } from "react";
import type { Lesson } from "@/lib/lesson-data";
import { CheatSheet } from "@/components/CheatSheet";
import { Flashcards } from "@/components/Flashcards";

export function EndScreen({
  lesson,
  onRestart,
  restartLabel,
}: {
  lesson: Lesson;
  onRestart: () => void;
  restartLabel?: string;
}) {
  const allHardWords = useMemo(
    () => lesson.blocks.flatMap((b) => b.hard_words),
    [lesson],
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8 text-center">
        <div className="mb-3 text-5xl">🎉</div>
        <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
          أحسنت! أتممت الدرس
        </h1>
        <p className="mt-2 text-foreground/60">
          راجع الزتونة ثم ثبّت المعلومات بالبطاقات أدناه
        </p>
      </div>

      <CheatSheet lesson={lesson} />

      <div className="mt-12">
        <h2 className="mb-2 text-center text-2xl font-extrabold">بطاقات المراجعة</h2>
        <p className="mb-8 text-center text-sm text-foreground/60">
          انقر على البطاقة لقلبها وعرض التعريف
        </p>
        <Flashcards words={allHardWords} embedded />
      </div>

      <div className="mt-12 text-center">
        <button
          onClick={onRestart}
          className="rounded-full bg-brand px-10 py-4 text-base font-semibold text-brand-foreground shadow-[var(--shadow-soft)] transition hover:bg-brand/90"
        >
          {restartLabel ?? "ابدأ درساً جديداً"}
        </button>
      </div>
    </div>
  );
}
