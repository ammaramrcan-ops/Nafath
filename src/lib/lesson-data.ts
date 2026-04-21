import { DEFAULT_STAGE_ORDER, type Stage } from "@/lib/settings";

export type HardWord = { word: string; meaning: string };

export type MCQ = { question: string; options: string[]; answer: string };
export type Fill = { question: string; answer: string };
export type Essay = { question: string; keywords: string[] };
export type QuizImage = { image_url?: string };

export type Quizzes = {
  mcqs: (MCQ & QuizImage)[];
  fills: (Fill & QuizImage)[];
  essays: (Essay & QuizImage)[];
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
  stage_visuals?: Partial<Record<Stage | "quizzes", string>>;
  /** Per-block overrides. If undefined, global settings apply. */
  enabled_stages?: Stage[];
  stage_order?: Stage[];
  quizzes: Quizzes;
  quiz_enabled?: boolean;
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
  const q = raw?.quizzes ?? {};
  const mcqs: MCQ[] = Array.isArray(q.mcqs)
    ? q.mcqs
    : q.mcq && (q.mcq.question || q.mcq.answer)
      ? [q.mcq]
      : [];
  const fills: Fill[] = Array.isArray(q.fills)
    ? q.fills
    : q.fill && (q.fill.question || q.fill.answer)
      ? [q.fill]
      : [];
  const essays: Essay[] = Array.isArray(q.essays)
    ? q.essays
    : q.essay && (q.essay.question || (q.essay.keywords?.length ?? 0) > 0)
      ? [q.essay]
      : [];

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
    enabled_stages: Array.isArray(raw?.enabled_stages)
      ? (raw.enabled_stages as Stage[])
      : undefined,
    stage_order: Array.isArray(raw?.stage_order)
      ? (raw.stage_order as Stage[])
      : undefined,
    quizzes: { mcqs, fills, essays },
    quiz_enabled: raw?.quiz_enabled ?? true,
    enable_break: raw?.enable_break ?? true,
    break_duration: raw?.break_duration ?? 60,
    stage_interval: raw?.stage_interval ?? 15,
    stage_intervals: raw?.stage_intervals ?? {},
    enable_stage_intervals: raw?.enable_stage_intervals ?? {},
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
