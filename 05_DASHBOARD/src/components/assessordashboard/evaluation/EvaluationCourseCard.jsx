import { useNavigate } from "react-router-dom";

import ProgressBar from "./ProgressBar";

// ============================================================================
// EvaluationCourseCard Component
// ----------------------------------------------------------------------------
// Displays a single assigned course/qualification for evaluation.
//
// Props:
// - course
//      {
//          id,
//          qualificationName,
//          totalTrainees,
//          completedEvaluations
//      }
//
// BACKEND HANDOFF:
//
// Replace the mock course object with live assessment data.
//
// Expected object:
//
// {
//     id: 1,
//     qualificationName: "...",
//     totalTrainees: 15,
//     completedEvaluations: 7
// }
//
// The frontend calculates:
//
// progressPercentage =
// (completedEvaluations / totalTrainees) * 100
//
// Do NOT store progressPercentage in the database.
// ============================================================================

export default function EvaluationCourseCard({ course }) {
  const navigate = useNavigate();

  const {
    id,
    qualificationName,
    totalTrainees,
    completedEvaluations,
  } = course;

  // ==========================================================================
  // Calculate evaluation progress
  // ==========================================================================
  const progressPercentage =
    totalTrainees === 0
      ? 0
      : Math.round((completedEvaluations / totalTrainees) * 100);

  // ==========================================================================
  // Navigate to Trainees for Evaluation
  //
  // BACKEND HANDOFF:
  // Pass the selected course so the next page can retrieve only the trainees
  // assigned to this qualification.
  // ==========================================================================
  const handleViewTrainees = () => {
    navigate("/assessor/evaluation/trainees", {
      state: {
        selectedCourse: course,
      },
    });
  };

  return (
    <div
      className="
      bg-white 
      rounded-xl 
      border 
      border-gray-200 
      shadow-lg 
      p-6
      transition-all 
      duration-300
      hover:shadow-xl
      hover:-translate-y-1
    "
    >
      {/* ================================================================ */}
      {/* Course Name */}
      {/* ================================================================ */}
      <div className="mb-5">
        <p className="text-sm font-medium text-gray-500">
          Course / Qualification Name
        </p>

        <h3 className="mt-1 text-lg font-bold text-gray-900 leading-snug">
          {qualificationName}
        </h3>
      </div>

      {/* ================================================================ */}
      {/* Trainee Count */}
      {/* ================================================================ */}
      <div className="mb-5">
        <p className="text-sm text-gray-600">
          <span className="font-semibold">
            {totalTrainees}
          </span>{" "}
          Trainees
        </p>
      </div>

      {/* ================================================================ */}
      {/* Evaluation Progress */}
      {/* ================================================================ */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">
          Evaluation Progress
        </p>

        <ProgressBar value={progressPercentage} />

        <p className="text-sm text-gray-600">
          <span className="font-semibold">
            {completedEvaluations}
          </span>{" "}
          / {totalTrainees} Completed ({progressPercentage}%)
        </p>
      </div>

      {/* ================================================================ */}
      {/* Action Button */}
      {/* ================================================================ */}
      <button
        onClick={handleViewTrainees}
        className="mt-6 w-full rounded-lg bg-blue-900 hover:bg-blue-950 text-white font-medium py-3 transition-colors duration-200"
      >
        View Trainees
      </button>
    </div>
  );
}