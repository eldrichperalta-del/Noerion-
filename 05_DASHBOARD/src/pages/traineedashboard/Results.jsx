import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import DashboardPageHeader from "../../components/common/DashboardPageHeader";
import { supabase } from "../../supabaseClient";

export default function Results() {
  const navigate = useNavigate();

  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  // =========================================================
  // FETCH RESULTS
  // =========================================================

  useEffect(() => {
    async function fetchResults() {
      try {
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data: submissions, error } = await supabase
          .from("assessment_submissions")
          .select(`
            id,
            trainee_id,
            total_score,
            passed,
            status,
            submitted_at,
            assignment:assignments (
              id,
              assessment_name,
              qualification,
              assessment_type,
              assessment_date
            )
          `)
          .eq("trainee_id", user.id)
          .order("submitted_at", { ascending: false });

        if (error) throw error;

        console.log(
          "Raw Submissions from Supabase:",
          submissions
        );

        const formatted = (submissions || []).map((sub) => {
          const statusLower = (sub.status || "")
            .toLowerCase()
            .trim();

          let outcome = "In evaluation";

          if (
            statusLower === "evaluated" ||
            statusLower === "completed" ||
            statusLower === "finalized" ||
            statusLower === "graded"
          ) {
            outcome = sub.passed ? "Pass" : "Failed";
          } else if (statusLower === "passed") {
            outcome = "Pass";
          } else if (statusLower === "failed") {
            outcome = "Failed";
          } else {
            outcome = "In evaluation";
          }

          const completedDate =
            sub.submitted_at ||
            sub.assignment?.assessment_date ||
            null;

          return {
            id: sub.id,
            trainee_id: sub.trainee_id || user.id,

            title:
              sub.assignment?.assessment_name ||
              "Assessment Title",

            qualification:
              sub.assignment?.qualification ||
              sub.assignment?.assessment_type ||
              "NC II",

            date: completedDate
              ? String(completedDate).split("T")[0]
              : "",

            rawDate: completedDate,

            result: outcome,

            score: sub.total_score || 0,
          };
        });

        setAssessments(formatted);
      } catch (err) {
        console.error(
          "Error loading assessment results:",
          err
        );
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, []);

  // =========================================================
  // FILTERING
  // =========================================================

  const filteredAssessments = useMemo(() => {
    return assessments.filter((assessment) => {
      const searchTerm = search.toLowerCase();

      const matchesSearch =
        assessment.title
          .toLowerCase()
          .includes(searchTerm) ||
        assessment.qualification
          .toLowerCase()
          .includes(searchTerm);

      const matchesStatus =
        statusFilter === "All" ||
        assessment.result === statusFilter;

      const matchesDate =
        !dateFilter ||
        assessment.date === dateFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDate
      );
    });
  }, [
    assessments,
    search,
    statusFilter,
    dateFilter,
  ]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages =
    Math.ceil(
      filteredAssessments.length / rowsPerPage
    ) || 1;

  const currentData =
    filteredAssessments.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );

  const showingStart =
    filteredAssessments.length === 0
      ? 0
      : (currentPage - 1) * rowsPerPage + 1;

  const showingEnd = Math.min(
    currentPage * rowsPerPage,
    filteredAssessments.length
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    statusFilter,
    dateFilter,
  ]);

  // =========================================================
  // RESULT BADGE
  // =========================================================

  const getResultBadgeStyle = (result) => {
    switch (result) {
      case "Pass":
      case "Competent":
        return "bg-green-50 text-green-700 border-green-200";

      case "Failed":
      case "Not Yet Competent":
        return "bg-red-50 text-red-700 border-red-200";

      case "In evaluation":
      default:
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
    }
  };

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="space-y-6">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <DashboardPageHeader
        title="Assessment Results"
        subtitle="Review your completed assessments, scores, and evaluation outcomes."
      />

      {/* =====================================================
          FILTERS
      ====================================================== */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search assessment and qualification"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-700 shadow-sm focus:border-[#002f86] focus:outline-none focus:ring-1 focus:ring-[#002f86]"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Status */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm text-gray-700 shadow-sm focus:border-[#002f86] focus:outline-none focus:ring-1 focus:ring-[#002f86]"
            >
              <option value="All">All Results</option>
              <option value="Pass">Pass</option>
              <option value="Failed">Failed</option>
              <option value="In evaluation">
                In evaluation
              </option>
            </select>

            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
          </div>

          {/* Date */}
          <div className="relative">
            <CalendarDays
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />

            <input
              type="date"
              value={dateFilter}
              onChange={(e) =>
                setDateFilter(e.target.value)
              }
              className="rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-700 shadow-sm focus:border-[#002f86] focus:outline-none focus:ring-1 focus:ring-[#002f86]"
            />
          </div>
        </div>
      </div>

      {/* =====================================================
          RESULTS TABLE
      ====================================================== */}

      <section className="overflow-visible rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          <table className="w-full">
            {/* TABLE HEADER */}
            <thead className="bg-gray-50 text-left text-sm font-semibold text-gray-500">
              <tr>
                <th className="px-5 py-4">Assessment Title</th>
                <th className="px-5 py-4">Qualification / Course</th>
                <th className="px-5 py-4">Date Completed</th>
                <th className="px-5 py-4">Overall Result</th>
                <th className="px-5 py-4"></th>
              </tr>
            </thead>

            {/* TABLE BODY */}
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Loading results...
                  </td>
                </tr>
              ) : currentData.length > 0 ? (
                currentData.map((assessment) => (
                  <tr
                    key={assessment.id}
                    className="transition-colors hover:bg-gray-50/60"
                  >
                    {/* Assessment Title */}
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {assessment.title}
                    </td>

                    {/* Qualification */}
                    <td className="px-6 py-4 text-gray-600">
                      {assessment.qualification}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-gray-600">
                      {assessment.rawDate
                        ? new Date(
                          assessment.rawDate
                        ).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )
                        : "N/A"}
                    </td>

                    {/* Result */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getResultBadgeStyle(
                          assessment.result
                        )}`}
                      >
                        {assessment.result}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() =>
                            navigate("/trainee/assessment-summary", {
                              state: { assessment },
                            })
                          }
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-blue-700 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-800"
                        >
                          View Results
                        </button>
                      </td>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No completed assessments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredAssessments.length >= 6 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-4 text-sm">
            <p className="font-medium text-gray-700">
              Showing {showingStart}-{showingEnd} of {filteredAssessments.length}
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 text-gray-500 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Prev
              </button>

              <span className="px-3 py-2 border rounded-lg">
                {currentPage}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1 text-gray-500 disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}