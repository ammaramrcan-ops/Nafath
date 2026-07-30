import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wind,
  Droplets,
  Sparkles,
  Brain,
  CheckCircle2,
  ArrowLeft,
  HelpCircle,
  Zap,
} from "lucide-react";

import { useSettings } from "@/lib/settings";

export type LearningLevel = 1 | 2 | 3;

interface PrepModalProps {
  isOpen: boolean;
  onConfirm: (data: { distractions: string[]; hasWater: boolean; level: LearningLevel }) => void;
  onCancel?: () => void;
}

export function PrepModal({ isOpen, onConfirm, onCancel }: PrepModalProps) {
  const { devModeActive } = useSettings();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1 state
  const [distraction, setDistraction] = useState("");

  // Step 2 state
  const [hasWater, setHasWater] = useState<boolean | null>(null);

  // Step 3 state (Breathing timer - 60s)
  const [breathingElapsed, setBreathingElapsed] = useState(0);
  const breathingDuration = 60;

  // Step 4 state
  const [selectedLevel, setSelectedLevel] = useState<LearningLevel>(1);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && step === 3) {
      timer = setInterval(() => {
        setBreathingElapsed((prev) => {
          if (prev >= breathingDuration) {
            clearInterval(timer);
            return breathingDuration;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, step]);

  if (!isOpen) return null;

  const isBreathingDone = breathingElapsed >= breathingDuration;

  const handleFinish = () => {
    onConfirm({
      distractions: distraction.trim() ? [distraction.trim()] : [],
      hasWater: hasWater ?? true,
      level: selectedLevel,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[1000] min-h-screen w-full bg-[#f3f5fe] flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto dir-rtl text-right font-body-md text-[#0b1c30]"
      dir="rtl"
    >
      {/* Centered Modal Card Container (Expanded 85% width) */}
      <div className="relative w-full max-w-[85vw] mx-auto bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-[0_20px_60px_-15px_rgba(11,28,48,0.08)] border border-slate-100 my-auto space-y-8">
        {/* Header Progress Indicators & Dev Mode Skip All Button */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === s
                    ? "w-7 bg-[#f97316]"
                    : step > s
                      ? "w-4 bg-emerald-500"
                      : "w-4 bg-slate-200"
                }`}
              />
            ))}
          </div>
          {devModeActive ? (
            <button
              type="button"
              onClick={() => setStep(4)}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-950 text-xs font-extrabold border border-amber-300 hover:bg-amber-200 transition cursor-pointer shadow-2xs"
              title="تخطي خطوات الاستعداد الثلاث الأولى (المشتتات والماء والتنفس) والانتقال مباشرة لصفحة اختيار المستوى"
            >
              <Zap className="h-3.5 w-3.5 text-amber-600" />
              <span>تخطي الـ 3 خطوات لصفحة المستوى ⚡</span>
            </button>
          ) : (
            <span className="text-xs font-semibold text-slate-400">الخطوة {step} من 4</span>
          )}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Distractions (تصفية الذهن من المشتتات - Expanded Height) */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="space-y-8 text-center min-h-[420px] flex flex-col justify-between py-2"
            >
              <div className="space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ffdbca]/60 text-[#9d4300]">
                  <Brain className="h-8 w-8" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-[#0b1c30]">
                    تصفية الذهن من المشتتات
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed max-w-lg mx-auto">
                    هل يوجد ما يشتتك الآن؟ اكتبه هنا لتتخلص منه وتبدأ بتركيز صافٍ.
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-right">
                <label className="block text-xs sm:text-sm font-bold text-slate-600">
                  اكتب ما يشتت ذهنك هنا (أفكار، مهام، أو مشغلات خارجية):
                </label>
                <textarea
                  rows={5}
                  value={distraction}
                  onChange={(e) => setDistraction(e.target.value)}
                  placeholder="مثال: أترقب اتصالاً هاماً، التفكير في الرد على الرسائل، أو الضوضاء المحيطة..."
                  className="w-full min-h-[140px] resize-none rounded-3xl border border-blue-200 bg-white p-5 text-sm sm:text-base font-semibold text-[#0b1c30] placeholder:text-slate-300 focus:outline-none focus:border-[#9d4300] transition shadow-2xs leading-relaxed"
                />
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-5 rounded-2xl bg-[#213145] hover:bg-[#0b1c30] text-white font-black text-base sm:text-lg flex items-center justify-center gap-3 transition cursor-pointer shadow-xl hover:scale-[1.01] active:scale-95"
              >
                <span>التالي: تفقد الماء</span>
                <ArrowLeft className="h-5 w-5" />
              </button>
            </motion.div>
          )}

          {/* STEP 2: Water Check (هل بجانبك كوب ماء؟ - Matches Image 2) */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="space-y-6 text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f0dbff]/60 text-[#8127cf]">
                <Droplets className="h-8 w-8" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-xl sm:text-2xl font-bold text-[#0b1c30]">هل بجانبك كوب ماء؟</h2>
                <p className="text-xs text-slate-500 font-normal leading-relaxed max-w-xs mx-auto">
                  شرب الماء أثناء التعلم يغذي الدماغ ويساعد على التركيز والتحصيل الدراسي. خذ وقتك
                  لتكون في أبهى حالاتك الذهنية.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  onClick={() => {
                    setHasWater(true);
                    setStep(3);
                  }}
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-[#8127cf] bg-white p-5 hover:bg-purple-50/50 transition cursor-pointer text-center"
                >
                  <span className="text-sm font-bold text-[#8127cf]">نعم، بجانبي 💧</span>
                  <span className="text-[10px] text-slate-400 font-medium mt-1">
                    جاهز للانتقال للخطوة التالية
                  </span>
                </button>

                <button
                  onClick={() => {
                    setHasWater(false);
                    setStep(3);
                  }}
                  className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-5 hover:bg-slate-50 transition cursor-pointer text-center"
                >
                  <span className="text-sm font-bold text-[#0b1c30]">سوف أذهب وأحضر 🏃</span>
                  <span className="text-[10px] text-slate-400 font-medium mt-1">
                    خذ دقيقة لإحضار الماء
                  </span>
                </button>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() =>
                    alert("شرب الماء يزيد من نشاط خلايا الدماغ ويعزز التذكر بنسبة 15%.")
                  }
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#8127cf] font-medium cursor-pointer"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>لماذا الماء مهم للدراسة؟</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Breathing Exercise (قم بعمل تمارين تنفس - Matches Image 3 EXACTLY) */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="space-y-6 text-center"
            >
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#f0dbff] text-[#8127cf] text-xs font-bold mx-auto">
                <Wind className="h-3.5 w-3.5" />
                <span>تمرين التنفس الهادئ</span>
              </div>

              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-[#0b1c30]">
                  قم بعمل تمارين تنفس لمدة دقيقة
                </h2>
                <p className="text-xs text-slate-500 font-normal leading-relaxed">
                  شهيق عميق... وزفير بطيء. استرخِ بالكامل لتهيأة ذهنك للاستيعاب.
                </p>
              </div>

              {/* Graphic Circle (Blue glowing circle with purple wind icon) */}
              <div className="py-2">
                <div className="w-36 h-36 mx-auto rounded-full bg-[#eaf1ff] flex items-center justify-center p-3 shadow-inner">
                  <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-md">
                    <Wind className="h-10 w-10 text-[#8127cf]" />
                  </div>
                </div>
              </div>

              {/* Countdown & Timer Bar */}
              <div className="space-y-2 text-right">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#0b1c30] text-sm">
                    {Math.max(0, breathingDuration - breathingElapsed)} ثانية
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">الوقت المتبقي:</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-[#f97316] rounded-full transition-all duration-500"
                    style={{
                      width: `${(breathingElapsed / breathingDuration) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className={`w-full py-4 rounded-2xl font-bold text-sm text-center shadow-xs transition cursor-pointer ${
                    isBreathingDone || devModeActive
                      ? "bg-[#9d4300] hover:bg-[#833800] text-white"
                      : "bg-[#edf3ff] text-[#0b1c30]"
                  }`}
                >
                  {isBreathingDone || devModeActive
                    ? "اكتمال التمرين! الانتقال لاختيار المستوى ✨"
                    : `انتظر حتى انتهاء الدقيقة (${Math.max(
                        0,
                        breathingDuration - breathingElapsed,
                      )}s)`}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="inline-flex items-center gap-1 text-xs text-[#c05621] hover:underline font-bold cursor-pointer"
                >
                  <span className="text-sm">{devModeActive ? "⚡" : "⚠️"}</span>
                  <span>
                    {devModeActive
                      ? "تخطي فوراً (وضع المطور ⚡)"
                      : "تخطي تمرين التنفس (غير مستحسن)"}
                  </span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Level Selection */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="space-y-6 text-center sm:text-right"
            >
              <div className="mx-auto sm:mx-0 flex h-14 w-14 items-center justify-center rounded-full bg-[#ffdbca]/60 text-[#9d4300]">
                <Sparkles className="h-7 w-7" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-[#0b1c30]">
                  اختر مستوى دراسة الدرس
                </h2>
                <p className="text-xs text-slate-500 font-normal leading-relaxed">
                  حدد نمط التعلم والتحدي التكيّفي المناسب لك اليوم.
                </p>
              </div>

              <div className="space-y-3">
                {/* Level 1 */}
                <button
                  type="button"
                  onClick={() => setSelectedLevel(1)}
                  className={`w-full text-right rounded-2xl border p-4 transition text-xs cursor-pointer ${
                    selectedLevel === 1
                      ? "border-2 border-[#9d4300] bg-[#ffdbca]/20 shadow-xs"
                      : "border-slate-200 bg-white hover:border-[#9d4300]/40"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-[#0b1c30] mb-1 text-sm">
                    <span>المستوى الأول: التعلم المباشر 🌱</span>
                    {selectedLevel === 1 && <CheckCircle2 className="h-4 w-4 text-[#9d4300]" />}
                  </div>
                  <p className="text-slate-500 leading-relaxed font-normal">
                    لا يوجد اختبار قبلي — البدء المباشر بشرح واستعراض الدرس بترتيب سلس ومريح.
                  </p>
                </button>

                {/* Level 2 */}
                <button
                  type="button"
                  onClick={() => setSelectedLevel(2)}
                  className={`w-full text-right rounded-2xl border p-4 transition text-xs cursor-pointer ${
                    selectedLevel === 2
                      ? "border-2 border-[#9d4300] bg-[#ffdbca]/20 shadow-xs"
                      : "border-slate-200 bg-white hover:border-[#9d4300]/40"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-[#0b1c30] mb-1 text-sm">
                    <span>المستوى الثاني: التحدي المتوسط 🌿</span>
                    {selectedLevel === 2 && <CheckCircle2 className="h-4 w-4 text-[#9d4300]" />}
                  </div>
                  <p className="text-slate-500 leading-relaxed font-normal">
                    يبدأ باختبار قبلي يتضمن أسئلة اختيار من متعدد (اختر) لقياس مستواك القبلي.
                  </p>
                </button>

                {/* Level 3 */}
                <button
                  type="button"
                  onClick={() => setSelectedLevel(3)}
                  className={`w-full text-right rounded-2xl border p-4 transition text-xs cursor-pointer ${
                    selectedLevel === 3
                      ? "border-2 border-[#9d4300] bg-[#ffdbca]/20 shadow-xs"
                      : "border-slate-200 bg-white hover:border-[#9d4300]/40"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-[#0b1c30] mb-1 text-sm">
                    <span>المستوى الثالث: التحدي المتقدم والشامل 🌳</span>
                    {selectedLevel === 3 && <CheckCircle2 className="h-4 w-4 text-[#9d4300]" />}
                  </div>
                  <p className="text-slate-500 leading-relaxed font-normal">
                    اختبار قبلي مكثف يشمل أسئلة اختر، أكمل الفراغ، وأسئلة مقالية تفاعلية.
                  </p>
                </button>
              </div>

              <button
                onClick={handleFinish}
                className="w-full py-4 rounded-2xl bg-[#9d4300] hover:bg-[#833800] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <span>البدء في الدرس الآن 🚀</span>
                <ArrowLeft className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-4 text-xs font-medium text-slate-400 hover:text-[#9d4300] cursor-pointer"
        >
          إلغاء وإغلاق
        </button>
      )}
    </div>
  );
}

export default PrepModal;
