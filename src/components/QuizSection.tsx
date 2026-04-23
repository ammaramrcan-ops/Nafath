import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle, Lightbulb, Clock, Tag } from "lucide-react";
import type { Quizzes, MCQ, Fill, Essay } from "@/lib/lesson-data";
import { cn } from "@/lib/utils";

type Status = "idle" | "correct" | "wrong";

type QuestionMetrics = {
  status: Status;
  secondsElapsed: number;
  errorCount: number;
  hintUsed: boolean;
  userDifficulty?: 'easy' | 'medium' | 'hard';
  timerStarted: boolean;
};

function normalize(s: string) {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}ث`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}د ${secs}ث`;
}

export function QuizSection({
  quizzes,
  type = "all",
  onAllCorrect,
}: {
  quizzes: Quizzes;
  type?: "mcq" | "fill" | "essay" | "all";
  onAllCorrect: () => void;
}) {
  const showMcq = type === "all" || type === "mcq";
  const showFill = type === "all" || type === "fill";
  const showEssay = type === "all" || type === "essay";
  const mcqs = !showMcq ? [] : quizzes.mcqs.filter(
    (q) => (q.question.trim() || q.image_url?.trim()) && q.options.some((o) => o.trim()),
  );
  const fills = !showFill ? [] : quizzes.fills.filter((q) => (q.question.trim() || q.image_url?.trim()) && q.answer.trim());
  const essays = !showEssay ? [] : quizzes.essays.filter((q) => q.question.trim() || q.image_url?.trim());

  const total = mcqs.length + fills.length + essays.length;
  const [metrics, setMetrics] = useState<Record<string, QuestionMetrics>>({});

  const correctCount = useMemo(
    () => Object.values(metrics).filter((m) => m.status === "correct").length,
    [metrics],
  );

  const allCorrect = total === 0 || correctCount === total;

  const setMetric = (key: string, metric: Partial<QuestionMetrics>) => {
    setMetrics((prev) => {
      const next = {
        ...prev,
        [key]: { ...prev[key], ...metric },
      };
      const correct = Object.values(next).filter((m) => m.status === "correct").length;
      if (total === 0 || correct === total) {
        // حفظ الإحصائيات في localStorage
        const stats = Object.entries(next).map(([id, m]) => ({
          id,
          ...m,
        }));
        localStorage.setItem("nafath_quiz_stats", JSON.stringify(stats));
        queueMicrotask(() => onAllCorrect());
      }
      return next;
    });
  };

  useEffect(() => {
    if (total === 0) onAllCorrect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  // مؤقت عام لتحديث الثواني
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          if (next[key].timerStarted && next[key].status !== "correct") {
            next[key].secondsElapsed += 1;
          }
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  let n = 0;
  return (
    <div className="space-y-10">
      <div className="text-center">
        <p className="text-[13px] font-medium tracking-wide text-zen-on-surface-variant">
          تحقق من فهمك
        </p>
        {total > 0 && (
          <p className="mt-2 text-[12px] font-light text-zen-on-surface-variant">
            {correctCount} / {total}
          </p>
        )}
      </div>

      {total === 0 && (
        <p className="text-center text-[13px] font-light text-zen-on-surface-variant">
          لا توجد أسئلة لهذه الفقرة.
        </p>
      )}

      {mcqs.map((q, i) => {
        n += 1;
        const key = `mcq-${i}`;
        const metric = metrics[key] || {
          status: "idle",
          secondsElapsed: 0,
          errorCount: 0,
          hintUsed: false,
          timerStarted: false,
        };
        return (
          <McqItem
            key={key}
            num={n}
            q={q}
            metric={metric}
            setMetric={(m) => setMetric(key, m)}
          />
        );
      })}
      {fills.map((q, i) => {
        n += 1;
        const key = `fill-${i}`;
        const metric = metrics[key] || {
          status: "idle",
          secondsElapsed: 0,
          errorCount: 0,
          hintUsed: false,
          timerStarted: false,
        };
        return (
          <FillItem
            key={key}
            num={n}
            q={q}
            metric={metric}
            setMetric={(m) => setMetric(key, m)}
          />
        );
      })}
      {essays.map((q, i) => {
        n += 1;
        const key = `essay-${i}`;
        const metric = metrics[key] || {
          status: "idle",
          secondsElapsed: 0,
          errorCount: 0,
          hintUsed: false,
          timerStarted: false,
        };
        return (
          <EssayItem
            key={key}
            num={n}
            q={q}
            metric={metric}
            setMetric={(m) => setMetric(key, m)}
          />
        );
      })}

      {allCorrect && total > 0 && (
        <div className="rounded-2xl bg-zen-primary-container/40 p-5 text-center text-[14px] font-medium text-zen-on-surface">
          اكتملت الفقرة، يمكنك المتابعة.
        </div>
      )}
    </div>
  );
}

function QuestionShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[24px] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function CheckButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-full bg-zen-on-surface px-6 py-2.5 text-[13px] font-medium text-white transition hover:opacity-90 disabled:opacity-30"
    >
      تحقق
    </button>
  );
}

