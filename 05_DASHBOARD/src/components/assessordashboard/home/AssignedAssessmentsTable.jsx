
import AssessorPanel from "../shared/AssessorPanel";
import AssessorStatusBadge from "../shared/AssessorStatusBadge";

export default function AssignedAssessmentsTable({
  assessments,
  onViewDetails,
  onEvaluate,
}) {
  return (
    <AssessorPanel title="Assigned Assessments">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-gray-200 text-xs uppercase text-gray-700">
            <tr>
              <th className="px-4 py-3">Trainee Name</th>
              <th className="px-4 py-3">
                Qualification / Course
              </th>
              <th className="px-4 py-3">Schedule</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {assessments.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm text-gray-500"
                >
                  No assigned assessments found.
                </td>
              </tr>
            ) : (
              assessments.map((assessment) => (
                <tr
                  key={assessment.id}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {assessment.traineeName}
                  </td>

                  <td className="px-4 py-3 text-gray-700">
                    {assessment.course}
                  </td>

                  <td className="px-4 py-3 text-gray-700">
                    {assessment.schedule}
                  </td>

                  <td className="px-4 py-3">
                    <AssessorStatusBadge
                      status={assessment.status}
                    />
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onViewDetails(assessment)
                        }
                        className="rounded-md bg-[#002f86] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#00266b]"
                      >
                        View Details
                      </button>

                      {assessment.canEvaluate && (
                        <button
                          type="button"
                          onClick={() =>
                            onEvaluate(assessment)
                          }
                          className="rounded-md border border-[#002f86] px-3 py-1.5 text-xs font-semibold text-[#002f86] hover:bg-blue-50"
                        >
                          Evaluate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AssessorPanel>
  );
}

