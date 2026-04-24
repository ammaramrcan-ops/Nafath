import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Plus, FolderOpen, Trash2, Layers } from "lucide-react";
import { getSubject, addUnit, deleteUnit, type Subject } from "@/lib/curriculum";
import { PromptDialog } from "@/components/PromptDialog";

export const Route = createFileRoute("/subjects/$subjectId")({
  component: SubjectPage,
  notFoundComponent: () => (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-zen-surface">
      <div className="text-center">
        <p className="text-zen-on-surface-variant">المادة غير موجودة</p>
        <Link to="/subjects" className="mt-4 inline-block text-zen-primary">
          ← العودة للمواد
        </Link>
      </div>
    </div>
  ),
});

function SubjectPage() {
  const { subjectId } = Route.useParams();
  const [subject, setSubject] = useState<Subject | undefined>(undefined);
  const [addOpen, setAddOpen] = useState(false);
  const navigate = useNavigate();

  const refresh = () => setSubject(getSubject(subjectId));

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [subjectId]);

  if (!subject) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-zen-surface">
        <div className="text-center">
          <p className="text-zen-on-surface-variant">المادة غير موجودة</p>
          <Link to="/subjects" className="mt-4 inline-block text-zen-primary">
            ← العودة للمواد
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-zen-surface text-zen-on-surface antialiased">
      <header className="fixed inset-x-0 top-0 z-40 bg-white/80 backdrop-blur-md">
        <div className="relative mx-auto flex w-full max-w-[640px] items-center justify-between px-6 py-5 sm:px-8">
          <Link
            to="/subjects"
            className="flex items-center gap-1 rounded-full p-2 text-zen-on-surface-variant transition hover:bg-zen-surface-low"
            aria-label="رجوع"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
          </Link>
          <div className="absolute left-1/2 -translate-x-1/2 text-[17px] font-medium text-zen-on-surface line-clamp-1">
            {subject.name}
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-zen-primary px-4 py-2 text-[13px] font-medium text-white transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            وحدة
          </button>
        </div>
      </header>

      <main className="relative mx-auto min-h-screen w-full max-w-[640px] px-6 pb-24 pt-28 sm:pt-32">
        <div className="mb-6 text-[13px] font-medium text-zen-on-surface-variant">
          <Link to="/subjects" className="hover:text-zen-primary">المواد</Link>
          <span className="mx-2">/</span>
          <span>{subject.name}</span>
        </div>

        {subject.units.length === 0 ? (
          <div className="mt-16 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[var(--shadow-deep)]">
              <Layers className="h-7 w-7 text-zen-on-surface-variant/50" strokeWidth={1.5} />
            </div>
            <p className="text-[15px] font-medium text-zen-on-surface-variant">لا توجد وحدات بعد</p>
            <button
              onClick={() => setAddOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-zen-primary px-5 py-2.5 text-[13px] font-medium text-white"
            >
              <Plus className="h-4 w-4" /> إضافة وحدة
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {subject.units.map((u) => (
              <div
                key={u.id}
                className="group relative rounded-2xl border border-white bg-white p-6 shadow-[var(--shadow-deep)] transition hover:-translate-y-0.5"
              >
                <button
                  onClick={() => {
                    if (confirm(`حذف وحدة "${u.name}"؟`)) {
                      deleteUnit(subject.id, u.id);
                      refresh();
                    }
                  }}
                  className="absolute left-3 top-3 rounded-full p-1.5 text-zen-on-surface-variant/40 opacity-0 transition group-hover:opacity-100 hover:bg-zen-surface-low hover:text-destructive"
                  aria-label="حذف"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() =>
                    navigate({
                      to: "/subjects/$subjectId/units/$unitId",
                      params: { subjectId: subject.id, unitId: u.id },
                    })
                  }
                  className="block w-full text-right"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zen-surface-container text-zen-primary">
                    <FolderOpen className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-[18px] font-medium text-zen-on-surface line-clamp-1">
                    {u.name}
                  </h3>
                  <p className="mt-1 text-[12px] font-medium text-zen-on-surface-variant">
                    {u.lessonIds.length} درس
                  </p>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <PromptDialog
        open={addOpen}
        title="وحدة جديدة"
        placeholder="مثال: الفصل الأول"
        confirmLabel="إضافة"
        onConfirm={(name) => {
          addUnit(subject.id, name);
          setAddOpen(false);
          refresh();
        }}
        onClose={() => setAddOpen(false)}
      />
    </div>
  );
}
