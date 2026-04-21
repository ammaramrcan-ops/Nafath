import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { type Lesson } from "@/lib/lesson-data";
import { saveToLibrary } from "@/lib/lesson-library";
import { HomeUpload } from "@/components/HomeUpload";
import { LessonFlow } from "@/components/LessonFlow";
import { LessonLibrary } from "@/components/LessonLibrary";
import { SettingsButton } from "@/components/SettingsDialog";

export const Route = createFileRoute("/")({
  component: Index,
  prerender: true,
  head: () => ({
    meta: [
      { title: "نفاذ" },
      {
        name: "description",
        content: "ارفع درسك واحصل على تجربة تعلم نفاذ بمراحل تدريجية وخرائط ذهنية وبطاقات مراجعة.",
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

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-background font-sans">
      {!lesson && (
        <>
          <div className="mx-auto flex max-w-5xl items-center justify-end gap-2 px-6 pt-6">
            <SettingsButton />
            <Link
              to="/teacher"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground/80 transition hover:border-brand/50 hover:text-foreground"
            >
              <Pencil className="h-4 w-4" />
              واجهة المعلم
            </Link>
          </div>
          <div className="mx-auto max-w-2xl px-6">
            <HomeUpload onLoad={handleLoad} />
            <LessonLibrary onOpen={setLesson} />
          </div>
        </>
      )}
      {lesson && <LessonFlow lesson={lesson} onExit={() => setLesson(null)} />}
    </div>
  );
}
