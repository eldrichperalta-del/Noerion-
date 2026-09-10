import {
  Link,
  useLocation,
  Navigate,
} from "react-router-dom";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import SummaryInfoCards from "../../components/traineedashboard/assessment-summary/SummaryInfoCards";
import PerformanceBreakdown from "../../components/traineedashboard/assessment-summary/PerformanceBreakdown";
import EEGAggregatedSummary from "../../components/traineedashboard/assessment-summary/EEGAggregatedSummary";
import CognitiveMetrics from "../../components/traineedashboard/assessment-summary/CognitiveMetrics";
import AICognitiveInsights from "../../components/traineedashboard/assessment-summary/AICognitiveInsights";
import AssessorFeedback from "../../components/traineedashboard/assessment-summary/AssessorFeedback";
import AIRecommendations from "../../components/traineedashboard/assessment-summary/AIRecommendations";
import KeyInsights from "../../components/traineedashboard/assessment-summary/KeyInsights";
import ActionsCard from "../../components/traineedashboard/assessment-summary/ActionsCard";
import DashboardPageHeader from "../../components/common/DashboardPageHeader";

export default function AssessmentSummary() {
  const { state } = useLocation();

  /*
   * ================================================================
   * PREVENT DIRECT ACCESS WITHOUT ASSESSMENT DATA
   * ================================================================
   */

  if (!state?.assessment) {
    return (
      <Navigate
        to="/trainee/results"
        replace
      />
    );
  }

  const assessment = state.assessment;

  console.log(
    "Assessment object loaded:",
    assessment
  );

  /*
   * ================================================================
   * SUBMISSION ID
   * ================================================================
   */

  const submissionId =
    assessment?.submission_id ||
    assessment?.submissionId ||
    assessment?.id ||
    assessment?.assessment_id;

  /*
   * ================================================================
   * AI COGNITIVE INSIGHTS HEIGHT
   *
   * AI Cognitive Insights is the MASTER container.
   *
   * Cognitive Metrics will receive this exact height.
   * ================================================================
   */

  const aiInsightsRef = useRef(null);

  const [
    aiInsightsHeight,
    setAiInsightsHeight,
  ] = useState(0);

  useEffect(() => {
    const element =
      aiInsightsRef.current;

    if (!element) {
      return;
    }

    const updateHeight = () => {
      const height =
        element.getBoundingClientRect()
          .height;

      if (height > 0) {
        setAiInsightsHeight(
          Math.round(height)
        );
      }
    };

    // Initial measurement
    updateHeight();

    /*
     * Observe every size change.
     */
    const observer =
      new ResizeObserver(() => {
        updateHeight();
      });

    observer.observe(element);

    /*
     * Also check shortly after rendering because
     * AI content may load asynchronously.
     */
    const timer1 = setTimeout(
      updateHeight,
      100
    );

    const timer2 = setTimeout(
      updateHeight,
      500
    );

    const timer3 = setTimeout(
      updateHeight,
      1000
    );

    return () => {
      observer.disconnect();

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [assessment, submissionId]);

  return (
    <div className="space-y-6">

      {/* ================================================================
          BREADCRUMBS
      ================================================================= */}

      <nav className="flex gap-2 text-sm font-semibold">
        <Link
          to="/trainee/results"
          className="text-gray-500 hover:text-[#002f86] hover:underline"
        >
          Results
        </Link>

        <span>&gt;</span>

        <span className="text-[#002f86]">
          Assessment Summary
        </span>
      </nav>

      {/* ================================================================
          PAGE HEADER
      ================================================================= */}

      <DashboardPageHeader
        title="Assessment Summary"
        subtitle="Review your performance, cognitive insights, and assessment feedback."
      />

      {/* ================================================================
          TOP SUMMARY
      ================================================================= */}

      <SummaryInfoCards
        assessment={assessment}
      />

      {/* ================================================================
          ROW 1
          
          Performance Breakdown | EEG Aggregated Summary
      ================================================================= */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">

        <PerformanceBreakdown
          assessment={assessment}
        />

        <EEGAggregatedSummary
          assessment={assessment}
        />

      </div>

      {/* ================================================================
          ROW 2
          
          Cognitive Metrics | AI Cognitive Insights
          
          IMPORTANT:
          
          AI Cognitive Insights determines the height.
          
          Cognitive Metrics receives that height.
      ================================================================= */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

        {/* ============================================================
            COGNITIVE METRICS
        ============================================================ */}

        <div
          className="w-full"
          style={
            aiInsightsHeight > 0
              ? {
                  height: `${aiInsightsHeight}px`,
                }
              : undefined
          }
        >
          <CognitiveMetrics
            assessment={assessment}
            containerHeight={
              aiInsightsHeight
            }
          />
        </div>

        {/* ============================================================
            AI COGNITIVE INSIGHTS
          
            THIS IS THE MASTER HEIGHT.
        ============================================================ */}

        <div
          ref={aiInsightsRef}
          className="w-full self-start"
        >
          <AICognitiveInsights
            submissionId={submissionId}
            assessment={assessment}
          />
        </div>

      </div>

      {/* ================================================================
          ROW 3
          
          Assessor Feedback | AI Feedback & Recommendations
      ================================================================= */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">

        <AssessorFeedback
          submissionId={submissionId}
          traineeId={
            assessment?.trainee_id
          }
          assessmentId={
            assessment?.assessment_id
          }
          assessment={assessment}
        />

        <AIRecommendations
          submissionId={submissionId}
          assessment={assessment}
        />

      </div>

      {/* ================================================================
          ROW 4
          
          Key Insights | Actions
      ================================================================= */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">

        <KeyInsights
          submissionId={submissionId}
          assessment={assessment}
        />

        <ActionsCard
          assessment={assessment}
        />

      </div>

    </div>
  );
}