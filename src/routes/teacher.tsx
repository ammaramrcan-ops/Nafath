import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Eye,
  ImagePlus,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  defaultLesson,
  type HardWord,
  type Lesson,
  type ParagraphBlock,
} from "@/lib/lesson-data";
import { LessonFlow } from "@/components/LessonFlow";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/teacher")({
  component: TeacherPage,
  head: () => ({
    meta: [{ title: "محرر الدروس — متكيف" }],
  }),
});

function emptyBlock(id: number): ParagraphBlock {
  return {
    id,
    title: "",
    short_sentence: "",
    examples: "",
    full_text: "",
    hard_words: [],
    mnemonic: "",
    funny_link: "",
    mind_map_nodes: [],
    visual_url: "",
    quizzes: {
      mcq: { question: "", options: ["", "", ""], answer: "" },
      fill: { question: "", answer: "" },
      essay: { question: "", keywords: [] },
    },
  };
}

function emptyLesson(): Lesson {
  return {
    title: "",
    estimatedTime: "",
    size: "",
    topics: [],
    blocks: [emptyBlock(1)],
  };
}

function TeacherPage() {
  const [lesson, setLesson] = useState<Lesson>(emptyLesson);
  const [previewing, setPreviewing] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const updateLesson = (patch: Partial<Lesson>) =>
    setLesson((prev) => ({ ...prev, ...patch }));

  const updateBlock = (idx: number, patch: Partial<ParagraphBlock>) =>
    setLesson((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b, i) => (i === idx ? { ...b, ...patch } : b)),
    }));

  const addBlock = () =>
    setLesson((prev) => ({
      ...prev,
      blocks: [...prev.blocks, emptyBlock(prev.blocks.length + 1)],
    }));

  const removeBlock = (idx: number) =>
    setLesson((prev) => ({
      ...prev,
      blocks: prev.blocks
        .filter((_, i) => i !== idx)
        .map((b, i) => ({ ...b, id: i + 1 })),
    }));

  const handleSave = () => {
    try {
      localStorage.setItem("teacher.lesson.draft", JSON.stringify(lesson));
      const t = new Date();
      setSavedAt(t.toLocaleTimeString("ar-EG"));
    } catch {
      setSavedAt(null);
    }
  };

  const loadDefault = () => setLesson(defaultLesson);

  if (previewing) {
    return (
      <div dir="rtl" lang="ar" className="min-h-screen bg-background font-sans">
        <div className="sticky top-0 z-10 border-b border-border bg-card/95 px-6 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <div className="text-sm font-semibold text-foreground/70">
              وضع المعاينة — هكذا سيرى الطالب الدرس
            </div>
            <button
              onClick={() => setPreviewing(false)}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background hover:bg-foreground/90"
            >
              <X className="h-4 w-4" />
              إنهاء المعاينة
            </button>
          </div>
        </div>
        <LessonFlow
          lesson={lesson}
          onExit={() => setPreviewing(false)}
          exitLabel="العودة إلى المحرر"
        />
      </div>
    );
  }

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-background font-sans">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <h1 className="text-xl font-extrabold text-foreground">محرر الدروس</h1>
            <p className="text-xs text-foreground/60">أنشئ درساً تفاعلياً بدون كتابة JSON</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {savedAt && (
              <span className="text-xs text-foreground/50">حُفظت محلياً {savedAt}</span>
            )}
            <button
              onClick={loadDefault}
              className="rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground/70 hover:border-brand/50"
            >
              تحميل قالب نموذجي
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:border-brand/50"
            >
              <Save className="h-4 w-4" /> حفظ مسودة
            </button>
            <button
              onClick={() => setPreviewing(true)}
              className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground shadow-[var(--shadow-soft)] hover:bg-brand/90"
            >
              <Eye className="h-4 w-4" /> معاينة الدرس
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm font-semibold text-foreground/60 hover:text-foreground"
            >
              <ArrowRight className="h-4 w-4" />
              للصفحة الرئيسية
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <Section title="معلومات الدرس">
          <Field label="عنوان الدرس">
            <Input
              value={lesson.title}
              onChange={(e) => updateLesson({ title: e.target.value })}
              placeholder="مثال: عملية البناء الضوئي"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="الزمن المقدّر">
              <Input
                value={lesson.estimatedTime}
                onChange={(e) => updateLesson({ estimatedTime: e.target.value })}
                placeholder="مثال: 15 دقيقة"
              />
            </Field>
            <Field label="حجم الدرس">
              <Input
                value={lesson.size}
                onChange={(e) => updateLesson({ size: e.target.value })}
                placeholder="مثال: 3 فقرات - 10 مصطلحات"
              />
            </Field>
          </div>
          <Field label="المحاور (افصل بفاصلة ,)">
            <Input
              value={lesson.topics.join("، ")}
              onChange={(e) =>
                updateLesson({
                  topics: e.target.value
                    .split(/[،,]/)
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
              placeholder="مقدمة، التفاصيل، النتائج"
            />
          </Field>
        </Section>

        <div className="mt-8 space-y-6">
          {lesson.blocks.map((block, idx) => (
            <BlockEditor
              key={idx}
              index={idx}
              block={block}
              onChange={(patch) => updateBlock(idx, patch)}
              onRemove={lesson.blocks.length > 1 ? () => removeBlock(idx) : undefined}
            />
          ))}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={addBlock}
            className="inline-flex items-center gap-2 rounded-full border-2 border-dashed border-border bg-background px-6 py-3 text-sm font-semibold text-foreground/70 transition hover:border-brand/60 hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            إضافة فقرة جديدة
          </button>
        </div>
      </main>
    </div>
  );
}

function BlockEditor({
  index,
  block,
  onChange,
  onRemove,
}: {
  index: number;
  block: ParagraphBlock;
  onChange: (patch: Partial<ParagraphBlock>) => void;
  onRemove?: () => void;
}) {
  const updateQuiz = (patch: Partial<ParagraphBlock["quizzes"]>) =>
    onChange({ quizzes: { ...block.quizzes, ...patch } });

  return (
    <Section
      title={`فقرة ${index + 1}${block.title ? ` — ${block.title}` : ""}`}
      action={
        onRemove && (
          <button
            onClick={onRemove}
            className="inline-flex items-center gap-1 rounded-full border border-destructive/40 px-3 py-1 text-xs font-semibold text-destructive hover:bg-destructive/5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            حذف
          </button>
        )
      }
    >
      <Field label="عنوان الفقرة">
        <Input
          value={block.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </Field>

      <Field label="جملة التبسيط">
        <Textarea
          value={block.short_sentence}
          onChange={(e) => onChange({ short_sentence: e.target.value })}
          rows={2}
        />
      </Field>

      <Field label="مثال توضيحي">
        <Textarea
          value={block.examples}
          onChange={(e) => onChange({ examples: e.target.value })}
          rows={2}
        />
      </Field>

      <Field
        label="النص الكامل"
        hint="استخدم سطراً جديداً لكل جملة. أضف مسافات متعددة لإبراز المصطلح."
      >
        <Textarea
          value={block.full_text}
          onChange={(e) => onChange({ full_text: e.target.value })}
          rows={5}
        />
      </Field>

      <Field label="قاعدة سريعة (Mnemonic)">
        <Input
          value={block.mnemonic}
          onChange={(e) => onChange({ mnemonic: e.target.value })}
        />
      </Field>

      <Field label="رابط ظريف يساعد على التذكر">
        <Input
          value={block.funny_link}
          onChange={(e) => onChange({ funny_link: e.target.value })}
        />
      </Field>

      <Field label="عقد الخريطة الذهنية (افصل بفاصلة)">
        <Input
          value={block.mind_map_nodes.join("، ")}
          onChange={(e) =>
            onChange({
              mind_map_nodes: e.target.value
                .split(/[،,]/)
                .map((t) => t.trim())
                .filter(Boolean),
            })
          }
        />
      </Field>

      <HardWordsEditor
        words={block.hard_words}
        onChange={(hard_words) => onChange({ hard_words })}
      />

      <ImageUploader
        url={block.visual_url ?? ""}
        onChange={(visual_url) => onChange({ visual_url })}
      />

      <SubSection title="أسئلة المراجعة">
        <Field label="سؤال اختيار من متعدد">
          <Input
            value={block.quizzes.mcq.question}
            onChange={(e) =>
              updateQuiz({
                mcq: { ...block.quizzes.mcq, question: e.target.value },
              })
            }
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          {block.quizzes.mcq.options.map((opt, i) => (
            <Field key={i} label={`الخيار ${i + 1}`}>
              <Input
                value={opt}
                onChange={(e) => {
                  const opts = [...block.quizzes.mcq.options];
                  opts[i] = e.target.value;
                  updateQuiz({ mcq: { ...block.quizzes.mcq, options: opts } });
                }}
              />
            </Field>
          ))}
        </div>
        <Field label="الإجابة الصحيحة (يجب أن تطابق أحد الخيارات)">
          <Input
            value={block.quizzes.mcq.answer}
            onChange={(e) =>
              updateQuiz({
                mcq: { ...block.quizzes.mcq, answer: e.target.value },
              })
            }
          />
        </Field>

        <Field label="سؤال إكمال (استخدم ____ مكان الفراغ)">
          <Input
            value={block.quizzes.fill.question}
            onChange={(e) =>
              updateQuiz({
                fill: { ...block.quizzes.fill, question: e.target.value },
              })
            }
          />
        </Field>
        <Field label="إجابة الإكمال">
          <Input
            value={block.quizzes.fill.answer}
            onChange={(e) =>
              updateQuiz({
                fill: { ...block.quizzes.fill, answer: e.target.value },
              })
            }
          />
        </Field>

        <Field label="سؤال علّل (مقالي)">
          <Textarea
            rows={2}
            value={block.quizzes.essay.question}
            onChange={(e) =>
              updateQuiz({
                essay: { ...block.quizzes.essay, question: e.target.value },
              })
            }
          />
        </Field>
        <Field label="الكلمات المفتاحية للإجابة (افصل بفاصلة)">
          <Input
            value={block.quizzes.essay.keywords.join("، ")}
            onChange={(e) =>
              updateQuiz({
                essay: {
                  ...block.quizzes.essay,
                  keywords: e.target.value
                    .split(/[،,]/)
                    .map((t) => t.trim())
                    .filter(Boolean),
                },
              })
            }
          />
        </Field>
      </SubSection>
    </Section>
  );
}

function HardWordsEditor({
  words,
  onChange,
}: {
  words: HardWord[];
  onChange: (words: HardWord[]) => void;
}) {
  const update = (i: number, patch: Partial<HardWord>) =>
    onChange(words.map((w, idx) => (idx === i ? { ...w, ...patch } : w)));
  const add = () => onChange([...words, { word: "", meaning: "" }]);
  const remove = (i: number) => onChange(words.filter((_, idx) => idx !== i));

  return (
    <SubSection title="المصطلحات والتعريفات">
      <div className="space-y-3">
        {words.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border bg-background/50 p-4 text-center text-sm text-foreground/50">
            لا توجد مصطلحات بعد.
          </p>
        )}
        {words.map((w, i) => (
          <div key={i} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
            <Input
              value={w.word}
              onChange={(e) => update(i, { word: e.target.value })}
              placeholder="المصطلح"
            />
            <Input
              value={w.meaning}
              onChange={(e) => update(i, { meaning: e.target.value })}
              placeholder="التعريف"
            />
            <button
              onClick={() => remove(i)}
              className="rounded-xl border border-destructive/40 px-3 text-destructive hover:bg-destructive/5"
              aria-label="حذف"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          onClick={add}
          className="inline-flex items-center gap-2 rounded-full border border-dashed border-border bg-background px-4 py-2 text-sm font-semibold text-foreground/70 hover:border-brand/60 hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          إضافة مصطلح
        </button>
      </div>
    </SubSection>
  );
}

function ImageUploader({
  url,
  onChange,
}: {
  url: string;
  onChange: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <SubSection title="صورة النص الأصلي">
      <p className="text-xs text-foreground/50">
        ارفع صورة من جهازك أو ألصق رابطاً مباشراً. (واجهة الرفع جاهزة للربط مع تخزين سحابي لاحقاً.)
      </p>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Input
          value={url}
          onChange={(e) => onChange(e.target.value)}
          placeholder="رابط الصورة (https://...)"
          dir="ltr"
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:border-brand/60"
        >
          <ImagePlus className="h-4 w-4" />
          رفع صورة
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>

      {url && (
        <div className="mt-3 flex items-start gap-3 rounded-2xl border border-border bg-background p-3">
          <img
            src={url}
            alt="معاينة"
            className="h-24 w-24 rounded-xl object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.opacity = "0.3";
            }}
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-foreground">معاينة الصورة</div>
            <div className="mt-1 truncate text-xs text-foreground/50" dir="ltr">
              {fileName ?? url}
            </div>
            <button
              onClick={() => {
                onChange("");
                setFileName(null);
              }}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-destructive hover:underline"
            >
              <Trash2 className="h-3 w-3" />
              إزالة
            </button>
          </div>
        </div>
      )}
    </SubSection>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {action}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-background/50 p-4">
      <h3 className="mb-3 text-sm font-bold text-foreground/80">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-semibold text-foreground/80">{label}</div>
      {children}
      {hint && <div className="mt-1 text-xs text-foreground/50">{hint}</div>}
    </label>
  );
}
