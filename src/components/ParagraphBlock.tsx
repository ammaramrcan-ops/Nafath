import { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronLeft, RotateCcw, Brain, CircleAlert as AlertCircle, Lightbulb } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import type { ParagraphBlock as Block } from "@/lib/lesson-data";
import { HardWordText } from "./HardWordText";
import { MindMap } from "./MindMap";
import { cn } from "@/lib/utils";
import { DEFAULT_STAGE_ORDER, STAGE_LABELS, type Stage } from "@/lib/settings";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MIN_RECALL_WORDS = 5;
const DEFAULT_TIME_GATE_SECONDS = 15;
const SPEED_THRESHOLD_QUICK = 20; // seconds considered "too quick"
const SPEED_THRESHOLD_SLOW = 45; // seconds considered "good pacing"

const BOREDOM_TIPS = [
  {
    title: "حقيقة ممتعة",
    content:
      "الدماغ يحتفظ بـ 50% أكثر من المعلومات عندما تكون هناك فترات راحة بين التعلم!",
  },
  {
    title: "نصيحة حركية",
    content: "قف وامش قليلاً، حرك جسمك! تحسين تدفق الدم يعزز التركيز.",
  },
  {
    title: "حقيقة العقل",
    content: "العقل ينسى 70% من المعلومات في أول 24 ساعة — المراجعة ضرورية!",
  },
  {
    title: "نصيحة التنفس",
    content: "خذ نفساً عميقاً 4 ثوان، احبسه 4 ثوان، أفرج 4 ثوان — هدا!",
  },
  {
    title: "حقيقة غريبة",
    content: "الطلاب الذين يأخذون ملاحظات بخط اليد يتذكرون أكثر من الآخرين!",
  },
];

export function ParagraphBlockCard({
  block,
  onComplete,
  stageOrder = DEFAULT_STAGE_ORDER,
  mode = "student",
}: {
  block: Block;
  onComplete: () => void;
  stageOrder?: Stage[];
  mode?: "student" | "teacher";
}) {
  const STAGES = stageOrder.map((key) => ({ key, label: STAGE_LABELS[key] }));
  const showIntro = STAGES.length > 0 && STAGES[0].key === "short" && block.short_sentence.trim().length > 0;
  const [started, setStarted] = useState(!showIntro);
  const [idx, setIdx] = useState(0);
  const [recallText, setRecallText] = useState("");
  const recallRef = useRef<HTMLTextAreaElement>(null);

  const stage = STAGES[idx].key;

  // Time gating
  const intervalEnabled = block.enable_stage_intervals?.[stage] ?? true;
  const timeGateSeconds = block.stage_intervals?.[stage] ?? block.stage_interval ?? DEFAULT_TIME_GATE_SECONDS;
  const [stageStartTime, setStageStartTime] = useState<number | null>(null);
  const [timeGateRemaining, setTimeGateRemaining] = useState(timeGateSeconds);
  const [speedChecked, setSpeedChecked] = useState(false);

  // Bored button
  const [showBoredModal, setShowBoredModal] = useState(false);
  const [boredTip, setBoredTip] = useState(BOREDOM_TIPS[0]);

  const recallWordCount = recallText.trim().split(/\s+/).filter(Boolean).length;
  const recallReady = recallWordCount >= MIN_RECALL_WORDS;
  const enforceTimeGate = mode === "student" && intervalEnabled;
  const timeGatePassed = !enforceTimeGate || timeGateRemaining <= 0;

  // Time gate countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeGateRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Reset stage time when stage changes
  useEffect(() => {
    setStageStartTime(Date.now());
    setTimeGateRemaining(timeGateSeconds);
    setSpeedChecked(false);
  }, [stage, timeGateSeconds]);

  // Intro — short sentence teaser before entering the stage flow
  if (!started && showIntro) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-2xl sm:text-3xl font-semibold leading-loose text-foreground">
          <HardWordText text={block.short_sentence} words={block.hard_words} />
        </p>
        <button
          onClick={() => {
            setStarted(true);
            setIdx(0);
          }}
          className="mt-12 rounded-full bg-brand px-8 py-4 text-base text-brand-foreground shadow-[var(--shadow-soft)] hover:bg-brand/90"
        >
          فهمت الفكرة، اعرض التفاصيل
        </button>
      </div>
    );
  }

  const isLast = idx === STAGES.length - 1;

  const handleNextClick = () => {
    if (stage === "original" && !recallReady) return;

    if (!speedChecked && stageStartTime) {
      const elapsed = Math.floor((Date.now() - stageStartTime) / 1000);
      setSpeedChecked(true);

      if (elapsed <= SPEED_THRESHOLD_QUICK) {
        toast("أنت تقرأ بسرعة كبيرة، تأكد من استيعاب التفاصيل 🧠", {
          duration: 3000,
        });
      } else if (elapsed >= SPEED_THRESHOLD_SLOW) {
        toast("تأنيك في القراءة يبني روابط ذهنية أقوى! 🌟", {
          duration: 3000,
        });
      }
    }

    setIdx((i) => Math.min(STAGES.length - 1, i + 1));
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      {/* Stepper header */}
      <div className="mb-10 flex items-center justify-between gap-3">
        <button
          onClick={() => {
            setStarted(false);
            setIdx(0);
            setRecallText("");
          }}
          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-foreground/60 hover:bg-muted"
        >
          <RotateCcw className="h-4 w-4" />
          رجوع
        </button>

        <div className="flex items-center gap-1.5">
          {STAGES.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === idx ? "w-6 bg-brand" : "w-1.5 bg-border",
              )}
            />
          ))}
        </div>

        <span className="min-w-24 text-sm text-foreground/50 text-center">
          {STAGES[idx].label}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {stage === "short" && (
            <p className="text-center text-2xl font-semibold leading-loose text-foreground">
              <HardWordText text={block.short_sentence} words={block.hard_words} />
            </p>
          )}

          {stage === "examples" && (
            <div className="rounded-3xl bg-brand-soft/60 p-8 text-lg leading-loose text-foreground/85">
              <p className="mb-3 text-sm font-semibold text-brand">مثال</p>
              <HardWordText text={block.examples} words={block.hard_words} />
            </div>
          )}

          {stage === "story" && (
            <div className="rounded-3xl border border-border bg-card p-8 text-lg leading-loose text-foreground/85">
              <p className="mb-3 text-sm font-semibold text-brand">قصة</p>
              <HardWordText text={block.story} words={block.hard_words} />
            </div>
          )}

          {stage === "original" && (
            <div>
              {block.visual_url && (
                <div className="mb-8 overflow-hidden rounded-2xl">
                  <img
                    src={block.visual_url}
                    alt={block.title}
                    loading="lazy"
                    className="aspect-[16/9] w-full object-cover"
                  />
                </div>
              )}
              <div className="relative text-lg text-foreground/85">
                <motion.div
                  animate={
                    recallText.length > 0
                      ? { filter: "blur(10px)", opacity: 0.15 }
                      : { filter: "blur(0px)", opacity: 1 }
                  }
                  transition={{ duration: 0.35 }}
                  aria-hidden={recallText.length > 0}
                >
                  <HardWordText text={block.full_text} words={block.hard_words} />
                </motion.div>

                <AnimatePresence>
                  {recallText.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="pointer-events-none absolute inset-0 flex items-center justify-center"
                    >
                      <div className="rounded-2xl bg-card/80 px-5 py-3 text-sm font-semibold text-foreground/70 shadow-sm backdrop-blur">
                        النص مخفي — استرجع من ذاكرتك ✍️
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Active Recall Box */}
              <div className="mt-10 rounded-3xl border-2 border-brand/20 bg-brand-soft/40 p-6">
                <div className="mb-3 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-brand" />
                  <p className="text-sm font-bold text-brand">
                    التفريغ الذهني: اكتب ما تتذكره من النص
                  </p>
                </div>
                <p className="mb-4 text-xs text-foreground/50">
                  سيختفي النص الأصلي تماماً بمجرد كتابة أول حرف — اعتمد على ذاكرتك!
                </p>
                <textarea
                  ref={recallRef}
                  value={recallText}
                  onChange={(e) => setRecallText(e.target.value)}
                  placeholder="اكتب هنا بأسلوبك الخاص..."
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-brand/20 bg-background px-4 py-3 text-base leading-relaxed text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
                <div className="mt-2 flex items-center justify-between">
                  <span
                    className={cn(
                      "text-xs transition-colors",
                      recallReady ? "text-success font-semibold" : "text-foreground/40",
                    )}
                  >
                    {recallWordCount} / {MIN_RECALL_WORDS} كلمات
                  </span>
                  {!recallReady && (
                    <span className="text-xs text-foreground/40">
                      اكتب {MIN_RECALL_WORDS - recallWordCount} كلمة{" "}
                      {MIN_RECALL_WORDS - recallWordCount === 1 ? "أخرى" : "أخرى"} للمتابعة
                    </span>
                  )}
                  {recallReady && (
                    <span className="text-xs font-semibold text-success">جاهز للمتابعة</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {stage === "mental" && (
            <div className="rounded-3xl border-2 border-brand/30 bg-card p-6 text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-brand">
                اختصار للحفظ
              </p>
              <p className="text-xl font-bold leading-relaxed text-foreground">
                {block.mnemonic}
              </p>
            </div>
          )}

          {stage === "funny" && (
            <div className="rounded-3xl bg-warning-soft p-6 text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-foreground/60">
                رابط فكاهي 😄
              </p>
              <p className="text-lg leading-loose text-foreground/85">{block.funny_link}</p>
            </div>
          )}

          {stage === "mindmap" && (
            <div>
              <p className="mb-6 text-center text-sm text-foreground/50">
                الخريطة الذهنية للفقرة
              </p>
              <MindMap title={block.title} nodes={block.mind_map_nodes} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Nav */}
      <div className="mt-12 flex items-center justify-between gap-3">
        {mode === "teacher" ? (
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-background text-foreground transition hover:border-brand/40 disabled:opacity-30"
            aria-label="السابق"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        ) : (
          <span className="inline-block h-12 w-12" />
        )}

        <div className="flex flex-col items-center gap-2">
          <span className="text-sm text-foreground/40">
            {idx + 1} / {STAGES.length}
          </span>
          {!timeGatePassed && (
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: timeGateSeconds > 0 ? timeGateRemaining / timeGateSeconds : 0 }}
                transition={{ duration: 0.9 }}
                className="h-1 w-16 origin-right rounded-full bg-brand/60"
              />
              <span className="text-xs text-foreground/50">{timeGateRemaining}s</span>
            </div>
          )}
        </div>

        {isLast ? (
          <button
            onClick={onComplete}
            className="rounded-full bg-success px-6 py-3 text-sm font-semibold text-success-foreground shadow-[var(--shadow-soft)] hover:bg-success/90"
          >
            التالي ←
          </button>
        ) : (
          <button
            onClick={handleNextClick}
            disabled={
              (stage === "original" && !recallReady) || !timeGatePassed
            }
            title={
              stage === "original" && !recallReady
                ? "أكمل التفريغ الذهني أولاً"
                : !timeGatePassed
                  ? "انتظر قليلاً قبل المتابعة"
                  : undefined
            }
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full border-2 bg-background text-foreground transition",
              stage === "original" && !recallReady
                ? "border-border opacity-30 cursor-not-allowed"
                : !timeGatePassed
                  ? "border-brand/40 opacity-50 cursor-not-allowed"
                  : "border-border hover:border-brand/40",
            )}
            aria-label="التالي"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Bored button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => {
            const randomTip = BOREDOM_TIPS[Math.floor(Math.random() * BOREDOM_TIPS.length)];
            setBoredTip(randomTip);
            setShowBoredModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-foreground/50 transition hover:bg-muted hover:text-foreground"
        >
          <Lightbulb className="h-4 w-4" />
          أشعر بالملل
        </button>
      </div>

      {/* Bored Modal */}
      <AlertDialog open={showBoredModal} onOpenChange={setShowBoredModal}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft">
              <Lightbulb className="h-6 w-6 text-brand" />
            </div>
            <AlertDialogTitle className="text-lg">{boredTip.title}</AlertDialogTitle>
            <AlertDialogDescription className="mt-4 text-base leading-relaxed">
              {boredTip.content}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel className="flex-1 rounded-full">
              إغلاق
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const randomTip = BOREDOM_TIPS[Math.floor(Math.random() * BOREDOM_TIPS.length)];
                setBoredTip(randomTip);
              }}
              className="flex-1 rounded-full bg-brand hover:bg-brand/90"
            >
              نصيحة أخرى
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
