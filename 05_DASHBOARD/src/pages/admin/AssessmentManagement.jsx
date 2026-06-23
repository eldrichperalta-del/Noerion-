import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

const initialAssessments = [
  {
    id: 1,
    assessmentId: "ASM-2023-001",
    course: "Computer Systems Servicing NC II",
    numberOfTrainees: 25,
    assignedAssessor: "Emily Chen",
    schedule: "2026-06-14",
    status: "Scheduled",
  },
  {
    id: 2,
    assessmentId: "ASM-2023-002",
    course: "Bread and Pastry Production NC II",
    numberOfTrainees: 30,
    assignedAssessor: "Marcus Kim",
    schedule: "2026-11-14",
    status: "Ongoing",
  },
  {
    id: 3,
    assessmentId: "ASM-2023-003",
    course: "Cookery NC II",
    numberOfTrainees: 18,
    assignedAssessor: "Sarah Jenkins",
    schedule: "-",
    status: "Completed",
  },
  {
    id: 4,
    assessmentId: "ASM-2023-004",
    course: "Electrical Installation and Maintenance NC II",
    numberOfTrainees: 22,
    assignedAssessor: "Emily Chen",
    schedule: "2026-11-13",
    status: "Ongoing",
  },
  {
    id: 5,
    assessmentId: "ASM-2023-005",
    course: "Automotive Servicing NC II",
    numberOfTrainees: 2,
    assignedAssessor: "Marcus Kim",
    schedule: "2026-11-13",
    status: "Ongoing",
  },
  {
    id: 6,
    assessmentId: "ASM-2023-006",
    course: "Bookkeeping NC III",
    numberOfTrainees: 18,
    assignedAssessor: "Sarah Jenkins",
    schedule: "2026-11-13",
    status: "Completed",
  },
];

function AssessmentManagement() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const rowsPerPage = 5;

  const normalizeText = (value) => {
    return String(value ?? "").toLowerCase().trim();
  };

  const getAssessorName = (assessment) => {
    return (
      assessment.assignedAssessor ||
      assessment.assessorName ||
      assessment.assignedAssessorName ||
      assessment.assigned_assessor ||
      assessment.assessor?.name ||
      assessment.assessor ||
      "-"
    );
  };

  const isPastSchedule = (schedule) => {
    if (!schedule || schedule === "-") {
      return false;
    }

    const today = new Date();
    const scheduleDate = new Date(schedule);

    today.setHours(0, 0, 0, 0);
    scheduleDate.setHours(0, 0, 0, 0);

    return scheduleDate < today;
  };

  const getComputedStatus = (assessment) => {
    if (normalizeText(assessment.status) === "completed") {
      return "Completed";
    }

    if (isPastSchedule(assessment.schedule)) {
      return "Completed";
    }

    return assessment.status;
  };

  const getScheduleDisplay = (assessment) => {
    const computedStatus = getComputedStatus(assessment);

    if (normalizeText(computedStatus) === "completed") {
      return "Done";
    }

    return assessment.schedule && assessment.schedule !== "-"
      ? assessment.schedule
      : "Not scheduled";
  };

  const filteredAssessments = initialAssessments.filter((assessment) => {
    const searchValue = normalizeText(search);

    return (
      normalizeText(assessment.assessmentId).includes(searchValue) ||
      normalizeText(assessment.course).includes(searchValue) ||
      normalizeText(getAssessorName(assessment)).includes(searchValue) ||
      normalizeText(getScheduleDisplay(assessment)).includes(searchValue) ||
      normalizeText(getComputedStatus(assessment)).includes(searchValue) ||
      normalizeText(assessment.numberOfTrainees).includes(searchValue)
    );
  });

  const totalPages = Math.max(
    Math.ceil(filteredAssessments.length / rowsPerPage),
    1
  );

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;

  const paginatedAssessments = filteredAssessments.slice(startIndex, endIndex);

  const showingStart = filteredAssessments.length === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(endIndex, filteredAssessments.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const getStatusClass = (status) => {
    const normalizedStatus = normalizeText(status);

    if (normalizedStatus === "scheduled") {
      return "bg-yellow-100 text-yellow-700";
    }

    if (normalizedStatus === "ongoing") {
      return "bg-blue-100 text-blue-700";
    }

    if (normalizedStatus === "completed") {
      return "bg-green-100 text-green-700";
    }

    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="p-0">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-900">
          Assessment Management
        </h1>

        <p className="text-gray-600">
          Create and manage assessment assignments
        </p>
      </div>

      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="w-full max-w-[600px] rounded-2xl bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
          <div className="relative w-full">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by ID, Course, Assessor, Schedule, or Status"
              className="w-full rounded-xl border border-gray-400 py-3 pl-12 pr-4 shadow-[0_4px_12px_rgba(0,0,0,0.15)] focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/admin/assessments/create")}
          className="whitespace-nowrap rounded-xl bg-blue-700 px-6 py-3 font-medium text-white hover:bg-blue-800"
        >
          + Create New Assessment
        </button>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
        <div className="overflow-hidden rounded-xl border-2 border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.20)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-4 text-left font-bold">
                    Assessment ID
                  </th>
                  <th className="px-4 py-4 text-left font-bold">Course</th>
                  <th className="px-4 py-4 text-left font-bold">
                    Number of Trainees
                  </th>
                  <th className="px-4 py-4 text-left font-bold">
                    Assigned Assessor
                  </th>
                  <th className="px-4 py-4 text-left font-bold">Schedule</th>
                  <th className="px-4 py-4 text-left font-bold">Status</th>
                </tr>
              </thead>

              <tbody>
                {paginatedAssessments.length > 0 ? (
                  paginatedAssessments.map((assessment) => {
                    const scheduleDisplay = getScheduleDisplay(assessment);
                    const computedStatus = getComputedStatus(assessment);

                    return (
                      <tr
                        key={assessment.id}
                        className="border-b border-gray-300 hover:bg-gray-100"
                      >
                        <td className="px-4 py-3">
                          {assessment.assessmentId}
                        </td>

                        <td className="px-4 py-3">{assessment.course}</td>

                        <td className="px-4 py-3">
                          {assessment.numberOfTrainees}
                        </td>

                        <td className="px-4 py-3">
                          {getAssessorName(assessment)}
                        </td>

                        <td className="px-4 py-3">
                          {scheduleDisplay === "Done" ? (
                            <span className="rounded-full bg-green-100 px-4 py-1 font-medium text-green-700">
                              Done
                            </span>
                          ) : (
                            scheduleDisplay
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-4 py-1 font-medium ${getStatusClass(
                              computedStatus
                            )}`}
                          >
                            {computedStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-500">
                      No assessments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-4 text-sm">
              <p className="font-medium text-gray-700">
                Showing {showingStart}-{showingEnd} of{" "}
                {filteredAssessments.length} assessments
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.max(page - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 text-gray-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Prev
                </button>

                <span className="rounded-lg border border-gray-200 px-3 py-2 font-medium text-gray-700 shadow-sm">
                  {currentPage}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(page + 1, totalPages))
                  }
                  disabled={currentPage >= totalPages}
                  className="flex items-center gap-1 text-gray-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssessmentManagement;