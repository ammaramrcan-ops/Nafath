import {
  saveStoredSmartCards,
  getStoredSmartCards,
  autoCategory,
  type SmartFlashcard,
} from "./spaced-repetition";

export type ExamQuestionType = "mcq" | "fill" | "essay";

export interface ExamQuestion {
  id: string;
  type: ExamQuestionType;
  question: string;
  options?: string[]; // for mcqs
  model_answer: string;
  keywords?: string[]; // for fill/essay auto-checking
  topic_tag: string; // e.g. "#شروط_الطلاق", "#طلاق_السكران", "#الخلع"
  topic_label: string; // e.g. "شروط الطلاق", "طلاق السكران"
  explanation_baladi?: string;
  hint?: string;
}

export interface QuestionPerformance {
  questionId: string;
  type: ExamQuestionType;
  topic_tag: string;
  topic_label: string;
  userAnswer: string;
  latencySec: number;
  isCorrect: boolean;
  score: number; // 0 to 100
}

export interface TopicReportItem {
  topic_tag: string;
  topic_label: string;
  totalQuestions: number;
  correctQuestions: number;
  successRate: number; // percentage %
  avgLatencySec: number;
  assessment: "mastered" | "slow" | "blind_spot";
  assessmentLabel: string;
  assessmentIcon: string;
  badgeBg: string;
  badgeText: string;
}

const QUESTION_BANK_KEY = "nafath.exam_question_bank_v1";

/**
 * Normalizes Arabic text for answer verification
 */
export function normalizeArabicText(text: string): string {
  if (!text) return "";
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, "") // remove tashkeel
    .replace(/[أإآء]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\w\s\u0600-\u06FF]/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * Returns stored Question Bank or initial Fiqh/Science questions
 */