function DifficultyRating({
  onRate,
}: {
  onRate: (difficulty: 'easy' | 'medium' | 'hard') => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[12px] font-medium text-zen-on-surface-variant flex items-center gap-2">
        <Tag className="h-4 w-4" />
        كم كانت صعوبة هذا السؤال؟
      </p>
      <div className="flex gap-2">
        {(['easy', 'medium', 'hard'] as const).map((diff) => (
          <button
            key={diff}
            onClick={() => onRate(diff)}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-[12px] font-light transition",
              diff === 'easy' && "bg-green-100 text-green-700 hover:bg-green-200",
              diff === 'medium' && "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
              diff === 'hard' && "bg-red-100 text-red-700 hover:bg-red-200",
            )}
          >
            {diff === 'easy' ? 'سهل' : diff === 'medium' ? 'متوسط' : 'صعب'}
          </button>
        ))}
      </div>
    </div>
  );
}

function McqItem({
  num,
  q,
  metric,
  setMetric,
}: {
  num: number;
  q: MCQ;
  metric: QuestionMetrics;
  setMetric: (m: Partial<QuestionMetrics>) => void;
}) {
  const [sel, setSel] = useState<string | null>(null);
  const check = () => {
    if (!sel) return;
    const isCorrect = sel === q.answer;
    if (isCorrect) {
      setMetric({ status: "correct" });
    } else {
      setMetric({ status: "wrong", errorCount: metric.errorCount + 1 });
    }
  };

  return (
    <QuestionShell>
      {q.image_url && (
        <img src={q.image_url} alt={`صورة السؤال ${num}`} className="h-44 w-full rounded-2xl object-cover" />
      )}
      <div className="flex items-start justify-between">
        <p className="text-[15px] font-medium leading-relaxed text-zen-on-surface flex-1">
          {num}. {q.question}
        </p>
        <div className="flex items-center gap-2 text-[12px] text-zen-on-surface-variant">
          <Clock className="h-4 w-4" />
          <span>{formatTime(metric.secondsElapsed)}</span>
        </div>
      </div>
      <div className="grid gap-2.5">
        {q.options.filter((o) => o.trim()).map((opt) => {
          const isSel = sel === opt;
          const showCorrect = metric.status !== "idle" && opt === q.answer;
          const showWrong = metric.status === "wrong" && isSel;
          return (
            <button
              key={opt}
              onClick={() => {
                if (!metric.timerStarted) setMetric({ timerStarted: true });
                if (metric.status !== "correct") setSel(opt);
              }}
              disabled={metric.status === "correct"}
              className={cn(
                "flex items-center justify-between rounded-2xl bg-zen-surface-low px-5 py-3.5 text-right text-[14px] font-light text-zen-on-surface transition",
                "hover:bg-zen-surface-container",
                isSel && metric.status === "idle" && "bg-zen-primary-container/50",
                showCorrect && "bg-zen-primary-container/60",
                showWrong && "bg-destructive/10",
              )}
            >
              <span>{opt}</span>
              {showCorrect && <CheckCircle2 className="h-4 w-4 text-zen-primary" strokeWidth={1.75} />}
              {showWrong && <XCircle className="h-4 w-4 text-destructive" strokeWidth={1.75} />}
            </button>
          );
        })}
      </div>
      {metric.status !== "correct" && <CheckButton onClick={check} disabled={!sel} />}
      {metric.status === "correct" && (
        <div className="space-y-3">
          <p className="text-[12px] font-medium text-zen-primary">إجابة صحيحة</p>
          <DifficultyRating onRate={(diff) => setMetric({ userDifficulty: diff })} />
        </div>
      )}
    </QuestionShell>
  );
}

