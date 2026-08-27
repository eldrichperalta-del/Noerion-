import { useEffect, useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";

import { supabase } from "../../../supabaseClient.js";
import { useAssessments } from "../../../context/AssessmentContext.jsx";

import AssessorBreadcrumbs from "../../../components/assessordashboard/flow/AssessorBreadcrumbs.jsx";
import AssessmentOverviewPanel from "../../../components/assessordashboard/flow/AssessmentOverviewPanel.jsx";
import AssessorPageHeader from "../../../components/assessordashboard/shared/AssessorPageHeader.jsx";

export default function AssessmentOverview() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const { selectedAssessment, selectedTrainee } = useAssessments();

  const trainee = selectedTrainee || state?.trainee;
  const assessment = selectedAssessment || state?.assessment;

  const selectedCourse =
    state?.selectedCourse || assessment?.courseName;

  const batchCode =
    state?.batchCode || trainee?.batchCode;

  // ==========================================================
  // LOCAL STATE
  // ==========================================================

  const [assessmentDetails, setAssessmentDetails] =
    useState(null);

  const [currentStatus, setCurrentStatus] =
    useState("Not Started");

  const [loading, setLoading] =
    useState(true);

  // ==========================================================
  // FETCH ASSESSMENT + SUBMISSION STATUS
  // ==========================================================

  useEffect(() => {
    async function fetchAssessmentData() {
      if (!assessment?.id || !trainee) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // ======================================================
        // 1. FETCH ASSESSMENT DETAILS
        // ======================================================

        const {
          data: assessmentData,
          error: assessmentError,
        } = await supabase
          .from("assessments")
          .select(
            "total_items, time_limit_minutes, set_type"
          )
          .eq("id", assessment.id)
          .single();

        if (assessmentError) {
          console.error(
            "Assessment details error:",
            assessmentError
          );
        }

        if (assessmentData) {
          setAssessmentDetails({
            totalItems:
              assessmentData.total_items || 40,

            duration:
              assessmentData.time_limit_minutes || 40,

            setType:
              assessmentData.set_type ||
              "Multiple Choice",
          });
        }

        // ======================================================
        // 2. FIND TRAINEE UUID
        // ======================================================

        const traineeUuid =
          trainee?.user_id ||
          trainee?.userId ||
          trainee?.profile_id ||
          trainee?.id;

        // ======================================================
        // 3. FETCH ACTUAL SUBMISSION STATUS
        // ======================================================

        let submissionQuery =
          supabase
            .from("assessment_submissions")
            .select(
              "id, status, overall_result, passed, total_score"
            )
            .eq("assessment_id", assessment.id)
            .order("created_at", {
              ascending: false,
            })
            .limit(1);

        if (traineeUuid) {
          submissionQuery =
            submissionQuery.eq(
              "trainee_id",
              traineeUuid
            );
        }

        const {
          data: submissionData,
          error: submissionError,
        } = await submissionQuery.maybeSingle();

        if (submissionError) {
          console.error(
            "Submission status error:",
            submissionError
          );
        }

        // ======================================================
        // 4. DETERMINE STATUS
        // ======================================================

        if (submissionData?.status) {
          const normalizedStatus =
            String(submissionData.status)
              .trim()
              .toLowerCase();

          if (
            normalizedStatus === "evaluated"
          ) {
            setCurrentStatus("Evaluated");
          } else if (
            normalizedStatus === "submitted"
          ) {
            setCurrentStatus("Submitted");
          } else if (
            normalizedStatus === "in_progress"
          ) {
            setCurrentStatus("In Progress");
          } else {
            setCurrentStatus(
              trainee.status || "Not Started"
            );
          }
        } else {
          // No submission found, so use the trainee's
          // existing status as a fallback.
          setCurrentStatus(
            trainee.status || "Not Started"
          );
        }
      } catch (error) {
        console.error(
          "Error fetching assessment overview:",
          error
        );

        // Safe fallback
        setCurrentStatus(
          trainee?.status || "Not Started"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchAssessmentData();
  }, [assessment?.id, trainee]);

  // ==========================================================
  // PREVENT DIRECT ACCESS
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
  // STATUS
  // ==========================================================

  const isEvaluated =
    currentStatus.toLowerCase() === "evaluated";

  // ==========================================================
  // ASSESSMENT SECTIONS
  // ==========================================================

  const assessmentSections = [
    {
      id: 1,

      title: "Written Assessment",

      description:
        "Evaluates theoretical knowledge of course concepts.",

      status: currentStatus,

      eegStatus:
        currentStatus === "Submitted" ||
        currentStatus === "Evaluated"
          ? currentStatus === "Evaluated"
            ? "Evaluation Complete"
            : "Recording Complete"
          : "Waiting for Connection",
    },
  ];

  // ==========================================================
  // BUTTON ACTION
  // ==========================================================

  const handleEvaluate = () => {
    // ========================================================
    // IMPORTANT:
    // The AssessmentOverviewPanel already disables the
    // button when status === "Evaluated".
    //
    // This guard is an additional safety check.
    // ========================================================

    if (isEvaluated) {
      return;
    }

    navigate(
      "/assessor/assessment-panel/written-review",
      {
        state: {
          trainee,
          assessment,
          selectedCourse,
          batchId: state?.batchId,
          assignmentId: state?.assignmentId,
          batchCode,
          readOnly: false,
        },
      }
    );
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-6">
      <AssessorBreadcrumbs
        items={[
          {
            label: "Assessment Panel",
            to: "/assessor/assessment-panel",
          },

          {
            label: `${selectedCourse} ${
              batchCode
                ? `(${batchCode})`
                : ""
            }`,

            to:
              "/assessor/assessment-panel/selected-trainees",

            state: {
              selectedCourse,
              batchId: state?.batchId,
              assessmentId: assessment?.id,
              batchCode,
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

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white py-12 text-center font-medium text-gray-500 shadow-sm">
          Loading assessment details...
        </div>
      ) : (
        <AssessmentOverviewPanel
          trainee={trainee}
          assessment={assessment}
          sections={assessmentSections}
          details={assessmentDetails}
          onEvaluate={handleEvaluate}
        />
      )}
    </div>
  );
}