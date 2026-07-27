import { useState, useEffect } from "react";
import { X, Trash2, AlertCircle, Calendar, BookOpen, CheckCircle2 } from "lucide-react";
import { getMistakes, clearMistakes, removeMistake, type MistakeRecord } from "@/lib/mistakes";

export function MistakesLogModal({
  isOpen,
  onClose,
  subjectId,
}: {
  isOpen: boolean;
  onClose: () => void;
  subjectId?: string;
}) {
  const [list, setList] = useState<MistakeRecord[]>([]);

  useEffect(() => {
    if (isOpen) {
      setList(getMistakes(subjectId));
    }
  }, [isOpen, subjectId]);

  if (!isOpen) return null;

  const handleClearAll = () => {
    clearMistakes();
    setList([]);
  };

  const handleRemoveOne = (id: string) => {
    removeMistake(id);
    setList(getMistakes());
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-3xl bg-zen-surface p-6 shadow-2xl overflow-hidden border border-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zen-surface-container pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zen-on-surface">سجل الأخطاء والتحديات</h2>
              <p className="text-xs text-zen-on-surface-variant">
                مراجعة الأخطاء السابقة لتثبيت الفهم
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-zen-surface-low text-zen-on-surface-variant hover:bg-zen-surface-container transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <p className="text-base font-semibold text-zen-on-surface">
                السجل تم تصحيحه بالكامل!
              </p>
              <p className="text-xs text-zen-on-surface-variant mt-1">
                لا توجد أخطاء مسجلة حالياً. استمر في التفوق.
              </p>
            </div>
          ) : (
            list.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-2xl border border-white bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <button
                  onClick={() => handleRemoveOne(item.id)}
                  className="absolute left-4 top-4 text-zen-on-surface-variant/40 hover:text-red-500 transition"
                  title="حذف هذا الخطأ"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-2 text-xs font-medium text-zen-primary mb-2">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>{item.lessonTitle || "درس بدون عنوان"}</span>
                  <span className="text-zen-on-surface-variant/40">•</span>
                  <span className="inline-flex items-center gap-1 text-zen-on-surface-variant/60">
                    <Calendar className="h-3 w-3" />
                    {new Date(item.timestamp).toLocaleDateString("ar-EG")}
                  </span>
                </div>

                <p className="text-sm font-semibold text-zen-on-surface mb-3">{item.question}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-red-50 p-3 text-red-800 border border-red-100">
                    <span className="block font-medium mb-0.5 text-red-600">إجابتك السابقة:</span>
                    <p className="font-semibold">{item.userAnswer || "لا توجد إجابة"}</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3 text-emerald-800 border border-emerald-100">
                    <span className="block font-medium mb-0.5 text-emerald-600">
                      الإجابة الصحيحة:
                    </span>
                    <p className="font-semibold">{item.correctAnswer}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {list.length > 0 && (
          <div className="flex items-center justify-between border-t border-zen-surface-container pt-4">
            <span className="text-xs text-zen-on-surface-variant">
              إجمالي الأخطاء: <strong className="text-zen-on-surface">{list.length}</strong>
            </span>
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-100 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              مسح السجل بالكامل
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
