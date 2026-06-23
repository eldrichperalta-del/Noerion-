import { Search } from "lucide-react";

export default function ResultsFilters({
  searchTerm,
  setSearchTerm,
  resultFilter,
  setResultFilter,
  courseFilter,
  setCourseFilter,
  day,
  setDay,
  month,
  setMonth,
  year,
  setYear,
  onApply,
  onClear,
  courses,
}) {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 25 }, (_, i) => currentYear - i);

  return (
    <div className="mb-5">

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

        {/* LEFT CONTAINER */}
        <div className="flex flex-1 flex-wrap items-center gap-3 rounded-2xl bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">

          {/* SEARCH */}
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search by Name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4"
            />
          </div>

          {/* RESULT FILTER */}
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="rounded-xl border border-gray-300 px-4 py-3"
          >
            <option value="">All Results</option>
            <option value="Pass">Competent</option>
            <option value="Fail">Not Competent</option>
          </select>

          {/* COURSE FILTER */}
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="rounded-xl border border-gray-300 px-4 py-3"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* RIGHT CONTAINER */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-5 lg:justify-end shadow-[0_4px_12px_rgba(0,0,0,0.35)]">

          {/* DAY */}
          <select
            value={day}
            onChange={(e) =>
              setDay(e.target.value ? Number(e.target.value) : "")
            }
            className="rounded-xl border border-gray-300 px-4 py-3"
          >
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* MONTH */}
          <select
            value={month}
            onChange={(e) =>
              setMonth(e.target.value ? Number(e.target.value) : "")
            }
            className="rounded-xl border border-gray-300 px-4 py-3"
          >
            <option value="">Month</option>
            {months.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>

          {/* YEAR */}
          <select
            value={year}
            onChange={(e) =>
              setYear(e.target.value ? Number(e.target.value) : "")
            }
            className="rounded-xl border border-gray-300 px-4 py-3"
          >
            <option value="">Year</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* APPLY */}
          <button
            onClick={onApply}
            className="rounded-xl bg-blue-600 px-5 py-3 text-white font-medium hover:bg-blue-700"
          >
            Apply
          </button>

          {/* CLEAR */}
          <button
            onClick={onClear}
            className="rounded-xl bg-gray-200 px-5 py-3 text-gray-700 font-medium hover:bg-gray-300"
          >
            Clear
          </button>
        </div>

      </div>
    </div>
  );
}