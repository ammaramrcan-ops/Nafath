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
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-brand-soft to-background p-6 text-center text-xl font-bold text-foreground [backface-visibility:hidden]">
          {front}
        </div>
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl border border-success/30 bg-success-soft p-6 text-center text-base leading-relaxed text-foreground [backface-visibility:hidden] [transform:rotateY(180deg)]">
          {back}
        </div>
      </motion.div>
    </button>
  );
}

export function Flashcards({ words, onRestart }: { words: HardWord[]; onRestart: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-3 text-center text-5xl">🎉</div>
      <h2 className="mb-2 text-center text-3xl font-extrabold">أحسنت! أتممت الدرس</h2>
      <p className="mb-10 text-center text-foreground/60">
        بطاقات المراجعة السريعة — انقر على البطاقة لقلبها
      </p>

      {words.length === 0 ? (
        <p className="text-center text-foreground/50">لا توجد مصطلحات للمراجعة في هذا الدرس.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {words.map((w, i) => (
            <FlipCard key={`${w.word}-${i}`} front={w.word} back={w.meaning} />
          ))}
        </div>
      )}

      <div className="mt-12 text-center">
        <button
          onClick={onRestart}
          className="rounded-full bg-brand px-10 py-4 text-base font-semibold text-brand-foreground shadow-[var(--shadow-soft)] hover:bg-brand/90"
        >
          ابدأ درساً جديداً
        </button>
      </div>
    </div>
  );
}
