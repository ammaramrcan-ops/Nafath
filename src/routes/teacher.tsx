import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  ImagePlus,
  Maximize2,
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
import { useSettings, STAGE_LABELS, DEFAULT_STAGE_ORDER, type Stage } from "@/lib/settings";
import { saveToLibrary } from "@/lib/lesson-library";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
type FillStage = Stage | "quizzes_mcq" | "quizzes_fill" | "quizzes_essay";

export const Route = createFileRoute("/teacher")({
  component: TeacherPage,
  head: () => ({
    meta: [{ title: "نفاذ" }],
  }),
});

function emptyBlock(id: number): ParagraphBlock {
  return normalizeBlock(
    {
      id,
      title: "",
      short_sentence: "",
      story: "",
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
  const [step, setStep] = useState(0);
  const [introStage, setIntroStage] = useState<'start' | 'lesson-info' | null>('start');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [libSaved, setLibSaved] = useState(false);

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

  const handleSaveToLibrary = () => {
    try {
      saveToLibrary(lesson);
      setLibSaved(true);
      setTimeout(() => setLibSaved(false), 2000);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lesson));
    } catch {
      /* ignore autosave errors */
    }
  }, [lesson]);

  const loadDefault = () => {
    setLesson(defaultLesson);
    setIntroStage('lesson-info');
    setStep(0);
  };

  const startFromEmpty = () => {
    const empty = emptyLesson();
    setLesson(empty);
    setIntroStage('lesson-info');
    setStep(0);
  };

  const handleLessonInfoComplete = () => {
    setIntroStage(null);
    setStep(1);
  };

  // Calculate if we're on last block and last stage (for save button display)
  const shouldShowSaveButton = !isInfoStep &&
    blockIdx === lesson.blocks.length - 1 &&
    introStage === null;

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-zen-surface text-zen-on-surface antialiased font-sans">
      <header className="sticky top-0 z-20 bg-zen-surface/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-8 py-5">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zen-on-surface-variant transition hover:text-zen-on-surface"
            >
              <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
              الرئيسية
            </Link>
          </div>
          {introStage === null && (
            <div className="flex flex-wrap items-center gap-3">
              {savedAt && (
                <span className="text-[12px] font-medium text-zen-on-surface-variant/70">
                  حُفظت {savedAt}
                </span>
              )}
              <button
                onClick={() => {
                  if (window.confirm("هل أنت متأكد من مسح الدرس الحالي للبدء من جديد؟")) {
                    const empty = emptyLesson();
                    setLesson(empty);
                    setStep(0);
                    localStorage.removeItem(STORAGE_KEY);
                    setLibSaved(false);
                  }
                }}
                className="text-[13px] font-medium text-zen-on-surface-variant transition hover:text-destructive"
              >
                مسح
              </button>
              {shouldShowSaveButton && (
                <button
                  onClick={handleSaveToLibrary}
                  className={cn(
                    "rounded-full px-5 py-2 text-[13px] font-medium tracking-wide transition",
                    libSaved
                      ? "bg-zen-surface-container text-zen-primary"
                      : "bg-zen-primary text-white hover:opacity-90",
                  )}
                >
                  {libSaved ? "✓ حُفظ" : "حفظ في المكتبة"}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-8 py-12">
        {introStage === 'start' ? (
          <IntroductionScreen
            onStartEmpty={startFromEmpty}
            onLoadDefault={loadDefault}
          />
        ) : introStage === 'lesson-info' ? (
          <LessonInfoStep
            lesson={lesson}
            onChange={updateLesson}
            onNext={handleLessonInfoComplete}
          />
        ) : isInfoStep ? (
          <LessonInfoStep
            lesson={lesson}
            onChange={updateLesson}
            onNext={handleLessonInfoComplete}
          />
        ) : (
          <BlockStep
            block={lesson.blocks[blockIdx]}
            blockNum={blockIdx + 1}
            total={lesson.blocks.length}
            onChange={(patch) => updateBlock(blockIdx, patch)}
            onRemove={lesson.blocks.length > 1 ? () => removeBlock(blockIdx) : undefined}
            onNextBlock={() => setStep((s) => Math.min(totalSteps - 1, s + 1))}
            isLastBlock={blockIdx === lesson.blocks.length - 1}
            blockIndex={blockIdx}
            totalBlocks={lesson.blocks.length}
            onAddBlock={() => addBlock()}
            onGotoStep={(s) => setStep(s)}
          />
        )}
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
        "shrink-0 rounded-full px-4 py-1.5 text-[12px] font-medium tracking-wide transition",
        active
          ? "bg-white text-zen-on-surface shadow-[var(--shadow-deep)]"
          : "text-zen-on-surface-variant hover:bg-zen-surface-low hover:text-zen-on-surface",
      )}
    >
      {label}
    </button>
  );
}

