import { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronLeft, RotateCcw, Brain, Lightbulb } from "lucide-react";
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
const SPEED_THRESHOLD_QUICK = 20;
const SPEED_THRESHOLD_SLOW = 45;

const BOREDOM_TIPS = [
  { title: "حقيقة ممتعة", content: "الدماغ يحتفظ بـ 50% أكثر من المعلومات عندما تكون هناك فترات راحة بين التعلم!" },
  { title: "نصيحة حركية", content: "قف وامش قليلاً، حرك جسمك! تحسين تدفق الدم يعزز التركيز." },
  { title: "حقيقة العقل", content: "العقل ينسى 70% من المعلومات في أول 24 ساعة — المراجعة ضرورية!" },
  { title: "نصيحة التنفس", content: "خذ نفساً عميقاً 4 ثوان، احبسه 4 ثوان، أفرج 4 ثوان — هدا!" },
  { title: "حقيقة غريبة", content: "الطلاب الذين يأخذون ملاحظات بخط اليد يتذكرون أكثر من الآخرين!" },
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

  const intervalEnabled = block.enable_stage_intervals?.[stage] ?? true;
  const timeGateSeconds = block.stage_intervals?.[stage] ?? block.stage_interval ?? DEFAULT_TIME_GATE_SECONDS;
  const [stageStartTime, setStageStartTime] = useState<number | null>(null);
  const [timeGateRemaining, setTimeGateRemaining] = useState(timeGateSeconds);
  const [speedChecked, setSpeedChecked] = useState(false);

  const [showBoredModal, setShowBoredModal] = useState(false);
  const [boredTip, setBoredTip] = useState(BOREDOM_TIPS[0]);

  const recallWordCount = recallText.trim().split(/\s+/).filter(Boolean).length;
  const recallReady = recallWordCount >= MIN_RECALL_WORDS;
  const enforceTimeGate = mode === "student" && intervalEnabled;
  const timeGatePassed = !enforceTimeGate || timeGateRemaining <= 0;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeGateRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setStageStartTime(Date.now());
    setTimeGateRemaining(timeGateSeconds);
    setSpeedChecked(false);
  }, [stage, timeGateSeconds]);

  if (!started && showIntro) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-[640px] flex-col items-center justify-center px-6 py-16 text-center">
        <p className="mb-6 text-[12px] font-medium tracking-wide text-zen-on-surface-variant">
          الفكرة الأولى
        </p>
        <p className="text-[24px] font-light leading-loose text-zen-on-surface sm:text-[28px]">
          <HardWordText text={block.short_sentence} words={block.hard_words} />
        </p>
        <button
          onClick={() => {
            setStarted(true);
            setIdx(0);
          }}
          className="mt-14 rounded-full bg-zen-primary px-10 py-3.5 text-[14px] font-medium text-white shadow-[var(--shadow-fab)] transition hover:opacity-90"
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
        toast("أنت تقرأ بسرعة، تأكد من استيعاب التفاصيل", { duration: 3000 });
      } else if (elapsed >= SPEED_THRESHOLD_SLOW) {
        toast("تأنيك في القراءة يبني روابط ذهنية أقوى", { duration: 3000 });
      }
    }

    setIdx((i) => Math.min(STAGES.length - 1, i + 1));
  };

  return (
    <div className="mx-auto max-w-[640px] px-6 py-12">
      {/* Stepper header */}
      <div className="mb-12 flex items-center justify-between gap-3">
        <button
          onClick={() => {
            setStarted(false);
            setIdx(0);
            setRecallText("");
          }}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-zen-on-surface-variant transition hover:bg-zen-surface-low"
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
          رجوع
        </button>

        <div className="flex items-center gap-1.5">
          {STAGES.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-[3px] rounded-full transition-all",
                i === idx ? "w-7 bg-zen-primary" : "w-1.5 bg-zen-surface-container",
              )}
            />
          ))}
        </div>

        <span className="min-w-20 text-center text-[12px] font-light text-zen-on-surface-variant">
          {STAGES[idx].label}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {stage === "short" && (
            <p className="text-center text-[24px] font-light leading-loose text-zen-on-surface">
              <HardWordText text={block.short_sentence} words={block.hard_words} />
            </p>
          )}

          {stage === "examples" && (
            <div className="rounded-[24px] bg-white p-8 shadow-[var(--shadow-soft)]">
              <p className="mb-3 text-[12px] font-medium tracking-wide text-zen-on-surface-variant">
                مثال
              </p>
              <div className="text-[16px] font-light leading-loose text-zen-on-surface">
                <HardWordText text={block.examples} words={block.hard_words} />
              </div>
            </div>
          )}

          {stage === "story" && (
            <div className="rounded-[24px] bg-white p-8 shadow-[var(--shadow-soft)]">
              <p className="mb-3 text-[12px] font-medium tracking-wide text-zen-on-surface-variant">
                قصة
              </p>
              <div className="text-[16px] font-light leading-loose text-zen-on-surface">
                <HardWordText text={block.story} words={block.hard_words} />
              </div>
            </div>
          )}

          {stage === "original" && (
            <div>
              {block.visual_url && (
                <div className="mb-8 overflow-hidden rounded-[24px] shadow-[var(--shadow-soft)]">
                  <img
                    src={block.visual_url}
                    alt={block.title}
                    loading="lazy"
                    className="aspect-[16/9] w-full object-cover"
                  />
                </div>
              )}
              <div className="relative text-[16px] font-light leading-loose text-zen-on-surface">
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
                      <div className="rounded-full bg-white px-5 py-2.5 text-[12px] font-medium text-zen-on-surface-variant shadow-[var(--shadow-soft)] backdrop-blur">
                        النص مخفي — استرجع من ذاكرتك
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Active Recall Box */}
              <div className="mt-10 rounded-[24px] bg-white p-6 shadow-[var(--shadow-soft)]">
                <div className="mb-2.5 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-zen-primary" strokeWidth={1.75} />
                  <p className="text-[13px] font-medium text-zen-on-surface">
                    التفريغ الذهني
                  </p>
                </div>
                <p className="mb-4 text-[12px] font-light text-zen-on-surface-variant">
                  سيختفي النص الأصلي بمجرد كتابة أول حرف — اعتمد على ذاكرتك
                </p>
                <textarea
                  ref={recallRef}
                  value={recallText}
                  onChange={(e) => setRecallText(e.target.value)}
                  placeholder="اكتب هنا بأسلوبك الخاص..."
                  rows={4}
                  className="w-full resize-none rounded-2xl bg-zen-surface-low px-4 py-3 text-[14px] font-light leading-relaxed text-zen-on-surface outline-none placeholder:text-zen-on-surface-variant/60 focus:bg-zen-surface-container"
                />
                <div className="mt-3 flex items-center justify-between">
                  <span
                    className={cn(
                      "text-[11px] font-light transition-colors",
                      recallReady ? "font-medium text-zen-primary" : "text-zen-on-surface-variant",
                    )}
                  >
                    {recallWordCount} / {MIN_RECALL_WORDS} كلمات
                  </span>
                  {!recallReady && (
                    <span className="text-[11px] font-light text-zen-on-surface-variant">
                      اكتب {MIN_RECALL_WORDS - recallWordCount} كلمة أخرى للمتابعة
                    </span>
                  )}
                  {recallReady && (
                    <span className="text-[11px] font-medium text-zen-primary">جاهز للمتابعة</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {stage === "mental" && (
            <div className="rounded-[24px] bg-white p-8 text-center shadow-[var(--shadow-soft)]">
              <p className="mb-3 text-[12px] font-medium tracking-wide text-zen-on-surface-variant">
                اختصار للحفظ
              </p>
              <p className="text-[20px] font-medium leading-relaxed text-zen-on-surface">
                {block.mnemonic}
              </p>
            </div>
          )}

          {stage === "funny" && (
            <div className="rounded-[24px] bg-warning-soft/60 p-8 text-center shadow-[var(--shadow-soft)]">
              <p className="mb-3 text-[12px] font-medium tracking-wide text-zen-on-surface-variant">
                رابط فكاهي
              </p>
              <p className="text-[16px] font-light leading-loose text-zen-on-surface">
                {block.funny_link}
              </p>
            </div>
          )}

          {stage === "mindmap" && (
            <div>
              <p className="mb-8 text-center text-[12px] font-medium tracking-wide text-zen-on-surface-variant">
                الخريطة الذهنية للفقرة
              </p>
              <MindMap title={block.title} nodes={block.mind_map_nodes} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Nav */}
      <div className="mt-14 flex items-center justify-between gap-3">
        {mode === "teacher" ? (
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-zen-on-surface shadow-[var(--shadow-soft)] transition hover:bg-zen-surface-low disabled:opacity-30"
            aria-label="السابق"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
          </button>
        ) : (
          <span className="inline-block h-11 w-11" />
        )}

        <div className="flex flex-col items-center gap-2">
          <span className="text-[12px] font-light text-zen-on-surface-variant">
            {idx + 1} / {STAGES.length}
          </span>
          {!timeGatePassed && (
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: timeGateSeconds > 0 ? timeGateRemaining / timeGateSeconds : 0 }}
                transition={{ duration: 0.9 }}
                className="h-[2px] w-16 origin-right rounded-full bg-zen-primary/60"
              />
              <span className="text-[11px] font-light text-zen-on-surface-variant">
                {timeGateRemaining}s
              </span>
            </div>
          )}
        </div>

        {isLast ? (
          <button
            onClick={onComplete}
            className="rounded-full bg-zen-primary px-6 py-3 text-[13px] font-medium text-white shadow-[var(--shadow-fab)] transition hover:opacity-90"
          >
            التالي ←
          </button>
        ) : (
          <button
            onClick={handleNextClick}
            disabled={(stage === "original" && !recallReady) || !timeGatePassed}
            title={
              stage === "original" && !recallReady
                ? "أكمل التفريغ الذهني أولاً"
                : !timeGatePassed
                  ? "انتظر قليلاً قبل المتابعة"
                  : undefined
            }
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full bg-white text-zen-on-surface shadow-[var(--shadow-soft)] transition",
              (stage === "original" && !recallReady) || !timeGatePassed
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-zen-surface-low",
            )}
            aria-label="التالي"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
          </button>
        )}
      </div>

      {/* Bored button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={() => {
            const randomTip = BOREDOM_TIPS[Math.floor(Math.random() * BOREDOM_TIPS.length)];
            setBoredTip(randomTip);
            setShowBoredModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-medium text-zen-on-surface-variant transition hover:bg-zen-surface-low"
        >
          <Lightbulb className="h-3.5 w-3.5" strokeWidth={1.75} />
          أشعر بالملل
        </button>
      </div>

      {/* Bored Modal */}
      <AlertDialog open={showBoredModal} onOpenChange={setShowBoredModal}>
        <AlertDialogContent className="rounded-[28px] border-0 shadow-[var(--shadow-deep)]">
          <AlertDialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zen-surface-low">
              <Lightbulb className="h-5 w-5 text-zen-primary" strokeWidth={1.75} />
            </div>
            <AlertDialogTitle className="text-[16px] font-medium text-zen-on-surface">
              {boredTip.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-3 text-[14px] font-light leading-relaxed text-zen-on-surface-variant">
              {boredTip.content}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel className="flex-1 rounded-full border-0 bg-zen-surface-low text-zen-on-surface hover:bg-zen-surface-container">
              إغلاق
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const randomTip = BOREDOM_TIPS[Math.floor(Math.random() * BOREDOM_TIPS.length)];
                setBoredTip(randomTip);
              }}
              className="flex-1 rounded-full bg-zen-primary text-white hover:opacity-90"
            >
              نصيحة أخرى
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
