import { Link, useLocation, Navigate } from "react-router-dom";

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

  // Prevent opening the page directly without data
  if (!state?.assessment) {
    return <Navigate to="/trainee/results" replace />;
  }

  const assessment = state.assessment;

  return (
    <div className="space-y-6">
      <nav className="flex gap-2 text-sm font-semibold"><Link to="/trainee/results" className="text-gray-500 hover:text-[#002f86] hover:underline">Results</Link><span>&gt;</span><span className="text-[#002f86]">Assessment Summary</span></nav>
      <DashboardPageHeader title="Assessment Summary" subtitle="Review your performance, cognitive insights, and assessment feedback." />

      <SummaryInfoCards assessment={assessment} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <PerformanceBreakdown assessment={assessment} />
        <EEGAggregatedSummary assessment={assessment} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-6">
        <CognitiveMetrics assessment={assessment} />
        <AICognitiveInsights assessment={assessment} />
        <AssessorFeedback assessment={assessment} />
        <AIRecommendations assessment={assessment} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          <KeyInsights assessment={assessment} />
        </div>

        <ActionsCard assessment={assessment} />
      </div>

    </div>
  );
}
