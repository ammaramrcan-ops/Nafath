import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Flame,
  Clock,
  Calendar,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Brain,
  Plus,
  Zap,
  RotateCcw,
  BookOpen,
  ArrowRight,
  ChevronLeft,
  GraduationCap,
  Layers,
  Pending,
  HelpCircle,
  UploadFile,
  Gavel,
  Scissors,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  getDailyStreak,
  getDaysToExam,
  getExamDate,
  getStoredSmartCards,
  incrementDailyStreak,
  saveExamDate,
  saveStoredSmartCards,
  type SmartFlashcard,
} from "@/lib/spaced-repetition";
import { defaultLesson, khulLesson, type Lesson } from "@/lib/lesson-data";
import { getLibrary, deleteFromLibrary, type SavedLesson } from "@/lib/lesson-library";
import { generateSmartCardsFromLesson } from "@/lib/auto-flashcards";
import { SmartFlashcardCard } from "./SmartFlashcardCard";
import { useNavigate } from "@tanstack/react-router";
import { TextProblemSolvingSession } from "./TextProblemSolvingSession";
import { CSVImportExportModal } from "./CSVImportExportModal";
import { EditFlashcardModal } from "./EditFlashcardModal";
import { LessonCardsManagerModal } from "./LessonCardsManagerModal";

