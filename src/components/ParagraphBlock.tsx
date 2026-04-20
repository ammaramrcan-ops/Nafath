import { useState } from "react";
import {
  Lightbulb,
  ChevronDown,
  BookOpen,
  Sparkles,
  Brain,
  FileText,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
} from "lucide-react";
import type { ParagraphBlock as Block } from "@/lib/lesson-data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HardWordText } from "./HardWordText";
import { cn } from "@/lib/utils";

type Props = {
  block: Block;
  index: number;
  locked: boolean;
  onPass: () => void;
};

const tabs = [
  { value: "original", label: "النص الأصلي", icon: FileText },
  { value: "story", label: "قصة", icon: BookOpen },
  { value: "examples", label: "أمثلة", icon: Sparkles },
  { value: "mnemonic", label: "روابط ذهنية", icon: Brain },
] as const;

export function ParagraphBlockCard({ block, index, locked, onPass }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<(typeof tabs)[number]["value"]>("original");
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = selected === block.quiz.correct_answer;

  const handleSubmit = () => {
    if (!selected) return;
    setSubmitted(true);
    if (selected === block.quiz.correct_answer) onPass();
  };

  const currentText =
    tab === "original" ? block.full_text :
    tab === "story" ? block.formats.story :
    tab === "examples" ? block.formats.examples :
    block.formats.mnemonic;

  return (
    <article
      className={cn(
        "rounded-3xl border border-border/60 bg-[image:var(--gradient-card)] p-6 sm:p-8 shadow-[var(--shadow-soft)] transition-all duration-500",
        locked && "pointer-events-none opacity-50"
      )}
      aria-disabled={locked}
    >
      {/* Header: index + fundamentals badge */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand text-brand-foreground font-bold shadow-[var(--shadow-soft)]">
          {index + 1}
        </span>

        <Dialog>
          <DialogTrigger asChild>
            <button className="inline-flex items-center gap-2 rounded-full bg-warning-soft px-4 py-2 text-sm font-semibold text-foreground/80 ring-1 ring-warning/40 transition hover:scale-105 hover:bg-warning/30">
              <Lightbulb className="h-4 w-4 text-warning" />
              تذكّر أساسيات هامة
            </button>
          </DialogTrigger>
          <DialogContent className="text-right">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-right">
                <Lightbulb className="h-5 w-5 text-warning" />
                الأساسيات قبل البدء
              </DialogTitle>
            </DialogHeader>
            <p className="mt-2 leading-loose text-foreground/80">{block.fundamentals}</p>
          </DialogContent>
        </Dialog>
      </div>

      {/* Short sentence */}
      <div className="rounded-2xl bg-brand-soft/60 p-5 ring-1 ring-brand/15">
        <p className="text-lg sm:text-xl font-semibold leading-relaxed">
          <HardWordText text={block.short_sentence} words={block.hard_words} />
        </p>
      </div>

      {/* Toggle */}
      {!expanded && (
        <div className="mt-5 flex justify-center">
          <Button
            onClick={() => setExpanded(true)}
            className="gap-2 rounded-full bg-brand px-6 py-6 text-base text-brand-foreground hover:bg-brand/90"
            size="lg"
          >
            فهمت الفكرة، اعرض التفاصيل
            <ChevronDown className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Expanded content */}
      <div
        className={cn(
          "grid transition-all duration-500 ease-out",
          expanded ? "mt-6 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            {/* Text + tabs */}
            <div>
              <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
                <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-2 bg-secondary/60 p-1.5">
                  {tabs.map((t) => {
                    const Icon = t.icon;
                    return (
                      <TabsTrigger
                        key={t.value}
                        value={t.value}
                        className="gap-2 rounded-full px-4 py-2 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground data-[state=active]:shadow-[var(--shadow-soft)]"
                      >
                        <Icon className="h-4 w-4" />
                        {t.label}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                <TabsContent value={tab} forceMount>
                  <div
                    key={tab}
                    className="animate-fade-in rounded-2xl bg-background/70 p-5 text-base leading-loose ring-1 ring-border/60"
                  >
                    <HardWordText text={currentText} words={block.hard_words} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Visual */}
            <aside className="overflow-hidden rounded-2xl bg-success-soft ring-1 ring-success/20">
              <div className="relative aspect-[4/3] w-full">
                <img
                  src={block.visual_url}
                  alt="صورة توضيحية للدرس"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-foreground/70">
                <ImageIcon className="h-4 w-4 text-success" />
                صورة توضيحية للمفهوم
              </div>
            </aside>
          </div>

          {/* Quiz */}
          <div className="mt-8 rounded-2xl border border-border/60 bg-background/80 p-5 sm:p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <CheckCircle2 className="h-5 w-5 text-success" />
              تحقق من فهمك
            </h3>
            <p className="mb-4 font-medium leading-relaxed">{block.quiz.question}</p>
            <div className="grid gap-2.5">
              {block.quiz.options.map((opt) => {
                const isSel = selected === opt;
                const showCorrect = submitted && opt === block.quiz.correct_answer;
                const showWrong = submitted && isSel && !isCorrect;
                return (
                  <button
                    key={opt}
                    onClick={() => !submitted || !isCorrect ? setSelected(opt) : null}
                    disabled={submitted && isCorrect}
                    className={cn(
                      "flex items-center justify-between rounded-xl border-2 px-4 py-3 text-right text-base transition-all",
                      "border-border bg-background hover:border-brand/50 hover:bg-brand-soft/40",
                      isSel && !submitted && "border-brand bg-brand-soft",
                      showCorrect && "border-success bg-success-soft text-foreground",
                      showWrong && "border-destructive bg-destructive/10"
                    )}
                  >
                    <span>{opt}</span>
                    {showCorrect && <CheckCircle2 className="h-5 w-5 text-success" />}
                    {showWrong && <XCircle className="h-5 w-5 text-destructive" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              {submitted && (
                <p
                  className={cn(
                    "text-sm font-semibold",
                    isCorrect ? "text-success" : "text-destructive"
                  )}
                >
                  {isCorrect
                    ? "🎉 إجابة صحيحة! يمكنك المتابعة."
                    : "حاول مرة أخرى — اختر إجابة أخرى ثم تحقق."}
                </p>
              )}
              <Button
                onClick={handleSubmit}
                disabled={!selected || (submitted && isCorrect)}
                className="mr-auto gap-2 rounded-full bg-success px-6 text-success-foreground hover:bg-success/90"
              >
                {submitted && isCorrect ? "تم ✓" : "تحقق من الإجابة"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
