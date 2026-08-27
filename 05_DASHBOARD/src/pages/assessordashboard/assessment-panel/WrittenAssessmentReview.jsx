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

  const batchCode =
    state?.batchCode ||
    trainee?.batchCode;

  const [assessmentDetails, setAssessmentDetails] =
    useState(null);

  const [submissionStatus, setSubmissionStatus] =
    useState(null);

  const [submissionResult, setSubmissionResult] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  // ==========================================================
  // FETCH ASSESSMENT + SUBMISSION DETAILS
  // ==========================================================

  useEffect(() => {
    async function fetchAssessmentDetails() {
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
            "Error fetching assessment details:",
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

        const uuidRegex =
          /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

        const candidateTraineeIds = [
          trainee?.id,
          trainee?.user_id,
          trainee?.userId,
          trainee?.profile_id,
          trainee?.trainee_id,
        ].filter(
          (value) =>
            value &&
            typeof value === "string" &&
            uuidRegex.test(value)
        );

        // ======================================================
        // 3. FETCH LATEST SUBMISSION
        // ======================================================

        let submission = null;

        for (const traineeId of candidateTraineeIds) {
          const {
            data,
            error,
          } = await supabase
            .from("assessment_submissions")
            .select(
              `
                id,
                status,
                overall_result,
                passed,
                total_score,
                created_at,
                updated_at
              `
            )
            .eq(
              "assessment_id",
              assessment.id
            )
            .eq(
              "trainee_id",
              traineeId
            )
            .order("created_at", {
              ascending: false,
            })
            .limit(1)
            .maybeSingle();

          if (error) {
            console.error(
              "Submission lookup error:",
              error
            );
          }

          if (data) {
            submission = data;
            break;
          }
        }

        // ======================================================
        // 4. FALLBACK
        //
        // This is only used if the trainee UUID isn't available
        // in the current trainee object.
        // ======================================================

        if (!submission) {
          const {
            data,
            error,
          } = await supabase
            .from("assessment_submissions")
            .select(
              `
                id,
                status,
                overall_result,
                passed,
                total_score,
                created_at,
                updated_at
              `
            )
            .eq(
              "assessment_id",
              assessment.id
            )
            .order("created_at", {
              ascending: false,
            })
            .limit(1)
            .maybeSingle();

          if (error) {
            console.error(
              "Fallback submission lookup error:",
              error
            );
          }

          if (data) {
            submission = data;
          }
        }

        // ======================================================
        // 5. STORE SUBMISSION STATE
        // ======================================================

        if (submission) {
          setSubmissionStatus(
            submission.status || null
          );

          setSubmissionResult(
            submission.overall_result || null
          );
        } else {
          setSubmissionStatus(null);
          setSubmissionResult(null);
        }
      } catch (error) {
        console.error(
          "Error loading assessment overview:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    fetchAssessmentDetails();
  }, [
    assessment?.id,
    trainee,
  ]);

  // ==========================================================
  // GUARD
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
  // DETERMINE CURRENT STATUS
  // ==========================================================

  const currentStatus =
    submissionStatus ||
    trainee.status ||
    "Not Started";

  const normalizedStatus =
    String(currentStatus)
      .trim()
      .toLowerCase();

  const normalizedResult =
    String(submissionResult || "")
      .trim()
      .toLowerCase();

  // ==========================================================
  // FINALIZED DETECTION
  //
  // "evaluated" is the actual DB status written by
  // WrittenAssessmentReview.
  //
  // We also protect against records that have Passed/Failed
  // even if their status wasn't updated correctly.
  // ==========================================================

  const isFinalized =
    normalizedStatus === "evaluated" ||
    normalizedStatus === "in evaluated" ||
    normalizedResult === "passed" ||
    normalizedResult === "failed";

  // ==========================================================
  // ASSESSMENT SECTION
  // ==========================================================

  const assessmentSections = [
    {
      id: 1,

      title:
        "Written Assessment",

      description:
        "Evaluates theoretical knowledge of course concepts.",

      status:
        isFinalized
          ? "Evaluated"
          : currentStatus,

      eegStatus:
        isFinalized
          ? "Evaluation Complete"
          : currentStatus === "Submitted"
            ? "Recording Complete"
            : "Waiting for Connection",
    },
  ];

  // ==========================================================
  // EVALUATE
  // ==========================================================

  const handleEvaluate = () => {
    // HARD STOP:
    // Never allow an already finalized assessment
    // to enter the evaluation workflow again.
    if (isFinalized) {
      return;
    }

    // Only Submitted assessments can be evaluated.
    if (normalizedStatus !== "submitted") {
      return;
    }

    navigate(
      "/assessor/assessment-panel/written-review",
      {
        state: {
          trainee,
          assessment,
          selectedCourse,
          batchId:
            state?.batchId,
          assignmentId:
            state?.assignmentId,
          batchCode,
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
            label:
              "Assessment Panel",

            to:
              "/assessor/assessment-panel",
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
              batchId:
                state?.batchId,
              assessmentId:
                assessment?.id,
              batchCode,
            },
          },

          {
            label:
              trainee.fullName,
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