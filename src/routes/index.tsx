import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { blocks } from "@/lib/lesson-data";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { ParagraphBlockCard } from "@/components/ParagraphBlock";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "متكيف — درس البناء الضوئي" },
      {
        name: "description",
        content: "منصة تعلم متكيفة بأسلوب هادئ ومركّز لتقديم الدروس بصيغ متعددة.",
      },
    ],
  }),
});

function Index() {
  const [started, setStarted] = useState(false);
  const [blockIdx, setBlockIdx] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-background font-sans">
      {!started ? (
        <WelcomeScreen onStart={() => setStarted(true)} />
      ) : blockIdx >= blocks.length ? (
        <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
          <h2 className="text-3xl font-extrabold">🎉 أتممت الدرس!</h2>
          <p className="mt-4 text-foreground/60">
            أحسنت — لقد فهمت عملية البناء الضوئي بكل تفاصيلها.
          </p>
          <Button
            onClick={() => {
              setStarted(false);
              setBlockIdx(0);
              setCompleted(new Set());
            }}
            className="mt-10 rounded-full bg-brand px-8 py-6 text-brand-foreground hover:bg-brand/90"
          >
            ابدأ من جديد
          </Button>
        </div>
      ) : (
        <>
          <ParagraphBlockCard
            key={blocks[blockIdx].id}
            block={blocks[blockIdx]}
            onComplete={() =>
              setCompleted((prev) => new Set(prev).add(blocks[blockIdx].id))
            }
          />
          {completed.has(blocks[blockIdx].id) && (
            <div className="mx-auto max-w-2xl px-6 pb-16 text-center">
              <Button
                onClick={() => setBlockIdx((i) => i + 1)}
                size="lg"
                className="rounded-full bg-success px-10 py-6 text-success-foreground hover:bg-success/90"
              >
                {blockIdx + 1 < blocks.length ? "الفقرة التالية ←" : "إنهاء الدرس"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
