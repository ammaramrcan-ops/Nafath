import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil, AlertCircle, ArrowRight, Clock, Hourglass, BarChart2, Home, ChevronDown } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { type Lesson, type Quizzes, defaultLesson, khulLesson } from "@/lib/lesson-data";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { ParagraphBlockCard } from "@/components/ParagraphBlock";
import { QuizSection } from "@/components/QuizSection";
import { BreathingBreak } from "@/components/BreathingBreak";
import { EndScreen } from "@/components/EndScreen";
import { MistakesLogModal } from "@/components/MistakesLog";
import { SmartNotesBar } from "@/components/SmartNotesBar";
import { type LearningLevel } from "@/components/PrepModal";
import { useSettings } from "@/lib/settings";
import { effectiveStages } from "@/lib/lesson-data";
import type { Stage } from "@/lib/settings";

type Phase = "welcome" | "pre-test" | "lesson" | "break" | "done";

function parseEstimatedMinutes(estStr?: string): number {
  if (!estStr) return 20;
  const match = estStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 20;
}

function formatMinSec(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
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
  const [learningLevel, setLearningLevel] = useState<LearningLevel>(1);
  const [blockIdx, setBlockIdx] = useState(0);
  const [showMistakesModal, setShowMistakesModal] = useState(false);

  // Stopwatches and per-stage adaptive speed tracking
  const [studyElapsedSeconds, setStudyElapsedSeconds] = useState(0);
  const [completedStageTimes, setCompletedStageTimes] = useState<number[]>([]);

  // Strict Anti-Distraction & Milestone Visibility States
  const [showMetrics, setShowMetrics] = useState(false);
  const [showFocusNotice, setShowFocusNotice] = useState(false);
  const [minuteCheckCount, setMinuteCheckCount] = useState(0);
  const [minuteStartTime, setMinuteStartTime] = useState(Date.now());
  const [triggeredMilestones, setTriggeredMilestones] = useState<number[]>([]);

  const { settings } = useSettings();
  const navigate = useNavigate();

  // Primary stopwatch timer
  useEffect(() => {
    if (phase !== "lesson" && phase !== "break") return;

    const timer = setInterval(() => {
      setStudyElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  const handleEdit = () => {
    localStorage.setItem("teacher.lesson.draft", JSON.stringify(lesson));
    navigate({ to: "/teacher" });
  };

  const handleStartFromPrep = (level: LearningLevel) => {
    setLearningLevel(level);
    setStudyElapsedSeconds(0);
    setCompletedStageTimes([]);
    setTriggeredMilestones([]);
    setMinuteCheckCount(0);
    setMinuteStartTime(Date.now());
    setShowFocusNotice(false);
    setBlockIdx(0);
    if (level === 1) {
      setPhase("lesson");
    } else {
      setPhase("pre-test");
    }
  };

  // Calculate total stages in the entire lesson for the selected learning level
  const totalStagesInLesson = useMemo(() => {
    return lesson.blocks.reduce((acc, block) => {
      const stages = effectiveStages(
        block,
        settings.stageOrder,
        learningLevel,
        lesson.levelStageOrders,
        lesson.levelDisabledStages
      );
      return acc + stages.length;
    }, 0);
  }, [lesson, settings.stageOrder, learningLevel]);

  // Handle stage completion inside ParagraphBlockCard to dynamically update estimation after EVERY single stage
  const handleStageChange = (_stageKey: Stage, timeSpentSeconds: number) => {
    setCompletedStageTimes((prev) => [...prev, Math.max(5, timeSpentSeconds)]);
  };

  // Adaptive Estimation Algorithm: Calculate average speed PER STAGE dynamically after every stage
  const completedStagesCount = completedStageTimes.length;
  const remainingStagesCount = Math.max(0, totalStagesInLesson - completedStagesCount);

  const avgSecsPerStage = useMemo(() => {
    if (completedStageTimes.length > 0) {
      const sum = completedStageTimes.reduce((acc, val) => acc + val, 0);
      return sum / completedStageTimes.length;
    }
    // Default estimated seconds per stage before any stage is completed
    const totalEstMins = parseEstimatedMinutes(lesson.estimatedTime);
    return (totalEstMins * 60) / Math.max(1, totalStagesInLesson);
  }, [completedStageTimes, lesson.estimatedTime, totalStagesInLesson]);

  const estRemainingSeconds = Math.max(0, Math.round(avgSecsPerStage * remainingStagesCount));

  // Calculate Progress Percentage based on Stage Completions
  const progressPercent =
    phase === "done"
      ? 100
      : Math.min(
          99,
          Math.max(
            5,
            Math.round((completedStagesCount / Math.max(1, totalStagesInLesson)) * 100)
          )
        );

  // Automatic Milestone Celebrations (at 25%, 50%, and 80%)
  useEffect(() => {
    if (phase !== "lesson") return;

    const checkMilestone = (milestone: number, message: string) => {
      if (progressPercent >= milestone && !triggeredMilestones.includes(milestone)) {
        setTriggeredMilestones((prev) => [...prev, milestone]);
        toast.success(message, { duration: 4000 });
        setShowMetrics(true);
        const t = setTimeout(() => setShowMetrics(false), 4500);
        return () => clearTimeout(t);
      }
    };

    checkMilestone(25, "رائع! حققت 25% من إنجاز الدرس 🚀");
    checkMilestone(50, "منتصف الطريق! أنجزت 50% من الدرس 👏");
    checkMilestone(80, "وشكت على الإتمام! أنجزت 80% من الدرس ✨");
  }, [progressPercent, phase, triggeredMilestones]);

  // Controlled Manual Check Request: Max 2 checks per minute, 3rd time displays friendly anti-distraction notice!
  const handleManualCheckRequest = () => {
    const now = Date.now();
    let currentCount = minuteCheckCount;

    // Reset minute counter if 60 seconds have elapsed
    if (now - minuteStartTime >= 60000) {
      currentCount = 0;
      setMinuteCheckCount(0);
      setMinuteStartTime(now);
    }

    if (currentCount < 2) {
      setMinuteCheckCount(currentCount + 1);
      setShowMetrics(true);
      setTimeout(() => setShowMetrics(false), 4000);
    } else {
      // Exceeded 2 checks within the same 60 seconds!
      setShowMetrics(false);
      setShowFocusNotice(true);
      toast("ركز في دراستك الآن، وستصل إلى هدفك قريباً! 🧠✨", {
        duration: 4000,
      });
      setTimeout(() => {
        setShowFocusNotice(false);
      }, 4000);
    }
  };

  const handleBlockCompletion = () => {
    const block = lesson.blocks[blockIdx];
    if (blockIdx + 1 >= lesson.blocks.length) {
      setPhase("done");
    } else if (block.enable_break === false) {
      setBlockIdx((i) => i + 1);
      setPhase("lesson");
    } else {
      setPhase("break");
    }
  };

  // Collect all quizzes across all blocks for the Pre-test phase
  const allMcqs = lesson.blocks.flatMap((b) => b.quizzes.mcqs);
  const allFills = lesson.blocks.flatMap((b) => b.quizzes.fills);
  const allEssays = lesson.blocks.flatMap((b) => b.quizzes.essays);

  const preTestQuizzes: Quizzes = {
    mcqs: allMcqs,
    fills: allFills,
    essays: allEssays,
  };

  return (
    <div className="relative min-h-screen bg-zen-surface font-sans text-zen-on-surface dir-rtl" dir="rtl">
      {/* Top Header Bar - Contains exit, dynamic study metrics, and shortcuts without overlapping */}
      <header className="sticky top-0 z-40 border-b border-zen-surface-container bg-white/90 backdrop-blur-md px-6 py-3 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          {/* Right Exit Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="inline-flex items-center gap-1.5 rounded-full border border-zen-surface-container bg-zen-surface-low px-4 py-2 text-xs font-bold text-zen-on-surface hover:bg-zen-surface-container transition cursor-pointer"
            >
              <Home className="h-4 w-4 text-zen-primary" />
              <span>{exitLabel || "الرئيسية"}</span>
            </button>
          </div>

          {/* Center Dynamic Study Metrics (Max 2 checks/min + Friendly Focus Notice) */}
          {(phase === "lesson" || phase === "break") && (
            <div className="relative flex items-center justify-center min-h-[38px]">
              <AnimatePresence mode="wait">
                {showFocusNotice ? (
                  <motion.div
                    key="focus-notice"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-5 py-1.5 text-xs font-black text-amber-950 border border-amber-300 shadow-md animate-pulse"
                  >
                    <span>🧠 ركز في دراستك الآن، وستصل إلى هدفك قريباً! ✨</span>
                  </motion.div>
                ) : !showMetrics ? (
                  <motion.button
                    key="trigger-pill"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    onClick={handleManualCheckRequest}
                    onMouseEnter={handleManualCheckRequest}
                    className="inline-flex items-center gap-2 rounded-full bg-zen-surface-low px-4 py-1.5 text-xs font-bold text-zen-on-surface-variant hover:text-zen-primary hover:bg-zen-surface-container transition border border-zen-surface-container cursor-pointer shadow-xs"
                    title="انقر أو مرّر بالماوس لمعاينة التقدم (بحد أقصى مرتين في الدقيقة لمنع التشتت)"
                  >
                    <Clock className="h-3.5 w-3.5 text-zen-primary animate-pulse" />
                    <span>المؤشرات والتقدم 📊</span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </motion.button>
                ) : (
                  <motion.div
                    key="full-metrics"
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    onClick={() => setShowMetrics(false)}
                    className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 rounded-full bg-zen-surface-low px-5 py-2 border border-zen-surface-container text-xs font-bold shadow-inner cursor-pointer"
                    title="انقر لإخفاء المؤشرات للتركيز"
                  >
                    {/* Progress Percentage */}
                    <div className="flex items-center gap-2">
                      <span className="text-zen-primary font-bold flex items-center gap-1">
                        <BarChart2 className="h-3.5 w-3.5" />
                        الإنجاز: {progressPercent}%
                      </span>
                      <div className="h-2 w-16 rounded-full bg-zen-surface-container overflow-hidden">
                        <div
                          className="h-full bg-zen-primary transition-all duration-500 rounded-full"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <span className="h-4 w-px bg-zen-surface-container hidden sm:inline" />

                    {/* Stopwatch (بقالي قد ايه بذاكر) */}
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Clock className="h-3.5 w-3.5 text-blue-600" />
                      <span>مدة الدراسة:</span>
                      <span className="font-mono text-blue-950 font-bold bg-white px-2 py-0.5 rounded-md border border-blue-200 shadow-xs">
                        {formatMinSec(studyElapsedSeconds)}
                      </span>
                    </div>

                    <span className="h-4 w-px bg-zen-surface-container hidden sm:inline" />

                    {/* Adaptive Dynamic Time Remaining */}
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Hourglass className="h-3.5 w-3.5 text-amber-600" />
                      <span>المتبقي التكيّفي:</span>
                      <span className="font-mono text-amber-950 font-bold bg-white px-2 py-0.5 rounded-md border border-amber-200 shadow-xs">
                        {formatMinSec(estRemainingSeconds)}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Left Controls: Mistakes Log & Edit Button (Default Templates Only) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMistakesModal(true)}
              className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-900 border border-amber-200 hover:bg-amber-100 transition cursor-pointer shadow-xs"
              title="سجل الأخطاء"
            >
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="hidden sm:inline">سجل الأخطاء</span>
            </button>

            {(lesson.title === defaultLesson.title || lesson.title === khulLesson.title) && (
              <button
                onClick={handleEdit}
                className="rounded-full bg-zen-surface-low p-2 text-zen-on-surface-variant hover:bg-white hover:text-zen-primary transition border border-zen-surface-container cursor-pointer shadow-xs"
                title="تعديل الدرس الافتراضي"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Study Flow Body */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${phase}-${blockIdx}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
        >
          {phase === "welcome" && (
            <WelcomeScreen lesson={lesson} onStart={handleStartFromPrep} />
          )}

          {/* Pre-test Phase for Level 2 & Level 3 */}
          {phase === "pre-test" && (
            <div className="mx-auto min-h-screen w-full max-w-[85vw] px-6 py-12 dir-rtl" dir="rtl">
              <div className="mb-8 text-center space-y-2">
                <span className="inline-block rounded-full bg-amber-100 px-4 py-1 text-xs font-bold text-amber-800">
                  {learningLevel === 2 ? "الاختبار القبلي — المستوى الثاني (مسح وفهم دقيق)" : "الاختبار القبلي الشامل — المستوى الثالث (إتقان وتحدي صارم)"}
                </span>
                <h2 className="text-2xl font-bold text-zen-on-surface">قياس المستوى القبلي</h2>
                <p className="text-xs text-zen-on-surface-variant">
                  أجب عن الأسئلة التالية لتحديد حصيلتك واختبار استيعابك المبسط قبل البدء بالشرح التفاعلي.
                </p>
              </div>

              <QuizSection
                quizzes={preTestQuizzes}
                type={learningLevel === 2 ? "mcq" : "all"}
                lessonTitle={lesson.title}
                onAllCorrect={() => {
                  setPhase("lesson");
                }}
              />

              <div className="mt-8 text-center">
                <button
                  onClick={() => setPhase("lesson")}
                  className="inline-flex items-center gap-2 rounded-full bg-white border border-zen-surface-container px-6 py-2.5 text-xs font-bold text-zen-on-surface-variant hover:bg-zen-surface-low transition cursor-pointer"
                >
                  تخطي الاختبار القبلي والانتقال إلى الدرس مباشرة
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {phase === "lesson" && (
            <ParagraphBlockCard
              key={lesson.blocks[blockIdx].id}
              block={lesson.blocks[blockIdx]}
              stageOrder={effectiveStages(
                lesson.blocks[blockIdx],
                settings.stageOrder,
                learningLevel,
                lesson.levelStageOrders,
                lesson.levelDisabledStages
              )}
              mode="student"
              subjectId={lesson.subjectId}
              onStageChange={handleStageChange}
              onComplete={handleBlockCompletion}
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

      <MistakesLogModal
        isOpen={showMistakesModal}
        onClose={() => setShowMistakesModal(false)}
        subjectId={lesson.subjectId}
      />

      {/* Permanently Pinned Smart Notes Bar */}
      {phase === "lesson" && <SmartNotesBar lessonTitle={lesson.title} />}
    </div>
  );
}
