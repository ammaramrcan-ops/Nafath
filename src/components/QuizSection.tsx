import { useEffect, useMemo, useState, useRef } from "react";
import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  Tag,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Award,
  Clock,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Quizzes, MCQ, Fill, Essay } from "@/lib/lesson-data";
import { cn } from "@/lib/utils";
import { recordMistake } from "@/lib/mistakes";
import { useSettings } from "@/lib/settings";
import { SmartNotesModal } from "./SmartNotesModal";

type Status = "idle" | "correct" | "wrong";

export type QuestionMetrics = {
  status: Status;
  errorCount: number;
  hintUsed: boolean;
  userDifficulty?: "easy" | "medium" | "hard";
  autoDifficulty?: "easy" | "medium" | "hard";
  responseTimeMs?: number;
};

function normalize(s: string) {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

function padMcqsToMinimumFive(rawMcqs: MCQ[]): MCQ[] {
  if (rawMcqs.length >= 5) return rawMcqs;

  const padded = [...rawMcqs];
  const templates: Omit<MCQ, "question">[] = [
    {
      options: [
        "التحديد الدقيق للمفاهيم والتطبيق الضابط",
        "العمل بدون علم أو دراية",
        "إلغاء القواعد الأساسية",
      ],
      answer: "التحديد الدقيق للمفاهيم والتطبيق الضابط",
      tags: ["#التطبيقات_الفقهية"],
    },
    {
      options: [
        "مراعاة الأحكام الضابطة وتيسير التعلم",
        "إطالة الشرح دون فائدة",
        "إحداث التشتت والتعقيد",
      ],
      answer: "مراعاة الأحكام الضابطة وتيسير التعلم",
      tags: ["#ضوابط_الأحكام"],
    },
    {
      options: [
        "الفهم التفاعلي والربط الذهني الفعال",
        "الحفظ الصم بدون استيعاب",
        "ترك القراءة والتطبيق",
      ],
      answer: "الفهم التفاعلي والربط الذهني الفعال",
      tags: ["#الاستيعاب_الذهني"],
    },
    {
      options: [
        "الالتزام بالضوابط الشرعية والعملية الصحيحة",
        "تجاوز الأركان والشروط",
        "إهمال التقييم الذاتي",
      ],
      answer: "الالتزام بالضوابط الشرعية والعملية الصحيحة",
      tags: ["#الأركان_والشروط"],
    },
  ];

  let idx = 0;
  while (padded.length < 5) {
    const template = templates[idx % templates.length];
    padded.push({
      question: `سؤال استيعابي إضافي (${padded.length + 1}): ما هي النتيجة العملية الأهم للفقرة المذكورة؟`,
      options: template.options,
      answer: template.answer,
      difficulty: "easy",
      tags: template.tags,
    });
    idx++;
  }

  return padded;
}

type UnifiedQuestion =
  | { kind: "mcq"; data: MCQ; id: string }
  | { kind: "fill"; data: Fill; id: string }
  | { kind: "essay"; data: Essay; id: string };

export function QuizSection({
  quizzes,
  type = "all",
  stage,
  lessonTitle = "",
  subjectId,
  onAllCorrect,
}: {
  quizzes: Quizzes;
  type?: "mcq" | "fill" | "essay" | "all";
  stage?: string;
  lessonTitle?: string;
  subjectId?: string;
  onAllCorrect: () => void;
}) {
  const showMcq = type === "all" || type === "mcq";
  const showFill = type === "all" || type === "fill";
  const showEssay = type === "all" || type === "essay";

  let rawMcqs = !showMcq
    ? []
    : quizzes.mcqs.filter(
        (q) => (q.question.trim() || q.image_url?.trim()) && q.options.some((o) => o.trim()),
      );

  const mcqs = useMemo(() => {
    if (showMcq && rawMcqs.length > 0) {
      return padMcqsToMinimumFive(rawMcqs);
    }
    return rawMcqs;
  }, [showMcq, rawMcqs, lessonTitle]);

  const fills = !showFill
    ? []
    : quizzes.fills.filter((q) => (q.question.trim() || q.image_url?.trim()) && q.answer.trim());
  const essays = !showEssay
    ? []
    : quizzes.essays.filter((q) => q.question.trim() || q.image_url?.trim());

  const unifiedList = useMemo<UnifiedQuestion[]>(() => {
    const list: UnifiedQuestion[] = [];
    mcqs.forEach((q, i) => list.push({ kind: "mcq", data: q, id: `mcq-${i}` }));
    fills.forEach((q, i) => list.push({ kind: "fill", data: q, id: `fill-${i}` }));
    essays.forEach((q, i) => list.push({ kind: "essay", data: q, id: `essay-${i}` }));
    return list;
  }, [mcqs, fills, essays]);

  const { devModeActive } = useSettings();
  const total = unifiedList.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [metrics, setMetrics] = useState<Record<string, QuestionMetrics>>({});

  const correctCount = useMemo(
    () => Object.values(metrics).filter((m) => m.status === "correct").length,
    [metrics],
  );

  const allCorrect = total === 0 || correctCount === total;

  const onAllCorrectRef = useRef(onAllCorrect);
  const hasCalledOnAllCorrect = useRef(false);

  useEffect(() => {
    onAllCorrectRef.current = onAllCorrect;
  });

  useEffect(() => {
    hasCalledOnAllCorrect.current = false;
  }, [stage]);

  useEffect(() => {
    if ((total === 0 || correctCount === total) && !hasCalledOnAllCorrect.current) {
      hasCalledOnAllCorrect.current = true;
      onAllCorrectRef.current();
    }
  }, [correctCount, total]);

  const setMetric = (key: string, metric: Partial<QuestionMetrics>) => {
    setMetrics((prev) => {
      const current = prev[key] || {
        status: "idle",
        errorCount: 0,
        hintUsed: false,
      };
      const next = {
        ...prev,
        [key]: { ...current, ...metric },
      };

      if (
        total === 0 ||
        Object.values(next).filter((m) => m.status === "correct").length === total
      ) {
        const stats = Object.fromEntries(Object.entries(next).map(([id, m]) => [id, m]));

        const existingStats = JSON.parse(localStorage.getItem("nafath_quiz_stats") ?? "{}");
        const mergedStats = { ...existingStats, ...stats };
        localStorage.setItem("nafath_quiz_stats", JSON.stringify(mergedStats));
      }
      return next;
    });
  };

  const activeQuestion = unifiedList[currentIndex];

  if (total === 0) {
    return (
      <div className="p-8 text-center text-xs font-bold text-slate-400">
        لا توجد أسئلة لهذه الفقرة.
      </div>
    );
  }

  return (
    <div className="w-full max-w-[85vw] mx-auto space-y-6 dir-rtl text-right" dir="rtl">
      {/* Header Stepper Indicator & Analytics */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#e0c0b1]/40 space-y-4">
        <div className="flex items-center justify-between text-xs sm:text-sm font-extrabold text-[#0b1c30]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#9d4300] animate-pulse" />
            <span>
              السؤال {currentIndex + 1} من {total}
            </span>
          </div>

          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#eff4ff] text-[#9d4300]">
            <Award className="h-4 w-4" />
            <span>
              الأسئلة الصحيحة: {correctCount} / {total}
            </span>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="flex gap-1.5 h-2 w-full">
          {unifiedList.map((qItem, idx) => {
            const m = metrics[qItem.id];
            const isDone = m?.status === "correct";
            const isCurrent = idx === currentIndex;
            return (
              <div
                key={qItem.id}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "h-full flex-1 rounded-full transition-all duration-300 cursor-pointer",
                  isDone
                    ? "bg-emerald-500"
                    : isCurrent
                      ? "bg-[#9d4300]"
                      : "bg-slate-200 hover:bg-slate-300",
                )}
                title={`انتقل للسؤال ${idx + 1}`}
              />
            );
          })}
        </div>
      </div>

      {/* Main Single Question Canvas Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeQuestion?.id || currentIndex}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="rounded-[2.5rem] bg-white p-8 sm:p-12 shadow-[0_20px_50px_-15px_rgba(11,28,48,0.06)] border border-[#e0c0b1]/40 space-y-8 min-h-[460px]"
        >
          {activeQuestion?.kind === "mcq" && (
            <McqHybridCard
              num={currentIndex + 1}
              q={activeQuestion.data}
              lessonTitle={lessonTitle}
              isLastQuestion={currentIndex === total - 1}
              metric={
                metrics[activeQuestion.id] || {
                  status: "idle",
                  errorCount: 0,
                  hintUsed: false,
                }
              }
              setMetric={(m) => setMetric(activeQuestion.id, m)}
              onNext={() => {
                if (currentIndex < total - 1) {
                  setCurrentIndex((i) => i + 1);
                } else {
                  onAllCorrect();
                }
              }}
            />
          )}

          {activeQuestion?.kind === "fill" && (
            <FillHybridCard
              num={currentIndex + 1}
              q={activeQuestion.data}
              lessonTitle={lessonTitle}
              subjectId={subjectId}
              metric={
                metrics[activeQuestion.id] || {
                  status: "idle",
                  errorCount: 0,
                  hintUsed: false,
                }
              }
              setMetric={(m) => setMetric(activeQuestion.id, m)}
              onNext={() => {
                if (currentIndex < total - 1) {
                  setCurrentIndex((i) => i + 1);
                } else {
                  onAllCorrect();
                }
              }}
            />
          )}

          {activeQuestion?.kind === "essay" && (
            <EssayHybridCard
              num={currentIndex + 1}
              q={activeQuestion.data}
              metric={
                metrics[activeQuestion.id] || {
                  status: "idle",
                  errorCount: 0,
                  hintUsed: false,
                }
              }
              setMetric={(m) => setMetric(activeQuestion.id, m)}
              onNext={() => {
                if (currentIndex < total - 1) {
                  setCurrentIndex((i) => i + 1);
                } else {
                  onAllCorrect();
                }
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Nav Controls */}
      {(() => {
        const activeMetric = activeQuestion ? metrics[activeQuestion.id] : null;
        const isQuestionAnswered = activeMetric && activeMetric.status !== "idle";
        const canProceedNext = devModeActive || isQuestionAnswered;

        return (
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="px-6 py-3 rounded-full bg-white border border-[#e0c0b1]/50 text-xs font-extrabold text-[#584237] hover:bg-[#eff4ff] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              <span>السؤال السابق</span>
            </button>

            <button
              type="button"
              disabled={!canProceedNext}
              onClick={() => {
                if (currentIndex < total - 1) {
                  setCurrentIndex((i) => i + 1);
                } else {
                  onAllCorrect();
                }
              }}
              title={!canProceedNext ? "يرجى الإجابة على السؤال أولاً للمتابعة" : ""}
              className={cn(
                "px-6 py-3 rounded-full text-xs font-extrabold transition flex items-center gap-2 shadow-sm",
                !canProceedNext
                  ? "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-60 shadow-none"
                  : currentIndex === total - 1
                    ? "bg-[#9d4300] hover:bg-[#833800] text-white cursor-pointer"
                    : "bg-[#213145] hover:bg-[#0b1c30] text-white cursor-pointer",
              )}
            >
              <span>
                {currentIndex === total - 1
                  ? "إكمال الاختبار والانتقال للمرحلة التالية ✨"
                  : "السؤال التالي"}
              </span>
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>
        );
      })()}

      {allCorrect && total > 0 && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-3xl bg-emerald-600 text-white p-6 text-center shadow-lg space-y-2"
        >
          <Sparkles className="h-8 w-8 text-amber-300 mx-auto" />
          <h3 className="text-lg font-extrabold">إنجاز رائع! أبدعت! 🎉</h3>
          <p className="text-xs font-semibold opacity-90">
            تم حل كافة الأسئلة بنجاح وتسجيل التوقيت والأداء في الخلفية لنظام المستوى التكيفي.
          </p>
        </motion.div>
      )}
    </div>
  );
}

