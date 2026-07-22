import { useMemo } from "react";
import { BookOpen, HelpCircle, Lightbulb, Sparkles } from "lucide-react";
import { type Lesson, effectiveStages } from "@/lib/lesson-data";
import { useSettings } from "@/lib/settings";

export function CheatSheet({ lesson }: { lesson: Lesson }) {
  const { settings } = useSettings();

  const definitions = useMemo(() => {
    return lesson.blocks.flatMap((b) => {
      const words = b.hard_words.map((w) => ({ ...w, blockTitle: b.title }));
      if (b.zaitouna?.definitions) {
        words.unshift({
          word: "مفهوم البند الرئيسي",
          meaning: b.zaitouna.definitions,
          blockTitle: b.title,
        });
      }
      return words;
    });
  }, [lesson]);

  const essays = useMemo(() => {
    return lesson.blocks.flatMap((b) => {
      const list = (b.quizzes?.essays ?? [])
        .filter((e) => e.question?.trim())
        .map((e) => ({
          blockTitle: b.title,
          question: e.question,
          keywords: e.keywords ?? [],
        }));

      if (b.zaitouna?.reasoning && list.length === 0) {
        list.push({
          blockTitle: b.title,
          question: `علّل: ${b.zaitouna.reasoning}`,
          keywords: ["#تعليل", "#فهم", "#تكامل"],
        });
      }
      return list;
    });
  }, [lesson]);

  const explanations = useMemo(() => {
    return lesson.blocks
      .map((b) => {
        const hasContent =
          b.short_sentence ||
          b.mnemonic ||
          b.funny_link ||
          (b.zaitouna?.definitions || b.zaitouna?.reasoning || b.zaitouna?.links);

        if (!hasContent) return null;

        return {
          blockTitle: b.title,
          short: b.short_sentence || b.zaitouna?.definitions || "",
          mnemonic: b.mnemonic || "قاعدة سريعة لترسيخ الفهم المستدام للدرس.",
          funny: b.funny_link || b.zaitouna?.links || "رابط ذكي لربط المفهوم بالواقع والذاكرة.",
          zaitouna: b.zaitouna,
        };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);
  }, [lesson]);

  return (
    <section className="space-y-12 text-right dir-rtl" dir="rtl">
      {/* Zaitouna Header Section */}
      <div className="text-center space-y-3">
        <div className="w-12 h-12 bg-[#eff4ff] border border-[#e0c0b1]/50 rounded-2xl flex items-center justify-center mx-auto shadow-2xs text-[#9d4300]">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#0b1c30]">
          الزيتونة والملخص الشامل
        </h2>
        <p className="text-xs sm:text-sm font-semibold text-slate-500 max-w-2xl mx-auto">
          ملخص شامل لأهم ما ورد في الدرس — التعاريف، أسئلة علّل، والتفسيرات والروابط الذكية
        </p>
      </div>

      {/* Section 1: Definitions Bento Grid (أهم التعريفات) */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-[#e0c0b1]/40 pb-3">
          <BookOpen className="h-5 w-5 text-[#8127cf]" />
          <h3 className="text-base sm:text-lg font-black text-[#0b1c30]">أهم التعريفات المفتاحية</h3>
          <span className="mr-auto text-xs font-bold text-slate-400">
            {definitions.length} تعريفات
          </span>
        </div>

        {definitions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {definitions.map((d, i) => (
              <div
                key={`${d.word}-${i}`}
                className="zen-card bg-[#eff4ff] p-6 rounded-3xl border border-[#e0c0b1]/40 shadow-2xs space-y-2 hover:-translate-y-1 transition"
              >
                <span className="text-[11px] font-extrabold text-[#8127cf] block">
                  {d.blockTitle}
                </span>
                <h4 className="text-sm font-extrabold text-[#0b1c30]">{d.word}</h4>
                <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                  {d.meaning}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#eff4ff] p-6 rounded-3xl text-center text-xs font-bold text-slate-500">
            جميع التعريفات محددة ومحفوظة بنجاح.
          </div>
        )}
      </div>

      {/* Section 2: Rationales (أسئلة علّل) */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-[#e0c0b1]/40 pb-3">
          <HelpCircle className="h-5 w-5 text-[#8127cf]" />
          <h3 className="text-base sm:text-lg font-black text-[#0b1c30]">أسئلة علّل واسترجاع المفاهيم</h3>
          <span className="mr-auto text-xs font-bold text-slate-400">
            {essays.length} أسئلة
          </span>
        </div>

        {essays.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {essays.map((e, i) => (
              <div
                key={i}
                className="zen-card bg-white p-6 rounded-3xl border border-[#e0c0b1]/40 shadow-2xs space-y-4"
              >
                <span className="text-[11px] font-bold text-slate-400 block">{e.blockTitle}</span>
                <h4 className="text-xs sm:text-sm font-extrabold text-[#0b1c30] leading-relaxed">
                  {e.question}
                </h4>
                {e.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {e.keywords.map((k) => (
                      <span
                        key={k}
                        className="px-3.5 py-1 bg-[#eff4ff] rounded-full text-[11px] font-bold text-[#0b1c30]"
                      >
                        {k.startsWith("#") ? k : `#${k}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-3xl border border-[#e0c0b1]/40 text-center text-xs font-bold text-slate-500">
            جميع أسئلة علّل مستوعبة بالكامل.
          </div>
        )}
      </div>

      {/* Section 3: Smart Explanations & Links (التفسيرات والروابط الذكية) */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-[#e0c0b1]/40 pb-3">
          <Lightbulb className="h-5 w-5 text-[#8127cf]" />
          <h3 className="text-base sm:text-lg font-black text-[#0b1c30]">التفسيرات والروابط الذكية</h3>
          <span className="mr-auto text-xs font-bold text-slate-400">
            {explanations.length} قواعد ذكية
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {explanations.map((e, i) => (
            <div
              key={i}
              className="zen-card bg-[#fffbf9] p-7 rounded-3xl border border-[#ffdbca] space-y-4 shadow-2xs"
            >
              <span className="text-[11px] font-extrabold text-[#9d4300] block">{e.blockTitle}</span>
              <h4 className="text-xs sm:text-sm font-bold text-[#0b1c30] leading-relaxed">
                {e.short || "الخلاصة التراكمية للمفهوم والفهم الفقهي والربط بالواقع."}
              </h4>
              <div className="grid grid-cols-1 gap-3 pt-2">
                <div className="bg-white p-4 rounded-2xl border-r-4 border-[#9d4300] shadow-2xs">
                  <span className="text-[11px] font-black text-[#9d4300] block mb-1">📌 قاعدة سريعة:</span>
                  <p className="text-xs font-bold text-slate-700">{e.mnemonic}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border-r-4 border-[#8127cf] shadow-2xs">
                  <span className="text-[11px] font-black text-[#8127cf] block mb-1">💡 رابط ظريف للذاكرة:</span>
                  <p className="text-xs font-bold text-slate-700">{e.funny}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CheatBlock({
  icon,
  title,
  count,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zen-surface-low text-zen-primary">
          {icon}
        </span>
        <h3 className="text-[16px] font-medium text-zen-on-surface">{title}</h3>
        <span className="text-[11px] font-light text-zen-on-surface-variant">{count}</span>
      </div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl bg-zen-surface-low p-5 text-center text-[13px] font-light text-zen-on-surface-variant">
      {children}
    </p>
  );
}
