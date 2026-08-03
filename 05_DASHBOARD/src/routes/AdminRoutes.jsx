import { Routes, Route } from "react-router-dom";

import AdminLayout from "../layouts/AdminLayout";

/* Admin Pages */
import Home from "../pages/admin/Home";

import UserManagement from "../pages/admin/user-management/UserManagement";
import TraineeManagement from "../pages/admin/user-management/TraineeManagement";
import AssessorManagement from "../pages/admin/user-management/AssessorManagement";
import AddAssessor from "../pages/admin/user-management/AddAssessor";

import AssessmentManagement from "../pages/admin/AssessmentManagement";
import AssessmentDetails from "../pages/admin/AssessmentDetails";
import CreateAssessment from "../pages/admin/assessment-management/create-assessment/CreateAssessment";

import ResultsMonitoring from "../pages/admin/ResultsMonitoring";
import CertificateManagement from "../pages/admin/CertificateManagement";
import Profile from "../pages/admin/Profile";
import Settings from "../pages/admin/Settings";

export default function AdminRoutes() {
  return (
    <Routes>
      {/* Dashboard Home */}
      <Route
        path="/"
        element={
          <AdminLayout>
            <Home />
          </AdminLayout>
        }
      />

      {/* User Management */}
      <Route
        path="/user-management"
        element={
          <AdminLayout>
            <UserManagement />
          </AdminLayout>
        }
      />

      <Route
        path="/user-management/trainees"
        element={
          <AdminLayout>
            <TraineeManagement />
          </AdminLayout>
        }
      />

      <Route
        path="/user-management/assessors"
        element={
          <AdminLayout>
            <AssessorManagement />
          </AdminLayout>
        }
      />

      <Route
        path="/user-management/add-assessor"
        element={
          <AdminLayout>
            <AddAssessor />
          </AdminLayout>
        }
      />

      {/* Assessment Management */}
      <Route
        path="/assessments"
        element={
          <AdminLayout>
            <AssessmentManagement />
          </AdminLayout>
        }
      />
      <Route
        path="/assessments/schedule"
        element={<AdminLayout><CreateAssessment /></AdminLayout>}
      />
      <Route path="/assessments/:id" element={<AdminLayout><AssessmentDetails /></AdminLayout>} />

      <Route
        path="/assessments/create"
        element={
          <AdminLayout>
            <CreateAssessment />
          </AdminLayout>
        }
      />

      {/* Results */}
      <Route
        path="/results"
        element={
          <AdminLayout>
            <ResultsMonitoring />
          </AdminLayout>
        }
      />

      {/* Certificates */}
      <Route
        path="/certificates"
        element={
          <AdminLayout>
            <CertificateManagement />
          </AdminLayout>
        }
      />

      {/* Profile */}
      <Route
        path="/profile"
        element={
          <AdminLayout>
            <Profile />
          </AdminLayout>
        }
      />

      {/* Settings */}
      <Route
        path="/settings"
        element={
          <AdminLayout>
            <Settings />
          </AdminLayout>
        }
      />
    </Routes>
  );
}
