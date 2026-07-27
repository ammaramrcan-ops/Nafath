import { useState, useEffect } from "react";
import {motion} from "framer-motion";
import {X, Pencil, Plus, Trash2, Check} from "lucide-react";
import type { ExamQuestion, ExamQuestionType } from "@/lib/interactive-exams-service";
import { toast } from "sonner";

export function EditQuestionModal({
  isOpen,
  onClose,
  questionToEdit,
  onSaveQuestion,
  onDeleteQuestion,
}: {
  isOpen: boolean;
  onClose: () => void;
  questionToEdit: ExamQuestion | null;
  onSaveQuestion: (question: ExamQuestion) => void;
  onDeleteQuestion?: (questionId: string) => void;
}) {
  const [type, setType] = useState<ExamQuestionType>("mcq");
  const [questionText, setQuestionText] = useState("");
  const [modelAnswer, setModelAnswer] = useState("");
  const [topicLabel, setTopicLabel] = useState("");
  const [topicTag, setTopicTag] = useState("");
  const [explanationBaladi, setExplanationBaladi] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);

  useEffect(() => {
    if (questionToEdit) {
      setType(questionToEdit.type || "mcq");
      setQuestionText(questionToEdit.question || "");
      setModelAnswer(questionToEdit.model_answer || "");
      setTopicLabel(questionToEdit.topic_label || "");
      setTopicTag(questionToEdit.topic_tag || "");
      setExplanationBaladi(questionToEdit.explanation_baladi || "");
      setOptions(
        questionToEdit.options && questionToEdit.options.length > 0
          ? [...questionToEdit.options]
          : ["", "", "", ""],
      );
    } else {
      setType("mcq");
      setQuestionText("");
      setModelAnswer("");
      setTopicLabel("فقه الخُلع والطلاق");
      setTopicTag("#فقه_الخلع");
      setExplanationBaladi("");
      setOptions(["", "", "", ""]);
    }
  }, [questionToEdit, isOpen]);

  if (!isOpen) return null;

  const handleOptionChange = (index: number, value: string) => {
    const newOpts = [...options];
    newOpts[index] = value;
    setOptions(newOpts);
  };

  const handleAddOption = () => {
    setOptions([...options, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      toast.error("يجب أن يحتوي السؤال على خيارين على الأقل.");
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      toast.error("يرجى كتابة نص السؤال أولاً.");
      return;
    }
    if (!modelAnswer.trim()) {
      toast.error("يرجى إدخال الإجابة النموذجية.");
      return;
    }

    const filteredOptions =
      type === "mcq" ? options.map((o) => o.trim()).filter(Boolean) : undefined;

    if (type === "mcq" && (!filteredOptions || filteredOptions.length < 2)) {
      toast.error("يرجى إدخال خيارين على الأقل لسؤال الاختيارات.");
      return;
    }

    const newQuestion: ExamQuestion = {
      id: questionToEdit?.id || "q_" + Date.now() + "_" + crypto.randomUUID().slice(0, 8),
      type,
      question: questionText.trim(),
      options: filteredOptions,
      model_answer: modelAnswer.trim(),
      topic_label: topicLabel.trim() || "عام",
      topic_tag: topicTag.trim() || "#عام",
      explanation_baladi: explanationBaladi.trim() || undefined,
    };

    onSaveQuestion(newQuestion);
    toast.success(questionToEdit ? "تم تحديث السؤال بنجاح! 📝" : "تم إضافة السؤال بنجاح! 🚀");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs dir-rtl text-right font-body-md"
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#e0c0b1]/60 space-y-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e0c0b1]/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ffdbca] flex items-center justify-center text-[#9d4300]">
              <Pencil className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#0b1c30]">
                {questionToEdit ? "تعديل السؤال الحالي" : "إضافة سؤال جديد لبنك الأسئلة"}
              </h3>
              <p className="text-xs font-semibold text-[#584237]/70">
                حدد نمط السؤال والنص والإجابة النموذجية
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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Question Type Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#0b1c30]">نمط السؤال:</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "mcq", label: "⚡ اختيار من متعدد" },
                { id: "fill", label: "✏️ أكمل الفراغ" },
                { id: "essay", label: "✍️ سؤال مقالي / علّل" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setType(item.id as ExamQuestionType)}
                  className={`p-3 rounded-2xl text-xs font-bold transition border text-center cursor-pointer ${
                    type === item.id
                      ? "bg-[#9d4300] text-white border-[#9d4300] shadow-xs"
                      : "bg-[#f8f9ff] border-[#e0c0b1]/40 text-[#0b1c30] hover:bg-[#eff4ff]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#0b1c30]">نص السؤال:</label>
            <textarea
              rows={3}
              placeholder="اكتب نص السؤال الفقهي أو العلمي هنا..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full rounded-2xl border border-[#e0c0b1]/40 p-3.5 text-xs font-bold text-[#0b1c30] focus:border-[#9d4300] focus:outline-none transition bg-white"
            />
          </div>

          {/* MCQ Options */}
          {type === "mcq" && (
            <div className="space-y-3 p-4 rounded-2xl bg-[#eff4ff] border border-[#e0c0b1]/40">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-[#0b1c30]">خيارات السؤال:</label>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-xs font-bold text-[#9d4300] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>إضافة خيار آخر</span>
                </button>
              </div>

              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-white border border-[#e0c0b1]/40 flex items-center justify-center text-xs font-bold text-[#9d4300] shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    placeholder={`الخيار ${idx + 1}...`}
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    className="flex-grow rounded-xl border border-[#e0c0b1]/40 bg-white px-3.5 py-2 text-xs font-semibold text-[#0b1c30] focus:border-[#9d4300] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                    title="حذف الخيار"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Model Answer */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#0b1c30]">
              الإجابة النموذجية الصحيحة:
            </label>
            <textarea
              rows={2}
              placeholder="الإجابة الصحيحة أو الخيار المطابق..."
              value={modelAnswer}
              onChange={(e) => setModelAnswer(e.target.value)}
              className="w-full rounded-2xl border border-[#e0c0b1]/40 p-3.5 text-xs font-semibold text-[#0b1c30] focus:border-[#9d4300] focus:outline-none transition bg-white"
            />
          </div>

          {/* Topic & Baladi Explanation Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#0b1c30]">عنوان الموضوع/الدرس:</label>
              <input
                type="text"
                placeholder="مثال: فقه الخُلع"
                value={topicLabel}
                onChange={(e) => setTopicLabel(e.target.value)}
                className="w-full rounded-xl border border-[#e0c0b1]/40 bg-white px-3.5 py-2 text-xs font-semibold text-[#0b1c30] focus:border-[#9d4300] focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#0b1c30]">التاج التوضيحي:</label>
              <input
                type="text"
                placeholder="مثال: #الخلع"
                value={topicTag}
                onChange={(e) => setTopicTag(e.target.value)}
                className="w-full rounded-xl border border-[#e0c0b1]/40 bg-white px-3.5 py-2 text-xs font-semibold text-[#0b1c30] focus:border-[#9d4300] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#0b1c30]">
              الشرح البلدي الميسر (اختياري):
            </label>
            <input
              type="text"
              placeholder="شرح بسيط وميسر للإصلاح عند الخطأ..."
              value={explanationBaladi}
              onChange={(e) => setExplanationBaladi(e.target.value)}
              className="w-full rounded-xl border border-[#e0c0b1]/40 bg-white px-3.5 py-2 text-xs font-semibold text-[#0b1c30] focus:border-[#9d4300] focus:outline-none"
            />
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[#e0c0b1]/30">
            {questionToEdit && onDeleteQuestion ? (
              <button
                type="button"
                onClick={() => {
                  onDeleteQuestion(questionToEdit.id);
                  toast.success("تم حذف السؤال من البنك.");
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                <span>حذف السؤال</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-[#e0c0b1] text-[#584237] hover:bg-[#eff4ff] text-xs font-bold transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#9d4300] text-white hover:bg-[#833800] text-xs font-extrabold shadow-md transition cursor-pointer flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                <span>{questionToEdit ? "حفظ التعديلات" : "إضافة السؤال للبنك"}</span>
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
