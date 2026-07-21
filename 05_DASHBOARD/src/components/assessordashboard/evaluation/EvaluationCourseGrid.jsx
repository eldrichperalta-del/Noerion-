import EvaluationCourseCard from "./EvaluationCourseCard";

// ============================================================================
// EvaluationCourseGrid Component
// ----------------------------------------------------------------------------
// Displays all assigned courses in a responsive grid.
//
// Props:
// - courses
//      Array of assigned courses.
//
// - searchTerm
//      Search keyword entered by the assessor.
//
// - progressFilter
//      Selected progress filter.
//
// BACKEND HANDOFF:
//
// Replace the mock course array with live data fetched from Supabase.
//
// For large datasets, searching and filtering should ideally be performed
// server-side to improve performance.
//
// Expected Course Object:
//
// {
//     id,
//     qualificationName,
//     totalTrainees,
//     completedEvaluations
// }
//
// ============================================================================

export default function EvaluationCourseGrid({
  courses,
  searchTerm,
  progressFilter,
}) {
  // ==========================================================================
  // Filter Courses
  // ==========================================================================
  const filteredCourses = courses.filter((course) => {
    const progress =
      course.totalTrainees === 0
        ? 0
        : Math.round(
            (course.completedEvaluations / course.totalTrainees) * 100
          );

    // ------------------------------------------------------------
    // Search Filter
    // ------------------------------------------------------------
    const matchesSearch = course.qualificationName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    // ------------------------------------------------------------
    // Progress Filter
    // ------------------------------------------------------------
    let matchesProgress = true;

    switch (progressFilter) {
      case "Not Started":
        matchesProgress = progress === 0;
        break;

      case "In Progress":
        matchesProgress = progress > 0 && progress < 100;
        break;

      case "Completed":
        matchesProgress = progress === 100;
        break;

      default:
        matchesProgress = true;
    }

    return matchesSearch && matchesProgress;
  });

  return (
    <>
      {/* ========================================================= */}
      {/* Empty State */}
      {/* ========================================================= */}

      {filteredCourses.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800">
            No Assigned Courses Found
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Try adjusting your search or filter to view assigned courses.
          </p>
        </div>
      ) : (
        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-2
            xl:grid-cols-3
            gap-6
          "
        >
          {filteredCourses.map((course) => (
            <EvaluationCourseCard
              key={course.id}
              course={course}
            />
          ))}
        </div>
      )}
    </>
  );
}