import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Plus,
  Trash2,
  X,
  Sparkles,
  Filter,
  BookOpen,
  CheckCircle2,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import {
  khulLesson,
  effectiveStages,
  normalizeBlock,
  type HardWord,
  type Lesson,
  type ParagraphBlock,
} from "@/lib/lesson-data";
import { STAGE_LABELS, DEFAULT_STAGE_ORDER, type Stage } from "@/lib/settings";
import { saveToLibrary } from "@/lib/lesson-library";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VisualHighlightArea } from "@/components/VisualHighlightArea";
import { cn } from "@/lib/utils";
import { MindMapCanvas } from "@/components/MindMapCanvas";
import { parseBlockMindMap, type MindMapData } from "@/lib/mind-map-types";
import { getSubjectById } from "@/lib/subjects";
import { getCurriculum, getSubject } from "@/lib/curriculum";

type FillStage = Stage | "quizzes_mcq" | "quizzes_fill" | "quizzes_essay";

export const Route = createFileRoute("/teacher")({
  component: TeacherPage,
  head: () => ({
    meta: [{ title: "نفاذ - واجهة المعلم" }],
  }),
});

function sanitizeJsonInput<T>(data: T): T {
  if (typeof data === "string") {
    return data
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, "")
      .replace(/javascript\s*:/gi, "blocked:")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      .replace(/<embed\b[^>]*>/gi, "")
      .replace(/<object\b[^>]*>.*?<\/object>/gi, "") as T;
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeJsonInput) as T;
  }
  if (data && typeof data === "object") {
    return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, sanitizeJsonInput(v)])) as T;
  }
  return data;
}

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
      highlights: [],
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

const STORAGE_KEY = "teacher.lesson.draft";

const LEVEL_DEFAULT_STAGES: Record<1 | 2 | 3, Stage[]> = {
  1: ["story", "baladi_terms", "paper_summary", "mindmap", "quizzes_mcq"],
  2: [
    "examples",
    "original",
    "mental",
    "mindmap",
    "quizzes_fill",
    "quizzes_essay",
    "flashcards",
    "zaitouna",
  ],
  3: ["original", "mental", "funny", "mindmap", "quizzes_essay", "zaitouna"],
};