export function getQuestionBank(): ExamQuestion[] {
  if (typeof window === "undefined") return getInitialQuestionBank();
  try {
    const raw = localStorage.getItem(QUESTION_BANK_KEY);
    if (!raw) {
      const initial = getInitialQuestionBank();
      saveQuestionBank(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    const initial = getInitialQuestionBank();
    saveQuestionBank(initial);
    return initial;
  } catch {
    return getInitialQuestionBank();
  }
}

export function saveQuestionBank(questions: ExamQuestion[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUESTION_BANK_KEY, JSON.stringify(questions));
}

/**
 * Evaluates a single question answer & computes score + latency diagnostic
 */
export function evaluateQuestionAnswer(
  q: ExamQuestion,
  userAnswer: string,
  latencySec: number,
): QuestionPerformance {
  const normUser = normalizeArabicText(userAnswer);

  let isCorrect = false;
  let score = 0;

  if (q.type === "mcq") {
    const normAns = normalizeArabicText(q.model_answer);
    isCorrect = normUser.length > 0 && (normUser === normAns || normAns.includes(normUser));
    score = isCorrect ? 100 : 0;
  } else {
    // Fill or Essay: check keywords or fuzzy string match
    if (q.keywords && q.keywords.length > 0) {
      const matched = q.keywords.filter((kw) => {
        const normKw = normalizeArabicText(kw);
        return normKw && normUser.includes(normKw);
      });
      score = Math.round((matched.length / q.keywords.length) * 100);
      isCorrect = score >= 50;
    } else {
      const normModel = normalizeArabicText(q.model_answer);
      isCorrect = normUser.length > 3 && normModel.includes(normUser.slice(0, 8));
      score = isCorrect ? 100 : 0;
    }
  }

  return {
    questionId: q.id,
    type: q.type,
    topic_tag: q.topic_tag || "#عام",
    topic_label: q.topic_label || "مفاهيم عامة",
    userAnswer,
    latencySec,
    isCorrect,
    score,
  };
}

/**
 * Calculates Topic Breakdown Report from student test performance
 */
export function generateTopicReport(
  questions: ExamQuestion[],
  performances: QuestionPerformance[],
): {
  items: TopicReportItem[];
  totalScorePercentage: number;
  aiGuidance: string;
  weakQuestions: ExamQuestion[];
} {
  const map = new Map<
    string,
    { label: string; count: number; correct: number; totalLatency: number; weakQs: ExamQuestion[] }
  >();

  performances.forEach((p) => {
    const tag = p.topic_tag || "#عام";
    const label = p.topic_label || tag.replace("#", "");
    const qObj = questions.find((q) => q.id === p.questionId);

    if (!map.has(tag)) {
      map.set(tag, { label, count: 0, correct: 0, totalLatency: 0, weakQs: [] });
    }

    const entry = map.get(tag)!;
    entry.count += 1;
    if (p.isCorrect) entry.correct += 1;
    else if (qObj) entry.weakQs.push(qObj);

    entry.totalLatency += p.latencySec;
  });

  const items: TopicReportItem[] = [];
  const weakQuestions: ExamQuestion[] = [];

  map.forEach((val, tag) => {
    const successRate = Math.round((val.correct / val.count) * 100);
    const avgLatencySec = Math.round(val.totalLatency / val.count);

    let assessment: "mastered" | "slow" | "blind_spot" = "mastered";
    let assessmentLabel = "متقن جداً (لا يحتاج مراجعة)";
    let assessmentIcon = "⚡";
    let badgeBg = "bg-emerald-100 border-emerald-300";
    let badgeText = "text-emerald-950";

    if (successRate < 60) {
      assessment = "blind_spot";
      assessmentLabel = "فجوة معرفية (تحويل تلقائي للفلاش كاردز)";
      assessmentIcon = "🚨";
      badgeBg = "bg-rose-100 border-rose-300";
      badgeText = "text-rose-950";
      weakQuestions.push(...val.weakQs);
    } else if (avgLatencySec > 12) {
      assessment = "slow";
      assessmentLabel = "مفهوم بطيء (محتاج تحسين سرعة)";
      assessmentIcon = "🐢";
      badgeBg = "bg-amber-100 border-amber-300";
      badgeText = "text-amber-950";
    }

    items.push({
      topic_tag: tag,
      topic_label: val.label,
      totalQuestions: val.count,
      correctQuestions: val.correct,
      successRate,
      avgLatencySec,
      assessment,
      assessmentLabel,
      assessmentIcon,
      badgeBg,
      badgeText,
    });
  });

  // Calculate overall score
  const totalCorrect = performances.filter((p) => p.isCorrect).length;
  const totalScorePercentage =
    performances.length > 0 ? Math.round((totalCorrect / performances.length) * 100) : 0;

  // AI Guidance Note
  const strongTags = items.filter((i) => i.assessment === "mastered").map((i) => i.topic_label);
  const weakTags = items.filter((i) => i.assessment === "blind_spot").map((i) => i.topic_label);

  let aiGuidance = "";
  if (weakTags.length > 0) {
    aiGuidance = `💡 توجيه الـ AI بالبلدي: "أنت ممتاز في (${strongTags.join("، ") || "المستويات الأولى"})، لكن عندك لخبطة في (${weakTags.join("، ")}). تم تحويل الأسئلة التي تعثرت فيها تلقائياً لنظام الفلاش كاردز لتكون في جدول مراجعتك بكره لتثبيتها!"`;
  } else if (items.some((i) => i.assessment === "slow")) {
    aiGuidance = `💡 توجيه الـ AI بالبلدي: "أداؤك ممتاز واستيعابك قوي جداً! يحتاج عقلك فقط لرفع سرعة الاسترجاع التلقائية في التكرار المتباعد لتصبح الاستجابة فورية بدون تردد."`;
  } else {
    aiGuidance = `💡 توجيه الـ AI بالبلدي: "ما شاء الله! إتقان تام وتلقائية فائقة في كافة المواضيع بالامتحان. استمر بنفس هذا الشغف والتميز!"`;
  }

  // Automatically add weak missed questions into Spaced Repetition Flashcards queue!
  if (weakQuestions.length > 0) {
    exportWeakQuestionsToFlashcards(weakQuestions);
  }

  return {
    items,
    totalScorePercentage,
    aiGuidance,
    weakQuestions,
  };
}

/**
 * Automatically converts missed exam questions into Spaced Repetition Flashcards!
 */
export function exportWeakQuestionsToFlashcards(questions: ExamQuestion[]) {
  const currentFlashcards = getStoredSmartCards();
  const newFlashcards: SmartFlashcard[] = [];

  questions.forEach((q) => {
    const fcId = `fc_exam_weak_${q.id}`;
    if (!currentFlashcards.some((fc) => fc.id === fcId)) {
      const cat = autoCategory(q.question);
      newFlashcards.push({
        id: fcId,
        category: cat,
        question: q.question,
        model_answer: q.model_answer,
        keywords: q.keywords || [q.model_answer],
        hint: {
          mnemonic: q.hint || `تذكر مفاهيم ${q.topic_label}`,
          keyword_cues: q.keywords
            ? q.keywords.map((k) => `${k.slice(0, 1)}ـ...`).join(" / ")
            : undefined,
        },
        explanation_baladi:
          q.explanation_baladi ||
          `تحويل تلقائي من الامتحان لترسيخ موضوع (${q.topic_label}) بعد التعثر فيه.`,
        stats: {
          interval: 1,
          repetition: 0,
          easeFactor: 2.5,
          nextReviewDate: Date.now(),
          is_blind_spot: true,
        },
      });
    }
  });

  if (newFlashcards.length > 0) {
    saveStoredSmartCards([...newFlashcards, ...currentFlashcards]);
  }
}

/**
 * AI / Custom Text Ingestion: Parses raw pasted text into structured ExamQuestions!
 */
export function parseRawTextToExamQuestions(rawText: string): ExamQuestion[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const questions: ExamQuestion[] = [];
  let curQ: Partial<ExamQuestion> | null = null;

  lines.forEach((line) => {
    // Check if line starts with question number e.g. 1. or س1 or - or ؟
    const isNewQuestion =
      /^(?:س?\d+[\.\-\)]|س\/|\d+[\.\-\)]|علل|ما حكم|ما المقصود|اختر|أكمل)/i.test(line) ||
      line.includes("؟");

    if (isNewQuestion && curQ && curQ.question && curQ.model_answer) {
      questions.push(finalizeQuestion(curQ, questions.length + 1));
      curQ = null;
    }

    if (!curQ) {
      // Determine question type & topic tag
      let qType: ExamQuestionType = "essay";
      if (line.includes("اختر") || line.includes("أماكن") || line.includes("إجابة")) qType = "mcq";
      else if (line.includes("أكمل") || line.includes("الفراغ") || line.includes("____"))
        qType = "fill";
      else if (line.includes("علل") || line.includes("حكم") || line.includes("دليل"))
        qType = "essay";

      const tagMatch = extractTopicTag(line);

      curQ = {
        question: line,
        type: qType,
        topic_tag: tagMatch.tag,
        topic_label: tagMatch.label,
        options: [],
        keywords: [],
      };
    } else if (
      line.startsWith("أ)") ||
      line.startsWith("ب)") ||
      line.startsWith("ج)") ||
      line.startsWith("1-") ||
      line.startsWith("2-")
    ) {
      // Option line for MCQ
      if (!curQ.options) curQ.options = [];
      curQ.options.push(line.replace(/^[أبجد1234][\.\-\)]\s*/, ""));
      curQ.type = "mcq";
    } else if (line.startsWith("الإجابة:") || line.startsWith("ج:") || line.startsWith("الجواب:")) {
      curQ.model_answer = line.replace(/^(?:الإجابة|ج|الجواب):\s*/, "");
    } else if (!curQ.model_answer) {
      curQ.model_answer = line;
    }
  });

  const lastQ = curQ as Partial<ExamQuestion> | null;
  if (lastQ?.question && lastQ.model_answer) {
    questions.push(finalizeQuestion(lastQ, questions.length + 1));
  }

  return questions;
}

