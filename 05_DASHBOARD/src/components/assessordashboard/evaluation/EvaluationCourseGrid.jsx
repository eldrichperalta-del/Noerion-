import EvaluationCourseCard from "./EvaluationCourseCard";

export default function EvaluationCourseGrid({
  courses = [],
  loading = false,
  searchTerm = "",
}) {
  /* ================================================================
     LOADING
  ================================================================= */

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
          >
            <div className="animate-pulse p-6">
              <div className="mb-2 h-5 w-72 rounded bg-gray-200" />

              <div className="mb-6 h-4 w-40 rounded bg-gray-100" />

              <div className="h-16 w-full rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  /* ================================================================
     EMPTY
  ================================================================= */

  if (!courses.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center shadow-sm">
        <h3 className="text-base font-semibold text-gray-900">
          No courses found
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          {searchTerm
            ? "No courses or assessments match your search."
            : "There are no courses available to display."}
        </p>
      </div>
    );
  }

  /* ================================================================
     COURSE SECTIONS

     Each course receives its OWN card/table.
  ================================================================= */

  return (
    <div className="space-y-6">
      {courses.map((course) => (
        <EvaluationCourseCard
          key={course.id}
          course={course}
        />
      ))}
    </div>
  );
}