import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import AssessorBreadcrumbs from "../../../components/assessordashboard/flow/AssessorBreadcrumbs";
import SelectedTraineesTable from "../../../components/assessordashboard/flow/SelectedTraineesTable";
import AssessorPageHeader from "../../../components/assessordashboard/shared/AssessorPageHeader";

/* ============================================================================
   FRONTEND NOTE
   ----------------------------------------------------------------------------
   This page receives the selected course from EvaluationCourseCard.jsx using
   React Router state.

   Navigation Flow

   Assigned Courses
          │
          ▼
   Trainees For Evaluation
          │
          ▼
   Evaluation Summary
          │
          ▼
   AI Analysis & Insights
          │
          ▼
   Finalize Evaluation

   The same selectedCourse object should be forwarded throughout the
   evaluation workflow.

============================================================================ */

/* ============================================================================
   BACKEND HANDOFF
   ----------------------------------------------------------------------------
   Replace this mock trainee array with data retrieved from the backend.

   Suggested Endpoint

   GET /assessor/evaluations/{courseId}/trainees

   Expected Response

   [
      {
         id,
         traineeId,
         fullName,
         assessmentType,
         schedule,
         status
      }
   ]

   Where

   id
      Internal trainee identifier.

   traineeId
      Public trainee number.

   fullName
      Complete trainee name.

   assessmentType
      Written / Practical / Written + Practical.

   schedule
      Scheduled assessment date.

   status
      Pending
      Completed

   IMPORTANT

   Only trainees assigned to the selected qualification should be returned.

============================================================================ */

const traineesForEvaluation = [
  {
    id: 1,
    fullName: "Juan Dela Cruz",
    traineeId: "NOE-TRAINEE-001",
    assessmentType: "Written + Practical",
    schedule: "April 15, 2025 - 09:00 AM",
    status: "Pending",
  },
  {
    id: 2,
    fullName: "Maria Santos",
    traineeId: "NOE-TRAINEE-002",
    assessmentType: "Practical Exam",
    schedule: "April 16, 2025 - 02:00 PM",
    status: "Pending",
  },
  {
    id: 3,
    fullName: "Maria Garcia",
    traineeId: "NOE-TRAINEE-003",
    assessmentType: "Written + Practical",
    schedule: "April 16, 2025 - 02:00 PM",
    status: "Completed",
  },
];

export default function TraineesForEvaluation() {
  const navigate = useNavigate();
  const { state } = useLocation();

  /* ==========================================================================
     FRONTEND STATE
     --------------------------------------------------------------------------
     selectedCourse is received from EvaluationCourseCard.jsx.

     Example

     {
        id,
        qualificationName,
        totalTrainees,
        completedEvaluations
     }

     A fallback is included so the page does not crash during development.
  ========================================================================== */

  const selectedCourse = state?.selectedCourse ?? {
    id: null,
    qualificationName: "Unknown Qualification",
  };

  /* ==========================================================================
     Navigate to Evaluation Summary

     FRONTEND
     --------------------------------------------------------------------------
     Only trainees whose assessment status is "Completed" are allowed to
     proceed to the evaluation workflow.

     The SelectedTraineesTable disables the Evaluate button for Pending
     trainees. This function provides an additional safeguard by preventing
     navigation if triggered manually.

     Pass BOTH

     • selectedCourse
     • selectedTrainee

     so succeeding pages can display

     ✓ Breadcrumb
     ✓ Trainee Information Card
     ✓ AI Analysis
     ✓ Finalize Evaluation

     without using hardcoded values.

     BACKEND HANDOFF
     --------------------------------------------------------------------------
     The backend should also enforce this validation.

     If the trainee's assessment status is still "Pending", the API should
     reject the request even if a user manually accesses the route.

     Suggested responses:

     • HTTP 403 Forbidden
     • HTTP 400 Bad Request
  ========================================================================== */

  const handleEvaluate = (selectedTrainee) => {
    // Prevent navigation while assessment is still pending
    if (selectedTrainee.status === "Pending") {
      return;
    }

    navigate("/assessor/evaluation/summary", {
      state: {
        selectedCourse,
        selectedTrainee,
      },
    });
  };

  return (
    <div className="space-y-6">
      <AssessorBreadcrumbs
        items={[
          {
            label: selectedCourse.qualificationName,
            to: "/assessor/evaluation",
          },
          "Trainees Evaluation",
        ]}
      />

      <AssessorPageHeader
        title="Trainees for Evaluation"
        subtitle="Select a trainee to continue the evaluation summary."
      />

      <SelectedTraineesTable
        trainees={traineesForEvaluation}
        actionLabel="Evaluate"
        onAction={handleEvaluate}
      />
    </div>
  );
}