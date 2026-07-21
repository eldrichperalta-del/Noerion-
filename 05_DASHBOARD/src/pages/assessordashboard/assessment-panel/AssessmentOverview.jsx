import {
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useAssessments } from "../../../context/AssessmentContext";

import AssessorBreadcrumbs from "../../../components/assessordashboard/flow/AssessorBreadcrumbs";
import AssessmentOverviewPanel from "../../../components/assessordashboard/flow/AssessmentOverviewPanel";
import AssessorPageHeader from "../../../components/assessordashboard/shared/AssessorPageHeader";

export default function AssessmentOverview() {
  const navigate = useNavigate();

  const { state } = useLocation();

  const {
    selectedAssessment,
    selectedTrainee,
  } = useAssessments();

  const trainee =
    selectedTrainee || state?.trainee;

  const assessment =
    selectedAssessment || state?.assessment;

  const selectedCourse =
    state?.selectedCourse ||
    assessment?.courseName;

  // ==========================================================
  // Prevent direct access if no trainee/assessment is selected
  // ==========================================================
  if (!trainee || !assessment) {
    return (
      <Navigate
        to="/assessor/assessment-panel"
        replace
      />
    );
  }

  // ==========================================================
  // BACKEND HANDOFF:
  // Replace with assessment status retrieved from database.
  // ==========================================================
  const assessmentSections = [
    {
      id: 1,
      title: "Written Assessment",
      description:
        "Evaluates theoretical knowledge of course concepts.",
      status: trainee.status,
      eegStatus: "Waiting for Connection",
    },
  ];

  return (
    <div className="space-y-6">
      <AssessorBreadcrumbs
        items={[
          {
            label: "Assessment Panel",
            to: "/assessor/assessment-panel",
          },
          {
            label: selectedCourse,
            to: "/assessor/assessment-panel/selected-trainees",
            state: {
              selectedCourse,
            },
          },
          {
            label: trainee.fullName,
          },
        ]}
      />

      <AssessorPageHeader
        title="Assessment Overview"
        subtitle="Review trainee information before starting the written assessment."
      />

      <AssessmentOverviewPanel
        trainee={trainee}
        assessment={assessment}
        sections={assessmentSections}
        onEvaluate={() =>
          navigate("/assessor/assessment-panel/written-review", {
            state: {
              trainee,
              assessment,
              selectedCourse,
            },
          })
        }
      />
    </div>
  );
}