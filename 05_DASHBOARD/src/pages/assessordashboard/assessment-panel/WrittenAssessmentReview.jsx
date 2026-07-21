import { useState } from "react";
import {
  useLocation,
  Navigate,
  useNavigate,
} from "react-router-dom";

import AssessorBreadcrumbs from "../../../components/assessordashboard/flow/AssessorBreadcrumbs";
import ConfirmationModal from "../../../components/assessordashboard/flow/ConfirmationModal";
import AssessorPageHeader from "../../../components/assessordashboard/shared/AssessorPageHeader";

import TraineeInfoCard from "../../../components/assessordashboard/assessment-panel/written-review/TraineeInfoCard";
import AssessmentSummaryCard from "../../../components/assessordashboard/assessment-panel/written-review/AssessmentSummaryCard";
import QuestionReviewTable from "../../../components/assessordashboard/assessment-panel/written-review/QuestionReviewTable";
import AssessorValidationCard from "../../../components/assessordashboard/assessment-panel/written-review/AssessorValidationCard";
import AICognitiveInsightsCard from "../../../components/assessordashboard/assessment-panel/written-review/AICognitiveInsightsCard";

export default function WrittenAssessmentReview() {
  const navigate = useNavigate();
  const { state } = useLocation();

  // ==========================================================
  // Data passed from AssessmentOverview.jsx
  // ==========================================================
  const trainee = state?.trainee;
  const assessment = state?.assessment;
  const selectedCourse =
    state?.selectedCourse || assessment?.courseName;

  // ==========================================================
  // BACKEND HANDOFF:
  // Replace with submitted answers from database.
  // ==========================================================
  const questions =
    state?.questions ??
    [
      {
        id: 1,
        question:
          "What is the primary purpose of calibration before robotic assembly?",
        traineeAnswer:
          "To ensure machine accuracy.",
        correctAnswer:
          "To ensure machine accuracy.",
        score: 5,
        points: 5,
      },
      {
        id: 2,
        question:
          "Which sensor detects object proximity?",
        traineeAnswer:
          "Infrared Sensor",
        correctAnswer:
          "Ultrasonic Sensor",
        score: 0,
        points: 5,
      },
      {
        id: 3,
        question:
          "Explain the emergency shutdown procedure.",
        traineeAnswer:
          "Press emergency stop then disconnect power.",
        correctAnswer:
          "Press emergency stop then disconnect power.",
        score: 10,
        points: 10,
      },
    ];

  // ==========================================================
  // Local State
  // ==========================================================
  const [validated, setValidated] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [overrideMode, setOverrideMode] = useState(false);

  // Prevent opening page directly
  if (!trainee || !assessment) {
    return (
      <Navigate
        to="/assessor/assessment-panel"
        replace
      />
    );
  }

  // ==========================================================
  // Actions
  // ==========================================================
  const handleBack = () => {
    navigate(-1);
  };

  const handleFinalize = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmFinalize = () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);

    // BACKEND HANDOFF:
    // Save written assessment, remarks, validation,
    // AI insights, etc.

    setTimeout(() => {
      setIsSubmitting(false);
      setIsFinalized(true);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
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
              courseId: assessment.id,
              courseCode: assessment.courseCode,
            },
          },
          {
            label: trainee.fullName,
            to: "/assessor/assessment-panel/assessment-overview",
            state: {
              trainee,
              assessment,
              selectedCourse,
            },
          },
          {
            label: "Written Assessment Review",
          },
        ]}
      />

      <AssessorPageHeader
        title="Written Assessment Review"
        subtitle="Review the trainee's submitted answers before finalizing the evaluation."
      />

      {isFinalized && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
          Written assessment has been finalized successfully.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TraineeInfoCard
          trainee={trainee}
          assessment={assessment}
        />

        <AssessmentSummaryCard
          assessment={assessment}
        />
      </div>

      <QuestionReviewTable questions={questions} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AssessorValidationCard
            validated={validated}
            setValidated={setValidated}
            overrideMode={overrideMode}
            setOverrideMode={setOverrideMode}
            remarks={remarks}
            setRemarks={setRemarks}
          />
        </div>

        <div>
          <AICognitiveInsightsCard
            validated={validated}
            overrideMode={overrideMode}
            isSubmitting={isSubmitting}
            onFinalize={handleFinalize}
          />
        </div>
      </div>

      <ConfirmationModal
        open={showConfirmModal}
        title="Finalize Evaluation?"
        message="This action will finalize the written assessment review. Please confirm that all answers, remarks, and AI insights have been reviewed."
        confirmLabel="Finalize Evaluation"
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmFinalize}
      />
    </div>
  );
}