import { Search } from "lucide-react";

// ============================================================================
// BACKEND HANDOFF
// ----------------------------------------------------------------------------
// This component is presentation-only.
//
// Filtering logic is handled inside AssessmentHistory.jsx.
//
// Replace the single date input with a date range picker component if one is
// introduced later.
//
// Expected props:
//
// search
// onSearchChange
//
// course
// onCourseChange
//
// result
// onResultChange
//
// dateRange
// onDateRangeChange
// ============================================================================

const courses = [
    "All Courses",
    "Automotive Servicing NC II",
    "Computer Systems Servicing NC II",
    "Electrical Installation and Maintenance NC II",
];

const results = [
    "All Results",
    "Competent",
    "Not Yet Competent",
];

export default function AssessmentHistoryFilters({
    search,
    onSearchChange,
    course,
    onCourseChange,
    result,
    onResultChange,
    dateRange,
    onDateRangeChange,
}) {
    const inputClass =
        "w-full rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 shadow-[0_4px_12px_rgba(0,0,0,0.18)] outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">

            {/* =======================================================================
          SEARCH
      ======================================================================== */}

            <div className="relative">
                <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                    type="text"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search by Trainee name or ID..."
                    className={`${inputClass} pl-11`}
                />
            </div>

            {/* =======================================================================
          COURSE FILTER
      ======================================================================== */}

            <select
                value={course}
                onChange={(e) => onCourseChange(e.target.value)}
                className={inputClass}
            >
                {courses.map((item) => (
                    <option
                        key={item}
                        value={item}
                    >
                        {item}
                    </option>
                ))}
            </select>

            {/* =======================================================================
          DATE FILTER
      ======================================================================== */}

            <input
                type="date"
                value={dateRange}
                onChange={(e) => onDateRangeChange(e.target.value)}
                className={inputClass}
            />

            {/* =======================================================================
          RESULT FILTER
      ======================================================================== */}

            <select
                value={result}
                onChange={(e) => onResultChange(e.target.value)}
                className={inputClass}
            >
                {results.map((item) => (
                    <option
                        key={item}
                        value={item}
                    >
                        {item}
                    </option>
                ))}
            </select>
        </div>
    );
}