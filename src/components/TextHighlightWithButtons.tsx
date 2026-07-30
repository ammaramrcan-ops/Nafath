import { useState, useRef } from "react";
import { HardWordText } from "./HardWordText";
import { type HardWord } from "@/lib/lesson-data";
import { Sparkles } from "lucide-react";
import { generateSecureId } from "@/lib/utils";

interface HighlightSpan {
  id: string;
  text: string;
  color: "yellow" | "green";
}

export function TextHighlightWithButtons({
  text,
  words = [],
}: {
  text: string;
  words?: HardWord[];
}) {
  const [highlights, setHighlights] = useState<HighlightSpan[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const applyHighlight = (color: "yellow" | "green") => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;

    const selectedText = sel.toString().trim();
    if (!selectedText || selectedText.length < 2) return;

    const newItem: HighlightSpan = {
      id: generateSecureId(),
      text: selectedText,
      color,
    };

    setHighlights((prev) => [...prev, newItem]);
    sel.removeAllRanges();
  };

  const splitHighlightNode = (
    node: string,
    h: HighlightItem,
    nIdx: number,
  ): React.ReactNode => {
    const parts = node.split(h.text);
    if (parts.length <= 1) return node;

    const elements: React.ReactNode[] = [];
    parts.forEach((part, pIdx) => {
      elements.push(part);
      if (pIdx < parts.length - 1) {
        elements.push(
          <span
            key={`${h.id}-${nIdx}-${pIdx}`}
            className={
              h.color === "yellow"
                ? "bg-amber-300 text-amber-950 font-bold px-1.5 py-0.5 rounded-md shadow-sm"
                : "bg-emerald-300 text-emerald-950 font-bold px-1.5 py-0.5 rounded-md shadow-sm"
            }
          >
            {h.text}
          </span>,
        );
      }
    });
    return elements;
  };

  const renderContent = () => {
    if (highlights.length === 0) {
      return <HardWordText text={text} words={words} />;
    }

    let processedNodes: React.ReactNode[] = [
      <HardWordText key="original" text={text} words={words} />,
    ];

    for (const h of highlights) {
      const nextNodes: React.ReactNode[] = [];
      for (let nIdx = 0; nIdx < processedNodes.length; nIdx++) {
        const node = processedNodes[nIdx];
        if (typeof node === "string") {
          nextNodes.push(splitHighlightNode(node, h, nIdx));
        } else {
          nextNodes.push(node);
        }
      }
      processedNodes = nextNodes;
    }

    return <>{processedNodes}</>;
  };

  return (
    <div className="space-y-3">
      {/* Text Container */}
      <div ref={containerRef} className="select-text leading-relaxed">
        {renderContent()}
      </div>

      {/* 2 Color Highlight Buttons Placed Underneath the Text Box */}
      <div className="flex items-center gap-3 pt-2 border-t border-zen-surface-container">
        <span className="text-xs font-semibold text-zen-on-surface-variant flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5 text-zen-primary" />
          تظليل التحديد:
        </span>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            applyHighlight("yellow");
          }}
          className="flex items-center gap-1.5 rounded-full bg-amber-200 px-3.5 py-1 text-xs font-bold text-amber-900 border border-amber-300 hover:bg-amber-300 transition cursor-pointer shadow-sm"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          تظليل أصفر 🟡
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            applyHighlight("green");
          }}
          className="flex items-center gap-1.5 rounded-full bg-emerald-200 px-3.5 py-1 text-xs font-bold text-emerald-900 border border-emerald-300 hover:bg-emerald-300 transition cursor-pointer shadow-sm"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          تظليل أخضر 🟢
        </button>

        {highlights.length > 0 && (
          <button
            type="button"
            onClick={() => setHighlights([])}
            className="text-[11px] font-medium text-zen-on-surface-variant/70 hover:text-zen-on-surface underline mr-auto cursor-pointer"
          >
            مسح التظليلات
          </button>
        )}
      </div>
    </div>
  );
}
