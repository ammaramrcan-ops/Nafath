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
  Minimize2,
  Plus,
  Save,
  Trash2,
  X,
  Sparkles,
  Settings2,
  Filter,
  BookOpen,
  CheckCircle2,
  Code2,
  Copy,
  FileText,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  defaultLesson,
  effectiveStages,
  normalizeBlock,
  type HardWord,
  type Lesson,
  type ParagraphBlock,
  type TextHighlight,
} from "@/lib/lesson-data";
import { useSettings, STAGE_LABELS, DEFAULT_STAGE_ORDER, type Stage } from "@/lib/settings";
import { saveToLibrary } from "@/lib/lesson-library";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VisualHighlightArea } from "@/components/VisualHighlightArea";
import { cn } from "@/lib/utils";
import { MindMapCanvas } from "@/components/MindMapCanvas";
import {
  getDefaultKhulMindMap,
  createEmptySubjectMindMap,
  parseBlockMindMap,
  type MindMapData,
} from "@/lib/mind-map-types";

type FillStage = Stage | "quizzes_mcq" | "quizzes_fill" | "quizzes_essay";

export const Route = createFileRoute("/teacher")({
  component: TeacherPage,
  head: () => ({
    meta: [{ title: "نفاذ - واجهة المعلم" }],
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
      highlights: [],
      mnemonic: "",
      funny_link: "",
      mind_map_nodes: [],
      visual_url: "",
      enabled_stages: DEFAULT_STAGE_ORDER,
      stage_order: DEFAULT_STAGE_ORDER,
      quizzes: { mcqs: [], fills: [], essays: [] },
    },
    id - 1
  );
}

function emptyLesson(): Lesson {
  return {
    title: "",
    estimatedTime: "",
    size: "",
    topics: [],
    levelStageOrders: {
      1: ["story", "baladi_terms", "quizzes_mcq", "paper_summary"],
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
    },
    levelDisabledStages: { 1: [], 2: [], 3: [] },
    blocks: [emptyBlock(1)],
  };
}

const STORAGE_KEY = "teacher.lesson.draft";

const LEVEL_DEFAULT_STAGES: Record<1 | 2 | 3, Stage[]> = {
  1: ["story", "baladi_terms", "quizzes_mcq", "paper_summary"],
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
          blocks: (parsed.blocks ?? []).map((b: any, i: number) =>
            normalizeBlock(b, i)
          ),
        };
      }
    } catch {
      /* ignore */
    }
    return khulLesson;
  });

  const [step, setStep] = useState(1);
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<
    1 | 2 | 3 | "all"
  >(1);
  const [libSaved, setLibSaved] = useState(false);

  // 3-Step Dedicated Wizard Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [jsonInput1, setJsonInput1] = useState("");
  const [jsonInput2, setJsonInput2] = useState("");
  const [jsonInput3, setJsonInput3] = useState("");

  const handleImportStepContent = (jsonStr: string) => {
    if (!jsonStr.trim()) {
      toast.error("يرجى لصق كود JSON 1 أولاً للمتابعة.");
      return false;
    }
    try {
      const data = JSON.parse(jsonStr);
      const title = data.title || data.lesson_title || lesson.title;
      const rawBlocks = Array.isArray(data.blocks) ? data.blocks : Array.isArray(data.sections) ? data.sections : [data];

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

      updateLesson({ title, blocks: newBlocks });
      toast.success("تم استيراد الشرح والقصص والمصطلحات بنجاح! 📖✨");
      return true;
    } catch {
      toast.error("كود JSON غير صالح. يرجى التثبت من الصيغة.");
      return false;
    }
  };

  const handleImportStepMindMap = (jsonStr: string) => {
    if (!jsonStr.trim()) {
      toast.error("يرجى لصق كود JSON 2 أولاً للمتابعة.");
      return false;
    }
    try {
      const data = JSON.parse(jsonStr);
      const mindMapList = Array.isArray(data.mind_maps_by_block)
        ? data.mind_maps_by_block
        : Array.isArray(data.blocks)
        ? data.blocks
        : null;

      if (mindMapList) {
        const updatedBlocks = lesson.blocks.map((b, i) => {
          const item = mindMapList[i] || mindMapList.find((m: any) => m.block_id === b.id) || mindMapList[0];
          const nodes = item ? (item.mind_map_nodes || item.nodes || item) : b.mind_map_nodes;
          return {
            ...b,
            mind_map_nodes: Array.isArray(nodes) ? nodes : [nodes],
          };
        });
        updateLesson({ blocks: updatedBlocks });
      } else {
        let nodes = data.mind_map_nodes || data.nodes || data;
        if (!Array.isArray(nodes) && typeof nodes === "object") {
          nodes = [nodes];
        }
        const updatedBlocks = lesson.blocks.map((b) => ({
          ...b,
          mind_map_nodes: nodes,
        }));
        updateLesson({ blocks: updatedBlocks });
      }

      toast.success("تم استيراد الخريطة الذهنية المخصصة لكل فقرة بنجاح! 🎨✨");
      return true;
    } catch {
      toast.error("كود JSON غير صالح لإنشاء الخريطة الذهنية.");
      return false;
    }
  };

  const handleImportStepQuizzes = (jsonStr: string) => {
    if (!jsonStr.trim()) {
      toast.error("يرجى لصق كود JSON 3 أولاً لإنهاء الدرس.");
      return false;
    }
    try {
      const data = JSON.parse(jsonStr);
      const quizList = Array.isArray(data.quizzes_by_block)
        ? data.quizzes_by_block
        : Array.isArray(data.blocks)
        ? data.blocks
        : [data];

      const updatedBlocks = lesson.blocks.map((b, i) => {
        const item = quizList[i] || quizList.find((q: any) => q.block_id === b.id) || quizList[0];
        if (!item) return b;
        const norm = normalizeBlock(item, i);
        return {
          ...b,
          quizzes: {
            mcqs: norm.quizzes.mcqs.length > 0 ? norm.quizzes.mcqs : b.quizzes.mcqs,
            fills: norm.quizzes.fills.length > 0 ? norm.quizzes.fills : b.quizzes.fills,
            essays: norm.quizzes.essays.length > 0 ? norm.quizzes.essays : b.quizzes.essays,
          },
        };
      });

      updateLesson({ blocks: updatedBlocks });
      toast.success("تم استيراد أسئلة الـ MCQs المخصصة لكل فقرة بنجاح! 📝✨");
      return true;
    } catch {
      toast.error("كود JSON غير صالح لأسئلة الاختبارات.");
      return false;
    }
  };

  const blockIdx = step - 1;

  const updateLesson = (patch: Partial<Lesson>) =>
    setLesson((prev) => {
      const next = { ...prev, ...patch };
      saveToLibrary(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    setStep(lesson.blocks.length + 1);
  };

  const removeBlock = (idx: number) => {
    setLesson((prev) => {
      const next = {
        ...prev,
        blocks: prev.blocks
          .filter((_, i) => i !== idx)
          .map((b, i) => ({ ...b, id: i + 1 })),
      };
      saveToLibrary(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    setStep((s) => Math.min(s, lesson.blocks.length - 1));
  };

  const handleSaveToLibrary = () => {
    try {
      saveToLibrary(lesson);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lesson));
      setLibSaved(true);
      setTimeout(() => setLibSaved(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handlePreviewStudent = () => {
    try {
      saveToLibrary(lesson);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lesson));
      localStorage.setItem("nafath.openLesson", JSON.stringify(lesson));
      sessionStorage.setItem("nafath.openLesson", JSON.stringify(lesson));
      toast.success("جاري فتح تجربة الطالب للدرس الحالية... 🎓");
      setTimeout(() => {
        window.location.href = "/";
      }, 300);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="min-h-screen bg-[#f8f9ff] font-sans text-[#0b1c30] dir-rtl pb-28"
      dir="rtl"
    >
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[#e0c0b1]/30 bg-[#f8f9ff]/90 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3 text-xs sm:text-sm font-extrabold text-[#584237]">
            <Link
              to="/"
              className="flex items-center gap-1 hover:text-[#9d4300] transition"
            >
              <span>الرئيسية</span>
            </Link>
            <span className="text-[#e0c0b1] font-normal">›</span>
            <span className="text-[#0b1c30] font-extrabold">
              واجهة المعلم — تصميم وتعديل الدرس
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setWizardStep(1);
                setShowImportModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-[#8127cf] hover:bg-[#6b1fb0] px-5 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md transition cursor-pointer"
            >
              <Code2 className="h-4 w-4 text-white" />
              <span>استيراد كود JSON عبر 3 خطوات 📥</span>
            </button>

            <button
              onClick={handlePreviewStudent}
              className="inline-flex items-center gap-2 rounded-full bg-[#9d4300] hover:bg-[#833800] px-5 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md transition cursor-pointer"
            >
              <Eye className="h-4 w-4 text-white" />
              <span>معاينة وتجربة الدرس كطالب 👁️</span>
            </button>

            <button
              onClick={handleSaveToLibrary}
              className="inline-flex items-center gap-2 rounded-full bg-[#213145] hover:bg-[#0b1c30] px-7 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md transition cursor-pointer"
            >
              <BookOpen className="h-4 w-4 text-[#ffdbca]" />
              <span>
                {libSaved
                  ? "تمت الإضافة للمكتبة! ✨"
                  : "اعتماد وحفظ الدرس بالمكتبة"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* 3-Step Wizard Modal Window */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-[99999] dir-rtl overflow-y-auto">
          <div className="bg-white border border-[#e0c0b1] rounded-3xl p-6 sm:p-10 max-w-4xl w-full shadow-2xl space-y-6 text-right max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#e0c0b1]/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#ffdbca] text-[#9d4300] flex items-center justify-center font-black shadow-xs">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#0b1c30]">نظام إضافة الدرس الذكي (3 خطوات متتابعة بـ JSON) 🚀</h3>
                  <p className="text-xs font-semibold text-[#584237]/70">انسخ البرومبت لكل مرحلة، الصقه في الذكاء الاصطناعي، ثم الصق كود JSON الناتج هنا</p>
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

            {/* Stepper Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setWizardStep(1)}
                className={cn(
                  "p-4 rounded-2xl border text-right transition cursor-pointer flex items-center gap-3",
                  wizardStep === 1
                    ? "bg-[#9d4300] text-white border-[#9d4300] shadow-md"
                    : "bg-[#fffaf7] text-[#584237] border-[#ffdbca] hover:bg-[#ffeddf]"
                )}
              >
                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0", wizardStep === 1 ? "bg-white text-[#9d4300]" : "bg-[#ffdbca] text-[#9d4300]")}>
                  1
                </div>
                <div>
                  <h4 className="text-xs font-extrabold">المرحلة الأولى</h4>
                  <p className="text-[11px] opacity-90 font-semibold">الشرح والقصص والمصطلحات 📖</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setWizardStep(2)}
                className={cn(
                  "p-4 rounded-2xl border text-right transition cursor-pointer flex items-center gap-3",
                  wizardStep === 2
                    ? "bg-[#8127cf] text-white border-[#8127cf] shadow-md"
                    : "bg-[#eff4ff] text-[#584237] border-[#e0c0b1]/60 hover:bg-[#dce9ff]"
                )}
              >
                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0", wizardStep === 2 ? "bg-white text-[#8127cf]" : "bg-[#e0e7ff] text-[#8127cf]")}>
                  2
                </div>
                <div>
                  <h4 className="text-xs font-extrabold">المرحلة الثانية</h4>
                  <p className="text-[11px] opacity-90 font-semibold">الخريطة الذهنية التفاعلية 🎨</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setWizardStep(3)}
                className={cn(
                  "p-4 rounded-2xl border text-right transition cursor-pointer flex items-center gap-3",
                  wizardStep === 3
                    ? "bg-emerald-700 text-white border-emerald-700 shadow-md"
                    : "bg-[#f0fdf4] text-[#584237] border-emerald-200 hover:bg-emerald-100/70"
                )}
              >
                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0", wizardStep === 3 ? "bg-white text-emerald-800" : "bg-emerald-200 text-emerald-800")}>
                  3
                </div>
                <div>
                  <h4 className="text-xs font-extrabold">المرحلة الثالثة</h4>
                  <p className="text-[11px] opacity-90 font-semibold">أسئلة الـ MCQs وبنك الأسئلة 📝</p>
                </div>
              </button>
            </div>

            {/* SCREEN 1: Content & Story JSON */}
            {wizardStep === 1 && (
              <div className="space-y-6 pt-2">
                <div className="bg-[#fffaf7] border border-[#ffdbca] rounded-3xl p-6 space-y-4 text-right">
                  <div className="flex items-center justify-between border-b border-[#ffdbca]/60 pb-3">
                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-[#9d4300] flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        <span>البرومبت المخصص 1: (الشرح والقصص والمصطلحات 📖)</span>
                      </h3>
                      <p className="text-xs text-[#584237]/70 font-semibold">انسخ هذا الأمر والصقه في نموذج الذكاء الاصطناعي (ChatGPT / Claude / Gemini)</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const promptText = `أنت خبير في التصميم التعليمي لمنصة "نفاذ - Nafath".\nقم بتحويل النص/الموضوع أدناه إلى كود JSON مخصص لـ (الشرح والقصص والمصطلحات) فقط، وفق الهيكل الآتي:\n{\n  "title": "عنوان الدرس الرئيسي",\n  "blocks": [\n    {\n      "id": 1,\n      "title": "عنوان الفقرة الأولى",\n      "short_sentence": "الفكرة الرئيسية المختصرة جداً",\n      "story": "قصة تشبيهية عامية طريفة بالبلدي تشرح المفهوم بأسلوب دايركت وممتع.",\n      "examples": "مثال تطبيقي من الحياة اليومية.",\n      "full_text": "النص العلمي الكامل والمشروح بدقة.",\n      "hard_words": [\n        { "term": "المصطلح", "definition": "التفسير والشرح بالبلدي بين قوسين" }\n      ],\n      "mnemonic": "جملة تذكّر ذكية ومختصرة لبناء رابط ذهني.",\n      "funny_link": "ربط طريف وفكاهي لترسيخ المعلومة في الذاكرة."\n    }\n  ]\n}\n\nأخرج النتيجة في مربع كود JSON الصافي فقط وبدون أي مقدمات.\n\n---\n[الصق نص أو موضوع الدرس المطلوب تحويله هنا]`;
                        navigator.clipboard.writeText(promptText);
                        toast.success("تم نسخ برومبت الشرح والقصص بنجاح! 📋");
                      }}
                      className="px-5 py-2 bg-[#9d4300] text-white rounded-full text-xs font-extrabold hover:bg-[#833800] transition cursor-pointer shadow-xs flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      <span>نسخ البرومبت 1 📋</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3 text-right">
                  <label className="text-sm font-extrabold text-[#0b1c30] block">
                    الصق كود JSON الناتج (JSON 1) الخاص بالشرح والقصص أدناه:
                  </label>
                  <textarea
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
                      <span>اعتماد وانتقال للخطوة 2 (الخريطة الذهنية)</span>
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN 2: MindMap JSON */}
            {wizardStep === 2 && (
              <div className="space-y-6 pt-2">
                <div className="bg-[#eff4ff] border border-[#e0c0b1]/60 rounded-3xl p-6 space-y-4 text-right">
                  <div className="flex items-center justify-between border-b border-[#e0c0b1]/40 pb-3">
                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-[#8127cf] flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        <span>البرومبت المخصص 2: (الخريطة الذهنية التفاعلية لكل فقرة 🎨)</span>
                      </h3>
                      <p className="text-xs text-[#584237]/70 font-semibold">انسخ هذا الأمر والصقه في الذكاء الاصطناعي بعد إعطائه نص الشرح</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const promptText = `أنت خبير رسم الخرائط الذهنية لمنصة "نفاذ - Nafath".\nبناءً على موضوع الدرس أو الفقرات أدناه، قم بتوليد كود JSON لخريطة ذهنية شجرية تفصيلية مخصصة لكل فقرة على حدة (Root -> Categories -> Subtopics -> Details)، وفق الهيكل الآتي:\n{\n  "mind_maps_by_block": [\n    {\n      "block_id": 1,\n      "block_title": "عنوان الفقرة الأولى",\n      "mind_map_nodes": [\n        { "id": "b1_root", "text": "العنوان الرئيسي للفقرة الأولى", "parentId": null },\n        { "id": "b1_n1", "text": "1. الفرع الرئيسي الأول للفقرة 1", "parentId": "b1_root" },\n        { "id": "b1_n1_1", "text": "تفصيل فرعي 1.1", "parentId": "b1_n1" },\n        { "id": "b1_n1_2", "text": "تفصيل فرعي 1.2 أو شاهد/دليل", "parentId": "b1_n1" },\n        { "id": "b1_n2", "text": "2. الفرع الرئيسي الثاني للفقرة 1", "parentId": "b1_root" },\n        { "id": "b1_n2_1", "text": "تفصيل فرعي 2.1", "parentId": "b1_n2" }\n      ]\n    }\n  ]\n}\n\nأخرج النتيجة في مربع كود JSON الصافي فقط وبدون أي مقدمات.\n\n---\n[الصق نص أو موضوع الدرس المطلوب تحويله هنا]`;
                        navigator.clipboard.writeText(promptText);
                        toast.success("تم نسخ برومبت الخريطة الذهنية بنجاح! 📋");
                      }}
                      className="px-5 py-2 bg-[#8127cf] text-white rounded-full text-xs font-extrabold hover:bg-[#6b1fb0] transition cursor-pointer shadow-xs flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      <span>نسخ البرومبت 2 📋</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3 text-right">
                  <label className="text-sm font-extrabold text-[#0b1c30] block">
                    الصق كود JSON الناتج (JSON 2) الخاص بالخريطة الذهنية أدناه:
                  </label>
                  <textarea
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
                        const ok = handleImportStepMindMap(jsonInput2);
                        if (ok) setWizardStep(3);
                      }}
                      className="px-8 py-3 bg-[#8127cf] text-white rounded-full text-sm font-extrabold hover:bg-[#6b1fb0] transition cursor-pointer shadow-md flex items-center gap-2"
                    >
                      <span>اعتماد وانتقال للخطوة 3 (أسئلة الـ MCQs)</span>
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN 3: Block MCQs JSON */}
            {wizardStep === 3 && (
              <div className="space-y-6 pt-2">
                <div className="bg-[#f0fdf4] border border-emerald-200 rounded-3xl p-6 space-y-4 text-right">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3">
                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-emerald-950 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                        <span>البرومبت المخصص 3: (أسئلة الـ MCQs وبنك الأسئلة لكل فقرة 📝)</span>
                      </h3>
                      <p className="text-xs text-[#584237]/70 font-semibold">انسخ هذا الأمر والصقه في الذكاء الاصطناعي لتوليد 5 أسئلة خيار من متعدد حصرية لكل فقرة</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const promptText = `أنت خبير إعداد الاختبارات لمنصة "نفاذ - Nafath".\nبناءً على فقرات الدرس أدناه، صغ كود JSON لأسئلة الاختبارات والـ MCQs، بشرط صارم: كل فقرة (Block) تحتوي على 5 أسئلة اختيار من متعدد (MCQ) حصرية ومطابقة 100% لنص وقصة هذه الفقرة فقط دون أي سؤال عن فقرات أخرى!\n\nالهيكل المطلوب:\n{\n  "quizzes_by_block": [\n    {\n      "block_id": 1,\n      "quizzes": {\n        "mcqs": [\n          {\n            "question": "سؤال 1 خاص بالفقرة 1 فقط؟",\n            "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],\n            "correct_answer": "خيار 1"\n          },\n          {\n            "question": "سؤال 2 خاص بالفقرة 1 فقط؟",\n            "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],\n            "correct_answer": "خيار 1"\n          },\n          {\n            "question": "سؤال 3 خاص بالفقرة 1 فقط؟",\n            "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],\n            "correct_answer": "خيار 1"\n          },\n          {\n            "question": "سؤال 4 خاص بالفقرة 1 فقط؟",\n            "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],\n            "correct_answer": "خيار 1"\n          },\n          {\n            "question": "سؤال 5 خاص بالفقرة 1 فقط؟",\n            "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],\n            "correct_answer": "خيار 1"\n          }\n        ],\n        "fills": [\n          { "question": "سؤال أكمل الفراغ 1 للفقرة 1", "answer": "الكلمة المناسبة" }\n        ],\n        "essays": [\n          { "question": "سؤال علل أو فكري للفقرة 1؟", "answer": "الإجابة النموذجية" }\n        ]\n      }\n    }\n  ]\n}\n\nأخرج النتيجة في مربع كود JSON الصافي فقط وبدون أي مقدمات.\n\n---\n[الصق نص أو موضوع الدرس المطلوب تحويله هنا]`;
                        navigator.clipboard.writeText(promptText);
                        toast.success("تم نسخ برومبت الأسئلة بنجاح! 📋");
                      }}
                      className="px-5 py-2 bg-emerald-700 text-white rounded-full text-xs font-extrabold hover:bg-emerald-800 transition cursor-pointer shadow-xs flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      <span>نسخ البرومبت 3 📋</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3 text-right">
                  <label className="text-sm font-extrabold text-[#0b1c30] block">
                    الصق كود JSON الناتج (JSON 3) الخاص بالأسئلة والـ MCQs أدناه:
                  </label>
                  <textarea
                    rows={10}
                    value={jsonInput3}
                    onChange={(e) => setJsonInput3(e.target.value)}
                    placeholder="الصق كود JSON 3 هنا..."
                    className="w-full bg-[#f8f9ff] border border-[#e0c0b1] rounded-2xl p-4 text-xs font-mono text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-emerald-600 leading-relaxed"
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
                        const ok = handleImportStepQuizzes(jsonInput3);
                        if (ok) {
                          handleSaveToLibrary();
                          setShowImportModal(false);
                          handlePreviewStudent();
                        }
                      }}
                      className="px-8 py-3.5 bg-emerald-700 bg-gradient-to-r from-emerald-700 to-emerald-800 text-white rounded-full text-sm font-extrabold hover:from-emerald-800 hover:to-emerald-900 transition cursor-pointer shadow-lg flex items-center gap-2"
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
          {lesson.blocks.map((b, i) => (
            <button
              key={b.id}
              onClick={() => setStep(i + 1)}
              className={cn(
                "rounded-2xl px-5 py-3 text-xs sm:text-sm font-extrabold transition cursor-pointer",
                step === i + 1
                  ? "bg-[#213145] text-white shadow-md"
                  : "bg-[#eaf1ff] text-[#584237] hover:bg-[#dce9ff]"
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
                  : "bg-[#eff4ff] text-[#584237] border-transparent hover:bg-[#dce9ff]"
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>مراحل المستوى الأول (3 مراحل)</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedLevelFilter(2)}
              className={cn(
                "py-3.5 px-4 rounded-full text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2 border",
                selectedLevelFilter === 2
                  ? "bg-[#00875a] text-white border-[#00875a] shadow-sm"
                  : "bg-[#eff4ff] text-[#584237] border-transparent hover:bg-[#dce9ff]"
              )}
            >
              <span className="w-3.5 h-3.5 rounded-full border-2 border-current" />
              <span>مراحل المستوى الثاني (10 مراحل)</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedLevelFilter(3)}
              className={cn(
                "py-3.5 px-4 rounded-full text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2 border",
                selectedLevelFilter === 3
                  ? "bg-[#00875a] text-white border-[#00875a] shadow-sm"
                  : "bg-[#eff4ff] text-[#584237] border-transparent hover:bg-[#dce9ff]"
              )}
            >
              <span className="w-3.5 h-3.5 rounded-full border-2 border-current" />
              <span>مراحل المستوى الثالث (11 مرحلة)</span>
            </button>
          </div>

          {/* Seamless Inline Modern Stage Sequence Editor */}
          <div className="pt-4 border-t border-[#e0c0b1]/30">
            <GlobalLevelSequenceEditor
              lesson={lesson}
              activeLevel={
                selectedLevelFilter === "all" ? 1 : selectedLevelFilter
              }
              onChange={(patch) => updateLesson(patch)}
            />
          </div>
        </div>

        {/* STEP 1..N: Block Editing */}
        {step > 0 && blockIdx < lesson.blocks.length && (
          <BlockEditor
            block={lesson.blocks[blockIdx]}
            blockNum={blockIdx + 1}
            total={lesson.blocks.length}
            selectedLevelFilter={selectedLevelFilter}
            lessonLevelStageOrders={lesson.levelStageOrders}
            lessonLevelDisabledStages={lesson.levelDisabledStages}
            onChange={(patch) => updateBlock(blockIdx, patch)}
            onRemove={
              lesson.blocks.length > 1 ? () => removeBlock(blockIdx) : undefined
            }
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
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-extrabold text-[#0b1c30]">
        {label}
      </label>
      {hint && (
        <p className="text-[11px] font-semibold text-[#584237]/70">{hint}</p>
      )}
      {children}
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
  const levelOrders = lesson.levelStageOrders ?? LEVEL_DEFAULT_STAGES;
  const levelDisabled = lesson.levelDisabledStages ?? { 1: [], 2: [], 3: [] };

  const currentLevelOrder =
    levelOrders[activeLevel] || LEVEL_DEFAULT_STAGES[activeLevel];
  const disabledSet = new Set<Stage>(levelDisabled[activeLevel] || []);

  const fullStageList = useMemo(() => {
    const valid = currentLevelOrder.filter((s) =>
      (DEFAULT_STAGE_ORDER as string[]).includes(s)
    );
    const missing = (DEFAULT_STAGE_ORDER as string[]).filter(
      (s) => !valid.includes(s)
    );
    return [...valid, ...missing];
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
    const nextSet = new Set(disabledSet);
    if (nextSet.has(stage)) {
      nextSet.delete(stage);
    } else {
      nextSet.add(stage);
    }
    onChange({
      levelDisabledStages: {
        ...levelDisabled,
        [activeLevel]: Array.from(nextSet),
      },
    });
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
        <h3 className="text-base font-extrabold text-[#0b1c30]">
          إعداد وتنسيق مراحل المستوى {activeLevel}
        </h3>
        <span className="text-xs font-semibold text-[#584237]/70">
          المراحل المفعّلة تظهر بوضوح، والمعطّلة تظهر بشكل شفاف خفيف 👁️
        </span>
      </div>

      {/* Modern Bento Grid of Stages (Matches modern Zen aesthetic) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fullStageList.map((stage, idx) => {
          const isBaseForLevel =
            LEVEL_DEFAULT_STAGES[activeLevel].includes(stage);
          const isDisabled = disabledSet.has(stage) || !isBaseForLevel;

          return (
            <div
              key={stage}
              className={cn(
                "flex items-center justify-between gap-3 rounded-2xl border p-4 transition-all",
                isDisabled
                  ? "bg-slate-50 border-dashed border-slate-300 text-slate-400 opacity-55 hover:opacity-85"
                  : "bg-white text-[#0b1c30] border-[#e0c0b1]/40 shadow-2xs hover:border-[#9d4300]/40"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold shrink-0",
                    isDisabled
                      ? "bg-slate-200 text-slate-500"
                      : "bg-[#ffdbca]/40 text-[#9d4300]"
                  )}
                >
                  {idx + 1}
                </span>
                <span className="text-xs font-extrabold truncate">
                  {STAGE_LABELS[stage]}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleStageDisabled(stage)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-extrabold transition cursor-pointer border",
                    isDisabled
                      ? "bg-slate-200 text-slate-600 border-slate-300 hover:bg-emerald-100 hover:text-emerald-900"
                      : "bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200"
                  )}
                >
                  {isDisabled ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                  <span>{isDisabled ? "معطّلة" : "مفعّلة"}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveStage(idx, -1)}
                    disabled={idx === 0}
                    className="rounded-lg p-1.5 text-[#584237] hover:bg-[#eff4ff] disabled:opacity-20 cursor-pointer"
                    title="تقديم المرحلة للأعلى"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStage(idx, 1)}
                    disabled={idx === fullStageList.length - 1}
                    className="rounded-lg p-1.5 text-[#584237] hover:bg-[#eff4ff] disabled:opacity-20 cursor-pointer"
                    title="تأخير المرحلة لأسفل"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
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
  total,
  selectedLevelFilter,
  lessonLevelStageOrders,
  lessonLevelDisabledStages,
  onChange,
  onRemove,
}: {
  block: ParagraphBlock;
  blockNum: number;
  total: number;
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
      lessonLevelDisabledStages
    ) as FillStage[];
  }, [
    block,
    selectedLevelFilter,
    lessonLevelStageOrders,
    lessonLevelDisabledStages,
  ]);

  return (
    <div className="space-y-6">
      {/* Block Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] bg-white p-6 shadow-xs border border-[#e0c0b1]/50">
        <div className="flex-1 min-w-[280px] space-y-2">
          <span className="text-xs font-extrabold text-[#9d4300]">
            عنوان الفقرة {blockNum}:
          </span>
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
          <Field label="المدى الزمني المتوقع">
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
            />
          </Field>

          <Field label="عدد المفاهيم والمعلومات">
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
            />
          </Field>

          <Field label="مستوى الفهم المطلوب">
            <select
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

          <Field label="مستوى الحفظ المطلوب">
            <select
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
    selectedStage && activeStages.includes(selectedStage)
      ? selectedStage
      : activeStages[0];

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
                : "bg-[#eff4ff] text-[#584237] hover:bg-[#dce9ff]"
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
    onChange({ mind_map_nodes: [updated as unknown as string] });
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#e0c0b1]/40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-[#0b1c30]">الخريطة الذهنية التفاعلية للفقرة</span>
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
        <div className="fixed inset-0 z-50 bg-[#0b1329] p-4 sm:p-6 flex flex-col space-y-4 text-right" dir="rtl">
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
          label="القصة التفاعلية لتثبيت الفهم"
          hint="حدد أي جزء من النص بالماوس واضغط على زر التظليل الأصفر أو الأخضر أسفل صندوق النص."
        >
          <VisualHighlightArea
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
          label="الأمثلة التوضيحية"
          hint="تظليل بصري حي بدون أي وسوم نصية."
        >
          <VisualHighlightArea
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
          label="النص الأصلي بالهندسة البصرية"
          hint="حدد أي كلمة بالماوس لتلوينها وتظليلها بصرياً."
        >
          <VisualHighlightArea
            value={block.full_text}
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
      <div className="space-y-4">
        <Field
          label="شرح المصطلحات والأحكام بالبلدي"
          hint="أضف الكلمات والمفاهيم وشرحها البسيط المعاصر لتسهيل الاستيعاب."
        >
          <HardWordsEditor
            words={block.hard_words}
            onChange={(words) => onChange({ hard_words: words })}
          />
        </Field>
      </div>
    );
  }

  if (stage === "mental") {
    return (
      <div className="space-y-4">
        <Field
          label="الروابط والخدع الذهنية لحفظ المعلومة (Mnemonic)"
          hint="اكتب جملة تذكرية أو رابطاً ذهنياً طريفاً يسهل الحفظ."
        >
          <Textarea
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
          label="الرابط العاطفي والقصة الواقعية"
          hint="قصة واقعية قصيرة تعبر عن التطبيق العملي."
        >
          <Textarea
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
          label="الزيتونة ملخص الجملة الواحدة (Zaitouna)"
          hint="جملة ختامية جامعة تختصر الفقرة بالكامل."
        >
          <Input
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
              [type === "mcq"
                ? "mcqs"
                : type === "fill"
                ? "fills"
                : "essays"]: [...items, newItem],
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
                <span className="text-xs font-extrabold text-[#9d4300]">
                  سؤال {i + 1}:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const filtered = items.filter(
                      (_: any, idx: number) => idx !== i
                    );
                    onChange({
                      quizzes: {
                        ...quizzes,
                        [type === "mcq"
                          ? "mcqs"
                          : type === "fill"
                          ? "fills"
                          : "essays"]: filtered,
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
                    idx === i ? { ...q, question: e.target.value } : q
                  );
                  onChange({
                    quizzes: {
                      ...quizzes,
                      [type === "mcq"
                        ? "mcqs"
                        : type === "fill"
                        ? "fills"
                        : "essays"]: updated,
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
                    {(item.options || ["", "", "", ""]).map(
                      (opt: string, optIdx: number) => {
                        const isCorrect = item.answer === opt && opt.trim().length > 0;
                        return (
                          <div
                            key={optIdx}
                            className={cn(
                              "flex items-center gap-2 rounded-xl p-2 bg-white border transition",
                              isCorrect ? "border-emerald-500 ring-2 ring-emerald-200" : "border-slate-200"
                            )}
                          >
                            <input
                              type="radio"
                              name={`correct-ans-${i}`}
                              checked={isCorrect}
                              onChange={() => {
                                const updated = items.map((q: any, idx: number) =>
                                  idx === i ? { ...q, answer: opt } : q
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
                                    : q
                                );
                                onChange({ quizzes: { ...quizzes, mcqs: updated } });
                              }}
                              placeholder={`الخيار ${optIdx + 1}`}
                              className="h-9 rounded-lg bg-[#eff4ff]/40 border-none text-xs font-semibold text-[#0b1c30]"
                            />
                          </div>
                        );
                      }
                    )}
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
            onChange([
              ...items,
              { word: "", explanation: "", type: "مصطلح" },
            ]);
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
                  idx === i ? { ...w, word: e.target.value } : w
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
                  idx === i ? { ...w, explanation: e.target.value } : w
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
