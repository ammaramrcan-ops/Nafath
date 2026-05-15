import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { type Lesson } from "@/lib/lesson-data";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { ParagraphBlockCard } from "@/components/ParagraphBlock";
import { QuizSection } from "@/components/QuizSection";
import { BreathingBreak } from "@/components/BreathingBreak";
import { EndScreen } from "@/components/EndScreen";
import { useSettings } from "@/lib/settings";
import { effectiveStages } from "@/lib/lesson-data";

type Phase = "welcome" | "lesson" | "break" | "done";

export function LessonFlow({
  lesson,
  onExit,
  exitLabel,
}: {
  lesson: Lesson;
  onExit: () => void;
  exitLabel?: string;
}) {
  const [phase, setPhase] = useState<Phase>("welcome");
  const [blockIdx, setBlockIdx] = useState(0);
  const { settings } = useSettings();
  const navigate = useNavigate();

  const handleEdit = () => {
    localStorage.setItem("teacher.lesson.draft", JSON.stringify(lesson));
    navigate({ to: "/teacher" });
  };

  return (
    <div className="relative">
      {/* Quick Edit Shortcut */}
      <button
        onClick={handleEdit}
        className="fixed left-6 top-6 z-50 rounded-full bg-white/40 p-2 text-zen-on-surface-variant/40 backdrop-blur-sm transition hover:bg-white hover:text-zen-primary hover:shadow-sm"
        title="تعديل الدرس"
      >
        <Pencil className="h-4 w-4" />
      </button>

      <AnimatePresence mode="wait">
      <motion.div
        key={`${phase}-${blockIdx}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3 }}
      >
        {phase === "welcome" && (
          <WelcomeScreen lesson={lesson} onStart={() => setPhase("lesson")} />
        )}

        {phase === "lesson" && (
          <ParagraphBlockCard
            key={lesson.blocks[blockIdx].id}
            block={lesson.blocks[blockIdx]}
            stageOrder={effectiveStages(lesson.blocks[blockIdx], settings.stageOrder)}
            mode="student"
            onComplete={() => {
              const block = lesson.blocks[blockIdx];
              if (blockIdx + 1 >= lesson.blocks.length) {
                setPhase("done");
              } else if (block.enable_break === false) {
                setBlockIdx((i) => i + 1);
                setPhase("lesson");
              } else {
                setPhase("break");
              }
            }}
          />
        )}

        {phase === "break" && (
          <BreathingBreak
            duration={lesson.blocks[blockIdx]?.break_duration ?? 60}
            onComplete={() => {
              setBlockIdx((i) => i + 1);
              setPhase("lesson");
            }}
          />
        )}

        {phase === "done" && (
          <EndScreen lesson={lesson} onRestart={onExit} restartLabel={exitLabel} />
        )}
      </motion.div>
      </AnimatePresence>
    </div>
  );
}
