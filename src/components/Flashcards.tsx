import { useState } from "react";
import { motion } from "framer-motion";
import type { HardWord } from "@/lib/lesson-data";

function FlipCard({ front, back }: { front: string; back: string }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      onClick={() => setFlipped((v) => !v)}
      className="relative h-48 w-full [perspective:1000px]"
      aria-label="بطاقة"
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5 }}
        className="relative h-full w-full [transform-style:preserve-3d]"
      >
        <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-white p-6 text-center text-[20px] font-medium text-zen-on-surface shadow-[var(--shadow-soft)] [backface-visibility:hidden]">
          {front}
        </div>
        <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-zen-primary-container/40 p-6 text-center text-[15px] font-light leading-relaxed text-zen-on-surface shadow-[var(--shadow-soft)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
          {back}
        </div>
      </motion.div>
    </button>
  );
}

export function Flashcards({
  words,
  onRestart,
  embedded = false,
}: {
  words: HardWord[];
  onRestart?: () => void;
  embedded?: boolean;
}) {
  const grid =
    words.length === 0 ? (
      <p className="text-center text-[14px] font-light text-zen-on-surface-variant">
        لا توجد مصطلحات للمراجعة في هذا الدرس.
      </p>
    ) : (
      <div className="grid gap-5 sm:grid-cols-2">
        {words.map((w, i) => (
          <FlipCard key={`${w.word}-${i}`} front={w.word} back={w.meaning} />
        ))}
      </div>
    );

  if (embedded) return grid;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-12 text-center">
        <h2 className="text-[32px] font-medium leading-tight text-zen-on-surface">
          بطاقات المراجعة
        </h2>
        <p className="mt-3 text-[14px] font-light text-zen-on-surface-variant">
          انقر على البطاقة لقلبها وعرض التعريف
        </p>
      </div>

      {grid}

      {onRestart && (
        <div className="mt-14 text-center">
          <button
            onClick={onRestart}
            className="rounded-full bg-zen-primary px-12 py-4 text-[15px] font-medium text-white shadow-[var(--shadow-fab)] transition hover:opacity-90"
          >
            ابدأ درساً جديداً
          </button>
        </div>
      )}
    </div>
  );
}
