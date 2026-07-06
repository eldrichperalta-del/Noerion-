import { Routes, Route, Navigate } from "react-router-dom";

import AssessorLayout from "../layouts/AssessorLayout";

import Home from "../pages/assessordashboard/Home";
import AssessmentPanel from "../pages/assessordashboard/AssessmentPanel";
import Evaluation from "../pages/assessordashboard/Evaluation";
import AssessmentHistory from "../pages/assessordashboard/AssessmentHistory";
import Profile from "../pages/assessordashboard/Profile";
import Settings from "../pages/assessordashboard/Settings";

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
        path="evaluation"
        element={
          <AssessorLayout>
            <Evaluation />
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
        path="profile"
        element={
          <AssessorLayout>
            <Profile />
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