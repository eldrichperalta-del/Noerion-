import { useEffect, useState } from "react";
import { Bot } from "lucide-react";

/* ============================================================================
   SystemRecommendationCard

   FRONTEND HANDOFF
   ----------------------------------------------------------------------------
   Displays the AI-generated recommendation together with the confidence score.

   This component is presentation-only.

   Data Source

   FinalizeEvaluation
        ↓
   FinalizeEvaluationPanel
        ↓
   SystemRecommendationCard

============================================================================ */

/* ============================================================================
   BACKEND HANDOFF
   ----------------------------------------------------------------------------
   Replace the fallback values once the backend is connected.

   Suggested Endpoint

   GET /assessor/evaluation/{evaluationId}/ai-analysis

   Example Response

   {
      aiResult: {
         competency: "COMPETENT",
         confidence: 92
      }
   }

   OR

   {
      aiResult: {
         recommendation: "Competent",
         confidenceScore: 92
      }
   }

============================================================================ */

export default function SystemRecommendationCard({
    aiResult,
    evaluationSummary,
}) {
    /* ==========================================================================
       FRONTEND
  
       Supports multiple backend property names during integration.
  
       confidence
       confidenceScore
  
       competency
       suggestedResult
       recommendation
  
    ========================================================================== */

    const confidence = Number(
        aiResult?.confidence ??
        aiResult?.confidenceScore ??
        92
    );

    const rawResult =
        aiResult?.competency ??
        aiResult?.suggestedResult ??
        aiResult?.recommendation ??
        evaluationSummary?.overallResult?.competency ??
        "COMPETENT";

    /* ==========================================================================
       Normalize backend values
  
       Examples
  
       Competent
       competent
       COMPETENT
       COMPETENT
  
       all become
  
       COMPETENT
  
    ========================================================================== */

    const normalizedResult = String(rawResult)
        .trim()
        .toUpperCase();

    const isCompetent =
        normalizedResult === "COMPETENT";

    /* ==========================================================================
       Confidence Ring Animation
    ========================================================================== */

    const [progress, setProgress] = useState(0);

    useEffect(() => {
        setProgress(0);

        const timer = setTimeout(() => {
            setProgress(confidence);
        }, 200);

        return () => clearTimeout(timer);
    }, [confidence]);

    /* ==========================================================================
       Circle Configuration
    ========================================================================== */

    const radius = 45;
    const circumference = 2 * Math.PI * radius;

    const offset =
        circumference -
        (progress / 100) * circumference;

    return (
        <div className="h-[310px] rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* ===================================================== */}
            {/* Header */}
            {/* ===================================================== */}

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

            {/* ===================================================== */}
            {/* Content */}
            {/* ===================================================== */}

            <div className="flex items-center justify-center gap-24 px-6 py-6">
                {/* Left */}

                <div className="flex flex-col gap-6">
                    <div>
                        <p className="text-sm font-semibold text-gray-600">
                            Overall Suggested Result
                        </p>

                        <div className="mt-3">
                            <span
                                className={`inline-flex rounded-md px-4 py-1.5 text-sm font-semibold text-white ${isCompetent
                                        ? "bg-green-600"
                                        : "bg-red-600"
                                    }`}
                            >
                                {normalizedResult}
                            </span>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-gray-600">
                            Confidence Level
                        </p>

                        <p className="mt-2 text-lg font-bold text-gray-900">
                            {confidence}%
                        </p>
                    </div>
                </div>

                {/* Right */}

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
                            {progress}%
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