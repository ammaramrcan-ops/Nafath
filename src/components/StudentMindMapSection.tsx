import { useState, useMemo, useEffect } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import type { ParagraphBlock as Block } from "@/lib/lesson-data";
import { MindMapCanvas } from "./MindMapCanvas";
import { parseBlockMindMap, saveSubjectMindMaps, type MindMapData } from "@/lib/mind-map-types";

export function StudentMindMapSection({ block }: { block: Block }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.classList.toggle("mindmap-fullscreen-active", isFullscreen);
    }
    return () => {
      if (typeof document !== "undefined") {
        document.body.classList.remove("mindmap-fullscreen-active");
      }
    };
  }, [isFullscreen]);

  const mapData: MindMapData = useMemo(() => {
    return parseBlockMindMap(block);
  }, [block]);

  const handleUpdate = (updated: MindMapData) => {
    try {
      saveSubjectMindMaps(block.id.toString(), [updated]);
    } catch {}
  };

  return (
    <div className="w-full space-y-4 text-right" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-[#0b1c30]">الخريطة الذهنية التفاعلية 🗺️</span>
          <span className="text-xs font-semibold text-slate-400 hidden sm:inline-block">
            (اسحب التكبير والتصغير وتصفّح الخريطة بحرية)
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsFullscreen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#9d4300] hover:bg-[#833800] px-4 py-2 text-xs font-extrabold text-white transition shadow-sm cursor-pointer"
        >
          <Maximize2 className="h-4 w-4" />
          <span>تكبير ملء الشاشة ⛶</span>
        </button>
      </div>

      <div
        className="relative w-full rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-[0_20px_60px_-15px_rgba(11,28,48,0.08)] bg-[#0b1329]"
        style={{ height: "520px" }}
      >
        <MindMapCanvas mapData={mapData} onUpdateMap={handleUpdate} readOnly={false} hideSideControls={true} />
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-[#0b1329] p-4 sm:p-6 flex flex-col space-y-4 text-right" dir="rtl">
          <div className="flex items-center justify-between bg-white/95 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-sm font-extrabold text-[#0b1c30]">
                الخريطة الذهنية الموسعة — {block.title} 📌
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                وضع التكبير الحر والتفاعل مع العقد 🖐️
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#213145] hover:bg-[#0b1c30] px-4 py-2 text-xs font-extrabold text-white transition cursor-pointer shadow-md"
            >
              <Minimize2 className="h-4 w-4" />
              <span>إغلاق التكبير / العودة للدرس 🗗</span>
            </button>
          </div>

          <div className="flex-1 w-full rounded-3xl border border-white/10 shadow-2xl relative">
            <MindMapCanvas mapData={mapData} onUpdateMap={handleUpdate} readOnly={false} hideSideControls={false} />
          </div>
        </div>
      )}
    </div>
  );
}
