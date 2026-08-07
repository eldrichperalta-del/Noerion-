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

export default function Results() {
  const navigate = useNavigate();


  const assessments = [
    {
      id: 1,
      title: "Advanced Robotics",
      qualification: "TESDA NC III Electronics",
      date: "2025-04-14",
      result: "Competent",

      assessmentId: "TESDA-2025-0001",
      assessor: "Engr. Juan Dela Cruz",
      trainee: "Ash Ibe",
      duration: "2 Hours",
      certificateEligible: true,

      score: 91,

      performance: {
        written: 89,
        practical: 94,
        interview: 90,
      },

      eeg: {
        attention: 92,
        focus: 88,
        engagement: 90,
      },

      aiInsights: [
        "Maintained high sustained attention throughout the practical assessment.",
        "Excellent cognitive engagement during robotics activities.",
        "Minor decrease in focus during the written examination.",
        "Consistent decision-making under pressure.",
      ],

      recommendations: [
        "Continue advanced robotics simulations.",
        "Improve theoretical knowledge retention.",
        "Practice timed written assessments.",
      ],

      assessorFeedback:
        "The trainee demonstrated excellent practical competency and maintained consistent cognitive performance throughout the assessment.",

      strengths: [
        "Strong practical execution.",
        "Excellent sustained attention.",
        "High cognitive engagement.",
      ],

      improvements: [
        "Improve written assessment speed.",
        "Strengthen theoretical concepts.",
      ],
    },

    {
      id: 2,
      title: "Robot Arm",
      qualification: "TESDA NC III Electronics",
      date: "2025-04-10",
      result: "Competent",

      assessmentId: "TESDA-2025-0002",
      assessor: "Engr. Maria Santos",
      trainee: "Ash Ibe",
      duration: "1 Hour 45 Minutes",
      certificateEligible: true,

      score: 88,

      performance: {
        written: 84,
        practical: 92,
        interview: 88,
      },

      eeg: {
        attention: 89,
        focus: 86,
        engagement: 90,
      },

      aiInsights: [
        "Good concentration during practical tasks.",
        "Stable engagement across the assessment.",
        "Quick recovery after minor distractions.",
      ],

      recommendations: [
        "Continue hands-on robotics training.",
        "Review electrical safety concepts.",
        "Improve written documentation skills.",
      ],

      assessorFeedback:
        "The trainee performed well in assembling and operating robotic systems with minimal supervision.",

      strengths: [
        "Strong technical skills.",
        "Excellent practical execution.",
        "Good concentration.",
      ],

      improvements: [
        "Enhance documentation.",
        "Improve theoretical accuracy.",
      ],
    },

    {
      id: 3,
      title: "Written Assessment: Safety Protocols",
      qualification: "TESDA NC II Occupational Health & Safety",
      date: "2025-04-05",
      result: "Competent",

      assessmentId: "TESDA-2025-0003",
      assessor: "Engr. Carlo Reyes",
      trainee: "Ash Ibe",
      duration: "1 Hour",
      certificateEligible: true,

      score: 86,

      performance: {
        written: 86,
        practical: 87,
        interview: 85,
      },

      eeg: {
        attention: 88,
        focus: 84,
        engagement: 85,
      },

      aiInsights: [
        "Maintained consistent focus.",
        "Strong understanding of safety procedures.",
        "Minor attention fluctuation near completion.",
      ],

      recommendations: [
        "Continue reviewing workplace safety standards.",
        "Improve response speed.",
        "Practice emergency simulations.",
      ],

      assessorFeedback:
        "The trainee demonstrated adequate knowledge of occupational safety and complied with assessment requirements.",

      strengths: [
        "Good comprehension.",
        "Consistent focus.",
        "High accuracy.",
      ],

      improvements: [
        "Increase answering speed.",
        "Strengthen hazard identification.",
      ],
    },

    {
      id: 4,
      title: "Robot Arm",
      qualification: "TESDA NC II Occupational Health & Safety",
      date: "2025-04-05",
      result: "Competent",

      assessmentId: "TESDA-2025-0004",
      assessor: "Engr. Maria Santos",
      trainee: "Ash Ibe",
      duration: "2 Hours",
      certificateEligible: true,

      score: 90,

      performance: {
        written: 87,
        practical: 94,
        interview: 89,
      },

      eeg: {
        attention: 91,
        focus: 89,
        engagement: 90,
      },

      aiInsights: [
        "Excellent attention during assembly.",
        "Stable engagement throughout assessment.",
        "High confidence observed.",
      ],

      recommendations: [
        "Continue advanced practice.",
        "Improve troubleshooting speed.",
        "Expand theoretical knowledge.",
      ],

      assessorFeedback:
        "Excellent overall practical performance with consistent technical accuracy.",

      strengths: [
        "Strong technical skills.",
        "Excellent attention.",
        "Reliable execution.",
      ],

      improvements: [
        "Improve written analysis.",
        "Expand advanced robotics knowledge.",
      ],
    },

    {
      id: 5,
      title: "Oral Evaluation: Theory of Electronics",
      qualification: "TESDA NC III Electronics",
      date: "2025-04-01",
      result: "Not Yet Competent",

      assessmentId: "TESDA-2025-0005",
      assessor: "Engr. Juan Dela Cruz",
      trainee: "Ash Ibe",
      duration: "45 Minutes",
      certificateEligible: false,

      score: 72,

      performance: {
        written: 74,
        practical: 78,
        interview: 65,
      },

      eeg: {
        attention: 76,
        focus: 71,
        engagement: 73,
      },

      aiInsights: [
        "Reduced confidence during oral responses.",
        "Attention declined near the end of the interview.",
        "Needs stronger theoretical recall.",
      ],

      recommendations: [
        "Review electronics fundamentals.",
        "Practice mock interviews.",
        "Improve verbal explanations.",
      ],

      assessorFeedback:
        "The trainee requires additional preparation in explaining theoretical concepts verbally.",

      strengths: [
        "Good practical foundation.",
        "Positive attitude.",
      ],

      improvements: [
        "Improve communication skills.",
        "Strengthen theoretical knowledge.",
      ],
    },

    {
      id: 6,
      title: "Project Management Overview",
      qualification: "TESDA NC IV Industrial Project Management",
      date: "2025-04-01",
      result: "Not Yet Competent",

      assessmentId: "TESDA-2025-0006",
      assessor: "Engr. Carlo Reyes",
      trainee: "Ash Ibe",
      duration: "2 Hours",
      certificateEligible: false,

      score: 68,

      performance: {
        written: 70,
        practical: 67,
        interview: 66,
      },

      eeg: {
        attention: 69,
        focus: 67,
        engagement: 68,
      },

      aiInsights: [
        "Difficulty maintaining attention.",
        "Reduced engagement during planning activities.",
        "Needs stronger analytical thinking.",
      ],

      recommendations: [
        "Study project planning principles.",
        "Practice scheduling exercises.",
        "Improve risk assessment skills.",
      ],

      assessorFeedback:
        "Additional training is recommended before reassessment.",

      strengths: [
        "Willingness to learn.",
        "Basic planning skills.",
      ],

      improvements: [
        "Improve planning accuracy.",
        "Increase project management knowledge.",
      ],
    },

    {
      id: 7,
      title: "Project Management Overview",
      qualification: "TESDA NC IV Industrial Project Management",
      date: "2025-03-28",
      result: "Competent",

      assessmentId: "TESDA-2025-0007",
      assessor: "Engr. Maria Santos",
      trainee: "Ash Ibe",
      duration: "2 Hours",
      certificateEligible: true,

      score: 89,

      performance: {
        written: 87,
        practical: 91,
        interview: 89,
      },

      eeg: {
        attention: 90,
        focus: 88,
        engagement: 89,
      },

      aiInsights: [
        "Excellent planning consistency.",
        "Strong sustained attention.",
        "High engagement during practical exercises.",
      ],

      recommendations: [
        "Continue leadership development.",
        "Practice larger project simulations.",
        "Improve documentation quality.",
      ],

      assessorFeedback:
        "The trainee demonstrated competency in project planning and execution with consistent cognitive performance.",

      strengths: [
        "Leadership.",
        "Planning ability.",
        "Strong focus.",
      ],

      improvements: [
        "Improve documentation.",
        "Expand advanced management techniques.",
      ],
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
