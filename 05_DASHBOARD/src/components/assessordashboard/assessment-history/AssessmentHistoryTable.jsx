import AssessmentHistoryRow from "./AssessmentHistoryRow";
import EmptyHistoryState from "./EmptyHistoryState";

import AssessorPanel from "../shared/AssessorPanel";

// ============================================================================
// BACKEND HANDOFF
// Receives the filtered assessment history records from AssessmentHistory.jsx.
// Pagination, sorting, and server-side filtering can be added later if needed.
// ============================================================================

export default function AssessmentHistoryTable({ history }) {
  return (
    <AssessorPanel className="overflow-hidden p-0">
      {history.length === 0 ? (
        <EmptyHistoryState />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Trainee Name
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Trainee ID
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Course / Qualification
                </th>

                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Written Score
                </th>

                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Final Result
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Date Completed
                </th>

                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {history.map((record) => (
                <AssessmentHistoryRow
                  key={record.id}
                  record={record}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AssessorPanel>
  );
}