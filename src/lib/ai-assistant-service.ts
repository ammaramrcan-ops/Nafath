import type { AiSettings } from "./ai-settings";

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

/**
 * Universal AI API Engine with Precise Error Diagnosis
 */
export async function generateSahmResponse(
  userPrompt: string,
  history: ChatMessage[],
  aiSettings: AiSettings,
): Promise<string> {
  const result = await callAiProviderApi(userPrompt, history, aiSettings);
  if (result.ok) {
    return result.text;
  }
  return `🔴 **فشل الاتصال بالذكاء الاصطناعي:**\n${result.error}\n\nيرجى مراجعة الإعدادات ⚙️ وتجربة مفتاح الـ API.`;
}

/**
 * Live API Test Function: Sends test query ("5 * 5") and returns real model response or exact raw error
 */
export async function testAiConnection(aiSettings: AiSettings): Promise<{
  ok: boolean;
  text: string;
  error?: string;
}> {
  return callAiProviderApi(
    "كم نتيجة 5 * 5؟ أجب بالنتيجة المباشرة فقط في سطر واحد.",
    [],
    aiSettings,
  );
}

/**
 * Universal Provider Fetcher with Exact Detailed Error Capture
 */
async function callAiProviderApi(
  userPrompt: string,
  history: ChatMessage[],
  aiSettings: AiSettings,
): Promise<{ ok: boolean; text: string; error?: string }> {
  const apiKey = (aiSettings.apiKey || "").trim();
  const provider = aiSettings.provider || "nvidia_nim";
  let modelName = (aiSettings.modelName || "").trim();
  let baseUrl = (aiSettings.baseUrl || "").trim().replace(/\/+$/, "");

  if (!apiKey) {
    return {
      ok: false,
      text: "",
      error: "❌ السبب: مفتاح الـ API فارغ تماماً. يرجى إدخال المفتاح في الإعدادات ⚙️.",
    };
  }

  // Determine Target URL
  let targetUrl = "";
  let headers: Record<string, string> = {};
  let requestBody: any = {};

  if (provider === "google_gemini" || baseUrl.includes("generativelanguage.googleapis.com")) {
    if (!modelName) modelName = "gemini-1.5-flash";
    targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    headers = { "Content-Type": "application/json" };
    requestBody = {
      contents: [
        {
          parts: [
            {
              text: `أنت المساعد الذكي 'سهم' 🏹 في منصة نفاذ للتعلم التكيفي. أجب بدقة ولطف على التالي: ${userPrompt}`,
            },
          ],
        },
      ],
    };
  } else if (provider === "nvidia_nim" || baseUrl.includes("nvidia.com")) {
    if (!baseUrl) baseUrl = "https://integrate.api.nvidia.com/v1";
    if (!modelName) modelName = "meta/llama-3.1-70b-instruct";
    targetUrl = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;
    headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    };
    requestBody = {
      model: modelName,
      messages: [
        {
          role: "system",
          content:
            "أنت المساعد الذكي 'سهم' 🏹 في منصة نفاذ للتعلم التكيفي. تجيب بدقة باللغة العربية.",
        },
        ...history
          .filter((m) => !m.text.includes("فشل الاتصال"))
          .map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text,
          })),
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 800,
    };
  } else {
    // OpenAI / Groq / OpenRouter / Custom
    if (!baseUrl) baseUrl = "https://api.openai.com/v1";
    targetUrl = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;
    headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };
    requestBody = {
      model: modelName || "gpt-4o-mini",
      messages: [
        { role: "system", content: "أنت المساعد الذكي 'سهم' 🏹 في منصة نفاذ." },
        ...history
          .filter((m) => !m.text.includes("فشل الاتصال"))
          .map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text,
          })),
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
    };
  }

  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      let parsedMsg = errText;
      try {
        const json = JSON.parse(errText);
        parsedMsg = json.error?.message || json.detail || json.message || errText;
      } catch {
        /* use raw text */
      }

      return {
        ok: false,
        text: "",
        error: `❌ **نوع الخطأ بالظبط:** HTTP ${res.status} (${res.statusText || "Error"})\n📍 **الرابط المستهدف:** \`${targetUrl.split("?")[0]}\`\n🤖 **النموذج:** \`${modelName}\`\n💬 **رسالة السيرفر:** "${parsedMsg.slice(0, 300)}"`,
      };
    }

    const data = await res.json();
    let text = "";

    if (provider === "google_gemini" || baseUrl.includes("generativelanguage.googleapis.com")) {
      text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      text = data?.choices?.[0]?.message?.content || "";
    }

    if (!text || !text.trim()) {
      return {
        ok: false,
        text: "",
        error: `⚠️ **الخطأ بالظبط:** استجابة فارغة (Empty Completion) من الخادم \`${targetUrl.split("?")[0]}\`.`,
      };
    }

    return { ok: true, text: text.trim() };
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    const isCorsOrFetch = errorMsg.includes("Failed to fetch") || errorMsg.includes("NetworkError");

    return {
      ok: false,
      text: "",
      error: `❌ **نوع الخطأ بالظبط:** ${errorMsg}\n📍 **الرابط المستهدف:** \`${targetUrl.split("?")[0]}\`\n⚡ **المزود والنموذج:** \`${provider}\` / \`${modelName}\`\n🔍 **التشخيص:** ${
        isCorsOrFetch
          ? "تعذر على المتصفح الوصول للرابط (CORS / الشبكة). تأكد من صحة الرابط ومفتاح الـ API، أو جرب مزود Google Gemini."
          : "خطأ استدعاء غير متوقع."
      }`,
    };
  }
}
