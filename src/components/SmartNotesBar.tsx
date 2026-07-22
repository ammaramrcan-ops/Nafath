import { useState, useEffect } from "react";
import { BookMarked, Plus, Send, X } from "lucide-react";
import { getLessonNotes, saveSmartNote, type SmartNote } from "@/lib/smart-notes";
import { SmartNotesModal } from "@/components/SmartNotesModal";
import { toast } from "sonner";

export function SmartNotesBar({ lessonTitle }: { lessonTitle: string }) {
  const [notes, setNotes] = useState<SmartNote[]>([]);
  const [isOpenQuickNote, setIsOpenQuickNote] = useState(false);
  const [quickInput, setQuickInput] = useState("");
  const [showFullNotebookModal, setShowFullNotebookModal] = useState(false);

  const refreshNotes = () => {
    if (lessonTitle) {
      setNotes(getLessonNotes(lessonTitle));
    }
  };

  useEffect(() => {
    refreshNotes();
  }, [lessonTitle]);

  const handleQuickSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickInput.trim()) return;

    saveSmartNote({
      lessonTitle,
      note: quickInput.trim(),
    });

    setQuickInput("");
    setIsOpenQuickNote(false);
    refreshNotes();
    toast.success("تم تدوين الملاحظة في كراسة الدرس 📓✨");
  };

  if (!lessonTitle) return null;

  return (
    <>
      {/* Sleek Floating Circular Icon Badge anchored at bottom-right */}
      <div className="fixed bottom-6 right-6 z-40 dir-rtl text-right" dir="rtl">
        {/* Quick Popover Form when expanded */}
        {isOpenQuickNote && (
          <div className="mb-3 w-72 sm:w-80 rounded-3xl bg-slate-900/95 text-white p-4 shadow-2xl backdrop-blur-md border border-slate-700 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <BookMarked className="h-4 w-4" />
                تدوين ملاحظة سريعة في الكراسة
              </span>
              <button
                type="button"
                onClick={() => setIsOpenQuickNote(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleQuickSave} className="space-y-2">
              <textarea
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder="اكتب ملاحظتك الذهبية هنا..."
                rows={2}
                className="w-full rounded-2xl bg-slate-800 p-3 text-xs text-white placeholder:text-slate-400 outline-none border border-slate-700 focus:border-amber-400 resize-none"
              />
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpenQuickNote(false);
                    setShowFullNotebookModal(true);
                  }}
                  className="text-[11px] font-bold text-amber-300 hover:underline cursor-pointer"
                >
                  فتح الكراسة الكاملة ({notes.length})
                </button>
                <button
                  type="submit"
                  disabled={!quickInput.trim()}
                  className="flex items-center gap-1 rounded-full bg-amber-500 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition disabled:opacity-30 cursor-pointer shadow-xs"
                >
                  <Send className="h-3 w-3" />
                  <span>حفظ</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Main Floating Trigger Button */}
        <div className="flex items-center gap-2">
          {/* Direct Notebook Modal Trigger */}
          <button
            type="button"
            onClick={() => setShowFullNotebookModal(true)}
            className="group relative flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 to-amber-500 text-slate-950 shadow-xl hover:scale-105 transition duration-200 cursor-pointer border-2 border-white/20"
            title="كراسة ملاحظاتي الذهبية"
          >
            <BookMarked className="h-6 w-6 text-slate-950 group-hover:rotate-12 transition duration-200" />
            {notes.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5.5 w-5.5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-black text-amber-400 border-2 border-amber-500 shadow-md">
                {notes.length}
              </span>
            )}
          </button>

          {/* Quick Note Add Button */}
          <button
            type="button"
            onClick={() => setIsOpenQuickNote(!isOpenQuickNote)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/90 text-amber-400 shadow-lg border border-slate-700 hover:bg-slate-800 transition cursor-pointer"
            title="إضافة ملاحظة سريعة"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Full Notebook Modal */}
      <SmartNotesModal
        isOpen={showFullNotebookModal}
        onClose={() => {
          setShowFullNotebookModal(false);
          refreshNotes();
        }}
        lessonTitle={lessonTitle}
      />
    </>
  );
}
