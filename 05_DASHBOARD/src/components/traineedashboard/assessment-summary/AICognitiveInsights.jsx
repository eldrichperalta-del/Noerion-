import { useEffect, useState } from "react";
import { Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "../../../supabaseClient";

export default function AICognitiveInsights({ assessment }) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInsights() {
      const submissionId = assessment?.id || assessment?.submission_id;

      if (!submissionId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from("ai_assessment_insights")
        .select("ai_cognitive_insights")
        .eq("submission_id", submissionId)
        .maybeSingle();

      if (error) {
        console.error("Supabase fetch error:", error);
      }

      if (data?.ai_cognitive_insights) {
        let raw = data.ai_cognitive_insights;
        if (typeof raw === "string") {
          try {
            raw = JSON.parse(raw);
          } catch (e) {
            raw = [];
          }
        }
        setInsights(Array.isArray(raw) ? raw : []);
      }
      setLoading(false);
    }

    fetchInsights();
  }, [assessment]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.35)] p-6 h-full">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles size={22} className="text-violet-600" />
        <h2 className="text-2xl font-bold text-gray-800">
          AI Cognitive Insights
        </h2>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 py-4">
          <Loader2 size={18} className="animate-spin text-violet-600" />
          <span>Loading insights...</span>
        </div>
      ) : insights.length > 0 ? (
        <div className="space-y-4">
          {insights.map((item, index) => (
            <div key={index} className="flex gap-3">
              <CheckCircle2 size={18} className="text-green-600 mt-1 shrink-0" />
              <p className="text-gray-700 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 italic">No cognitive insights available.</p>
      )}
    </div>
  );
}