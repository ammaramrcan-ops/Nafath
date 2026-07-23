import { useState } from "react";
import {
  Settings as SettingsIcon,
  Copy,
  Check,
  Sparkles,
  Code2,
  Bot,
  Key,
  Cpu,
  Eye,
  EyeOff,
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAiSettings, type AiProvider } from "@/lib/ai-settings";
import { testAiConnection } from "@/lib/ai-assistant-service";

import { useSettings } from "@/lib/settings";

const NAFATH_JSON_PROMPT = `أنت خبير في التصميم التعليمي وتحويل المناهج إلى دروس تفاعلية ممتعة ومبسطة لمنصة "نفاذ - Nafath".
المطلوب منك تحويل النص/الموضوع الذي سأرفقه لك في نهاية هذه الرسالة إلى كود JSON دقيق ومطابق بنسبة 100% للهيكل التفاعلي لمنصة نفاذ.

اتبع الشروط الصارمة التالية:
1. قم بتقسيم الدرس إلى فقرات منطقية متوازنة (من 2 إلى 5 فقرات).
2. بالنسبة لكل فقرة (Section / Block)، صغ التالي بعناية:
   - story: قصة تشبيهية عامية أو مبسطة تشرح المفهوم بأسلوب دايركت طريف وعملي بالبلدي.
   - examples: مثال تطبيقي من الحياة اليومية.
   - full_text: النص العلمي الكامل والمشروح بدقة.
   - hard_words: قائمة بالمصطلحات الصعبة وتفسيرها اللغوي والمفهومي بالبلدي بين قوسين [{ "term": "المصطلح", "definition": "الشرح بالبلدي" }].
   - highlights: كلمات هامة للتظليل مع لونها (yellow, green, blue, pink, purple).
   - mnemonic: جملة تذكّر ذكية ومختصرة لبناء رابط ذهني.
   - funny_link: ربط طريف أو فكاهي لترسيخ المعلومة في الذاكرة بعيدة المدى.
   - mind_map_nodes: خريطة ذهنية تفصيلية عاليّة التشعب والعمق (تتفرع هرمياً من التعريف -> الحكم -> الأدلة -> حكمة المشروعية -> التفاصيل الشارحة).
   - meta_card: بطاقة نظرة سريعة (understanding_level, memorization_level, estimated_time_range, info_count).
   - quizzes: 
       * mcqs: صغ (5 أسئلة اختيار من متعدد) حصرية ومطابقة 100% لنص وقصة هذه الفقرة فقط دون طرح أي سؤال عن فقرات أخرى!
       * fills: أسئلة أكمل الفراغ الخاصة بهذه الفقرة.
       * essays: أسئلة علل ومشكلات فقهية/علمية مخصصة للفقرة.
   - zaitouna: خلاصة الزيتونة (definitions, reasoning, links).

3. أخرج النتيجة في مربع كود JSON الصافي وبدون أي مقدمات أو شروحات جانبية.`;

const PROMPT_STEP_1_CONTENT = `أنت خبير في التصميم التعليمي لمنصة "نفاذ - Nafath".
قم بتحويل النص/الموضوع التالي إلى كود JSON مخصص لـ (الشرح والقصص والمصطلحات) فقط، وفق الهيكل الآتي:
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

أخرج النتيجة في مربع كود JSON الصافي فقط وبدون أي مقدمات.`;

const PROMPT_STEP_2_MINDMAP = `أنت خبير رسم الخرائط الذهنية لمنصة "نفاذ - Nafath".
بناءً على موضوع الدرس، قم بتوليد كود JSON لخريطة ذهنية شجرية تفصيلية عاليّة التشعب والعمق (Root -> Categories -> Subtopics -> Details -> Proofs) مطابقة للهيكل التالي:
{
  "mind_map_nodes": [
    { "id": "root", "text": "العنوان الرئيسي للدرس", "parentId": null },
    { "id": "n1", "text": "1. التعريف والتأصيل", "parentId": "root" },
    { "id": "n1_1", "text": "لغة: مشتق من نَزع الثوب", "parentId": "n1" },
    { "id": "n1_1_1", "text": "(هن لباس لكم وأنتم لباس لهن)", "parentId": "n1_1" },
    { "id": "n1_2", "text": "شرعاً: فرقة بين الزوجين بعوض مقصود", "parentId": "n1" },
    { "id": "n2", "text": "2. الأحكام الشرعية والدليل", "parentId": "root" },
    { "id": "n2_1", "text": "حكمه: جائز على عوض معلوم", "parentId": "n2" },
    { "id": "n2_2", "text": "الدليل: (فلا جناح عليهما فيما افتدت به)", "parentId": "n2" },
    { "id": "n2_3", "text": "حديث: (اقبل الحديقة وطلقها تطليقة)", "parentId": "n2" }
  ]
}

أخرج النتيجة في مربع كود JSON الصافي فقط وبدون أي مقدمات.`;

