import type { ParagraphBlock, Lesson } from "./lesson-data";
import { generateKeywordCues } from "./csv-flashcards";
import {
  autoCategory,
  type FlashcardCategory,
  type SmartFlashcard,
} from "./spaced-repetition";

/**
 * AI Auto-Generation: Extracts SmartFlashcards dynamically from a ParagraphBlock.
 */
export function generateSmartCardsFromBlock(
  block: ParagraphBlock,
  blockIdx = 0
): SmartFlashcard[] {
  const cards: SmartFlashcard[] = [];
  const baseId = `fc_block_${block.id || blockIdx + 1}`;

  // 1. Cards from Zaitouna (Definitions, Reasoning, Links)
  if (block.zaitouna) {
    const z = block.zaitouna;

    if (z.definitions && z.definitions.trim()) {
      const keywords = extractKeywordsFromText(z.definitions);
      cards.push({
        id: `${baseId}_z_def`,
        category: "rulings",
        question: `ما الأحكام الضابطة والمفاهيم الرئيسية لفقرة: "${block.title}"؟`,
        model_answer: z.definitions,
        keywords,
        hint: {
          mnemonic: block.mnemonic || `تذكر مفاهيم ${block.title}`,
          keyword_cues: generateKeywordCues(keywords),
        },
        explanation_baladi: block.story || block.short_sentence || "المفاهيم الأساسية التي يدور حولها الحكم الشرعي في الفقرة.",
        stats: createDefaultStats(),
      });
    }

    if (z.reasoning && z.reasoning.trim()) {
      const keywords = extractKeywordsFromText(z.reasoning);
      cards.push({
        id: `${baseId}_z_reas`,
        category: "reasoning",
        question: `علّل: ما التفسير والعلة المنطقية لـ "${block.title}"؟`,
        model_answer: z.reasoning,
        keywords,
        hint: {
          mnemonic: block.funny_link || `العلة تكمن في رفع الضرر وحفظ الحقوق`,
          keyword_cues: generateKeywordCues(keywords),
        },
        explanation_baladi: block.funny_link || block.short_sentence || "السبب والعلة الفقهية التي بني عليها الحكم لرفع الحرج.",
        stats: createDefaultStats(),
      });
    }

    if (z.links && z.links.trim()) {
      const keywords = extractKeywordsFromText(z.links);
      cards.push({
        id: `${baseId}_z_links`,
        category: "summary",
        categoryLabel: "💡 رابط تكاملي",
        question: `كيف ترتبط أحكام فقرة "${block.title}" بغيرها من أبواب الفقه؟`,
        model_answer: z.links,
        keywords,
        hint: {
          mnemonic: block.short_sentence || "التكامل مع القواعد الفقهية العامة",
          keyword_cues: generateKeywordCues(keywords),
        },
        stats: createDefaultStats(),
      } as any);
    }
  }

  // 2. Cards from Hard Words (Definitions)
  if (block.hard_words && Array.isArray(block.hard_words) && block.hard_words.length > 0) {
    block.hard_words.forEach((hw, idx) => {
      if (!hw.word || !hw.meaning) return;
      const keywords = [hw.word, ...extractKeywordsFromText(hw.meaning).slice(0, 2)];
      cards.push({
        id: `${baseId}_hw_${idx}`,
        category: "definition",
        question: `ما المعنى الدقيق والمقصود بالمصطلح الشرعي: "${hw.word}"؟`,
        model_answer: hw.meaning,
        keywords,
        hint: {
          mnemonic: `مصطلح ${hw.word}`,
          keyword_cues: generateKeywordCues(keywords),
        },
        explanation_baladi: `معنى "${hw.word}" بالبلدي: ${hw.meaning}`,
        stats: createDefaultStats(),
      });
    });
  }

  // 3. Cards from Quizzes (Essays, Fills, MCQs)
  if (block.quizzes?.essays && Array.isArray(block.quizzes.essays)) {
    block.quizzes.essays.forEach((essay, idx) => {
      if (!essay.question) return;
      const cat = autoCategory(essay.question, "essay");
      const keywords = essay.keywords && essay.keywords.length > 0
        ? essay.keywords
        : extractKeywordsFromText(block.full_text).slice(0, 3);

      cards.push({
        id: `${baseId}_essay_${idx}`,
        category: cat,
        question: essay.question,
        model_answer: essay.keywords && essay.keywords.length > 0 ? `الكلمات المفتاحية الواجب ذكرها: ${essay.keywords.join("، ")}` : block.full_text.slice(0, 150),
        keywords,
        hint: {
          mnemonic: essay.hint || block.mnemonic || undefined,
          keyword_cues: generateKeywordCues(keywords),
        },
        explanation_baladi: block.short_sentence || "إجابة مقالية استرجاعية تضمن الإلمام الشامل بالشروط والأسباب.",
        stats: createDefaultStats(),
      });
    });
  }

  if (block.quizzes?.fills && Array.isArray(block.quizzes.fills)) {
    block.quizzes.fills.forEach((fill, idx) => {
      if (!fill.question || !fill.answer) return;
      cards.push({
        id: `${baseId}_fill_${idx}`,
        category: "rulings",
        question: fill.question,
        model_answer: fill.answer,
        keywords: [fill.answer],
        hint: {
          mnemonic: `الإجابة هي: ${fill.answer.slice(0, 1)}...`,
          keyword_cues: `${fill.answer.slice(0, 1)}ـ...`,
        },
        stats: createDefaultStats(),
      });
    });
  }

  if (block.quizzes?.mcqs && Array.isArray(block.quizzes.mcqs)) {
    block.quizzes.mcqs.forEach((mcq, idx) => {
      if (!mcq.question || !mcq.answer) return;
      const cat = autoCategory(mcq.question, "mcq");
      cards.push({
        id: `${baseId}_mcq_${idx}`,
        category: cat,
        question: mcq.question,
        model_answer: mcq.answer,
        keywords: [mcq.answer],
        hint: {
          mnemonic: `اختر الإجابة الضابطة: ${mcq.answer.slice(0, 4)}...`,
          keyword_cues: generateKeywordCues([mcq.answer]),
        },
        stats: createDefaultStats(),
      });
    });
  }

  // Fallback card if block has no other details
  if (cards.length === 0 && block.full_text) {
    const keywords = extractKeywordsFromText(block.full_text).slice(0, 3);
    cards.push({
      id: `${baseId}_fallback`,
      category: "summary",
      question: `ما أهم الأحكام والبيانات الواردة في فقرة: "${block.title}"؟`,
      model_answer: block.full_text,
      keywords,
      hint: {
        mnemonic: block.short_sentence || block.title,
        keyword_cues: generateKeywordCues(keywords),
      },
      stats: createDefaultStats(),
    });
  }

  return cards;
}

