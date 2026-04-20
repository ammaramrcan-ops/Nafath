export type HardWord = { word: string; meaning: string };
export type Quiz = { question: string; options: string[]; correct_answer: string };
export type Formats = { story: string; examples: string; mnemonic: string };

export type ParagraphBlock = {
  id: string;
  fundamentals: string;
  short_sentence: string;
  full_text: string;
  hard_words: HardWord[];
  formats: Formats;
  visual_url: string;
  quiz: Quiz;
};

export type Lesson = {
  title: string;
  blocks: ParagraphBlock[];
};

export const lesson: Lesson = {
  title: "عملية البناء الضوئي",
  blocks: [
    {
      id: "b1",
      fundamentals:
        "تذكر أن: الكائنات الحية تحتاج إلى طاقة للنمو، والإنسان يحصل عليها من الأكل، ولكن النبات لا يأكل بل يصنع غذاءه بنفسه.",
      short_sentence:
        "البناء الضوئي هو الطريقة التي يصنع بها النبات طعامه باستخدام ضوء الشمس.",
      full_text:
        "عملية البناء الضوئي هي عملية حيوية تقوم بها النباتات الخضراء، حيث تمتص الماء من التربة وغاز ثاني أكسيد الكربون من الهواء، وبمساعدة ضوء الشمس ومادة الكلوروفيل، تحولها إلى سكر (جلوكوز) ليكون غذاءً لها، وتطلق غاز الأكسجين في الهواء.",
      hard_words: [
        { word: "الكلوروفيل", meaning: "المادة الخضراء في أوراق النبات التي تمتص ضوء الشمس" },
        { word: "جلوكوز", meaning: "نوع من السكر البسيط يمثل طاقة وغذاء النبات" },
      ],
      formats: {
        story:
          "تخيل أن ورقة الشجرة هي مطبخ صغير. الطباخ هو 'الكلوروفيل'. يطلب الطباخ مقادير الطبخة وهي: ماء من الجذور، وهواء من الخارج، ونار للطبخ وهي ضوء الشمس. النتيجة؟ وجبة سكر لذيذة للنبات، وهواء نقي لنا!",
        examples:
          "مثل شجرة التفاح التي تكبر وتثمر التفاح الحلو لأن أوراقها تصنع السكر باستمرار طوال النهار.",
        mnemonic: "تذكر المعادلة البسيطة: ماء + هواء + شمس = سكر + أكسجين.",
      },
      visual_url:
        "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=900&q=80",
      quiz: {
        question: "ما هو الغاز الذي ينتجه النبات بعد صنع غذائه ونتنفسه نحن؟",
        options: ["ثاني أكسيد الكربون", "الأكسجين", "النيتروجين"],
        correct_answer: "الأكسجين",
      },
    },
  ],
};
