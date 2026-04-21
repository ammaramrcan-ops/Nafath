import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { type Lesson } from "@/lib/lesson-data";
import { HomeUpload } from "@/components/HomeUpload";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { ParagraphBlockCard } from "@/components/ParagraphBlock";
import { QuizSection } from "@/components/QuizSection";
import { Flashcards } from "@/components/Flashcards";
import { BreathingBreak } from "@/components/BreathingBreak";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "متكيف — منصة التعلم المتكيف" },
      {
        name: "description",
        content: "ارفع درسك واحصل على تجربة تعلم متكيفة بمراحل تدريجية وخرائط ذهنية وبطاقات مراجعة.",
      },
    ],
  }),
});

type Phase = "home" | "welcome" | "lesson" | "quiz" | "break" | "done";

function Index() {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [phase, setPhase] = useState<Phase>("home");
  const [blockIdx, setBlockIdx] = useState(0);

  const allHardWords = useMemo(
    () => (lesson ? lesson.blocks.flatMap((b) => b.hard_words) : []),
    [lesson],
  );

  const reset = () => {
    setLesson(null);
    setPhase("home");
    setBlockIdx(0);
  };

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-background font-sans">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${phase}-${blockIdx}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
        >
          {phase === "home" && (
            <HomeUpload
              onLoad={(l) => {
                setLesson(l);
                setBlockIdx(0);
                setPhase("welcome");
              }}
            />
          )}

          {phase === "welcome" && lesson && (
            <WelcomeScreen lesson={lesson} onStart={() => setPhase("lesson")} />
          )}

          {phase === "lesson" && lesson && (
            <ParagraphBlockCard
              key={lesson.blocks[blockIdx].id}
              block={lesson.blocks[blockIdx]}
              onComplete={() => setPhase("quiz")}
            />
          )}

          {phase === "quiz" && lesson && (
            <QuizPhase
              key={`quiz-${blockIdx}`}
              lesson={lesson}
              blockIdx={blockIdx}
              isLast={blockIdx + 1 >= lesson.blocks.length}
              onNext={() => {
                if (blockIdx + 1 >= lesson.blocks.length) {
                  setPhase("done");
                } else {
                  setPhase("break");
                }
              }}
            />
          )}

          {phase === "break" && lesson && (
            <BreathingBreak
              onComplete={() => {
                setBlockIdx((i) => i + 1);
                setPhase("lesson");
              }}
            />
          )}

          {phase === "done" && lesson && (
            <Flashcards words={allHardWords} onRestart={reset} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function QuizPhase({
  lesson,
  blockIdx,
  isLast,
  onNext,
}: {
  lesson: Lesson;
  blockIdx: number;
  isLast: boolean;
  onNext: () => void;
}) {
  const [passed, setPassed] = useState(false);
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <QuizSection
        quizzes={lesson.blocks[blockIdx].quizzes}
        onAllCorrect={() => setPassed(true)}
      />
      {passed && (
        <div className="mt-10 text-center">
          <button
            onClick={onNext}
            className="rounded-full bg-success px-10 py-4 text-base font-semibold text-success-foreground shadow-[var(--shadow-soft)] transition hover:bg-success/90"
          >
            {isLast ? "إنهاء الدرس ←" : "الفقرة التالية ←"}
          </button>
        </div>
      )}
    </div>
  );
}
