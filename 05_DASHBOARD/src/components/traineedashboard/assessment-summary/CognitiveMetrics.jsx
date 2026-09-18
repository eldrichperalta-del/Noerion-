import { useEffect, useState } from "react";
import { Brain } from "lucide-react";
import { supabase } from "../../../supabaseClient";

export default function CognitiveMetrics({
  assessment,
  containerHeight,
}) {
  const [loading, setLoading] = useState(true);

  const [metrics, setMetrics] = useState([
    { label: "Attention", value: 0 },
    { label: "Engagement", value: 0 },
    { label: "Cognitive Load", value: 0 },
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

        const targetSubmissionId =
          assessment?.submission_id || assessment?.id;

        const targetAssignmentId =
          assessment?.assignment_id ||
          assessment?.assignment?.id;

        // ================================================================
        // STEP 1: FIND READING ID FROM TRAINEE_EEG_READINGS
        // ================================================================

        let eegReadingQuery = supabase
          .from("trainee_eeg_readings")
          .select("id, trainee_id")
          .eq("trainee_id", targetTraineeId);

        if (targetSubmissionId) {
          eegReadingQuery = eegReadingQuery.eq(
            "submission_id",
            targetSubmissionId
          );
        } else if (targetAssignmentId) {
          eegReadingQuery = eegReadingQuery.eq(
            "assignment_id",
            targetAssignmentId
          );
        }

        const {
          data: readings,
          error: readingError,
        } = await eegReadingQuery
          .order("created_at", { ascending: false })
          .limit(1);

        if (readingError) {
          console.error(
            "Error fetching trainee_eeg_readings:",
            readingError.message
          );
        }

        const matchedReading =
          readings && readings.length > 0
            ? readings[0]
            : null;

        // ================================================================
        // STEP 2: FETCH EEG ACTIVE SEGMENTS
        // ================================================================

        let segmentsQuery = supabase
          .from("eeg_active_segments")
          .select(
            "attention_pct, engagement_pct, cognitive_load_pct, baseline_id"
          );

        if (matchedReading?.id) {
          segmentsQuery = segmentsQuery.eq(
            "reading_id",
            matchedReading.id
          );
        } else if (targetSubmissionId) {
          segmentsQuery = segmentsQuery.eq(
            "reading_id",
            targetSubmissionId
          );
        } else {
          segmentsQuery = segmentsQuery.eq(
            "trainee_id",
            targetTraineeId
          );
        }

        const {
          data: segments,
          error: segmentsError,
        } = await segmentsQuery.order("created_at", {
          ascending: false,
        });

        if (segmentsError) {
          console.error(
            "Error fetching eeg_active_segments:",
            segmentsError.message
          );

          setLoading(false);
          return;
        }

        // ================================================================
        // STEP 3: FIND THE BASELINE
        // ================================================================

        let baselineQuery = supabase
          .from("eeg_baselines")
          .select(
            "id, attention_reference, engagement_reference, cognitive_load_reference"
          )
          .eq("trainee_id", targetTraineeId)
          .eq("status", "COMPLETED")
          .order("created_at", { ascending: false })
          .limit(1);

        // If active segments have a baseline_id,
        // try to use that exact baseline.
        const segmentBaselineId =
          segments?.find((segment) => segment.baseline_id)
            ?.baseline_id;

        if (segmentBaselineId) {
          baselineQuery = supabase
            .from("eeg_baselines")
            .select(
              "id, attention_reference, engagement_reference, cognitive_load_reference"
            )
            .eq("id", segmentBaselineId)
            .eq("trainee_id", targetTraineeId)
            .maybeSingle();
        }

        const {
          data: baseline,
          error: baselineError,
        } = await baselineQuery;

        if (baselineError) {
          console.error(
            "Error fetching eeg_baselines:",
            baselineError.message
          );
        }

        // ================================================================
        // STEP 4: CALCULATE AVERAGES AND CHANGE FROM BASELINE
        // ================================================================

        if (segments && segments.length > 0) {
          const count = segments.length;

          const rawAttentionAvg =
            segments.reduce(
              (acc, row) =>
                acc + (Number(row.attention_pct) || 0),
              0
            ) / count;

          const rawEngagementAvg =
            segments.reduce(
              (acc, row) =>
                acc + (Number(row.engagement_pct) || 0),
              0
            ) / count;

          const rawCognitiveLoadAvg =
            segments.reduce(
              (acc, row) =>
                acc + (Number(row.cognitive_load_pct) || 0),
              0
            ) / count;

          // ------------------------------------------------
          // Change from baseline:
          //
          // ((Active Average - Baseline) / Baseline) * 100
          //
          // Example:
          // baseline = 0.20
          // active    = 0.30
          // result    = +50%
          // ------------------------------------------------

          const calculateChange = (
            activeAverage,
            baselineValue
          ) => {
            const active =
              Number(activeAverage) || 0;

            const baselineNumber =
              Number(baselineValue) || 0;

            // Prevent division by zero.
            if (baselineNumber === 0) {
              return 0;
            }

            return Math.round(
              ((active - baselineNumber) /
                baselineNumber) *
                100
            );
          };

          const attentionChange = calculateChange(
            rawAttentionAvg,
            baseline?.attention_reference
          );

          const engagementChange = calculateChange(
            rawEngagementAvg,
            baseline?.engagement_reference
          );

          const cognitiveLoadChange = calculateChange(
            rawCognitiveLoadAvg,
            baseline?.cognitive_load_reference
          );

          const updatedMetrics = [
            {
              label: "Attention",
              value: attentionChange,
            },
            {
              label: "Engagement",
              value: engagementChange,
            },
            {
              label: "Cognitive Load",
              value: cognitiveLoadChange,
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
              label: "Attention",
              value: 0,
            },
            {
              label: "Engagement",
              value: 0,
            },
            {
              label: "Cognitive Load",
              value: 0,
            },
          ]);

          setAnimatedValues([
            0,
            0,
            0,
          ]);
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
   * FORMAT DISPLAY VALUE
   * ================================================================
   */

  const formatChange = (value) => {
    const numericValue = Number(value) || 0;

    if (numericValue > 0) {
      return `+${numericValue}%`;
    }

    return `${numericValue}%`;
  };

  /*
   * ================================================================
   * PLOT DATA
   * ================================================================
   *
   * The actual change can be:
   * +44%
   * -5%
   * +121%
   *
   * The graph itself is kept inside the existing 0-100
   * visual area so extreme values do not break the layout.
   */

  const plotPoints = metrics.map((metric, index) => ({
    label: metric.label,
    value: animatedValues[index] || 0,
  }));

  const svgPoints = plotPoints
    .map((point, index) => {
      const x =
        ((index + 0.5) /
          plotPoints.length) *
        100;

      const graphValue = Math.max(
        0,
        Math.min(point.value, 100)
      );

      const y = 100 - graphValue;

      return `${x},${y}`;
    })
    .join(" ");

  /*
   * ================================================================
   * CARD HEIGHT
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
      {/* HEADER */}

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

      {/* MAIN CONTENT */}

      <div className="flex-1 min-h-0 flex flex-col">

        {/* PLOT AREA */}

        <div className="flex-1 min-h-0 relative">

          {/* GRAPH AREA */}

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

            {/* CONNECTING LINE */}

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

            {/* PLOT POINTS */}

            <div className="absolute inset-0">
              {plotPoints.map((point, index) => {
                const xPosition =
                  ((index + 0.5) /
                    plotPoints.length) *
                  100;

                const graphValue = Math.max(
                  0,
                  Math.min(point.value, 100)
                );

                const yPosition =
                  100 - graphValue;

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

                      <div className="absolute w-8 h-8 rounded-full bg-blue-100 opacity-70" />

                      <div className="relative w-4 h-4 rounded-full bg-blue-700 border-2 border-white shadow-md" />

                      <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <span className="text-sm font-bold text-blue-700">
                          {formatChange(point.value)}
                        </span>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* X-AXIS LABELS */}

          <div className="absolute left-10 right-4 bottom-0 grid grid-cols-3">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="text-center px-1"
              >
                <span className="text-xs font-medium text-gray-600">
                  {metric.label}
                </span>
              </div>
            ))}
          </div>

          {/* Y-AXIS TITLE */}

          <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 origin-center">
            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
              Change from Baseline (%)
            </span>
          </div>
        </div>

        {/* METRIC SUMMARY */}

        <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-gray-200 shrink-0">
          {metrics.map((metric, index) => (
            <div
              key={metric.label}
              className="text-center"
            >
              <p className="text-xs text-gray-500 mb-1">
                {metric.label}
              </p>

              <p className="text-lg font-bold text-gray-800">
                {formatChange(
                  animatedValues[index]
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}