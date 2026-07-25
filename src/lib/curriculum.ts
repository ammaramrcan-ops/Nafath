import { type Stage } from "@/lib/settings";

const KEY = "nafath.curriculum.v1";

// Helper function to generate a slug from Arabic name
function generateSlug(name: string): string {
  // Simple transliteration mapping
  const arabicToEnglish: Record<string, string> = {
    'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa',
    'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
    'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh',
    'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
    'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
    'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
    'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'ه': 'h', 'و': 'w', 'ي': 'y', 'ة': 'a',
    ' ': '-', 'ى': 'a', 'ئ': 'i', 'ؤ': 'u'
  };
  
  let slug = name.trim();
  slug = slug.replace(/[^\w\s\u0600-\u06FF]/g, ''); // Remove special chars except Arabic
  
  // Transliterate
  let result = '';
  for (const char of slug) {
    result += arabicToEnglish[char] || char;
  }
  
  // Clean up
  result = result.toLowerCase();
  result = result.replace(/[^a-z0-9-]/g, '-');
  result = result.replace(/-+/g, '-');
  result = result.replace(/^-|-$/g, '');
  
  return result || 'subject';
}

const DEFAULT_STAGE_ORDERS = {
  1: ["story", "baladi_terms", "paper_summary", "mindmap", "quizzes_mcq"] as Stage[],
  2: ["examples", "original", "mental", "mindmap", "quizzes_fill", "quizzes_essay", "flashcards", "zaitouna"] as Stage[],
  3: ["original", "mental", "funny", "mindmap", "quizzes_essay", "zaitouna"] as Stage[],
};

const DEFAULT_CUSTOM_PROMPTS = {
  explanation: `أنت خبير في التصميم التعليمي لمنصة "نفاذ - Nafath".
قم بتحويل النص/الموضوع أدناه إلى كود JSON مخصص لـ (الشرح والقصص والمصطلحات) فقط، وفق الهيكل الآتي:
{
  "title": "عنوان الدرس الرئيسي",
  "blocks": [
    {
      "id": 1,
      "title": "عنوان الفقرة الأولى",
      "short_sentence": "الفكرة الرئيسية المختصرة جداً",
      "story": "قصة تشبيهية عامية طريفة بالبلدي تشرح المفهوم بأسلوب دايركت وممتع.",
      "examples": "مثال تطبيقي من الحياة اليومية.",
      "full_text": "النص العلمي الكامل والمشروح بدقة.",
      "hard_words": [
        { "term": "المصطلح", "definition": "التفسير والشرح بالبلدي بين قوسين" }
      ],
      "mnemonic": "جملة تذكّر ذكية ومختصرة لبناء رابط ذهني.",
      "funny_link": "ربط طريف وفكاهي لترسيخ المعلومة في الذاكرة."
    }
  ]
}

أخرج النتيجة في مربع كود JSON الصافي فقط وبدون أي مقدمات.

---
[الصق نص أو موضوع الدرس المطلوب تحويله هنا]`,
  mindmap: `أنت خبير رسم الخرائط الذهنية لمنصة "نفاذ - Nafath".
بناءً على موضوع الدرس أو الفقرات أدناه، قم بتوليد كود JSON لخريطة ذهنية شجرية تفصيلية مخصصة لكل فقرة على حدة (Root -> Categories -> Subtopics -> Details)، وفق الهيكل الآتي:
{
  "mind_maps_by_block": [
    {
      "block_id": 1,
      "block_title": "عنوان الفقرة الأولى",
      "mind_map_nodes": [
        { "id": "b1_root", "text": "العنوان الرئيسي للفقرة الأولى", "parentId": null },
        { "id": "b1_n1", "text": "1. الفرع الرئيسي الأول للفقرة 1", "parentId": "b1_root" },
        { "id": "b1_n1_1", "text": "تفصيل فرعي 1.1", "parentId": "b1_n1" },
        { "id": "b1_n1_2", "text": "تفصيل فرعي 1.2 أو شاهد/دليل", "parentId": "b1_n1" },
        { "id": "b1_n2", "text": "2. الفرع الرئيسي الثاني للفقرة 1", "parentId": "b1_root" },
        { "id": "b1_n2_1", "text": "تفصيل فرعي 2.1", "parentId": "b1_n2" }
      ]
    }
  ]
}

أخرج النتيجة في مربع كود JSON الصافي فقط وبدون أي مقدمات.

---
[الصق نص أو موضوع الدرس المطلوب تحويله هنا]`,
  mcq: `أنت خبير إعداد الاختبارات لمنصة "نفاذ - Nafath".
بناءً على فقرات الدرس أدناه، صغ كود JSON لأسئلة الاختبارات والـ MCQs، بشرط صارم: كل فقرة (Block) تحتوي على 5 أسئلة اختيار من متعدد (MCQ) حصرية ومطابقة 100% لنص وقصة هذه الفقرة فقط دون أي سؤال عن فقرات أخرى!

الهيكل المطلوب:
{
  "quizzes_by_block": [
    {
      "block_id": 1,
      "block_title": "عنوان الفقرة الأولى",
      "mcqs": [
        {
          "question": "السؤال الأول",
          "options": ["خيار أ", "خيار ب", "خيار ج", "خيار د"],
          "correct_answer": "خيار أ",
          "explanation": "شرح الإجابة الصحيحة"
        }
      ]
    }
  ]
}

أخرج النتيجة في مربع كود JSON الصافي فقط وبدون أي مقدمات.

---
[الصق نص أو موضوع الدرس المطلوب تحويله هنا]`
};

