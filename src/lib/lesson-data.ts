import { DEFAULT_STAGE_ORDER, type Stage } from "@/lib/settings";
import { getCurriculum, getSubject } from "@/lib/curriculum";

export type HighlightColor = "yellow" | "green" | "blue" | "pink" | "purple";

export type TextHighlight = {
  id?: string;
  text: string;
  color: HighlightColor;
  fontSize?: "normal" | "large" | "xlarge";
  startOffset?: number;
  endOffset?: number;
};

export type HardWord = {
  term?: string;
  word?: string;
  meaning?: string;
  definition?: string;
  explanation?: string;
  type?: string;
};

export type QuizImage = { image_url?: string; tags?: string[] };
export type MCQ = {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard";
  estimated_time?: number;
  tags?: string[];
} & QuizImage;
export type Fill = {
  question: string;
  answer: string;
  difficulty?: "easy" | "medium" | "hard";
  estimated_time?: number;
  tags?: string[];
} & QuizImage;
export type Essay = {
  question: string;
  keywords: string[];
  hint?: string;
  explanation?: string;
  sampleAnswer?: string;
  difficulty?: "easy" | "medium" | "hard";
  estimated_time?: number;
  tags?: string[];
} & QuizImage;

export type Quizzes = {
  mcqs: MCQ[];
  fills: Fill[];
  essays: Essay[];
};

export type Zaitouna = {
  definitions: string;
  reasoning: string;
  links: string;
};

export type BlockMetaCard = {
  understanding_level?: "سهل" | "متوسط" | "صعب";
  memorization_level?: "سهل" | "متوسط" | "صعب";
  estimated_time_range?: string;
  info_count?: number;
};

export type ParagraphBlock = {
  id: number;
  title: string;
  short_sentence: string;
  story: string;
  examples: string;
  full_text: string;
  hard_words: HardWord[];
  highlights?: TextHighlight[];
  mnemonic: string;
  funny_link: string;
  mind_map_nodes: Array<string | Record<string, unknown>>;
  meta_card?: BlockMetaCard;
  visual_url?: string;
  stage_visuals?: Partial<
    Record<Stage | "quizzes" | "quizzes_mcq" | "quizzes_fill" | "quizzes_essay", string>
  >;
  stage_audio?: Partial<Record<Stage, string>>;
  enabled_stages?: Stage[];
  stage_order?: Stage[];
  quizzes: Quizzes;
  quiz_enabled?: boolean;
  quiz_mcq_enabled?: boolean;
  quiz_fill_enabled?: boolean;
  quiz_essay_enabled?: boolean;
  enable_break?: boolean;
  break_duration?: number;
  stage_interval?: number;
  stage_intervals?: Partial<Record<Stage, number>>;
  enable_stage_intervals?: Partial<Record<Stage, boolean>>;
  zaitouna?: Zaitouna;
};

export type Lesson = {
  title: string;
  estimatedTime: string;
  size: string;
  topics: string[];
  notebookLmUrl?: string;
  master_story?: string;
  subjectId?: string;
  blocks: ParagraphBlock[];
  levelStageOrders?: {
    1: Stage[];
    2: Stage[];
    3: Stage[];
  };
  levelDisabledStages?: {
    1: Stage[];
    2: Stage[];
    3: Stage[];
  };
  enableBreaks?: boolean;
  breakDuration?: number;
};

function cleanRawTags(
  str: string,
  existingHighlights: TextHighlight[],
): { cleanText: string; highlights: TextHighlight[] } {
  if (!str) return { cleanText: "", highlights: existingHighlights };

  let currentHighlights = [...existingHighlights];
  const regex = /<(yellow|green|blue|pink|purple)>(.*?)<\/\1>/gi;
  let match;

  while ((match = regex.exec(str)) !== null) {
    const color = match[1].toLowerCase() as HighlightColor;
    const text = match[2].trim();
    if (text && !currentHighlights.some((h) => h.text === text && h.color === color)) {
      currentHighlights.push({ text, color });
    }
  }

  const cleanText = str.replace(/<\/?(?:yellow|green|blue|pink|purple|mark[^>]*)>/gi, "");
  return { cleanText, highlights: currentHighlights };
}

function padMcqsToFive(rawMcqs: MCQ[]): MCQ[] {
  if (rawMcqs.length >= 5) return rawMcqs;

  const padded = [...rawMcqs];
  const templates = [
    {
      question:
        "ماذا يحدث إذا خالعت الزوجة زوجها على 'سيارة' دون تحديد نوعها وموديلها (عوض مجهول)؟",
      options: [
        "لا يقع الخلع ويبطل العقد",
        "يقع الخلع بائناً وتلزم الزوجة بدفع (مهر المثل)",
        "يقع الخلع رجعياً وتدفع أي سيارة",
      ],
      answer: "يقع الخلع بائناً وتلزم الزوجة بدفع (مهر المثل)",
    },
    {
      question: "سؤال استيعابي فقهي (2): ما هي النتيجة العملية الأهم للفقرة المذكورة؟",
      options: [
        "التحديد الدقيق للمفاهيم والتطبيق الضابط",
        "العمل بدون علم أو دراية",
        "إلغاء القواعد الأساسية",
      ],
      answer: "التحديد الدقيق للمفاهيم والتطبيق الضابط",
    },
    {
      question: "سؤال استيعابي فقهي (3): ما هي النتيجة العملية الأهم للفقرة المذكورة؟",
      options: [
        "مراعاة الأحكام الضابطة وتيسير التعلم",
        "إطالة الشرح دون فائدة",
        "إحداث التشتت والتعقيد",
      ],
      answer: "مراعاة الأحكام الضابطة وتيسير التعلم",
    },
    {
      question: "سؤال استيعابي فقهي (4): ما هي النتيجة العملية الأهم للفقرة المذكورة؟",
      options: [
        "الفهم التفاعلي والربط الذهني الفعال",
        "الحفظ الصم بدون استيعاب",
        "ترك القراءة والتطبيق",
      ],
      answer: "الفهم التفاعلي والربط الذهني الفعال",
    },
    {
      question: "سؤال استيعابي فقهي (5): ما هي النتيجة العملية الأهم للفقرة المذكورة؟",
      options: [
        "الالتزام بالضوابط الشرعية والعملية الصحيحة",
        "تجاوز الأركان والشروط",
        "إهمال التقييم الذاتي",
      ],
      answer: "الالتزام بالضوابط الشرعية والعملية الصحيحة",
    },
  ];

  let idx = 0;
  while (padded.length < 5) {
    const template = templates[idx % templates.length];
    padded.push({
      question: template.question,
      options: template.options,
      answer: template.answer,
      difficulty: "easy",
      estimated_time: 30,
    });
    idx++;
  }

  return padded;
}