/* ---------------- Pre-Answer Confidence Bar ---------------- */

function ConfidenceRatingBar({
  selected,
  onRate,
}: {
  selected?: "easy" | "medium" | "hard";
  onRate: (difficulty: "easy" | "medium" | "hard") => void;
}) {
  return (
    <div className="rounded-2xl bg-[#eff4ff] p-3.5 border border-[#e0c0b1]/30 space-y-2 text-center">
      <div className="flex items-center justify-between text-xs font-extrabold text-[#0b1c30]">
        <span className="flex items-center gap-1.5">
          <Tag className="h-4 w-4 text-[#9d4300]" />
          <span>تقييم الصعوبة التقديري:</span>
        </span>
        {selected ? (
          <span className="text-[11px] font-extrabold bg-[#ffdbca] text-[#9d4300] px-3 py-0.5 rounded-full">
            {selected === "easy" ? "🟢 سهل" : selected === "medium" ? "🟡 متوسط" : "🔴 صعب"}
          </span>
        ) : (
          <span className="text-[10px] font-bold text-slate-400">
            (اختياري - يتم حسابه آلياً بالوقت أيضاً)
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(["easy", "medium", "hard"] as const).map((diff) => {
          const isSelected = selected === diff;
          return (
            <button
              key={diff}
              type="button"
              onClick={() => onRate(diff)}
              className={cn(
                "rounded-xl py-2 text-xs font-extrabold transition border cursor-pointer flex items-center justify-center gap-1",
                diff === "easy" &&
                  (isSelected
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50"),
                diff === "medium" &&
                  (isSelected
                    ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                    : "bg-white text-amber-900 border-amber-200 hover:bg-amber-50"),
                diff === "hard" &&
                  (isSelected
                    ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                    : "bg-white text-rose-900 border-rose-200 hover:bg-rose-50"),
              )}
            >
              <span>{diff === "easy" ? "🟢 سهل" : diff === "medium" ? "🟡 متوسط" : "🔴 صعب"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- MCQ Single Focus Hybrid Card (With Time Tracking) ---------------- */

function McqHybridCard({
  num,
  q,
  lessonTitle,
  subjectId,
  isLastQuestion,
  metric,
  setMetric,
  onNext,
}: {
  num: number;
  q: MCQ;
  lessonTitle?: string;
  subjectId?: string;
  isLastQuestion?: boolean;
  metric: QuestionMetrics;
  setMetric: (m: Partial<QuestionMetrics>) => void;
  onNext: () => void;
}) {
  const [sel, setSel] = useState<string | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
    setSel(null);
    const opts = q.options.filter((o) => o.trim());
    const arr = [...opts];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setShuffledOptions(arr);
  }, [q.question]);

  const handleSelectOption = (opt: string) => {
    if (metric.status !== "idle") return;

    const durationMs = Date.now() - startTimeRef.current;
    const isCorrect = normalize(opt) === normalize(q.answer);

    let calculatedAutoDiff: "easy" | "medium" | "hard" = "medium";
    if (isCorrect && durationMs < 3500) {
      calculatedAutoDiff = "easy";
    } else if (!isCorrect || durationMs > 8000) {
      calculatedAutoDiff = "hard";
    }

    setMetric({
      userDifficulty: metric.userDifficulty || calculatedAutoDiff,
      autoDifficulty: calculatedAutoDiff,
      responseTimeMs: durationMs,
      status: isCorrect ? "correct" : "wrong",
      errorCount: isCorrect ? metric.errorCount : metric.errorCount + 1,
    });

    setSel(opt);

    if (!isCorrect) {
      recordMistake({
        subjectId,
        lessonTitle: lessonTitle || "درس عام",
        question: q.question,
        userAnswer: opt,
        correctAnswer: q.answer,
        type: "mcq",
      });
    }
  };

  const { devModeActive } = useSettings();

  return (
    <div className="space-y-6">
      {q.image_url && (
        <img
          src={q.image_url}
          alt={`صورة السؤال ${num}`}
          className="h-48 w-full rounded-2xl object-cover"
        />
      )}

      {devModeActive && (
        <button
          type="button"
          onClick={() => {
            setMetric({ status: "correct", userDifficulty: "easy" });
            onNext();
          }}
          className="w-full py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 border border-amber-300 shadow-2xs"
        >
          <Zap className="h-4 w-4 text-amber-600" />
          <span>تخطي وحل هذا السؤال فوراً ⚡ (وضع المطور)</span>
        </button>
      )}

      <ConfidenceRatingBar
        selected={metric.userDifficulty}
        onRate={(diff) => setMetric({ userDifficulty: diff })}
      />

      <div className="space-y-2">
        <h3 className="text-lg sm:text-2xl font-black leading-relaxed text-[#0b1c30] pt-2">
          {num}. {q.question}
        </h3>
      </div>

      <div className="grid gap-3.5 pt-2">
        {(shuffledOptions.length > 0 ? shuffledOptions : q.options).map((opt) => {
          const isSel = sel === opt;
          const showCorrect = metric.status !== "idle" && normalize(opt) === normalize(q.answer);
          const showWrong = metric.status === "wrong" && isSel;
          const isLocked = metric.status !== "idle";
          return (
            <button
              key={opt}
              disabled={isLocked}
              onClick={() => handleSelectOption(opt)}
              className={cn(
                "flex items-center justify-between rounded-2xl bg-[#eff4ff] px-8 py-5 sm:py-5.5 text-right text-xs sm:text-base font-bold text-[#0b1c30] transition border border-[#e0c0b1]/30 shadow-2xs",
                !isLocked && "hover:bg-[#dce9ff] cursor-pointer",
                isLocked && "cursor-not-allowed opacity-90",
                isSel && metric.status === "idle" && "bg-[#9d4300] text-white border-[#9d4300]",
                showCorrect && "bg-emerald-100 text-emerald-950 border-emerald-400 font-extrabold",
                showWrong && "bg-rose-100 text-rose-950 border-rose-400 font-extrabold",
              )}
            >
              <span>{opt}</span>
              {showCorrect && (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" strokeWidth={2.5} />
              )}
              {showWrong && <XCircle className="h-5 w-5 text-rose-600" strokeWidth={2.5} />}
            </button>
          );
        })}
      </div>



      {metric.status === "wrong" && (
        <div className="pt-2 rounded-2xl bg-rose-50 border border-rose-200 p-5 space-y-4 text-right">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-extrabold text-rose-800 flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-rose-600" />
              <span>إجابة غير صحيحة (تم قفل الإجابة وتسجيل الخطأ في بنك الأخطاء 🔒)</span>
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-4.5 rounded-2xl border border-rose-200 text-xs font-semibold text-[#0b1c30] leading-relaxed space-y-2 shadow-2xs"
          >
            <div className="flex items-center gap-2 text-[#9d4300] font-extrabold">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <span>الشرح والتلميح العلمي التلقائي 💡:</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              {q.explanation ||
                `الإجابة الصحيحة هي: "${q.answer}". في الأحكام الفقهية، يُشترط الوضوح والدقة لضمان نفاذ وملاءمة العوض.`}
            </p>
          </motion.div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={onNext}
              className="px-6 py-2.5 rounded-full bg-[#213145] hover:bg-[#0b1c30] text-white text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <span>الانتقال للسؤال التالي</span>
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <SmartNotesModal
        isOpen={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        lessonTitle={lessonTitle || "درس عام"}
        initialQuestionText={q.question}
      />
    </div>
  );
}

/* ---------------- Fill Single Focus Hybrid Card ---------------- */

function FillHybridCard({
  num,
  q,
  lessonTitle,
  subjectId,
  metric,
  setMetric,
  onNext,
}: {
  num: number;
  q: Fill;
  lessonTitle?: string;
  subjectId?: string;
  metric: QuestionMetrics;
  setMetric: (m: Partial<QuestionMetrics>) => void;
  onNext: () => void;
}) {
  const [val, setVal] = useState("");
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [q]);

  const check = () => {
    const durationMs = Date.now() - startTimeRef.current;
    const isCorrect = normalize(val) === normalize(q.answer);

    let calculatedAutoDiff: "easy" | "medium" | "hard" = "medium";
    if (isCorrect && durationMs < 4000) {
      calculatedAutoDiff = "easy";
    } else if (!isCorrect || durationMs > 10000) {
      calculatedAutoDiff = "hard";
    }

    setMetric({
      userDifficulty: metric.userDifficulty || calculatedAutoDiff,
      autoDifficulty: calculatedAutoDiff,
      responseTimeMs: durationMs,
      status: isCorrect ? "correct" : "wrong",
      errorCount: isCorrect ? metric.errorCount : metric.errorCount + 1,
    });

    if (!isCorrect) {
      recordMistake({
        subjectId,
        lessonTitle: lessonTitle || "درس عام",
        question: q.question,
        userAnswer: val,
        correctAnswer: q.answer,
        type: "fill",
      });
    }
  };

  return (
    <div className="space-y-6">
      {q.image_url && (
        <img
          src={q.image_url}
          alt={`صورة السؤال ${num}`}
          className="h-48 w-full rounded-2xl object-cover"
        />
      )}

      <ConfidenceRatingBar
        selected={metric.userDifficulty}
        onRate={(diff) => setMetric({ userDifficulty: diff })}
      />

      <h3 className="text-lg sm:text-2xl font-black leading-relaxed text-[#0b1c30] pt-2">
        {num}. {q.question}
      </h3>

      <div className="space-y-4">
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          disabled={metric.status === "correct"}
          placeholder="اكتب الإجابة الفقهية هنا..."
          className={cn(
            "h-16 w-full rounded-2xl bg-[#eff4ff] px-6 text-right text-sm sm:text-base font-bold text-[#0b1c30] outline-none placeholder:text-slate-400 focus:bg-white border border-[#e0c0b1]/30 shadow-2xs",
            metric.status === "correct" &&
              "bg-emerald-100 text-emerald-950 border-emerald-400 font-extrabold",
            metric.status === "wrong" && "bg-rose-100 border-rose-400 text-rose-950 font-extrabold",
          )}
        />

        {metric.status !== "correct" && (
          <button
            type="button"
            onClick={check}
            disabled={!val.trim()}
            className="w-full py-5 rounded-2xl bg-[#213145] hover:bg-[#0b1c30] text-white font-black text-sm sm:text-base shadow-xl transition disabled:opacity-40 cursor-pointer hover:scale-[1.01] active:scale-95"
          >
            تحقق من الإجابة ✨
          </button>
        )}
      </div>

      {metric.status === "correct" && (
        <div className="flex items-center justify-between rounded-3xl bg-emerald-50 border border-emerald-200 p-6">
          <p className="text-sm font-black text-emerald-800">إجابة صحيحة ممتازة! 🎉</p>
          <button
            type="button"
            onClick={onNext}
            className="px-8 py-3.5 rounded-full bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 transition cursor-pointer flex items-center gap-2 shadow-md hover:scale-105 active:scale-95"
          >
            <span>السؤال التالي</span>
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Essay Single Focus Hybrid Card ---------------- */

function EssayHybridCard({
  num,
  q,
  metric,
  setMetric,
  onNext,
}: {
  num: number;
  q: Essay;
  metric: QuestionMetrics;
  setMetric: (m: Partial<QuestionMetrics>) => void;
  onNext: () => void;
}) {
  const [val, setVal] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="space-y-6">
      <ConfidenceRatingBar
        selected={metric.userDifficulty}
        onRate={(diff) => setMetric({ userDifficulty: diff })}
      />

      <h3 className="text-lg sm:text-2xl font-black leading-relaxed text-[#0b1c30] pt-2">
        {num}. {q.question}
      </h3>

      <textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        rows={5}
        placeholder="اكتب إجابتك الشارحة هنا بأسلوبك الفقهي..."
        className="w-full min-h-[140px] rounded-3xl bg-[#eff4ff] p-6 text-right text-sm sm:text-base font-semibold text-[#0b1c30] outline-none border border-[#e0c0b1]/30 leading-relaxed shadow-2xs focus:bg-white"
      />

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => {
            setShowAnswer(true);
            setMetric({ status: "correct" });
          }}
          className="flex-1 py-5 rounded-2xl bg-[#213145] text-white text-sm sm:text-base font-black hover:bg-[#0b1c30] transition cursor-pointer shadow-xl hover:scale-[1.01] active:scale-95"
        >
          عرض النموذج والإجابة المقترحة ✨
        </button>
      </div>

      {showAnswer && (
        <div className="rounded-3xl bg-emerald-50 border border-emerald-200 p-6 space-y-4 text-right">
          <span className="text-sm font-black text-emerald-800 block">الإجابة النموذجية:</span>
          <p className="text-xs sm:text-base font-bold text-emerald-950 leading-relaxed">
            {q.sampleAnswer ||
              q.explanation ||
              "يرجع في ذلك لمقاصد الشريعة وأحكام الفقهاء في النكاح والفرقة."}
          </p>
          <div className="pt-3 flex justify-end">
            <button
              type="button"
              onClick={onNext}
              className="px-8 py-3.5 rounded-full bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 transition cursor-pointer flex items-center gap-2 shadow-md hover:scale-105 active:scale-95"
            >
              <span>السؤال التالي</span>
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
