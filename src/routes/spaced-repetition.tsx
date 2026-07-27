import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { SpacedRepetitionView } from "@/components/SpacedRepetition";

export const Route = createFileRoute("/spaced-repetition")({
  component: SpacedRepetitionPage,
  head: () => ({
    meta: [
      { title: "التكرار المتباعد — نفاذ" },
      { name: "description", content: "نظام التكرار المتباعد والمراجعة الذكية للبطاقات." },
    ],
  }),
});

function SpacedRepetitionPage() {
  const navigate = useNavigate();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      navigate({ to: "/subjects" });
    }
  };

  return (
    <div
      dir="rtl"
      lang="ar"
      className="min-h-screen bg-zen-surface text-zen-on-surface antialiased"
    >
      {/* Top Bar */}
      <header className="fixed inset-x-0 top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zen-surface-container/60">
        <div className="relative mx-auto flex w-full max-w-[900px] items-center justify-between px-6 py-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-zen-on-surface-variant hover:bg-zen-surface-low transition cursor-pointer"
            aria-label="رجوع"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2} />
            <span className="text-xs font-bold">رجوع</span>
          </button>
          <div className="text-base font-bold text-zen-on-surface">التكرار المتباعد</div>
          <div className="w-16" />
        </div>
      </header>

      <main className="pt-20">
        <SpacedRepetitionView />
      </main>
    </div>
  );
}
