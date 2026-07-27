import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  Trash2,
  BookOpen,
  Settings,
  BarChart2,
  Share2,
  Brain,
  HelpCircle,
  FileText,
  Clock,
  PlayCircle,
  Pencil,
  FileJson,
} from "lucide-react";
import {getSubject, type Subject} from "@/lib/curriculum";
import {
  getLibrary,
  deleteFromLibrary,
  saveToLibrary,
  type SavedLesson,
} from "@/lib/lesson-library";
import { type Lesson } from "@/lib/lesson-data";
import { RestoreDialog } from "@/components/RestoreDialog";
import { SettingsDialog } from "@/components/SettingsDialog";

export const Route = createFileRoute("/subjects/$subjectId")({
  component: SubjectPage,
  notFoundComponent: () => (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-[#f8f9ff]">
      <div className="text-center p-8 bg-white rounded-3xl border border-[#e0c0b1]/40 shadow-sm max-w-md">
        <p className="text-lg font-bold text-[#0b1c30] mb-2">المادة غير موجودة</p>
        <p className="text-sm text-[#584237]/70 mb-6">
          قد تكون المادة حُذفت أو أن الرابط غير صحيح.
        </p>
        <button
          onClick={() => (window.location.href = "/subjects")}
          className="inline-flex items-center gap-2 bg-[#9d4300] text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-[#833800] transition"
        >
          ← العودة للمواد
        </button>
      </div>
    </div>
  ),
});

function SubjectPage() {
  const { subjectId } = Route.useParams();
  const [subject, setSubject] = useState<Subject | undefined>(undefined);
  const [library, setLibrary] = useState<SavedLesson[]>([]);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();

  const refresh = () => {
    setSubject(getSubject(subjectId));
    setLibrary(getLibrary());
  };

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [subjectId]);

  if (!subject) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-[#f8f9ff]">
        <div className="text-center p-8 bg-white rounded-3xl border border-[#e0c0b1]/40 shadow-sm max-w-md">
          <p className="text-lg font-bold text-[#0b1c30] mb-2">المادة غير موجودة</p>
          <p className="text-sm text-[#584237]/70 mb-6">
            قد تكون المادة حُذفت أو أن الرابط غير صحيح.
          </p>
          <button
            onClick={() => navigate({ to: "/subjects" })}
            className="inline-flex items-center gap-2 bg-[#9d4300] text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-[#833800] transition cursor-pointer"
          >
            ← العودة للمواد
          </button>
        </div>
      </div>
    );
  }

  // Handle restoring / importing lesson into this subject
  const handleLessonLoad = (lesson: Lesson) => {
    try {
      saveToLibrary(lesson, subjectId);
      refresh();
    } catch (err) {
      console.error("Failed to save lesson:", err);
    }
  };

  const handleStartLesson = (lesson: Lesson) => {
    try {
      localStorage.setItem("nafath.openLesson", JSON.stringify(lesson));
      navigate({ to: "/" });
    } catch (err) {
      console.error("Failed to open lesson:", err);
    }
  };

  // Find all lessons belonging to this subject
  const subjectLessons = library.filter((l) => l.subjectId === subjectId);
  const displayLessons = subjectLessons;

  return (
    <div
      dir="rtl"
      lang="ar"
      className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] antialiased flex flex-col items-center"
    >
      {/* Top Header Navigation Bar */}
      <header className="w-full h-20 bg-[#f8f9ff]/90 backdrop-blur-md fixed top-0 z-50 border-b border-[#e0c0b1]/30 flex justify-center">
        <nav className="flex justify-between items-center w-full max-w-[1280px] px-8 md:px-16 h-full">
          <div className="flex items-center gap-10">
            <div
              onClick={() => navigate({ to: "/" })}
              className="text-3xl font-extrabold text-[#9d4300] cursor-pointer tracking-tight"
            >
              نفاذ
            </div>
            <div className="hidden md:flex gap-8 items-center">
              <button
                onClick={() => navigate({ to: "/subjects" })}
                className="text-base font-bold text-[#9d4300] border-b-2 border-[#9d4300] pb-1 cursor-pointer"
              >
                المواد
              </button>
              <button
                onClick={() => navigate({ to: "/interactive-exams" })}
                className="text-base font-semibold text-[#584237] hover:text-[#9d4300] transition-colors cursor-pointer"
              >
                الاختبارات
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setSettingsOpen(true)}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-[#dce9ff] text-[#9d4300] hover:bg-[#d3e4fe] transition-colors cursor-pointer"
              title="الإعدادات"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </nav>
      </header>

      {/* Main Canvas */}
      <main className="w-full max-w-[1280px] px-8 md:px-16 pt-28 pb-24 flex-grow">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#584237]/80">
          <button
            onClick={() => navigate({ to: "/subjects" })}
            className="hover:text-[#9d4300] transition-colors flex items-center gap-1 cursor-pointer"
          >
            المواد
          </button>
          <ChevronRight className="w-4 h-4 rotate-180" />
          <span className="text-[#0b1c30]">{subject.name}</span>
        </div>

        {/* Subject Header Section */}
        <section className="mb-14 bg-white p-8 md:p-10 rounded-3xl border border-[#e0c0b1]/40 shadow-sm">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="w-32 h-32 rounded-3xl bg-[#ffdbca] flex items-center justify-center text-[#9d4300] shadow-sm shrink-0">
              <BookOpen className="w-14 h-14" />
            </div>
            <div className="flex-grow text-center md:text-right">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-extrabold text-[#0b1c30] mb-3">{subject.name}</h1>
                  <p className="text-base text-[#584237]/80 max-w-2xl leading-relaxed font-medium">
                    {subject.description ||
                      "دراسة الأحكام والمفاهيم الشاملة المستنبطة من أدلتها ومصادرها بمنهجية علمية ميسرة."}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6">
                <span className="px-4 py-1.5 rounded-full bg-[#9d4300]/10 text-[#9d4300] text-xs font-bold">
                  {displayLessons.length} درس مسجل
                </span>
                <span className="px-4 py-1.5 rounded-full bg-[#8127cf]/10 text-[#8127cf] text-xs font-bold">
                  JSON جاهز
                </span>
                <span className="px-4 py-1.5 rounded-full bg-[#eff4ff] text-[#584237] text-xs font-bold">
                  مستوى متقدم
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Action Bento Section (4 Main Tools for this Subject) */}
        <section className="mb-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <button
            onClick={() => navigate({ to: "/interactive-exams", search: { tab: "stats" } })}
            className="group p-7 bg-white border border-[#e0c0b1]/40 rounded-3xl text-right transition-all hover:shadow-lg hover:border-green-600 cursor-pointer flex flex-col justify-between"
          >
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 mb-5 transition-transform group-hover:scale-110">
              <BarChart2 className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-[#0b1c30] mb-1">الإحصائيات</h4>
              <p className="text-xs font-medium text-[#584237]/80">تتبع مستواك وتحليلات أدائك</p>
            </div>
          </button>

          <button
            onClick={() =>
              navigate({
                to: "/mind-map",
                search: { subjectId: subject.id, subjectName: subject.name },
              })
            }
            className="group p-7 bg-white border border-[#e0c0b1]/40 rounded-3xl text-right transition-all hover:shadow-lg hover:border-[#9d4300] cursor-pointer flex flex-col justify-between"
          >
            <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-[#9d4300] mb-5 transition-transform group-hover:scale-110">
              <Share2 className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-[#0b1c30] mb-1">الخرائط الذهنية</h4>
              <p className="text-xs font-medium text-[#584237]/80">تبسيط المفاهيم المعقدة بصرياً</p>
            </div>
          </button>

          <button
            onClick={() => navigate({ to: "/interactive-exams" })}
            className="group p-7 bg-white border border-[#e0c0b1]/40 rounded-3xl text-right transition-all hover:shadow-lg hover:border-[#8127cf] cursor-pointer flex flex-col justify-between"
          >
            <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-[#8127cf] mb-5 transition-transform group-hover:scale-110">
              <HelpCircle className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-[#0b1c30] mb-1">بنك الأسئلة</h4>
              <p className="text-xs font-medium text-[#584237]/80">
                اختبارات شاملة وتدريبات تفاعلية
              </p>
            </div>
          </button>

          <button
            onClick={() => {
              sessionStorage.setItem("nafath.spacedRepetition.filterSubjectId", subject.id);
              sessionStorage.setItem("nafath.spacedRepetition.filterSubjectName", subject.name);
              navigate({ to: "/spaced-repetition" });
            }}
            className="group p-7 bg-white border border-[#e0c0b1]/40 rounded-3xl text-right transition-all hover:shadow-lg hover:border-[#5c5f61] cursor-pointer flex flex-col justify-between"
          >
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-[#5c5f61] mb-5 transition-transform group-hover:scale-110">
              <Brain className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-[#0b1c30] mb-1">التكرار المتباعد</h4>
              <p className="text-xs font-medium text-[#584237]/80">
                تثبيت المعلومات عبر البطاقات الذكية
              </p>
            </div>
          </button>
        </section>

        {/* Lessons List Section (Replaced Units with Direct JSON Lessons) */}
        <section className="mb-20">
          <div className="flex justify-between items-center mb-8 border-b border-[#e0c0b1]/30 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-[#0b1c30]">خطة التعلم والدروس</h2>
              <p className="text-xs text-[#584237]/80 mt-1">
                الدروس المستردة بكود JSON المخصصة لهذه المادة
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setRestoreOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9d4300] bg-[#9d4300]/10 hover:bg-[#9d4300]/20 px-4 py-2 rounded-full transition-colors cursor-pointer"
              >
                <FileJson className="w-4 h-4" />
                استرداد درس
              </button>
              <button
                onClick={() =>
                  navigate({ to: "/subject-stages/$subjectId", params: { subjectId } })
                }
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9d4300] bg-[#ffdbca] hover:bg-[#e0c0b1] px-4 py-2 rounded-full transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                تعديل المراحل
              </button>
            </div>
          </div>

          {displayLessons.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 rounded-3xl border-2 border-dashed border-[#e0c0b1]/60 bg-white/70 text-center">
              <FileJson className="w-12 h-12 text-[#9d4300]/50 mb-3" />
              <p className="text-lg font-bold text-[#0b1c30]">
                لا توجد دروس محملة في مادة {subject.name}
              </p>
              <p className="text-sm text-[#584237]/80 mt-1">
                اضغط على زر تعديل المراحل لإدارة إعدادات المادة
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayLessons.map((saved) => (
                <div
                  key={saved.id}
                  className="group relative flex items-center justify-between p-6 bg-white border border-[#e0c0b1]/40 rounded-3xl shadow-sm hover:shadow-md hover:border-[#9d4300]/40 transition-all"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-[#eff4ff] text-[#9d4300] flex items-center justify-center shrink-0">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#0b1c30] mb-1">{saved.title}</h3>
                      <div className="flex items-center gap-4 text-xs font-semibold text-[#584237]/80">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          درس تفاعلي
                        </span>
                        <span className="bg-[#eff4ff] px-2.5 py-0.5 rounded-full text-[#9d4300]">
                          JSON مخصص
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleStartLesson(saved.data)}
                      className="inline-flex items-center gap-2 bg-[#9d4300] text-white px-6 py-2.5 rounded-full text-xs font-bold hover:bg-[#833800] transition cursor-pointer shadow"
                    >
                      <PlayCircle className="w-4 h-4" />
                      متابعة الآن
                    </button>
                    <button
                      onClick={() => {
                        try {
                          localStorage.setItem("teacher.lesson.draft", JSON.stringify(saved.data));
                          navigate({ to: "/teacher" });
                        } catch (err) {
                          console.error("Failed to save draft:", err);
                        }
                      }}
                      className="p-2 text-[#584237]/70 hover:text-[#9d4300] rounded-xl hover:bg-black/5 transition cursor-pointer"
                      title="تعديل في وضع المعلم"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`هل أنت تأكد من حذف درس "${saved.title}"؟`)) {
                          deleteFromLibrary(saved.id);
                          refresh();
                        }
                      }}
                      className="p-2 text-[#584237]/70 hover:text-red-600 rounded-xl hover:bg-black/5 transition cursor-pointer"
                      title="حذف الدرس"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <RestoreDialog open={restoreOpen} onOpenChange={setRestoreOpen} onLoad={handleLessonLoad} />

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
