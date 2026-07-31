import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Pencil, Save, Trash2 } from "lucide-react";
import { type FlashcardCategory, type SmartFlashcard } from "@/lib/spaced-repetition";
import { toast } from "sonner";
import { generateSecureId } from "@/lib/utils";

export function EditFlashcardModal({
  isOpen,
  onClose,
  cardToEdit,
  onSaveCard,
  onDeleteCard,
}: {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly cardToEdit?: SmartFlashcard | null;
  readonly onSaveCard: (updated: SmartFlashcard) => void;
  readonly onDeleteCard?: (cardId: string) => void;
}) {
  const isNew = !cardToEdit;

  const [category, setCategory] = useState<FlashcardCategory>("reasoning");
  const [question, setQuestion] = useState("");
  const [modelAnswer, setModelAnswer] = useState("");
  const [keywordsText, setKeywordsText] = useState("");
  const [mnemonic, setMnemonic] = useState("");
  const [keywordCues, setKeywordCues] = useState("");
  const [explanationBaladi, setExplanationBaladi] = useState("");

  useEffect(() => {
    if (cardToEdit) {
      setCategory(cardToEdit.category || "reasoning");
      setQuestion(cardToEdit.question || "");
      setModelAnswer(cardToEdit.model_answer || "");
      setKeywordsText(cardToEdit.keywords ? cardToEdit.keywords.join(" | ") : "");
      setMnemonic(cardToEdit.hint?.mnemonic || "");
      setKeywordCues(cardToEdit.hint?.keyword_cues || "");
      setExplanationBaladi(cardToEdit.explanation_baladi || "");
    } else {
      setCategory("reasoning");
      setQuestion("");
      setModelAnswer("");
      setKeywordsText("");
      setMnemonic("");
      setKeywordCues("");
      setExplanationBaladi("");
    }
  }, [cardToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!question.trim() || !modelAnswer.trim()) {
      toast.error("يرجى إدخال نص السؤال والإجابة النموذجية.");
      return;
    }

    const keywords = keywordsText
      .split(/[|،,]/)
      .map((k) => k.trim())
      .filter(Boolean);

    const updatedCard: SmartFlashcard = {
      id: cardToEdit?.id || generateSecureId("custom_fc"),
      category,
      question: question.trim(),
      model_answer: modelAnswer.trim(),
      keywords,
      hint: {
        mnemonic: mnemonic.trim() || undefined,
        keyword_cues: keywordCues.trim() || undefined,
      },
      explanation_baladi: explanationBaladi.trim() || undefined,
      stats: cardToEdit?.stats || {
        interval: 1,
        repetition: 0,
        easeFactor: 2.5,
        nextReviewDate: Date.now(),
      },
    };

    onSaveCard(updatedCard);
    toast.success(isNew ? "تمت إضافة الكارت الجديد بنجاح! 🎉" : "تم حفظ تعديلات الكارت بنجاح! 💾");
    onClose();
  };

  const handleDelete = () => {
    if (cardToEdit && onDeleteCard) {
      onDeleteCard(cardToEdit.id);
      toast.success("تم حذف الكارت بنجاح. 🗑️");
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs dir-rtl text-right"
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5 text-slate-900 font-black text-lg">
            <Pencil className="h-6 w-6 text-amber-600" />
            <span>
              {isNew ? "إضافة كارت فلاش كارد جديد ➕" : "تعديل بيانات كارت الفلاش كارد ✏️"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Category Selector */}
          <div className="space-y-1.5">
            <label htmlFor="fc-category-select" className="text-xs font-black text-slate-800">
              تصنيف نوع الكارت:
            </label>
            <select
              id="fc-category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value as FlashcardCategory)}
              className="w-full h-11 rounded-2xl bg-slate-50 px-4 text-xs font-bold text-slate-900 border border-slate-300 outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="reasoning">❓ العلل والأسباب (علّل)</option>
              <option value="rulings">⚖️ الأحكام والضوابط</option>
              <option value="evidence">📜 الأدلة الشرعية والنصوص</option>
              <option value="definition">🏷️ التعريفات والمصطلحات</option>
              <option value="issue">✍️ المسائل والفتاوى</option>
              <option value="summary">💡 الخلاصة والزيتونة</option>
            </select>
          </div>

          {/* Question Textarea */}
          <div className="space-y-1.5">
            <label htmlFor="fc-question-input" className="text-xs font-black text-slate-800">
              نص السؤال الاسترجاعي 📌:
            </label>
            <textarea
              id="fc-question-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={2}
              placeholder="مثال: علل: وقوع طلاق السكران المتعدي بسكره؟"
              className="w-full rounded-2xl border border-slate-300 p-3 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Model Answer Textarea */}
          <div className="space-y-1.5">
            <label htmlFor="fc-model-answer-input" className="text-xs font-black text-slate-800">
              الإجابة النموذجية الصحيحة 💡:
            </label>
            <textarea
              id="fc-model-answer-input"
              value={modelAnswer}
              onChange={(e) => setModelAnswer(e.target.value)}
              rows={3}
              placeholder="مثال: يقع طلاقه تغليظاً عليه عقوبة له على معصية الشرب."
              className="w-full rounded-2xl border border-slate-300 p-3 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Keywords (separated by |) */}
          <div className="space-y-1.5">
            <label htmlFor="fc-keywords-input" className="text-xs font-black text-slate-800">
              الكلمات المفتاحية للتدقيق (مفصولة بـ |):
            </label>
            <input
              id="fc-keywords-input"
              type="text"
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              placeholder="مثال: تغليظاً | عقوبة | معصية"
              className="w-full h-11 rounded-2xl border border-slate-300 px-4 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Mnemonic & Keyword Cues */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="fc-mnemonic-input" className="text-xs font-bold text-slate-700">
                🧠 الرابط الذهني للتلميح (Mnemonic):
              </label>
              <input
                id="fc-mnemonic-input"
                type="text"
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                placeholder="السكران بيلبس طلاقه عقوبة..."
                className="w-full h-10 rounded-xl border border-slate-300 px-3 text-xs font-semibold text-slate-900 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="fc-cues-input" className="text-xs font-bold text-slate-700">
                🔑 إشارات الكلمات (Keyword Cues):
              </label>
              <input
                id="fc-cues-input"
                type="text"
                value={keywordCues}
                onChange={(e) => setKeywordCues(e.target.value)}
                placeholder="تـ... / عـ... / مـ..."
                className="w-full h-10 rounded-xl border border-slate-300 px-3 text-xs font-semibold text-slate-900 outline-none"
              />
            </div>
          </div>

          {/* Baladi Explanation for Problem Solving */}
          <div className="space-y-1.5">
            <label htmlFor="fc-explanation-input" className="text-xs font-bold text-slate-700">
              💡 تفكيك اللخبطة بالبلدي (لحالات المغالطة):
            </label>
            <input
              id="fc-explanation-input"
              type="text"
              value={explanationBaladi}
              onChange={(e) => setExplanationBaladi(e.target.value)}
              placeholder="شرح مبسط بسطرين لتوضيح السبب عند الخطأ..."
              className="w-full h-10 rounded-xl border border-slate-300 px-3 text-xs font-semibold text-slate-900 outline-none"
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {!isNew && onDeleteCard && (
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span>حذف الكارت</span>
            </button>
          )}

          <div className="mr-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-amber-700 transition cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{isNew ? "إضافة الكارت" : "حفظ التعديلات"}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
