import { Routes, Route, Navigate } from "react-router-dom";

import AssessorLayout from "../layouts/AssessorLayout";

import Home from "../pages/assessordashboard/Home";
import AssessmentPanel from "../pages/assessordashboard/AssessmentPanel";
import Evaluation from "../pages/assessordashboard/Evaluation";
import AssessmentHistory from "../pages/assessordashboard/AssessmentHistory";
import Settings from "../pages/assessordashboard/Settings";
import SelectedTrainees from "../pages/assessordashboard/assessment-panel/SelectedTrainees";
import AssessmentOverview from "../pages/assessordashboard/assessment-panel/AssessmentOverview";
import WrittenAssessmentReview from "../pages/assessordashboard/assessment-panel/WrittenAssessmentReview";
import TraineesForEvaluation from "../pages/assessordashboard/evaluation/TraineesForEvaluation";
import EvaluationSummary from "../pages/assessordashboard/evaluation/EvaluationSummary";
import AIAnalysisInsights from "../pages/assessordashboard/evaluation/AIAnalysisInsights";
import FinalizeEvaluation from "../pages/assessordashboard/evaluation/FinalizeEvaluation";

export default function AssessorRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="home" replace />} />

      <Route
        path="home"
        element={
          <AssessorLayout>
            <Home />
          </AssessorLayout>
        }
      />

      <Route
        path="assessment-panel"
        element={
          <AssessorLayout>
            <AssessmentPanel />
          </AssessorLayout>
        }
      />

      <Route
        path="assessment-panel/selected-trainees"
        element={
          <AssessorLayout>
            <SelectedTrainees />
          </AssessorLayout>
        }
      />

      <Route
        path="assessment-panel/assessment-overview"
        element={
          <AssessorLayout>
            <AssessmentOverview />
          </AssessorLayout>
        }
      />

      <Route
        path="assessment-panel/written-review"
        element={
          <AssessorLayout>
            <WrittenAssessmentReview />
          </AssessorLayout>
        }
      />

      <Route
        path="evaluation"
        element={
          <AssessorLayout>
            <Evaluation />
          </AssessorLayout>
        }
      />

      <Route
        path="evaluation/trainees"
        element={
          <AssessorLayout>
            <TraineesForEvaluation />
          </AssessorLayout>
        }
      />

      <Route
        path="evaluation/summary"
        element={
          <AssessorLayout>
            <EvaluationSummary />
          </AssessorLayout>
        }
      />

      <Route
        path="evaluation/ai-analysis"
        element={
          <AssessorLayout>
            <AIAnalysisInsights />
          </AssessorLayout>
        }
      />

      <Route
        path="evaluation/finalize"
        element={
          <AssessorLayout>
            <FinalizeEvaluation />
          </AssessorLayout>
        }
      />

      <Route
        path="history"
        element={
          <AssessorLayout>
            <AssessmentHistory />
          </AssessorLayout>
        }
      />

      <Route
        path="settings"
        element={
          <AssessorLayout>
            <Settings />
          </AssessorLayout>
        }
      />

    </Routes>
  );
}