function TeacherPage() {
  const [lesson, setLesson] = useState<Lesson>(() => {
    if (typeof window === "undefined") return khulLesson;
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
    return khulLesson;
  });

  const [step, setStep] = useState(0);
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<1 | 2 | 3 | "all">(1);
  const [libSaved, setLibSaved] = useState(false);

  // 6-Step Dedicated Modular AI Wizard Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [jsonInput1, setJsonInput1] = useState("");
  const [jsonInput2, setJsonInput2] = useState("");
  const [jsonInput3, setJsonInput3] = useState("");
  const [jsonInput4, setJsonInput4] = useState("");
  const [jsonInput5, setJsonInput5] = useState("");
  const [jsonInput6, setJsonInput6] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("import=true")) {
      setWizardStep(1);
      setShowImportModal(true);

      // Apply subject stage orders if subject parameter is present
      const urlParams = new URLSearchParams(window.location.search);
      const subjectId = urlParams.get("subject");
      if (subjectId) {
        const subject = getSubjectById(subjectId);
        if (subject) {
          setLesson((prev) => ({
            ...prev,
            levelStageOrders: subject.levelStageOrders,
            levelDisabledStages: subject.levelDisabledStages,
          }));
        }
      }
    }
  }, []);

  // STEP 1: Story & Master Story Handler
  const handleImportStepContent = (jsonStr: string) => {
    if (!jsonStr.trim()) {
      toast.error("يرجى لصق كود JSON 1 أولاً للمتابعة.");
      return false;
    }
    try {
      const data = JSON.parse(jsonStr);
      const title = data.title || data.lesson_title || lesson.title;
      const masterStory = String(
        data.master_story ?? data.masterStory ?? data.intro_story ?? lesson.master_story ?? "",
      );
      const rawBlocks = (() => {
        if (Array.isArray(data.blocks)) return data.blocks;
        if (Array.isArray(data.sections)) return data.sections;
        return [data];
      })();

      const newBlocks = rawBlocks.map((b: any, i: number) => {
        const existing = lesson.blocks[i] || emptyBlock(i + 1);
        const norm = normalizeBlock(b, i);
        return {
          ...existing,
          title: norm.title || existing.title,
          short_sentence: norm.short_sentence || existing.short_sentence,
          story: norm.story || existing.story,
          examples: norm.examples || existing.examples,
          full_text: norm.full_text || existing.full_text,
          hard_words: norm.hard_words.length > 0 ? norm.hard_words : existing.hard_words,
          mnemonic: norm.mnemonic || existing.mnemonic,
          funny_link: norm.funny_link || existing.funny_link,
        };
      });

      updateLesson({ title, master_story: masterStory, blocks: newBlocks });
      toast.success("تم استيراد القصة التمهيدية والمواقف الحوارية بنجاح! 📖✨");
      return true;
    } catch {
      toast.error("كود JSON غير صالح. يرجى التثبت من الصيغة.");
      return false;
    }
  };

  // STEP 2: Mnemonic Takeaways Handler
  const handleImportStepMnemonics = (jsonStr: string) => {
    if (!jsonStr.trim()) {
      toast.error("يرجى لصق كود JSON 2 أولاً للمتابعة.");
      return false;
    }
    try {
      const data = sanitizeJsonInput(JSON.parse(jsonStr));
      const mneumonicList = (() => {
        if (Array.isArray(data.takeaways_by_block)) return data.takeaways_by_block;
        if (Array.isArray(data.blocks)) return data.blocks;
        return [data];
      })();

      const updatedBlocks = lesson.blocks.map((b, i) => {
        const item =
          mneumonicList[i] ||
          mneumonicList.find((m: any) => m.block_id === b.id) ||
          mneumonicList[0];
        if (!item) return b;
        const norm = normalizeBlock(item, i);
        return {
          ...b,
          mnemonic: norm.mnemonic || b.mnemonic,
        };
      });

      updateLesson({ blocks: updatedBlocks });
      toast.success("تم استيراد تنبيهات (💡 خد بالك منها) بنجاح! ✨");
      return true;
    } catch {
      toast.error("كود JSON غير صالح لتنبيهات خد بالك منها.");
      return false;
    }
  };

  // STEP 3: Zaitouna Summary Handler
  const handleImportStepZaitouna = (jsonStr: string) => {
    if (!jsonStr.trim()) {
      toast.error("يرجى لصق كود JSON 3 أولاً للمتابعة.");
      return false;
    }
    try {
      const data = sanitizeJsonInput(JSON.parse(jsonStr));
      const list = (() => {
        if (Array.isArray(data.zaitouna_by_block)) return data.zaitouna_by_block;
        if (Array.isArray(data.blocks)) return data.blocks;
        return [data];
      })();

      const updatedBlocks = lesson.blocks.map((b, i) => {
        const item = list[i] || list.find((z: any) => z.block_id === b.id) || list[0];
        if (!item) return b;
        const zObj = item.zaitouna || item;
        return {
          ...b,
          zaitouna: {
            definitions: sanitizeJsonInput(
              String(zObj.definitions || b.zaitouna?.definitions || ""),
            ),
            reasoning: sanitizeJsonInput(String(zObj.reasoning || b.zaitouna?.reasoning || "")),
            links: sanitizeJsonInput(String(zObj.links || b.zaitouna?.links || "")),
          },
        };
      });

      updateLesson({ blocks: updatedBlocks });
      toast.success("تم استيراد بطاقات الزيتونة المخصصة لكل فقرة بنجاح! 🫒✨");
      return true;
    } catch {
      toast.error("كود JSON غير صالح لكروت الزيتونة.");
      return false;
    }
  };

  // STEP 4: Level 1 Simple Contextual MCQs Handler
  const handleImportStepLevel1MCQs = (jsonStr: string) => {
    if (!jsonStr.trim()) {
      toast.error("يرجى لصق كود JSON 4 أولاً للمتابعة.");
      return false;
    }
    try {
      const data = sanitizeJsonInput(JSON.parse(jsonStr));
      const quizList = (() => {
        if (Array.isArray(data.quizzes_by_block)) return data.quizzes_by_block;
        if (Array.isArray(data.blocks)) return data.blocks;
        return [data];
      })();

      const updatedBlocks = lesson.blocks.map((b, i) => {
        const item = quizList[i] || quizList.find((q: any) => q.block_id === b.id) || quizList[0];
        if (!item) return b;
        const norm = normalizeBlock(item, i);
        return {
          ...b,
          quizzes: {
            ...b.quizzes,
            mcqs: norm.quizzes.mcqs.length > 0 ? norm.quizzes.mcqs : b.quizzes.mcqs,
          },
        };
      });

      updateLesson({ blocks: updatedBlocks });
      toast.success("تم استيراد أسئلة المستوى الأول القصصية بنجاح! 🎯✨");
      return true;
    } catch {
      toast.error("كود JSON غير صالح لأسئلة المستوى الأول.");
      return false;
    }
  };

  // STEP 5: Single-Concept Flashcards Handler
  const handleImportStepFlashcards = (jsonStr: string) => {
    if (!jsonStr.trim()) {
      toast.error("يرجى لصق كود JSON 5 أولاً للمتابعة.");
      return false;
    }
    try {
      const data = sanitizeJsonInput(JSON.parse(jsonStr));
      const list = (() => {
        if (Array.isArray(data.flashcards_by_block)) return data.flashcards_by_block;
        if (Array.isArray(data.blocks)) return data.blocks;
        return [data];
      })();

      const updatedBlocks = lesson.blocks.map((b, i) => {
        const item = list[i] || list.find((f: any) => f.block_id === b.id) || list[0];
        if (!item) return b;
        const rawWords = (() => {
          if (Array.isArray(item.flashcards)) return item.flashcards;
          if (Array.isArray(item.hard_words)) return item.hard_words;
          return [];
        })();
        const words = rawWords.map((w: any) => ({
          word: String(w.word || w.term || w.question || ""),
          meaning: String(w.meaning || w.definition || w.answer || ""),
        }));

        return {
          ...b,
          hard_words: words.length > 0 ? words : b.hard_words,
        };
      });

      updateLesson({ blocks: updatedBlocks });
      toast.success("تم استيراد بطاقات الفلاش كاردز الفردية الميسرة بنجاح! 🗂️✨");
      return true;
    } catch {
      toast.error("كود JSON غير صالح لبطاقات الفلاش كاردز.");
      return false;
    }
  };

  // STEP 6: Level 2 & 3 Advanced Quizzes Handler
  const handleImportStepAdvancedQuizzes = (jsonStr: string) => {
    if (!jsonStr.trim()) {
      toast.error("يرجى لصق كود JSON 6 أولاً لإنهاء المعالج.");
      return false;
    }
    try {
      const data = sanitizeJsonInput(JSON.parse(jsonStr));
      const quizList = (() => {
        if (Array.isArray(data.quizzes_by_block)) return data.quizzes_by_block;
        if (Array.isArray(data.blocks)) return data.blocks;
        return [data];
      })();

      const updatedBlocks = lesson.blocks.map((b, i) => {
        const item = quizList[i] || quizList.find((q: any) => q.block_id === b.id) || quizList[0];
        if (!item) return b;
        const norm = normalizeBlock(item, i);
        return {
          ...b,
          quizzes: {
            ...b.quizzes,
            fills: norm.quizzes.fills.length > 0 ? norm.quizzes.fills : b.quizzes.fills,
            essays: norm.quizzes.essays.length > 0 ? norm.quizzes.essays : b.quizzes.essays,
          },
        };
      });

      updateLesson({ blocks: updatedBlocks });
      toast.success("تم استيراد أسئلة المستويين الثاني والثالث بنجاح! 🧠✨");
      return true;
    } catch {
      toast.error("كود JSON غير صالح لأسئلة المستوى الثاني والثالث.");
      return false;
    }
  };

  const blockIdx = step - 1;

  const updateLesson = (patch: Partial<Lesson>) =>
    setLesson((prev) => {
      const next = { ...prev, ...patch };
      saveToLibrary(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeJsonInput(next)));
      } catch {}
      return next;
    });

  const updateBlock = (idx: number, patch: Partial<ParagraphBlock>) =>
    setLesson((prev) => {
      const next = {
        ...prev,
        blocks: prev.blocks.map((b, i) => (i === idx ? { ...b, ...patch } : b)),
      };
      saveToLibrary(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeJsonInput(next)));
      } catch {}
      return next;
    });

  const addBlock = () => {
    setLesson((prev) => {
      const next = {
        ...prev,
        blocks: [...prev.blocks, emptyBlock(prev.blocks.length + 1)],
      };
      saveToLibrary(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeJsonInput(next)));
      } catch {}
      return next;
    });
    setStep(lesson.blocks.length + 1);
  };

  const removeBlock = (idx: number) => {
    setLesson((prev) => {
      const next = {
        ...prev,
        blocks: prev.blocks.filter((_, i) => i !== idx).map((b, i) => ({ ...b, id: i + 1 })),
      };
      saveToLibrary(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeJsonInput(next)));
      } catch {}
      return next;
    });
    setStep((s) => Math.min(s, lesson.blocks.length - 1));
  };

  const handleSaveToLibrary = () => {
    try {
      const safe = sanitizeJsonInput(lesson);
      saveToLibrary(safe);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
      setLibSaved(true);
      setTimeout(() => setLibSaved(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handlePreviewStudent = () => {
    try {
      const safe = sanitizeJsonInput(lesson);
      saveToLibrary(safe);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
      localStorage.setItem("nafath.openLesson", JSON.stringify(safe));
      sessionStorage.setItem("nafath.openLesson", JSON.stringify(safe));
      toast.success("جاري فتح تجربة الطالب للدرس الحالية... 🎓");
      setTimeout(() => {
        window.location.href = "/";
      }, 300);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] font-sans text-[#0b1c30] dir-rtl pb-28" dir="rtl">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[#e0c0b1]/30 bg-[#f8f9ff]/90 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3 text-xs sm:text-sm font-extrabold text-[#584237]">
            <Link to="/" className="flex items-center gap-1 hover:text-[#9d4300] transition">
              <span>الرئيسية</span>
            </Link>
            <span className="text-[#e0c0b1] font-normal">›</span>
            <span className="text-[#0b1c30] font-extrabold">واجهة المعلم — تصميم وتعديل الدرس</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveToLibrary}
              className="inline-flex items-center gap-2 rounded-full bg-[#213145] hover:bg-[#0b1c30] px-7 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md transition cursor-pointer"
            >
              <BookOpen className="h-4 w-4 text-[#ffdbca]" />
              <span>{libSaved ? "تمت الإضافة للمكتبة! ✨" : "اعتماد وحفظ الدرس بالمكتبة"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3-Step Wizard Modal Window */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-[99999] dir-rtl overflow-y-auto">
          <div className="bg-white border border-[#e0c0b1] rounded-3xl p-6 sm:p-10 max-w-4xl w-full shadow-2xl space-y-6 text-right max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            {/* Stepper Header */}
            <div className="flex items-center justify-between border-b border-[#e0c0b1]/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#ffdbca] text-[#9d4300] flex items-center justify-center font-black shadow-xs">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#0b1c30]">
                    نظام إضافة الدرس الذكي (6 خطوات متتابعة بـ JSON) 🚀
                  </h3>
                  <p className="text-xs font-semibold text-[#584237]/70">
                    توليد منظم ودقيق لكل مكون في الدرس لضمان أعلى جودة تعليمية بدون أخطاء
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="p-2.5 rounded-full hover:bg-slate-100 text-slate-500 transition cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Stepper Tabs (Grid 6) */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              <button
                type="button"
                onClick={() => setWizardStep(1)}
                className={cn(
                  "p-3 rounded-2xl border text-right transition cursor-pointer flex flex-col gap-1",
                  wizardStep === 1
                    ? "bg-[#9d4300] text-white border-[#9d4300] shadow-md"
                    : "bg-[#fffaf7] text-[#584237] border-[#ffdbca] hover:bg-[#ffeddf]",
                )}
              >
                <span className="text-[10px] font-black opacity-80">1. القصة والدراما</span>
                <span className="text-xs font-black truncate">التمهيد والدراما 📖</span>
              </button>

              <button
                type="button"
                onClick={() => setWizardStep(2)}
                className={cn(
                  "p-3 rounded-2xl border text-right transition cursor-pointer flex flex-col gap-1",
                  wizardStep === 2
                    ? "bg-[#8127cf] text-white border-[#8127cf] shadow-md"
                    : "bg-[#eff4ff] text-[#584237] border-[#e0c0b1]/60 hover:bg-[#dce9ff]",
                )}
              >
                <span className="text-[10px] font-black opacity-80">2. التنبيهات</span>
                <span className="text-xs font-black truncate">خد بالك منها 💡</span>
              </button>

              <button
                type="button"
                onClick={() => setWizardStep(3)}
                className={cn(
                  "p-3 rounded-2xl border text-right transition cursor-pointer flex flex-col gap-1",
                  wizardStep === 3
                    ? "bg-amber-700 text-white border-amber-700 shadow-md"
                    : "bg-amber-50 text-[#584237] border-amber-200 hover:bg-amber-100/80",
                )}
              >
                <span className="text-[10px] font-black opacity-80">3. الخلاصة</span>
                <span className="text-xs font-black truncate">كروت الزيتونة 🫒</span>
              </button>

              <button
                type="button"
                onClick={() => setWizardStep(4)}
                className={cn(
                  "p-3 rounded-2xl border text-right transition cursor-pointer flex flex-col gap-1",
                  wizardStep === 4
                    ? "bg-emerald-700 text-white border-emerald-700 shadow-md"
                    : "bg-[#f0fdf4] text-[#584237] border-emerald-200 hover:bg-emerald-100/70",
                )}
              >
                <span className="text-[10px] font-black opacity-80">4. المستوى 1</span>
                <span className="text-xs font-black truncate">أسئلة الـ MCQs 🎯</span>
              </button>

              <button
                type="button"
                onClick={() => setWizardStep(5)}
                className={cn(
                  "p-3 rounded-2xl border text-right transition cursor-pointer flex flex-col gap-1",
                  wizardStep === 5
                    ? "bg-purple-700 text-white border-purple-700 shadow-md"
                    : "bg-purple-50 text-[#584237] border-purple-200 hover:bg-purple-100/70",
                )}
              >
                <span className="text-[10px] font-black opacity-80">5. الاستذكار</span>
                <span className="text-xs font-black truncate">الفلاش كاردز 🗂️</span>
              </button>

              <button
                type="button"
                onClick={() => setWizardStep(6)}
                className={cn(
                  "p-3 rounded-2xl border text-right transition cursor-pointer flex flex-col gap-1",
                  wizardStep === 6
                    ? "bg-blue-700 text-white border-blue-700 shadow-md"
                    : "bg-[#eff6ff] text-[#584237] border-blue-200 hover:bg-blue-100/70",
                )}
              >
                <span className="text-[10px] font-black opacity-80">6. المستويات 2 و 3</span>
                <span className="text-xs font-black truncate">أكمل ومقالي 🧠</span>
              </button>
            </div>

            {/* SCREEN 1: Story & Master Story JSON */}
            {wizardStep === 1 && (
              <div className="space-y-6 pt-2">
                <div className="bg-[#fffaf7] border border-[#ffdbca] rounded-3xl p-6 space-y-4 text-right">
                  <div className="flex items-center justify-between border-b border-[#ffdbca]/60 pb-3">
                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-[#9d4300] flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        <span>
                          البرومبت المخصص 1: (القصة التمهيدية الجامعة والمواقف الحوارية 📖)
                        </span>
                      </h3>
                      <p className="text-xs text-[#584237]/70 font-semibold">
                        انسخ هذا الأمر والصقه في الذكاء الاصطناعي لتوليد القصة الشاملة للدرس ككل
                        والمواقف الحوارية لكل فقرة
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const promptText = `أنت خبير التصميم التعليمي لمنصة "نفاذ - Nafath".
مهمتك تحويل النص أدناه إلى كود JSON للقصص الحوارية والتمهيد، وفق القواعد التالية:

1. الفهم الفكري لا الحفظ (شرط جوهري): هدف المستوى الأول هو الفهم العام والسلس للفكرة الجوهرية للفقرة دون الحاجة للحفظ الميكانيكي أو البصم الحرفي!
2. اللهجة والأسلوب: اكتب القصة التمهيدية والمواقف الحوارية 100% بالعامية المصرية الميسرة جداً والبسيطة (حوار طبيعي ككلامنا اليومي).
3. حظر لغة الكتب المعقدة: يمنع منعاً باتاً استخدام لغة الكتب الجافة أو الألفاظ المعقدة في القصة حتى لا يصبح كأنه في المستوى الثاني! القصة هدفها التشويق والفهم المباشر.
4. القصة التمهيدية العامة (master_story): اكتب قصة سينمائية ممتعة بالعامية المصرية تعطي المدخل الواقعي والمشكلة والحل الشرعي بأسلوب شائق.
5. القصة المصغرة (story): موقف حواري مصغر جداً بالعامية المصرية لكل فقرة يشرح المفهوم بأسلوب دايركت ومختصر.
6. أخرج النتيجة في كود JSON صافي فقط.

الهيكل المطلوب:
{
  "title": "عنوان الدرس الرئيسي",
  "master_story": "القصة التمهيدية العامة بالعامية المصرية للدرس ككل",
  "blocks": [
    {
      "id": 1,
      "title": "عنوان الفقرة",
      "short_sentence": "الفكرة الجوهرية للفقرة",
      "story": "الموقف الحواري المصغر بالعامية المصرية المختصر جداً",
      "full_text": "النص العلمي الكامل والمشروح بدقة"
    }
  ]
}
---
[الصق نص الدرس هنا]`;
                        navigator.clipboard.writeText(promptText);
                        toast.success("تم نسخ برومبت القصة والدراما بالعامية المصرية بنجاح! 📋");
                      }}
                      className="px-5 py-2 bg-[#9d4300] text-white rounded-full text-xs font-extrabold hover:bg-[#833800] transition cursor-pointer shadow-xs flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      <span>نسخ البرومبت 1 📋</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3 text-right">
                  <label
                    htmlFor="json-input-1"
                    className="text-sm font-extrabold text-[#0b1c30] block"
                  >
                    الصق كود JSON الناتج (JSON 1) الخاص بالقصة والدراما أدناه:
                  </label>
                  <textarea
                    id="json-input-1"
                    rows={10}
                    value={jsonInput1}
                    onChange={(e) => setJsonInput1(e.target.value)}
                    placeholder="الصق كود JSON 1 هنا..."
                    className="w-full bg-[#f8f9ff] border border-[#e0c0b1] rounded-2xl p-4 text-xs font-mono text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#9d4300] leading-relaxed"
                  />
                  <div className="flex items-center justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const ok = handleImportStepContent(jsonInput1);
                        if (ok) setWizardStep(2);
                      }}
                      className="px-8 py-3 bg-[#9d4300] text-white rounded-full text-sm font-extrabold hover:bg-[#833800] transition cursor-pointer shadow-md flex items-center gap-2"
                    >
                      <span>اعتماد وانتقال للخطوة 2 (تنبيهات خد بالك منها)</span>
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN 2: Mnemonic JSON */}
            {wizardStep === 2 && (
              <div className="space-y-6 pt-2">
                <div className="bg-[#eff4ff] border border-[#e0c0b1]/60 rounded-3xl p-6 space-y-4 text-right">
                  <div className="flex items-center justify-between border-b border-[#e0c0b1]/40 pb-3">
                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-[#8127cf] flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        <span>البرومبت المخصص 2: (تنبيهات واستبصارات "💡 خد بالك منها" 💡)</span>
                      </h3>
                      <p className="text-xs text-[#584237]/70 font-semibold">
                        انسخ هذا الأمر والصقه في الذكاء الاصطناعي لاستنباط التنبيهات الفقهية الدقيقة
                        لكل فقرة
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const promptText = `أنت خبير الاستبصار والتأهيل الشرعي لمنصة "نفاذ - Nafath".
مهمتك استنباط القواعد الفقهية والتنبيهات الدقيقة وتفريغها في كود JSON تحت مفتاح "mnemonic" لكل فقرة.

القواعد:
1. صغ فقرات "💡 خد بالك منها" كقواعد فقهية وتأهيلية تستنبط أحكام الفقرة ودقائقها (مثل حكم الكراهة، العوض المعلوم والمجهول، مهر المثل).
2. كل تنبيه يبدأ بـ "💡 خد بالك: ".

الهيكل المطلوب:
{
  "takeaways_by_block": [
    {
      "block_id": 1,
      "mnemonic": "💡 خد بالك: الأصل في طلب الخلع أنه مكروه ويشرع بلا كراهة عند خوف ألا تقيم حدود الله.\\n💡 خد بالك: العوض المجهول يوجب (مهر المثل)."
    }
  ]
}

أخرج كود JSON الصافي فقط وبدون أي نصوص خارجيّة.
---
[الصق نص الدرس هنا]`;
                        navigator.clipboard.writeText(promptText);
                        toast.success("تم نسخ برومبت تنبيهات خد بالك منها بنجاح! 📋");
                      }}
                      className="px-5 py-2 bg-[#8127cf] text-white rounded-full text-xs font-extrabold hover:bg-[#6b1fb0] transition cursor-pointer shadow-xs flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      <span>نسخ البرومبت 2 📋</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3 text-right">
                  <label
                    htmlFor="json-input-2"
                    className="text-sm font-extrabold text-[#0b1c30] block"
                  >
                    الصق كود JSON الناتج (JSON 2) الخاص بتنبيهات "خد بالك منها" أدناه:
                  </label>
                  <textarea
                    id="json-input-2"
                    rows={10}
                    value={jsonInput2}
                    onChange={(e) => setJsonInput2(e.target.value)}
                    placeholder="الصق كود JSON 2 هنا..."
                    className="w-full bg-[#f8f9ff] border border-[#e0c0b1] rounded-2xl p-4 text-xs font-mono text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#8127cf] leading-relaxed"
                  />
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="px-6 py-3 border border-[#e0c0b1] text-[#584237] rounded-full text-sm font-extrabold hover:bg-slate-50 transition cursor-pointer flex items-center gap-2"
                    >
                      <ArrowRight className="h-4 w-4" />
                      <span>العودة للخطوة 1</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const ok = handleImportStepMnemonics(jsonInput2);
                        if (ok) setWizardStep(3);
                      }}
                      className="px-8 py-3 bg-[#8127cf] text-white rounded-full text-sm font-extrabold hover:bg-[#6b1fb0] transition cursor-pointer shadow-md flex items-center gap-2"
                    >
                      <span>اعتماد وانتقال للخطوة 3 (كروت الزيتونة)</span>
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN 3: Zaitouna Summary JSON */}
            {wizardStep === 3 && (
              <div className="space-y-6 pt-2">
                <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 space-y-4 text-right">
                  <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-amber-950 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-700" />
                        <span>البرومبت المخصص 3: (بطاقات الزيتونة والخلاصة المركزة 🫒)</span>
                      </h3>
                      <p className="text-xs text-amber-800 font-semibold">
                        انسخ هذا الأمر والصقه في الذكاء الاصطناعي لاستخلاص خلاصة الزيتونة (التعريفات
                        المركزة، التوجيهات الشرعية، والروابط)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const promptText = `أنت خبير تلخيص واستخلاص "الزيتونة الفقهية" لمنصة "نفاذ - Nafath".
مهمتك تلخيص كل فقرة في 3 عناصر مركزة ومباشرة جداً:
1. definitions (التعريفات الجوهرية والحدود الفقهية): سطر واحد دقيق.
2. reasoning (التوجيه والعلة الشرعية): سطر واحد يدعم الفهم العلمي.
3. links (الروابط والارتباطات الفقهية): سطر واحد يربط المسألة بأبواب الفقه الأخرى.

الهيكل المطلوب:
{
  "zaitouna_by_block": [
    {
      "block_id": 1,
      "zaitouna": {
        "definitions": "الخلع: فرقة بين الزوجين بعوض مقصود راجع للزوج لفك عقد النكاح.",
        "reasoning": "إذا كان العوض مجهولاً يقع الخلع بائناً بمهر المثل لئلا يبطل عقد الفداء مع عدم صحة التسمية.",
        "links": "مرتبط بقواعد عقود المعاوضات المالية وتملّك البضع في الشريعة."
      }
    }
  ]
}

أخرج كود JSON الصافي فقط وبدون أي مقدمات.
---
[الصق نص الدرس هنا]`;
                        navigator.clipboard.writeText(promptText);
                        toast.success("تم نسخ برومبت كروت الزيتونة بنجاح! 📋");
                      }}
                      className="px-5 py-2 bg-amber-700 text-white rounded-full text-xs font-extrabold hover:bg-amber-800 transition cursor-pointer shadow-xs flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      <span>نسخ البرومبت 3 📋</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3 text-right">
                  <label
                    htmlFor="json-input-3"
                    className="text-sm font-extrabold text-[#0b1c30] block"
                  >
                    الصق كود JSON الناتج (JSON 3) الخاص بكروت الزيتونة أدناه:
                  </label>
                  <textarea
                    id="json-input-3"
                    rows={10}
                    value={jsonInput3}
                    onChange={(e) => setJsonInput3(e.target.value)}
                    placeholder="الصق كود JSON 3 هنا..."
                    className="w-full bg-[#f8f9ff] border border-[#e0c0b1] rounded-2xl p-4 text-xs font-mono text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-amber-600 leading-relaxed"
                  />
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      className="px-6 py-3 border border-[#e0c0b1] text-[#584237] rounded-full text-sm font-extrabold hover:bg-slate-50 transition cursor-pointer flex items-center gap-2"
                    >
                      <ArrowRight className="h-4 w-4" />
                      <span>العودة للخطوة 2</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const ok = handleImportStepZaitouna(jsonInput3);
                        if (ok) setWizardStep(4);
                      }}
                      className="px-8 py-3 bg-amber-700 text-white rounded-full text-sm font-extrabold hover:bg-amber-800 transition cursor-pointer shadow-md flex items-center gap-2"
                    >
                      <span>اعتماد وانتقال للخطوة 4 (أسئلة المستوى 1)</span>
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN 4: Level 1 MCQs JSON */}
            {wizardStep === 4 && (
              <div className="space-y-6 pt-2">
                <div className="bg-[#f0fdf4] border border-emerald-200 rounded-3xl p-6 space-y-4 text-right">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3">
                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-emerald-950 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                        <span>البرومبت المخصص 4: (أسئلة المستوى الأول القصصية 🎯)</span>
                      </h3>
                      <p className="text-xs text-[#584237]/70 font-semibold">
                        انسخ هذا الأمر والصقه في الذكاء الاصطناعي لتوليد 5 أسئلة خيار من متعدد
                        بالعامية المصرية الميسرة
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const promptText = `أنت خبير إعداد أسئلة المستوى الأول لمنصة "نفاذ - Nafath".
بناءً على فقرات الدرس والقصة، صغ كود JSON لأسئلة اختيار من متعدد (MCQ) ميسرة ومباشرة بالعامية المصرية (5 أسئلة لكل فقرة)، وفق الشروط الحازمة التالية:

1. قياس الفهم لا الحفظ الحرفي (شرط جوهري): هدف المستوى الأول هو قياس الفهم العام والفكرة الجوهرية للفقرة والحل الشرعي، وليس الحفظ الميكانيكي أو البصم!
2. حظر الأسئلة السطحية والغبية: يمنع منعاً باتاً السؤال عن أسماء الشخصيات الجانبية في القصة (مثل: ما اسم خالة سارة؟ ما اسم صديقة سلمى؟)! الأسئلة يجب أن تسأل عن الفهم الشرعي والمشكلة الواقعية والحل الشرعي في القصة.
3. الربط بالقصة والفقرة: جميع الأسئلة يجب أن تكون مستوحاة ومربوطة مباشرة بأحداث القصة والموقف الحواري وعناصر الفقرة دون أي سؤال خارجي.
4. اللغة والأسلوب: صغ الأسئلة والخيارات بالعامية المصرية الميسرة والسهلة كالمحاورة بالقصة لتسهيل الفهم والمتعة على الطالب بدون تقعر كُتب!
5. اللفظ الفقهي بين قوسين: ضع المصطلح الفقهي الشرعي الدقيق بين قوسين فقط داخل الجملة العامية (مثل: (عوض معلوم)، (بائناً)، (مهر المثل)، (يُصدّق بيمينه)).

التوزيع الخماسي المطلوب لكل فقرة (بالعامية المصرية + المصطلح بين قوسين):
- سؤال 1: سؤال عن المشكلة الواقعية والحل الشرعي في القصة (ممنوع السؤال عن أسماء الشخصيات!).
- سؤال 2: سؤال مباشر حول المفهوم والتعريف بالعامية مع (المصطلح الفقهي بين قوسين).
- سؤال 3: سؤال مباشر حول الدليل الشرعي المذكور في الفقرة.
- سؤال 4: سؤال مباشر حول حكمة المشروعية والسبب بالعامية.
- سؤال 5: سؤال مباشر حول تطبيق تنبيه (خد بالك منها) بالعامية مع (المصطلح الفقهي بين قوسين).

الهيكل المطلوب:
{
  "quizzes_by_block": [
    {
      "block_id": 1,
      "quizzes": {
        "mcqs": [
          {
            "question": "الخلع لو تم بمبلغ مالي محدد ومعروف (عوض معلوم)، إيه حكمه في الشرع؟",
            "options": ["حلال ومسموح بيه (جائز شرعاً)", "حرام وممنوع (باطل)", "مكروه تحريماً", "واجب على الجميع"],
            "answer": "حلال ومسموح بيه (جائز شرعاً)"
          },
          {
            "question": "في قصة الفقرة، لما استحالت العيشة الزوجية، الشرع شرع الخلع ليه؟",
            "options": ["علشان يرفع الضرر عن الزوجة وتفدي نفسها (دفع الضرر)", "علشان يعاقب الزوج", "علشان يلغي المهر القديم", "بدون أي سبب"],
            "answer": "علشان يرفع الضرر عن الزوجة وتفدي نفسها (دفع الضرر)"
          },
          {
            "question": "إيه هو الدليل على مشروعيته من القرآن؟",
            "options": ["قوله تعالى: (فلا جناح عليهما فيما افتدت به)", "قوله تعالى: (وأقيموا الصلاة)", "قوله تعالى: (كتب عليكم الصيام)", "قوله تعالى: (وأشهدوا ذوي عدل)"],
            "answer": "قوله تعالى: (فلا جناح عليهما فيما افتدت به)"
          },
          {
            "question": "ليه الخلع بيجوز للمرأة في الشرع؟",
            "options": ["علشان نرفع الضرر عنها لما العيشة تستحيل", "علشان نمنع الزوج من حقوقه", "علشان نزيد الطلاق", "بدون أي سبب"],
            "answer": "علشان نرفع الضرر عنها لما العيشة تستحيل"
          },
          {
            "question": "خد بالك: لو وقع الخلع على شيء غير محدد (عوض مجهول)، إيه اللي بيجب للزوج؟",
            "options": ["تاخد حكم الطلاق البائن وبيدفع لها (مهر المثل)", "يبطل الخلع تماماً", "يتحول لطلاق رجعي", "لا شيء له"],
            "answer": "تاخد حكم الطلاق البائن وبيدفع لها (مهر المثل)"
          }
        ]
      }
    }
  ]
}

أخرج النتيجة في مربع كود JSON الصافي فقط وبدون أي مقدمات.
---
[الصق نص الدرس هنا]`;
                        navigator.clipboard.writeText(promptText);
                        toast.success("تم نسخ برومبت أسئلة المستوى الأول المحسن بنجاح! 📋");
                      }}
                      className="px-5 py-2 bg-emerald-700 text-white rounded-full text-xs font-extrabold hover:bg-emerald-800 transition cursor-pointer shadow-xs flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      <span>نسخ البرومبت 4 📋</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3 text-right">
                  <label
                    htmlFor="json-input-4"
                    className="text-sm font-extrabold text-[#0b1c30] block"
                  >
                    الصق كود JSON الناتج (JSON 4) الخاص بأسئلة المستوى الأول أدناه:
                  </label>
                  <textarea
                    id="json-input-4"
                    rows={10}
                    value={jsonInput4}
                    onChange={(e) => setJsonInput4(e.target.value)}
                    placeholder="الصق كود JSON 4 هنا..."
                    className="w-full bg-[#f8f9ff] border border-[#e0c0b1] rounded-2xl p-4 text-xs font-mono text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-emerald-600 leading-relaxed"
                  />
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setWizardStep(3)}
                      className="px-6 py-3 border border-[#e0c0b1] text-[#584237] rounded-full text-sm font-extrabold hover:bg-slate-50 transition cursor-pointer flex items-center gap-2"
                    >
                      <ArrowRight className="h-4 w-4" />
                      <span>العودة للخطوة 3</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const ok = handleImportStepLevel1MCQs(jsonInput4);
                        if (ok) setWizardStep(5);
                      }}
                      className="px-8 py-3 bg-emerald-700 text-white rounded-full text-sm font-extrabold hover:bg-emerald-800 transition cursor-pointer shadow-md flex items-center gap-2"
                    >
                      <span>اعتماد وانتقال للخطوة 5 (الفلاش كاردز)</span>
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN 5: Single-Concept Flashcards JSON */}
            {wizardStep === 5 && (
              <div className="space-y-6 pt-2">
                <div className="bg-purple-50 border border-purple-200 rounded-3xl p-6 space-y-4 text-right">
                  <div className="flex items-center justify-between border-b border-purple-200/60 pb-3">
                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-purple-950 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-700" />
                        <span>
                          البرومبت المخصص 5: (بطاقات الفلاش كاردز ذات المعلومة الواحدة 🗂️)
                        </span>
                      </h3>
                      <p className="text-xs text-purple-800 font-semibold">
                        انسخ هذا الأمر والصقه في الذكاء الاصطناعي لتوليد بطاقات فلاش كاردز بسيطة
                        ومباشرة تحمل معلومة واحدة صريحة في كل بطاقة
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const promptText = `أنت خبير صياغة بطاقات الاستذكار السريع (Flashcards) لمنصة "نفاذ - Nafath".
مهمتك تحويل المفاهيم الفقهية للفقرات إلى بطاقات فلاش كاردز ذكية وبسيطة جداً، بحيث تحمل كل بطاقة معلومة واحدة صريحة كحد أقصى (سؤال وجواب دقيق ومختصر).

القواعد:
- الوجه الأول (word / question): السؤال أو المصطلح المباشر.
- الوجه الثاني (meaning / answer): الإجابة التبسيطية الصريحة بأسلوب ميسر.

الهيكل المطلوب:
{
  "flashcards_by_block": [
    {
      "block_id": 1,
      "flashcards": [
        {
          "word": "ما الحكم إذا كان العوض في الخلع مجهولاً؟",
          "meaning": "يقع الخلع بائناً وتدفع الزوجة مهر المثل."
        },
        {
          "word": "ما الأصل في طلب الخلع؟",
          "meaning": "الأصل فيه أنه مكروه، ويجوز بلا كراهة عند الخوف من عدم إقامة حدود الله."
        }
      ]
    }
  ]
}

أخرج كود JSON الصافي فقط وبدون أي نصوص خارجيّة.
---
[الصق نص الدرس هنا]`;
                        navigator.clipboard.writeText(promptText);
                        toast.success("تم نسخ برومبت الفلاش كاردز بنجاح! 📋");
                      }}
                      className="px-5 py-2 bg-purple-700 text-white rounded-full text-xs font-extrabold hover:bg-purple-800 transition cursor-pointer shadow-xs flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      <span>نسخ البرومبت 5 📋</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3 text-right">
                  <label
                    htmlFor="json-input-5"
                    className="text-sm font-extrabold text-[#0b1c30] block"
                  >
                    الصق كود JSON الناتج (JSON 5) الخاص ببطاقات الفلاش كاردز أدناه:
                  </label>
                  <textarea
                    id="json-input-5"
                    rows={10}
                    value={jsonInput5}
                    onChange={(e) => setJsonInput5(e.target.value)}
                    placeholder="الصق كود JSON 5 هنا..."
                    className="w-full bg-[#f8f9ff] border border-[#e0c0b1] rounded-2xl p-4 text-xs font-mono text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-purple-600 leading-relaxed"
                  />
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setWizardStep(4)}
                      className="px-6 py-3 border border-[#e0c0b1] text-[#584237] rounded-full text-sm font-extrabold hover:bg-slate-50 transition cursor-pointer flex items-center gap-2"
                    >
                      <ArrowRight className="h-4 w-4" />
                      <span>العودة للخطوة 4</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const ok = handleImportStepFlashcards(jsonInput5);
                        if (ok) setWizardStep(6);
                      }}
                      className="px-8 py-3 bg-purple-700 text-white rounded-full text-sm font-extrabold hover:bg-purple-800 transition cursor-pointer shadow-md flex items-center gap-2"
                    >
                      <span>اعتماد وانتقال للخطوة 6 (أسئلة المستوى 2 و 3)</span>
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN 6: Level 2 & 3 Advanced Quizzes JSON */}
            {wizardStep === 6 && (
              <div className="space-y-6 pt-2">
                <div className="bg-[#eff6ff] border border-blue-200 rounded-3xl p-6 space-y-4 text-right">
                  <div className="flex items-center justify-between border-b border-blue-200/60 pb-3">
                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-blue-950 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-700" />
                        <span>
                          البرومبت المخصص 6: (أسئلة المستويين الثاني والثالث - أكمل الفراغ والمقالي
                          🧠)
                        </span>
                      </h3>
                      <p className="text-xs text-[#584237]/70 font-semibold">
                        انسخ هذا الأمر والصقه في الذكاء الاصطناعي لتوليد أسئلة أكمل الفراغ والأسئلة
                        المقالية الفقهية
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const promptText = `أنت خبير إعداد الاختبارات المتقدمة لمنصة "نفاذ - Nafath".
صغ كود JSON لأسئلة أكمل الفراغ (fills) والأسئلة المقالية (essays) لكل فقرة.

القواعد:
1. أسئلة أكمل الفراغ (fills) تكون صريحة على المصطلحات والأدلة.
2. الأسئلة المقالية (essays) تكون أسئلة علل أو اشرح الفكرة الفقهية بأسلوبك.

الهيكل المطلوب:
{
  "quizzes_by_block": [
    {
      "block_id": 1,
      "quizzes": {
        "fills": [
          { "question": "الدليل الشرعي من القرآن قوله تعالى: (فلا جناح عليهما فيما ____ به)", "answer": "افتدت" }
        ],
        "essays": [
          { "question": "علل: لماذا يقع الخلع بمهر المثل إذا كان العوض مجهولاً؟", "answer": "لإزالة الجهالة وتصحيح عقد الفداء" }
        ]
      }
    }
  ]
}

أخرج النتيجة في مربع كود JSON الصافي فقط وبدون أي مقدمات.
---
[الصق نص الدرس هنا]`;
                        navigator.clipboard.writeText(promptText);
                        toast.success("تم نسخ برومبت أسئلة المستوى الثاني والثالث بنجاح! 📋");
                      }}
                      className="px-5 py-2 bg-blue-700 text-white rounded-full text-xs font-extrabold hover:bg-blue-800 transition cursor-pointer shadow-xs flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      <span>نسخ البرومبت 6 📋</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3 text-right">
                  <label
                    htmlFor="json-input-6"
                    className="text-sm font-extrabold text-[#0b1c30] block"
                  >
                    الصق كود JSON الناتج (JSON 6) الخاص بأسئلة المستويين الثاني والثالث أدناه:
                  </label>
                  <textarea
                    id="json-input-6"
                    rows={10}
                    value={jsonInput6}
                    onChange={(e) => setJsonInput6(e.target.value)}
                    placeholder="الصق كود JSON 6 هنا..."
                    className="w-full bg-[#f8f9ff] border border-[#e0c0b1] rounded-2xl p-4 text-xs font-mono text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-blue-600 leading-relaxed"
                  />
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setWizardStep(5)}
                      className="px-6 py-3 border border-[#e0c0b1] text-[#584237] rounded-full text-sm font-extrabold hover:bg-slate-50 transition cursor-pointer flex items-center gap-2"
                    >
                      <ArrowRight className="h-4 w-4" />
                      <span>العودة للخطوة 5</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const ok = handleImportStepAdvancedQuizzes(jsonInput6);
                        if (ok) {
                          handleSaveToLibrary();
                          setShowImportModal(false);
                          handlePreviewStudent();
                        }
                      }}
                      className="px-8 py-3.5 bg-blue-700 bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-full text-sm font-extrabold hover:from-blue-800 hover:to-blue-900 transition cursor-pointer shadow-lg flex items-center gap-2"
                    >
                      <span>إنهاء وحفظ الدرس ومعاينته كطالب 🎓 ✨</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Editing Container */}
      <main className="mx-auto max-w-7xl p-6 sm:p-8 space-y-8">
        {/* Bento Step Tabs Navigation */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pb-2">
          <button
            onClick={() => setStep(0)}
            className={cn(
              "rounded-2xl px-6 py-3 text-xs sm:text-sm font-extrabold transition cursor-pointer flex items-center gap-2 shadow-xs",
              step === 0
                ? "bg-[#213145] text-white shadow-md"
                : "bg-[#eaf1ff] text-[#584237] hover:bg-[#dce9ff]",
            )}
          >
            <BookOpen className="h-4 w-4" />
            <span>بيانات الدرس العامة والتسلسل الموحد</span>
          </button>

          {lesson.blocks.map((b, i) => (
            <button
              key={b.id}
              onClick={() => setStep(i + 1)}
              className={cn(
                "rounded-2xl px-5 py-3 text-xs sm:text-sm font-extrabold transition cursor-pointer",
                step === i + 1
                  ? "bg-[#213145] text-white shadow-md"
                  : "bg-[#eaf1ff] text-[#584237] hover:bg-[#dce9ff]",
              )}
            >
              فقرة {i + 1}: {b.title || "بدون عنوان"}
            </button>
          ))}

          <button
            onClick={addBlock}
            className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-dashed border-[#e0c0b1] bg-white px-5 py-2.5 text-xs font-bold text-[#9d4300] hover:bg-[#eff4ff] transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة فقرة جديدة</span>
          </button>
        </div>

        {/* STEP 0: Lesson Metadata Card */}
        {step === 0 && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-8 rounded-[2.5rem] bg-white p-8 sm:p-12 shadow-xs border border-[#e0c0b1]/50 text-center">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b1c30]">
                إعدادات وبيانات الدرس العامة
              </h2>

              <div className="space-y-6 text-right">
                <Field id="lesson-title" label="عنوان الدرس الرئيسي">
                  <Input
                    id="lesson-title-input"
                    value={lesson.title || "أحكام الخُلع في الفقه الإسلامي"}
                    onChange={(e) => updateLesson({ title: e.target.value })}
                    placeholder="مثال: أحكام الخلع في الفقه الإسلامي..."
                    className="h-14 rounded-2xl border-none bg-[#eff4ff] text-center font-extrabold text-base sm:text-lg text-[#0b1c30] placeholder:text-slate-400 focus:ring-2 focus:ring-[#9d4300]"
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Field id="estimated-time" label="الزمن التقديري">
                    <Input
                      id="estimated-time-input"
                      value={lesson.estimatedTime || "35 دقيقة"}
                      onChange={(e) => updateLesson({ estimatedTime: e.target.value })}
                      placeholder="مثال: 35 دقيقة"
                      className="h-14 rounded-2xl border-none bg-[#eff4ff] text-center font-bold text-sm text-[#0b1c30]"
                    />
                  </Field>
                  <Field id="content-size" label="حجم المحتوى والمصطلحات">
                    <Input
                      id="content-size-input"
                      value={lesson.size || "4 كتل فقهية - 10 مصطلحات شرعية"}
                      onChange={(e) => updateLesson({ size: e.target.value })}
                      placeholder="مثال: 4 كتل فقهية - 10 مصطلحات شرعية"
                      className="h-14 rounded-2xl border-none bg-[#eff4ff] text-center font-bold text-sm text-[#0b1c30]"
                    />
                  </Field>
                </div>

                <Field
                  id="notebooklm-url"
                  label="رابط NotebookLM المساعد للدرس (NotebookLM URL)"
                  hint="ضع رابط كشكول NotebookLM الخاص بالدرس لتمكين خيار 'لدي سؤال' للطالب لتوجيهه للأداة عند الاستفسار."
                >
                  <Input
                    id="notebooklm-url-input"
                    value={lesson.notebookLmUrl || "https://notebooklm.google.com/..."}
                    onChange={(e) => updateLesson({ notebookLmUrl: e.target.value })}
                    placeholder="https://notebooklm.google.com/notebook/..."
                    className="h-14 rounded-2xl border-none bg-[#eff4ff] text-center font-semibold text-xs text-[#0b1c30] dir-ltr"
                  />
                </Field>

                <Field
                  id="master-story"
                  label="📖 القصة التمهيدية الجامعة للدرس ككل (Master Intro Story)"
                  hint="قصة تمهيدية سينمائية ممتعة تظهر للطالب قبل البدء بالفقرات لإعطائه السياق الواقعي الشامل."
                >
                  <textarea
                    id="master-story-textarea"
                    value={lesson.master_story || ""}
                    onChange={(e) => updateLesson({ master_story: e.target.value })}
                    rows={6}
                    placeholder="اكتب القصة التمهيدية الجامعة للدرس ككل هنا (مثل حوار سارة والمعلمة كاملة)..."
                    className="w-full rounded-2xl border-none bg-[#eff4ff] p-4 text-xs font-bold text-[#0b1c30] leading-relaxed"
                  />
                </Field>

                {/* Level Selection Radio Pills & Modern Inline Stages Editor */}
                <div className="pt-6 border-t border-[#e0c0b1]/30 space-y-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-extrabold text-[#0b1c30]">
                    <Filter className="h-4 w-4 text-[#9d4300]" />
                    <span>تحديد المستوى المعتمد لتعديل وعرض مراحل الفقرات:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
                    <button
                      type="button"
                      onClick={() => setSelectedLevelFilter(1)}
                      className={cn(
                        "py-3.5 px-4 rounded-full text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2 border",
                        selectedLevelFilter === 1
                          ? "bg-[#00875a] text-white border-[#00875a] shadow-sm"
                          : "bg-[#eff4ff] text-[#584237] border-transparent hover:bg-[#dce9ff]",
                      )}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        مراحل المستوى الأول ({lesson.levelStageOrders?.[1]?.length || 5} مراحل)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedLevelFilter(2)}
                      className={cn(
                        "py-3.5 px-4 rounded-full text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2 border",
                        selectedLevelFilter === 2
                          ? "bg-[#00875a] text-white border-[#00875a] shadow-sm"
                          : "bg-[#eff4ff] text-[#584237] border-transparent hover:bg-[#dce9ff]",
                      )}
                    >
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-current" />
                      <span>
                        مراحل المستوى الثاني ({lesson.levelStageOrders?.[2]?.length || 8} مراحل)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedLevelFilter(3)}
                      className={cn(
                        "py-3.5 px-4 rounded-full text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2 border",
                        selectedLevelFilter === 3
                          ? "bg-[#00875a] text-white border-[#00875a] shadow-sm"
                          : "bg-[#eff4ff] text-[#584237] border-transparent hover:bg-[#dce9ff]",
                      )}
                    >
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-current" />
                      <span>
                        مراحل المستوى الثالث ({lesson.levelStageOrders?.[3]?.length || 6} مراحل)
                      </span>
                    </button>
                  </div>

                  {/* Seamless Inline Modern Stage Sequence Editor */}
                  <div className="pt-4 border-t border-[#e0c0b1]/30">
                    <GlobalLevelSequenceEditor
                      lesson={lesson}
                      activeLevel={selectedLevelFilter === "all" ? 1 : selectedLevelFilter}
                      onChange={(patch) => updateLesson(patch)}
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="w-full sm:w-auto px-12 py-5 rounded-full bg-[#213145] hover:bg-[#0b1c30] text-white font-extrabold text-base shadow-lg transition cursor-pointer inline-flex items-center justify-center gap-3"
                  >
                    <span>الانتقال لتعديل ومراجعة كتل الفقرات</span>
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1..N: Block Editing */}
        {step > 0 && blockIdx < lesson.blocks.length && (
          <BlockEditor
            block={lesson.blocks[blockIdx]}
            blockNum={blockIdx + 1}
            selectedLevelFilter={selectedLevelFilter}
            lessonLevelStageOrders={lesson.levelStageOrders}
            lessonLevelDisabledStages={lesson.levelDisabledStages}
            onChange={(patch) => updateBlock(blockIdx, patch)}
            onRemove={lesson.blocks.length > 1 ? () => removeBlock(blockIdx) : undefined}
          />
        )}

        {/* Footer Clean Floating Action (Save & Continue Only) */}
        <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center pointer-events-none px-4">
          <div className="pointer-events-auto bg-white/90 backdrop-blur-md px-8 py-3.5 rounded-full shadow-2xl border border-[#e0c0b1]/50 flex items-center gap-4">
            <button
              onClick={handleSaveToLibrary}
              className="bg-[#9d4300] hover:bg-[#833800] text-white px-10 py-3.5 rounded-full text-sm font-extrabold shadow-md shadow-[#9d4300]/20 transition cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>{libSaved ? "تم حفظ الدرس بنجاح! ✨" : "حفظ المسودة ومتابعة"}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
  id,
}: {
  label: string;
  hint?: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-extrabold text-[#0b1c30]">
        {label}
      </label>
      {hint && <p className="text-[11px] font-semibold text-[#584237]/70">{hint}</p>}
      {children}
    </div>
  );
}

