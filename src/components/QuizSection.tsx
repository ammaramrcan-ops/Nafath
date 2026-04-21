import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import type { Quizzes, MCQ, Fill, Essay } from "@/lib/lesson-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  type?: "mcq_fill" | "essay" | "all";
  onAllCorrect: () => void;
}) {
  const mcqs = type === "essay" ? [] : quizzes.mcqs.filter(
    (q) => (q.question.trim() || q.image_url?.trim()) && q.options.some((o) => o.trim()),
  );
  const fills = type === "essay" ? [] : quizzes.fills.filter((q) => (q.question.trim() || q.image_url?.trim()) && q.answer.trim());
  const essays = type === "mcq_fill" ? [] : quizzes.essays.filter((q) => q.question.trim() || q.image_url?.trim());

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
        // Defer to avoid setState-in-render warnings if parent transitions
        queueMicrotask(() => onAllCorrect());
      }
      return next;
    });
  };

  // Auto-complete on mount if there are no quizzes at all
  useEffect(() => {
    if (total === 0) onAllCorrect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  let n = 0;
  return (
    <div className="mt-12 space-y-10 border-t border-border/50 pt-10">
      <h3 className="text-center text-xl font-bold text-foreground">
        تحقق من فهمك {total > 0 && <span className="text-sm text-foreground/50">({correctCount}/{total})</span>}
      </h3>

      {total === 0 && (
        <p className="text-center text-sm text-foreground/50">لا توجد أسئلة لهذه الفقرة.</p>
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
        <div className="rounded-2xl bg-success-soft p-4 text-center text-success font-semibold">
          🎉 ممتاز! اكتملت الفقرة، يمكنك المتابعة.
        </div>
      )}
    </div>
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
    <div className="space-y-3">
      {q.image_url && (
        <img src={q.image_url} alt={`صورة السؤال ${num}`} className="h-44 w-full rounded-xl object-cover" />
      )}
      <p className="font-semibold leading-relaxed">{num}. {q.question}</p>
      <div className="grid gap-2">
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
                "flex items-center justify-between rounded-xl border-2 px-4 py-3 text-right text-base transition",
                "border-border bg-background hover:border-brand/40",
                isSel && status === "idle" && "border-brand bg-brand-soft",
                showCorrect && "border-success bg-success-soft",
                showWrong && "border-destructive bg-destructive/10",
              )}
            >
              <span>{opt}</span>
              {showCorrect && <CheckCircle2 className="h-5 w-5 text-success" />}
              {showWrong && <XCircle className="h-5 w-5 text-destructive" />}
            </button>
          );
        })}
      </div>
      {status !== "correct" && (
        <Button onClick={check} disabled={!sel} variant="outline" className="rounded-full">
          تحقق
        </Button>
      )}
    </div>
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
    <div className="space-y-3">
      {q.image_url && (
        <img src={q.image_url} alt={`صورة السؤال ${num}`} className="h-44 w-full rounded-xl object-cover" />
      )}
      <p className="font-semibold leading-relaxed">{num}. {q.question}</p>
      <Input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        disabled={status === "correct"}
        placeholder="اكتب الإجابة هنا..."
        className={cn(
          "h-12 rounded-xl text-right text-base",
          status === "correct" && "border-success bg-success-soft",
          status === "wrong" && "border-destructive bg-destructive/10",
        )}
      />
      {status !== "correct" && (
        <Button onClick={check} disabled={!val.trim()} variant="outline" className="rounded-full">
          تحقق
        </Button>
      )}
      {status === "wrong" && <p className="text-sm text-destructive">إجابة غير صحيحة، حاول مرة أخرى.</p>}
      {status === "correct" && <p className="text-sm font-semibold text-success">✓ إجابة صحيحة</p>}
    </div>
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
    <div className="space-y-3">
      {q.image_url && (
        <img src={q.image_url} alt={`صورة السؤال ${num}`} className="h-44 w-full rounded-xl object-cover" />
      )}
      <p className="font-semibold leading-relaxed">{num}. {q.question}</p>
      <Textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        disabled={status === "correct"}
        placeholder="اكتب إجابتك بأسلوبك الخاص..."
        rows={4}
        className={cn(
          "rounded-xl text-right text-base leading-relaxed",
          status === "correct" && "border-success bg-success-soft",
          status === "wrong" && "border-destructive bg-destructive/10",
        )}
      />
      {status !== "correct" && (
        <Button onClick={check} disabled={!val.trim()} variant="outline" className="rounded-full">
          تحقق من الإجابة
        </Button>
      )}
      {status !== "idle" && q.keywords.length > 0 && (
        <p className={cn("text-sm", status === "correct" ? "text-success font-semibold" : "text-foreground/70")}>
          {status === "correct"
            ? `✓ إجابة جيدة! ذكرت: ${matched.join("، ")}`
            : `حاول تضمين كلمات مفتاحية أكثر. ذكرت: ${matched.join("، ") || "لا شيء"} من أصل ${q.keywords.length}.`}
        </p>
      )}
      {status === "correct" && q.keywords.length === 0 && (
        <p className="text-sm font-semibold text-success">✓ تم تسجيل إجابتك</p>
      )}
    </div>
  );
}
