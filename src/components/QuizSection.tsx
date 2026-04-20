import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import type { Quizzes } from "@/lib/lesson-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Status = "idle" | "correct" | "wrong";

function normalize(s: string) {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

export function QuizSection({ quizzes, onAllCorrect }: { quizzes: Quizzes; onAllCorrect: () => void }) {
  // MCQ
  const [mcqSel, setMcqSel] = useState<string | null>(null);
  const [mcqStatus, setMcqStatus] = useState<Status>("idle");

  // Fill
  const [fillVal, setFillVal] = useState("");
  const [fillStatus, setFillStatus] = useState<Status>("idle");

  // Essay
  const [essayVal, setEssayVal] = useState("");
  const [essayStatus, setEssayStatus] = useState<Status>("idle");
  const [essayMatched, setEssayMatched] = useState<string[]>([]);

  const allCorrect = mcqStatus === "correct" && fillStatus === "correct" && essayStatus === "correct";

  const checkMcq = () => {
    if (!mcqSel) return;
    const ok = mcqSel === quizzes.mcq.answer;
    setMcqStatus(ok ? "correct" : "wrong");
    if (ok && fillStatus === "correct" && essayStatus === "correct") onAllCorrect();
  };

  const checkFill = () => {
    const ok = normalize(fillVal) === normalize(quizzes.fill.answer);
    setFillStatus(ok ? "correct" : "wrong");
    if (ok && mcqStatus === "correct" && essayStatus === "correct") onAllCorrect();
  };

  const checkEssay = () => {
    const text = normalize(essayVal);
    const matched = quizzes.essay.keywords.filter((k) => text.includes(normalize(k)));
    setEssayMatched(matched);
    const ok = matched.length >= Math.ceil(quizzes.essay.keywords.length * 0.6);
    setEssayStatus(ok ? "correct" : "wrong");
    if (ok && mcqStatus === "correct" && fillStatus === "correct") onAllCorrect();
  };

  return (
    <div className="mt-12 space-y-10 border-t border-border/50 pt-10">
      <h3 className="text-center text-xl font-bold text-foreground">تحقق من فهمك</h3>

      {/* MCQ */}
      <div className="space-y-3">
        <p className="font-semibold leading-relaxed">١. {quizzes.mcq.question}</p>
        <div className="grid gap-2">
          {quizzes.mcq.options.map((opt) => {
            const isSel = mcqSel === opt;
            const showCorrect = mcqStatus !== "idle" && opt === quizzes.mcq.answer;
            const showWrong = mcqStatus === "wrong" && isSel;
            return (
              <button
                key={opt}
                onClick={() => mcqStatus !== "correct" && setMcqSel(opt)}
                disabled={mcqStatus === "correct"}
                className={cn(
                  "flex items-center justify-between rounded-xl border-2 px-4 py-3 text-right text-base transition",
                  "border-border bg-background hover:border-brand/40",
                  isSel && mcqStatus === "idle" && "border-brand bg-brand-soft",
                  showCorrect && "border-success bg-success-soft",
                  showWrong && "border-destructive bg-destructive/10"
                )}
              >
                <span>{opt}</span>
                {showCorrect && <CheckCircle2 className="h-5 w-5 text-success" />}
                {showWrong && <XCircle className="h-5 w-5 text-destructive" />}
              </button>
            );
          })}
        </div>
        {mcqStatus !== "correct" && (
          <Button onClick={checkMcq} disabled={!mcqSel} variant="outline" className="rounded-full">
            تحقق
          </Button>
        )}
      </div>

      {/* Fill */}
      <div className="space-y-3">
        <p className="font-semibold leading-relaxed">٢. {quizzes.fill.question}</p>
        <Input
          value={fillVal}
          onChange={(e) => setFillVal(e.target.value)}
          disabled={fillStatus === "correct"}
          placeholder="اكتب الإجابة هنا..."
          className={cn(
            "h-12 rounded-xl text-right text-base",
            fillStatus === "correct" && "border-success bg-success-soft",
            fillStatus === "wrong" && "border-destructive bg-destructive/10"
          )}
        />
        {fillStatus !== "correct" && (
          <Button onClick={checkFill} disabled={!fillVal.trim()} variant="outline" className="rounded-full">
            تحقق
          </Button>
        )}
        {fillStatus === "wrong" && (
          <p className="text-sm text-destructive">إجابة غير صحيحة، حاول مرة أخرى.</p>
        )}
        {fillStatus === "correct" && (
          <p className="text-sm font-semibold text-success">✓ إجابة صحيحة</p>
        )}
      </div>

      {/* Essay */}
      <div className="space-y-3">
        <p className="font-semibold leading-relaxed">٣. {quizzes.essay.question}</p>
        <Textarea
          value={essayVal}
          onChange={(e) => setEssayVal(e.target.value)}
          disabled={essayStatus === "correct"}
          placeholder="اكتب إجابتك بأسلوبك الخاص..."
          rows={4}
          className={cn(
            "rounded-xl text-right text-base leading-relaxed",
            essayStatus === "correct" && "border-success bg-success-soft",
            essayStatus === "wrong" && "border-destructive bg-destructive/10"
          )}
        />
        {essayStatus !== "correct" && (
          <Button onClick={checkEssay} disabled={!essayVal.trim()} variant="outline" className="rounded-full">
            تحقق من الإجابة
          </Button>
        )}
        {essayStatus !== "idle" && (
          <p className={cn("text-sm", essayStatus === "correct" ? "text-success font-semibold" : "text-foreground/70")}>
            {essayStatus === "correct"
              ? `✓ إجابة جيدة! ذكرت: ${essayMatched.join("، ")}`
              : `حاول تضمين كلمات مفتاحية أكثر. ذكرت: ${essayMatched.join("، ") || "لا شيء"} من أصل ${quizzes.essay.keywords.length}.`}
          </p>
        )}
      </div>

      {allCorrect && (
        <div className="rounded-2xl bg-success-soft p-4 text-center text-success font-semibold">
          🎉 ممتاز! اكتملت الفقرة، يمكنك المتابعة.
        </div>
      )}
    </div>
  );
}
