import { useRef } from "react";
import { Sparkles, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export function EditableTextWithHighlight({
  value,
  onChange,
  rows = 3,
  placeholder = "",
}: {
  readonly value: string;
  readonly onChange: (val: string) => void;
  readonly rows?: number;
  readonly placeholder?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wrapSelection = (tag: "yellow" | "green") => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;

    if (start === undefined || end === undefined || start === end) {
      alert("يرجى تحديد كلمة أو جملة داخل صندوق النص أولاً ثم النقر على زر التظليل.");
      return;
    }

    const selectedText = value.substring(start, end);
    const wrapped = `<${tag}>${selectedText}</${tag}>`;
    const nextVal = value.substring(0, start) + wrapped + value.substring(end);

    onChange(nextVal);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start, start + wrapped.length);
    }, 50);
  };

  const removeAllTags = () => {
    const cleaned = value.replace(/<\/?(?:yellow|green|mark)[^>]*>/gi, "");
    onChange(cleaned);
  };

  return (
    <div className="space-y-2">
      <Textarea
        ref={textareaRef}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="font-sans text-sm leading-relaxed rounded-2xl border-zen-surface-container bg-white shadow-none focus-visible:ring-zen-primary"
      />

      {/* 2 Color Highlight Buttons Placed Underneath the Text Box in Teacher Mode */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zen-surface-container/60">
        <span className="text-[11px] font-bold text-zen-on-surface-variant flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5 text-amber-600" />
          تظليل الكلمة المحددة:
        </span>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            wrapSelection("yellow");
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-950 border border-amber-300 hover:bg-amber-200 transition cursor-pointer shadow-sm"
          title="تظليل النص المحدد باللون الأصفر"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          تظليل أصفر 🟡
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            wrapSelection("green");
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-950 border border-emerald-300 hover:bg-emerald-200 transition cursor-pointer shadow-sm"
          title="تظليل النص المحدد باللون الأخضر"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          تظليل أخضر 🟢
        </button>

        {/<\/?(?:yellow|green|mark)/i.test(value) && (
          <button
            type="button"
            onClick={removeAllTags}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 hover:text-rose-900 border border-rose-200 rounded-full px-2.5 py-0.5 mr-auto cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
            إزالة التظليلات
          </button>
        )}
      </div>
    </div>
  );
}
