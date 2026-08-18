import { useEffect, useState } from "react";
import { Brain } from "lucide-react";
import { supabase } from "../../../supabaseClient";

export default function CognitiveMetrics({ assessment }) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState([
    { label: "Average Attention", value: 0 },
    { label: "Average Focus", value: 0 },
    { label: "Cognitive Engagement", value: 0 },
  ]);

  const [animatedValues, setAnimatedValues] = useState([0, 0, 0]);

  useEffect(() => {
    async function fetchCognitiveMetrics() {
      try {
        setLoading(true);

        // Get active logged-in user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const targetTraineeId = assessment?.trainee_id || user?.id;

        if (!targetTraineeId) {
          setLoading(false);
          return;
        }

        // Fetch active segment stream directly by trainee_id
        const { data: segments, error: segmentsError } = await supabase
          .from("eeg_active_segments")
          .select("attention_pct, engagement_pct, cognitive_load_pct")
          .eq("trainee_id", targetTraineeId)
          .order("created_at", { ascending: false })
          .limit(20);

        if (segmentsError) {
          console.error("Error fetching eeg_active_segments:", segmentsError.message);
          setLoading(false);
          return;
        }

        if (segments && segments.length > 0) {
          const count = segments.length;

          // Helper to scale decimal index scores (e.g., 1.5, 2.3) into display percentages (0-100%)
          const toPercentage = (rawAvg) => {
            const val = Number(rawAvg) || 0;
            if (val <= 1.0) return Math.min(Math.round(val * 100), 100);
            if (val <= 10.0) return Math.min(Math.round(val * 15), 100); // Scale 1-10 range (e.g., 2.3 -> ~35%)
            return Math.min(Math.round(val), 100);
          };

          const rawAttentionAvg =
            segments.reduce((acc, row) => acc + (Number(row.attention_pct) || 0), 0) / count;
          const rawFocusAvg =
            segments.reduce((acc, row) => acc + (Number(row.cognitive_load_pct) || 0), 0) / count;
          const rawEngagementAvg =
            segments.reduce((acc, row) => acc + (Number(row.engagement_pct) || 0), 0) / count;

          const updatedMetrics = [
            { label: "Average Attention", value: toPercentage(rawAttentionAvg) },
            { label: "Average Focus", value: toPercentage(rawFocusAvg) },
            { label: "Cognitive Engagement", value: toPercentage(rawEngagementAvg) },
          ];

          setMetrics(updatedMetrics);

          // Trigger gauge progress bar animation
          setTimeout(() => {
            setAnimatedValues(updatedMetrics.map((m) => m.value));
          }, 150);
        }
      } catch (err) {
        console.error("Error loading cognitive metrics:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCognitiveMetrics();
  }, [assessment]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.35)] p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Brain size={22} className="text-blue-700" />
          <h2 className="text-2xl font-bold text-gray-800">Cognitive Metrics</h2>
        </div>
        {loading && <span className="text-xs text-gray-400 animate-pulse">Loading...</span>}
      </div>

      <div className="space-y-6">
        {metrics.map((metric, index) => {
          const value = animatedValues[index];

          return (
            <div key={index}>
              {/* Label */}
              <div className="mb-2">
                <span className="font-medium text-gray-700">{metric.label}</span>
              </div>

              <div className="flex items-center gap-4">
                {/* Progress Bar */}
                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-700 to-cyan-500 rounded-full transition-all duration-[1800ms] ease-out"
                    style={{
                      width: `${value}%`,
                    }}
                  />
                </div>

                {/* Animated Radial Circle */}
                {(() => {
                  const radius = 22;
                  const circumference = 2 * Math.PI * radius;
                  const offset = circumference - (value / 100) * circumference;

                  return (
                    <div className="relative w-14 h-14 flex items-center justify-center">
                      <svg width="56" height="56" className="-rotate-90">
                        <circle
                          cx="28"
                          cy="28"
                          r={radius}
                          stroke="#E5E7EB"
                          strokeWidth="6"
                          fill="none"
                        />
                        <circle
                          cx="28"
                          cy="28"
                          r={radius}
                          stroke="#1D4ED8"
                          strokeWidth="6"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={offset}
                          style={{
                            transition: "stroke-dashoffset 1.8s ease-out",
                          }}
                        />
                      </svg>

                      <div className="absolute w-10 h-10 rounded-full bg-white flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-700">
                          {value}%
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}