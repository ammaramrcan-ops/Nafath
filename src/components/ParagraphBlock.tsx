import { useState } from "react";
import { ChevronRight, ChevronLeft, RotateCcw } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { ParagraphBlock as Block } from "@/lib/lesson-data";
import { HardWordText } from "./HardWordText";
import { MindMap } from "./MindMap";
import { cn } from "@/lib/utils";

type Stage = "short" | "examples" | "original" | "mental" | "mindmap";

const STAGES: { key: Stage; label: string }[] = [
  { key: "short", label: "الجملة المبسطة" },
  { key: "examples", label: "أمثلة توضيحية" },
  { key: "original", label: "النص الأصلي" },
  { key: "mental", label: "رابط ذهني" },
  { key: "mindmap", label: "الخريطة الذهنية" },
];

export function ParagraphBlockCard({
  block,
  onComplete,
}: {
  block: Block;
  onComplete: () => void;
}) {
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const stage = STAGES[idx].key;

  // Stage 1 — short sentence with CTA
  if (!started) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-2xl sm:text-3xl font-semibold leading-loose text-foreground">
          <HardWordText text={block.short_sentence} words={block.hard_words} />
        </p>
        <button
          onClick={() => {
            setStarted(true);
            setIdx(1); // skip "short" since user just saw it
          }}
          className="mt-12 rounded-full bg-brand px-8 py-4 text-base text-brand-foreground shadow-[var(--shadow-soft)] hover:bg-brand/90"
        >
          فهمت الفكرة، اعرض التفاصيل
        </button>
      </div>
    );
  }

  const isLast = idx === STAGES.length - 1;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      {/* Stepper header */}
      <div className="mb-10 flex items-center justify-between gap-3">
        <button
          onClick={() => {
            setStarted(false);
            setIdx(0);
          }}
          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-foreground/60 hover:bg-muted"
        >
          <RotateCcw className="h-4 w-4" />
          رجوع
        </button>

        <div className="flex items-center gap-1.5">
          {STAGES.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === idx ? "w-6 bg-brand" : "w-1.5 bg-border",
              )}
            />
          ))}
        </div>

        <span className="min-w-24 text-sm text-foreground/50 text-center">
          {STAGES[idx].label}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {stage === "short" && (
            <p className="text-center text-2xl font-semibold leading-loose text-foreground">
              <HardWordText text={block.short_sentence} words={block.hard_words} />
            </p>
          )}

          {stage === "examples" && (
            <div className="rounded-3xl bg-brand-soft/60 p-8 text-lg leading-loose text-foreground/85">
              <p className="mb-3 text-sm font-semibold text-brand">مثال</p>
              <HardWordText text={block.examples} words={block.hard_words} />
            </div>
          )}

          {stage === "original" && (
            <div>
              {block.visual_url && (
                <div className="mb-8 overflow-hidden rounded-2xl">
                  <img
                    src={block.visual_url}
                    alt={block.title}
                    loading="lazy"
                    className="aspect-[16/9] w-full object-cover"
                  />
                </div>
              )}
              <div
                className="text-lg text-foreground/85"
                style={{
                  whiteSpace: "pre-wrap",
                  wordSpacing: "0.4em",
                  lineHeight: 2.4,
                }}
              >
                <HardWordText text={block.full_text} words={block.hard_words} />
              </div>
            </div>
          )}

          {stage === "mental" && (
            <div className="space-y-6">
              <div className="rounded-3xl border-2 border-brand/30 bg-card p-6 text-center">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-brand">
                  اختصار للحفظ
                </p>
                <p className="text-xl font-bold leading-relaxed text-foreground">
                  {block.mnemonic}
                </p>
              </div>
              <div className="rounded-3xl bg-warning-soft p-6 text-center">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-foreground/60">
                  رابط فكاهي 😄
                </p>
                <p className="text-lg leading-loose text-foreground/85">{block.funny_link}</p>
              </div>
            </div>
          )}

          {stage === "mindmap" && (
            <div>
              <p className="mb-6 text-center text-sm text-foreground/50">
                الخريطة الذهنية للفقرة
              </p>
              <MindMap title={block.title} nodes={block.mind_map_nodes} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Nav */}
      <div className="mt-12 flex items-center justify-between">
        <button
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-background text-foreground transition hover:border-brand/40 disabled:opacity-30"
          aria-label="السابق"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <span className="text-sm text-foreground/40">
          {idx + 1} / {STAGES.length}
        </span>

        {isLast ? (
          <button
            onClick={onComplete}
            className="rounded-full bg-success px-6 py-3 text-sm font-semibold text-success-foreground shadow-[var(--shadow-soft)] hover:bg-success/90"
          >
            للاختبار ←
          </button>
        ) : (
          <button
            onClick={() => setIdx((i) => Math.min(STAGES.length - 1, i + 1))}
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-background text-foreground transition hover:border-brand/40"
            aria-label="التالي"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
