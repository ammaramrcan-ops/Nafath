import { useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, Home, ArrowLeft } from "lucide-react";
import type { Lesson } from "@/lib/lesson-data";
import { CheatSheet } from "@/components/CheatSheet";
import { Flashcards } from "@/components/Flashcards";
import { useSettings } from "@/lib/settings";
import { effectiveStages } from "@/lib/lesson-data";

export function EndScreen({
  lesson,
  onRestart,
  restartLabel,
}: {
  lesson: Lesson;
  onRestart: () => void;
  restartLabel?: string;
}) {
  const { settings } = useSettings();
  const allHardWords = useMemo(
    () => lesson.blocks.flatMap((b) => b.hard_words),
    [lesson],
  );

  const hasZatona = useMemo(() => {
    const hasAnyZatonaContent = lesson.blocks.some(b => 
      b.zaitouna?.definitions || b.zaitouna?.reasoning || b.zaitouna?.links
    );
    const hasAnyDefinitions = lesson.blocks.some(b => b.hard_words.length > 0);
    const hasAnyEssays = lesson.blocks.some(b => (b.quizzes?.essays ?? []).length > 0);
    
    return hasAnyZatonaContent || hasAnyDefinitions || hasAnyEssays;
  }, [lesson]);

  if (!hasZatona) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 200 }}
          className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-zen-primary/10 text-zen-primary shadow-inner"
        >
          <Trophy className="h-12 w-12" strokeWidth={1.5} />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="mb-2 text-[14px] font-medium tracking-widest text-zen-primary uppercase">أحسنت بطل!</p>
          <h1 className="mb-4 text-[42px] font-medium leading-tight text-zen-on-surface sm:text-[52px]">
            أتممت الدرس بنجاح
          </h1>
          <p className="mx-auto max-w-md text-[16px] font-light leading-relaxed text-zen-on-surface-variant">
            لقد استكملت جميع مراحل الدرس المقررة بنجاح. أنت الآن جاهز للمضي قدماً في رحلتك التعليمية.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <button
            onClick={onRestart}
            className="group relative flex items-center gap-3 overflow-hidden rounded-full bg-zen-primary px-10 py-4 text-[16px] font-medium text-white shadow-[var(--shadow-fab)] transition hover:opacity-90 active:scale-95"
          >
            <Home className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
            <span>{restartLabel ?? "العودة للرئيسية"}</span>
            <ArrowLeft className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-[-4px] group-hover:opacity-100" />
          </button>
        </motion.div>
      </div>
    );
  }

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
          راجع الزتونة واسترجع أهم النقاط التي تعلمتها
        </p>
      </div>

      <CheatSheet lesson={lesson} />

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
