import { useState } from "react";
import {motion} from "framer-motion";
import {
  X,
  Upload,
  Download,
  Copy,
  Check,
  FileSpreadsheet,
  Sparkles,
} from "lucide-react";
import { downloadCSVFile, exportCardsToCSV, parseCSVToSmartCards } from "@/lib/csv-flashcards";
import type { SmartFlashcard } from "@/lib/spaced-repetition";
import { toast } from "sonner";

export function CSVImportExportModal({
  isOpen,
  onClose,
  cards = [],
  onImportCards,
}: {
  isOpen: boolean;
  onClose: () => void;
  cards?: SmartFlashcard[];
  onImportCards: (newCards: SmartFlashcard[]) => void;
}) {
  const [tab, setTab] = useState<"import" | "export">("import");
  const [rawCsvInput, setRawCsvInput] = useState("");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        const parsed = parseCSVToSmartCards(text);
        if (parsed.length > 0) {
          onImportCards(parsed);
          toast.success(`تم استيراد ${parsed.length} كارت فلاش كارد بنجاح! 🎉`);
          onClose();
        } else {
          toast.error("لم يتم العثور على كروت صالحة في ملف الـ CSV.");
        }
      }
    };
    reader.readAsText(file);
  };

  const handleManualImport = () => {
    if (!rawCsvInput.trim()) {
      toast.error("يرجى لصق نص كود الـ CSV أولاً.");
      return;
    }

    const parsed = parseCSVToSmartCards(rawCsvInput);
    if (parsed.length > 0) {
      onImportCards(parsed);
      toast.success(`تم استيراد ${parsed.length} كارت بنجاح! 🚀`);
      setRawCsvInput("");
      onClose();
    } else {
      toast.error("صيغة الـ CSV غير صالحة. يرجى مراجعة الهيكل القياسي.");
    }
  };

  const generatedExportCsv = exportCardsToCSV(cards);

  const handleCopyExport = () => {
    navigator.clipboard.writeText(generatedExportCsv);
    setCopied(true);
    toast.success("تم نسخ نص الـ CSV إلى الحافظة! 📋");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadExport = () => {
    downloadCSVFile(generatedExportCsv, "nafath_flashcards.csv");
    toast.success("تم بدء تحميل ملف nafath_flashcards.csv 📥");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs dir-rtl text-right"
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5 text-slate-900 font-black text-lg">
            <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
            <span>استيراد وتصدير ملفات الفلاش كاردز (CSV) 📥📤</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 rounded-2xl bg-slate-100 p-1.5">
          <button
            type="button"
            onClick={() => setTab("import")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              tab === "import"
                ? "bg-white text-emerald-950 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Upload className="h-4 w-4 text-emerald-600" />
            <span>📥 استيراد كروت جديدة (CSV Import)</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("export")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              tab === "export"
                ? "bg-white text-blue-950 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Download className="h-4 w-4 text-blue-600" />
            <span>📤 تصدير الكروت الحالية (CSV Export)</span>
          </button>
        </div>

        {/* Import Tab Content */}
        {tab === "import" && (
          <div className="space-y-5">
            {/* File Upload Box */}
            <div className="rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-6 text-center space-y-3">
              <Upload className="mx-auto h-8 w-8 text-emerald-600" />
              <div className="space-y-1">
                <p className="text-xs font-black text-emerald-950">
                  رفع ملف Excel أو CSV جاهز من جهازك
                </p>
                <p className="text-[11px] font-semibold text-emerald-700">
                  يجب أن يحتوي الملف على رأس الأعمدة القياسي المطلوب.
                </p>
              </div>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-file-upload"
              />
              <label
                htmlFor="csv-file-upload"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>اختر ملف CSV...</span>
              </label>
            </div>

            {/* CSV Schema Help Card */}
            <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200 space-y-2 text-xs font-semibold text-amber-950">
              <div className="flex items-center gap-1.5 font-extrabold text-amber-900">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <span>الهيكل القياسي لملف الـ CSV (Schema):</span>
              </div>
              <p className="font-mono text-[11px] bg-white p-2 rounded border border-amber-200 dir-ltr text-left overflow-x-auto">
                Category,Question,ModelAnswer,Keywords,Mnemonic,KeywordCues
              </p>
              <p className="text-[10px] text-amber-800">
                الأقسام المتاحة: <code>reasoning</code> (علل) | <code>rulings</code> (أحكام) |{" "}
                <code>evidence</code> (أدلة) | <code>definition</code> (تعريفات) |{" "}
                <code>issue</code> (مسائل) | <code>summary</code> (خلاصة).
              </p>
            </div>

            {/* Manual Paste Textarea */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800">
                أو قم بلصق نص الـ CSV مباشرة هنا:
              </label>
              <textarea
                value={rawCsvInput}
                onChange={(e) => setRawCsvInput(e.target.value)}
                rows={4}
                placeholder="Category,Question,ModelAnswer,Keywords,Mnemonic,KeywordCues&#10;reasoning,علل: طلاق السكران يقع؟,يقع تغليظاً عليه.,تغليظاً|عقوبة,السكران بيلبس طلاقه,تـ...|عـ..."
                className="w-full rounded-2xl border border-slate-300 p-4 text-xs font-mono leading-relaxed text-slate-900 shadow-inner focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
              />
              <button
                type="button"
                onClick={handleManualImport}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                <span>معالجة واستيراد الكروت الملتصقة 🚀</span>
              </button>
            </div>
          </div>
        )}

        {/* Export Tab Content */}
        {tab === "export" && (
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  معاينة كود الـ CSV للكروت الحالية ({cards.length} كارت):
                </span>
                <button
                  type="button"
                  onClick={handleCopyExport}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-900 border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-blue-600" />
                  )}
                  <span>{copied ? "تم النسخ!" : "نسخ الكود"}</span>
                </button>
              </div>

              <textarea
                readOnly
                value={generatedExportCsv}
                rows={6}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 p-4 text-xs font-mono leading-relaxed text-slate-800 shadow-inner outline-none select-all"
              />
            </div>

            {/* Download CSV File Action */}
            <button
              type="button"
              onClick={handleDownloadExport}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-blue-700 transition cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>تحميل ملف CSV جاهز للإكسيل (nafath_flashcards.csv) 📥</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
