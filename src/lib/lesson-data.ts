import { DEFAULT_STAGE_ORDER, type Stage } from "@/lib/settings";

export type HardWord = { word: string; meaning: string };

export type QuizImage = { image_url?: string };
export type MCQ = { question: string; options: string[]; answer: string; difficulty?: 'easy' | 'medium' | 'hard'; estimated_time?: number } & QuizImage;
export type Fill = { question: string; answer: string; difficulty?: 'easy' | 'medium' | 'hard'; estimated_time?: number } & QuizImage;
export type Essay = { question: string; keywords: string[]; hint?: string; difficulty?: 'easy' | 'medium' | 'hard'; estimated_time?: number } & QuizImage;

export type Quizzes = {
  mcqs: MCQ[];
  fills: Fill[];
  essays: Essay[];
};

export type ParagraphBlock = {
  id: number;
  title: string;
  short_sentence: string;
  story: string;
  examples: string;
  full_text: string;
  hard_words: HardWord[];
  mnemonic: string;
  funny_link: string;
  mind_map_nodes: string[];
  visual_url?: string;
  stage_visuals?: Partial<Record<Stage | "quizzes" | "quizzes_mcq" | "quizzes_fill" | "quizzes_essay", string>>;
  /** Per-block overrides. If undefined, global settings apply. */
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
};

export type Lesson = {
  title: string;
  estimatedTime: string;
  size: string;
  topics: string[];
  blocks: ParagraphBlock[];
  enableBreaks?: boolean;
  breakDuration?: number;
};

/** Normalize legacy block shape (singular mcq/fill/essay) into new array form. */
export function normalizeBlock(raw: any, idx: number): ParagraphBlock {
  // ── Resolve quiz content from either new per-stage or legacy flat structure ──
  const s = raw?.stages ?? {};

  // MCQ: stages.quizzes_mcq.content[] > stages.quizzes.content.mcq[] > quizzes.mcqs[]
  const mcqSrc = s.quizzes_mcq?.content ?? s.quizzes?.content?.mcq ?? raw?.quizzes?.mcqs ?? raw?.quizzes?.mcq;
  const mcqs: MCQ[] = Array.isArray(mcqSrc) ? mcqSrc.map(m => ({...m, difficulty: m.difficulty || 'medium', estimated_time: m.estimated_time || 30})) : mcqSrc && (mcqSrc.question || mcqSrc.answer) ? [{...mcqSrc, difficulty: mcqSrc.difficulty || 'medium', estimated_time: mcqSrc.estimated_time || 30}] : [];

  // Fill: stages.quizzes_fill.content[] > stages.quizzes.content.fill_in_blank[] > quizzes.fills[]
  const fillSrc = s.quizzes_fill?.content ?? s.quizzes?.content?.fill_in_blank ?? raw?.quizzes?.fills ?? raw?.quizzes?.fill;
  const fills: Fill[] = Array.isArray(fillSrc) ? fillSrc.map(f => ({...f, difficulty: f.difficulty || 'medium', estimated_time: f.estimated_time || 30})) : fillSrc && (fillSrc.question || fillSrc.answer) ? [{...fillSrc, difficulty: fillSrc.difficulty || 'medium', estimated_time: fillSrc.estimated_time || 30}] : [];

  // Essay: stages.quizzes_essay.content[] > stages.quizzes.content.essay[] > quizzes.essays[]
  const essaySrc = s.quizzes_essay?.content ?? s.quizzes?.content?.essay ?? raw?.quizzes?.essays ?? raw?.quizzes?.essay;
  const essays: Essay[] = Array.isArray(essaySrc) ? essaySrc.map(e => ({...e, hint: e.hint || '', difficulty: e.difficulty || 'medium', estimated_time: e.estimated_time || 60})) : essaySrc && essaySrc.question ? [{...essaySrc, hint: essaySrc.hint || '', difficulty: essaySrc.difficulty || 'medium', estimated_time: essaySrc.estimated_time || 60}] : [];

  // quiz_enabled: false only when ALL three quiz stages are inactive
  let quiz_enabled = raw?.quiz_enabled ?? true;
  if (s.quizzes_mcq || s.quizzes_fill || s.quizzes_essay) {
    const anyActive =
      s.quizzes_mcq?.isActive !== false ||
      s.quizzes_fill?.isActive !== false ||
      s.quizzes_essay?.isActive !== false;
    quiz_enabled = anyActive;
  } else if (s.quizzes && typeof s.quizzes.isActive === "boolean") {
    quiz_enabled = s.quizzes.isActive;
  }

  let enabled_stages = Array.isArray(raw?.enabled_stages)
    ? (raw.enabled_stages as Stage[])
    : undefined;
  const stage_intervals: Partial<Record<Stage, number>> = { ...(raw?.stage_intervals ?? {}) };
  const enable_stage_intervals: Partial<Record<Stage, boolean>> = { ...(raw?.enable_stage_intervals ?? {}) };

  if (raw?.stages) {
    enabled_stages = [];
    const order = Array.isArray(raw?.stage_order) ? (raw.stage_order as Stage[]) : DEFAULT_STAGE_ORDER;

    for (const stage of order) {
      const sData = raw.stages[stage as Stage];
      if (sData) {
        if (sData.isActive !== false) enabled_stages.push(stage);
        if (typeof sData.intervalDuration === "number") {
          stage_intervals[stage] = sData.intervalDuration;
          enable_stage_intervals[stage] = sData.intervalDuration > 0;
        }
      } else {
        enabled_stages.push(stage); // default to active when key absent
      }
    }

    // Map stage content into flat fields
    if (s.short)    raw.short_sentence  = s.short.content   ?? raw.short_sentence;
    if (s.story)    raw.story           = s.story.content   ?? raw.story;
    if (s.examples) raw.examples        = s.examples.content ?? raw.examples;
    if (s.original) {
      raw.full_text  = s.original.content   ?? raw.full_text;
      raw.visual_url = s.original.visual_url ?? raw.visual_url;
    }
    if (s.mental) {
      raw.mnemonic   = s.mental.mnemonic   ?? raw.mnemonic;
      raw.funny_link = s.mental.funny_link ?? raw.funny_link;
    }
    if (s.mindmap) raw.mind_map_nodes = s.mindmap.nodes ?? raw.mind_map_nodes;
  }

  return {
    id: typeof raw?.id === "number" ? raw.id : idx + 1,
    title: raw?.title ?? "",
    short_sentence: raw?.short_sentence ?? "",
    story: raw?.story ?? "",
    examples: raw?.examples ?? "",
    full_text: raw?.full_text ?? "",
    hard_words: Array.isArray(raw?.hard_words) ? raw.hard_words : [],
    mnemonic: raw?.mnemonic ?? "",
    funny_link: raw?.funny_link ?? "",
    mind_map_nodes: Array.isArray(raw?.mind_map_nodes) ? raw.mind_map_nodes : [],
    visual_url: raw?.visual_url ?? "",
    stage_visuals: raw?.stage_visuals ?? {},
    enabled_stages,
    stage_order: Array.isArray(raw?.stage_order)
      ? (raw.stage_order as Stage[])
      : undefined,
    quizzes: { mcqs, fills, essays },
    quiz_enabled,
    quiz_mcq_enabled: raw?.quiz_mcq_enabled ?? true,
    quiz_fill_enabled: raw?.quiz_fill_enabled ?? true,
    quiz_essay_enabled: raw?.quiz_essay_enabled ?? true,
    enable_break: raw?.enable_break ?? true,
    break_duration: raw?.break_duration ?? 60,
    stage_interval: raw?.stage_interval ?? 15,
    stage_intervals,
    enable_stage_intervals,
  };
}

