import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import aiIcon from "../../../assets/ai.svg";

export default function AIResultSummaryCard({ result }) {
  if (!result) return null;

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const numericConfidence = Number(result?.confidenceScore ?? result?.confidence);
      setProgress(
        Number.isFinite(numericConfidence)
          ? Math.max(0, Math.min(100, numericConfidence))
          : 0
      );
    }, 200);

    return () => clearTimeout(timer);
  }, [result?.confidenceScore, result?.confidence]);

  const competent = result.suggestedResult === "Competent";

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4 h-full">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <img src={aiIcon} alt="AI" className="h-5 w-5 opacity-80" />
            <h2 className="text-base font-bold text-slate-900">
              System Recommendation
            </h2>
          </div>
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase bg-slate-100 px-2.5 py-1 rounded-md">
            AI-SUPPORTED
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Suggested Assessment Result
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold ${
                  competent
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {competent ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {result.suggestedResult}
              </span>
            </div>
          </div>

          {progress > 0 && (
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Confidence Match
              </span>
              <p className="text-lg font-extrabold text-slate-800 mt-0.5">
                {progress}%
              </p>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-600 leading-relaxed pt-1">
          {result.overallSummary ||
            "The AI recommendation is consistent with the trainee's written assessment result. It evaluates item responses, timing patterns, and supplementary data."}
        </p>
      </div>

      <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-3 leading-relaxed">
        AI analysis supports assessor review. The final competency decision remains strictly with the human assessor.
      </p>
    </div>
  );
}