function finalizeQuestion(raw: Partial<ExamQuestion>, index: number): ExamQuestion {
  const qText = raw.question || `سؤال ${index}`;
  const ansText = raw.model_answer || "إجابة نموذجية";
  const type: ExamQuestionType =
    raw.type || (qText.includes("علل") ? "essay" : qText.includes("أكمل") ? "fill" : "mcq");

  const keywords = extractKeywordsFromText(ansText);
  const tagMatch = extractTopicTag(qText);

  return {
    id: `ingest_q_${Date.now()}_${index}_${crypto.randomUUID().slice(0, 8)}`,
    type,
    question: qText,
    options:
      raw.options && raw.options.length > 0
        ? raw.options
        : type === "mcq"
          ? [ansText, "خيار خاطئ 1", "خيار خاطئ 2"]
          : undefined,
    model_answer: ansText,
    keywords: keywords.length > 0 ? keywords : [ansText],
    topic_tag: tagMatch.tag,
    topic_label: tagMatch.label,
    explanation_baladi: `تفكيك السؤال والعلة الشرعية في موضوع (${tagMatch.label}).`,
  };
}

function extractTopicTag(text: string): { tag: string; label: string } {
  const t = text.toLowerCase();
  if (t.includes("سكران") || t.includes("سكر"))
    return { tag: "#طلاق_السكران", label: "طلاق السكران" };
  if (t.includes("حيض") || t.includes("بدعي"))
    return { tag: "#أحكام_الطلاق_البدعي", label: "الطلاق البدعي والحيض" };
  if (t.includes("شرط") || t.includes("شروط") || t.includes("أركان"))
    return { tag: "#شروط_الطلاق", label: "شروط الطلاق وأركانه" };
  if (t.includes("خلع") || t.includes("عوض"))
    return { tag: "#أحكام_الخلع", label: "أحكام الخلع والعوض" };
  if (t.includes("بناء ضوئي") || t.includes("نبات"))
    return { tag: "#البناء_الضوئي", label: "عملية البناء الضوئي" };
  return { tag: "#مفاهيم_عامة", label: "مفاهيم وقواعد عامة" };
}

