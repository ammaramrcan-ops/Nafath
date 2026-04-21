import { useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  ImagePlus,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  defaultLesson,
  effectiveStages,
  normalizeBlock,
  type HardWord,
  type Lesson,
  type ParagraphBlock,
} from "@/lib/lesson-data";
import { ParagraphBlockCard } from "@/components/ParagraphBlock";
import { LessonFlow } from "@/components/LessonFlow";
import { SettingsButton } from "@/components/SettingsDialog";
import { useSettings, STAGE_LABELS, DEFAULT_STAGE_ORDER, type Stage } from "@/lib/settings";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/teacher")({
  component: TeacherPage,
  prerender: true,
  head: () => ({
    meta: [{ title: "محرر الدروس — متكيف" }],
  }),
});

function emptyBlock(id: number): ParagraphBlock {
  return normalizeBlock(
    {
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
      enabled_stages: DEFAULT_STAGE_ORDER,
      stage_order: DEFAULT_STAGE_ORDER,
      quizzes: { mcqs: [], fills: [], essays: [] },
    },
    id - 1,
  );
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

const STORAGE_KEY = "teacher.lesson.draft";

function TeacherPage() {
  const [lesson, setLesson] = useState<Lesson>(() => {
    if (typeof window === "undefined") return emptyLesson();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...parsed,
          blocks: (parsed.blocks ?? []).map((b: any, i: number) => normalizeBlock(b, i)),
        };
      }
    } catch {
      /* ignore */
    }
    return emptyLesson();
  });
  const [step, setStep] = useState(0); // 0 = info, 1..N = blocks, N+1 = full preview
  const [previewMode, setPreviewMode] = useState<"edit" | "preview">("edit");
  const [fullPreview, setFullPreview] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const totalSteps = 1 + lesson.blocks.length; // info + blocks
  const isInfoStep = step === 0;
  const blockIdx = step - 1;

  const updateLesson = (patch: Partial<Lesson>) =>
    setLesson((prev) => ({ ...prev, ...patch }));

  const updateBlock = (idx: number, patch: Partial<ParagraphBlock>) =>
    setLesson((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b, i) => (i === idx ? { ...b, ...patch } : b)),
    }));

  const addBlock = () => {
    setLesson((prev) => ({
      ...prev,
      blocks: [...prev.blocks, emptyBlock(prev.blocks.length + 1)],
    }));
    setStep(lesson.blocks.length + 1); // jump to new block
  };

  const removeBlock = (idx: number) => {
    setLesson((prev) => ({
      ...prev,
      blocks: prev.blocks
        .filter((_, i) => i !== idx)
        .map((b, i) => ({ ...b, id: i + 1 })),
    }));
    setStep((s) => Math.min(s, lesson.blocks.length - 1));
  };

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lesson));
      setSavedAt(new Date().toLocaleTimeString("ar-EG"));
    } catch {
      setSavedAt(null);
    }
  };

  const loadDefault = () => {
    setLesson(defaultLesson);
    setStep(0);
  };

  if (fullPreview) {
    return (
      <div dir="rtl" lang="ar" className="min-h-screen bg-background font-sans">
        <div className="sticky top-0 z-10 border-b border-border bg-card/95 px-6 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <div className="text-sm font-semibold text-foreground/70">
              معاينة الدرس الكامل — هكذا سيرى الطالب الدرس
            </div>
            <button
              onClick={() => setFullPreview(false)}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background hover:bg-foreground/90"
            >
              <X className="h-4 w-4" />
              إنهاء المعاينة
            </button>
          </div>
        </div>
        <LessonFlow
          lesson={lesson}
          onExit={() => setFullPreview(false)}
          exitLabel="العودة إلى المحرر"
        />
      </div>
    );
  }

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-background font-sans">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm font-semibold text-foreground/60 hover:text-foreground"
            >
              <ArrowRight className="h-4 w-4" />
              الرئيسية
            </Link>
            <div className="hidden h-6 w-px bg-border sm:block" />
            <div className="hidden sm:block">
              <h1 className="text-base font-extrabold text-foreground">محرر الدروس</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {savedAt && <span className="text-xs text-foreground/50">حُفظت {savedAt}</span>}
            <SettingsButton />
            <button
              onClick={loadDefault}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground/70 hover:border-brand/50"
            >
              قالب نموذجي
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:border-brand/50"
            >
              <Save className="h-3.5 w-3.5" /> حفظ
            </button>
            <button
              onClick={() => setFullPreview(true)}
              className="inline-flex items-center gap-1 rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-brand-foreground hover:bg-brand/90"
            >
              <Eye className="h-3.5 w-3.5" /> معاينة كاملة
            </button>
          </div>
        </div>

        {/* Step indicator */}
        <div className="border-t border-border/60 bg-background/50 px-6 py-3">
          <div className="mx-auto flex max-w-5xl items-center gap-2 overflow-x-auto">
            <StepChip
              label="معلومات الدرس"
              active={step === 0}
              onClick={() => setStep(0)}
            />
            {lesson.blocks.map((b, i) => (
              <StepChip
                key={i}
                label={`فقرة ${i + 1}${b.title ? `: ${b.title}` : ""}`}
                active={step === i + 1}
                onClick={() => setStep(i + 1)}
              />
            ))}
            <button
              onClick={addBlock}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-semibold text-foreground/60 hover:border-brand/50 hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              فقرة
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {isInfoStep ? (
          <LessonInfoStep lesson={lesson} onChange={updateLesson} />
        ) : (
          <BlockStep
            block={lesson.blocks[blockIdx]}
            blockNum={blockIdx + 1}
            total={lesson.blocks.length}
            mode={previewMode}
            onModeChange={setPreviewMode}
            onChange={(patch) => updateBlock(blockIdx, patch)}
            onRemove={lesson.blocks.length > 1 ? () => removeBlock(blockIdx) : undefined}
          />
        )}

        {/* Wizard footer nav */}
        <div className="mt-10 flex items-center justify-between gap-3">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2 text-sm font-semibold text-foreground/70 hover:border-brand/50 disabled:opacity-30"
          >
            <ArrowRight className="h-4 w-4" />
            السابق
          </button>
          <span className="text-xs text-foreground/50">
            {step + 1} / {totalSteps}
          </span>
          {step < totalSteps - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
            >
              التالي
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => setFullPreview(true)}
              className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
            >
              <Eye className="h-4 w-4" />
              معاينة كاملة
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

function StepChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition",
        active
          ? "bg-brand text-brand-foreground shadow-sm"
          : "border border-border bg-background text-foreground/70 hover:border-brand/50 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function LessonInfoStep({
  lesson,
  onChange,
}: {
  lesson: Lesson;
  onChange: (patch: Partial<Lesson>) => void;
}) {
  return (
    <Section title="معلومات الدرس" subtitle="ابدأ بتعريف الدرس وتحديد محاوره الأساسية.">
      <Field label="عنوان الدرس">
        <Input
          value={lesson.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="مثال: عملية البناء الضوئي"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="الزمن المقدّر">
          <Input
            value={lesson.estimatedTime}
            onChange={(e) => onChange({ estimatedTime: e.target.value })}
            placeholder="مثال: 15 دقيقة"
          />
        </Field>
        <Field label="حجم الدرس">
          <Input
            value={lesson.size}
            onChange={(e) => onChange({ size: e.target.value })}
            placeholder="مثال: 3 فقرات - 10 مصطلحات"
          />
        </Field>
      </div>
      <Field label="المحاور (افصل بفاصلة)">
        <Input
          value={lesson.topics.join("، ")}
          onChange={(e) =>
            onChange({
              topics: e.target.value.split(/[،,]/).map((t) => t.trim()).filter(Boolean),
            })
          }
          placeholder="مقدمة، التفاصيل، النتائج"
        />
      </Field>
    </Section>
  );
}

function BlockStep({
  block,
  blockNum,
  total,
  mode,
  onModeChange,
  onChange,
  onRemove,
}: {
  block: ParagraphBlock;
  blockNum: number;
  total: number;
  mode: "edit" | "preview";
  onModeChange: (m: "edit" | "preview") => void;
  onChange: (patch: Partial<ParagraphBlock>) => void;
  onRemove?: () => void;
}) {
  const { settings } = useSettings();
  const previewStages = useMemo(
    () => effectiveStages(block, settings.stageOrder),
    [block, settings.stageOrder],
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-brand">فقرة {blockNum} / {total}</div>
          <h2 className="mt-1 text-2xl font-extrabold text-foreground">
            {block.title || "فقرة بدون عنوان"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-full border border-border bg-background p-1">
            <button
              onClick={() => onModeChange("edit")}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition",
                mode === "edit" ? "bg-brand text-brand-foreground" : "text-foreground/60",
              )}
            >
              تحرير
            </button>
            <button
              onClick={() => onModeChange("preview")}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition",
                mode === "preview" ? "bg-brand text-brand-foreground" : "text-foreground/60",
              )}
            >
              معاينة الفقرة
            </button>
          </div>
          {onRemove && (
            <button
              onClick={onRemove}
              className="inline-flex items-center gap-1 rounded-full border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/5"
            >
              <Trash2 className="h-3.5 w-3.5" /> حذف الفقرة
            </button>
          )}
        </div>
      </div>

      {mode === "preview" ? (
        <div className="rounded-3xl border border-border bg-card p-2">
          {previewStages.length === 0 ? (
            <p className="p-12 text-center text-sm text-foreground/50">
              لا توجد مراحل مفعّلة لهذه الفقرة. فعّل مرحلة واحدة على الأقل من تبويب التحرير.
            </p>
          ) : (
            <ParagraphBlockCard
              key={`${block.id}-preview-${previewStages.join("|")}`}
              block={block}
              stageOrder={previewStages}
              onComplete={() => {
                /* noop in preview */
              }}
            />
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <Section title="عنوان الفقرة">
            <Input
              value={block.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="مثال: مقدمة الغذاء"
            />
          </Section>

          <StagesEditor block={block} onChange={onChange} />

          <HardWordsEditor
            words={block.hard_words}
            onChange={(hard_words) => onChange({ hard_words })}
          />

          <QuizzesEditor block={block} onChange={onChange} />

          <QuizzesEditor block={block} onChange={onChange} />

          <div className="mt-6 space-y-4 rounded-2xl border border-border bg-background p-4">
            <h3 className="text-sm font-semibold text-foreground">إعدادات الفاصل الزمني (بعد هذه الفقرة)</h3>
            
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground">تفعيل فاصل الراحة</label>
                <p className="text-xs text-foreground/70">هل تريد إضافة استراحة تنفس بعد إتمام هذه الفقرة؟</p>
              </div>
              <button
                onClick={() => onChange({ enable_break: block.enable_break === false ? true : false })}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${block.enable_break !== false ? "bg-brand" : "bg-border"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${block.enable_break !== false ? "-translate-x-6" : "-translate-x-1"}`} />
              </button>
            </div>

            {block.enable_break !== false && (
              <div className="pt-2">
                <Field label="مدة الاستراحة (بالثواني)">
                  <Input
                    type="number"
                    min={5}
                    max={300}
                    value={block.break_duration ?? 60}
                    onChange={(e) => onChange({ break_duration: parseInt(e.target.value) || 60 })}
                    placeholder="60"
                  />
                </Field>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Stages Editor ---------------- */

function StagesEditor({
  block,
  onChange,
}: {
  block: ParagraphBlock;
  onChange: (patch: Partial<ParagraphBlock>) => void;
}) {
  const order: Stage[] =
    block.stage_order && block.stage_order.length === DEFAULT_STAGE_ORDER.length
      ? block.stage_order
      : DEFAULT_STAGE_ORDER;
  const enabled = new Set<Stage>(block.enabled_stages ?? DEFAULT_STAGE_ORDER);

  const setOrder = (next: Stage[]) => onChange({ stage_order: next });
  const setEnabled = (s: Stage, on: boolean) => {
    const next = new Set(enabled);
    if (on) next.add(s);
    else next.delete(s);
    onChange({ enabled_stages: Array.from(next) });
  };

  const move = (i: number, dir: -1 | 1) => {
    const next = [...order];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
  };

  return (
    <Section
      title="مراحل عرض الفقرة"
      subtitle="فعّل المراحل التي تريدها ورتّبها بالترتيب الذي يظهر للطالب. كل مرحلة لها محتواها الخاص أدناه."
    >
      <div className="space-y-3">
        {order.map((stage, i) => {
          const isOn = enabled.has(stage);
          return (
            <div
              key={stage}
              className={cn(
                "rounded-2xl border bg-background transition",
                isOn ? "border-border" : "border-dashed border-border/50 opacity-70",
              )}
            >
              <div className="flex items-center justify-between gap-2 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand">
                    {i + 1}
                  </span>
                  <span className="text-sm font-bold text-foreground">{STAGE_LABELS[stage]}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="rounded-lg p-1.5 text-foreground/60 hover:bg-muted disabled:opacity-30"
                    aria-label="إلى الأعلى"
                    title="إلى الأعلى"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === order.length - 1}
                    className="rounded-lg p-1.5 text-foreground/60 hover:bg-muted disabled:opacity-30"
                    aria-label="إلى الأسفل"
                    title="إلى الأسفل"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEnabled(stage, !isOn)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition",
                      isOn
                        ? "border-success/40 bg-success-soft text-success"
                        : "border-border bg-background text-foreground/50",
                    )}
                    title={isOn ? "إخفاء هذه المرحلة" : "تفعيل هذه المرحلة"}
                  >
                    {isOn ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {isOn ? "مفعّلة" : "معطّلة"}
                  </button>
                </div>
              </div>
              {isOn && (
                <div className="border-t border-border/60 px-4 py-3">
                  <StageContentField stage={stage} block={block} onChange={onChange} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function StageContentField({
  stage,
  block,
  onChange,
}: {
  stage: Stage;
  block: ParagraphBlock;
  onChange: (patch: Partial<ParagraphBlock>) => void;
}) {
  switch (stage) {
    case "short":
      return (
        <div className="space-y-3">
          <Field label="الجملة المبسطة" hint="جملة واحدة قصيرة تلخّص فكرة الفقرة.">
            <Textarea
              value={block.short_sentence}
              onChange={(e) => onChange({ short_sentence: e.target.value })}
              rows={2}
              placeholder="مثال: النباتات تصنع طعامها بنفسها باستخدام الضوء."
            />
          </Field>
          <StageIntervalSettings stage={stage} block={block} onChange={onChange} />
        </div>
      );
    case "examples":
      return (
        <div className="space-y-3">
          <Field label="مثال توضيحي / قصة" hint="مثال ملموس أو قصة تربط الفكرة بالواقع.">
            <Textarea
              value={block.examples}
              onChange={(e) => onChange({ examples: e.target.value })}
              rows={3}
              placeholder="مثال: مثل شجرة التفاح التي تبني خشبها وثمارها من الهواء والماء."
            />
          </Field>
          <StageIntervalSettings stage={stage} block={block} onChange={onChange} />
        </div>
      );
    case "original":
      return (
        <div className="space-y-3">
          <Field
            label="النص الكامل"
            hint="استخدم سطراً جديداً لكل جملة. هذه المرحلة تحتوي على صندوق التفريغ الذهني."
          >
            <Textarea
              value={block.full_text}
              onChange={(e) => onChange({ full_text: e.target.value })}
              rows={5}
              placeholder="اكتب هنا النص الكامل للفقرة..."
            />
          </Field>
          <ImageUploader
            url={block.visual_url ?? ""}
            onChange={(visual_url) => onChange({ visual_url })}
          />
          <StageIntervalSettings stage={stage} block={block} onChange={onChange} />
        </div>
      );
    case "mental":
      return (
        <div className="space-y-3">
          <Field label="قاعدة سريعة (Mnemonic)">
            <Input
              value={block.mnemonic}
              onChange={(e) => onChange({ mnemonic: e.target.value })}
              placeholder="مثال: نبات = مصنع صامت."
            />
          </Field>
          <Field label="رابط ظريف يساعد على التذكر">
            <Input
              value={block.funny_link}
              onChange={(e) => onChange({ funny_link: e.target.value })}
              placeholder="مثال: النبات كائن فضائي بيشرب من رجله!"
            />
          </Field>
          <StageIntervalSettings stage={stage} block={block} onChange={onChange} />
        </div>
      );
    case "mindmap":
      return (
        <div className="space-y-3">
          <Field label="عقد الخريطة الذهنية" hint="افصل بين العقد بفاصلة (،).">
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
              placeholder="ذاتي التغذية، صنع الغذاء، طاقة الشمس"
            />
          </Field>
          <StageIntervalSettings stage={stage} block={block} onChange={onChange} />
        </div>
      );
  }
}

function StageIntervalSettings({
  stage,
  block,
  onChange,
}: {
  stage: Stage;
  block: ParagraphBlock;
  onChange: (patch: Partial<ParagraphBlock>) => void;
}) {
  const enabled = block.enable_stage_intervals?.[stage] ?? true;
  const duration = block.stage_intervals?.[stage] ?? 15;

  return (
    <div className="mt-3 rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">الفاصل الزمني التلقائي</p>
          <p className="text-xs text-foreground/60 mt-0.5">منع الطالب من التخطي السريع للمرحلة القادمة.</p>
        </div>
        <button
          onClick={() => {
            const next = { ...(block.enable_stage_intervals || {}) };
            next[stage] = !enabled;
            onChange({ enable_stage_intervals: next });
          }}
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${enabled ? "bg-brand" : "bg-border"}`}
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-background transition-transform ${enabled ? "-translate-x-4" : "-translate-x-0.5"}`} />
        </button>
      </div>

      {enabled && (
        <div className="mt-4 flex items-center gap-3">
          <label className="text-xs font-semibold text-foreground">الوقت الإلزامي (بالثواني):</label>
          <Input
            type="number"
            min={0}
            max={300}
            value={duration}
            onChange={(e) => {
              const next = { ...(block.stage_intervals || {}) };
              next[stage] = parseInt(e.target.value) || 15;
              onChange({ stage_intervals: next });
            }}
            placeholder="15"
            className="h-8 w-24 text-xs"
          />
        </div>
      )}
    </div>
  );
}

/* ---------------- Quizzes Editor ---------------- */

function QuizzesEditor({
  block,
  onChange,
}: {
  block: ParagraphBlock;
  onChange: (patch: Partial<ParagraphBlock>) => void;
}) {
  const setQuizzes = (patch: Partial<ParagraphBlock["quizzes"]>) =>
    onChange({ quizzes: { ...block.quizzes, ...patch } });

  const total =
    block.quizzes.mcqs.length + block.quizzes.fills.length + block.quizzes.essays.length;

  return (
    <Section
      title={`أسئلة المراجعة (${total})`}
      subtitle="أضف أي عدد من الأسئلة. اترك الأقسام فارغة إذا لم ترغب باستخدامها."
    >
      {/* MCQs */}
      <SubSection
        title="اختيار من متعدد"
        action={
          <button
            type="button"
            onClick={() =>
              setQuizzes({
                mcqs: [...block.quizzes.mcqs, { question: "", options: ["", "", ""], answer: "" }],
              })
            }
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-border bg-background px-3 py-1 text-xs font-semibold text-foreground/70 hover:border-brand/60"
          >
            <Plus className="h-3.5 w-3.5" /> سؤال
          </button>
        }
      >
        {block.quizzes.mcqs.length === 0 && <EmptyHint text="لا توجد أسئلة اختيار من متعدد بعد." />}
        <div className="space-y-4">
          {block.quizzes.mcqs.map((q, i) => (
            <McqEditor
              key={i}
              num={i + 1}
              q={q}
              onChange={(next) =>
                setQuizzes({
                  mcqs: block.quizzes.mcqs.map((it, j) => (j === i ? next : it)),
                })
              }
              onRemove={() =>
                setQuizzes({ mcqs: block.quizzes.mcqs.filter((_, j) => j !== i) })
              }
            />
          ))}
        </div>
      </SubSection>

      {/* Fills */}
      <SubSection
        title="إكمال الفراغ"
        action={
          <button
            type="button"
            onClick={() =>
              setQuizzes({ fills: [...block.quizzes.fills, { question: "", answer: "" }] })
            }
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-border bg-background px-3 py-1 text-xs font-semibold text-foreground/70 hover:border-brand/60"
          >
            <Plus className="h-3.5 w-3.5" /> سؤال
          </button>
        }
      >
        {block.quizzes.fills.length === 0 && <EmptyHint text="لا توجد أسئلة إكمال بعد." />}
        <div className="space-y-3">
          {block.quizzes.fills.map((q, i) => (
            <div key={i} className="space-y-2 rounded-2xl border border-border bg-background p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-foreground/70">سؤال {i + 1}</div>
                <button
                  onClick={() =>
                    setQuizzes({ fills: block.quizzes.fills.filter((_, j) => j !== i) })
                  }
                  className="rounded-lg p-1.5 text-destructive hover:bg-destructive/5"
                  aria-label="حذف"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <Field label="السؤال (استخدم ____ مكان الفراغ)">
                <Input
                  value={q.question}
                  onChange={(e) =>
                    setQuizzes({
                      fills: block.quizzes.fills.map((it, j) =>
                        j === i ? { ...it, question: e.target.value } : it,
                      ),
                    })
                  }
                />
              </Field>
              <Field label="الإجابة">
                <Input
                  value={q.answer}
                  onChange={(e) =>
                    setQuizzes({
                      fills: block.quizzes.fills.map((it, j) =>
                        j === i ? { ...it, answer: e.target.value } : it,
                      ),
                    })
                  }
                />
              </Field>
            </div>
          ))}
        </div>
      </SubSection>

      {/* Essays */}
      <SubSection
        title="أسئلة مقالية / علّل"
        action={
          <button
            type="button"
            onClick={() =>
              setQuizzes({ essays: [...block.quizzes.essays, { question: "", keywords: [] }] })
            }
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-border bg-background px-3 py-1 text-xs font-semibold text-foreground/70 hover:border-brand/60"
          >
            <Plus className="h-3.5 w-3.5" /> سؤال
          </button>
        }
      >
        {block.quizzes.essays.length === 0 && <EmptyHint text="لا توجد أسئلة مقالية بعد." />}
        <div className="space-y-3">
          {block.quizzes.essays.map((q, i) => (
            <div key={i} className="space-y-2 rounded-2xl border border-border bg-background p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-foreground/70">سؤال {i + 1}</div>
                <button
                  onClick={() =>
                    setQuizzes({ essays: block.quizzes.essays.filter((_, j) => j !== i) })
                  }
                  className="rounded-lg p-1.5 text-destructive hover:bg-destructive/5"
                  aria-label="حذف"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <Field label="السؤال">
                <Textarea
                  rows={2}
                  value={q.question}
                  onChange={(e) =>
                    setQuizzes({
                      essays: block.quizzes.essays.map((it, j) =>
                        j === i ? { ...it, question: e.target.value } : it,
                      ),
                    })
                  }
                />
              </Field>
              <Field label="الكلمات المفتاحية للإجابة (افصل بفاصلة)">
                <Input
                  value={q.keywords.join("، ")}
                  onChange={(e) =>
                    setQuizzes({
                      essays: block.quizzes.essays.map((it, j) =>
                        j === i
                          ? {
                              ...it,
                              keywords: e.target.value
                                .split(/[،,]/)
                                .map((t) => t.trim())
                                .filter(Boolean),
                            }
                          : it,
                      ),
                    })
                  }
                />
              </Field>
            </div>
          ))}
        </div>
      </SubSection>
    </Section>
  );
}

function McqEditor({
  num,
  q,
  onChange,
  onRemove,
}: {
  num: number;
  q: { question: string; options: string[]; answer: string };
  onChange: (next: { question: string; options: string[]; answer: string }) => void;
  onRemove: () => void;
}) {
  const setOption = (i: number, val: string) => {
    const opts = [...q.options];
    const old = opts[i];
    opts[i] = val;
    const answer = q.answer === old ? val : q.answer;
    onChange({ ...q, options: opts, answer });
  };
  const removeOption = (i: number) => {
    const opts = [...q.options];
    const removed = opts.splice(i, 1)[0];
    const answer = q.answer === removed ? "" : q.answer;
    onChange({ ...q, options: opts, answer });
  };
  const addOption = () => onChange({ ...q, options: [...q.options, ""] });

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-background p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-foreground/70">سؤال {num}</div>
        <button
          onClick={onRemove}
          className="rounded-lg p-1.5 text-destructive hover:bg-destructive/5"
          aria-label="حذف السؤال"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <Field label="السؤال">
        <Input value={q.question} onChange={(e) => onChange({ ...q, question: e.target.value })} />
      </Field>
      <div className="space-y-2">
        <div className="text-xs font-semibold text-foreground/70">الخيارات</div>
        {q.options.map((opt, i) => {
          const isAnswer = opt.trim().length > 0 && opt.trim() === q.answer.trim();
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand">
                {i + 1}
              </span>
              <Input
                value={opt}
                placeholder={`الخيار ${i + 1}`}
                onChange={(e) => setOption(i, e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeOption(i)}
                disabled={q.options.length <= 2}
                className="rounded-xl border border-destructive/40 p-2 text-destructive transition hover:bg-destructive/5 disabled:opacity-30"
                aria-label="حذف الخيار"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...q, answer: opt })}
                disabled={!opt.trim()}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition",
                  isAnswer
                    ? "border-success bg-success-soft text-success"
                    : "border-border text-foreground/60 hover:border-success/40",
                  "disabled:opacity-30",
                )}
              >
                {isAnswer ? "✓ الإجابة" : "تعيين كإجابة"}
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={addOption}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-border bg-background px-3 py-1 text-xs font-semibold text-foreground/70 hover:border-brand/60"
        >
          <Plus className="h-3.5 w-3.5" /> خيار جديد
        </button>
      </div>
    </div>
  );
}

/* ---------------- Hard Words Editor ---------------- */

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
    <Section
      title="المصطلحات والتعريفات"
      subtitle="ستظهر هذه المصطلحات مميّزة داخل النص مع تلميحات تعريفية."
    >
      <div className="space-y-3">
        {words.length === 0 && <EmptyHint text="لا توجد مصطلحات بعد." />}
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
    </Section>
  );
}

/* ---------------- Image Uploader ---------------- */

function ImageUploader({ url, onChange }: { url: string; onChange: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-2xl border border-border bg-background/50 p-3">
      <div className="mb-2 text-xs font-bold text-foreground/70">صورة مرافقة (اختيارية)</div>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
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
        <div className="mt-3 flex items-start gap-3 rounded-xl border border-border bg-background p-3">
          <img
            src={url}
            alt="معاينة"
            className="h-20 w-20 rounded-lg object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.opacity = "0.3";
            }}
          />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-foreground">معاينة الصورة</div>
            <div className="mt-1 truncate text-xs text-foreground/50" dir="ltr">
              {fileName ?? url}
            </div>
            <button
              onClick={() => {
                onChange("");
                setFileName(null);
              }}
              className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-destructive hover:underline"
            >
              <Trash2 className="h-3 w-3" /> إزالة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Layout Helpers ---------------- */

function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-7">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-foreground/55">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function SubSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/50 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-foreground/80">{title}</h3>
        {action}
      </div>
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

function EmptyHint({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-border bg-background/50 p-4 text-center text-xs text-foreground/50">
      {text}
    </p>
  );
}