export function normalizeBlock(raw: unknown, idx: number): ParagraphBlock {
  const rawObj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const s = (rawObj.stages && typeof rawObj.stages === "object" ? rawObj.stages : {}) as Record<string, unknown>;

  let highlights: TextHighlight[] = Array.isArray(rawObj.highlights) ? (rawObj.highlights as TextHighlight[]) : [];

  let short_sentence = String(rawObj.short_sentence ?? rawObj.summary ?? "");
  let story = String(rawObj.story ?? "");
  let examples = String(rawObj.examples ?? "");
  let full_text = String(rawObj.full_text ?? "");
  let mnemonic = String(rawObj.mnemonic ?? "");
  let funny_link = String(rawObj.funny_link ?? "");

  const zaitounaObj = (rawObj.zaitouna && typeof rawObj.zaitouna === "object" ? rawObj.zaitouna : {}) as Record<string, unknown>;
  const zDefsRaw = zaitounaObj.definitions;
  let zaitounaDefs = Array.isArray(zDefsRaw)
    ? zDefsRaw.join("\n")
    : typeof zDefsRaw === "string"
      ? zDefsRaw
      : "";

  const zReasRaw = zaitounaObj.reasoning;
  let zaitounaReas = Array.isArray(zReasRaw)
    ? zReasRaw.join("\n")
    : typeof zReasRaw === "string"
      ? zReasRaw
      : "";

  const zLinksRaw = zaitounaObj.links;
  let zaitounaLinks = Array.isArray(zLinksRaw)
    ? zLinksRaw.join("\n")
    : typeof zLinksRaw === "string"
      ? zLinksRaw
      : "";

  const res1 = cleanRawTags(short_sentence, highlights);
  short_sentence = res1.cleanText;
  highlights = res1.highlights;
  const res2 = cleanRawTags(story, highlights);
  story = res2.cleanText;
  highlights = res2.highlights;
  const res3 = cleanRawTags(examples, highlights);
  examples = res3.cleanText;
  highlights = res3.highlights;
  const res4 = cleanRawTags(full_text, highlights);
  full_text = res4.cleanText;
  highlights = res4.highlights;
  const res5 = cleanRawTags(mnemonic, highlights);
  mnemonic = res5.cleanText;
  highlights = res5.highlights;
  const res6 = cleanRawTags(funny_link, highlights);
  funny_link = res6.cleanText;
  highlights = res6.highlights;
  const res7 = cleanRawTags(zaitounaDefs, highlights);
  zaitounaDefs = res7.cleanText;
  highlights = res7.highlights;
  const res8 = cleanRawTags(zaitounaReas, highlights);
  zaitounaReas = res8.cleanText;
  highlights = res8.highlights;
  const res9 = cleanRawTags(zaitounaLinks, highlights);
  zaitounaLinks = res9.cleanText;
  highlights = res9.highlights;

  const rawHardWords = Array.isArray(rawObj.hard_words) ? rawObj.hard_words : [];
  const hard_words = rawHardWords.map((hwItem: unknown) => {
    const hw = (hwItem && typeof hwItem === "object" ? hwItem : {}) as Record<string, unknown>;
    return {
      term: String(hw.term ?? hw.word ?? ""),
      definition: String(hw.definition ?? hw.explanation ?? hw.meaning ?? ""),
    };
  });

  const mmRaw = rawObj.mind_map_nodes;
  let mind_map_nodes: string[] = [];
  if (Array.isArray(mmRaw)) {
    mind_map_nodes = mmRaw.map((n: unknown) =>
      typeof n === "string" ? n : typeof n === "object" && n !== null ? String((n as Record<string, unknown>).text || (n as Record<string, unknown>).title || "") : ""
    );
  } else if (mmRaw && typeof mmRaw === "object") {
    const nodes = (mmRaw as Record<string, unknown>).nodes;
    if (Array.isArray(nodes)) {
      mind_map_nodes = nodes.map((n: unknown) =>
        typeof n === "string" ? n : typeof n === "object" && n !== null ? String((n as Record<string, unknown>).text || (n as Record<string, unknown>).title || "") : ""
      );
    }
  }

  const quizzesMcq = (s.quizzes_mcq && typeof s.quizzes_mcq === "object" ? s.quizzes_mcq : {}) as Record<string, unknown>;
  const quizzesFill = (s.quizzes_fill && typeof s.quizzes_fill === "object" ? s.quizzes_fill : {}) as Record<string, unknown>;
  const quizzesEssay = (s.quizzes_essay && typeof s.quizzes_essay === "object" ? s.quizzes_essay : {}) as Record<string, unknown>;
  const quizzesObj = (s.quizzes && typeof s.quizzes === "object" ? s.quizzes : {}) as Record<string, unknown>;
  const quizzesContent = (quizzesObj.content && typeof quizzesObj.content === "object" ? quizzesObj.content : {}) as Record<string, unknown>;
  const rawQuizzesObj = (rawObj.quizzes && typeof rawObj.quizzes === "object" ? rawObj.quizzes : {}) as Record<string, unknown>;

  const mcqSrc =
    quizzesMcq.content ?? quizzesContent.mcq ?? rawQuizzesObj.mcqs ?? rawQuizzesObj.mcq;
  const rawMcqs: MCQ[] = Array.isArray(mcqSrc)
    ? mcqSrc.map((mItem: unknown) => {
        const m = (mItem && typeof mItem === "object" ? mItem : {}) as Record<string, unknown>;
        return {
          question: String(m.question ?? ""),
          options: Array.isArray(m.options) ? (m.options as string[]) : [],
          answer: String(m.answer ?? m.correct_answer ?? ""),
          difficulty: (m.difficulty as MCQ["difficulty"]) || "medium",
          estimated_time: typeof m.estimated_time === "number" ? m.estimated_time : 30,
        };
      })
    : mcqSrc && typeof mcqSrc === "object" && ((mcqSrc as Record<string, unknown>).question || (mcqSrc as Record<string, unknown>).answer || (mcqSrc as Record<string, unknown>).correct_answer)
      ? [
          {
            question: String((mcqSrc as Record<string, unknown>).question ?? ""),
            options: Array.isArray((mcqSrc as Record<string, unknown>).options) ? ((mcqSrc as Record<string, unknown>).options as string[]) : [],
            answer: String((mcqSrc as Record<string, unknown>).answer ?? (mcqSrc as Record<string, unknown>).correct_answer ?? ""),
            difficulty: ((mcqSrc as Record<string, unknown>).difficulty as MCQ["difficulty"]) || "medium",
            estimated_time: typeof (mcqSrc as Record<string, unknown>).estimated_time === "number" ? ((mcqSrc as Record<string, unknown>).estimated_time as number) : 30,
          },
        ]
      : [];
  const mcqs = padMcqsToFive(rawMcqs);

  const fillSrc =
    quizzesFill.content ??
    quizzesContent.fill_in_blank ??
    rawQuizzesObj.fills ??
    rawQuizzesObj.fill;
  const fills: Fill[] = Array.isArray(fillSrc)
    ? fillSrc.map((fItem: unknown) => {
        const f = (fItem && typeof fItem === "object" ? fItem : {}) as Record<string, unknown>;
        return {
          question: String(f.question ?? f.sentence ?? ""),
          answer: String(f.answer ?? ""),
          difficulty: (f.difficulty as Fill["difficulty"]) || "medium",
          estimated_time: typeof f.estimated_time === "number" ? f.estimated_time : 30,
        };
      })
    : fillSrc && typeof fillSrc === "object" && ((fillSrc as Record<string, unknown>).question || (fillSrc as Record<string, unknown>).sentence || (fillSrc as Record<string, unknown>).answer)
      ? [
          {
            question: String((fillSrc as Record<string, unknown>).question ?? (fillSrc as Record<string, unknown>).sentence ?? ""),
            answer: String((fillSrc as Record<string, unknown>).answer ?? ""),
            difficulty: ((fillSrc as Record<string, unknown>).difficulty as Fill["difficulty"]) || "medium",
            estimated_time: typeof (fillSrc as Record<string, unknown>).estimated_time === "number" ? ((fillSrc as Record<string, unknown>).estimated_time as number) : 30,
          },
        ]
      : [];

  const essaySrc =
    quizzesEssay.content ??
    quizzesContent.essay ??
    rawQuizzesObj.essays ??
    rawQuizzesObj.essay;
  const essays: Essay[] = Array.isArray(essaySrc)
    ? essaySrc.map((eItem: unknown) => {
        const e = (eItem && typeof eItem === "object" ? eItem : {}) as Record<string, unknown>;
        return {
          question: String(e.question ?? ""),
          keywords: Array.isArray(e.keywords) ? (e.keywords as string[]) : e.answer ? [String(e.answer)] : [],
          answer: String(e.answer ?? ""),
          hint: String(e.hint || ""),
          difficulty: (e.difficulty as Essay["difficulty"]) || "medium",
          estimated_time: typeof e.estimated_time === "number" ? e.estimated_time : 60,
        };
      })
    : essaySrc && typeof essaySrc === "object" && (essaySrc as Record<string, unknown>).question
      ? [
          {
            question: String((essaySrc as Record<string, unknown>).question ?? ""),
            keywords: Array.isArray((essaySrc as Record<string, unknown>).keywords)
              ? ((essaySrc as Record<string, unknown>).keywords as string[])
              : (essaySrc as Record<string, unknown>).answer
                ? [String((essaySrc as Record<string, unknown>).answer)]
                : [],
            answer: String((essaySrc as Record<string, unknown>).answer ?? ""),
            hint: String((essaySrc as Record<string, unknown>).hint || ""),
            difficulty: ((essaySrc as Record<string, unknown>).difficulty as Essay["difficulty"]) || "medium",
            estimated_time: typeof (essaySrc as Record<string, unknown>).estimated_time === "number" ? ((essaySrc as Record<string, unknown>).estimated_time as number) : 60,
          },
        ]
      : [];

  let quiz_enabled = Boolean(rawObj.quiz_enabled ?? true);
  if (s.quizzes_mcq || s.quizzes_fill || s.quizzes_essay) {
    const anyActive =
      quizzesMcq.isActive !== false ||
      quizzesFill.isActive !== false ||
      quizzesEssay.isActive !== false;
    quiz_enabled = anyActive;
  } else if (quizzesObj && typeof quizzesObj.isActive === "boolean") {
    quiz_enabled = quizzesObj.isActive;
  }

  let enabled_stages = Array.isArray(rawObj.enabled_stages)
    ? (rawObj.enabled_stages as Stage[])
    : undefined;
  const stage_intervals: Partial<Record<Stage, number>> = { ...((rawObj.stage_intervals as Partial<Record<Stage, number>>) ?? {}) };
  const enable_stage_intervals: Partial<Record<Stage, boolean>> = {
    ...((rawObj.enable_stage_intervals as Partial<Record<Stage, boolean>>) ?? {}),
  };

  if (rawObj.stages && typeof rawObj.stages === "object") {
    enabled_stages = [];
    const order = Array.isArray(rawObj.stage_order)
      ? (rawObj.stage_order as Stage[])
      : DEFAULT_STAGE_ORDER;

    const stagesObj = rawObj.stages as Record<string, Record<string, unknown>>;
    for (const stage of order) {
      const sData = stagesObj[stage as Stage];
      if (sData) {
        if (sData.isActive !== false) enabled_stages.push(stage);
        if (typeof sData.intervalDuration === "number") {
          stage_intervals[stage] = sData.intervalDuration;
          enable_stage_intervals[stage] = sData.intervalDuration > 0;
        }
      } else {
        enabled_stages.push(stage);
      }
    }
  }

  const metaCard = (rawObj.meta_card && typeof rawObj.meta_card === "object" ? rawObj.meta_card : {}) as Record<string, unknown>;

  return {
    id: typeof rawObj.id === "number" ? rawObj.id : idx + 1,
    title: String(rawObj.title ?? rawObj.section_title ?? rawObj.name ?? `فقرة ${idx + 1}`),
    short_sentence,
    story,
    examples,
    full_text,
    hard_words,
    highlights,
    mnemonic,
    funny_link,
    mind_map_nodes,
    meta_card: {
      understanding_level: (metaCard.understanding_level as BlockMetaCard["understanding_level"]) ?? "سهل",
      memorization_level: (metaCard.memorization_level as BlockMetaCard["memorization_level"]) ?? "متوسط",
      estimated_time_range: String(metaCard.estimated_time_range ?? "2 - 5 دقائق"),
      info_count:
        typeof metaCard.info_count === "number"
          ? metaCard.info_count
          : mind_map_nodes.length > 0
            ? Math.max(mind_map_nodes.length, 3)
            : 3,
    },
    visual_url: String(rawObj.visual_url ?? ""),
    stage_visuals: (rawObj.stage_visuals as ParagraphBlock["stage_visuals"]) ?? {},
    stage_audio: (rawObj.stage_audio as ParagraphBlock["stage_audio"]) ?? {},
    enabled_stages,
    stage_order: Array.isArray(rawObj.stage_order) ? (rawObj.stage_order as Stage[]) : undefined,
    quizzes: { mcqs, fills, essays },
    quiz_enabled,
    quiz_mcq_enabled: Boolean(rawObj.quiz_mcq_enabled ?? true),
    quiz_fill_enabled: Boolean(rawObj.quiz_fill_enabled ?? true),
    quiz_essay_enabled: Boolean(rawObj.quiz_essay_enabled ?? true),
    enable_break: Boolean(rawObj.enable_break ?? false),
    break_duration: Number(rawObj.break_duration ?? 0),
    stage_interval: Number(rawObj.stage_interval ?? 0),
    stage_intervals,
    enable_stage_intervals,
    zaitouna: {
      definitions: zaitounaDefs,
      reasoning: zaitounaReas,
      links: zaitounaLinks,
    },
  };
}

