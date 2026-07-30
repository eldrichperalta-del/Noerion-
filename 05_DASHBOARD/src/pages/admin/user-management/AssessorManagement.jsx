import { useState } from "react";
import { useNavigate } from "react-router-dom";

import SearchBar from "../../../components/admin/shared/SearchBar";
import AssessorTable from "../../../components/admin/assessor-management/AssessorTable";
import AssessorStatusFilter from "../../../components/admin/assessor-management/AssessorStatusFilter";

/*
|--------------------------------------------------------------------------
| TEMPORARY MOCK DATA
|--------------------------------------------------------------------------
| Frontend Development Only
|
| This data is used to test:
| - assessor table display
| - search filtering
| - status filtering
| - verification filtering
| - table pagination
| - edit/deactivate/reactivate actions
|
| TODO (Backend):
| Replace with API response.
|
| Expected backend response format:
| {
|   id: 1,
|   fullName: "Emily Chen",
|   assessorId: "ASR-2023-001",
|   email: "emily.chen@example.com",
|   status: "Active",
|   verificationStatus: "Verified"
| }
|
| Example:
| GET /api/assessors
|--------------------------------------------------------------------------
*/
const initialAssessors = [
  {
    id: 1,
    fullName: "Emily Chen",
    assessorId: "ASR-2023-001",
    email: "emily.chen@example.com",
    status: "Active",
    verificationStatus: "Verified",
  },
  {
    id: 2,
    fullName: "Marcus Kim",
    assessorId: "ASR-2023-002",
    email: "marcus.kim@example.com",
    status: "Active",
    verificationStatus: "Not Verified",
  },
  {
    id: 3,
    fullName: "Sarah Jenkins",
    assessorId: "ASR-2023-003",
    email: "sarah.j@example.com",
    status: "Inactive",
    verificationStatus: "Verified",
  },
  {
    id: 4,
    fullName: "Daniel Park",
    assessorId: "ASR-2023-004",
    email: "daniel.park@example.com",
    status: "Inactive",
    verificationStatus: "Verified",
  },
  {
    id: 5,
    fullName: "Nina Santos",
    assessorId: "ASR-2023-005",
    email: "nina.santos@example.com",
    status: "Active",
    verificationStatus: "Verified",
  },
  {
    id: 6,
    fullName: "Leo Reyes",
    assessorId: "ASR-2023-006",
    email: "leo.reyes@example.com",
    status: "Inactive",
    verificationStatus: "Not Verified",
  },
];

function AssessorManagement() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  /*
  |--------------------------------------------------------------------------
  | ASSESSOR DATA
  |--------------------------------------------------------------------------
  | Currently uses mock data.
  |
  | TODO (Backend):
  | Replace initialAssessors with API response.
  |
  | Example:
  | const [assessors, setAssessors] = useState([]);
  |
  | useEffect(() => {
  |   fetch("/api/assessors")
  |     .then((res) => res.json())
  |     .then((data) => setAssessors(data));
  | }, []);
  |--------------------------------------------------------------------------
  */
  const [assessors, setAssessors] = useState(initialAssessors);

  const handleDeactivate = (id) => {
    setAssessors((prev) =>
      prev.map((assessor) =>
        assessor.id === id
          ? {
              ...assessor,
              status: "Inactive",
              verificationStatus: "Not Verified",
            }
          : assessor
      )
    );
  };

  const handleReactivate = (id) => {
    setAssessors((prev) =>
      prev.map((assessor) =>
        assessor.id === id
          ? {
              ...assessor,
              status: "Active",
              verificationStatus: "Verified",
            }
          : assessor
      )
    );
  };

  const handleReject = (id, rejectionReason) => {
    setAssessors((prev) => prev.map((assessor) => assessor.id === id ? { ...assessor, status: "Inactive", rejectionReason } : assessor));
  };

  const handleDelete = (id) => {
    setAssessors((prev) => prev.filter((assessor) => assessor.id !== id));
  };

  const handleUpdateAssessor = (updatedAssessor) => {
    setAssessors((prev) =>
      prev.map((assessor) =>
        assessor.id === updatedAssessor.id ? updatedAssessor : assessor
      )
    );
  };

  /*
  |--------------------------------------------------------------------------
  | FRONTEND FILTERING
  |--------------------------------------------------------------------------
  | Current: Filtering is done on the frontend.
  |
  | TODO (Backend - Optional):
  | If assessor data becomes large, filtering can be moved to API queries.
  |--------------------------------------------------------------------------
  */
  const filteredAssessors = assessors.filter((assessor) => {
    const searchValue = search.toLowerCase();

    const matchesSearch =
      assessor.fullName.toLowerCase().includes(searchValue) ||
      assessor.email.toLowerCase().includes(searchValue) ||
      assessor.assessorId.toLowerCase().includes(searchValue);

    const matchesStatus =
      statusFilter === "All" || assessor.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-0">
      {/* Page Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Assessors</h1>

          <p className="text-gray-600">
            Manage assessor accounts and access
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/admin/user-management/add-assessor")}
          className="whitespace-nowrap rounded-xl bg-blue-700 px-6 py-3 font-medium text-white hover:bg-blue-800"
        >
          + Add Assessor
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 rounded-2xl bg-white p-3 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-4 lg:flex-row">
          <SearchBar search={search} setSearch={setSearch} />

          <AssessorStatusFilter
            value={statusFilter}
            onChange={setStatusFilter}
          />

        </div>
      </div>

      {/* Assessor Data Table */}
      <div className="rounded-2xl bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
        <AssessorTable
          assessors={filteredAssessors}
          onDeactivate={handleDeactivate}
          onReactivate={handleReactivate}
          onDelete={handleDelete}
          onUpdate={handleUpdateAssessor}
          onReject={handleReject}
        />
      </div>
    </div>
  );
}

export default AssessorManagement;
