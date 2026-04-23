import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import type { Quizzes, MCQ, Fill, Essay } from "@/lib/lesson-data";
import { cn } from "@/lib/utils";

type Status = "idle" | "correct" | "wrong";

function normalize(s: string) {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
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
  const [statuses, setStatuses] = useState<Record<string, Status>>({});

  const correctCount = useMemo(
    () => Object.values(statuses).filter((s) => s === "correct").length,
    [statuses],
  );

  const allCorrect = total === 0 || correctCount === total;

  const setStatus = (key: string, status: Status) => {
    setStatuses((prev) => {
      const next = { ...prev, [key]: status };
      const correct = Object.values(next).filter((s) => s === "correct").length;
      if (total === 0 || correct === total) {
        queueMicrotask(() => onAllCorrect());
      }
      return next;
    });
  };

  useEffect(() => {
    if (total === 0) onAllCorrect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

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
        return <McqItem key={key} num={n} q={q} status={statuses[key] ?? "idle"} setStatus={(s) => setStatus(key, s)} />;
      })}
      {fills.map((q, i) => {
        n += 1;
        const key = `fill-${i}`;
        return <FillItem key={key} num={n} q={q} status={statuses[key] ?? "idle"} setStatus={(s) => setStatus(key, s)} />;
      })}
      {essays.map((q, i) => {
        n += 1;
        const key = `essay-${i}`;
        return <EssayItem key={key} num={n} q={q} status={statuses[key] ?? "idle"} setStatus={(s) => setStatus(key, s)} />;
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

function McqItem({
  num,
  q,
  status,
  setStatus,
}: {
  num: number;
  q: MCQ;
  status: Status;
  setStatus: (s: Status) => void;
}) {
  const [sel, setSel] = useState<string | null>(null);
  const check = () => {
    if (!sel) return;
    setStatus(sel === q.answer ? "correct" : "wrong");
  };
  return (
    <QuestionShell>
      {q.image_url && (
        <img src={q.image_url} alt={`صورة السؤال ${num}`} className="h-44 w-full rounded-2xl object-cover" />
      )}
      <p className="text-[15px] font-medium leading-relaxed text-zen-on-surface">
        {num}. {q.question}
      </p>
      <div className="grid gap-2.5">
        {q.options.filter((o) => o.trim()).map((opt) => {
          const isSel = sel === opt;
          const showCorrect = status !== "idle" && opt === q.answer;
          const showWrong = status === "wrong" && isSel;
          return (
            <button
              key={opt}
              onClick={() => status !== "correct" && setSel(opt)}
              disabled={status === "correct"}
              className={cn(
                "flex items-center justify-between rounded-2xl bg-zen-surface-low px-5 py-3.5 text-right text-[14px] font-light text-zen-on-surface transition",
                "hover:bg-zen-surface-container",
                isSel && status === "idle" && "bg-zen-primary-container/50",
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
      {status !== "correct" && <CheckButton onClick={check} disabled={!sel} />}
    </QuestionShell>
  );
}

function FillItem({
  num,
  q,
  status,
  setStatus,
}: {
  num: number;
  q: Fill;
  status: Status;
  setStatus: (s: Status) => void;
}) {
  const [val, setVal] = useState("");
  const check = () => setStatus(normalize(val) === normalize(q.answer) ? "correct" : "wrong");
  return (
    <QuestionShell>
      {q.image_url && (
        <img src={q.image_url} alt={`صورة السؤال ${num}`} className="h-44 w-full rounded-2xl object-cover" />
      )}
      <p className="text-[15px] font-medium leading-relaxed text-zen-on-surface">
        {num}. {q.question}
      </p>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        disabled={status === "correct"}
        placeholder="اكتب الإجابة هنا..."
        className={cn(
          "h-12 w-full rounded-2xl bg-zen-surface-low px-5 text-right text-[14px] font-light text-zen-on-surface outline-none placeholder:text-zen-on-surface-variant/60 focus:bg-zen-surface-container",
          status === "correct" && "bg-zen-primary-container/50",
          status === "wrong" && "bg-destructive/10",
        )}
      />
      {status !== "correct" && <CheckButton onClick={check} disabled={!val.trim()} />}
      {status === "wrong" && (
        <p className="text-[12px] font-light text-destructive">إجابة غير صحيحة، حاول مرة أخرى.</p>
      )}
      {status === "correct" && (
        <p className="text-[12px] font-medium text-zen-primary">إجابة صحيحة</p>
      )}
    </QuestionShell>
  );
}

function EssayItem({
  num,
  q,
  status,
  setStatus,
}: {
  num: number;
  q: Essay;
  status: Status;
  setStatus: (s: Status) => void;
}) {
  const [val, setVal] = useState("");
  const [matched, setMatched] = useState<string[]>([]);
  const check = () => {
    const text = normalize(val);
    const m = q.keywords.filter((k) => text.includes(normalize(k)));
    setMatched(m);
    const ok = q.keywords.length === 0
      ? val.trim().length > 5
      : m.length >= Math.ceil(q.keywords.length * 0.6);
    setStatus(ok ? "correct" : "wrong");
  };
  return (
    <QuestionShell>
      {q.image_url && (
        <img src={q.image_url} alt={`صورة السؤال ${num}`} className="h-44 w-full rounded-2xl object-cover" />
      )}
      <p className="text-[15px] font-medium leading-relaxed text-zen-on-surface">
        {num}. {q.question}
      </p>
      <textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        disabled={status === "correct"}
        placeholder="اكتب إجابتك بأسلوبك الخاص..."
        rows={4}
        className={cn(
          "w-full resize-none rounded-2xl bg-zen-surface-low px-5 py-3 text-right text-[14px] font-light leading-relaxed text-zen-on-surface outline-none placeholder:text-zen-on-surface-variant/60 focus:bg-zen-surface-container",
          status === "correct" && "bg-zen-primary-container/50",
          status === "wrong" && "bg-destructive/10",
        )}
      />
      {status !== "correct" && <CheckButton onClick={check} disabled={!val.trim()} />}
      {status !== "idle" && q.keywords.length > 0 && (
        <p className={cn("text-[12px] font-light", status === "correct" ? "text-zen-primary font-medium" : "text-zen-on-surface-variant")}>
          {status === "correct"
            ? `ذكرت: ${matched.join("، ")}`
            : `حاول تضمين كلمات مفتاحية أكثر. ذكرت: ${matched.join("، ") || "لا شيء"} من أصل ${q.keywords.length}.`}
        </p>
      )}
      {status === "correct" && q.keywords.length === 0 && (
        <p className="text-[12px] font-medium text-zen-primary">تم تسجيل إجابتك</p>
      )}
    </QuestionShell>
  );
}