const DEFAULT_DISABLED_STAGES = {
  1: [] as Stage[],
  2: [] as Stage[],
  3: [] as Stage[],
};

export type Unit = {
  id: string;
  name: string;
  createdAt: string;
  lessonIds: string[]; // ids referencing SavedLesson.id
};

export type Subject = {
  id: string;
  name: string;
  category?: "شرعية" | "علمية" | "عربية";
  description?: string;
  emoji?: string;
  teacherUrl?: string; // URL to teacher page for this subject
  levelStageOrders: {
    1: Stage[];
    2: Stage[];
    3: Stage[];
  };
  levelDisabledStages: {
    1: Stage[];
    2: Stage[];
    3: Stage[];
  };
  customPrompts: {
    explanation: string;
    mindmap: string;
    mcq: string;
  };
  createdAt: string;
  units: Unit[];
};

export type Curriculum = {
  subjects: Subject[];
};

function read(): Curriculum {
  if (typeof window === "undefined") return { subjects: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { subjects: [] };
    const parsed = JSON.parse(raw) as Curriculum;
    return { subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [] };
  } catch {
    return { subjects: [] };
  }
}

function write(c: Curriculum) {
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* ignore */
  }
}

export function seedDefaultSubjects(): Curriculum {
  const c = read();
  if (c.subjects.length > 0) return c;

  const defaults: Subject[] = [
    {
      id: "sub-fiqh",
      name: "الفقه",
      category: "شرعية",
      description: "دراسة الأحكام الشرعية العملية المستنبطة من أدلتها التفصيلية.",
      teacherUrl: "/teacher?subject=fiqh",
      levelStageOrders: DEFAULT_STAGE_ORDERS,
      levelDisabledStages: DEFAULT_DISABLED_STAGES,
      customPrompts: DEFAULT_CUSTOM_PROMPTS,
      createdAt: new Date().toISOString(),
      units: [
        { id: "u-fiqh-1", name: "أحكام العبادات والمعاملات", createdAt: new Date().toISOString(), lessonIds: [] }
      ],
    },
    {
      id: "sub-tawheed",
      name: "التوحيد",
      category: "شرعية",
      description: "إفراد الله عز وجل بما يختص به من الربوبية والألوهية والأسماء والصفات.",
      teacherUrl: "/teacher?subject=tawheed",
      levelStageOrders: DEFAULT_STAGE_ORDERS,
      levelDisabledStages: DEFAULT_DISABLED_STAGES,
      customPrompts: DEFAULT_CUSTOM_PROMPTS,
      createdAt: new Date().toISOString(),
      units: [
        { id: "u-tawheed-1", name: "أقسام التوحيد والإيمان", createdAt: new Date().toISOString(), lessonIds: [] }
      ],
    },
    {
      id: "sub-hadith",
      name: "الحديث",
      category: "شرعية",
      description: "ما أُثر عن النبي ﷺ من قول أو فعل أو تقرير أو صفة.",
      teacherUrl: "/teacher?subject=hadith",
      levelStageOrders: DEFAULT_STAGE_ORDERS,
      levelDisabledStages: DEFAULT_DISABLED_STAGES,
      customPrompts: DEFAULT_CUSTOM_PROMPTS,
      createdAt: new Date().toISOString(),
      units: [],
    },
    {
      id: "sub-tafsir",
      name: "التفسير",
      category: "شرعية",
      description: "بيان معاني القرآن الكريم واستخراج أحكامه وحكمه.",
      teacherUrl: "/teacher?subject=tafsir",
      levelStageOrders: DEFAULT_STAGE_ORDERS,
      levelDisabledStages: DEFAULT_DISABLED_STAGES,
      customPrompts: DEFAULT_CUSTOM_PROMPTS,
      createdAt: new Date().toISOString(),
      units: [],
    },
    {
      id: "sub-biology",
      name: "الأحياء",
      category: "علمية",
      description: "علم دراسة الكائنات الحية وتفاعلها مع البيئة المحيطة.",
      teacherUrl: "/teacher?subject=biology",
      levelStageOrders: DEFAULT_STAGE_ORDERS,
      levelDisabledStages: DEFAULT_DISABLED_STAGES,
      customPrompts: DEFAULT_CUSTOM_PROMPTS,
      createdAt: new Date().toISOString(),
      units: [],
    },
    {
      id: "sub-physics",
      name: "الفيزياء",
      category: "علمية",
      description: "فهم قوانين المادة والطاقة والحركة في الكون.",
      teacherUrl: "/teacher?subject=physics",
      levelStageOrders: DEFAULT_STAGE_ORDERS,
      levelDisabledStages: DEFAULT_DISABLED_STAGES,
      customPrompts: DEFAULT_CUSTOM_PROMPTS,
      createdAt: new Date().toISOString(),
      units: [],
    },
    {
      id: "sub-chemistry",
      name: "الكيمياء",
      category: "علمية",
      description: "دراسة تكوين المادة وخصائصها والتغيرات التي تطرأ عليها.",
      teacherUrl: "/teacher?subject=chemistry",
      levelStageOrders: DEFAULT_STAGE_ORDERS,
      levelDisabledStages: DEFAULT_DISABLED_STAGES,
      customPrompts: DEFAULT_CUSTOM_PROMPTS,
      createdAt: new Date().toISOString(),
      units: [],
    },
    {
      id: "sub-grammar",
      name: "النحو",
      category: "عربية",
      description: "علم يبحث في أحكام أواخر الكلمات العربية حال تركيبها.",
      teacherUrl: "/teacher?subject=grammar",
      levelStageOrders: DEFAULT_STAGE_ORDERS,
      levelDisabledStages: DEFAULT_DISABLED_STAGES,
      customPrompts: DEFAULT_CUSTOM_PROMPTS,
      createdAt: new Date().toISOString(),
      units: [],
    },
    {
      id: "sub-literature",
      name: "الأدب",
      category: "عربية",
      description: "استكشاف روائع النثر والشعر العربي عبر العصور المختلفة.",
      teacherUrl: "/teacher?subject=literature",
      levelStageOrders: DEFAULT_STAGE_ORDERS,
      levelDisabledStages: DEFAULT_DISABLED_STAGES,
      customPrompts: DEFAULT_CUSTOM_PROMPTS,
      createdAt: new Date().toISOString(),
      units: [],
    },
  ];

  c.subjects = defaults;
  write(c);
  return c;
}

