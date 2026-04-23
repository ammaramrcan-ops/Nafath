import type { HardWord } from "@/lib/lesson-data";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function HardWordText({ text, words }: { text: string; words: HardWord[] }) {
  if (!words.length) return <>{text}</>;

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
                <span className="cursor-help font-medium text-zen-primary underline decoration-dotted decoration-zen-primary/40 underline-offset-[6px]">
                  {part}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs rounded-2xl bg-zen-on-surface px-4 py-2.5 text-right text-white">
                <p className="text-[13px] font-light leading-relaxed">{match.meaning}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </span>
    </TooltipProvider>
  );
}
