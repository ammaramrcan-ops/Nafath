import { useState } from "react";
import { Settings as SettingsIcon, ArrowUp, ArrowDown, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSettings, STAGE_LABELS, type Stage } from "@/lib/settings";

export function SettingsButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { settings, update, reset } = useSettings();

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...settings.stageOrder];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    update({ stageOrder: next });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className={
            className ??
            "inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground/80 transition hover:border-brand/50 hover:text-foreground"
          }
        >
          <SettingsIcon className="h-4 w-4" />
          الإعدادات
        </button>
      </DialogTrigger>

      <DialogContent dir="rtl" className="max-w-lg rounded-3xl">
        <DialogHeader className="text-right">
          <DialogTitle className="text-lg">إعدادات تسلسل الدرس</DialogTitle>
          <DialogDescription>
            رتّب مراحل عرض كل فقرة بالترتيب الذي يناسبك. على سبيل المثال، يمكنك بدء كل فقرة بالقصة (الأمثلة) قبل الجملة المبسطة.
          </DialogDescription>
        </DialogHeader>

        <ol className="mt-2 space-y-2">
          {settings.stageOrder.map((stage, idx) => (
            <li
              key={stage}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">
                  {idx + 1}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {STAGE_LABELS[stage as Stage]}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  className="rounded-lg p-2 text-foreground/60 hover:bg-muted disabled:opacity-30"
                  aria-label="إلى الأعلى"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => move(idx, 1)}
                  disabled={idx === settings.stageOrder.length - 1}
                  className="rounded-lg p-2 text-foreground/60 hover:bg-muted disabled:opacity-30"
                  aria-label="إلى الأسفل"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ol>

        <DialogFooter className="sm:justify-between">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground/70 hover:border-brand/40"
          >
            <RotateCcw className="h-4 w-4" />
            استعادة الافتراضي
          </button>
          <button
            onClick={() => setOpen(false)}
            className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
          >
            تم
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