function LevelStageCardItem({
  stage,
  idx,
  isDisabled,
  isFirst,
  isLast,
  onToggleDisabled,
  onMoveStage,
}: {
  stage: Stage;
  idx: number;
  isDisabled: boolean;
  isFirst: boolean;
  isLast: boolean;
  onToggleDisabled: (stage: Stage) => void;
  onMoveStage: (idx: number, dir: -1 | 1) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-2xl border p-4 transition-all",
        isDisabled
          ? "bg-slate-50 border-dashed border-slate-300 text-slate-400 opacity-55 hover:opacity-85"
          : "bg-white text-[#0b1c30] border-[#e0c0b1]/40 shadow-2xs hover:border-[#9d4300]/40",
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold shrink-0",
            isDisabled ? "bg-slate-200 text-slate-500" : "bg-[#ffdbca]/40 text-[#9d4300]",
          )}
        >
          {idx + 1}
        </span>
        <span className="text-xs font-extrabold truncate">{STAGE_LABELS[stage]}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onToggleDisabled(stage)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-extrabold transition cursor-pointer border",
            isDisabled
              ? "bg-slate-200 text-slate-600 border-slate-300 hover:bg-emerald-100 hover:text-emerald-900"
              : "bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200",
          )}
        >
          {isDisabled ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          <span>{isDisabled ? "معطّلة" : "مفعّلة"}</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMoveStage(idx, -1)}
            disabled={isFirst}
            className="rounded-lg p-1.5 text-[#584237] hover:bg-[#eff4ff] disabled:opacity-20 cursor-pointer"
            title="تقديم المرحلة للأعلى"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onMoveStage(idx, 1)}
            disabled={isLast}
            className="rounded-lg p-1.5 text-[#584237] hover:bg-[#eff4ff] disabled:opacity-20 cursor-pointer"
            title="تأخير المرحلة لأسفل"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Modern Seamless Global Level Sequence Editor ---------------- */

