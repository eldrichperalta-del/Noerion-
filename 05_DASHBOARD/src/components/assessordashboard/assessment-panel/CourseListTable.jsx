import { Calendar, Search } from "lucide-react";

export default function CourseListTable({
  courses,
  searchTerm,
  selectedDate,
  onSearchChange,
  onDateChange,
  onViewTrainees,
}) {
  return (
    <div className="-mt-4 space-y-4">


      {/* Search & Date */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Courses"
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-black placeholder:text-gray-400 caret-black outline-none shadow-sm transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="relative w-full lg:w-64">
          <Calendar
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-black caret-black outline-none shadow-sm transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Header */}
      <div className="grid grid-cols-12 items-center rounded-xl bg-gray-200 px-6 py-3 text-xs font-bold uppercase tracking-wide text-gray-600">
        <div className="col-span-5">
          Course Name / ID
        </div>

        <div className="col-span-2">
          Trainees
        </div>

        <div className="col-span-3">
          Schedule Overview
        </div>

      </div>

      {/* Cards */}
      <div className="space-y-4">
        {courses.map((course) => (
          <div
            key={course.id}
            className="grid grid-cols-12 items-center rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          >
            {/* Course */}
            <div className="col-span-5">
              <h3 className="text-base font-semibold text-gray-900 leading-snug">
                {course.name}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                #{course.code}
              </p>
            </div>

            {/* Trainees */}
            <div className="col-span-2">
              <p className="font-semibold text-gray-900">
                {course.activeTrainees}
              </p>

              <p className="text-sm text-green-600">
                Active
              </p>
            </div>

            {/* Schedule */}
            <div className="col-span-3">
              <p className="font-medium text-gray-900">
                {course.schedule}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Starting {course.startDate}
              </p>
            </div>

            {/* Button */}
            <div className="col-span-2 flex justify-end">
              <button
                onClick={() => onViewTrainees(course)}
                className="rounded-xl bg-[#002f86] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-[#001f59] hover:shadow-lg active:scale-95"
              >
                View Trainees
              </button>
            </div>
          </div>
        ))}

        {courses.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-12 text-center text-gray-500 shadow-sm">
            No courses found.
          </div>
        )}
      </div>
    </div>
  );
}