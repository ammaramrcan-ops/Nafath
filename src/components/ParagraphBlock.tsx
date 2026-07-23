import { useState, useEffect, useMemo } from "react";
import { RotateCcw, Brain, Play, Pause, Clock, Sparkles, Lightbulb, BookOpen, BookMarked, HelpCircle, BarChart2, ArrowLeft, Maximize2, Minimize2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import type { ParagraphBlock as Block } from "@/lib/lesson-data";
import { HardWordText } from "./HardWordText";
import { MindMap } from "./MindMap";
import { MindMapCanvas } from "./MindMapCanvas";
import type { MindMapData, MindMapNode } from "@/lib/mind-map-types";
import { cn } from "@/lib/utils";
import { DEFAULT_STAGE_ORDER, STAGE_LABELS, type Stage } from "@/lib/settings";
import { QuizSection } from "./QuizSection";
import { SmartNotesModal } from "./SmartNotesModal";
import { FlashcardsSection } from "./FlashcardsSection";
import { StudentMindMapSection } from "./StudentMindMapSection";

const SPEED_THRESHOLD_QUICK = 20;
const SPEED_THRESHOLD_SLOW = 45;

export function ParagraphBlockCard({
  block,
  onComplete,
  onStageChange,
  stageOrder = DEFAULT_STAGE_ORDER,
  mode = "student",
}: {
  block: Block;
  onComplete: () => void;
  onStageChange?: (completedStageKey: Stage, timeSpentSeconds: number, currentStageIndex: number, totalStagesInBlock: number) => void;
  stageOrder?: Stage[];
  mode?: "student" | "teacher";
}) {
  const STAGES = stageOrder.map((key) => ({ key, label: STAGE_LABELS[key] }));
  const showIntro = false;
  const [showBlockIntro, setShowBlockIntro] = useState(mode === "student");
  const [started, setStarted] = useState(!showIntro);
  const [idx, setIdx] = useState(0);


  const stage = STAGES[idx].key;
  const isQuiz = stage.startsWith("quizzes_");
  const [isQuizDone, setIsQuizDone] = useState(false);
  const [showBlockNotesModal, setShowBlockNotesModal] = useState(false);

  const intervalEnabled = block.enable_stage_intervals?.[stage] ?? (block.stage_interval ? block.stage_interval > 0 : false);
  const timeGateSeconds = block.stage_intervals?.[stage] ?? block.stage_interval ?? 0;
  const [stageStartTime, setStageStartTime] = useState<number | null>(null);
  const [timeGateRemaining, setTimeGateRemaining] = useState(timeGateSeconds);
  const [speedChecked, setSpeedChecked] = useState(false);

  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const stageAudio = block.stage_audio?.[stage] ?? "";


  const enforceTimeGate = mode === "student" && intervalEnabled && !isQuiz && timeGateSeconds > 0;
  const timeGatePassed = !enforceTimeGate || timeGateRemaining <= 0;

  useEffect(() => {
    setIsQuizDone(false);
  }, [stage]);

  useEffect(() => {
    setTimeGateRemaining(timeGateSeconds);
    setSpeedChecked(false);
    setStageStartTime(Date.now());

    if (timeGateSeconds > 0) {
      const timer = setInterval(() => {
        setTimeGateRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [stage, timeGateSeconds]);

  if (showBlockIntro && mode === "student") {
    const quizCount = (block.quizzes?.mcqs?.length || 0) + (block.quizzes?.fills?.length || 0) + (block.quizzes?.essays?.length || 0);
    const infoCount = block.meta_card?.info_count ?? (block.mind_map_nodes?.length || 3);
    const estTime = block.meta_card?.estimated_time_range || "2 - 5 دقائق";
    const undLevel = block.meta_card?.understanding_level || "سهل";
    const memLevel = block.meta_card?.memorization_level || "متوسط";

    return (
      <div className="mx-auto flex min-h-[85vh] w-full max-w-[85vw] flex-col items-center justify-center p-4 sm:p-6 text-center dir-rtl relative font-body-md" dir="rtl">
        <div className="w-full rounded-[2.5rem] bg-white p-8 sm:p-14 shadow-[0_20px_60px_-15px_rgba(11,28,48,0.08)] border border-slate-100 space-y-8 text-center relative">
          
          {/* Top Badge Chip */}
          <div className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-[#f0dbff] text-[#8127cf] text-xs sm:text-sm font-black mx-auto">
            <BookOpen className="h-4.5 w-4.5" />
            <span>معلومات وتفاصيل الفقرة قبل البدء</span>
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-5xl font-black text-[#0b1c30] leading-tight">
              {block.title || "تعريف الخلع وحكمه ودليله"}
            </h2>
            <p className="text-xs sm:text-base text-slate-500 font-semibold leading-relaxed max-w-2xl mx-auto">
              نظرة شاملة على أحكام الخلع في الفقه الإسلامي ومبادئه الأساسية.
            </p>
          </div>

          {/* Bento Metadata Grid (2x2 or 4x1 for 85vw width) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-right">
            {/* Box 1: Time */}
            <div className="bg-[#eaf1ff] p-5 sm:p-6 rounded-3xl flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1">الزمن المتوقع:</span>
                <span className="text-sm sm:text-base font-black text-[#0b1c30]">{estTime}</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[#f0dbff] text-[#8127cf] flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5" />
              </div>
            </div>

            {/* Box 2: Info Count */}
            <div className="bg-[#eaf1ff] p-5 sm:p-6 rounded-3xl flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1">عدد المعلومات:</span>
                <span className="text-sm sm:text-base font-black text-[#0b1c30]">{infoCount} مفاهيم</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[#ffdbca] text-[#9d4300] flex items-center justify-center shrink-0">
                <Lightbulb className="h-5 w-5" />
              </div>
            </div>

            {/* Box 3: Questions */}
            <div className="bg-[#eaf1ff] p-5 sm:p-6 rounded-3xl flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1">الأسئلة التقييمية:</span>
                <span className="text-sm sm:text-base font-black text-[#0b1c30]">{quizCount} أسئلة في الفقرة</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <HelpCircle className="h-5 w-5" />
              </div>
            </div>

            {/* Box 4: Difficulty */}
            <div className="bg-[#eaf1ff] p-5 sm:p-6 rounded-3xl flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1">صعوبة الفقرة:</span>
                <div className="flex gap-1.5 mt-1 text-xs font-black">
                  <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">فهم: {undLevel}</span>
                  <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">حفظ: {memLevel}</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                <BarChart2 className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* "Zaytuna" Essence Section (Dashed Orange Border Card) */}
          <div className="rounded-3xl border-2 border-dashed border-[#ffdbca] bg-[#fffbf9] p-6 sm:p-8 text-right space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 text-[#9d4300] text-sm sm:text-base font-black">
              <Sparkles className="h-5 w-5 fill-current text-[#9d4300]" />
              <span>الزيتونة بالبلدي (الفكرة ببساطة شديدة):</span>
            </div>
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-2xs">
              <p className="text-sm sm:text-base font-bold text-[#0b1c30] leading-relaxed">
                {block.short_sentence || (block.story ? block.story.split("!")[0] + "!" : "الخلع يعني الست بتدفع عوض مالي للزوج عشان تفك الجوازة بالتراضي وتشتري راحتها.")}
              </p>
            </div>
          </div>

          {/* Primary CTA Button */}
          <button
            type="button"
            onClick={() => setShowBlockIntro(false)}
            className="w-full py-5 rounded-2xl bg-[#213145] hover:bg-[#0b1c30] text-white font-black text-base sm:text-lg flex items-center justify-center gap-3 shadow-xl hover:scale-[1.01] active:scale-95 transition cursor-pointer"
          >
            <span>ابدأ دراسة هذه الفقرة الآن</span>
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  if (!started && showIntro) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-[85vw] flex-col items-center justify-center px-6 py-16 text-center">
        <p className="mb-6 text-[12px] font-medium tracking-wide text-zen-on-surface-variant">
          الفكرة الأولى
        </p>
        <div className="text-[24px] font-light leading-loose text-zen-on-surface sm:text-[28px] w-full">
          <HardWordText text={block.short_sentence} words={block.hard_words} highlights={block.highlights} />
        </div>
        <button
          onClick={() => {
            setStarted(true);
            setIdx(0);
          }}
          className="mt-14 rounded-full bg-zen-primary px-10 py-3.5 text-[14px] font-medium text-white shadow-[var(--shadow-fab)] transition hover:opacity-90 cursor-pointer"
        >
          فهمت الفكرة، اعرض التفاصيل
        </button>
      </div>
    );
  }

  const isLast = idx === STAGES.length - 1;

  const handleNextClick = () => {


    const elapsed = stageStartTime ? Math.max(5, Math.floor((Date.now() - stageStartTime) / 1000)) : 15;

    if (!speedChecked) {
      setSpeedChecked(true);
    }

    onStageChange?.(stage, elapsed, idx, STAGES.length);

    if (isLast) {
      onComplete();
    } else {
      setIdx((i) => Math.min(STAGES.length - 1, i + 1));
    }
  };

  return (
    <div className="mx-auto w-full max-w-[85vw] px-4 sm:px-6 py-8 sm:py-12">
      {/* Stepper header */}
      <div className="mb-12 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setStarted(false);
              setIdx(0);
              setRecallText("");
            }}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-zen-on-surface-variant transition hover:bg-zen-surface-low cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
            رجوع
          </button>
          {stageAudio && mode === "student" && (
            <button
              onClick={() => {
                const audio = new Audio(stageAudio);
                audio.play();
                setIsAudioPlaying(true);
                audio.onended = () => setIsAudioPlaying(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-zen-primary transition hover:bg-zen-surface-low cursor-pointer"
              title="تشغيل الصوت"
            >
              {isAudioPlaying ? (
                <Pause className="h-3.5 w-3.5" strokeWidth={1.75} />
              ) : (
                <Play className="h-3.5 w-3.5" strokeWidth={1.75} />
              )}
              صوت
            </button>
          )}

          {mode === "student" && (
            <button
              onClick={() => {
                const targetUrl = (block as any).notebookLmUrl || "https://notebooklm.google.com/";
                window.open(targetUrl, "_blank", "noopener,noreferrer");
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-[12px] font-bold text-amber-900 border border-amber-200 hover:bg-amber-100 transition cursor-pointer shadow-sm"
              title="انتقل إلى NotebookLM لترفع تساؤلاتك وتكمل الدرس بسهولة"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>لدي سؤال؟ 🤖</span>
            </button>
          )}
        </div>

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

        <span className="min-w-20 text-center text-[12px] font-bold text-zen-primary">
          {STAGES[idx].label}
        </span>
      </div>

      {/* Stage Countdown Timer Banner if interval enabled */}
      {enforceTimeGate && timeGateRemaining > 0 && (
        <div className="mb-6 flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-900 border border-amber-200 shadow-sm animate-pulse">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <span>مهلة قراءة واستيعاب هذه المرحلة</span>
          </div>
          <span className="rounded-full bg-amber-200 px-3 py-1 text-amber-950 font-bold">
            متبقي {timeGateRemaining} ثانية
          </span>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {stage === "short" && (
            <div className="rounded-[2.5rem] bg-white p-8 sm:p-12 shadow-[0_20px_60px_-15px_rgba(11,28,48,0.08)] border border-slate-100 min-h-[380px] sm:min-h-[440px] flex items-center justify-center text-center text-xl sm:text-3xl font-bold leading-relaxed text-[#0b1c30]">
              <HardWordText text={block.short_sentence} words={block.hard_words} highlights={block.highlights} />
            </div>
          )}

          {stage === "story" && (
            <div className="rounded-[2.5rem] bg-white p-8 sm:p-12 shadow-[0_20px_60px_-15px_rgba(11,28,48,0.08)] border border-amber-200/80 space-y-6 min-h-[380px] sm:min-h-[440px] flex flex-col justify-between">
              <div className="flex items-center gap-3 text-sm sm:text-lg font-black tracking-wide text-amber-950 bg-amber-50 px-5 py-3 rounded-2xl border border-amber-200/60 w-fit">
                <Sparkles className="h-6 w-6 text-amber-600 shrink-0" />
                <span>📖 القصة المشوقة لتثبيت الفهم</span>
              </div>
              <div className="text-base sm:text-2xl font-bold leading-relaxed sm:leading-loose text-[#0b1c30] p-6 sm:p-8 bg-slate-50/50 rounded-3xl border border-slate-100 flex-grow flex items-center">
                <HardWordText
                  text={block.story || "في البستان، تمتص الأشجار الخضراء أشعة الشمس الهادئة وتصنع طعامها دون الحاجة للتحرك."}
                  words={block.hard_words}
                  highlights={block.highlights}
                />
              </div>
            </div>
          )}

          {stage === "baladi_terms" && (
            <div className="rounded-[28px] bg-white p-8 shadow-[var(--shadow-soft)] space-y-6 border border-amber-200/80">
              <div className="flex items-center gap-2 border-b border-amber-200/60 pb-4">
                <Sparkles className="h-5 w-5 text-amber-600" />
                <div>
                  <h3 className="text-base font-black text-amber-950">شرح الأحكام والمصطلحات بالبلدي 💡</h3>
                  <p className="text-xs font-bold text-amber-800">توضيح المفاهيم بين قوسين بأسلوب عامي مباشر وفل</p>
                </div>
              </div>

              <div className="space-y-4">
                {block.hard_words && block.hard_words.length > 0 ? (
                  block.hard_words.map((hw: any, i) => {
                    const term = hw.word || hw.term || "";
                    const meaning = hw.meaning || hw.definition || hw.explanation || "";
                    return (
                      <div key={i} className="rounded-2xl bg-amber-50/70 p-5 border border-amber-200/80 space-y-2 text-right">
                        <span className="inline-block font-black text-amber-950 text-sm bg-amber-200 px-3.5 py-1 rounded-full border border-amber-300 shadow-xs">
                          ({term})
                        </span>
                        <p className="text-xs font-bold text-amber-950 leading-relaxed pt-1">
                          👈 المعنى الشارح بالبلدي: {meaning}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl bg-amber-50/70 p-5 border border-amber-200/80 text-right space-y-2">
                    <span className="inline-block font-black text-amber-950 text-sm bg-amber-200 px-3.5 py-1 rounded-full border border-amber-300">
                      ({block.title})
                    </span>
                    <p className="text-xs font-bold text-amber-950 leading-relaxed pt-1">
                      👈 المعنى الشارح بالبلدي: {block.short_sentence || "المفهوم الرئيسي مقصود به التبسيط والتيسير الصريح."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {stage === "examples" && (
            <div className="rounded-[2.5rem] bg-white p-8 sm:p-12 shadow-[0_20px_60px_-15px_rgba(11,28,48,0.08)] space-y-6 min-h-[380px] sm:min-h-[440px] flex flex-col justify-between">
              <p className="text-sm font-black tracking-wide text-zen-on-surface-variant bg-slate-100 px-4 py-2 rounded-xl w-fit">
                💡 أمثلة توضيحية
              </p>
              <div className="text-base sm:text-2xl font-bold leading-relaxed sm:leading-loose text-[#0b1c30] p-6 sm:p-8 bg-slate-50/50 rounded-3xl border border-slate-100 flex-grow flex items-center">
                <HardWordText text={block.examples} words={block.hard_words} highlights={block.highlights} />
              </div>
            </div>
          )}

          {stage === "original" && (
            <div className="space-y-6 min-h-[420px]">
              {block.visual_url && (
                <div className="mb-4 overflow-hidden rounded-2xl shadow-[0_8px_24px_-8px_rgba(11,28,48,0.12)] max-h-[220px]">
                  <img
                    src={block.visual_url}
                    alt={block.title}
                    loading="lazy"
                    className="w-full h-[220px] object-cover"
                  />
                </div>
              )}
              <div className="text-base sm:text-2xl font-bold leading-relaxed sm:leading-loose text-[#0b1c30] bg-white p-8 sm:p-12 rounded-[2.5rem] border border-slate-100 shadow-[0_20px_60px_-15px_rgba(11,28,48,0.08)]">
                <HardWordText text={block.full_text} words={block.hard_words} highlights={block.highlights} />
              </div>
            </div>
          )}

          {/* Stage 5: Mental */}
          {stage === "mental" && (
            <div className="rounded-[24px] bg-white p-8 shadow-[var(--shadow-soft)] border border-blue-100">
              <div className="mb-3 flex items-center gap-2 text-[13px] font-bold text-blue-800">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                <span>الرابط الذهني والاختصار الذكي</span>
              </div>
              <div className="text-[16px] font-semibold leading-relaxed text-zen-on-surface">
                <HardWordText
                  text={
                    typeof block.mnemonic === "string" && block.mnemonic.trim().length > 0
                      ? block.mnemonic
                      : (block.mnemonic as any)?.text || (block.mnemonic as any)?.title || "الرابط الذهني والاختصار التوضيحي للحفظ"
                  }
                  words={block.hard_words}
                  highlights={block.highlights}
                />
              </div>
            </div>
          )}

          {/* Stage 6: Funny */}
          {stage === "funny" && (
            <div className="rounded-[24px] bg-white p-8 shadow-[var(--shadow-soft)] border border-purple-100">
              <div className="mb-3 flex items-center gap-2 text-[13px] font-bold text-purple-800">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span>الرابط الفكاهي لترسيخ الذاكرة</span>
              </div>
              <div className="text-[16px] font-semibold leading-relaxed text-zen-on-surface">
                <HardWordText
                  text={
                    typeof block.funny_link === "string" && block.funny_link.trim().length > 0
                      ? block.funny_link
                      : (block.funny_link as any)?.text || (block.funny_link as any)?.title || "الرابط الفكاهي الطريف لترسيخ المعلومة بالذاكرة"
                  }
                  words={block.hard_words}
                  highlights={block.highlights}
                />
              </div>
            </div>
          )}

          {/* Stage 7: Mindmap (Interactive 2D Canvas with Panning and Zooming) */}
          {stage === "mindmap" && (
            <StudentMindMapSection block={block} />
          )}

          {/* Stage 8: Zaitouna (New Premium 85vw Design) */}
          {stage === "zaitouna" && (
            <div className="w-full max-w-[85vw] mx-auto space-y-12 text-right dir-rtl" dir="rtl">
              {/* Top Hero / Weakness Radar Report Banner */}
              <div className="bg-[#fffbf9] border-2 border-dashed border-[#ffdbca] rounded-[2.5rem] p-8 sm:p-10 shadow-[0_20px_50px_-15px_rgba(11,28,48,0.06)] space-y-8 text-center sm:text-right">
                <div className="text-center space-y-2">
                  <span className="text-xs font-bold text-slate-500 block">تهانينا! أتممت مراجعة هذه الفقرة بنجاح 🎉</span>
                  <h2 className="text-xl sm:text-3xl font-black text-[#0b1c30]">
                    الزيتونة والملخص المركّز — {block.title}
                  </h2>
                  <p className="text-xs sm:text-sm font-semibold text-slate-500 max-w-2xl mx-auto">
                    استعرض خلاصة التعريفات، أسئلة علّل، والتعليلات والروابط الذكية لتثبيت الفهم المستدام.
                  </p>
                </div>

                {/* Weakness Radar Report Card */}
                <div className="bg-[#f97316]/5 border border-[#f97316]/20 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4 text-right">
                    <div className="bg-[#f97316] p-3.5 rounded-2xl text-white shadow-md">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-[#0b1c30] flex items-center gap-2">
                        <span>تقرير رادار نقاط الضعف (Weakness Radar Report):</span>
                      </h3>
                      <p className="text-xs font-semibold text-slate-600 pt-1 leading-relaxed">
                        أنت ممتاز في هذه الفقرة! ننصحك بمراجعة التفسيرات والروابط الذكية أدناه لمدة 3 دقائق فقط لترسيخ الفهم الكامل والتأكد من استيعاب كافة التفاصيل.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowBlockNotesModal(true)}
                    className="bg-[#f97316] hover:bg-[#e06305] text-white px-7 py-3.5 rounded-full font-extrabold text-xs flex items-center gap-2.5 shadow-md hover:scale-105 active:scale-95 transition cursor-pointer shrink-0"
                  >
                    <BookMarked className="h-4 w-4" />
                    <span>فتح كراسة ملاحظاتي الذهبية لهذا الدرس 📓</span>
                  </button>
                </div>
              </div>

              {/* Section 1: Definitions Bento Grid (أهم التعريفات) */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-[#e0c0b1]/40 pb-3">
                  <BookOpen className="h-5 w-5 text-[#8127cf]" />
                  <h3 className="text-base sm:text-lg font-black text-[#0b1c30]">أهم التعريفات والمفاهيم الرئيسية</h3>
                  <span className="mr-auto text-xs font-bold text-slate-400">بنية بينتو متطورة</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="zen-card bg-white p-6 rounded-3xl border border-[#e0c0b1]/40 shadow-2xs space-y-2 hover:-translate-y-1 transition">
                    <span className="text-[11px] font-extrabold text-[#8127cf] block">مفهوم أساسي</span>
                    <h4 className="text-sm font-extrabold text-[#0b1c30]">عوض معلوم</h4>
                    <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                      {block.zaitouna?.definitions || "مقابل مالي أو عيني محدد القيمة والمقدار لضمان الصحة والتحديد التام."}
                    </p>
                  </div>

                  <div className="zen-card bg-white p-6 rounded-3xl border border-[#e0c0b1]/40 shadow-2xs space-y-2 hover:-translate-y-1 transition">
                    <span className="text-[11px] font-extrabold text-[#8127cf] block">ضابط شرعي</span>
                    <h4 className="text-sm font-extrabold text-[#0b1c30]">مفاداة بالتراضي</h4>
                    <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                      {block.short_sentence || "دفع المال أو العوض مقابل فك الارتباط والتخلص من العقد بعوض معلوم."}
                    </p>
                  </div>

                  <div className="zen-card bg-white p-6 rounded-3xl border border-[#e0c0b1]/40 shadow-2xs space-y-2 hover:-translate-y-1 transition">
                    <span className="text-[11px] font-extrabold text-[#8127cf] block">شرط الأهلية</span>
                    <h4 className="text-sm font-extrabold text-[#0b1c30]">إطلاق تصرف مالي</h4>
                    <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                      أن يكون الملتزم بالعوض حراً بالغاً عاقلاً رشيداً لا يُحجر على أمواله.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Rationales (أسئلة علّل والتعليل الفقهي) */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-[#e0c0b1]/40 pb-3">
                  <HelpCircle className="h-5 w-5 text-[#8127cf]" />
                  <h3 className="text-base sm:text-lg font-black text-[#0b1c30]">أسئلة علّل واسترجاع التعليلات</h3>
                  <span className="mr-auto text-xs font-bold text-slate-400">أسئلة فكرية تكيّفية</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="zen-card bg-white p-6 rounded-3xl border border-[#e0c0b1]/40 shadow-2xs space-y-4">
                    <span className="text-[11px] font-bold text-slate-400 block">{block.title}</span>
                    <h4 className="text-xs sm:text-sm font-extrabold text-[#0b1c30] leading-relaxed">
                      اشرح بأسلوبك: لماذا يُشترط التحديد والدقة في العوض والتعليل الشرعي للفقرة؟
                    </h4>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {["#عوض", "#جهالة", "#مهر_المثل", "#رفع_الضرر"].map((tag) => (
                        <span key={tag} className="px-3.5 py-1 bg-[#eff4ff] rounded-full text-[11px] font-bold text-[#0b1c30]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="zen-card bg-white p-6 rounded-3xl border border-[#e0c0b1]/40 shadow-2xs space-y-4">
                    <span className="text-[11px] font-bold text-slate-400 block">ضوابط الأهلية الشرعية</span>
                    <h4 className="text-xs sm:text-sm font-extrabold text-[#0b1c30] leading-relaxed">
                      علّل: يُشترط في "الملتزم للعوض" إطلاق التصرف المالي وفق القواعد الفقهية؟
                    </h4>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {["#تصرف", "#مال", "#أهلية", "#رشد"].map((tag) => (
                        <span key={tag} className="px-3.5 py-1 bg-[#eff4ff] rounded-full text-[11px] font-bold text-[#0b1c30]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Smart Explanations & Links (التفسيرات والروابط الذكية) */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-[#e0c0b1]/40 pb-3">
                  <Brain className="h-5 w-5 text-[#8127cf]" />
                  <h3 className="text-base sm:text-lg font-black text-[#0b1c30]">التفسيرات والروابط الذكية</h3>
                  <span className="mr-auto text-xs font-bold text-slate-400">قواعد تثبيت الذكاء الاصطناعي</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="zen-card bg-[#fffbf9] p-7 rounded-3xl border border-[#ffdbca] space-y-4 shadow-2xs">
                    <span className="text-[11px] font-extrabold text-[#9d4300] block">الملخص الشامل</span>
                    <h4 className="text-xs sm:text-sm font-bold text-[#0b1c30] leading-relaxed">
                      {block.zaitouna?.reasoning || block.mnemonic || "الخلع فسخ للعقد بعوض معلوم لرفع الضرر وحماية الحقوق بالتراضي."}
                    </h4>
                    <div className="grid grid-cols-1 gap-3 pt-2">
                      <div className="bg-white p-4 rounded-2xl border-r-4 border-[#9d4300] shadow-2xs">
                        <span className="text-[11px] font-black text-[#9d4300] block mb-1">📌 قاعدة سريعة:</span>
                        <p className="text-xs font-bold text-slate-700">فرقة بعوض معلوم = بينونة فورية وحماية تامة للحقوق.</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border-r-4 border-[#8127cf] shadow-2xs">
                        <span className="text-[11px] font-black text-[#8127cf] block mb-1">💡 رابط ظريف للذاكرة:</span>
                        <p className="text-xs font-bold text-slate-700">
                          {block.funny_link || "زي ما اشتريت تذكرة الدخول بمهر، بتدفع تذكرة الخروج بعوض معلوم!"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="zen-card bg-[#fffbf9] p-7 rounded-3xl border border-[#ffdbca] space-y-4 shadow-2xs">
                    <span className="text-[11px] font-extrabold text-[#9d4300] block">الربط الشرعي والتطبيقي</span>
                    <h4 className="text-xs sm:text-sm font-bold text-[#0b1c30] leading-relaxed">
                      {block.zaitouna?.links || "يُباح الخلع في جميع الأوقات لرفع المشقة وتيسير المعاملات الشرعية."}
                    </h4>
                    <div className="grid grid-cols-1 gap-3 pt-2">
                      <div className="bg-white p-4 rounded-2xl border-r-4 border-[#9d4300] shadow-2xs">
                        <span className="text-[11px] font-black text-[#9d4300] block mb-1">📌 قاعدة سريعة:</span>
                        <p className="text-xs font-bold text-slate-700">البينونة تمنع الرجعة إلا بعقد ومهر جديدين.</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border-r-4 border-[#8127cf] shadow-2xs">
                        <span className="text-[11px] font-black text-[#8127cf] block mb-1">💡 رابط ظريف للذاكرة:</span>
                        <p className="text-xs font-bold text-slate-700">الباب المتقفل بالخلع مبيتفتحش إلا بمفتاح جديد (عقد ومهر)!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isQuiz && (
            <QuizSection
              quizzes={block.quizzes}
              type={
                stage === "quizzes_mcq"
                  ? "mcq"
                  : stage === "quizzes_fill"
                  ? "fill"
                  : stage === "quizzes_essay"
                  ? "essay"
                  : "all"
              }
              stage={stage}
              lessonTitle={block.title}
              onAllCorrect={() => {
                setIsQuizDone(true);
                handleNextClick();
              }}
            />
          )}

          {/* Stage: Flashcards for Level 2 */}
          {stage === "flashcards" && <FlashcardsSection block={block} />}

          {/* Stage: Standalone Paper Summary Page for Level 1 */}
          {stage === "paper_summary" && (
            <div className="rounded-[28px] bg-amber-50/95 p-8 shadow-[var(--shadow-soft)] border-2 border-amber-300 space-y-6 text-right dir-rtl" dir="rtl">
              <div className="flex items-center justify-between border-b border-amber-200/90 pb-4">
                <div className="flex items-center gap-2.5 text-amber-950 font-black text-lg">
                  <Sparkles className="h-6 w-6 text-amber-600" />
                  <span>تمرين التلخيص اليدوي في الكراسة 📝✨</span>
                </div>
                <span className="text-xs font-bold text-amber-950 bg-amber-200 px-3.5 py-1 rounded-full border border-amber-300 shadow-xs">
                  المستوى الأول — صفحة خاصة لتعزيز الذاكرة
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-bold text-amber-950 leading-relaxed">
                  🎉 أحسنت بطل! الآن احضر كراستك الخارجية وقلمك..
                </p>
                <p className="text-xs font-semibold text-amber-900 leading-relaxed">
                  أمامك النص الأصلي للفقرة كاملاً بدون أي ضغط أو إجبار على الحفظ صم.. اكتب ملخصك الخاص بأسلوبك أو ارسم خريطتك الذهنية بيديك لترسيخ المعلومة في ذاكرتك الأعمق!
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 border border-amber-200 text-sm font-light leading-loose text-zen-on-surface shadow-xs">
                <HardWordText text={block.full_text} words={block.hard_words} highlights={block.highlights} />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-amber-200/80">
                <button
                  type="button"
                  onClick={() => setShowBlockNotesModal(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-amber-950 border border-amber-300 hover:bg-amber-100 transition cursor-pointer shadow-xs"
                >
                  <BookMarked className="h-4 w-4 text-amber-600" />
                  <span>تدوين ملاحظة في كراسة الدرس الرقمية 📓</span>
                </button>

                <span className="text-xs font-bold text-amber-800">
                  عند الانتهاء من التلخيص في كراستك اليدوية، اضغط (التالي / إنهاء) للمتابعة ✨
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Footer Controls (Hidden during quiz stage to avoid duplicate navigation buttons) */}
      {!isQuiz && (
        <div className="mt-16 flex items-center justify-between">
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="rounded-full px-5 py-2.5 text-[13px] font-medium text-zen-on-surface-variant transition hover:bg-zen-surface-low disabled:opacity-30 cursor-pointer"
          >
            السابق
          </button>

          {isLast ? (
            <button
              onClick={onComplete}
              disabled={enforceTimeGate && !timeGatePassed}
              className="rounded-full bg-zen-primary px-8 py-3 text-[14px] font-bold text-white shadow-[var(--shadow-fab)] transition hover:opacity-90 disabled:opacity-30 cursor-pointer"
            >
              إنهاء الفقرة ✨
            </button>
          ) : (
            <button
              onClick={handleNextClick}
              disabled={enforceTimeGate && !timeGatePassed}
              className="rounded-full bg-zen-primary px-8 py-3 text-[14px] font-bold text-white shadow-[var(--shadow-fab)] transition hover:opacity-90 disabled:opacity-30 cursor-pointer"
            >
              التالي ➔
            </button>
          )}
        </div>
      )}

      <SmartNotesModal
        isOpen={showBlockNotesModal}
        onClose={() => setShowBlockNotesModal(false)}
        lessonTitle={block.title}
        initialBlockTitle={block.title}
      />
    </div>
  );
}