/**
 * Auto-Generates SmartFlashcards for an entire Lesson.
 */
export function generateSmartCardsFromLesson(lesson: Lesson): SmartFlashcard[] {
  if (!lesson || !lesson.blocks) return [];
  const all: SmartFlashcard[] = [];
  lesson.blocks.forEach((block, idx) => {
    const blockCards = generateSmartCardsFromBlock(block, idx);
    all.push(...blockCards);
  });
  return all;
}

function createDefaultStats() {
  return {
    interval: 1,
    repetition: 0,
    easeFactor: 2.5,
    nextReviewDate: Date.now(),
  };
}

function extractKeywordsFromText(text: string): string[] {
  if (!text) return [];
  const words = text
    .split(/\s+/)
    .map((w) => w.replace(/[^\w\u0600-\u06FF]/g, "").trim())
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));

  return Array.from(new Set(words)).slice(0, 4);
}

const STOP_WORDS = new Set([
  "التي",
  "الذي",
  "الذين",
  "اللاتي",
  "اللتين",
  "هذا",
  "هذه",
  "هؤلاء",
  "ذلك",
  "تلك",
  "أولئك",
  "على",
  "إلى",
  "عن",
  "في",
  "حتى",
  "مع",
  "بين",
  "كيف",
  "متى",
  "أين",
  "لماذا",
  "ماذا",
  "كان",
  "كانت",
  "يكون",
  "تكون",
  "ليس",
  "ليست",
  "غير",
  "سوف",
  "لكن",
  "لأن",
  "وهو",
  "وهي",
]);
