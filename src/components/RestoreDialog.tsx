import { useRef, useState, useEffect } from "react";
import { Upload, X, FileJson, ScrollText, Leaf, BookOpen, Sparkles, ChevronLeft, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { defaultLesson, khulLesson, parseLessonJson, type Lesson } from "@/lib/lesson-data";
import { saveToLibrary } from "@/lib/lesson-library";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getCurriculum } from "@/lib/curriculum";

type Mode = "choice" | "json" | "subject_selection";

export function RestoreDialog({
  open,
  onOpenChange,
  onLoad,
  subjectId,
}: {
  readonly open: boolean;
  readonly onOpenChange: (v: boolean) => void;
  readonly onLoad: (lesson: Lesson) => void;
  readonly subjectId?: string;
}) {
  const [mode, setMode] = useState<Mode>("choice");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setMode("choice");
    setText("");
    setError(null);
  };

  const close = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const tryLoad = (raw: string) => {
    try {
      const lesson = parseLessonJson(raw);
      saveToLibrary(lesson);
      setError(null);
      onLoad(lesson);
      close(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "صيغة JSON غير صالحة");
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => tryLoad(String(reader.result));
    reader.readAsText(file);
  };

  useEffect(() => {
    if (subjectId && open) {
      setMode("choice");
    }
  }, [subjectId, open]);

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        dir="rtl"
        className="max-w-4xl w-[94vw] gap-0 overflow-hidden rounded-[2.5rem] border border-[#e0c0b1]/40 bg-[#f8f9ff] p-0 shadow-2xl text-[#0b1c30]"
      >
        <DialogTitle className="sr-only">استرداد درس — نفاذ</DialogTitle>

        {/* Top Dialog Navigation Header */}
        <header className="w-full h-20 px-8 flex items-center justify-between bg-white border-b border-[#e0c0b1]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ffdbca] text-[#9d4300] flex items-center justify-center font-black">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#0b1c30]">استرداد درس — نفاذ</h2>
              <p className="text-xs text-[#584237]/70 font-semibold">اختر طريقة بدء الدرس أو اختر أحد القوالب الافتراضية</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-2xl font-black text-[#9d4300] tracking-tight">نفاذ</span>
            <button type="button"
              onClick={() => close(false)}
              className="rounded-full p-2.5 text-[#584237] transition hover:bg-slate-100 cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="p-8 sm:p-10 space-y-8 max-h-[82vh] overflow-y-auto">
          {mode === "choice" && (
            <div className="space-y-8">
              {/* Primary Action Hero Card: 7-Step Import Wizard */}
              <section className="bg-white p-8 rounded-3xl border-2 border-[#e0c0b1]/40 hover:border-[#9d4300] transition-all duration-300 shadow-sm hover:shadow-xl group">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-right">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-[#ffdbca] text-[#9d4300] flex items-center justify-center group-hover:scale-110 transition-transform shrink-0 shadow-xs">
                      <Upload className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-extrabold text-[#0b1c30] group-hover:text-[#9d4300] transition-colors">
                        استيراد كود JSON عبر 7 خطوات متتابعة 🚀
                      </h3>
                      <p className="text-sm font-semibold text-[#584237]/80">
                        انتقل فوراً لنظام استيراد القصة والخريطة الذهنية والألغاز والأسئلة التكيفية لإنشاء الدرس
                      </p>
                    </div>
                  </div>

                  <button type="button"
                    onClick={() => {
                      close(false);
                      const targetSubj = subjectId ? `&subject=${subjectId}` : "";
                      window.location.href = `/teacher?import=true${targetSubj}`;
                    }}
                    className="w-full md:w-auto bg-[#9d4300] hover:bg-[#7e3500] text-white px-9 py-4 rounded-full font-extrabold text-base transition-all shadow-lg hover:shadow-primary/30 active:scale-95 cursor-pointer shrink-0 flex items-center justify-center gap-2"
                  >
                    <span>ابدأ الاستيراد الآن</span>
                    <ArrowRight className="h-5 w-5 rotate-180" />
                  </button>
                </div>
              </section>

              {/* Secondary Actions: Preset Templates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Preset Template 1: Fiqh Al-Khul' */}
                <button type="button"
                  onClick={() => {
                    onLoad(khulLesson);
                    close(false);
                  }}
                  className="bg-white/80 backdrop-blur p-6 rounded-2xl border border-amber-200 hover:border-amber-500 transition-all flex items-center justify-between group cursor-pointer text-right shadow-xs hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                      <ScrollText className="h-6 w-6 text-amber-800" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-[#0b1c30] text-base group-hover:text-amber-900 transition-colors">قالب فقه الخُلع 📜</h4>
                      <p className="text-xs font-semibold text-[#584237]/70">محتوى شرعي كامل وجاهز</p>
                    </div>
                  </div>
                  <ChevronLeft className="h-5 w-5 text-amber-300 group-hover:text-amber-700 group-hover:-translate-x-1 transition-transform" />
                </button>

                {/* Preset Template 2: Photosynthesis */}
                <button type="button"
                  onClick={() => {
                    onLoad(defaultLesson);
                    close(false);
                  }}
                  className="bg-white/80 backdrop-blur p-6 rounded-2xl border border-teal-200 hover:border-teal-500 transition-all flex items-center justify-between group cursor-pointer text-right shadow-xs hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-900 flex items-center justify-center shrink-0">
                      <Leaf className="h-6 w-6 text-teal-800" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-[#0b1c30] text-base group-hover:text-teal-900 transition-colors">قالب البناء الضوئي 🌿</h4>
                      <p className="text-xs font-semibold text-[#584237]/70">نموذج تعليمي علمي شامل</p>
                    </div>
                  </div>
                  <ChevronLeft className="h-5 w-5 text-teal-300 group-hover:text-teal-700 group-hover:-translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {mode === "subject_selection" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#e0c0b1]/30 pb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-[#0b1c30]">اختر المادة الإثرائية 📚</h3>
                  <p className="text-xs font-semibold text-[#584237]/70">سيتم تطبيق مسارات وقواعد هذه المادة على الدرس المستورد</p>
                </div>
                <button type="button"
                  onClick={() => setMode("choice")}
                  className="text-xs font-extrabold text-[#584237] hover:text-[#9d4300] transition cursor-pointer"
                >
                  ← العودة للخيارات
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {getCurriculum().subjects.map((subj) => (
                  <button type="button"
                    key={subj.id}
                    onClick={() => {
                      close(false);
                      window.location.href = `/teacher?import=true&subject=${subj.id}`;
                    }}
                    className="flex items-center justify-between p-5 rounded-2xl bg-white border-2 border-[#e0c0b1]/40 hover:border-[#9d4300] transition-all group text-right cursor-pointer shadow-xs hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#ffdbca]/60 text-[#9d4300] flex items-center justify-center font-bold">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[#0b1c30] text-base group-hover:text-[#9d4300] transition-colors">{subj.name}</h4>
                        <span className="text-xs font-semibold text-[#584237]/70">{subj.category || "عامة"}</span>
                      </div>
                    </div>
                    <ChevronLeft className="h-5 w-5 text-[#e0c0b1] group-hover:text-[#9d4300] group-hover:-translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "json" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#e0c0b1]/30 pb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-[#0b1c30]">رفع كود JSON مباشر</h3>
                  <p className="text-xs font-semibold text-[#584237]/70">الصق محتوى الدرس كاملاً بصيغة JSON أو اختر ملفاً من جهازك</p>
                </div>
                <button type="button"
                  onClick={() => setMode("choice")}
                  className="text-xs font-extrabold text-[#584237] hover:text-[#9d4300] transition cursor-pointer"
                >
                  ← العودة للخيارات
                </button>
              </div>

              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="الصق محتوى الدرس بصيغة JSON هنا..."
                rows={10}
                dir="ltr"
                className="rounded-2xl border-2 border-[#e0c0b1]/40 bg-white font-mono text-sm leading-relaxed text-[#0b1c30] shadow-inner focus-visible:ring-[#9d4300] focus-visible:border-[#9d4300]"
              />
              {error && <p className="text-center text-sm font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">{error}</p>}

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button type="button"
                  onClick={() => text.trim() && tryLoad(text)}
                  disabled={!text.trim()}
                  className={cn(
                    "inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#9d4300] hover:bg-[#7e3500] px-8 py-4 text-sm font-extrabold text-white transition shadow-md",
                    "disabled:opacity-40 cursor-pointer",
                  )}
                >
                  <FileJson className="h-5 w-5" />
                  <span>تحميل واعتماد الدرس من النص</span>
                </button>
                <button type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-[#e0c0b1] bg-white hover:bg-slate-50 px-8 py-4 text-sm font-extrabold text-[#0b1c30] transition cursor-pointer"
                >
                  <Upload className="h-5 w-5 text-[#9d4300]" />
                  <span>اختيار ملف JSON من الجهاز</span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

