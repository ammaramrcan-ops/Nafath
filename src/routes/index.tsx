import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap, Sparkles } from "lucide-react";
import { lesson } from "@/lib/lesson-data";
import { ParagraphBlockCard } from "@/components/ParagraphBlock";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "منصة التعلم المتكيف — درس البناء الضوئي" },
      {
        name: "description",
        content:
          "منصة تعلم تفاعلية تستخدم التدرج المعرفي وصيغ المحتوى المتعددة لتقديم الدروس بأسلوب مبسط وممتع.",
      },
    ],
  }),
});

function Index() {
  const [unlockedIndex, setUnlockedIndex] = useState(0);

  return (
    <div dir="rtl" lang="ar" className="min-h-screen font-sans">
      {/* Hero header */}
      <header className="bg-[image:var(--gradient-hero)]">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
          <div className="flex items-center gap-3 text-brand">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-brand-foreground shadow-[var(--shadow-soft)]">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground/60">منصة التعلم المتكيف</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                {lesson.title}
              </h1>
            </div>
          </div>

          <p className="mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-foreground/70">
            تعلّم خطوة بخطوة بأسلوب التدرج المعرفي: ابدأ بفكرة بسيطة، ثم اكتشف
            التفاصيل، وجرّب الصيغ المختلفة (قصة، أمثلة، روابط ذهنية)، وأجب على
            السؤال للتقدم.
          </p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-background/70 px-4 py-2 text-sm text-foreground/70 ring-1 ring-border/60 backdrop-blur">
            <Sparkles className="h-4 w-4 text-success" />
            {lesson.blocks.length} فقرة تعليمية تفاعلية
          </div>
        </div>
      </header>

      {/* Lesson body */}
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="space-y-8">
          {lesson.blocks.map((block, i) => (
            <ParagraphBlockCard
              key={block.id}
              block={block}
              index={i}
              locked={i > unlockedIndex}
              onPass={() => setUnlockedIndex((u) => Math.max(u, i + 1))}
            />
          ))}
        </div>

        <footer className="mt-12 border-t border-border/60 pt-6 text-center text-sm text-foreground/50">
          صُمم بعناية لتجربة تعلم هادئة ومركّزة 🌱
        </footer>
      </main>
    </div>
  );
}