const PROMPT_STEP_3_QUIZZES = `أنت خبير إعداد الاختبارات لمنصة "نفاذ - Nafath".
بناءً على فقرات الدرس، صغ كود JSON لأسئلة الاختبارات والـ MCQs، بشرط صارم: كل فقرة (Block) تحتوي على 5 أسئلة اختيار من متعدد (MCQ) حصرية ومطابقة 100% لنص وقصة هذه الفقرة فقط دون أي سؤال عن فقرات أخرى!

الهيكل المطلوب:
{
  "quizzes_by_block": [
    {
      "block_id": 1,
      "quizzes": {
        "mcqs": [
          {
            "question": "سؤال 1 خاص بالفقرة 1 فقط؟",
            "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
            "correct_answer": "خيار 1"
          },
          {
            "question": "سؤال 2 خاص بالفقرة 1 فقط؟",
            "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
            "correct_answer": "خيار 1"
          },
          {
            "question": "سؤال 3 خاص بالفقرة 1 فقط؟",
            "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
            "correct_answer": "خيار 1"
          },
          {
            "question": "سؤال 4 خاص بالفقرة 1 فقط؟",
            "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
            "correct_answer": "خيار 1"
          },
          {
            "question": "سؤال 5 خاص بالفقرة 1 فقط؟",
            "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
            "correct_answer": "خيار 1"
          }
        ],
        "fills": [
          { "question": "سؤال أكمل الفراغ 1 للفقرة 1", "answer": "الكلمة المناسبة" }
        ],
        "essays": [
          { "question": "سؤال علل أو فكري للفقرة 1؟", "answer": "الإجابة النموذجية" }
        ]
      }
    }
  ]
}

أخرج النتيجة في مربع كود JSON الصافي فقط وبدون أي مقدمات.`;

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  const [tab, setTab] = useState<"ai" | "prompt" | "dev">("ai");
  const [copied, setCopied] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const { aiSettings, updateAiSettings } = useAiSettings();
  const { isLocalhost, devModeActive, settings, updateDevMode } = useSettings();

  // API Live Testing State
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    text: string;
    error?: string;
  } | null>(null);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(NAFATH_JSON_PROMPT);
    setCopied(true);
    toast.success("تم نسخ دليل كود JSON والبرومبت بنجاح! 📋");
    setTimeout(() => setCopied(false), 3000);
  };

  const handleRunLiveTest = async () => {
    if (!aiSettings.apiKey || aiSettings.apiKey.trim().length < 4) {
      toast.error("يرجى إدخال مفتاح API أولاً لاختبار الاتصال!");
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await testAiConnection(aiSettings);
    setTestResult(result);
    setIsTesting(false);

    if (result.ok) {
      toast.success("نجح الاتصال بالنموذج حياً! 🎉");
    } else {
      toast.error("فشل الاتصال بالـ API. راجع المفتاح أو الرابط.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="max-w-3xl max-h-[88vh] overflow-y-auto gap-0 rounded-[1.5rem] border-0 bg-zen-surface p-0 shadow-[var(--shadow-deep)] text-right dir-rtl"
      >
        <DialogHeader className="px-7 pt-6 text-right border-b border-zen-surface-container/60 pb-4">
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-zen-primary" />
            <DialogTitle className="text-[20px] font-bold tracking-tight text-zen-on-surface">
              إعدادات المنصة المتقدمة
            </DialogTitle>
          </div>
          <DialogDescription className="text-[13px] text-zen-on-surface-variant pt-1">
            تأكيد وتفعيل مفاتيح الـ API، والبرومبت، ووضع المطور المباشر.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex flex-wrap border-b border-zen-surface-container/80 bg-zen-surface-low px-7">
          <button
            type="button"
            onClick={() => setTab("ai")}
            className={`px-5 py-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
              tab === "ai"
                ? "border-amber-600 text-amber-950 font-black bg-amber-50/60"
                : "border-transparent text-zen-on-surface-variant hover:text-zen-on-surface"
            }`}
          >
            <Bot className="h-4 w-4 text-amber-600" />
            <span>إعدادات الذكاء الاصطناعي الـ API</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("prompt")}
            className={`px-5 py-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
              tab === "prompt"
                ? "border-amber-600 text-amber-950 font-black bg-amber-50/60"
                : "border-transparent text-zen-on-surface-variant hover:text-zen-on-surface"
            }`}
          >
            <Code2 className="h-4 w-4 text-amber-600" />
            <span>البرومبت الصريح 📋</span>
          </button>

          {isLocalhost && (
            <button
              type="button"
              onClick={() => setTab("dev")}
              className={`px-5 py-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                tab === "dev"
                  ? "border-[#9d4300] text-[#9d4300] font-black bg-[#ffdbca]/40"
                  : "border-transparent text-zen-on-surface-variant hover:text-zen-on-surface"
              }`}
            >
              <Zap className="h-4 w-4 text-[#9d4300]" />
              <span>وضع المطور ⚡ (محلي فقط)</span>
            </button>
          )}
        </div>

        <div className="px-7 py-6 space-y-6">
          {tab === "ai" && (
            <div className="space-y-5">
              {/* Provider Selection */}
              <div className="rounded-2xl bg-white p-5 border border-zen-surface-container shadow-xs space-y-3">
                <label className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                  <Cpu className="h-4 w-4 text-amber-600" />
                  مزود خدمة الذكاء الاصطناعي (AI Provider):
                </label>

                <select
                  value={aiSettings.provider}
                  onChange={(e) => {
                    const p = e.target.value as AiProvider;
                    let defaultModel = aiSettings.modelName;
                    let defaultUrl = aiSettings.baseUrl;
                    if (p === "nvidia_nim") {
                      defaultModel = "meta/llama-3.1-70b-instruct";
                      defaultUrl = "https://integrate.api.nvidia.com/v1";
                    } else if (p === "openai") {
                      defaultModel = "gpt-4o-mini";
                      defaultUrl = "https://api.openai.com/v1";
                    } else if (p === "google_gemini") {
                      defaultModel = "gemini-1.5-flash";
                      defaultUrl = "https://generativelanguage.googleapis.com/v1beta";
                    }
                    updateAiSettings({ provider: p, modelName: defaultModel, baseUrl: defaultUrl });
                    setTestResult(null);
                    toast.success("تم تحديث مزود الخدمة");
                  }}
                  className="w-full h-11 rounded-xl bg-zen-surface-low px-4 text-xs font-bold text-zen-on-surface outline-none border border-zen-surface-container focus:ring-2 focus:ring-amber-500"
                >
                  <option value="nvidia_nim">⚡ NVIDIA NIM (nim.nvidia.com - المفضل)</option>
                  <option value="openai">🤖 OpenAI ChatGPT (gpt-4o-mini)</option>
                  <option value="google_gemini">✨ Google Gemini (gemini-1.5-flash)</option>
                  <option value="anthropic">🧠 Anthropic Claude (claude-3-5-sonnet)</option>
                  <option value="custom">💻 خادم مخصص / محلي (Ollama / VLLM)</option>
                </select>
              </div>

              {/* API Key Input */}
              <div className="rounded-2xl bg-white p-5 border border-zen-surface-container shadow-xs space-y-3">
                <label className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                  <Key className="h-4 w-4 text-amber-600" />
                  مفتاح الـ API Key الخاص بك:
                </label>

                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={aiSettings.apiKey}
                    onChange={(e) => {
                      updateAiSettings({ apiKey: e.target.value });
                      setTestResult(null);
                    }}
                    placeholder="nvapi-... أو sk-..."
                    className="w-full h-11 rounded-xl bg-zen-surface-low px-4 text-xs font-mono font-bold text-zen-on-surface outline-none border border-zen-surface-container focus:ring-2 focus:ring-amber-500 pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zen-on-surface-variant hover:text-zen-on-surface p-1"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-zen-on-surface-variant font-medium">
                  يتم حفظ المفتاح محلياً في متصفحك فقط لاستدعاء النموذج المباشر.
                </p>
              </div>

              {/* Model Name & Base URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white p-4 border border-zen-surface-container shadow-xs space-y-2">
                  <label className="text-xs font-bold text-amber-950">اسم النموذج (Model Name):</label>
                  <input
                    type="text"
                    value={aiSettings.modelName}
                    onChange={(e) => {
                      updateAiSettings({ modelName: e.target.value });
                      setTestResult(null);
                    }}
                    placeholder="meta/llama-3.1-70b-instruct"
                    className="w-full h-10 rounded-xl bg-zen-surface-low px-3 text-xs font-mono font-bold text-zen-on-surface outline-none border border-zen-surface-container"
                  />
                </div>

                <div className="rounded-2xl bg-white p-4 border border-zen-surface-container shadow-xs space-y-2">
                  <label className="text-xs font-bold text-amber-950">رابط الخدمة (Base URL):</label>
                  <input
                    type="text"
                    value={aiSettings.baseUrl}
                    onChange={(e) => {
                      updateAiSettings({ baseUrl: e.target.value });
                      setTestResult(null);
                    }}
                    placeholder="https://integrate.api.nvidia.com/v1"
                    className="w-full h-10 rounded-xl bg-zen-surface-low px-3 text-xs font-mono font-bold text-zen-on-surface outline-none border border-zen-surface-container"
                  />
                </div>
              </div>

              {/* Live API Connection Test Box */}
              <div className="rounded-2xl bg-amber-50/90 p-5 border border-amber-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-amber-600" />
                      اختبار الاتصال المباشر بالنموذج والـ API
                    </h4>
                    <p className="text-[11px] font-semibold text-amber-800">
                      يرسل سؤالاً بسيطاً (5 * 5) لاختبار الاستجابة المباشرة من خادم الذكاء الاصطناعي.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunLiveTest}
                    disabled={isTesting}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 disabled:opacity-50 transition cursor-pointer"
                  >
                    {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    <span>{isTesting ? "جاري تجربة الاتصال..." : "🧪 اختبار الاتصال حياً (5 * 5)"}</span>
                  </button>
                </div>

                {/* Display Test Result */}
                {testResult && (
                  <div
                    className={`rounded-xl p-4 text-xs font-bold space-y-1.5 border ${
                      testResult.ok
                        ? "bg-emerald-50 text-emerald-950 border-emerald-300"
                        : "bg-rose-50 text-rose-950 border-rose-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black">
                      {testResult.ok ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-600" />
                      )}
                      <span>{testResult.ok ? "🟢 نجح الاتصال بالذكاء الاصطناعي حياً!" : "🔴 فشل الاتصال بالـ API"}</span>
                    </div>

                    {testResult.ok ? (
                      <div className="pt-1">
                        <span className="text-[11px] text-emerald-800 block">إجابة النموذج المباشرة:</span>
                        <p className="font-mono bg-white p-2.5 rounded-lg border border-emerald-200 mt-1 text-slate-900 leading-relaxed">
                          {testResult.text}
                        </p>
                      </div>
                    ) : (
                      <p className="font-mono bg-white p-2.5 rounded-lg border border-rose-200 mt-1 text-rose-700 leading-relaxed">
                        {testResult.error}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "prompt" && (
            <div className="space-y-6 py-4">
              <div className="rounded-3xl bg-amber-50/90 p-8 border border-amber-200/90 space-y-6 text-center">
                <div className="flex flex-col items-center gap-2.5">
                  <Sparkles className="h-8 w-8 text-amber-600" />
                  <h3 className="text-base font-black text-amber-950">
                    دليل البرومبتات الـ 3 المخصصة والمستقلة 📋
                  </h3>
                  <p className="text-xs font-bold text-amber-900 leading-relaxed max-w-lg">
                    للحصول على أعلى جودة ودقة، انسخ برومبت كل مرحلة الصقه في الشات، ثم استورد كود JSON الناتج في واجهة المعلم!
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                  {/* Copy Prompt 1 */}
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(PROMPT_STEP_1_CONTENT);
                      toast.success("تم نسخ برومبت 1 (الشرح والقصص والمصطلحات) بنجاح! 📖📋");
                    }}
                    className="p-4 rounded-2xl bg-white border border-amber-200 hover:bg-amber-100/50 transition flex flex-col items-center text-center space-y-2 cursor-pointer shadow-xs"
                  >
                    <span className="text-xs font-black text-amber-950">1️⃣ الشرح والقصص</span>
                    <span className="text-[11px] text-amber-800 font-bold">لتحويل الشرح والقصص والمصطلحات</span>
                    <span className="mt-1 px-3 py-1.5 bg-amber-600 text-white text-[11px] font-black rounded-xl flex items-center gap-1">
                      <Copy className="h-3.5 w-3.5" />
                      <span>نسخ برومبت 1</span>
                    </span>
                  </button>

                  {/* Copy Prompt 2 */}
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(PROMPT_STEP_2_MINDMAP);
                      toast.success("تم نسخ برومبت 2 (الخريطة الذهنية المفصلة) بنجاح! 🎨📋");
                    }}
                    className="p-4 rounded-2xl bg-white border border-purple-200 hover:bg-purple-100/50 transition flex flex-col items-center text-center space-y-2 cursor-pointer shadow-xs"
                  >
                    <span className="text-xs font-black text-purple-950">2️⃣ الخريطة الذهنية</span>
                    <span className="text-[11px] text-purple-800 font-bold">لتوليد الشجرة المتشعبة التفصيلية</span>
                    <span className="mt-1 px-3 py-1.5 bg-purple-600 text-white text-[11px] font-black rounded-xl flex items-center gap-1">
                      <Copy className="h-3.5 w-3.5" />
                      <span>نسخ برومبت 2</span>
                    </span>
                  </button>

                  {/* Copy Prompt 3 */}
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(PROMPT_STEP_3_QUIZZES);
                      toast.success("تم نسخ برومبت 3 (أسئلة الـ MCQs لكل فقرة) بنجاح! 📝📋");
                    }}
                    className="p-4 rounded-2xl bg-white border border-emerald-200 hover:bg-emerald-100/50 transition flex flex-col items-center text-center space-y-2 cursor-pointer shadow-xs"
                  >
                    <span className="text-xs font-black text-emerald-950">3️⃣ أسئلة الـ MCQs</span>
                    <span className="text-[11px] text-emerald-800 font-bold">5 أسئلة خيار حصرية لكل فقرة</span>
                    <span className="mt-1 px-3 py-1.5 bg-emerald-600 text-white text-[11px] font-black rounded-xl flex items-center gap-1">
                      <Copy className="h-3.5 w-3.5" />
                      <span>نسخ برومبت 3</span>
                    </span>
                  </button>
                </div>

                <div className="pt-3 border-t border-amber-200/60">
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="inline-flex items-center gap-2 rounded-full bg-amber-900 px-6 py-2.5 text-xs font-black text-amber-100 hover:bg-amber-950 transition cursor-pointer shadow-xs"
                  >
                    <Copy className="h-4 w-4" />
                    <span>نسخ البرومبت التراكمي الموحد (All-in-One) 📋</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === "dev" && isLocalhost && (
            <div className="space-y-6 py-2 dir-rtl text-right">
              <div className="rounded-3xl bg-[#fffbf9] p-6 border-2 border-dashed border-[#ffdbca] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-[#9d4300] flex items-center gap-2">
                      <Zap className="h-5 w-5 text-[#9d4300]" />
                      <span>تفعيل وضع المطور السريع (Developer Mode ⚡)</span>
                    </h3>
                    <p className="text-xs font-semibold text-slate-500">
                      يظهر هذا الخيار فقط أثناء التشغيل على السيرفر المحلي (Localhost) لتسهيل وتنسيق التجربة واختبار الواجهات بسرعة.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => updateDevMode(!settings.devModeEnabled)}
                    className={`px-6 py-2.5 rounded-full text-xs font-extrabold transition cursor-pointer flex items-center gap-2 shadow-xs ${
                      settings.devModeEnabled
                        ? "bg-[#00875a] text-white"
                        : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                    }`}
                  >
                    <span>{settings.devModeEnabled ? "مفعّل 🟢" : "معطّل ⚪"}</span>
                  </button>
                </div>

                {settings.devModeEnabled && (
                  <div className="rounded-2xl bg-white p-4 border border-[#e0c0b1]/40 text-xs font-bold text-[#0b1c30] space-y-2">
                    <span className="text-[#9d4300] font-extrabold block">✨ الاختصارات المتاحة عند تفعيل وضع المطور:</span>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 font-semibold">
                      <li>تخطي تمارین ودقائق تمرين التنفس والتأمل في نافذة الاستعداد بنقرة واحدة.</li>
                      <li>إظهار زر "⚡ تخطي السؤال وحله فوراً" داخل بطاقات الأسئلة للاختبار السريع.</li>
                      <li>التنقل الفوري والسريع بين كافة مراحل الفقرات دون قيود وقت.</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SettingsButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            className={
              className ??
              "inline-flex items-center gap-2 rounded-full border border-zen-surface-container bg-white px-4 py-2 text-sm font-semibold text-zen-on-surface-variant transition hover:border-zen-primary-container hover:text-zen-on-surface cursor-pointer"
            }
          >
            <SettingsIcon className="h-4 w-4" />
            الإعدادات
          </button>
        </DialogTrigger>
      </Dialog>
      <SettingsDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
