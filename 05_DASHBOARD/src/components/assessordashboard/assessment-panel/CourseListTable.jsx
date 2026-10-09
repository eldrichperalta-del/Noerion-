import { Search, ChevronDown } from "lucide-react";

function StatusBadge({ status }) {
  const styles = {
    Pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    Ongoing: "bg-blue-50 text-blue-700 border-blue-200",
    Completed: "bg-green-50 text-green-700 border-green-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${styles[status] || "bg-gray-50 text-gray-600 border-gray-200"
        }`}
    >
      {status}
    </span>
  );
}

function AssessmentTable({ assessments, onViewTrainees, emptyMessage }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="hidden grid-cols-12 items-center bg-gray-100 px-6 py-3 text-xs font-bold uppercase tracking-wide text-gray-600 md:grid">
        <div className="col-span-4">Assessment</div>
        <div className="col-span-2">Date</div>
        <div className="col-span-2">Time</div>
        <div className="col-span-1">Trainees</div>
        <div className="col-span-1">Status</div>
        <div className="col-span-2 text-right">Action</div>
      </div>

      <div className="divide-y divide-gray-100">
        {assessments.map((assessment) => (
          <div
            key={assessment.id}
            className="grid grid-cols-1 gap-4 px-6 py-5 transition-colors hover:bg-gray-50 md:grid-cols-12 md:items-center md:gap-0"
          >
            <div className="md:col-span-4">
              <p className="font-semibold leading-snug text-gray-900">
                {assessment.name}
              </p>
              {assessment.code && (
                <p className="mt-1 text-sm text-gray-500">#{assessment.code}</p>
              )}
              {assessment.traineeLabel && (
                <p className="mt-1 text-xs font-medium text-gray-500">
                  {assessment.traineeLabel}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-900">
                {assessment.date || "N/A"}
              </p>
            </div>

            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-900">
                {assessment.time || "N/A"}
              </p>
            </div>

            <div className="md:col-span-1">
              <p className="text-sm font-semibold text-gray-900">
                {assessment.trainees ?? 0}
              </p>
            </div>

            <div className="md:col-span-1">
              <StatusBadge status={assessment.status} />
            </div>

            <div className="flex md:col-span-2 md:justify-end">
              <button
                type="button"
                onClick={() => onViewTrainees(assessment)}
                className="rounded-xl bg-[#002f86] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#001f59] hover:shadow-md active:scale-95"
              >
                View Trainees
              </button>
            </div>
          </div>
        ))}

        {assessments.length === 0 && (
          <div className="py-10 text-center text-sm text-gray-500">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}

function AssessmentSection({ title, assessments, onViewTrainees }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
          {assessments.length}{" "}
          {assessments.length === 1 ? "Assessment" : "Assessments"}
        </span>
      </div>

      <AssessmentTable
        assessments={assessments}
        onViewTrainees={onViewTrainees}
        emptyMessage={`No ${title.toLowerCase()} found.`}
      />
    </section>
  );
}

export default function CourseListTable({
  assessments,
  searchTerm,
  statusFilter,
  onSearchChange,
  onStatusChange,
  onViewTrainees,
}) {
  return (
    <div className="-mt-2 space-y-8">
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
            placeholder="Search assessments"
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-black placeholder:text-gray-400 caret-black outline-none shadow-sm transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="relative w-full lg:w-64">
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-gray-700 shadow-sm outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"
          >
            <option value="All">All Statuses</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
          </select>
          <ChevronDown
            size={18}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>
      </div>

      {(statusFilter === "All" || statusFilter === "Upcoming") && (
        <AssessmentSection
          title="Upcoming Assessments"
          assessments={assessments.upcoming}
          onViewTrainees={onViewTrainees}
        />
      )}

      {(statusFilter === "All" || statusFilter === "Ongoing") && (
        <AssessmentSection
          title="Ongoing Assessments"
          assessments={assessments.ongoing}
          onViewTrainees={onViewTrainees}
        />
      )}

      {(statusFilter === "All" || statusFilter === "Completed") && (
        <AssessmentSection
          title="Completed Assessments"
          assessments={assessments.completed}
          onViewTrainees={onViewTrainees}
        />
      )}
    </div>
  );
}
