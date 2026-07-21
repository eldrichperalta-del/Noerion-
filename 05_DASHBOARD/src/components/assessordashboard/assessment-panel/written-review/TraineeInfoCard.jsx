import AssessorPanel from "../../shared/AssessorPanel";

export default function TraineeInfoCard({ trainee, assessment }) {
  return (
    // Replaced AssessorPanel with a custom div to match the Summary card's exact dimensions
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="space-y-3 text-[14px]">
        <div className="flex">
          <span className="w-24 font-bold text-gray-900">Name:</span>
          <span className="text-gray-700">{trainee?.fullName || "-"}</span>
        </div>

        <div className="flex">
          <span className="w-24 font-bold text-gray-900">Student ID:</span>
          <span className="text-gray-700">{trainee?.traineeId || "-"}</span>
        </div>

        <div className="flex items-start">
          <span className="w-24 shrink-0 font-bold text-gray-900">Course:</span>
          <span className="text-gray-700">{assessment?.courseName || "-"}</span>
        </div>
      </div>
    </div>
  );
}