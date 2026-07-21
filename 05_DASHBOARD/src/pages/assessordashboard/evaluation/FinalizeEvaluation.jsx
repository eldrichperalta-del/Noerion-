import { useLocation } from "react-router-dom";
import { useState } from "react";

import AssessorBreadcrumbs from "../../../components/assessordashboard/flow/AssessorBreadcrumbs";
import ConfirmationModal from "../../../components/assessordashboard/flow/ConfirmationModal";
import FinalizeEvaluationPanel from "../../../components/assessordashboard/flow/FinalizeEvaluationPanel";
import AssessorPageHeader from "../../../components/assessordashboard/shared/AssessorPageHeader";

/* ============================================================================
   FRONTEND HANDOFF
   ----------------------------------------------------------------------------
   This page is the final step of the assessor evaluation workflow.

   Navigation Flow

   Assigned Courses & Qualifications
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

   The selected course, trainee, evaluation summary, and AI analysis are
   received through React Router navigation state.

   These values should remain consistent throughout the workflow so every
   page displays the same course and trainee information.
============================================================================ */

/* ============================================================================
   BACKEND HANDOFF
   ----------------------------------------------------------------------------
   This page should submit the assessor's final evaluation decision.

   Suggested Endpoint

   POST /assessor/evaluation/finalize

   Suggested Payload

   {
      evaluationId,
      assessorId,
      traineeId,
      qualificationId,
      aiRecommendation,
      aiConfidence,
      finalDecision,
      overrideReason,
      submittedAt
   }

   Required Backend Actions

   • Save assessor decision
   • Save override reason (if assessor overrides AI)
   • Save AI recommendation for audit trail
   • Record submission timestamp
   • Lock evaluation from further editing
   • Trigger certificate eligibility workflow
   • Write audit log

============================================================================ */

export default function FinalizeEvaluation() {
  const { state } = useLocation();

  const [showConfirmModal, setShowConfirmModal] =
    useState(false);

  /* ==========================================================================
     Navigation State

     Received from AIAnalysisInsights.jsx.

     Temporary fallback values are included for frontend development.
  ========================================================================== */

  const selectedCourse = state?.selectedCourse ?? {
    id: null,
    qualificationName: "Unknown Qualification",
  };

  const selectedTrainee = state?.selectedTrainee ?? {
    id: null,
    fullName: "Unknown Trainee",
    traineeId: "-",
  };

  const evaluationSummary =
    state?.evaluationSummary ?? null;

  const aiAnalysis =
    state?.aiAnalysis ?? null;

  const evaluationId =
    state?.evaluationId ?? null;

  /* ==========================================================================
     Submit Final Decision

     BACKEND

     Replace this function with the API call that submits the assessor's
     final decision.

     Example

     POST /assessor/evaluation/finalize

     Payload

     {
        evaluationId,
        assessorId,
        traineeId,
        qualificationId,
        finalDecision,
        overrideReason,
        aiRecommendation,
        aiConfidence
     }
  ========================================================================== */

  const handleConfirmSubmit = async () => {
    console.log("Evaluation ID:", evaluationId);
    console.log("Selected Course:", selectedCourse);
    console.log("Selected Trainee:", selectedTrainee);
    console.log("Evaluation Summary:", evaluationSummary);
    console.log("AI Analysis:", aiAnalysis);

    /*
    await api.post("/assessor/evaluation/finalize", {
        evaluationId,
        traineeId: selectedTrainee.id,
        qualificationId: selectedCourse.id,
        finalDecision,
        overrideReason,
        aiRecommendation,
        aiConfidence
    });
    */

    setShowConfirmModal(false);
  };

  return (
    <div className="space-y-6">
      <AssessorBreadcrumbs
        items={[
          {
            label:
              selectedCourse.qualificationName,
            to: "/assessor/evaluation",
          },
          {
            label: "Trainees Evaluation",
            to: "/assessor/evaluation/trainees",
          },
          {
            label: "Evaluation Summary",
            to: "/assessor/evaluation/summary",
            state: {
              selectedCourse,
              selectedTrainee,
              evaluationSummary,
              evaluationId,
              aiAnalysis,
            },
          },
          {
            label: "Analysis & Insights",
            to: "/assessor/evaluation/ai-analysis",
            state: {
              selectedCourse,
              selectedTrainee,
              evaluationSummary,
              evaluationId,
              aiAnalysis,
            },
          },
          "Finalize Evaluation",
        ]}
      />

      <AssessorPageHeader
        title="Finalize Evaluation"
        subtitle="Submit the final evaluation decision for review and certificate processing."
      />

      <FinalizeEvaluationPanel
        trainee={{
          name: selectedTrainee.fullName,
          id: selectedTrainee.traineeId,
          course: selectedCourse.qualificationName,
        }}
        aiResult={aiAnalysis?.aiResult}
        onSubmit={() => setShowConfirmModal(true)}
      />

      <ConfirmationModal
        open={showConfirmModal}
        title="Submit Final Decision?"
        message="This will submit the final evaluation decision for review and certificate processing."
        confirmLabel="Submit Decision"
        onCancel={() =>
          setShowConfirmModal(false)
        }
        onConfirm={handleConfirmSubmit}
      />
    </div>
  );
}