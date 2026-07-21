import {
  Activity,
  ClipboardCheck,
  TrendingUp,
} from "lucide-react";

import AssessorMetricCard from "../shared/AssessorMetricCard";

// ============================================================================
// BACKEND HANDOFF
// Summary statistics are currently derived from the supplied history records.
// If the backend provides precomputed dashboard metrics, replace these
// calculations with the values returned by the API.
// ============================================================================

export default function HistorySummaryCards({ history }) {
  const totalAssessments = history.length;

  const competentCount = history.filter(
    (record) => record.finalResult === "Competent"
  ).length;

  const passRate =
    totalAssessments === 0
      ? 0
      : Math.round((competentCount / totalAssessments) * 100);

  // Mock logic:
  // Counts records completed on the most recent date.
  const latestDate =
    history.length > 0
      ? history[0].completedDate
      : null;

  const recentActivity = history.filter(
    (record) => record.completedDate === latestDate
  ).length;

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      <AssessorMetricCard
        icon={ClipboardCheck}
        label="Total Assessments Completed"
        value={totalAssessments}
        tone="blue"
      />

      <AssessorMetricCard
        icon={TrendingUp}
        label="Pass Rate"
        value={`${passRate}%`}
        tone="green"
      />

      <AssessorMetricCard
        icon={Activity}
        label="Recent Activity"
        value={recentActivity}
        tone="amber"
      />
    </div>
  );
}