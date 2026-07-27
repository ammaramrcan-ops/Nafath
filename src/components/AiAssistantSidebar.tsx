import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  ChevronLeft,
  Bot,
  Send,
  Settings as SettingsIcon,
  Cpu,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { useAiSettings } from "@/lib/ai-settings";
import { SettingsDialog } from "@/components/SettingsDialog";
import { generateSahmResponse, type ChatMessage } from "@/lib/ai-assistant-service";
import { motion } from "framer-motion";

export function AiAssistantSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showStatusDetails, setShowStatusDetails] = useState(false);
  const { aiSettings } = useAiSettings();

  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hasApiKey = Boolean(aiSettings.apiKey && aiSettings.apiKey.trim().length >= 4);

  // Default initial welcoming message history
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_welcome_1",
      sender: "assistant",
      text: 'أهلاً بك يا بطل! أنا مساعدك الآلي الشخصي "سهم".',
      timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
    },
    {
      id: "msg_welcome_2",
      sender: "assistant",
      text: "أنا هنا للدردشة والمباشرة معك والإجابة الحقيقية عبر الذكاء الاصطناعي على أي سؤال في الفيزياء، العلوم، الفقه، أو الدراسة!",
      timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const providerNames: Record<string, string> = {
    nvidia_nim: "NVIDIA NIM",
    openai: "OpenAI ChatGPT",
    google_gemini: "Google Gemini",
    anthropic: "Anthropic Claude",
    custom: "خادم مخصص",
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputMessage).trim();
    if (!prompt || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: prompt,
      timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const responseText = await generateSahmResponse(prompt, messages, aiSettings);

      const assistantMsg: ChatMessage = {
        id: `sahm_${Date.now()}`,
        sender: "assistant",
        text: responseText,
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: "assistant",
        text: `عذراً، تعذر الاتصال بالـ API: ${err?.message || "يرجى التحقق من المفتاح"}.`,
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `msg_welcome_${Date.now()}`,
        sender: "assistant",
        text: "أهلاً بك مجدداً يا بطل! أنا جاهز لبدء محادثة جديدة معك ومساعدتك في أي سؤال دراسي أو فقهي 🎯.",
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const [isFullscreenActive, setIsFullscreenActive] = useState(false);

  useEffect(() => {
    const checkFullscreen = () => {
      if (typeof document !== "undefined") {
        setIsFullscreenActive(document.body.classList.contains("mindmap-fullscreen-active"));
      }
    };
    checkFullscreen();
    const observer = new MutationObserver(checkFullscreen);
    if (typeof document !== "undefined") {
      observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    }
    return () => observer.disconnect();
  }, []);

  if (isFullscreenActive) return null;

  return (
    <>
      {/* Floating Side Button anchored on the RIGHT side */}
      <div className="fixed right-0 top-1/2 z-50 -translate-y-1/2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="group flex items-center gap-2 rounded-l-2xl bg-[#f97316] hover:bg-[#e06305] px-4 py-3.5 text-white shadow-xl transition-all cursor-pointer border-y border-l border-[#ffdbca]"
          title="افتح المساعد الشخصي سهم 🎯"
        >
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-xs rotate-3">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div className="flex items-center gap-1.5 font-extrabold text-xs">
            <span>سهم 🎯</span>
          </div>
          <ChevronLeft
            className={`h-4 w-4 text-orange-100 transition-transform ${isOpen ? "" : "rotate-180"}`}
          />
        </button>
      </div>

      {/* Slide-over Drawer Panel on the RIGHT side */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in"
          dir="rtl"
        >
          <div className="relative w-full max-w-sm h-full bg-[#eff4ff] shadow-2xl flex flex-col text-right dir-rtl border-r border-[#e0c0b1]">
            {/* AI Drawer Header (Exact Match to Image) */}
            <div className="p-6 border-b border-[#e0c0b1]/50 bg-white space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#f97316] flex items-center justify-center text-white shadow-lg rotate-3">
                    <Bot className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#0b1c30] leading-tight">
                      المساعد "سهم"
                    </h3>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span
                        className={`w-2 w-2 h-2 rounded-full ${hasApiKey ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`}
                      />
                      <span className="text-[11px] font-bold text-slate-500">
                        {hasApiKey ? "مستعد للمساعدة 🟢" : "مفتوح (أدخل المفتاح)"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowSettingsDialog(true)}
                    className="p-2 hover:bg-[#eff4ff] text-slate-500 rounded-full transition cursor-pointer"
                    title="إعدادات الـ API والمزود"
                  >
                    <SettingsIcon className="h-4.5 w-4.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-[#eff4ff] text-slate-500 rounded-full transition cursor-pointer"
                    title="إغلاق"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Start New Conversation Primary Button */}
              <button
                type="button"
                onClick={handleResetChat}
                className="w-full bg-[#9c48ea] hover:bg-[#8127cf] text-white p-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                <span>بدء محادثة جديدة</span>
              </button>
            </div>

            {/* Provider Status Indicator */}
            <div className="bg-[#eff4ff] border-b border-[#e0c0b1]/40 px-5 py-2.5 text-xs font-bold text-[#0b1c30] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowStatusDetails(!showStatusDetails)}
                className="flex items-center gap-1.5 text-slate-600 hover:text-[#0b1c30] cursor-pointer"
              >
                <Cpu className="h-4 w-4 text-[#f97316]" />
                <span>المزود: {providerNames[aiSettings.provider] || "NVIDIA NIM"}</span>
                {showStatusDetails ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowSettingsDialog(true)}
                className="text-[10px] font-extrabold text-[#9d4300] bg-[#ffdbca] px-2.5 py-0.5 rounded-full border border-[#e0c0b1]/50 hover:bg-[#f97316] hover:text-white transition"
              >
                ⚙️ إعدادات API
              </button>
            </div>

            {showStatusDetails && (
              <div className="bg-white p-3 text-[11px] font-semibold text-[#0b1c30] border-b border-[#e0c0b1]/40 space-y-1">
                <p>
                  النموذج:{" "}
                  <code className="font-mono bg-[#eff4ff] px-1.5 py-0.5 rounded text-[#9d4300]">
                    {aiSettings.modelName}
                  </code>
                </p>
                <p>مفتاح API: {hasApiKey ? "مكتمل ومحفوظ 🔑" : "غير محدد ⚠️"}</p>
              </div>
            )}

            {!hasApiKey && (
              <div className="bg-amber-50 p-4 border-b border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-amber-950">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span>تنبيه: مفتاح الـ API غير مفعل</span>
                </div>
                <p className="text-[11px] font-semibold text-amber-900 leading-relaxed">
                  قم بإدخال واختبار المفتاح في الإعدادات للحصول على إجابات حية من النموذج الذكي.
                </p>
                <button
                  type="button"
                  onClick={() => setShowSettingsDialog(true)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#f97316] py-2 text-xs font-bold text-white hover:bg-[#e06305] transition cursor-pointer"
                >
                  <Zap className="h-4 w-4" />
                  <span>إدخال واختبار المفتاح حياً</span>
                </button>
              </div>
            )}

            {/* Interactive Chat Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#eff4ff]/60">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${
                    msg.sender === "user" ? "items-start" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl p-4 text-xs font-semibold leading-relaxed shadow-2xs border ${
                      msg.sender === "user"
                        ? "bg-[#9c48ea] text-white border-[#9c48ea]"
                        : "bg-white text-[#0b1c30] border-[#e0c0b1]/50"
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 mr-2 pt-1">{msg.timestamp}</span>
                </motion.div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-xs font-bold text-[#9d4300] bg-white p-3 rounded-2xl border border-[#e0c0b1]/40 w-fit">
                  <Sparkles className="h-4 w-4 text-[#f97316] animate-spin" />
                  <span>سهم يستجوب النموذج ويكتب الإجابة... ✍️</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Suggestion Chips (Matches Image) */}
            <div className="p-3 bg-white border-t border-[#e0c0b1]/30">
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSendMessage("لخص لي الدرس")}
                  className="px-3 py-1.5 bg-[#eff4ff] border border-[#e0c0b1]/50 rounded-full text-[11px] font-bold text-[#0b1c30] hover:border-[#f97316] hover:text-[#f97316] transition cursor-pointer"
                >
                  لخص لي الدرس
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage("اختبرني")}
                  className="px-3 py-1.5 bg-[#eff4ff] border border-[#e0c0b1]/50 rounded-full text-[11px] font-bold text-[#0b1c30] hover:border-[#f97316] hover:text-[#f97316] transition cursor-pointer"
                >
                  اختبرني
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage("ما هي مبطلات الصيام؟")}
                  className="px-3 py-1.5 bg-[#eff4ff] border border-[#e0c0b1]/50 rounded-full text-[11px] font-bold text-[#0b1c30] hover:border-[#f97316] hover:text-[#f97316] transition cursor-pointer"
                >
                  ما هي مبطلات الصيام؟
                </button>
              </div>
            </div>

            {/* Input Area with Orange Send Button (Matches Image) */}
            <div className="p-4 bg-white border-t border-[#e0c0b1]/40">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="اكتب سؤالك للمساعد سهم هنا..."
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#e0c0b1] rounded-xl focus:ring-2 focus:ring-[#f97316] focus:border-transparent outline-none transition font-semibold text-xs text-[#0b1c30]"
                />
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isTyping}
                  className="absolute left-2 w-9 h-9 bg-[#f97316] text-white rounded-lg flex items-center justify-center hover:scale-95 transition cursor-pointer disabled:opacity-40"
                >
                  <Send className="h-4 w-4 rotate-180" />
                </button>
              </div>
              <p className="mt-2 text-center text-[10px] text-slate-400 font-semibold">
                تجربة أسئلة حية مدعومة بـ NVIDIA NIM
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Settings Dialog when opened from Sahm */}
      <SettingsDialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog} />
    </>
  );
}
