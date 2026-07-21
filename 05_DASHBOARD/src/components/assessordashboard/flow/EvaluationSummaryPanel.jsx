import TraineeInformationCard from "../evaluation-summary/TraineeInformationCard";
import WrittenAssessmentCard from "../evaluation-summary/WrittenAssessmentCard";
import OverallResultCard from "../evaluation-summary/OverallResultCard";
import AIInsightSummaryCard from "../evaluation-summary/AIInsightSummaryCard";
import ViewAIAnalysisButton from "../evaluation-summary/ViewAIAnalysisButton";

export default function EvaluationSummaryPanel({
  evaluationSummary,
  onViewAIAnalysis,
}) {
  // ==========================================================
  // BACKEND HANDOFF:
  // This component receives the consolidated evaluation
  // summary from EvaluationSummary.jsx.
  //
  // Replace the mock "evaluationSummary" prop with the
  // backend response for the selected trainee evaluation.
  //
  // Expected object structure:
  //
  // {
  //   trainee: {
  //     name: string,
  //     id: string,
  //     course: string,
  //   },
  //
  //   writtenAssessment: {
  //     score: number,
  //     total: number,
  //     percentage: number,
  //     status: string,
  //   },
  //
  //   overallResult: {
  //     competency: string,
  //   },
  //
  //   aiInsights: string[],
  // }
  // ==========================================================

  return (
    <div className="space-y-6">
      {/* Trainee Information */}

      <TraineeInformationCard
        trainee={evaluationSummary.trainee}
      />

      {/* Written Assessment & Overall Result */}

      <div
        className="
          grid
          grid-cols-1
          gap-5
          lg:grid-cols-2
          items-stretch
        "
      >

        <div className="h-[210px]">
          <WrittenAssessmentCard
            writtenAssessment={
              evaluationSummary.writtenAssessment
            }
          />
        </div>


        <div className="h-[210px]">
          <OverallResultCard
            overallResult={
              evaluationSummary.overallResult
            }
          />
        </div>

      </div>

      {/* AI Insight Summary & View AI Analysis */}

      <div
        className="
          grid
          grid-cols-1
          gap-5
          lg:grid-cols-3
          items-stretch
        "
      >

        <div className="h-[210px] lg:col-span-2">
          <AIInsightSummaryCard
            insights={evaluationSummary.aiInsights}
          />
        </div>


        <div className="h-[210px]">
          <ViewAIAnalysisButton
            onClick={onViewAIAnalysis}
          />
        </div>

      </div>
    </div>
  );
}