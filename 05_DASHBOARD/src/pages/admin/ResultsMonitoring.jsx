import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

import { supabase } from "../../supabaseClient";
import DashboardPageHeader from "../../components/common/DashboardPageHeader";

import "../../styles/ResultsMonitoring.css";

export default function ResultsMonitoring() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [results, setResults] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("");

  // ============================================================
  // LOAD COURSES + RESULTS
  // ============================================================

  useEffect(() => {
    fetchCoursesAndResults();
  }, []);

  const fetchCoursesAndResults = async () => {
    setLoading(true);
    setError("");

    try {
      // ==========================================================
      // LOAD ALL COURSES
      // ==========================================================

      const {
        data: courseData,
        error: courseError,
      } = await supabase
        .from("courses")
        .select(`
          id,
          code,
          title,
          qualification_level
        `)
        .order("title", {
          ascending: true,
        });

      if (courseError) {
        throw courseError;
      }

      // ==========================================================
      // LOAD ASSESSMENT RESULTS
      // ==========================================================

      const {
        data: resultData,
        error: resultError,
      } = await supabase
        .from("assessment_submissions")
        .select(`
          id,
          assessment_id,
          trainee_id,
          status,
          total_score,
          passed,
          overall_result,
          submitted_at,
          created_at,
          updated_at,
          assessments!inner (
            id,
            course_id,
            title,
            total_items,
            status,
            courses!inner (
              id,
              code,
              title,
              qualification_level
            )
          )
        `)
        .in("status", ["submitted", "evaluated"])
        .order("updated_at", {
          ascending: false,
        });

      if (resultError) {
        throw resultError;
      }

      setCourses(courseData || []);
      setResults(resultData || []);
    } catch (err) {
      console.error(
        "Results Monitoring error:",
        err
      );

      setError(
        err?.message ||
          "Failed to load assessment results."
      );

      setCourses([]);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // BUILD COURSE SUMMARY
  //
  // Every course from the courses table is included.
  // Courses without results will show:
  //
  // No. of Results: 0
  // Latest Results: No Results
  // ============================================================

  const courseResults = useMemo(() => {
    return courses.map((course) => {
      const courseSubmissions = results.filter(
        (submission) =>
          submission?.assessments?.course_id ===
          course.id
      );

      const latestSubmission =
        courseSubmissions.length > 0
          ? courseSubmissions[0]
          : null;

      return {
        id: course.id,

        courseId: course.id,

        name:
          course.title ||
          "Untitled Course",

        code:
          course.code ||
          "",

        qualificationLevel:
          course.qualification_level ||
          "",

        resultCount:
          courseSubmissions.length,

        latestResult: latestSubmission
          ? normalizeResult(
              latestSubmission.overall_result,
              latestSubmission.passed
            )
          : "No Results",

        latestDate:
          latestSubmission?.updated_at ||
          latestSubmission?.submitted_at ||
          latestSubmission?.created_at ||
          null,
      };
    });
  }, [courses, results]);

  // ============================================================
  // FILTER
  // ============================================================

  const filteredCourses = useMemo(() => {
    const search = searchTerm
      .trim()
      .toLowerCase();

    return courseResults.filter((course) => {
      const matchesSearch =
        !search ||
        course.name
          .toLowerCase()
          .includes(search) ||
        course.code
          .toLowerCase()
          .includes(search);

      const matchesCourse =
        !courseFilter ||
        course.courseId === courseFilter;

      return (
        matchesSearch &&
        matchesCourse
      );
    });
  }, [
    courseResults,
    searchTerm,
    courseFilter,
  ]);

  // ============================================================
  // NAVIGATION
  // ============================================================

  const handleViewResults = (course) => {
    /*
     * AdminRoutes is mounted under:
     *
     * /admin/*
     *
     * Therefore:
     *
     * /admin/results/course/:courseId
     */

    navigate(
      `/admin/results/course/${course.courseId}`,
      {
        state: {
          courseName: course.name,
          courseId: course.courseId,
        },
      }
    );
  };

  // ============================================================
  // DATE FORMAT
  // ============================================================

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    const parsedDate = new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "—";
    }

    return parsedDate.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="results-page">

      <DashboardPageHeader
        title="Results Monitoring"
        subtitle="Track assessment performance, completion outcomes, and trainee results."
      />

      <div className="results-container">

        {/* ======================================================
            CONTROLS
        ======================================================= */}

        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

          {/* SEARCH */}

          <label className="relative w-full md:max-w-md">

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
              placeholder="Search course..."
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm shadow-sm outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"
            />

          </label>

          {/* COURSE FILTER */}

          <select
            value={courseFilter}
            onChange={(event) =>
              setCourseFilter(
                event.target.value
              )
            }
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100 md:w-72"
          >

            <option value="">
              All Courses
            </option>

            {courses.map((course) => (
              <option
                key={course.id}
                value={course.id}
              >
                {course.title}
              </option>
            ))}

          </select>

        </div>

        {/* ======================================================
            ERROR
        ======================================================= */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* ======================================================
            COURSE TABLE
        ======================================================= */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[800px]">

              <thead className="border-b border-gray-200 bg-gray-50">

                <tr>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Course
                  </th>

                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    No. of Results
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Latest Results
                  </th>

                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {loading ? (

                  <tr>

                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-sm text-gray-500"
                    >
                      Loading courses...
                    </td>

                  </tr>

                ) : filteredCourses.length === 0 ? (

                  <tr>

                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-sm text-gray-500"
                    >
                      No courses found.
                    </td>

                  </tr>

                ) : (

                  filteredCourses.map((course) => (

                    <tr
                      key={course.id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                    >

                      {/* ==================================================
                          COURSE
                      =================================================== */}

                      <td className="px-6 py-5">

                        <div className="font-semibold text-gray-800">
                          {course.name}
                        </div>


                      </td>

                      {/* ==================================================
                          NUMBER OF RESULTS
                      =================================================== */}

                      <td className="px-6 py-5 text-center">

                        <span className="font-semibold text-gray-700">
                          {course.resultCount}
                        </span>

                      </td>

                      {/* ==================================================
                          LATEST RESULT
                      =================================================== */}

                      <td className="px-6 py-5">

                        <div className="flex flex-col gap-1">

                          <span
                            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                              course.latestResult ===
                              "Pass"
                                ? "bg-green-100 text-green-700"
                                : course.latestResult ===
                                  "Fail"
                                ? "bg-red-100 text-red-700"
                                : course.latestResult ===
                                  "In Evaluation"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {course.latestResult}
                          </span>

                          {course.latestDate && (
                            <span className="text-xs text-gray-400">
                              {formatDate(
                                course.latestDate
                              )}
                            </span>
                          )}

                        </div>

                      </td>

                      {/* ==================================================
                          ACTION
                      =================================================== */}

                      <td className="px-6 py-5 text-center">

                        <button
                          type="button"
                          onClick={() =>
                            handleViewResults(
                              course
                            )
                          }
                          className="rounded-lg bg-[#002f86] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#001f5c]"
                        >
                          View Results
                        </button>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </div>
  );
}

// ============================================================
// RESULT NORMALIZATION
// ============================================================

function normalizeResult(
  result,
  passed
) {
  const normalized = String(
    result || ""
  )
    .trim()
    .toLowerCase();

  if (
    normalized === "pass" ||
    normalized === "passed" ||
    normalized === "competent" ||
    passed === true
  ) {
    return "Pass";
  }

  if (
    normalized === "fail" ||
    normalized === "failed" ||
    normalized === "not competent" ||
    normalized === "not yet competent" ||
    passed === false
  ) {
    return "Fail";
  }

  return "In Evaluation";
}
