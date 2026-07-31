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

interface ProviderRequestConfig {
  targetUrl: string;
  headers: Record<string, string>;
  requestBody: unknown;
  modelName: string;
}

function buildProviderRequestConfig(
  userPrompt: string,
  history: ChatMessage[],
  aiSettings: AiSettings,
): ProviderRequestConfig {
  const apiKey = (aiSettings.apiKey || "").trim();
  const provider = aiSettings.provider || "nvidia_nim";
  let modelName = (aiSettings.modelName || "").trim();
  const baseUrl = (aiSettings.baseUrl || "").trim().replace(/\/+$/, "");

  if (provider === "google_gemini" || baseUrl.includes("generativelanguage.googleapis.com")) {
    if (!modelName) modelName = "gemini-1.5-flash";
    return {
      modelName,
      targetUrl: `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      headers: { "Content-Type": "application/json" },
      requestBody: {
        contents: [
          {
            parts: [
              {
                text: `أنت المساعد الذكي 'سهم' 🏹 في منصة نفاذ للتعلم التكيفي. أجب بدقة ولطف على التالي: ${userPrompt}`,
              },
            ],
          },
        ],
      },
    };
  }

  const isNvidia = provider === "nvidia_nim" || baseUrl.includes("nvidia.com");
  const defaultUrl = isNvidia ? "https://integrate.api.nvidia.com/v1" : "https://api.openai.com/v1";
  const defaultModel = isNvidia ? "meta/llama-3.1-70b-instruct" : "gpt-4o-mini";
  const resolvedBaseUrl = baseUrl || defaultUrl;
  const resolvedModel = modelName || defaultModel;

  const targetUrl = resolvedBaseUrl.endsWith("/chat/completions")
    ? resolvedBaseUrl
    : `${resolvedBaseUrl}/chat/completions`;

  const systemPrompt = isNvidia
    ? "أنت المساعد الذكي 'سهم' 🏹 في منصة نفاذ للتعلم التكيفي. تجيب بدقة باللغة العربية."
    : "أنت المساعد الذكي 'سهم' 🏹 في منصة نفاذ.";

  return {
    modelName: resolvedModel,
    targetUrl,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(isNvidia ? { Accept: "application/json" } : {}),
    },
    requestBody: {
      model: resolvedModel,
      messages: [
        { role: "system", content: systemPrompt },
        ...history
          .filter((m) => !m.text.includes("فشل الاتصال"))
          .map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text,
          })),
        { role: "user", content: userPrompt },
      ],
      temperature: isNvidia ? 0.6 : 0.7,
      max_tokens: 800,
    },
  };
}

function extractResponseText(data: any, provider: string, baseUrl: string): string {
  if (provider === "google_gemini" || baseUrl.includes("generativelanguage.googleapis.com")) {
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }
  return data?.choices?.[0]?.message?.content || "";
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
  const baseUrl = (aiSettings.baseUrl || "").trim().replace(/\/+$/, "");

  if (!apiKey) {
    return {
      ok: false,
      text: "",
      error: "❌ السبب: مفتاح الـ API فارغ تماماً. يرجى إدخال المفتاح في الإعدادات ⚙️.",
    };
  }

  const { targetUrl, headers, requestBody, modelName } = buildProviderRequestConfig(
    userPrompt,
    history,
    aiSettings,
  );

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
    const text = extractResponseText(data, provider, baseUrl);

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
