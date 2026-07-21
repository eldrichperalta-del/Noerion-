import { useState } from "react";
import { Search } from "lucide-react";

/*
====================================================
CREATE ASSESSMENT - STEP 1: SELECT TRAINEES
====================================================

Frontend Features:
- Search by Full Name
- Search by Trainee ID
- Search by Email
- Filter by Assessment Status
- Multi-select Trainees
- Select All Available Trainees
- Next Step Button Enable/Disable

Backend Integration:
1. Replace mock trainee data with Supabase query.
2. Store selected trainee IDs.
3. Pass selected trainees to Step 2 (Assign Assessor).
4. Replace frontend pagination with server-side pagination.
5. Replace status values with assessment session records.

====================================================
*/

const initialTrainees = [
  {
    id: "TRN-2023-001",
    fullName: "John Doe",
    email: "john.doe@example.com",
    assessmentStatus: "Available",
  },
  {
    id: "TRN-2023-002",
    fullName: "Jane Smith",
    email: "jane.smith@example.com",
    assessmentStatus: "Available",
  },
  {
    id: "TRN-2023-003",
    fullName: "Alice Brown",
    email: "alice.brown@example.com",
    assessmentStatus: "Available",
  },
  {
    id: "TRN-2023-004",
    fullName: "Bob Green",
    email: "bob.green@example.com",
    assessmentStatus: "Available",
  },
  {
    id: "TRN-2023-005",
    fullName: "Charlie White",
    email: "charlie.white@example.com",
    assessmentStatus: "In Another Session",
  },
];

function SelectTrainees({ assessmentData, setAssessmentData, onNext }) {
  /*
    Backend:
    Replace mock data with Supabase/API data.
  */
  const trainees = initialTrainees;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedTrainees, setSelectedTrainees] = useState([]);

  const filteredTrainees = trainees.filter((trainee) => {
    const searchValue = searchTerm.toLowerCase().trim();

    const matchesSearch =
      (trainee.name || "")
        .toLowerCase()
        .includes(searchValue) ||
      (trainee.id || "")
        .toLowerCase()
        .includes(searchValue) ||
      (trainee.email || "")
        .toLowerCase()
        .includes(searchValue);

    const matchesStatus =
      statusFilter === "All"
        ? true
        : trainee.assessmentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const toggleTraineeSelection = (traineeId) => {
    setSelectedTrainees((prev) =>
      prev.includes(traineeId)
        ? prev.filter((id) => id !== traineeId)
        : [...prev, traineeId]
    );
  };

  const handleSelectAll = () => {
    const availableTrainees = filteredTrainees
      .filter(
        (trainee) => trainee.assessmentStatus !== "In Another Session"
      )
      .map((trainee) => trainee.id);

    const allSelected = availableTrainees.every((id) =>
      selectedTrainees.includes(id)
    );

    if (allSelected) {
      setSelectedTrainees((prev) =>
        prev.filter((id) => !availableTrainees.includes(id))
      );
    } else {
      setSelectedTrainees((prev) => [
        ...new Set([...prev, ...availableTrainees]),
      ]);
    }
  };

  const handleNext = () => {
    const selectedTraineeObjects = trainees.filter((trainee) =>
      selectedTrainees.includes(trainee.id)
    );

    setAssessmentData((prev) => ({
      ...prev,
      trainees: selectedTraineeObjects,
    }));

    onNext();
  };

  const selectedCount = selectedTrainees.length;

  const allAvailableSelected =
    filteredTrainees.length > 0 &&
    filteredTrainees
      .filter((t) => t.assessmentStatus !== "In Another Session")
      .every((t) => selectedTrainees.includes(t.id));

  return (
    <div className="-mt-4 rounded-2xl bg-white px-5 py-2 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Choose trainees for this assessment session
        </h2>

        <button
          type="button"
          disabled={selectedCount === 0}
          onClick={handleNext}
          className={`rounded-lg px-6 py-3 font-semibold text-white transition ${selectedCount > 0
            ? "bg-[#001F5B] hover:bg-[#001746]"
            : "cursor-not-allowed bg-gray-300"
            }`}
        >
          Next Step
        </button>
      </div>

      {/* Search + Filter */}
      <div className="mb-2 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search trainee, ID or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-400 py-3 pl-12 pr-4 shadow-[0_4px_12px_rgba(0,0,0,0.15)] focus:border-blue-500 focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-gray-400 px-4 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.15)] focus:border-blue-500 focus:outline-none"
        >
          <option value="All">All</option>
          <option value="Available">Available</option>
          <option value="In Another Session">
            In Another Session
          </option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border-2 border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.20)]">
        <table className="w-full border-collapse">
          <thead className="bg-gray-200">
            <tr>
              <th className="w-14 px-4 py-4 text-left">
                <input
                  type="checkbox"
                  checked={allAvailableSelected}
                  onChange={handleSelectAll}
                  className="h-4 w-4 accent-[#001F5B]"
                />
              </th>

              <th className="px-4 py-4 text-left font-bold">
                Full Name
              </th>

              <th className="px-4 py-4 text-left font-bold">
                Trainee ID
              </th>

              <th className="px-4 py-4 text-left font-bold">
                Email
              </th>

              <th className="px-4 py-4 text-left font-bold">
                Assessment Status
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredTrainees.map((trainee) => {
              const disabled =
                trainee.assessmentStatus === "In Another Session";

              return (
                <tr
                  key={trainee.id}
                  className="border-b border-gray-300 hover:bg-gray-100"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      disabled={disabled}
                      checked={selectedTrainees.includes(
                        trainee.id
                      )}
                      onChange={() =>
                        toggleTraineeSelection(trainee.id)
                      }
                      className="h-4 w-4 accent-[#001F5B]"
                    />
                  </td>

                  <td className="px-4 py-3 font-medium text-gray-900">
                    {trainee.name}
                  </td>

                  <td className="px-4 py-3 text-gray-700">
                    {trainee.id}
                  </td>

                  <td className="px-4 py-3 text-gray-700">
                    {trainee.email}
                  </td>

                  <td className="px-4 py-3">
                    {trainee.assessmentStatus ===
                      "Available" ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                        Available
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                        In Another Session
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between px-2 py-2 text-sm">
        <p className="font-medium text-gray-700">
          Total selected: {selectedCount}
        </p>

        <div className="flex items-center gap-3">
          <p className="text-gray-600">
            Showing 1-{filteredTrainees.length} of {trainees.length} trainees
          </p>

          {/* Backend: Replace with real pagination */}
          <button
            type="button"
            className="rounded-md border border-gray-300 px-3 py-1"
          >
            ‹
          </button>

          <button
            type="button"
            className="rounded-md border border-gray-300 bg-gray-100 px-3 py-1 font-medium"
          >
            1
          </button>

          <button
            type="button"
            className="rounded-md border border-gray-300 px-3 py-1"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

export default SelectTrainees;