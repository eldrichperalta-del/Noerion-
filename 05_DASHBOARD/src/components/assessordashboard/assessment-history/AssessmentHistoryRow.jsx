import AssessorStatusBadge from "../shared/AssessorStatusBadge";

// ============================================================================
// BACKEND HANDOFF
// Receives a single completed assessment record.
// Result and status values should come directly from the backend.
// ============================================================================

export default function AssessmentHistoryRow({ record }) {
    return (
        <tr className="border-b border-gray-100 transition hover:bg-gray-50">
            {/* Trainee */}
            <td className="px-6 py-4">
                <div className="font-medium text-gray-900">
                    {record.traineeName}
                </div>

                <div className="mt-1 text-xs text-gray-500">
                    {record.aiAvailable
                        ? "AI Analysis Available"
                        : "AI Analysis Unavailable"}
                </div>
            </td>

            {/* Trainee ID */}
            <td className="px-6 py-4 text-sm text-gray-700">
                {record.traineeId}
            </td>

            {/* Course */}
            <td className="px-6 py-4 text-sm text-gray-700">
                {record.course}
            </td>

            {/* Written Score */}
            <td className="px-6 py-4">
                <span className="font-semibold text-blue-700">
                    {record.writtenScore}%
                </span>
            </td>

            {/* Final Result */}
            <td className="px-6 py-4">
                <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${record.finalResult === "Competent"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                >
                    {record.finalResult}
                </span>
            </td>

            {/* Date Completed */}
            <td className="px-6 py-4 text-sm text-gray-700">
                {record.completedDate}
            </td>

            {/* Status */}
            <td className="px-6 py-4">
                <AssessorStatusBadge
                    status={record.status}
                />
            </td>
        </tr>
    );
}