import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "../../../../supabaseClient";

export default function AICognitiveInsightsCard({
  submissionId,
  traineeId,
  assessment,
  validated,
  overrideMode,
  isSubmitting,
  onFinalize,
}) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  async function fetchInsights() {
    setLoading(true);

    const targetSubId = submissionId || assessment?.submission_id || assessment?.id;
    const targetTraineeId = traineeId || assessment?.trainee_id;

    console.log("DEBUG - Query Params:", {
      submissionId,
      traineeId,
      targetSubId,
      targetTraineeId,
      assessmentObj: assessment
    });

    let query = supabase.from("ai_assessment_insights").select("*");

    if (targetSubId) {
      query = query.eq("submission_id", targetSubId);
    } else if (targetTraineeId) {
      query = query.eq("trainee_id", targetTraineeId);
    } else {
      console.warn("DEBUG - No valid ID available to query insights.");
      setLoading(false);
      return;
    }

    const { data, error } = await query;
    console.log("DEBUG - Supabase Response:", { data, error });

    if (data && data.length > 0) {
      const row = data[0];
      // Check for array column or text fallback columns
      let parsed = row.ai_cognitive_insights || row.overall_summary || row.cognitive_analysis || [];
      if (typeof parsed === "string") {
        parsed = parsed.split("\n").filter((line) => line.trim().length > 0);
      }
      setInsights(Array.isArray(parsed) ? parsed : [parsed]);
    } else {
      setInsights([]);
    }

    setLoading(false);
  }

  fetchInsights();
}, [submissionId, traineeId, assessment]);

  const canFinalize = validated || overrideMode;

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-violet-600" />
          <h2 className="text-lg font-bold text-gray-900">
            AI Cognitive Insights
          </h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Performance Trend Summary
        </p>
      </div>

      <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-gray-500 py-8">
            <Loader2 size={18} className="animate-spin text-violet-600" />
            <span>Loading cognitive insights...</span>
          </div>
        ) : insights.length > 0 ? (
          <ul className="list-disc space-y-3 pl-5 text-sm leading-6 text-gray-700">
            {insights.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm italic text-gray-400">
            No cognitive insights recorded for this evaluation yet.
          </p>
        )}
      </div>

      <button
        type="button"
        disabled={!canFinalize || isSubmitting}
        onClick={onFinalize}
        className={`mt-5 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition-all ${
          canFinalize && !isSubmitting
            ? "bg-[#0A67D8] hover:bg-[#0859b5]"
            : "cursor-not-allowed bg-gray-300"
        }`}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Finalizing...
          </>
        ) : (
          "Finalize Evaluation"
        )}
      </button>
    </div>
  );
}