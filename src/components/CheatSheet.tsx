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
      lesson.blocks.flatMap((b) =>
        (b.quizzes?.essays ?? [])
          .filter((e) => e.question?.trim())
          .map((e) => ({
            blockTitle: b.title,
            question: e.question,
            keywords: e.keywords ?? [],
          })),
      ),
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
    <section className="rounded-[28px] bg-white p-8 shadow-[var(--shadow-deep)] sm:p-12">
      <header className="mb-12 text-center">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-zen-surface-low text-zen-primary">
          <Sparkles className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <h2 className="text-[28px] font-medium leading-tight text-zen-on-surface">الزتونة</h2>
        <p className="mt-3 text-[13px] font-light leading-relaxed text-zen-on-surface-variant">
          ملخص شامل لأهم ما ورد في الدرس — التعاريف، أسئلة علّل، والتفسيرات الذكية
        </p>
      </header>

      <div className="space-y-12">
        <CheatBlock
          icon={<BookOpen className="h-4 w-4" strokeWidth={1.75} />}
          title="أهم التعريفات"
          count={definitions.length}
        >
          {definitions.length === 0 ? (
            <Empty>لا توجد مصطلحات مسجّلة في هذا الدرس.</Empty>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {definitions.map((d, i) => (
                <li key={`${d.word}-${i}`} className="rounded-2xl bg-zen-surface-low p-5">
                  <div className="text-[11px] font-light text-zen-on-surface-variant">
                    {d.blockTitle}
                  </div>
                  <div className="mt-1.5 text-[15px] font-medium text-zen-primary">{d.word}</div>
                  <div className="mt-1.5 text-[13px] font-light leading-relaxed text-zen-on-surface">
                    {d.meaning}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CheatBlock>

        <CheatBlock
          icon={<HelpCircle className="h-4 w-4" strokeWidth={1.75} />}
          title="أسئلة علّل"
          count={essays.length}
        >
          {essays.length === 0 ? (
            <Empty>لا توجد أسئلة مقالية لهذا الدرس.</Empty>
          ) : (
            <ol className="space-y-3">
              {essays.map((e, i) => (
                <li key={i} className="rounded-2xl bg-zen-surface-low p-5">
                  <div className="text-[11px] font-light text-zen-on-surface-variant">
                    {e.blockTitle}
                  </div>
                  <div className="mt-1.5 text-[14px] font-medium leading-relaxed text-zen-on-surface">
                    {e.question}
                  </div>
                  {e.keywords.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {e.keywords.map((k) => (
                        <span
                          key={k}
                          className="rounded-full bg-white px-3 py-1 text-[11px] font-light text-zen-on-surface-variant"
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
          icon={<Lightbulb className="h-4 w-4" strokeWidth={1.75} />}
          title="التفسيرات والروابط الذكية"
          count={explanations.length}
        >
          <ul className="space-y-3">
            {explanations.map((e, i) => (
              <li key={i} className="rounded-2xl bg-zen-surface-low p-5">
                <div className="text-[11px] font-light text-zen-on-surface-variant">
                  {e.blockTitle}
                </div>
                <div className="mt-1.5 text-[14px] font-medium leading-relaxed text-zen-on-surface">
                  {e.short}
                </div>
                {e.mnemonic && (
                  <div className="mt-2 text-[13px] font-light leading-relaxed text-zen-on-surface">
                    <span className="font-medium text-zen-primary">قاعدة سريعة: </span>
                    {e.mnemonic}
                  </div>
                )}
                {e.funny && (
                  <div className="mt-1 text-[13px] font-light leading-relaxed text-zen-on-surface-variant">
                    <span className="font-medium text-zen-on-surface">رابط ظريف: </span>
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
      <div className="mb-5 flex items-center gap-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zen-surface-low text-zen-primary">
          {icon}
        </span>
        <h3 className="text-[16px] font-medium text-zen-on-surface">{title}</h3>
        <span className="text-[11px] font-light text-zen-on-surface-variant">{count}</span>
      </div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl bg-zen-surface-low p-5 text-center text-[13px] font-light text-zen-on-surface-variant">
      {children}
    </p>
  );
}
