import type { HardWord } from "@/lib/lesson-data";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function HardWordText({ text, words }: { text: string; words: HardWord[] }) {
  if (!words.length) return <>{text}</>;

  // Build regex matching any of the hard words (longest first to avoid partial overlap)
  const sorted = [...words].sort((a, b) => b.word.length - a.word.length);
  const escaped = sorted.map((w) => w.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "g");
  const parts = text.split(regex);

  return (
    <TooltipProvider delayDuration={150}>
      <span className="leading-loose">
        {parts.map((part, i) => {
          const match = words.find((w) => w.word === part);
          if (!match) return <span key={i}>{part}</span>;
          return (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <span className="cursor-help font-semibold text-brand underline decoration-dashed decoration-brand/60 underline-offset-4">
                  {part}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-right">
                <p className="text-sm">{match.meaning}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </span>
    </TooltipProvider>
  );
}
