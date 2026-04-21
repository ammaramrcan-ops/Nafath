import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wind } from "lucide-react";

export function BreathingBreak({
  onComplete,
  showSkip = false,
  duration = 60,
}: {
  onComplete: () => void;
  showSkip?: boolean;
  duration?: number;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [canSkip, setCanSkip] = useState(showSkip);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= duration) {
          clearInterval(timer);
          onComplete();
          return duration;
        }
        if (next >= 10) {
          setCanSkip(true);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [duration, onComplete]);

  const breatheScale = 0.5 + 0.5 * (0.5 + 0.5 * Math.sin((elapsed / 4) * Math.PI));

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 px-6 py-12 text-center">
      {/* Breathing Circle */}
      <motion.div
        animate={{ scale: breatheScale }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="h-32 w-32 rounded-full border-4 border-brand/40 bg-brand-soft"
      />

      {/* Text */}
      <div className="max-w-md space-y-4">
        <div className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-soft px-4 py-2">
          <Wind className="h-4 w-4 text-brand" />
          <span className="text-sm font-semibold text-brand">فاصل التنفس</span>
        </div>

        <p className="text-2xl font-bold text-foreground">
          خذ نفساً عميقاً 🌬️
        </p>
        <p className="leading-relaxed text-foreground/70">
          خذ نفساً عميقاً لتثبيت المعلومات في الذاكرة قبل المتابعة مع الفقرة التالية
        </p>

        {/* Progress */}
        <div className="space-y-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: `${(elapsed / duration) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-brand/60"
            />
          </div>
          <p className="text-xs text-foreground/40">
            {Math.max(0, duration - elapsed)} ثانية
          </p>
        </div>
      </div>

      {/* Skip Button */}
      {canSkip && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onComplete}
          className="rounded-full border-2 border-border px-6 py-3 text-sm font-semibold text-foreground transition hover:border-brand/40 hover:bg-muted"
        >
          تخطي الآن
        </motion.button>
      )}
    </div>
  );
}
