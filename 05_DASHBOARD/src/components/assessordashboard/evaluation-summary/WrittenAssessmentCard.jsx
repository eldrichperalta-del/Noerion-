export default function WrittenAssessmentCard({
  writtenAssessment = {},
}) {
  const {
    score = 0,
    total = 0,
    percentage = 0,
    status = "Unknown",
  } = writtenAssessment;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

      <div className="flex items-start justify-between">

        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Written Assessment
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Summary of the trainee's written assessment performance.
          </p>
        </div>

        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          {status}
        </span>

      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

        {/* Score */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">

          <p className="text-sm text-gray-500">
            Score
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {score} / {total}
          </p>

        </div>

        {/* Percentage */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">

          <p className="text-sm text-gray-500">
            Percentage
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {percentage}%
          </p>

        </div>

        {/* Status */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">

          <p className="text-sm text-gray-500">
            Assessment Status
          </p>

          <p className="mt-2 text-sm font-semibold text-gray-900">
            {status}
          </p>

        </div>

      </div>

    </div>
  );
}