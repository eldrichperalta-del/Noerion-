import { useEffect, useState } from "react";
import { Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "../../../supabaseClient";

export default function AIRecommendations({ assessment }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommendations() {
      const targetId = assessment?.submission_id || assessment?.id;

      if (!targetId && !assessment?.trainee_id) {
        setLoading(false);
        return;
      }

      setLoading(true);

      let { data } = await supabase
        .from("ai_assessment_insights")
        .select("recommendations")
        .eq("submission_id", targetId);

      let record = data && data.length > 0 ? data[0] : null;

      if (!record && assessment?.trainee_id) {
        const fallback = await supabase
          .from("ai_assessment_insights")
          .select("recommendations")
          .eq("trainee_id", assessment.trainee_id)
          .order("generated_at", { ascending: false })
          .limit(1);

        if (fallback.data && fallback.data.length > 0) {
          record = fallback.data[0];
        }
      }

      if (record?.recommendations) {
        let parsed = record.recommendations;
        if (typeof parsed === "string") {
          try {
            parsed = JSON.parse(parsed);
          } catch (e) {
            parsed = [];
          }
        }
        setRecommendations(Array.isArray(parsed) ? parsed : []);
      }
      setLoading(false);
    }

    fetchRecommendations();
  }, [assessment]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.35)] p-6 h-full">
      <div className="flex items-center gap-2 mb-5">
        <Sparkles size={22} className="text-violet-600" />
        <h2 className="text-xl font-bold text-gray-800">
          AI Feedback & Recommendations
        </h2>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 py-4">
          <Loader2 size={18} className="animate-spin text-violet-600" />
          <span>Loading recommendations...</span>
        </div>
      ) : recommendations.length > 0 ? (
        <div className="space-y-4">
          {recommendations.map((item, index) => (
            <div key={index} className="flex gap-3">
              <CheckCircle2 size={18} className="text-green-600 mt-1 shrink-0" />
              <p className="text-gray-700">{item}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 italic">No recommendations available.</p>
      )}
    </div>
  );
}