function extractKeywordsFromText(text: string): string[] {
  if (!text) return [];
  const words = text
    .split(/\s+/)
    .map((w) => w.replace(/[^\w\u0600-\u06FF]/g, "").trim())
    .filter((w) => w.length >= 4);

  return Array.from(new Set(words)).slice(0, 3);
}

export function getInitialQuestionBank(): ExamQuestion[] {
  return [
    {
      id: "ex_q_1",
      type: "mcq",
      question: "ما الحكم الفقهي لو طلق الزوج زوجته في فترة الحيض من حيث وقوع الطلاق؟",
      options: [
        "لا يقع الطلاق إطلاقاً",
        "يقع الطلاق حارماً مع الإثم (بدعي) 🟢",
        "يقع الخلع رجعياً",
      ],
      model_answer: "يقع الطلاق حارماً مع الإثم (بدعي) 🟢",
      keywords: ["يقع الطلاق", "بدعي", "الإثم"],
      topic_tag: "#أحكام_الطلاق_البدعي",
      topic_label: "أحكام الطلاق البدعي والحيض",
      explanation_baladi:
        "الطلاق في الحيض حرام شرعاً (بدعي) لتضرر الزوجة بطول العدة، ولكنه يقع قضاءً مع إثم الزوج.",
    },
    {
      id: "ex_q_2",
      type: "essay",
      question: "علل: طلاق السكران المتعدي بسكره يقع قضاءً في الفقه الشافعي؟",
      model_answer: "يقع طلاقه تغليظاً عليه عقوبة له على معصية الشرب وتعمده سلب عقله.",
      keywords: ["تغليظاً عليه", "عقوبة", "معصية"],
      topic_tag: "#طلاق_السكران",
      topic_label: "طلاق السكران",
      explanation_baladi:
        "السكران اللي شرب بمزاجه، الشرع يعاقبه بزجره وإيقاع طلاقه حتى لا يتخذ السكر ذريعة للتنصل من الأحكام.",
    },
    {
      id: "ex_q_3",
      type: "fill",
      question:
        "المهر الذي تستحقه المرأة المقارنة لأقاربها من النساء عند جهالة عوض الخلع يسمى ____",
      model_answer: "مهر المثل",
      keywords: ["مهر المثل"],
      topic_tag: "#أحكام_الخلع",
      topic_label: "أحكام الخلع والعوض",
      explanation_baladi:
        "لما العوض يكون مجهول، نرجع لمهر البنت اللي زيها في عيلتها لقطع النزاع والجهالة.",
    },
    {
      id: "ex_q_4",
      type: "mcq",
      question: "ما هو شرط صحة الملتزم بدفع العوض في الخلع من الناحية المالية؟",
      options: [
        "إطلاق التصرف المالي (البلوغ والعقل والرشيد) 🟢",
        "أن يكون الزوج ولياً",
        "أن يكون في فترة العدة",
      ],
      model_answer: "إطلاق التصرف المالي (البلوغ والعقل والرشيد) 🟢",
      keywords: ["إطلاق التصرف", "البلوغ", "الرشيد"],
      topic_tag: "#شروط_الطلاق",
      topic_label: "شروط الطلاق وأركانه",
      explanation_baladi: "اللي هيدفع الفلوس لازم يكون حر التصرف في ماله مش محجور عليه ولا سفيه.",
    },
    {
      id: "ex_q_5",
      type: "essay",
      question:
        "ما الحكم الشرعي مع الدليل لو قال الزوج لخالعته: 'خالعتك على ما في كفك' ففتحت يدها وكان فارغاً؟",
      model_answer:
        "يقع الخلع بائناً وتلزم بمهر المثل، لقوله تعالى: ﴿فَلَا جُنَاحَ عَلَيْهِمَا فِيمَا افْتَدَتْ بِهِ﴾.",
      keywords: ["ما في كفك", "فارغاً", "عوض"],
      topic_tag: "#أحكام_الخلع",
      topic_label: "أحكام الخلع والعوض",
      explanation_baladi:
        "لأنها رضيت بالفراق والخلع بائن، لكن لما طلع العوض معدوم نرجع لمهر المثل.",
    },
  ];
}

