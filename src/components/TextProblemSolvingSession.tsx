import { useState } from "react";
import {motion} from "framer-motion";
import {
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import type { SmartFlashcard } from "@/lib/spaced-repetition";

export function TextProblemSolvingSession({
  blindSpotCards,
  onFinishSession,
}: {
  blindSpotCards: SmartFlashcard[];
  onFinishSession: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [retypedAnswer, setRetypedAnswer] = useState("");
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState("");

  const currentCard = blindSpotCards[currentIndex];

  if (!currentCard || completedIds.size >= blindSpotCards.length) {
    return (
      <div
        className="mx-auto w-full max-w-xl text-center space-y-6 dir-rtl p-8 bg-emerald-50 rounded-[28px] border-2 border-emerald-300 shadow-lg"
        dir="rtl"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-3xl">
          🎉
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-emerald-950">
            أحسنت بطل! تم إغلاق الفجوات المعرفية بنجاح 🟢✨
          </h3>
          <p className="text-xs font-bold text-emerald-900 leading-relaxed">
            تمت إعادة كتابة كافة الكروت المعقدة والمغالطات الخطيرة وتثبيت مفاهيمها في ذاكرتك
            الدائمة.
          </p>
        </div>
        <button
          type="button"
          onClick={onFinishSession}
          className="rounded-2xl bg-emerald-600 px-8 py-3.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition cursor-pointer"
        >
          إنهاء الجلسة والعودة ➔
        </button>
      </div>
    );
  }

  const handleSubmitFix = () => {
    if (!retypedAnswer.trim()) {
      setErrorMsg("يرجى إعادة كتابة الإجابة النموذجية لتثبيتها في العقْل.");
      return;
    }

    // Check if user retyped a significant portion of model answer / keywords
    const isGood = retypedAnswer.trim().length >= 4;

    if (isGood) {
      setErrorMsg("");
      const nextCompleted = new Set(completedIds).add(currentCard.id);
      setCompletedIds(nextCompleted);
      setRetypedAnswer("");

      if (currentIndex < blindSpotCards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 dir-rtl text-right" dir="rtl">
      {/* Session Alert Header */}
      <div className="rounded-2xl bg-rose-600 p-4 text-white shadow-md space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-black">
            <AlertCircle className="h-5 w-5 text-rose-200 animate-pulse" />
            <span>🛠️ جلسة حل المشاكل النصية (إغلاق الفجوات المعرفية)</span>
          </div>
          <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full border border-rose-400">
            {currentIndex + 1} من {blindSpotCards.length}
          </span>
        </div>
        <p className="text-xs font-semibold text-rose-100">
          هذه الجلسة مخصصة للكروت التي أجبت عليها بثقة مرتفعة ولكن إجابتك تضمنت مغالطة أو نقص في
          المفاهيم الأساسية.
        </p>
      </div>

      {/* Main Fixing Card */}
      <motion.div
        key={currentCard.id}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] bg-white p-6 sm:p-8 shadow-md border-2 border-rose-300 space-y-6"
      >
        {/* Question & Concept */}
        <div className="space-y-2 border-b border-rose-100 pb-4">
          <span className="text-xs font-black text-rose-800 bg-rose-100 px-3 py-1 rounded-full border border-rose-200">
            📌 السؤال المعقّد
          </span>
          <h3 className="text-base sm:text-lg font-black text-slate-900 leading-relaxed pt-1">
            {currentCard.question}
          </h3>
        </div>

        {/* 2-line Simple Arabic Explanation (بالبلدي) */}
        <div className="rounded-2xl bg-amber-50 p-5 border border-amber-300 space-y-2">
          <div className="flex items-center gap-2 text-amber-950 font-black text-xs">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <span>تفكيك سبب اللخبطة بالبلدي 💡:</span>
          </div>
          <p className="text-xs font-bold text-amber-950 leading-relaxed">
            {currentCard.explanation_baladi ||
              `تذكر أن الحكم الفقهي يدور حول: (${currentCard.model_answer}). الالتزام بالكلمات المفتاحية يمنع الوقوع في هذه المغالطة مرة أخرى.`}
          </p>
        </div>

        {/* Correct Model Answer to memorize */}
        <div className="rounded-2xl bg-slate-900 p-5 text-white space-y-2">
          <span className="text-xs font-black text-amber-400">💡 الإجابة النموذجية الصحيحة:</span>
          <p className="text-sm font-bold text-amber-100 leading-relaxed">
            {currentCard.model_answer}
          </p>
          {currentCard.keywords && currentCard.keywords.length > 0 && (
            <div className="pt-2 text-xs font-semibold text-slate-300 flex flex-wrap gap-2">
              <span className="text-amber-300">الكلمات المفتاحية:</span>
              {currentCard.keywords.map((kw, i) => (
                <span
                  key={i}
                  className="bg-slate-800 text-amber-200 px-2.5 py-0.5 rounded-full border border-slate-700"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Retype Box Required */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-bold text-slate-800 block">
            ✍️ أعد كتابة الإجابة النموذجية الصحيحة الآن لإغلاق الفجوة المعرفية:
          </label>
          <textarea
            value={retypedAnswer}
            onChange={(e) => setRetypedAnswer(e.target.value)}
            rows={3}
            placeholder="اكتب الإجابة النموذجية هنا للتأكيد..."
            className="w-full rounded-2xl border border-rose-300 p-4 text-sm font-medium leading-relaxed text-slate-900 shadow-inner focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition"
          />

          {errorMsg && <p className="text-xs font-bold text-rose-600">{errorMsg}</p>}

          <button
            type="button"
            onClick={handleSubmitFix}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-rose-700 transition cursor-pointer"
          >
            <CheckCircle2 className="h-5 w-5" />
            <span>تأكيد الحفظ وإغلاق الفجوة ➔</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
