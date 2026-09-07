import { useEffect, useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

/* ============================================================
   FORMAT DATE
   ============================================================ */

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ============================================================
   ASSESSMENT MANAGEMENT
   ============================================================ */

export default function AssessmentManagement() {
  const navigate = useNavigate();

  /* ==========================================================
     STATE
     ========================================================== */

  const [courses, setCourses] = useState([]);
  const [assessments, setAssessments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");

  /* ==========================================================
     LOAD DATA
     ========================================================== */

  const loadData = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      /* ========================================================
         1. LOAD COURSES
         ======================================================== */

      const {
        data: courseData,
        error: courseError,
      } = await supabase
        .from("courses")
        .select(`
          id,
          code,
          title,
          qualification_level,
          description,
          created_at
        `)
        .order("title", {
          ascending: true,
        });

      if (courseError) {
        throw new Error(
          `Courses query failed: ${courseError.message}`
        );
      }

      /* ========================================================
         2. LOAD ASSESSMENTS
         ======================================================== */

      const {
        data: assessmentData,
        error: assessmentError,
      } = await supabase
        .from("assessments")
        .select(`
          id,
          course_id,
          title,
          set_type,
          total_items,
          time_limit_minutes,
          is_active,
          created_at,
          status
        `)
        .order("created_at", {
          ascending: false,
        });

      if (assessmentError) {
        throw new Error(
          `Assessments query failed: ${assessmentError.message}`
        );
      }

      /* ========================================================
         3. SAVE DATA
         ======================================================== */

      setCourses(courseData || []);
      setAssessments(assessmentData || []);
    } catch (error) {
      console.error(
        "ERROR LOADING ASSESSMENT LIBRARY:",
        error
      );

      setErrorMessage(
        error?.message ||
        "Unable to load the Assessment Library."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     INITIAL LOAD
     ========================================================== */

  useEffect(() => {
    loadData();
  }, []);

  /* ==========================================================
     BUILD ONE COURSE TABLE

     Every course gets:
       - assessments
       - latest assessment
       - assessment count

     Everything is displayed in ONE table.
     ========================================================== */

  const courseTables = useMemo(() => {
    return courses.map((course) => {
      const courseAssessments = assessments
        .filter(
          (assessment) =>
            assessment.course_id === course.id
        )
        .sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
        );

      return {
        ...course,

        assessments: courseAssessments,

        assessmentCount:
          courseAssessments.length,

        latestAssessment:
          courseAssessments[0] || null,
      };
    });
  }, [courses, assessments]);

  /* ==========================================================
     SEARCH

     Searches:
       - Course title
       - Course code
       - Qualification level
       - Assessment title
       - Assessment type
     ========================================================== */

  const filteredCourses = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    if (!searchValue) {
      return courseTables;
    }

    return courseTables.filter((course) => {
      const courseTitle = String(
        course.title || ""
      ).toLowerCase();

      const courseCode = String(
        course.code || ""
      ).toLowerCase();

      const qualification = String(
        course.qualification_level || ""
      ).toLowerCase();

      const assessmentMatch =
        course.assessments.some(
          (assessment) => {
            const title = String(
              assessment.title || ""
            ).toLowerCase();

            const setType = String(
              assessment.set_type || ""
            ).toLowerCase();

            return (
              title.includes(searchValue) ||
              setType.includes(searchValue)
            );
          }
        );

      return (
        courseTitle.includes(searchValue) ||
        courseCode.includes(searchValue) ||
        qualification.includes(searchValue) ||
        assessmentMatch
      );
    });
  }, [courseTables, search]);

  /* ==========================================================
     VIEW ASSESSMENT
     ========================================================== */

  const handleViewAssessment = (course) => {
    if (!course?.id) {
      return;
    }

    navigate(
      `/admin/assessments/course/${course.id}`,
      {
        state: {
          courseName: course.title,

          courseCode: course.code,

          qualification:
            course.qualification_level,
        },
      }
    );
  };

  /* ==========================================================
     CREATE ASSESSMENT
     ========================================================== */

  const handleCreateAssessment = () => {
    navigate("/admin/assessments/create");
  };

  /* ==========================================================
     PAGE
     ========================================================== */

  return (
    <div className="space-y-6">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header>
        <h1 className="text-4xl font-bold text-gray-900">
          Assessment Library
        </h1>

        <p className="mt-2 text-gray-600">
          Create, organize, and manage reusable assessment templates.
        </p>
      </header>

      {/* ======================================================
          SEARCH + CREATE
      ====================================================== */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <label className="relative block w-full sm:max-w-md">

          <Search
            size={19}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search courses or assessments..."
            className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-[#002f86]/10"
          />

        </label>

        <button
          type="button"
          onClick={handleCreateAssessment}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#002f86] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#001f59] sm:w-auto"
        >
          <Plus size={18} />

          Create Assessment
        </button>

      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">

          <p className="text-sm font-semibold text-red-700">
            Unable to load Assessment Library
          </p>

          <p className="mt-1 text-sm text-red-600">
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={loadData}
            className="mt-3 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
          >
            Try Again
          </button>

        </div>
      )}

      {/* ======================================================
          CONTENT
      ====================================================== */}

      {loading ? (

        <div className="rounded-2xl border border-gray-200 bg-white py-12 text-center shadow-sm">

          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#002f86]" />

          <p className="font-medium text-gray-500">
            Loading assessment library...
          </p>

        </div>

      ) : !errorMessage && courses.length === 0 ? (

        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">

          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-gray-100">
            <Search
              size={22}
              className="text-gray-400"
            />
          </div>

          <p className="font-semibold text-gray-700">
            No courses available.
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Create a course first to manage its assessments.
          </p>

        </div>

      ) : filteredCourses.length === 0 ? (

        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">

          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-gray-100">
            <Search
              size={22}
              className="text-gray-400"
            />
          </div>

          <p className="font-semibold text-gray-700">
            No courses found.
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Try a different search term.
          </p>

        </div>

      ) : (

        /* ====================================================
           ONE TABLE FOR ALL COURSES
        ==================================================== */

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px] border-collapse">

              {/* ==================================================
                  TABLE HEADER
              ================================================== */}

              <thead>

                <tr className="border-b border-gray-200 bg-gray-120">

                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Course
                  </th>

                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    No. of Assessments
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Latest Assessment
                  </th>

                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    Action
                  </th>

                </tr>

              </thead>

              {/* ==================================================
                  TABLE BODY
              ================================================== */}

              <tbody>

                {filteredCourses.map((course) => {

                  const latest =
                    course.latestAssessment;

                  return (
                    <tr
                      key={course.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-100"
                    >

                      {/* ========================================
                          COURSE
                      ======================================== */}

                      <td className="px-6 py-5">

                        <div className="min-w-0">

                          <p className="font-semibold text-gray-900">
                            {course.title}
                          </p>

                        </div>

                      </td>

                      {/* ========================================
                          NUMBER OF ASSESSMENTS
                      ======================================== */}

                      <td className="px-6 py-5 text-center">

                        <span className="font-semibold text-gray-900">
                          {course.assessmentCount}
                        </span>

                      </td>

                      {/* ========================================
                          LATEST ASSESSMENT
                      ======================================== */}

                      <td className="px-6 py-5">

                        {latest ? (

                          <div>

                            <p className="font-semibold text-gray-900">
                              {latest.title}
                            </p>

                            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">

                              <span>
                                {latest.set_type || "Written"}
                              </span>

                              <span>
                                •
                              </span>

                              <span>
                                {latest.total_items ?? 0} questions
                              </span>

                              {latest.time_limit_minutes !== null &&
                                latest.time_limit_minutes !== undefined && (
                                  <>
                                    <span>
                                      •
                                    </span>

                                    <span>
                                      {latest.time_limit_minutes} min
                                    </span>
                                  </>
                                )}

                              <span>
                                •
                              </span>

                              <span>
                                {formatDate(
                                  latest.created_at
                                )}
                              </span>

                            </div>

                            {latest.status && (

                              <div className="mt-2">

                                <span
                                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${String(
                                    latest.status
                                  ).toLowerCase() ===
                                      "active"
                                      ? "bg-green-100 text-green-700"
                                      : String(
                                        latest.status
                                      ).toLowerCase() ===
                                        "archived"
                                        ? "bg-gray-100 text-gray-600"
                                        : "bg-blue-100 text-blue-700"
                                    }`}
                                >
                                  {latest.status}
                                </span>

                              </div>

                            )}

                          </div>

                        ) : (

                          <span className="text-sm text-gray-400">
                            No assessment yet
                          </span>

                        )}

                      </td>

                      {/* ========================================
                          ACTION
                      ======================================== */}

                      <td className="px-6 py-5 text-center">

                        <button
                          type="button"
                          onClick={() =>
                            handleViewAssessment(
                              course
                            )
                          }
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-[#002f86] px-4 py-2.5 text-sm font-semibold text-[#002f86] transition hover:bg-[#002f86] hover:text-white"
                        >
                          View Assessment
                        </button>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>

        </section>

      )}

    </div>
  );
}