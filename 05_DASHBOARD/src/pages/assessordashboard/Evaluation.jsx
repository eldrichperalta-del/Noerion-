import { useState } from "react";

import AssessorPageHeader from "../../components/assessordashboard/shared/AssessorPageHeader";
import EvaluationFilters from "../../components/assessordashboard/evaluation/EvaluationFilters";
import EvaluationCourseGrid from "../../components/assessordashboard/evaluation/EvaluationCourseGrid";

import { mockEvaluationCourses } from "../../data/mockEvaluationCourses";

// ============================================================================
// BACKEND HANDOFF
// ----------------------------------------------------------------------------
// Replace mockEvaluationCourses with live assessment data from Supabase.
//
// Expected Backend Flow:
// 1. Fetch all assessment courses assigned to the currently logged-in assessor.
// 2. For each assigned course, calculate:
//
//    - totalTrainees
//      → Total trainees assigned to the assessment.
//
//    - completedEvaluations
//      → Number of trainees whose evaluation has been completed by the assessor.
//
//    - progressPercentage
//      → (completedEvaluations / totalTrainees) * 100
//
// 3. Search and progress filtering should ideally be handled by the backend
//    for large datasets, but frontend filtering is acceptable for small lists.
//
// Example API Response:
//
// [
//   {
//     id: 1,
//     qualificationName: "TESDA NC III Electronics: Advanced Robotics Assembly",
//     totalTrainees: 15,
//     completedEvaluations: 7
//   }
// ]
//
// NOTE:
// Do NOT store progressPercentage in the database.
// Always calculate it dynamically to prevent inconsistent data.
// ============================================================================

export default function Evaluation() {
  // ==========================================================================
  // FRONTEND STATE
  // --------------------------------------------------------------------------
  // Controls the Search Bar and Progress Filter.
  // ==========================================================================
  const [searchTerm, setSearchTerm] = useState("");
  const [progressFilter, setProgressFilter] = useState("All");

  return (
    <div className="space-y-6">
      <AssessorPageHeader
        title="Assigned Courses & Qualifications"
        subtitle="Evaluate trainee performance across your assigned courses."
      />

      {/* ---------------------------------------------------------------------
          Search Bar + Progress Filter
          ---------------------------------------------------------------------
          BACKEND NOTE:
          Search may be performed server-side when the number of assigned
          courses becomes large.
      ---------------------------------------------------------------------- */}
      <EvaluationFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        progressFilter={progressFilter}
        setProgressFilter={setProgressFilter}
      />

      {/* ---------------------------------------------------------------------
          Responsive Course Grid
          ---------------------------------------------------------------------
          Displays all assigned qualification cards.

          BACKEND NOTE:
          Replace mockEvaluationCourses with live data fetched from Supabase.
      ---------------------------------------------------------------------- */}
      <EvaluationCourseGrid
        courses={mockEvaluationCourses}
        searchTerm={searchTerm}
        progressFilter={progressFilter}
      />
    </div>
  );
}