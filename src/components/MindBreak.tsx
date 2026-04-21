import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * MindBreak — شاشة فاصل ذهني بين الأقسام
 * أسلوب Zen Mode: هادئة، بسيطة، تنفسية
 */
export function MindBreak({
  duration,
  fromLabel,
  toLabel,
  onComplete,
}: {
  duration: number;       // بالثواني
  fromLabel: string;      // اسم القسم السابق
  toLabel: string;        // اسم القسم التالي
  onComplete: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"in" | "hold" | "out">("in");

  // Countdown timer
  useEffect(() => {
    if (duration <= 0) {
      onComplete();
      return;
    }
    const timer = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= 3) setCanSkip(true);
        if (next >= duration) {
          clearInterval(timer);
          onComplete();
          return duration;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [duration, onComplete]);

  // Breathing cycle: 4s in → 2s hold → 4s out → repeat
  useEffect(() => {
    const cycle = [
      { phase: "in" as const, ms: 4000 },
      { phase: "hold" as const, ms: 2000 },
      { phase: "out" as const, ms: 4000 },
    ];
    let stepIndex = 0;
    let timeout: ReturnType<typeof setTimeout>;

    function next() {
      const { phase, ms } = cycle[stepIndex % cycle.length];
      setBreathPhase(phase);
      stepIndex++;
      timeout = setTimeout(next, ms);
    }

    next();
    return () => clearTimeout(timeout);
  }, []);

  const remaining = Math.max(0, duration - elapsed);
  const progress = duration > 0 ? elapsed / duration : 1;

  const breathLabel =
    breathPhase === "in"
      ? "استنشق..."
      : breathPhase === "hold"
        ? "احبس..."
        : "أخرج...";

  const circleScale =
    breathPhase === "in" ? 1.35 : breathPhase === "hold" ? 1.35 : 0.75;

  return (
    <motion.div
      key="mind-break"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 50% 60%, oklch(0.18 0.03 250) 0%, oklch(0.11 0.02 260) 100%)",
      }}
    >
      {/* Ambient floating particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${4 + (i % 4) * 3}px`,
              height: `${4 + (i % 4) * 3}px`,
              left: `${8 + i * 7.5}%`,
              top: `${15 + ((i * 17) % 70)}%`,
              background: `oklch(0.65 0.12 ${210 + i * 8} / 0.18)`,
            }}
            animate={{
              y: [0, -18, 0],
              opacity: [0.18, 0.45, 0.18],
            }}
            transition={{
              duration: 5 + (i % 3),
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative flex flex-col items-center gap-10 px-8 text-center">

        {/* Transition label */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex items-center gap-3"
        >
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              background: "oklch(0.65 0.12 230 / 0.18)",
              color: "oklch(0.75 0.12 230)",
              border: "1px solid oklch(0.65 0.12 230 / 0.3)",
            }}
          >
            {fromLabel}
          </span>
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ color: "oklch(0.55 0.06 250)" }}
          >
            ←
          </motion.span>
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              background: "oklch(0.7 0.13 160 / 0.18)",
              color: "oklch(0.75 0.13 160)",
              border: "1px solid oklch(0.7 0.13 160 / 0.3)",
            }}
          >
            {toLabel}
          </span>
        </motion.div>

        {/* Breathing circle */}
        <div className="relative flex items-center justify-center">
          {/* Outer glow ring */}
          <motion.div
            animate={{ scale: circleScale, opacity: breathPhase === "hold" ? 0.6 : 0.25 }}
            transition={{
              duration: breathPhase === "in" ? 4 : breathPhase === "hold" ? 2 : 4,
              ease: "easeInOut",
            }}
            className="absolute rounded-full"
            style={{
              width: "220px",
              height: "220px",
              background:
                "radial-gradient(circle, oklch(0.65 0.15 230 / 0.12) 0%, transparent 70%)",
              border: "1px solid oklch(0.65 0.12 230 / 0.2)",
            }}
          />

          {/* Middle ring */}
          <motion.div
            animate={{ scale: circleScale }}
            transition={{
              duration: breathPhase === "in" ? 4 : breathPhase === "hold" ? 2 : 4,
              ease: "easeInOut",
            }}
            className="absolute rounded-full"
            style={{
              width: "160px",
              height: "160px",
              border: "1.5px solid oklch(0.65 0.12 230 / 0.35)",
            }}
          />

          {/* Inner filled circle */}
          <motion.div
            animate={{ scale: circleScale }}
            transition={{
              duration: breathPhase === "in" ? 4 : breathPhase === "hold" ? 2 : 4,
              ease: "easeInOut",
            }}
            className="relative flex items-center justify-center rounded-full"
            style={{
              width: "110px",
              height: "110px",
              background:
                "radial-gradient(circle at 40% 35%, oklch(0.32 0.06 240), oklch(0.20 0.04 255))",
              boxShadow:
                "0 0 40px oklch(0.65 0.15 230 / 0.2), inset 0 1px 0 oklch(1 0 0 / 0.07)",
            }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={breathPhase}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.4 }}
                className="text-sm font-light tracking-widest"
                style={{ color: "oklch(0.75 0.08 240)" }}
              >
                {breathLabel}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="space-y-2"
        >
          <h2
            className="text-2xl font-light tracking-wide"
            style={{ color: "oklch(0.88 0.03 240)" }}
          >
            فرّغ عقلك
          </h2>
          <p
            className="text-sm font-light leading-relaxed"
            style={{ color: "oklch(0.55 0.04 250)" }}
          >
            دع المعلومات تترسّخ قبل الانتقال للقسم التالي
          </p>
        </motion.div>

        {/* Countdown arc */}
        <div className="relative flex items-center justify-center">
          <svg width="72" height="72" className="-rotate-90">
            {/* Track */}
            <circle
              cx="36"
              cy="36"
              r="30"
              fill="none"
              stroke="oklch(1 0 0 / 0.06)"
              strokeWidth="2.5"
            />
            {/* Progress */}
            <motion.circle
              cx="36"
              cy="36"
              r="30"
              fill="none"
              stroke="oklch(0.65 0.12 230 / 0.7)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 30}`}
              strokeDashoffset={`${2 * Math.PI * 30 * progress}`}
              transition={{ duration: 0.8 }}
            />
          </svg>
          <span
            className="absolute text-lg font-light tabular-nums"
            style={{ color: "oklch(0.65 0.1 230)" }}
          >
            {remaining}
          </span>
        </div>

        {/* Skip button */}
        <AnimatePresence>
          {canSkip && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.4 }}
              onClick={onComplete}
              className="rounded-full px-6 py-2.5 text-sm font-light tracking-wide transition-all"
              style={{
                border: "1px solid oklch(1 0 0 / 0.12)",
                color: "oklch(0.55 0.04 250)",
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "oklch(0.65 0.12 230 / 0.5)";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "oklch(0.75 0.1 230)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "oklch(1 0 0 / 0.12)";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "oklch(0.55 0.04 250)";
              }}
            >
              تخطى الآن
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}