export const DEFAULT_MASTER_STORY = `جاءت سارة إلى المعلمة وقالت ونبرة الحزن تتملكها: "زوجي رجل طيب، لكنني أصبحت لا أطيق العيش معه وأخشى ألا أقيم حدود الله معه وأظلمه، فكيف أفارقه بالحلال دون أن يقع عليّ إثم؟"

ابتسمت المعلمة وقالت لها: "الشريعة الإسلامية جعلت لكِ مخرجاً راقياً يسمى الخلع! وهو أن تتفقي مع زوجكِ على الفراق مقابل مبلغ مالي (عوض) تدفعينه له ليطلقكِ لإنهاء عقد الزواج.

والأصل في طلب الخلع أنه مكروه، لكنه يجوز بلا كراهة في حالتكِ هذه لأنكِ تخافين ألا تقيمي حدود الله معه، والأصل فيه قصة امرأة ثابت بن قيس لما راحت للنبي ﷺ فقال لزوجها: (اقبل الحديقة وطلقها تطليقة).

وبمجرد أن يقع الخلع، تملكين نفسكِ فوراً وتصبحين أجنبية عنه، فلا يحق له إرجاعكِ في العدة بكلمة، وإن أراد العودة مستقبلاً فلا بد من عقد ومهر جديدين ورضاكِ."

خرجت سارة وهي مطمئنة ومستوعبة للحل الشرعي الحكيم.`;

