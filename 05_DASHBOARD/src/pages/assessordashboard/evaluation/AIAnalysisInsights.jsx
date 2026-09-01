import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import AssessorBreadcrumbs from "../../../components/assessordashboard/flow/AssessorBreadcrumbs";
import AssessorPageHeader from "../../../components/assessordashboard/shared/AssessorPageHeader";

import TraineeInformationCard from "../../../components/assessordashboard/evaluation-summary/TraineeInformationCard";

import AIResultSummaryCard from "../../../components/assessordashboard/ai-analysis/AIResultSummaryCard";
import EEGInsightsCard from "../../../components/assessordashboard/ai-analysis/EEGInsightsCard";
import PerformancePatternsCard from "../../../components/assessordashboard/ai-analysis/PerformancePatternsCard";
import AIInterpretationCard from "../../../components/assessordashboard/ai-analysis/AIInterpretationCard";
import ProceedDecisionButton from "../../../components/assessordashboard/ai-analysis/ProceedDecisionButton";

import { mockAIAnalysis } from "../../../data/mockAIAnalysis";


export default function AIAnalysisInsights() {

  const navigate = useNavigate();

  const { state } = useLocation();


  /* ============================================================
     NAVIGATION DATA
     ============================================================ */

  const selectedCourse =
    state?.selectedCourse ?? null;


  const rawTrainee =
    state?.selectedTrainee ?? null;


  const evaluationSummary =
    state?.evaluationSummary ?? null;


  const evaluationId =
    state?.evaluationId ?? null;


  const assessmentId =
    state?.assessmentId ??
    evaluationSummary?.assessmentId ??
    evaluationSummary?.assessment?.id ??
    rawTrainee?.assessmentId ??
    rawTrainee?.assessment_id ??
    rawTrainee?.submission?.assessment_id ??
    null;


  /*
   * IMPORTANT:
   *
   * This was the source of:
   *
   * Uncaught ReferenceError:
   * assessment is not defined
   *
   * We explicitly define it here before using it below.
   */

  const assessment =
    state?.assessment ??
    evaluationSummary?.assessment ??
    rawTrainee?.assessment ??
    null;


  const submissionId =
    state?.submissionId ??
    evaluationSummary?.submissionId ??
    rawTrainee?.submissionId ??
    rawTrainee?.submission_id ??
    rawTrainee?.submission?.id ??
    null;


  const batchId =
    state?.batchId ??
    rawTrainee?.batchId ??
    rawTrainee?.batch_id ??
    null;


  const batchCode =
    state?.batchCode ??
    rawTrainee?.batchCode ??
    rawTrainee?.batch_code ??
    null;


  const assignmentId =
    state?.assignmentId ??
    rawTrainee?.assignmentId ??
    rawTrainee?.assignment_id ??
    rawTrainee?.assignment?.id ??
    evaluationSummary?.assignmentId ??
    null;



  /* ============================================================
     COURSE LABEL
     ============================================================ */

  const courseLabel =
    selectedCourse?.qualificationName ??
    selectedCourse?.name ??
    selectedCourse?.courseName ??
    selectedCourse ??
    "Chosen Course";



  /* ============================================================
     NORMALIZE TRAINEE
     ============================================================ */

  const selectedTrainee = {

    ...(rawTrainee || {}),

    id:
      rawTrainee?.id ??
      rawTrainee?.trainee_id ??
      rawTrainee?.user_id ??
      null,


    fullName:
      rawTrainee?.fullName ??
      rawTrainee?.name ??
      rawTrainee?.fullname ??
      "Unknown Trainee",


    traineeId:
      rawTrainee?.traineeId ??
      rawTrainee?.trainee_id ??
      rawTrainee?.id ??
      "-",


    status:
      rawTrainee?.status ??
      "Submitted",


    assessmentId,

    submissionId,

    batchId,

    batchCode,

    assignmentId,

    assessment,

  };



  /* ============================================================
     SAFETY CHECK
     ============================================================ */

  if (
    !selectedCourse ||
    !rawTrainee
  ) {

    return (

      <div className="p-10 text-center">

        Missing evaluation data.

      </div>

    );

  }



  /* ============================================================
     AI ANALYSIS DATA
     ============================================================ */

  const aiAnalysis = {

    ...mockAIAnalysis,

    trainee: {

      ...(mockAIAnalysis?.trainee || {}),

      name:
        selectedTrainee.fullName,

      id:
        selectedTrainee.traineeId,

      course:
        courseLabel,

    },

  };



  /* ============================================================
     PROCEED TO FINALIZE EVALUATION
     ============================================================ */

  const handleProceedToDecision = () => {

    console.log(
      "=== PROCEED TO FINALIZE EVALUATION ==="
    );


    console.log(
      "selectedCourse:",
      selectedCourse
    );


    console.log(
      "selectedTrainee:",
      selectedTrainee
    );


    console.log(
      "evaluationSummary:",
      evaluationSummary
    );


    console.log(
      "evaluationId:",
      evaluationId
    );


    console.log(
      "assessmentId:",
      assessmentId
    );


    console.log(
      "assessment:",
      assessment
    );


    console.log(
      "submissionId:",
      submissionId
    );


    console.log(
      "batchId:",
      batchId
    );


    console.log(
      "batchCode:",
      batchCode
    );


    console.log(
      "assignmentId:",
      assignmentId
    );


    navigate(
      "/assessor/evaluation/finalize",
      {

        state: {

          selectedCourse,

          selectedTrainee,

          evaluationSummary,

          evaluationId,

          assessmentId,

          assessment,

          submissionId,

          batchId,

          batchCode,

          assignmentId,

          aiAnalysis,

        },

      }
    );

  };



  /* ============================================================
     PAGE
     ============================================================ */

  return (

    <div className="space-y-6">


      {/* ==========================================================
          BREADCRUMBS
          ========================================================== */}

      <AssessorBreadcrumbs

        items={[

          {
            label:
              courseLabel,

            to:
              "/assessor/evaluation",

            state: {
              selectedCourse,
            },

          },


          {
            label:
              "Trainees Evaluation",

            to:
              "/assessor/evaluation/trainees",

            state: {

              selectedCourse,

              selectedTrainee,

              batchId,

              assessmentId,

              batchCode,

              evaluationId,

              submissionId,

            },

          },


          {
            label:
              "Evaluation Summary",

            to:
              "/assessor/evaluation/summary",

            state: {

              selectedCourse,

              selectedTrainee,

              evaluationSummary,

              evaluationId,

              assessmentId,

              assessment,

              submissionId,

              batchId,

              batchCode,

              assignmentId,

            },

          },


          "AI Analysis & Insights",

        ]}

      />



      {/* ==========================================================
          HEADER
          ========================================================== */}

      <AssessorPageHeader

        title="AI Analysis & Insights"

        subtitle="Review AI-supported insights before the final decision."

      />



      {/* ==========================================================
          TRAINEE
          ========================================================== */}

      <TraineeInformationCard

        trainee={
          aiAnalysis.trainee
        }

      />



      {/* ==========================================================
          AI RESULT + EEG
          ========================================================== */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        <AIResultSummaryCard

          result={
            aiAnalysis.aiResult
          }

        />


        <EEGInsightsCard

          eeg={
            aiAnalysis.eeg
          }

        />

      </div>



      {/* ==========================================================
          PERFORMANCE + INTERPRETATION
          ========================================================== */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        <PerformancePatternsCard

          patterns={
            aiAnalysis.patterns
          }

        />


        <div className="space-y-6">

          <AIInterpretationCard

            interpretation={
              aiAnalysis.interpretation
            }

          />


          <div className="flex justify-center">

            <ProceedDecisionButton

              onClick={
                handleProceedToDecision
              }

            />

          </div>

        </div>

      </div>

    </div>

  );

}