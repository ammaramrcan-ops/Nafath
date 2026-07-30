import { autoCategory, type FlashcardCategory, type SmartFlashcard } from "./spaced-repetition";
import { generateSecureId } from "@/lib/utils";

/**
 * Parses CSV file text into SmartFlashcard objects.
 * CSV Format Schema:
 * Header: Category,Question,ModelAnswer,Keywords,Mnemonic,KeywordCues
 */
function buildSmartCardFromCSVRow(row: string[]): SmartFlashcard | null {
  if (row.length < 2) return null;

  let categoryRaw = "";
  let question = "";
  let modelAnswer = "";
  let keywordsRaw = "";
  let mnemonic = "";
  let keywordCues = "";

  if (row.length >= 6) {
    categoryRaw = row[0];
    question = row[1];
    modelAnswer = row[2];
    keywordsRaw = row[3];
    mnemonic = row[4];
    keywordCues = row[5];
  } else if (row.length === 5) {
    categoryRaw = row[0];
    question = row[1];
    modelAnswer = row[2];
    keywordsRaw = row[3];
    mnemonic = row[4];
  } else if (row.length === 4) {
    categoryRaw = row[0];
    question = row[1];
    modelAnswer = row[2];
    keywordsRaw = row[3];
  } else if (row.length === 3) {
    categoryRaw = row[0];
    question = row[1];
    modelAnswer = row[2];
  } else {
    question = row[0];
    modelAnswer = row[1];
  }

  if (!question || !modelAnswer) return null;

  const category = sanitizeCategory(categoryRaw, question);
  const keywords = keywordsRaw
    ? keywordsRaw
        .split(/[|،,]/)
        .map((k) => k.trim())
        .filter(Boolean)
    : autoExtractKeywords(modelAnswer);

  const cues = keywordCues ? keywordCues.replace(/\|/g, " / ") : generateKeywordCues(keywords);

  return {
    id: generateSecureId("csv"),
    category,
    question,
    model_answer: modelAnswer,
    keywords,
    hint: {
      mnemonic: mnemonic || undefined,
      keyword_cues: cues || undefined,
    },
    stats: {
      interval_days: 0,
      ease_factor: 2.5,
      repetitions: 0,
      due_timestamp: Date.now(),
      consecutive_correct: 0,
      total_reviews: 0,
      total_correct: 0,
      last_confidence_score: 0,
    },
  };
}

export function parseCSVToSmartCards(csvText: string): SmartFlashcard[] {
  if (!csvText || !csvText.trim()) return [];

  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const cards: SmartFlashcard[] = [];

  // Check if first line is header
  let startIdx = 0;
  const firstLineNorm = lines[0].toLowerCase();
  if (
    firstLineNorm.includes("category") ||
    firstLineNorm.includes("question") ||
    firstLineNorm.includes("modelanswer")
  ) {
    startIdx = 1;
  }

  for (let i = startIdx; i < lines.length; i++) {
    const card = buildSmartCardFromCSVRow(parseCSVRow(lines[i]));
    if (card) {
      cards.push(card);
    }
  }

  return cards;
}

/**
 * Robust CSV Line Parser supporting quotes and commas inside fields.
 */
function parseCSVRow(text: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += char;
    }
  }

  result.push(cur.trim());
  return result;
}

function sanitizeCategory(raw: string, question: string): FlashcardCategory {
  const r = (raw || "").trim().toLowerCase();
  if (r === "reasoning" || r === " علل" || r.includes("علل") || r.includes("سبب"))
    return "reasoning";
  if (r === "rulings" || r.includes("حكم") || r.includes("أحكام")) return "rulings";
  if (r === "evidence" || r.includes("دليل") || r.includes("نص")) return "evidence";
  if (r === "definition" || r.includes("تعريف") || r.includes("مصطلح")) return "definition";
  if (r === "issue" || r.includes("مسألة") || r.includes("فتوى")) return "issue";
  if (r === "summary" || r.includes("خلاصة") || r.includes("زيتونة")) return "summary";

  return autoCategory(question);
}

function autoExtractKeywords(answer: string): string[] {
  if (!answer) return [];
  const words = answer
    .split(/\s+/)
    .map((w) => w.replace(/[^\w\u0600-\u06FF]/g, "").trim())
    .filter((w) => w.length >= 4);

  // Take top 3 unique words
  return Array.from(new Set(words)).slice(0, 3);
}

export function generateKeywordCues(keywords: string[]): string {
  if (!keywords || keywords.length === 0) return "";
  return keywords
    .map((kw) => {
      const clean = kw.trim();
      if (!clean) return "";
      return `${clean.slice(0, 1)}ـ...`;
    })
    .filter(Boolean)
    .join(" / ");
}

/**
 * Exports SmartFlashcard array into standard CSV string.
 */
export function exportCardsToCSV(cards: SmartFlashcard[]): string {
  const header = "Category,Question,ModelAnswer,Keywords,Mnemonic,KeywordCues";
  const rows = cards.map((c) => {
    const cat = c.category;
    const q = escapeCSV(c.question);
    const ans = escapeCSV(c.model_answer);
    const kw = escapeCSV(c.keywords ? c.keywords.join("|") : "");
    const mn = escapeCSV(c.hint?.mnemonic || "");
    const cues = escapeCSV(
      c.hint?.keyword_cues ? c.hint.keyword_cues.replace(/\s*\/\s*/g, "|") : "",
    );

    return `${cat},${q},${ans},${kw},${mn},${cues}`;
  });

  return [header, ...rows].join("\n");
}

function escapeCSV(str: string): string {
  if (!str) return "";
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Helper to download CSV file in browser.
 */
export function downloadCSVFile(csvContent: string, filename = "nafath_flashcards.csv") {
  if (typeof window === "undefined") return;
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