export function normalizeLesson(raw: unknown): Lesson {
  const rawObj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const rawBlocks = Array.isArray(rawObj.blocks)
    ? rawObj.blocks
    : Array.isArray(rawObj.sections)
      ? rawObj.sections
      : Array.isArray(rawObj.units)
        ? rawObj.units
        : [];

  const blocks: ParagraphBlock[] = rawBlocks.map((b: unknown, i: number) => normalizeBlock(b, i));

  const levelStageOrdersRaw = (rawObj.levelStageOrders && typeof rawObj.levelStageOrders === "object" ? rawObj.levelStageOrders : {}) as Record<number, string[]>;

  const levelStageOrders = {
    1: (levelStageOrdersRaw[1] as Stage[]) ?? [
      "story",
      "baladi_terms",
      "paper_summary",
      "mindmap",
      "quizzes_mcq",
    ],
    2: (levelStageOrdersRaw[2] as Stage[]) ?? [
      "examples",
      "original",
      "mental",
      "mindmap",
      "quizzes_fill",
      "quizzes_essay",
      "flashcards",
      "zaitouna",
    ],
    3: (levelStageOrdersRaw[3] as Stage[]) ?? [
      "original",
      "mental",
      "funny",
      "mindmap",
      "quizzes_essay",
      "zaitouna",
    ],
  };

  const levelDisabledStages = (rawObj.levelDisabledStages as Lesson["levelDisabledStages"]) ?? {
    1: [],
    2: [],
    3: [],
  };

  return {
    title: String(rawObj.title ?? rawObj.lesson_title ?? rawObj.name ?? "درس بدون عنوان"),
    estimatedTime: String(rawObj.estimatedTime ?? ""),
    size: String(rawObj.size ?? ""),
    topics: Array.isArray(rawObj.topics) ? (rawObj.topics as string[]) : [],
    notebookLmUrl: String(rawObj.notebookLmUrl ?? "https://notebooklm.google.com/"),
    master_story: String(rawObj.master_story ?? rawObj.masterStory ?? rawObj.intro_story ?? DEFAULT_MASTER_STORY),
    levelStageOrders,
    levelDisabledStages,
    enableBreaks: Boolean(rawObj.enableBreaks ?? false),
    breakDuration: Number(rawObj.breakDuration ?? 0),
    blocks,
  };
}

export function effectiveStages(
  block?: ParagraphBlock,
  globalOrder?: Stage[],
  level?: 1 | 2 | 3 | "all",
  levelStageOrders?: Lesson["levelStageOrders"],
  levelDisabledStages?: Lesson["levelDisabledStages"],
  subjectId?: string,
): Stage[] {
  if (!block) {
    return globalOrder && globalOrder.length > 0 ? globalOrder : (DEFAULT_STAGE_ORDER as Stage[]);
  }

  let orderToUse: Stage[] = [];

  // Check if subject has custom level stage orders configured
  const activeSubId =
    subjectId || (typeof window !== "undefined" ? getCurriculum().subjects[0]?.id : "fiqh");
  const subject = activeSubId ? getSubject(activeSubId) : undefined;
  const subOrders = subject?.levelStageOrders;
  const subDisabled = subject?.levelDisabledStages;

  if (level === "all") {
    orderToUse =
      globalOrder && globalOrder.length > 0 ? globalOrder : (DEFAULT_STAGE_ORDER as Stage[]);
  } else if (level === 1 || level === 2 || level === 3) {
    orderToUse =
      subOrders?.[level] && subOrders[level].length > 0
        ? subOrders[level]
        : levelStageOrders?.[level] && levelStageOrders[level].length > 0
          ? levelStageOrders[level]
          : level === 1
            ? ["story", "baladi_terms", "paper_summary", "mindmap", "quizzes_mcq"]
            : level === 2
              ? [
                  "examples",
                  "original",
                  "mental",
                  "mindmap",
                  "quizzes_fill",
                  "quizzes_essay",
                  "flashcards",
                  "zaitouna",
                ]
              : ["original", "mental", "funny", "mindmap", "quizzes_essay", "zaitouna"];
  } else {
    orderToUse =
      block.stage_order && block.stage_order.length > 0
        ? block.stage_order
        : globalOrder || (DEFAULT_STAGE_ORDER as Stage[]);
    const valid = orderToUse.filter((s) => (DEFAULT_STAGE_ORDER as string[]).includes(s));
    const missing = DEFAULT_STAGE_ORDER.filter((s) => !valid.includes(s));
    orderToUse = [...valid, ...missing];
  }

  const disabledForLevel = [
    ...(typeof level === "number" && levelDisabledStages?.[level] ? levelDisabledStages[level] : []),
    ...(typeof level === "number" && subDisabled?.[level] ? subDisabled[level] : []),
  ];

  const blockDisabled =
    block?.enabled_stages && block.enabled_stages.length > 0
      ? DEFAULT_STAGE_ORDER.filter((s) => !block.enabled_stages?.includes(s))
      : [];

  return (orderToUse || []).filter(
    (s) => !disabledForLevel.includes(s) && !blockDisabled.includes(s),
  );
}

