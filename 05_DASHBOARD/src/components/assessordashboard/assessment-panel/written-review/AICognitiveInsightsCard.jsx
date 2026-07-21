import { Loader2 } from "lucide-react";

export default function AICognitiveInsightsCard({
  validated,
  overrideMode,
  isSubmitting,
  onFinalize,
}) {
  // ==========================================================
  // BACKEND HANDOFF:
  // Replace with AI-generated cognitive insights.
  // ==========================================================
  const insights = [
    "Strong understanding of the assessment objectives.",
    "Consistent performance across most questions.",
    "Minor inaccuracies were observed in technical terminology.",
    "Overall cognitive engagement remained stable throughout the assessment.",
  ];

  const canFinalize = validated || overrideMode;

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">
          AI Cognitive Insights
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Performance Trend Summary
        </p>
      </div>

      {/* Insights */}
      <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <ul className="list-disc space-y-3 pl-5 text-sm leading-6 text-gray-700">
          {insights.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      {/* Finalize Button */}
      <button
        type="button"
        disabled={!canFinalize || isSubmitting}
        onClick={onFinalize}
        className={`mt-5 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition-all ${
          canFinalize
            ? "bg-[#0A67D8] hover:bg-[#0859b5]"
            : "cursor-not-allowed bg-gray-300"
        }`}
      >
        {isSubmitting ? (
          <>
            <Loader2
              size={18}
              className="animate-spin"
            />
            Finalizing...
          </>
        ) : (
          "Finalize Evaluation"
        )}
      </button>

    </div>
  );
}