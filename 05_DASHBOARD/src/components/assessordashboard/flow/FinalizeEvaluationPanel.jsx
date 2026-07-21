import TraineeInformationCard from "../evaluation-summary/TraineeInformationCard";
import DecisionPanel from "../finalize-evaluation/DecisionPanel";
import SystemRecommendationCard from "../finalize-evaluation/SystemRecommendationCard";

/* ============================================================================
   FRONTEND HANDOFF
   ----------------------------------------------------------------------------
   Receives all evaluation data from FinalizeEvaluation.jsx.

   Props

   trainee

   {
      name,
      id,
      course
   }

   aiResult

   {
      recommendation,
      confidence,
      ...
   }

============================================================================ */

/* ============================================================================
   BACKEND HANDOFF
   ----------------------------------------------------------------------------
   During backend integration these props should come from the AI Analysis
   endpoint instead of mock objects.

============================================================================ */

export default function FinalizeEvaluationPanel({
  trainee,
  aiResult,
  onSubmit,
}) {
  return (
    <div className="space-y-6">
      <TraineeInformationCard trainee={trainee} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SystemRecommendationCard
          aiResult={aiResult}
        />

        <DecisionPanel onSubmit={onSubmit} />
      </div>
    </div>
  );
}