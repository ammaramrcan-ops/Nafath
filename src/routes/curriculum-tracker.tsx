import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronRight, BookOpen } from "lucide-react";
import { CurriculumTrackerView } from "@/components/CurriculumTrackerView";

export const Route = createFileRoute("/curriculum-tracker")({
  component: CurriculumTrackerPage,
  head: () => ({
    meta: [
      { title: "تتبع المنهج — نفاذ" },
      { name: "description", content: "تتبع تقدمك في جميع المواد وعدد الدروس المنجزة." },
    ],
  }),
});

function CurriculumTrackerPage() {
  const navigate = useNavigate();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      navigate({ to: "/" });
    }
  };

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] antialiased">
      <header className="fixed inset-x-0 top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#e0c0b1]/30">
        <div className="relative mx-auto flex w-full max-w-[1000px] items-center justify-between px-6 py-4">
          <button type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 bg-[#eff4ff] text-[#9d4300] hover:bg-[#dce9ff] transition cursor-pointer font-bold text-xs shadow-xs"
            aria-label="رجوع"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
            <span>رجوع</span>
          </button>
          <div className="flex items-center gap-2 text-base font-extrabold text-[#0b1c30]">
            <BookOpen className="h-5 w-5 text-[#9d4300]" />
            تتبع المنهج
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="pt-20 pb-20">
        <CurriculumTrackerView />
      </main>
    </div>
  );
}