export function getCurriculum(): Curriculum {
  const c = read();
  if (c.subjects.length === 0) {
    return seedDefaultSubjects();
  }
  return c;
}

export function getSubject(subjectId: string): Subject | undefined {
  return getCurriculum().subjects.find((s) => s.id === subjectId);
}

export function getUnit(subjectId: string, unitId: string): Unit | undefined {
  return getSubject(subjectId)?.units.find((u) => u.id === unitId);
}

export function addSubject(name: string, category?: "شرعية" | "علمية" | "عربية", description?: string, emoji?: string, teacherUrl?: string): Subject {
  const c = getCurriculum();
  const slug = generateSlug(name);
  const autoTeacherUrl = `/teacher?subject=${slug}`;
  
  const subject: Subject = {
    id: `sub-${Date.now()}`,
    name: name.trim() || "مادة جديدة",
    category: category || "شرعية",
    description: description || "دراسة ومراجعة مفاهيم المادة.",
    emoji,
    teacherUrl: teacherUrl || autoTeacherUrl,
    levelStageOrders: DEFAULT_STAGE_ORDERS,
    levelDisabledStages: DEFAULT_DISABLED_STAGES,
    customPrompts: DEFAULT_CUSTOM_PROMPTS,
    createdAt: new Date().toISOString(),
    units: [],
  };
  c.subjects.unshift(subject);
  write(c);
  return subject;
}

