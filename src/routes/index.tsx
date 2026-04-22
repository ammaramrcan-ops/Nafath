import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { type Lesson } from "@/lib/lesson-data";
import { saveToLibrary } from "@/lib/lesson-library";
import { LessonFlow } from "@/components/LessonFlow";
import { ZenHome } from "@/components/ZenHome";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "نفاذ" },
      {
        name: "description",
        content: "نفاذ — منصة تعلم هادئة بتصميم Zen، ارفع درسك واحصل على تجربة تفاعلية متدرجة.",
      },
    ],
  }),
});

function Index() {
  const [lesson, setLesson] = useState<Lesson | null>(null);

  const handleLoad = (l: Lesson) => {
    saveToLibrary(l);
    setLesson(l);
  };

  if (lesson) {
    return (
      <div dir="rtl" lang="ar" className="min-h-screen bg-zen-surface font-sans">
        <LessonFlow lesson={lesson} onExit={() => setLesson(null)} />
      </div>
    );
  }

  return <ZenHome onOpenLesson={handleLoad} />;
}
