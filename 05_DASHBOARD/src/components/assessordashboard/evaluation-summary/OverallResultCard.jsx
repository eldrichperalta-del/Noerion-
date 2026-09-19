import { ShieldCheck, CheckCircle2, Clock } from "lucide-react";

export default function OverallResultCard({ overallResult, writtenAssessment = {} }) {
  const competency = overallResult?.competency || "IN EVALUATION";
  const isCompetent = competency === "COMPETENT";
  const isInEvaluation = competency === "IN EVALUATION";

  const scoreText =
    writtenAssessment.score !== undefined && writtenAssessment.total
      ? `${writtenAssessment.score} / ${writtenAssessment.total}${
          writtenAssessment.percentage !== null
            ? ` · ${writtenAssessment.percentage}%`
            : ""
        }`
      : null;

  return (
    <div className="h-full rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between text-center">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Overall Result
        </span>

        <div className="mt-2 flex items-center justify-center gap-2">
          {isCompetent ? (
            <ShieldCheck size={26} className="text-emerald-600" />
          ) : isInEvaluation ? (
            <Clock size={24} className="text-amber-500" />
          ) : (
            <CheckCircle2 size={24} className="text-rose-500" />
          )}
          <h2
            className={`text-2xl font-extrabold ${
              isCompetent
                ? "text-emerald-800"
                : isInEvaluation
                ? "text-amber-700"
                : "text-rose-700"
            }`}
          >
            {competency}
          </h2>
        </div>

        {scoreText && (
          <p className="mt-1 text-xs font-bold text-slate-600">{scoreText}</p>
        )}
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        {isCompetent
          ? "The trainee achieved the required assessment result."
          : isInEvaluation
          ? "Assessment evidence submitted. Pending final assessor decision."
          : "The trainee has not yet demonstrated the required competency level."}
      </p>
    </div>
  );
}