import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Search,
  Plus,
  BookOpen,
  Trash2,
  FlaskConical,
  Feather,
  PlayCircle,
  Settings,
  X,
} from "lucide-react";
import {
  getCurriculum,
  addSubject,
  deleteSubject,
  type Subject,
} from "@/lib/curriculum";
import { getLibrary, type SavedLesson } from "@/lib/lesson-library";
import { getAssignedLessonIds } from "@/lib/curriculum";
import { SettingsDialog } from "@/components/SettingsDialog";

export const Route = createFileRoute("/subjects/")({
  component: SubjectsPage,
  head: () => ({
    meta: [
      { title: "المواد التعليمية — نفاذ" },
      { name: "description", content: "استكشف المواد التعليمية واختَر مسارك التنافسي والتكيفي." },
    ],
  }),
});

export function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [library, setLibrary] = useState<SavedLesson[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();

  const refresh = () => {
    setSubjects(getCurriculum().subjects);
    setLibrary(getLibrary());
  };

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const assigned = getAssignedLessonIds();
  const uncategorized = library.filter((l) => !l.subjectId);

  // Realtime Search Filter
  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group by category
  const shariaSubjects = filteredSubjects.filter(
    (s) => s.category === "شرعية" || ["الفقه", "التوحيد", "الحديث", "التفسير"].includes(s.name)
  );
  const scienceSubjects = filteredSubjects.filter(
    (s) => s.category === "علمية" || ["الأحياء", "الفيزياء", "الكيمياء"].includes(s.name)
  );
  const arabicSubjects = filteredSubjects.filter(
    (s) => s.category === "عربية" || ["النحو", "الأدب"].includes(s.name)
  );

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] antialiased flex flex-col items-center">
      {/* Top Navigation Bar */}
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
            {/* Realtime Search Input */}
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-[#8c7164]" />
              <input
                type="text"
                placeholder="بحث عن مادة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#eff4ff] border border-[#e0c0b1]/30 rounded-full py-2.5 pr-11 pl-4 w-64 focus:outline-none focus:ring-2 focus:ring-[#9d4300] text-sm font-medium transition-all"
              />
            </div>

            <button
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 bg-[#9d4300] text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-[#833800] transition-all cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              مادة جديدة
            </button>

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

      {/* Main Container (Full Width Max 1280px) */}
      <main className="w-full max-w-[1280px] px-8 md:px-16 pt-28 pb-24 flex-grow">
        {/* Header Section */}
        <header className="mb-12 text-right">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b border-[#e0c0b1]/30 pb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-[#0b1c30] mb-3 tracking-tight">
                استكشف المواد التعليمية
              </h1>
              <p className="text-base md:text-lg text-[#584237]/80 font-medium leading-relaxed max-w-3xl">
                اختر مسارك التعليمي وانطلق في رحلة معرفية متكاملة مصممة لتعزيز قدراتك وتركيزك.
              </p>
            </div>
            <button
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 bg-[#9d4300] text-white px-6 py-3 rounded-full text-base font-bold hover:bg-[#833800] transition-all cursor-pointer shadow-md self-start sm:self-center"
            >
              <Plus className="w-5 h-5" />
              إضافة مادة جديدة
            </button>
          </div>
        </header>

        {/* Subjects Grid by Categories (Enlarged Cards) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Column 1: Islamic Sciences */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center gap-3 mb-2 px-1">
              <div className="w-12 h-12 rounded-2xl bg-[#ffdbca] flex items-center justify-center text-[#9d4300] shadow-sm">
                <BookOpen className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-[#0b1c30]">المواد الشرعية</h2>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {shariaSubjects.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-[#e0c0b1]/60 rounded-2xl bg-white/50">
                  <p className="text-sm font-medium text-[#584237]/60">لا توجد مواد مطابقة</p>
                </div>
              ) : (
                shariaSubjects.map((sub) => {
                  const lessonsCount = library.filter((l) => l.subjectId === sub.id).length;
                  return (
                    <div
                      key={sub.id}
                      onClick={() => navigate({ to: "/subjects/$subjectId", params: { subjectId: sub.id } })}
                      className="group relative bg-white p-7 rounded-2xl border border-[#e0c0b1]/40 hover:border-[#9d4300]/50 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[190px]"
                    >
                      <div className="flex justify-between items-start mb-5">
                        <span className="p-3 rounded-2xl bg-[#eff4ff] text-[#9d4300] group-hover:scale-110 transition-transform">
                          <BookOpen className="w-7 h-7" />
                        </span>
                        <div className="flex items-center gap-2">
                          {lessonsCount > 0 && (
                            <span className="bg-[#9d4300]/10 text-[#9d4300] px-3 py-1 rounded-full text-xs font-bold">
                              نشط
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`هل أنت تأكد من حذف مادة "${sub.name}"؟`)) {
                                deleteSubject(sub.id);
                                refresh();
                              }
                            }}
                            className="p-2 text-[#584237]/60 hover:text-red-600 rounded-xl hover:bg-black/5 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="حذف المادة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-[#0b1c30] mb-2">{sub.name}</h3>
                      <p className="text-sm text-[#584237]/80 mb-5 line-clamp-2 leading-relaxed font-medium">
                        {sub.description || "دراسة ومراجعة المفاهيم والدروس الأساسية."}
                      </p>
                      <div className="flex items-center gap-2 text-[#584237] text-xs font-bold">
                        <PlayCircle className="w-4 h-4 text-[#9d4300]" />
                        <span>{lessonsCount > 0 ? `${lessonsCount} درساً` : "جامع الدروس"}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Column 2: Natural Sciences */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center gap-3 mb-2 px-1">
              <div className="w-12 h-12 rounded-2xl bg-[#f0dbff] flex items-center justify-center text-[#8127cf] shadow-sm">
                <FlaskConical className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-[#0b1c30]">المواد العلمية</h2>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {scienceSubjects.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-[#e0c0b1]/60 rounded-2xl bg-white/50">
                  <p className="text-sm font-medium text-[#584237]/60">لا توجد مواد مطابقة</p>
                </div>
              ) : (
                scienceSubjects.map((sub) => {
                  const lessonsCount = library.filter((l) => l.subjectId === sub.id).length;
                  return (
                    <div
                      key={sub.id}
                      onClick={() => navigate({ to: "/subjects/$subjectId", params: { subjectId: sub.id } })}
                      className="group relative bg-white p-7 rounded-2xl border border-[#e0c0b1]/40 hover:border-[#8127cf]/50 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[190px]"
                    >
                      <div className="flex justify-between items-start mb-5">
                        <span className="p-3 rounded-2xl bg-[#f0dbff]/60 text-[#8127cf] group-hover:scale-110 transition-transform">
                          <FlaskConical className="w-7 h-7" />
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`هل أنت تأكد من حذف مادة "${sub.name}"؟`)) {
                              deleteSubject(sub.id);
                              refresh();
                            }
                          }}
                          className="p-2 text-[#584237]/60 hover:text-red-600 rounded-xl hover:bg-black/5 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="حذف المادة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h3 className="text-2xl font-bold text-[#0b1c30] mb-2">{sub.name}</h3>
                      <p className="text-sm text-[#584237]/80 mb-5 line-clamp-2 leading-relaxed font-medium">
                        {sub.description || "دراسة ومراجعة المفاهيم والدروس الأساسية."}
                      </p>
                      <div className="flex items-center gap-2 text-[#584237] text-xs font-bold">
                        <PlayCircle className="w-4 h-4 text-[#8127cf]" />
                        <span>{lessonsCount > 0 ? `${lessonsCount} درساً` : "جامع الدروس"}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Column 3: Arabic Language & Other */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center gap-3 mb-2 px-1">
              <div className="w-12 h-12 rounded-2xl bg-[#e0e3e5] flex items-center justify-center text-[#5c5f61] shadow-sm">
                <Feather className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-[#0b1c30]">المواد العربية</h2>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {arabicSubjects.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-[#e0c0b1]/60 rounded-2xl bg-white/50">
                  <p className="text-sm font-medium text-[#584237]/60">لا توجد مواد مطابقة</p>
                </div>
              ) : (
                arabicSubjects.map((sub) => {
                  const lessonsCount = library.filter((l) => l.subjectId === sub.id).length;
                  return (
                    <div
                      key={sub.id}
                      onClick={() => navigate({ to: "/subjects/$subjectId", params: { subjectId: sub.id } })}
                      className="group relative bg-white p-7 rounded-2xl border border-[#e0c0b1]/40 hover:border-[#5c5f61]/50 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[190px]"
                    >
                      <div className="flex justify-between items-start mb-5">
                        <span className="p-3 rounded-2xl bg-[#e0e3e5]/60 text-[#5c5f61] group-hover:scale-110 transition-transform">
                          <Feather className="w-7 h-7" />
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`هل أنت تأكد من حذف مادة "${sub.name}"؟`)) {
                              deleteSubject(sub.id);
                              refresh();
                            }
                          }}
                          className="p-2 text-[#584237]/60 hover:text-red-600 rounded-xl hover:bg-black/5 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="حذف المادة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h3 className="text-2xl font-bold text-[#0b1c30] mb-2">{sub.name}</h3>
                      <p className="text-sm text-[#584237]/80 mb-5 line-clamp-2 leading-relaxed font-medium">
                        {sub.description || "دراسة ومراجعة المفاهيم والدروس الأساسية."}
                      </p>
                      <div className="flex items-center gap-2 text-[#584237] text-xs font-bold">
                        <PlayCircle className="w-4 h-4 text-[#5c5f61]" />
                        <span>{lessonsCount > 0 ? `${lessonsCount} درساً` : "جامع الدروس"}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* Uncategorized Lessons Section if any */}
        {uncategorized.length > 0 && (
          <section className="mt-16 pt-8 border-t border-[#e0c0b1]/30">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#0b1c30]">دروس غير تصنيفية</h2>
              <span className="text-xs font-bold text-[#584237] bg-[#eff4ff] px-3 py-1 rounded-full">
                {uncategorized.length} درس
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {uncategorized.map((l) => (
                <div
                  key={l.id}
                  className="rounded-2xl border border-dashed border-[#e0c0b1]/60 bg-white/80 p-5 shadow-sm"
                >
                  <span className="mb-2 inline-block rounded-full bg-[#eff4ff] px-3 py-1 text-xs font-bold text-[#9d4300]">
                    درس
                  </span>
                  <h4 className="text-base font-bold text-[#0b1c30] line-clamp-2">{l.title}</h4>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* Add Subject Dialog */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#0b1c30]">مادة جديدة</h3>
              <button
                onClick={() => setAddOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">اسم المادة</label>
                <input
                  type="text"
                  id="subject-name"
                  placeholder="مثال: الرياضيات، الفيزياء..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#9d4300] focus:ring-2 focus:ring-[#9d4300]/20 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">التصنيف</label>
                <select
                  id="subject-category"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#9d4300] focus:ring-2 focus:ring-[#9d4300]/20 outline-none transition bg-white"
                >
                  <option value="شرعية">شرعية</option>
                  <option value="عربية">عربية</option>
                  <option value="علمية">علمية</option>
                </select>
              </div>

              <button
                onClick={() => {
                  const nameInput = document.getElementById("subject-name") as HTMLInputElement;
                  const categorySelect = document.getElementById("subject-category") as HTMLSelectElement;
                  
                  const name = nameInput?.value?.trim();
                  const category = categorySelect?.value as "شرعية" | "عربية" | "علمية";

                  if (name) {
                    addSubject(name, category);
                    setAddOpen(false);
                    refresh();
                  }
                }}
                className="w-full bg-[#9d4300] text-white py-3 rounded-xl font-bold hover:bg-[#833800] transition cursor-pointer"
              >
                إضافة المادة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
