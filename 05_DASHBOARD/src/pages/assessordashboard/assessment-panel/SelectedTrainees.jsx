import { useNavigate, useLocation } from "react-router-dom";

import AssessorBreadcrumbs from "../../../components/assessordashboard/flow/AssessorBreadcrumbs";
import SelectedTraineesTable from "../../../components/assessordashboard/flow/SelectedTraineesTable";
import AssessorPageHeader from "../../../components/assessordashboard/shared/AssessorPageHeader";
import { useAssessments } from "../../../context/AssessmentContext";

export default function SelectedTrainees() {
  const navigate = useNavigate();
  const { state } = useLocation();

  // ==========================================================
  // Course selected from Assessment Panel
  // ==========================================================
  const selectedCourse = state?.selectedCourse;
  const courseId = state?.courseId;
  const courseCode = state?.courseCode;

  // ==========================================================
  // BACKEND HANDOFF:
  // Replace with trainees fetched for the selected course.
  // ==========================================================
  const trainees = [
    {
      id: 1,
      fullName: "Ahmad Khan",
      traineeId: "#TRA-A001",
      course: selectedCourse,
      status: "Not Started",
    },
    {
      id: 2,
      fullName: "Maria Santos",
      traineeId: "#TRA-M002",
      course: selectedCourse,
      status: "Completed",
    },
    {
      id: 3,
      fullName: "Kenji Tanaka",
      traineeId: "#TRA-K003",
      course: selectedCourse,
      status: "Not Started",
    },
    {
      id: 4,
      fullName: "Isabelle Dubois",
      traineeId: "#TRA-I004",
      course: selectedCourse,
      status: "Completed",
    },
  ];

  // ==========================================================
  // Assessment Context
  // ==========================================================
  const {
    setSelectedAssessment,
    setSelectedTrainee,
  } = useAssessments();

  const handleViewAssessment = (trainee) => {
    const assessment = {
      id: courseId,
      courseCode,
      courseName: selectedCourse,
    };

    // Save selected assessment and trainee
    setSelectedAssessment(assessment);
    setSelectedTrainee(trainee);

    // Navigate to Assessment Overview
    navigate("/assessor/assessment-panel/assessment-overview", {
      state: {
        trainee,
        assessment,
        selectedCourse,
        courseId,
        courseCode,
      },
    });
  };

  return (
    <div className="space-y-6">
      <AssessorBreadcrumbs
        items={[
          {
            label: "Assessment Panel",
            to: "/assessor/assessment-panel",
          },
          {
            label: `${selectedCourse} #${courseCode}`,
          },
        ]}
      />

      <AssessorPageHeader
        title={`Trainees for ${selectedCourse}`}
        subtitle="Select a trainee to review and begin the assessment."
      />

      <SelectedTraineesTable
        trainees={trainees}
        actionLabel="View Assessment"
        onAction={handleViewAssessment}
      />
    </div>
  );
}