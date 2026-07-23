import type { HardWord, TextHighlight } from "@/lib/lesson-data";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function getHighlightStyles(color?: string, fontSize?: string) {
  let colorClass = "bg-amber-300 text-amber-950 border-b-2 border-amber-500 font-bold";
  if (color === "green") colorClass = "bg-emerald-300 text-emerald-950 border-b-2 border-emerald-500 font-bold";
  if (color === "blue") colorClass = "bg-sky-300 text-sky-950 border-b-2 border-sky-500 font-bold";
  if (color === "pink") colorClass = "bg-pink-300 text-pink-950 border-b-2 border-pink-500 font-bold";
  if (color === "purple") colorClass = "bg-purple-300 text-purple-950 border-b-2 border-purple-500 font-bold";

  let sizeClass = "";
  if (fontSize === "large") sizeClass = "text-[1.2em] font-extrabold tracking-wide";
  if (fontSize === "xlarge") sizeClass = "text-[1.35em] font-black tracking-wider shadow-xs";

  return `px-1.5 py-0.5 rounded-md shadow-xs mx-0.5 inline-block ${colorClass} ${sizeClass}`;
}

export function HardWordText({
  text,
  words = [],
  highlights = [],
}: {
  text: any;
  words?: HardWord[];
  highlights?: TextHighlight[];
}) {
  let safeText = "";
  if (typeof text === "string") {
    safeText = text;
  } else if (Array.isArray(text)) {
    safeText = text.map((item) => (typeof item === "string" ? item : item?.text || item?.title || JSON.stringify(item))).join(" ");
  } else if (text && typeof text === "object") {
    safeText = (text as any).text || (text as any).title || (text as any).content || (text as any).value || JSON.stringify(text);
  } else if (text != null) {
    safeText = String(text);
  }

  if (!safeText) return null;

  const validHighlights = (highlights || []).filter((h) => h && h.text && typeof h.text === "string" && h.text.trim().length > 0);

  // Check if any highlight uses explicit startOffset & endOffset
  const hasRangeHighlights = validHighlights.some(
    (h) => typeof h.startOffset === "number" && typeof h.endOffset === "number"
  );

  let nodes: React.ReactNode[] = [];

  if (hasRangeHighlights) {
    // Exact character position slicing so line 1 word is highlighted without affecting line 10!
    const ranges = validHighlights
      .filter(
        (h) =>
          typeof h.startOffset === "number" &&
          typeof h.endOffset === "number" &&
          h.startOffset >= 0 &&
          h.endOffset <= safeText.length &&
          h.startOffset < h.endOffset
      )
      .sort((a, b) => a.startOffset! - b.startOffset!);

    let cursor = 0;
    ranges.forEach((h, idx) => {
      const start = h.startOffset!;
      const end = h.endOffset!;

      if (start >= cursor) {
        if (start > cursor) {
          nodes.push(safeText.substring(cursor, start));
        }
        nodes.push(
          <span key={`hl-range-${idx}`} className={getHighlightStyles(h.color, h.fontSize)}>
            {safeText.substring(start, end)}
          </span>
        );
        cursor = end;
      }
    });

    if (cursor < safeText.length) {
      nodes.push(safeText.substring(cursor));
    }
  } else {
    // Substring fallback matching
    nodes = [safeText];
    validHighlights.forEach((h, hIdx) => {
      nodes = nodes.flatMap((node, nIdx) => {
        if (typeof node === "string") {
          const parts = node.split(h.text);
          if (parts.length <= 1) return [node];

          const elements: React.ReactNode[] = [];
          parts.forEach((part, pIdx) => {
            if (part) elements.push(part);
            if (pIdx < parts.length - 1) {
              elements.push(
                <span
                  key={`hl-${hIdx}-${nIdx}-${pIdx}`}
                  className={getHighlightStyles(h.color, h.fontSize)}
                >
                  {h.text}
                </span>
              );
            }
          });
          return elements;
        }
        return [node];
      });
    });
  }

  return (
    <TooltipProvider delayDuration={150}>
      <span className="leading-loose">
        {nodes.map((node, idx) => {
          if (typeof node === "string") {
            return <span key={idx}>{renderWords(node, words)}</span>;
          }
          return <span key={idx}>{node}</span>;
        })}
      </span>
    </TooltipProvider>
  );
}

function getWordTerm(w: any): string {
  return w?.word || w?.term || "";
}

function getWordMeaning(w: any): string {
  return w?.meaning || w?.definition || w?.explanation || "";
}

function renderWords(textStr: string, words: HardWord[]) {
  if (!words || !words.length) return textStr;

  const validWords = words.filter((w) => getWordTerm(w).trim().length > 0);
  if (validWords.length === 0) return textStr;

  const sorted = [...validWords].sort((a, b) => getWordTerm(b).length - getWordTerm(a).length);
  const escaped = sorted.map((w) => getWordTerm(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "g");
  const parts = textStr.split(regex);

  return parts.map((part, i) => {
    const match = validWords.find((w) => getWordTerm(w) === part);
    if (!match) return part;
    return (
      <Tooltip key={i}>
        <TooltipTrigger asChild>
          <span className="cursor-help font-medium text-zen-primary underline decoration-dotted decoration-zen-primary/40 underline-offset-[6px]">
            {part}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs rounded-2xl bg-zen-on-surface px-4 py-2.5 text-right text-white">
          <p className="text-[13px] font-light leading-relaxed">{getWordMeaning(match)}</p>
        </TooltipContent>
      </Tooltip>
    );
  });
}
