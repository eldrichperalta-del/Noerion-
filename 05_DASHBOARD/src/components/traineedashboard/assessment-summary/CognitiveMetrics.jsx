import { useEffect, useState } from "react";
import { Brain } from "lucide-react";
import { supabase } from "../../../supabaseClient";

export default function CognitiveMetrics({
  assessment,
  containerHeight,
}) {
  const [loading, setLoading] = useState(true);

  const [metrics, setMetrics] = useState([
    { label: "Average Attention", value: 0 },
    { label: "Average Focus", value: 0 },
    { label: "Cognitive Engagement", value: 0 },
  ]);

  const [animatedValues, setAnimatedValues] = useState([
    0,
    0,
    0,
  ]);

  useEffect(() => {
    let animationTimer;

    async function fetchCognitiveMetrics() {
      try {
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        const targetTraineeId =
          assessment?.trainee_id || user?.id;

        if (!targetTraineeId) {
          setLoading(false);
          return;
        }

        const { data: segments, error: segmentsError } =
          await supabase
            .from("eeg_active_segments")
            .select(
              "attention_pct, engagement_pct, cognitive_load_pct"
            )
            .eq("trainee_id", targetTraineeId)
            .order("created_at", {
              ascending: false,
            })
            .limit(20);

        if (segmentsError) {
          console.error(
            "Error fetching eeg_active_segments:",
            segmentsError.message
          );

          setLoading(false);
          return;
        }

        if (segments && segments.length > 0) {
          const count = segments.length;

          const toPercentage = (rawAvg) => {
            const val = Number(rawAvg) || 0;

            if (val <= 1) {
              return Math.min(
                Math.round(val * 100),
                100
              );
            }

            if (val <= 10) {
              return Math.min(
                Math.round(val * 15),
                100
              );
            }

            return Math.min(
              Math.round(val),
              100
            );
          };

          const rawAttentionAvg =
            segments.reduce(
              (acc, row) =>
                acc +
                (Number(row.attention_pct) || 0),
              0
            ) / count;

          const rawFocusAvg =
            segments.reduce(
              (acc, row) =>
                acc +
                (Number(row.cognitive_load_pct) || 0),
              0
            ) / count;

          const rawEngagementAvg =
            segments.reduce(
              (acc, row) =>
                acc +
                (Number(row.engagement_pct) || 0),
              0
            ) / count;

          const updatedMetrics = [
            {
              label: "Average Attention",
              value: toPercentage(
                rawAttentionAvg
              ),
            },
            {
              label: "Average Focus",
              value: toPercentage(
                rawFocusAvg
              ),
            },
            {
              label: "Cognitive Engagement",
              value: toPercentage(
                rawEngagementAvg
              ),
            },
          ];

          setMetrics(updatedMetrics);

          animationTimer = setTimeout(() => {
            setAnimatedValues(
              updatedMetrics.map(
                (metric) => metric.value
              )
            );
          }, 150);
        } else {
          setMetrics([
            {
              label: "Average Attention",
              value: 0,
            },
            {
              label: "Average Focus",
              value: 0,
            },
            {
              label: "Cognitive Engagement",
              value: 0,
            },
          ]);

          setAnimatedValues([0, 0, 0]);
        }
      } catch (err) {
        console.error(
          "Error loading cognitive metrics:",
          err
        );
      } finally {
        setLoading(false);
      }
    }

    fetchCognitiveMetrics();

    return () => {
      if (animationTimer) {
        clearTimeout(animationTimer);
      }
    };
  }, [assessment]);

  /*
   * ================================================================
   * PLOT DATA
   * ================================================================
   */

  const plotPoints = metrics.map(
    (metric, index) => ({
      label: metric.label,
      value: animatedValues[index] || 0,
    })
  );

  const svgPoints = plotPoints
    .map((point, index) => {
      const x =
        ((index + 0.5) /
          plotPoints.length) *
        100;

      const y = 100 - point.value;

      return `${x},${y}`;
    })
    .join(" ");

  /*
   * ================================================================
   * CARD HEIGHT
   *
   * containerHeight comes directly from AI Cognitive Insights.
   * ================================================================
   */

  const cardStyle =
    containerHeight > 0
      ? {
          height: `${containerHeight}px`,
        }
      : undefined;

  return (
    <div
      style={cardStyle}
      className="
        bg-white
        rounded-2xl
        border
        border-gray-200
        shadow-[0_4px_12px_rgba(0,0,0,0.35)]
        p-6
        flex
        flex-col
        h-full
        overflow-hidden
      "
    >
      {/* ================================================================
          HEADER
      ================================================================= */}

      <div className="flex items-center justify-between mb-5 shrink-0">
        <div className="flex items-center gap-2">
          <Brain
            size={22}
            className="text-blue-700 shrink-0"
          />

          <h2 className="text-2xl font-bold text-gray-800">
            Cognitive Metrics
          </h2>
        </div>

        {loading && (
          <span className="text-xs text-gray-400 animate-pulse">
            Loading...
          </span>
        )}
      </div>

      {/* ================================================================
          MAIN CONTENT
          
          This area grows/shrinks depending on the AI container height.
      ================================================================= */}

      <div className="flex-1 min-h-0 flex flex-col">

        {/* ================================================================
            PLOT AREA

            flex-1 means the plot receives all available vertical space.
            It is no longer locked to h-[220px].
        ================================================================= */}

        <div className="flex-1 min-h-0 relative">

          {/* ============================================================
              ACTUAL GRAPH AREA
          ============================================================ */}

          <div className="absolute inset-0 ml-10 mr-4 mb-8">

            {/* Y-axis numbers */}
            <div className="absolute -left-10 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
              <span>100</span>
              <span>75</span>
              <span>50</span>
              <span>25</span>
              <span>0</span>
            </div>

            {/* Horizontal grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div className="border-t border-gray-200" />
              <div className="border-t border-gray-200" />
              <div className="border-t border-gray-200" />
              <div className="border-t border-gray-200" />
              <div className="border-t border-gray-300" />
            </div>

            {/* Y axis */}
            <div className="absolute left-0 top-0 h-full border-l border-gray-400" />

            {/* X axis */}
            <div className="absolute left-0 bottom-0 w-full border-b border-gray-400" />

            {/* ========================================================
                CONNECTING LINE
            ======================================================== */}

            <svg
              className="
                absolute
                inset-0
                w-full
                h-full
                pointer-events-none
                overflow-visible
              "
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <polyline
                points={svgPoints}
                fill="none"
                stroke="currentColor"
                className="text-blue-600"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
                style={{
                  transition:
                    "all 1.8s ease-out",
                }}
              />
            </svg>

            {/* ========================================================
                PLOT POINTS
            ======================================================== */}

            <div className="absolute inset-0">
              {plotPoints.map(
                (point, index) => {
                  const xPosition =
                    ((index + 0.5) /
                      plotPoints.length) *
                    100;

                  const yPosition =
                    100 - point.value;

                  return (
                    <div
                      key={point.label}
                      className="absolute"
                      style={{
                        left: `${xPosition}%`,
                        top: `${yPosition}%`,
                        transform:
                          "translate(-50%, -50%)",
                        transition:
                          "left 0.8s ease-out, top 1.8s ease-out",
                      }}
                    >
                      <div className="relative flex items-center justify-center">

                        {/* Glow */}
                        <div className="absolute w-8 h-8 rounded-full bg-blue-100 opacity-70" />

                        {/* Point */}
                        <div className="relative w-4 h-4 rounded-full bg-blue-700 border-2 border-white shadow-md" />

                        {/* Value */}
                        <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap">
                          <span className="text-sm font-bold text-blue-700">
                            {point.value}%
                          </span>
                        </div>

                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* ============================================================
              X-AXIS LABELS
          ============================================================ */}

          <div className="absolute left-10 right-4 bottom-0 grid grid-cols-3">
            {metrics.map(
              (metric) => (
                <div
                  key={metric.label}
                  className="text-center px-1"
                >
                  <span className="text-xs font-medium text-gray-600">
                    {metric.label}
                  </span>
                </div>
              )
            )}
          </div>

          {/* ============================================================
              Y-AXIS TITLE
          ============================================================ */}

          <div className="absolute left-0 top-1/2 -translate-y-1/1 -rotate-90 origin-center">
            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
              Performance (%)
            </span>
          </div>
        </div>

        {/* ================================================================
            X-AXIS TITLE
        ================================================================= */}

        {/* ================================================================
            METRIC SUMMARY

            This stays at the bottom of the card regardless of height.
        ================================================================= */}

        <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-gray-200 shrink-0">
          {metrics.map(
            (metric, index) => (
              <div
                key={metric.label}
                className="text-center"
              >
                <p className="text-xs text-gray-500 mb-1">
                  {metric.label}
                </p>

                <p className="text-lg font-bold text-gray-800">
                  {animatedValues[index]}%
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}