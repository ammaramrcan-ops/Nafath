import { useState, useRef, useEffect } from "react";
import { HighlightingToolbar, type HighlightColor } from "./HighlightingToolbar";
import { HardWordText } from "./HardWordText";
import { type HardWord } from "@/lib/lesson-data";

interface HighlightItem {
  id: string;
  text: string;
  type: "highlight" | "bold";
  color?: HighlightColor;
}

export function HighlightableText({
  text,
  words = [],
  editable = true,
}: {
  text: string;
  words?: HardWord[];
  editable?: boolean;
}) {
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [selectionRange, setSelectionRange] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const checkSelection = () => {
    if (!editable) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setSelectionRange(null);
      return;
    }
    const selectedText = sel.toString().trim();
    if (!selectedText || selectedText.length < 2) {
      setSelectionRange(null);
      return;
    }

    try {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelectionRange({
        text: selectedText,
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    } catch {
      setSelectionRange(null);
    }
  };

  useEffect(() => {
    if (!editable) return;
    const handleMouseUp = () => {
      setTimeout(checkSelection, 50);
    };
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("selectionchange", checkSelection);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("selectionchange", checkSelection);
    };
  }, [editable]);

  const addHighlight = (color: HighlightColor) => {
    if (!selectionRange) return;
    const newItem: HighlightItem = {
      id: crypto.randomUUID(),
      text: selectionRange.text,
      type: "highlight",
      color,
    };
    setHighlights((prev) => [...prev, newItem]);
    setSelectionRange(null);
    window.getSelection()?.removeAllRanges();
  };

  const addBold = () => {
    if (!selectionRange) return;
    const newItem: HighlightItem = {
      id: crypto.randomUUID(),
      text: selectionRange.text,
      type: "bold",
    };
    setHighlights((prev) => [...prev, newItem]);
    setSelectionRange(null);
    window.getSelection()?.removeAllRanges();
  };

  const getColorClass = (color?: HighlightColor) => {
    switch (color) {
      case "green":
        return "bg-emerald-300 text-emerald-950 dark:bg-emerald-800 dark:text-emerald-100 rounded px-1.5 py-0.5 font-bold shadow-sm";
      case "blue":
        return "bg-sky-300 text-sky-950 dark:bg-sky-800 dark:text-sky-100 rounded px-1.5 py-0.5 font-bold shadow-sm";
      case "pink":
        return "bg-pink-300 text-pink-950 dark:bg-pink-800 dark:text-pink-100 rounded px-1.5 py-0.5 font-bold shadow-sm";
      case "yellow":
      default:
        return "bg-amber-300 text-amber-950 dark:bg-amber-800 dark:text-amber-100 rounded px-1.5 py-0.5 font-bold shadow-sm";
    }
  };

  const renderHighlightedContent = () => {
    if (highlights.length === 0) {
      return <HardWordText text={text} words={words} />;
    }

    let processedNodes: React.ReactNode[] = [<HardWordText key="original" text={text} words={words} />];

    highlights.forEach((h) => {
      processedNodes = processedNodes.map((node, nIdx) => {
        if (typeof node === "string") {
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
                    h.type === "highlight"
                      ? getColorClass(h.color)
                      : "font-black text-zen-primary text-lg underline decoration-zen-primary/50"
                  }
                >
                  {h.text}
                </span>
              );
            }
          });
          return elements;
        }
        return node;
      });
    });

    return <>{processedNodes}</>;
  };

  return (
    <div ref={containerRef} className="relative select-text">
      {editable && selectionRange && (
        <HighlightingToolbar
          x={selectionRange.x}
          y={selectionRange.y}
          onHighlight={addHighlight}
          onBold={addBold}
        />
      )}
      {renderHighlightedContent()}
    </div>
  );
}
