import { useState } from "react";
import { Clock, BookOpen, Layers, ArrowRight, Sparkles } from "lucide-react";
import type { Lesson } from "@/lib/lesson-data";
import { PrepModal, type LearningLevel } from "./PrepModal";

export function WelcomeScreen({
  lesson,
  onStart,
}: {
  readonly lesson: Lesson;
  readonly onStart: (level: LearningLevel) => void;
}) {
  const [showPrepModal, setShowPrepModal] = useState(false);

  const handleStart = () => setShowPrepModal(true);
  const handleConfirm = (data: { level: LearningLevel }) => {
    setShowPrepModal(false);
    onStart(data.level);
  };

  const totalTerms = lesson.blocks.reduce((acc, b) => acc + (b.hard_words?.length || 0), 0);

  return (
    <div
      dir="rtl"
      lang="ar"
      className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] antialiased flex flex-col items-center justify-start relative overflow-x-hidden selection:bg-[#ffdbca] selection:text-[#341100]"
    >
      {/* Background Decorative Blur */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 opacity-30 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(229,238,255,0.6)_0%,rgba(248,249,255,1)_100%)]" />

      <main className="flex-grow w-full max-w-[1100px] mx-auto px-6 pt-24 pb-24 flex flex-col items-center text-center">
        {/* Intent / Category Tag */}
        <div className="mb-4 opacity-80">
          <span className="px-4 py-1.5 rounded-full bg-[#ffdbca]/40 text-[#9d4300] font-extrabold text-xs tracking-widest uppercase">
            ابدأ رحلتك التعليمية
          </span>
        </div>

        {/* Hero Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0b1c30] mb-6 leading-tight tracking-tight">
            {lesson.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-6 mb-8 text-[#584237]">
            <div className="flex items-center gap-2 bg-[#eff4ff] px-4 py-2 rounded-full border border-[#e0c0b1]/30 text-sm font-extrabold">
              <Clock className="h-4 w-4 text-[#9d4300]" />
              <span>{lesson.estimatedTime || "35 دقيقة"}</span>
            </div>
            <div className="flex items-center gap-2 bg-[#eff4ff] px-4 py-2 rounded-full border border-[#e0c0b1]/30 text-sm font-extrabold">
              <BookOpen className="h-4 w-4 text-[#9d4300]" />
              <span>
                {lesson.blocks.length} كتل فقهية · {totalTerms || 10} مصطلحات شرعية
              </span>
            </div>
          </div>
        </div>

        {/* Lesson Topics Bento List */}
        <div className="w-full max-w-3xl mb-12">
          <div className="flex items-center justify-center gap-2.5 mb-6 text-[#584237]/80">
            <Layers className="h-5 w-5 text-[#9d4300]" />
            <h2 className="text-xl font-extrabold text-[#0b1c30]">مواضيع الدرس والفقرات</h2>
          </div>

          <div className="space-y-4">
            {lesson.blocks.map((block, idx) => (
              <div
                key={block.id || idx}
                className="group flex items-center justify-between gap-4 p-5 sm:p-6 bg-white rounded-2xl border border-[#e0c0b1]/40 hover:border-[#9d4300]/50 transition-all shadow-xs hover:shadow-md cursor-pointer text-right"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#ffdbca]/40 text-[#9d4300] font-extrabold text-base flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#0b1c30] group-hover:text-[#9d4300] transition-colors truncate">
                    {block.title || `الفقرة ${idx + 1}`}
                  </h3>
                </div>
                <ArrowRight className="h-4 w-4 text-[#584237]/50 group-hover:text-[#9d4300] group-hover:-translate-x-1 transition-all shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Primary Start CTA */}
        <div className="flex flex-col items-center gap-4 w-full max-w-md">
          <button type="button"
            onClick={handleStart}
            className="w-full h-16 bg-[#9d4300] hover:bg-[#833800] text-white rounded-full font-extrabold text-lg transition-all shadow-xl shadow-[#9d4300]/25 hover:scale-105 active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
          >
            <span>ابدأ الدرس الآن</span>
            <ArrowRight className="h-5 w-5 rotate-180" />
          </button>
          <p className="text-xs font-semibold text-[#584237]/70">
            سيتم إضافة هذا الدرس إلى سجل تقدمك فور البدء
          </p>
        </div>
      </main>

      {/* Floating AI Guide & Help Button */}
      <div className="fixed bottom-6 right-6 z-40 hidden sm:flex flex-col gap-3">
        <button type="button"
          onClick={handleStart}
          className="p-3.5 bg-[#9d4300] text-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 font-bold text-xs cursor-pointer"
        >
          <Sparkles className="h-4 w-4" />
          <span>المساعد الذكي</span>
        </button>
      </div>

      <PrepModal isOpen={showPrepModal} onConfirm={handleConfirm} />
    </div>
  );
}
