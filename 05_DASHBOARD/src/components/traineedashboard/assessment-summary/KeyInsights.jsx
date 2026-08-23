import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { supabase } from "../../../supabaseClient";

export default function KeyInsights({ assessment }) {
  const [strengths, setStrengths] = useState([]);
  const [improvements, setImprovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchKeyInsights() {
      const targetId = assessment?.submission_id || assessment?.id;

      if (!targetId && !assessment?.trainee_id) {
        setLoading(false);
        return;
      }

      setLoading(true);

      let { data } = await supabase
        .from("ai_assessment_insights")
        .select("strengths, areas_for_improvement")
        .eq("submission_id", targetId);

      let record = data && data.length > 0 ? data[0] : null;

      if (!record && assessment?.trainee_id) {
        const fallback = await supabase
          .from("ai_assessment_insights")
          .select("strengths, areas_for_improvement")
          .eq("trainee_id", assessment.trainee_id)
          .order("generated_at", { ascending: false })
          .limit(1);

        if (fallback.data && fallback.data.length > 0) {
          record = fallback.data[0];
        }
      }

      if (record) {
        let rawStrengths = record.strengths;
        let rawImprovements = record.areas_for_improvement;

        if (typeof rawStrengths === "string") {
          try {
            rawStrengths = JSON.parse(rawStrengths);
          } catch (e) {
            rawStrengths = [];
          }
        }
        if (typeof rawImprovements === "string") {
          try {
            rawImprovements = JSON.parse(rawImprovements);
          } catch (e) {
            rawImprovements = [];
          }
        }

        setStrengths(Array.isArray(rawStrengths) ? rawStrengths : []);
        setImprovements(Array.isArray(rawImprovements) ? rawImprovements : []);
      }
      setLoading(false);
    }

    fetchKeyInsights();
  }, [assessment]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.35)] p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Key Insights</h2>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 py-4">
          <Loader2 size={18} className="animate-spin text-violet-600" />
          <span>Loading key insights...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={22} className="text-green-600" />
              <h3 className="text-lg font-semibold text-green-700">Strengths</h3>
            </div>
            {strengths.length > 0 ? (
              <ul className="space-y-3 list-disc list-inside text-gray-700">
                {strengths.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 italic">No strengths recorded.</p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown size={22} className="text-red-600" />
              <h3 className="text-lg font-semibold text-red-700">
                Areas for Improvement
              </h3>
            </div>
            {improvements.length > 0 ? (
              <ul className="space-y-3 list-disc list-inside text-gray-700">
                {improvements.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 italic">No areas for improvement recorded.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}