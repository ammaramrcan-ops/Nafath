import { useState } from "react";
import { Settings as SettingsIcon, ArrowUp, ArrowDown, RotateCcw, Brain } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useSettings,
  STAGE_LABELS,
  buildPauseKey,
  type Stage,
} from "@/lib/settings";

/** تحويل الثواني إلى نص مقروء */
function formatSeconds(s: number): string {
  if (s === 0) return "بدون فاصل";
  if (s < 60) return `${s} ثانية`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r > 0 ? `${m} د ${r} ث` : `${m} دقيقة`;
}

/** أزرار الضبط السريع للمدة */
const QUICK_DURATIONS = [0, 3, 5, 10, 15, 20, 30, 60];

export function SettingsButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { settings, update, reset } = useSettings();

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...settings.stageOrder];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    // Rebuild pause durations keys to match new order
    update({ stageOrder: next });
  };

  const setPause = (from: Stage, to: Stage, value: number) => {
    const key = buildPauseKey(from, to);
    update({
      stagePauseDurations: {
        ...settings.stagePauseDurations,
        [key]: value,
      },
    });
  };

  const getPause = (from: Stage, to: Stage): number => {
    const key = buildPauseKey(from, to);
    return settings.stagePauseDurations[key] ?? 0;
  };

  // Build adjacent pairs from current stageOrder
  const pairs: Array<{ from: Stage; to: Stage }> = [];
  for (let i = 0; i < settings.stageOrder.length - 1; i++) {
    pairs.push({
      from: settings.stageOrder[i] as Stage,
      to: settings.stageOrder[i + 1] as Stage,
    });
  }

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

      <DialogContent dir="rtl" className="max-w-lg rounded-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="text-right">
          <DialogTitle className="text-lg">إعدادات تسلسل الدرس</DialogTitle>
          <DialogDescription>
            رتّب مراحل عرض كل فقرة، وخصّص الفواصل الذهنية بين الأقسام.
          </DialogDescription>
        </DialogHeader>

        {/* ── قسم ترتيب المراحل ── */}
        <div className="mt-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground/50">
            ترتيب المراحل
          </p>
          <ol className="space-y-2">
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
        </div>

        {/* ── قسم الفواصل الذهنية ── */}
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Brain className="h-4 w-4 text-brand" />
            <p className="text-xs font-bold uppercase tracking-wider text-foreground/50">
              الفواصل الذهنية بين الأقسام
            </p>
          </div>
          <p className="mb-4 text-xs leading-relaxed text-foreground/50">
            حدّد مدة الفاصل الذهني بين كل قسمين. سيظهر وضع Zen لتفريغ الذهن قبل الانتقال.
          </p>

          <div className="space-y-3">
            {pairs.map(({ from, to }) => {
              const current = getPause(from, to);
              return (
                <div
                  key={`${from}→${to}`}
                  className="rounded-2xl border border-border bg-card px-4 py-4"
                >
                  {/* Labels */}
                  <div className="mb-3 flex items-center gap-2 text-sm">
                    <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand">
                      {STAGE_LABELS[from]}
                    </span>
                    <span className="text-foreground/30">←</span>
                    <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">
                      {STAGE_LABELS[to]}
                    </span>
                    <span className="mr-auto text-xs font-semibold text-foreground/60">
                      {formatSeconds(current)}
                    </span>
                  </div>

                  {/* Quick-select buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_DURATIONS.map((d) => (
                      <button
                        key={d}
                        onClick={() => setPause(from, to, d)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                          current === d
                            ? "bg-brand text-brand-foreground shadow-sm"
                            : "bg-muted text-foreground/60 hover:bg-brand-soft hover:text-brand"
                        }`}
                      >
                        {d === 0 ? "لا" : `${d}ث`}
                      </button>
                    ))}
                  </div>

                  {/* Custom slider */}
                  <div className="mt-3 flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={120}
                      step={1}
                      value={current}
                      onChange={(e) => setPause(from, to, Number(e.target.value))}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-brand"
                    />
                    <span className="w-10 text-center text-xs tabular-nums text-foreground/50">
                      {current}ث
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter className="sm:justify-between mt-4">
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