export function normalizeLesson(raw: any): Lesson {
  const blocks: ParagraphBlock[] = Array.isArray(raw?.blocks)
    ? raw.blocks.map((b: any, i: number) => normalizeBlock(b, i))
    : [];
  return {
    title: raw?.title ?? "درس بدون عنوان",
    estimatedTime: raw?.estimatedTime ?? "",
    size: raw?.size ?? "",
    topics: Array.isArray(raw?.topics) ? raw.topics : [],
    enableBreaks: raw?.enableBreaks ?? true,
    breakDuration: raw?.breakDuration ?? 60,
    blocks,
  };
}

/** Compute the effective stages for a block by intersecting global order with block's enabled list. */
export function effectiveStages(block: ParagraphBlock, globalOrder: Stage[]): Stage[] {
  const order = block.stage_order && block.stage_order.length > 0 ? block.stage_order : globalOrder;
  const enabled = block.enabled_stages ?? DEFAULT_STAGE_ORDER;
  return order.filter((s) => enabled.includes(s));
}

export const defaultLesson: Lesson = normalizeLesson({
  title: "عملية البناء الضوئي",
  estimatedTime: "15 دقيقة",
  size: "3 فقرات أساسية - 10 مصطلحات",
  topics: ["مقدمة الغذاء", "المكونات السحرية", "النتيجة"],
  enableBreaks: true,
  breakDuration: 60,
  blocks: [
    {
      id: 1,
      title: "مقدمة الغذاء",
      short_sentence: "النباتات تصنع طعامها بنفسها باستخدام الضوء.",
      examples: "مثل شجرة التفاح التي تبني خشبها وثمارها من الهواء والماء.",
      full_text:
        "عملية البناء الضوئي             هي العملية الحيوية التي تعتمد عليها النباتات.\nعكس الإنسان والحيوان             الذين يبحثون عن طعامهم في كل مكان.\nالنبات كائن منتج             يستخدم طاقة الشمس لتحويل المواد بسيطة.",
      hard_words: [{ word: "ذاتي التغذية", meaning: "يصنع غذاءه بنفسه" }],
      mnemonic: "نبات = مصنع صامت.",
      funny_link: "النبات كائن فضائي بيشرب من رجله وبياكل شمس!",
      mind_map_nodes: ["ذاتي التغذية", "صنع الغذاء", "طاقة الشمس", "كائن منتج"],
      visual_url:
        "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      quizzes: {
        mcqs: [
          { question: "النبات كائن:", options: ["منتج", "مستهلك", "محلل"], answer: "منتج" },
        ],
        fills: [
          { question: "يصنع النبات غذاءه بنفسه لذا يسمى ذاتي ____", answer: "التغذية" },
        ],
        essays: [
          {
            question: "كيف تصف عملية صنع الغذاء عند النبات؟",
            keywords: ["يصنع", "نفسه", "ضوء"],
          },
        ],
      },
    },
    {
      id: 2,
      title: "المكونات السحرية",
      short_sentence: "يحتاج النبات لثلاثة أشياء: ماء، هواء، وضوء الشمس.",
      examples: "إذا وضعت نبتة في غرفة مظلمة ستموت رغم وجود الماء والهواء.",
      full_text:
        "تتم العملية داخل الأوراق             في أجزاء تسمى البلاستيدات الخضراء.\nيسحب النبات الماء من الجذور             ويمتص ثاني أكسيد الكربون عبر الثغور.\nيلتقط الكلوروفيل ضوء الشمس             ليوفر الطاقة اللازمة للتفاعل.",
      hard_words: [
        { word: "البلاستيدات الخضراء", meaning: "مصانع صغيرة داخل الورقة" },
        { word: "الكلوروفيل", meaning: "الصبغة الخضراء التي تمتص الضوء" },
        { word: "الثغور", meaning: "فتحات صغيرة في الورقة لدخول الهواء" },
      ],
      mnemonic: "ماء + هواء + شمس.",
      funny_link: "الكلوروفيل شيف بيطبخ بصمت، والثغور مناخير النبات!",
      mind_map_nodes: ["الكلوروفيل", "الثغور", "البلاستيدات الخضراء", "الماء", "ثاني أكسيد الكربون", "الشمس"],
      visual_url:
        "https://images.unsplash.com/photo-1538370965046-79c0d6907d47?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      quizzes: {
        mcqs: [
          {
            question: "ما المادة التي تلتقط ضوء الشمس؟",
            options: ["الماء", "الكلوروفيل", "الثغور"],
            answer: "الكلوروفيل",
          },
        ],
        fills: [{ question: "يدخل ثاني أكسيد الكربون عبر فتحات تسمى ____", answer: "الثغور" }],
        essays: [{ question: "ما المكونات الأساسية للبناء الضوئي؟", keywords: ["ماء", "ضوء", "هواء"] }],
      },
    },
    {
      id: 3,
      title: "النتيجة العظيمة",
      short_sentence: "ينتج النبات سكراً لنفسه وأكسجيناً لنا.",
      examples: "غابات الأمازون تسمى رئة الأرض لإنتاجها كميات هائلة من الأكسجين.",
      full_text:
        "تتفاعل المكونات بطاقة الشمس             لتنتج مادة الجلوكوز.\nالجلوكوز سكر بسيط             يوفر الطاقة لنمو النبات.\nيُطلق النبات الأكسجين             إلى الهواء عبر الثغور لنتنفسه.",
      hard_words: [{ word: "الجلوكوز", meaning: "سكر بسيط مصدر الطاقة للنبات" }],
      mnemonic: "سكر للنبات + أكسجين للإنسان.",
      funny_link: "النبات مطعم مجاني بيحوّل زبالتنا لأكسجين نقي!",
      mind_map_nodes: ["الجلوكوز", "الأكسجين", "الطاقة", "التنفس"],
      visual_url:
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      quizzes: {
        mcqs: [
          { question: "ما الغاز الذي يطلقه النبات؟", options: ["الكربون", "الأكسجين", "النيتروجين"], answer: "الأكسجين" },
        ],
        fills: [{ question: "نوع السكر الناتج يسمى ____", answer: "الجلوكوز" }],
        essays: [{ question: "لماذا النباتات مهمة لبقائنا؟", keywords: ["أكسجين", "تنفس", "غذاء"] }],
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
      topics: data.map((b: any) => b?.title ?? ""),
      blocks: data,
    });
  }
  if (!data.blocks) throw new Error("صيغة غير صالحة: blocks مفقود");
  return normalizeLesson(data);
}
