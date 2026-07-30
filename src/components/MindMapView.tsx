import { useState, useEffect, useMemo } from "react";
import {Plus, Download} from "lucide-react";
import {
  getDefaultKhulMindMap,
  getStoredMindMaps,
  saveMindMaps,
  getSubjectMindMaps,
  saveSubjectMindMaps,
  createEmptySubjectMindMap,
  type MindMapData,
} from "@/lib/mind-map-types";
import { MindMapCanvas } from "./MindMapCanvas";
import { toast } from "sonner";

export function MindMapView({
  subjectId,
  subjectName,
}: {
  subjectId?: string;
  subjectName?: string;
}) {
  const [maps, setMaps] = useState<MindMapData[]>([]);
  const [selectedMapId, setSelectedMapId] = useState<string>("");

  useEffect(() => {
    const loaded = subjectId ? getSubjectMindMaps(subjectId, subjectName) : getStoredMindMaps();
    setMaps(loaded);
    if (loaded.length > 0) {
      setSelectedMapId(loaded[0].id);
    }
  }, [subjectId, subjectName]);

  const activeMap = useMemo(() => {
    return (
      maps.find((m) => m.id === selectedMapId) ||
      maps[0] ||
      (subjectId ? createEmptySubjectMindMap(subjectName || "المادة") : getDefaultKhulMindMap())
    );
  }, [maps, selectedMapId, subjectId, subjectName]);

  const handleUpdateMap = (updatedMap: MindMapData) => {
    const updatedMaps = maps.map((m) => (m.id === updatedMap.id ? updatedMap : m));
    setMaps(updatedMaps);
    if (subjectId) {
      saveSubjectMindMaps(subjectId, updatedMaps);
    } else {
      saveMindMaps(updatedMaps);
    }
  };

  const handleCreateNewMap = () => {
    const rootId = `root_${Date.now()}`;
    const newMap: MindMapData = {
      id: `map_${Date.now()}`,
      title: subjectName
        ? `خريطة جديدة لمادة ${subjectName}`
        : `خريطة ذهنية مخصصة #${maps.length + 1}`,
      rootId,
      nodes: [
        {
          id: rootId,
          text: subjectName ? `مادة ${subjectName} 📌` : "العنوان الرئيسي المفهومي 📌",
          shape: "rectangle",
          x: 450,
          y: 250,
          width: 240,
          height: 80,
          backgroundColor: "#FEF3C7",
          textColor: "#78350F",
          borderColor: "#F59E0B",
          lineColor: "#F59E0B",
          lineThickness: 5,
          lineStyle: "solid",
        },
      ],
    };

    const updated = [newMap, ...maps];
    setMaps(updated);
    if (subjectId) {
      saveSubjectMindMaps(subjectId, updated);
    } else {
      saveMindMaps(updated);
    }
    setSelectedMapId(newMap.id);
    toast.success("تم إنشاء خريطة ذهنية جديدة! 🎉");
  };

  const handleExportJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeMap, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${activeMap.title}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("تم تصدير الخريطة الذهنية كملف JSON بنجاح! 📥");
  };

  return (
    <div
      className="w-full h-full min-h-screen relative overflow-hidden bg-[#0b1329] text-right font-body-md"
      dir="rtl"
    >
      {/* Top Floating Map Actions & Selector Toolbar */}
      <div className="fixed top-20 right-6 z-30 flex flex-wrap items-center gap-2 bg-white/95 backdrop-blur-md p-2 rounded-2xl border border-[#e0c0b1]/50 shadow-lg">
        {maps.length > 1 && (
          <div className="flex flex-wrap gap-1 border-l border-[#e0c0b1]/40 pl-2 ml-1">
            {maps.map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => setSelectedMapId(m.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  activeMap.id === m.id
                    ? "bg-[#9d4300] text-white border-[#9d4300] shadow-xs"
                    : "bg-[#eff4ff] text-[#0b1c30] border-[#e0c0b1]/30 hover:bg-[#dce9ff]"
                }`}
              >
                {m.title}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={handleCreateNewMap}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#9d4300] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#833800] transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>خريطة جديدة</span>
        </button>

        <button
          type="button"
          onClick={handleExportJson}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#eff4ff] px-3.5 py-1.5 text-xs font-bold text-[#0b1c30] border border-[#e0c0b1]/40 hover:bg-[#dce9ff] transition cursor-pointer"
        >
          <Download className="h-4 w-4 text-emerald-600" />
          <span>تصدير JSON</span>
        </button>
      </div>

      {/* Mind Map Canvas Filling Entire Screen */}
      <MindMapCanvas mapData={activeMap} onUpdateMap={handleUpdateMap} />
    </div>
  );
}
