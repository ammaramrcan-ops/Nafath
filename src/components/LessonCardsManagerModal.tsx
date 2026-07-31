import { useState } from "react";
import { motion } from "framer-motion";
import { X, Pencil, Plus, Trash2, BookOpen, ChevronRight, Layers } from "lucide-react";
import { CATEGORY_INFO, type SmartFlashcard } from "@/lib/spaced-repetition";
import { toast } from "sonner";

export function LessonCardsManagerModal({
  isOpen,
  onClose,
  lessonTitle,
  lessonCards,
  onAddNewCard,
  onEditCard,
  onDeleteCard,
}: {
  isOpen: boolean;
  onClose: () => void;
  lessonTitle: string;
  lessonCards: SmartFlashcard[];
  onAddNewCard: () => void;
  onEditCard: (card: SmartFlashcard) => void;
  onDeleteCard: (cardId: string) => void;
}) {
  const [viewMode, setViewMode] = useState<"menu" | "list">("menu");

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs dir-rtl text-right font-body-md"
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#e0c0b1]/60 space-y-6 max-h-[88vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e0c0b1]/30 pb-4">
          <div className="flex items-center gap-3">
            {viewMode === "list" && (
              <button
                type="button"
                onClick={() => setViewMode("menu")}
                className="p-1.5 rounded-full bg-[#eff4ff] text-[#9d4300] hover:bg-[#dce9ff] transition cursor-pointer"
                title="رجوع للقائمة"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
            <div className="w-10 h-10 rounded-2xl bg-[#ffdbca] flex items-center justify-center text-[#9d4300]">
              <Pencil className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#0b1c30] leading-tight">
                إدارة بطاقات: {lessonTitle}
              </h3>
              <p className="text-xs font-semibold text-[#584237]/70">
                اختر إضافة بطاقة جديدة أو تعديل البطاقات الحالية
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#584237]/60 hover:bg-black/5 hover:text-[#0b1c30] transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Menu View */}
        {viewMode === "menu" && (
          <div className="space-y-4 py-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onAddNewCard();
              }}
              className="w-full p-5 rounded-2xl bg-amber-50 border-2 border-amber-200 hover:border-amber-500 transition text-right flex items-center justify-between cursor-pointer group shadow-xs"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-black text-xl group-hover:scale-110 transition">
                  <Plus className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-[#0b1c30] text-base">
                    إضافة بطاقة جديدة لهذا الدرس ➕
                  </h4>
                  <p className="text-xs font-semibold text-[#584237]/70">
                    إنشاء سؤال استرجاعي وإجابة نموذجية مخصصة
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-amber-700 rotate-180" />
            </button>

            <button
              type="button"
              onClick={() => setViewMode("list")}
              className="w-full p-5 rounded-2xl bg-[#eff4ff] border-2 border-[#dce9ff] hover:border-[#9d4300] transition text-right flex items-center justify-between cursor-pointer group shadow-xs"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#9d4300] text-white flex items-center justify-center font-black text-xl group-hover:scale-110 transition">
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-[#0b1c30] text-base">
                    تعديل البطاقات الحالية ({lessonCards.length}) 📝
                  </h4>
                  <p className="text-xs font-semibold text-[#584237]/70">
                    استعراض وتعديل أو حذف أي بطاقة مسجلة حالياً
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-[#9d4300] rotate-180" />
            </button>
          </div>
        )}

        {/* Existing Cards List View */}
        {viewMode === "list" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#0b1c30]">
                البطاقات الحالية لمادة {lessonTitle} ({lessonCards.length}):
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAddNewCard();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold shadow-xs hover:bg-amber-700 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>إضافة بطاقة جديدة</span>
              </button>
            </div>

            {lessonCards.length === 0 ? (
              <div className="text-center py-8 bg-[#f8f9ff] rounded-2xl border border-[#e0c0b1]/40 space-y-2">
                <BookOpen className="h-8 w-8 text-[#584237]/50 mx-auto" />
                <p className="text-xs font-bold text-[#584237]">
                  لا توجد بطاقات مسجلة حالياً لهذا الدرس.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {lessonCards.map((card, idx) => {
                  const catInfo = CATEGORY_INFO[card.category] || CATEGORY_INFO.summary;
                  return (
                    <div
                      key={card.id || idx}
                      className="p-4 rounded-2xl bg-[#f8f9ff] border border-[#e0c0b1]/50 space-y-2 relative group hover:border-[#9d4300]/40 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${catInfo.badgeBg} ${catInfo.badgeText}`}
                          >
                            {catInfo.label}
                          </span>
                          <h4 className="font-extrabold text-[#0b1c30] text-xs leading-snug">
                            {card.question}
                          </h4>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onEditCard(card);
                            }}
                            className="p-1.5 rounded-xl text-[#9d4300] hover:bg-amber-100 transition cursor-pointer"
                            title="تعديل"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onDeleteCard(card.id);
                              toast.success("تم حذف البطاقة بنجاح.");
                            }}
                            className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] font-semibold text-[#584237]/80 line-clamp-2">
                        الإجابة: {card.model_answer}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
