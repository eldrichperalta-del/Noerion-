import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient.js";

import AssessorBreadcrumbs from "../../../components/assessordashboard/flow/AssessorBreadcrumbs";
import AssessorPageHeader from "../../../components/assessordashboard/shared/AssessorPageHeader";

import TraineeInformationCard from "../../../components/assessordashboard/evaluation-summary/TraineeInformationCard";
import AIResultSummaryCard from "../../../components/assessordashboard/ai-analysis/AIResultSummaryCard";
import EEGInsightsCard from "../../../components/assessordashboard/ai-analysis/EEGInsightsCard";
import PerformancePatternsCard from "../../../components/assessordashboard/ai-analysis/PerformancePatternsCard";
import AIInterpretationCard from "../../../components/assessordashboard/ai-analysis/AIInterpretationCard";
import ProceedDecisionButton from "../../../components/assessordashboard/ai-analysis/ProceedDecisionButton";

import { mockAIAnalysis } from "../../../data/mockAIAnalysis";

export default function AIAnalysisInsights() {
  const navigate = useNavigate();
  const { state } = useLocation();

  /* ============================================================
     NAVIGATION DATA
     ============================================================ */

  const selectedCourse = state?.selectedCourse ?? null;

  const rawTrainee = state?.selectedTrainee ?? null;

  const evaluationSummary =
    state?.evaluationSummary ?? null;

  const evaluationId =
    state?.evaluationId ?? null;

  const assessmentId =
    state?.assessmentId ??
    evaluationSummary?.assessmentId ??
    evaluationSummary?.assessment?.id ??
    rawTrainee?.assessmentId ??
    rawTrainee?.assessment_id ??
    rawTrainee?.submission?.assessment_id ??
    null;

  const assessment =
    state?.assessment ??
    evaluationSummary?.assessment ??
    rawTrainee?.assessment ??
    null;

  const submissionId =
    state?.submissionId ??
    evaluationSummary?.submissionId ??
    rawTrainee?.submissionId ??
    rawTrainee?.submission_id ??
    rawTrainee?.submission?.id ??
    null;

  const batchId =
    state?.batchId ??
    rawTrainee?.batchId ??
    rawTrainee?.batch_id ??
    null;

  const batchCode =
    state?.batchCode ??
    rawTrainee?.batchCode ??
    rawTrainee?.batch_code ??
    null;

  const assignmentId =
    state?.assignmentId ??
    rawTrainee?.assignmentId ??
    rawTrainee?.assignment_id ??
    rawTrainee?.assignment?.id ??
    evaluationSummary?.assignmentId ??
    null;

  /* ============================================================
     COURSE LABEL
     ============================================================ */

  const courseLabel =
    selectedCourse?.qualificationName ??
    selectedCourse?.name ??
    selectedCourse?.courseName ??
    selectedCourse ??
    "Chosen Course";

  /* ============================================================
     NORMALIZE TRAINEE
     ============================================================ */

  const selectedTrainee = {
    ...(rawTrainee || {}),

    id:
      rawTrainee?.id ??
      rawTrainee?.trainee_id ??
      rawTrainee?.user_id ??
      null,

    fullName:
      rawTrainee?.fullName ??
      rawTrainee?.name ??
      rawTrainee?.fullname ??
      "Unknown Trainee",

    traineeId:
      rawTrainee?.traineeId ??
      rawTrainee?.trainee_id ??
      rawTrainee?.id ??
      "-",

    status:
      rawTrainee?.status ??
      "Submitted",

    assessmentId,
    submissionId,
    batchId,
    batchCode,
    assignmentId,
    assessment,
  };

  /* ============================================================
     DATABASE STATE
     ============================================================ */

  const [dbInsights, setDbInsights] =
    useState(null);

  const [aiResultData, setAiResultData] =
    useState(null);

  const [eegMetrics, setEegMetrics] =
    useState(null);

  const [eegLoading, setEegLoading] =
    useState(true);

  /* ============================================================
     EEG CHANGE CALCULATION
     ============================================================ */

  const calculateChange = (
    active,
    baseline
  ) => {
    const activeValue = Number(active);
    const baselineValue = Number(baseline);

    if (
      !Number.isFinite(activeValue) ||
      !Number.isFinite(baselineValue) ||
      baselineValue === 0
    ) {
      return 0;
    }

    return (
      ((activeValue - baselineValue) /
        baselineValue) *
      100
    );
  };

  /* ============================================================
     ROUND VALUE
     ============================================================ */

  const roundValue = (
    value,
    decimals = 2
  ) => {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return 0;
    }

    return Number(
      numericValue.toFixed(decimals)
    );
  };

  /* ============================================================
     FETCH DATA
     ============================================================ */

  useEffect(() => {
    let cancelled = false;

    async function fetchAllData() {
      setEegLoading(true);

      let latestDbInsights = null;

      if (
        !submissionId &&
        !selectedTrainee.id
      ) {
        setEegLoading(false);
        return;
      }

      /* ========================================================
         1. FETCH AI ASSESSMENT INSIGHTS
         ======================================================== */

      if (submissionId) {
        const {
          data: insightsData,
          error: insightsError,
        } = await supabase
          .from("ai_assessment_insights")
          .select(
            `
              overall_summary,
              cognitive_analysis,
              ai_cognitive_insights,
              feedback,
              recommendations,
              strengths,
              areas_for_improvement,
              assessor_strengths,
              assessor_areas_for_improvement,
              confidence_score
            `
          )
          .eq(
            "submission_id",
            submissionId
          )
          .maybeSingle();

        if (insightsError) {
          console.warn(
            "Unable to fetch AI Assessment Insights:",
            insightsError
          );
        } else if (
          insightsData &&
          !cancelled
        ) {
          latestDbInsights = insightsData;
          setDbInsights(
            insightsData
          );
        }
      }

      /* ========================================================
         2. FETCH ASSESSMENT SUBMISSION
         ======================================================== */

      if (submissionId) {
        const {
          data: subData,
          error: subError,
        } = await supabase
          .from("assessment_submissions")
          .select(
            "total_score, passed, overall_result"
          )
          .eq("id", submissionId)
          .maybeSingle();

        if (subError) {
          console.warn(
            "Unable to fetch Submission for AI Result:",
            subError
          );
        } else if (
          subData &&
          !cancelled
        ) {
          const confidenceVal =
            latestDbInsights?.confidence_score !==
              null &&
            latestDbInsights?.confidence_score !==
              undefined
              ? Number(
                  latestDbInsights.confidence_score
                )
              : 0;

          const suggestedResult =
            subData.overall_result &&
            subData.overall_result !==
              "In evaluation"
              ? subData.overall_result
              : subData.passed
              ? "Competent"
              : "Not Yet Competent";

          setAiResultData({
            suggestedResult,
            confidenceLevel:
              `${confidenceVal}%`,
            confidence:
              confidenceVal,
            confidence_level:
              confidenceVal,
            confidenceScore:
              confidenceVal,
            overallSummary:
              latestDbInsights?.overall_summary ??
              null,
          });
        }
      }

      /* ========================================================
         3. IDENTIFY TRAINEE
         ======================================================== */

      const targetTraineeId =
        selectedTrainee.id ||
        selectedTrainee.traineeId;

      console.log(
        "=== EEG ASSESSOR DEBUG ==="
      );

      console.log(
        "targetTraineeId:",
        targetTraineeId
      );

      console.log(
        "submissionId:",
        submissionId
      );

      console.log(
        "assignmentId:",
        assignmentId
      );

      /* ========================================================
         4. FETCH TRAINEE EEG READING
         
         IMPORTANT RELATIONSHIP:

         assessment_submissions.id
                    ↓
         trainee_eeg_readings.submission_id

         trainee_eeg_readings.id
                    ↓
         eeg_active_segments.reading_id
         ======================================================== */

      let matchedReading = null;

      if (targetTraineeId) {
        let eegReadingQuery =
          supabase
            .from(
              "trainee_eeg_readings"
            )
            .select(
              `
                id,
                trainee_id,
                baseline_id,
                submission_id,
                assignment_id,
                status,
                total_segments,
                created_at
              `
            )
            .eq(
              "trainee_id",
              targetTraineeId
            );

        /*
         * submission_id is the strongest match.
         */

        if (submissionId) {
          eegReadingQuery =
            eegReadingQuery.eq(
              "submission_id",
              submissionId
            );
        } else if (
          assignmentId
        ) {
          /*
           * Fallback when submission ID
           * is unavailable.
           */

          eegReadingQuery =
            eegReadingQuery.eq(
              "assignment_id",
              assignmentId
            );
        }

        const {
          data: readings,
          error: readingError,
        } = await eegReadingQuery
          .order(
            "created_at",
            {
              ascending: false,
            }
          )
          .limit(1);

        console.log(
          "readings:",
          readings
        );

        console.log(
          "readingError:",
          readingError
        );

        if (readingError) {
          console.warn(
            "Error fetching trainee EEG reading:",
            readingError
          );
        }

        matchedReading =
          readings &&
          readings.length > 0
            ? readings[0]
            : null;

        console.log(
          "matchedReading:",
          matchedReading
        );
      }

      /* ========================================================
         5. FETCH BASELINE
         ======================================================== */

      let baseline = null;

      /*
       * First use the baseline directly attached
       * to the EEG reading.
       */

      if (
        matchedReading?.baseline_id
      ) {
        const {
          data: baselineData,
          error: baselineError,
        } = await supabase
          .from("eeg_baselines")
          .select(
            `
              id,
              trainee_id,
              focus_reference,
              attention_reference,
              engagement_reference,
              cognitive_load_reference,
              duration_seconds,
              channel_count,
              status,
              created_at
            `
          )
          .eq(
            "id",
            matchedReading.baseline_id
          )
          .maybeSingle();

        if (baselineError) {
          console.warn(
            "Error fetching EEG baseline:",
            baselineError
          );
        } else {
          baseline =
            baselineData;
        }
      }

      /*
       * Fallback to latest completed baseline.
       */

      if (
        !baseline &&
        targetTraineeId
      ) {
        const {
          data: fallbackBaseline,
          error:
            fallbackBaselineError,
        } = await supabase
          .from("eeg_baselines")
          .select(
            `
              id,
              trainee_id,
              focus_reference,
              attention_reference,
              engagement_reference,
              cognitive_load_reference,
              duration_seconds,
              channel_count,
              status,
              created_at
            `
          )
          .eq(
            "trainee_id",
            targetTraineeId
          )
          .eq(
            "status",
            "COMPLETED"
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          )
          .limit(1)
          .maybeSingle();

        if (
          fallbackBaselineError
        ) {
          console.warn(
            "Error fetching fallback EEG baseline:",
            fallbackBaselineError
          );
        } else {
          baseline =
            fallbackBaseline;
        }
      }

      console.log(
        "matchedBaseline:",
        baseline
      );

      /* ========================================================
         6. FETCH ALL ACTIVE EEG SEGMENTS
         
         201 SEGMENTS
                 ↓
         average each metric
                 ↓
         one value per metric
         ======================================================== */

      let segments = [];

      if (
        matchedReading?.id
      ) {
        const {
          data: segmentData,
          error: segmentsError,
        } = await supabase
          .from(
            "eeg_active_segments"
          )
          .select(
            `
              id,
              reading_id,
              attention_pct,
              engagement_pct,
              cognitive_load_pct,
              baseline_id,
              created_at
            `
          )
          .eq(
            "reading_id",
            matchedReading.id
          )
          .order(
            "created_at",
            {
              ascending: true,
            }
          );

        if (segmentsError) {
          console.warn(
            "Error fetching EEG active segments:",
            segmentsError
          );
        } else {
          segments =
            segmentData || [];
        }
      }

      console.log(
        "Active EEG segments count:",
        segments.length
      );

      /* ========================================================
         7. CALCULATE AGGREGATES
         ======================================================== */

      if (
        segments.length > 0
      ) {
        const validAttention =
          segments
            .map((row) =>
              Number(
                row.attention_pct
              )
            )
            .filter(
              Number.isFinite
            );

        const validEngagement =
          segments
            .map((row) =>
              Number(
                row.engagement_pct
              )
            )
            .filter(
              Number.isFinite
            );

        const validCognitiveLoad =
          segments
            .map((row) =>
              Number(
                row.cognitive_load_pct
              )
            )
            .filter(
              Number.isFinite
            );

        const average = (
          values
        ) => {
          if (
            !values.length
          ) {
            return 0;
          }

          return (
            values.reduce(
              (
                sum,
                value
              ) =>
                sum + value,
              0
            ) /
            values.length
          );
        };

        /*
         * 201 rows → ONE average.
         */

        const activeAttentionAverage =
          average(
            validAttention
          );

        const activeEngagementAverage =
          average(
            validEngagement
          );

        const activeCognitiveLoadAverage =
          average(
            validCognitiveLoad
          );

        /* ======================================================
           BASELINES
           ====================================================== */

        const baselineAttention =
          Number(
            baseline?.attention_reference ??
              0
          );

        const baselineEngagement =
          Number(
            baseline?.engagement_reference ??
              0
          );

        const baselineCognitiveLoad =
          Number(
            baseline?.cognitive_load_reference ??
              0
          );

        /* ======================================================
           CHANGE FROM BASELINE
           
           ((active - baseline) / baseline) × 100
           ====================================================== */

        const attentionChange =
          calculateChange(
            activeAttentionAverage,
            baselineAttention
          );

        const engagementChange =
          calculateChange(
            activeEngagementAverage,
            baselineEngagement
          );

        const cognitiveLoadChange =
          calculateChange(
            activeCognitiveLoadAverage,
            baselineCognitiveLoad
          );

        /* ======================================================
           ROUND VALUES
           ====================================================== */

        const attentionValue =
          roundValue(
            activeAttentionAverage
          );

        const engagementValue =
          roundValue(
            activeEngagementAverage
          );

        const cognitiveLoadValue =
          roundValue(
            activeCognitiveLoadAverage
          );

        const attentionChangeValue =
          roundValue(
            attentionChange
          );

        const engagementChangeValue =
          roundValue(
            engagementChange
          );

        const cognitiveLoadChangeValue =
          roundValue(
            cognitiveLoadChange
          );

        /* ======================================================
           DEBUG
           ====================================================== */

        console.log(
          "=== EEG AGGREGATED VALUES ==="
        );

        console.log(
          "Segment count:",
          segments.length
        );

        console.log(
          "Attention active average:",
          attentionValue
        );

        console.log(
          "Attention baseline:",
          baselineAttention
        );

        console.log(
          "Attention change:",
          attentionChangeValue
        );

        console.log(
          "Engagement active average:",
          engagementValue
        );

        console.log(
          "Engagement baseline:",
          baselineEngagement
        );

        console.log(
          "Engagement change:",
          engagementChangeValue
        );

        console.log(
          "Cognitive Load active average:",
          cognitiveLoadValue
        );

        console.log(
          "Cognitive Load baseline:",
          baselineCognitiveLoad
        );

        console.log(
          "Cognitive Load change:",
          cognitiveLoadChangeValue
        );

        /* ======================================================
           STORE EEG METRICS
           ====================================================== */

        if (!cancelled) {
          setEegMetrics({
            readingId:
              matchedReading?.id ??
              null,

            baselineId:
              baseline?.id ??
              matchedReading?.baseline_id ??
              null,

            segmentCount:
              segments.length,

            attention: {
              value:
                attentionValue,

              change:
                attentionChangeValue,

              activeAverage:
                attentionValue,

              baseline:
                roundValue(
                  baselineAttention
                ),

              data:
                validAttention,
            },

            engagement: {
              value:
                engagementValue,

              change:
                engagementChangeValue,

              activeAverage:
                engagementValue,

              baseline:
                roundValue(
                  baselineEngagement
                ),

              data:
                validEngagement,
            },

            cognitiveLoad: {
              value:
                cognitiveLoadValue,

              change:
                cognitiveLoadChangeValue,

              activeAverage:
                cognitiveLoadValue,

              baseline:
                roundValue(
                  baselineCognitiveLoad
                ),

              data:
                validCognitiveLoad,
            },
          });
        }
      } else {
        console.warn(
          "No active EEG segments found for the matched reading."
        );

        if (!cancelled) {
          setEegMetrics(null);
        }
      }

      if (!cancelled) {
        setEegLoading(false);
      }
    }

    fetchAllData();

    return () => {
      cancelled = true;
    };
  }, [
    submissionId,
    selectedTrainee.id,
    selectedTrainee.traineeId,
    evaluationSummary,
    assignmentId,
  ]);

  /* ============================================================
     SAFETY CHECK
     ============================================================ */

  if (
    !selectedCourse ||
    !rawTrainee
  ) {
    return (
      <div className="p-10 text-center">
        Missing evaluation data.
      </div>
    );
  }

  /* ============================================================
     AI ANALYSIS DATA
     
     IMPORTANT:
     EEG mock data is NOT used anymore.
     ============================================================ */

  const aiAnalysis = {
    ...mockAIAnalysis,

    trainee: {
      ...(mockAIAnalysis?.trainee ||
        {}),

      name:
        selectedTrainee.fullName,

      id:
        selectedTrainee.traineeId,

      course:
        courseLabel,
    },
  };

  /* ============================================================
     PROCEED TO FINALIZE EVALUATION
     ============================================================ */

  const handleProceedToDecision =
    () => {
      navigate(
        "/assessor/evaluation/finalize",
        {
          state: {
            selectedCourse,
            selectedTrainee,
            evaluationSummary,
            evaluationId,
            assessmentId,
            assessment,
            submissionId,
            batchId,
            batchCode,
            assignmentId,

            // Pass the exact same AI result displayed
            // by AIResultSummaryCard.
            aiAnalysis: {
              ...aiAnalysis,
              aiResult:
                aiResultData ??
                aiAnalysis?.aiResult ??
                null,
            },
          },
        }
      );
    };

  /* ============================================================
     PAGE
     ============================================================ */

  return (
    <div className="space-y-6">

      {/* ======================================================
          BREADCRUMBS
          ====================================================== */}

      <AssessorBreadcrumbs
        items={[
          {
            label:
              courseLabel,

            to:
              "/assessor/evaluation",

            state: {
              selectedCourse,
            },
          },

          {
            label:
              "Trainees Evaluation",

            to:
              "/assessor/evaluation/trainees",

            state: {
              selectedCourse,
              selectedTrainee,
              batchId,
              assessmentId,
              batchCode,
              evaluationId,
              submissionId,
            },
          },

          {
            label:
              "Evaluation Summary",

            to:
              "/assessor/evaluation/summary",

            state: {
              selectedCourse,
              selectedTrainee,
              evaluationSummary,
              evaluationId,
              assessmentId,
              assessment,
              submissionId,
              batchId,
              batchCode,
              assignmentId,
            },
          },

          "AI Analysis & Insights",
        ]}
      />

      {/* ======================================================
          HEADER
          ====================================================== */}

      <AssessorPageHeader
        title="AI Analysis & Insights"
        subtitle="Review AI-supported insights before the final decision."
      />

      {/* ======================================================
          TRAINEE
          ====================================================== */}

      <TraineeInformationCard
        trainee={
          aiAnalysis.trainee
        }
      />

      {/* ======================================================
          AI RESULT + EEG
          ====================================================== */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        <AIResultSummaryCard
          result={
            aiResultData ||
            aiAnalysis.aiResult
          }
        />

        {/* IMPORTANT:
            Only database EEG metrics are passed.
            No mock EEG fallback.
        */}

        {eegLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex items-center justify-center">
            <p className="text-sm text-gray-500">
              Loading EEG insights...
            </p>
          </div>
        ) : (
          <EEGInsightsCard
            eeg={eegMetrics}
          />
        )}

      </div>

      {/* ======================================================
          PERFORMANCE + INTERPRETATION
          ====================================================== */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        <PerformancePatternsCard
          patterns={{
            strengths:
              dbInsights?.assessor_strengths ??
              [],

            areas_for_improvement:
              dbInsights?.assessor_areas_for_improvement ??
              [],

            notableTrends:
              dbInsights?.ai_cognitive_insights ??
              [],
          }}
        />

        <div className="space-y-6">

          <AIInterpretationCard
            interpretation={
              dbInsights?.cognitive_analysis ??
              aiAnalysis.interpretation
            }
          />

          <div className="flex justify-center">

            <ProceedDecisionButton
              onClick={
                handleProceedToDecision
              }
            />

          </div>

        </div>

      </div>

    </div>
  );
}