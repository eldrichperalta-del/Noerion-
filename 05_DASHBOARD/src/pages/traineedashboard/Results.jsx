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

        // DEBUG LOG: Open Browser F12 Console to see exact Supabase values!
        console.log("Raw Submissions from Supabase:", submissions);

        const formatted = (submissions || []).map((sub) => {
          const statusLower = (sub.status || "").toLowerCase().trim();

          let outcome = "In evaluation";

          // ONLY evaluate if status explicitly confirms assessor evaluation is finished
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
            // For 'submitted', 'pending', 'in_progress', null, or anything else
            outcome = "In evaluation";
          }

          const completedDate =
            sub.submitted_at || sub.assignment?.assessment_date || null;

          return {
            id: sub.id,
            title: sub.assignment?.assessment_name || "Assessment Title",
            qualification:
              sub.assignment?.qualification ||
              sub.assignment?.assessment_type ||
              "NC II",
            date: completedDate ? String(completedDate).split("T")[0] : "",
            rawDate: completedDate,
            result: outcome,
            score: sub.total_score || 0,
          };
        });

        setAssessments(formatted);
      } catch (err) {
        console.error("Error loading assessment results:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, []);

  const filteredAssessments = useMemo(() => {
    return assessments.filter((assessment) => {
      const matchesSearch =
        assessment.title.toLowerCase().includes(search.toLowerCase()) ||
        assessment.qualification.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || assessment.result === statusFilter;

      const matchesDate = !dateFilter || assessment.date === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [assessments, search, statusFilter, dateFilter]);

  const totalPages = Math.ceil(filteredAssessments.length / rowsPerPage) || 1;

  const currentData = filteredAssessments.slice(
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
  }, [search, statusFilter, dateFilter]);

  const getResultBadgeStyle = (result) => {
    switch (result) {
      case "Pass":
      case "Competent":
        return "bg-green-100 text-green-700";
      case "Failed":
      case "Not Yet Competent":
        return "bg-red-100 text-red-700";
      case "In evaluation":
      default:
        return "bg-amber-100 text-amber-700";
    }
  };

  return (
    <div className="p-0">
      <DashboardPageHeader
        title="Assessment Results"
        subtitle="Review your completed assessments, scores, and evaluation outcomes."
      />

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative w-full lg:max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search results"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none shadow-sm focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Status */}
          <div className="rounded-xl bg-white shadow-sm">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All</option>
                <option value="Pass">Pass</option>
                <option value="Failed">Failed</option>
                <option value="In evaluation">In evaluation</option>
              </select>

              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
              />
            </div>
          </div>

          {/* Date */}
          <div className="rounded-xl bg-white shadow-sm">
            <div className="relative">
              <CalendarDays
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />

              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.30)]">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <table className="w-full">
            <thead className="bg-gray-800 text-left text-sm font-semibold text-gray-700">
              <tr>
                <th className="px-5 py-4">Assessment Title</th>
                <th className="px-5 py-4">Qualification / Course</th>
                <th className="px-5 py-4">Date Completed</th>
                <th className="px-5 py-4">Overall Result</th>
                <th className="px-5 py-4"></th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-gray-500">
                    Loading results...
                  </td>
                </tr>
              ) : currentData.length > 0 ? (
                currentData.map((assessment) => (
                  <tr
                    key={assessment.id}
                    className="border-t hover:bg-gray-100 transition"
                  >
                    <td className="px-5 py-4">{assessment.title}</td>

                    <td className="px-5 py-4">{assessment.qualification}</td>

                    <td className="px-5 py-4">
                      {assessment.rawDate
                        ? new Date(assessment.rawDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            }
                          )
                        : "N/A"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getResultBadgeStyle(
                          assessment.result
                        )}`}
                      >
                        {assessment.result}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() =>
                          navigate("/trainee/assessment-summary", {
                            state: { assessment },
                          })
                        }
                        className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-full text-sm font-medium transition"
                      >
                        View Results
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-gray-500">
                    No completed assessments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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

            <span className="px-3 py-2 border rounded-lg">{currentPage}</span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1 text-gray-500 disabled:opacity-40"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}