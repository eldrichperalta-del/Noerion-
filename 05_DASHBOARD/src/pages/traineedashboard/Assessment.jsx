import { Calendar, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAssessments } from "../../context/AssessmentContext";
import DashboardPageHeader from "../../components/common/DashboardPageHeader";

export default function Assessment() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedDate, setSelectedDate] = useState("");

  const { assessments } = useAssessments();

  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-700";

      case "Ongoing":
        return "bg-blue-100 text-blue-700";

      case "Completed":
        return "bg-green-100 text-green-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Search + Filter
  const filteredAssessments = assessments.filter((assessment) => {
    const matchesSearch =
      assessment.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      assessment.qualification
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ||
      assessment.status === statusFilter;

    const matchesDate = !selectedDate || assessment.schedule.includes(selectedDate);
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Navigate to Assessment Overview
  const handleViewAssessment = (assessment) => {
    navigate("/trainee/assessment/overview", {
      state: {
        assessment,
      },
    });
  };

  return (
    <div className="p-0">
      <DashboardPageHeader title="My Assessments" subtitle="View your scheduled assessments and continue the next step in your evaluation." />

      {/* Search + Filter */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-5">

        {/* Search */}
        <div className="relative w-full lg:max-w-md">

          <div className="relative">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search by Title or Qualification..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="
                w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-black placeholder:text-gray-400 outline-none shadow-sm transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100
              "
            />

          </div>

        </div>

        {/* Status Filter */}

        <div className="flex w-full gap-3 lg:w-auto">

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="
              min-w-[160px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm focus:border-[#002f86] focus:ring-2 focus:ring-blue-100
            "
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
          </select>
          <div className="relative flex-1 lg:w-64"><Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none shadow-sm focus:border-[#002f86] focus:ring-2 focus:ring-blue-100" /></div>
        </div>

      </div>

      {/* Header */}

      <div className="grid grid-cols-[2fr_1.2fr_1.4fr_0.8fr_1fr] gap-4 rounded-xl bg-gray-200 px-6 py-3 text-xs font-bold uppercase tracking-wide text-gray-600">

        <div>Assessment Title</div>

        <div>Assigned Assessor</div>

        <div>Schedule</div>

        <div>Status</div>

        <div></div>

      </div>

      {/* Assessment List */}

      <div className="space-y-4 mt-4">

        {filteredAssessments.length > 0 ? (

          filteredAssessments.map((assessment) => (

            <div
              key={assessment.id}
              className="grid grid-cols-[2fr_1.2fr_1.4fr_0.8fr_1fr] gap-4 items-center rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
            >

              <div>

                <h3 className="font-semibold text-lg">

                  {assessment.title}

                </h3>

                <p className="text-gray-500">

                  {assessment.qualification}

                </p>

              </div>

              <div>{assessment.assessor}</div>

              <div>{assessment.schedule}</div>

              <div>

                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(
                    assessment.status
                  )}`}
                >
                  {assessment.status}
                </span>

              </div>

              <button
                onClick={() => handleViewAssessment(assessment)}
                className="rounded-xl bg-[#002f86] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-[#001f59] hover:shadow-lg active:scale-95"
              >
                View Assessment
              </button>

            </div>

          ))

        ) : (

          <div className="bg-white p-8 rounded-xl text-center text-gray-500">

            No assessments found.

          </div>

        )}

      </div>

    </div>
  );
}
