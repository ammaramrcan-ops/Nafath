export type HardWord = { word: string; meaning: string };

export type MCQ = { question: string; options: string[]; answer: string };
export type Fill = { question: string; answer: string };
export type Essay = { question: string; keywords: string[] };

export type Quizzes = {
  mcq: MCQ;
  fill: Fill;
  essay: Essay;
};

export type ParagraphBlock = {
  id: number;
  title: string;
  short_sentence: string;
  examples: string;
  full_text: string;
  hard_words: HardWord[];
  mnemonic: string;
  funny_link: string;
  mind_map_nodes: string[];
  visual_url?: string;
  quizzes: Quizzes;
};

export type Lesson = {
  title: string;
  estimatedTime: string;
  size: string;
  topics: string[];
  blocks: ParagraphBlock[];
};

export const defaultLesson: Lesson = {
  title: "عملية البناء الضوئي",
  estimatedTime: "15 دقيقة",
  size: "3 فقرات أساسية - 10 مصطلحات",
  topics: ["مقدمة الغذاء", "المكونات السحرية", "النتيجة"],
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
        mcq: { question: "النبات كائن:", options: ["منتج", "مستهلك", "محلل"], answer: "منتج" },
        fill: { question: "يصنع النبات غذاءه بنفسه لذا يسمى ذاتي ____", answer: "التغذية" },
        essay: {
          question: "كيف تصف عملية صنع الغذاء عند النبات؟",
          keywords: ["يصنع", "نفسه", "ضوء"],
        },
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
        mcq: {
          question: "ما المادة التي تلتقط ضوء الشمس؟",
          options: ["الماء", "الكلوروفيل", "الثغور"],
          answer: "الكلوروفيل",
        },
        fill: {
          question: "يدخل ثاني أكسيد الكربون عبر فتحات تسمى ____",
          answer: "الثغور",
        },
        essay: {
          question: "ما المكونات الأساسية للبناء الضوئي؟",
          keywords: ["ماء", "ضوء", "هواء"],
        },
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
        mcq: {
          question: "ما الغاز الذي يطلقه النبات؟",
          options: ["الكربون", "الأكسجين", "النيتروجين"],
          answer: "الأكسجين",
        },
        fill: { question: "نوع السكر الناتج يسمى ____", answer: "الجلوكوز" },
        essay: {
          question: "لماذا النباتات مهمة لبقائنا؟",
          keywords: ["أكسجين", "تنفس", "غذاء"],
        },
      },
    },
  ],
};

export function parseLessonJson(input: string): Lesson {
  const data = JSON.parse(input);
  // Accept either a full Lesson object or an array of blocks
  if (Array.isArray(data)) {
    return {
      title: "درس مخصص",
      estimatedTime: `${Math.max(5, data.length * 5)} دقيقة`,
      size: `${data.length} فقرات`,
      topics: data.map((b: ParagraphBlock) => b.title),
      blocks: data,
    };
  }
  if (!data.blocks) throw new Error("صيغة غير صالحة: blocks مفقود");
  return data as Lesson;
}
