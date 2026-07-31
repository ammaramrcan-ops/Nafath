export type FlashcardCategory =
  | "reasoning"
  | "rulings"
  | "evidence"
  | "definition"
  | "issue"
  | "summary";

export interface CategoryInfo {
  label: string;
  icon: string;
  color: string;
  badgeBg: string;
  badgeText: string;
}

export const CATEGORY_INFO: Record<FlashcardCategory, CategoryInfo> = {
  reasoning: {
    label: "العلل والأسباب (علّل)",
    icon: "❓",
    color: "amber",
    badgeBg: "bg-amber-100 border-amber-300",
    badgeText: "text-amber-950",
  },
  rulings: {
    label: "الأحكام والضوابط",
    icon: "⚖️",
    color: "emerald",
    badgeBg: "bg-emerald-100 border-emerald-300",
    badgeText: "text-emerald-950",
  },
  evidence: {
    label: "الأدلة الشرعية والنصوص",
    icon: "📜",
    color: "purple",
    badgeBg: "bg-purple-100 border-purple-300",
    badgeText: "text-purple-950",
  },
  definition: {
    label: "التعريفات والمصطلحات",
    icon: "🏷️",
    color: "blue",
    badgeBg: "bg-blue-100 border-blue-300",
    badgeText: "text-blue-950",
  },
  issue: {
    label: "المسائل والفتاوى",
    icon: "✍️",
    color: "indigo",
    badgeBg: "bg-indigo-100 border-indigo-300",
    badgeText: "text-indigo-950",
  },
  summary: {
    label: "الخلاصة والزيتونة",
    icon: "💡",
    color: "rose",
    badgeBg: "bg-rose-100 border-rose-300",
    badgeText: "text-rose-950",
  },
};

export interface SmartFlashcardHint {
  mnemonic?: string;
  keyword_cues?: string;
}

export interface SmartFlashcardStats {
  interval: number; // in days
  repetition: number;
  easeFactor: number;
  nextReviewDate: number; // timestamp
  last_response_time_sec?: number;
  confidence?: "low" | "medium" | "high";
  used_hint?: boolean;
  is_blind_spot?: boolean;
  last_diagnostic?: string;
  last_matched_keywords?: string[];
  last_missing_keywords?: string[];
}

export interface SmartFlashcard {
  id: string;
  category: FlashcardCategory;
  question: string;
  model_answer: string;
  keywords: string[];
  hint?: SmartFlashcardHint;
  stats: SmartFlashcardStats;
  explanation_baladi?: string; // 2-line simple Arabic explanation for problem solving
}

const STORAGE_KEY = "nafath.smart_srs_cards";
const STREAK_KEY = "nafath.srs_streak";
const EXAM_DATE_KEY = "nafath.srs_exam_date";

// Normalize Arabic text for keyword matching
export function normalizeArabicText(text: string): string {
  if (!text) return "";
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, "") // remove tashkeel
    .replace(/[أإآء]/g, "ا") // normalize alef
    .replace(/ة/g, "ه") // normalize ta marbouta
    .replace(/ى/g, "ي") // normalize ya
    .replace(/[^\w\s\u0600-\u06FF]/g, " ") // remove punctuation
    .replace(/\s+/g, " ");
}

export function autoCategory(question: string, defaultTag?: string): FlashcardCategory {
  const q = question.toLowerCase();
  if (
    q.includes("علل") ||
    q.includes("سبب") ||
    q.includes("دليل") ||
    q.includes("لماذا") ||
    q.includes("علة")
  ) {
    return "reasoning";
  }
  if (
    q.includes("دليل") ||
    q.includes("قوله") ||
    q.includes("اية") ||
    q.includes("حديث") ||
    q.includes("نص")
  ) {
    return "evidence";
  }
  if (
    q.includes("تعريف") ||
    q.includes("مقصود") ||
    q.includes("معنى") ||
    q.includes("مصطلح") ||
    defaultTag?.includes("مصطلح")
  ) {
    return "definition";
  }
  if (
    q.includes("حكم") ||
    q.includes("يجوز") ||
    q.includes("لا يجوز") ||
    q.includes("شرط") ||
    q.includes("أركان") ||
    q.includes("أثر")
  ) {
    return "rulings";
  }
  if (q.includes("مسألة") || q.includes("فتوى") || q.includes("حالة") || q.includes("صورة")) {
    return "issue";
  }
  return "summary";
}

