import { useState, useEffect } from "react";
import { BookMarked, Trash2, Plus, Sparkles, X, FileText, Trash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getLessonNotes, saveSmartNote, deleteSmartNote, clearAllLessonNotes, type SmartNote } from "@/lib/smart-notes";
import { toast } from "sonner";

export function SmartNotesModal({
  isOpen,
  onClose,
  lessonTitle,
  initialQuestionText,
  initialBlockTitle,
}: {
  isOpen: boolean;
  onClose: () => void;
  lessonTitle: string;
  initialQuestionText?: string;
  initialBlockTitle?: string;
}) {
  const [notes, setNotes] = useState<SmartNote[]>([]);
  const [noteText, setNoteText] = useState("");
  const [showAddForm, setShowAddForm] = useState(Boolean(initialQuestionText || initialBlockTitle));

  useEffect(() => {
    if (isOpen && lessonTitle) {
      setNotes(getLessonNotes(lessonTitle));
    }
  }, [isOpen, lessonTitle]);

  const handleAddNote = () => {
    if (!noteText.trim()) {
      toast.error("يرجى كتابة الملاحظة أولاً!");
      return;
    }

    saveSmartNote({
      lessonTitle,
      blockTitle: initialBlockTitle,
      questionText: initialQuestionText,
      note: noteText.trim(),
    });

    setNotes(getLessonNotes(lessonTitle));
    setNoteText("");
    setShowAddForm(false);
    toast.success("تم حفظ الملاحظة في كراسة الدرس بنجاح! 📓✨");
  };

  const handleDelete = (id: string) => {
    const updated = deleteSmartNote(lessonTitle, id);
    setNotes(updated);
    toast.info("تم حذف الملاحظة");
  };

  const handleClearAll = () => {
    const updated = clearAllLessonNotes(lessonTitle);
    setNotes(updated);
    toast.info("تم مسح كافة ملاحظات هذا الدرس 🗑️");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent dir="rtl" className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-[1.5rem] p-6 text-right dir-rtl shadow-2xl">
        <DialogHeader className="border-b border-zen-surface-container/60 pb-4 text-right">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-950 font-bold text-lg">
              <BookMarked className="h-5 w-5 text-amber-600" />
              <DialogTitle>كراسة ملاحظاتي الذهبية — لدرس: {lessonTitle}</DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-xs text-zen-on-surface-variant pt-1">
            مساحتك الخاصة لتدوين الملاحظات والروابط الفكرية أثناء الدراسة للرجوع إليها قبل الامتحان.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Quick Add Note Form */}
          {showAddForm ? (
            <div className="rounded-2xl bg-amber-50/90 p-5 border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  تسجيل ملاحظة جديدة لهذه الجزئية
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="p-1 hover:bg-amber-200/60 rounded-full transition"
                >
                  <X className="h-4 w-4 text-amber-900" />
                </button>
              </div>

              {initialQuestionText && (
                <p className="text-[11px] font-bold text-amber-900 bg-white/80 p-2.5 rounded-xl border border-amber-200">
                  📌 السؤال: {initialQuestionText}
                </p>
              )}

              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="اكتب ملاحظتك هنا (مثال: النقطة دي تلخبطت فيها بين مهر المثل والعوض المجهول)..."
                rows={3}
                className="w-full resize-none rounded-xl bg-white p-3 text-xs font-bold text-zen-on-surface outline-none border border-amber-300 focus:ring-2 focus:ring-amber-500"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleAddNote}
                  className="rounded-full bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-700 transition shadow-xs cursor-pointer"
                >
                  حفظ في كراسة الدرس 💾
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-4 py-2 text-xs font-bold text-amber-950 border border-amber-300 hover:bg-amber-200 transition cursor-pointer shadow-xs"
              >
                <Plus className="h-4 w-4 text-amber-700" />
                إضافة ملاحظة كراسة جديدة 📝
              </button>
            </div>
          )}

          {/* Notes List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zen-on-surface-variant flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-amber-600" />
                الملاحظات المسجلة في هذا الدرس ({notes.length}):
              </h4>
              {notes.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>مسح كراسة الملاحظات بالكامل 🗑️</span>
                </button>
              )}
            </div>

            {notes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zen-surface-container bg-zen-surface-low p-8 text-center space-y-2">
                <p className="text-xs font-bold text-zen-on-surface">لا توجد ملاحظات مسجلة في كراسة هذا الدرس بعد!</p>
                <p className="text-[11px] text-zen-on-surface-variant">
                  اضغط على زر [ملاحظتي 📝] أسفل أي سؤال أو فقرة لتدوين الملاحظات الهامة.
                </p>
              </div>
            ) : (
              notes.map((n) => (
                <div
                  key={n.id}
                  className="rounded-2xl bg-white p-4 border border-zen-surface-container shadow-xs space-y-2 relative text-right"
                >
                  <div className="flex items-center justify-between border-b border-zen-surface-container/40 pb-2">
                    <span className="text-[11px] font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      {n.blockTitle || "ملاحظة عامة بالدرس"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(n.id)}
                      className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-full transition cursor-pointer"
                      title="حذف الملاحظة"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {n.questionText && (
                    <p className="text-[11px] font-semibold text-zen-on-surface-variant bg-zen-surface-low p-2 rounded-lg">
                      السؤال: {n.questionText}
                    </p>
                  )}

                  <p className="text-xs font-bold text-zen-on-surface leading-relaxed">
                    💡 {n.note}
                  </p>

                  <span className="block text-[10px] text-zen-on-surface-variant text-left pt-1">
                    {new Date(n.createdAt).toLocaleDateString("ar-EG", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