function GlobalLevelSequenceEditor({
  lesson,
  activeLevel,
  onChange,
}: {
  lesson: Lesson;
  activeLevel: 1 | 2 | 3;
  onChange: (patch: Partial<Lesson>) => void;
}) {
  const subject = useMemo(() => {
    if (typeof window === "undefined") return null;
    const allSubs = getCurriculum().subjects;
    const subId = lesson.subjectId;
    if (subId) {
      const found = getSubject(subId);
      if (found) return found;
    }
    return allSubs[0];
  }, [lesson.subjectId]);

  const levelOrders = lesson.levelStageOrders ?? LEVEL_DEFAULT_STAGES;
  const levelDisabled = lesson.levelDisabledStages ?? { 1: [], 2: [], 3: [] };

  const currentLevelOrder = useMemo(() => {
    const subOrder = subject?.levelStageOrders?.[activeLevel];
    if (subOrder && subOrder.length > 0) {
      return subOrder as Stage[];
    }
    return (levelOrders[activeLevel] || LEVEL_DEFAULT_STAGES[activeLevel]) as Stage[];
  }, [subject, levelOrders, activeLevel]);

  const disabledSet = useMemo(() => {
    const subDisabled = subject?.levelDisabledStages?.[activeLevel] || [];
    const lesDisabled = levelDisabled[activeLevel] || [];
    return new Set<Stage>([...subDisabled, ...lesDisabled]);
  }, [subject, levelDisabled, activeLevel]);

  const fullStageList = useMemo(() => {
    const valid = currentLevelOrder.filter((s) =>
      (DEFAULT_STAGE_ORDER as Stage[]).includes(s as Stage),
    );
    return valid;
  }, [currentLevelOrder]);

  const setLevelOrder = (nextOrder: Stage[]) => {
    onChange({
      levelStageOrders: {
        ...levelOrders,
        [activeLevel]: nextOrder,
      },
    });
  };

  const toggleStageDisabled = (stage: Stage) => {
    const isCurrentlyActive = !disabledSet.has(stage);

    if (isCurrentlyActive) {
      // Disable this stage
      const nextDisabled = Array.from(new Set([...(levelDisabled[activeLevel] || []), stage]));
      onChange({
        levelDisabledStages: {
          ...levelDisabled,
          [activeLevel]: nextDisabled,
        },
      });
    } else {
      // Enable this stage
      const nextDisabled = (levelDisabled[activeLevel] || []).filter((s) => s !== stage);
      onChange({
        levelDisabledStages: {
          ...levelDisabled,
          [activeLevel]: nextDisabled,
        },
      });
    }
  };

  const moveStage = (idx: number, dir: -1 | 1) => {
    const next = [...fullStageList];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setLevelOrder(next);
  };

  return (
    <div className="space-y-4 text-right dir-rtl" dir="rtl">
      <div className="flex items-center justify-between border-b border-[#e0c0b1]/30 pb-3">
        <div>
          <h3 className="text-base font-extrabold text-[#0b1c30]">
            إعداد وتنسيق مراحل المستوى {activeLevel}
          </h3>
          <p className="text-xs font-semibold text-[#584237]/70 mt-0.5">
            المراحل المفعّلة تظهر باللون الأخضر، والمعطّلة تظهر بـ (معطّلة) ويمكنك تفعيلها بأي وقت
            👁️
          </p>
        </div>
      </div>

      {/* Modern Bento Grid of Stages (Matches modern Zen aesthetic) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fullStageList.map((stage, idx) => {
          const isDisabled = !currentLevelOrder.includes(stage) || disabledSet.has(stage);

          return (
            <LevelStageCardItem
              key={stage}
              stage={stage}
              idx={idx}
              isDisabled={isDisabled}
              isFirst={idx === 0}
              isLast={idx === fullStageList.length - 1}
              onToggleDisabled={toggleStageDisabled}
              onMoveStage={moveStage}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Block Editor ---------------- */

function BlockEditor({
  block,
  blockNum,
  selectedLevelFilter,
  lessonLevelStageOrders,
  lessonLevelDisabledStages,
  onChange,
  onRemove,
}: {
  block: ParagraphBlock;
  blockNum: number;
  selectedLevelFilter: 1 | 2 | 3 | "all";
  lessonLevelStageOrders?: Lesson["levelStageOrders"];
  lessonLevelDisabledStages?: Lesson["levelDisabledStages"];
  onChange: (patch: Partial<ParagraphBlock>) => void;
  onRemove?: () => void;
}) {
  const [activeStage, setActiveStage] = useState<FillStage | null>(null);

  const previewStages = useMemo(() => {
    if (selectedLevelFilter === "all") {
      return DEFAULT_STAGE_ORDER as FillStage[];
    }
    return effectiveStages(
      block,
      DEFAULT_STAGE_ORDER,
      selectedLevelFilter,
      lessonLevelStageOrders,
      lessonLevelDisabledStages,
    ) as FillStage[];
  }, [block, selectedLevelFilter, lessonLevelStageOrders, lessonLevelDisabledStages]);

  return (
    <div className="space-y-6">
      {/* Block Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] bg-white p-6 shadow-xs border border-[#e0c0b1]/50">
        <div className="flex-1 min-w-[280px] space-y-2">
          <span className="text-xs font-extrabold text-[#9d4300]">عنوان الفقرة {blockNum}:</span>
          <Input
            value={block.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="اكتب عنوان الفقرة..."
            className="h-12 rounded-2xl border-none bg-[#eff4ff] font-extrabold text-sm text-[#0b1c30]"
          />
        </div>

        {onRemove && (
          <button
            onClick={onRemove}
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-5 py-2.5 text-xs font-extrabold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>حذف هذه الفقرة</span>
          </button>
        )}
      </div>

      {/* Block Meta Card Overview Editor */}
      <div className="rounded-[2rem] bg-white p-6 shadow-xs border border-[#e0c0b1]/50 space-y-4">
        <div className="flex items-center gap-2 text-xs font-extrabold text-[#0b1c30]">
          <BookOpen className="h-4 w-4 text-[#9d4300]" />
          <span>بطاقة المعلومات السريعة (تظهر للطالب قبل بداية هذه الفقرة):</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <Field id="meta-time" label="المدى الزمني المتوقع">
            <Input
              value={block.meta_card?.estimated_time_range || "2 - 5 دقائق"}
              onChange={(e) =>
                onChange({
                  meta_card: {
                    ...block.meta_card,
                    estimated_time_range: e.target.value,
                  },
                })
              }
              placeholder="مثال: 2 - 5 دقائق"
              className="h-11 rounded-xl bg-[#eff4ff] border-none text-xs font-bold"
              id="meta-time-input"
            />
          </Field>

          <Field id="meta-info-count" label="عدد المفاهيم والمعلومات">
            <Input
              type="number"
              value={block.meta_card?.info_count ?? 3}
              onChange={(e) =>
                onChange({
                  meta_card: {
                    ...block.meta_card,
                    info_count: parseInt(e.target.value, 10) || 1,
                  },
                })
              }
              placeholder="مثال: 3"
              className="h-11 rounded-xl bg-[#eff4ff] border-none text-xs font-bold"
              id="meta-info-count-input"
            />
          </Field>

          <Field id="meta-understanding" label="مستوى الفهم المطلوب">
            <select
              id="meta-understanding-select"
              value={block.meta_card?.understanding_level || "سهل"}
              onChange={(e) =>
                onChange({
                  meta_card: {
                    ...block.meta_card,
                    understanding_level: e.target.value as "سهل" | "متوسط" | "صعب",
                  },
                })
              }
              className="h-11 w-full rounded-xl border-none bg-[#eff4ff] px-3 text-xs font-bold text-[#0b1c30]"
            >
              <option value="سهل">🟢 فهم سهل</option>
              <option value="متوسط">🟡 فهم متوسط</option>
              <option value="صعب">🔴 فهم عميق وصعب</option>
            </select>
          </Field>

          <Field id="meta-memorization" label="مستوى الحفظ المطلوب">
            <select
              id="meta-memorization-select"
              value={block.meta_card?.memorization_level || "متوسط"}
              onChange={(e) =>
                onChange({
                  meta_card: {
                    ...block.meta_card,
                    memorization_level: e.target.value as "سهل" | "متوسط" | "صعب",
                  },
                })
              }
              className="h-11 w-full rounded-xl border-none bg-[#eff4ff] px-3 text-xs font-bold text-[#0b1c30]"
            >
              <option value="سهل">🟢 حفظ يسير</option>
              <option value="متوسط">🟡 حفظ متوسط</option>
              <option value="صعب">🔴 حفظ متقن مكثف</option>
            </select>
          </Field>
        </div>
      </div>

      {/* Stages Editing Surface */}
      <ContentFillSurface
        block={block}
        activeStages={previewStages}
        selectedStage={activeStage}
        onSelectStage={setActiveStage}
        onChange={onChange}
      />
    </div>
  );
}

function ContentFillSurface({
  block,
  activeStages,
  selectedStage,
  onSelectStage,
  onChange,
}: {
  block: ParagraphBlock;
  activeStages: FillStage[];
  selectedStage: FillStage | null;
  onSelectStage: (stage: FillStage) => void;
  onChange: (patch: Partial<ParagraphBlock>) => void;
}) {
  const stage =
    selectedStage && activeStages.includes(selectedStage) ? selectedStage : activeStages[0];

  return (
    <div className="space-y-6">
      {/* Sub Stage Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-2 border border-[#e0c0b1]/50">
        {activeStages.map((s, i) => (
          <button
            key={s}
            onClick={() => onSelectStage(s)}
            className={cn(
              "rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer",
              s === stage
                ? "bg-[#9d4300] text-white shadow-xs"
                : "bg-[#eff4ff] text-[#584237] hover:bg-[#dce9ff]",
            )}
          >
            {i + 1}. {getFillStageLabel(s)}
          </button>
        ))}
      </div>

      <div className="rounded-[2rem] bg-white p-6 sm:p-8 shadow-xs border border-[#e0c0b1]/50">
        <InlineStageCanvas stage={stage} block={block} onChange={onChange} />
      </div>
    </div>
  );
}

function getFillStageLabel(stage: FillStage): string {
  if (stage === "quizzes_mcq") return "أسئلة المستوى الأول (MCQ)";
  if (stage === "quizzes_fill") return "أسئلة المستوى الثاني (أكمل)";
  if (stage === "quizzes_essay") return "أسئلة المستوى الثالث (مقالي/علّل)";
  return STAGE_LABELS[stage as Stage];
}

function TeacherMindMapEditor({
  block,
  onChange,
}: {
  block: ParagraphBlock;
  onChange: (patch: Partial<ParagraphBlock>) => void;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.classList.toggle("mindmap-fullscreen-active", isFullscreen);
    }
    return () => {
      if (typeof document !== "undefined") {
        document.body.classList.remove("mindmap-fullscreen-active");
      }
    };
  }, [isFullscreen]);

  const mapData = useMemo(() => {
    return parseBlockMindMap(block);
  }, [block]);

  const handleUpdate = (updated: MindMapData) => {
    onChange({ mind_map_nodes: [updated as unknown as Record<string, unknown>] });
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#e0c0b1]/40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-[#0b1c30]">
              الخريطة الذهنية التفاعلية للفقرة
            </span>
            <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline-block">
              (اسحب العقد وأضف وعدّل بحرية — يُحفظ تلقائياً)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#9d4300] hover:bg-[#833800] px-4 py-2 text-xs font-extrabold text-white transition shadow-sm cursor-pointer"
          >
            <Maximize2 className="h-4 w-4" />
            <span>تكبير المساحة بحرية (ملء الشاشة) ⛶</span>
          </button>
        </div>

        <div
          className="relative w-full rounded-3xl overflow-hidden border border-[#e0c0b1]/50 shadow-sm"
          style={{ height: "520px" }}
        >
          <MindMapCanvas mapData={mapData} onUpdateMap={handleUpdate} hideSideControls={true} />
        </div>
      </div>

      {/* Fullscreen Workspace Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-[#0b1329] p-4 sm:p-6 flex flex-col space-y-4 text-right"
          dir="rtl"
        >
          <div className="flex items-center justify-between bg-white/95 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-sm font-extrabold text-[#0b1c30]">
                محرر الخريطة الذهنية بحرية — {block.title || "الفقرة الحالية"} 📌
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                وضع اللوحة اللانهائية الموسعة (تفاعل وتحكم كامل بالعقد 🖐️)
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#213145] hover:bg-[#0b1c30] px-4 py-2 text-xs font-extrabold text-white transition cursor-pointer shadow-md"
            >
              <Minimize2 className="h-4 w-4" />
              <span>إغلاق التكبير / العودة للدرس 🗗</span>
            </button>
          </div>

          <div className="flex-1 w-full rounded-3xl border border-white/10 shadow-2xl relative">
            <MindMapCanvas mapData={mapData} onUpdateMap={handleUpdate} hideSideControls={false} />
          </div>
        </div>
      )}
    </>
  );
}

function InlineStageCanvas({
  stage,
  block,
  onChange,
}: {
  stage: FillStage;
  block: ParagraphBlock;
  onChange: (patch: Partial<ParagraphBlock>) => void;
}) {
  if (stage === "quizzes_mcq") {
    return <QuizzesEditor block={block} onChange={onChange} type="mcq" />;
  }
  if (stage === "quizzes_fill") {
    return <QuizzesEditor block={block} onChange={onChange} type="fill" />;
  }
  if (stage === "quizzes_essay") {
    return <QuizzesEditor block={block} onChange={onChange} type="essay" />;
  }

  if (stage === "story") {
    return (
      <div className="space-y-4">
        <Field
          id="block-story"
          label="القصة التفاعلية لتثبيت الفهم"
          hint="حدد أي جزء من النص بالماوس واضغط على زر التظليل الأصفر أو الأخضر أسفل صندوق النص."
        >
          <VisualHighlightArea
            id="block-story-text"
            value={block.story}
            onChangeText={(val) => onChange({ story: val })}
            highlights={block.highlights}
            onChangeHighlights={(hl) => onChange({ highlights: hl })}
            rows={6}
            placeholder="اكتب القصة التعليمية هنا..."
          />
        </Field>
      </div>
    );
  }

  if (stage === "examples") {
    return (
      <div className="space-y-4">
        <Field
          id="block-examples"
          label="الأمثلة التوضيحية"
          hint="تظليل بصري حي بدون أي وسوم نصية."
        >
          <VisualHighlightArea
            id="block-examples-text"
            value={block.examples}
            onChangeText={(val) => onChange({ examples: val })}
            highlights={block.highlights}
            onChangeHighlights={(hl) => onChange({ highlights: hl })}
            rows={6}
            placeholder="اكتب الأمثلة والتطبيقات العلمية هنا..."
          />
        </Field>
      </div>
    );
  }

  if (stage === "original") {
    return (
      <div className="space-y-4">
        <Field
          id="block-original"
          label="النص الأصلي بالهندسة البصرية"
          hint="حدد أي كلمة بالماوس لتلوينها وتظليلها بصرياً."
        >
          <VisualHighlightArea
            id="block-original-text"
            onChangeText={(val) => onChange({ full_text: val })}
            highlights={block.highlights}
            onChangeHighlights={(hl) => onChange({ highlights: hl })}
            rows={8}
            placeholder="اكتب النص الأصلي والدقيق هنا..."
          />
        </Field>
      </div>
    );
  }

  if (stage === "baladi_terms") {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-amber-50/80 p-6 border border-amber-200 space-y-4 text-right shadow-2xs">
          <div className="flex items-center gap-2 border-b border-amber-200/80 pb-3">
            <Sparkles className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <h4 className="text-sm font-black text-amber-950">
                💡 نقط خلي بالك منها (التنبيهات والاستبصار الفقهي الدقيق):
              </h4>
              <p className="text-xs font-semibold text-amber-800">
                اكتب هنا القواعد الفقهية والتنبيهات المباشرة للطالب (كل تنبيه في سطر منفصل يبدأ بـ
                💡 خد بالك:)
              </p>
            </div>
          </div>
          <Textarea
            value={block.mnemonic}
            onChange={(e) => onChange({ mnemonic: e.target.value })}
            rows={7}
            placeholder={`💡 خد بالك: الخلع جائز بلا كراهة إذا خافت الزوجة ألا تقيم حدود الله.
💡 خد بالك: إذا كان العوض مجهولاً يقع الخلع بائناً وتدفع الزوجة مهر المثل.`}
            className="rounded-2xl border border-amber-200 bg-white font-bold text-xs text-amber-950 p-4 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed shadow-2xs"
          />
        </div>
      </div>
    );
  }

  if (stage === "mental") {
    return (
      <div className="space-y-4">
        <Field
          id="block-mental"
          label="الروابط والخدع الذهنية لحفظ المعلومة (Mnemonic)"
          hint="اكتب جملة تذكرية أو رابطاً ذهنياً طريفاً يسهل الحفظ."
        >
          <Textarea
            id="block-mental-text"
            value={block.mnemonic}
            onChange={(e) => onChange({ mnemonic: e.target.value })}
            rows={4}
            placeholder="مثال: تذكر أن الخُلع يُدفع فيه عوض مثل الفدية..."
            className="rounded-2xl border-none bg-[#eff4ff] font-medium text-xs text-[#0b1c30]"
          />
        </Field>
      </div>
    );
  }

  if (stage === "funny") {
    return (
      <div className="space-y-4">
        <Field
          id="block-funny"
          label="الرابط العاطفي والقصة الواقعية"
          hint="قصة واقعية قصيرة تعبر عن التطبيق العملي."
        >
          <Textarea
            id="block-funny-text"
            value={block.funny_link}
            onChange={(e) => onChange({ funny_link: e.target.value })}
            rows={4}
            placeholder="اكتب القصة الحياتية أو العاطفية المساعدة..."
            className="rounded-2xl border-none bg-[#eff4ff] font-medium text-xs text-[#0b1c30]"
          />
        </Field>
      </div>
    );
  }

  if (stage === "zaitouna") {
    return (
      <div className="space-y-4">
        <Field
          id="block-zaitouna"
          label="الزيتونة ملخص الجملة الواحدة (Zaitouna)"
          hint="جملة ختامية جامعة تختصر الفقرة بالكامل."
        >
          <Input
            id="block-zaitouna-input"
            value={block.short_sentence}
            onChange={(e) => onChange({ short_sentence: e.target.value })}
            placeholder="مثال: الخُلع فسخ للعقد بعوض معلوم..."
            className="h-12 rounded-2xl border-none bg-[#eff4ff] font-extrabold text-sm text-[#0b1c30]"
          />
        </Field>
      </div>
    );
  }

  if (stage === "mindmap") {
    return <TeacherMindMapEditor block={block} onChange={onChange} />;
  }

  return (
    <div className="p-4 text-xs font-bold text-slate-500 text-center">
      مرحلة {getFillStageLabel(stage)} محرر المحتوى التفاعلي.
    </div>
  );
}

function QuizzesEditor({
  block,
  onChange,
  type,
}: {
  block: ParagraphBlock;
  onChange: (patch: Partial<ParagraphBlock>) => void;
  type: "mcq" | "fill" | "essay";
}) {
  const quizzes = block.quizzes || { mcqs: [], fills: [], essays: [] };
  const items =
    type === "mcq"
      ? quizzes.mcqs || []
      : type === "fill"
        ? quizzes.fills || []
        : quizzes.essays || [];

  return (
    <div className="space-y-4 text-right">
      <div className="flex items-center justify-between border-b border-[#e0c0b1]/30 pb-3">
        <span className="font-extrabold text-xs text-[#0b1c30]">
          {type === "mcq"
            ? "أسئلة الاختيار من متعدد (MCQs)"
            : type === "fill"
              ? "أسئلة إكمال الفراغات (Fill)"
              : "الأسئلة المقالية والتعليلية (Essay)"}
        </span>
        <button
          type="button"
          onClick={() => {
            const newItem =
              type === "mcq"
                ? {
                    id: String(Date.now()),
                    question: "",
                    options: ["", "", "", ""],
                    answer: "",
                    explanation: "",
                  }
                : type === "fill"
                  ? {
                      id: String(Date.now()),
                      question: "",
                      answer: "",
                      explanation: "",
                    }
                  : {
                      id: String(Date.now()),
                      question: "",
                      keywords: [],
                      sampleAnswer: "",
                      explanation: "",
                    };
            const updated = {
              ...quizzes,
              [type === "mcq" ? "mcqs" : type === "fill" ? "fills" : "essays"]: [...items, newItem],
            };
            onChange({ quizzes: updated });
          }}
          className="px-3.5 py-1.5 rounded-full bg-[#9d4300] text-white text-xs font-bold hover:bg-[#833800] transition cursor-pointer flex items-center gap-1"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>إضافة سؤال جديد</span>
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-xs font-semibold text-slate-400 py-6 text-center">
          لا توجد أسئلة مضافة في هذا القسم بعد. اضغط زر الإضافة أعلاه.
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((item: any, i: number) => (
            <div
              key={item.id || i}
              className="p-4 rounded-2xl bg-[#eff4ff]/60 border border-[#e0c0b1]/40 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#9d4300]">سؤال {i + 1}:</span>
                <button
                  type="button"
                  onClick={() => {
                    const filtered = items.filter((_: any, idx: number) => idx !== i);
                    onChange({
                      quizzes: {
                        ...quizzes,
                        [type === "mcq" ? "mcqs" : type === "fill" ? "fills" : "essays"]: filtered,
                      },
                    });
                  }}
                  className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  حذف السؤال
                </button>
              </div>

              <Input
                value={item.question}
                onChange={(e) => {
                  const updated = items.map((q: any, idx: number) =>
                    idx === i ? { ...q, question: e.target.value } : q,
                  );
                  onChange({
                    quizzes: {
                      ...quizzes,
                      [type === "mcq" ? "mcqs" : type === "fill" ? "fills" : "essays"]: updated,
                    },
                  });
                }}
                placeholder="اكتب صيغة السؤال هنا..."
                className="h-11 rounded-xl bg-white border-none text-xs font-bold text-[#0b1c30]"
              />

              {type === "mcq" && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs font-extrabold text-[#0b1c30]">
                    <span>خيارات الإجابة (حدد الإجابة الصحيحة):</span>
                    <span className="text-[11px] font-bold text-[#9d4300]">
                      الإجابة الصحيحة الحالية: {item.answer || "لم تحدد بعد"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(item.options || ["", "", "", ""]).map((opt: string, optIdx: number) => {
                      const isCorrect = item.answer === opt && opt.trim().length > 0;
                      return (
                        <div
                          key={optIdx}
                          className={cn(
                            "flex items-center gap-2 rounded-xl p-2 bg-white border transition",
                            isCorrect
                              ? "border-emerald-500 ring-2 ring-emerald-200"
                              : "border-slate-200",
                          )}
                        >
                          <input
                            type="radio"
                            name={`correct-ans-${i}`}
                            checked={isCorrect}
                            onChange={() => {
                              const updated = items.map((q: any, idx: number) =>
                                idx === i ? { ...q, answer: opt } : q,
                              );
                              onChange({ quizzes: { ...quizzes, mcqs: updated } });
                            }}
                            className="h-4 w-4 text-emerald-600 cursor-pointer"
                            title="حدد كإجابة صحيحة"
                          />
                          <Input
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...(item.options || ["", "", "", ""])];
                              newOpts[optIdx] = e.target.value;
                              const updated = items.map((q: any, idx: number) =>
                                idx === i
                                  ? {
                                      ...q,
                                      options: newOpts,
                                      // Auto update answer if this option was the selected correct answer
                                      answer: q.answer === opt ? e.target.value : q.answer,
                                    }
                                  : q,
                              );
                              onChange({ quizzes: { ...quizzes, mcqs: updated } });
                            }}
                            placeholder={`الخيار ${optIdx + 1}`}
                            className="h-9 rounded-lg bg-[#eff4ff]/40 border-none text-xs font-semibold text-[#0b1c30]"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HardWordsEditor({
  words,
  onChange,
}: {
  words?: HardWord[];
  onChange: (words: HardWord[]) => void;
}) {
  const items = words || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#e0c0b1]/30 pb-3">
        <span className="text-xs font-extrabold text-[#0b1c30]">
          المصطلحات والأحكام المضافة ({items.length})
        </span>
        <button
          type="button"
          onClick={() => {
            onChange([...items, { word: "", explanation: "", type: "مصطلح" }]);
          }}
          className="px-3.5 py-1.5 rounded-full bg-[#9d4300] text-white text-xs font-bold hover:bg-[#833800] transition cursor-pointer flex items-center gap-1"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>إضافة مصطلح</span>
        </button>
      </div>

      <div className="space-y-3">
        {items.map((hw, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-2xl bg-[#eff4ff]/60 border border-[#e0c0b1]/40"
          >
            <Input
              value={hw.word}
              onChange={(e) => {
                const updated = items.map((w, idx) =>
                  idx === i ? { ...w, word: e.target.value } : w,
                );
                onChange(updated);
              }}
              placeholder="المصطلح"
              className="h-10 w-1/3 rounded-xl bg-white border-none text-xs font-bold"
            />
            <Input
              value={hw.explanation}
              onChange={(e) => {
                const updated = items.map((w, idx) =>
                  idx === i ? { ...w, explanation: e.target.value } : w,
                );
                onChange(updated);
              }}
              placeholder="الشرح بالبلدي"
              className="h-10 flex-1 rounded-xl bg-white border-none text-xs"
            />
            <button
              type="button"
              onClick={() => {
                onChange(items.filter((_, idx) => idx !== i));
              }}
              className="text-xs font-bold text-rose-600 hover:underline px-2 cursor-pointer"
            >
              حذف
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