export interface ExamMistake {
  id: string;
  question: ExamQuestion;
  userAnswer: string;
  date: string;
}

export interface LessonNote {
  id: string;
  lessonTitle: string;
  content: string;
  date: string;
}

const MISTAKES_KEY = "nafath.exam_mistakes_v1";
const NOTES_KEY = "nafath.lesson_notes_v1";

export function getStoredMistakes(): ExamMistake[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MISTAKES_KEY);
    if (raw === null) {
      saveStoredMistakes([]);
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredMistakes(mistakes: ExamMistake[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MISTAKES_KEY, JSON.stringify(mistakes));
}

export function removeMistake(id: string) {
  const updated = getStoredMistakes().filter((m) => m.id !== id);
  saveStoredMistakes(updated);
}

export function getStoredLessonNotes(): LessonNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (raw === null) {
      saveStoredLessonNotes([]);
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredLessonNotes(notes: LessonNote[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function addLessonNote(lessonTitle: string, content: string): LessonNote {
  const notes = getStoredLessonNotes();
  const newNote: LessonNote = {
    id: `note_${Date.now()}`,
    lessonTitle: lessonTitle.trim() || "ملاحظة عامة",
    content: content.trim(),
    date: new Date().toLocaleDateString("ar-SA"),
  };
  const updated = [newNote, ...notes];
  saveStoredLessonNotes(updated);
  return newNote;
}

export function deleteLessonNote(id: string) {
  const updated = getStoredLessonNotes().filter((n) => n.id !== id);
  saveStoredLessonNotes(updated);
}

function getInitialMistakes(): ExamMistake[] {
  return [];
}

function getInitialLessonNotes(): LessonNote[] {
  return [];
}
