import { useState } from "react";
import { Highlighter, Bold, Check } from "lucide-react";

export type HighlightColor = "yellow" | "green" | "blue" | "pink";

export function HighlightingToolbar({
  x,
  y,
  onHighlight,
  onBold,
}: {
  x: number;
  y: number;
  onHighlight: (color: HighlightColor) => void;
  onBold: () => void;
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const colors: { id: HighlightColor; label: string; bg: string; text: string; border: string }[] = [
    { id: "yellow", label: "أصفر", bg: "bg-yellow-300", text: "text-yellow-950", border: "border-yellow-400" },
    { id: "green", label: "أخضر", bg: "bg-emerald-300", text: "text-emerald-950", border: "border-emerald-400" },
    { id: "blue", label: "أزرق", bg: "bg-sky-300", text: "text-sky-950", border: "border-sky-400" },
    { id: "pink", label: "وردي", bg: "bg-pink-300", text: "text-pink-950", border: "border-pink-400" },
  ];

  return (
    <div
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: "translate(-50%, -120%)",
      }}
      className="fixed z-[9999] flex flex-col items-center gap-1.5 rounded-2xl bg-zen-on-surface p-2 shadow-2xl border border-white/30 text-white animate-in fade-in zoom-in-90 duration-150"
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowColorPicker(!showColorPicker);
          }}
          className="flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950 hover:bg-amber-300 transition cursor-pointer shadow-sm"
          title="اختيار لون التظليل"
        >
          <Highlighter className="h-3.5 w-3.5" />
          <span>تظليل (اختر لون)</span>
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onBold();
          }}
          className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white hover:bg-white/30 transition cursor-pointer shadow-sm"
          title="جعل الخط عريضاً ومميزاً"
        >
          <Bold className="h-3.5 w-3.5" />
          <span>خط عريض</span>
        </button>
      </div>

      {/* Color Selection Palette */}
      {showColorPicker && (
        <div className="flex items-center gap-2 pt-1.5 border-t border-white/20 w-full justify-center">
          {colors.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onHighlight(c.id);
              }}
              className={`h-6 w-6 rounded-full ${c.bg} border-2 ${c.border} transition hover:scale-115 flex items-center justify-center cursor-pointer shadow-sm`}
              title={`تظليل باللون ال${c.label}`}
            >
              <Check className={`h-3 w-3 ${c.text} opacity-0 hover:opacity-100`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
