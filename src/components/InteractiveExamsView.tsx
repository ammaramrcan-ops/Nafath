import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Brain,
  Zap,
  RotateCcw,
  Check,
  BookOpen,
  Send,
  Plus,
  BarChart2,
  Trash2,
  StickyNote,
  AlertTriangle,
  Lightbulb,
  X,
  ChevronRight,
  ChevronLeft,
  PauseCircle,
  PlayCircle,
  PenTool,
  Pencil,
  Search,
  Code,
  Copy,
  FileCode,
  Star,
  Edit3,
  TrendingUp,
  RefreshCw,
  Play,
} from "lucide-react";
import {
  evaluateQuestionAnswer,
  generateTopicReport,
  getQuestionBank,
  parseRawTextToExamQuestions,
  saveQuestionBank,
  getStoredMistakes,
  removeMistake,
  getStoredLessonNotes,
  addLessonNote,
  deleteLessonNote,
  type ExamQuestion,
  type ExamQuestionType,
  type QuestionPerformance,
  type ExamMistake,
  type TopicReportItem,
  type LessonNote,
} from "@/lib/interactive-exams-service";
import { getLibrary } from "@/lib/lesson-library";
import { EditQuestionModal } from "./EditQuestionModal";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function InteractiveExamsView({
  initialTab = "exam",
}: {
  initialTab?: "exam" | "stats" | "mistakes" | "notebook" | "ingest";
}) {
  const navigate = useNavigate();
  const library = useMemo(() => {
    try {
      return getLibrary();
    } catch {
      return [];
    }
  }, []);
  const [bankQuestions, setBankQuestions] = useState<ExamQuestion[]>(() => getQuestionBank());
  const [activeTab, setActiveTab] = useState<"exam" | "stats" | "mistakes" | "notebook" | "ingest">(
    initialTab,
  );

  // Question Type Selector Modal State
  const [showTypeModal, setShowTypeModal] = useState(false);

  // Edit / Add Question Modal State
  const [showEditQModal, setShowEditQModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null);

  // Ingestion Mode State (list, json, ai)
  const [ingestSubMode, setIngestSubMode] = useState<"json" | "manual" | "ai" | "list">("list");
  const [jsonInput, setJsonInput] = useState("");
  const [bankSearchQuery, setBankSearchQuery] = useState("");

  // Mistake Bank State
  const [mistakes, setMistakes] = useState<ExamMistake[]>(() => getStoredMistakes());

  // Lesson Notes / Notebook State
  const [notes, setNotes] = useState<LessonNote[]>(() => getStoredLessonNotes());
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(() => {
    const initialNotes = getStoredLessonNotes();
    return initialNotes.length > 0 ? initialNotes[0].id : null;
  });
  const [noteTitle, setNoteTitle] = useState(() => {
    const initialNotes = getStoredLessonNotes();
    return initialNotes.length > 0 ? initialNotes[0].lessonTitle : "";
  });
  const [noteContent, setNoteContent] = useState(() => {
    const initialNotes = getStoredLessonNotes();
    return initialNotes.length > 0 ? initialNotes[0].content : "";
  });
  const [isZenActive, setIsZenActive] = useState(false);

  // Exam Session State
  const [isExamActive, setIsExamActive] = useState(false);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [performances, setPerformances] = useState<QuestionPerformance[]>([]);
  const [isExamCompleted, setIsExamCompleted] = useState(false);

  // Per-Question Latency Timer State
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<any>(null);

  // User Answer Inputs
  const [userAnswerInput, setUserAnswerInput] = useState("");
  const [selectedMcqOption, setSelectedMcqOption] = useState<string | null>(null);

  // Ingestion AI Text State
  const [rawIngestText, setRawIngestText] = useState("");
  const [parsedPreviewQs, setParsedPreviewQs] = useState<ExamQuestion[]>([]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setBankQuestions(getQuestionBank());
    setMistakes(getStoredMistakes());
    setNotes(getStoredLessonNotes());
  }, []);

  // Timer Tick Effect
  useEffect(() => {
    if (isTimerRunning && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 0.1);
      }, 100);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, isPaused]);

  const currentQ = examQuestions[currentIndex];

  // Reset timer on question change
  useEffect(() => {
    if (isExamActive && currentQ) {
      setElapsedSeconds(0);
      setIsTimerRunning(true);
      setIsPaused(false);
      setUserAnswerInput("");
      setSelectedMcqOption(null);
    }
  }, [currentIndex, isExamActive, currentQ?.id]);

  // Stop Timer when user starts typing
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const val = e.target.value;
    setUserAnswerInput(val);
    if (val.length > 0 && isTimerRunning) {
      setIsTimerRunning(false);
    }
  };

  // Select MCQ Option
  const handleSelectMcq = (opt: string) => {
    setSelectedMcqOption(opt);
    setUserAnswerInput(opt);
    if (isTimerRunning) {
      setIsTimerRunning(false);
    }
  };

  const handleStartExam = (typeFilter: "all" | ExamQuestionType = "all") => {
    const pool =
      typeFilter === "all" ? bankQuestions : bankQuestions.filter((q) => q.type === typeFilter);
    if (pool.length === 0) {
      toast.error("لا توجد أسئلة متاحة في هذا النمط حالياً.");
      return;
    }
    setExamQuestions(pool);
    setCurrentIndex(0);
    setPerformances([]);
    setIsExamCompleted(false);
    setIsExamActive(true);
    setActiveTab("exam");
  };

  const handleStartMistakesChallenge = () => {
    if (mistakes.length === 0) {
      toast.info("رائع! لا توجد أسئلة خاطئة في السجل حالياً 🎉");
      return;
    }
    const mistakeQs = mistakes.map((m) => m.question);
    setExamQuestions(mistakeQs);
    setCurrentIndex(0);
    setPerformances([]);
    setIsExamCompleted(false);
    setIsExamActive(true);
    setActiveTab("exam");
    toast.success(`تم بدء تحدي الأخطاء بـ ${mistakeQs.length} أسئلة ⚡`);
  };

  const handleAnswerSubmit = () => {
    if (!currentQ) return;
    const finalAns = currentQ.type === "mcq" ? selectedMcqOption || "" : userAnswerInput;

    const perf = evaluateQuestionAnswer(currentQ, finalAns, elapsedSeconds);
    setPerformances((prev) => [...prev, perf]);

    // If answer is wrong, log to mistake bank
    if (!perf.isCorrect) {
      const newMistakes: ExamMistake[] = [
        {
          id: `mistake_${Date.now()}`,
          question: currentQ,
          userAnswer: finalAns || "لم يتم إدخال إجابة",
          date: new Date().toLocaleDateString("ar-SA"),
        },
        ...mistakes.filter((m) => m.question.id !== currentQ.id),
      ];
      setMistakes(newMistakes);
      localStorage.setItem("nafath.exam_mistakes_v1", JSON.stringify(newMistakes));
    }

    if (currentIndex < examQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsExamActive(false);
      setIsExamCompleted(true);
      toast.success("تم إكمال الامتحان! جاري تحضير التقرير الإدراكي... 📊");
    }
  };

  const handlePrevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleDeleteMistake = (id: string) => {
    removeMistake(id);
    setMistakes((prev) => prev.filter((m) => m.id !== id));
    toast.success("تم إزالة السؤال من سجل الأخطاء 🎉");
  };

  // Notebook Handlers
  const handleCreateNewNote = () => {
    setSelectedNoteId(null);
    setNoteTitle("");
    setNoteContent("");
    toast.info("تم فتح مسودة ملاحظة جديدة ✍️");
  };

  const handleSaveNote = () => {
    if (!noteTitle.trim() || !noteContent.trim()) {
      toast.error("يرجى ملء عنوان الملاحظة ومحتواها.");
      return;
    }
    const saved = addLessonNote(noteTitle, noteContent);
    const updated = getStoredLessonNotes();
    setNotes(updated);
    setSelectedNoteId(saved.id);
    toast.success("تم حفظ الملاحظة في دفترك الخاص بنجاح! 📝🎉");
  };

  const handleDeleteNotebookNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteLessonNote(id);
    const updated = getStoredLessonNotes();
    setNotes(updated);
    if (selectedNoteId === id) {
      if (updated.length > 0) {
        setSelectedNoteId(updated[0].id);
        setNoteTitle(updated[0].lessonTitle);
        setNoteContent(updated[0].content);
      } else {
        setSelectedNoteId(null);
        setNoteTitle("");
        setNoteContent("");
      }
    }
    toast.success("تم حذف الملاحظة بنجاح 🗑️");
  };

  // Ingestion Handlers
  const handleProcessRawText = () => {
    if (!rawIngestText.trim()) {
      toast.error("يرجى لصق نص الأسئلة أولاً.");
      return;
    }
    const parsed = parseRawTextToExamQuestions(rawIngestText);
    if (parsed.length > 0) {
      setParsedPreviewQs(parsed);
      toast.success(`تم تفكيك ومعالجة ${parsed.length} أسئلة بالـ AI بنجاح! 🚀`);
    } else {
      toast.error("لم نتمكن من تفكيك الأسئلة. يرجى مراجعة هيكل النص.");
    }
  };

  const handleSaveParsedToBank = () => {
    if (parsedPreviewQs.length === 0) return;
    const updated = [...parsedPreviewQs, ...bankQuestions];
    setBankQuestions(updated);
    saveQuestionBank(updated);
    setParsedPreviewQs([]);
    setRawIngestText("");
    toast.success("تم حفظ الأسئلة الجديدة في بنك الأسئلة الموحد! 💾");
  };

  const handleSaveQuestion = (savedQ: ExamQuestion) => {
    const exists = bankQuestions.some((q) => q.id === savedQ.id);
    let updated: ExamQuestion[];
    if (exists) {
      updated = bankQuestions.map((q) => (q.id === savedQ.id ? savedQ : q));
    } else {
      updated = [savedQ, ...bankQuestions];
    }
    setBankQuestions(updated);
    saveQuestionBank(updated);
  };

  const handleDeleteBankQuestion = (id: string) => {
    const updated = bankQuestions.filter((q) => q.id !== id);
    setBankQuestions(updated);
    saveQuestionBank(updated);
  };

  const handleImportJson = () => {
    if (!jsonInput.trim()) {
      toast.error("يرجى لصق كود الـ JSON أولاً.");
      return;
    }
    try {
      const parsed = JSON.parse(jsonInput);
      const items: ExamQuestion[] = Array.isArray(parsed) ? parsed : [parsed];

      const validItems: ExamQuestion[] = items
        .filter((item) => item.question && item.model_answer)
        .map((item, idx) => ({
          id: item.id || `q_json_${Date.now()}_${idx}`,
          type: item.type || "mcq",
          question: item.question,
          options: item.options || undefined,
          model_answer: item.model_answer,
          topic_label: item.topic_label || "عام",
          topic_tag: item.topic_tag || "#عام",
          explanation_baladi: item.explanation_baladi || undefined,
        }));

      if (validItems.length === 0) {
        toast.error(
          "لم يتم العثور على أسئلة صالحة بالـ JSON. تأكد من وجود حقول question و model_answer.",
        );
        return;
      }

      const updated = [...validItems, ...bankQuestions];
      setBankQuestions(updated);
      saveQuestionBank(updated);
      setJsonInput("");
      toast.success(`تم استيراد ${validItems.length} سؤال بنجاح من الـ JSON! 🚀`);
      setIngestSubMode("list");
    } catch (err) {
      toast.error("صيغة الـ JSON غير صالحة. يرجى التأكد من الأقواس والإشارات.");
    }
  };

  const filteredBankQuestions = useMemo(() => {
    if (!bankSearchQuery.trim()) return bankQuestions;
    const q = bankSearchQuery.toLowerCase();
    return bankQuestions.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.topic_label.toLowerCase().includes(q) ||
        item.model_answer.toLowerCase().includes(q),
    );
  }, [bankQuestions, bankSearchQuery]);

  const topicReport = useMemo(() => {
    if (!isExamCompleted) return null;
    return generateTopicReport(examQuestions, performances);
  }, [isExamCompleted, examQuestions, performances]);

  const formattedTimer = `${Math.floor(elapsedSeconds / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(elapsedSeconds % 60)
    .toString()
    .padStart(2, "0")}`;

  const mcqOptionLabels = ["أ", "ب", "ج", "د", "هـ"];

  const sampleJsonTemplate = `[
  {
    "type": "mcq",
    "question": "ما حكم الخُلع في حال كراهة الزوجة لزوجها دون إضرار منه؟",
    "options": ["مباح ومستحب دفعاً للضرر", "واجب", "محرم شرعاً", "مكروه تحريماً"],
    "model_answer": "مباح ومستحب دفعاً للضرر",
    "topic_label": "فقه الخُلع",
    "topic_tag": "#الخلع",
    "explanation_baladi": "إذا كرهت المرأة زوجها وخافت ألا تقيم حدود الله، يجوز لها طلب الخلع بعوض."
  }
]`;

  const wordCount = useMemo(() => {
    if (!noteContent.trim()) return 0;
    return noteContent.trim().split(/\s+/).length;
  }, [noteContent]);

  return (
    <div
      className="w-full max-w-[1100px] mx-auto px-4 py-8 space-y-10 dir-rtl text-right font-body-md"
      dir="rtl"
    >
      {/* Top Header Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e0c0b1]/30 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 text-[#0b1c30] font-extrabold text-xl sm:text-2xl">
            <GraduationCap className="h-7 w-7 text-[#9d4300]" />
            <span>منصة نفاذ للتعلم والتحليل الإدراكي</span>
          </div>
          <p className="text-xs font-semibold text-[#584237]/70">
            شاشات مخصصة ومستقلة للإحصائيات، بنك الأخطاء، دفتر الملاحظات، والاختبارات التفاعلية.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsExamActive(false);
              setIsExamCompleted(false);
              setActiveTab("exam");
            }}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-extrabold transition cursor-pointer border ${
              activeTab === "exam"
                ? "bg-[#f97316] text-white border-[#f97316] shadow-md"
                : "bg-white text-[#0b1c30] border-[#e0c0b1]/60 hover:bg-[#eff4ff]"
            }`}
          >
            <Zap className="h-4 w-4 fill-current" />
            <span>⚡ الجلسة التفاعلية</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsExamActive(false);
              setIsExamCompleted(false);
              setActiveTab("stats");
            }}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-extrabold transition cursor-pointer border ${
              activeTab === "stats"
                ? "bg-[#9d4300] text-white border-[#9d4300] shadow-md"
                : "bg-white text-[#0b1c30] border-[#e0c0b1]/60 hover:bg-[#eff4ff]"
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            <span>📊 إحصائيات التعلم</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsExamActive(false);
              setIsExamCompleted(false);
              setActiveTab("mistakes");
            }}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-extrabold transition cursor-pointer border ${
              activeTab === "mistakes"
                ? "bg-[#ba1a1a] text-white border-[#ba1a1a] shadow-md"
                : "bg-white text-[#0b1c30] border-[#e0c0b1]/60 hover:bg-[#eff4ff]"
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            <span>❌ بنك الأخطاء ({mistakes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsExamActive(false);
              setIsExamCompleted(false);
              setActiveTab("notebook");
            }}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-extrabold transition cursor-pointer border ${
              activeTab === "notebook"
                ? "bg-[#8127cf] text-white border-[#8127cf] shadow-md"
                : "bg-white text-[#0b1c30] border-[#e0c0b1]/60 hover:bg-[#eff4ff]"
            }`}
          >
            <StickyNote className="h-4 w-4" />
            <span>📝 دفتر الملاحظات</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsExamActive(false);
              setIsExamCompleted(false);
              setActiveTab("ingest");
            }}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-extrabold transition cursor-pointer border ${
              activeTab === "ingest"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                : "bg-white text-[#0b1c30] border-[#e0c0b1]/60 hover:bg-[#eff4ff]"
            }`}
          >
            <Brain className="h-4 w-4" />
            <span>📥 إدارة الأسئلة</span>
          </button>
        </div>
      </div>

      {/* PAGE 1: PURE LEARNING STATISTICS (📊 إحصائيات التعلم - Matching Screenshot & HTML 1) */}
      {activeTab === "stats" && (
        <div className="space-y-12">
          {/* Header Section */}
          <section className="space-y-3 text-right">
            <div>
              <span className="px-4 py-1.5 rounded-full bg-[#ffdbca]/40 text-[#9d4300] font-extrabold text-xs">
                تحليل الأداء
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0b1c30]">
              إحصائيات التعلم 📊
            </h2>
            <p className="text-base text-[#584237]/80 max-w-2xl leading-relaxed">
              نظرة شاملة ومبسطة على تقدمك الأكاديمي. نحن نستخدم الذكاء الاصطناعي لتحليل نقاط قوتك
              وتحديد المجالات التي تحتاج إلى تركيز.
            </p>
          </section>

          {/* Primary Statistics Grid (4 Bento Cards) */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Mastery Rate */}
            <div className="bg-white border border-[#e0c0b1]/40 p-7 rounded-[2rem] shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#ffdbca]/30 flex items-center justify-center text-[#9d4300]">
                  <Star className="h-6 w-6 fill-[#9d4300]" />
                </div>
                <span className="text-[#9d4300] font-extrabold text-xs bg-[#ffdbca]/30 px-2.5 py-1 rounded-full">
                  +2.5%
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-[#584237]/80 mb-1">معدل الإتقان</p>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-[#0b1c30]">78%</h3>
              </div>
            </div>

            {/* Card 2: Total Notes */}
            <div className="bg-white border border-[#e0c0b1]/40 p-7 rounded-[2rem] shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-[#8127cf]">
                  <Edit3 className="h-6 w-6" />
                </div>
                <span className="text-[#8127cf] font-extrabold text-xs bg-purple-100 px-2.5 py-1 rounded-full">
                  منوع
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-[#584237]/80 mb-1">إجمالي الملاحظات</p>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-[#0b1c30]">
                  {notes.length || 12}
                </h3>
              </div>
            </div>

            {/* Card 3: Pending Errors */}
            <div className="bg-white border border-[#e0c0b1]/40 p-7 rounded-[2rem] shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-[#ba1a1a]">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <span className="text-[#ba1a1a] font-extrabold text-xs bg-rose-100 px-2.5 py-1 rounded-full">
                  عاجل
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-[#584237]/80 mb-1">أخطاء معلقة</p>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-[#0b1c30]">
                  {mistakes.length}
                </h3>
              </div>
            </div>

            {/* Card 4: Average Speed */}
            <div className="bg-white border border-[#e0c0b1]/40 p-7 rounded-[2rem] shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#eff4ff] flex items-center justify-center text-[#0b1c30]">
                  <Zap className="h-6 w-6 fill-current text-[#9d4300]" />
                </div>
                <span className="text-[#584237] font-extrabold text-xs bg-[#eff4ff] px-2.5 py-1 rounded-full">
                  -1s
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-[#584237]/80 mb-1">متوسط السرعة</p>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-[#0b1c30]">12ث</h3>
              </div>
            </div>
          </section>

          {/* Current Lesson Progress Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-extrabold text-[#0b1c30]">تقدم الدروس الحالية 📚</h3>
              <button
                type="button"
                onClick={() => navigate({ to: "/subjects" })}
                className="text-[#9d4300] font-extrabold text-xs flex items-center gap-1.5 hover:opacity-80 transition cursor-pointer"
              >
                <span>عرض الكل</span>
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5">
              {library.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-[2.5rem] border border-[#e0c0b1]/40 space-y-2">
                  <BookOpen className="h-12 w-12 text-[#9d4300]/30 mx-auto mb-3" />
                  <p className="text-base font-extrabold text-[#0b1c30]">لا توجد دروس محفوظة أو سارية حالياً في المادة 📚</p>
                  <p className="text-xs font-semibold text-[#584237]/60">قم باستيراد أو إضافة درس جديد ليتحدد تقدمك هنا</p>
                </div>
              ) : (
                library.slice(0, 5).map((saved, idx) => {
                  const colors = ["#9d4300", "#8127cf", "#0b6e4f"];
                  const color = colors[idx % colors.length];
                  const percent = 100;
                  return (
                    <div
                      key={saved.id}
                      className="bg-[#eff4ff] p-6 sm:p-8 rounded-[2.5rem] border border-[#e0c0b1]/30 hover:bg-white transition-all shadow-xs"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-6">
                          <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                              <path
                                className="text-[#d3e4fe]"
                                strokeDasharray="100, 100"
                                strokeWidth="3.5"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <path
                                strokeDasharray={`${percent}, 100`}
                                strokeLinecap="round"
                                strokeWidth="3.5"
                                stroke={color}
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                            </svg>
                            <span className="absolute font-extrabold text-sm text-[#0b1c30]">
                              {percent}%
                            </span>
                          </div>
                          <div>
                            <h4 className="text-xl font-extrabold text-[#0b1c30] mb-1">
                              {saved.title}
                            </h4>
                            <p className="text-xs font-semibold text-[#584237]/80">
                              {saved.blocks} كتلة تعليمية
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="px-4 py-2 rounded-full bg-white text-[#584237] text-xs font-extrabold border border-[#e0c0b1]/30">
                            مكتمل ✅
                          </span>
                          <button
                            type="button"
                            onClick={() => navigate({ to: "/" })}
                            className="w-12 h-12 rounded-full bg-[#9d4300] text-white flex items-center justify-center hover:scale-105 transition-transform cursor-pointer shadow-md"
                            title="عرض الدرس"
                          >
                            <Play className="h-5 w-5 fill-current mr-0.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Learning Mood Chart (Weekly Trend Bar Chart) */}
          <section className="bg-white border border-[#e0c0b1]/40 p-8 rounded-[2.5rem] relative overflow-hidden shadow-xs space-y-8">
            <h3 className="text-xl font-extrabold text-[#0b1c30]">اتجاه التعلم الأسبوعي 📈</h3>
            <div className="h-48 w-full flex items-end gap-3 sm:gap-6 justify-between px-2">
              {[
                { day: "أحد", height: "60%", color: "bg-[#eff4ff]" },
                { day: "اث", height: "40%", color: "bg-[#eff4ff]" },
                { day: "ثلاث", height: "85%", color: "bg-[#ffdbca]" },
                { day: "أرب", height: "55%", color: "bg-[#eff4ff]" },
                { day: "خمس", height: "75%", color: "bg-[#eff4ff]" },
                { day: "جمع", height: "90%", color: "bg-purple-200" },
                { day: "سبت", height: "35%", color: "bg-[#eff4ff]" },
              ].map((bar, idx) => (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center gap-3 group cursor-pointer"
                >
                  <div
                    className={`w-full ${bar.color} rounded-t-full transition-all duration-500 hover:opacity-80 group-hover:scale-y-105`}
                    style={{ height: bar.height }}
                  />
                  <span className="text-xs font-extrabold text-[#584237]/70">{bar.day}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* PAGE 2: STANDALONE MISTAKE BANK (❌ بنك الأخطاء المستقل - Matching HTML 2) */}
      {activeTab === "mistakes" && (
        <div className="space-y-10">
          {/* Header Section with Re-challenge CTA */}
          <header className="space-y-6 border-b border-[#e0c0b1]/30 pb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0b1c30]">
                  بنك الأخطاء ❌
                </h1>
                <p className="text-sm font-semibold text-[#584237]/80 max-w-2xl leading-relaxed">
                  الأخطاء ليست نهاية الطريق، بل هي البداية الحقيقية للتعلم. هنا جمعنا لك كل النقاط
                  التي واجهت فيها صعوبة لتتمكن من إتقانها.
                </p>
              </div>

              <button
                type="button"
                onClick={handleStartMistakesChallenge}
                className="h-14 px-8 bg-[#9d4300] text-white rounded-full font-extrabold text-sm flex items-center justify-center gap-2.5 hover:bg-[#833800] shadow-lg shadow-[#9d4300]/20 transition-all cursor-pointer shrink-0"
              >
                <RefreshCw className="h-5 w-5" />
                <span>إعادة التحدي ⚡</span>
              </button>
            </div>

            {/* Filters / Stats Bento Style */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="bg-[#eff4ff] p-6 rounded-3xl border border-[#e0c0b1]/30 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#584237]/80">إجمالي الأخطاء</div>
                  <div className="text-3xl font-extrabold text-[#9d4300]">{mistakes.length}</div>
                </div>
                <AlertCircle className="h-10 w-10 text-[#9d4300]/40" />
              </div>

              <div className="bg-[#eff4ff] p-6 rounded-3xl border border-[#e0c0b1]/30 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#584237]/80">انتظار المراجعة</div>
                  <div className="text-3xl font-extrabold text-[#8127cf]">{mistakes.length}</div>
                </div>
                <Clock className="h-10 w-10 text-[#8127cf]/40" />
              </div>

              <div className="bg-[#eff4ff] p-6 rounded-3xl border border-[#e0c0b1]/30 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#584237]/80">نسبة التحسن</div>
                  <div className="text-3xl font-extrabold text-[#0b1c30]">+15%</div>
                </div>
                <TrendingUp className="h-10 w-10 text-emerald-600/40" />
              </div>
            </div>
          </header>

          {/* Mistakes Cards List */}
          <section className="space-y-6">
            {mistakes.length === 0 ? (
              <div className="text-center py-16 space-y-4 bg-white rounded-[2.5rem] border border-[#e0c0b1]/40 shadow-xs">
                <CheckCircle2 className="h-14 w-14 text-emerald-600 mx-auto" />
                <h3 className="text-xl font-extrabold text-[#0b1c30]">
                  ممتاز جداً! لا توجد أخطاء معلقة بالسجل حالياً 🎉
                </h3>
                <p className="text-xs font-semibold text-[#584237]/70">
                  يمكنك إجراء اختبارات جديدة لاختبار معلوماتك ودعم إتقانك.
                </p>
              </div>
            ) : (
              mistakes.map((m) => (
                <article
                  key={m.id}
                  className="bg-white border border-[#e0c0b1]/40 rounded-[2rem] p-6 sm:p-10 shadow-xs relative overflow-hidden space-y-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="px-4 py-1.5 rounded-full bg-[#ffdbca] text-[#9d4300] font-extrabold text-xs">
                        {m.question.topic_label || "الفقه"}
                      </span>
                      <span className="px-4 py-1.5 rounded-full bg-[#eff4ff] text-[#584237] font-bold text-xs">
                        {m.date || "منذ يومين"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteMistake(m.id)}
                      className="text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-xl font-extrabold text-xs transition cursor-pointer flex items-center gap-1 border border-transparent hover:border-rose-200"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>تم الإتقان / إزالة</span>
                    </button>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b1c30] leading-relaxed">
                    {m.question.question}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                      <div className="text-xs font-extrabold text-rose-700 flex items-center gap-2">
                        <X className="h-4 w-4" />
                        <span>إجابتك الخاطئة:</span>
                      </div>
                      <p className="text-sm font-semibold text-[#0b1c30]">{m.userAnswer}</p>
                    </div>

                    <div className="p-6 rounded-2xl bg-purple-50 border border-purple-200 space-y-2">
                      <div className="text-xs font-extrabold text-[#8127cf] flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        <span>الإجابة النموذجية الصحيحة:</span>
                      </div>
                      <p className="text-sm font-semibold text-[#0b1c30]">
                        {m.question.model_answer}
                      </p>
                    </div>
                  </div>

                  {m.question.explanation_baladi && (
                    <div className="bg-[#fffaf7] p-6 rounded-2xl border-r-4 border-[#9d4300] space-y-2">
                      <h3 className="text-xs font-extrabold text-[#9d4300] flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        <span>شرح البلدي الميسر:</span>
                      </h3>
                      <p className="text-sm font-semibold text-[#584237] leading-relaxed">
                        {m.question.explanation_baladi}
                      </p>
                    </div>
                  )}
                </article>
              ))
            )}
          </section>

          {/* Bottom CTA */}
          {mistakes.length > 0 && (
            <div className="text-center pt-6">
              <button
                type="button"
                onClick={handleStartMistakesChallenge}
                className="px-12 py-5 bg-[#0b1c30] text-white rounded-full font-extrabold text-base hover:bg-[#9d4300] transition-all shadow-xl hover:scale-105 cursor-pointer"
              >
                ابدأ مراجعة شاملة للأخطاء 🚀
              </button>
            </div>
          )}
        </div>
      )}

      {/* PAGE 3: SMART ZEN NOTEBOOK WORKSPACE (📝 دفتر الملاحظات - Matching HTML 3) */}
      {activeTab === "notebook" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-right">
          {/* Left Column: Subjects & Lessons Selector */}
          <div className="lg:col-span-4">
            <div className="bg-white border border-[#e0c0b1]/40 rounded-[2rem] p-6 sticky top-24 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-[#e0c0b1]/30 pb-4">
                <h3 className="text-lg font-extrabold text-[#0b1c30]">ملاحظاتي ودروسي 📚</h3>
                <button
                  type="button"
                  onClick={handleCreateNewNote}
                  className="px-3.5 py-1.5 rounded-full bg-[#9d4300] text-white font-extrabold text-xs hover:bg-[#833800] transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="h-4 w-4" />
                  <span>إضافة ملاحظة جديدة</span>
                </button>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {notes.length === 0 ? (
                  <div className="text-center py-10 space-y-3 border border-dashed border-[#e0c0b1]/60 rounded-2xl p-4 bg-[#f8f9ff]">
                    <p className="text-xs font-bold text-[#584237]/80">
                      لا توجد ملاحظات مسجلة حالياً
                    </p>
                    <button
                      type="button"
                      onClick={handleCreateNewNote}
                      className="px-4 py-2 bg-[#9d4300] text-white rounded-full text-xs font-extrabold hover:bg-[#833800] transition cursor-pointer shadow-xs inline-block"
                    >
                      ➕ أضف أول ملاحظة جديدة
                    </button>
                  </div>
                ) : (
                  notes.map((item) => {
                    const isSelected = selectedNoteId === item.id || noteTitle === item.lessonTitle;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => {
                          setSelectedNoteId(item.id);
                          setNoteTitle(item.lessonTitle);
                          setNoteContent(item.content);
                        }}
                        className={`w-full text-right p-4 rounded-2xl flex items-center justify-between gap-3 transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-[#fffaf7] border-r-4 border-r-[#8127cf] border-[#e0c0b1]/60 shadow-xs"
                            : "bg-[#f8f9ff] border-transparent hover:bg-[#eff4ff]"
                        }`}
                      >
                        <div className="space-y-0.5 overflow-hidden flex-grow">
                          <span className="text-[10px] font-bold text-[#8127cf] block">
                            {item.date || "اليوم"}
                          </span>
                          <span className="text-sm font-extrabold text-[#0b1c30] truncate block">
                            {item.lessonTitle}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteNotebookNote(item.id, e)}
                          className="p-1.5 text-rose-600 hover:bg-rose-100/80 rounded-full transition cursor-pointer flex-shrink-0"
                          title="حذف الملاحظة"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="pt-4 border-t border-[#e0c0b1]/30 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#584237]/70">
                  <Clock className="h-3.5 w-3.5" />
                  <span>تم التزامن الذاتي للملاحظات</span>
                </div>
                <div className="bg-[#fffaf7] rounded-2xl p-4 border border-[#ffdbca] text-xs font-semibold text-[#584237] leading-relaxed">
                  "العلم صيد والكتابة قيده، قيد صيودك بالحبال الواثقة 📜"
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Large Text Workspace */}
          <div className="lg:col-span-8">
            <div className="bg-white border border-[#e0c0b1]/40 rounded-[2.5rem] p-6 sm:p-10 shadow-xs min-h-[75vh] flex flex-col justify-between space-y-6">
              {/* Header / Formatting Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#e0c0b1]/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#ffdbca]/40 text-[#9d4300] flex items-center justify-center">
                    <StickyNote className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-[#0b1c30]">
                      دفتر الملاحظات والفوائد
                    </h2>
                    <p className="text-xs font-bold text-[#8127cf]">
                      {noteTitle || "ملاحظة جديدة"}
                    </p>
                  </div>
                </div>

                {/* Formatting Controls Bar */}
                <div className="flex items-center bg-[#f8f9ff] rounded-full px-4 py-2 gap-2 border border-[#e0c0b1]/40 text-xs font-bold text-[#584237]">
                  <button
                    type="button"
                    className="p-1 hover:text-[#9d4300] transition"
                    title="Bold"
                  >
                    <b>B</b>
                  </button>
                  <button
                    type="button"
                    className="p-1 hover:text-[#9d4300] transition"
                    title="Italic"
                  >
                    <i>I</i>
                  </button>
                  <button
                    type="button"
                    className="p-1 hover:text-[#9d4300] transition"
                    title="List"
                  >
                    •
                  </button>
                  <div className="w-px h-4 bg-[#e0c0b1]" />
                  <button
                    type="button"
                    onClick={() => setIsZenActive(!isZenActive)}
                    className={`p-1 transition ${isZenActive ? "text-[#8127cf] font-extrabold" : "hover:text-[#8127cf]"}`}
                    title="وضع التركيز Zen Mode"
                  >
                    🎯 Zen
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCreateNewNote}
                    className="px-4 py-2.5 rounded-full bg-[#eff4ff] text-[#9d4300] font-extrabold text-xs hover:bg-[#dce9ff] transition cursor-pointer border border-[#e0c0b1]/40 flex items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>ملاحظة جديدة</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    className="px-6 py-2.5 rounded-full bg-[#9d4300] text-white font-extrabold text-xs shadow-md hover:bg-[#833800] transition cursor-pointer"
                  >
                    حفظ الملاحظة 💾
                  </button>
                </div>
              </div>

              {/* Content Input Workspace */}
              <div className="flex-grow flex flex-col space-y-4">
                <input
                  type="text"
                  placeholder="عنوان الملاحظة..."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full bg-transparent text-2xl sm:text-3xl font-extrabold text-[#0b1c30] border-none focus:outline-none placeholder:opacity-30"
                />

                <textarea
                  rows={10}
                  placeholder="ابدأ الكتابة هنا للتأمل والتدوين والتراكم المعرفي..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full flex-grow bg-transparent text-base font-semibold text-[#0b1c30]/90 border-none focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Bottom Context Footer */}
              <div className="pt-6 border-t border-[#e0c0b1]/30 flex items-center justify-between text-xs font-bold text-[#584237]/80">
                <div className="flex gap-2">
                  <span className="bg-[#eff4ff] text-[#8127cf] px-3 py-1 rounded-full">#أحكام</span>
                  <span className="bg-[#eff4ff] text-[#8127cf] px-3 py-1 rounded-full">#فقه</span>
                </div>

                <div className="flex items-center gap-4">
                  <span>{wordCount} كلمة</span>
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> محفوط تلقائياً
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: MAIN INTERACTIVE EXAM SESSION (⚡ الجلسة التفاعلية) */}
      {activeTab === "exam" && (
        <>
          {!isExamActive && !isExamCompleted && (
            <section className="flex flex-col items-center text-center space-y-8 py-12 bg-white rounded-[2.5rem] p-8 sm:p-14 border border-[#e5eeff] shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#f97316]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />

              <div className="relative">
                <div className="w-28 h-28 bg-[#f97316]/10 rounded-full flex items-center justify-center animate-pulse">
                  <Brain className="h-14 w-14 text-[#f97316]" />
                </div>
                <div className="absolute -top-1 -right-1 bg-white p-2 rounded-full shadow-sm border border-[#e0c0b1]/40">
                  <Sparkles className="h-4 w-4 text-[#8127cf]" />
                </div>
              </div>

              <div className="max-w-2xl space-y-3">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0b1c30]">
                  الجلسة التكيفية للاختبارات التفاعلية
                </h2>
                <p className="text-base text-[#584237]/80 max-w-lg mx-auto leading-relaxed">
                  ابدأ اختبارك الآن، يمكنك اختيار نمط الأسئلة المفضل (MCQs، أكمل، مقالي) أو إجراء
                  اختبار شامل لجميع الموضوعات.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowTypeModal(true)}
                className="group relative flex items-center gap-4 bg-[#f97316] text-white px-10 py-5 rounded-full text-lg font-extrabold hover:scale-105 transition-all duration-300 shadow-xl shadow-[#f97316]/30 cursor-pointer"
              >
                <span>بدء الاختبار التفاعلي الآن</span>
                <Zap className="h-5 w-5 fill-white group-hover:rotate-12 transition-transform" />
              </button>
            </section>
          )}

          {isExamActive && currentQ && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 w-full">
                <div className="flex flex-col gap-2">
                  <nav className="flex items-center gap-2 text-[#584237]/80 text-xs font-medium">
                    <span className="hover:text-[#9d4300]">الاختبارات</span>
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span className="hover:text-[#9d4300]">الفقه الإسلامي</span>
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span className="text-[#0b1c30] font-bold">{currentQ.topic_label}</span>
                  </nav>

                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#dce9ff] rounded-full text-xs font-bold text-[#8127cf]">
                      <BookOpen className="h-3.5 w-3.5" />
                      السؤال {currentIndex + 1} من {examQuestions.length}
                    </span>

                    <div className="w-48 h-1.5 bg-[#e5eeff] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#9d4300] transition-all duration-500"
                        style={{ width: `${((currentIndex + 1) / examQuestions.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl border border-[#dce9ff] shadow-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#9d4300]" />
                    <span className="text-xl font-bold text-[#0b1c30] tracking-widest font-mono">
                      {formattedTimer}
                    </span>
                  </div>
                  <div className="h-6 w-px bg-[#e0c0b1]" />
                  <button
                    type="button"
                    onClick={() => setIsPaused(!isPaused)}
                    className="flex items-center gap-2 text-xs font-bold text-[#584237] hover:text-rose-600 transition cursor-pointer"
                  >
                    {isPaused ? (
                      <PlayCircle className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <PauseCircle className="h-4 w-4 text-amber-600" />
                    )}
                    <span>{isPaused ? "استئناف" : "إيقاف مؤقت"}</span>
                  </button>
                </div>
              </div>

              <section className="w-full">
                <div className="bg-white rounded-[2.5rem] p-8 md:p-16 border border-[#e5eeff] shadow-sm relative overflow-hidden">
                  <div className="relative z-10 max-w-3xl mx-auto text-center space-y-10">
                    {currentQ.type === "mcq" && (
                      <>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b1c30] leading-tight">
                          {currentQ.question}
                        </h2>

                        {currentQ.options && (
                          <div className="grid grid-cols-1 gap-4 w-full text-right">
                            {currentQ.options.map((opt, i) => {
                              const isSelected = selectedMcqOption === opt;
                              return (
                                <button
                                  type="button"
                                  key={i}
                                  onClick={() => handleSelectMcq(opt)}
                                  className={`group w-full p-5 text-right rounded-2xl border transition-all duration-300 flex items-center gap-5 cursor-pointer ${
                                    isSelected
                                      ? "border-[#f97316] bg-[#fffaf7] shadow-xs"
                                      : "border-[#dce9ff] bg-white hover:border-[#9d4300]"
                                  }`}
                                >
                                  <span
                                    className={`w-11 h-11 flex items-center justify-center rounded-xl font-bold text-base transition-colors shrink-0 ${
                                      isSelected
                                        ? "bg-[#f97316] text-white"
                                        : "bg-[#eff4ff] text-[#584237] group-hover:bg-[#f97316] group-hover:text-white"
                                    }`}
                                  >
                                    {mcqOptionLabels[i] || i + 1}
                                  </span>
                                  <span className="text-base font-semibold text-[#0b1c30]">
                                    {opt}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}

                    {currentQ.type === "fill" && (
                      <div className="space-y-8 text-right">
                        <div className="p-6 rounded-3xl bg-[#eff4ff] border border-[#dce9ff] space-y-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-[#8127cf]">
                            <PenTool className="h-4 w-4" />
                            <span>أكمل الفراغ المفاهيمي الآتي بالكلمة الفقهية الدقيقة:</span>
                          </div>
                          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b1c30] leading-relaxed">
                            {currentQ.question.replace("...", " [ ___________ ] ")}
                          </h2>
                        </div>

                        <div className="space-y-3">
                          <label
                            htmlFor="fill-input"
                            className="block text-xs font-bold text-[#584237]"
                          >
                            اكتب الكلمة أو المصطلح المناسب في الفراغ:
                          </label>
                          <input
                            id="fill-input"
                            type="text"
                            placeholder="اكتب الإجابة هنا..."
                            value={userAnswerInput}
                            onChange={handleInputChange}
                            className="w-full rounded-2xl border-2 border-[#dce9ff] p-4 text-base font-bold text-[#0b1c30] focus:border-[#f97316] focus:outline-none transition bg-white shadow-xs"
                          />
                        </div>
                      </div>
                    )}

                    {currentQ.type === "essay" && (
                      <div className="space-y-6 text-right">
                        <div className="p-6 rounded-3xl bg-amber-50/70 border border-amber-200 space-y-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                            <Lightbulb className="h-4 w-4 text-[#9d4300]" />
                            <span>سؤال مقالي وتحليل علّل:</span>
                          </div>
                          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b1c30] leading-relaxed">
                            {currentQ.question}
                          </h2>
                        </div>

                        <div className="space-y-3">
                          <label
                            htmlFor="essay-input"
                            className="block text-xs font-bold text-[#584237]"
                          >
                            اكتب صياغتك الفقهية الشاملة للجواب والتعليل:
                          </label>
                          <textarea
                            id="essay-input"
                            rows={4}
                            placeholder="اكتب إجابتك بالتفصيل هنا..."
                            value={userAnswerInput}
                            onChange={handleInputChange}
                            className="w-full rounded-2xl border-2 border-[#dce9ff] p-4 text-sm font-semibold text-[#0b1c30] focus:border-[#f97316] focus:outline-none transition bg-white shadow-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <div className="flex justify-between items-center w-full pt-4">
                <button
                  type="button"
                  onClick={handlePrevQuestion}
                  disabled={currentIndex === 0}
                  className="px-8 py-4 rounded-xl border border-[#e0c0b1] font-bold text-sm text-[#584237] hover:bg-[#eff4ff] disabled:opacity-40 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span>السابق</span>
                </button>

                <button
                  type="button"
                  onClick={handleAnswerSubmit}
                  disabled={!userAnswerInput.trim() && !selectedMcqOption}
                  className="px-10 py-4 rounded-xl bg-[#f97316] text-white font-bold text-base shadow-lg shadow-[#f97316]/20 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-3 cursor-pointer"
                >
                  <span>السؤال التالي</span>
                  <Send className="h-4 w-4 rotate-180" />
                </button>
              </div>
            </div>
          )}

          {isExamCompleted && topicReport && (
            <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 border border-[#e5eeff] shadow-sm space-y-8 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl">
                🏆
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-extrabold text-[#0b1c30]">
                  تم إكمال الجلسة التفاعلية بنجاح!
                </h3>
                <p className="text-sm font-semibold text-[#584237]/80 max-w-md mx-auto">
                  تقرير التحليل الإدراكي وتحديد التاجات المفاهيمية ومواضع القوة والضعف:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-right">
                {topicReport.items.map((item: TopicReportItem, idx: number) => (
                  <div
                    key={idx}
                    className="p-6 rounded-3xl bg-[#eff4ff] border border-[#dce9ff] space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-[#e0c0b1]/40 pb-3">
                      <span className="font-extrabold text-base text-[#0b1c30]">
                        {item.topic_label}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${item.badgeBg} ${item.badgeText}`}
                      >
                        {item.assessmentIcon} {item.assessmentLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                      <div>
                        <span className="text-[#584237]">نسبة النجاح:</span>
                        <p className="text-[#0b1c30] font-extrabold text-lg">{item.successRate}%</p>
                      </div>
                      <div>
                        <span className="text-[#584237]">متوسط زمن الإجابة:</span>
                        <p className="text-[#0b1c30] font-extrabold text-lg">
                          {item.avgLatencySec} ثانية
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setIsExamCompleted(false)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#f97316] px-8 py-4 text-base font-bold text-white shadow-lg hover:bg-[#833800] transition cursor-pointer"
                >
                  <RotateCcw className="h-5 w-5" />
                  <span>بدء جلسة اختبار جديدة 🚀</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* VIEW 5: QUESTION INGESTION & BANK MANAGEMENT PAGE (📥 إدارة الأسئلة) */}
      {activeTab === "ingest" && (
        <div className="space-y-8">
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 border border-emerald-200 shadow-sm relative overflow-hidden space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-emerald-100 pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800 font-extrabold">
                    <Brain className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#0b1c30]">
                      صفحة إدارة وتغذية بنك الأسئلة الموحد 📥
                    </h2>
                    <p className="text-xs font-semibold text-[#584237]/70">
                      إضافة أسئلة بـ JSON أو يدوياً أو تفكيك بالنصوص واستعراض وتعديل الأسئلة الحالية
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingQuestion(null);
                  setShowEditQModal(true);
                }}
                className="flex items-center gap-2 bg-[#9d4300] text-white px-6 py-3.5 rounded-2xl font-extrabold text-sm hover:bg-[#833800] transition shadow-lg shadow-[#9d4300]/20 cursor-pointer shrink-0"
              >
                <Plus className="h-5 w-5" />
                <span>إضافة سؤال جديد للبنك ➕</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIngestSubMode("list")}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-extrabold text-xs transition cursor-pointer border ${
                  ingestSubMode === "list"
                    ? "bg-[#0b1c30] text-white border-[#0b1c30]"
                    : "bg-[#f8f9ff] text-[#0b1c30] border-[#e0c0b1]/40 hover:bg-[#eff4ff]"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span>الأسئلة الحالية ({bankQuestions.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setIngestSubMode("json")}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-extrabold text-xs transition cursor-pointer border ${
                  ingestSubMode === "json"
                    ? "bg-emerald-700 text-white border-emerald-700"
                    : "bg-[#f8f9ff] text-[#0b1c30] border-[#e0c0b1]/40 hover:bg-[#eff4ff]"
                }`}
              >
                <Code className="h-4 w-4" />
                <span>إضافة بـ JSON كود 💻</span>
              </button>

              <button
                type="button"
                onClick={() => setIngestSubMode("ai")}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-extrabold text-xs transition cursor-pointer border ${
                  ingestSubMode === "ai"
                    ? "bg-purple-700 text-white border-purple-700"
                    : "bg-[#f8f9ff] text-[#0b1c30] border-[#e0c0b1]/40 hover:bg-[#eff4ff]"
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>تفكيك نصوص بالـ AI ✨</span>
              </button>
            </div>
          </div>

          {ingestSubMode === "list" && (
            <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-[#e5eeff] shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#e0c0b1]/30 pb-4">
                <h3 className="text-base font-extrabold text-[#0b1c30]">
                  الأسئلة المسجلة في بنك الأسئلة الموحد ({bankQuestions.length}):
                </h3>

                <div className="relative w-full sm:w-72">
                  <Search className="h-4 w-4 text-[#584237]/60 absolute right-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="بحث بنص السؤال أو الموضوع..."
                    value={bankSearchQuery}
                    onChange={(e) => setBankSearchQuery(e.target.value)}
                    className="w-full bg-[#f8f9ff] border border-[#e0c0b1]/40 rounded-2xl pr-10 pl-4 py-2 text-xs font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#9d4300]"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredBankQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-5 rounded-2xl bg-[#f8f9ff] border border-[#e0c0b1]/50 space-y-3 relative group hover:border-[#9d4300]/40 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-block px-3 py-0.5 rounded-full bg-[#e5eeff] text-[#9d4300] text-[11px] font-extrabold">
                            {q.topic_label}
                          </span>
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-200 text-[#0b1c30] text-[10px] font-bold">
                            {q.type === "mcq"
                              ? "⚡ اختيار متعدد"
                              : q.type === "fill"
                                ? "✏️ أكمل الفراغ"
                                : "✍️ مقالي"}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-[#0b1c30] text-sm sm:text-base leading-relaxed">
                          {q.question}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingQuestion(q);
                            setShowEditQModal(true);
                          }}
                          className="p-2 rounded-xl text-[#9d4300] hover:bg-amber-100 transition cursor-pointer flex items-center gap-1"
                          title="تعديل السؤال"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="text-xs font-bold hidden sm:inline-block">تعديل</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            handleDeleteBankQuestion(q.id);
                            toast.success("تم حذف السؤال من البنك.");
                          }}
                          className="p-2 rounded-xl text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-[#e0c0b1]/40 text-xs font-semibold text-[#584237]">
                      <span className="font-extrabold text-[#0b1c30]">الإجابة النموذجية: </span>
                      {q.model_answer}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ingestSubMode === "json" && (
            <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-emerald-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-emerald-100 pb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-emerald-950 flex items-center gap-2">
                    <FileCode className="h-5 w-5 text-emerald-600" />
                    <span>إضافة وتغذية بنك الأسئلة بـ كود JSON 💻</span>
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(sampleJsonTemplate);
                    toast.success("تم نسخ كود الـ JSON القالبي للحافظة! 📋");
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-bold hover:bg-emerald-100 transition cursor-pointer"
                >
                  <Copy className="h-4 w-4" />
                  <span>نسخ كود قالب JSON القياسي</span>
                </button>
              </div>

              <div className="space-y-3">
                <textarea
                  rows={9}
                  placeholder={sampleJsonTemplate}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="w-full rounded-2xl border-2 border-emerald-200 p-4 text-xs font-mono font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none transition bg-slate-950/5"
                  dir="ltr"
                />

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleImportJson}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-7 py-3 text-xs font-extrabold text-white shadow-md hover:bg-emerald-700 transition cursor-pointer"
                  >
                    <Check className="h-4 w-4" />
                    <span>استيراد الأسئلة فوراً من JSON 🚀</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {ingestSubMode === "ai" && (
            <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-purple-200 shadow-sm space-y-6">
              <div className="space-y-1 border-b border-purple-100 pb-4">
                <h3 className="text-lg font-extrabold text-purple-950 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <span>قسم التفكيك الذكي بالنص بالـ AI 💡</span>
                </h3>
              </div>

              <div className="space-y-3">
                <textarea
                  rows={7}
                  placeholder="انسخ ونسب نص الأسئلة هنا (مثال: س1: ما حكم الخلع عند جهالة العوض؟ ج: يصح ولها مهر المثل...)"
                  value={rawIngestText}
                  onChange={(e) => setRawIngestText(e.target.value)}
                  className="w-full rounded-2xl border-2 border-purple-200 p-4 text-xs font-bold text-slate-900 focus:border-purple-500 focus:outline-none transition bg-white"
                />

                <button
                  type="button"
                  onClick={handleProcessRawText}
                  className="inline-flex items-center gap-2 rounded-2xl bg-purple-700 px-6 py-3 text-xs font-extrabold text-white shadow-md hover:bg-purple-800 transition cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>تفكيك الأسئلة واستخراج التاجات تلقائياً ✨</span>
                </button>
              </div>

              {parsedPreviewQs.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-purple-100">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-purple-950 text-sm">
                      معاينة الأسئلة المستخرجة ({parsedPreviewQs.length}):
                    </h4>
                    <button
                      type="button"
                      onClick={handleSaveParsedToBank}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-purple-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-800 transition cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                      <span>حفظ في بنك الأسئلة الموحد 💾</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {parsedPreviewQs.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 text-xs font-bold space-y-1"
                      >
                        <span className="text-purple-800 font-extrabold">{q.topic_label}</span>
                        <p className="text-slate-900 text-sm">{q.question}</p>
                        <p className="text-purple-700">الإجابة: {q.model_answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* QUESTION TYPE SELECTOR MODAL */}
      <AnimatePresence>
        {showTypeModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs dir-rtl text-right"
            dir="rtl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#e0c0b1]/60 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-[#e0c0b1]/30 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#ffdbca] flex items-center justify-center text-[#9d4300]">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-[#0b1c30]">
                      اختر نمط الأسئلة لبدء الاختبار 🎯
                    </h3>
                    <p className="text-xs text-[#584237]/70 font-semibold">
                      حدد نمط الأسئلة الذي ترغب في التدرب عليه الآن
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTypeModal(false)}
                  className="text-[#584237]/60 hover:text-[#0b1c30] p-1.5 rounded-full hover:bg-slate-100 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowTypeModal(false);
                    handleStartExam("mcq");
                  }}
                  className="w-full p-4 rounded-2xl bg-[#fffaf7] border-2 border-amber-200 hover:border-[#f97316] transition text-right flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">⚡</span>
                    <div>
                      <h4 className="font-extrabold text-[#0b1c30] text-sm">
                        اختيارات من متعدد (MCQs)
                      </h4>
                      <p className="text-[11px] text-[#584237]/70 font-semibold">
                        أسئلة خيارات متعددة مع قياس زمن الإجابة
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[#9d4300] rotate-180" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowTypeModal(false);
                    handleStartExam("fill");
                  }}
                  className="w-full p-4 rounded-2xl bg-[#eff4ff] border-2 border-[#dce9ff] hover:border-[#8127cf] transition text-right flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">✏️</span>
                    <div>
                      <h4 className="font-extrabold text-[#0b1c30] text-sm">
                        أكمل الفراغات المفاهيمية
                      </h4>
                      <p className="text-[11px] text-[#584237]/70 font-semibold">
                        اختبار الكلمات والمصطلحات الرئيسية مع التدقيق
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[#8127cf] rotate-180" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowTypeModal(false);
                    handleStartExam("essay");
                  }}
                  className="w-full p-4 rounded-2xl bg-purple-50/70 border-2 border-purple-200 hover:border-purple-600 transition text-right flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">✍️</span>
                    <div>
                      <h4 className="font-extrabold text-[#0b1c30] text-sm">أسئلة مقالية وعلّل</h4>
                      <p className="text-[11px] text-[#584237]/70 font-semibold">
                        تحليل الأحكام والتعليلات بصياغتك الخاصة
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-purple-700 rotate-180" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowTypeModal(false);
                    handleStartExam("all");
                  }}
                  className="w-full p-4 rounded-2xl bg-[#f97316] text-white hover:bg-[#833800] transition text-right flex items-center justify-between cursor-pointer shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🚀</span>
                    <div>
                      <h4 className="font-extrabold text-white text-sm">
                        اختبار شامل لجميع الأنماط
                      </h4>
                      <p className="text-[11px] text-white/80 font-semibold">
                        جلسة متكاملة تشمل كل أنواع الأسئلة
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white rotate-180" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT / ADD QUESTION MODAL */}
      <EditQuestionModal
        isOpen={showEditQModal}
        onClose={() => setShowEditQModal(false)}
        questionToEdit={editingQuestion}
        onSaveQuestion={handleSaveQuestion}
        onDeleteQuestion={handleDeleteBankQuestion}
      />
    </div>
  );
}
