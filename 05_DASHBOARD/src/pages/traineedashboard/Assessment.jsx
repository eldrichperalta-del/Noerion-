import { Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Assessment() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const assessments = [
    {
      id: 1,
      title: "Advanced Robotics Assembly",
      qualification: "TESDA NC III Electronics",
      assessor: "Engr. J. Dela Cruz",
      schedule: "April 14, 2025 - 09:00 AM",
      status: "Pending",
    },
    {
      id: 2,
      title: "Web Application Development",
      qualification: "TESDA NC IV IT",
      assessor: "Ms. A. Santos",
      schedule: "April 16, 2025 - 01:00 PM",
      status: "Ongoing",
    },
    {
      id: 3,
      title: "Culinary Arts Technique",
      qualification: "TESDA NC II Cookery",
      assessor: "Chef R. Garcia",
      schedule: "Completed - April 10, 2025",
      status: "Completed",
    },
    {
      id: 4,
      title: "Industrial Electronics",
      qualification: "TESDA NC III Electronics",
      assessor: "Mr. L. Hernandez",
      schedule: "April 17, 2025 - 02:00 PM",
      status: "Pending",
    },
  ];

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

    return matchesSearch && matchesStatus;
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

      {/* Search + Filter */}
      <div className="flex items-center justify-between w-full mb-5">

        {/* Search */}
        <div className="w-[450px] bg-white border border-gray-200 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.30)] p-4">

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
                w-full
                pl-10
                pr-4
                py-3
                border
                border-gray-300
                rounded-xl
                focus:outline-none
                focus:ring-2
                focus:ring-blue-500
              "
            />

          </div>

        </div>

        {/* Status Filter */}

        <div className="bg-white border border-gray-200 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.35)] p-4">

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="
              min-w-[200px]
              px-4
              py-3
              border
              border-gray-300
              rounded-xl
              bg-white
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
            "
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
          </select>

        </div>

      </div>

      {/* Header */}

      <div className="grid grid-cols-[2fr_1.2fr_1.4fr_0.8fr_1fr] gap-4 px-6 py-3 bg-white rounded-t-xl shadow-[0_4px_12px_rgba(0,0,0,0.30)] font-semibold text-gray-700">

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
              className="grid grid-cols-[2fr_1.2fr_1.4fr_0.8fr_1fr] gap-4 items-center bg-white p-6 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.30)] hover:shadow-md transition"
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
                className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-lg transition"
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