function IntroductionScreen({
  onStartEmpty,
  onLoadDefault,
}: {
  onStartEmpty: () => void;
  onLoadDefault: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-semibold text-zen-on-surface mb-3">أنشئ درسك</h1>
        <p className="text-zen-on-surface-variant text-lg">اختر طريقة البدء:</p>
      </div>

      <div className="space-y-4">
        <button
          onClick={onStartEmpty}
          className="w-full rounded-3xl bg-white shadow-[var(--shadow-deep)] p-8 text-right transition hover:shadow-lg hover:scale-105 active:scale-95"
        >
          <div className="text-2xl font-semibold text-zen-on-surface mb-2">ابدأ من الصفر</div>
          <p className="text-zen-on-surface-variant">ابدأ بدرس فارغ تماماً وأنشئ محتواك من البداية</p>
        </button>

        <button
          onClick={onLoadDefault}
          className="w-full rounded-3xl bg-white shadow-[var(--shadow-deep)] p-8 text-right transition hover:shadow-lg hover:scale-105 active:scale-95"
        >
          <div className="text-2xl font-semibold text-zen-on-surface mb-2">استرجع القالب التجريبي</div>
          <p className="text-zen-on-surface-variant">حمّل قالب نموذج واستخدمه كنقطة انطلاق، ثم عدّله حسب احتياجاتك</p>
        </button>
      </div>
    </div>
  );
}

function LessonInfoStep({
  lesson,
  onChange,
  onNext,
}: {
  lesson: Lesson;
  onChange: (patch: Partial<Lesson>) => void;
  onNext: () => void;
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
      <div className="mt-8 flex justify-end">
        <button
          onClick={onNext}
          className="rounded-full bg-zen-primary px-8 py-3 text-white font-medium transition hover:opacity-90"
        >
          التالي
        </button>
      </div>
    </Section>
  );
}

