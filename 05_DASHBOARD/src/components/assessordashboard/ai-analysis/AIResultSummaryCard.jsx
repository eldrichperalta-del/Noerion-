import { useEffect, useState } from "react";

import aiIcon from "../../../assets/ai.svg";

export default function AIResultSummaryCard({ result }) {
  if (!result) return null;

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const numericConfidence = Number(result?.confidenceScore);
      setProgress(
        Number.isFinite(numericConfidence)
          ? Math.max(0, Math.min(100, numericConfidence))
          : 0
      );
    }, 200);

    return () => clearTimeout(timer);
  }, [result?.confidenceScore]);

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const competent = result.suggestedResult === "Competent";

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 px-6 py-4">
        <img src={aiIcon} alt="AI" className="h-5 w-5 opacity-80" />
        <h2 className="text-lg font-semibold text-gray-900">
          AI Result Summary
        </h2>
      </div>

      <div className="px-6 py-6">
        <div className="flex items-center justify-center gap-8">
          <div className="flex flex-col justify-center gap-6">
            <div>
              <p className="text-sm font-semibold text-gray-600">
                AI Suggested Result
              </p>
              <div className="mt-3">
                <span
                  className={`inline-flex rounded-md px-4 py-1.5 text-sm font-semibold text-white ${
                    competent ? "bg-green-600" : "bg-red-600"
                  }`}
                >
                  {result.suggestedResult}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-600">
                Confidence Level
              </p>
              <p className="mt-2 text-lg font-bold text-gray-900">
                {progress}%
              </p>
            </div>
          </div>

          <div className="relative flex h-28 w-28 items-center justify-center">
            <svg viewBox="0 0 112 112" className="h-28 w-28 -rotate-90">
              <circle
                cx="56" cy="56" r={radius}
                stroke="#E5E7EB" strokeWidth="8" fill="none"
              />
              <circle
                cx="56" cy="56" r={radius}
                stroke="#2563EB" strokeWidth="8" fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            <div className="absolute text-center">
              <p className="text-xl font-bold text-blue-700">
                {progress}%
              </p>
              <p className="text-xs text-gray-500">Confidence</p>
            </div>
          </div>
        </div>

        {result.overallSummary && (
          <div className="mt-6 border-t border-gray-100 pt-5">
            <p className="text-sm font-semibold text-gray-600">
              AI Overall Summary
            </p>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              {result.overallSummary}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
