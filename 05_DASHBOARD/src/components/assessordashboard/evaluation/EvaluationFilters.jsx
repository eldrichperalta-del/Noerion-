
import {
  Search,
  ChevronDown,
  X,
} from "lucide-react";

export default function EvaluationFilters({
  searchTerm,
  setSearchTerm,
  courses = [],
  selectedCourseId,
  setSelectedCourseId,
  loading = false,
}) {
  const handleClearSearch = () => {
    setSearchTerm("");
  };

  return (
    <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      {/* ================================================================
          SEARCH BAR
      ================================================================= */}

      <div className="relative w-full lg:max-w-xl">
        <Search
          size={19}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type="text"
          value={searchTerm}
          onChange={(event) =>
            setSearchTerm(event.target.value)
          }
          placeholder="Search courses or assessments..."
          disabled={loading}
          className="
            h-11
            w-full
            rounded-xl
            border
            border-gray-200
            bg-white
            pl-11
            pr-11
            text-sm
            text-gray-900
            shadow-sm
            outline-none
            transition
            placeholder:text-gray-400
            focus:border-gray-400
            focus:ring-2
            focus:ring-gray-100
            disabled:cursor-not-allowed
            disabled:bg-gray-50
          "
        />

        {searchTerm && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="
              absolute
              right-3
              top-1/2
              flex
              -translate-y-1/2
              items-center
              justify-center
              rounded-lg
              p-1.5
              text-gray-400
              transition
              hover:bg-gray-100
              hover:text-gray-700
            "
            aria-label="Clear search"
          >
            <X size={17} />
          </button>
        )}
      </div>

      {/* ================================================================
          COURSE FILTER
      ================================================================= */}

      <div className="relative w-full lg:w-80">
        <select
          value={selectedCourseId}
          onChange={(event) =>
            setSelectedCourseId(event.target.value)
          }
          disabled={loading}
          className="
            h-11
            w-full
            appearance-none
            rounded-xl
            border
            border-gray-200
            bg-white
            px-4
            pr-10
            text-sm
            font-medium
            text-gray-700
            shadow-sm
            outline-none
            transition
            focus:border-gray-400
            focus:ring-2
            focus:ring-gray-100
            disabled:cursor-not-allowed
            disabled:bg-gray-50
          "
        >
          <option value="all">
            All Courses
          </option>

          {courses.map((course) => (
            <option
              key={course.id}
              value={course.id}
            >
              {course.title}
              {course.qualification_level
                ? ` (${course.qualification_level})`
                : course.qualificationLevel
                  ? ` (${course.qualificationLevel})`
                  : ""}
            </option>
          ))}
        </select>

        <ChevronDown
          size={18}
          className="
            pointer-events-none
            absolute
            right-3
            top-1/2
            -translate-y-1/2
            text-gray-400
          "
        />
      </div>
    </div>
  );
}

