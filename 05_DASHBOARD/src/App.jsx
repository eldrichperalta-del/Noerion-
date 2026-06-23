import { Routes, Route, Navigate } from "react-router-dom";

import AdminLayout from "./layouts/AdminLayout";

import Landing from "./pages/landing/Landing";
import Login from "./pages/login/Login";
import Loading from "./pages/loading/Loading";
import Privacy from "./pages/privacy/Privacy";

import Home from "./pages/admin/Home";
import UserManagement from "./pages/admin/user-management/UserManagement";
import TraineeManagement from "./pages/admin/user-management/TraineeManagement";
import AssessorManagement from "./pages/admin/user-management/AssessorManagement";
import AddAssessor from "./pages/admin/user-management/AddAssessor";

import AssessmentManagement from "./pages/admin/AssessmentManagement";
import CreateAssessment from "./pages/admin/assessment-management/create-assessment/CreateAssessment";

import ResultsMonitoring from "./pages/admin/ResultsMonitoring";
import CertificateManagement from "./pages/admin/CertificateManagement";
import Profile from "./pages/admin/Profile";
import Settings from "./pages/admin/Settings";
import Logout from "./pages/admin/Logout";

function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/loading" element={<Loading />} />
      <Route path="/privacy" element={<Privacy />} />

      {/* Admin dashboard home */}
      <Route
        path="/admin"
        element={
          <AdminLayout>
            <Home />
          </AdminLayout>
        }
      />

      {/* Admin user management */}
      <Route
        path="/admin/user-management"
        element={
          <AdminLayout>
            <UserManagement />
          </AdminLayout>
        }
      />

      <Route
        path="/admin/user-management/trainees"
        element={
          <AdminLayout>
            <TraineeManagement />
          </AdminLayout>
        }
      />

      <Route
        path="/admin/user-management/assessors"
        element={
          <AdminLayout>
            <AssessorManagement />
          </AdminLayout>
        }
      />

      <Route
        path="/admin/user-management/add-assessor"
        element={
          <AdminLayout>
            <AddAssessor />
          </AdminLayout>
        }
      />

      {/* Admin assessment management */}
      <Route
        path="/admin/assessments"
        element={
          <AdminLayout>
            <AssessmentManagement />
          </AdminLayout>
        }
      />

      <Route
        path="/admin/assessments/create"
        element={
          <AdminLayout>
            <CreateAssessment />
          </AdminLayout>
        }
      />

      {/* Other admin pages */}
      <Route
        path="/admin/results"
        element={
          <AdminLayout>
            <ResultsMonitoring />
          </AdminLayout>
        }
      />

      <Route
        path="/admin/certificates"
        element={
          <AdminLayout>
            <CertificateManagement />
          </AdminLayout>
        }
      />

      <Route
        path="/admin/profile"
        element={
          <AdminLayout>
            <Profile />
          </AdminLayout>
        }
      />

      <Route
        path="/admin/settings"
        element={
          <AdminLayout>
            <Settings />
          </AdminLayout>
        }
      />

      <Route
        path="/admin/logout"
        element={
          <AdminLayout>
            <Logout />
          </AdminLayout>
        }
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;