// Evaluate answer accuracy by keyword matching
export function evaluateAnswerAccuracy(
  userAnswer: string,
  modelAnswer: string,
  keywords: string[],
): {
  accuracyPercentage: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  isCorrect: boolean;
} {
  const normUser = normalizeArabicText(userAnswer);

  if (!keywords || keywords.length === 0) {
    // If no keywords provided, compare normalized strings
    const normModel = normalizeArabicText(modelAnswer);
    const isMatched = normUser.length > 3 && normModel.includes(normUser.slice(0, 10));
    return {
      accuracyPercentage: isMatched ? 100 : 0,
      matchedKeywords: [],
      missingKeywords: [],
      isCorrect: isMatched,
    };
  }

  const matched: string[] = [];
  const missing: string[] = [];

  keywords.forEach((kw) => {
    const normKw = normalizeArabicText(kw);
    if (!normKw) return;
    // Check if kw or parts of kw exist in user answer
    if (normUser.includes(normKw)) {
      matched.push(kw);
    } else {
      // Split keyword into words and check if major words exist
      const kwWords = normKw.split(" ").filter((w) => w.length > 2);
      if (kwWords.length > 0 && kwWords.every((w) => normUser.includes(w))) {
        matched.push(kw);
      } else {
        missing.push(kw);
      }
    }
  });

  const accuracyPercentage = Math.round((matched.length / keywords.length) * 100);
  const isCorrect = accuracyPercentage >= 60 || (keywords.length <= 2 && matched.length >= 1);

  return {
    accuracyPercentage,
    matchedKeywords: matched,
    missingKeywords: missing,
    isCorrect,
  };
}

// Smart Spaced Repetition Algorithm & Diagnostics
export function evaluateSmartSR(
  card: SmartFlashcard,
  userAnswer: string,
  confidence: "low" | "medium" | "high",
  latencySec: number,
  usedHint: boolean,
  daysToExam?: number,
): {
  updatedCard: SmartFlashcard;
  isBlindSpot: boolean;
  diagnostic: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  isCorrect: boolean;
} {
  const { accuracyPercentage, matchedKeywords, missingKeywords, isCorrect } =
    evaluateAnswerAccuracy(userAnswer, card.model_answer, card.keywords);

  let { interval, repetition, easeFactor } = card.stats;
  let isBlindSpot = false;
  let diagnostic = "";

  // 1. Check for Blind Spot (🚨 مغالطة خطيرة)
  // Student felt high confidence, but answer was wrong / missing key concepts
  if (confidence === "high" && (!isCorrect || accuracyPercentage < 50)) {
    isBlindSpot = true;
    diagnostic = `🚨 مغالطة خطيرة (Blind Spot)! أجبت بسرعة وثقة عالية، ولكن الإجابة خاطئة أو ناقصة للكلمات المفتاحية الأساسية! تم إحالة الكارت فوراً لجلسة حل المشاكل النصية.`;
    interval = 1;
    repetition = 0;
  }
  // 2. High confidence + 100% correct + Fast (< 5s)
  else if (confidence === "high" && isCorrect && latencySec < 5 && !usedHint) {
    diagnostic = `🟢 إتقان وتلاقائية كاملة! استرجاع سريع (${latencySec.toFixed(1)} ثانية) بدقة 100% ودون تلميح. تم تأجيل الكارت لفترة طويلة.`;
    repetition += 1;
    interval = Math.max(6, Math.round(interval * 3));
    easeFactor = Math.min(3.0, easeFactor + 0.15);
  }
  // 3. High confidence + 100% correct + Slow (> 15s)
  else if (confidence === "high" && isCorrect && latencySec > 15) {
    diagnostic = `🟡 استرجاع مجهد وذاكرة هشة (أخذت ${latencySec.toFixed(1)} ثانية). تم زيادة الفاصل طفيفاً (${Math.round(interval * 1.2)} أيام) للتثبيت.`;
    repetition += 1;
    interval = Math.max(2, Math.round(interval * 1.2));
  }
  // 4. Low confidence + Correct (Guessing / Hint)
  else if (confidence === "low" && isCorrect) {
    const hintNote = usedHint ? " واستعنت بالتلميح" : "";
    diagnostic = `🟡 إجابة صحيحة ولكنك كنت شاكاً${hintNote}. سيتكرر الكارت بعد يومين لضمان الترسيخ.`;
    interval = 2;
  }
  // 5. Medium confidence + Correct
  else if (isCorrect) {
    diagnostic = `🟢 إجابة صحيحة واستيعاب جيد. الفاصل الزمني القادم: بعد ${Math.max(3, Math.round(interval * 1.5))} أيام.`;
    repetition += 1;
    interval = Math.max(3, Math.round(interval * 1.5));
  }
  // 6. Incorrect answer (ordinary mistake)
  else {
    diagnostic = `🔴 عدم معرفة عادية / نسيان جزئي. سيتكرر الكارت غداً لترسيخ الكلمات المفتاحية.`;
    repetition = 0;
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  }

  // Apply Exam Crunch Factor if exam is near (D <= 7)
  if (typeof daysToExam === "number" && daysToExam > 0 && daysToExam <= 7) {
    interval = Math.max(1, Math.min(interval, Math.floor(daysToExam / 2)));
    diagnostic += ` [⚡ ضاغط طوارئ الامتحان: تم ضغط الفاصل لضمان المراجعة قبل الامتحان بـ ${daysToExam} أيام]`;
  }

  const nextReviewDate = Date.now() + interval * 24 * 60 * 60 * 1000;

  const updatedCard: SmartFlashcard = {
    ...card,
    stats: {
      interval,
      repetition,
      easeFactor,
      nextReviewDate,
      last_response_time_sec: latencySec,
      confidence,
      used_hint: usedHint,
      is_blind_spot: isBlindSpot,
      last_diagnostic: diagnostic,
      last_matched_keywords: matchedKeywords,
      last_missing_keywords: missingKeywords,
    },
  };

  return {
    updatedCard,
    isBlindSpot,
    diagnostic,
    matchedKeywords,
    missingKeywords,
    isCorrect,
  };
}

