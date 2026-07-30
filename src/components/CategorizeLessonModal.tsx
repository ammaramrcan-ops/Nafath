import { useState, useEffect } from "react";
import {motion} from "framer-motion";
import {X, Tag, Check} from "lucide-react";
import { getCurriculum, type Subject } from "@/lib/curriculum";
import { updateLessonSubject, getLibrary, type SavedLesson } from "@/lib/lesson-library";
import { toast } from "sonner";

export function CategorizeLessonModal({
  isOpen,
  onClose,
  lesson,
  onUpdated,
}: {
  isOpen: boolean;
  onClose: () => void;
  lesson: SavedLesson | null;
  onUpdated: () => void;
}) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [library, setLibrary] = useState<SavedLesson[]>([]);

  useEffect(() => {
    if (isOpen) {
      const c = getCurriculum();
      setSubjects(c.subjects || []);
      setSelectedSubjectId(lesson?.subjectId || "");
      setLibrary(getLibrary());
    }
  }, [isOpen, lesson]);

  if (!isOpen || !lesson) return null;

  const handleSave = () => {
    if (!selectedSubjectId) {
      toast.error("يرجى اختيار مادة لتصنيف الدرس إليها.");
      return;
    }

    updateLessonSubject(lesson.id, selectedSubjectId);
    const subName = subjects.find((s) => s.id === selectedSubjectId)?.name || "المادة المختارة";
    toast.success(`تم تصنيف "${lesson.title}" ضمن ${subName} بنجاح! 🏷️🎉`);
    onUpdated();
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
        className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#e0c0b1]/60 space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e0c0b1]/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ffdbca] flex items-center justify-center text-[#9d4300]">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#0b1c30]">تصنيف الدرس ضمن مادة</h3>
              <p className="text-xs font-semibold text-[#584237]/70">
                ربط الدرس "{lesson.title}" بمادة محددة في المنهج
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

        {/* Content */}
        <div className="space-y-4">
          <span className="block text-xs font-bold text-[#0b1c30]">اختر المادة الدراسية:</span>

          {subjects.length === 0 ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 text-center">
              لا توجد مواد مسجلة حالياً في المنهج. يمكنك إضافة مواد من صفحة "المواد".
            </div>
          ) : (
            <div className="space-y-2.5">
              {subjects.map((sub) => {
                const isSelected = selectedSubjectId === sub.id;
                const lessonCount = library.filter((l) => l.subjectId === sub.id).length;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedSubjectId(sub.id)}
                    className={`w-full p-4 rounded-2xl text-right flex items-center justify-between border transition cursor-pointer ${
                      isSelected
                        ? "bg-[#fffaf7] border-[#f97316] text-[#0b1c30] shadow-xs"
                        : "bg-[#f8f9ff] border-[#e0c0b1]/40 text-[#584237] hover:bg-[#eff4ff]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{sub.emoji || "📚"}</span>
                      <div>
                        <h4 className="font-extrabold text-sm text-[#0b1c30]">{sub.name}</h4>
                        <p className="text-[11px] font-semibold text-[#584237]/70">
                          {lessonCount} {lessonCount === 1 ? "درس" : "دروس"}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-[#f97316] text-white flex items-center justify-center">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e0c0b1]/30">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-[#e0c0b1] text-[#584237] hover:bg-[#eff4ff] text-xs font-bold transition cursor-pointer"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!selectedSubjectId}
            className="px-6 py-2.5 rounded-xl bg-[#9d4300] text-white hover:bg-[#833800] text-xs font-extrabold shadow-md disabled:opacity-50 transition cursor-pointer flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            <span>حفظ التصنيف</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
