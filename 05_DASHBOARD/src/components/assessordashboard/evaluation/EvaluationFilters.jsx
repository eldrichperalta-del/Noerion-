import { Search } from "lucide-react";

// ============================================================================
// EvaluationFilters Component
// ----------------------------------------------------------------------------
// Displays the search bar and progress filter for assigned courses.
//
// Props:
// - searchTerm
// - setSearchTerm
// - progressFilter
// - setProgressFilter
//
// BACKEND HANDOFF:
//
// For small datasets, searching and filtering can be handled on the frontend.
//
// For production with large datasets, pass these values as query parameters
// when requesting assigned courses from Supabase/API.
//
// Example:
//
// searchTerm = "Electronics"
// progressFilter = "Completed"
//
// ============================================================================

export default function EvaluationFilters({
  searchTerm,
  setSearchTerm,
  progressFilter,
  setProgressFilter,
}) {
  return (
    <div className="-mt-1 space-y-4">
      {/* Search & Filter */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative w-full lg:max-w-md">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Courses (optional)..."
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-black placeholder:text-gray-400 caret-black outline-none shadow-sm transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Progress Filter */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">
            Filter by Progress:
          </span>

          <select
            value={progressFilter}
            onChange={(e) =>
              setProgressFilter(e.target.value)
            }
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-black outline-none shadow-sm transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"
          >
            <option value="All">All Progress</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>
    </div>
  );
}