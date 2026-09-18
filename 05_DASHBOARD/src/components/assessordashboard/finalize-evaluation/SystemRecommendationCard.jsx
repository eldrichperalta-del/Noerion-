import { useEffect, useState } from "react";
import { Bot } from "lucide-react";

/* ============================================================================
   SystemRecommendationCard
   ----------------------------------------------------------------------------
   Uses the SAME AI result object displayed by AIResultSummaryCard.

   Expected aiResult:
   {
     suggestedResult: "Competent",
     confidenceScore: 99,
     overallSummary: "..."
   }
   ============================================================================ */

export default function SystemRecommendationCard({
  aiResult,
}) {
  /* ========================================================================
     RESULT
     ======================================================================== */

  const rawResult =
    aiResult?.suggestedResult ??
    aiResult?.competency ??
    aiResult?.recommendation ??
    null;

  const normalizedResult = rawResult
    ? String(rawResult).trim().toUpperCase()
    : "";

  const isCompetent =
    normalizedResult === "COMPETENT";

  /* ========================================================================
     CONFIDENCE

     IMPORTANT:
     This comes directly from ai_assessment_insights.confidence_score
     through AIAnalysisInsights.jsx.

     It is NOT recalculated from total_score.
     ======================================================================== */

  const rawConfidence =
    aiResult?.confidenceScore ??
    aiResult?.confidence ??
    aiResult?.confidence_level ??
    null;

  const confidence =
    rawConfidence !== null &&
    rawConfidence !== undefined &&
    Number.isFinite(Number(rawConfidence))
      ? Math.max(
          0,
          Math.min(
            100,
            Number(rawConfidence)
          )
        )
      : null;

  /* ========================================================================
     CONFIDENCE RING ANIMATION
     ======================================================================== */

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);

    if (confidence === null) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setProgress(confidence);
    }, 200);

    return () => clearTimeout(timer);
  }, [confidence]);

  /* ========================================================================
     CIRCLE CONFIGURATION
     ======================================================================== */

  const radius = 45;
  const circumference = 2 * Math.PI * radius;

  const offset =
    circumference -
    (progress / 100) * circumference;

  /* ========================================================================
     NO AI RESULT
     ======================================================================== */

  if (!aiResult) {
    return (
      <div className="h-[310px] rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-6 py-4">
          <Bot
            size={22}
            className="text-[#2563EB]"
          />

          <h2 className="text-lg font-semibold text-gray-900">
            System Recommendation
          </h2>
        </div>

        <div className="flex h-[230px] items-center justify-center px-6">
          <p className="text-sm text-gray-500">
            AI recommendation is not available yet.
          </p>
        </div>
      </div>
    );
  }

  /* ========================================================================
     CARD
     ======================================================================== */

  return (
    <div className="h-[310px] rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* ================================================================
          HEADER
          ================================================================ */}

      <div className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Bot
            size={22}
            className="text-[#2563EB]"
          />

          <h2 className="text-lg font-semibold text-gray-900">
            System Recommendation
          </h2>
        </div>
      </div>

      {/* ================================================================
          CONTENT
          ================================================================ */}

      <div className="flex items-center justify-center gap-24 px-6 py-6">
        {/* ==============================================================
            LEFT
            ============================================================== */}

        <div className="flex flex-col gap-6">
          <div>
            <p className="text-sm font-semibold text-gray-600">
              Overall Suggested Result
            </p>

            <div className="mt-3">
              <span
                className={`inline-flex rounded-md px-4 py-1.5 text-sm font-semibold text-white ${
                  isCompetent
                    ? "bg-green-600"
                    : "bg-red-600"
                }`}
              >
                {normalizedResult || "UNAVAILABLE"}
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-600">
              Confidence Level
            </p>

            <p className="mt-2 text-lg font-bold text-gray-900">
              {confidence !== null
                ? `${confidence}%`
                : "—"}
            </p>
          </div>
        </div>

        {/* ==============================================================
            RIGHT — CONFIDENCE RING
            ============================================================== */}

        <div className="relative flex h-32 w-32 items-center justify-center">
          <svg
            viewBox="0 0 112 112"
            className="h-32 w-32 -rotate-90"
          >
            <circle
              cx="56"
              cy="56"
              r={radius}
              stroke="#E5E7EB"
              strokeWidth="8"
              fill="none"
            />

            <circle
              cx="56"
              cy="56"
              r={radius}
              stroke="#2563EB"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          <div className="absolute text-center">
            <p className="text-xl font-bold text-[#2563EB]">
              {confidence !== null
                ? `${progress}%`
                : "—"}
            </p>

            <p className="text-xs text-gray-500">
              Confidence
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
