import { useState, useMemo } from "react";
import { Target, BookMarked, Sparkles } from "lucide-react";
import type { Lesson } from "@/lib/lesson-data";
import { CheatSheet } from "@/components/CheatSheet";
import { getMistakes } from "@/lib/mistakes";
import { SmartNotesModal } from "@/components/SmartNotesModal";

export function EndScreen({
  lesson,
  onRestart,
  restartLabel,
}: {
  lesson: Lesson;
  onRestart: () => void;
  restartLabel?: string;
}) {
  const [showNotesModal, setShowNotesModal] = useState(false);

  const mistakes = useMemo(() => {
    return getMistakes().filter(
      (m) => m.lessonTitle === lesson.title || m.lessonTitle === "درس عام",
    );
  }, [lesson]);

  return (
    <div className="w-full max-w-[85vw] mx-auto px-4 sm:px-6 py-12 text-right dir-rtl" dir="rtl">
      {/* Hero Success Banner */}
      <div className="mb-10 text-center space-y-3">
        <span className="inline-block text-xs sm:text-sm font-extrabold text-[#f97316] bg-[#f97316]/10 px-4 py-1.5 rounded-full border border-[#f97316]/20">
          🎉 تهانينا! أتممت الدرس بنجاح
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-[#0b1c30] leading-tight pt-1">
          {lesson.title}
        </h1>
        <p className="text-xs sm:text-sm font-bold text-slate-500 max-w-2xl mx-auto">
          استعرض ملخص الزيتونة وراجع كراسة ملاحظاتك ورادار نقاط الضعف
        </p>
      </div>

      {/* Weakness Radar Report */}
      {mistakes.length > 0 ? (
        <div className="mb-10 rounded-3xl bg-[#f97316]/5 p-6 sm:p-8 border-2 border-[#f97316]/20 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-[#f97316] p-3.5 rounded-2xl text-white shadow-md">
              <Target className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#0b1c30]">
                تقرير رادار نقاط الضعف (Weakness Radar Report):
              </h3>
              <p className="text-xs font-semibold text-slate-600 pt-1 leading-relaxed">
                أنت ممتاز في الدرس بشكل عام! ولكن بناءً على الإجابات الخاطئة الـ ({mistakes.length})
                المسجلة، ننصحك بمراجعة جزئية{" "}
                <span className="bg-[#ffdbca] text-[#9d4300] px-3 py-0.5 rounded-full border border-[#e0c0b1]/50 font-bold">
                  #{mistakes[0]?.question.slice(0, 35)}...
                </span>{" "}
                لمدة 3 دقائق فقط لترسيخ الفهم الكامل! 🚀
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-10 rounded-3xl bg-emerald-50 p-6 sm:p-8 border-2 border-emerald-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500 p-3.5 rounded-2xl text-white shadow-md">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-emerald-950">
                تقرير رادار نقاط الضعف: استيعاب كامل بنسبة 100%! 🎯
              </h3>
              <p className="text-xs font-semibold text-emerald-800 pt-1">
                لم تسجل أي أخطاء تُذكر في هذا الدرس! استجابتك ممتازة وجميع النقاط راسخة في الذاكرة.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Open Dedicated Notebook Action */}
      <div className="mb-12 flex justify-center">
        <button
          type="button"
          onClick={() => setShowNotesModal(true)}
          className="inline-flex items-center gap-3 rounded-full bg-[#f97316] hover:bg-[#e06305] px-9 py-4 text-xs sm:text-sm font-black text-white shadow-lg shadow-[#f97316]/20 hover:scale-105 active:scale-95 transition cursor-pointer"
        >
          <BookMarked className="h-5 w-5 text-orange-100" />
          <span>فتح كراسة ملاحظاتي الذهبية لهذا الدرس 📓✨</span>
        </button>
      </div>

      {/* Complete Zaitouna Section */}
      <CheatSheet lesson={lesson} />

      <div className="mt-16 text-center">
        <button
          type="button"
          onClick={onRestart}
          className="rounded-full bg-[#0b1c30] hover:bg-[#213145] px-12 py-4 text-sm font-black text-white shadow-xl hover:scale-105 active:scale-95 transition cursor-pointer"
        >
          {restartLabel ?? "العودة للرئيسية"}
        </button>
      </div>

      <SmartNotesModal
        isOpen={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        lessonTitle={lesson.title}
      />
    </div>
  );
}
