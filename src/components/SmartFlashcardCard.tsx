import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Lightbulb,
  Clock,
  Flame,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  Send,
  Zap,
  Tag,
  BookOpen,
  Pencil,
  RotateCcw,
} from "lucide-react";
import {
  CATEGORY_INFO,
  evaluateSmartSR,
  type FlashcardCategory,
  type SmartFlashcard,
} from "@/lib/spaced-repetition";

export function SmartFlashcardCard({
  card,
  currentIndex,
  totalCards,
  dailyStreak,
  daysToExam,
  onCompleteCard,
  onEditCard,
  onExitStudy,
}: {
  card: SmartFlashcard;
  currentIndex: number;
  totalCards: number;
  dailyStreak: number;
  daysToExam?: number;
  onCompleteCard: (
    updatedCard: SmartFlashcard,
    isBlindSpot: boolean,
    evaluation: {
      matchedKeywords: string[];
      missingKeywords: string[];
      isCorrect: boolean;
      diagnostic: string;
    }
  ) => void;
  onEditCard?: (card: SmartFlashcard) => void;
  onExitStudy?: () => void;
}) {
  const [userAnswer, setUserAnswer] = useState("");
  const [confidence, setConfidence] = useState<"low" | "medium" | "high">("medium");
  const [showHint, setShowHint] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  // Latency timer in seconds
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const timerRef = useRef<any>(null);

  // Reset state when card changes
  useEffect(() => {
    setUserAnswer("");
    setConfidence("medium");
    setShowHint(false);
    setUsedHint(false);
    setIsRevealed(false);
    setElapsedSeconds(0);
    setIsTimerRunning(true);
  }, [card.id]);

  // Handle Latency Timer
  useEffect(() => {
    if (isTimerRunning && !isRevealed) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 0.1);
      }, 100);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning, isRevealed]);

  // Stop timer on first typing
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setUserAnswer(val);
    if (val.length > 0 && isTimerRunning) {
      setIsTimerRunning(false);
    }
  };

  const handleToggleHint = () => {
    setShowHint((prev) => !prev);
    setUsedHint(true);
  };

  const catInfo = CATEGORY_INFO[card.category] || CATEGORY_INFO.summary;

  const [evalResult, setEvalResult] = useState<{
    updatedCard: SmartFlashcard;
    isBlindSpot: boolean;
    diagnostic: string;
    matchedKeywords: string[];
    missingKeywords: string[];
    isCorrect: boolean;
  } | null>(null);

  const handleReveal = () => {
    const result = evaluateSmartSR(
      card,
      userAnswer,
      confidence,
      elapsedSeconds,
      usedHint,
      daysToExam
    );
    setEvalResult(result);
    setIsRevealed(true);
  };

  const handleNext = () => {
    if (evalResult) {
      onCompleteCard(evalResult.updatedCard, evalResult.isBlindSpot, {
        matchedKeywords: evalResult.matchedKeywords,
        missingKeywords: evalResult.missingKeywords,
        isCorrect: evalResult.isCorrect,
        diagnostic: evalResult.diagnostic,
      });
    }
  };

  const formattedTimer = `${Math.floor(elapsedSeconds / 60)
    .toString()
    .padStart(2, "0")}:${(Math.floor(elapsedSeconds) % 60)
    .toString()
    .padStart(2, "0")}`;

  const progressPercent = Math.round(((currentIndex + 1) / totalCards) * 100);

  return (
    <div className="mx-auto w-full max-w-[85vw] space-y-6 dir-rtl text-right font-body-md" dir="rtl">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white p-5 shadow-sm border border-[#e0c0b1]/40">
        <div className="flex items-center gap-4">
          {onExitStudy && (
            <button
              onClick={onExitStudy}
              className="flex items-center gap-1.5 rounded-full px-5 py-2.5 bg-[#eff4ff] text-[#9d4300] hover:bg-[#dce9ff] transition cursor-pointer font-black text-xs shadow-xs"
            >
              <span>← إنهاء الجلسة والرجوع</span>
            </button>
          )}
          <div>
            <h3 className="font-extrabold text-[#0b1c30] text-sm sm:text-base">{card.question.slice(0, 45)}...</h3>
            <span className="text-xs font-semibold text-[#9d4300]">جلسة التكرار المتباعد الفعالة</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#ffdbca]/40 px-4 py-1.5 rounded-full border border-[#9d4300]/20">
            <Flame className="h-4 w-4 text-[#9d4300] fill-[#9d4300]" />
            <span className="text-xs font-extrabold text-[#9d4300]">{dailyStreak} يوم استمرار</span>
          </div>

          {onEditCard && (
            <button
              type="button"
              onClick={() => onEditCard(card)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#eff4ff] px-3.5 py-1.5 text-xs font-bold text-[#0b1c30] border border-[#e0c0b1]/40 hover:bg-[#dce9ff] transition cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5 text-[#9d4300]" />
              <span>تعديل الكارت</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="space-y-2 px-2">
        <div className="flex justify-between items-center text-xs font-extrabold text-[#584237]">
          <span>البطاقة {currentIndex + 1} من {totalCards}</span>
          <span className="text-[#9d4300]">{progressPercent}% مكتمل</span>
        </div>
        <div className="w-full h-2 bg-[#ffdbca]/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#9d4300] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Card Container (Zen Stitch UI) */}
      <motion.div
        key={card.id}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full bg-white border border-[#e0c0b1]/40 rounded-[2.5rem] p-8 sm:p-12 shadow-xl relative overflow-hidden space-y-8 min-h-[460px] flex flex-col justify-between"
      >
        {/* Section Chip */}
        <div className="flex items-center justify-between border-b border-[#e0c0b1]/30 pb-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f0dbff] text-[#2c0051] font-bold text-xs">
            <span>{catInfo.icon}</span>
            <span>قسم: {catInfo.label}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#584237] bg-[#eff4ff] px-3 py-1 rounded-full">
            <Clock className="h-3.5 w-3.5 text-[#9d4300]" />
            <span>⏱️ {formattedTimer}</span>
          </div>
        </div>

        {/* Question Area */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-3xl font-black text-[#0b1c30] leading-relaxed">
            {card.question}
          </h2>
        </div>

        {/* Hint Accordion */}
        {card.hint && (card.hint.mnemonic || card.hint.keyword_cues) && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleToggleHint}
              className="group flex items-center gap-2 text-[#584237] hover:text-[#8127cf] transition-all text-xs font-bold cursor-pointer"
            >
              <Lightbulb className={`h-4 w-4 text-[#8127cf] transition-transform duration-300 ${showHint ? "rotate-180" : ""}`} />
              <span>روابط ذهنية وتلميحات</span>
            </button>

            <AnimatePresence>
              {showHint && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden p-4 rounded-2xl bg-[#eff4ff] border-r-4 border-[#8127cf] text-xs sm:text-sm font-semibold text-[#0b1c30] space-y-1.5"
                >
                  {card.hint.mnemonic && (
                    <p>💡 <strong>الرابط الذهني:</strong> {card.hint.mnemonic}</p>
                  )}
                  {card.hint.keyword_cues && (
                    <p>🔑 <strong>إشارات الكلمات:</strong> {card.hint.keyword_cues}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Input Area */}
        {!isRevealed && (
          <div className="space-y-3 pt-2">
            <textarea
              placeholder="اكتب إجابتك هنا بتفصيل..."
              rows={5}
              value={userAnswer}
              onChange={handleInputChange}
              className="w-full min-h-[140px] bg-[#f8f9ff] border border-[#e0c0b1]/50 rounded-3xl p-5 text-sm sm:text-base font-bold text-[#0b1c30] placeholder:text-[#584237]/40 focus:outline-none focus:ring-2 focus:ring-[#9d4300] transition shadow-2xs leading-relaxed"
            />
          </div>
        )}

        {/* Confidence Assessment Buttons (Before Reveal) */}
        {!isRevealed && (
          <div className="space-y-4 pt-4 border-t border-[#e0c0b1]/30">
            <p className="text-xs font-bold text-[#584237]/80 text-center">
              قيم مستوى ثقتك بإجابتك قبل الكشف:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setConfidence("low")}
                className={`flex items-center justify-center gap-2 py-4 px-4 rounded-2xl border transition-all cursor-pointer font-bold text-xs ${
                  confidence === "low"
                    ? "bg-rose-100 border-rose-500 text-rose-950 shadow-xs"
                    : "bg-white border-[#e0c0b1]/40 text-[#584237] hover:bg-rose-50"
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                <span>شاكك</span>
              </button>

              <button
                type="button"
                onClick={() => setConfidence("medium")}
                className={`flex items-center justify-center gap-2 py-4 px-4 rounded-2xl border transition-all cursor-pointer font-bold text-xs ${
                  confidence === "medium"
                    ? "bg-amber-100 border-amber-500 text-amber-950 shadow-xs"
                    : "bg-white border-[#e0c0b1]/40 text-[#584237] hover:bg-amber-50"
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                <span>متوسط</span>
              </button>

              <button
                type="button"
                onClick={() => setConfidence("high")}
                className={`flex items-center justify-center gap-2 py-4 px-4 rounded-2xl border transition-all cursor-pointer font-bold text-xs ${
                  confidence === "high"
                    ? "bg-purple-100 border-purple-500 text-purple-950 shadow-xs"
                    : "bg-white border-[#e0c0b1]/40 text-[#584237] hover:bg-purple-50"
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#8127cf]" />
                <span>واثق جداً</span>
              </button>
            </div>

            {/* Primary Reveal CTA */}
            <div className="pt-6 flex justify-center">
              <button
                type="button"
                onClick={handleReveal}
                className="px-10 py-4 bg-[#9d4300] hover:bg-[#833800] text-white rounded-full font-extrabold text-base shadow-lg shadow-[#9d4300]/20 transition-all flex items-center gap-3 cursor-pointer"
              >
                <span>كشف وتدقيق الإجابة النموذجية</span>
                <Eye className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Revealed Diagnostic & Next Button (After Reveal) */}
        {isRevealed && evalResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pt-4 border-t border-[#e0c0b1]/40"
          >
            {/* Model Answer */}
            <div className="p-5 rounded-2xl bg-[#fffaf7] border border-[#e0c0b1]/60 border-r-4 border-r-[#9d4300] space-y-2">
              <span className="text-xs font-black text-[#9d4300] block">💡 الإجابة النموذجية الصحيحة:</span>
              <p className="text-sm font-bold text-[#0b1c30] leading-relaxed">{card.model_answer}</p>
            </div>

            {/* AI Diagnostic Summary */}
            <div className="p-5 rounded-2xl bg-[#ffdbca]/20 border border-[#e0c0b1]/40 space-y-2 text-xs font-semibold text-[#584237]">
              <span className="font-extrabold block text-[#9d4300]">📊 التقييم الإدراكي:</span>
              <p>{evalResult.diagnostic}</p>
            </div>

            {/* Keywords Checklist */}
            {card.keywords && card.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <span className="text-[#584237]">الكلمات المفتاحية:</span>
                {card.keywords.map((kw, i) => {
                  const isMatched = evalResult.matchedKeywords.includes(kw);
                  return (
                    <span
                      key={i}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                        isMatched
                          ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                          : "bg-rose-100 text-rose-900 border-rose-300"
                      }`}
                    >
                      {isMatched ? "✓ " : "✗ "} {kw}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Next Card CTA */}
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={handleNext}
                className="px-10 py-4 bg-[#9d4300] hover:bg-[#833800] text-white rounded-full font-extrabold text-base shadow-md transition-all flex items-center gap-3 cursor-pointer"
              >
                <span>الكارت التالي</span>
                <Send className="h-5 w-5 rotate-180" />
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