function BlockStep({
  block,
  blockNum,
  total,
  onChange,
  onRemove,
  onNextBlock,
  isLastBlock,
  blockIndex,
  totalBlocks,
  onAddBlock,
  onGotoStep,
}: {
  block: ParagraphBlock;
  blockNum: number;
  total: number;
  onChange: (patch: Partial<ParagraphBlock>) => void;
  onRemove?: () => void;
  onNextBlock: () => void;
  isLastBlock: boolean;
  blockIndex: number;
  totalBlocks: number;
  onAddBlock: () => void;
  onGotoStep: (step: number) => void;
}) {
  const { settings } = useSettings();
  const [showSequenceEditor, setShowSequenceEditor] = useState(false);
  const [activeStage, setActiveStage] = useState<FillStage | null>(null);
  const [blockNameEdit, setBlockNameEdit] = useState(false);

  const previewStages = useMemo(() => {
    const base = effectiveStages(block, settings.stageOrder) as FillStage[];
    if (block.quiz_enabled === false) return base;
    const quizStages: FillStage[] = [];
    if (block.quizzes.mcqs.length > 0 || true) quizStages.push("quizzes_mcq");
    if (block.quizzes.fills.length > 0 || true) quizStages.push("quizzes_fill");
    if (block.quizzes.essays.length > 0 || true) quizStages.push("quizzes_essay");
    return [...base, ...quizStages];
  }, [block, settings.stageOrder]);

  const isLastStage = activeStage === previewStages[previewStages.length - 1];
  const isLastBlockStage = blockIndex === totalBlocks - 1 && isLastStage;

  useEffect(() => {
    if (previewStages.length === 0) {
      setActiveStage(null);
      return;
    }
    setActiveStage((prev) => (prev && previewStages.includes(prev) ? prev : previewStages[0]));
  }, [previewStages]);

  return (
    <div>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[12px] font-medium tracking-wide text-zen-primary">
            فقرة {blockNum} من {total}
          </div>
          <h2 className="mt-2 text-[32px] font-medium leading-tight text-zen-on-surface">
            {block.title || "فقرة بدون عنوان"}
          </h2>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-zen-on-surface-variant transition hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} /> حذف الفقرة
          </button>
        )}
      </div>

      <div className="space-y-6">
        {blockIndex === 0 ? (
          // First block: show inline name editing
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[20px] font-medium text-zen-on-surface">عنوان الفقرة</h2>
            </div>
            <Input
              value={block.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="عنوان الفقرة"
              className="h-12 rounded-2xl border-transparent bg-white px-5 text-[15px] font-medium text-zen-on-surface shadow-[var(--shadow-deep)] placeholder:text-zen-on-surface-variant/50 focus-visible:ring-0"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowSequenceEditor(true)}
                className="flex-1 rounded-full bg-zen-primary px-5 py-3 text-[13px] font-medium text-white transition hover:opacity-90"
              >
                تعديل التسلسل
              </button>
            </div>
            {blockIndex < totalBlocks - 1 && (
              <button
                onClick={onAddBlock}
                className="w-full rounded-full border border-dashed border-zen-primary px-5 py-3 text-[13px] font-medium text-zen-primary transition hover:bg-zen-surface-low flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                إضافة فقرة جديدة
              </button>
            )}
          </div>
        ) : (
          // Other blocks: show inline name editing
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex-1">
              <div className="text-[12px] font-medium tracking-wide text-zen-primary mb-2">
                فقرة {blockNum} من {total}
              </div>
              <Input
                value={block.title}
                onChange={(e) => onChange({ title: e.target.value })}
                placeholder="عنوان الفقرة"
                className="h-12 rounded-2xl border-transparent bg-white px-5 text-[15px] font-medium text-zen-on-surface shadow-[var(--shadow-deep)] placeholder:text-zen-on-surface-variant/50 focus-visible:ring-0"
              />
            </div>
            {onRemove && (
              <button
                onClick={onRemove}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-zen-on-surface-variant transition hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} /> حذف
              </button>
            )}
          </div>
        )}

        {showSequenceEditor && (
          <div className="space-y-4 rounded-3xl bg-white p-6 shadow-[var(--shadow-deep)]">
            <button
              onClick={() => setShowSequenceEditor(false)}
              className="text-[13px] font-medium text-zen-primary transition hover:opacity-70"
            >
              ← إغلاق إعداد التسلسل
            </button>
            <StagesEditor block={block} onChange={onChange} />
          </div>
        )}

        {!showSequenceEditor && (
          <ContentFillSurface
            block={block}
            activeStages={previewStages}
            selectedStage={activeStage}
            onSelectStage={setActiveStage}
            onChange={onChange}
            isLastBlockLastStage={isLastBlockStage}
            onTransitionToParagraphs={() => onGotoStep(1)}
          />
        )}
      </div>
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
    <div className="space-y-3">
      {order.map((stage, i) => {
          const isOn = enabled.has(stage);
          return (
            <div
              key={stage}
              className={cn(
                "rounded-2xl bg-zen-surface-low/50 transition",
                isOn ? "" : "opacity-60",
              )}
            >
              <div className="space-y-4 px-5 py-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-[12px] font-medium text-zen-primary">
                      {i + 1}
                    </span>
                    <span className="text-[14px] font-medium text-zen-on-surface">{STAGE_LABELS[stage]}</span>
                  </div>
                  <button
                    onClick={() => setEnabled(stage, !isOn)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-medium transition",
                      isOn
                        ? "bg-zen-primary text-white"
                        : "bg-white text-zen-on-surface-variant",
                    )}
                    title={isOn ? "إخفاء هذه المرحلة" : "تفعيل هذه المرحلة"}
                  >
                    {isOn ? <Eye className="h-3.5 w-3.5" strokeWidth={1.75} /> : <EyeOff className="h-3.5 w-3.5" strokeWidth={1.75} />}
                    {isOn ? "مفعّلة" : "معطّلة"}
                  </button>
                </div>

                {/* Time interval section */}
                {isOn && (
                  <div className="rounded-xl bg-white p-3 border border-zen-surface-low">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[12px] font-medium text-zen-on-surface">الفاصل الزمني</p>
                        <p className="mt-0.5 text-[10px] text-zen-on-surface-variant">منع التخطي السريع</p>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={300}
                        defaultValue={block.stage_intervals?.[stage] ?? 15}
                        onChange={(e) => {
                          const next = { ...(block.stage_intervals || {}) };
                          next[stage] = parseInt(e.target.value) || 15;
                          onChange({ stage_intervals: next });
                        }}
                        className="h-8 w-16 rounded-lg border border-zen-surface-container bg-zen-surface-low text-center text-[12px] focus-visible:ring-2 focus-visible:ring-zen-primary"
                        placeholder="15"
                      />
                      <span className="text-[12px] text-zen-on-surface-variant">ثانية</span>
                    </div>
                  </div>
                )}

                {/* Ordering buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="flex-1 rounded-lg p-2 text-zen-on-surface-variant transition hover:bg-white disabled:opacity-30"
                    aria-label="إلى الأعلى"
                    title="إلى الأعلى"
                  >
                    <ArrowUp className="h-4 w-4 mx-auto" strokeWidth={1.75} />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === order.length - 1}
                    className="flex-1 rounded-lg p-2 text-zen-on-surface-variant transition hover:bg-white disabled:opacity-30"
                    aria-label="إلى الأسفل"
                    title="إلى الأسفل"
                  >
                    <ArrowDown className="h-4 w-4 mx-auto" strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
    </div>
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
    case "story":
      return (
        <div className="space-y-3">
          <Field label="القصة" hint="قصة تعليمية منفصلة عن الأمثلة التوضيحية.">
            <Textarea
              value={block.story}
              onChange={(e) => onChange({ story: e.target.value })}
              rows={4}
              placeholder="اكتب قصة تربط المفهوم بموقف واقعي..."
            />
          </Field>
          <StageIntervalSettings stage={stage} block={block} onChange={onChange} />
        </div>
      );
    case "examples":
      return (
        <div className="space-y-3">
          <Field label="مثال توضيحي" hint="مثال مختصر يوضح الفكرة مباشرة.">
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
          <StageIntervalSettings stage={stage} block={block} onChange={onChange} />
        </div>
      );
    case "funny":
      return (
        <div className="space-y-3">
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
    <div className="mt-4 rounded-2xl bg-white p-5 shadow-[var(--shadow-deep)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[15px] font-medium text-zen-on-surface">الفاصل الزمني التلقائي</p>
          <p className="mt-1 text-[12px] text-zen-on-surface-variant">
            منع الطالب من التخطي السريع للمرحلة القادمة.
          </p>
        </div>
        <button
          onClick={() => {
            const next = { ...(block.enable_stage_intervals || {}) };
            next[stage] = !enabled;
            onChange({ enable_stage_intervals: next });
          }}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${enabled ? "bg-zen-primary" : "bg-zen-surface-container"}`}
          aria-label={enabled ? "تعطيل" : "تفعيل"}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? "-translate-x-6" : "-translate-x-1"}`} />
        </button>
      </div>

      {enabled && (
        <div className="mt-5 flex items-center gap-4">
          <label className="text-[13px] font-medium text-zen-on-surface">الوقت الإلزامي</label>
          <div className="flex items-center gap-2">
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
              className="h-10 w-24 rounded-xl border-transparent bg-zen-surface-low text-center text-[14px] font-medium text-zen-on-surface focus-visible:ring-0"
            />
            <span className="text-[13px] font-medium text-zen-on-surface-variant">ثانية</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ContentFillSurface({
  block,
  activeStages,
  selectedStage,
  onSelectStage,
  onChange,
  isLastBlockLastStage,
  onTransitionToParagraphs,
}: {
  block: ParagraphBlock;
  activeStages: FillStage[];
  selectedStage: FillStage | null;
  onSelectStage: (stage: FillStage) => void;
  onChange: (patch: Partial<ParagraphBlock>) => void;
  isLastBlockLastStage?: boolean;
  onTransitionToParagraphs?: () => void;
}) {
  const selectedIndex = selectedStage ? activeStages.indexOf(selectedStage) : -1;
  const stage = selectedStage ?? activeStages[0];
  const isQuizStage = stage === "quizzes_mcq" || stage === "quizzes_fill" || stage === "quizzes_essay";
  const timedStage = stage && !isQuizStage ? stage : null;
  const stageEnabled = timedStage ? (block.enable_stage_intervals?.[timedStage] ?? true) : true;
  const stageDuration = timedStage ? (block.stage_intervals?.[timedStage] ?? 15) : 15;
  const stageImage = stage ? getStageImage(block, stage) : "";

  const patchInterval = (patch: { enabled?: boolean; duration?: number }) => {
    if (!timedStage) return;
    const nextEnabled = { ...(block.enable_stage_intervals || {}) };
    const nextIntervals = { ...(block.stage_intervals || {}) };
    if (typeof patch.enabled === "boolean") nextEnabled[timedStage] = patch.enabled;
    if (typeof patch.duration === "number") nextIntervals[timedStage] = patch.duration;
    onChange({ enable_stage_intervals: nextEnabled, stage_intervals: nextIntervals });
  };

  const patchStageImage = (url: string) => {
    if (!stage) return;
    const nextVisuals = { ...(block.stage_visuals || {}) };
    nextVisuals[stage] = url;
    const patch: Partial<ParagraphBlock> = { stage_visuals: nextVisuals };
    if (stage === "original") patch.visual_url = url;
    onChange(patch);
  };

  const [zoomed, setZoomed] = useState(false);

  const renderStageBody = () => (
    <>
      {stage === "quizzes_mcq" ? (
        <div className="mx-auto max-w-3xl">
          <QuizzesEditor block={block} onChange={onChange} type="mcq" />
        </div>
      ) : stage === "quizzes_fill" ? (
        <div className="mx-auto max-w-3xl">
          <QuizzesEditor block={block} onChange={onChange} type="fill" />
        </div>
      ) : stage === "quizzes_essay" ? (
        <div className="mx-auto max-w-3xl">
          <QuizzesEditor block={block} onChange={onChange} type="essay" />
        </div>
      ) : (
        stage && <InlineStageCanvas stage={stage} block={block} onChange={onChange} imageUrl={stageImage} />
      )}
    </>
  );

  return (
    <div className="relative h-screen flex flex-col">
      {activeStages.length === 0 ? (
        <EmptyHint text="لا توجد مراحل مفعلة. فعّل مرحلة واحدة على الأقل من إعداد التسلسل." />
      ) : (
        <div className="relative overflow-hidden bg-white shadow-[var(--shadow-deep)] flex-1 flex flex-col">
          {/* Zoom button — top corner */}
          <button
            onClick={() => setZoomed(true)}
            className="absolute top-3 left-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-zen-on-surface-variant shadow-sm backdrop-blur transition hover:bg-white hover:text-zen-primary"
            aria-label="ملء الشاشة"
            title="ملء الشاشة"
          >
            <Maximize2 className="h-4 w-4" strokeWidth={1.75} />
          </button>

          {/* Header with image and title */}
          <div className="px-7 py-4 border-b border-zen-surface-low">
            <div className="flex items-center justify-between mb-3 ps-10">
              <div className="text-[12px] font-medium tracking-wide text-zen-primary">
                {stage ? getFillStageLabel(stage) : ""}
              </div>
              <div className="flex flex-wrap gap-2">
                {activeStages.map((s, i) => (
                  <button
                    key={s}
                    onClick={() => onSelectStage(s)}
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-medium transition",
                      s === stage
                        ? "bg-zen-primary text-white"
                        : "bg-zen-surface-low text-zen-on-surface-variant hover:bg-zen-surface-container",
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
            {stageImage && isQuizStage && (
              <img src={stageImage} alt="صورة المرحلة" className="w-full h-40 rounded-2xl object-cover" />
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-12 sm:px-12">
            {renderStageBody()}
          </div>

          {/* Image uploader available for ALL stages */}
          {stage && (
            <div className="border-t border-zen-surface-low px-7 py-4">
              <p className="text-[11px] font-medium text-zen-on-surface mb-2">رفع صورة لهذه المرحلة</p>
              <ImageUploaderCompact url={stageImage} onChange={patchStageImage} />
            </div>
          )}

          {/* Bottom action buttons */}
          {isLastBlockLastStage && (
            <div className="border-t border-zen-surface-low px-7 py-4 bg-zen-surface-low/30">
              <button
                onClick={onTransitionToParagraphs}
                className="w-full rounded-full bg-zen-primary px-5 py-3 text-[13px] font-medium text-white transition hover:opacity-90"
              >
                الانتقال للفقرات
              </button>
            </div>
          )}
        </div>
      )}

      {/* Fullscreen / Zoom Mode */}
      {zoomed && stage && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 bg-white flex flex-col"
        >
          {/* Close button */}
          <button
            onClick={() => setZoomed(false)}
            className="absolute top-4 left-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-zen-surface-low text-zen-on-surface-variant transition hover:bg-zen-surface-container hover:text-zen-on-surface"
            aria-label="خروج من ملء الشاشة"
            title="خروج"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>

          {/* Stage content */}
          <div className="flex-1 overflow-y-auto px-8 py-16 sm:px-16">
            {renderStageBody()}
          </div>

          {/* Numbers navigation only */}
          <div className="border-t border-zen-surface-low px-7 py-5 bg-zen-surface/80 backdrop-blur">
            <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2">
              {activeStages.map((s, i) => (
                <button
                  key={s}
                  onClick={() => onSelectStage(s)}
                  className={cn(
                    "h-9 w-9 rounded-full text-[12px] font-medium transition",
                    s === stage
                      ? "bg-zen-primary text-white"
                      : "bg-zen-surface-low text-zen-on-surface-variant hover:bg-zen-surface-container",
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getFillStageLabel(stage: FillStage): string {
  if (stage === "quizzes_mcq")   return "أسئلة: اختر من متعدد";
  if (stage === "quizzes_fill")  return "أسئلة: إكمال الفراغ";
  if (stage === "quizzes_essay") return "أسئلة: مقالي";
  return STAGE_LABELS[stage as Stage];
}

function getStageImage(block: ParagraphBlock, stage: FillStage): string {
  if (stage === "original") return block.stage_visuals?.original ?? block.visual_url ?? "";
  return block.stage_visuals?.[stage] ?? "";
}

function InlineStageCanvas({
  stage,
  block,
  onChange,
  imageUrl,
}: {
  stage: Stage;
  block: ParagraphBlock;
  onChange: (patch: Partial<ParagraphBlock>) => void;
  imageUrl?: string;
}) {
  const inputClasses =
    "w-full rounded-2xl border border-transparent bg-transparent px-3 py-2 text-foreground placeholder:text-foreground/35 focus:border-brand/30 focus:bg-background/70 focus:outline-none";

  if (stage === "short") {
    return (
      <div className="mx-auto flex min-h-[52vh] max-w-2xl items-center justify-center">
        <div className="w-full space-y-4">
          {imageUrl && <img src={imageUrl} alt="صورة الشريحة" className="h-44 w-full rounded-2xl object-cover" />}
          <Textarea
            value={block.short_sentence}
            onChange={(e) => onChange({ short_sentence: e.target.value })}
            rows={3}
            className={cn(inputClasses, "resize-none text-center text-2xl font-semibold leading-loose")}
            placeholder="اكتب الجملة المبسطة هنا..."
          />
        </div>
      </div>
    );
  }

  if (stage === "examples") {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl bg-brand-soft/60 p-8">
          {imageUrl && <img src={imageUrl} alt="صورة الشريحة" className="mb-4 h-44 w-full rounded-2xl object-cover" />}
          <p className="mb-3 text-sm font-semibold text-brand">مثال</p>
          <Textarea
            value={block.examples}
            onChange={(e) => onChange({ examples: e.target.value })}
            rows={7}
            className={cn(inputClasses, "resize-none text-lg leading-loose")}
            placeholder="اكتب القصة أو المثال التوضيحي..."
          />
        </div>
      </div>
    );
  }

  if (stage === "story") {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-border bg-card p-8">
          {imageUrl && <img src={imageUrl} alt="صورة القصة" className="mb-4 h-44 w-full rounded-2xl object-cover" />}
          <p className="mb-3 text-sm font-semibold text-brand">قصة</p>
          <Textarea
            value={block.story}
            onChange={(e) => onChange({ story: e.target.value })}
            rows={8}
            className={cn(inputClasses, "resize-none text-lg leading-loose")}
            placeholder="اكتب القصة التعليمية هنا..."
          />
        </div>
      </div>
    );
  }

  if (stage === "original") {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        {imageUrl && <img src={imageUrl} alt="صورة الشريحة" className="h-52 w-full rounded-2xl object-cover" />}
        <Textarea
          value={block.full_text}
          onChange={(e) => onChange({ full_text: e.target.value })}
          rows={10}
          className={cn(inputClasses, "resize-y text-lg leading-loose")}
          placeholder="اكتب النص الأصلي كما سيظهر للطالب..."
        />
      </div>
    );
  }

  if (stage === "mental") {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        {imageUrl && <img src={imageUrl} alt="صورة الشريحة" className="h-44 w-full rounded-2xl object-cover" />}
        <div className="rounded-3xl border-2 border-brand/30 bg-card p-6 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-brand">اختصار للحفظ</p>
          <Input
            value={block.mnemonic}
            onChange={(e) => onChange({ mnemonic: e.target.value })}
            className={cn(inputClasses, "text-center text-xl font-bold")}
            placeholder="اكتب الرابط الذهني المختصر..."
          />
        </div>
        <div className="rounded-3xl bg-warning-soft p-6 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-foreground/60">رابط فكاهي</p>
          <Textarea
            value={block.funny_link}
            onChange={(e) => onChange({ funny_link: e.target.value })}
            rows={4}
            className={cn(inputClasses, "resize-none text-lg leading-loose")}
            placeholder="اكتب الجملة الفكاهية المساعدة على التذكر..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {imageUrl && <img src={imageUrl} alt="صورة الشريحة" className="mb-4 h-44 w-full rounded-2xl object-cover" />}
      <p className="mb-4 text-center text-sm text-foreground/55">الخريطة الذهنية للفقرة</p>
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
        className={cn(inputClasses, "text-center")}
        placeholder="اكتب العقد مفصولة بفواصل..."
      />
    </div>
  );
}

function ImageUploaderCompact({ url, onChange }: { url: string; onChange: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="mt-1.5 space-y-1.5">
      <button
        onClick={() => fileRef.current?.click()}
        className="w-full rounded-md border border-border px-2 py-1 text-[10px] font-semibold text-foreground/70 hover:border-brand/40"
      >
        رفع/تغيير
      </button>
      {url && (
        <button
          onClick={() => onChange("")}
          className="w-full rounded-md border border-destructive/40 px-2 py-1 text-[10px] font-semibold text-destructive"
        >
          إزالة
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const reader = new FileReader();
          reader.onload = () => onChange(String(reader.result));
          reader.readAsDataURL(f);
        }}
      />
    </div>
  );
}

function hasStageContent(block: ParagraphBlock, stage: Stage): boolean {
  switch (stage) {
    case "short":
      return block.short_sentence.trim().length > 0;
    case "story":
      return block.story.trim().length > 0;
    case "examples":
      return block.examples.trim().length > 0;
    case "original":
      return block.full_text.trim().length > 0 || (block.visual_url ?? "").trim().length > 0;
    case "mental":
      return block.mnemonic.trim().length > 0;
    case "funny":
      return block.funny_link.trim().length > 0;
    case "mindmap":
      return block.mind_map_nodes.length > 0;
  }
}

/* ---------------- Quizzes Editor ---------------- */

function QuizzesEditor({
  block,
  onChange,
  type,
}: {
  block: ParagraphBlock;
  onChange: (patch: Partial<ParagraphBlock>) => void;
  type: "mcq" | "fill" | "essay";
}) {
  const setQuizzes = (patch: Partial<ParagraphBlock["quizzes"]>) =>
    onChange({ quizzes: { ...block.quizzes, ...patch } });

  const total =
    type === "mcq"   ? block.quizzes.mcqs.length
    : type === "fill" ? block.quizzes.fills.length
    : block.quizzes.essays.length;

  return (
    <Section
      title={`أسئلة المراجعة (${total})`}
      subtitle="أضف أي عدد من الأسئلة. اترك الأقسام فارغة إذا لم ترغب باستخدامها."
    >
      {type === "mcq" ? (
        <div className="space-y-10">
          {/* MCQs */}
          <SubSection
            title="اختيار من متعدد"
            action={
              <button
                type="button"
                onClick={() =>
                  setQuizzes({
                    mcqs: [
                      ...block.quizzes.mcqs,
                      { question: "", options: ["", "", ""], answer: "", image_url: "" },
                    ],
                  })
                }
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-border bg-background px-3 py-1 text-xs font-semibold text-foreground/70 hover:border-brand/60"
              >
                <Plus className="h-3.5 w-3.5" /> سؤال
              </button>
            }
          >
            {block.quizzes.mcqs.length === 0 && (
              <EmptyHint text="لا توجد أسئلة اختيار من متعدد بعد." />
            )}
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
                  setQuizzes({
                    fills: [...block.quizzes.fills, { question: "", answer: "", image_url: "" }],
                  })
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
                  <QuestionImageEditor
                    imageUrl={q.image_url ?? ""}
                    onChange={(image_url) =>
                      setQuizzes({
                        fills: block.quizzes.fills.map((it, j) =>
                          j === i ? { ...it, image_url } : it,
                        ),
                      })
                    }
                  />
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
        </div>
      ) : type === "fill" ? (
        <div className="space-y-10">
          <SubSection
            title="إكمال الفراغ"
            action={
              <button
                type="button"
                onClick={() =>
                  setQuizzes({
                    fills: [...block.quizzes.fills, { question: "", answer: "", image_url: "" }],
                  })
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
                  <QuestionImageEditor
                    imageUrl={q.image_url ?? ""}
                    onChange={(image_url) =>
                      setQuizzes({
                        fills: block.quizzes.fills.map((it, j) =>
                          j === i ? { ...it, image_url } : it,
                        ),
                      })
                    }
                  />
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
        </div>
      ) : (
        <div className="space-y-10">
          <SubSection
            title="أسئلة مقالية / علّل"
            action={
              <button
                type="button"
                onClick={() =>
                  setQuizzes({
                    essays: [...block.quizzes.essays, { question: "", keywords: [], image_url: "" }],
                  })
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
                  <QuestionImageEditor
                    imageUrl={q.image_url ?? ""}
                    onChange={(image_url) =>
                      setQuizzes({
                        essays: block.quizzes.essays.map((it, j) =>
                          j === i ? { ...it, image_url } : it,
                        ),
                      })
                    }
                  />
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
        </div>
      )}
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
  q: { question: string; options: string[]; answer: string; image_url?: string };
  onChange: (next: { question: string; options: string[]; answer: string; image_url?: string }) => void;
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
      <QuestionImageEditor imageUrl={q.image_url ?? ""} onChange={(image_url) => onChange({ ...q, image_url })} />
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

function QuestionImageEditor({
  imageUrl,
  onChange,
}: {
  imageUrl: string;
  onChange: (image_url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2 rounded-xl border border-border bg-background/60 p-3">
      <div className="text-xs font-semibold text-foreground/70">صورة السؤال (اختياري)</div>
      <Input
        value={imageUrl}
        onChange={(e) => onChange(e.target.value)}
        placeholder="الصق رابط الصورة..."
        dir="ltr"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-lg border border-border px-3 py-1 text-xs font-semibold text-foreground/70 hover:border-brand/50"
        >
          رفع صورة محلية
        </button>
        {imageUrl && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-lg border border-destructive/40 px-3 py-1 text-xs font-semibold text-destructive"
          >
            إزالة
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const reader = new FileReader();
          reader.onload = () => onChange(String(reader.result));
          reader.readAsDataURL(f);
        }}
      />
      {imageUrl && (
        <img src={imageUrl} alt="معاينة صورة السؤال" className="h-24 w-full rounded-lg object-cover" />
      )}
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
    <section className="rounded-3xl bg-white p-8 shadow-[var(--shadow-deep)] sm:p-10">
      <div className="mb-7 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-medium leading-tight text-zen-on-surface">{title}</h2>
          {subtitle && (
            <p className="mt-2 text-[13px] font-medium text-zen-on-surface-variant">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      <div className="space-y-6">{children}</div>
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
    <div className="rounded-2xl bg-zen-surface-low/50 p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-[15px] font-medium text-zen-on-surface">{title}</h3>
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
      <div className="mb-2 text-[13px] font-medium text-zen-on-surface">{label}</div>
      {children}
      {hint && (
        <div className="mt-1.5 text-[12px] text-zen-on-surface-variant">{hint}</div>
      )}
    </label>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <p className="rounded-2xl bg-zen-surface-low/60 p-5 text-center text-[13px] font-medium text-zen-on-surface-variant">
      {text}
    </p>
  );
}
