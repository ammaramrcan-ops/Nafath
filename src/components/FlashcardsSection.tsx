import { useState, useMemo, useEffect } from "react";
import { Sparkles, Filter, FileSpreadsheet, AlertCircle, Plus } from "lucide-react";
import type { ParagraphBlock as Block } from "@/lib/lesson-data";
import { generateSmartCardsFromBlock } from "@/lib/auto-flashcards";
import {
  CATEGORY_INFO,
  getDailyStreak,
  getDaysToExam,
  incrementDailyStreak,
  type FlashcardCategory,
  type SmartFlashcard,
} from "@/lib/spaced-repetition";
import { SmartFlashcardCard } from "./SmartFlashcardCard";
import { TextProblemSolvingSession } from "./TextProblemSolvingSession";
import { CSVImportExportModal } from "./CSVImportExportModal";
import { EditFlashcardModal } from "./EditFlashcardModal";

export function FlashcardsSection({ block }: { readonly block: Block }) {
  const initialCards = useMemo(() => {
    return generateSmartCardsFromBlock(block);
  }, [block]);

  const [cards, setCards] = useState<SmartFlashcard[]>(initialCards);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [currentIndex, setCurrentIndex] = useState(0);

  const [dailyStreak, setDailyStreak] = useState(5);
  const daysToExam = getDaysToExam();

  const [showCSVModal, setShowCSVModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCard, setEditingCard] = useState<SmartFlashcard | null>(null);

  const [blindSpotCards, setBlindSpotCards] = useState<SmartFlashcard[]>([]);
  const [isProblemSolvingMode, setIsProblemSolvingMode] = useState(false);

  useEffect(() => {
    setCards(generateSmartCardsFromBlock(block));
    setCurrentIndex(0);
    setDailyStreak(getDailyStreak());
  }, [block]);

  // Filter cards by category
  const filteredCards = useMemo(() => {
    if (activeCategory === "all") return cards;
    return cards.filter((c) => c.category === activeCategory);
  }, [cards, activeCategory]);

  const currentCard = filteredCards[currentIndex] || filteredCards[0];

  const handleCompleteCard = (
    updatedCard: SmartFlashcard,
    isBlindSpot: boolean,
    evaluation: {
      matchedKeywords: string[];
      missingKeywords: string[];
      isCorrect: boolean;
      diagnostic: string;
    },
  ) => {
    setCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)));

    if (isBlindSpot) {
      setBlindSpotCards((prev) => {
        if (prev.some((c) => c.id === updatedCard.id)) return prev;
        return [...prev, updatedCard];
      });
    }

    if (evaluation.isCorrect) {
      setDailyStreak(incrementDailyStreak());
    }

    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      if (blindSpotCards.length > 0) {
        setIsProblemSolvingMode(true);
      }
    }
  };

  const handleSaveCard = (savedCard: SmartFlashcard) => {
    setCards((prev) => {
      const exists = prev.some((c) => c.id === savedCard.id);
      if (exists) {
        return prev.map((c) => (c.id === savedCard.id ? savedCard : c));
      }
      return [savedCard, ...prev];
    });
  };

  const handleDeleteCard = (cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleImportNewCards = (imported: SmartFlashcard[]) => {
    setCards((prev) => [...imported, ...prev]);
    setCurrentIndex(0);
  };

  const presentCategories = useMemo(() => {
    const set = new Set<string>(["all"]);
    cards.forEach((c) => set.add(c.category));
    return Array.from(set);
  }, [cards]);

  if (isProblemSolvingMode && blindSpotCards.length > 0) {
    return (
      <TextProblemSolvingSession
        blindSpotCards={blindSpotCards}
        onFinishSession={() => {
          setIsProblemSolvingMode(false);
          setBlindSpotCards([]);
          setCurrentIndex(0);
        }}
      />
    );
  }

  return (
    <div
      className="rounded-[28px] bg-amber-50/90 p-6 sm:p-8 shadow-[var(--shadow-soft)] border-2 border-amber-300 space-y-6 text-right dir-rtl"
      dir="rtl"
    >
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 pb-4">
        <div className="flex items-center gap-2.5 text-amber-950 font-black text-lg">
          <Sparkles className="h-6 w-6 text-amber-600" />
          <span>بطاقات الاستذكار الذكي (Smart Flashcards) 🎴✨</span>
        </div>

        {/* Actions: Add Card, Edit, CSV, Blind Spot */}
        <div className="flex flex-wrap items-center gap-2">
          {blindSpotCards.length > 0 && (
            <button
              type="button"
              onClick={() => setIsProblemSolvingMode(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition cursor-pointer"
            >
              <AlertCircle className="h-4 w-4" />
              <span>جلسة حل المشاكل ({blindSpotCards.length}) 🚨</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setEditingCard(null);
              setShowEditModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة كارت جديد ➕</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCSVModal(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-amber-950 border border-amber-300 hover:bg-amber-100 transition cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>استيراد / تصدير CSV 📥</span>
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
          <Filter className="h-3.5 w-3.5 text-amber-600" />
          <span>التصنيف الفقهي التفاعلي للكروت:</span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {presentCategories.map((catKey) => {
            const isSel = activeCategory === catKey;
            const count =
              catKey === "all" ? cards.length : cards.filter((c) => c.category === catKey).length;
            const catInfo =
              catKey === "all"
                ? { label: "جميع الكروت", icon: "🎴" }
                : CATEGORY_INFO[catKey as FlashcardCategory] || { label: catKey, icon: "📌" };

            return (
              <button
                type="button"
                key={catKey}
                onClick={() => {
                  setActiveCategory(catKey);
                  setCurrentIndex(0);
                }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer border ${
                  isSel
                    ? "bg-amber-600 text-white border-amber-700 shadow-xs"
                    : "bg-white text-amber-950 border-amber-300 hover:bg-amber-100"
                }`}
              >
                <span>{catInfo.icon}</span>
                <span>{catInfo.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${isSel ? "bg-amber-700 text-amber-100" : "bg-amber-100 text-amber-900"}`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Flashcard Interactive Player */}
      {filteredCards.length > 0 && currentCard ? (
        <SmartFlashcardCard
          card={currentCard}
          currentIndex={currentIndex}
          totalCards={filteredCards.length}
          dailyStreak={dailyStreak}
          daysToExam={daysToExam}
          onCompleteCard={handleCompleteCard}
          onEditCard={(c) => {
            setEditingCard(c);
            setShowEditModal(true);
          }}
        />
      ) : (
        <div className="py-12 text-center text-xs font-bold text-amber-900 bg-white rounded-3xl border border-amber-200 space-y-3">
          <p>لا توجد كروت متاحة في هذا التصنيف حالياً.</p>
          <button
            type="button"
            onClick={() => {
              setEditingCard(null);
              setShowEditModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة كارت جديد لهذا الدرس ➕</span>
          </button>
        </div>
      )}

      {/* CSV Import/Export Modal */}
      <CSVImportExportModal
        isOpen={showCSVModal}
        onClose={() => setShowCSVModal(false)}
        cards={cards}
        onImportCards={handleImportNewCards}
      />

      {/* Edit/Add Card Modal */}
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
