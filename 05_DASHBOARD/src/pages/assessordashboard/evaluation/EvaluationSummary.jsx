import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { supabase } from "../../../supabaseClient.js";

import AssessorBreadcrumbs from "../../../components/assessordashboard/flow/AssessorBreadcrumbs";
import EvaluationSummaryPanel from "../../../components/assessordashboard/flow/EvaluationSummaryPanel";
import AssessorPageHeader from "../../../components/assessordashboard/shared/AssessorPageHeader";


export default function EvaluationSummary() {
  const navigate = useNavigate();
  const { state } = useLocation();


  // ==========================================================================
  // NAVIGATION DATA
  // ==========================================================================

  const selectedCourse =
    state?.selectedCourse ?? null;

  const courseLabel =
    selectedCourse?.qualificationName ??
    selectedCourse?.name ??
    selectedCourse?.courseName ??
    "Chosen Course";
  const rawTrainee =
    state?.selectedTrainee ?? null;

  const assessment =
    state?.assessment ??
    rawTrainee?.assessment ??
    null;

  const batchId =
    state?.batchId ??
    rawTrainee?.batchId ??
    null;

  const batchCode =
    state?.batchCode ??
    rawTrainee?.batchCode ??
    null;

  const assessmentId =
    state?.assessmentId ??
    rawTrainee?.assessmentId ??
    rawTrainee?.submission?.assessment_id ??
    null;

  /*
   * IMPORTANT:
   *
   * submissionId is the UUID from:
   *
   * assessment_submissions.id
   *
   * In your actual database:
   *
   * 40ce83a4-6273-47e1-91bb-98ea5176ded2
   *
   * This is safe to use with:
   *
   * .eq("id", submissionId)
   */
  const submissionId =
    state?.submissionId ??
    rawTrainee?.submissionId ??
    rawTrainee?.submission_id ??
    rawTrainee?.submission?.id ??
    null;

  const evaluationId =
    state?.evaluationId ??
    submissionId ??
    null;


  // ==========================================================================
  // STATE
  // ==========================================================================

  const [evaluationSummary, setEvaluationSummary] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");


  // ==========================================================================
  // TRAINEE
  // ==========================================================================

  const selectedTrainee = {
    ...rawTrainee,

    id:
      rawTrainee?.traineeId ??
      rawTrainee?.trainee_id ??
      rawTrainee?.id ??
      null,

    fullName:
      rawTrainee?.fullName ??
      rawTrainee?.name ??
      "Unknown Trainee",

    traineeId:
      rawTrainee?.traineeId ??
      rawTrainee?.trainee_id ??
      rawTrainee?.id ??
      "-",

    status:
      rawTrainee?.status ??
      "Submitted",

    profile:
      rawTrainee?.profile ??
      null,

    traineeProfile:
      rawTrainee?.traineeProfile ??
      null,

    assignment:
      rawTrainee?.assignment ??
      null,

    submission:
      rawTrainee?.submission ??
      null,
  };


  // ==========================================================================
  // ROUTE GUARD
  // ==========================================================================

  useEffect(() => {
    if (!rawTrainee) {
      navigate(
        "/assessor/evaluation/trainees",
        {
          replace: true,
          state: {
            selectedCourse,
            batchId,
            assessmentId,
            batchCode,
          },
        }
      );
    }
  }, [
    rawTrainee,
    selectedCourse,
    batchId,
    assessmentId,
    batchCode,
    navigate,
  ]);


  // ==========================================================================
  // LOAD EVALUATION SUMMARY
  // ==========================================================================

  useEffect(() => {
    if (!rawTrainee) {
      return;
    }

    let isMounted = true;


    async function loadEvaluationSummary() {
      setLoading(true);
      setErrorMessage("");


      try {
        console.log(
          "=== EVALUATION SUMMARY ==="
        );

        console.log(
          "Selected trainee:",
          selectedTrainee
        );

        console.log(
          "Assessment ID:",
          assessmentId
        );

        console.log(
          "Submission ID:",
          submissionId
        );


        // ====================================================================
        // 1. GET SUBMISSION
        //
        // Prefer the submission already loaded by
        // TraineesForEvaluation.
        // ====================================================================

        let submission =
          selectedTrainee.submission ??
          null;


        /*
         * Only query Supabase if the submission object was not already passed.
         *
         * submissionId is the UUID:
         *
         * 40ce83a4-6273-47e1-91bb-98ea5176ded2
         *
         * NOT assignment.id = 1.
         */
        if (
          !submission &&
          submissionId
        ) {
          const {
            data,
            error,
          } = await supabase
            .from("assessment_submissions")
            .select(`
              id,
              assessment_id,
              trainee_id,
              assessor_id,
              started_at,
              submitted_at,
              status,
              total_score,
              passed,
              created_at,
              updated_at,
              assignment_id,
              overall_result,
              remarks,
              justification
            `)
            .eq(
              "id",
              submissionId
            )
            .maybeSingle();


          if (error) {
            throw error;
          }


          submission = data;
        }


        console.log(
          "Evaluation Summary submission:",
          submission
        );


        // ====================================================================
        // 2. DETERMINE THE ASSESSMENT UUID
        //
        // Prefer the UUID stored in the submission because this is the
        // database's actual relationship.
        // ====================================================================

        const actualAssessmentId =
          submission?.assessment_id ??
          assessmentId ??
          null;


        console.log(
          "Actual assessment UUID:",
          actualAssessmentId
        );


        // ====================================================================
        // 3. LOAD QUESTIONS
        //
        // We use questions to determine how many written-assessment items
        // exist.
        //
        // We do NOT use assignment.id here.
        // ====================================================================

        let questions = [];


        if (actualAssessmentId) {
          const {
            data: questionsData,
            error: questionsError,
          } = await supabase
            .from("questions")
            .select("*")
            .eq(
              "assessment_id",
              actualAssessmentId
            );


          if (questionsError) {
            console.warn(
              "Unable to load assessment questions:",
              questionsError
            );
          } else {
            questions =
              questionsData ?? [];
          }
        }


        console.log(
          "Evaluation Summary questions:",
          questions
        );


        // ====================================================================
        // 4. DETERMINE TOTAL ITEMS
        //
        // Priority:
        //
        // 1. Number of database questions
        // 2. selectedCourse.totalItems
        // 3. assessment.totalItems
        // 4. 0
        //
        // We do NOT assume assessments.total_items exists.
        // ====================================================================

        let totalItems =
          questions.length;


        if (
          totalItems === 0 &&
          selectedCourse &&
          typeof selectedCourse === "object"
        ) {
          totalItems =
            Number(
              selectedCourse.totalItems
            ) || 0;
        }


        if (
          totalItems === 0 &&
          assessment
        ) {
          totalItems =
            Number(
              assessment.totalItems
            ) || 0;
        }


        // ====================================================================
        // 5. SCORE
        //
        // Your actual mock record:
        //
        // total_score: 25
        //
        // So this will display 25.
        // ====================================================================

        const score =
          submission?.total_score !== null &&
            submission?.total_score !== undefined
            ? Number(
              submission.total_score
            )
            : 0;


        // ====================================================================
        // 6. PERCENTAGE
        //
        // Only calculate when we actually know totalItems.
        // ====================================================================

        const percentage =
          totalItems > 0
            ? Math.round(
              (score /
                totalItems) *
              100
            )
            : null;


        // ====================================================================
        // 7. WRITTEN ASSESSMENT STATUS
        // ====================================================================

        const submissionStatus =
          String(
            submission?.status ??
            rawTrainee?.status ??
            "submitted"
          )
            .trim()
            .toLowerCase();


        let writtenStatus =
          "WRITTEN - SUBMITTED";


        if (
          submissionStatus ===
          "evaluated"
        ) {
          writtenStatus =
            "WRITTEN - COMPLETED";
        }

        else if (
          submissionStatus ===
          "completed" ||
          submissionStatus ===
          "submitted"
        ) {
          writtenStatus =
            "WRITTEN - SUBMITTED";
        }

        else if (
          submissionStatus ===
          "in evaluation" ||
          submissionStatus ===
          "in_evaluation"
        ) {
          writtenStatus =
            "WRITTEN - IN EVALUATION";
        }

        else if (
          submissionStatus ===
          "in_progress" ||
          submissionStatus ===
          "in progress"
        ) {
          writtenStatus =
            "WRITTEN - IN PROGRESS";
        }


        // ====================================================================
        // 8. OVERALL RESULT
        //
        // Your actual mock submission currently says:
        //
        // overall_result: "In evaluation"
        // passed: false
        //
        // We must NOT turn passed=false into "NOT YET COMPETENT" while the
        // record is still "In evaluation".
        // ====================================================================

        const rawResult =
          String(
            submission?.overall_result ?? ""
          )
            .trim()
            .toLowerCase();

        let competency = "IN EVALUATION";

        if (
          rawResult === "competent" ||
          rawResult === "passed"
        ) {
          competency = "COMPETENT";
        } else if (
          rawResult === "not yet competent" ||
          rawResult === "failed"
        ) {
          competency = "NOT YET COMPETENT";
        } else if (
          rawResult === "in evaluation" ||
          rawResult === "in_evaluation"
        ) {
          competency = "IN EVALUATION";
        } else if (
          submission?.passed === true
        ) {
          competency = "COMPETENT";
        } else if (
          submission?.passed === false
        ) {
          competency = "NOT YET COMPETENT";
        }


        // ====================================================================
        // FETCH AI COGNITIVE INSIGHTS FROM DATABASE
        // ====================================================================

        let aiInsights = [];

        if (submissionId) {
          const {
            data: aiData,
            error: aiError,
          } = await supabase
            .from("ai_assessment_insights")
            .select("ai_cognitive_insights")
            .eq("submission_id", submissionId)
            .maybeSingle();

          if (aiError) {
            console.warn(
              "Unable to load AI cognitive insights:",
              aiError
            );
          } else if (aiData?.ai_cognitive_insights) {
            aiInsights =
              typeof aiData.ai_cognitive_insights === "string"
                ? JSON.parse(aiData.ai_cognitive_insights)
                : aiData.ai_cognitive_insights;
          }
        }


        // ====================================================================
        // 9. BUILD SUMMARY
        //
        // This matches what EvaluationSummaryPanel expects:
        //
        // evaluationSummary.trainee
        // evaluationSummary.writtenAssessment
        // evaluationSummary.overallResult
        // evaluationSummary.aiInsights
        // ====================================================================

        const summary = {

          assessmentId:
            actualAssessmentId,

          submissionId,

          batchId,

          assignmentId:
            rawTrainee?.assignmentId ??
            rawTrainee?.assignment?.id ??
            null,

          assessment:
            assessment ??
            null,

          trainee: {

            name:
              selectedTrainee.fullName,

            id:
              selectedTrainee.traineeId,

            course:
              courseLabel,

          },


          writtenAssessment: {

            score,

            total:
              totalItems,

            percentage,

            status:
              writtenStatus,

            submissionStatus:
              submission?.status ??
              null,

            submittedAt:
              submission?.submitted_at ??
              null,

          },


          overallResult: {

            competency,

            passed:
              submission?.passed ??
              null,

            result:
              submission?.overall_result ??
              "In evaluation",

            remarks:
              submission?.remarks ??
              null,

            justification:
              submission?.justification ??
              null,

          },


          /*
           * Extracted from ai_assessment_insights table
           */
          aiInsights,


          /*
           * Keep the raw records available for the next page.
           */
          submission:
            submission ??
            null,

          assignment:
            rawTrainee?.assignment ??
            null,

          profile:
            rawTrainee?.profile ??
            null,

          traineeProfile:
            rawTrainee?.traineeProfile ??
            null,

          questions,

        };


        console.log(
          "Final evaluation summary:",
          summary
        );


        if (isMounted) {
          setEvaluationSummary(
            summary
          );
        }

      }

      catch (error) {

        console.error(
          "Error loading evaluation summary:",
          error
        );


        if (isMounted) {

          setErrorMessage(
            "Unable to load the evaluation summary. Please try again."
          );


          /*
           * Keep the page usable even if questions cannot be loaded.
           *
           * The actual score still comes from assessment_submissions.
           */
          setEvaluationSummary({

            assessmentId,

            submissionId,

            batchId,

            assignmentId:
              rawTrainee?.assignmentId ??
              rawTrainee?.assignment?.id ??
              null,


            trainee: {

              name:
                selectedTrainee.fullName,

              id:
                selectedTrainee.traineeId,

              course:
                selectedCourse?.qualificationName ??
                selectedCourse?.name ??
                selectedCourse ??
                "Unknown Qualification",

            },


            writtenAssessment: {

              score:
                Number(
                  rawTrainee?.submission?.total_score ??
                  0
                ),

              total: 0,

              percentage: null,

              status:
                "WRITTEN - SUBMITTED",

            },


            overallResult: {

              competency:
                "IN EVALUATION",

              passed:
                rawTrainee?.submission?.passed ??
                null,

              result:
                rawTrainee?.submission?.overall_result ??
                "In evaluation",

            },


            aiInsights: [],

          });

        }

      }

      finally {

        if (isMounted) {
          setLoading(false);
        }

      }
    }


    loadEvaluationSummary();


    return () => {
      isMounted = false;
    };

  }, [
    rawTrainee,
    submissionId,
    assessmentId,
  ]);


  // ==========================================================================
  // REDIRECT IF NO TRAINEE
  // ==========================================================================

  if (!rawTrainee) {
    return null;
  }


  // ==========================================================================
  // LOADING
  // ==========================================================================

  if (loading) {

    return (

      <div className="space-y-6">

        <AssessorPageHeader
          title="Evaluation Summary"
          subtitle="Loading the trainee's evaluation summary..."
        />

        <div className="rounded-2xl border border-gray-200 bg-white py-12 text-center font-medium text-gray-500 shadow-sm">

          Loading evaluation summary...

        </div>

      </div>

    );
  }


  // ==========================================================================
  // GO TO AI ANALYSIS
  // ==========================================================================

  const handleViewAIAnalysis = () => {
    console.log("=== VIEW AI ANALYSIS CLICKED ===");
    console.log("submissionId:", submissionId);
    console.log("assessmentId:", assessmentId);
    console.log("selectedTrainee:", selectedTrainee);

    navigate(
      "/assessor/evaluation/ai-analysis",
      {
        state: {
          selectedCourse,
          selectedTrainee,

          evaluationId,

          batchId,
          batchCode,

          assessmentId,
          submissionId,

          assignmentId:
            evaluationSummary?.assignmentId ??
            rawTrainee?.assignmentId ??
            rawTrainee?.assignment?.id ??
            null,

          assessment,

          evaluationSummary,
        },
      }
    );

  };


  // ==========================================================================
  // PAGE
  // ==========================================================================

  return (

    <div className="space-y-6">


      {/* ======================================================================
          BREADCRUMBS
          ====================================================================== */}

      <AssessorBreadcrumbs
        items={[
          {
            label: courseLabel,

            to: "/assessor/evaluation",

            state: {
              selectedCourse,
            },
          },

          {
            label: "Trainees for Evaluation",

            to: "/assessor/evaluation/trainees",

            state: {
              selectedCourse,
              batchId,
              assessmentId,
              batchCode,
              evaluationId,
              submissionId,
              selectedTrainee,
            },
          },

          "Evaluation Summary",
        ]}
      />


      {/* ======================================================================
          HEADER
          ====================================================================== */}

      <AssessorPageHeader

        title="Evaluation Summary"

        subtitle="Review the trainee's consolidated evaluation before proceeding to AI analysis."

      />


      {/* ======================================================================
          ERROR
          ====================================================================== */}

      {errorMessage && (

        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">

          {errorMessage}

        </div>

      )}


      {/* ======================================================================
          SUMMARY
          ====================================================================== */}

      {evaluationSummary && (

        <EvaluationSummaryPanel

          evaluationSummary={
            evaluationSummary
          }

          onViewAIAnalysis={
            handleViewAIAnalysis
          }

        />

      )}

    </div>

  );
}