import TraineeInformationCard from "../evaluation-summary/TraineeInformationCard";
import WrittenAssessmentCard from "../evaluation-summary/WrittenAssessmentCard";
import OverallResultCard from "../evaluation-summary/OverallResultCard";
import AIInsightSummaryCard from "../evaluation-summary/AIInsightSummaryCard";
import ViewAIAnalysisButton from "../evaluation-summary/ViewAIAnalysisButton";

export default function EvaluationSummaryPanel({
  evaluationSummary,
  onViewAIAnalysis,
}) {
  return (
    <div className="space-y-6">

      {/* ==========================================================
          TRAINEE INFORMATION
          ========================================================== */}

      <TraineeInformationCard
        trainee={evaluationSummary.trainee}
      />


      {/* ==========================================================
          WRITTEN ASSESSMENT & OVERALL RESULT
          
          KEEPING THE EXISTING 210px HEIGHT
          ========================================================== */}

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


      {/* ==========================================================
          AI INSIGHT SUMMARY & VIEW AI ANALYSIS
          
          IMPORTANT:
          The AI Insight Summary is NO LONGER forced to 210px.
          
          Its height will now follow the bullet content.
          
          The View AI Analysis button keeps its existing
          210px height/design.
          ========================================================== */}

      <div
        className="
          grid
          grid-cols-1
          gap-5
          lg:grid-cols-3
          items-start
        "
      >

        {/* ========================================================
            AI INSIGHT SUMMARY

            NO FIXED HEIGHT HERE.

            The card grows naturally according to the number
            and length of AI-generated bullet insights.
            ======================================================== */}

        <div className="lg:col-span-2">
          <AIInsightSummaryCard
            insights={
              evaluationSummary.aiInsights
            }
          />
        </div>


        {/* ========================================================
            VIEW AI ANALYSIS

            DO NOT CHANGE THE BUTTON SIZE OR DESIGN.
            ======================================================== */}

        <div className="h-[210px]">
          <ViewAIAnalysisButton
            onClick={onViewAIAnalysis}
          />
        </div>

      </div>

    </div>
  );
}