export function getStoredSmartCards(): SmartFlashcard[] {
  if (typeof window === "undefined") return getInitialSmartCards();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getInitialSmartCards();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return getInitialSmartCards();
  } catch {
    return getInitialSmartCards();
  }
}

export function saveStoredSmartCards(cards: SmartFlashcard[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

export function getDailyStreak(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

const LAST_VISIT_KEY = "nafath.last_visit_date";

// Call this on every app load — auto-increments streak if a new day
export function trackDailyVisit(): number {
  if (typeof window === "undefined") return 0;
  try {
    const today = new Date().toDateString();
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
    const current = getDailyStreak();

    if (lastVisit === today) {
      // Already visited today — just return current streak
      return current;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    let next: number;
    if (lastVisit === yesterdayStr) {
      // Consecutive day — increment streak
      next = current + 1;
    } else if (!lastVisit) {
      // First visit ever
      next = 1;
    } else {
      // Streak broken — reset to 1
      next = 1;
    }

    localStorage.setItem(STREAK_KEY, next.toString());
    localStorage.setItem(LAST_VISIT_KEY, today);
    return next;
  } catch {
    return 0;
  }
}

// Compute real accuracy from flashcard ease factors
// easeFactor starts at 2.5, increases on correct answers, decreases on wrong
// Range ~1.3 (bad) to ~3.5+ (excellent). Map to 0-100%
export function getRealAccuracy(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const cards: SmartFlashcard[] = JSON.parse(raw);
    if (!Array.isArray(cards) || cards.length === 0) return 0;

    // Only count cards that have been reviewed at least once (repetition > 0)
    const reviewed = cards.filter((c) => c.stats.repetition > 0);
    if (reviewed.length === 0) return 0;

    // easeFactor default is 2.5. Values: 1.3 (min, worst) to ~3.5 (max, best)
    // Map to percentage: (ef - 1.3) / (3.5 - 1.3) * 100
    const avg = reviewed.reduce((sum, c) => sum + c.stats.easeFactor, 0) / reviewed.length;
    const pct = Math.round(((avg - 1.3) / (3.5 - 1.3)) * 100);
    return Math.min(100, Math.max(0, pct));
  } catch {
    return 0;
  }
}

export function incrementDailyStreak(): number {
  const current = getDailyStreak();
  const next = Math.max(1, current + 1);
  if (typeof window !== "undefined") {
    localStorage.setItem(STREAK_KEY, next.toString());
  }
  return next;
}


export function deleteSmartCard(cardId: string) {
  if (typeof window === "undefined") return;
  const cards = getStoredSmartCards().filter((c) => c.id !== cardId);
  saveStoredSmartCards(cards);
}

export function getExamDate(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(EXAM_DATE_KEY);
}

export function saveExamDate(dateStr: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(EXAM_DATE_KEY, dateStr);
}

export function getDaysToExam(): number | undefined {
  const examStr = getExamDate();
  if (!examStr) return undefined;
  const examTime = new Date(examStr).getTime();
  const diff = examTime - Date.now();
  if (diff <= 0) return undefined;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getInitialSmartCards(): SmartFlashcard[] {
  return [
    {
      id: "fc_01",
      category: "reasoning",
      question: "علل: وقوع طلاق السكران المتعدي بسكره في الفقه الشافعي؟",
      model_answer: "يقع طلاقه تغليظاً عليه عقوبة له على معصية الشرب.",
      keywords: ["تغليظاً عليه", "عقوبة", "معصية"],
      hint: {
        mnemonic: "السكران بيلبس طلاقه عقوبة لخمرة الشرب",
        keyword_cues: "تـ... / عـ... / مـ...",
      },
      explanation_baladi:
        "السكران اللي شرب بمزاجه وبإرادته، الشرع بيعاقبه ويوقع طلاقه زجراً له على جريمة الشرب، بعكس المكره أو المعذور.",
      stats: {
        interval: 1,
        repetition: 0,
        easeFactor: 2.5,
        nextReviewDate: Date.now(),
      },
    },
    {
      id: "fc_02",
      category: "rulings",
      question: "ما حكم طلاق المكره بغير حق في الفقه الإسلامي؟",
      model_answer: "لا يقع طلاقه لعدم وجود الاختيار والإرادة الحرة.",
      keywords: ["لا يقع", "الاختيار", "الإرادة"],
      hint: {
        mnemonic: "المكره برة اللعبة لغياب الاختيار",
        keyword_cues: "لا... / الا... / الإ...",
      },
      explanation_baladi:
        "اللي مهدد بالسلاح أو بالقوة ومش قاصد الطلاق من قلبه، الشرع بيعتبر كلامه لغو ولا يقع طلاقه إطلاقاً.",
      stats: {
        interval: 1,
        repetition: 0,
        easeFactor: 2.5,
        nextReviewDate: Date.now(),
      },
    },
    {
      id: "fc_03",
      category: "evidence",
      question: "ما الدليل الشرعي من القرآن على أن الخلع يقع بعوض للزوج؟",
      model_answer: "قوله تعالى: ﴿فَلَا جُنَاحَ عَلَيْهِمَا فِيمَا افْتَدَتْ بِهِ﴾.",
      keywords: ["فلا جناح", "افتدت به"],
      hint: {
        mnemonic: "آية الفداء في سورة البقرة",
        keyword_cues: "فلا... / افـ...",
      },
      explanation_baladi:
        "القرآن صرّح بـ (افتدت به) أي أن الزوجة تدفع الفدية المالية لفك عقد النكاح برضا الطرفين.",
      stats: {
        interval: 1,
        repetition: 0,
        easeFactor: 2.5,
        nextReviewDate: Date.now(),
      },
    },
    {
      id: "fc_04",
      category: "definition",
      question: "ما المقصود بـ 'مهر المثل' في أحكام الخلع عند جهالة العوض؟",
      model_answer: "هو المهر الذي تستحقه امرأة من مثيلاتها في العائلة والصفات والسن والمال.",
      keywords: ["مثيلاتها", "العائلة", "الصفات"],
      hint: {
        mnemonic: "مهر أختها أو قريبتها اللي شبهها",
        keyword_cues: "مـ... / العـ... / الصـ...",
      },
      explanation_baladi:
        "لما العوض يتقال مبهم زي 'سيارة' أو 'بيت'، بنرجع لمهر قرايبها البنات اللي زيها في العيلة لإلغاء الجهالة.",
      stats: {
        interval: 1,
        repetition: 0,
        easeFactor: 2.5,
        nextReviewDate: Date.now(),
      },
    },
  ];
}
