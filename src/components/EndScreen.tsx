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
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-12 text-center">
        <p className="mb-3 text-[13px] font-medium tracking-wide text-zen-on-surface-variant">
          أحسنت
        </p>
        <h1 className="text-[40px] font-medium leading-[1.2] text-zen-on-surface">
          أتممت الدرس
        </h1>
        <p className="mt-4 text-[14px] font-light text-zen-on-surface-variant">
          راجع الزتونة ثم ثبّت المعلومات بالبطاقات أدناه
        </p>
      </div>

      <CheatSheet lesson={lesson} />

      <div className="mt-16">
        <div className="mb-10 text-center">
          <h2 className="text-[28px] font-medium leading-tight text-zen-on-surface">
            بطاقات المراجعة
          </h2>
          <p className="mt-3 text-[13px] font-light text-zen-on-surface-variant">
            انقر على البطاقة لقلبها وعرض التعريف
          </p>
        </div>
        <Flashcards words={allHardWords} embedded />
      </div>

      <div className="mt-16 text-center">
        <button
          onClick={onRestart}
          className="rounded-full bg-zen-primary px-12 py-4 text-[15px] font-medium text-white shadow-[var(--shadow-fab)] transition hover:opacity-90"
        >
          {restartLabel ?? "ابدأ درساً جديداً"}
        </button>
      </div>
    </div>
  );
}
