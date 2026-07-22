import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Star,
  Edit3,
  AlertCircle,
  Zap,
  ChevronLeft,
  Play,
  BookOpen,
  TrendingUp,
  BarChart2,
  Brain,
} from "lucide-react";
import { getStoredMistakes } from "@/lib/interactive-exams-service";
import { getStoredLessonNotes } from "@/lib/interactive-exams-service";
import { getStoredSmartCards } from "@/lib/spaced-repetition";
import { getLibrary } from "@/lib/lesson-library";

export function StatisticsView() {
  const navigate = useNavigate();

  const mistakes = useMemo(() => {
    try { return getStoredMistakes(); } catch { return []; }
  }, []);

  const notes = useMemo(() => {
    try { return getStoredLessonNotes(); } catch { return []; }
  }, []);

  const flashcardStats = useMemo(() => {
    try {
      const cards = getStoredSmartCards();
      const total = cards.length;
      const reviewed = cards.filter((c) => c.stats?.lastReviewDate && c.stats.lastReviewDate > 0).length;
      return { reviewed, total, percent: total > 0 ? Math.round((reviewed / total) * 100) : 0 };
    } catch { return { reviewed: 0, total: 0, percent: 0 }; }
  }, []);

  const library = useMemo(() => getLibrary(), []);

  return (
    <div
      className="w-full max-w-[1100px] mx-auto px-4 py-8 space-y-12 dir-rtl text-right font-body-md"
      dir="rtl"
    >
      {/* ── Header ── */}
      <section className="space-y-3 text-right">
        <div>
          <span className="px-4 py-1.5 rounded-full bg-[#ffdbca]/40 text-[#9d4300] font-extrabold text-xs">
            تحليل الأداء
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0b1c30] flex items-center gap-3">
          <BarChart2 className="h-8 w-8 text-[#9d4300]" />
          إحصائيات التعلم
        </h1>
        <p className="text-base text-[#584237]/80 max-w-2xl leading-relaxed">
          نظرة شاملة ومبسطة على تقدمك الأكاديمي. نحن نستخدم الذكاء الاصطناعي لتحليل نقاط قوتك وتحديد المجالات التي تحتاج إلى تركيز.
        </p>
      </section>

      {/* ── 4 Bento Cards ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Mastery Rate */}
        <div className="bg-white border border-[#e0c0b1]/40 p-7 rounded-[2rem] shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#ffdbca]/30 flex items-center justify-center text-[#9d4300]">
              <Star className="h-6 w-6 fill-[#9d4300]" />
            </div>
            <span className="text-[#9d4300] font-extrabold text-xs bg-[#ffdbca]/30 px-2.5 py-1 rounded-full">+2.5%</span>
          </div>
          <div>
            <p className="text-xs font-bold text-[#584237]/80 mb-1">معدل الإتقان</p>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-[#0b1c30]">78%</h3>
          </div>
        </div>

        {/* Total Notes */}
        <div className="bg-white border border-[#e0c0b1]/40 p-7 rounded-[2rem] shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-[#8127cf]">
              <Edit3 className="h-6 w-6" />
            </div>
            <span className="text-[#8127cf] font-extrabold text-xs bg-purple-100 px-2.5 py-1 rounded-full">منوع</span>
          </div>
          <div>
            <p className="text-xs font-bold text-[#584237]/80 mb-1">إجمالي الملاحظات</p>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-[#0b1c30]">{notes.length || 0}</h3>
          </div>
        </div>

        {/* Pending Errors */}
        <div className="bg-white border border-[#e0c0b1]/40 p-7 rounded-[2rem] shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-[#ba1a1a]">
              <AlertCircle className="h-6 w-6" />
            </div>
            <span className="text-[#ba1a1a] font-extrabold text-xs bg-rose-100 px-2.5 py-1 rounded-full">عاجل</span>
          </div>
          <div>
            <p className="text-xs font-bold text-[#584237]/80 mb-1">أخطاء معلقة</p>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-[#0b1c30]">{mistakes.length}</h3>
          </div>
        </div>

        {/* Average Speed */}
        <div className="bg-white border border-[#e0c0b1]/40 p-7 rounded-[2rem] shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#eff4ff] flex items-center justify-center">
              <Zap className="h-6 w-6 fill-current text-[#9d4300]" />
            </div>
            <span className="text-[#584237] font-extrabold text-xs bg-[#eff4ff] px-2.5 py-1 rounded-full">-1s</span>
          </div>
          <div>
            <p className="text-xs font-bold text-[#584237]/80 mb-1">متوسط السرعة</p>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-[#0b1c30]">12ث</h3>
          </div>
        </div>
      </section>

      {/* ── Quick Links ── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => navigate({ to: "/interactive-exams", search: { tab: "mistakes" } })}
          className="bg-rose-50 border border-rose-200/60 p-5 rounded-[2rem] flex items-center gap-4 hover:bg-rose-100 transition cursor-pointer text-right"
        >
          <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5 text-rose-600" />
          </div>
          <div>
            <p className="font-extrabold text-[#0b1c30] text-sm">بنك الأخطاء</p>
            <p className="text-xs text-[#584237]/70 mt-0.5">{mistakes.length} خطأ معلق</p>
          </div>
          <ChevronLeft className="h-4 w-4 text-[#584237]/50 mr-auto" />
        </button>

        <button
          type="button"
          onClick={() => navigate({ to: "/interactive-exams", search: { tab: "notebook" } })}
          className="bg-purple-50 border border-purple-200/60 p-5 rounded-[2rem] flex items-center gap-4 hover:bg-purple-100 transition cursor-pointer text-right"
        >
          <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0">
            <Edit3 className="h-5 w-5 text-[#8127cf]" />
          </div>
          <div>
            <p className="font-extrabold text-[#0b1c30] text-sm">دفتر الملاحظات</p>
            <p className="text-xs text-[#584237]/70 mt-0.5">{notes.length} ملاحظة</p>
          </div>
          <ChevronLeft className="h-4 w-4 text-[#584237]/50 mr-auto" />
        </button>

        <button
          type="button"
          onClick={() => navigate({ to: "/curriculum-tracker" })}
          className="bg-[#eff4ff] border border-[#e0c0b1]/40 p-5 rounded-[2rem] flex items-center gap-4 hover:bg-[#dce9ff] transition cursor-pointer text-right"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#9d4300]/10 flex items-center justify-center shrink-0">
            <BookOpen className="h-5 w-5 text-[#9d4300]" />
          </div>
          <div>
            <p className="font-extrabold text-[#0b1c30] text-sm">تتبع المنهج</p>
            <p className="text-xs text-[#584237]/70 mt-0.5">{library.length} درس محفوظ</p>
          </div>
          <ChevronLeft className="h-4 w-4 text-[#584237]/50 mr-auto" />
        </button>
      </section>

      {/* ── Lesson Progress ── */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-[#0b1c30]">تقدم الدروس الحالية 📚</h2>
          <button
            type="button"
            onClick={() => navigate({ to: "/subjects" })}
            className="text-[#9d4300] font-extrabold text-xs flex items-center gap-1.5 hover:opacity-80 transition cursor-pointer"
          >
            <span>عرض الكل</span>
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5">
          {library.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-[2.5rem] border border-[#e0c0b1]/40">
              <BookOpen className="h-12 w-12 text-[#9d4300]/30 mx-auto mb-3" />
              <p className="text-base font-bold text-[#0b1c30]">لا توجد دروس محفوظة بعد</p>
              <p className="text-xs text-[#584237]/60 mt-1">استرد درساً من الصفحة الرئيسية لعرض تقدمك هنا</p>
            </div>
          ) : (
            library.slice(0, 3).map((saved, idx) => {
              const colors = ["#9d4300", "#8127cf", "#0b6e4f"];
              const color = colors[idx % colors.length];
              const percent = idx === 0 ? 96 : idx === 1 ? 45 : 70;
              const status = idx === 0 ? "تقريباً انتهى ✅" : idx === 1 ? "قيد المراجعة ⏳" : "جاري التعلم 📖";
              return (
                <div
                  key={saved.id}
                  className="bg-[#eff4ff] p-6 sm:p-8 rounded-[2.5rem] border border-[#e0c0b1]/30 hover:bg-white transition-all shadow-xs"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                          <path
                            className="text-[#d3e4fe]"
                            strokeDasharray="100, 100"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            strokeDasharray={`${percent}, 100`}
                            strokeLinecap="round"
                            strokeWidth="3.5"
                            stroke={color}
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <span className="absolute font-extrabold text-sm text-[#0b1c30]">{percent}%</span>
                      </div>
                      <div>
                        <h4 className="text-xl font-extrabold text-[#0b1c30] mb-1">{saved.title}</h4>
                        <p className="text-xs font-semibold text-[#584237]/80">{saved.blocks} كتلة تعليمية</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-4 py-2 rounded-full bg-white text-[#584237] text-xs font-extrabold border border-[#e0c0b1]/30">
                        {status}
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate({ to: "/" })}
                        className="w-12 h-12 rounded-full text-white flex items-center justify-center hover:scale-105 transition-transform cursor-pointer shadow-md"
                        style={{ backgroundColor: color }}
                        title="متابعة الدراسة"
                      >
                        <Play className="h-5 w-5 fill-current mr-0.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ── Weekly Trend ── */}
      <section className="bg-white border border-[#e0c0b1]/40 p-8 rounded-[2.5rem] shadow-xs space-y-8">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-[#9d4300]" />
          <h2 className="text-xl font-extrabold text-[#0b1c30]">اتجاه التعلم الأسبوعي 📈</h2>
        </div>
        <div className="h-48 w-full flex items-end gap-3 sm:gap-6 justify-between px-2">
          {[
            { day: "أحد",  height: "60%", color: "bg-[#eff4ff]"   },
            { day: "اث",   height: "40%", color: "bg-[#eff4ff]"   },
            { day: "ثلاث", height: "85%", color: "bg-[#ffdbca]"   },
            { day: "أرب",  height: "55%", color: "bg-[#eff4ff]"   },
            { day: "خمس",  height: "75%", color: "bg-[#eff4ff]"   },
            { day: "جمع",  height: "90%", color: "bg-purple-200"  },
            { day: "سبت",  height: "35%", color: "bg-[#eff4ff]"   },
          ].map((bar, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-3 group cursor-pointer">
              <div
                className={`w-full ${bar.color} rounded-t-full transition-all duration-500 hover:opacity-80 group-hover:scale-y-105`}
                style={{ height: bar.height }}
              />
              <span className="text-xs font-extrabold text-[#584237]/70">{bar.day}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
