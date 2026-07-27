import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {ChevronRight, Layers} from "lucide-react";
import { MindMapView } from "@/components/MindMapView";

interface MindMapSearch {
  subjectId?: string;
  subjectName?: string;
}

export const Route = createFileRoute("/mind-map")({
  validateSearch: (search: Record<string, unknown>): MindMapSearch => {
    return {
      subjectId: typeof search.subjectId === "string" ? search.subjectId : undefined,
      subjectName: typeof search.subjectName === "string" ? search.subjectName : undefined,
    };
  },
  component: MindMapPage,
  head: () => ({
    meta: [
      { title: "الخرائط الذهنية الدلالية — نفاذ" },
      {
        name: "description",
        content: "نظام الخرائط الذهنية التفاعلي المتقدم بالأشكال والألوان واللوحة اللانهائية.",
      },
    ],
  }),
});

function MindMapPage() {
  const search = useSearch({ from: "/mind-map" });
  const { subjectId, subjectName } = search;
  const navigate = useNavigate();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else if (subjectId) {
      navigate({ to: "/subjects/$subjectId", params: { subjectId } });
    } else {
      navigate({ to: "/subjects" });
    }
  };

  return (
    <div
      dir="rtl"
      lang="ar"
      className="w-screen h-screen overflow-hidden bg-[#0b1329] text-on-background antialiased relative"
    >
      {/* Top Header Floating Navigation Bar */}
      <header className="fixed top-4 inset-x-6 z-40 bg-white/95 backdrop-blur-md border border-[#e0c0b1]/50 rounded-2xl shadow-xl px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 bg-[#eff4ff] text-[#9d4300] hover:bg-[#dce9ff] transition cursor-pointer font-bold text-xs shadow-xs"
            aria-label="رجوع"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
            <span>رجوع</span>
          </button>
          <div>
            <div className="text-base font-extrabold text-[#0b1c30] flex items-center gap-2">
              <Layers className="h-5 w-5 text-[#9d4300]" />
              <span>
                {subjectName ? `الخرائط الذهنية — ${subjectName}` : "الخرائط الذهنية الدلالية"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#584237]/70 hidden md:inline-block">
            لوحة لانهائية ملء الشاشة
          </span>
        </div>
      </header>

      {/* Main Full-Screen Mind Map Canvas Container */}
      <main className="w-full h-full pt-0">
        <MindMapView subjectId={subjectId} subjectName={subjectName} />
      </main>
    </div>
  );
}
