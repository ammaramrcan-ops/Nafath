import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Lightbulb,
  HelpCircle,
  BarChart2,
  Sparkles,
  ArrowRight,
  X,
  BookOpen,
} from "lucide-react";
import type { ParagraphBlock } from "@/lib/lesson-data";

export function ParagraphOverviewModal({
  isOpen,
  block,
  blockNumber,
  totalBlocks,
  onStartParagraph,
  onClose,
}: {
  readonly isOpen: boolean;
  readonly block: ParagraphBlock;
  readonly blockNumber: number;
  readonly totalBlocks: number;
  readonly onStartParagraph: () => void;
  readonly onClose?: () => void;
}) {
  if (!isOpen || !block) return null;

  const conceptCount = block.hard_words?.length || 4;
  const questionsCount = (block.highlights?.length || 2) + 1;
  const essenceText =
    block.short_sentence ||
    block.mnemonic ||
    "الخلع يعني الست بتدفع عوض مالي للزوج عشان تفك الجوازة بالتراضي وتشتري راحتها.";

  return (
    <AnimatePresence>
      <div
        dir="rtl"
        lang="ar"
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-body-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#f8f9ff] text-[#0b1c30] rounded-[2.5rem] p-6 sm:p-10 w-full max-w-3xl shadow-2xl border border-[#e0c0b1]/50 relative space-y-8 my-8 text-right"
        >
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-6 left-6 p-2.5 rounded-full bg-white text-[#584237] hover:bg-[#eff4ff] transition cursor-pointer border border-[#e0c0b1]/40"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          {/* Category Chip */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white text-[#9d4300] font-extrabold text-xs border border-[#e0c0b1]/40 shadow-2xs">
              <BookOpen className="h-4 w-4" />
              <span>
                الفقرة {blockNumber} من {totalBlocks} · تفاصيل الفقرة
              </span>
            </span>
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b1c30] leading-snug">
              {block.title || `فقرة ${blockNumber}`}
            </h2>
            <p className="text-sm font-semibold text-[#584237]/80 leading-relaxed max-w-xl">
              نظرة شاملة على المفاهيم والأفكار الرئيسية الموجودة في هذه الفقرة قبل البدء دراستها.
            </p>
          </div>

          {/* Bento Metadata Grid (4 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Expected Time */}
            <div className="bg-white p-5 rounded-2xl border border-[#e0c0b1]/30 flex items-center gap-4 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-[#ffdbca]/40 text-[#9d4300] flex items-center justify-center shrink-0">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#584237]/70">الزمن المتوقع:</p>
                <p className="text-lg font-extrabold text-[#0b1c30]">2 - 5 دقائق</p>
              </div>
            </div>

            {/* Info Units */}
            <div className="bg-white p-5 rounded-2xl border border-[#e0c0b1]/30 flex items-center gap-4 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-[#eff4ff] text-[#8127cf] flex items-center justify-center shrink-0">
                <Lightbulb className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#584237]/70">عدد المفاهيم:</p>
                <p className="text-lg font-extrabold text-[#0b1c30]">
                  {conceptCount} معلومات ومفاهيم
                </p>
              </div>
            </div>

            {/* Assessment Questions */}
            <div className="bg-white p-5 rounded-2xl border border-[#e0c0b1]/30 flex items-center gap-4 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-[#eff4ff] text-[#0b1c30] flex items-center justify-center shrink-0">
                <HelpCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#584237]/70">الأسئلة التقييمية:</p>
                <p className="text-lg font-extrabold text-[#0b1c30]">
                  {questionsCount} أسئلة في الفقرة
                </p>
              </div>
            </div>

            {/* Difficulty */}
            <div className="bg-white p-5 rounded-2xl border border-[#e0c0b1]/30 flex items-center justify-between shrink-0 shadow-2xs">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#eff4ff] text-[#584237] flex items-center justify-center shrink-0">
                  <BarChart2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#584237]/70">صعوبة الفقرة:</p>
                  <div className="flex gap-1.5 mt-1">
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] rounded-full font-bold">
                      فهم: سهل
                    </span>
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[11px] rounded-full font-bold">
                      حفظ: متوسط
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* "Zaytuna" Essence Section */}
          <div className="bg-[#ffdbca]/30 border-2 border-dashed border-[#ffdbca] p-6 sm:p-8 rounded-3xl space-y-3">
            <div className="flex items-center gap-2 text-[#9d4300]">
              <Sparkles className="h-5 w-5 fill-current" />
              <h3 className="text-base sm:text-lg font-extrabold">
                الزيتونة بالبلدي (الفكرة ببساطة شديدة):
              </h3>
            </div>
            <div className="bg-white/90 p-5 rounded-2xl border border-white shadow-xs">
              <p className="text-sm sm:text-base font-bold text-[#0b1c30] leading-relaxed">
                {essenceText}
              </p>
            </div>
          </div>

          {/* Main Start CTA */}
          <button
            type="button"
            onClick={onStartParagraph}
            className="w-full h-16 bg-[#9d4300] hover:bg-[#833800] text-white rounded-2xl font-extrabold text-lg transition-all shadow-lg shadow-[#9d4300]/20 flex items-center justify-center gap-3 cursor-pointer"
          >
            <span>ابدأ دراسة هذه الفقرة الآن</span>
            <ArrowRight className="h-5 w-5 rotate-180" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
