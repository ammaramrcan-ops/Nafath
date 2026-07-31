import { useRef, useState } from "react";
import { Sparkles, X, Type } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import type { TextHighlight, HighlightColor } from "@/lib/lesson-data";
import { generateSecureId } from "@/lib/utils";

export function VisualHighlightArea({
  value,
  onChangeText,
  highlights = [],
  onChangeHighlights,
  rows = 4,
  placeholder = "",
  id,
}: {
  readonly value: string;
  readonly onChangeText: (val: string) => void;
  readonly highlights?: TextHighlight[];
  readonly onChangeHighlights: (h: TextHighlight[]) => void;
  readonly rows?: number;
  readonly placeholder?: string;
  readonly id?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isLargeSize, setIsLargeSize] = useState(false);

  const addHighlight = (color: HighlightColor) => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;

    if (start === undefined || end === undefined || start === end) {
      alert("حدد كلمة أو جملة محدودة داخل صندوق النص أولاً بالماوس ثم اضغط على زر التظليل.");
      return;
    }

    const selectedText = value.substring(start, end).trim();
    if (!selectedText) return;

    // Add visual highlight with exact character position range so line 1 is highlighted without line 10!
    const newHighlight: TextHighlight = {
      id: generateSecureId(),
      text: selectedText,
      color,
      fontSize: isLargeSize ? "large" : "normal",
      startOffset: start,
      endOffset: end,
    };

    const exists = highlights.some(
      (h) => h.startOffset === start && h.endOffset === end && h.color === color,
    );
    if (!exists) {
      onChangeHighlights([...highlights, newHighlight]);
    }
  };

  const removeHighlight = (idx: number) => {
    onChangeHighlights(highlights.filter((_, i) => i !== idx));
  };

  const getColorLabel = (c: HighlightColor) => {
    switch (c) {
      case "yellow":
        return { bg: "bg-amber-200 text-amber-950 border-amber-300", label: "أصفر 🟡" };
      case "green":
        return { bg: "bg-emerald-200 text-emerald-950 border-emerald-300", label: "أخضر 🟢" };
      case "blue":
        return { bg: "bg-sky-200 text-sky-950 border-sky-300", label: "أزرق 🔵" };
      case "pink":
        return { bg: "bg-pink-200 text-pink-950 border-pink-300", label: "وردي 🩷" };
      case "purple":
        return { bg: "bg-purple-200 text-purple-950 border-purple-300", label: "بنفسجي 🟣" };
    }
  };

  return (
    <div className="space-y-3">
      {/* Plain Text Area */}
      <Textarea
        ref={textareaRef}
        rows={rows}
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={placeholder}
        id={id}
        className="font-sans text-sm leading-relaxed rounded-2xl border-zen-surface-container bg-white shadow-none focus-visible:ring-zen-primary"
      />

      {/* Visual Highlight Toolbar */}
      <div className="space-y-3 pt-2 border-t border-zen-surface-container/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-zen-on-surface-variant flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              ألوان التظليل المتاحة:
            </span>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addHighlight("yellow");
              }}
              className="inline-flex items-center gap-1 rounded-full bg-amber-200 px-3 py-1 text-xs font-bold text-amber-950 border border-amber-300 hover:bg-amber-300 transition cursor-pointer shadow-xs"
            >
              🟡 أصفر
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addHighlight("green");
              }}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-200 px-3 py-1 text-xs font-bold text-emerald-950 border border-emerald-300 hover:bg-emerald-300 transition cursor-pointer shadow-xs"
            >
              🟢 أخضر
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addHighlight("blue");
              }}
              className="inline-flex items-center gap-1 rounded-full bg-sky-200 px-3 py-1 text-xs font-bold text-sky-950 border border-sky-300 hover:bg-sky-300 transition cursor-pointer shadow-xs"
            >
              🔵 أزرق
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addHighlight("pink");
              }}
              className="inline-flex items-center gap-1 rounded-full bg-pink-200 px-3 py-1 text-xs font-bold text-pink-950 border border-pink-300 hover:bg-pink-300 transition cursor-pointer shadow-xs"
            >
              🩷 وردي
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addHighlight("purple");
              }}
              className="inline-flex items-center gap-1 rounded-full bg-purple-200 px-3 py-1 text-xs font-bold text-purple-950 border border-purple-300 hover:bg-purple-300 transition cursor-pointer shadow-xs"
            >
              🟣 بنفسجي
            </button>
          </div>

          {/* Enlarge Size Option Toggle */}
          <button
            type="button"
            onClick={() => setIsLargeSize(!isLargeSize)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer border ${
              isLargeSize
                ? "bg-zen-primary text-white border-zen-primary shadow-xs"
                : "bg-zen-surface-low text-zen-on-surface-variant border-zen-surface-container hover:bg-zen-surface-container"
            }`}
          >
            <Type className="h-3.5 w-3.5" />
            <span>{isLargeSize ? "تكبير الكلمة: مفعل 🔍" : "تكبير الكلمة: معطل"}</span>
          </button>
        </div>

        {/* Display Active Visual Highlights Badges */}
        {highlights.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-medium text-zen-on-surface-variant">
              التظليلات المطبقة:
            </span>
            {highlights.map((h, i) => {
              const meta = getColorLabel(h.color);
              return (
                <span
                  key={h.id || i}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-bold shadow-xs ${meta.bg}`}
                >
                  <span>"{h.text}"</span>
                  {h.fontSize === "large" && (
                    <span className="text-[10px] bg-black/10 px-1.5 rounded">مكبرة</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeHighlight(i)}
                    className="rounded-full p-0.5 hover:bg-black/10 transition cursor-pointer"
                    title="حذف التظليل"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