export function SpacedRepetitionView() {
  const navigate = useNavigate();
  const [allCards, setAllCards] = useState<SmartFlashcard[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isStudying, setIsStudying] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [dailyStreak, setDailyStreak] = useState(5);
  const [examDate, setExamDateState] = useState<string>("");
  const [showExamPicker, setShowExamPicker] = useState(false);

  const [showCSVModal, setShowCSVModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCard, setEditingCard] = useState<SmartFlashcard | null>(null);

  const [selectedLessonForManagement, setSelectedLessonForManagement] = useState<{
    id: string;
    title: string;
    cards: SmartFlashcard[];
  } | null>(null);

  const [activeTab, setActiveTab] = useState<"review" | "problems">("review");

  const [filterSubjectId, setFilterSubjectId] = useState<string | null>(null);
  const [filterSubjectName, setFilterSubjectName] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredSmartCards();
    setAllCards(stored);
    setDailyStreak(getDailyStreak());
    const savedDate = getExamDate();
    if (savedDate) setExamDateState(savedDate);
    const lib = getLibrary();
    setLibraryLessons(lib);

    try {
      const subId = sessionStorage.getItem("nafath.spacedRepetition.filterSubjectId");
      const subName = sessionStorage.getItem("nafath.spacedRepetition.filterSubjectName");
      if (subId || subName) {
        setFilterSubjectId(subId);
        setFilterSubjectName(subName);
      } else {
        setFilterSubjectId(null);
        setFilterSubjectName(null);
      }
    } catch {}

    // Auto-start from home flashcard picker
    try {
      const startId = sessionStorage.getItem("nafath.flashcard.startLessonId");
      if (startId) {
        sessionStorage.removeItem("nafath.flashcard.startLessonId");
        setSelectedLessonId(startId);
        setCurrentIndex(0);
        setIsStudying(true);
      }
    } catch {}
  }, []);

  const handleClearSubjectFilter = () => {
    setFilterSubjectId(null);
    setFilterSubjectName(null);
    try {
      sessionStorage.removeItem("nafath.spacedRepetition.filterSubjectId");
      sessionStorage.removeItem("nafath.spacedRepetition.filterSubjectName");
    } catch {}
  };

  // Filtered Lessons List by Subject
  const availableLessons = useMemo(() => {
    let filtered = libraryLessons;

    if (filterSubjectId || filterSubjectName) {
      filtered = filtered.filter((saved) => {
        const titleLower = (saved.title || "").toLowerCase();
        const subIdLower = (saved.subjectId || "").toLowerCase();

        if (filterSubjectId && (subIdLower === filterSubjectId.toLowerCase() || filterSubjectId.toLowerCase().includes(subIdLower))) {
          return true;
        }

        if (filterSubjectName) {
          const sNameLower = filterSubjectName.toLowerCase();
          if (titleLower.includes(sNameLower) || sNameLower.includes(titleLower)) return true;
          if (sNameLower.includes("فقه") && (subIdLower === "fiqh" || titleLower.includes("خُلع") || titleLower.includes("خلع"))) return true;
          if (sNameLower.includes("أحياء") && titleLower.includes("بناء ضوئي")) return true;
        }

        return false;
      });
    }

    return filtered.map((saved) => ({
      id: saved.id,
      title: saved.title,
      subtitle: `درس من المكتبة — ${saved.blocks || 0} كتل`,
      icon: saved.title.includes("فقه") || saved.title.includes("خُلع") ? "⚖️" : saved.title.includes("بناء") || saved.title.includes("أحياء") ? "🌿" : "📚",
      data: saved.data,
    }));
  }, [libraryLessons, filterSubjectId, filterSubjectName]);

  // Filtered Cards to Review — always generate fresh from the selected lesson data
  const currentStudyCards = useMemo(() => {
    if (selectedLessonId) {
      const lesson = availableLessons.find((l) => l.id === selectedLessonId);
      if (lesson) return generateSmartCardsFromLesson(lesson.data);
    }
    // No lesson selected: return all stored cards that are due today
    const now = Date.now();
    return allCards.filter((c) => !c.stats?.nextReviewDate || c.stats.nextReviewDate <= now);
  }, [allCards, selectedLessonId, availableLessons]);

  const dueTodayCount = useMemo(() => {
    const now = Date.now();
    return allCards.filter((c) => !c.stats?.nextReviewDate || c.stats.nextReviewDate <= now).length;
  }, [allCards]);

  const daysToExam = useMemo(() => {
    if (!examDate) return undefined;
    return getDaysToExam(examDate);
  }, [examDate]);

  const handleStartLessonStudy = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setCurrentIndex(0);
    setIsStudying(true);
  };

  const handleCompleteCard = (
    updatedCard: SmartFlashcard,
    isBlindSpot: boolean,
    evaluation: {
      matchedKeywords: string[];
      missingKeywords: string[];
      isCorrect: boolean;
      diagnostic: string;
    }
  ) => {
    const newCards = allCards.map((c) => (c.id === updatedCard.id ? updatedCard : c));
    if (!newCards.some((c) => c.id === updatedCard.id)) {
      newCards.push(updatedCard);
    }
    setAllCards(newCards);
    saveStoredSmartCards(newCards);

    const newStreak = incrementDailyStreak();
    setDailyStreak(newStreak);

    if (currentIndex < currentStudyCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsStudying(false);
      setSelectedLessonId(null);
    }
  };

  const handleSaveCard = (saved: SmartFlashcard) => {
    const updated = allCards.map((c) => (c.id === saved.id ? saved : c));
    if (!updated.some((c) => c.id === saved.id)) {
      updated.push(saved);
    }
    setAllCards(updated);
    saveStoredSmartCards(updated);
  };

  const handleDeleteCard = (cardId: string) => {
    const updated = allCards.filter((c) => c.id !== cardId);
    setAllCards(updated);
    saveStoredSmartCards(updated);
  };

  const handleOpenEditModal = (card?: SmartFlashcard) => {
    setEditingCard(card || null);
    setShowEditModal(true);
  };

  const handleSaveExamDate = (dateStr: string) => {
    setExamDateState(dateStr);
    saveExamDate(dateStr);
    setShowExamPicker(false);
  };

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-10 dir-rtl text-right space-y-12 font-body-md" dir="rtl">
      {/* Active Study Session Screen */}
      {isStudying && currentStudyCards.length > 0 ? (
        <SmartFlashcardCard
          card={currentStudyCards[currentIndex] || currentStudyCards[0]}
          currentIndex={currentIndex}
          totalCards={currentStudyCards.length}
          dailyStreak={dailyStreak}
          daysToExam={daysToExam}
          onCompleteCard={handleCompleteCard}
          onEditCard={handleOpenEditModal}
          onExitStudy={() => setIsStudying(false)}
        />
      ) : (
        /* Main Spaced Repetition Center Landing Page (Stitch UI) */
        <div className="space-y-12">
          {/* Header Section */}
          <section className="text-center space-y-4 max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0b1c30] tracking-tight">
              مركز التكرار المتباعد والتذكر التكيفي
            </h1>
            <p className="text-sm sm:text-base font-semibold text-[#584237]/80 leading-relaxed">
              نظام ذكي مصمم لتعزيز ذاكرتك من خلال مراجعة مدروسة تعتمد على فترات متباعدة علمياً لضمان استقرار المعلومة.
            </p>
          </section>

          {/* Summary Statistics Bento Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Cards */}
            <div className="bg-white border border-[#e0c0b1]/30 p-6 rounded-[2rem] shadow-md flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-[#ffdbca]/60 flex items-center justify-center text-[#9d4300]">
                    <Layers className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-[#584237]">إجمالي الكروت</span>
                </div>
                <div className="text-3xl font-extrabold text-[#0b1c30]">
                  {allCards.length > 0 ? allCards.length : "1,284"}
                </div>
              </div>
              <div className="text-[11px] font-extrabold bg-[#ffdbca]/60 text-[#9d4300] px-3 py-1 rounded-full w-fit">
                +12 اليوم
              </div>
            </div>

            {/* Daily Requirement */}
            <div className="bg-[#eff4ff] border-none p-6 rounded-[2rem] flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-[#8127cf]">
                    <Clock className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-[#584237]">المتطلبة اليوم</span>
                </div>
                <div className="text-3xl font-extrabold text-[#0b1c30]">
                  {dueTodayCount > 0 ? dueTodayCount : 45}
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedLessonId(null);
                  setCurrentIndex(0);
                  setIsStudying(true);
                }}
                className="text-xs font-extrabold text-[#8127cf] hover:underline cursor-pointer text-right"
              >
                مراجعة الآن ←
              </button>
            </div>

            {/* Daily Streak */}
            <div className="bg-white border border-[#e0c0b1]/30 p-6 rounded-[2rem] shadow-md flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                    <Flame className="h-5 w-5 fill-amber-500" />
                  </div>
                  <span className="text-xs font-bold text-[#584237]">الاستمرار اليومي</span>
                </div>
                <div className="text-3xl font-extrabold text-[#0b1c30]">{dailyStreak} يوم</div>
              </div>
              <div className="text-xs font-extrabold text-[#584237]">أداء متميز! 🔥</div>
            </div>

            {/* Exam Countdown */}
            <div className="bg-white border border-rose-200/80 p-6 rounded-[2rem] shadow-md flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-[#584237]">طوارئ الامتحان</span>
                </div>
                <div className="text-3xl font-extrabold text-rose-600">
                  {typeof daysToExam === "number" ? `${daysToExam} يوم` : "12 يوم"}
                </div>
              </div>
              <button
                onClick={() => setShowExamPicker(!showExamPicker)}
                className="text-xs font-extrabold text-rose-600 hover:underline cursor-pointer text-right"
              >
                {examDate ? "تحديد ميعاد آخر 📅" : "حدد ميعاد الامتحان 📅"}
              </button>
            </div>
          </section>

          {/* Exam Picker Box */}
          {showExamPicker && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3">
              <span className="text-xs font-bold text-amber-950">ميعاد الامتحان الحقيقي:</span>
              <input
                type="date"
                value={examDate}
                onChange={(e) => handleSaveExamDate(e.target.value)}
                className="bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-bold text-[#0b1c30]"
              />
            </div>
          )}

          {/* Action Bar */}
          <section className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => setShowCSVModal(true)}
              className="flex items-center gap-3 px-6 py-4 bg-white border border-[#e0c0b1] text-[#584237] hover:bg-[#eff4ff] rounded-full font-bold text-sm transition-all cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>استرداد بـ CSV</span>
            </button>
          </section>

          {/* Active Subject Filter Bar */}
          {filterSubjectName && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#eff4ff] border border-[#9d4300]/30 text-right">
              <span className="text-sm font-bold text-[#0b1c30]">
                📌 تصفية بطاقات التكرار المتباعد لمادة: <span className="text-[#9d4300] font-extrabold">{filterSubjectName}</span>
              </span>
              <button
                type="button"
                onClick={handleClearSubjectFilter}
                className="text-xs font-bold text-[#9d4300] hover:underline cursor-pointer bg-white px-3 py-1.5 rounded-full border border-[#e0c0b1]"
              >
                عرض بطاقات كافة المواد 🌐
              </button>
            </div>
          )}

          {/* Subject Selection Grid */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-[#0b1c30]">
                اختر الدرس الذي تريد مراجعته ودراسته الآن
              </h2>
              <div className="h-px flex-grow bg-[#e0c0b1]/30 mr-6" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availableLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="bg-white rounded-[2.5rem] p-6 border border-[#e0c0b1]/30 shadow-md flex items-center justify-between gap-6 group hover:border-[#9d4300]/50 transition-all relative"
                >
                  <div className="flex items-center gap-6 w-full">
                    <div className="w-20 h-20 rounded-3xl bg-[#ffdbca]/40 flex-shrink-0 flex items-center justify-center text-3xl font-extrabold text-[#9d4300]">
                      {lesson.icon}
                    </div>
                    <div className="flex-grow space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-extrabold text-[#0b1c30]">{lesson.title}</h3>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const cardsForLesson = generateSmartCardsFromLesson(lesson.data);
                              setSelectedLessonForManagement({
                                id: lesson.id,
                                title: lesson.title,
                                cards: cardsForLesson,
                              });
                            }}
                            className="p-2 rounded-xl text-[#584237]/70 hover:text-[#9d4300] hover:bg-[#eff4ff] transition cursor-pointer flex items-center gap-1 border border-transparent hover:border-[#e0c0b1]/40"
                            title="تعديل بطاقات هذا الدرس"
                          >
                            <Pencil className="h-4 w-4 text-[#9d4300]" />
                            <span className="text-[11px] font-bold hidden sm:inline-block">تعديل</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFromLibrary(lesson.id);
                              setLibraryLessons(getLibrary());
                            }}
                            className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition cursor-pointer flex items-center gap-1 border border-transparent hover:border-rose-200"
                            title="حذف الدرس"
                          >
                            <Trash2 className="h-4 w-4 text-rose-600" />
                            <span className="text-[11px] font-bold hidden sm:inline-block">حذف</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-[#584237]/80">{lesson.subtitle}</p>
                      <button
                        onClick={() => handleStartLessonStudy(lesson.id)}
                        className="flex items-center gap-2 text-[#9d4300] font-extrabold text-xs group-hover:gap-3 transition-all cursor-pointer pt-1"
                      >
                        <span>ابدأ مراجعة هذا الدرس الآن</span>
                        <ArrowRight className="h-4 w-4 rotate-180" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Unified Bank Featured Card */}
          <section>
            <div className="rounded-full py-5 px-8 flex flex-wrap items-center justify-between bg-[#eff4ff] border border-[#e0c0b1]/40 gap-4">
              <div className="flex items-center gap-3">
                <Brain className="h-6 w-6 text-[#9d4300]" />
                <span className="text-base font-extrabold text-[#0b1c30]">بنك الأسئلة الموحد</span>
              </div>
              <button
                onClick={() => navigate({ to: "/interactive-exams" })}
                className="group flex items-center gap-2 text-[#9d4300] font-extrabold text-xs hover:gap-3 transition-all cursor-pointer"
              >
                <span>دخول بنك الأسئلة الموحد</span>
                <ArrowRight className="h-4 w-4 rotate-180" />
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Lesson Cards Manager Modal (Add new vs Edit existing card) */}
      <LessonCardsManagerModal
        isOpen={Boolean(selectedLessonForManagement)}
        onClose={() => setSelectedLessonForManagement(null)}
        lessonTitle={selectedLessonForManagement?.title || ""}
        lessonCards={selectedLessonForManagement?.cards || []}
        onAddNewCard={() => handleOpenEditModal()}
        onEditCard={(card) => handleOpenEditModal(card)}
        onDeleteCard={(cardId) => handleDeleteCard(cardId)}
      />

      {/* CSV Import/Export Modal */}
      <CSVImportExportModal
        isOpen={showCSVModal}
        onClose={() => setShowCSVModal(false)}
        cards={allCards}
        onImportCards={(imported) => {
          const updated = [...allCards, ...imported];
          setAllCards(updated);
          saveStoredSmartCards(updated);
        }}
      />

      {/* Edit Flashcard Modal */}
      <EditFlashcardModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        cardToEdit={editingCard}
        onSaveCard={handleSaveCard}
        onDeleteCard={handleDeleteCard}
      />
    </div>
  );
}
