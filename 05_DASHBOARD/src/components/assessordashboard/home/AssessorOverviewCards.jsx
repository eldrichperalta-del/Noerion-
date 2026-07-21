import {
  ClipboardCheck,
  ClipboardList,
  Clock3,
} from "lucide-react";

import AssessorMetricCard from "../shared/AssessorMetricCard";

export default function AssessorOverviewCards({ stats }) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      <AssessorMetricCard
        label="Assigned Assessments"
        value={stats.assignedAssessments}
        icon={ClipboardList}
        tone="blue"
      />

      <AssessorMetricCard
        label="Ongoing Assessments"
        value={stats.ongoingAssessments}
        icon={Clock3}
        tone="amber"
      />

      <AssessorMetricCard
        label="Completed Evaluations"
        value={stats.completedEvaluations}
        icon={ClipboardCheck}
        tone="green"
      />
    </div>
  );
}
