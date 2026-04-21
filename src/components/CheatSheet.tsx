import { useMemo } from "react";
import { BookOpen, HelpCircle, Lightbulb, Sparkles } from "lucide-react";
import type { Lesson } from "@/lib/lesson-data";

export function CheatSheet({ lesson }: { lesson: Lesson }) {
  const definitions = useMemo(
    () =>
      lesson.blocks.flatMap((b) =>
        b.hard_words.map((w) => ({ ...w, blockTitle: b.title })),
      ),
    [lesson],
  );

  const essays = useMemo(
    () =>
      lesson.blocks
        .filter((b) => b.quizzes?.essay?.question)
        .map((b) => ({
          blockTitle: b.title,
          question: b.quizzes.essay.question,
          keywords: b.quizzes.essay.keywords ?? [],
        })),
    [lesson],
  );

  const explanations = useMemo(
    () =>
      lesson.blocks.map((b) => ({
        blockTitle: b.title,
        short: b.short_sentence,
        mnemonic: b.mnemonic,
        funny: b.funny_link,
      })),
    [lesson],
  );

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-10">
      <header className="mb-8 text-center">
        <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
          <Sparkles className="h-7 w-7" />
        </div>
        <h2 className="text-3xl font-extrabold text-foreground">الزتونة</h2>
        <p className="mt-2 text-sm text-foreground/60">
          ملخص شامل لأهم ما ورد في الدرس — التعاريف، أسئلة علّل، والتفسيرات الذكية
        </p>
      </header>

      <div className="space-y-10">
        <CheatBlock
          icon={<BookOpen className="h-5 w-5" />}
          title="أهم التعريفات"
          count={definitions.length}
        >
          {definitions.length === 0 ? (
            <Empty>لا توجد مصطلحات مسجّلة في هذا الدرس.</Empty>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {definitions.map((d, i) => (
                <li
                  key={`${d.word}-${i}`}
                  className="rounded-2xl border border-border bg-background p-4"
                >
                  <div className="text-xs font-medium text-foreground/40">{d.blockTitle}</div>
                  <div className="mt-1 text-base font-bold text-brand">{d.word}</div>
                  <div className="mt-1 text-sm leading-relaxed text-foreground/80">
                    {d.meaning}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CheatBlock>

        <CheatBlock
          icon={<HelpCircle className="h-5 w-5" />}
          title="أسئلة علّل"
          count={essays.length}
        >
          {essays.length === 0 ? (
            <Empty>لا توجد أسئلة مقالية لهذا الدرس.</Empty>
          ) : (
            <ol className="space-y-3">
              {essays.map((e, i) => (
                <li
                  key={i}
                  className="rounded-2xl border border-border bg-background p-4"
                >
                  <div className="text-xs font-medium text-foreground/40">{e.blockTitle}</div>
                  <div className="mt-1 text-base font-semibold text-foreground">
                    {e.question}
                  </div>
                  {e.keywords.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {e.keywords.map((k) => (
                        <span
                          key={k}
                          className="rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-foreground/80"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </CheatBlock>

        <CheatBlock
          icon={<Lightbulb className="h-5 w-5" />}
          title="التفسيرات والروابط الذكية"
          count={explanations.length}
        >
          <ul className="space-y-3">
            {explanations.map((e, i) => (
              <li
                key={i}
                className="rounded-2xl border border-border bg-background p-4"
              >
                <div className="text-xs font-medium text-foreground/40">{e.blockTitle}</div>
                <div className="mt-1 text-base font-semibold text-foreground">{e.short}</div>
                {e.mnemonic && (
                  <div className="mt-2 text-sm text-foreground/80">
                    <span className="font-semibold text-brand">قاعدة سريعة: </span>
                    {e.mnemonic}
                  </div>
                )}
                {e.funny && (
                  <div className="mt-1 text-sm text-foreground/70">
                    <span className="font-semibold text-warning">رابط ظريف: </span>
                    {e.funny}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </CheatBlock>
      </div>
    </section>
  );
}

function CheatBlock({
  icon,
  title,
  count,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand">
          {icon}
        </span>
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground/60">
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-border bg-background/50 p-4 text-center text-sm text-foreground/50">
      {children}
    </p>
  );
}