// 🟢 القالب الافتراضي الأول: البناء الضوئي
export const defaultLesson: Lesson = normalizeLesson({
  title: "عملية البناء الضوئي",
  estimatedTime: "15 دقيقة",
  size: "3 فقرات أساسية - 10 مصطلحات",
  topics: ["مقدمة الغذاء", "المكونات السحرية", "النتيجة العظيمة"],
  notebookLmUrl: "https://notebooklm.google.com/",
  levelStageOrders: {
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
  },
  levelDisabledStages: { 1: [], 2: [], 3: [] },
  enableBreaks: false,
  breakDuration: 0,
  blocks: [
    {
      id: 1,
      title: "مقدمة الغذاء",
      short_sentence: "النباتات بتطبخ أكلها بنفسها في الشمس من غير شيف ولا بوتاجاز!",
      story:
        "تخيل إن عندك مطبخ سحري مش محتاج ولا فرن ولا طباخ! كل اللي بتعمله تقف تحت الشمس، وهي تحول الضوء لأحلى أكل طازة. ده بالضبط اللي الأشجار بتعمله كل يوم الصبح!",
      examples:
        "مثل شجرة التفاح التي تبني أوراقها وخشبها وثمارها الحلوة اعتماداً على الهواء والماء والشمس.",
      full_text:
        "عملية البناء الضوئي هي العملية الحيوية الأساسية التي تعتمد عليها النباتات.\nعكس الإنسان والحيوان الذين يبحثون عن طعامهم في كل مكان، النبات كائن منتج ذاتي التغذية يستخدم طاقة الشمس لتحويل المواد البسيطة إلى غذاء عالي الطاقة.",
      hard_words: [{ word: "ذاتي التغذية", meaning: "كائن يصنع غذاءه بنفسه بدون الحاجة لغيره" }],
      highlights: [{ text: "ذاتي التغذية", color: "yellow" }],
      mnemonic: "نبات = مصنع صامت يخزن الطاقة.",
      funny_link: "النبات كائن فضائي بيشرب من رجله وبياكل شمس مع كل شروق!",
      mind_map_nodes: ["ذاتي التغذية", "صنع الغذاء", "طاقة الشمس", "كائن منتج"],
      visual_url:
        "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      stage_interval: 0,
      quizzes: {
        mcqs: [
          {
            question: "النبات كائن حي يُعتبر:",
            options: ["منتج", "مستهلك", "محلل"],
            answer: "منتج",
          },
        ],
        fills: [{ question: "يصنع النبات غذاءه بنفسه لذا يسمى ذاتي ____", answer: "التغذية" }],
        essays: [
          {
            question: "كيف تصف عملية صنع الغذاء عند النبات؟",
            keywords: ["يصنع", "نفسه", "ضوء", "شمس"],
            hint: "تذكر دور ضوء الشمس وكيف يحول المواد البسيطة إلى طعام",
          },
        ],
      },
      zaitouna: {
        definitions:
          "ذاتي التغذية: الكائن الحي الذي يبني مركباته الغذائية بنفسه بفضل البناء الضوئي.",
        reasoning:
          "تعتمد الحياة على النباتات لأنها المصدر الرئيسي للطاقة العضوية والأكسجين على كوكب الأرض.",
        links: "ترتبط هذه العملية بشكل مباشر بسلسلة الغذاء ودورة الكربون العالمية.",
      },
    },
    {
      id: 2,
      title: "المكونات السحرية",
      short_sentence: "عايز تعمل خلطة البناء الضوئي؟ يلزمك 3 حاجات بس: شمس ومية وهواء!",
      story:
        "الورقة الخضراء فيها ورشة صغيرة تسحب مية من الأرض وتشفط هواء من الجو وتستقبل الشمس عشان تطبخ أكلها السحري!",
      examples: "إذا وضعت نبتة في غرفة مغلقة ومظلمة ستذبل وتموت، لأن طباخها السحري (الضوء) مفقود.",
      full_text:
        "تتم العملية داخل الأوراق في أجزاء مجهرية تسمى البلاستيدات الخضراء.\nيسحب النبات الماء من الجذور ويمتص ثاني أكسيد الكربون عبر فتحات الثغور.\nيلتقط الكلوروفيل ضوء الشمس ليوفر الطاقة اللازمة لإتمام التفاعل الكيميائي.",
      hard_words: [
        {
          word: "البلاستيدات الخضراء",
          meaning: "مصانع الخلية النباتية التي تتم فيها عملية البناء الضوئي",
        },
        { word: "الكلوروفيل", meaning: "الصبغة الخضراء المسؤولة عن امتصاص الضوء" },
        { word: "الثغور", meaning: "فتحات دقيقة جداً في سطوح الأوراق لدخول وخروج الغازات" },
      ],
      highlights: [{ text: "البلاستيدات الخضراء", color: "green" }],
      mnemonic: "مكونات الطبخة = ماء + هواء + شمس.",
      funny_link: "الكلوروفيل شيف محترف بيلبس أخضر، والثغور هي مناخير الورقة!",
      mind_map_nodes: [
        "الكلوروفيل",
        "الثغور",
        "البلاستيدات الخضراء",
        "الماء",
        "ثاني أكسيد الكربون",
        "الشمس",
      ],
      visual_url:
        "https://images.unsplash.com/photo-1538370965046-79c0d6907d47?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      stage_interval: 0,
      quizzes: {
        mcqs: [
          {
            question: "ما الصبغة التي تمتص ضوء الشمس؟",
            options: ["الماء", "الكلوروفيل", "الثغور"],
            answer: "الكلوروفيل",
          },
        ],
        fills: [
          { question: "يدخل ثاني أكسيد الكربون عبر فتحات مجهرية تسمى ____", answer: "الثغور" },
        ],
        essays: [
          {
            question: "ما المكونات الثلاثة الأساسية للبناء الضوئي؟",
            keywords: ["ماء", "ضوء", "هواء"],
          },
        ],
      },
      zaitouna: {
        definitions:
          "البلاستيدات الخضراء والكلوروفيل: الأجهزة العضَوية المسؤولة عن اقتناص الطاقة الضوئية.",
        reasoning: "بدون الكلوروفيل لا يمكن للنبات تحويل الطاقة الشمسية إلى طاقة كيميائية مخزنة.",
        links: "يرتبط امتصاص الماء بالخاصية الاسموزية ونقل العصارة الهابطة والصاعدة.",
      },
    },
    {
      id: 3,
      title: "النتيجة العظيمة",
      short_sentence: "النبات بيطبخ سكر مفيد لنفسه، ويطلع أكسجين هدية لينا عشان نتنفسه!",
      story:
        "لما النبات بيخلص طبخته، بيطلع حاجتين عظماء: سكر جلوكوز يتغذى عليه ويطلع ثمار، وأكسجين نقي بيطيره في الجو عشان نعيش ونستنشقه!",
      examples:
        "تسمى غابات الأمازون الشاسعة بـ 'رئة الأرض' لأن مليارات الأشجار فيها تطلق الأكسجين يومياً.",
      full_text:
        "تتفاعل المكونات الثلاثة بواسطة طاقة الشمس لتنتج مادة الجلوكوز.\nالجلوكوز سكر بسيط يمنح النبات الطاقة اللازمة للنمو وبناء الأغصان والثمار.\nفي الوقت نفسه، يُطلق النبات الأكسجين النقي عبر الثغور إلى الهواء الجوي لنتنفسه.",
      hard_words: [
        {
          word: "الجلوكوز",
          meaning: "سكر بسيط خفيف الناتِج عن البناء الضوئي ويمثل الوقود الحيوي للنبات",
        },
      ],
      highlights: [{ text: "الجلوكوز", color: "yellow" }],
      mnemonic: "الناتج = سكر لنظام النبات + أكسجين للبشرية.",
      funny_link: "النبات مطعم كريم جداً بياكل التلوث وبيدينا سكر وأكسجين مجاناً!",
      mind_map_nodes: ["الجلوكوز", "الأكسجين", "طاقة النمو", "التنفس النقي"],
      visual_url:
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      stage_interval: 0,
      quizzes: {
        mcqs: [
          {
            question: "ما الغاز النقي الذي يطلقه النبات للجو؟",
            options: ["الكربون", "الأكسجين", "النيتروجين"],
            answer: "الأكسجين",
          },
        ],
        fills: [{ question: "نوع السكر المغذي الناتج يسمى ____", answer: "الجلوكوز" }],
        essays: [
          {
            question: "لماذا تُعتبر النباتات ضرورية لحياة الإنسان؟",
            keywords: ["أكسجين", "تنفس", "غذاء"],
          },
        ],
      },
      zaitouna: {
        definitions: "الجلوكوز والأكسجين: المخرجات الرئيسية لتفاعل البناء الضوئي.",
        reasoning:
          "توازن الغلاف الجوي يعتمد على إطلاق النبات للأكسجين واستيعابه لثاني أكسيد الكربون.",
        links: "ترتبط هذه المخرجات بالتنفس الخلوي في جميع الأحياء وتوفر الطاقة للحياة على الأرض.",
      },
    },
  ],
});