export function deleteSubject(subjectId: string) {
  const c = read();
  c.subjects = c.subjects.filter((s) => s.id !== subjectId);
  write(c);
}

export function updateSubjectStages(id: string, level: 1 | 2 | 3, stages: Stage[]): boolean {
  const c = read();
  const subject = c.subjects.find((s) => s.id === id);
  if (!subject) return false;
  
  subject.levelStageOrders[level] = stages;
  write(c);
  return true;
}

export function updateSubjectDisabledStages(id: string, level: 1 | 2 | 3, disabledStages: Stage[]): boolean {
  const c = read();
  const subject = c.subjects.find((s) => s.id === id);
  if (!subject) return false;
  
  subject.levelDisabledStages[level] = disabledStages;
  write(c);
  return true;
}

export function updateSubjectPrompts(id: string, prompts: { explanation: string; mindmap: string; mcq: string }): boolean {
  const c = read();
  const subject = c.subjects.find((s) => s.id === id);
  if (!subject) return false;
  
  subject.customPrompts = prompts;
  write(c);
  return true;
}

export function renameSubject(subjectId: string, name: string) {
  const c = read();
  const s = c.subjects.find((s) => s.id === subjectId);
  if (s) {
    s.name = name.trim() || s.name;
    write(c);
  }
}

export function addUnit(subjectId: string, name: string): Unit | null {
  const c = read();
  const s = c.subjects.find((s) => s.id === subjectId);
  if (!s) return null;
  const unit: Unit = {
    id: `unit-${Date.now()}`,
    name: name.trim() || "وحدة جديدة",
    createdAt: new Date().toISOString(),
    lessonIds: [],
  };
  s.units.unshift(unit);
  write(c);
  return unit;
}

export function deleteUnit(subjectId: string, unitId: string) {
  const c = read();
  const s = c.subjects.find((s) => s.id === subjectId);
  if (!s) return;
  s.units = s.units.filter((u) => u.id !== unitId);
  write(c);
}

export function renameUnit(subjectId: string, unitId: string, name: string) {
  const c = read();
  const u = c.subjects.find((s) => s.id === subjectId)?.units.find((u) => u.id === unitId);
  if (u) {
    u.name = name.trim() || u.name;
    write(c);
  }
}

export function addLessonToUnit(subjectId: string, unitId: string, lessonId: string) {
  const c = read();
  const u = c.subjects.find((s) => s.id === subjectId)?.units.find((u) => u.id === unitId);
  if (u && !u.lessonIds.includes(lessonId)) {
    u.lessonIds.push(lessonId);
    write(c);
  }
}

export function removeLessonFromUnit(subjectId: string, unitId: string, lessonId: string) {
  const c = read();
  const u = c.subjects.find((s) => s.id === subjectId)?.units.find((u) => u.id === unitId);
  if (u) {
    u.lessonIds = u.lessonIds.filter((id) => id !== lessonId);
    write(c);
  }
}

/** Returns set of all lesson ids that belong to some unit. */
export function getAssignedLessonIds(): Set<string> {
  const ids = new Set<string>();
  for (const s of read().subjects) {
    for (const u of s.units) {
      for (const id of u.lessonIds) ids.add(id);
    }
  }
  return ids;
}
