import { useState } from "react";
import { ChevronRight, ChevronLeft, RotateCcw } from "lucide-react";
import type { ParagraphBlock as Block } from "@/lib/lesson-data";
import { Button } from "@/components/ui/button";
import { HardWordText } from "./HardWordText";
import { QuizSection } from "./QuizSection";
import { cn } from "@/lib/utils";

type Level = "original" | "story" | "examples" | "mnemonic" | "funny_link";

const LEVELS: { key: Level; label: string }[] = [
  { key: "original", label: "النص الأصلي" },
  { key: "story", label: "القصة" },
  { key: "examples", label: "الأمثلة" },
  { key: "mnemonic", label: "الروابط الذهنية" },
  { key: "funny_link", label: "الرابط الفكاهي" },
];

export function ParagraphBlockCard({
  block,
  onComplete,
}: {
  block: Block;
  onComplete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [levelIdx, setLevelIdx] = useState(0);

  const level = LEVELS[levelIdx].key;
  const text =
    level === "original"
      ? block.full_text
      : level === "story"
      ? block.formats.story
      : level === "examples"
      ? block.formats.examples
      : level === "mnemonic"
      ? block.formats.mnemonic
      : block.formats.funny_link;

  if (!expanded) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-20 text-center">
        <p className="text-2xl sm:text-3xl font-semibold leading-loose text-foreground">
          <HardWordText text={block.short_sentence} words={block.hard_words} />
        </p>
        <Button
          onClick={() => setExpanded(true)}
          size="lg"
          className="mt-12 rounded-full bg-brand px-8 py-6 text-base text-brand-foreground hover:bg-brand/90"
        >
          فهمت الفكرة، اعرض التفاصيل
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      {/* Stepper navigation */}
      <div className="mb-8 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(false)}
          className="gap-1 text-foreground/60"
        >
          <RotateCcw className="h-4 w-4" />
          رجوع
        </Button>

        <div className="flex items-center gap-1.5">
          {LEVELS.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === levelIdx ? "w-6 bg-brand" : "w-1.5 bg-border"
              )}
            />
          ))}
        </div>

        <span className="text-sm text-foreground/50 min-w-20 text-center">
          {LEVELS[levelIdx].label}
        </span>
      </div>

      {/* Image only at original */}
      {level === "original" && (
        <div className="mb-8 overflow-hidden rounded-2xl">
          <img
            src={block.visual_url}
            alt={block.title}
            loading="lazy"
            className="aspect-[16/9] w-full object-cover"
          />
        </div>
      )}

      {/* Text content */}
      <div
        key={level}
        className="animate-fade-in text-lg leading-loose text-foreground/85"
      >
        <HardWordText text={text} words={block.hard_words} />
      </div>

      {/* Arrows: in RTL, right arrow = previous, left arrow = next */}
      <div className="mt-10 flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setLevelIdx((i) => Math.max(0, i - 1))}
          disabled={levelIdx === 0}
          className="h-12 w-12 rounded-full"
          aria-label="السابق"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>

        <span className="text-sm text-foreground/40">
          {levelIdx + 1} / {LEVELS.length}
        </span>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setLevelIdx((i) => Math.min(LEVELS.length - 1, i + 1))}
          disabled={levelIdx === LEVELS.length - 1}
          className="h-12 w-12 rounded-full"
          aria-label="التالي"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Quiz */}
      <QuizSection quizzes={block.quizzes} onAllCorrect={onComplete} />
    </div>
  );
}
