import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { InteractiveExamsView } from "@/components/InteractiveExamsView";

interface ExamSearch {
  tab?: string;
}

export const Route = createFileRoute("/interactive-exams")({
  validateSearch: (search: Record<string, unknown>): ExamSearch => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  component: InteractiveExamsPage,
  head: () => ({
    meta: [
      { title: "نظام الاختبارات التفاعلي والتحليلات — نفاذ" },
      {
        name: "description",
        content: "اختبارات تفاعلية بـ 3 أنماط أسئلة مع تحليل الأخطاء ومؤشرات التقدم والملاحظات.",
      },
    ],
  }),
});

function InteractiveExamsPage() {
  const search = useSearch({ from: "/interactive-exams" });
  const { tab } = search;
  const navigate = useNavigate();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      navigate({ to: "/subjects" });
    }
  };

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] antialiased">
      {/* Top Header Navigation */}
      <header className="fixed inset-x-0 top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#e0c0b1]/30">
        <div className="relative mx-auto flex w-full max-w-[1000px] items-center justify-between px-6 py-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 bg-[#eff4ff] text-[#9d4300] hover:bg-[#dce9ff] transition cursor-pointer font-bold text-xs shadow-xs"
            aria-label="رجوع"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
            <span>رجوع</span>
          </button>
          <div className="text-base font-extrabold text-[#0b1c30]">
            نظام الاختبارات وإحصائيات التعلم
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="pt-20 pb-20">
        <InteractiveExamsView
          initialTab={
            tab === "stats"
              ? "stats"
              : tab === "mistakes"
                ? "mistakes"
                : tab === "notebook"
                  ? "notebook"
                  : tab === "ingest"
                    ? "ingest"
                    : "exam"
          }
        />
      </main>
    </div>
  );
}
