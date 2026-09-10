import { Search } from "lucide-react";

export default function AssessmentHistoryFilters({
    filters,
    onFiltersChange,
    courses = [],
    coursesLoading = false,
}) {
    const inputClass =
        "w-full rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 shadow-[0_4px_12px_rgba(0,0,0,0.18)] outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

    /* ==========================================================================
       UPDATE FILTER
       ========================================================================== */

    const updateFilter = (key, value) => {
        onFiltersChange({
            ...filters,
            [key]: value,
        });
    };

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">

            {/* ======================================================================
          SEARCH
          ====================================================================== */}

            <div className="relative">
                <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                    type="text"
                    value={filters.search}
                    onChange={(e) =>
                        updateFilter(
                            "search",
                            e.target.value
                        )
                    }
                    placeholder="Search by Trainee name or ID..."
                    className={`${inputClass} pl-11`}
                />
            </div>

            {/* ======================================================================
          COURSE FILTER
          ====================================================================== */}

            <select
                value={filters.course}
                onChange={(e) =>
                    updateFilter(
                        "course",
                        e.target.value
                    )
                }
                disabled={coursesLoading}
                className={`${inputClass} ${coursesLoading
                        ? "cursor-wait opacity-70"
                        : ""
                    }`}
            >
                <option value="all">
                    {coursesLoading
                        ? "Loading Courses..."
                        : "All Courses"}
                </option>

                {!coursesLoading &&
                    courses.map((course) => (
                        <option
                            key={course.id}
                            value={course.id}
                        >
                            {course.label}
                        </option>
                    ))}
            </select>

            {/* ======================================================================
          DATE FILTER
          ====================================================================== */}

            <input
                type="date"
                value={filters.date}
                onChange={(e) =>
                    updateFilter(
                        "date",
                        e.target.value
                    )
                }
                className={inputClass}
            />

            {/* ======================================================================
          RESULT FILTER
          ====================================================================== */}

            <select
                value={filters.result}
                onChange={(e) =>
                    updateFilter(
                        "result",
                        e.target.value
                    )
                }
                className={inputClass}
            >
                <option value="All Results">
                    All Results
                </option>

                <option value="Competent">
                    Competent
                </option>

                <option value="Not Yet Competent">
                    Not Yet Competent
                </option>

                <option value="In Evaluation">
                    In Evaluation
                </option>
            </select>
        </div>
    );
}