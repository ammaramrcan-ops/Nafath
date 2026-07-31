import { useState } from "react";
import {
  Settings as SettingsIcon,
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

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  readonly open?: boolean;
  readonly onOpenChange?: (v: boolean) => void;
}) {
  const [tab, setTab] = useState<"ai" | "dev">("ai");
  const [showApiKey, setShowApiKey] = useState(false);
  const { aiSettings, updateAiSettings } = useAiSettings();
  const { isLocalhost, settings, updateDevMode } = useSettings();

  // API Live Testing State
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    text: string;
    error?: string;
  } | null>(null);

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
                  <label className="text-xs font-bold text-amber-950">
                    اسم النموذج (Model Name):
                  </label>
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
                  <label className="text-xs font-bold text-amber-950">
                    رابط الخدمة (Base URL):
                  </label>
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
                      يرسل سؤالاً بسيطاً (5 * 5) لاختبار الاستجابة المباشرة من خادم الذكاء
                      الاصطناعي.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunLiveTest}
                    disabled={isTesting}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 disabled:opacity-50 transition cursor-pointer"
                  >
                    {isTesting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                    <span>
                      {isTesting ? "جاري تجربة الاتصال..." : "🧪 اختبار الاتصال حياً (5 * 5)"}
                    </span>
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
                      <span>
                        {testResult.ok
                          ? "🟢 نجح الاتصال بالذكاء الاصطناعي حياً!"
                          : "🔴 فشل الاتصال بالـ API"}
                      </span>
                    </div>

                    {testResult.ok ? (
                      <div className="pt-1">
                        <span className="text-[11px] text-emerald-800 block">
                          إجابة النموذج المباشرة:
                        </span>
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
                      يظهر هذا الخيار فقط أثناء التشغيل على السيرفر المحلي (Localhost) لتسهيل وتنسيق
                      التجربة واختبار الواجهات بسرعة.
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
                    <span className="text-[#9d4300] font-extrabold block">
                      ✨ الاختصارات المتاحة عند تفعيل وضع المطور:
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 font-semibold">
                      <li>
                        تخطي تمارین ودقائق تمرين التنفس والتأمل في نافذة الاستعداد بنقرة واحدة.
                      </li>
                      <li>
                        إظهار زر "⚡ تخطي السؤال وحله فوراً" داخل بطاقات الأسئلة للاختبار السريع.
                      </li>
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

export function SettingsButton({ className }: { readonly className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button type="button"
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
