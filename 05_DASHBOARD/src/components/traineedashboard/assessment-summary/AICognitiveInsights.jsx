import { useEffect, useState } from "react";
import { Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "../../../supabaseClient";

export default function AICognitiveInsights({ assessment, submissionId }) {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeedback() {
      const targetSubmissionId =
        submissionId || assessment?.submission_id || assessment?.id;

      if (!targetSubmissionId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from("ai_assessment_insights")
        .select("feedback")
        .eq("submission_id", targetSubmissionId)
        .maybeSingle();

      if (error) {
        console.error("Supabase fetch error:", error);
      }

      if (data?.feedback) {
        let raw = data.feedback;
        if (typeof raw === "string") {
          try {
            raw = JSON.parse(raw);
          } catch (e) {
            raw = [];
          }
        }
        setFeedbackList(Array.isArray(raw) ? raw : []);
      } else {
        setFeedbackList([]);
      }

      setLoading(false);
    }

    fetchFeedback();
  }, [assessment, submissionId]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.35)] p-6 h-full">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles size={22} className="text-violet-600" />
        <h2 className="text-2xl font-bold text-gray-800">
          AI Feedback
        </h2>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 py-4">
          <Loader2 size={18} className="animate-spin text-violet-600" />
          <span>Loading insights...</span>
        </div>
      ) : feedbackList.length > 0 ? (
        <div className="space-y-4">
          {feedbackList.map((item, index) => (
            <div key={index} className="flex gap-3">
              <CheckCircle2 size={18} className="text-green-600 mt-1 shrink-0" />
              <p className="text-gray-700 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 italic">No feedback available.</p>
      )}
    </div>
  );
}