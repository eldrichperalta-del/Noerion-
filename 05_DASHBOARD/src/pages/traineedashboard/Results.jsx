import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function Results() {
  const navigate = useNavigate();

  const assessments = [
    {
      id: 1,
      title: "Advanced Robotics",
      qualification: "TESDA NC III Electronics",
      date: "2025-04-14",
      result: "Competent",
    },
    {
      id: 2,
      title: "Robot Arm",
      qualification: "TESDA NC III Electronics",
      date: "2025-04-10",
      result: "Competent",
    },
    {
      id: 3,
      title: "Written Assessment: Safety Protocols",
      qualification: "TESDA NC II Occupational Health & Safety",
      date: "2025-04-05",
      result: "Competent",
    },
    {
      id: 4,
      title: "Robot Arm",
      qualification: "TESDA NC II Occupational Health & Safety",
      date: "2025-04-05",
      result: "Competent",
    },
    {
      id: 5,
      title: "Oral Evaluation: Theory of Electronics",
      qualification: "TESDA NC III Electronics",
      date: "2025-04-01",
      result: "Not Yet Competent",
    },
    {
      id: 6,
      title: "Project Management Overview",
      qualification: "TESDA NC IV Industrial Project Management",
      date: "2025-04-01",
      result: "Not Yet Competent",
    },
    {
      id: 7,
      title: "Project Management Overview",
      qualification: "TESDA NC IV Industrial Project Management",
      date: "2025-03-28",
      result: "Competent",
    },
  ];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const filteredAssessments = useMemo(() => {
    return assessments.filter((assessment) => {
      const matchesSearch =
        assessment.title.toLowerCase().includes(search.toLowerCase()) ||
        assessment.qualification.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || assessment.result === statusFilter;

      const matchesDate =
        !dateFilter || assessment.date === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [search, statusFilter, dateFilter]);

  const totalPages = Math.ceil(filteredAssessments.length / rowsPerPage);

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

  return (
    <div className="p-0">
      <h1 className="text-3xl font-bold text-gray-800 mb-5">
        Completed Assessments
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap justify-between gap-4 mb-6">
        {/* Search */}
        <div className="bg-white rounded-xl p-3 shadow-[0_4px_12px_rgba(0,0,0,0.30)]">
          <div className="relative w-full md:w-80">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search Results..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3">
          {/* Status */}
          <div className="bg-white rounded-xl p-3 shadow-[0_4px_12px_rgba(0,0,0,0.30)]">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>All</option>
                <option>Competent</option>
                <option>Not Yet Competent</option>
              </select>

              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
              />
            </div>
          </div>

          {/* Date */}
          <div className="bg-white rounded-xl p-3 shadow-[0_4px_12px_rgba(0,0,0,0.30)]">
            <div className="relative">
              <CalendarDays
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />

              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              {filteredAssessments.length > 0 ? (
                currentData.map((assessment) => (
                  <tr
                    key={assessment.id}
                    className="border-t hover:bg-gray-100 transition"
                  >
                    <td className="px-5 py-4">{assessment.title}</td>

                    <td className="px-5 py-4">
                      {assessment.qualification}
                    </td>

                    <td className="px-5 py-4">
                      {new Date(assessment.date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold
                      ${assessment.result === "Competent"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                          }`}
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
                  <td
                    colSpan="5"
                    className="py-10 text-center text-gray-500"
                  >
                    No completed assessments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ================= PAGINATION ================= */}
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