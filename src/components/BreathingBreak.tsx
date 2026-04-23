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
        if (next >= 10) setCanSkip(true);
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [duration, onComplete]);

  const breatheScale = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin((elapsed / 4) * Math.PI));

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-[640px] flex-col items-center justify-center gap-10 px-6 py-16 text-center">
      <motion.div
        animate={{ scale: breatheScale }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="h-36 w-36 rounded-full bg-zen-primary-container/60"
      />

      <div className="max-w-md space-y-5">
        <div className="inline-flex items-center justify-center gap-2 rounded-full bg-zen-surface-low px-4 py-1.5">
          <Wind className="h-3.5 w-3.5 text-zen-primary" strokeWidth={1.75} />
          <span className="text-[12px] font-medium tracking-wide text-zen-on-surface-variant">
            فاصل التنفس
          </span>
        </div>

        <p className="text-[28px] font-medium leading-tight text-zen-on-surface">
          خذ نفساً عميقاً
        </p>
        <p className="text-[14px] font-light leading-relaxed text-zen-on-surface-variant">
          استرخِ قليلاً لتثبيت المعلومات قبل المتابعة مع الفقرة التالية
        </p>

        <div className="space-y-2 pt-2">
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-zen-surface-container">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: `${(elapsed / duration) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-zen-primary"
            />
          </div>
          <p className="text-[11px] font-light text-zen-on-surface-variant">
            {Math.max(0, duration - elapsed)} ثانية
          </p>
        </div>
      </div>

      {canSkip && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onComplete}
          className="rounded-full px-6 py-2.5 text-[13px] font-medium text-zen-on-surface-variant transition hover:bg-zen-surface-low"
        >
          تخطي الآن
        </motion.button>
      )}
    </div>
  );
}
