import { Routes, Route } from "react-router-dom";

/* =========================
   Admin Layout
========================= */

import AdminLayout from "../layouts/AdminLayout";

/* =========================
   Admin Pages
========================= */

import Home from "../pages/admin/Home";

import UserManagement from "../pages/admin/user-management/UserManagement";

import TraineeManagement from "../pages/admin/user-management/TraineeManagement";

import AssessorManagement from "../pages/admin/user-management/AssessorManagement";

/* =========================
   Add Assessor Workflow
========================= */

import AddAssessor from "../pages/admin/user-management/AddAssessor";

import AccountSetup from "../pages/admin/user-management/AccountSetup";

import Verification from "../pages/admin/user-management/Verification";

/* =========================
   Assessment Management
========================= */

import AssessmentManagement from "../pages/admin/AssessmentManagement";

import AssessmentDetails from "../pages/admin/AssessmentDetails";
import CourseAssessment from "../pages/admin/assessment-library/CourseAssessment";

import CreateAssessment from "../pages/admin/assessment-management/create-assessment/CreateAssessment";

import ScheduleAssessmentPage from "../pages/admin/assessment-management/ScheduleAssessmentPage";

import ScheduleAssessmentWorkflow from "../pages/admin/assessment-management/ScheduleAssessmentWorkflow";

/* =========================
   Results
========================= */

import ResultsMonitoring from "../pages/admin/ResultsMonitoring";
import CourseResults from "../pages/admin/results-monitoring/CourseResults";

/* =========================
   Certificates
========================= */

import CertificateManagement from "../pages/admin/CertificateManagement";

/* =========================
   Settings
========================= */

import Settings from "../pages/admin/Settings";

export default function AdminRoutes() {
  return (
    <Routes>

      {/* =========================
          Dashboard Home
      ========================= */}

      <Route
        path="/"
        element={
          <AdminLayout>
            <Home />
          </AdminLayout>
        }
      />

      {/* =========================
          User Management
      ========================= */}

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

      {/* =========================
          Add Assessor Workflow
      ========================= */}

      {/* 🔵 STEP 1
          Basic Information
      */}

      <Route
        path="/user-management/add-assessor"
        element={
          <AdminLayout>
            <AddAssessor />
          </AdminLayout>
        }
      />

      {/* Assessment Library */}
      {/* 🟢 STEP 2
          Professional Information
      */}

      <Route
        path="/user-management/add-assessor/account-setup"
        element={
          <AdminLayout>
            <AccountSetup />
          </AdminLayout>
        }
      />

      {/* 🟣 STEP 3
          Verification Documents
      */}

      <Route
        path="/user-management/add-assessor/verification"
        element={
          <AdminLayout>
            <Verification />
          </AdminLayout>
        }
      />

      {/* =========================
          Assessment Management
      ========================= */}

      <Route
        path="/assessments"
        element={
          <AdminLayout>
            <AssessmentManagement />
          </AdminLayout>
        }
      />

      {/* Course-specific Assessment Library */}
      <Route
        path="/assessments/course/:courseId"
        element={
          <AdminLayout>
            <CourseAssessment />
          </AdminLayout>
        }
      />

      {/* Assessment Scheduling */}
      <Route
        path="/assessments/schedule"
        element={
          <AdminLayout>
            <ScheduleAssessmentPage />
          </AdminLayout>
        }
      />

      <Route
        path="/assessments/schedule/choose"
        element={
          <AdminLayout>
            <ScheduleAssessmentWorkflow />
          </AdminLayout>
        }
      />

      <Route
        path="/assessments/:id"
        element={
          <AdminLayout>
            <AssessmentDetails />
          </AdminLayout>
        }
      />

      {/* Individual Assessment Details */}
      <Route
        path="/assessments/:id"
        element={
          <AdminLayout>
            <AssessmentDetails />
          </AdminLayout>
        }
      />

      {/* Create Assessment */}
      <Route
        path="/assessments/create"
        element={
          <AdminLayout>
            <CreateAssessment />
          </AdminLayout>
        }
      />

      {/* Results Monitoring */}
      {/* =========================
          Results Monitoring
      ========================= */}

      <Route
        path="/results"
        element={
          <AdminLayout>
            <ResultsMonitoring />
          </AdminLayout>
        }
      />

      <Route
        path="/results/course/:courseId"
        element={
          <AdminLayout>
            <CourseResults />
          </AdminLayout>
        }
      />

      {/* Certificates */}
      {/* =========================
          Certificate Management
      ========================= */}

      <Route
        path="/certificates"
        element={
          <AdminLayout>
            <CertificateManagement />
          </AdminLayout>
        }
      />

      {/* =========================
          Settings
      ========================= */}

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