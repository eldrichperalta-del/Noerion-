import TraineeInformationCard from "../evaluation-summary/TraineeInformationCard";

import AssessmentSummaryCard from "../finalize-evaluation/AssessmentSummaryCard";
import QuestionReviewTable from "../finalize-evaluation/QuestionReviewTable";

import SystemRecommendationCard from "../finalize-evaluation/SystemRecommendationCard";
import DecisionPanel from "../finalize-evaluation/DecisionPanel";


export default function FinalizeEvaluationPanel({

  /* ============================================================
     TRAINEE
  ============================================================ */

  trainee,


  /* ============================================================
     ASSESSMENT SUMMARY
  ============================================================ */

  totalScore,
  totalItems,
  percentage,
  result,


  /* ============================================================
     QUESTION REVIEW
  ============================================================ */

  questions,
  isLoading,


  /* ============================================================
     AI / SYSTEM RECOMMENDATION
  ============================================================ */

  aiResult,


  /* ============================================================
     FINALIZATION
  ============================================================ */

  isFinalized,
  isSubmitting,


  /* ============================================================
     DECISION STATE
  ============================================================ */

  decision,
  setDecision,

  newScore,
  setNewScore,

  justification,
  setJustification,

  remarks,
  setRemarks,


  /* ============================================================
     SUBMIT
  ============================================================ */

  onSubmit,

}) {


  return (

    <div className="space-y-6">


      {/* ==========================================================
          TRAINEE INFORMATION
      ========================================================== */}

      <TraineeInformationCard

        trainee={
          trainee
        }

      />


      {/* ==========================================================
          ASSESSMENT SUMMARY
      ========================================================== */}

      <AssessmentSummaryCard

        totalScore={
          totalScore
        }

        totalItems={
          totalItems
        }

        percentage={
          percentage
        }

        result={
          result
        }

      />


      {/* ==========================================================
          QUESTION REVIEW
      ========================================================== */}

      {isLoading ? (

        <div
          className="
            rounded-2xl
            border
            border-gray-200
            bg-white
            py-12
            text-center
            font-medium
            text-gray-500
            shadow-sm
          "
        >

          Loading submission data and questions...

        </div>

      ) : (

        <QuestionReviewTable

          questions={
            questions
          }

        />

      )}


      {/* ==========================================================
          SYSTEM RECOMMENDATION + MAKE YOUR DECISION
      ========================================================== */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">


        {/* ========================================================
            LEFT
            SYSTEM RECOMMENDATION
        ======================================================== */}

        <SystemRecommendationCard

          aiResult={
            aiResult
          }

          totalScore={
            totalScore
          }

          percentage={
            percentage
          }

          result={
            result
          }

        />


        {/* ========================================================
            RIGHT
            MAKE YOUR DECISION
        ======================================================== */}

        <DecisionPanel

          decision={
            decision
          }

          setDecision={
            setDecision
          }

          newScore={
            newScore
          }

          setNewScore={
            setNewScore
          }

          justification={
            justification
          }

          setJustification={
            setJustification
          }

          remarks={
            remarks
          }

          setRemarks={
            setRemarks
          }

          isFinalized={
            isFinalized
          }

          isSubmitting={
            isSubmitting
          }

          onSubmit={
            onSubmit
          }

        />

      </div>

    </div>

  );

}