// 📜 القالب الافتراضي الثاني: فقه الخُلع (الشافعي)
export const khulLesson: Lesson = normalizeLesson({
  title: "أحكام الخُلع في الفقه الإسلامي",
  estimatedTime: "35 دقيقة",
  size: "4 كتل فقهية - 10 مصطلحات شرعية",
  topics: [
    "تعريف الخلع وحكمه ودليله",
    "حكم الطلب وأركان الخلع",
    "أثر الخلع وضوابط العوض",
    "الخلع في الحيض وعدة المختلعة",
  ],
  notebookLmUrl: "https://notebooklm.google.com/",
  master_story: `جاءت سارة إلى المعلمة وقالت ونبرة الحزن تتملكها: "زوجي رجل طيب، لكنني أصبحت لا أطيق العيش معه وأخشى ألا أقيم حدود الله معه وأظلمه، فكيف أفارقه بالحلال دون أن يقع عليّ إثم؟"

ابتسمت المعلمة وقالت لها: "الشريعة الإسلامية جعلت لكِ مخرجاً راقياً يسمى الخلع! وهو أن تتفقي مع زوجكِ على الفراق مقابل مبلغ مالي (عوض) تدفعينه له ليطلقكِ لإنهاء عقد الزواج.

والأصل في طلب الخلع أنه مكروه، لكنه يجوز بلا كراهة في حالتكِ هذه لأنكِ تخافين ألا تقيمي حدود الله معه، والأصل فيه قصة امرأة ثابت بن قيس لما راحت للنبي ﷺ فقال لزوجها: (اقبل الحديقة وطلقها تطليقة).

وبمجرد أن يقع الخلع، تملكين نفسكِ فوراً وتصبحين أجنبية عنه، فلا يحق له إرجاعكِ في العدة بكلمة، وإن أراد العودة مستقبلاً فلا بد من عقد ومهر جديدين ورضاكِ."

خرجت سارة وهي مطمئنة ومستوعبة للحل الشرعي الحكيم.`,
  levelStageOrders: {
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
  },
  levelDisabledStages: { 1: [], 2: [], 3: [] },
  enableBreaks: false,
  breakDuration: 0,
  blocks: [
    {
      id: 1,
      title: "تعريف الخلع وحكمه ودليله",
      short_sentence:
        "الخلع يعني الست بتدفع عوض مالي للزوج عشان تفك الجوازة بالتراضي وتشتري راحتها.",
      story:
        "الخلع بالبلدي كده زي 'فدية' الزوجة بتدفعها للزوج (غالباً بترجعله المهر أو جزء منه) عشان تنهي عقد الجواز لما الحياة تتقل وميبقاش فيه تفاهم.",
      examples:
        "إذا خالعت الزوجة زوجها على 50 ألف جنيه معلومة وقع الخلع بائناً، أما إذا خالعت على 'سيارة مجهولة' وقع الخلع بمهر المثل.",
      full_text:
        "أولاً: تعريفه:\nوهو لغة: مشتق من خلع الثوب؛ لأن كلاً من الزوجين لباس للآخر.\nوشرعاً: فرقة بين الزوجين ولو بلفظ مفاداة بعوض مقصود راجع لجهة الزوج.\nثانياً: حكمه:\nالخلع جائز على عوض معلوم. وخرج بـ (معلوم العوض) المجهول، كثوب غير معين؛ فيقع بائناً بمهر المثل.\nثالثاً: دليله:\nالأصل فيه قبل الإجماع قوله تعالى: (فلا جناح عليهما فيما افتدت به). وخبر البخاري في امرأة ثابت بن قيس: (اقبل الحديقة وطلقها تطليقة).\nرابعاً: حكمة مشروعيته:\nأنه لما جاز أن يملك الزوج الانتفاع بالبضع بعوض، جاز له أن يزيل ذلك الملك بعوض. وأيضاً فيه دفع الضرر عن المرأة غالباً.",
      hard_words: [
        {
          word: "💡 خد بالك: الأصل في طلب الخلع أنه مكروه",
          meaning: "لكنه يشرع ويستثنى من الكراهة في حالة سارة لأنها تخاف ألا تقيم حدود الله.",
        },
        {
          word: "💡 خد بالك: إذا كان العوض مالاً أو حقاً محدداً ومعلوماً",
          meaning:
            "(كإرجاع المهر أو المبلغ المتفق عليه) = يقع الخلع بائناً وتملك الزوجة نفسها فوراً.",
        },
        {
          word: "💡 خد بالك: أما إذا خالعت الزوجة زوجها على شيء مجهول غير محدد",
          meaning:
            "(كأن تقول أخلعك على سيارة دون تحديد نوعها وموديلها) = يقع الخلع بائناً أيضاً، ولكن يلزمها دفع (مهر المثل) المطبق على مثيلاتها في العائلة.",
        },
      ],
      highlights: [
        { text: "بعوض معلوم", color: "yellow" },
        { text: "مهر المثل", color: "green" },
      ],
      mnemonic: "الخلع = فرقة بعوض معلوم لرفع الضرر.",
      funny_link: "زي ما اشتريت تذكرة الدخول بمهر، بتدفع تذكرة الخروج بعوض!",
      mind_map_nodes: ["التعريف الشرعي", "العوض المعلوم", "مهر المثل", "رفع الضرر"],
      visual_url:
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      stage_interval: 0,
      quizzes: {
        mcqs: [
          {
            question: "ما المشكلة التي كانت تعاني منها سارة في الحوار التمهيدي مع المعلمة؟",
            options: [
              "استعصاء العشرة والخوف ألا تقيم حدود الله مع زوجها",
              "رغبتها في زيادة المهر",
              "الخلاف على اسم مولودها",
              "السفر الخارجي بدون موافقة",
            ],
            answer: "استعصاء العشرة والخوف ألا تقيم حدود الله مع زوجها",
          },
          {
            question: "ما المعنى الشرعي الدقيق للخلع؟",
            options: [
              "فرقة بين الزوجين بعوض مقصود راجع لجهة الزوج",
              "فسخ العقد بسبب عيب في الزوجة",
              "طلاق بغير مقابل مالي",
              "إلغاء المهر المتفق عليه قبل العقد",
            ],
            answer: "فرقة بين الزوجين بعوض مقصود راجع لجهة الزوج",
          },
          {
            question: "ما الدليل من السنة النبوية الشريفة على مشروعية الخلع؟",
            options: [
              "حديث امرأة ثابت بن قيس (اقبل الحديقة وطلقها تطليقة)",
              "حديث (خيركم خيركم لأهله)",
              "حديث (المسلمون عند شروطهم)",
              "حديث (لا ضرر ولا ضرار)",
            ],
            answer: "حديث امرأة ثابت بن قيس (اقبل الحديقة وطلقها تطليقة)",
          },
          {
            question: "ما حكمة مشروعية الخلع في الشريعة الإسلامية؟",
            options: [
              "دفع الضرر عن المرأة وافتداء نفسها بعوض عند استحالة العشرة",
              "إجبار الزوج على التنازل عن حقوقه",
              "التضييق على الأبناء",
              "منع الزوج من الزواج بأخرى",
            ],
            answer: "دفع الضرر عن المرأة وافتداء نفسها بعوض عند استحالة العشرة",
          },
          {
            question: "إذا خالعت الزوجة زوجها على عوض مجهول (كثوب غير معين)، فما الحكم الشرعي؟",
            options: [
              "يقع الخلع بائناً وتلزم الزوجة بدفع (مهر المثل)",
              "يبطل الخلع تماماً",
              "يقع طلاقاً رجعياً",
              "يلزم الزوجة دفع ضعف المهر",
            ],
            answer: "يقع الخلع بائناً وتلزم الزوجة بدفع (مهر المثل)",
          },
        ],
        fills: [
          {
            question:
              "الدليل الشرعي على الخلع من القرآن قوله تعالى: (فلا جناح عليهما فيما ____ به)",
            answer: "افتدت",
          },
        ],
        essays: [
          {
            question:
              "اشرح بأسلوبك مع استخدام المشرط اللفظي: لماذا يقع الخلع بمهر المثل إذا كان العوض مجهولاً؟ وما حكمة مشروعيته؟",
            keywords: ["عوض", "جهالة", "مهر المثل", "ضرر", "فداء"],
            hint: "تذكر قاعدة إزالة الجهالة بالرجوع لأصل قيمة البضع بمهر المثل",
          },
        ],
      },
      zaitouna: {
        definitions: "الخلع: فرقة بين الزوجين بعوض مقصود راجع للزوج لفك عقد النكاح.",
        reasoning:
          "إذا كان العوض مجهولاً يقع الخلع بائناً بمهر المثل لئلا يبطل عقد الفداء مع عدم صحة التسمية.",
        links: "مرتبط بقواعد عقود المعاوضات المالية وتملّك البضع في الشريعة.",
      },
    },
    {
      id: 2,
      title: "حكم الطلب وأركان الخلع",
      short_sentence: "طلب الخلع مكروه إلا لضرورة، وله 5 أركان أساسية لإتمامه.",
      story:
        "الأصل في طلب الخلع إنه 'مكروه' عشان بيخرب البيت، لكن بيبقى حلال لو الحياة استحالت وخايفين يغضبوا ربنا. وعشان الخلع يتم صح، لازم 5 أركان تتجمع، أهمها إن اللي هيدفع الفلوس يكون شخص حر بالغ يقدر يتصرف في ماله.",
      examples:
        "تُستثنى كراهة الخلع إذا حلف الزوج بالطلاق الثلاث على أمر لا بد له منه، أو خافت الزوجة ألا تقيم حدود الله.",
      full_text:
        "خامساً: حكم طلب الزوجة الخلع:\nولكنه مكروه؛ لما فيه من قطع النكاح الذي هو مطلوب الشرع.\nإلا في حالتين:\nالأولى: أن يخافا أو أحدهما ألا يقيما حدود الله، فيخلعها.\nالثانية: أن يحلف بالطلاق الثلاث على فعل شيء لا بد له منه.\nسادساً: أركان الخلع:\nوأركان الخلع خمسة:\n١- ملتزم للعوض.\n٢- وبضع.\n٣- وعوض.\n٤- وصيغة.\n٥- وزوج.\nشروط الأركان:\nشرط في الزوج: صحة طلاقه.\nشرط في الملتزم: إطلاق تصرف مالي.",
      hard_words: [
        {
          word: "إطلاق تصرف مالي",
          meaning: "أن يكون الشخص حراً بالغاً عاقلاً رشيداً لا يُحجر على أمواله",
        },
        { word: "الملتزم", meaning: "الشخص الذي تعهد بدفع العوض للزوج (سواء الزوجة أو شخص أجنبي)" },
      ],
      highlights: [{ text: "إطلاق تصرف مالي", color: "yellow" }],
      mnemonic: "5 أركان = زوج + بضع + عوض + صيغة + ملتزم.",
      funny_link: "الملتزم هو الشجاع اللي شايل المحفظة ويدفع عشان الفداء!",
      mind_map_nodes: ["حكم الطلب", "حالات الاستثناء", "الأركان الخمسة", "إطلاق التصرف"],
      visual_url:
        "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      stage_interval: 0,
      quizzes: {
        mcqs: [
          {
            question: "أي من الحالات التالية يُستثنى فيها الخلع من (الكراهة) ويكون مباحاً؟",
            options: [
              "إذا أرادت الزوجة السفر للسياحة ورفض الزوج",
              "إذا حلف الزوج بالطلاق الثلاث على فعل أمر لابد له منه",
              "إذا وجدت الزوجة من هو أغنى من زوجها",
            ],
            answer: "إذا حلف الزوج بالطلاق الثلاث على فعل أمر لابد له منه",
          },
        ],
        fills: [
          { question: "يشترط في الملتزم بدفع العوض أن يكون مطلق التصرف ____", answer: "المالي" },
        ],
        essays: [
          {
            question:
              "علّل: يُشترط في 'الملتزم للعوض' إطلاق التصرف المالي؟ (استخدم المشرط اللفظي الفقهي).",
            keywords: ["تصرف", "مال", "أهلية", "تبرع", "رشد"],
            hint: "لأن التزام العوض عقد مالي يتضمن خروج المال من ملكه فاشترطت الأهلية الكاملة",
          },
        ],
      },
      zaitouna: {
        definitions: "أركان الخلع الخمسة: الملتزم، البضع، العوض، الصيغة، والزوج.",
        reasoning:
          "طلب الخلع مكروه لما فيه من إنهاء عقد النكاح المطلوب شرعاً إلا عند خشية عدم إقامة حدود الله.",
        links: "مرتبط بشروط الأهلية المالية وصحة وقوع الطلاق في الفقه الإسلامي.",
      },
    },
    {
      id: 3,
      title: "أثر الخلع وضوابط العوض",
      short_sentence:
        "المختلعة تبين فوراً وتملك نفسها، ولا رجعة للزوج عليها في العدة إلا بنكاح جديد.",
      story:
        "مجرد ما الخلع يحصل، الست بتبقى ملك نفسها وتعتبر 'أجنبية' عنه، ومينفعش يرجعها في فترة العدة غصب عنها زي ما بيعمل في الطلاق العادي. لو ندم وعايزها تاني، لازم يقنعها ويتجوزها بعقد ومهر جديد. والتعويض بتاع الخلع ينفع يكون فلوس، أعيان، أو حتى خدمة.",
      examples:
        "لو قال الزوج: إن أبرأتيني من دينك فأنت طالق، فأبرأته وهي جاهلة بقدر الدين = لم تطلق لبطلان الإبراء المجهول.",
      full_text:
        "سابعاً: أثر الخلع:\nوتملك المرأة المختلعة به نفسها (أي بضعها الذي استخلصته بالعوض).\nحكم الرجعة:\nولا رجعة له عليها في العدة، لانقطاع سلطنته بالبينونة المانعة من تسلطه على بضعها.\nإلا بنكاح جديد عليها بأركانه وشروطه المتقدمة.\nضوابط العوض:\nويصح عوض الخلع قليلاً أو كثيراً، ديناً وعيناً ومنفعة.\nحكم الإبراء المجهول:\nولو قال: إن أبرأتيني من صداقك أو دينك فأنت طالق، فأبرأته وهي جاهلة بقدره = لم تطلق؛ لأن الإبراء لم يصح، فلم يوجد ما عُلق عليه الطلاق.",
      hard_words: [
        {
          word: "البينونة",
          meaning: "الفراق القطعي الذي يقطع النكاح ويمنع الزوج من إرجاع زوجته إلا بعقد جديد",
        },
        {
          word: "ديناً وعيناً ومنفعة",
          meaning: "العوض قد يكون أموالاً في الذمة، أو شيئاً مادياً ملموساً، أو خدمة متفق عليها",
        },
      ],
      highlights: [{ text: "البينونة", color: "green" }],
      mnemonic: "بينونة فورا = لا رجعة إلا بعقد ومهر جديدين.",
      funny_link: "الباب المتقفل بالخلع مبيتفتحش إلا بمفتاح جديد (عقد ومهر)!",
      mind_map_nodes: ["البينونة الصغرى", "امتلاك البضع", "منع الرجعة", "صور العوض"],
      visual_url:
        "https://images.unsplash.com/photo-1505664194779-8beaceb93744?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      stage_interval: 0,
      quizzes: {
        mcqs: [
          {
            question: "هل يحق للزوج إرجاع زوجته (المختلعة) خلال فترة عدتها دون رضاها؟",
            options: [
              "نعم، لأنها ما زالت في العدة",
              "لا رجعة له عليها إلا بعقد ومهر جديدين ورضاها",
              "نعم، بشرط أن يرد لها مبلغ العوض",
            ],
            answer: "لا رجعة له عليها إلا بعقد ومهر جديدين ورضاها",
          },
        ],
        fills: [{ question: "يصح عوض الخلع ديناً وعيناً و____", answer: "منفعة" }],
        essays: [
          {
            question:
              "قال لها: 'خالعتك على ما في كفك' ففتحت يدها ولم يكن فيها شيء. ما الحكم الفقهي الدقيق لهذه المسألة مع التعليل؟",
            keywords: ["عوض", "جهالة", "مهر المثل", "بائن"],
            hint: "تذكر قاعدة العوض المجهول وفراق البينونة بمهر المثل",
          },
        ],
      },
      zaitouna: {
        definitions: "البينونة بالخلع: خروج الزوجة من سلطنة الزوج فوراً وتملكها لبضعها.",
        reasoning: "لا رجعة في الخلع لأن العوض بذل لتخليص البضع فلو ملك الرجعة لبطلت فائدة الفداء.",
        links: "مرتبط بأحكام الطلاق البائن والرجعي وفترات العدة في الشريعة.",
      },
    },
    {
      id: 4,
      title: "الخلع في الحيض وعدة المختلعة",
      short_sentence:
        "يجوز الخلع في الحيض أو الطهر الذي جامعها فيه، ولا يلحق المختلعة طلاق آخر في العدة.",
      story:
        "الطلاق العادي في الحيض حرام (عشان بيطول العدة)، لكن الخلع يجوز في الحيض أو في طهر حصل فيه جماع؛ لأن الست هنا دافعة فلوس عشان تخلص نفسها فمش فارق معاها تطويل العدة. وبما إن الخلع بيفصل الزوجين فوراً، لو الزوج رمى عليها يمين طلاق وهي في العدة مش هيقع؛ لأنها بقت أجنبية عنه.",
      examples:
        "لو تلفظ الزوج بالطلاق أو الإيلاء أو الظهار على مطلقة بالخلع أثناء عدتها، لا يقع عليها شيء لأنها أصبحت أجنبية عنه بالبينونة.",
      full_text:
        "تاسعاً: حكم الخلع في الطهر والحيض:\nويجوز الخلع في الطهر الذي جامعها فيه؛ لأنه لا يلحقه ندم بظهور الحمل لرضاه بأخذ العوض (ومنه يُعلم جوازه في طهر لم يجامعها فيه من باب أولى).\nويجوز الخلع أيضاً في الحيض؛ لأنها ببذلها الفداء لخلاصها رضيت لنفسها بتطويل العدة.\nعاشراً: حكم طلاق المختلعة في عدتها:\nولا يلحق المختلعة في عدتها طلاق صريح أو كناية، ولا إيلاء ولا ظهار؛ لصيرورتها أجنبية بافتداء بضعها.\nمحترزات:\nوخرج بقيد (المختلعة): الرجعية؛ فيلحقها الطلاق إلى انقضاء العدة لبقاء سلطنته عليها.",
      hard_words: [
        {
          word: "الطهر الذي جامعها فيه",
          meaning:
            "الفترة بين حكومتين وقع فيها لقاء زوجي (ويحرم فيها الطلاق العادي خوفاً من الندم عند الحمل)",
        },
        {
          word: "الظهار والإيلاء",
          meaning: "أيمان يمتنع بها الزوج عن زوجته (ولا تقع على المختلعة لأجنبيتها)",
        },
      ],
      highlights: [{ text: "أجنبية بافتداء بضعها", color: "yellow" }],
      mnemonic: "الخلع جائز دائماً (حيض أو طهر) + لا يلحقها طلاق جديد.",
      funny_link: "المختلعة حصنها منيع.. أي يمين طلاق تاني هيخبط في السور ويرجع لصحابه!",
      mind_map_nodes: [
        "جوازه في الحيض",
        "جوازه في طهر الجماع",
        "أجنبية بالبينونة",
        "عدم وقوع الطلاق الجديد",
      ],
      visual_url:
        "https://images.unsplash.com/photo-1450133064473-71024230f91b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      stage_interval: 0,
      quizzes: {
        mcqs: [
          {
            question: "لماذا لا يلحق المختلعة طلاق جديد أثناء قضاء عدتها؟",
            options: [
              "لأن الطلاق في العدة مكروه",
              "لصيرورتها أجنبية بافتداء بضعها، فلا سلطة للزوج عليها",
              "لأنها لم تكمل دفع العوض",
            ],
            answer: "لا سلطة للزوج عليها لصيرورتها أجنبية بافتداء بضعها",
          },
        ],
        fills: [{ question: "يجوز الخلع في طهر جامعها فيه وفي فترة ____ أيضاً", answer: "الحيض" }],
        essays: [
          {
            question:
              "علّل باستخدام المشرط اللفظي: لماذا أباح الشرع الخلع في الحيض رغم أن الطلاق العادي (السني) يحرم إيقاعه في الحيض؟",
            keywords: ["فداء", "رضا", "تطويل العدة", "رفع الضرر"],
            hint: "تذكر أن الفداء بذل منها لتخليص نفسها فرضيت بتطويل العدة",
          },
        ],
      },
      zaitouna: {
        definitions:
          "مشروعية الخلع في الحيض وطهر الجماع: استثناء من تحريم الطلاق البدعي لرغبة المرأة بالفداء.",
        reasoning:
          "انقطاع السلطنة بالبينونة يجعل المطلقة خلعاً أجنبية فلا يقع عليها طلاق ولا إيلاء ولا ظهار.",
        links: "مرتبط بقواعد رفع الضرر في المعاملات وفقه الأسرة الإسلامي.",
      },
    },
  ],
});

export function parseLessonJson(input: string): Lesson {
  const data = JSON.parse(input);
  if (Array.isArray(data)) {
    return normalizeLesson({
      title: "درس مخصص",
      estimatedTime: `${Math.max(5, data.length * 5)} دقيقة`,
      size: `${data.length} فقرات`,
      topics: data.map((b: unknown) => (b && typeof b === "object" ? String((b as Record<string, unknown>).title ?? "") : "")),
      blocks: data,
    });
  }

  const rawBlocks = Array.isArray(data.blocks)
    ? data.blocks
    : Array.isArray(data.sections)
      ? data.sections
      : Array.isArray(data.units)
        ? data.units
        : null;

  if (!rawBlocks) {
    if (data.story || data.full_text || data.title || data.lesson_title) {
      return normalizeLesson({
        title: data.title || data.lesson_title || "درس مخصص",
        blocks: [data],
      });
    }
    throw new Error("صيغة غير صالحة: قائمة الفقرات (blocks أو sections) مفقودة في ملف JSON");
  }

  return normalizeLesson(data);
}
