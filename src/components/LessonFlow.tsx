import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { type Lesson } from "@/lib/lesson-data";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { ParagraphBlockCard } from "@/components/ParagraphBlock";
import { QuizSection } from "@/components/QuizSection";
import { BreathingBreak } from "@/components/BreathingBreak";
import { EndScreen } from "@/components/EndScreen";
import { useSettings } from "@/lib/settings";
import { effectiveStages } from "@/lib/lesson-data";

type Phase = "welcome" | "lesson" | "quiz_mcq" | "quiz_fill" | "quiz_essay" | "break" | "done";

function nextQuizPhase(
  current: "quiz_mcq" | "quiz_fill" | "quiz_essay",
  block: { quizzes: { mcqs: unknown[]; fills: unknown[]; essays: unknown[] } },
): "quiz_fill" | "quiz_essay" | null {
  if (current === "quiz_mcq" && block.quizzes.fills.length > 0) return "quiz_fill";
  if ((current === "quiz_mcq" || current === "quiz_fill") && block.quizzes.essays.length > 0) return "quiz_essay";
  return null;
}

function firstQuizPhase(block: {
  quizzes: { mcqs: unknown[]; fills: unknown[]; essays: unknown[] };
}): "quiz_mcq" | "quiz_fill" | "quiz_essay" | null {
  if (block.quizzes.mcqs.length > 0) return "quiz_mcq";
  if (block.quizzes.fills.length > 0) return "quiz_fill";
  if (block.quizzes.essays.length > 0) return "quiz_essay";
  return null;
}

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

  return (
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
              const first = block.quiz_enabled !== false ? firstQuizPhase(block) : null;
              if (first) {
                setPhase(first);
              } else if (blockIdx + 1 >= lesson.blocks.length) {
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

        {(phase === "quiz_mcq" || phase === "quiz_fill" || phase === "quiz_essay") && (
          <QuizPhase
            key={`${phase}-${blockIdx}`}
            lesson={lesson}
            blockIdx={blockIdx}
            type={phase === "quiz_mcq" ? "mcq" : phase === "quiz_fill" ? "fill" : "essay"}
            isLast={
              blockIdx + 1 >= lesson.blocks.length &&
              nextQuizPhase(phase, lesson.blocks[blockIdx]) === null
            }
            onNext={() => {
              const next = nextQuizPhase(phase, lesson.blocks[blockIdx]);
              if (next) {
                setPhase(next);
                return;
              }
              if (blockIdx + 1 >= lesson.blocks.length) {
                setPhase("done");
              } else if (lesson.blocks[blockIdx].enable_break === false) {
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
  );
}

function QuizPhase({
  lesson,
  blockIdx,
  isLast,
  type,
  onNext,
}: {
  lesson: Lesson;
  blockIdx: number;
  isLast?: boolean;
  type: "mcq" | "fill" | "essay";
  onNext: () => void;
}) {
  const [passed, setPassed] = useState(false);
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <QuizSection
        quizzes={lesson.blocks[blockIdx].quizzes}
        type={type}
        onAllCorrect={() => setPassed(true)}
      />
      {passed && (
        <div className="mt-10 text-center">
          <button
            onClick={onNext}
            className="rounded-full bg-success px-10 py-4 text-base font-semibold text-success-foreground shadow-[var(--shadow-soft)] transition hover:bg-success/90"
          >
            {isLast ? "إنهاء الدرس ←" : "المرحلة التالية ←"}
          </button>
        </div>
      )}
    </div>
  );
}