function FillItem({
  num,
  q,
  metric,
  setMetric,
}: {
  num: number;
  q: Fill;
  metric: QuestionMetrics;
  setMetric: (m: Partial<QuestionMetrics>) => void;
}) {
  const [val, setVal] = useState("");
  const check = () => {
    const isCorrect = normalize(val) === normalize(q.answer);
    if (isCorrect) {
      setMetric({ status: "correct" });
    } else {
      setMetric({ status: "wrong", errorCount: metric.errorCount + 1 });
    }
  };

  return (
    <QuestionShell>
      {q.image_url && (
        <img src={q.image_url} alt={`صورة السؤال ${num}`} className="h-44 w-full rounded-2xl object-cover" />
      )}
      <div className="flex items-start justify-between">
        <p className="text-[15px] font-medium leading-relaxed text-zen-on-surface flex-1">
          {num}. {q.question}
        </p>
        <div className="flex items-center gap-2 text-[12px] text-zen-on-surface-variant">
          <Clock className="h-4 w-4" />
          <span>{formatTime(metric.secondsElapsed)}</span>
        </div>
      </div>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onFocus={() => {
          if (!metric.timerStarted) setMetric({ timerStarted: true });
        }}
        disabled={metric.status === "correct"}
        placeholder="اكتب الإجابة هنا..."
        className={cn(
          "h-12 w-full rounded-2xl bg-zen-surface-low px-5 text-right text-[14px] font-light text-zen-on-surface outline-none placeholder:text-zen-on-surface-variant/60 focus:bg-zen-surface-container",
          metric.status === "correct" && "bg-zen-primary-container/50",
          metric.status === "wrong" && "bg-destructive/10",
        )}
      />
      {metric.status !== "correct" && <CheckButton onClick={check} disabled={!val.trim()} />}
      {metric.status === "wrong" && (
        <p className="text-[12px] font-light text-destructive">إجابة غير صحيحة، حاول مرة أخرى.</p>
      )}
      {metric.status === "correct" && (
        <div className="space-y-3">
          <p className="text-[12px] font-medium text-zen-primary">إجابة صحيحة</p>
          <DifficultyRating onRate={(diff) => setMetric({ userDifficulty: diff })} />
        </div>
      )}
    </QuestionShell>
  );
}

function EssayItem({
  num,
  q,
  metric,
  setMetric,
}: {
  num: number;
  q: Essay;
  metric: QuestionMetrics;
  setMetric: (m: Partial<QuestionMetrics>) => void;
}) {
  const [val, setVal] = useState("");
  const [matched, setMatched] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);

  const check = () => {
    const text = normalize(val);
    const m = q.keywords.filter((k) => text.includes(normalize(k)));
    setMatched(m);
    const ok = q.keywords.length === 0
      ? val.trim().length > 5
      : m.length >= Math.ceil(q.keywords.length * 0.6);
    
    if (ok) {
      setMetric({ status: "correct" });
    } else {
      setMetric({ status: "wrong", errorCount: metric.errorCount + 1 });
    }
  };

  return (
    <QuestionShell>
      {q.image_url && (
        <img src={q.image_url} alt={`صورة السؤال ${num}`} className="h-44 w-full rounded-2xl object-cover" />
      )}
      <div className="flex items-start justify-between">
        <p className="text-[15px] font-medium leading-relaxed text-zen-on-surface flex-1">
          {num}. {q.question}
        </p>
        <div className="flex items-center gap-2 text-[12px] text-zen-on-surface-variant">
          <Clock className="h-4 w-4" />
          <span>{formatTime(metric.secondsElapsed)}</span>
        </div>
      </div>
      <textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onFocus={() => {
          if (!metric.timerStarted) setMetric({ timerStarted: true });
        }}
        disabled={metric.status === "correct"}
        placeholder="اكتب إجابتك بأسلوبك الخاص..."
        rows={4}
        className={cn(
          "w-full resize-none rounded-2xl bg-zen-surface-low px-5 py-3 text-right text-[14px] font-light leading-relaxed text-zen-on-surface outline-none placeholder:text-zen-on-surface-variant/60 focus:bg-zen-surface-container",
          metric.status === "correct" && "bg-zen-primary-container/50",
          metric.status === "wrong" && "bg-destructive/10",
        )}
      />
      {metric.status !== "correct" && <CheckButton onClick={check} disabled={!val.trim()} />}
      
      {/* زر التلميح - يظهر فقط بعد محاولتين خاطئتين */}
      {metric.errorCount >= 2 && metric.status !== "correct" && q.hint && (
        <button
          onClick={() => {
            setShowHint(!showHint);
            setMetric({ hintUsed: true });
          }}
          className="flex items-center gap-2 rounded-lg bg-amber-100 px-4 py-2 text-[12px] font-light text-amber-700 transition hover:bg-amber-200"
        >
          <Lightbulb className="h-4 w-4" />
          {showHint ? 'إخفاء التلميح' : 'إظهار تلميح'}
        </button>
      )}

      {/* عرض التلميح */}
      {showHint && q.hint && (
        <div className="rounded-lg bg-amber-50 p-3 text-[12px] text-amber-900 border border-amber-200">
          <p className="font-light">{q.hint}</p>
        </div>
      )}

      {metric.status !== "idle" && q.keywords.length > 0 && (
        <p className={cn("text-[12px] font-light", metric.status === "correct" ? "text-zen-primary font-medium" : "text-zen-on-surface-variant")}>
          {metric.status === "correct"
            ? `ذكرت: ${matched.join("، ")}`
            : `حاول تضمين كلمات مفتاحية أكثر. ذكرت: ${matched.join("، ") || "لا شيء"} من أصل ${q.keywords.length}.`}
        </p>
      )}
      {metric.status === "correct" && (
        <div className="space-y-3">
          <p className="text-[12px] font-medium text-zen-primary">تم تسجيل إجابتك</p>
          <DifficultyRating onRate={(diff) => setMetric({ userDifficulty: diff })} />
        </div>
      )}
    </QuestionShell>
  );
}
