import React from "react";

export default function WrittenAssessmentCard({ writtenAssessment = {} }) {
  const {
    score = 0,
    total = 0,
    percentage = 0,
    status = "Unknown",
  } = writtenAssessment;

  return (
    <div className="h-full rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Written Assessment
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Objective assessment score and completion record.
          </p>
        </div>

        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
          {status.replace("WRITTEN - ", "")}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        {/* Score */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Score
          </p>
          <p className="mt-1 text-xl font-extrabold text-slate-900">
            {score} / {total}
          </p>
        </div>

        {/* Percentage */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Percentage
          </p>
          <p className="mt-1 text-xl font-extrabold text-slate-900">
            {percentage !== null ? `${percentage}%` : "-"}
          </p>
        </div>

        {/* Result Benchmark */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Result
          </p>
          <p
            className={`mt-1 text-xl font-extrabold ${
              percentage >= 75 ? "text-emerald-600" : "text-amber-600"
            }`}
          >
            {percentage >= 75 ? "Passed" : "Review"}
          </p>
        </div>
      </div>
    </div>
  );
}