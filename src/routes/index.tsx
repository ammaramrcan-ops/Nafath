import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { type Lesson } from "@/lib/lesson-data";
import { HomeUpload } from "@/components/HomeUpload";
import { LessonFlow } from "@/components/LessonFlow";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "متكيف — منصة التعلم المتكيف" },
      {
        name: "description",
        content: "ارفع درسك واحصل على تجربة تعلم متكيفة بمراحل تدريجية وخرائط ذهنية وبطاقات مراجعة.",
      },
    ],
  }),
});

function Index() {
  const [lesson, setLesson] = useState<Lesson | null>(null);

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-background font-sans">
      {!lesson && (
        <>
          <div className="mx-auto flex max-w-5xl justify-end px-6 pt-6">
            <Link
              to="/teacher"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground/80 transition hover:border-brand/50 hover:text-foreground"
            >
              <Pencil className="h-4 w-4" />
              واجهة المعلم
            </Link>
          </div>
          <HomeUpload onLoad={setLesson} />
        </>
      )}
      {lesson && <LessonFlow lesson={lesson} onExit={() => setLesson(null)} />}
    </div>
  );
}
